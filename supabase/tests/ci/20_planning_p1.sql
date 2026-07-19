-- ============================================================================
-- Assertions CI — P1 réservations de plats cuisinés (20260717000001)
-- Exécutées dans la boucle supabase/tests/ci/*.sql des deux scénarios A et B.
-- Scénario A : inventory_reservations.cooked_dish_id n'existe pas (migration
--   exclue du périmètre V2) → assertions ignorées gracieusement.
-- Scénario B : migration appliquée → toutes les assertions doivent passer.
-- ============================================================================

DO $$
DECLARE
  _col_exists boolean;
BEGIN
  -- Vérifier si la colonne P1 est présente (scénario B uniquement).
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'inventory_reservations'
      AND column_name  = 'cooked_dish_id'
  ) INTO _col_exists;

  IF NOT _col_exists THEN
    RAISE NOTICE '[P1] inventory_reservations.cooked_dish_id absent (scénario A hors périmètre — assertions ignorées).';
    RETURN;
  END IF;

  -- ── Colonne et type ────────────────────────────────────────────────────────
  PERFORM 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'inventory_reservations'
      AND column_name  = 'cooked_dish_id'
      AND data_type    = 'bigint';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P1] inventory_reservations.cooked_dish_id doit être bigint';
  END IF;

  -- ── Index partiel ─────────────────────────────────────────────────────────
  PERFORM 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname  = 'idx_inventory_reservations_dish_active';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P1] index idx_inventory_reservations_dish_active manquant';
  END IF;

  -- ── Fonctions de publication ──────────────────────────────────────────────
  PERFORM 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('publish_closed_loop_plan', 'publish_canonical_closed_loop_plan')
    HAVING count(*) = 2;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P1] fonctions publish_closed_loop_plan et/ou publish_canonical_closed_loop_plan manquantes';
  END IF;

  -- ── Politiques RLS sur inventory_reservations ─────────────────────────────
  PERFORM 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'inventory_reservations'
      AND policyname IN ('inventory_reservations_insert_own', 'inventory_reservations_update_own')
    HAVING count(*) = 2;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[P1] politiques RLS insert_own et/ou update_own manquantes sur inventory_reservations';
  END IF;

  RAISE NOTICE '[P1] toutes les assertions passent.';
END $$;
