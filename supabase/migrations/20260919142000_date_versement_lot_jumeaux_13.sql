-- Les cinq recettes du lot « jumeaux 13 » reçoivent leur date de versement.
--
-- CE QUE CETTE MIGRATION ÉCRIT, ET D'OÙ VIENT LA DATE. Le registre
-- `data/recipes/versements.json` porte désormais deux lots ; celui-ci est la
-- copie du second pour les lignes DÉJÀ chargées en base — les chargements
-- futurs écrivent la colonne eux-mêmes (`scripts/data/recipes/build-corpus-v3.mjs`).
-- `tests/recipes/versement.test.js` refuse que registre et migrations
-- divergent : mêmes codes, même date, au compte près, sur l'UNION des deux
-- migrations de valeurs.
--
-- POURQUOI UNE SECONDE MIGRATION, et non une reprise de 20260919141000. Cette
-- dernière est appliquée et figée : `apply-migrations.sh` refuse un fichier
-- dont l'empreinte a changé après enregistrement. Un lot postérieur écrit donc
-- la sienne, et c'est le régime normal de l'usine à recettes : un lot par
-- semaine, une migration de dates par lot.
--
-- LA DATE EST MESURÉE, PAS CHOISIE. Commit ca0488a, « Huit lignées carnées
-- reçoivent leur jumeau — et le sourçage en a refusé dix », daté du
-- 2026-09-17T22:13:07+00:00. Vérification :
--   git show ca0488a^:data/recipes/corpus-v3.json → 754 codes
--   git show ca0488a:data/recipes/corpus-v3.json  → 759 codes
-- L'écart est exactement les cinq codes ci-dessous, 0 code retiré.
--
-- CE QU'ELLE N'ÉCRIT PAS : VAR-035, RAP-023 et FR-027. Le même lot les a
-- touchées, mais il ne les a pas versées — elles étaient au corpus depuis des
-- lots antérieurs et n'ont reçu qu'un rattachement de lignée. Les dater
-- d'aujourd'hui les ferait paraître neuves sur l'écran « Nouveautés », ce
-- qu'elles ne sont pas. Elles restent sans date, comme les 706 autres.
--
-- ELLE NE TOUCHE AUCUNE LIGNE SI LE LOT N'EST PAS ENCORE CHARGÉ, et c'est
-- voulu : sur une base reconstruite depuis zéro, le corpus arrive par la chaîne
-- de publication, qui pose la date elle-même. Zéro ligne mise à jour n'est donc
-- pas un échec, et cette migration ne l'affirme pas. À APPLIQUER APRÈS
-- 20260919150000, qui charge ces cinq recettes.
--
-- IDEMPOTENTE : la clause `IS DISTINCT FROM` fait qu'un second passage ne
-- touche aucune ligne.

UPDATE culinary.recipe_versions rv
SET corpus_poured_on = DATE '2026-09-17'
FROM ops.source_datasets sd
WHERE sd.id = rv.source_dataset_id
  AND sd.code = 'myko_editorial_v3'
  AND rv.corpus_poured_on IS DISTINCT FROM DATE '2026-09-17'
  AND upper(rv.source_record_key) IN (
    'JUM-124', 'JUM-125', 'JUM-126', 'JUM-127', 'JUM-128'
  );
