-- ========================================================================
-- IMPORT SÉLECTIF DE RECETTES DE QUALITÉ DEPUIS FICHIERS MEGA
-- Total: 0 recettes
-- ========================================================================

BEGIN;

COMMIT;

-- ========================================================================
-- VÉRIFICATION FINALE
-- ========================================================================

SELECT 
  'IMPORT TERMINÉ' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as plats_principaux,
  COUNT(*) FILTER (WHERE role = 'ENTREE') as entrees,
  COUNT(*) FILTER (WHERE role = 'DESSERT') as desserts,
  COUNT(*) FILTER (WHERE role = 'ACCOMPAGNEMENT') as accompagnements
FROM recipes;
