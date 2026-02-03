-- =============================================================================
-- CORRECTION DE LA FONCTION (Version Corrigée - conflit de noms résolu)
-- =============================================================================

DROP FUNCTION IF EXISTS calculate_recipe_nutrition(INTEGER);

CREATE OR REPLACE FUNCTION calculate_recipe_nutrition(recipe_id_param INTEGER)
RETURNS TABLE (
    nutrient_name TEXT,
    value_per_serving NUMERIC,
    unit TEXT,
    value_total NUMERIC
) AS $$
DECLARE
    cooking_method_var TEXT;
    servings_var INTEGER;
BEGIN
    -- Récupérer méthode de cuisson et portions
    SELECT COALESCE(LOWER(r.cooking_method), 'cru'), COALESCE(r.servings, 1)
    INTO cooking_method_var, servings_var
    FROM recipes r
    WHERE r.id = recipe_id_param;

    IF cooking_method_var IS NULL THEN
        RAISE EXCEPTION 'Recette % introuvable', recipe_id_param;
    END IF;

    -- Calcul principal
    RETURN QUERY
    WITH ingredient_base AS (
        SELECT
            ri.quantity,
            ri.unit,
            ri.archetype_id,
            a.process AS archetype_process,
            cf.canonical_name,
            COALESCE(ano.nutrition_id, cf.nutrition_id) AS nutrition_id_to_use
        FROM recipe_ingredients ri
        LEFT JOIN archetypes a ON a.id = ri.archetype_id
        LEFT JOIN canonical_foods cf ON cf.id = COALESCE(ri.canonical_food_id, a.canonical_food_id)
        LEFT JOIN archetype_nutrition_overrides ano ON ano.archetype_id = a.id
        WHERE ri.recipe_id = recipe_id_param
          AND (ri.canonical_food_id IS NOT NULL OR ri.archetype_id IS NOT NULL)
    ),
    process_factors AS (
        SELECT DISTINCT ON (ib.archetype_id, pnm.nutrient_name)
            ib.archetype_id,
            pnm.nutrient_name AS nutrient,
            pnm.factor_value
        FROM ingredient_base ib
        JOIN process_nutrition_modifiers pnm ON ib.archetype_process IS NOT NULL
                                             AND ib.archetype_process ~* pnm.process_pattern
                                             AND pnm.factor_type = 'MULTIPLICATION'
        ORDER BY ib.archetype_id, pnm.nutrient_name, pnm.priority DESC
    ),
    ingredient_nutrition AS (
        SELECT
            ib.quantity,
            ib.canonical_name,
            COALESCE(nd.calories_kcal, 0) *
            COALESCE((SELECT pf.factor_value FROM process_factors pf
                      WHERE pf.archetype_id = ib.archetype_id
                      AND pf.nutrient = 'calories'), 1.0) *
            (ib.quantity / 100.0) AS ingredient_calories,

            COALESCE(nd.proteines_g, 0) *
            COALESCE((SELECT pf.factor_value FROM process_factors pf
                      WHERE pf.archetype_id = ib.archetype_id
                      AND pf.nutrient = 'proteines'), 1.0) *
            (ib.quantity / 100.0) AS ingredient_proteines,

            COALESCE(nd.glucides_g, 0) *
            COALESCE((SELECT pf.factor_value FROM process_factors pf
                      WHERE pf.archetype_id = ib.archetype_id
                      AND pf.nutrient = 'glucides'), 1.0) *
            (ib.quantity / 100.0) AS ingredient_glucides,

            COALESCE(nd.lipides_g, 0) *
            COALESCE((SELECT pf.factor_value FROM process_factors pf
                      WHERE pf.archetype_id = ib.archetype_id
                      AND pf.nutrient = 'lipides'), 1.0) *
            (ib.quantity / 100.0) AS ingredient_lipides
        FROM ingredient_base ib
        LEFT JOIN nutritional_data nd ON nd.id = ib.nutrition_id_to_use
    ),
    raw_totals AS (
        SELECT
            SUM(ingredient_calories) AS total_calories_raw,
            SUM(ingredient_proteines) AS total_proteines_raw,
            SUM(ingredient_glucides) AS total_glucides_raw,
            SUM(ingredient_lipides) AS total_lipides_raw
        FROM ingredient_nutrition
    ),
    cooking_factors AS (
        SELECT
            cf.nutrient_name AS nutrient,
            cf.factor_type,
            cf.factor_value
        FROM cooking_nutrition_factors cf
        WHERE LOWER(cf.cooking_method) = cooking_method_var
    ),
    adjusted_totals AS (
        SELECT
            rt.total_calories_raw AS total_calories,
            rt.total_proteines_raw * COALESCE(
                (SELECT cf.factor_value FROM cooking_factors cf
                 WHERE cf.nutrient = 'proteines' AND cf.factor_type = 'RETENTION'), 1.0
            ) AS total_proteines,
            rt.total_glucides_raw * COALESCE(
                (SELECT cf.factor_value FROM cooking_factors cf
                 WHERE cf.nutrient = 'glucides' AND cf.factor_type = 'RETENTION'), 1.0
            ) AS total_glucides,
            CASE
                WHEN EXISTS (SELECT 1 FROM cooking_factors cf
                            WHERE cf.nutrient = 'lipides' AND cf.factor_type = 'MULTIPLICATION')
                THEN rt.total_lipides_raw * (SELECT cf.factor_value FROM cooking_factors cf
                                             WHERE cf.nutrient = 'lipides' AND cf.factor_type = 'MULTIPLICATION')
                ELSE rt.total_lipides_raw * COALESCE(
                    (SELECT cf.factor_value FROM cooking_factors cf
                     WHERE cf.nutrient = 'lipides' AND cf.factor_type = 'RETENTION'), 1.0
                )
            END AS total_lipides
        FROM raw_totals rt
    )
    SELECT 'Calories'::TEXT, ROUND((at.total_calories / servings_var)::NUMERIC, 1), 'kcal'::TEXT, ROUND(at.total_calories::NUMERIC, 1) FROM adjusted_totals at
    UNION ALL
    SELECT 'Protéines'::TEXT, ROUND((at.total_proteines / servings_var)::NUMERIC, 1), 'g'::TEXT, ROUND(at.total_proteines::NUMERIC, 1) FROM adjusted_totals at
    UNION ALL
    SELECT 'Glucides'::TEXT, ROUND((at.total_glucides / servings_var)::NUMERIC, 1), 'g'::TEXT, ROUND(at.total_glucides::NUMERIC, 1) FROM adjusted_totals at
    UNION ALL
    SELECT 'Lipides'::TEXT, ROUND((at.total_lipides / servings_var)::NUMERIC, 1), 'g'::TEXT, ROUND(at.total_lipides::NUMERIC, 1) FROM adjusted_totals at;
END;
$$ LANGUAGE plpgsql;

\echo '✅ Fonction recréée avec succès !'
\echo ''
\echo '🧪 Test sur la recette 9401 :'
\echo ''

-- Test immédiat
SELECT * FROM calculate_recipe_nutrition(9401);
