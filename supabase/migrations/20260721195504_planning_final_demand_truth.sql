-- Planning V5 — demandes finales et publication atomique.
-- Toutes les quantités persistées sont dérivées des portions personnelles
-- finales, après variantes et protections de régénération.

ALTER TABLE public.meal_plan_slots
  ADD COLUMN IF NOT EXISTS execution_key text;

ALTER TABLE public.nutrition_plan_meals
  ADD COLUMN IF NOT EXISTS demand_key text,
  ADD COLUMN IF NOT EXISTS execution_key text,
  ADD COLUMN IF NOT EXISTS constraints_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS planning_status text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS micronutrients jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.nutrition_plan_shopping_items
  ADD COLUMN IF NOT EXISTS exact_required_qty numeric(12,3),
  ADD COLUMN IF NOT EXISTS projected_surplus_qty numeric(12,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_decision jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.planned_productions
  ADD COLUMN IF NOT EXISTS recipe_execution_id uuid
    REFERENCES culinary.recipe_executions(id) ON DELETE RESTRICT;

ALTER TABLE public.cooked_dishes
  ADD COLUMN IF NOT EXISTS canonical_recipe_code text,
  ADD COLUMN IF NOT EXISTS canonical_recipe_execution_id uuid
    REFERENCES culinary.recipe_executions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS planned_production_id uuid
    REFERENCES public.planned_productions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_plan_version_id uuid
    REFERENCES public.meal_plan_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.planned_demands (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_version_id       uuid NOT NULL REFERENCES public.meal_plan_versions(id) ON DELETE CASCADE,
  slot_id               uuid NOT NULL REFERENCES public.meal_plan_slots(id) ON DELETE CASCADE,
  recipe_execution_id   uuid REFERENCES culinary.recipe_executions(id) ON DELETE RESTRICT,
  household_member_id   uuid REFERENCES public.household_members(id) ON DELETE SET NULL,
  demand_key            text NOT NULL,
  execution_key         text,
  person_name           text,
  meal_date             date NOT NULL,
  meal_type             text NOT NULL CHECK (meal_type IN ('pdj', 'dejeuner', 'diner', 'collation')),
  recipe_code           text,
  requested_servings    numeric(8,3) NOT NULL CHECK (requested_servings > 0),
  source_type           text NOT NULL CHECK (source_type IN (
    'fresh_recipe', 'planned_production', 'existing_dish', 'support',
    'future_buffer', 'consumed'
  )),
  source_id             text,
  nutritional_target    jsonb NOT NULL DEFAULT '{}'::jsonb,
  constraints_snapshot  jsonb NOT NULL DEFAULT '{}'::jsonb,
  nutrition             jsonb NOT NULL DEFAULT '{}'::jsonb,
  support_items         jsonb NOT NULL DEFAULT '[]'::jsonb,
  status                text NOT NULL DEFAULT 'planned'
                        CHECK (status IN ('planned', 'consumed', 'cancelled')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_version_id, demand_key),
  CHECK (person_name IS NULL OR status = 'consumed' OR requested_servings <= 2)
);

CREATE INDEX IF NOT EXISTS idx_planned_demands_version_slot
  ON public.planned_demands (plan_version_id, slot_id);
CREATE INDEX IF NOT EXISTS idx_planned_demands_execution
  ON public.planned_demands (recipe_execution_id)
  WHERE recipe_execution_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_planned_demands_member_date
  ON public.planned_demands (household_member_id, meal_date)
  WHERE household_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_execution_key
  ON public.meal_plan_slots (plan_version_id, execution_key)
  WHERE execution_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_meals_demand_key
  ON public.nutrition_plan_meals (import_id, demand_key)
  WHERE demand_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cooked_dishes_canonical_identity
  ON public.cooked_dishes (user_id, canonical_recipe_code)
  WHERE canonical_recipe_code IS NOT NULL;

ALTER TABLE public.planned_demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS planned_demands_own ON public.planned_demands;
CREATE POLICY planned_demands_own ON public.planned_demands
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.planned_demands FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planned_demands TO authenticated;
GRANT ALL ON public.planned_demands TO service_role;

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
      AND (
        lower(COALESCE(ingredient.value->>'formNormalized', ingredient.value->>'form_normalized', ingredient.value->>'name', '')) = lower(forbidden.value)
        OR strpos(lower(COALESCE(ingredient.value->>'formNormalized', ingredient.value->>'form_normalized', ingredient.value->>'name', '')), lower(forbidden.value)) > 0
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

CREATE OR REPLACE FUNCTION public.planning_schema_compatibility()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'compatible',
      to_regprocedure('public.publish_canonical_closed_loop_plan(jsonb)') IS NOT NULL
      AND to_regprocedure('public.publish_canonical_final_demand_plan(jsonb)') IS NOT NULL
      AND to_regclass('public.planned_demands') IS NOT NULL,
    'contract_version', 5,
    'final_demands', to_regclass('public.planned_demands') IS NOT NULL,
    'atomic_publish', to_regprocedure('public.publish_canonical_final_demand_plan(jsonb)') IS NOT NULL
  );
$function$;

REVOKE ALL ON FUNCTION public.planning_schema_compatibility() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.planning_schema_compatibility() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sync_materialized_production_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.materialized_cooked_dish_id IS NOT NULL
     AND NEW.materialized_cooked_dish_id IS DISTINCT FROM OLD.materialized_cooked_dish_id THEN
    UPDATE public.cooked_dishes
    SET canonical_recipe_code = NEW.recipe_code,
        canonical_recipe_execution_id = NEW.recipe_execution_id,
        planned_production_id = NEW.id,
        source_plan_version_id = NEW.plan_version_id
    WHERE id = NEW.materialized_cooked_dish_id
      AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_materialized_production_identity ON public.planned_productions;
CREATE TRIGGER trg_sync_materialized_production_identity
AFTER UPDATE OF materialized_cooked_dish_id ON public.planned_productions
FOR EACH ROW
EXECUTE FUNCTION public.sync_materialized_production_identity();

REVOKE ALL ON FUNCTION public.sync_materialized_production_identity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_materialized_production_identity() TO service_role;

COMMENT ON TABLE public.planned_demands IS
  'Source de vérité des portions finales par membre/repas, utilisée pour les exécutions, réservations, courses et totaux nutritionnels.';
COMMENT ON FUNCTION public.publish_canonical_final_demand_plan(jsonb) IS
  'Publication atomique Planning V5 avec mapping par execution_key et invariants finaux.';
