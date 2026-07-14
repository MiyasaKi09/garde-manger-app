-- ============================================================================
-- Migration V2 — Provenance réelle de l'import F0 (fix F0, points 4, 5)
-- ============================================================================
-- Enregistre un ops.import_run réel et remplit ops.field_provenance pour chaque
-- valeur nutritionnelle (source Ciqual + alim_code) et l'identité de chaque forme.
-- Idempotent (guard WHERE NOT EXISTS sur configuration_hash / provenance existante).
-- La conservation DURABLE du fichier source brut est traitée séparément (fichier
-- versionné dans le dépôt : data/sources/raw/, cf. import_blobs.object_path).
-- ============================================================================

-- 1. Import run réel pour F0 (idempotent).
INSERT INTO ops.import_runs
  (source_dataset_id, source_version, code_version, configuration_hash, status,
   started_at, completed_at, raw_count, parsed_count, candidate_count, rejected_count, warning_count, error_summary)
SELECT sd.id, '2020-07-07', 'f0-1.0', md5('ciqual_f0:2020-07-07:v1'), 'completed',
       now(), now(), 3186, 2208, 300, 978, 8,
       '{"rejected":{"no_category":84,"no_energy":881,"blocking_anomaly":13}}'::jsonb
FROM ops.source_datasets sd
WHERE sd.code = 'ciqual_2020'
  AND NOT EXISTS (SELECT 1 FROM ops.import_runs r WHERE r.configuration_hash = md5('ciqual_f0:2020-07-07:v1'));

-- 2. Provenance par champ : valeurs nutritionnelles (source Ciqual, clé = alim_code).
WITH run AS (SELECT id FROM ops.import_runs WHERE configuration_hash = md5('ciqual_f0:2020-07-07:v1') LIMIT 1),
     sd  AS (SELECT id FROM ops.source_datasets WHERE code = 'ciqual_2020')
INSERT INTO ops.field_provenance
  (entity_schema, entity_table, entity_id, field_name, source_dataset_id, source_record_key,
   normalized_value, transformation_rule, import_run_id, selected)
SELECT 'catalog', 'food_nutrition_profiles', p.id, v.nutrient_code, sd.id, p.source_record_key,
       to_jsonb(v.amount), 'ciqual_value(comma_decimal, traces/<seuil)->'||v.value_status, run.id, true
FROM catalog.food_nutrition_profiles p
JOIN catalog.food_nutrient_values v ON v.nutrition_profile_id = p.id
CROSS JOIN run CROSS JOIN sd
WHERE p.data_version = '2020-07-07'
  AND NOT EXISTS (
    SELECT 1 FROM ops.field_provenance fp
    WHERE fp.entity_table='food_nutrition_profiles' AND fp.entity_id=p.id AND fp.field_name=v.nutrient_code
  );

-- 3. Provenance : identité (nom) de chaque forme F0.
WITH run AS (SELECT id FROM ops.import_runs WHERE configuration_hash = md5('ciqual_f0:2020-07-07:v1') LIMIT 1),
     sd  AS (SELECT id FROM ops.source_datasets WHERE code = 'ciqual_2020')
INSERT INTO ops.field_provenance
  (entity_schema, entity_table, entity_id, field_name, source_dataset_id, source_record_key,
   normalized_value, transformation_rule, import_run_id, selected)
SELECT 'catalog', 'food_forms', ff.id, 'canonical_name', sd.id, p.source_record_key,
       to_jsonb(ff.canonical_name), 'ciqual_alim_nom_fr', run.id, true
FROM catalog.food_forms ff
JOIN catalog.food_nutrition_profiles p ON p.food_form_id = ff.id AND p.data_version = '2020-07-07'
CROSS JOIN run CROSS JOIN sd
WHERE NOT EXISTS (
  SELECT 1 FROM ops.field_provenance fp
  WHERE fp.entity_table='food_forms' AND fp.entity_id=ff.id AND fp.field_name='canonical_name'
);

-- 4. Rattacher la release F0 à son import_run (traçabilité).
UPDATE ops.catalog_releases
SET quality_report = quality_report || jsonb_build_object(
      'import_run_id', (SELECT id FROM ops.import_runs WHERE configuration_hash = md5('ciqual_f0:2020-07-07:v1') LIMIT 1))
WHERE version = 'F0-2020.07.07';
