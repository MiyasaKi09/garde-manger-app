-- Migration 014: Nettoyage - Suppression des archetypes génériques poisson inutiles
-- Date: 2025-11-03
-- Description: Supprime les archetypes "fumet de poisson", "arêtes poisson", "sauce poisson"
--              qui ne seront jamais utilisés dans les recettes (trop génériques)

DO $$
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   CLEANUP : SUPPRESSION ARCHETYPES GÉNÉRIQUES POISSON';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Supprimer les 4 archetypes génériques qui ne seront jamais utilisés
  DELETE FROM archetypes WHERE name IN (
    'fumet de poisson',
    'fumet poisson',
    'arêtes poisson',
    'sauce poisson'
  );

  RAISE NOTICE '✅ Supprimé: 4 archetypes génériques inutiles';
  RAISE NOTICE '';
  RAISE NOTICE 'Raison: Ces archetypes génériques ne seront jamais utilisés dans les recettes.';
  RAISE NOTICE 'Les recettes doivent utiliser des archetypes spécifiques par espèce.';

END $$;

-- Vérification: ces archetypes ne doivent plus exister
SELECT COUNT(*) as "Archetypes poisson génériques restants (doit être 0)"
FROM archetypes
WHERE name IN ('fumet de poisson', 'fumet poisson', 'arêtes poisson', 'sauce poisson');
