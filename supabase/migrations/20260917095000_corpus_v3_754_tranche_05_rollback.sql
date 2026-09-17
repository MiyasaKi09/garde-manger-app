-- Rollback de la tranche 05 du corpus V3 à 754 recettes.
--
-- IL NE SUPPRIME RIEN, et c'est le seul comportement sûr : entre l'application
-- et le retour en arrière, un plan a pu être publié sur l'une de ces recettes.
-- Supprimer la version serait refusé par la base — `recipe_executions` la
-- référence sans clause ON DELETE — et la contourner orphelinerait un repas
-- déjà cuisiné. Ce qu'un rollback de tranche défait, c'est donc la MISE EN
-- SERVICE des recettes que la tranche a introduites, exactement comme le dépôt
-- retire FR-007 : hors du catalogue éditorial (`quality_level` 'D', qui n'admet
-- que A et B) et hors du planificateur (`planning_eligible = false`), motif
-- écrit dans `eligibility_issues`. Cette tranche en a introduit 67.
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
      'migration', '20260917095000_corpus_v3_754_tranche_05',
      'reason', 'Version introduite par le chargement du corpus à 754 recettes, retirée du service par rollback.'
    ))
FROM ops.source_datasets ds
WHERE ds.id = rv.source_dataset_id
  AND ds.code = 'myko_editorial_v3'
  AND upper(rv.source_record_key) IN (
    'RAP-001',
    'RAP-002',
    'RAP-003',
    'RAP-004',
    'RAP-005',
    'RAP-006',
    'RAP-007',
    'RAP-008',
    'RAP-009',
    'RAP-010',
    'RAP-011',
    'RAP-012',
    'RAP-013',
    'RAP-014',
    'RAP-015',
    'RAP-016',
    'RAP-017',
    'RAP-018',
    'RAP-019',
    'RAP-020',
    'RAP-021',
    'RAP-022',
    'RAP-023',
    'RAP-024',
    'RAP-025',
    'RAP-026',
    'RAP-027',
    'RAP-028',
    'RAP-029',
    'RAP-030',
    'RAP-031',
    'RAP-033',
    'RAP-034',
    'RAP-035',
    'RAP-036',
    'RAP-037',
    'RAP-038',
    'RAP-039',
    'RAP-040',
    'RAP-041',
    'RAP-042',
    'RAP-043',
    'RAP-044',
    'RAP-045',
    'RAP-046',
    'RAP-047',
    'RAP-048',
    'RAP-049',
    'RAP-050',
    'RAP-051',
    'RAP-052',
    'VAR-001',
    'VAR-002',
    'VAR-003',
    'VAR-004',
    'VAR-005',
    'VAR-006',
    'VAR-009',
    'VAR-011',
    'VAR-012',
    'VAR-013',
    'VAR-014',
    'VAR-016',
    'VAR-017',
    'VAR-018',
    'VAR-019',
    'VAR-020'
  );
