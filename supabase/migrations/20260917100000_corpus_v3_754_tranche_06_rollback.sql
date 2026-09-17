-- Rollback de la tranche 06 du corpus V3 à 754 recettes.
--
-- IL NE SUPPRIME RIEN, et c'est le seul comportement sûr : entre l'application
-- et le retour en arrière, un plan a pu être publié sur l'une de ces recettes.
-- Supprimer la version serait refusé par la base — `recipe_executions` la
-- référence sans clause ON DELETE — et la contourner orphelinerait un repas
-- déjà cuisiné. Ce qu'un rollback de tranche défait, c'est donc la MISE EN
-- SERVICE des recettes que la tranche a introduites, exactement comme le dépôt
-- retire FR-007 : hors du catalogue éditorial (`quality_level` 'D', qui n'admet
-- que A et B) et hors du planificateur (`planning_eligible = false`), motif
-- écrit dans `eligibility_issues`. Cette tranche en a introduit 44.
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
      'migration', '20260917100000_corpus_v3_754_tranche_06',
      'reason', 'Version introduite par le chargement du corpus à 754 recettes, retirée du service par rollback.'
    ))
FROM ops.source_datasets ds
WHERE ds.id = rv.source_dataset_id
  AND ds.code = 'myko_editorial_v3'
  AND upper(rv.source_record_key) IN (
    'VAR-021',
    'VAR-022',
    'VAR-023',
    'VAR-024',
    'VAR-026',
    'VAR-027',
    'VAR-028',
    'VAR-029',
    'VAR-030',
    'VAR-031',
    'VAR-032',
    'VAR-033',
    'VAR-034',
    'VAR-035',
    'VAR-036',
    'VAR-037',
    'VAR-038',
    'VAR-039',
    'VAR-040',
    'VAR-041',
    'VAR-044',
    'DEN-001',
    'DEN-002',
    'DEN-003',
    'DEN-004',
    'DEN-005',
    'DEN-006',
    'DEN-007',
    'DEN-008',
    'DEN-009',
    'DEN-010',
    'DEN-011',
    'DEN-012',
    'DEN-013',
    'DEN-014',
    'DEN-015',
    'DEN-016',
    'DEN-017',
    'DEN-018',
    'DEN-019',
    'DEN-020',
    'DEN-021',
    'DEN-022',
    'DEN-023'
  );
