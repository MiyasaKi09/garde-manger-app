#!/bin/bash
# Script maître de restauration complète
# Exécute les 3 étapes dans le bon ordre

set -e

cd /workspaces/garde-manger-app

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔄 RESTAURATION COMPLÈTE DU SYSTÈME NUTRITIONNEL             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Ce script va :"
echo "  1️⃣  Restaurer canonical_foods (227) et recipe_ingredients (3487)"
echo "  2️⃣  Réimporter Ciqual (3178 aliments, 33 colonnes)"
echo "  3️⃣  Lier 16 aliments de base aux données Ciqual"
echo ""
read -p "Continuer ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "ÉTAPE 1/3 : Restauration depuis export (27 Oct 2025)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

bash tools/restore_from_latest_export.sh || {
    echo "❌ Erreur lors de la restauration"
    exit 1
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "ÉTAPE 2/3 : Réimport Ciqual sécurisé"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Vérifier que le CSV existe, sinon le générer
if [ ! -f "data/ciqual_dedup.csv" ]; then
    echo "📂 Génération du CSV Ciqual..."
    bash tools/import_ciqual.sh || {
        echo "❌ Erreur lors de la génération du CSV"
        exit 1
    }
fi

bash tools/reimport_ciqual_secure.sh || {
    echo "❌ Erreur lors du réimport Ciqual"
    exit 1
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "ÉTAPE 3/3 : Lien canonical_foods → Ciqual"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ -f .env.local ]; then
    source .env.local
fi

psql "$DATABASE_URL_TX" -v ON_ERROR_STOP=1 -f tools/link_canonical_to_ciqual.sql || {
    echo "❌ Erreur lors du lien des aliments"
    exit 1
}

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ RESTAURATION TERMINÉE AVEC SUCCÈS !                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 État final de la base :"

psql "$DATABASE_URL_TX" -c "
SELECT 
    'canonical_foods' AS table_name, COUNT(*) AS rows FROM canonical_foods
UNION ALL
SELECT 'canonical_foods avec nutrition', COUNT(*) FROM canonical_foods WHERE nutrition_id IS NOT NULL
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients
UNION ALL
SELECT 'nutritional_data', COUNT(*) FROM nutritional_data
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes;
"

echo ""
echo "🧪 Test rapide : Calcul nutritionnel recette avec légumes"

psql "$DATABASE_URL_TX" -c "
-- Trouver une recette avec des légumes liés
WITH recettes_testables AS (
    SELECT 
        r.id,
        r.name,
        COUNT(DISTINCT cf.nutrition_id) AS nb_nutrients
    FROM recipes r
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
    WHERE cf.nutrition_id IS NOT NULL
    GROUP BY r.id, r.name
    HAVING COUNT(DISTINCT cf.nutrition_id) >= 2
    LIMIT 1
)
SELECT 
    rt.id AS recipe_id,
    rt.name AS recipe_name,
    rt.nb_nutrients AS aliments_avec_nutrition
FROM recettes_testables rt;
" | head -10

echo ""
echo "🎯 Prochaines étapes :"
echo "  • Tester calculate_recipe_nutrition(recipe_id)"
echo "  • Tester get_recipe_micronutrients(recipe_id)"
echo "  • Mettre à jour le frontend NutritionFacts.jsx"
echo "  • Lier les 211 canonical_foods restants (script matching automatique)"
echo ""
