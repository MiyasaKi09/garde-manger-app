-- ============================================================================
-- Correctif — interdits alimentaires à frontières de mots (incident 24/07)
-- ============================================================================
-- Le garde-fou forbidden_food_in_final_demand de publish_canonical_final_
-- demand_plan (20260721195504) matchait par sous-chaînes (strpos) : l'interdit
-- « veau » bannissait « navet nouveau cru » et « oignon nouveau frais » — des
-- ingrédients désormais autorisés par le pré-filtre JS corrigé
-- (lib/domain/planning/foodBanMatch.js), donc la publication échouait en 500.
--
-- Cette migration introduit planning_food_ban_matches — le MIROIR SQL exact du
-- matcher JS : pliage (accents/casse/ponctuation), dépluralisation française
-- simple (« s »/« x » final retiré si le radical garde ≥ 4 lettres), puis la
-- séquence de mots de l'interdit doit apparaître d'un bloc dans le nom de
-- l'aliment. « veau » matche « épaule de veau crue » mais ni « eau » ni
-- « navet nouveau cru » ; « poireau » matche « poireaux » ; « maïs » ne
-- matche pas « mai ». Toute évolution doit être portée des deux côtés.
-- Idempotent (CREATE OR REPLACE), aucune donnée modifiée, rollback fourni.
-- ============================================================================

