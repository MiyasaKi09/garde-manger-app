-- Rollback des dates du lot de jumeaux (20260919141000).
--
-- Il rend à ces 48 recettes l'absence de date qu'elles portaient avant. La
-- date elle-même n'est pas perdue : elle vit dans `data/recipes/versements.json`,
-- versionné, et un rechargement du corpus la repose.
--
-- Il ne retire la date QUE des codes que 20260919141000 a écrits, et seulement
-- si elle vaut encore celle qu'il a posée : une date corrigée à la main depuis
-- n'est pas effacée par ce rollback.

UPDATE culinary.recipe_versions rv
SET corpus_poured_on = NULL
FROM ops.source_datasets sd
WHERE sd.id = rv.source_dataset_id
  AND sd.code = 'myko_editorial_v3'
  AND rv.corpus_poured_on = DATE '2026-09-04'
  AND upper(rv.source_record_key) IN (
    'JUM-001', 'JUM-002', 'JUM-003', 'JUM-004', 'JUM-005', 'JUM-006',
    'JUM-007', 'JUM-031', 'JUM-032', 'JUM-033', 'JUM-041', 'JUM-042',
    'JUM-043', 'JUM-051', 'JUM-052', 'JUM-053', 'JUM-054', 'JUM-055',
    'JUM-061', 'JUM-062', 'JUM-063', 'JUM-064', 'JUM-065', 'JUM-071',
    'JUM-072', 'JUM-073', 'JUM-074', 'JUM-081', 'JUM-082', 'JUM-083',
    'JUM-084', 'JUM-091', 'JUM-092', 'JUM-093', 'JUM-094', 'JUM-095',
    'JUM-101', 'JUM-102', 'JUM-103', 'JUM-104', 'JUM-111', 'JUM-112',
    'JUM-113', 'JUM-114', 'JUM-115', 'JUM-121', 'JUM-122', 'JUM-123'
  );
