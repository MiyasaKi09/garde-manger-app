-- Script de vérification rapide des données
-- À exécuter dans Supabase SQL Editor pour vérifier l'état des données

-- 1. Vérifier les ingrédients disponibles
SELECT 'CANONICAL_FOODS' as table_name, COUNT(*) as count FROM canonical_foods
UNION ALL
SELECT 'RECIPES' as table_name, COUNT(*) as count FROM recipes
UNION ALL  
SELECT 'RECIPE_INGREDIENTS' as table_name, COUNT(*) as count FROM recipe_ingredients;

-- 2. Voir quelques ingrédients disponibles
SELECT 'Ingrédients disponibles:' as info;
SELECT id, name, category, subcategory 
FROM canonical_foods 
WHERE name ILIKE '%auberg%' OR name ILIKE '%tomate%' OR name ILIKE '%oignon%'
ORDER BY name
LIMIT 10;

-- 3. Voir les recettes avec leurs ingrédients
SELECT 'Recettes avec ingrédients:' as info;
SELECT 
    r.id,
    r.name as recipe_name,
    COUNT(ri.id) as ingredient_count
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
GROUP BY r.id, r.name
ORDER BY r.id
LIMIT 5;