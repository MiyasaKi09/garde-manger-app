-- Script pour exporter les recettes SANS ingrédients
-- À exécuter dans Supabase SQL Editor

-- 1. Compter les recettes sans ingrédients
SELECT COUNT(*) as total_recettes_sans_ingredients
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE ri.id IS NULL;

-- 2. Exporter les recettes sans ingrédients (avec détails)
\copy (
  SELECT
    r.id,
    r.name,
    COALESCE(r.servings, 4) as servings
  FROM recipes r
  LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
  WHERE ri.id IS NULL
  ORDER BY r.id
) TO '/tmp/recipes_without_ingredients.csv' WITH CSV HEADER;

-- 3. Lister les premières recettes sans ingrédients pour vérification
SELECT
  r.id,
  r.name,
  COALESCE(r.servings, 4) as servings
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE ri.id IS NULL
ORDER BY r.id
LIMIT 50;
