-- ============================================================================
-- Chargement F0 (catalogue alimentaire candidat). Généré par build-f0-corpus.mjs.
-- corpus_hash = 50343360792c40f5a187745aee447ca7
-- corpus_path = /home/user/garde-manger-app/data/foods/f0-corpus.json
-- IDEMPOTENT — tous les objets créés en status='candidate', published_at=NULL.
-- ============================================================================

-- ── Source dataset ──────────────────────────────────────────────────────────
INSERT INTO ops.source_datasets
  (code, name, publisher, source_url, license_code, allowed_uses,
   update_strategy, current_version, last_checked_at)
VALUES
  ('myko_f0_curated', 'Corpus alimentaire F0 curé Myko', 'Myko', 'internal',
   'cc0-1.0',
   '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
   'manual', 'f0', now())
ON CONFLICT (code) DO UPDATE SET last_checked_at = now();

-- ── Run d'import (identifié par le hash du corpus) ─────────────────────────
INSERT INTO ops.import_runs
  (source_dataset_id, source_version, code_version, configuration_hash,
   status, started_at, completed_at, candidate_count)
SELECT sd.id, 'f0', 'f0-loader-1.0', '50343360792c40f5a187745aee447ca7',
       'completed', now(), now(), 31
FROM ops.source_datasets sd
WHERE sd.code = 'myko_f0_curated'
  AND NOT EXISTS (
    SELECT 1 FROM ops.import_runs r WHERE r.configuration_hash = '50343360792c40f5a187745aee447ca7'
  );

