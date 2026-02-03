-- =============================================================================
-- DEBUG DE LA FONCTION
-- =============================================================================

\echo '🔍 VÉRIFICATIONS'
\echo ''

-- 1. Vérifier que la fonction existe
\echo '1️⃣ La fonction existe-t-elle ?'
SELECT
    proname AS nom_fonction,
    pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'calculate_recipe_nutrition';

\echo ''
\echo '2️⃣ Test manuel du calcul (sans la fonction)'
\echo ''

-- Test manuel simplifié
WITH ingredient_base AS (
    SELECT
        ri.quantity,
        ri.archetype_id,
        a.process AS archetype_process,
        COALESCE(cf.canonical_name, a.name) AS nom,
        COALESCE(ano.nutrition_id, cf.nutrition_id) AS nutrition_id_to_use
    FROM recipe_ingredients ri
    LEFT JOIN archetypes a ON a.id = ri.archetype_id
    LEFT JOIN canonical_foods cf ON cf.id = COALESCE(ri.canonical_food_id, a.canonical_food_id)
    LEFT JOIN archetype_nutrition_overrides ano ON ano.archetype_id = a.id
    WHERE ri.recipe_id = 9401
)
SELECT
    nom,
    quantity,
    archetype_process,
    nutrition_id_to_use,
    CASE
        WHEN nutrition_id_to_use IS NULL THEN '❌ PAS DE NUTRITION'
        ELSE '✅ OK'
    END AS statut
FROM ingredient_base;

\echo ''
\echo '3️⃣ Vérifier les tables de modificateurs'
\echo ''

SELECT COUNT(*) AS nb_process_modifiers FROM process_nutrition_modifiers;
SELECT COUNT(*) AS nb_overrides FROM archetype_nutrition_overrides;

\echo ''
\echo '4️⃣ Test avec RAISE NOTICE activé'
\echo ''

-- Activer les messages
SET client_min_messages TO NOTICE;

-- Essayer d'appeler la fonction
DO $$
BEGIN
    PERFORM * FROM calculate_recipe_nutrition(9401);
    RAISE NOTICE 'Fonction exécutée sans erreur';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERREUR: %', SQLERRM;
END $$;
