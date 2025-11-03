-- Migration: Ajouter les champs nécessaires pour la hiérarchie complète
-- Date: 2025-10-30

-- 1. Ajouter parent_archetype_id à la table archetypes
-- Permet la hiérarchie interne : crème (parent) → crème liquide (enfant)
ALTER TABLE archetypes
ADD COLUMN IF NOT EXISTS parent_archetype_id BIGINT REFERENCES archetypes(id) ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_archetypes_parent ON archetypes(parent_archetype_id);

-- Commentaire
COMMENT ON COLUMN archetypes.parent_archetype_id IS 'Parent archetype pour hiérarchie (ex: crème liquide → crème)';


-- 2. Ajouter cultivar_id et product_id à recipe_ingredients
-- Permet aux recettes de pointer vers cultivar ou product si nécessaire
ALTER TABLE recipe_ingredients
ADD COLUMN IF NOT EXISTS cultivar_id BIGINT REFERENCES cultivars(id) ON DELETE RESTRICT;

ALTER TABLE recipe_ingredients
ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id) ON DELETE RESTRICT;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_cultivar ON recipe_ingredients(cultivar_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_product ON recipe_ingredients(product_id);

-- Commentaires
COMMENT ON COLUMN recipe_ingredients.cultivar_id IS 'Lien vers cultivar (rare, variété spécifique nécessaire)';
COMMENT ON COLUMN recipe_ingredients.product_id IS 'Lien vers produit commercial (très rare, marque spécifique)';


-- 3. Contrainte : un seul niveau doit être renseigné dans recipe_ingredients
-- Une recette pointe vers canonical OU cultivar OU archetype OU product, pas plusieurs
ALTER TABLE recipe_ingredients
DROP CONSTRAINT IF EXISTS recipe_ingredients_single_source;

ALTER TABLE recipe_ingredients
ADD CONSTRAINT recipe_ingredients_single_source CHECK (
  (
    (canonical_food_id IS NOT NULL)::int +
    (cultivar_id IS NOT NULL)::int +
    (archetype_id IS NOT NULL)::int +
    (product_id IS NOT NULL)::int
  ) = 1
);

COMMENT ON CONSTRAINT recipe_ingredients_single_source ON recipe_ingredients IS
  'Une recette doit pointer vers exactement UN niveau: canonical, cultivar, archetype ou product';


-- 4. Contrainte : archetype doit avoir canonical_food_id OU cultivar_id, pas les deux
-- Un archetype vient soit d'un canonical, soit d'un cultivar
ALTER TABLE archetypes
DROP CONSTRAINT IF EXISTS archetypes_source;

ALTER TABLE archetypes
ADD CONSTRAINT archetypes_source CHECK (
  (canonical_food_id IS NOT NULL AND cultivar_id IS NULL) OR
  (canonical_food_id IS NULL AND cultivar_id IS NOT NULL) OR
  (canonical_food_id IS NULL AND cultivar_id IS NULL)
);

COMMENT ON CONSTRAINT archetypes_source ON archetypes IS
  'Un archetype provient soit d''un canonical, soit d''un cultivar, soit de rien (standalone)';


-- 5. Vue pour faciliter les requêtes : ingrédients avec toute la hiérarchie
CREATE OR REPLACE VIEW v_ingredients_hierarchy AS
SELECT
  a.id as archetype_id,
  a.name as archetype_name,
  a.parent_archetype_id,
  pa.name as parent_archetype_name,
  a.canonical_food_id,
  cf.canonical_name,
  a.cultivar_id,
  cv.cultivar_name,
  a.process,
  a.primary_unit
FROM archetypes a
LEFT JOIN archetypes pa ON a.parent_archetype_id = pa.id
LEFT JOIN canonical_foods cf ON a.canonical_food_id = cf.id
LEFT JOIN cultivars cv ON a.cultivar_id = cv.id;

COMMENT ON VIEW v_ingredients_hierarchy IS
  'Vue facilitant la visualisation de la hiérarchie complète des ingrédients';


-- 6. Fonction pour récupérer tous les archetypes enfants (récursif)
CREATE OR REPLACE FUNCTION get_archetype_children(parent_id BIGINT)
RETURNS TABLE(archetype_id BIGINT, archetype_name TEXT, level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE archetype_tree AS (
    -- Base: le parent
    SELECT id, name, 0 as level
    FROM archetypes
    WHERE id = parent_id

    UNION ALL

    -- Récursif: les enfants
    SELECT a.id, a.name, at.level + 1
    FROM archetypes a
    JOIN archetype_tree at ON a.parent_archetype_id = at.id
  )
  SELECT id, name, level FROM archetype_tree WHERE level > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_archetype_children IS
  'Récupère tous les archetypes enfants d''un parent donné (récursif)';


-- 7. Fonction pour trouver toutes les recettes matchant un ingrédient
CREATE OR REPLACE FUNCTION find_recipes_with_ingredient(
  ingredient_canonical_id BIGINT DEFAULT NULL,
  ingredient_cultivar_id BIGINT DEFAULT NULL,
  ingredient_archetype_id BIGINT DEFAULT NULL,
  ingredient_product_id BIGINT DEFAULT NULL
)
RETURNS TABLE(recipe_id BIGINT, recipe_name TEXT, ingredient_name TEXT) AS $$
BEGIN
  RETURN QUERY
  WITH matching_ingredients AS (
    -- Si on cherche par archetype, trouver aussi le parent
    SELECT DISTINCT ri.recipe_id, ri.archetype_id
    FROM recipe_ingredients ri
    WHERE
      -- Match direct
      (ingredient_canonical_id IS NOT NULL AND ri.canonical_food_id = ingredient_canonical_id) OR
      (ingredient_cultivar_id IS NOT NULL AND ri.cultivar_id = ingredient_cultivar_id) OR
      (ingredient_archetype_id IS NOT NULL AND (
        ri.archetype_id = ingredient_archetype_id OR
        -- Match sur le parent
        ri.archetype_id = (SELECT parent_archetype_id FROM archetypes WHERE id = ingredient_archetype_id)
      )) OR
      (ingredient_product_id IS NOT NULL AND ri.product_id = ingredient_product_id)
  )
  SELECT DISTINCT
    r.id,
    r.title,
    COALESCE(a.name, cf.canonical_name, cv.cultivar_name, p.product_name) as ingredient_name
  FROM matching_ingredients mi
  JOIN recipes r ON r.id = mi.recipe_id
  JOIN recipe_ingredients ri ON ri.recipe_id = r.id
  LEFT JOIN archetypes a ON ri.archetype_id = a.id
  LEFT JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
  LEFT JOIN cultivars cv ON ri.cultivar_id = cv.id
  LEFT JOIN products p ON ri.product_id = p.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_recipes_with_ingredient IS
  'Trouve toutes les recettes matchant un ingrédient donné (avec logique de flexibilité parent/enfant)';


-- Afficher un résumé
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée !';
  RAISE NOTICE '';
  RAISE NOTICE 'Ajouts:';
  RAISE NOTICE '  - archetypes.parent_archetype_id (hiérarchie interne)';
  RAISE NOTICE '  - recipe_ingredients.cultivar_id';
  RAISE NOTICE '  - recipe_ingredients.product_id';
  RAISE NOTICE '  - Contraintes de cohérence';
  RAISE NOTICE '  - Vue v_ingredients_hierarchy';
  RAISE NOTICE '  - Fonctions get_archetype_children() et find_recipes_with_ingredient()';
END $$;
