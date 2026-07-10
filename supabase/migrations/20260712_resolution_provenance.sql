-- ============================================================================
-- Migration: 20260712_resolution_provenance.sql  (Vague 2 — Liaisons)
-- ============================================================================
-- PURPOSE
-- -------
-- La confiance calculée par le résolveur (lib/ingredientResolver.js) était
-- jetée après résolution. Cette migration la persiste, avec sa provenance,
-- sur les deux tables de liaison, et ajoute un statut de revue exploitable
-- par le panneau « Aliments à confirmer » (/api/ingredients/review).
--
--   match_confidence  numeric      — confiance du résolveur, dans [0, 1]
--   resolution_source text         — 'resolver' | 'auto_create' | 'manual'
--   resolved_at       timestamptz  — horodatage de la résolution
--   review_status     text         — 'auto'      (confiance >= 0.9)
--                                    'proposed'  (0.65 <= confiance < 0.9)
--                                    'pending'   (< 0.65 ou canonique auto-créé)
--                                    'confirmed' (validé par l'utilisateur)
--
-- generated_recipes reçoit un statut global :
--   status — 'ready' | 'needs_review' (>= 1 ingrédient pending) | 'error'
--
-- La RPC replace_generated_recipe_ingredients (Vague 1) est mise à jour (v2)
-- pour persister les nouvelles colonnes — même signature, CREATE OR REPLACE.
--
-- IDEMPOTENCE
-- -----------
-- ADD COLUMN IF NOT EXISTS, DO-blocks gardés sur les contraintes CHECK,
-- CREATE INDEX IF NOT EXISTS, CREATE OR REPLACE FUNCTION.
--
-- ROLLBACK
-- --------
-- See 20260712_resolution_provenance_rollback.sql (restaure la RPC v1).
-- ============================================================================


-- ============================================================================
-- 1. generated_recipe_ingredients — confiance + provenance + statut de revue
-- ============================================================================
ALTER TABLE public.generated_recipe_ingredients
  ADD COLUMN IF NOT EXISTS match_confidence  numeric,
  ADD COLUMN IF NOT EXISTS resolution_source text,
  ADD COLUMN IF NOT EXISTS resolved_at       timestamptz,
  ADD COLUMN IF NOT EXISTS review_status     text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gri_review_status_check'
      AND conrelid = 'public.generated_recipe_ingredients'::regclass
  ) THEN
    ALTER TABLE public.generated_recipe_ingredients
      ADD CONSTRAINT gri_review_status_check
      CHECK (review_status IN ('auto', 'proposed', 'pending', 'confirmed'));
  END IF;
END $$;

-- Index partiel pour le panneau de revue (lignes à confirmer uniquement).
CREATE INDEX IF NOT EXISTS idx_gri_review_status
  ON public.generated_recipe_ingredients (review_status)
  WHERE review_status IN ('pending', 'proposed');

COMMENT ON COLUMN public.generated_recipe_ingredients.match_confidence IS
  'Confiance du résolveur dans [0,1]. NULL sur les lignes antérieures à la migration.';
COMMENT ON COLUMN public.generated_recipe_ingredients.resolution_source IS
  '''resolver'' (match déterministe), ''auto_create'' (canonique créé à la volée), ''manual'' (re-lié via le panneau de revue).';
COMMENT ON COLUMN public.generated_recipe_ingredients.review_status IS
  'auto (>=0.9) / proposed (0.65-0.9) / pending (<0.65 ou auto-créé) / confirmed (validé utilisateur).';


-- ============================================================================
-- 2. nutrition_plan_shopping_items — mêmes colonnes de provenance
-- ============================================================================
ALTER TABLE public.nutrition_plan_shopping_items
  ADD COLUMN IF NOT EXISTS match_confidence  numeric,
  ADD COLUMN IF NOT EXISTS resolution_source text,
  ADD COLUMN IF NOT EXISTS resolved_at       timestamptz,
  ADD COLUMN IF NOT EXISTS review_status     text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'npsi_review_status_check'
      AND conrelid = 'public.nutrition_plan_shopping_items'::regclass
  ) THEN
    ALTER TABLE public.nutrition_plan_shopping_items
      ADD CONSTRAINT npsi_review_status_check
      CHECK (review_status IN ('auto', 'proposed', 'pending', 'confirmed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_npsi_review_status
  ON public.nutrition_plan_shopping_items (review_status)
  WHERE review_status IN ('pending', 'proposed');

COMMENT ON COLUMN public.nutrition_plan_shopping_items.match_confidence IS
  'Confiance du résolveur dans [0,1]. NULL sur les lignes antérieures à la migration.';
COMMENT ON COLUMN public.nutrition_plan_shopping_items.resolution_source IS
  '''resolver'' (match déterministe), ''auto_create'' (canonique créé à la volée), ''manual'' (re-lié via le panneau de revue).';
