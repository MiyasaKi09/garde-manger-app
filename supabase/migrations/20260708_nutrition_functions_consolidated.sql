-- ============================================================================
-- Migration: 20260708_nutrition_functions_consolidated.sql
-- Fonctions nutrition définitives — Phase 1.5 / R4 de l'audit juillet 2026
-- ============================================================================
--
-- CONTEXTE
-- --------
-- L'audit §C4/I3 a identifié 5 variantes concurrentes de la fonction de calcul
-- dans tools/ (create_nutrition_function.sql, create_nutrition_function_v2.sql,
-- fix_function.sql, fix_function_v2.sql, create_cache_function.sql) dont aucune
-- n'était installée par une migration versionnée. La version déployée était
-- invérifiable depuis le repo.
--
-- Cette migration installe LES versions définitives via CREATE OR REPLACE et
-- consolide les meilleures parties de chaque variante.
--
-- FONCTIONS INSTALLÉES
-- --------------------
-- 1. calculate_recipe_nutrition(recipe_id_param INTEGER)
--    RETURNS TABLE (nutrient_name, value_per_serving, unit, value_total)
--    — Format "long" (4 lignes, une par macro)
--    — Source principale : tools/fix_function_v2.sql (nommage corrigé)
--    — Améliorations par rapport aux variantes tools/ :
--      a) Conversion quantity + unit → grammes avant calcul (était implicitement
--         en grammes, silencieusement faux pour ml/cl/u — audit §M4)
--         Unités gérées : g/kg/mg (masse), ml/cl/l avec densité (volume),
--         pièce/u/unité avec grams_per_unit (dénombrement)
--         Sources de densité : archetypes.density_g_per_ml puis
--                               canonical_foods.density_g_per_ml, fallback 1.0
--         Sources de poids/pièce : archetypes.grams_per_unit puis
--                                   canonical_foods.unit_weight_grams, fallback 100 g
--      b) EXCEPTION WHEN OTHERS remplacé par RAISE WARNING + RETURN (non bloquant
--         mais observable dans pg_logs — audit §M4)
--      c) Avertissement pré-calcul sur les unités non reconnues
--
-- 2. calculate_and_cache_nutrition(recipe_id_param INTEGER)
--    RETURNS TABLE (rec_id, calories_per_serving, calories_total,
--                   proteines_per_serving, proteines_total,
--                   glucides_per_serving, glucides_total,
--                   lipides_per_serving, lipides_total)
--    — Format "large" (1 ligne, 8 colonnes — shape exacte de
--      tools/create_cache_function.sql, celle attendue par lib/recipePreciseNutrition.js)
--    — Peuple recipe_nutrition_cache via upsert (ON CONFLICT recipe_id)
--    — Calcule et stocke ingredients_hash (md5) pour traçabilité
--
-- LOGIQUE CONSERVÉE (inchangée depuis fix_function_v2.sql)
-- ---------------------------------------------------------
-- - Précédence nutrition : COALESCE(ano.nutrition_id, cf.nutrition_id)
--   (archetype_nutrition_overrides prime sur la nutrition canonique)
-- - Process modifiers : archetype.process ~* process_pattern → facteur MULTIPLICATION
--   appliqué par nutriment, DISTINCT ON (archetype_id, nutrient_name) ORDER BY priority DESC
-- - Cooking factors : RETENTION pour protéines/glucides/lipides,
--   MULTIPLICATION pour lipides (friture) prime sur RETENTION
--
-- IDEMPOTENCE
-- -----------
-- CREATE OR REPLACE ne lève pas d'erreur si la fonction existe déjà.
-- ============================================================================


