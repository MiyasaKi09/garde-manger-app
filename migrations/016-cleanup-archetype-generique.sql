-- Migration 016: Suppression archetype générique fourre-tout
-- Date: 2025-11-03
-- Description: Supprime l'archetype "Archetype générique « À classer »" qui ne devrait pas exister

DO $$
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   CLEANUP : SUPPRESSION ARCHETYPE GÉNÉRIQUE';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Supprimer l'archetype fourre-tout
  DELETE FROM archetypes WHERE name LIKE '%classer%' OR name LIKE '%générique%';

  RAISE NOTICE '✅ Supprimé: archetype générique fourre-tout';

END $$;

-- Vérification
SELECT COUNT(*) as "Archetypes génériques restants (doit être 0)"
FROM archetypes
WHERE name LIKE '%classer%' OR name LIKE '%générique%';
