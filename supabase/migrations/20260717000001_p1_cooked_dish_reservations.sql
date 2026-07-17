-- Myko P1 — Réservation de portions de plats cuisinés dans la boucle fermée.
-- Version : 20260717000001  ·  nom : p1_cooked_dish_reservations
--
-- Ajout de la colonne cooked_dish_id sur inventory_reservations, mise à jour
-- des politiques RLS associées, et remplacement des deux fonctions de
-- publication pour accepter les réservations de plats cuisinés.
--
-- Contrat d'ingestion (émis par le planificateur, ingéré ici) :
--   • payload.slots[].cooked_dish_id  (bigint|null) → écrit dans meal_plan_slots
--   • payload.reservations[] à cooked_dish_id → type « portion de plat » :
--       - cooked_dish_id   (bigint)
--       - slot_key         (text)   → résolu en slot_id comme pour les lots
--       - ingredient_name  (text)   = nom du plat
--       - reserved_quantity (numeric) = nombre de portions
--       - reserved_unit    (text)   = 'portion'
--   • Lignes avec lot_id : comportement existant inchangé.
--
-- Idempotent : IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

-- (transaction fournie par apply-migrations.sh --single-transaction)
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Colonne cooked_dish_id sur inventory_reservations
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.inventory_reservations
  ADD COLUMN IF NOT EXISTS cooked_dish_id bigint
    REFERENCES public.cooked_dishes(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.inventory_reservations.cooked_dish_id IS
  'Réservation de portions d''un plat cuisiné — jamais décrémentée avant
   validation réelle du repas (flip active→consumed par app/api/meals/cook).
   Une ligne a lot_id OU cooked_dish_id OU aucun des deux ; pas de contrainte
   exclusive (permissivité pour les données existantes).';

-- Index partiel : accélère les calculs de disponibilité des portions.
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_dish_active
  ON public.inventory_reservations (cooked_dish_id)
  WHERE status = 'active';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Mise à jour des politiques RLS (insert + update) de inventory_reservations
--    pour valider l'appartenance du plat cuisiné au même tenant.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS inventory_reservations_insert_own ON public.inventory_reservations;
CREATE POLICY inventory_reservations_insert_own ON public.inventory_reservations
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.meal_plan_slots s
      JOIN public.meal_plan_versions pv ON pv.id = s.plan_version_id
      WHERE s.id = inventory_reservations.slot_id
        AND s.plan_version_id = inventory_reservations.plan_version_id
        AND s.user_id = (SELECT auth.uid())
        AND pv.user_id = (SELECT auth.uid())
    )
    -- Lot appartenant au tenant (ou null pour les réservations de plats)
    AND (
      lot_id IS NULL OR EXISTS (
        SELECT 1 FROM public.inventory_lots l
        WHERE l.id = lot_id AND l.user_id = (SELECT auth.uid())
      )
    )
    -- Plat cuisiné appartenant au tenant (ou null pour les réservations de lots)
    AND (
      cooked_dish_id IS NULL OR EXISTS (
        SELECT 1 FROM public.cooked_dishes cd
        WHERE cd.id = cooked_dish_id AND cd.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS inventory_reservations_update_own ON public.inventory_reservations;
CREATE POLICY inventory_reservations_update_own ON public.inventory_reservations
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.meal_plan_slots s
      JOIN public.meal_plan_versions pv ON pv.id = s.plan_version_id
      WHERE s.id = inventory_reservations.slot_id
        AND s.plan_version_id = inventory_reservations.plan_version_id
        AND s.user_id = (SELECT auth.uid())
        AND pv.user_id = (SELECT auth.uid())
    )
    AND (
      lot_id IS NULL OR EXISTS (
        SELECT 1 FROM public.inventory_lots l
        WHERE l.id = lot_id AND l.user_id = (SELECT auth.uid())
      )
    )
    AND (
      cooked_dish_id IS NULL OR EXISTS (
        SELECT 1 FROM public.cooked_dishes cd
        WHERE cd.id = cooked_dish_id AND cd.user_id = (SELECT auth.uid())
      )
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. publish_closed_loop_plan — supporte les réservations de plats cuisinés
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.publish_closed_loop_plan(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid                  uuid := auth.uid();
  v_owner                uuid;
  v_import_id            bigint;
  v_version_id           uuid;
  v_version_no           integer;
  v_status               text;
  v_blockers             integer := 0;
  v_slot                 jsonb;
  v_issue                jsonb;
  v_reservation          jsonb;
  v_task                 jsonb;
  v_dependency           jsonb;
  v_item                 jsonb;
  v_snapshot             jsonb;
  v_slot_id              uuid;
  v_task_id              bigint;
  v_slot_map             jsonb := '{}'::jsonb;
  v_task_map             jsonb := '{}'::jsonb;
  -- Lot reservation variables
  v_lot_qty              numeric;
  v_already_reserved     numeric;
  v_requested            numeric;
  v_snapshot_version     integer;
  -- Dish reservation variables
  v_cooked_dish_id       bigint;
  v_dish_remaining       numeric;
  v_dish_reserved_else   numeric;
  v_dish_reserved_this   numeric;
  v_dish_totals          jsonb := '{}'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  v_import_id := nullif(p_payload->>'import_id', '')::bigint;
  IF v_import_id IS NULL THEN
    RAISE EXCEPTION 'import_id_required';
  END IF;

  SELECT user_id INTO v_owner
  FROM public.nutrition_plan_imports
  WHERE id = v_import_id
  FOR UPDATE;

  IF v_owner IS NULL OR v_owner <> v_uid THEN
    RAISE EXCEPTION 'plan_not_found_or_forbidden';
  END IF;

  SELECT count(*)::integer INTO v_blockers
  FROM jsonb_array_elements(coalesce(p_payload->'issues', '[]'::jsonb)) i
  WHERE i->>'severity' IN ('blocker', 'error');

  v_status := CASE WHEN v_blockers > 0 THEN 'review_required' ELSE 'published' END;

  -- Une nouvelle publication remplace proprement l'état actif précédent.
  -- La libération générique couvre les deux types de réservation (lots ET plats
  -- cuisinés) sans distinction de colonne : status='active' suffit.
  UPDATE public.inventory_reservations r
  SET status = 'released', released_at = now(),
      metadata = r.metadata || jsonb_build_object('release_reason', 'superseded')
  WHERE r.status = 'active'
    AND r.plan_version_id IN (
      SELECT id FROM public.meal_plan_versions
      WHERE import_id = v_import_id AND status IN ('published', 'review_required')
    );

  UPDATE public.meal_plan_versions
  SET status = 'superseded', superseded_at = now(), updated_at = now()
  WHERE import_id = v_import_id AND status IN ('published', 'review_required');

  SELECT coalesce(max(version_no), 0) + 1
  INTO v_version_no
  FROM public.meal_plan_versions
  WHERE import_id = v_import_id;

  INSERT INTO public.meal_plan_versions (
    user_id, import_id, version_no, status, source,
    window_start, window_end, input_hash, input_snapshot,
    objective_scores, validation_summary, rules_version, published_at
  ) VALUES (
    v_uid,
    v_import_id,
    v_version_no,
    v_status,
    coalesce(nullif(p_payload->>'source', ''), 'closed_loop'),
    (p_payload->>'window_start')::date,
    (p_payload->>'window_end')::date,
    coalesce(nullif(p_payload->>'input_hash', ''), md5(p_payload::text)),
    coalesce(p_payload->'input_snapshot', '{}'::jsonb),
    coalesce(p_payload->'objective_scores', '{}'::jsonb),
    coalesce(p_payload->'validation_summary', '{}'::jsonb),
    coalesce(nullif(p_payload->>'rules_version', ''), 'closed-loop-v1'),
    CASE WHEN v_status = 'published' THEN now() ELSE null END
  ) RETURNING id INTO v_version_id;

  FOR v_slot IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'slots', '[]'::jsonb))
  LOOP
    INSERT INTO public.meal_plan_slots (
      user_id, plan_version_id, slot_key, meal_date, meal_type, title,
      generated_recipe_id, cooked_dish_id, servings, status, locked, source,
      nutrition_by_member, nutrition_total, preparation, stock_summary
    ) VALUES (
      v_uid,
      v_version_id,
      v_slot->>'slot_key',
      (v_slot->>'meal_date')::date,
      v_slot->>'meal_type',
      v_slot->>'title',
      nullif(v_slot->>'generated_recipe_id', '')::bigint,
      nullif(v_slot->>'cooked_dish_id', '')::bigint,
      coalesce(nullif(v_slot->>'servings', '')::numeric, 1),
      coalesce(nullif(v_slot->>'status', ''), 'planned'),
      coalesce((v_slot->>'locked')::boolean, false),
      coalesce(nullif(v_slot->>'source', ''), 'plan'),
      coalesce(v_slot->'nutrition_by_member', '{}'::jsonb),
      coalesce(v_slot->'nutrition_total', '{}'::jsonb),
      coalesce(v_slot->'preparation', '{}'::jsonb),
      coalesce(v_slot->'stock_summary', '{}'::jsonb)
    ) RETURNING id INTO v_slot_id;

    v_slot_map := v_slot_map || jsonb_build_object(v_slot->>'slot_key', v_slot_id::text);

    UPDATE public.nutrition_plan_meals
    SET meal_plan_slot_id = v_slot_id,
        planned_servings = coalesce(nullif(v_slot->>'servings_per_member', '')::numeric, 1),
        locked = coalesce((v_slot->>'locked')::boolean, false),
        nutrition_source = coalesce(nullif(v_slot->>'nutrition_source', ''), 'plan_snapshot'),
        nutrition_confidence = nullif(v_slot->>'nutrition_confidence', '')::numeric
    WHERE import_id = v_import_id
      AND id IN (
        SELECT value::bigint
        FROM jsonb_array_elements_text(coalesce(v_slot->'meal_row_ids', '[]'::jsonb))
      );
  END LOOP;

  FOR v_issue IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'issues', '[]'::jsonb))
  LOOP
    INSERT INTO public.meal_plan_validation_issues (
      user_id, plan_version_id, slot_id, severity, code, message, details
    ) VALUES (
      v_uid,
      v_version_id,
      nullif(v_slot_map->>(v_issue->>'slot_key'), '')::uuid,
      v_issue->>'severity',
      v_issue->>'code',
      v_issue->>'message',
      coalesce(v_issue->'details', '{}'::jsonb)
    );
  END LOOP;

  FOR v_snapshot IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'recipe_snapshots', '[]'::jsonb))
  LOOP
    SELECT coalesce(max(version_no), 0) + 1 INTO v_snapshot_version
    FROM public.recipe_nutrition_snapshots
    WHERE generated_recipe_id = (v_snapshot->>'generated_recipe_id')::bigint;

    INSERT INTO public.recipe_nutrition_snapshots (
      user_id, generated_recipe_id, version_no, ingredients_hash, source,
      serving_count, nutrition_per_serving, micronutrients, data_quality
    ) VALUES (
      v_uid,
      (v_snapshot->>'generated_recipe_id')::bigint,
      v_snapshot_version,
      coalesce(nullif(v_snapshot->>'ingredients_hash', ''), md5(v_snapshot::text)),
      coalesce(nullif(v_snapshot->>'source', ''), 'ingredient_calculation'),
      coalesce(nullif(v_snapshot->>'serving_count', '')::numeric, 1),
      coalesce(v_snapshot->'nutrition_per_serving', '{}'::jsonb),
      coalesce(v_snapshot->'micronutrients', '{}'::jsonb),
      coalesce(v_snapshot->'data_quality', '{}'::jsonb)
    );
  END LOOP;

  -- Les réservations ne deviennent actives que pour un plan sans blocage.
  IF v_status = 'published' THEN
    FOR v_reservation IN
      SELECT value FROM jsonb_array_elements(coalesce(p_payload->'reservations', '[]'::jsonb))
    LOOP
      v_cooked_dish_id := nullif(v_reservation->>'cooked_dish_id', '')::bigint;

      IF v_cooked_dish_id IS NOT NULL THEN
        -- ── Réservation de portions de plat cuisiné ─────────────────────────
        v_requested := (v_reservation->>'reserved_quantity')::numeric;

        -- Lecture avec verrou de la ligne du plat (évite la sur-réservation
        -- concurrente entre deux publications simultanées d'imports différents).
        SELECT portions_remaining INTO v_dish_remaining
        FROM public.cooked_dishes
        WHERE id = v_cooked_dish_id AND user_id = v_uid
        FOR UPDATE;

        IF v_dish_remaining IS NULL THEN
          RAISE EXCEPTION 'plat_introuvable : le plat cuisiné % est introuvable ou inaccessible',
            v_cooked_dish_id;
        END IF;

        -- Portions déjà réservées pour ce plat par d'AUTRES versions actives.
        -- On exclut v_version_id : les réservations de la version en cours de
        -- construction sont suivies séparément dans v_dish_totals.
        SELECT coalesce(sum(reserved_quantity), 0) INTO v_dish_reserved_else
        FROM public.inventory_reservations
        WHERE cooked_dish_id = v_cooked_dish_id
          AND status = 'active'
          AND plan_version_id <> v_version_id;

        -- Cumul déjà réservé pour ce plat dans CETTE version (portées multiples).
        v_dish_reserved_this := coalesce(
          (v_dish_totals->>(v_cooked_dish_id::text))::numeric, 0
        );

        -- Validation : audit §10 étape 7 « quantité négative ».
        IF v_dish_reserved_this + v_requested
            > greatest(v_dish_remaining - v_dish_reserved_else, 0) + 0.0005 THEN
          RAISE EXCEPTION
            'portions_insuffisantes : plat % (« % ») — disponible %.1f portion(s), '
            'demandé %.1f dans cette version (%.1f déjà réservées ailleurs)',
            v_cooked_dish_id,
            coalesce(v_reservation->>'ingredient_name', 'inconnu'),
            greatest(v_dish_remaining - v_dish_reserved_else, 0),
            v_dish_reserved_this + v_requested,
            v_dish_reserved_else;
        END IF;

        -- Mise à jour du cumul pour ce plat dans la version en cours.
        v_dish_totals := jsonb_set(
          v_dish_totals,
          ARRAY[v_cooked_dish_id::text],
          to_jsonb(v_dish_reserved_this + v_requested)
        );

        INSERT INTO public.inventory_reservations (
          user_id, plan_version_id, slot_id, cooked_dish_id,
          ingredient_name, reserved_quantity, reserved_unit,
          needed_quantity, needed_unit, metadata
        ) VALUES (
          v_uid,
          v_version_id,
          (v_slot_map->>(v_reservation->>'slot_key'))::uuid,
          v_cooked_dish_id,
          v_reservation->>'ingredient_name',
          v_requested,
          coalesce(nullif(v_reservation->>'reserved_unit', ''), 'portion'),
          nullif(v_reservation->>'needed_quantity', '')::numeric,
          nullif(v_reservation->>'needed_unit', ''),
          coalesce(v_reservation->'metadata', '{}'::jsonb)
        );

      ELSE
        -- ── Réservation de lot (comportement existant inchangé) ─────────────
        v_requested := (v_reservation->>'reserved_quantity')::numeric;

        SELECT qty_remaining INTO v_lot_qty
        FROM public.inventory_lots
        WHERE id = (v_reservation->>'lot_id')::uuid AND user_id = v_uid
        FOR UPDATE;

        IF v_lot_qty IS NULL THEN
          RAISE EXCEPTION 'stock_changed: lot % unavailable', v_reservation->>'lot_id';
        END IF;

        SELECT coalesce(sum(reserved_quantity), 0) INTO v_already_reserved
        FROM public.inventory_reservations
        WHERE lot_id = (v_reservation->>'lot_id')::uuid AND status = 'active';

        IF v_requested > greatest(v_lot_qty - v_already_reserved, 0) + 0.0005 THEN
          RAISE EXCEPTION 'stock_changed: lot % only % available, % requested',
            v_reservation->>'lot_id',
            greatest(v_lot_qty - v_already_reserved, 0),
            v_requested;
        END IF;

        INSERT INTO public.inventory_reservations (
          user_id, plan_version_id, slot_id, lot_id, canonical_food_id,
          ingredient_name, reserved_quantity, reserved_unit,
          needed_quantity, needed_unit, metadata
        ) VALUES (
          v_uid,
          v_version_id,
          (v_slot_map->>(v_reservation->>'slot_key'))::uuid,
          (v_reservation->>'lot_id')::uuid,
          nullif(v_reservation->>'canonical_food_id', '')::bigint,
          v_reservation->>'ingredient_name',
          v_requested,
          v_reservation->>'reserved_unit',
          nullif(v_reservation->>'needed_quantity', '')::numeric,
          nullif(v_reservation->>'needed_unit', ''),
          coalesce(v_reservation->'metadata', '{}'::jsonb)
        );
      END IF;
    END LOOP;
  END IF;

  -- On remplace uniquement les tâches automatiques encore ouvertes.
  DELETE FROM public.nutrition_plan_prep_tasks
  WHERE import_id = v_import_id AND source = 'closed_loop' AND done = false;

  FOR v_task IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'tasks', '[]'::jsonb))
  LOOP
    INSERT INTO public.nutrition_plan_prep_tasks (
      import_id, prep_date, prep_label, task, estimated_time, done,
      plan_version_id, meal_plan_slot_id, stable_key, task_type,
      workflow_status, earliest_start_at, due_at, safety_deadline_at,
      duration_min, priority, source, instructions_json
    ) VALUES (
      v_import_id,
      (v_task->>'prep_date')::date,
      coalesce(nullif(v_task->>'prep_label', ''), 'À préparer'),
      v_task->>'title',
      CASE WHEN nullif(v_task->>'duration_min', '') IS NOT NULL
        THEN (v_task->>'duration_min') || ' min' ELSE null END,
      false,
      v_version_id,
      nullif(v_slot_map->>(v_task->>'slot_key'), '')::uuid,
      v_task->>'task_key',
      coalesce(nullif(v_task->>'task_type', ''), 'prepare'),
      'pending',
      nullif(v_task->>'earliest_start_at', '')::timestamptz,
      nullif(v_task->>'due_at', '')::timestamptz,
      nullif(v_task->>'safety_deadline_at', '')::timestamptz,
      nullif(v_task->>'duration_min', '')::integer,
      coalesce(nullif(v_task->>'priority', '')::integer, 50),
      'closed_loop',
      coalesce(v_task->'instructions', '[]'::jsonb)
    ) RETURNING id INTO v_task_id;

    v_task_map := v_task_map || jsonb_build_object(v_task->>'task_key', v_task_id);
  END LOOP;

  FOR v_dependency IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'dependencies', '[]'::jsonb))
  LOOP
    INSERT INTO public.prep_task_dependencies (
      user_id, plan_version_id, task_id, depends_on_task_id
    ) VALUES (
      v_uid,
      v_version_id,
      (v_task_map->>(v_dependency->>'task_key'))::bigint,
      (v_task_map->>(v_dependency->>'depends_on_task_key'))::bigint
    );
  END LOOP;

  DELETE FROM public.nutrition_plan_shopping_items
  WHERE import_id = v_import_id AND coalesce(checked, false) = false;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'shopping_items', '[]'::jsonb))
  LOOP
    INSERT INTO public.nutrition_plan_shopping_items (
      import_id, week_label, category, product_name, quantity, checked,
      canonical_food_id, archetype_id, notes, plan_version_id,
      required_qty, stock_qty, reserved_qty, incoming_qty,
      purchase_qty, purchase_unit, shopping_status, planning_source,
      aisle_order, shortage_reason, needed_by
    ) VALUES (
      v_import_id,
      coalesce(nullif(v_item->>'week_label', ''), 'S1'),
      v_item->>'category',
      v_item->>'product_name',
      v_item->>'display_quantity',
      false,
      nullif(v_item->>'canonical_food_id', '')::bigint,
      nullif(v_item->>'archetype_id', '')::bigint,
      nullif(v_item->>'notes', ''),
      v_version_id,
      nullif(v_item->>'required_qty', '')::numeric,
      nullif(v_item->>'stock_qty', '')::numeric,
      nullif(v_item->>'reserved_qty', '')::numeric,
      nullif(v_item->>'incoming_qty', '')::numeric,
      nullif(v_item->>'purchase_qty', '')::numeric,
      v_item->>'purchase_unit',
      coalesce(nullif(v_item->>'shopping_status', ''), 'needed'),
      'closed_loop',
      coalesce(nullif(v_item->>'aisle_order', '')::integer, 999),
      nullif(v_item->>'shortage_reason', ''),
      nullif(v_item->>'needed_by', '')::date
    );
  END LOOP;

  UPDATE public.nutrition_plan_imports
  SET active_plan_version_id = v_version_id
  WHERE id = v_import_id;

  INSERT INTO public.decision_audit_log (
    user_id, plan_version_id, decision_type, rules_version,
    input_fingerprint, decision
  ) VALUES (
    v_uid,
    v_version_id,
    'publish_plan',
    coalesce(nullif(p_payload->>'rules_version', ''), 'closed-loop-v1'),
    p_payload->>'input_hash',
    jsonb_build_object(
      'status', v_status,
      'version_no', v_version_no,
      'blockers', v_blockers,
      'slots', jsonb_array_length(coalesce(p_payload->'slots', '[]'::jsonb)),
      'reservations', jsonb_array_length(coalesce(p_payload->'reservations', '[]'::jsonb)),
      'tasks', jsonb_array_length(coalesce(p_payload->'tasks', '[]'::jsonb)),
      'recipe_snapshots', jsonb_array_length(coalesce(p_payload->'recipe_snapshots', '[]'::jsonb)),
      'shopping_items', jsonb_array_length(coalesce(p_payload->'shopping_items', '[]'::jsonb))
    )
  );

  RETURN jsonb_build_object(
    'plan_version_id', v_version_id,
    'version_no', v_version_no,
    'status', v_status,
    'blockers', v_blockers
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_closed_loop_plan(jsonb) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. publish_canonical_closed_loop_plan — correction de la vérification
--    recipe_execution_mapping_incomplete pour les créneaux de plats cuisinés.
--    Un créneau avec cooked_dish_id (consommation d'un reste) n'a pas de
--    recipe_execution_id et ne doit pas bloquer la publication.
-- ═══════════════════════════════════════════════════════════════════════════

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

  -- Vérification : tout créneau sans recipe_execution_id doit avoir un
  -- cooked_dish_id (créneau de consommation de reste — pas de recette active).
  -- Un créneau sans l'un ni l'autre est une erreur de mapping.
  IF EXISTS (
    SELECT 1 FROM public.meal_plan_slots
    WHERE plan_version_id = v_version_id
      AND recipe_execution_id IS NULL
      AND cooked_dish_id IS NULL
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
   les créneaux de consommation de plats cuisinés existants avec cooked_dish_id),
   réservations FEFO pour lots et portions de plats, tâches, courses et repas legacy.';

-- (commit par le wrapper apply-migrations.sh)