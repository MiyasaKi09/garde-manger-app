-- ============================================================================
-- P4 — Réservations des petits-déjeuners et collations (créneaux « support »)
-- ============================================================================
-- Bloquant #4 du verdict directeur (audit boucle fermée du 17/07) : les prises
-- « support » (petit-déjeuner / collation) étaient calculées côté stock mais
-- JAMAIS persistées en réservations, car inventory_reservations impose un
-- slot_id non nul. Elles sont désormais publiées comme de vrais créneaux
-- (source='support', un par date × type de prise), porteurs de leurs
-- réservations de lots — plus de double promesse : un lot réservé pour un
-- petit-déjeuner ne peut plus l'être ailleurs.
--
-- Cette migration ne fait qu'AMENDER le garde-fou recipe_execution_mapping_
-- incomplete de publish_canonical_closed_loop_plan (20260717000001) : un
-- créneau support n'a ni recipe_execution_id ni cooked_dish_id et ne doit pas
-- bloquer la publication. Le reste du corps de la fonction est identique.
-- Idempotent (CREATE OR REPLACE), aucune donnée modifiée, rollback fourni.
-- ============================================================================

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

  -- Verdict directeur : ne pas réintroduire la limite de 31 recipe_executions —
  -- la personnalisation (20260716162509) l'avait portée à 64 (deux personnes,
  -- petits-déjeuners et collations). On conserve la valeur 64.
  IF jsonb_typeof(p_payload) <> 'object'
     OR jsonb_array_length(COALESCE(p_payload->'slots', '[]'::jsonb)) NOT BETWEEN 1 AND 31
     OR jsonb_array_length(COALESCE(p_payload->'recipe_executions', '[]'::jsonb)) NOT BETWEEN 1 AND 64
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

  -- Vérification : tout créneau sans recipe_execution_id doit avoir un
  -- cooked_dish_id (créneau de consommation de reste — pas de recette active).
  -- Un créneau « support » (petit-déjeuner/collation, source='support') n'a ni
  -- recette ni plat : il ne porte que des réservations de lots (audit P4).
  -- Un autre créneau sans recette ni plat reste une erreur de mapping.
  IF EXISTS (
    SELECT 1 FROM public.meal_plan_slots
    WHERE plan_version_id = v_version_id
      AND recipe_execution_id IS NULL
      AND cooked_dish_id IS NULL
      AND source <> 'support'
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
  'Publie un plan canonique V3 : exécutions de recettes immuables, créneaux (y compris
   les créneaux de consommation de plats cuisinés existants avec cooked_dish_id et les
   créneaux « support » petit-déjeuner/collation sans recette ni plat), réservations
   FEFO pour lots (recettes et suppléments) et portions de plats, tâches, courses et
   repas legacy.';

-- (commit par le wrapper apply-migrations.sh)
