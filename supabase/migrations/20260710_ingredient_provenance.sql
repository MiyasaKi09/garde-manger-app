-- ============================================================================
-- Migration: 20260710_ingredient_provenance.sql
-- ============================================================================
-- PURPOSE
-- -------
-- Add traceability columns to canonical_foods for automatically-created entries.
--
-- The ingredient resolver (lib/ingredientResolver.js) can create canonical_foods
-- rows on-the-fly during shopping-item resolution and lot insertion. Without this
-- migration those auto-created rows are indistinguishable from curated CIQUAL
-- entries, making review and cleanup impossible.
--
-- After this migration:
--   source='auto', verified=false  → created by the resolver, awaiting review
--   source='curated', verified=true → existing CIQUAL / manually curated (default)
--   source='ai', verified=false    → future: AI-assisted creation
--
-- IDEMPOTENCE
-- -----------
-- ADD COLUMN IF NOT EXISTS — safe to replay on an already-migrated schema.
-- The DEFAULT values ensure all pre-existing rows get source='curated' and
-- verified=true, which is correct for the existing CIQUAL-sourced catalogue.
--
-- ROLLBACK
-- --------
-- See 20260710_ingredient_provenance_rollback.sql
-- ============================================================================

ALTER TABLE public.canonical_foods
  ADD COLUMN IF NOT EXISTS source   text    NOT NULL DEFAULT 'curated'
    CHECK (source IN ('curated', 'auto', 'ai')),
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.canonical_foods.source IS
  'Provenance de l''entrée : '
  '''curated'' (défaut) — CIQUAL ou saisie manuelle vérifiée ; '
  '''auto'' — créé par le résolveur d''ingrédients (lib/ingredientResolver.js) lors de la '
  '           résolution d''un item de courses ou d''un lot, sans correspondance dans le catalogue ; '
  '''ai'' — futur, création assistée par IA. '
  'Les entrées auto/ai ont verified=false et sont révisables via backoffice ou migration de données.';

COMMENT ON COLUMN public.canonical_foods.verified IS
  'TRUE (défaut) : entrée vérifiée/curée, prête à utiliser dans les calculs nutritionnels. '
  'FALSE : créée automatiquement (source=''auto'' ou ''ai''), à réviser manuellement. '
  'Permet de filtrer le catalogue, prioriser la révision et surveiller la qualité.';

-- Vérification finale
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'canonical_foods'
      AND column_name = 'source'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'canonical_foods'
      AND column_name = 'verified'
  ) THEN
    RAISE NOTICE 'Migration 20260710_ingredient_provenance : canonical_foods.source et .verified présentes et opérationnelles.';
  ELSE
    RAISE EXCEPTION 'Migration 20260710_ingredient_provenance : colonnes manquantes — vérifier les droits ALTER TABLE.';
  END IF;
END $$;