-- ============================================================================
-- FONCTION 1 : calculate_recipe_nutrition
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_recipe_nutrition(recipe_id_param INTEGER)
RETURNS TABLE (
    nutrient_name    TEXT,
    value_per_serving NUMERIC,
    unit             TEXT,
    value_total      NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    cooking_method_var TEXT;
    servings_var       INTEGER;
    v_unknown_units    TEXT;
BEGIN
    -- ------------------------------------------------------------------
    -- Pré-vérification : unités non reconnues (traitement en grammes par
    -- défaut avec avertissement observable dans pg_logs)
    -- ------------------------------------------------------------------
    SELECT string_agg(DISTINCT ri.unit, ', ' ORDER BY ri.unit)
    INTO v_unknown_units
    FROM recipe_ingredients ri
    WHERE ri.recipe_id = recipe_id_param
      AND (ri.canonical_food_id IS NOT NULL OR ri.archetype_id IS NOT NULL)
      AND LOWER(TRIM(ri.unit)) NOT IN (
        -- masse
        'g', 'gr', 'gram', 'gramme', 'grammes',
        'kg', 'kilo', 'kilos', 'kilogramme', 'kilogrammes', 'kilogram', 'kilograms',
        'mg', 'milligramme', 'milligrammes', 'milligram', 'milligrams',
        -- volume
        'ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters',
        'cl', 'centilitre', 'centilitres', 'centiliter', 'centiliters',
        'l', 'litre', 'litres', 'liter', 'liters',
        -- dénombrement
        'pièce', 'piece', 'pièces', 'pieces', 'pcs', 'pc',
        'u', 'unite', 'unité', 'unités', 'unites', 'unit', 'units'
      );

    IF v_unknown_units IS NOT NULL THEN
        RAISE WARNING
            'calculate_recipe_nutrition(recipe_id=%): unités non reconnues traitées comme grammes : [%]',
            recipe_id_param, v_unknown_units;
    END IF;

    -- ------------------------------------------------------------------
    -- Récupérer méthode de cuisson et nombre de portions
    -- ------------------------------------------------------------------
    SELECT
        COALESCE(LOWER(r.cooking_method), 'cru'),
        COALESCE(r.servings, 1)
    INTO cooking_method_var, servings_var
    FROM recipes r
    WHERE r.id = recipe_id_param;

    -- La variable reste NULL si aucune ligne n'est retournée (recette inexistante)
    IF cooking_method_var IS NULL THEN
        RAISE EXCEPTION 'calculate_recipe_nutrition : recette % introuvable', recipe_id_param;
    END IF;

    -- ------------------------------------------------------------------
    -- Calcul principal
    -- ------------------------------------------------------------------
    RETURN QUERY
    WITH ingredient_base AS (
        -- Récupère pour chaque ingrédient : nutrition de référence, process,
        -- et convertit la quantité en grammes selon l'unité.
        SELECT
            ri.quantity,
            ri.unit,
            ri.archetype_id,
            a.process AS archetype_process,
            cf.canonical_name,
            -- Précédence : override CIQUAL spécifique > nutrition canonique
            COALESCE(ano.nutrition_id, cf.nutrition_id) AS nutrition_id_to_use,
            -- Conversion quantity → grammes
            -- Volume : densité depuis archétype ou canonical_food, fallback eau (1.0 g/ml)
            -- Dénombrement : poids/pièce depuis archétype ou canonical_food, fallback 100 g
            CASE
                WHEN LOWER(TRIM(ri.unit)) IN (
                    'kg', 'kilo', 'kilos', 'kilogramme', 'kilogrammes',
                    'kilogram', 'kilograms'
                )
                    THEN ri.quantity * 1000.0
                WHEN LOWER(TRIM(ri.unit)) IN (
                    'mg', 'milligramme', 'milligrammes',
                    'milligram', 'milligrams'
                )
                    THEN ri.quantity * 0.001
                WHEN LOWER(TRIM(ri.unit)) IN (
                    'ml', 'millilitre', 'millilitres',
                    'milliliter', 'milliliters'
                )
                    THEN ri.quantity
                          * COALESCE(a.density_g_per_ml, cf.density_g_per_ml, 1.0)
                WHEN LOWER(TRIM(ri.unit)) IN (
                    'cl', 'centilitre', 'centilitres',
                    'centiliter', 'centiliters'
                )
                    THEN ri.quantity * 10.0
                          * COALESCE(a.density_g_per_ml, cf.density_g_per_ml, 1.0)
                WHEN LOWER(TRIM(ri.unit)) IN (
                    'l', 'litre', 'litres', 'liter', 'liters'
                )
                    THEN ri.quantity * 1000.0
                          * COALESCE(a.density_g_per_ml, cf.density_g_per_ml, 1.0)
                WHEN LOWER(TRIM(ri.unit)) IN (
                    'pièce', 'piece', 'pièces', 'pieces', 'pcs', 'pc',
                    'u', 'unite', 'unité', 'unités', 'unites', 'unit', 'units'
                )
                    -- archetypes.grams_per_unit prime sur canonical_foods.unit_weight_grams
                    -- Fallback 100 g (valeur neutre ; émettez une demande d'enrichissement
                    -- si des ingrédients comptés manquent cette donnée)
                    THEN ri.quantity
                          * COALESCE(a.grams_per_unit, cf.unit_weight_grams, 100.0)
                ELSE
                    -- g, gr, gram, gramme, grammes + unités inconnues → traités en grammes
                    ri.quantity
            END AS quantity_g
        FROM recipe_ingredients ri
        LEFT JOIN archetypes a
               ON a.id = ri.archetype_id
        LEFT JOIN canonical_foods cf
               ON cf.id = COALESCE(ri.canonical_food_id, a.canonical_food_id)
        LEFT JOIN archetype_nutrition_overrides ano
               ON ano.archetype_id = a.id
        WHERE ri.recipe_id = recipe_id_param
          AND (ri.canonical_food_id IS NOT NULL OR ri.archetype_id IS NOT NULL)
    ),
    process_factors AS (
        -- Modificateurs de process (ex. séchage ×8, concentration ×2.5)
        -- On ne garde que les facteurs MULTIPLICATION.
        -- DISTINCT ON résout les conflits : facteur de priorité la plus haute gagne.
        SELECT DISTINCT ON (ib.archetype_id, pnm.nutrient_name)
            ib.archetype_id,
            pnm.nutrient_name AS nutrient,
            pnm.factor_value
        FROM ingredient_base ib
        JOIN process_nutrition_modifiers pnm
             ON ib.archetype_process IS NOT NULL
            AND ib.archetype_process ~* pnm.process_pattern
            AND pnm.factor_type = 'MULTIPLICATION'
        ORDER BY ib.archetype_id, pnm.nutrient_name, pnm.priority DESC
    ),
    ingredient_nutrition AS (
        -- Calcul macros par ingrédient : (valeur_100g × facteur_process) × (quantity_g / 100)
        SELECT
            ib.quantity_g,
            ib.canonical_name,
            ib.archetype_id,
            COALESCE(nd.calories_kcal, 0)
                * COALESCE(
                    (SELECT pf.factor_value FROM process_factors pf
                     WHERE pf.archetype_id = ib.archetype_id
                       AND pf.nutrient = 'calories'), 1.0)
                * (ib.quantity_g / 100.0) AS ingredient_calories,
            COALESCE(nd.proteines_g, 0)
                * COALESCE(
                    (SELECT pf.factor_value FROM process_factors pf
                     WHERE pf.archetype_id = ib.archetype_id
                       AND pf.nutrient = 'proteines'), 1.0)
                * (ib.quantity_g / 100.0) AS ingredient_proteines,
            COALESCE(nd.glucides_g, 0)
                * COALESCE(
                    (SELECT pf.factor_value FROM process_factors pf
                     WHERE pf.archetype_id = ib.archetype_id
                       AND pf.nutrient = 'glucides'), 1.0)
                * (ib.quantity_g / 100.0) AS ingredient_glucides,
            COALESCE(nd.lipides_g, 0)
                * COALESCE(
                    (SELECT pf.factor_value FROM process_factors pf
                     WHERE pf.archetype_id = ib.archetype_id
                       AND pf.nutrient = 'lipides'), 1.0)
                * (ib.quantity_g / 100.0) AS ingredient_lipides
        FROM ingredient_base ib
        LEFT JOIN nutritional_data nd ON nd.id = ib.nutrition_id_to_use
    ),
    raw_totals AS (
        -- Totaux bruts avant application des coefficients de cuisson
        SELECT
            SUM(ingredient_calories)  AS total_calories_raw,
            SUM(ingredient_proteines) AS total_proteines_raw,
            SUM(ingredient_glucides)  AS total_glucides_raw,
            SUM(ingredient_lipides)   AS total_lipides_raw
        FROM ingredient_nutrition
    ),
    cooking_factors AS (
        -- Coefficients de rétention / multiplication liés à la méthode de cuisson
        SELECT
            cnf.nutrient_name AS nutrient,
            cnf.factor_type,
            cnf.factor_value
        FROM cooking_nutrition_factors cnf
        WHERE LOWER(cnf.cooking_method) = cooking_method_var
    ),
    adjusted_totals AS (
        -- Application des cooking factors :
        --   calories   → stables (pas de facteur défini dans le schéma actuel)
        --   protéines  → facteur RETENTION si défini, sinon 1.0
        --   glucides   → facteur RETENTION si défini, sinon 1.0
        --   lipides    → facteur MULTIPLICATION (friture) s'il existe,
        --                sinon RETENTION, sinon 1.0
        SELECT
            rt.total_calories_raw AS total_calories,
            rt.total_proteines_raw
                * COALESCE(
                    (SELECT cf.factor_value FROM cooking_factors cf
                     WHERE cf.nutrient = 'proteines'
                       AND cf.factor_type = 'RETENTION'), 1.0)
                AS total_proteines,
            rt.total_glucides_raw
                * COALESCE(
                    (SELECT cf.factor_value FROM cooking_factors cf
                     WHERE cf.nutrient = 'glucides'
                       AND cf.factor_type = 'RETENTION'), 1.0)
                AS total_glucides,
            CASE
                WHEN EXISTS (
                    SELECT 1 FROM cooking_factors cf
                    WHERE cf.nutrient = 'lipides'
                      AND cf.factor_type = 'MULTIPLICATION'
                )
                THEN rt.total_lipides_raw
                     * (SELECT cf.factor_value FROM cooking_factors cf
                        WHERE cf.nutrient = 'lipides'
                          AND cf.factor_type = 'MULTIPLICATION')
                ELSE rt.total_lipides_raw
                     * COALESCE(
                         (SELECT cf.factor_value FROM cooking_factors cf
                          WHERE cf.nutrient = 'lipides'
                            AND cf.factor_type = 'RETENTION'), 1.0)
            END AS total_lipides
        FROM raw_totals rt
    )
    -- Résultats en format long : 4 lignes (une par macro), arrondi 1 décimale
    SELECT 'Calories'::TEXT,
           ROUND((at.total_calories  / servings_var)::NUMERIC, 1),
           'kcal'::TEXT,
           ROUND(at.total_calories::NUMERIC, 1)
    FROM adjusted_totals at
    UNION ALL
    SELECT 'Protéines'::TEXT,
           ROUND((at.total_proteines / servings_var)::NUMERIC, 1),
           'g'::TEXT,
           ROUND(at.total_proteines::NUMERIC, 1)
    FROM adjusted_totals at
    UNION ALL
    SELECT 'Glucides'::TEXT,
           ROUND((at.total_glucides  / servings_var)::NUMERIC, 1),
           'g'::TEXT,
           ROUND(at.total_glucides::NUMERIC, 1)
    FROM adjusted_totals at
    UNION ALL
    SELECT 'Lipides'::TEXT,
           ROUND((at.total_lipides   / servings_var)::NUMERIC, 1),
           'g'::TEXT,
           ROUND(at.total_lipides::NUMERIC, 1)
    FROM adjusted_totals at;

EXCEPTION
    WHEN OTHERS THEN
        -- Non bloquant : retourne un ensemble vide (les appelants JS testent is null)
        -- Mais l'erreur est maintenant observable en pg_logs (audit §M4)
        RAISE WARNING
            'calculate_recipe_nutrition(recipe_id=%): % (SQLSTATE %)',
            recipe_id_param, SQLERRM, SQLSTATE;
        RETURN;

END;
$$;

COMMENT ON FUNCTION public.calculate_recipe_nutrition(INTEGER) IS
'Calcule les macronutriments d''une recette (Calories/Protéines/Glucides/Lipides)
en format long (4 lignes), par portion et en total.

Source canonique depuis migration 20260708_nutrition_functions_consolidated.sql.
Supersède : tools/create_nutrition_function.sql (v1, sans process modifiers),
            tools/create_nutrition_function_v2.sql (v2, bug nommage cooking_factors),
            tools/fix_function.sql et tools/fix_function_v2.sql (debug sans exception).

Ordre d''application :
  1. Nutrition de base (archetype_nutrition_overrides > canonical_foods.nutrition_id)
  2. Process modifiers (archetypes.process ~* process_pattern, facteur MULTIPLICATION)
  3. Cooking factors (cooking_nutrition_factors, RETENTION ou MULTIPLICATION)

Conversion d''unités :
  g/kg/mg → masse directe
  ml/cl/l → × density_g_per_ml (archétype → canonical → fallback 1.0)
  pièce/u  → × grams_per_unit (archétype → canonical → fallback 100 g)
  inconnu  → traité en grammes + RAISE WARNING observable dans pg_logs

Erreurs : RAISE WARNING + RETURN ensemble vide (non bloquant).

Usage : SELECT * FROM calculate_recipe_nutrition(9401);';


-- ============================================================================
-- FONCTION 2 : calculate_and_cache_nutrition
-- ============================================================================
-- Shape de retour inchangée par rapport à tools/create_cache_function.sql :
-- (rec_id, calories_per_serving, calories_total, proteines_per_serving,
--  proteines_total, glucides_per_serving, glucides_total,
--  lipides_per_serving, lipides_total)
-- C'est le format attendu par lib/recipePreciseNutrition.js (audit §C4).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_and_cache_nutrition(recipe_id_param INTEGER)
RETURNS TABLE (
    rec_id                BIGINT,
    calories_per_serving  NUMERIC,
    calories_total        NUMERIC,
    proteines_per_serving NUMERIC,
    proteines_total       NUMERIC,
    glucides_per_serving  NUMERIC,
    glucides_total        NUMERIC,
    lipides_per_serving   NUMERIC,
    lipides_total         NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_calories_per_serving  NUMERIC;
    v_calories_total        NUMERIC;
    v_proteines_per_serving NUMERIC;
    v_proteines_total       NUMERIC;
    v_glucides_per_serving  NUMERIC;
    v_glucides_total        NUMERIC;
    v_lipides_per_serving   NUMERIC;
    v_lipides_total         NUMERIC;
    v_servings              INTEGER;
    v_cooking_method        VARCHAR;
    v_ingredients_hash      TEXT;
BEGIN
    -- ------------------------------------------------------------------
    -- Métadonnées de la recette
    -- ------------------------------------------------------------------
    SELECT COALESCE(r.servings, 1), r.cooking_method
    INTO v_servings, v_cooking_method
    FROM recipes r
    WHERE r.id = recipe_id_param;

    -- ------------------------------------------------------------------
    -- Hash des ingrédients (pour traçabilité et invalidation future)
    -- Stocké dans recipe_nutrition_cache.ingredients_hash
    -- ------------------------------------------------------------------
    SELECT md5(
        string_agg(
            ri.id::text || ':' || ri.quantity::text || ':' || ri.unit,
            ',' ORDER BY ri.id
        )
    )
    INTO v_ingredients_hash
    FROM recipe_ingredients ri
    WHERE ri.recipe_id = recipe_id_param;

    -- ------------------------------------------------------------------
    -- Pivotement : format long → format large
    -- calculate_recipe_nutrition retourne 4 lignes (une par macro) ;
    -- on les pivote ici via MAX(CASE WHEN) pour obtenir 1 ligne 8 colonnes.
    -- ------------------------------------------------------------------
    SELECT
        MAX(CASE WHEN n.nutrient_name = 'Calories'  THEN n.value_per_serving END),
        MAX(CASE WHEN n.nutrient_name = 'Calories'  THEN n.value_total       END),
        MAX(CASE WHEN n.nutrient_name = 'Protéines' THEN n.value_per_serving END),
        MAX(CASE WHEN n.nutrient_name = 'Protéines' THEN n.value_total       END),
        MAX(CASE WHEN n.nutrient_name = 'Glucides'  THEN n.value_per_serving END),
        MAX(CASE WHEN n.nutrient_name = 'Glucides'  THEN n.value_total       END),
        MAX(CASE WHEN n.nutrient_name = 'Lipides'   THEN n.value_per_serving END),
        MAX(CASE WHEN n.nutrient_name = 'Lipides'   THEN n.value_total       END)
    INTO
        v_calories_per_serving,  v_calories_total,
        v_proteines_per_serving, v_proteines_total,
        v_glucides_per_serving,  v_glucides_total,
        v_lipides_per_serving,   v_lipides_total
    FROM public.calculate_recipe_nutrition(recipe_id_param) n;

    -- ------------------------------------------------------------------
    -- Mise en cache : upsert sur recipe_id (PK de recipe_nutrition_cache)
    -- ------------------------------------------------------------------
    INSERT INTO public.recipe_nutrition_cache (
        recipe_id,
        servings,
        cooking_method,
        calories_per_serving,
        calories_total,
        proteines_per_serving,
        proteines_total,
        glucides_per_serving,
        glucides_total,
        lipides_per_serving,
        lipides_total,
        ingredients_hash,
        calculated_at
    ) VALUES (
        recipe_id_param,
        v_servings,
        v_cooking_method,
        v_calories_per_serving,
        v_calories_total,
        v_proteines_per_serving,
        v_proteines_total,
        v_glucides_per_serving,
        v_glucides_total,
        v_lipides_per_serving,
        v_lipides_total,
        v_ingredients_hash,
        NOW()
    )
    ON CONFLICT (recipe_id) DO UPDATE SET
        servings              = EXCLUDED.servings,
        cooking_method        = EXCLUDED.cooking_method,
        calories_per_serving  = EXCLUDED.calories_per_serving,
        calories_total        = EXCLUDED.calories_total,
        proteines_per_serving = EXCLUDED.proteines_per_serving,
        proteines_total       = EXCLUDED.proteines_total,
        glucides_per_serving  = EXCLUDED.glucides_per_serving,
        glucides_total        = EXCLUDED.glucides_total,
        lipides_per_serving   = EXCLUDED.lipides_per_serving,
        lipides_total         = EXCLUDED.lipides_total,
        ingredients_hash      = EXCLUDED.ingredients_hash,
        calculated_at         = EXCLUDED.calculated_at;

    -- ------------------------------------------------------------------
    -- Retourner les données mises en cache (shape exacte attendue par JS)
    -- ------------------------------------------------------------------
    RETURN QUERY
    SELECT
        rnc.recipe_id::BIGINT  AS rec_id,
        rnc.calories_per_serving,
        rnc.calories_total,
        rnc.proteines_per_serving,
        rnc.proteines_total,
        rnc.glucides_per_serving,
        rnc.glucides_total,
        rnc.lipides_per_serving,
        rnc.lipides_total
    FROM public.recipe_nutrition_cache rnc
    WHERE rnc.recipe_id = recipe_id_param;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING
            'calculate_and_cache_nutrition(recipe_id=%): % (SQLSTATE %)',
            recipe_id_param, SQLERRM, SQLSTATE;
        RETURN;

END;
$$;

COMMENT ON FUNCTION public.calculate_and_cache_nutrition(INTEGER) IS
'Calcule les macronutriments d''une recette, les met en cache dans
recipe_nutrition_cache (upsert), et retourne le résultat en format large
(1 ligne, 8 colonnes) tel qu''attendu par lib/recipePreciseNutrition.js.

Shape de retour inchangée depuis tools/create_cache_function.sql :
  rec_id, calories_per_serving, calories_total,
  proteines_per_serving, proteines_total,
  glucides_per_serving, glucides_total,
  lipides_per_serving, lipides_total

Appelle calculate_recipe_nutrition() en interne puis pivote le résultat.
Stocke également ingredients_hash (md5 des lignes recipe_ingredients).

Source canonique depuis migration 20260708_nutrition_functions_consolidated.sql.
Supersède : tools/create_cache_function.sql

Usage : SELECT * FROM calculate_and_cache_nutrition(9401);';


-- ============================================================================
-- Vérification (informatif)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('calculate_recipe_nutrition', 'calculate_and_cache_nutrition')
  ) THEN
    RAISE NOTICE 'Migration 20260708_nutrition_functions_consolidated : fonctions installées.';
  END IF;
END $$;
