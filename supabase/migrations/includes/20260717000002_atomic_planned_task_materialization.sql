-- Include de la migration P2 : matérialisation atomique des productions.
-- Ce fichier est chargé par apply-migrations.sh dans LA MÊME transaction et
-- participe à l'empreinte SHA-256 composite de la version 20260717000002.

CREATE OR REPLACE FUNCTION public.set_planned_task_done(
  p_task_id bigint,
  p_done boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid                 uuid := auth.uid();
  v_task                public.nutrition_plan_prep_tasks%ROWTYPE;
  v_slot                public.meal_plan_slots%ROWTYPE;
  v_reservation         record;
  v_production          public.planned_productions%ROWTYPE;
  v_lot_qty_before      numeric;
  v_lot_qty_after       numeric;
  v_native_qty          numeric;
  v_lot_unit            text;
  v_reserved_unit       text;
  v_density             numeric;
  v_unit_weight         numeric;
  v_dish_id             bigint;
  v_materialized        jsonb := '[]'::jsonb;
  v_movement_count      integer := 0;
  v_reservation_count   integer := 0;
  v_production_count    integer := 0;
  v_shortage_count      integer := 0;
  v_kcal_pp             numeric;
  v_protein_pp          numeric;
  v_carbs_pp            numeric;
  v_fat_pp              numeric;
  v_fiber_pp            numeric;
  v_servings            numeric;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT t.* INTO v_task
  FROM public.nutrition_plan_prep_tasks t
  JOIN public.nutrition_plan_imports i ON i.id = t.import_id
  WHERE t.id = p_task_id
    AND i.user_id = v_uid
  FOR UPDATE OF t;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task_not_found_or_forbidden';
  END IF;

  IF NOT p_done THEN
    IF EXISTS (
      SELECT 1
      FROM public.prep_task_dependencies d
      JOIN public.nutrition_plan_prep_tasks child ON child.id = d.task_id
      WHERE d.depends_on_task_id = p_task_id
        AND d.user_id = v_uid
        AND child.done = true
    ) THEN
      RAISE EXCEPTION 'completed_dependant';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.planned_productions pp
      WHERE pp.source_task_id = p_task_id
        AND pp.user_id = v_uid
        AND pp.status = 'materialized'
    ) THEN
      RAISE EXCEPTION 'materialized_production_cannot_reopen';
    END IF;

    UPDATE public.nutrition_plan_prep_tasks
    SET done = false,
        done_at = null,
        workflow_status = 'pending'
    WHERE id = p_task_id;

    RETURN jsonb_build_object(
      'task', jsonb_build_object('id', p_task_id, 'done', false, 'done_at', null),
      'materialized', '[]'::jsonb,
      'movements', 0
    );
  END IF;

  IF v_task.done THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'production_id', pp.id,
      'cooked_dish_id', pp.materialized_cooked_dish_id,
      'name', pp.output_name,
      'portions', pp.planned_portions,
      'expiration_date', pp.use_by
    ) ORDER BY pp.production_key), '[]'::jsonb)
    INTO v_materialized
    FROM public.planned_productions pp
    WHERE pp.source_task_id = p_task_id
      AND pp.user_id = v_uid
      AND pp.status = 'materialized';

    RETURN jsonb_build_object(
      'task', jsonb_build_object('id', p_task_id, 'done', true, 'done_at', v_task.done_at),
      'materialized', v_materialized,
      'movements', 0,
      'already_done', true
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.prep_task_dependencies d
    LEFT JOIN public.nutrition_plan_prep_tasks parent ON parent.id = d.depends_on_task_id
    WHERE d.task_id = p_task_id
      AND d.user_id = v_uid
      AND coalesce(parent.done, false) = false
  ) THEN
    RAISE EXCEPTION 'dependencies_pending';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.planned_productions pp
    WHERE pp.source_task_id = p_task_id
      AND pp.user_id = v_uid
      AND pp.status = 'materialized'
  ) THEN
    RAISE EXCEPTION 'partial_materialization_requires_review';
  END IF;

  SELECT count(*) INTO v_production_count
  FROM public.planned_productions pp
  WHERE pp.source_task_id = p_task_id
    AND pp.user_id = v_uid
    AND pp.status = 'planned';

  IF v_task.meal_plan_slot_id IS NOT NULL THEN
    SELECT * INTO v_slot
    FROM public.meal_plan_slots s
    WHERE s.id = v_task.meal_plan_slot_id
      AND s.user_id = v_uid
      AND (v_task.plan_version_id IS NULL OR s.plan_version_id = v_task.plan_version_id)
    FOR UPDATE;
  END IF;

  IF v_production_count > 0 AND v_task.task_type = 'prepare_recipe' THEN
    IF v_slot.id IS NULL THEN
      RAISE EXCEPTION 'producer_slot_missing';
    END IF;

    SELECT coalesce(jsonb_array_length(coalesce(v_slot.stock_summary->'shortages', '[]'::jsonb)), 0)
    INTO v_shortage_count;

    IF v_shortage_count > 0 THEN
      RAISE EXCEPTION 'unreserved_ingredients_replan_required';
    END IF;

    SELECT count(*) INTO v_reservation_count
    FROM public.inventory_reservations r
    WHERE r.plan_version_id = v_task.plan_version_id
      AND r.slot_id = v_task.meal_plan_slot_id
      AND r.user_id = v_uid
      AND r.status = 'active'
      AND r.lot_id IS NOT NULL;

    IF v_reservation_count = 0
       AND jsonb_array_length(coalesce(v_slot.stock_summary->'allocations', '[]'::jsonb)) > 0 THEN
      RAISE EXCEPTION 'expected_inventory_reservations_missing';
    END IF;

    FOR v_reservation IN
      SELECT r.id, r.lot_id, r.reserved_quantity, r.reserved_unit,
             l.unit AS lot_unit, l.qty_remaining, l.user_id AS lot_user_id,
             cf.density_g_per_ml, cf.unit_weight_grams
      FROM public.inventory_reservations r
      JOIN public.inventory_lots l ON l.id = r.lot_id
      LEFT JOIN public.canonical_foods cf ON cf.id = l.canonical_food_id
      WHERE r.plan_version_id = v_task.plan_version_id
        AND r.slot_id = v_task.meal_plan_slot_id
        AND r.user_id = v_uid
        AND r.status = 'active'
        AND r.lot_id IS NOT NULL
      ORDER BY r.lot_id, r.id
      FOR UPDATE OF r, l
    LOOP
      IF v_reservation.lot_user_id IS DISTINCT FROM v_uid THEN
        RAISE EXCEPTION 'lot_not_owned:%', v_reservation.lot_id;
      END IF;

      v_lot_unit := lower(trim(coalesce(v_reservation.lot_unit, '')));
      v_reserved_unit := lower(trim(coalesce(v_reservation.reserved_unit, '')));
      v_density := v_reservation.density_g_per_ml;
      v_unit_weight := v_reservation.unit_weight_grams;

      IF v_reservation.reserved_quantity IS NULL OR v_reservation.reserved_quantity <= 0 THEN
        RAISE EXCEPTION 'invalid_reservation_quantity:%', v_reservation.id;
      END IF;

      IF v_reserved_unit = v_lot_unit THEN
        v_native_qty := v_reservation.reserved_quantity;
      ELSIF v_reserved_unit IN ('g', 'gr', 'gramme', 'grammes') THEN
        CASE v_lot_unit
          WHEN 'g' THEN v_native_qty := v_reservation.reserved_quantity;
          WHEN 'kg' THEN v_native_qty := v_reservation.reserved_quantity / 1000;
          WHEN 'mg' THEN v_native_qty := v_reservation.reserved_quantity * 1000;
          WHEN 'ml' THEN
            IF v_density IS NULL OR v_density <= 0 THEN RAISE EXCEPTION 'missing_density:%', v_reservation.lot_id; END IF;
            v_native_qty := v_reservation.reserved_quantity / v_density;
          WHEN 'cl' THEN
            IF v_density IS NULL OR v_density <= 0 THEN RAISE EXCEPTION 'missing_density:%', v_reservation.lot_id; END IF;
            v_native_qty := v_reservation.reserved_quantity / (10 * v_density);
          WHEN 'l' THEN
            IF v_density IS NULL OR v_density <= 0 THEN RAISE EXCEPTION 'missing_density:%', v_reservation.lot_id; END IF;
            v_native_qty := v_reservation.reserved_quantity / (1000 * v_density);
          WHEN 'u' THEN
            IF v_unit_weight IS NULL OR v_unit_weight <= 0 THEN RAISE EXCEPTION 'missing_unit_weight:%', v_reservation.lot_id; END IF;
            v_native_qty := v_reservation.reserved_quantity / v_unit_weight;
          WHEN 'unité' THEN
            IF v_unit_weight IS NULL OR v_unit_weight <= 0 THEN RAISE EXCEPTION 'missing_unit_weight:%', v_reservation.lot_id; END IF;
            v_native_qty := v_reservation.reserved_quantity / v_unit_weight;
          WHEN 'unités' THEN
            IF v_unit_weight IS NULL OR v_unit_weight <= 0 THEN RAISE EXCEPTION 'missing_unit_weight:%', v_reservation.lot_id; END IF;
            v_native_qty := v_reservation.reserved_quantity / v_unit_weight;
          ELSE
            RAISE EXCEPTION 'unsupported_lot_unit:%:%', v_reservation.lot_id, v_lot_unit;
        END CASE;
      ELSE
        RAISE EXCEPTION 'reservation_unit_mismatch:%:%:%', v_reservation.id, v_reserved_unit, v_lot_unit;
      END IF;

      IF v_native_qty IS NULL OR v_native_qty <= 0 THEN
        RAISE EXCEPTION 'invalid_native_quantity:%', v_reservation.id;
      END IF;

      v_lot_qty_before := v_reservation.qty_remaining;
      IF v_lot_qty_before + 0.000001 < v_native_qty THEN
        RAISE EXCEPTION 'stock_changed:%:available=%:required=%',
          v_reservation.lot_id, v_lot_qty_before, v_native_qty;
      END IF;

      v_lot_qty_after := greatest(0, v_lot_qty_before - v_native_qty);

      UPDATE public.inventory_lots
      SET qty_remaining = v_lot_qty_after,
          updated_at = now()
      WHERE id = v_reservation.lot_id;

      INSERT INTO public.inventory_movements (
        user_id, lot_id, session_id, movement_type,
        quantity_before, quantity_delta, quantity_after
      ) VALUES (
        v_uid, v_reservation.lot_id, null, 'consumption',
        v_lot_qty_before, -v_native_qty, v_lot_qty_after
      );

      UPDATE public.inventory_reservations
      SET status = 'consumed', consumed_at = now()
      WHERE id = v_reservation.id;

      v_movement_count := v_movement_count + 1;
    END LOOP;
  END IF;

  IF v_slot.id IS NOT NULL THEN
    v_servings := greatest(coalesce(v_slot.servings, 1), 0.0001);
    v_kcal_pp := nullif(v_slot.nutrition_total->>'kcal', '')::numeric / v_servings;
    v_protein_pp := nullif(v_slot.nutrition_total->>'proteinG', '')::numeric / v_servings;
    v_carbs_pp := nullif(v_slot.nutrition_total->>'carbsG', '')::numeric / v_servings;
    v_fat_pp := nullif(v_slot.nutrition_total->>'fatG', '')::numeric / v_servings;
    v_fiber_pp := nullif(v_slot.nutrition_total->>'fiberG', '')::numeric / v_servings;
  END IF;

  FOR v_production IN
    SELECT pp.*
    FROM public.planned_productions pp
    WHERE pp.source_task_id = p_task_id
      AND pp.user_id = v_uid
      AND pp.status = 'planned'
    ORDER BY pp.production_key
    FOR UPDATE
  LOOP
    INSERT INTO public.cooked_dishes (
      user_id, name, portions_cooked, portions_remaining,
      storage_method, cooked_at, expiration_date, notes, source_meal_type,
      kcal_per_portion, protein_g_per_portion, carbs_g_per_portion,
      fat_g_per_portion, fiber_g_per_portion
    ) VALUES (
      v_uid,
      v_production.output_name,
      v_production.planned_portions,
      v_production.planned_portions,
      CASE WHEN v_production.storage_method = 'freezer' THEN 'freezer' ELSE 'fridge' END,
      now(),
      v_production.use_by,
      format('[production:%s] matérialisé atomiquement depuis planned_productions', v_production.id),
      CASE WHEN v_slot.id IS NOT NULL THEN v_slot.meal_type ELSE null END,
      v_kcal_pp, v_protein_pp, v_carbs_pp, v_fat_pp, v_fiber_pp
    ) RETURNING id INTO v_dish_id;

    UPDATE public.planned_productions
    SET status = 'materialized',
        materialized_cooked_dish_id = v_dish_id
    WHERE id = v_production.id;

    v_materialized := v_materialized || jsonb_build_array(jsonb_build_object(
      'production_id', v_production.id,
      'cooked_dish_id', v_dish_id,
      'name', v_production.output_name,
      'portions', v_production.planned_portions,
      'expiration_date', v_production.use_by
    ));
  END LOOP;

  UPDATE public.nutrition_plan_prep_tasks
  SET done = true,
      done_at = now(),
      workflow_status = 'done'
  WHERE id = p_task_id
  RETURNING * INTO v_task;

  RETURN jsonb_build_object(
    'task', jsonb_build_object('id', v_task.id, 'done', v_task.done, 'done_at', v_task.done_at),
    'materialized', v_materialized,
    'movements', v_movement_count,
    'reservations_consumed', v_reservation_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_planned_task_done(bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_planned_task_done(bigint, boolean) TO authenticated, service_role;

COMMENT ON FUNCTION public.set_planned_task_done(bigint, boolean) IS
  'Clôture/réouvre une tâche de planning. La clôture consomme les réservations dans l’unité native des lots, journalise les mouvements, matérialise les productions et ferme la tâche dans une seule transaction.';
