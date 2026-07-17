-- Myko P2 — Productions planifiées et consommations dans la boucle fermée.
-- Version : 20260717000002  ·  nom : p2_planned_productions
--
-- Ajoute les tables planned_productions et planned_consumptions (audit §9.1/9.2),
-- met à jour publish_closed_loop_plan pour ingérer productions[], consumptions[]
-- et valider les dépendances (test E : publication atomique, test L : aucun orphelin).
-- La matérialisation physique (status=planned → materialized) se fait dans
-- l'endpoint PATCH /api/planning/prep-tasks/[taskId] lors du done=true (test F).
--
-- Contrat d'ingestion émis par le solveur :
--   payload.productions[] : {production_key, task_key (optionnel), recipe_code,
--     output_name, planned_portions, planned_quantity?, planned_unit?,
--     storage_method ('refrigerator'|'freezer'), available_from (date),
--     use_by (date), slot_key (créneau de production), output_kind?}
--   payload.consumptions[] : {slot_key, source: {production_key}|{cooked_dish_id}|{lot_id},
--     portions?, quantity?, unit?, role: 'main'|'component'}
--   payload.dependencies[] : {task_key, depends_on_task_key} — validation orphelin explicite
--
-- Idempotent : CREATE TABLE IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- (transaction fournie par apply-migrations.sh --single-transaction)

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. planned_productions — prévisions de production culinaire (§9.1)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.planned_productions (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid        NOT NULL
                              REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_version_id             uuid        NOT NULL
                              REFERENCES public.meal_plan_versions(id) ON DELETE CASCADE,
  -- Tâche de cuisson source (nullable : peut être absente en mode hors-tâche)
  source_task_id              bigint
                              REFERENCES public.nutrition_plan_prep_tasks(id) ON DELETE SET NULL,
  production_key              text        NOT NULL,
  recipe_code                 text        NOT NULL DEFAULT '',
  output_kind                 text        NOT NULL DEFAULT 'dish',
  output_name                 text        NOT NULL,
  planned_quantity            numeric(12,3),
  planned_unit                text,
  planned_portions            numeric(6,2) NOT NULL CHECK (planned_portions > 0),
  storage_method              text        NOT NULL
                              CHECK (storage_method IN ('refrigerator', 'freezer')),
  available_from              date        NOT NULL,
  use_by                      date        NOT NULL,
  -- planned → in_progress → materialized (plat physique créé) ou cancelled
  status                      text        NOT NULL DEFAULT 'planned'
                              CHECK (status IN ('planned', 'in_progress', 'materialized', 'cancelled')),
  -- Rempli lors de la matérialisation (PATCH /prep-tasks/[id] done=true)
  -- SET NULL si le cooked_dishes est supprimé (pas de cascade : le plan garde la trace)
  materialized_cooked_dish_id bigint
                              REFERENCES public.cooked_dishes(id) ON DELETE SET NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_version_id, production_key),
  CHECK (use_by >= available_from)
);

-- Index FK et filtres fréquents
CREATE INDEX IF NOT EXISTS idx_planned_productions_version_status
  ON public.planned_productions (plan_version_id, status);

CREATE INDEX IF NOT EXISTS idx_planned_productions_task
  ON public.planned_productions (source_task_id)
  WHERE source_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_planned_productions_materialized
  ON public.planned_productions (materialized_cooked_dish_id)
  WHERE materialized_cooked_dish_id IS NOT NULL;

