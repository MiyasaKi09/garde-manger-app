-- ============================================================================
-- Assertions CI (plain SQL, sans extension) — exécutées après apply-migrations.sh.
-- Vérifient que les migrations de durcissement ont bien produit leurs objets ET
-- que l'immuabilité d'une recette publiée bloque réellement les INSERT.
-- Échoue (RAISE) => psql -v ON_ERROR_STOP=1 sort non-zéro => CI rouge.
-- La suite comportementale riche vit dans supabase/tests/*_test.sql (pgTAP, local).
-- ============================================================================

-- ── 1. Objets attendus présents ─────────────────────────────────────────────
DO $$
BEGIN
  -- fonctions
  PERFORM 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='culinary' AND p.proname='family_has_published_version';
  IF NOT FOUND THEN RAISE EXCEPTION 'manque culinary.family_has_published_version'; END IF;

  PERFORM 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='catalog' AND p.proname='is_in_active_release';
  IF NOT FOUND THEN RAISE EXCEPTION 'manque catalog.is_in_active_release'; END IF;

  PERFORM 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='ops' AND p.proname IN ('publish_catalog_release','rollback_catalog_release','confidence_rank')
    HAVING count(*) = 3;
  IF NOT FOUND THEN RAISE EXCEPTION 'manque une fonction ops.publish/rollback/confidence_rank'; END IF;

  -- colonnes OFF de complétude étiquette
  PERFORM 1 FROM information_schema.columns
    WHERE table_schema='catalog' AND table_name='commercial_products'
      AND column_name IN ('is_composite','label_nutriments','label_nutrition_complete','label_nutrition_confidence','label_nutrition_review_status')
    HAVING count(*) = 5;
  IF NOT FOUND THEN RAISE EXCEPTION 'manque une colonne label_nutrition_* / is_composite sur commercial_products'; END IF;

  -- triggers d'immuabilité (INSERT compris) sur enfants + tables de variation
  PERFORM 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='culinary' AND t.tgname LIKE 'trg_%immutable'
    HAVING count(*) >= 8;
  IF NOT FOUND THEN RAISE EXCEPTION 'triggers d''immuabilité incomplets (attendu >= 8 enfants+variation)'; END IF;
END $$;

-- ── 2. Immuabilité comportementale : INSERT sur recette PUBLIÉE bloqué ───────
-- Enveloppé dans une transaction annulée : aucune donnée ne persiste.
BEGIN;
DO $$
DECLARE v_fam uuid; v_ver uuid; v_blocked boolean := false;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,status,confidence_level)
    VALUES('CI immut', 'ci immut ' || gen_random_uuid()::text, 'candidate', 'C') RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,servings,quality_level,publication_status,content_hash)
    VALUES(v_fam, 1, 'ci', 1, 'C', 'published', 'ci-' || gen_random_uuid()::text) RETURNING id INTO v_ver;

  -- INSERT d'une étape sur une version publiée => doit lever une exception.
  BEGIN
    INSERT INTO culinary.recipe_steps(recipe_version_id, step_number, instruction) VALUES(v_ver, 1, 'x');
  EXCEPTION WHEN others THEN v_blocked := true;
  END;
  IF NOT v_blocked THEN
    RAISE EXCEPTION 'FAIL: INSERT d''une étape sur une version PUBLIÉE n''a pas été bloqué';
  END IF;

  -- INSERT d'un axe de variation sur une famille publiée => doit aussi être bloqué.
  v_blocked := false;
  BEGIN
    INSERT INTO culinary.recipe_variation_axes(recipe_family_id, name, selection_mode, required)
      VALUES(v_fam, 'ci axe', 'single', true);
  EXCEPTION WHEN others THEN v_blocked := true;
  END;
  IF NOT v_blocked THEN
    RAISE EXCEPTION 'FAIL: INSERT d''un axe sur une famille PUBLIÉE n''a pas été bloqué';
  END IF;
END $$;
ROLLBACK;

-- ── 3. Registre de migrations peuplé (le mécanisme a bien tracé) ─────────────
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM supabase_migrations.schema_migrations
   WHERE version IN ('20260715090001','20260715090002','20260715090003','20260715090004');
  IF n <> 4 THEN RAISE EXCEPTION 'registre migrations : 4 attendues, % trouvées', n; END IF;
END $$;
