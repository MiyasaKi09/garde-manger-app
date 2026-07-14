-- ============================================================================
-- Migration V2 — Publication/rollback atomiques du catalogue
-- Réf. audit directeur (fix F0) : points 7, 8. §7.6-7.7.
-- ============================================================================
-- Flux atomique :
--   1. charger les candidats (status='candidate') — invisibles, chargement chunké OK ;
--   2. les inscrire dans ops.catalog_release_items ;
--   3. publish_catalog_release() : UNE transaction promeut tout + pose le pointeur actif.
-- Si interruption avant l'étape 3 → uniquement des candidats, rien de publié.
-- Rollback = repointer active_catalog_release + démouvoir les items exclusifs, sans
-- supprimer de données (les snapshots gardent leurs versions d'origine).
-- SECURITY DEFINER, réservé au rôle data_publisher.
-- ============================================================================

CREATE OR REPLACE FUNCTION ops.publish_catalog_release(p_release_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_type text;
BEGIN
  SELECT release_type INTO v_type FROM ops.catalog_releases WHERE id = p_release_id;
  IF v_type IS NULL THEN RAISE EXCEPTION 'release % introuvable', p_release_id; END IF;

  -- Promotion des concepts puis des formes inscrits dans la release.
  UPDATE catalog.food_concepts fc SET status = 'published'
    FROM ops.catalog_release_items ri
   WHERE ri.release_id = p_release_id AND ri.entity_schema = 'catalog'
     AND ri.entity_table = 'food_concepts' AND ri.entity_id = fc.id;

  UPDATE catalog.food_forms ff SET status = 'published'
    FROM ops.catalog_release_items ri
   WHERE ri.release_id = p_release_id AND ri.entity_schema = 'catalog'
     AND ri.entity_table = 'food_forms' AND ri.entity_id = ff.id;

  -- Publication des profils nutritionnels primaires des formes de la release.
  UPDATE catalog.food_nutrition_profiles p SET published_at = now()
    FROM ops.catalog_release_items ri
   WHERE ri.release_id = p_release_id AND ri.entity_schema = 'catalog'
     AND ri.entity_table = 'food_forms' AND ri.entity_id = p.food_form_id
     AND p.is_primary AND p.published_at IS NULL;

  UPDATE ops.catalog_releases SET status = 'published', published_at = now() WHERE id = p_release_id;

  INSERT INTO ops.active_catalog_release (release_type, release_id, activated_at)
  VALUES (v_type, p_release_id, now())
  ON CONFLICT (release_type) DO UPDATE SET release_id = EXCLUDED.release_id, activated_at = now();
END $fn$;

COMMENT ON FUNCTION ops.publish_catalog_release(uuid) IS
  'Promotion ATOMIQUE d''une release (concepts/formes/profils) + pointeur actif. Une seule transaction (§7.6).';

CREATE OR REPLACE FUNCTION ops.rollback_catalog_release(p_release_type text, p_to_release_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_current uuid; v_target uuid;
BEGIN
  SELECT release_id INTO v_current FROM ops.active_catalog_release WHERE release_type = p_release_type;

  IF p_to_release_id IS NOT NULL THEN
    v_target := p_to_release_id;
  ELSE
    SELECT id INTO v_target FROM ops.catalog_releases
     WHERE release_type = p_release_type AND status = 'published'
       AND (v_current IS NULL OR id <> v_current)
     ORDER BY published_at DESC NULLS LAST LIMIT 1;
  END IF;

  -- Démouvoir (→ candidate) les formes/concepts publiés par la release courante
  -- MAIS absents de la release cible (aucune suppression de données).
  IF v_current IS NOT NULL AND v_current IS DISTINCT FROM v_target THEN
    UPDATE catalog.food_forms ff SET status = 'candidate'
      FROM ops.catalog_release_items ri
     WHERE ri.release_id = v_current AND ri.entity_schema = 'catalog' AND ri.entity_table = 'food_forms'
       AND ri.entity_id = ff.id AND ff.status = 'published'
       AND NOT EXISTS (SELECT 1 FROM ops.catalog_release_items t
                       WHERE t.release_id = v_target AND t.entity_schema='catalog'
                         AND t.entity_table='food_forms' AND t.entity_id = ff.id);
    UPDATE catalog.food_nutrition_profiles p SET published_at = NULL
      FROM ops.catalog_release_items ri
     WHERE ri.release_id = v_current AND ri.entity_schema='catalog' AND ri.entity_table='food_forms'
       AND ri.entity_id = p.food_form_id
       AND NOT EXISTS (SELECT 1 FROM ops.catalog_release_items t
                       WHERE t.release_id = v_target AND t.entity_schema='catalog'
                         AND t.entity_table='food_forms' AND t.entity_id = p.food_form_id);
    UPDATE ops.catalog_releases SET rolled_back_at = now() WHERE id = v_current;
  END IF;

  IF v_target IS NULL THEN
    -- Rollback total (aucune release cible) : plus de catalogue actif.
    DELETE FROM ops.active_catalog_release WHERE release_type = p_release_type;
  ELSE
    INSERT INTO ops.active_catalog_release (release_type, release_id, activated_at)
    VALUES (p_release_type, v_target, now())
    ON CONFLICT (release_type) DO UPDATE SET release_id = EXCLUDED.release_id, activated_at = now();
  END IF;
END $fn$;

COMMENT ON FUNCTION ops.rollback_catalog_release(text, uuid) IS
  'Rollback par pointeur : repointe la release active + démeut les items exclusifs (→ candidate), sans suppression (§7.7).';

REVOKE ALL ON FUNCTION ops.publish_catalog_release(uuid)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION ops.rollback_catalog_release(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ops.publish_catalog_release(uuid)  TO data_publisher;
GRANT EXECUTE ON FUNCTION ops.rollback_catalog_release(text, uuid) TO data_publisher;
