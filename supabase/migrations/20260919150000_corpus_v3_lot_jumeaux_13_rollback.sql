-- Rollback du lot « jumeaux 13 » (20260919150000).
--
-- IL NE SUPPRIME RIEN, et c'est le seul comportement sûr : entre l'application
-- et le retour en arrière, un plan a pu être publié sur l'une de ces recettes.
-- Supprimer la version serait refusé par la base — `recipe_executions` la
-- référence sans clause ON DELETE — et la contourner orphelinerait un repas
-- déjà cuisiné. Ce qu'il défait, c'est la MISE EN SERVICE des cinq recettes que
-- ce lot a INTRODUITES, exactement comme le dépôt retire FR-007 : hors du
-- catalogue éditorial (`quality_level = 'D'`, qui n'admet que A et B) et hors
-- du planificateur (`planning_eligible = false`), motif écrit dans
-- `eligibility_issues`.
--
-- ET IL REND LEUR LIGNÉE AUX TROIS RATTACHEMENTS. VAR-035, RAP-023 et FR-027
-- existaient avant ce lot et n'ont reçu qu'un `derived_from` : le rollback le
-- retire et rend l'empreinte que chacune portait avant, mais SEULEMENT si elle
-- porte encore celle que 20260919150000 a posée. Une recette corrigée à la main
-- depuis n'est pas écrasée par ce rollback.
--
-- CE QU'IL NE REND PAS : le contenu antérieur de ces trois fiches au-delà de
-- ces deux colonnes. Rien d'autre n'a changé — le lot les a versées par
-- « remplace », à la virgule près sauf `derived_from` et le paragraphe de
-- rattachement ajouté à leur arbitrage canonique. C'est dit ici plutôt que
-- laissé à deviner.

UPDATE culinary.recipe_versions rv
SET quality_level = 'D',
    planning_eligible = false,
    eligibility_issues = COALESCE(rv.eligibility_issues, '[]'::jsonb)
      || jsonb_build_array('retiree_par_rollback_20260919150000')
FROM ops.source_datasets sd
WHERE sd.id = rv.source_dataset_id
  AND sd.code = 'myko_editorial_v3'
  AND upper(rv.source_record_key) IN ('JUM-124', 'JUM-125', 'JUM-126', 'JUM-127', 'JUM-128');

-- Les trois rattachements : lignée et empreinte rendues.
WITH _avant (code, apres, avant) AS (
  VALUES
    ('VAR-035', 'ceb9289f4118b8c07fe1254062e400fc', 'd347791f5fe6e490e55c7ae8f58c02d3'),
    ('RAP-023', '797843c9add9b5ace0d4f6148c4a9f28', '2fe7363b4afeb618c28346db818dcc68'),
    ('FR-027', '7084d3fdae4bca0c28cac4b43477e61e', 'c0ca578d5ad09dfd750d5acda1caa24f')
)
UPDATE culinary.recipe_versions rv
SET derived_from_version_id = NULL,
    content_hash = a.avant
FROM ops.source_datasets sd, _avant a
WHERE sd.id = rv.source_dataset_id
  AND sd.code = 'myko_editorial_v3'
  AND upper(rv.source_record_key) = a.code
  AND rv.content_hash = a.apres;
