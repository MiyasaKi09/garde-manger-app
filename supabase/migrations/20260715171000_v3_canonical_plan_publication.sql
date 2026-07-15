-- Myko V3: atomic publication of deterministic canonical plans.
-- A plan references immutable recipe executions and remains compatible with
-- the legacy nutrition_plan_* UI during the progressive V2 migration.

BEGIN;

ALTER TABLE culinary.recipe_executions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE culinary.recipe_executions
  DROP CONSTRAINT IF EXISTS recipe_executions_content_hash_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recipe_executions_user_hash
  ON culinary.recipe_executions (user_id, content_hash)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipe_executions_user_created
  ON culinary.recipe_executions (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE culinary.recipe_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recipe_executions_select_own ON culinary.recipe_executions;
CREATE POLICY recipe_executions_select_own ON culinary.recipe_executions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
REVOKE ALL ON culinary.recipe_executions FROM anon, authenticated;
GRANT ALL ON culinary.recipe_executions TO service_role;

ALTER TABLE public.meal_plan_slots
  ADD COLUMN IF NOT EXISTS recipe_execution_id uuid
  REFERENCES culinary.recipe_executions(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_recipe_execution
  ON public.meal_plan_slots (recipe_execution_id)
  WHERE recipe_execution_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_canonical_plan_import_week
  ON public.nutrition_plan_imports (user_id, date_range_start, date_range_end)
  WHERE file_name = 'myko-canonical-v3';

CREATE OR REPLACE FUNCTION public.publish_canonical_closed_loop_plan(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_import_id bigint;
  v_version_id uuid;
  v_recipe_version_id uuid;
  v_execution_id uuid;
  v_slot_id uuid;
  v_execution jsonb;
  v_slot jsonb;
  v_meal jsonb;
  v_payload jsonb := p_payload;
  v_result jsonb;
  v_execution_map jsonb := '{}'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF jsonb_typeof(p_payload) <> 'object'
     OR jsonb_array_length(COALESCE(p_payload->'slots', '[]'::jsonb)) NOT BETWEEN 1 AND 31
     OR jsonb_array_length(COALESCE(p_payload->'recipe_executions', '[]'::jsonb)) NOT BETWEEN 1 AND 31
     OR jsonb_array_length(COALESCE(p_payload->'legacy_meals', '[]'::jsonb)) > 300 THEN
    RAISE EXCEPTION 'invalid_plan_payload';
  END IF;

  IF (p_payload->>'window_start')::date IS NULL
     OR (p_payload->>'window_end')::date IS NULL
     OR (p_payload->>'window_end')::date < (p_payload->>'window_start')::date
     OR (p_payload->>'window_end')::date - (p_payload->>'window_start')::date > 30 THEN
    RAISE EXCEPTION 'invalid_plan_window';
  END IF;

  v_import_id := NULLIF(p_payload->>'import_id', '')::bigint;
  IF v_import_id IS NULL THEN
    INSERT INTO public.nutrition_plan_imports (
      user_id, file_name, month_label, date_range_start, date_range_end
    ) VALUES (
      v_uid,
      'myko-canonical-v3',
      NULLIF(p_payload->>'month_label', ''),
      (p_payload->>'window_start')::date,
      (p_payload->>'window_end')::date
    )
    ON CONFLICT (user_id, date_range_start, date_range_end)
      WHERE file_name = 'myko-canonical-v3'
    DO UPDATE SET month_label = EXCLUDED.month_label
    RETURNING id INTO v_import_id;
  ELSE
    SELECT user_id INTO v_owner
    FROM public.nutrition_plan_imports
    WHERE id = v_import_id
    FOR UPDATE;
    IF v_owner IS NULL OR v_owner <> v_uid THEN
      RAISE EXCEPTION 'plan_not_found_or_forbidden';
    END IF;
  END IF;

  v_payload := jsonb_set(v_payload, '{import_id}', to_jsonb(v_import_id), true);

  FOR v_execution IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_payload->'recipe_executions', '[]'::jsonb))
    ORDER BY value->>'recipe_code'
  LOOP
    SELECT rv.id INTO v_recipe_version_id
    FROM culinary.recipe_versions rv
    WHERE rv.source_record_key = v_execution->>'recipe_code'
      AND rv.planning_eligible = true
    ORDER BY rv.version_number DESC
    LIMIT 1;

    IF v_recipe_version_id IS NULL THEN
      RAISE EXCEPTION 'canonical_recipe_not_eligible: %', v_execution->>'recipe_code';
    END IF;

    INSERT INTO culinary.recipe_executions (
      user_id, recipe_version_id, selected_configuration, servings,
      exact_ingredients_snapshot, exact_steps_snapshot, nutrition_snapshot,
      transformation_plan_snapshot, source_lot_plan_snapshot, content_hash
    ) VALUES (
      v_uid,
      v_recipe_version_id,
      COALESCE(v_execution->'selected_configuration', '{}'::jsonb),
      (v_execution->>'servings')::numeric,
      v_execution->'exact_ingredients_snapshot',
      v_execution->'exact_steps_snapshot',
      v_execution->'nutrition_snapshot',
      COALESCE(v_execution->'transformation_plan_snapshot', '[]'::jsonb),
      COALESCE(v_execution->'source_lot_plan_snapshot', '[]'::jsonb),
      v_execution->>'content_hash'
    )
    ON CONFLICT (user_id, content_hash) WHERE user_id IS NOT NULL
    DO NOTHING
    RETURNING id INTO v_execution_id;

    IF v_execution_id IS NULL THEN
      SELECT id INTO v_execution_id
      FROM culinary.recipe_executions
      WHERE user_id = v_uid AND content_hash = v_execution->>'content_hash';
    END IF;

    v_execution_map := v_execution_map || jsonb_build_object(
      v_execution->>'recipe_code', v_execution_id::text
    );
  END LOOP;

  v_result := public.publish_closed_loop_plan(v_payload);
  v_version_id := (v_result->>'plan_version_id')::uuid;

  FOR v_slot IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'slots', '[]'::jsonb))
  LOOP
    UPDATE public.meal_plan_slots
    SET recipe_execution_id = NULLIF(v_execution_map->>(v_slot->>'recipe_code'), '')::uuid
    WHERE plan_version_id = v_version_id
      AND slot_key = v_slot->>'slot_key';
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM public.meal_plan_slots
    WHERE plan_version_id = v_version_id AND recipe_execution_id IS NULL
  ) THEN
    RAISE EXCEPTION 'recipe_execution_mapping_incomplete';
  END IF;

  FOR v_meal IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'legacy_meals', '[]'::jsonb))
  LOOP
    SELECT id INTO v_slot_id
    FROM public.meal_plan_slots
    WHERE plan_version_id = v_version_id
      AND slot_key = v_meal->>'slot_key';

    INSERT INTO public.nutrition_plan_meals (
      import_id, person_name, meal_date, meal_type, day_type, description,
      kcal, protein_g, carbs_g, fat_g, fiber_g,
      meal_plan_slot_id, planned_servings, locked,
      nutrition_source, nutrition_confidence
    ) VALUES (
      v_import_id,
      v_meal->>'person_name',
      (v_meal->>'meal_date')::date,
      v_meal->>'meal_type',
      COALESCE(NULLIF(v_meal->>'day_type', ''), 'standard'),
      v_meal->>'description',
      NULLIF(v_meal->>'kcal', '')::numeric,
      NULLIF(v_meal->>'protein_g', '')::numeric,
      NULLIF(v_meal->>'carbs_g', '')::numeric,
      NULLIF(v_meal->>'fat_g', '')::numeric,
      NULLIF(v_meal->>'fiber_g', '')::numeric,
      v_slot_id,
      COALESCE(NULLIF(v_meal->>'planned_servings', '')::numeric, 1),
      false,
      'canonical_v3_deterministic',
      1
    )
    ON CONFLICT (import_id, person_name, meal_date, meal_type)
    DO UPDATE SET
      description = EXCLUDED.description,
      kcal = EXCLUDED.kcal,
      protein_g = EXCLUDED.protein_g,
      carbs_g = EXCLUDED.carbs_g,
      fat_g = EXCLUDED.fat_g,
      fiber_g = EXCLUDED.fiber_g,
      meal_plan_slot_id = EXCLUDED.meal_plan_slot_id,
      planned_servings = EXCLUDED.planned_servings,
      nutrition_source = EXCLUDED.nutrition_source,
      nutrition_confidence = EXCLUDED.nutrition_confidence;
  END LOOP;

  RETURN v_result || jsonb_build_object('import_id', v_import_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.publish_canonical_closed_loop_plan(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_canonical_closed_loop_plan(jsonb) TO authenticated, service_role;

COMMENT ON FUNCTION public.publish_canonical_closed_loop_plan(jsonb) IS
  'Publishes one tenant-scoped canonical V3 plan atomically: immutable recipe executions, slots, FEFO reservations, prep tasks, shopping and compatibility meals.';

COMMIT;