COMMENT ON TABLE public.planned_productions IS
  'Prévisions de production culinaire liées à une version de plan (P2 — audit §9.1).
   Ne représente pas du stock réel. status=planned = virtuel ;
   status=materialized = cooked_dishes réel créé par la validation de tâche.
   La dé-validation (done=false) ne supprime pas un plat déjà matérialisé
   (choix intentionnel : le plat existe physiquement).
   CASCADE sur plan_version_id : toute la version efface ses productions.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. planned_consumptions — lien explicite créneau ↔ ressource (§9.2)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.planned_consumptions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL
                        REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_version_id       uuid        NOT NULL
                        REFERENCES public.meal_plan_versions(id) ON DELETE CASCADE,
  slot_id               uuid        NOT NULL
                        REFERENCES public.meal_plan_slots(id) ON DELETE CASCADE,
  -- Source : exactement UNE colonne non nulle (contrainte CHECK ci-dessous)
  planned_production_id uuid
                        REFERENCES public.planned_productions(id) ON DELETE SET NULL,
  cooked_dish_id        bigint
                        REFERENCES public.cooked_dishes(id) ON DELETE SET NULL,
  lot_id                uuid
                        REFERENCES public.inventory_lots(id) ON DELETE SET NULL,
  portions              numeric(6,2),
  quantity              numeric(12,3),
  unit                  text,
  role                  text        NOT NULL DEFAULT 'main',
  created_at            timestamptz NOT NULL DEFAULT now(),
  -- Audit §10 test L : aucune consommation sans source identifiée
  CONSTRAINT planned_consumptions_one_source CHECK (
    (planned_production_id IS NOT NULL)::int
    + (cooked_dish_id IS NOT NULL)::int
    + (lot_id IS NOT NULL)::int = 1
  )
);

-- Index FK et filtres fréquents
CREATE INDEX IF NOT EXISTS idx_planned_consumptions_slot
  ON public.planned_consumptions (slot_id);

CREATE INDEX IF NOT EXISTS idx_planned_consumptions_version
  ON public.planned_consumptions (plan_version_id);

CREATE INDEX IF NOT EXISTS idx_planned_consumptions_production
  ON public.planned_consumptions (planned_production_id)
  WHERE planned_production_id IS NOT NULL;

COMMENT ON TABLE public.planned_consumptions IS
  'Lien explicite entre un créneau et sa source planifiée (P2 — audit §9.2).
   Exactement UNE colonne source non-nulle : planned_production_id XOR cooked_dish_id XOR lot_id.
   slot_id cascade-delete sur meal_plan_slots → plan_version_id cascade.
   Les réservations inventory_reservations (P1) restent inchangées en parallèle.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. RLS — même modèle tenant que les tables voisines (auth.uid() = user_id)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.planned_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_consumptions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['planned_productions', 'planned_consumptions'] LOOP
    -- SELECT : l'utilisateur voit ses propres lignes
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      t || '_select_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING ((SELECT auth.uid()) = user_id)',
      t || '_select_own', t);
    -- INSERT : l'utilisateur ne peut insérer que pour lui-même
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      t || '_insert_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id)',
      t || '_insert_own', t);
    -- UPDATE : USING et WITH CHECK identiques (user_id immuable)
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      t || '_update_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)',
      t || '_update_own', t);
    -- DELETE : l'utilisateur peut supprimer ses propres lignes
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      t || '_delete_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING ((SELECT auth.uid()) = user_id)',
      t || '_delete_own', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.planned_productions  TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.planned_consumptions TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. publish_closed_loop_plan — extension P2
