-- ============================================================================
-- Tests pgTAP — Durcissement audit directeur V2
-- Migrations couvertes : 20260715090001 .. 090004
-- Exécution : pg_prove -U postgres -d myko_dev supabase/tests/v2_audit_hardening.test.sql
-- Prérequis : CREATE EXTENSION IF NOT EXISTS pgtap; + migrations appliquées.
-- Tout le test tourne dans une transaction ROLLBACK : aucune donnée persistante.
-- ============================================================================

BEGIN;

SELECT plan(13);

-- ============================================================================
-- SETUP : données de test (une seule transaction)
-- ============================================================================
DO $$
DECLARE
  v_cat_id            uuid;
  v_concept_id        uuid;
  v_form_simple_id    uuid;
  v_form_composite_id uuid;
  v_fam_pub           uuid;   -- famille ayant une version publiée
  v_fam_draft         uuid;   -- famille sans version publiée
  v_ver_pub           uuid;   -- version publiée (dans fam_pub)
  v_ver_draft         uuid;   -- version brouillon (dans fam_pub, 2ème version)
  v_ds_id             uuid;
  v_np_id             uuid;
  v_rel_a_id          uuid;
  v_rel_b_id          uuid;
  v_axis_draft        uuid;   -- axe de variation rattaché à fam_draft (non publiée)
  v_opt1_id           uuid;
  v_opt2_id           uuid;
