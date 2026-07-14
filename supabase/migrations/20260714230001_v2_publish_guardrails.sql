-- ============================================================================
-- Migration V2 — Garde-fous de publication + rollback robuste (fix R0, point 46)
-- ============================================================================
-- publish_catalog_release() ne doit PAS promouvoir aveuglément. Il vérifie :
--   - release en état 'publishing'/'candidate' ; contient des items ; checksums non vides ;
--   - chaque forme : identité/catégorie/état ≥ B ; profil nutritionnel primaire présent ;
--   - aucune tâche de revue OUVERTE sur les entités de la release.
-- Toute violation -> EXCEPTION -> transaction annulée -> rien de publié (atomique).
-- rollback_catalog_release() : démeut aussi les CONCEPTS exclusifs et valide le type.
-- Idempotent (CREATE OR REPLACE).
-- ============================================================================

-- Rang de confiance (D<C<B<A<A+).
CREATE OR REPLACE FUNCTION ops.confidence_rank(c text)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = '' AS $fn$
  SELECT CASE c WHEN 'A+' THEN 4 WHEN 'A' THEN 3 WHEN 'B' THEN 2 WHEN 'C' THEN 1 ELSE 0 END
$fn$;

CREATE OR REPLACE FUNCTION ops.publish_catalog_release(p_release_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_type text; v_status text; v_checksums jsonb; v_items int; v_bad int; v_open int; v_nonut int;
BEGIN
  SELECT release_type, status, checksums INTO v_type, v_status, v_checksums
  FROM ops.catalog_releases WHERE id = p_release_id;
  IF v_type IS NULL THEN RAISE EXCEPTION 'release % introuvable', p_release_id; END IF;
  IF v_status NOT IN ('publishing','candidate') THEN
    RAISE EXCEPTION 'release %: statut % non publiable (attendu publishing/candidate)', p_release_id, v_status;
  END IF;
  IF v_checksums IS NULL OR v_checksums = '{}'::jsonb THEN
    RAISE EXCEPTION 'release %: checksums manquants', p_release_id;
  END IF;

  SELECT count(*) INTO v_items FROM ops.catalog_release_items WHERE release_id = p_release_id;
  IF v_items = 0 THEN RAISE EXCEPTION 'release %: aucun item', p_release_id; END IF;

  -- Formes de la release : confiances minimales (identité/catégorie/état ≥ B).
  SELECT count(*) INTO v_bad
  FROM ops.catalog_release_items ri JOIN catalog.food_forms ff ON ff.id = ri.entity_id
  WHERE ri.release_id = p_release_id AND ri.entity_table = 'food_forms'
    AND (ops.confidence_rank(ff.identity_confidence) < 2
      OR ops.confidence_rank(ff.category_confidence) < 2
      OR ops.confidence_rank(ff.state_confidence) < 2);
  IF v_bad > 0 THEN RAISE EXCEPTION 'release %: % forme(s) sous confiance B (identité/catégorie/état)', p_release_id, v_bad; END IF;

  -- Chaque forme doit avoir un profil nutritionnel primaire.
  SELECT count(*) INTO v_nonut
  FROM ops.catalog_release_items ri
  WHERE ri.release_id = p_release_id AND ri.entity_table = 'food_forms'
    AND NOT EXISTS (SELECT 1 FROM catalog.food_nutrition_profiles p
                    WHERE p.food_form_id = ri.entity_id AND p.is_primary);
  IF v_nonut > 0 THEN RAISE EXCEPTION 'release %: % forme(s) sans nutrition primaire', p_release_id, v_nonut; END IF;

  -- Aucune tâche de revue ouverte sur les entités de la release.
  SELECT count(*) INTO v_open
  FROM ops.catalog_release_items ri JOIN quality.review_tasks rt ON rt.entity_id = ri.entity_id
  WHERE ri.release_id = p_release_id AND rt.status = 'open';
  IF v_open > 0 THEN RAISE EXCEPTION 'release %: % tâche(s) de revue ouverte(s) à résoudre', p_release_id, v_open; END IF;

  -- Promotion atomique.
  UPDATE catalog.food_concepts fc SET status = 'published'
    FROM ops.catalog_release_items ri
   WHERE ri.release_id = p_release_id AND ri.entity_table = 'food_concepts' AND ri.entity_id = fc.id;
  UPDATE catalog.food_forms ff SET status = 'published'
    FROM ops.catalog_release_items ri
   WHERE ri.release_id = p_release_id AND ri.entity_table = 'food_forms' AND ri.entity_id = ff.id;
  UPDATE catalog.food_nutrition_profiles p SET published_at = now()
    FROM ops.catalog_release_items ri
   WHERE ri.release_id = p_release_id AND ri.entity_table = 'food_forms' AND ri.entity_id = p.food_form_id
     AND p.is_primary AND p.published_at IS NULL;

  UPDATE ops.catalog_releases SET status = 'published', published_at = now() WHERE id = p_release_id;
  INSERT INTO ops.active_catalog_release (release_type, release_id, activated_at)
  VALUES (v_type, p_release_id, now())
  ON CONFLICT (release_type) DO UPDATE SET release_id = EXCLUDED.release_id, activated_at = now();
END $fn$;

-- Rollback : démeut formes ET concepts exclusifs ; valide le type de la cible.
CREATE OR REPLACE FUNCTION ops.rollback_catalog_release(p_release_type text, p_to_release_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_current uuid; v_target uuid; v_target_type text;
BEGIN
  SELECT release_id INTO v_current FROM ops.active_catalog_release WHERE release_type = p_release_type;
  IF p_to_release_id IS NOT NULL THEN
    SELECT id, release_type INTO v_target, v_target_type FROM ops.catalog_releases WHERE id = p_to_release_id;
    IF v_target_type IS DISTINCT FROM p_release_type THEN
      RAISE EXCEPTION 'rollback: la release cible % n''est pas du type %', p_to_release_id, p_release_type;
    END IF;
  ELSE
    SELECT id INTO v_target FROM ops.catalog_releases
     WHERE release_type = p_release_type AND status = 'published' AND (v_current IS NULL OR id <> v_current)
     ORDER BY published_at DESC NULLS LAST LIMIT 1;
  END IF;

  IF v_current IS NOT NULL AND v_current IS DISTINCT FROM v_target THEN
    UPDATE catalog.food_forms ff SET status = 'candidate'
      FROM ops.catalog_release_items ri
     WHERE ri.release_id = v_current AND ri.entity_table = 'food_forms' AND ri.entity_id = ff.id AND ff.status = 'published'
       AND NOT EXISTS (SELECT 1 FROM ops.catalog_release_items t WHERE t.release_id = v_target
                       AND t.entity_table='food_forms' AND t.entity_id = ff.id);
    UPDATE catalog.food_concepts fc SET status = 'candidate'
      FROM ops.catalog_release_items ri
     WHERE ri.release_id = v_current AND ri.entity_table = 'food_concepts' AND ri.entity_id = fc.id AND fc.status = 'published'
       AND NOT EXISTS (SELECT 1 FROM ops.catalog_release_items t WHERE t.release_id = v_target
                       AND t.entity_table='food_concepts' AND t.entity_id = fc.id);
    UPDATE catalog.food_nutrition_profiles p SET published_at = NULL
      FROM ops.catalog_release_items ri
     WHERE ri.release_id = v_current AND ri.entity_table = 'food_forms' AND ri.entity_id = p.food_form_id
       AND NOT EXISTS (SELECT 1 FROM ops.catalog_release_items t WHERE t.release_id = v_target
                       AND t.entity_table='food_forms' AND t.entity_id = p.food_form_id);
    UPDATE ops.catalog_releases SET rolled_back_at = now(), status = 'retracted' WHERE id = v_current;
  END IF;

  IF v_target IS NULL THEN
    DELETE FROM ops.active_catalog_release WHERE release_type = p_release_type;
  ELSE
    INSERT INTO ops.active_catalog_release (release_type, release_id, activated_at)
    VALUES (p_release_type, v_target, now())
    ON CONFLICT (release_type) DO UPDATE SET release_id = EXCLUDED.release_id, activated_at = now();
  END IF;
END $fn$;

REVOKE ALL ON FUNCTION ops.publish_catalog_release(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION ops.rollback_catalog_release(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ops.publish_catalog_release(uuid) TO data_publisher;
GRANT EXECUTE ON FUNCTION ops.rollback_catalog_release(text, uuid) TO data_publisher;
