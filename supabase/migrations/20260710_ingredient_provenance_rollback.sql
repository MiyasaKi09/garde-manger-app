-- ============================================================================
-- Rollback: 20260710_ingredient_provenance_rollback.sql
-- ============================================================================
-- Annule la migration 20260710_ingredient_provenance.sql.
-- Retire les colonnes source et verified de canonical_foods.
--
-- ATTENTION : les entrées auto-créées (source='auto', verified=false) ne sont
-- PAS supprimées par ce rollback — seules les colonnes sont retirées. Si une
-- purge des entrées auto est souhaitée, exécuter manuellement :
--   DELETE FROM canonical_foods WHERE source = 'auto';
-- AVANT d'exécuter ce fichier.
-- ============================================================================

ALTER TABLE public.canonical_foods
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS verified;
