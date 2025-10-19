-- Enrichissement Manuel des Recettes Célèbres Françaises
-- Correction des tags incorrects + ajout de tags manquants

BEGIN;

-- 1. Bœuf bourguignon : Ajouter profils gustatifs
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Bœuf bourguignon'
  AND t.name IN ('Intensité-Riche', 'Arôme-Terreux', 'Saveur-Umami', 'Texture-Moelleux', 'Réconfortant')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 2. Coq au vin : CORRIGER (enlever Végétarien, ajouter tags corrects)
DELETE FROM recipe_tags
WHERE recipe_id = (SELECT id FROM recipes WHERE name = 'Coq au vin')
  AND tag_id = (SELECT id FROM tags WHERE name = 'Végétarien');

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Coq au vin'
  AND t.name IN ('Française', 'Intensité-Riche', 'Arôme-Terreux', 'Saveur-Umami', 'Hiver', 'Réconfortant')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 3. Poulet basquaise : CORRIGER (Italienne → Espagnole)
DELETE FROM recipe_tags
WHERE recipe_id = (SELECT id FROM recipes WHERE name = 'Poulet basquaise')
  AND tag_id = (SELECT id FROM tags WHERE name = 'Italienne');

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Poulet basquaise'
  AND t.name IN ('Espagnole', 'Française', 'Saveur-Épicé', 'Été', 'Intensité-Moyen')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 4. Blanquette de veau : Enrichir
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Blanquette de veau à l''ancienne'
  AND t.name IN ('Française', 'Intensité-Riche', 'Texture-Crémeux', 'Saveur-Herbacé', 'Hiver', 'Réconfortant')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 5. Cassoulet : Enrichir
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Cassoulet'
  AND t.name IN ('Française', 'Intensité-Riche', 'Saveur-Umami', 'Hiver', 'Réconfortant', 'Long')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 6. Bouillabaisse : Enrichir
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Bouillabaisse'
  AND t.name IN ('Française', 'Arôme-Marin', 'Saveur-Herbacé', 'Été', 'Intensité-Moyen', 'Luxe')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 7. Quiche Lorraine : Enrichir
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Quiche Lorraine'
  AND t.name IN ('Française', 'Texture-Crémeux', 'Intensité-Riche', 'Facile', 'Quotidien')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 8. Crème brûlée : Enrichir
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Crème brûlée'
  AND t.name IN ('Française', 'Saveur-Sucré', 'Texture-Crémeux', 'Arôme-Caramélisé', 'Végétarien', 'Luxe')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 9. Ratatouille : Enrichir
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Ratatouille'
  AND t.name IN ('Française', 'Végétarien', 'Arôme-Végétal', 'Saveur-Herbacé', 'Été', 'Healthy')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 10. Goulash : Enrichir
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Goulash de bœuf hongrois'
  AND t.name IN ('Espagnole', 'Intensité-Riche', 'Saveur-Épicé', 'Hiver', 'Réconfortant')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Enrichissement manuel terminé !' as message,
  COUNT(*) as nouvelles_associations
FROM recipe_tags
WHERE recipe_id IN (
  SELECT id FROM recipes 
  WHERE name IN (
    'Bœuf bourguignon',
    'Coq au vin',
    'Poulet basquaise',
    'Blanquette de veau à l''ancienne',
    'Cassoulet',
    'Bouillabaisse',
    'Quiche Lorraine',
    'Crème brûlée',
    'Ratatouille',
    'Goulash de bœuf hongrois'
  )
);