-- ── Concept : Ail ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'herbes_aromates';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'herbes_aromates', 'Ail';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Ail', 'ail', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Ail / Ail cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'ail';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : ail';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Ail cru', 'ail cru',
     'solid', 'raw', 'fresh',
     NULL, NULL, NULL,
     NULL, NULL,
     'u', 0.85,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:11000',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 111, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 5.31, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 18.6, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'fiber_g', 1.51, 'g', 'measured'),
    (v_nprof, 'sugars_g', 1.2, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', 0.5, 'mg', 'measured'),
    (v_nprof, 'calcium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 11, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.19, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 30.3, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.63, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:11000',
     to_jsonb('ail cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:ail-cru',
     to_jsonb('ail cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'loose', 'unopened',
     15, 25,
     720, 4320, 2160,
     'low', v_ds, 'f0:ail-cru:ambient:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conversion : u → g
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, 'u', 'g', 5,
     'gousse moyenne', 3, 8,
     v_ds, 'B', 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

END $form$;

-- ── Concept : Beurre ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'matieres_grasses';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'matieres_grasses', 'Beurre';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Beurre', 'beurre', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Beurre / Beurre doux
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'beurre';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : beurre';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Beurre doux', 'beurre doux',
     'solid', 'raw', 'fresh',
     NULL, NULL, NULL,
     NULL, 'fat',
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:16400',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 753, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 0.7, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0.9, 'g', 'measured'),
    (v_nprof, 'fat_g', 82.9, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.25, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.83, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.83, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 7.45, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.38, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 1.22, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 16.2, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.09, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', 218, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 17.8, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.026, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 55.4, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 19.3, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 1.82, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 3.21, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 2.13, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 1.32, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 2.22, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 2.77, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 9.24, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 25.3, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 0.026, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:16400',
     to_jsonb('beurre doux'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:beurre-doux',
     to_jsonb('beurre doux'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'unopened',
     0, 6,
     1344, 2016, 1680,
     'medium', v_ds, 'f0:beurre-doux:refrigerator:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Cabillaud ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'poissons_fruits_de_mer';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'poissons_fruits_de_mer', 'Cabillaud';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Cabillaud', 'cabillaud', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Cabillaud / Cabillaud cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'cabillaud';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : cabillaud';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Cabillaud cru', 'cabillaud cru',
     'solid', 'raw', 'fresh',
     NULL, 'boneless', NULL,
     NULL, 'lean',
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:26043',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 77.6, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 18.1, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'estimated'),
    (v_nprof, 'fat_g', 0.57, 'g', 'measured'),
    (v_nprof, 'fiber_g', 1.1, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.019, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.001, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.003, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.03, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', 0.05, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.13, 'mg', 'measured'),
    (v_nprof, 'copper_mg', 43.9, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 4.43, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.1, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.1, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.068, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.22, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'niacin_b3_mg', 0.0024, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.072, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 110, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.49, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:26043',
     to_jsonb('cabillaud cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:cabillaud-cru',
     to_jsonb('cabillaud cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'unopened',
     0, 4,
     24, 48, 36,
     'high', v_ds, 'f0:cabillaud-cru:refrigerator:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Carotte ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'legumes';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'legumes', 'Carotte';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Carotte', 'carotte', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Carotte / Carotte crue
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'carotte';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : carotte';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Carotte crue', 'carotte crue',
     'solid', 'raw', 'fresh',
     NULL, NULL, 'with_skin',
     NULL, NULL,
     'u', 0.87,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:20009',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 40.2, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 0.63, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 7.59, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.72, 'g', 'measured'),
    (v_nprof, 'sugars_g', 6, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 1.1, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', 0.5, 'mg', 'measured'),
    (v_nprof, 'calcium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 25, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.05, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 56.8, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.24, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:20009',
     to_jsonb('carotte crue'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:carotte-crue',
     to_jsonb('carotte crue'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'unopened',
     0, 4,
     336, 720, 504,
     'low', v_ds, 'f0:carotte-crue:refrigerator:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conversion : u → g
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, 'u', 'g', 100,
     'carotte moyenne', 80, 150,
     v_ds, 'B', 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

END $form$;

-- ── Concept : Citron ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'fruits';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'fruits', 'Citron';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Citron', 'citron', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Citron / Citron jaune
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'citron';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : citron';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Citron jaune', 'citron jaune',
     'solid', 'raw', 'fresh',
     NULL, NULL, 'with_skin',
     NULL, NULL,
     'u', 0.55,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:13009',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 27.6, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 0.5, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 1.56, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.38, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.8, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.4, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', 0.5, 'mg', 'measured'),
    (v_nprof, 'calcium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 11, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.04, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 20, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.15, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:13009',
     to_jsonb('citron jaune'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:citron-jaune',
     to_jsonb('citron jaune'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'loose', 'unopened',
     15, 22,
     168, 336, 240,
     'low', v_ds, 'f0:citron-jaune:ambient:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conversion : u → g
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, 'u', 'g', 130,
     'citron jaune moyen entier', 100, 170,
     v_ds, 'B', 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

END $form$;

-- ── Concept : Comté ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'produits_laitiers';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'produits_laitiers', 'Comté';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Comté', 'comte', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Comté / Comté
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'comte';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : comte';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Comté', 'comte',
     'solid', 'raw', 'fresh',
     NULL, NULL, NULL,
     NULL, 'fat',
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:12110',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 420, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 27.2, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'estimated'),
    (v_nprof, 'fat_g', 34.6, 'g', 'measured'),
    (v_nprof, 'fiber_g', 3.3, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', 0.3, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.3, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.3, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 2.92, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.12, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.45, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 5.5, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', 0.025, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', 115, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 993, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.61, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 22.5, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 8.49, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 1.63, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.92, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.6, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.38, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.91, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 1.05, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 3.53, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 8.35, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 0.49, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:12110',
     to_jsonb('comte'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:comte',
     to_jsonb('comte'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'opened',
     2, 8,
     336, 672, 504,
     'medium', v_ds, 'f0:comte:refrigerator:sealed:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Crème fraîche ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'produits_laitiers';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'produits_laitiers', 'Crème fraîche';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Crème fraîche', 'creme fraiche', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Crème fraîche / Crème fraîche épaisse
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'creme fraiche';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : creme fraiche';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Crème fraîche épaisse', 'creme fraiche epaisse',
     'liquid', 'raw', 'fresh',
     NULL, NULL, NULL,
     NULL, 'fat',
     'ml', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:19410',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 304, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 3, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 2.8, 'g', 'measured'),
    (v_nprof, 'fat_g', 30.7, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.47, 'g', 'measured'),
    (v_nprof, 'sugars_g', 2.66, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 2.66, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 2.79, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.11, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.45, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 5.87, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.03, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', 94.8, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 76.9, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.0075, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 20.8, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 7, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.67, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 1.15, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.77, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.48, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.82, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 1.03, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 3.48, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 9.63, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 100, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.08, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:19410',
     to_jsonb('creme fraiche epaisse'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:creme-fraiche-epaisse',
     to_jsonb('creme fraiche epaisse'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'unopened',
     0, 4,
     336, 672, 504,
     'medium', v_ds, 'f0:creme-fraiche-epaisse:refrigerator:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conservation : refrigerator / opened / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'opened', 'opened',
     0, 4,
     72, 168, 120,
     'high', v_ds, 'f0:creme-fraiche-epaisse:refrigerator:opened:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Gruyère ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'produits_laitiers';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'produits_laitiers', 'Gruyère';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Gruyère', 'gruyere', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Gruyère / Gruyère râpé
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'gruyere';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : gruyere';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Gruyère râpé', 'gruyere rape',
     'solid', 'raw', 'fresh',
     NULL, NULL, NULL,
     'grated', 'fat',
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:12114',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 426, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 28.4, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'estimated'),
    (v_nprof, 'fat_g', 34.6, 'g', 'measured'),
    (v_nprof, 'fiber_g', 3.75, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 3.23, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.34, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.63, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 6.68, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', 105, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 1090, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.41, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 19.8, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 9.55, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 1.47, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 1.03, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.57, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.37, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.85, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.99, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 3.43, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 8.5, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 1040, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.29, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:12114',
     to_jsonb('gruyere rape'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:gruyere-rape',
     to_jsonb('gruyere rape'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'unopened',
     0, 4,
     720, 2160, 1440,
     'medium', v_ds, 'f0:gruyere-rape:refrigerator:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conservation : refrigerator / opened / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'opened', 'opened',
     0, 4,
     72, 240, 168,
     'medium', v_ds, 'f0:gruyere-rape:refrigerator:opened:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Haricot vert ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'legumes';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'legumes', 'Haricot vert';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Haricot vert', 'haricot vert', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Haricot vert / Haricot vert cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'haricot vert';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : haricot vert';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Haricot vert cru', 'haricot vert cru',
     'solid', 'raw', 'fresh',
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 0.9,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:20061',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 25.9, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 1.85, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 4.14, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.21, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.68, 'g', 'measured'),
    (v_nprof, 'sugars_g', 3.26, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.99, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.0085, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.06, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.051, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.007, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 48.5, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.063, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.06, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.0085, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.11, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'niacin_b3_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'pantothenate_b5_mg', 0.051, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 16, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 1.02, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:20061',
     to_jsonb('haricot vert cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:haricot-vert-cru',
     to_jsonb('haricot vert cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'loose', 'unopened',
     0, 4,
     72, 168, 120,
     'low', v_ds, 'f0:haricot-vert-cru:refrigerator:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Huile d'olive ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'matieres_grasses';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'matieres_grasses', 'Huile d''olive';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Huile d''olive', 'huile d olive', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Huile d'olive / Huile d'olive vierge extra
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'huile d olive';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : huile d olive';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Huile d''olive vierge extra', 'huile d olive vierge extra',
     'liquid', 'raw', NULL,
     NULL, NULL, NULL,
     NULL, 'fat',
     'ml', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:17270',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 900, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 0.5, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'estimated'),
    (v_nprof, 'fat_g', 99.9, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.25, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 2.79, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.65, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 6.52, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 69.8, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 0.2, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 15.2, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 73.1, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 7.17, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 11.8, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 20, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.05, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:17270',
     to_jsonb('huile d olive vierge extra'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:huile-d-olive-vierge-extra',
     to_jsonb('huile d olive vierge extra'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'sealed', 'unopened',
     15, 20,
     8760, 13140, 13140,
     'low', v_ds, 'f0:huile-d-olive-vierge-extra:ambient:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Lait ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'produits_laitiers';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'produits_laitiers', 'Lait';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Lait', 'lait', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Lait / Lait demi-écrémé
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'lait';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : lait';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Lait demi-écrémé', 'lait demi ecreme',
     'liquid', 'raw', 'fresh',
     NULL, NULL, NULL,
     NULL, NULL,
     'ml', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:19041',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 47.3, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 3.38, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 4.83, 'g', 'measured'),
    (v_nprof, 'fat_g', 1.55, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.69, 'g', 'measured'),
    (v_nprof, 'sugars_g', 4.66, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 4.66, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.13, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.02, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.29, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', 5.7, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 117, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.0087, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 1.04, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.34, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.02, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.05, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.03, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.02, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.05, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.06, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.19, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.5, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 100, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.045, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:19041',
     to_jsonb('lait demi ecreme'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:lait-demi-ecreme',
     to_jsonb('lait demi ecreme'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'opened',
     0, 4,
     72, 120, 96,
     'high', v_ds, 'f0:lait-demi-ecreme:refrigerator:sealed:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Lentille verte ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'legumineuses';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'legumineuses', 'Lentille verte';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Lentille verte', 'lentille verte', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Lentille verte / Lentille verte sèche, crue
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'lentille verte';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : lentille verte';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Lentille verte sèche, crue', 'lentille verte seche crue',
     'solid', 'raw', 'dried',
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:20585',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 294.6, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 25.1, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 44.5, 'g', 'measured'),
    (v_nprof, 'fat_g', 1.8, 'g', 'measured'),
    (v_nprof, 'fiber_g', 2.74, 'g', 'measured'),
    (v_nprof, 'sugars_g', 1.1, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.03, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.21, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.73, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.42, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 64, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.6, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.24, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.45, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.95, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.19, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 81, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 6.3, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:20585',
     to_jsonb('lentille verte seche crue'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:lentille-verte-seche-crue',
     to_jsonb('lentille verte seche crue'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'sealed', 'unopened',
     15, 25,
     17520, 26280, 17520,
     'low', v_ds, 'f0:lentille-verte-seche-crue:ambient:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Moutarde ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'condiments_sauces';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'condiments_sauces', 'Moutarde';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Moutarde', 'moutarde', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Moutarde / Moutarde de Dijon
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'moutarde';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : moutarde';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Moutarde de Dijon', 'moutarde de dijon',
     'liquid', 'raw', NULL,
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:11013',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 152, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 6.92, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 4.33, 'g', 'measured'),
    (v_nprof, 'fat_g', 11.2, 'g', 'measured'),
    (v_nprof, 'fiber_g', 7.36, 'g', 'measured'),
    (v_nprof, 'sugars_g', 1.66, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.86, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.16, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.91, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 1.38, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 1.86, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.0093, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 86.3, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.082, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.76, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 4.11, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 2.3, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.005, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.006, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.0072, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.32, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 1.83, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:11013',
     to_jsonb('moutarde de dijon'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:moutarde-de-dijon',
     to_jsonb('moutarde de dijon'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'opened',
     0, 4,
     1440, 2160, 2160,
     'low', v_ds, 'f0:moutarde-de-dijon:refrigerator:sealed:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Œuf ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'oeufs';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'oeufs', 'Œuf';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Œuf', 'oeuf', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Œuf / Œuf cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'oeuf';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : oeuf';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Œuf cru', 'oeuf cru',
     'solid', 'raw', 'fresh',
     NULL, NULL, NULL,
     NULL, NULL,
     'u', 0.88,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:22000',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 140, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 12.7, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0.27, 'g', 'measured'),
    (v_nprof, 'fat_g', 9.83, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.96, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.27, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.27, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', 0.15, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.65, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.061, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 1.38, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 3.51, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.12, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', 0.09, 'mg', 'measured'),
    (v_nprof, 'copper_mg', 398, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 76.8, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.055, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 2.64, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 3.66, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 1.65, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.05, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.05, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.05, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.05, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.05, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.024, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 1.96, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 1.88, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:22000',
     to_jsonb('oeuf cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:oeuf-cru',
     to_jsonb('oeuf cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'loose', 'unopened',
     15, 20,
     504, 720, 504,
     'medium', v_ds, 'f0:oeuf-cru:ambient:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conversion : u → g
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, 'u', 'g', 57,
     'oeuf de poule calibre M (53-63 g), sans coquille ~50 g', 50, 65,
     v_ds, 'B', 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

END $form$;

-- ── Concept : Oignon ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'legumes';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'legumes', 'Oignon';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Oignon', 'oignon', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Oignon / Oignon jaune cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'oignon';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : oignon';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Oignon jaune cru', 'oignon jaune cru',
     'solid', 'raw', 'fresh',
     NULL, NULL, 'with_skin',
     NULL, NULL,
     'u', 0.88,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:20239',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 37.8, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 1.19, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 6.39, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.44, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.2, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', 0.5, 'mg', 'measured'),
    (v_nprof, 'calcium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 13, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.04, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 21.8, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.1, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:20239',
     to_jsonb('oignon jaune cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:oignon-jaune-cru',
     to_jsonb('oignon jaune cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'loose', 'unopened',
     10, 20,
     720, 2160, 1440,
     'low', v_ds, 'f0:oignon-jaune-cru:ambient:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conversion : u → g
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, 'u', 'g', 120,
     'oignon jaune moyen', 80, 200,
     v_ds, 'B', 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

END $form$;

-- Forme : Oignon / Oignon rouge cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'oignon';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : oignon';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Oignon rouge cru', 'oignon rouge cru',
     'solid', 'raw', 'fresh',
     NULL, NULL, 'with_skin',
     NULL, NULL,
     'u', 0.88,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:20238',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 36.3, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 1.31, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 5.63, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.4, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.45, 'g', 'measured'),
    (v_nprof, 'sugars_g', 5.2, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 2.2, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', 0.5, 'mg', 'measured'),
    (v_nprof, 'calcium_mg', 0.04, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.07, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.13, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 22, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.05, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.14, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.13, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.07, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.08, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 20.7, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.19, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:20238',
     to_jsonb('oignon rouge cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:oignon-rouge-cru',
     to_jsonb('oignon rouge cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'loose', 'unopened',
     10, 20,
     720, 2160, 1440,
     'low', v_ds, 'f0:oignon-rouge-cru:ambient:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conversion : u → g
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, 'u', 'g', 130,
     'oignon rouge moyen', 100, 200,
     v_ds, 'B', 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

END $form$;

-- ── Concept : Persil ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'herbes_aromates';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'herbes_aromates', 'Persil';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Persil', 'persil', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Persil / Persil frais
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'persil';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : persil';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Persil frais', 'persil frais',
     'solid', 'raw', 'fresh',
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 0.9,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:11014',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 43, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 3.71, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 3.48, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.63, 'g', 'measured'),
    (v_nprof, 'fiber_g', 2.35, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.95, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.0043, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.16, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.1, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.0045, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 218, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.12, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.1, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.11, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.29, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', 0.0048, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.0023, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.071, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 364, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 4.67, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:11014',
     to_jsonb('persil frais'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:persil-frais',
     to_jsonb('persil frais'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'loose', 'unopened',
     0, 4,
     120, 168, 120,
     'low', v_ds, 'f0:persil-frais:refrigerator:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Pois chiche ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'legumineuses';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'legumineuses', 'Pois chiche';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Pois chiche', 'pois chiche', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Pois chiche / Pois chiche cuit, égoutté
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'pois chiche';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : pois chiche';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Pois chiche cuit, égoutté', 'pois chiche cuit egoutte',
     'solid', 'cooked', 'canned',
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:20532',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 111.1, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 6.74, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 15, 'g', 'measured'),
    (v_nprof, 'fat_g', 2.68, 'g', 'measured'),
    (v_nprof, 'fiber_g', 1, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.5, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.03, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.032, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.89, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.47, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 41.2, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.21, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.3, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.47, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.92, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'niacin_b3_mg', 0.003, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.17, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 1.15, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:20532',
     to_jsonb('pois chiche cuit egoutte'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:pois-chiche-cuit-egoutte',
     to_jsonb('pois chiche cuit egoutte'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / opened / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'opened', 'opened',
     0, 4,
     72, 120, 96,
     'medium', v_ds, 'f0:pois-chiche-cuit-egoutte:refrigerator:opened:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Poivre noir ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'epices';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'epices', 'Poivre noir';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Poivre noir', 'poivre noir', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Poivre noir / Poivre noir moulu
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'poivre noir';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : poivre noir';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Poivre noir moulu', 'poivre noir moulu',
     'solid', 'raw', 'dried',
     NULL, NULL, NULL,
     'ground', NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:11015',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 330, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 13.3, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 39.5, 'g', 'measured'),
    (v_nprof, 'fat_g', 7.5, 'g', 'measured'),
    (v_nprof, 'fiber_g', 4.99, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.64, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.24, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.46, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.63, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 1.54, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 2.06, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 480, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 1, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 2.9, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 2.06, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 2.17, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.19, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.22, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 1.65, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 300, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 17, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:11015',
     to_jsonb('poivre noir moulu'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:poivre-noir-moulu',
     to_jsonb('poivre noir moulu'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / sealed / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'sealed', 'opened',
     15, 25,
     8760, 17520, 8760,
     'low', v_ds, 'f0:poivre-noir-moulu:ambient:sealed:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Poivron ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'legumes';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'legumes', 'Poivron';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Poivron', 'poivron', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Poivron / Poivron rouge cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'poivron';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : poivron';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Poivron rouge cru', 'poivron rouge cru',
     'solid', 'raw', 'fresh',
     NULL, NULL, 'with_skin',
     NULL, NULL,
     'u', 0.82,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:20087',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 36.6, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 1.06, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 5.98, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.53, 'g', 'measured'),
    (v_nprof, 'sugars_g', 4.8, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 2.2, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', 1, 'mg', 'measured'),
    (v_nprof, 'calcium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 4.8, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.04, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 29.7, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.21, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:20087',
     to_jsonb('poivron rouge cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:poivron-rouge-cru',
     to_jsonb('poivron rouge cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'loose', 'unopened',
     0, 4,
     120, 240, 168,
     'low', v_ds, 'f0:poivron-rouge-cru:refrigerator:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conversion : u → g
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, 'u', 'g', 160,
     'poivron rouge moyen entier', 130, 220,
     v_ds, 'B', 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

END $form$;

-- ── Concept : Pomme de terre ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'cereales_feculents';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'cereales_feculents', 'Pomme de terre';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Pomme de terre', 'pomme de terre', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Pomme de terre / Pomme de terre crue, épluchée
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'pomme de terre';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : pomme de terre';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Pomme de terre crue, épluchée', 'pomme de terre crue epluchee',
     'solid', 'raw', 'fresh',
     NULL, NULL, 'skinless',
     'peeled', NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:4008',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 80.5, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 2.16, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 16.2, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.18, 'g', 'measured'),
    (v_nprof, 'fiber_g', 1.02, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.78, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.22, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.0057, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.054, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.041, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.0073, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 14.3, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.079, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.038, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.0073, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.095, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', 0.00095, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.0029, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.00095, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.028, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 50, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.91, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:4008',
     to_jsonb('pomme de terre crue epluchee'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:pomme-de-terre-crue-epluchee',
     to_jsonb('pomme de terre crue epluchee'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / submerged / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'submerged', 'opened',
     0, 4,
     12, 48, 24,
     'medium', v_ds, 'f0:pomme-de-terre-crue-epluchee:refrigerator:submerged:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Poulet ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'volailles';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'volailles', 'Poulet';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Poulet', 'poulet', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Poulet / Blanc de poulet cru, sans peau
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'poulet';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : poulet';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Blanc de poulet cru, sans peau', 'blanc de poulet cru sans peau',
     'solid', 'raw', 'fresh',
     'blanc', 'boneless', 'skinless',
     NULL, 'lean',
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:36003',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 113, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 20, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'estimated'),
    (v_nprof, 'fat_g', 3.73, 'g', 'measured'),
    (v_nprof, 'fiber_g', 1.01, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.21, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.15, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.93, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 1.41, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', 0.0071, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.021, 'mg', 'measured'),
    (v_nprof, 'copper_mg', 68.8, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 11, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.044, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.85, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 1.41, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 1.11, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', 0.0099, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.02, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.62, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 0.77, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:36003',
     to_jsonb('blanc de poulet cru sans peau'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:blanc-de-poulet-cru-sans-peau',
     to_jsonb('blanc de poulet cru sans peau'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'unopened',
     0, 4,
     24, 72, 48,
     'high', v_ds, 'f0:blanc-de-poulet-cru-sans-peau:refrigerator:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- Forme : Poulet / Cuisse de poulet crue, avec os, avec peau
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'poulet';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : poulet';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Cuisse de poulet crue, avec os, avec peau', 'cuisse de poulet crue avec os avec peau',
     'solid', 'raw', 'fresh',
     'cuisse', 'bone_in', 'with_skin',
     NULL, 'medium',
     'g', 0.72,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:36002',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 192, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 17.3, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'estimated'),
    (v_nprof, 'fat_g', 13.5, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.97, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.2, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.82, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.22, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 2.56, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 5.05, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.07, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'copper_mg', 92.5, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 6.7, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.05, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 3.85, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 6.04, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 2.96, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.07, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 2.9, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 109, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.68, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:36002',
     to_jsonb('cuisse de poulet crue avec os avec peau'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:cuisse-de-poulet-crue-avec-os-avec-peau',
     to_jsonb('cuisse de poulet crue avec os avec peau'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'unopened',
     0, 4,
     24, 72, 48,
     'high', v_ds, 'f0:cuisse-de-poulet-crue-avec-os-avec-peau:refrigerator:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- Forme : Poulet / Haut de cuisse de poulet cru, désossé, sans peau
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'poulet';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : poulet';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Haut de cuisse de poulet cru, désossé, sans peau', 'haut de cuisse de poulet cru desosse sans peau',
     'solid', 'raw', 'fresh',
     'haut_de_cuisse', 'boneless', 'skinless',
     NULL, 'medium',
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:36019',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 116, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 19.7, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'estimated'),
    (v_nprof, 'fat_g', 4.12, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.95, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.25, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.03, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.74, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 1.25, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', 0.002, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.007, 'mg', 'measured'),
    (v_nprof, 'copper_mg', 94, 'mg', 'measured'),
    (v_nprof, 'selenium_ug', 7, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.062, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 1.1, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 1.5, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.94, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.001, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', 0.001, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.002, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.003, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.02, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.8, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 0.81, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:36019',
     to_jsonb('haut de cuisse de poulet cru desosse sans peau'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:haut-de-cuisse-de-poulet-cru-desosse-sans-peau',
     to_jsonb('haut de cuisse de poulet cru desosse sans peau'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'unopened',
     0, 4,
     24, 72, 48,
     'high', v_ds, 'f0:haut-de-cuisse-de-poulet-cru-desosse-sans-peau:refrigerator:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Quinoa ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'cereales_feculents';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'cereales_feculents', 'Quinoa';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Quinoa', 'quinoa', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Quinoa / Quinoa cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'quinoa';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : quinoa';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Quinoa cru', 'quinoa cru',
     'solid', 'raw', 'dried',
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:9340',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 354, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 13.2, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 58.1, 'g', 'measured'),
    (v_nprof, 'fat_g', 6.07, 'g', 'measured'),
    (v_nprof, 'fiber_g', 2.38, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.037, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.13, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 2.21, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 1.53, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', 0.047, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 47, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.59, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.71, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 1.61, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 3.29, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'niacin_b3_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'pantothenate_b5_mg', 0.6, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 4.57, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:9340',
     to_jsonb('quinoa cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:quinoa-cru',
     to_jsonb('quinoa cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'sealed', 'unopened',
     15, 25,
     17520, 26280, 17520,
     'low', v_ds, 'f0:quinoa-cru:ambient:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Riz ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'cereales_feculents';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'cereales_feculents', 'Riz';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Riz', 'riz', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Riz / Riz blanc cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'riz';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : riz';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Riz blanc cru', 'riz blanc cru',
     'solid', 'raw', 'dried',
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:9100',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 350, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 7.04, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 78, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.91, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.49, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.16, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.019, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.0085, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.29, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.27, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', 0.01, 'mg', 'measured'),
    (v_nprof, 'sodium_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'zinc_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 33, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.19, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.2, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.27, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.3, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'vitamin_k_ug', 0.005, 'µg', 'measured'),
    (v_nprof, 'vitamin_c_mg', 0.005, 'mg', 'measured'),
    (v_nprof, 'thiamine_b1_mg', 0.0033, 'mg', 'measured'),
    (v_nprof, 'riboflavin_b2_mg', 0.0033, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.0062, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.17, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'folate_b9_ug', 1.57, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:9100',
     to_jsonb('riz blanc cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:riz-blanc-cru',
     to_jsonb('riz blanc cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'sealed', 'unopened',
     15, 25,
     17520, 43800, 26280,
     'low', v_ds, 'f0:riz-blanc-cru:ambient:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- Forme : Riz / Riz complet cru
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'riz';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : riz';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Riz complet cru', 'riz complet cru',
     'solid', 'raw', 'dried',
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:9102',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 349, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 7.02, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 71.4, 'g', 'measured'),
    (v_nprof, 'fat_g', 2.8, 'g', 'measured'),
    (v_nprof, 'fiber_g', 1.2, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.66, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', 0.055, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.026, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.98, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.71, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 11.1, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.27, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.61, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.86, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 1.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', 0.0025, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.016, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.52, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 62, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 1, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:9102',
     to_jsonb('riz complet cru'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:riz-complet-cru',
     to_jsonb('riz complet cru'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / sealed / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'sealed', 'unopened',
     15, 20,
     4380, 8760, 6480,
     'low', v_ds, 'f0:riz-complet-cru:ambient:sealed:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Sel ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'condiments_sauces';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'condiments_sauces', 'Sel';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Sel', 'sel', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Sel / Sel fin
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'sel';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : sel';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Sel fin', 'sel fin',
     'solid', 'raw', 'dried',
     NULL, NULL, NULL,
     NULL, NULL,
     'g', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'override:sel-fin',
     100, 'g', 'myko_curated',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 0, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 0, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'measured'),
    (v_nprof, 'fat_g', 0, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0, 'g', 'measured'),
    (v_nprof, 'sodium_mg', 39340, 'mg', 'measured'),
    (v_nprof, 'salt_g', 100, 'g', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'override:sel-fin',
     to_jsonb('sel fin'::text),
     'myko_curated_override',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:sel-fin',
     to_jsonb('sel fin'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / sealed / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'sealed', 'opened',
     15, 30,
     87600, 175200, 87600,
     'low', v_ds, 'f0:sel-fin:ambient:sealed:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Tomate ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'legumes';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'legumes', 'Tomate';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Tomate', 'tomate', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Tomate / Tomate crue
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'tomate';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : tomate';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Tomate crue', 'tomate crue',
     'solid', 'raw', 'fresh',
     NULL, NULL, 'with_skin',
     NULL, NULL,
     'u', 0.94,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:20047',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 19.3, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 0.86, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 2.49, 'g', 'measured'),
    (v_nprof, 'fat_g', 0.26, 'g', 'measured'),
    (v_nprof, 'fiber_g', 0.97, 'g', 'measured'),
    (v_nprof, 'sugars_g', 2.48, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 1.08, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'polyunsaturated_fat_g', NULL, 'g', 'not_available'),
    (v_nprof, 'cholesterol_mg', 0.013, 'mg', 'measured'),
    (v_nprof, 'calcium_mg', 0.011, 'mg', 'measured'),
    (v_nprof, 'iron_mg', 0.0086, 'mg', 'measured'),
    (v_nprof, 'magnesium_mg', 0.093, 'mg', 'measured'),
    (v_nprof, 'phosphorus_mg', 0.035, 'mg', 'measured'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 8.14, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.029, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', 0.056, 'µg', 'measured'),
    (v_nprof, 'beta_carotene_ug', 0.035, 'µg', 'measured'),
    (v_nprof, 'vitamin_d_ug', 0.12, 'µg', 'measured'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', 0.00016, 'mg', 'measured'),
    (v_nprof, 'niacin_b3_mg', 0.00073, 'mg', 'measured'),
    (v_nprof, 'pantothenate_b5_mg', 0.041, 'mg', 'measured'),
    (v_nprof, 'vitamin_b6_mg', 51, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.12, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:20047',
     to_jsonb('tomate crue'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:tomate-crue',
     to_jsonb('tomate crue'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / loose / unopened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'loose', 'unopened',
     15, 22,
     72, 168, 96,
     'low', v_ds, 'f0:tomate-crue:ambient:loose:unopened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

  -- Conversion : u → g
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, 'u', 'g', 130,
     'tomate ronde moyenne', 100, 200,
     v_ds, 'B', 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

END $form$;

-- ── Concept : Vin blanc ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'boissons';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'boissons', 'Vin blanc';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Vin blanc', 'vin blanc', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Vin blanc / Vin blanc sec
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'vin blanc';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : vin blanc';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Vin blanc sec', 'vin blanc sec',
     'liquid', 'raw', NULL,
     NULL, NULL, NULL,
     NULL, NULL,
     'ml', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:5215',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 18.2, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 0.5, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 4.04, 'g', 'measured'),
    (v_nprof, 'fat_g', 0, 'g', 'estimated'),
    (v_nprof, 'fiber_g', 0.19, 'g', 'measured'),
    (v_nprof, 'sugars_g', 0.17, 'g', 'measured'),
    (v_nprof, 'saturated_fat_g', 0.09, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 0.1, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'iron_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'magnesium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'phosphorus_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 7.1, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'beta_carotene_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_d_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'niacin_b3_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'pantothenate_b5_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_b6_mg', 2.7, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.34, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:5215',
     to_jsonb('vin blanc sec'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:vin-blanc-sec',
     to_jsonb('vin blanc sec'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : refrigerator / sealed / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'refrigerator', 'sealed', 'opened',
     0, 8,
     72, 120, 72,
     'low', v_ds, 'f0:vin-blanc-sec:refrigerator:sealed:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- ── Concept : Vinaigre de vin ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = 'condiments_sauces';
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', 'condiments_sauces', 'Vinaigre de vin';
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    ('Vinaigre de vin', 'vinaigre de vin', v_category,
     'candidate', 'A', 'A')
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

-- Forme : Vinaigre de vin / Vinaigre de vin rouge
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
  v_nprof uuid;
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = 'vinaigre de vin';
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : vinaigre de vin';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = '50343360792c40f5a187745aee447ca7' LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, 'Vinaigre de vin rouge', 'vinaigre de vin rouge',
     'liquid', 'raw', NULL,
     NULL, NULL, NULL,
     NULL, NULL,
     'ml', 1,
     'candidate', 'A',
     'A', 'A', 'A')
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, 'ciqual:11220',
     100, 'g', 'ciqual_2020',
     'B', true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO v_nprof;

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = v_nprof;
  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
    (v_nprof, 'energy_kcal', 21.6, 'kcal', 'measured'),
    (v_nprof, 'protein_g', 0.5, 'g', 'measured'),
    (v_nprof, 'carbohydrate_g', 0, 'g', 'estimated'),
    (v_nprof, 'fat_g', 0, 'g', 'estimated'),
    (v_nprof, 'fiber_g', 0.25, 'g', 'measured'),
    (v_nprof, 'sugars_g', NULL, 'g', 'not_available'),
    (v_nprof, 'saturated_fat_g', 0.5, 'g', 'measured'),
    (v_nprof, 'monounsaturated_fat_g', 1, 'g', 'measured'),
    (v_nprof, 'polyunsaturated_fat_g', 1, 'g', 'measured'),
    (v_nprof, 'cholesterol_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'calcium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'iron_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'magnesium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'phosphorus_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'potassium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'sodium_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'zinc_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'copper_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'selenium_ug', 10, 'µg', 'measured'),
    (v_nprof, 'iodine_ug', 0.01, 'µg', 'measured'),
    (v_nprof, 'vitamin_a_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'beta_carotene_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_d_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_e_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_k_ug', NULL, 'µg', 'not_available'),
    (v_nprof, 'vitamin_c_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'thiamine_b1_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'riboflavin_b2_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'niacin_b3_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'pantothenate_b5_mg', NULL, 'mg', 'not_available'),
    (v_nprof, 'vitamin_b6_mg', 5.1, 'mg', 'measured'),
    (v_nprof, 'folate_b9_ug', 0.41, 'µg', 'measured');

  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = v_nprof;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', v_nprof, 'nutrient_values',
     v_ds, 'ciqual:11220',
     to_jsonb('vinaigre de vin rouge'::text),
     'ciqual_2020_import',
     v_run, true);

  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, 'f0:vinaigre-de-vin-rouge',
     to_jsonb('vinaigre de vin rouge'::text),
     'myko_f0_curated',
     v_run, true);

  -- Conservation : ambient / sealed / opened
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, 'ambient', 'sealed', 'opened',
     15, 25,
     17520, 35040, 17520,
     'low', v_ds, 'f0:vinaigre-de-vin-rouge:ambient:sealed:opened',
     'A', 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

END $form$;

-- Transformation : Poulet / desosser_depouiller
DO $tx$
DECLARE
  v_src_form uuid;
  v_tx       uuid;
  v_out_form uuid;
BEGIN
  -- Résolution de la forme source
  SELECT ff.id INTO v_src_form
    FROM catalog.food_forms ff
    JOIN catalog.food_concepts fc ON fc.id = ff.food_concept_id
    WHERE fc.canonical_name_normalized = 'poulet'
      AND ff.canonical_name_normalized = 'cuisse de poulet crue avec os avec peau';
  IF v_src_form IS NULL THEN
    RAISE EXCEPTION 'Forme source introuvable pour transformation: Cuisse de poulet crue, avec os, avec peau (concept Poulet)';
  END IF;

  -- Insertion de la transformation
  INSERT INTO catalog.food_transformations
    (source_food_form_id, action_code, action_label,
     active_minutes, passive_minutes, skill_level,
     equipment_requirements, safety_requirements,
     confidence_level, status)
  VALUES
    (v_src_form, 'desosser_depouiller', 'Désosser et dépouiller',
     6, 0,
     'intermediate',
     '[]'::jsonb, '[]'::jsonb,
     'B', 'candidate')
  RETURNING id INTO v_tx;

  -- Sortie : Haut de cuisse de poulet cru, désossé, sans peau (rôle: main)
  SELECT ff.id INTO v_out_form
    FROM catalog.food_forms ff
    WHERE ff.canonical_name_normalized = 'haut de cuisse de poulet cru desosse sans peau';
  -- Sortie optionnelle si la forme n'existe pas encore dans le catalogue
  IF v_out_form IS NOT NULL THEN
    INSERT INTO catalog.food_transformation_outputs
      (transformation_id, output_food_form_id, output_role,
       expected_yield_ratio, min_yield_ratio, max_yield_ratio, is_optional)
    VALUES
      (v_tx, v_out_form, 'main',
       0.58, 0.54, 0.62,
       false)
    ON CONFLICT (transformation_id, output_food_form_id, output_role)
    DO UPDATE SET
      expected_yield_ratio = EXCLUDED.expected_yield_ratio,
      min_yield_ratio      = EXCLUDED.min_yield_ratio,
      max_yield_ratio      = EXCLUDED.max_yield_ratio;
  END IF;

  -- Sortie : Os et articulations de poulet (rôle: byproduct)
  SELECT ff.id INTO v_out_form
    FROM catalog.food_forms ff
    WHERE ff.canonical_name_normalized = 'os et articulations de poulet';
  -- Sortie optionnelle si la forme n'existe pas encore dans le catalogue
  IF v_out_form IS NOT NULL THEN
    INSERT INTO catalog.food_transformation_outputs
      (transformation_id, output_food_form_id, output_role,
       expected_yield_ratio, min_yield_ratio, max_yield_ratio, is_optional)
    VALUES
      (v_tx, v_out_form, 'byproduct',
       0.22, 0.18, 0.25,
       false)
    ON CONFLICT (transformation_id, output_food_form_id, output_role)
    DO UPDATE SET
      expected_yield_ratio = EXCLUDED.expected_yield_ratio,
      min_yield_ratio      = EXCLUDED.min_yield_ratio,
      max_yield_ratio      = EXCLUDED.max_yield_ratio;
  END IF;

  -- Sortie : Parures et peau de poulet (rôle: trim)
  SELECT ff.id INTO v_out_form
    FROM catalog.food_forms ff
    WHERE ff.canonical_name_normalized = 'parures et peau de poulet';
  -- Sortie optionnelle si la forme n'existe pas encore dans le catalogue
  IF v_out_form IS NOT NULL THEN
    INSERT INTO catalog.food_transformation_outputs
      (transformation_id, output_food_form_id, output_role,
       expected_yield_ratio, min_yield_ratio, max_yield_ratio, is_optional)
    VALUES
      (v_tx, v_out_form, 'trim',
       0.19, 0.14, 0.24,
       false)
    ON CONFLICT (transformation_id, output_food_form_id, output_role)
    DO UPDATE SET
      expected_yield_ratio = EXCLUDED.expected_yield_ratio,
      min_yield_ratio      = EXCLUDED.min_yield_ratio,
      max_yield_ratio      = EXCLUDED.max_yield_ratio;
  END IF;

END $tx$;

