-- Rollback de la tranche 10 du corpus V3 à 754 recettes.
--
-- IL NE SUPPRIME RIEN, et c'est le seul comportement sûr : entre l'application
-- et le retour en arrière, un plan a pu être publié sur l'une de ces recettes.
-- Supprimer la version serait refusé par la base — `recipe_executions` la
-- référence sans clause ON DELETE — et la contourner orphelinerait un repas
-- déjà cuisiné. Ce qu'un rollback de tranche défait, c'est donc la MISE EN
-- SERVICE des recettes que la tranche a introduites, exactement comme le dépôt
-- retire FR-007 : hors du catalogue éditorial (`quality_level` 'D', qui n'admet
-- que A et B) et hors du planificateur (`planning_eligible = false`), motif
-- écrit dans `eligibility_issues`. Cette tranche en a introduit 54.
--
-- CE QU'IL NE REND PAS. Les autres recettes de cette tranche existaient avant
-- ce chargement et ont été mises à jour en place. Ce fichier ne restaure pas
-- leur contenu antérieur : pour cela, il faut rejouer la migration de corpus
-- précédente, qui est conservée dans ce dépôt
-- (`20260731120000_corpus_v3_589_variantes.sql`). C'est dit ici plutôt que
-- laissé à deviner.

UPDATE culinary.recipe_versions rv
SET quality_level = 'D',
    planning_eligible = false,
    eligibility_issues = jsonb_build_array(jsonb_build_object(
      'code', 'recipe_rolled_back',
      'migration', '20260917104000_corpus_v3_754_tranche_10',
      'reason', 'Version introduite par le chargement du corpus à 754 recettes, retirée du service par rollback.'
    ))
FROM ops.source_datasets ds
WHERE ds.id = rv.source_dataset_id
  AND ds.code = 'myko_editorial_v3'
  AND upper(rv.source_record_key) IN (
    'RAP-032',
    'VAR-015',
    'VAR-025',
    'VAR-042',
    'VAR-043',
    'VAR-045',
    'JUM-001',
    'JUM-002',
    'JUM-003',
    'JUM-004',
    'JUM-005',
    'JUM-006',
    'JUM-007',
    'JUM-031',
    'JUM-032',
    'JUM-033',
    'JUM-041',
    'JUM-042',
    'JUM-043',
    'JUM-051',
    'JUM-052',
    'JUM-053',
    'JUM-054',
    'JUM-055',
    'JUM-061',
    'JUM-062',
    'JUM-063',
    'JUM-064',
    'JUM-065',
    'JUM-071',
    'JUM-072',
    'JUM-073',
    'JUM-074',
    'JUM-081',
    'JUM-082',
    'JUM-083',
    'JUM-084',
    'JUM-091',
    'JUM-092',
    'JUM-093',
    'JUM-094',
    'JUM-095',
    'JUM-101',
    'JUM-102',
    'JUM-103',
    'JUM-104',
    'JUM-111',
    'JUM-112',
    'JUM-113',
    'JUM-114',
    'JUM-115',
    'JUM-121',
    'JUM-122',
    'JUM-123'
  );
