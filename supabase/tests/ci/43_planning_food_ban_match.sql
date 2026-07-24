-- ============================================================================
-- Assertions CI — correspondance des interdits à frontières de mots
-- (20260724000001). Scénario sans la migration → assertions ignorées.
-- Miroir des vecteurs de tests/planning/foodBanMatch.test.js : toute
-- divergence JS/SQL doit faire échouer la CI.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'planning_food_ban_matches'
  ) THEN
    RAISE NOTICE '[ban-match] planning_food_ban_matches absente (hors périmètre — assertions ignorées).';
    RETURN;
  END IF;

  -- Un interdit générique couvre ses formes spécifiques.
  IF NOT public.planning_food_ban_matches('thon au naturel en conserve égoutté', 'thon')
     OR NOT public.planning_food_ban_matches('épaule de veau crue', 'veau')
     OR NOT public.planning_food_ban_matches('fruits de mer surgelés', 'fruits de mer')
     OR NOT public.planning_food_ban_matches('céleri branche cru', 'céleri') THEN
    RAISE EXCEPTION '[ban-match] un interdit générique doit couvrir ses formes spécifiques';
  END IF;

  -- Jamais de correspondance « fragment » (collisions de l''incident du 24/07).
  IF public.planning_food_ban_matches('eau', 'veau')
     OR public.planning_food_ban_matches('eau', 'agneau')
     OR public.planning_food_ban_matches('fruit', 'fruits de mer')
     OR public.planning_food_ban_matches('navet nouveau cru', 'veau')
     OR public.planning_food_ban_matches('oignon nouveau frais', 'veau')
     OR public.planning_food_ban_matches('pain complet', 'panais') THEN
    RAISE EXCEPTION '[ban-match] un fragment de l''interdit ne doit jamais être banni';
  END IF;

  -- Dépluralisation française (« s » et « x », radical ≥ 4 lettres).
  IF NOT public.planning_food_ban_matches('épinard frais', 'épinards')
     OR NOT public.planning_food_ban_matches('poireaux', 'poireau')
     OR NOT public.planning_food_ban_matches('choux de bruxelles', 'chou')
     OR NOT public.planning_food_ban_matches('oignons nouveaux', 'oignon nouveau')
     OR public.planning_food_ban_matches('salade de mai', 'maïs') THEN
    RAISE EXCEPTION '[ban-match] dépluralisation s/x incorrecte';
  END IF;

  -- Un interdit vide ne matche jamais.
  IF public.planning_food_ban_matches('eau', '')
     OR public.planning_food_ban_matches('eau', '  ')
     OR public.planning_food_ban_matches('eau', NULL) THEN
    RAISE EXCEPTION '[ban-match] un interdit vide ne doit jamais matcher';
  END IF;

  -- Le garde-fou de publication doit utiliser le matcher : plus aucun APPEL
  -- strpos( dans le corps (le mot seul peut apparaître en commentaire).
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'publish_canonical_final_demand_plan'
      AND (pg_get_functiondef(p.oid) LIKE '%strpos(%'
        OR pg_get_functiondef(p.oid) NOT LIKE '%planning_food_ban_matches%')
  ) THEN
    RAISE EXCEPTION '[ban-match] publish_canonical_final_demand_plan ne passe pas par planning_food_ban_matches';
  END IF;

  RAISE NOTICE '[ban-match] toutes les assertions passent.';
END $$;
