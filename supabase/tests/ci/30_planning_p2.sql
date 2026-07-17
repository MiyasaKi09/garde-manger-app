-- ============================================================================
-- Assertions CI — P2 productions et consommations planifiées (20260717000002)
-- Exécutées dans la boucle supabase/tests/ci/*.sql des deux scénarios A et B.
-- Scénario A : migration P2 exclue du périmètre V2 → assertions ignorées.
-- Scénario B : migration appliquée → toutes les assertions doivent passer.
-- ============================================================================

DO $$
DECLARE
  _tbl_exists boolean;
BEGIN
  -- Vérifier si la table P2 est présente (scénario B uniquement).
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'planned_productions'
  ) INTO _tbl_exists;

  IF NOT _tbl_exists THEN
    RAISE NOTICE '[P2] planned_productions absente (scénario A hors périmètre — assertions ignorées).';
    RETURN;
  END IF;

  -- ── Table planned_productions ─────────────────────────────────────────────

  -- Colonnes obligatoires
  PERFORM 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'planned_productions'
      AND column_name IN (
        'id', 'user_id', 'plan_version_id', 'source_task_id',
        'production_key', 'recipe_code', 'output_kind', 'output_name',
        'planned_portions', 'storage_method', 'available_from', 'use_by',
        'status', 'materialized_cooked_dish_id', 'created_at'
      )
    HAVING count(*) = 15;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] colonnes manquantes sur planned_productions (attendu 15)';
  END IF;

  -- Contrainte UNIQUE (plan_version_id, production_key)
  PERFORM 1 FROM information_schema.table_constraints
    WHERE table_schema    = 'public'
      AND table_name      = 'planned_productions'
      AND constraint_type = 'UNIQUE';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] contrainte UNIQUE manquante sur planned_productions (plan_version_id, production_key)';
  END IF;

  -- RLS activé
  PERFORM 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'planned_productions'
      AND c.relrowsecurity = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] RLS non activé sur planned_productions';
  END IF;

  -- Les 4 politiques RLS (select/insert/update/delete)
  PERFORM 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'planned_productions'
      AND policyname IN (
        'planned_productions_select_own',
        'planned_productions_insert_own',
        'planned_productions_update_own',
        'planned_productions_delete_own'
      )
    HAVING count(*) = 4;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] politiques RLS manquantes sur planned_productions (attendu 4)';
  END IF;

  -- Index version+status
  PERFORM 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname  = 'idx_planned_productions_version_status';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] index idx_planned_productions_version_status manquant';
  END IF;

  -- ── Table planned_consumptions ────────────────────────────────────────────

  PERFORM 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'planned_consumptions';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] table planned_consumptions manquante';
  END IF;

  -- Colonnes obligatoires
  PERFORM 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'planned_consumptions'
      AND column_name IN (
        'id', 'user_id', 'plan_version_id', 'slot_id',
        'planned_production_id', 'cooked_dish_id', 'lot_id',
        'portions', 'quantity', 'unit', 'role', 'created_at'
      )
    HAVING count(*) = 12;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] colonnes manquantes sur planned_consumptions (attendu 12)';
  END IF;

  -- Contrainte CHECK planned_consumptions_one_source
  PERFORM 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name   = 'planned_consumptions_one_source';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] contrainte CHECK planned_consumptions_one_source manquante';
  END IF;

  -- RLS activé
  PERFORM 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'planned_consumptions'
      AND c.relrowsecurity = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] RLS non activé sur planned_consumptions';
  END IF;

  -- Les 4 politiques RLS (select/insert/update/delete)
  PERFORM 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'planned_consumptions'
      AND policyname IN (
        'planned_consumptions_select_own',
        'planned_consumptions_insert_own',
        'planned_consumptions_update_own',
        'planned_consumptions_delete_own'
      )
    HAVING count(*) = 4;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] politiques RLS manquantes sur planned_consumptions (attendu 4)';
  END IF;

  -- Index slot
  PERFORM 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname  = 'idx_planned_consumptions_slot';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] index idx_planned_consumptions_slot manquant';
  END IF;

  -- ── Fonction publish_closed_loop_plan (P2 — co-existence avec P1) ─────────
  PERFORM 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'publish_closed_loop_plan';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P2] fonction publish_closed_loop_plan absente';
  END IF;

  RAISE NOTICE '[P2] toutes les assertions passent.';
END $$;