COMMENT ON COLUMN public.nutrition_plan_shopping_items.review_status IS
  'auto (>=0.9) / proposed (0.65-0.9) / pending (<0.65 ou auto-créé) / confirmed (validé utilisateur).';


-- ============================================================================
-- 3. generated_recipes.status — statut global de liaison de la recette
-- ============================================================================
ALTER TABLE public.generated_recipes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ready';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'generated_recipes_status_check'
      AND conrelid = 'public.generated_recipes'::regclass
  ) THEN
    ALTER TABLE public.generated_recipes
      ADD CONSTRAINT generated_recipes_status_check
      CHECK (status IN ('ready', 'needs_review', 'error'));
  END IF;
END $$;

COMMENT ON COLUMN public.generated_recipes.status IS
  '''ready'' — liaisons complètes ; ''needs_review'' — >=1 ingrédient pending ou liaison échouée ; ''error'' — génération invalide.';


-- ============================================================================
-- 4. RPC replace_generated_recipe_ingredients — v2 (persiste la provenance)
-- ============================================================================
-- Même signature que la v1 (Vague 1) — CREATE OR REPLACE la remplace en place.
-- Nouvelles clés acceptées dans p_rows (toutes optionnelles, NULL sinon) :
--   match_confidence, resolution_source, resolved_at, review_status
-- ============================================================================
CREATE OR REPLACE FUNCTION public.replace_generated_recipe_ingredients(
  p_recipe_id bigint,
  p_rows      jsonb
)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_count int := 0;
  v_row   jsonb;
BEGIN
  -- Vérifier que la recette appartient à l'utilisateur courant
  IF NOT EXISTS (
    SELECT 1 FROM public.generated_recipes
     WHERE id      = p_recipe_id
       AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION
      'Recette générée introuvable ou non autorisée : %', p_recipe_id;
  END IF;

  -- Supprimer les ingrédients existants
  DELETE FROM public.generated_recipe_ingredients
   WHERE generated_recipe_id = p_recipe_id;

  -- Insérer les nouveaux ingrédients
  FOR v_row IN
    SELECT * FROM jsonb_array_elements(COALESCE(p_rows, '[]'::jsonb))
  LOOP
    INSERT INTO public.generated_recipe_ingredients (
      generated_recipe_id,
      raw_name,
      quantity,
      unit,
      notes,
      canonical_food_id,
      archetype_id,
      match_status,
      match_confidence,
      resolution_source,
      resolved_at,
      review_status
    ) VALUES (
      p_recipe_id,
      v_row->>'raw_name',
      (v_row->>'quantity')::numeric,
      v_row->>'unit',
      v_row->>'notes',
      (v_row->>'canonical_food_id')::bigint,
      (v_row->>'archetype_id')::bigint,
      COALESCE(v_row->>'match_status', 'unmatched'),
      (v_row->>'match_confidence')::numeric,
      v_row->>'resolution_source',
      (v_row->>'resolved_at')::timestamptz,
      v_row->>'review_status'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;


-- ============================================================================
-- 5. Vérification finale
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generated_recipe_ingredients'
      AND column_name = 'review_status'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nutrition_plan_shopping_items'
      AND column_name = 'review_status'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generated_recipes'
      AND column_name = 'status'
  ) THEN
    RAISE NOTICE 'Migration 20260712_resolution_provenance : colonnes de provenance et statut opérationnelles.';
  ELSE
    RAISE EXCEPTION 'Migration 20260712_resolution_provenance : colonnes manquantes — vérifier les droits ALTER TABLE.';
  END IF;
END $$;
