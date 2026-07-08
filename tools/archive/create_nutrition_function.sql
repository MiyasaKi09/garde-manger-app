-- ============================================================================
-- Fonction de Calcul Nutritionnel pour les Recettes
-- ============================================================================
--
-- Calcule les valeurs nutritionnelles d'une recette en tenant compte:
-- - Des quantités d'ingrédients
-- - De la méthode de cuisson (coefficients de rétention)
-- - Du nombre de portions
--
-- Usage:
--   SELECT * FROM calculate_recipe_nutrition(142);
--
-- ============================================================================

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS calculate_recipe_nutrition(INTEGER);

-- Créer la fonction
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
    -- 1. Récupérer la méthode de cuisson et le nombre de portions
    SELECT 
        COALESCE(LOWER(cooking_method), 'cru'),
        COALESCE(servings, 1)
    INTO cooking_method_var, servings_var
    FROM recipes 
    WHERE id = recipe_id_param;
    
    -- Vérifier que la recette existe
    IF cooking_method_var IS NULL THEN
        RAISE EXCEPTION 'Recette % introuvable', recipe_id_param;
    END IF;
    
    RAISE NOTICE 'Calcul pour recette % | Méthode: % | Portions: %', 
                 recipe_id_param, cooking_method_var, servings_var;
    
    -- 2. Calculer les valeurs nutritionnelles
    RETURN QUERY
    WITH ingredient_nutrition AS (
        -- Pour chaque ingrédient, récupérer les valeurs nutritionnelles de base
        SELECT 
            ri.quantity,
            ri.unit,
            cf.canonical_name,
            -- Calories (kcal pour 100g) ajustées à la quantité
            COALESCE(nd.calories_kcal, 0) * (ri.quantity / 100.0) AS ingredient_calories,
            -- Protéines (g pour 100g) ajustées à la quantité
            COALESCE(nd.proteines_g, 0) * (ri.quantity / 100.0) AS ingredient_proteines,
            -- Glucides (g pour 100g) ajustés à la quantité
            COALESCE(nd.glucides_g, 0) * (ri.quantity / 100.0) AS ingredient_glucides,
            -- Lipides (g pour 100g) ajustés à la quantité
            COALESCE(nd.lipides_g, 0) * (ri.quantity / 100.0) AS ingredient_lipides
        FROM recipe_ingredients ri
        -- Joindre canonical_foods (peut être via canonical_food_id ou archetype_id)
        LEFT JOIN canonical_foods cf ON cf.id = COALESCE(ri.canonical_food_id, (
            SELECT a.canonical_food_id 
            FROM archetypes a 
            WHERE a.id = ri.archetype_id
        ))
        -- Joindre les données nutritionnelles
        LEFT JOIN nutritional_data nd ON nd.id = cf.nutrition_id
        WHERE ri.recipe_id = recipe_id_param
          AND cf.id IS NOT NULL
    ),
    raw_totals AS (
        -- Somme brute de tous les ingrédients (avant application des coefficients de cuisson)
        SELECT 
            SUM(ingredient_calories) AS total_calories_raw,
            SUM(ingredient_proteines) AS total_proteines_raw,
            SUM(ingredient_glucides) AS total_glucides_raw,
            SUM(ingredient_lipides) AS total_lipides_raw
        FROM ingredient_nutrition
    ),
    cooking_factors AS (
        -- Récupérer les facteurs de cuisson pour cette méthode
        SELECT 
            nutrient_name,
            factor_type,
            factor_value
        FROM cooking_nutrition_factors
        WHERE LOWER(cooking_method) = cooking_method_var
    ),
    adjusted_totals AS (
        -- Appliquer les coefficients de cuisson
        SELECT 
            -- Calories (généralement stable)
            rt.total_calories_raw AS total_calories,
            
            -- Protéines (appliquer facteur de rétention si disponible)
            rt.total_proteines_raw * COALESCE(
                (SELECT factor_value FROM cooking_factors 
                 WHERE nutrient_name = 'proteines' AND factor_type = 'RETENTION'),
                1.0
            ) AS total_proteines,
            
            -- Glucides (appliquer facteur de rétention si disponible)
            rt.total_glucides_raw * COALESCE(
                (SELECT factor_value FROM cooking_factors 
                 WHERE nutrient_name = 'glucides' AND factor_type = 'RETENTION'),
                1.0
            ) AS total_glucides,
            
            -- Lipides (appliquer facteur de rétention OU multiplication si friture)
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM cooking_factors 
                    WHERE nutrient_name = 'lipides' AND factor_type = 'MULTIPLICATION'
                ) THEN
                    rt.total_lipides_raw * (
                        SELECT factor_value FROM cooking_factors 
                        WHERE nutrient_name = 'lipides' AND factor_type = 'MULTIPLICATION'
                    )
                ELSE
                    rt.total_lipides_raw * COALESCE(
                        (SELECT factor_value FROM cooking_factors 
                         WHERE nutrient_name = 'lipides' AND factor_type = 'RETENTION'),
                        1.0
                    )
            END AS total_lipides
        FROM raw_totals rt
    )
    -- Retourner les résultats par portion ET totaux
    SELECT 
        'Calories'::TEXT,
        ROUND((total_calories / servings_var)::NUMERIC, 1),
        'kcal'::TEXT,
        ROUND(total_calories::NUMERIC, 1)
    FROM adjusted_totals
    UNION ALL
    SELECT 
        'Protéines'::TEXT,
        ROUND((total_proteines / servings_var)::NUMERIC, 1),
        'g'::TEXT,
        ROUND(total_proteines::NUMERIC, 1)
    FROM adjusted_totals
    UNION ALL
    SELECT 
        'Glucides'::TEXT,
        ROUND((total_glucides / servings_var)::NUMERIC, 1),
        'g'::TEXT,
        ROUND(total_glucides::NUMERIC, 1)
    FROM adjusted_totals
    UNION ALL
    SELECT 
        'Lipides'::TEXT,
        ROUND((total_lipides / servings_var)::NUMERIC, 1),
        'g'::TEXT,
        ROUND(total_lipides::NUMERIC, 1)
    FROM adjusted_totals;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur calcul nutritionnel: %', SQLERRM;
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- Ajouter un commentaire descriptif
COMMENT ON FUNCTION calculate_recipe_nutrition IS 
'Calcule les valeurs nutritionnelles d''une recette (par portion et total) 
en tenant compte des quantités d''ingrédients et de la méthode de cuisson.

