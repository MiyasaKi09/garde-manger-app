#!/bin/bash
# Réimport SÉCURISÉ de Ciqual dans nutritional_data
# SANS TRUNCATE CASCADE pour préserver les données restaurées

set -e

cd /workspaces/garde-manger-app

echo "🔄 Réimport sécurisé des données Ciqual (3178 aliments, 33 colonnes)"
echo ""

# Charger les variables
if [ -f .env.local ]; then
    source .env.local
else
    echo "❌ .env.local non trouvé"
    exit 1
fi

echo "📊 État actuel:"
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 -c "
SELECT 
    'nutritional_data' AS table_name, COUNT(*) AS rows FROM nutritional_data
UNION ALL
SELECT 'canonical_foods', COUNT(*) FROM canonical_foods
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients;
"

echo ""
echo "⚠️  Ce script va :"
echo "  1. Supprimer SEULEMENT nutritional_data (DELETE sans CASCADE)"
echo "  2. Réimporter 3178 aliments Ciqual avec 33 colonnes"
echo "  3. Préserver canonical_foods et recipe_ingredients"
echo ""
read -p "Continuer ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

echo ""
echo "🗑️  Suppression de nutritional_data (DELETE, pas TRUNCATE)..."

psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 -c "DELETE FROM nutritional_data;"

echo "✅ nutritional_data vidé"
echo ""

echo "📊 Vérification que les autres tables sont intactes:"
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 -c "
SELECT 
    'canonical_foods' AS table_name, COUNT(*) AS rows FROM canonical_foods
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients;
"

echo ""
echo "📥 Import des données Ciqual (3178 lignes)..."

# Le CSV a déjà été généré par import_ciqual.sh
if [ ! -f "data/ciqual_dedup.csv" ]; then
    echo "❌ data/ciqual_dedup.csv non trouvé. Exécutez d'abord tools/import_ciqual.sh"
    exit 1
fi

psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 << SQL
\COPY nutritional_data(source_id,calories_kcal,proteines_g,glucides_g,lipides_g,fibres_g,sucres_g,ag_satures_g,ag_monoinsatures_g,ag_polyinsatures_g,cholesterol_mg,calcium_mg,fer_mg,magnesium_mg,phosphore_mg,potassium_mg,sodium_mg,zinc_mg,cuivre_mg,selenium_ug,iode_ug,vitamine_a_ug,beta_carotene_ug,vitamine_d_ug,vitamine_e_mg,vitamine_k_ug,vitamine_c_mg,vitamine_b1_mg,vitamine_b2_mg,vitamine_b3_mg,vitamine_b5_mg,vitamine_b6_mg,vitamine_b9_ug,vitamine_b12_ug) FROM '$(pwd)/data/ciqual_dedup.csv' WITH CSV HEADER DELIMITER ',' NULL '';
SQL

echo "✅ Import terminé"
echo ""

echo "📊 Statistiques nutritional_data:"
psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 -c "
SELECT 
    COUNT(*) AS total_aliments,
    COUNT(calories_kcal) AS avec_calories,
    COUNT(fibres_g) AS avec_fibres,
    COUNT(vitamine_c_mg) AS avec_vit_c,
    COUNT(calcium_mg) AS avec_calcium,
    COUNT(fer_mg) AS avec_fer
FROM nutritional_data;
"

echo ""
echo "✅ Réimport Ciqual terminé avec succès !"
echo ""
echo "📌 Prochaine étape : Lier canonical_foods aux données Ciqual"
echo "   Exécutez : psql ... < tools/link_canonical_to_ciqual.sql"