BEGIN
  -- ── Catégorie de test
  INSERT INTO catalog.food_categories(code, label, position)
  VALUES ('_t_hrd_cat', '_Test Hardening', 998)
  ON CONFLICT (code) DO UPDATE SET label = '_Test Hardening';
  SELECT id INTO v_cat_id FROM catalog.food_categories WHERE code = '_t_hrd_cat';

  -- ── Source dataset de test
  INSERT INTO ops.source_datasets(code, name, publisher, source_url, license_code,
    allowed_uses, update_strategy)
  VALUES ('_t_hrd_ds', 'Dataset test hardening', 'Test', 'https://test', 'MIT',
    '["test"]'::jsonb, 'manual')
  ON CONFLICT (code) DO NOTHING;
  SELECT id INTO v_ds_id FROM ops.source_datasets WHERE code = '_t_hrd_ds';

  -- ── Concept alimentaire de test
  INSERT INTO catalog.food_concepts(canonical_name, canonical_name_normalized,
    category_id, status, confidence_level, category_confidence)
  VALUES ('_Test Concept Hardening', '_test_concept_hardening', v_cat_id,
    'candidate', 'B', 'B')
  RETURNING id INTO v_concept_id;

  -- ── Forme simple publiée (produit simple → nutrition générique)
  INSERT INTO catalog.food_forms(food_concept_id, canonical_name, canonical_name_normalized,
    default_quantity_unit, status, confidence_level, identity_confidence,
    category_confidence, state_confidence)
  VALUES (v_concept_id, '_Test Forme Simple Hrd', '_test_forme_simple_hrd', 'g',
    'published', 'B', 'B', 'B', 'B')
  RETURNING id INTO v_form_simple_id;

  -- Profil nutritionnel primaire + valeurs pour la forme simple
  INSERT INTO catalog.food_nutrition_profiles(food_form_id, source_dataset_id,
    source_record_key, data_version, confidence_level, is_primary, published_at)
  VALUES (v_form_simple_id, v_ds_id, '_t_hrd_rec', '2026-07-15', 'B', true, now())
  RETURNING id INTO v_np_id;

  INSERT INTO catalog.food_nutrient_values(nutrition_profile_id, nutrient_code, amount, unit)
  VALUES
    (v_np_id, 'energy_kcal', 95,  'kcal'),
    (v_np_id, 'protein_g',    5,  'g'),
    (v_np_id, 'carbohydrate_g', 15, 'g'),
    (v_np_id, 'fat_g',         3,  'g');

  -- ── Forme composite publiée (produit composé)
  INSERT INTO catalog.food_forms(food_concept_id, canonical_name, canonical_name_normalized,
    default_quantity_unit, status, confidence_level, identity_confidence,
    category_confidence, state_confidence)
  VALUES (v_concept_id, '_Test Forme Composite Hrd', '_test_forme_composite_hrd', 'g',
    'published', 'B', 'B', 'B', 'B')
  RETURNING id INTO v_form_composite_id;

  -- ── Familles culinaires
  INSERT INTO culinary.recipe_families(canonical_name, canonical_name_normalized, status)
  VALUES ('__t_hrd_fam_pub', '__t_hrd_fam_pub', 'candidate')
  RETURNING id INTO v_fam_pub;

  INSERT INTO culinary.recipe_families(canonical_name, canonical_name_normalized, status)
  VALUES ('__t_hrd_fam_draft', '__t_hrd_fam_draft', 'candidate')
  RETURNING id INTO v_fam_draft;

  -- ── Version PUBLIÉE pour fam_pub
  INSERT INTO culinary.recipe_versions(recipe_family_id, version_number, title,
    servings, content_hash, publication_status)
  VALUES (v_fam_pub, 1, '_t version publiée', 2, '__t_hrd_hash_pub', 'published')
  RETURNING id INTO v_ver_pub;

  -- ── Version BROUILLON pour fam_pub (2ème version, même famille)
  INSERT INTO culinary.recipe_versions(recipe_family_id, version_number, title,
    servings, content_hash, publication_status)
  VALUES (v_fam_pub, 2, '_t version draft', 2, '__t_hrd_hash_dft', 'draft')
  RETURNING id INTO v_ver_draft;

  -- ── Axe de variation pour fam_draft (aucune version publiée → OK)
  -- Utilisé pour créer des options valides pour tester les configuration_rules.
  INSERT INTO culinary.recipe_variation_axes(recipe_family_id, name, selection_mode, required)
  VALUES (v_fam_draft, '_t_axe_hrd', 'single', true)
  RETURNING id INTO v_axis_draft;

  INSERT INTO culinary.recipe_variation_options(variation_axis_id, name, confidence_level)
  VALUES (v_axis_draft, '_t_opt1', 'B')
  RETURNING id INTO v_opt1_id;

  INSERT INTO culinary.recipe_variation_options(variation_axis_id, name, confidence_level)
  VALUES (v_axis_draft, '_t_opt2', 'B')
  RETURNING id INTO v_opt2_id;

  -- ── Releases A et B pour les tests d'activation exclusive
  INSERT INTO ops.catalog_releases(release_type, version, status, manifest, checksums, quality_report)
  VALUES ('catalog', '_t_hrd_rel_a', 'published', '{}', '{"ok":true}', '{}')
  RETURNING id INTO v_rel_a_id;

  INSERT INTO ops.catalog_releases(release_type, version, status, manifest, checksums, quality_report)
  VALUES ('catalog', '_t_hrd_rel_b', 'published', '{}', '{"ok":true}', '{}')
  RETURNING id INTO v_rel_b_id;

  -- Release A contient form_simple uniquement.
  INSERT INTO ops.catalog_release_items(release_id, entity_schema, entity_table, entity_id)
  VALUES (v_rel_a_id, 'catalog', 'food_forms', v_form_simple_id);

  -- Release B contient form_composite (form_simple est absente).
  INSERT INTO ops.catalog_release_items(release_id, entity_schema, entity_table, entity_id)
  VALUES (v_rel_b_id, 'catalog', 'food_forms', v_form_composite_id);

  -- Pointeur actif sur release A.
  INSERT INTO ops.active_catalog_release(release_type, release_id, activated_at)
  VALUES ('catalog', v_rel_a_id, now())
  ON CONFLICT (release_type) DO UPDATE
    SET release_id = EXCLUDED.release_id, activated_at = now();

  -- ── Produits commerciaux de test
  -- Composé sans étiquette complète
  INSERT INTO catalog.commercial_products(barcode, commercial_name, is_composite,
    label_nutriments, label_nutrition_complete, status, source_dataset_id, source_record_key)
  VALUES ('_T_HRD_COMPOSITE', '_Test Composé Hardening', true,
    '{}'::jsonb, false, 'published', v_ds_id, '_t_hrd_cp_comp');

  -- Produit simple lié à la forme simple publiée (release A)
  INSERT INTO catalog.commercial_products(barcode, commercial_name, is_composite,
    food_form_id, label_nutriments, label_nutrition_complete,
    status, source_dataset_id, source_record_key)
  VALUES ('_T_HRD_SIMPLE', '_Test Simple Hardening', false,
    v_form_simple_id, NULL, false, 'published', v_ds_id, '_t_hrd_cp_simp');

  -- Produit avec étiquette complète (label_nutrition_complete = true)
  INSERT INTO catalog.commercial_products(barcode, commercial_name, is_composite,
    label_nutriments, label_nutrition_complete,
    status, source_dataset_id, source_record_key)
  VALUES ('_T_HRD_LABEL', '_Test Étiquette Hardening', false,
    '{"energy_kcal":90,"protein_g":4,"fat_g":2,"carbohydrate_g":12}'::jsonb, true,
    'published', v_ds_id, '_t_hrd_cp_lbl');

  -- ── Table temporaire centralisant tous les IDs pour les requêtes des tests
  CREATE TEMP TABLE _t_hrd (
    ver_pub           uuid,
    ver_draft         uuid,
    fam_pub           uuid,
    fam_draft         uuid,
    form_simple_id    uuid,
    form_composite_id uuid,
    rel_a_id          uuid,
    rel_b_id          uuid,
    opt1_id           uuid,
    opt2_id           uuid
  ) ON COMMIT DROP;

  INSERT INTO _t_hrd VALUES (
    v_ver_pub, v_ver_draft,
    v_fam_pub, v_fam_draft,
    v_form_simple_id, v_form_composite_id,
    v_rel_a_id, v_rel_b_id,
    v_opt1_id, v_opt2_id
  );
