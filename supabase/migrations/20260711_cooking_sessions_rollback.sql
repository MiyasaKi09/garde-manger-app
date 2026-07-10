-- ============================================================================
-- Rollback : 20260711_cooking_sessions_rollback.sql
-- Inverse complet de 20260711_cooking_sessions.sql
-- ============================================================================
--
-- ATTENTION : Ce fichier supprime DEFINITIVEMENT toutes les données contenues
-- dans cooking_sessions, cooking_session_ingredients et inventory_movements.
-- A n'exécuter que pour annuler intégralement la Vague 1.
--
-- Ordre de destruction (contraintes FK respectées) :
--   1. Supprimer les 3 RPCs
--   2. Supprimer la colonne cooking_session_id de meal_log
--   3. Supprimer la contrainte CHECK de cooked_dishes
--   4. Supprimer les colonnes cooking_session_id et generated_recipe_id de cooked_dishes
--   5. DROP TABLE cooking_session_ingredients  (FK vers cooking_sessions)
--   6. DROP TABLE inventory_movements          (FK vers cooking_sessions)
--   7. DROP TABLE cooking_sessions
-- ============================================================================


-- ============================================================================
-- 1. Supprimer les RPCs
-- ============================================================================
DROP FUNCTION IF EXISTS public.commit_cooking_session(jsonb);
DROP FUNCTION IF EXISTS public.undo_cooking_session(uuid);
DROP FUNCTION IF EXISTS public.replace_generated_recipe_ingredients(bigint, jsonb);


-- ============================================================================
-- 2. Supprimer la colonne cooking_session_id de meal_log
--    (FK vers cooking_sessions — doit être supprimée avant cooking_sessions)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meal_log'
      AND column_name  = 'cooking_session_id'
  ) THEN
    ALTER TABLE public.meal_log DROP COLUMN cooking_session_id;
  END IF;
END $$;


-- ============================================================================
-- 3. Supprimer la contrainte CHECK de cooked_dishes
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.cooked_dishes'::regclass
      AND conname  = 'cooked_dishes_at_most_one_recipe_source'
  ) THEN
    ALTER TABLE public.cooked_dishes
      DROP CONSTRAINT cooked_dishes_at_most_one_recipe_source;
  END IF;
END $$;


-- ============================================================================
-- 4. Supprimer les colonnes cooking_session_id et generated_recipe_id de cooked_dishes
--    (FKs vers cooking_sessions et generated_recipes)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cooked_dishes'
      AND column_name  = 'cooking_session_id'
  ) THEN
    ALTER TABLE public.cooked_dishes DROP COLUMN cooking_session_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cooked_dishes'
      AND column_name  = 'generated_recipe_id'
  ) THEN
    ALTER TABLE public.cooked_dishes DROP COLUMN generated_recipe_id;
  END IF;
END $$;


-- ============================================================================
-- 5 & 6. Supprimer les tables enfants (FKs vers cooking_sessions)
-- ============================================================================

-- cooking_session_ingredients.session_id → cooking_sessions.id
DROP TABLE IF EXISTS public.cooking_session_ingredients;

-- inventory_movements.session_id → cooking_sessions.id
DROP TABLE IF EXISTS public.inventory_movements;


-- ============================================================================
-- 7. Supprimer cooking_sessions
--    Plus aucune FK externe ne pointe vers cette table après les étapes 2–6.
-- ============================================================================
DROP TABLE IF EXISTS public.cooking_sessions;


-- ============================================================================
-- Confirmation
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE
    'Rollback 20260711_cooking_sessions : RPCs, colonnes FK et tables supprimés.';
END $$;
