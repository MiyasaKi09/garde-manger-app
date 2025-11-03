-- Migration 002: Créer les archetypes PARENT manquants
-- Date: 2025-10-30
-- Description: Crée les archetypes parent génériques pour permettre la flexibilité dans les recettes

-- Récupérer les IDs des canonical_foods nécessaires
DO $$
DECLARE
  lait_id BIGINT;
BEGIN
  SELECT id INTO lait_id FROM canonical_foods WHERE canonical_name = 'lait';

  -- 1. CRÉER LES PARENTS MANQUANTS (lait, crème, fromage)

  -- Lait (parent)
  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
  VALUES ('lait', lait_id, 'lait', 'ml', NULL);

  -- Crème (parent)
  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
  VALUES ('crème', lait_id, 'crème', 'ml', NULL);

  -- Fromage (parent)
  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
  VALUES ('fromage', lait_id, 'fromage', 'g', NULL);

  RAISE NOTICE 'Archetypes parent créés: lait, crème, fromage';
END $$;

-- Note: yaourt, beurre, jambon, farine, pain existent déjà et sont utilisés dans les recettes
-- Ils serviront de parents tels quels (parent_archetype_id reste NULL)

-- Vérification
SELECT
  id,
  name,
  canonical_food_id,
  parent_archetype_id
FROM archetypes
WHERE name IN ('lait', 'crème', 'fromage', 'yaourt', 'beurre', 'jambon', 'farine', 'pain')
ORDER BY name;