END $$;

-- ============================================================================
-- BLOC 1 — Immuabilité INSERT sur enfants d'une version publiée (090001)
-- ============================================================================

-- Test 1 : INSERT d'une étape dans une version PUBLIÉE doit lever P0001.
SELECT throws_ok(
  format(
    $sql$INSERT INTO culinary.recipe_steps(recipe_version_id, step_number, instruction)
         VALUES ('%s', 99, '_test step')$sql$,
    (SELECT ver_pub FROM _t_hrd)
  ),
  'P0001',
  NULL,
  'Bloc1-T1 : INSERT recipe_step sur version publiée doit lever P0001'
);

-- Test 2 : INSERT d'une étape dans une version BROUILLON doit réussir.
SELECT lives_ok(
  format(
    $sql$INSERT INTO culinary.recipe_steps(recipe_version_id, step_number, instruction)
         VALUES ('%s', 99, '_test step draft')$sql$,
    (SELECT ver_draft FROM _t_hrd)
  ),
  'Bloc1-T2 : INSERT recipe_step sur version draft doit réussir'
);

-- Test 3 : UPDATE du contenu d''une recipe_version publiée doit lever P0001
--          (régression : le trigger UPDATE préexistant ne doit pas régresser).
SELECT throws_ok(
  format(
    $sql$UPDATE culinary.recipe_versions SET title = '_modif_interdit'
         WHERE id = '%s'$sql$,
    (SELECT ver_pub FROM _t_hrd)
  ),
  'P0001',
  NULL,
  'Bloc1-T3 : UPDATE du contenu d''une version publiée doit lever P0001 (régression)'
);

-- ============================================================================
-- BLOC 2 — Immuabilité des tables de variation (niveau famille) (090001)
-- ============================================================================

-- Test 4 : INSERT d'un axe de variation sur une famille ayant une version publiée
--          doit lever P0001.
SELECT throws_ok(
  format(
    $sql$INSERT INTO culinary.recipe_variation_axes(recipe_family_id, name, selection_mode, required)
         VALUES ('%s', '_t_axe_bloque', 'single', true)$sql$,
    (SELECT fam_pub FROM _t_hrd)
  ),
  'P0001',
  NULL,
  'Bloc2-T4 : INSERT variation_axis sur famille avec version publiée doit lever P0001'
);

-- Test 5 : INSERT d'un axe de variation sur une famille SANS version publiée
--          doit réussir.
SELECT lives_ok(
  format(
    $sql$INSERT INTO culinary.recipe_variation_axes(recipe_family_id, name, selection_mode, required)
         VALUES ('%s', '_t_axe_ok_2', 'single', true)$sql$,
    (SELECT fam_draft FROM _t_hrd)
  ),
  'Bloc2-T5 : INSERT variation_axis sur famille sans version publiée doit réussir'
);