--    Ajoute l'ingestion de productions[] et consumptions[], améliore la
--    validation des dépendances (orphelins explicites), et met à jour le log.
--    Reprend intégralement le corps P1 pour être autonome (CREATE OR REPLACE).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.publish_closed_loop_plan(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  -- Auth + import
  v_uid                  uuid    := auth.uid();
  v_owner                uuid;
  v_import_id            bigint;
  v_version_id           uuid;
  v_version_no           integer;
  v_status               text;
  v_blockers             integer := 0;
  -- Iterateurs
  v_slot                 jsonb;
  v_issue                jsonb;
  v_reservation          jsonb;
  v_task                 jsonb;
  v_dependency           jsonb;
  v_item                 jsonb;
  v_snapshot             jsonb;
  -- Résultats d'insert
  v_slot_id              uuid;
  v_task_id              bigint;
  -- Maps clé→id
  v_slot_map             jsonb   := '{}'::jsonb;
  v_task_map             jsonb   := '{}'::jsonb;
  -- Réservations lots (P1)
  v_lot_qty              numeric;
  v_already_reserved     numeric;
  v_requested            numeric;
  v_snapshot_version     integer;
  -- Réservations plats cuisinés (P1)
  v_cooked_dish_id       bigint;
  v_dish_remaining       numeric;
  v_dish_reserved_else   numeric;
  v_dish_reserved_this   numeric;
  v_dish_totals          jsonb   := '{}'::jsonb;
  -- Productions planifiées (P2)
  v_production           jsonb;
  v_prod_id              uuid;
  v_prod_map             jsonb   := '{}'::jsonb;  -- production_key → prod_id::text
  -- Consommations planifiées (P2)
  v_consumption          jsonb;
  v_cons_slot_id         uuid;
  v_cons_prod_key        text;
  v_cons_dish_id         bigint;
  v_cons_lot_id          uuid;
  v_cons_prod_id         uuid;
  v_slot_date            date;
  v_available_from       date;
  v_use_by               date;
  v_planned_portions     numeric;
  v_portions_consumed    jsonb   := '{}'::jsonb;  -- production_key → portions attribuées
  v_portions_req         numeric;
  v_portions_acc         numeric;
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

  -- Libération des réservations actives de la version précédente (lots ET plats
  -- cuisinés, sans distinction de type : status='active' suffit).
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

  -- Créneaux
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

  -- Problèmes de validation
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

  -- Snapshots nutritionnels des recettes
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

  -- Réservations (lots ET plats cuisinés, P1) — uniquement pour un plan sans blocage
  IF v_status = 'published' THEN
    FOR v_reservation IN
      SELECT value FROM jsonb_array_elements(coalesce(p_payload->'reservations', '[]'::jsonb))
    LOOP
      v_cooked_dish_id := nullif(v_reservation->>'cooked_dish_id', '')::bigint;

      IF v_cooked_dish_id IS NOT NULL THEN
        -- ── Réservation de portions de plat cuisiné (P1) ────────────────────
        v_requested := (v_reservation->>'reserved_quantity')::numeric;

        SELECT portions_remaining INTO v_dish_remaining
        FROM public.cooked_dishes
        WHERE id = v_cooked_dish_id AND user_id = v_uid
        FOR UPDATE;

        IF v_dish_remaining IS NULL THEN
          RAISE EXCEPTION 'plat_introuvable : le plat cuisiné % est introuvable ou inaccessible',
            v_cooked_dish_id;
        END IF;

        SELECT coalesce(sum(reserved_quantity), 0) INTO v_dish_reserved_else
        FROM public.inventory_reservations
        WHERE cooked_dish_id = v_cooked_dish_id
          AND status = 'active'
          AND plan_version_id <> v_version_id;

        v_dish_reserved_this := coalesce(
          (v_dish_totals->>(v_cooked_dish_id::text))::numeric, 0
        );

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

  -- Tâches de préparation (remplacement des tâches auto ouvertes)
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

  -- Dépendances de tâches avec validation des orphelins (audit §10 test L)
  FOR v_dependency IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'dependencies', '[]'::jsonb))
  LOOP
    -- Validation explicite : les deux extrémités doivent être dans la MÊME version.
    -- (guard supplémentaire ; le NOT NULL de task_id rejetterait déjà un NULL::bigint)
    IF (v_task_map->>(v_dependency->>'task_key')) IS NULL THEN
      RAISE EXCEPTION
        'dependance_orpheline : la tâche « % » est inconnue dans cette version du plan',
        v_dependency->>'task_key';
    END IF;
    IF (v_task_map->>(v_dependency->>'depends_on_task_key')) IS NULL THEN
      RAISE EXCEPTION
        'dependance_orpheline : la tâche parente « % » est inconnue dans cette version du plan',
        v_dependency->>'depends_on_task_key';
    END IF;

    INSERT INTO public.prep_task_dependencies (
      user_id, plan_version_id, task_id, depends_on_task_id
    ) VALUES (
      v_uid,
      v_version_id,
      (v_task_map->>(v_dependency->>'task_key'))::bigint,
      (v_task_map->>(v_dependency->>'depends_on_task_key'))::bigint
    );
  END LOOP;

  -- ─────────────────────────────────────────────────────────────────────────
  -- P2 — Productions planifiées
  --   Résolution task_key → source_task_id via v_task_map (peut être NULL).
  --   Résultat : v_prod_map[production_key] = prod_id pour les consommations.
  -- ─────────────────────────────────────────────────────────────────────────
  FOR v_production IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'productions', '[]'::jsonb))
  LOOP
    INSERT INTO public.planned_productions (
      user_id, plan_version_id, source_task_id, production_key, recipe_code,
      output_kind, output_name, planned_quantity, planned_unit, planned_portions,
      storage_method, available_from, use_by
    ) VALUES (
      v_uid,
      v_version_id,
      -- Résolution optionnelle task_key → task_id (absent = NULL autorisé)
      CASE WHEN nullif(v_production->>'task_key', '') IS NOT NULL
        THEN nullif(v_task_map->>(v_production->>'task_key'), '')::bigint
        ELSE NULL
      END,
      v_production->>'production_key',
      coalesce(nullif(v_production->>'recipe_code', ''), ''),
      coalesce(nullif(v_production->>'output_kind', ''), 'dish'),
      v_production->>'output_name',
      nullif(v_production->>'planned_quantity', '')::numeric,
      nullif(v_production->>'planned_unit', ''),
      (v_production->>'planned_portions')::numeric,
      v_production->>'storage_method',
      (v_production->>'available_from')::date,
      (v_production->>'use_by')::date
    ) RETURNING id INTO v_prod_id;

    v_prod_map := v_prod_map || jsonb_build_object(
      v_production->>'production_key', v_prod_id::text
    );
  END LOOP;

  -- ─────────────────────────────────────────────────────────────────────────
  -- P2 — Consommations planifiées
  --   Validations (audit §10 étape 7) :
  --     • production référencée existante (même version)
  --     • créneau ≥ available_from et ≤ use_by
  --     • somme des portions consommées ≤ planned_portions
  -- ─────────────────────────────────────────────────────────────────────────
  FOR v_consumption IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'consumptions', '[]'::jsonb))
  LOOP
    -- Résolution slot_key → slot_id
    v_cons_slot_id := nullif(v_slot_map->>(v_consumption->>'slot_key'), '')::uuid;
    IF v_cons_slot_id IS NULL THEN
      RAISE EXCEPTION
        'consommation_sans_creneau : le slot_key « % » est introuvable dans ce plan',
        v_consumption->>'slot_key';
    END IF;

    -- Décodage de la source
    v_cons_prod_key := v_consumption->'source'->>'production_key';
    v_cons_dish_id  := nullif(v_consumption->'source'->>'cooked_dish_id', '')::bigint;
    v_cons_lot_id   := nullif(v_consumption->'source'->>'lot_id', '')::uuid;
    v_cons_prod_id  := NULL;

    IF v_cons_prod_key IS NOT NULL THEN
      -- Résolution production_key → planned_production_id
      v_cons_prod_id := nullif(v_prod_map->>v_cons_prod_key, '')::uuid;
      IF v_cons_prod_id IS NULL THEN
        RAISE EXCEPTION
          'production_inconnue : la consommation du slot « % » référence la production « % » '
          'absente de ce plan',
          v_consumption->>'slot_key', v_cons_prod_key;
      END IF;

      -- Lecture de la production pour validation temporelle et de portions
      SELECT pp.available_from, pp.use_by, pp.planned_portions
      INTO   v_available_from, v_use_by, v_planned_portions
      FROM public.planned_productions pp
      WHERE pp.id = v_cons_prod_id;

      -- Date du créneau (peut être NULL si colonne absente des stubs CI)
      SELECT ms.meal_date INTO v_slot_date
      FROM public.meal_plan_slots ms
      WHERE ms.id = v_cons_slot_id;

      -- Validation : consommation pas avant disponibilité
      IF v_slot_date IS NOT NULL AND v_available_from IS NOT NULL
         AND v_slot_date < v_available_from THEN
        RAISE EXCEPTION
          'consommation_avant_disponibilite : le créneau % (slot « % ») est antérieur '
          'à la date de disponibilité % de la production « % »',
          v_slot_date, v_consumption->>'slot_key', v_available_from, v_cons_prod_key;
      END IF;

      -- Validation : consommation pas après péremption
      IF v_slot_date IS NOT NULL AND v_use_by IS NOT NULL
         AND v_slot_date > v_use_by THEN
        RAISE EXCEPTION
          'consommation_apres_peremption : le créneau % (slot « % ») est postérieur '
          'à la date de péremption % de la production « % »',
          v_slot_date, v_consumption->>'slot_key', v_use_by, v_cons_prod_key;
      END IF;

      -- Validation : somme des portions ≤ planned_portions
      v_portions_req := coalesce(nullif(v_consumption->>'portions', '')::numeric, 0);
      v_portions_acc := coalesce((v_portions_consumed->>v_cons_prod_key)::numeric, 0);
      IF v_planned_portions IS NOT NULL
         AND v_portions_req > 0
         AND v_portions_acc + v_portions_req > v_planned_portions + 0.001 THEN
        RAISE EXCEPTION
          'portions_depassees : la production « % » planifie %.1f portion(s) ; '
          '%.1f demandées (%.1f déjà attribuées dans ce plan)',
          v_cons_prod_key, v_planned_portions,
          v_portions_acc + v_portions_req, v_portions_acc;
      END IF;
      -- Cumul mis à jour
      v_portions_consumed := jsonb_set(
        v_portions_consumed,
        ARRAY[v_cons_prod_key],
        to_jsonb(v_portions_acc + v_portions_req)
      );
    END IF;

    INSERT INTO public.planned_consumptions (
      user_id, plan_version_id, slot_id,
      planned_production_id, cooked_dish_id, lot_id,
      portions, quantity, unit, role
    ) VALUES (
      v_uid, v_version_id, v_cons_slot_id,
      v_cons_prod_id,
      v_cons_dish_id,
      v_cons_lot_id,
      nullif(v_consumption->>'portions', '')::numeric,
      nullif(v_consumption->>'quantity', '')::numeric,
      nullif(v_consumption->>'unit', ''),
      coalesce(nullif(v_consumption->>'role', ''), 'main')
    );
  END LOOP;

  -- ─────────────────────────────────────────────────────────────────────────
  -- Courses structurées
  -- ─────────────────────────────────────────────────────────────────────────
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
      'status',       v_status,
      'version_no',   v_version_no,
      'blockers',     v_blockers,
      'slots',        jsonb_array_length(coalesce(p_payload->'slots',         '[]'::jsonb)),
      'reservations', jsonb_array_length(coalesce(p_payload->'reservations',  '[]'::jsonb)),
      'tasks',        jsonb_array_length(coalesce(p_payload->'tasks',         '[]'::jsonb)),
      'recipe_snapshots', jsonb_array_length(coalesce(p_payload->'recipe_snapshots', '[]'::jsonb)),
      'shopping_items', jsonb_array_length(coalesce(p_payload->'shopping_items', '[]'::jsonb)),
      'productions',  jsonb_array_length(coalesce(p_payload->'productions',   '[]'::jsonb)),
      'consumptions', jsonb_array_length(coalesce(p_payload->'consumptions',  '[]'::jsonb))
    )
  );

  RETURN jsonb_build_object(
    'plan_version_id', v_version_id,
    'version_no',      v_version_no,
    'status',          v_status,
    'blockers',        v_blockers
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_closed_loop_plan(jsonb) TO authenticated;

COMMENT ON FUNCTION public.publish_closed_loop_plan(jsonb) IS
  'Publication atomique d''un plan de boucle fermée (P2).
   Ingère slots, issues, snapshots, réservations (lots ET plats P1),
   tâches, dépendances (avec validation des orphelins), productions planifiées
   et consommations planifiées dans la MÊME transaction.
   Validations P2 : production référencée existante, date créneau dans la fenêtre
   de disponibilité/péremption, somme des portions ≤ planned_portions.';

-- (commit par le wrapper apply-migrations.sh)