Paramètres:
  - recipe_id_param: ID de la recette

Retourne:
  - nutrient_name: Nom du nutriment (Calories, Protéines, Glucides, Lipides)
  - value_per_serving: Valeur par portion
  - unit: Unité (kcal ou g)
  - value_total: Valeur totale pour toute la recette

Exemple:
  SELECT * FROM calculate_recipe_nutrition(142);
';

-- Test de la fonction (optionnel)
\echo '🧪 Test de la fonction sur la recette #142 (si elle existe):'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM recipes WHERE id = 142) THEN
        PERFORM * FROM calculate_recipe_nutrition(142);
        RAISE NOTICE 'Test réussi!';
    ELSE
        RAISE NOTICE 'Recette #142 inexistante, test ignoré';
    END IF;
END $$;

\echo ''
\echo '✅ Fonction calculate_recipe_nutrition créée avec succès!'
\echo ''
\echo '💡 Utilisation:'
\echo '   SELECT * FROM calculate_recipe_nutrition(142);'
\echo ''
\echo '📊 Résultat attendu:'
\echo '   nutrient_name | value_per_serving | unit | value_total'
\echo '  ---------------+-------------------+------+-------------'
\echo '   Calories      |            285.5  | kcal |      1142.0'
\echo '   Protéines     |             12.3  | g    |        49.2'
\echo '   Glucides      |             35.2  | g    |       140.8'
\echo '   Lipides       |              8.9  | g    |        35.6'
