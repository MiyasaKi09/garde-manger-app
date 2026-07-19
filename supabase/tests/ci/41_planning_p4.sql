-- ============================================================================
-- Assertions CI — P4 créneaux « support » (20260719000001)
-- Exécutées dans la boucle supabase/tests/ci/*.sql.
-- Scénario sans la migration P4 (fonction absente) → assertions ignorées.
-- Scénario avec P4 appliquée → le garde-fou recipe_execution_mapping_incomplete
-- doit exempter les créneaux source='support'.
-- ============================================================================

DO $$
DECLARE
  _fn_exists boolean;
  _def       text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'publish_canonical_closed_loop_plan'
  ) INTO _fn_exists;

  IF NOT _fn_exists THEN
    RAISE NOTICE '[P4] publish_canonical_closed_loop_plan absente (hors périmètre — assertions ignorées).';
    RETURN;
  END IF;

  _def := pg_get_functiondef('public.publish_canonical_closed_loop_plan(jsonb)'::regprocedure);

  -- Le garde-fou de mapping doit toujours exister (base P1)…
  IF _def NOT LIKE '%recipe_execution_mapping_incomplete%' THEN
    RAISE EXCEPTION '[P4] garde-fou recipe_execution_mapping_incomplete manquant';
  END IF;

  -- …mais les créneaux support en sont exemptés (P4). Sans cette exemption,
  -- publier un plan avec un petit-déjeuner/collation lèverait l'exception.
  IF _def NOT LIKE '%source IS DISTINCT FROM ''support''%' THEN
    RAISE EXCEPTION '[P4] exemption sûre des créneaux support (source=support) absente du garde-fou';
  END IF;

  IF _def NOT LIKE '%support_slot_invalid%'
     OR _def NOT LIKE '%meal_type%pdj%collation%'
     OR _def NOT LIKE '%preparation,mode%support%' THEN
    RAISE EXCEPTION '[P4] validation stricte des créneaux support absente';
  END IF;

  RAISE NOTICE '[P4] exemption des créneaux support présente — assertions passent.';
END $$;
