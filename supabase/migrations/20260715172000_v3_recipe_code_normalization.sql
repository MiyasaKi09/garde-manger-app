-- Keep the canonical recipe identifier stable across imports and plan publication.
-- Early V3 loads used a `v3:` prefix while the planner/API use the corpus code.

BEGIN;

UPDATE culinary.recipe_versions AS recipe_version
SET source_record_key = substring(recipe_version.source_record_key FROM 4)
FROM ops.source_datasets AS dataset
WHERE dataset.id = recipe_version.source_dataset_id
  AND dataset.code = 'myko_editorial_v3'
  AND recipe_version.source_record_key LIKE 'v3:%';

COMMIT;
