-- Rollback des dates du lot « jumeaux 13 » (20260919142000).
--
-- Il rend à ces cinq recettes l'absence de date qu'elles portaient avant. La
-- date elle-même n'est pas perdue : elle vit dans `data/recipes/versements.json`,
-- versionné, et un rechargement du corpus la repose.
--
-- Il ne retire la date QUE des codes que 20260919142000 a écrits, et seulement
-- si elle vaut encore celle qu'il a posée : une date corrigée à la main depuis
-- n'est pas effacée par ce rollback.

UPDATE culinary.recipe_versions rv
SET corpus_poured_on = NULL
FROM ops.source_datasets sd
WHERE sd.id = rv.source_dataset_id
  AND sd.code = 'myko_editorial_v3'
  AND rv.corpus_poured_on = DATE '2026-09-17'
  AND upper(rv.source_record_key) IN (
    'JUM-124', 'JUM-125', 'JUM-126', 'JUM-127', 'JUM-128'
  );
