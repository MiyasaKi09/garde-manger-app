-- Vérification de la nutrition d'une recette générée PAR RAPPORT AUX DONNÉES CIQUAL.
-- Produit un rapport (jsonb) calculé en même temps que la nutrition :
--   • couverture CIQUAL : chaque ingrédient quantifié est-il relié à une entrée
--     nutritionnelle (canonique/override) ? Sinon la valeur est sous-estimée.
--   • cohérence 4-4-9 : kcal vs (4·prot + 4·gluc + 9·lip).
--   • plausibilité : kcal/portion dans une fourchette raisonnable, nutrition non nulle.
-- status global : 'ok' | 'warning' | 'error'. Sert au contrôle qualité (UI fiche
-- recette, outil de réparation) pour repérer une nutrition non fiable.
CREATE OR REPLACE FUNCTION public.verify_generated_recipe_nutrition(gen_recipe_id_param bigint)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  n record;
  total int := 0; with_qty int := 0; linked int := 0; with_ciqual int := 0;
  missing text[];
  kcal_macros numeric; coherence numeric;
  issues jsonb := '[]'::jsonb;
  status text := 'ok';
BEGIN
  SELECT * INTO n FROM calculate_generated_recipe_nutrition(gen_recipe_id_param);

  SELECT
    count(*),
    count(*) FILTER (WHERE gri.quantity IS NOT NULL),
    count(*) FILTER (WHERE gri.canonical_food_id IS NOT NULL OR gri.archetype_id IS NOT NULL),
    count(*) FILTER (WHERE gri.quantity IS NOT NULL AND COALESCE(ano.nutrition_id, cf.nutrition_id) IS NOT NULL)
  INTO total, with_qty, linked, with_ciqual
  FROM generated_recipe_ingredients gri
  LEFT JOIN archetypes a ON a.id = gri.archetype_id
  LEFT JOIN canonical_foods cf ON cf.id = COALESCE(gri.canonical_food_id, a.canonical_food_id)
  LEFT JOIN archetype_nutrition_overrides ano ON ano.archetype_id = a.id
  WHERE gri.generated_recipe_id = gen_recipe_id_param;

  -- Ingrédients quantifiés SANS donnée CIQUAL (ne contribuent pas → sous-estimation).
  SELECT array_agg(gri.raw_name ORDER BY gri.id) INTO missing
  FROM generated_recipe_ingredients gri
  LEFT JOIN archetypes a ON a.id = gri.archetype_id
  LEFT JOIN canonical_foods cf ON cf.id = COALESCE(gri.canonical_food_id, a.canonical_food_id)
  LEFT JOIN archetype_nutrition_overrides ano ON ano.archetype_id = a.id
  WHERE gri.generated_recipe_id = gen_recipe_id_param
    AND gri.quantity IS NOT NULL
    AND COALESCE(ano.nutrition_id, cf.nutrition_id) IS NULL;

  kcal_macros := COALESCE(n.protein_g, 0) * 4 + COALESCE(n.carbs_g, 0) * 4 + COALESCE(n.fat_g, 0) * 9;
  IF COALESCE(n.kcal, 0) > 0 THEN
    coherence := round(abs(n.kcal - kcal_macros) / n.kcal * 100, 1);
  END IF;

  IF total = 0 THEN
    issues := issues || jsonb_build_array(jsonb_build_object('level','error','code','no_ingredients','detail','Aucun ingrédient lié'));
    status := 'error';
  END IF;
  IF COALESCE(n.kcal, 0) <= 0 AND total > 0 THEN
    issues := issues || jsonb_build_array(jsonb_build_object('level','error','code','no_nutrition','detail','Nutrition nulle : aucun ingrédient quantifié exploitable'));
    status := 'error';
  END IF;
  IF with_qty > 0 AND with_ciqual < with_qty THEN
    issues := issues || jsonb_build_array(jsonb_build_object(
      'level','warning','code','ciqual_coverage',
      'detail', format('%s/%s ingrédient(s) sans donnée CIQUAL — nutrition sous-estimée', with_qty - with_ciqual, with_qty)));
    IF status <> 'error' THEN status := 'warning'; END IF;
  END IF;
  IF coherence IS NOT NULL AND coherence > 15 THEN
    issues := issues || jsonb_build_array(jsonb_build_object(
      'level','warning','code','macro_incoherent',
      'detail', format('Incohérence macros/calories : écart 4-4-9 de %s%%', coherence)));
    IF status <> 'error' THEN status := 'warning'; END IF;
  END IF;
  IF COALESCE(n.kcal, 0) > 0 AND n.kcal < 80 THEN
    issues := issues || jsonb_build_array(jsonb_build_object('level','warning','code','kcal_low','detail', format('%s kcal/portion : anormalement bas', n.kcal)));
    IF status <> 'error' THEN status := 'warning'; END IF;
  END IF;
  IF COALESCE(n.kcal, 0) > 1600 THEN
    issues := issues || jsonb_build_array(jsonb_build_object('level','warning','code','kcal_high','detail', format('%s kcal/portion : anormalement élevé (ingrédient de cuisson non consommé ?)', n.kcal)));
    IF status <> 'error' THEN status := 'warning'; END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', status,
    'ingredients_total', total,
    'ingredients_with_quantity', with_qty,
    'linked', linked,
    'with_ciqual', with_ciqual,
    'coverage_pct', CASE WHEN with_qty > 0 THEN round(with_ciqual::numeric / with_qty * 100, 0) ELSE NULL END,
    'kcal', n.kcal,
    'kcal_from_macros', round(kcal_macros, 0),
    'coherence_pct', coherence,
    'missing', COALESCE(to_jsonb(missing), '[]'::jsonb),
    'issues', issues,
    'checked_at', now()
  );
END;
$function$;
