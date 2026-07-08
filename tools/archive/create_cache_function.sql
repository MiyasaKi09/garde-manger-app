-- =============================================================================
-- FONCTION POUR CALCULER ET METTRE EN CACHE LES VALEURS NUTRITIONNELLES
-- =============================================================================

DROP FUNCTION IF EXISTS calculate_and_cache_nutrition(INTEGER);

CREATE OR REPLACE FUNCTION calculate_and_cache_nutrition(recipe_id_param INTEGER)
RETURNS TABLE (
    rec_id BIGINT,
    calories_per_serving NUMERIC,
    calories_total NUMERIC,
    proteines_per_serving NUMERIC,
    proteines_total NUMERIC,
    glucides_per_serving NUMERIC,
    glucides_total NUMERIC,
    lipides_per_serving NUMERIC,
    lipides_total NUMERIC
) AS $$
DECLARE
    v_calories_per_serving NUMERIC;
    v_calories_total NUMERIC;
    v_proteines_per_serving NUMERIC;
    v_proteines_total NUMERIC;
    v_glucides_per_serving NUMERIC;
    v_glucides_total NUMERIC;
    v_lipides_per_serving NUMERIC;
    v_lipides_total NUMERIC;
    v_servings INTEGER;
BEGIN
    -- Récupérer le nombre de portions de la recette
    SELECT COALESCE(servings, 1)
    INTO v_servings
    FROM recipes
    WHERE id = recipe_id_param;
    -- Récupérer toutes les valeurs nutritionnelles calculées
    SELECT
        MAX(CASE WHEN nutrient_name = 'Calories' THEN value_per_serving END),
        MAX(CASE WHEN nutrient_name = 'Calories' THEN value_total END),
        MAX(CASE WHEN nutrient_name = 'Protéines' THEN value_per_serving END),
        MAX(CASE WHEN nutrient_name = 'Protéines' THEN value_total END),
        MAX(CASE WHEN nutrient_name = 'Glucides' THEN value_per_serving END),
        MAX(CASE WHEN nutrient_name = 'Glucides' THEN value_total END),
        MAX(CASE WHEN nutrient_name = 'Lipides' THEN value_per_serving END),
        MAX(CASE WHEN nutrient_name = 'Lipides' THEN value_total END)
    INTO
        v_calories_per_serving,
        v_calories_total,
        v_proteines_per_serving,
        v_proteines_total,
        v_glucides_per_serving,
        v_glucides_total,
        v_lipides_per_serving,
        v_lipides_total
    FROM calculate_recipe_nutrition(recipe_id_param);

    -- Insérer ou mettre à jour le cache
    INSERT INTO recipe_nutrition_cache (
        recipe_id,
        servings,
        calories_per_serving,
        calories_total,
        proteines_per_serving,
        proteines_total,
        glucides_per_serving,
        glucides_total,
        lipides_per_serving,
        lipides_total,
        calculated_at
    )
    VALUES (
        recipe_id_param,
        v_servings,
        v_calories_per_serving,
        v_calories_total,
        v_proteines_per_serving,
        v_proteines_total,
        v_glucides_per_serving,
        v_glucides_total,
        v_lipides_per_serving,
        v_lipides_total,
        NOW()
    )
    ON CONFLICT (recipe_id)
    DO UPDATE SET
        servings = EXCLUDED.servings,
        calories_per_serving = EXCLUDED.calories_per_serving,
        calories_total = EXCLUDED.calories_total,
        proteines_per_serving = EXCLUDED.proteines_per_serving,
        proteines_total = EXCLUDED.proteines_total,
        glucides_per_serving = EXCLUDED.glucides_per_serving,
        glucides_total = EXCLUDED.glucides_total,
        lipides_per_serving = EXCLUDED.lipides_per_serving,
        lipides_total = EXCLUDED.lipides_total,
        calculated_at = NOW();

    -- Retourner les données du cache
    RETURN QUERY
    SELECT
        rnc.recipe_id::BIGINT AS rec_id,
        rnc.calories_per_serving,
        rnc.calories_total,
        rnc.proteines_per_serving,
        rnc.proteines_total,
        rnc.glucides_per_serving,
        rnc.glucides_total,
        rnc.lipides_per_serving,
        rnc.lipides_total
    FROM recipe_nutrition_cache rnc
    WHERE rnc.recipe_id = recipe_id_param;
END;
$$ LANGUAGE plpgsql;

-- Test
SELECT * FROM calculate_and_cache_nutrition(9401);
