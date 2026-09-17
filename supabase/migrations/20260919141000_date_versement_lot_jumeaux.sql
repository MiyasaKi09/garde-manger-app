-- Les 48 jumeaux végétariens reçoivent leur date de versement.
--
-- CE QUE CETTE MIGRATION ÉCRIT, ET D'OÙ VIENT LA DATE. Le registre
-- `data/recipes/versements.json` porte un seul lot, et cette migration en est
-- la copie pour les lignes DÉJÀ chargées en base — les chargements futurs
-- écrivent la colonne eux-mêmes (`scripts/data/recipes/build-corpus-v3.mjs`).
-- `tests/recipes/versement.test.js` refuse que les deux divergent : mêmes
-- codes, même date, au compte près.
--
-- LA DATE EST MESURÉE, PAS CHOISIE. Commit 65d5c05, « Quarante-huit jumeaux végétariens versés au corpus »,
-- daté du 2026-09-04T12:56:56+00:00. Vérification :
--   git show 65d5c05^:data/recipes/corpus-v3.json → 706 codes
--   git show 65d5c05:data/recipes/corpus-v3.json  → 754 codes
-- L'écart est exactement les 48 codes ci-dessous, 0 code retiré.
--
-- CE QU'ELLE N'ÉCRIT PAS : les 706 autres recettes. Personne ne sait quel jour
-- elles sont entrées au catalogue — le corpus ne l'a jamais noté, et
-- `created_at` ne porte que la date du chargement. Leur poser une date serait
-- inventer une donnée, et l'écran « Nouveautés » les montrerait comme des
-- nouveautés qu'elles ne sont pas. Elles restent NULL, et l'écran dit combien
-- de recettes il ne peut pas dater.
--
-- ELLE NE TOUCHE AUCUNE LIGNE SI LE CORPUS N'EST PAS ENCORE CHARGÉ, et c'est
-- voulu : sur une base reconstruite depuis zéro, les tranches de corpus
-- arrivent par la chaîne de publication, qui pose la date elle-même. Zéro ligne
-- mise à jour n'est donc pas un échec, et cette migration ne l'affirme pas.
--
-- IDEMPOTENTE : la clause `IS DISTINCT FROM` fait qu'un second passage ne
-- touche aucune ligne.

UPDATE culinary.recipe_versions rv
SET corpus_poured_on = DATE '2026-09-04'
FROM ops.source_datasets sd
WHERE sd.id = rv.source_dataset_id
  AND sd.code = 'myko_editorial_v3'
  AND rv.corpus_poured_on IS DISTINCT FROM DATE '2026-09-04'
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
