#!/bin/bash
# Script de restauration depuis supabase/exports/latest
# Restaure canonical_foods et recipe_ingredients perdus lors du TRUNCATE CASCADE

set -e

cd /workspaces/garde-manger-app

echo "🔄 Restauration depuis supabase/exports/latest (27 Oct 2025, 14:53 UTC)"
echo ""

# Charger les variables
if [ -f .env.local ]; then
    source .env.local
else
    echo "❌ .env.local non trouvé"
    exit 1
fi

EXPORT_DIR="supabase/exports/latest/csv"

echo "📊 État actuel de la base:"
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 -c "
SELECT 
    'canonical_foods' AS table_name, COUNT(*) AS rows FROM canonical_foods
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL
SELECT 'nutritional_data', COUNT(*) FROM nutritional_data;
"

echo ""
read -p "⚠️  Continuer la restauration ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

echo ""
echo "🗑️  Nettoyage des tables (SANS CASCADE)..."

# Supprimer les données existantes sans CASCADE
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 << 'SQL'
-- Désactiver temporairement les triggers pour éviter les cascades
SET session_replication_role = replica;

-- Vider les tables dans le bon ordre (respecter les FK)
TRUNCATE TABLE recipe_ingredients RESTART IDENTITY;
TRUNCATE TABLE canonical_foods RESTART IDENTITY;

-- Réactiver les triggers
SET session_replication_role = DEFAULT;

SELECT 'Tables vidées' AS status;
SQL

echo "✅ Tables nettoyées"
echo ""

echo "📥 Import canonical_foods (227 lignes)..."
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 << SQL
\COPY canonical_foods(id,canonical_name,category_id,keywords,primary_unit,unit_weight_grams,density_g_per_ml,shelf_life_days_pantry,shelf_life_days_fridge,shelf_life_days_freezer,created_at,updated_at,subcategory_id,nutrition_id) FROM '$(pwd)/$EXPORT_DIR/canonical_foods.csv' WITH CSV HEADER DELIMITER ',' NULL 'NULL';
SQL

echo "✅ canonical_foods importé"
echo ""

echo "📥 Import recipe_ingredients (3487 lignes)..."
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 << SQL
\COPY recipe_ingredients(id,recipe_id,archetype_id,canonical_food_id,quantity,unit,notes,sub_recipe_id) FROM '$(pwd)/$EXPORT_DIR/recipe_ingredients.csv' WITH CSV HEADER DELIMITER ',' NULL 'NULL';
SQL

echo "✅ recipe_ingredients importé"
echo ""

echo "📊 Vérification post-restauration:"
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 -c "
SELECT 
    'canonical_foods' AS table_name, COUNT(*) AS rows FROM canonical_foods
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes;
"

echo ""
echo "🔍 Test : Recettes avec ingrédients liés à canonical_foods"
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 -c "
SELECT 
    r.id,
    r.name,
    COUNT(ri.id) AS nb_ingredients,
    COUNT(cf.id) AS nb_avec_canonical_food
FROM recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
LEFT JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
GROUP BY r.id, r.name
HAVING COUNT(ri.id) > 0
ORDER BY nb_avec_canonical_food DESC
LIMIT 10;
"

echo ""
echo "✅ Restauration terminée !"
echo ""
echo "📌 Prochaines étapes :"
echo "  1. Réimporter Ciqual dans nutritional_data (SANS TRUNCATE CASCADE)"
echo "  2. Lier canonical_foods aux données Ciqual"
echo "  3. Tester le calcul nutritionnel"