-- Pliage : minuscules, œ/æ décomposés, accents retirés, ponctuation → espaces.
CREATE OR REPLACE FUNCTION public.planning_food_ban_fold(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(regexp_replace(
    translate(
      replace(replace(lower(coalesce(p_value, '')), 'œ', 'oe'), 'æ', 'ae'),
      'àâäáãéèêëíîïìòóôöõúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn'
    ),
    '[^a-z0-9]+', ' ', 'g'
  ))
$$;

-- Vrai ssi la séquence de mots de p_term apparaît d'un bloc dans p_form,
-- avec dépluralisation mot à mot (« s »/« x » final, radical ≥ 4 lettres).
-- Un interdit vide ne matche jamais.
CREATE OR REPLACE FUNCTION public.planning_food_ban_matches(p_form text, p_term text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  WITH dep AS (
    SELECT
      (SELECT string_agg(CASE WHEN length(t.w) >= 5 AND t.w ~ '[sx]$' THEN left(t.w, -1) ELSE t.w END, ' ' ORDER BY t.ord)
       FROM unnest(string_to_array(public.planning_food_ban_fold(p_form), ' ')) WITH ORDINALITY AS t(w, ord)
       WHERE t.w <> '') AS form_dep,
      (SELECT string_agg(CASE WHEN length(t.w) >= 5 AND t.w ~ '[sx]$' THEN left(t.w, -1) ELSE t.w END, ' ' ORDER BY t.ord)
       FROM unnest(string_to_array(public.planning_food_ban_fold(p_term), ' ')) WITH ORDINALITY AS t(w, ord)
       WHERE t.w <> '') AS term_dep
  )
  SELECT COALESCE(
    dep.term_dep <> ''
    AND position(' ' || dep.term_dep || ' ' IN ' ' || COALESCE(dep.form_dep, '') || ' ') > 0,
    false
  )
  FROM dep
$$;

GRANT EXECUTE ON FUNCTION public.planning_food_ban_fold(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.planning_food_ban_matches(text, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.planning_food_ban_matches(text, text) IS
  'Correspondance interdit alimentaire → aliment à frontières de mots, miroir de
   lib/domain/planning/foodBanMatch.js (pliage + dépluralisation s/x radical ≥ 4).';

CREATE OR REPLACE FUNCTION public.publish_canonical_final_demand_plan(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_result jsonb;
  v_import_id bigint;
  v_version_id uuid;
  v_execution jsonb;
  v_slot jsonb;
  v_meal jsonb;
  v_demand jsonb;
  v_item jsonb;
  v_task jsonb;
  v_production jsonb;
  v_slot_id uuid;
  v_execution_id uuid;
  v_execution_map jsonb := '{}'::jsonb;
  v_expected integer;
  v_actual integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;
  IF jsonb_typeof(p_payload) <> 'object'
     OR jsonb_array_length(COALESCE(p_payload->'planned_demands', '[]'::jsonb)) NOT BETWEEN 1 AND 400 THEN
    RAISE EXCEPTION 'invalid_final_demand_payload';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_payload->'recipe_executions', '[]'::jsonb)) e
    GROUP BY e.value->>'execution_key'
    HAVING NULLIF(e.value->>'execution_key', '') IS NULL OR count(*) > 1
  ) THEN
    RAISE EXCEPTION 'execution_key_missing_or_duplicate';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_payload->'recipe_executions', '[]'::jsonb)) e
    WHERE abs(
      COALESCE((e.value->>'servings')::numeric, 0)
      - COALESCE((
        SELECT sum((d.value->>'requested_servings')::numeric)
        FROM jsonb_array_elements(COALESCE(p_payload->'planned_demands', '[]'::jsonb)) d
        WHERE d.value->>'execution_key' = e.value->>'execution_key'
      ), 0)
    ) > 0.001
  ) THEN
    RAISE EXCEPTION 'execution_demand_servings_mismatch';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_payload->'shopping_items', '[]'::jsonb)) i
    WHERE COALESCE((i.value->>'purchase_qty')::numeric, 0)
          + 0.001 < COALESCE((i.value->>'exact_required_qty')::numeric, 0)
       OR abs(
         COALESCE((i.value->>'projected_surplus_qty')::numeric, 0)
         - greatest(0, COALESCE((i.value->>'purchase_qty')::numeric, 0)
           - COALESCE((i.value->>'exact_required_qty')::numeric, 0))
       ) > 0.001
  ) THEN
    RAISE EXCEPTION 'physical_purchase_decision_invalid';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_payload->'shopping_items', '[]'::jsonb)) i
    WHERE abs(
      COALESCE((i.value->>'required_qty')::numeric, 0)
      - COALESCE((i.value->>'stock_qty')::numeric, 0)
      - COALESCE((i.value->>'exact_required_qty')::numeric, 0)
    ) > 0.001
  ) THEN
    RAISE EXCEPTION 'shopping_resource_balance_invalid';
  END IF;

  -- Le RPC P4 puis toutes les corrections V5 s'exécutent dans la transaction
  -- de l'appel PostgREST. Une erreur d'invariant annule l'ensemble.
  v_result := public.publish_canonical_closed_loop_plan(p_payload);
  v_import_id := (v_result->>'import_id')::bigint;
  v_version_id := (v_result->>'plan_version_id')::uuid;

  FOR v_execution IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_payload->'recipe_executions', '[]'::jsonb))
    ORDER BY value->>'execution_key'
  LOOP
    SELECT id INTO v_execution_id
    FROM culinary.recipe_executions
    WHERE user_id = v_uid
      AND content_hash = v_execution->>'content_hash';
    IF v_execution_id IS NULL THEN
      RAISE EXCEPTION 'final_execution_missing: %', v_execution->>'execution_key';
    END IF;
    v_execution_map := jsonb_set(
      v_execution_map,
      ARRAY[v_execution->>'execution_key'],
      to_jsonb(v_execution_id::text),
      true
    );
  END LOOP;

  FOR v_slot IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'slots', '[]'::jsonb))
  LOOP
    v_execution_id := NULLIF(v_execution_map->>(v_slot->>'execution_key'), '')::uuid;
    UPDATE public.meal_plan_slots
    SET execution_key = NULLIF(v_slot->>'execution_key', ''),
        recipe_execution_id = v_execution_id
    WHERE plan_version_id = v_version_id
      AND slot_key = v_slot->>'slot_key';

    IF NULLIF(v_slot->>'cooked_dish_id', '') IS NOT NULL THEN
      UPDATE public.cooked_dishes
      SET canonical_recipe_code = COALESCE(canonical_recipe_code, NULLIF(v_slot->>'recipe_code', '')),
          canonical_recipe_execution_id = COALESCE(canonical_recipe_execution_id, v_execution_id),
          source_plan_version_id = COALESCE(source_plan_version_id, v_version_id)
      WHERE id = (v_slot->>'cooked_dish_id')::bigint
        AND user_id = v_uid;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM public.meal_plan_slots
    WHERE plan_version_id = v_version_id
      AND source IS DISTINCT FROM 'support'
      AND recipe_execution_id IS NULL
  ) THEN
    RAISE EXCEPTION 'final_slot_execution_mapping_incomplete';
  END IF;

  -- Le P4 fait un upsert. On retire explicitement les anciennes prises qui ne
  -- font plus partie de la grille (préférence petit-déjeuner/collation changée).
  DELETE FROM public.nutrition_plan_meals m
  WHERE m.import_id = v_import_id
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(p_payload->'legacy_meals', '[]'::jsonb)) e
      WHERE e.value->>'person_name' = m.person_name
        AND (e.value->>'meal_date')::date = m.meal_date
        AND e.value->>'meal_type' = m.meal_type
    );

  FOR v_meal IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'legacy_meals', '[]'::jsonb))
  LOOP
    v_execution_id := NULLIF(v_execution_map->>(v_meal->>'execution_key'), '')::uuid;
    UPDATE public.nutrition_plan_meals
    SET household_member_id = NULLIF(v_meal->>'household_member_id', '')::uuid,
        short_label = NULLIF(v_meal->>'short_label', ''),
        canonical_recipe_code = NULLIF(v_meal->>'canonical_recipe_code', ''),
        canonical_recipe_execution_id = v_execution_id,
        variant_kind = NULLIF(v_meal->>'variant_kind', ''),
        portion_details = COALESCE(v_meal->'portion_details', '{}'::jsonb),
        target_snapshot = COALESCE(v_meal->'target_snapshot', '{}'::jsonb),
        demand_key = NULLIF(v_meal->>'demand_key', ''),
        execution_key = NULLIF(v_meal->>'execution_key', ''),
        constraints_snapshot = COALESCE(v_meal->'constraints_snapshot', '{}'::jsonb),
        planning_status = COALESCE(NULLIF(v_meal->>'planning_status', ''), 'planned'),
        micronutrients = COALESCE(v_meal->'micronutrients', '{}'::jsonb),
        locked = COALESCE((v_meal->>'locked')::boolean, false)
    WHERE import_id = v_import_id
      AND person_name = v_meal->>'person_name'
      AND meal_date = (v_meal->>'meal_date')::date
      AND meal_type = v_meal->>'meal_type';
  END LOOP;

  FOR v_demand IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'planned_demands', '[]'::jsonb))
  LOOP
    SELECT id INTO v_slot_id
    FROM public.meal_plan_slots
    WHERE plan_version_id = v_version_id
      AND slot_key = v_demand->>'slot_key';
    v_execution_id := NULLIF(v_execution_map->>(v_demand->>'execution_key'), '')::uuid;
    IF v_slot_id IS NULL THEN
      RAISE EXCEPTION 'final_demand_slot_missing: %', v_demand->>'demand_key';
    END IF;
    IF NULLIF(v_demand->>'recipe_code', '') IS NOT NULL AND v_execution_id IS NULL THEN
      RAISE EXCEPTION 'final_demand_execution_missing: %', v_demand->>'demand_key';
    END IF;

    INSERT INTO public.planned_demands (
      user_id, plan_version_id, slot_id, recipe_execution_id,
      household_member_id, demand_key, execution_key, person_name,
      meal_date, meal_type, recipe_code, requested_servings,
      source_type, source_id, nutritional_target, constraints_snapshot,
      nutrition, support_items, status
    ) VALUES (
      v_uid, v_version_id, v_slot_id, v_execution_id,
      NULLIF(v_demand->>'household_member_id', '')::uuid,
      v_demand->>'demand_key', NULLIF(v_demand->>'execution_key', ''),
      NULLIF(v_demand->>'person_name', ''),
      (v_demand->>'meal_date')::date, v_demand->>'meal_type',
      NULLIF(v_demand->>'recipe_code', ''),
      (v_demand->>'requested_servings')::numeric,
      v_demand->>'source_type', NULLIF(v_demand->>'source_id', ''),
      COALESCE(v_demand->'nutritional_target', '{}'::jsonb),
      COALESCE(v_demand->'constraints_snapshot', '{}'::jsonb),
      COALESCE(v_demand->'nutrition', '{}'::jsonb),
      COALESCE(v_demand->'support_items', '[]'::jsonb),
      COALESCE(NULLIF(v_demand->>'status', ''), 'planned')
    );
  END LOOP;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'shopping_items', '[]'::jsonb))
  LOOP
    UPDATE public.nutrition_plan_shopping_items
    SET container_qty = NULLIF(v_item->>'container_qty', '')::integer,
        container_size = NULLIF(v_item->>'container_size', '')::numeric,
        container_unit = NULLIF(v_item->>'container_unit', ''),
        exact_required_qty = NULLIF(v_item->>'exact_required_qty', '')::numeric,
        projected_surplus_qty = COALESCE(NULLIF(v_item->>'projected_surplus_qty', '')::numeric, 0),
        purchase_decision = COALESCE(v_item->'purchase_decision', '{}'::jsonb),
        planning_source = 'final_demands'
    WHERE plan_version_id = v_version_id
      AND product_name = v_item->>'product_name';
  END LOOP;

  FOR v_production IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'productions', '[]'::jsonb))
  LOOP
    UPDATE public.planned_productions
    SET recipe_execution_id = NULLIF(v_execution_map->>(v_production->>'execution_key'), '')::uuid
    WHERE plan_version_id = v_version_id
      AND production_key = v_production->>'production_key';
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.planned_productions p
    WHERE p.plan_version_id = v_version_id
      AND abs(
        p.planned_portions
        - COALESCE((
          SELECT sum(d.requested_servings)
          FROM public.planned_demands d
          WHERE d.plan_version_id = v_version_id
            AND d.source_id = p.production_key
            AND d.source_type IN ('planned_production', 'future_buffer')
        ), 0)
      ) > 0.011
  ) THEN
    RAISE EXCEPTION 'production_final_demand_portions_mismatch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.planned_demands d
    JOIN culinary.recipe_executions e ON e.id = d.recipe_execution_id
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e.exact_ingredients_snapshot, '[]'::jsonb)) ingredient(value)
    CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(d.constraints_snapshot->'forbiddenForms', '[]'::jsonb)) forbidden(value)
    WHERE d.plan_version_id = v_version_id
      AND btrim(forbidden.value) <> ''
      -- Correspondance à frontières de mots (miroir de lib/domain/planning/foodBanMatch.js) :
      -- l'ancien matching par sous-chaînes bannissait « navet nouveau cru » et
      -- « oignon nouveau frais » via l'interdit « veau » (publication en échec 500).
      AND public.planning_food_ban_matches(
        COALESCE(ingredient.value->>'formNormalized', ingredient.value->>'form_normalized', ingredient.value->>'name', ''),
        forbidden.value
      )
  ) THEN
    RAISE EXCEPTION 'forbidden_food_in_final_demand';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.planned_demands d
    JOIN culinary.recipe_executions e ON e.id = d.recipe_execution_id
    CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(e.selected_configuration->'allergens', '[]'::jsonb)) recipe_allergen(value)
    CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(d.constraints_snapshot->'allergens', '[]'::jsonb)) blocked_allergen(value)
    WHERE d.plan_version_id = v_version_id
      AND lower(recipe_allergen.value) = lower(blocked_allergen.value)
  ) THEN
    RAISE EXCEPTION 'allergen_in_final_demand';
  END IF;

  FOR v_task IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'tasks', '[]'::jsonb))
  LOOP
    IF COALESCE((v_task->>'done')::boolean, false) THEN
      UPDATE public.nutrition_plan_prep_tasks
      SET done = true,
          done_at = COALESCE(done_at, now()),
          workflow_status = 'done'
      WHERE plan_version_id = v_version_id
        AND stable_key = v_task->>'task_key';
    END IF;
  END LOOP;

  SELECT jsonb_array_length(COALESCE(p_payload->'planned_demands', '[]'::jsonb)) INTO v_expected;
  SELECT count(*) INTO v_actual FROM public.planned_demands WHERE plan_version_id = v_version_id;
  IF v_actual <> v_expected THEN
    RAISE EXCEPTION 'final_demand_count_mismatch: expected %, actual %', v_expected, v_actual;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.meal_plan_slots s
    WHERE s.plan_version_id = v_version_id
      AND abs(s.servings - COALESCE((
        SELECT sum(d.requested_servings)
        FROM public.planned_demands d
        WHERE d.slot_id = s.id AND d.source_type <> 'future_buffer'
      ), 0)) > 0.011
  ) THEN
    RAISE EXCEPTION 'slot_final_demand_servings_mismatch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.meal_plan_slots s
    WHERE s.plan_version_id = v_version_id
      AND (
        abs(COALESCE((s.nutrition_total->>'kcal')::numeric, 0) - COALESCE((SELECT sum((d.nutrition->>'kcal')::numeric) FROM public.planned_demands d WHERE d.slot_id = s.id AND d.source_type <> 'future_buffer'), 0)) > 0.11
        OR abs(COALESCE((s.nutrition_total->>'proteinG')::numeric, 0) - COALESCE((SELECT sum((d.nutrition->>'proteinG')::numeric) FROM public.planned_demands d WHERE d.slot_id = s.id AND d.source_type <> 'future_buffer'), 0)) > 0.11
        OR abs(COALESCE((s.nutrition_total->>'carbsG')::numeric, 0) - COALESCE((SELECT sum((d.nutrition->>'carbsG')::numeric) FROM public.planned_demands d WHERE d.slot_id = s.id AND d.source_type <> 'future_buffer'), 0)) > 0.11
        OR abs(COALESCE((s.nutrition_total->>'fatG')::numeric, 0) - COALESCE((SELECT sum((d.nutrition->>'fatG')::numeric) FROM public.planned_demands d WHERE d.slot_id = s.id AND d.source_type <> 'future_buffer'), 0)) > 0.11
      )
  ) THEN
    RAISE EXCEPTION 'slot_final_demand_nutrition_mismatch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.inventory_reservations r
    JOIN public.inventory_lots l ON l.id = r.lot_id
    JOIN public.meal_plan_slots s ON s.id = r.slot_id
    WHERE r.plan_version_id = v_version_id
      AND r.status = 'active'
      AND COALESCE(l.adjusted_expiration_date, l.expiration_date) IS NOT NULL
      AND COALESCE(l.adjusted_expiration_date, l.expiration_date) < s.meal_date
  ) THEN
    RAISE EXCEPTION 'reservation_after_lot_expiry';
  END IF;

  RETURN v_result || jsonb_build_object(
    'contract_version', 5,
    'planned_demand_count', v_actual
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.publish_canonical_final_demand_plan(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_canonical_final_demand_plan(jsonb) TO authenticated, service_role;

-- (commit par le wrapper apply-migrations.sh)
