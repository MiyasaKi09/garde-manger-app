-- ============================================================================
-- Fonction de Calcul Nutritionnel pour les Recettes (Version 2 avec Process Modifiers)
-- ============================================================================
--
-- Calcule les valeurs nutritionnelles d'une recette en tenant compte:
-- - Des quantités d'ingrédients
-- - Des PROCESS MODIFIERS basés sur les transformations d'archétypes (NOUVEAU)
-- - Des archetype_nutrition_overrides pour liens CIQUAL directs (NOUVEAU)
-- - De la méthode de cuisson (coefficients de rétention)
-- - Du nombre de portions
--
-- Ordre d'application:
--   1. Nutrition de base (nutritional_data ou override)
--   2. Process modifiers (séchage, concentration, fermentation, etc.)
--   3. Cooking factors (cuisson de la recette)
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
    WITH ingredient_base AS (
        -- Étape 1: Récupérer les informations de base pour chaque ingrédient
        SELECT
            ri.quantity,
            ri.unit,
            ri.archetype_id,
            a.process AS archetype_process,
            cf.canonical_name,
            cf.id AS canonical_food_id,
            -- Vérifier d'abord les overrides d'archetype, sinon nutrition canonique
            COALESCE(
                ano.nutrition_id,
                cf.nutrition_id
            ) AS nutrition_id_to_use
        FROM recipe_ingredients ri
        -- Joindre archetype si utilisé
        LEFT JOIN archetypes a ON a.id = ri.archetype_id
        -- Joindre canonical_foods (directement ou via archetype)
        LEFT JOIN canonical_foods cf ON cf.id = COALESCE(ri.canonical_food_id, a.canonical_food_id)
        -- Vérifier les overrides nutritionnels d'archetype
        LEFT JOIN archetype_nutrition_overrides ano ON ano.archetype_id = a.id
        WHERE ri.recipe_id = recipe_id_param
          AND cf.id IS NOT NULL
    ),
    process_factors AS (
        -- Étape 2: Matcher les processus d'archetype avec les modificateurs
        SELECT DISTINCT ON (ib.archetype_id, pnm.nutrient_name)
            ib.archetype_id,
            pnm.nutrient_name,
            pnm.factor_type,
            pnm.factor_value
        FROM ingredient_base ib
        CROSS JOIN process_nutrition_modifiers pnm
        WHERE ib.archetype_process IS NOT NULL
          AND ib.archetype_process ~* pnm.process_pattern
        ORDER BY ib.archetype_id, pnm.nutrient_name, pnm.priority DESC
    ),
    ingredient_nutrition AS (
        -- Étape 3: Calculer les valeurs nutritionnelles avec process modifiers
        SELECT
            ib.quantity,
            ib.unit,
            ib.canonical_name,
            -- Appliquer process modifiers aux valeurs de base, puis ajuster à la quantité
            -- Calories
            COALESCE(nd.calories_kcal, 0) *
            COALESCE((SELECT factor_value FROM process_factors pf
                      WHERE pf.archetype_id = ib.archetype_id
                      AND pf.nutrient_name = 'calories'
                      AND pf.factor_type = 'MULTIPLICATION'), 1.0) *
            (ib.quantity / 100.0) AS ingredient_calories,
            -- Protéines
            COALESCE(nd.proteines_g, 0) *
            COALESCE((SELECT factor_value FROM process_factors pf
                      WHERE pf.archetype_id = ib.archetype_id
                      AND pf.nutrient_name = 'proteines'
                      AND pf.factor_type = 'MULTIPLICATION'), 1.0) *
            (ib.quantity / 100.0) AS ingredient_proteines,
            -- Glucides
            COALESCE(nd.glucides_g, 0) *
            COALESCE((SELECT factor_value FROM process_factors pf
                      WHERE pf.archetype_id = ib.archetype_id
                      AND pf.nutrient_name = 'glucides'
                      AND pf.factor_type = 'MULTIPLICATION'), 1.0) *
            (ib.quantity / 100.0) AS ingredient_glucides,
            -- Lipides
            COALESCE(nd.lipides_g, 0) *
            COALESCE((SELECT factor_value FROM process_factors pf
                      WHERE pf.archetype_id = ib.archetype_id
                      AND pf.nutrient_name = 'lipides'
                      AND pf.factor_type = 'MULTIPLICATION'), 1.0) *
            (ib.quantity / 100.0) AS ingredient_lipides
        FROM ingredient_base ib
        -- Joindre les données nutritionnelles (utilise override si présent)
        LEFT JOIN nutritional_data nd ON nd.id = ib.nutrition_id_to_use
    ),
    raw_totals AS (
        -- Somme brute de tous les ingrédients (après process modifiers, avant cuisson)
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
en tenant compte des quantités d''ingrédients, des process modifiers basés
sur les transformations d''archétypes, et de la méthode de cuisson.

Ordre d''application:
  1. Nutrition de base (avec archetype overrides si présents)
  2. Process modifiers (séchage 8x, concentration 2-3x, fermentation, etc.)
  3. Cooking factors (cuisson de la recette)

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

\echo '✅ Fonction calculate_recipe_nutrition (v2 avec process modifiers) créée avec succès!'
\echo ''
\echo '💡 Utilisation:'
\echo '   SELECT * FROM calculate_recipe_nutrition(142);'
\echo ''
\echo '🆕 Nouveautés:'
\echo '   - Supporte archetype_nutrition_overrides (liens CIQUAL directs)'
\echo '   - Applique process_nutrition_modifiers automatiquement'
\echo '   - Ordre: base nutrition → process modifiers → cooking factors'