-- Test 6 : INSERT d''une règle de configuration sur la famille publiée
--          (les options utilisées appartiennent à fam_draft — la FK l''accepte ;
--           le trigger vérifie recipe_family_id, pas les options) → doit lever P0001.
SELECT throws_ok(
  format(
    $sql$INSERT INTO culinary.recipe_configuration_rules
         (recipe_family_id, left_option_id, right_option_id, compatibility, confidence_level)
         VALUES ('%s', '%s', '%s', 'allowed', 'B')$sql$,
    (SELECT fam_pub  FROM _t_hrd),
    (SELECT opt1_id  FROM _t_hrd),
    (SELECT opt2_id  FROM _t_hrd)
  ),
  'P0001',
  NULL,
  'Bloc2-T6 : INSERT configuration_rule sur famille publiée doit lever P0001'
);

-- ============================================================================
-- BLOC 3 — catalog.is_in_active_release (090003)
-- Release A active ; contient form_simple ; ne contient pas form_composite.
-- ============================================================================

-- Test 7 : form_composite n''est PAS dans la release A active → false.
SELECT is(
  catalog.is_in_active_release((SELECT form_composite_id FROM _t_hrd)),
  false,
  'Bloc3-T7 : is_in_active_release = false pour forme absente de la release active'
);

-- Test 8 : form_simple EST dans la release A active → true.
SELECT is(
  catalog.is_in_active_release((SELECT form_simple_id FROM _t_hrd)),
  true,
  'Bloc3-T8 : is_in_active_release = true pour forme dans la release active'
);

-- Test 9 : Après bascule du pointeur sur release B (contient uniquement form_composite),
--          form_simple doit renvoyer false.
DO $$
BEGIN
  UPDATE ops.active_catalog_release
     SET release_id = (SELECT rel_b_id FROM _t_hrd)
   WHERE release_type = 'catalog';
END $$;

SELECT is(
  catalog.is_in_active_release((SELECT form_simple_id FROM _t_hrd)),
  false,
  'Bloc3-T9 : après bascule release B, form_simple doit être hors release active'
);

-- Restaurer release A pour les tests du bloc 4.
DO $$
BEGIN
  UPDATE ops.active_catalog_release
     SET release_id = (SELECT rel_a_id FROM _t_hrd)
   WHERE release_type = 'catalog';
END $$;

-- ============================================================================
-- BLOC 4 — OFF label_nutrition_complete et scan_commercial_product (090003+090004)
-- Release A active (form_simple incluse) ; tests de logique nutrition source.
-- ============================================================================

-- Test 10 : Composé sans étiquette complète → nutrition_source NULL dans le scan.
--           cp.is_composite = true, label_nutrition_complete = false → source = null.
SELECT is(
  public.scan_commercial_product('_T_HRD_COMPOSITE') ->> 'nutrition_source',
  NULL::text,
  'Bloc4-T10 : composé sans label complet → nutrition_source NULL dans scan'
);

-- Test 11 : Produit simple sans étiquette → nutrition_source = generic_form.
--           Forme simple dans release A active → forme trouvée → generic_form.
SELECT is(
  public.scan_commercial_product('_T_HRD_SIMPLE') ->> 'nutrition_source',
  'generic_form',
  'Bloc4-T11 : produit simple sans label → nutrition_source = generic_form'
);

-- Test 12 : Produit avec label_nutrition_complete = true → nutrition_source = label.
SELECT is(
  public.scan_commercial_product('_T_HRD_LABEL') ->> 'nutrition_source',
  'label',
  'Bloc4-T12 : produit avec label_nutrition_complete=true → nutrition_source = label'
);

-- Test 13 : label_nutrition_complete = false pour un produit dont le label est vide ({}).
--           Vérifie que la colonne existe et que la valeur est correcte.
SELECT is(
  (SELECT label_nutrition_complete
     FROM catalog.commercial_products
    WHERE barcode = '_T_HRD_COMPOSITE'),
  false,
  'Bloc4-T13 : label_nutrition_complete = false pour label_nutriments = {}'
);

-- ============================================================================
-- Fin des tests
-- ============================================================================
SELECT * FROM finish();
ROLLBACK;
