-- ============================================================================
-- Migration V2 — Garde-fous de publication renforcés + activation exclusive
-- Remplace ops.publish_catalog_release() (CREATE OR REPLACE) en conservant
-- tous les contrôles existants et en ajoutant :
--   • confiance du profil nutritionnel primaire ≥ B
--   • confiance du food_concept parent ≥ B
--   • macros essentiels présents dans le profil primaire
--   • au moins une ligne de provenance pour chaque forme/profil
--   • conservation (si données présentes) — dégradation gracieuse sinon
--   • conversion d'unité (si données présentes) — dégradation gracieuse
--   • recomputation des checksums par item et rejet si divergence
-- Activation exclusive : avant de publier, toute forme actuellement publiée
--   absente de la nouvelle release est ramenée à 'candidate'.
-- rollback_catalog_release() est mis à jour pour republier les items de la
--   release cible et maintenir la cohérence du set publié.
-- Idempotent (CREATE OR REPLACE).
-- ============================================================================

-- La fonction ops.confidence_rank est déjà définie dans 20260714230001.
-- On la re-crée ici au cas où ce fichier est appliqué seul (idempotent).
CREATE OR REPLACE FUNCTION ops.confidence_rank(c text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $fn$
  SELECT CASE c
    WHEN 'A+' THEN 4
    WHEN 'A'  THEN 3
    WHEN 'B'  THEN 2
    WHEN 'C'  THEN 1
    ELSE 0
  END
$fn$;

-- ── Publication renforcée + activation exclusive ─────────────────────────────
CREATE OR REPLACE FUNCTION ops.publish_catalog_release(p_release_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  -- variables de vérification existantes
  v_type            text;
  v_status          text;
  v_checksums       jsonb;
  v_items           int;
  v_bad             int;
  v_open            int;
  v_nonut           int;
  -- nouvelles variables de vérification
  v_bad_nut_conf    int;
  v_bad_con_conf    int;
  v_missing_macro   int;
  v_no_provenance   int;
  v_no_conservation int := 0;
  v_no_conversion   int := 0;
  v_checksum_err    int;
  -- activation exclusive
  v_current_active  uuid;
BEGIN
  -- ── 1. Vérifications fondamentales (existantes) ───────────────────────────
  SELECT release_type, status, checksums
    INTO v_type, v_status, v_checksums
    FROM ops.catalog_releases
   WHERE id = p_release_id;

  IF v_type IS NULL THEN
    RAISE EXCEPTION 'release % introuvable', p_release_id;
  END IF;

  IF v_status NOT IN ('publishing', 'candidate') THEN
    RAISE EXCEPTION 'release %: statut % non publiable (attendu publishing/candidate)',
      p_release_id, v_status;
  END IF;

  IF v_checksums IS NULL OR v_checksums = '{}'::jsonb THEN
    RAISE EXCEPTION 'release %: checksums release-level manquants', p_release_id;
  END IF;

  SELECT count(*) INTO v_items
    FROM ops.catalog_release_items
   WHERE release_id = p_release_id;

  IF v_items = 0 THEN
    RAISE EXCEPTION 'release %: aucun item inscrit', p_release_id;
  END IF;

  -- Confiance minimale identité/catégorie/état ≥ B sur les formes (existant).
  SELECT count(*) INTO v_bad
    FROM ops.catalog_release_items ri
    JOIN catalog.food_forms ff ON ff.id = ri.entity_id
   WHERE ri.release_id = p_release_id
     AND ri.entity_table = 'food_forms'
     AND (ops.confidence_rank(ff.identity_confidence) < 2
       OR ops.confidence_rank(ff.category_confidence) < 2
       OR ops.confidence_rank(ff.state_confidence)    < 2);

  IF v_bad > 0 THEN
    RAISE EXCEPTION 'release %: % forme(s) sous confiance B (identité/catégorie/état)',
      p_release_id, v_bad;
  END IF;

  -- Chaque forme doit avoir un profil nutritionnel primaire (existant).
  SELECT count(*) INTO v_nonut
    FROM ops.catalog_release_items ri
   WHERE ri.release_id = p_release_id
     AND ri.entity_table = 'food_forms'
     AND NOT EXISTS (
       SELECT 1 FROM catalog.food_nutrition_profiles p
       WHERE p.food_form_id = ri.entity_id AND p.is_primary
     );

  IF v_nonut > 0 THEN
    RAISE EXCEPTION 'release %: % forme(s) sans profil nutritionnel primaire',
      p_release_id, v_nonut;
  END IF;

  -- Aucune tâche de revue ouverte (existant).
  SELECT count(*) INTO v_open
    FROM ops.catalog_release_items ri
    JOIN quality.review_tasks rt ON rt.entity_id = ri.entity_id
   WHERE ri.release_id = p_release_id
     AND rt.status = 'open';

  IF v_open > 0 THEN
    RAISE EXCEPTION 'release %: % tâche(s) de revue ouverte(s) à résoudre',
      p_release_id, v_open;
  END IF;

  -- ── 2. Nouvelles vérifications ────────────────────────────────────────────

  -- 2a. Confiance du profil nutritionnel primaire ≥ B.
  SELECT count(*) INTO v_bad_nut_conf
    FROM ops.catalog_release_items ri
    JOIN catalog.food_nutrition_profiles p
      ON p.food_form_id = ri.entity_id AND p.is_primary
   WHERE ri.release_id = p_release_id
     AND ri.entity_table = 'food_forms'
     AND ops.confidence_rank(p.confidence_level) < 2;

  IF v_bad_nut_conf > 0 THEN
    RAISE EXCEPTION 'release %: % profil(s) nutritionnel(s) primaire(s) sous confiance B',
      p_release_id, v_bad_nut_conf;
  END IF;

  -- 2b. Confiance du food_concept parent ≥ B.
  SELECT count(*) INTO v_bad_con_conf
    FROM ops.catalog_release_items ri
    JOIN catalog.food_forms ff ON ff.id = ri.entity_id
    JOIN catalog.food_concepts fc ON fc.id = ff.food_concept_id
   WHERE ri.release_id = p_release_id
     AND ri.entity_table = 'food_forms'
     AND ops.confidence_rank(fc.confidence_level) < 2;

  IF v_bad_con_conf > 0 THEN
    RAISE EXCEPTION 'release %: % concept(s) alimentaire(s) sous confiance B',
      p_release_id, v_bad_con_conf;
  END IF;

  -- 2c. Macros essentiels présents dans le profil primaire
  --     (énergie kcal, protéines, glucides, lipides).
  SELECT count(*) INTO v_missing_macro
    FROM (
      SELECT p.id AS prof_id
        FROM ops.catalog_release_items ri
        JOIN catalog.food_nutrition_profiles p
          ON p.food_form_id = ri.entity_id AND p.is_primary
       WHERE ri.release_id = p_release_id
         AND ri.entity_table = 'food_forms'
    ) prof
   WHERE NOT (
     EXISTS (
       SELECT 1 FROM catalog.food_nutrient_values v
       WHERE v.nutrition_profile_id = prof.prof_id
         AND v.amount IS NOT NULL
         AND v.nutrient_code ILIKE '%kcal%'
     )
     AND EXISTS (
       SELECT 1 FROM catalog.food_nutrient_values v
       WHERE v.nutrition_profile_id = prof.prof_id
         AND v.amount IS NOT NULL
         AND v.nutrient_code ILIKE '%prot%'
     )
     AND EXISTS (
       SELECT 1 FROM catalog.food_nutrient_values v
       WHERE v.nutrition_profile_id = prof.prof_id
         AND v.amount IS NOT NULL
         AND (v.nutrient_code ILIKE '%glucid%' OR v.nutrient_code ILIKE '%carb%')
     )
     AND EXISTS (
       SELECT 1 FROM catalog.food_nutrient_values v
       WHERE v.nutrition_profile_id = prof.prof_id
         AND v.amount IS NOT NULL
         AND (v.nutrient_code ILIKE '%lipid%'
              OR v.nutrient_code ILIKE '%fat%'
              OR v.nutrient_code ILIKE '%gras%')
     )
   );

  IF v_missing_macro > 0 THEN
    RAISE EXCEPTION 'release %: % forme(s) avec macros essentiels manquants (énergie/protéines/glucides/lipides)',
      p_release_id, v_missing_macro;
  END IF;

  -- 2d. Au moins une ligne de provenance par forme ou profil primaire.
  SELECT count(*) INTO v_no_provenance
    FROM ops.catalog_release_items ri
   WHERE ri.release_id = p_release_id
     AND ri.entity_table = 'food_forms'
     AND NOT EXISTS (
       SELECT 1 FROM ops.field_provenance fp
       WHERE fp.entity_schema = 'catalog'
         AND (
           (fp.entity_table = 'food_forms' AND fp.entity_id = ri.entity_id)
           OR (
             fp.entity_table = 'food_nutrition_profiles'
             AND EXISTS (
               SELECT 1 FROM catalog.food_nutrition_profiles p2
               WHERE p2.id = fp.entity_id
                 AND p2.food_form_id = ri.entity_id
                 AND p2.is_primary
             )
           )
         )
     );

  IF v_no_provenance > 0 THEN
    RAISE EXCEPTION 'release %: % forme(s) sans aucune ligne de provenance (ops.field_provenance)',
      p_release_id, v_no_provenance;
  END IF;

  -- 2e. Conservation — dégradation gracieuse si la table est absente ou vide.
  BEGIN
    EXECUTE $q$
      SELECT count(*)
      FROM ops.catalog_release_items ri
      WHERE ri.release_id = $1
        AND ri.entity_table = 'food_forms'
        AND NOT EXISTS (
          SELECT 1 FROM catalog.food_storage_profiles sp
          WHERE sp.food_form_id = ri.entity_id
        )
      -- Uniquement si la table de conservation contient des données
        AND (SELECT count(*) FROM catalog.food_storage_profiles) > 0
    $q$ INTO v_no_conservation USING p_release_id;

    IF v_no_conservation > 0 THEN
      RAISE EXCEPTION 'release %: % forme(s) sans profil de conservation (food_storage_profiles)',
        p_release_id, v_no_conservation;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- table absente dans cette instance : vérification ignorée
  END;

  -- 2f. Conversions d'unités — dégradation gracieuse si la table est absente ou vide.
  BEGIN
    EXECUTE $q$
      SELECT count(*)
      FROM ops.catalog_release_items ri
      WHERE ri.release_id = $1
        AND ri.entity_table = 'food_forms'
        AND NOT EXISTS (
          SELECT 1 FROM catalog.food_unit_conversions uc
          WHERE uc.food_form_id = ri.entity_id
        )
        AND (SELECT count(*) FROM catalog.food_unit_conversions) > 0
    $q$ INTO v_no_conversion USING p_release_id;

    IF v_no_conversion > 0 THEN
      RAISE EXCEPTION 'release %: % forme(s) sans conversion d''unité (food_unit_conversions)',
        p_release_id, v_no_conversion;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 2g. Validité des checksums par item (si content_hash renseigné dans l'item).
  --     On recompute un hash déterministe des champs principaux de la forme
  --     et on rejette toute divergence.
  SELECT count(*) INTO v_checksum_err
    FROM ops.catalog_release_items ri
    JOIN catalog.food_forms ff ON ff.id = ri.entity_id
   WHERE ri.release_id = p_release_id
     AND ri.entity_table = 'food_forms'
     AND ri.content_hash IS NOT NULL
     AND ri.content_hash IS DISTINCT FROM md5(
       jsonb_build_object(
         'id',                       ff.id,
         'canonical_name',           ff.canonical_name,
         'canonical_name_normalized', ff.canonical_name_normalized,
         'food_concept_id',          ff.food_concept_id,
         'physical_state',           ff.physical_state,
         'cooking_state',            ff.cooking_state,
         'preservation_state',       ff.preservation_state,
         'default_quantity_unit',    ff.default_quantity_unit,
         'edible_yield_ratio',       ff.edible_yield_ratio
       )::text
     );

  IF v_checksum_err > 0 THEN
    RAISE EXCEPTION 'release %: % checksum(s) item invalide(s) — contenu modifié depuis l''inscription',
      p_release_id, v_checksum_err;
  END IF;

  -- ── 3. Activation exclusive ───────────────────────────────────────────────
  -- Avant de promouvoir la nouvelle release, démouvoir les formes et profils
  -- de la release ACTUELLEMENT active qui ne font pas partie de la nouvelle.
  -- Garantit : published_set == items de la release active.

  SELECT release_id INTO v_current_active
    FROM ops.active_catalog_release
   WHERE release_type = v_type;

  IF v_current_active IS NOT NULL AND v_current_active IS DISTINCT FROM p_release_id THEN
    -- Démouvoir les formes exclues de la nouvelle release.
    UPDATE catalog.food_forms ff
       SET status = 'candidate'
      FROM ops.catalog_release_items old_ri
     WHERE old_ri.release_id = v_current_active
       AND old_ri.entity_schema = 'catalog'
       AND old_ri.entity_table  = 'food_forms'
       AND old_ri.entity_id     = ff.id
       AND ff.status            = 'published'
       AND NOT EXISTS (
         SELECT 1 FROM ops.catalog_release_items new_ri
         WHERE new_ri.release_id    = p_release_id
           AND new_ri.entity_schema = 'catalog'
           AND new_ri.entity_table  = 'food_forms'
           AND new_ri.entity_id     = ff.id
       );

    -- Dépublier les profils nutritionnels des formes démues.
    UPDATE catalog.food_nutrition_profiles p
       SET published_at = NULL
      FROM ops.catalog_release_items old_ri
     WHERE old_ri.release_id    = v_current_active
       AND old_ri.entity_schema = 'catalog'
       AND old_ri.entity_table  = 'food_forms'
       AND old_ri.entity_id     = p.food_form_id
       AND p.published_at IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM ops.catalog_release_items new_ri
         WHERE new_ri.release_id    = p_release_id
           AND new_ri.entity_schema = 'catalog'
           AND new_ri.entity_table  = 'food_forms'
           AND new_ri.entity_id     = p.food_form_id
       );

    -- Démouvoir les concepts exclusifs de la release sortante.
    UPDATE catalog.food_concepts fc
       SET status = 'candidate'
      FROM ops.catalog_release_items old_ri
     WHERE old_ri.release_id    = v_current_active
       AND old_ri.entity_schema = 'catalog'
       AND old_ri.entity_table  = 'food_concepts'
       AND old_ri.entity_id     = fc.id
       AND fc.status            = 'published'
       AND NOT EXISTS (
         SELECT 1 FROM ops.catalog_release_items new_ri
         WHERE new_ri.release_id    = p_release_id
           AND new_ri.entity_schema = 'catalog'
           AND new_ri.entity_table  = 'food_concepts'
           AND new_ri.entity_id     = fc.id
       );
  END IF;

  -- ── 4. Promotion atomique ─────────────────────────────────────────────────
  UPDATE catalog.food_concepts fc
     SET status = 'published'
    FROM ops.catalog_release_items ri
   WHERE ri.release_id   = p_release_id
     AND ri.entity_table = 'food_concepts'
     AND ri.entity_id    = fc.id;

  UPDATE catalog.food_forms ff
     SET status = 'published'
    FROM ops.catalog_release_items ri
   WHERE ri.release_id   = p_release_id
     AND ri.entity_table = 'food_forms'
     AND ri.entity_id    = ff.id;

  UPDATE catalog.food_nutrition_profiles p
     SET published_at = now()
    FROM ops.catalog_release_items ri
   WHERE ri.release_id   = p_release_id
     AND ri.entity_table = 'food_forms'
     AND ri.entity_id    = p.food_form_id
     AND p.is_primary
     AND p.published_at IS NULL;

  UPDATE ops.catalog_releases
     SET status = 'published', published_at = now()
   WHERE id = p_release_id;

  -- Mettre à jour le pointeur actif.
  INSERT INTO ops.active_catalog_release (release_type, release_id, activated_at)
  VALUES (v_type, p_release_id, now())
  ON CONFLICT (release_type)
    DO UPDATE SET release_id = EXCLUDED.release_id, activated_at = now();
END $fn$;

COMMENT ON FUNCTION ops.publish_catalog_release(uuid) IS
  'Publication ATOMIQUE + activation exclusive : contrôles renforcés (confiance nutrition/concept ≥ B, macros,'
  ' provenance, conservation, conversions, checksums), démouvement des formes exclues avant promotion (§7.6).';

-- ── Rollback cohérent avec l'ensemble publié ─────────────────────────────────
-- Remet à jour le set publié en republiant les items de la release cible
-- et en démouv ant ceux de la release courante absents de la cible.
CREATE OR REPLACE FUNCTION ops.rollback_catalog_release(
  p_release_type  text,
  p_to_release_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_current      uuid;
  v_target       uuid;
  v_target_type  text;
BEGIN
  SELECT release_id INTO v_current
    FROM ops.active_catalog_release
   WHERE release_type = p_release_type;

  IF p_to_release_id IS NOT NULL THEN
    SELECT id, release_type INTO v_target, v_target_type
      FROM ops.catalog_releases
     WHERE id = p_to_release_id;

    IF v_target_type IS DISTINCT FROM p_release_type THEN
      RAISE EXCEPTION 'rollback: la release cible % n''est pas du type %',
        p_to_release_id, p_release_type;
    END IF;
  ELSE
    SELECT id INTO v_target
      FROM ops.catalog_releases
     WHERE release_type = p_release_type
       AND status = 'published'
       AND (v_current IS NULL OR id <> v_current)
     ORDER BY published_at DESC NULLS LAST
     LIMIT 1;
  END IF;

  -- Démouvoir les entités de la release courante absentes de la cible.
  IF v_current IS NOT NULL AND v_current IS DISTINCT FROM v_target THEN
    UPDATE catalog.food_forms ff
       SET status = 'candidate'
      FROM ops.catalog_release_items ri
     WHERE ri.release_id    = v_current
       AND ri.entity_table  = 'food_forms'
       AND ri.entity_id     = ff.id
       AND ff.status        = 'published'
       AND NOT EXISTS (
         SELECT 1 FROM ops.catalog_release_items t
         WHERE t.release_id   = v_target
           AND t.entity_table = 'food_forms'
           AND t.entity_id    = ff.id
       );

    UPDATE catalog.food_concepts fc
       SET status = 'candidate'
      FROM ops.catalog_release_items ri
     WHERE ri.release_id    = v_current
       AND ri.entity_table  = 'food_concepts'
       AND ri.entity_id     = fc.id
       AND fc.status        = 'published'
       AND NOT EXISTS (
         SELECT 1 FROM ops.catalog_release_items t
         WHERE t.release_id   = v_target
           AND t.entity_table = 'food_concepts'
           AND t.entity_id    = fc.id
       );

    UPDATE catalog.food_nutrition_profiles p
       SET published_at = NULL
      FROM ops.catalog_release_items ri
     WHERE ri.release_id   = v_current
       AND ri.entity_table = 'food_forms'
       AND ri.entity_id    = p.food_form_id
       AND p.published_at IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM ops.catalog_release_items t
         WHERE t.release_id   = v_target
           AND t.entity_table = 'food_forms'
           AND t.entity_id    = p.food_form_id
       );

    UPDATE ops.catalog_releases
       SET rolled_back_at = now(), status = 'retracted'
     WHERE id = v_current;
  END IF;

  IF v_target IS NULL THEN
    -- Rollback total : plus aucune release active pour ce type.
    DELETE FROM ops.active_catalog_release WHERE release_type = p_release_type;
  ELSE
    -- Republier les items de la release cible (ils ont pu être démis entre-temps).
    UPDATE catalog.food_forms ff
       SET status = 'published'
      FROM ops.catalog_release_items t
     WHERE t.release_id   = v_target
       AND t.entity_table = 'food_forms'
       AND t.entity_id    = ff.id;

    UPDATE catalog.food_concepts fc
       SET status = 'published'
      FROM ops.catalog_release_items t
     WHERE t.release_id   = v_target
       AND t.entity_table = 'food_concepts'
       AND t.entity_id    = fc.id;

    UPDATE catalog.food_nutrition_profiles p
       SET published_at = COALESCE(p.published_at, now())
      FROM ops.catalog_release_items t
     WHERE t.release_id   = v_target
       AND t.entity_table = 'food_forms'
       AND t.entity_id    = p.food_form_id
       AND p.is_primary;

    INSERT INTO ops.active_catalog_release (release_type, release_id, activated_at)
    VALUES (p_release_type, v_target, now())
    ON CONFLICT (release_type)
      DO UPDATE SET release_id = EXCLUDED.release_id, activated_at = now();
  END IF;
END $fn$;

COMMENT ON FUNCTION ops.rollback_catalog_release(text, uuid) IS
  'Rollback cohérent : démouv les exclusifs, republie les items cibles, maintient published_set == release_active (§7.7).';

-- Droits inchangés.
REVOKE ALL ON FUNCTION ops.publish_catalog_release(uuid)           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION ops.rollback_catalog_release(text, uuid)    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION ops.publish_catalog_release(uuid)       TO data_publisher;
GRANT  EXECUTE ON FUNCTION ops.rollback_catalog_release(text, uuid) TO data_publisher;
