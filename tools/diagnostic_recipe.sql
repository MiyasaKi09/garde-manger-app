-- =============================================================================
-- DIAGNOSTIC DE LA RECETTE
-- Exécuter dans Supabase SQL Editor
-- =============================================================================

\echo '🔍 DIAGNOSTIC DE LA RECETTE SALADE NIÇOISE (ID 9401)'
\echo ''

-- Vérifier les ingrédients de la recette
\echo '1️⃣ INGRÉDIENTS DE LA RECETTE :'
\echo ''

SELECT
    ri.id AS ingredient_id,
    ri.canonical_food_id,
    ri.archetype_id,
    ri.quantity,
    ri.unit,
    CASE
        WHEN ri.canonical_food_id IS NOT NULL THEN cf.canonical_name
        WHEN ri.archetype_id IS NOT NULL THEN a.name
        ELSE '❌ AUCUN LIEN'
    END AS nom_ingredient,
    CASE
        WHEN ri.canonical_food_id IS NOT NULL AND cf.id IS NULL THEN '❌ canonical_food invalide'
        WHEN ri.archetype_id IS NOT NULL AND a.id IS NULL THEN '❌ archetype invalide'
        WHEN ri.canonical_food_id IS NULL AND ri.archetype_id IS NULL THEN '❌ MANQUE LES DEUX'
        ELSE '✅ OK'
    END AS statut
FROM recipe_ingredients ri
LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
LEFT JOIN archetypes a ON a.id = ri.archetype_id
WHERE ri.recipe_id = 9401
ORDER BY ri.id;

\echo ''
\echo '2️⃣ VÉRIFIER SI LES ALIMENTS ONT DES DONNÉES NUTRITIONNELLES :'
\echo ''

SELECT
    ri.id AS ingredient_id,
    COALESCE(cf.canonical_name, a.name, 'INCONNU') AS nom,
    cf.nutrition_id AS canonical_nutrition_id,
    ano.nutrition_id AS archetype_override_nutrition_id,
    CASE
        WHEN ri.canonical_food_id IS NOT NULL AND cf.nutrition_id IS NULL THEN '❌ Canonical food sans nutrition'
        WHEN ri.archetype_id IS NOT NULL AND a.canonical_food_id IS NULL THEN '❌ Archetype sans canonical'
        WHEN ri.archetype_id IS NOT NULL AND ano.nutrition_id IS NULL AND cfarch.nutrition_id IS NULL THEN '❌ Archetype sans nutrition'
        WHEN COALESCE(ano.nutrition_id, cfarch.nutrition_id, cf.nutrition_id) IS NOT NULL THEN '✅ OK'
        ELSE '❌ MANQUE NUTRITION'
    END AS statut_nutrition
FROM recipe_ingredients ri
LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
LEFT JOIN archetypes a ON a.id = ri.archetype_id
LEFT JOIN archetype_nutrition_overrides ano ON ano.archetype_id = a.id
LEFT JOIN canonical_foods cfarch ON cfarch.id = a.canonical_food_id
WHERE ri.recipe_id = 9401
ORDER BY ri.id;

\echo ''
\echo '3️⃣ TESTER LE CALCUL NUTRITIONNEL :'
\echo ''

-- Essayer de calculer
SELECT * FROM calculate_recipe_nutrition(9401);

\echo ''
\echo '4️⃣ VÉRIFIER QUE LES TABLES EXISTENT :'
\echo ''

SELECT
    'process_nutrition_modifiers' AS table_name,
    COUNT(*) AS nb_lignes
FROM process_nutrition_modifiers
UNION ALL
SELECT
    'archetype_nutrition_overrides' AS table_name,
    COUNT(*) AS nb_lignes
FROM archetype_nutrition_overrides;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'FIN DU DIAGNOSTIC'
\echo ''
