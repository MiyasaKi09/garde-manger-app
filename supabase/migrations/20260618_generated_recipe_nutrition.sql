-- Nutrition canonique des recettes générées, dérivée des ingrédients RÉSOLUS
-- (generated_recipe_ingredients → canonical/archetype → CIQUAL), avec overrides
-- d'archétype et modificateurs de process — calque de calculate_recipe_nutrition
-- mais pour generated_recipes. Re-calculable après corrections CIQUAL.
--
-- Contrairement à calculate_recipe_nutrition, les quantités des recettes générées
-- proviennent du parsing de texte libre et portent leur UNITÉ d'origine
-- (g, ml, cl, c. à soupe, pièce, gousse…). On convertit donc chaque ligne en
-- grammes via food_qty_to_grams avant d'appliquer les valeurs CIQUAL (pour 100 g).
-- Retour : valeurs PAR PORTION (servings de la recette, défaut 2).

-- ── Helper : convertit (quantité, unité) en grammes ────────────────────────────
-- Utilise le poids unitaire (unit_weight_grams / grams_per_unit) pour les unités
-- comptables et la densité (g/ml, défaut 1) pour les volumes. Les unités d'aromates
-- (gousse, pincée, feuille…) utilisent des poids forfaitaires standard.
CREATE OR REPLACE FUNCTION public.food_qty_to_grams(
  qty numeric,
  unit text,
  unit_weight_grams numeric,
  density numeric
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT COALESCE(qty, 0) * CASE lower(btrim(COALESCE(unit, 'g')))
    -- masse
    WHEN 'g' THEN 1
    WHEN 'gr' THEN 1
    WHEN 'gramme' THEN 1
    WHEN 'grammes' THEN 1
    WHEN 'kg' THEN 1000
    WHEN 'mg' THEN 0.001
    -- volume (densité, défaut 1 g/ml)
    WHEN 'ml' THEN COALESCE(density, 1)
    WHEN 'cl' THEN 10 * COALESCE(density, 1)
    WHEN 'dl' THEN 100 * COALESCE(density, 1)
    WHEN 'l' THEN 1000 * COALESCE(density, 1)
    -- cuillères (volumes standard)
    WHEN 'c. à soupe' THEN 15 * COALESCE(density, 1)
    WHEN 'cuillère à soupe' THEN 15 * COALESCE(density, 1)
    WHEN 'cuillères à soupe' THEN 15 * COALESCE(density, 1)
    WHEN 'cs' THEN 15 * COALESCE(density, 1)
    WHEN 'c.s.' THEN 15 * COALESCE(density, 1)
    WHEN 'c. à café' THEN 5 * COALESCE(density, 1)
    WHEN 'c. à c.' THEN 5 * COALESCE(density, 1)
    WHEN 'cuillère à café' THEN 5 * COALESCE(density, 1)
    WHEN 'cuillères à café' THEN 5 * COALESCE(density, 1)
    WHEN 'cc' THEN 5 * COALESCE(density, 1)
    -- comptables : poids unitaire fiable (>= 2 g) sinon défaut 60 g. Le garde-fou
    -- « >= 2 » écarte les unit_weight corrompus (riz 0.02, pois chiche 0.4…) qui
    -- ne représentent pas un poids à la pièce.
    WHEN 'pièce' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'pièces' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'piece' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'pieces' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'u' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'unité' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'unités' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'petite' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'petit' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'gros' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    WHEN 'grosse' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 60 END
    -- contenants (poids forfaitaire, indépendant du poids à la pièce)
    WHEN 'rouleau' THEN 230
    WHEN 'bocal' THEN 250
    WHEN 'boîte' THEN 400
    WHEN 'morceau' THEN 30
    WHEN 'cm' THEN 8
    WHEN 'verre' THEN 200 * COALESCE(density, 1)
    WHEN 'tasse' THEN 240 * COALESCE(density, 1)
    -- aromates / petites quantités (impact nutritionnel faible)
    WHEN 'gousse' THEN 5
    WHEN 'gousses' THEN 5
    WHEN 'pincée' THEN 0.4
    WHEN 'pincées' THEN 0.4
    WHEN 'feuille' THEN 2
    WHEN 'feuilles' THEN 2
    WHEN 'branche' THEN 3
    WHEN 'branches' THEN 3
    WHEN 'brin' THEN 2
    WHEN 'brins' THEN 2
    WHEN 'tige' THEN 3
    WHEN 'tiges' THEN 3
    WHEN 'bâton' THEN 5
    WHEN 'bâtons' THEN 5
    WHEN 'botte' THEN 80
    WHEN 'bottes' THEN 80
    WHEN 'bouquet' THEN 30
    WHEN 'petit bouquet' THEN 15
    WHEN 'poignée' THEN 30
    WHEN 'tranche' THEN 25
    WHEN 'tranches' THEN 25
    WHEN 'bulbe' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 150 END
    WHEN 'bulbes' THEN CASE WHEN unit_weight_grams >= 2 THEN unit_weight_grams ELSE 150 END
    WHEN 'sachet' THEN 8
    WHEN 'filet' THEN 5
    WHEN 'filets' THEN 5
    WHEN 'dose' THEN 5
    -- inconnu / vide → supposer grammes
    ELSE 1
  END
$function$;

-- ── Nutrition par portion d'une recette générée ────────────────────────────────
CREATE OR REPLACE FUNCTION public.calculate_generated_recipe_nutrition(gen_recipe_id_param bigint)
RETURNS TABLE(kcal numeric, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  servings_var integer;
BEGIN
  SELECT COALESCE(servings, 2) INTO servings_var FROM generated_recipes WHERE id = gen_recipe_id_param;
  IF servings_var IS NULL OR servings_var < 1 THEN servings_var := 2; END IF;

  RETURN QUERY
  WITH ingredient_base AS (
    SELECT
      food_qty_to_grams(
        gri.quantity,
        gri.unit,
        COALESCE(a.grams_per_unit, cf.unit_weight_grams),
        COALESCE(a.density_g_per_ml, cf.density_g_per_ml)
      ) AS grams,
      gri.archetype_id,
      a.process AS archetype_process,
      COALESCE(ano.nutrition_id, cf.nutrition_id) AS nutrition_id_to_use
    FROM generated_recipe_ingredients gri
    LEFT JOIN archetypes a ON a.id = gri.archetype_id
    LEFT JOIN canonical_foods cf ON cf.id = COALESCE(gri.canonical_food_id, a.canonical_food_id)
    LEFT JOIN archetype_nutrition_overrides ano ON ano.archetype_id = a.id
    WHERE gri.generated_recipe_id = gen_recipe_id_param
      AND gri.quantity IS NOT NULL
  ),
  process_factors AS (
    SELECT DISTINCT ON (ib.archetype_id, pnm.nutrient_name)
      ib.archetype_id,
      pnm.nutrient_name AS nutrient,
      pnm.factor_value
    FROM ingredient_base ib
    JOIN process_nutrition_modifiers pnm
      ON ib.archetype_process ~* pnm.process_pattern
     AND pnm.factor_type::text = 'MULTIPLICATION'
    WHERE ib.archetype_id IS NOT NULL
    ORDER BY ib.archetype_id, pnm.nutrient_name, pnm.priority DESC
  ),
  ing AS (
    SELECT
      COALESCE(nd.calories_kcal, 0) * COALESCE((SELECT pf.factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient = 'calories'), 1.0) * (ib.grams / 100.0) AS kc,
      COALESCE(nd.proteines_g, 0) * COALESCE((SELECT pf.factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient = 'proteines'), 1.0) * (ib.grams / 100.0) AS prot,
      COALESCE(nd.glucides_g, 0)  * COALESCE((SELECT pf.factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient = 'glucides'),  1.0) * (ib.grams / 100.0) AS gluc,
      COALESCE(nd.lipides_g, 0)   * COALESCE((SELECT pf.factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient = 'lipides'),   1.0) * (ib.grams / 100.0) AS lip,
      COALESCE(nd.fibres_g, 0)    * COALESCE((SELECT pf.factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient = 'fibres'),    1.0) * (ib.grams / 100.0) AS fib
    FROM ingredient_base ib
    LEFT JOIN nutritional_data nd ON nd.id = ib.nutrition_id_to_use
  )
  SELECT
    ROUND(COALESCE(SUM(kc), 0) / servings_var, 0),
    ROUND(COALESCE(SUM(prot), 0) / servings_var, 1),
    ROUND(COALESCE(SUM(gluc), 0) / servings_var, 1),
    ROUND(COALESCE(SUM(lip),  0) / servings_var, 1),
    ROUND(COALESCE(SUM(fib),  0) / servings_var, 1)
  FROM ing;
END;
$function$;
