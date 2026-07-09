-- ============================================================================
-- Rollback: 20260709_routine_v5_rollback.sql
-- Annule la migration 20260709_routine_v5.sql
-- ============================================================================
--
-- AVERTISSEMENT
-- -------------
-- Ce rollback supprime des données (user_food_bans et ses seed) et des colonnes.
-- Effectuer un backup (pg_dump ou export CSV via /docs/SECURITY_ACTIONS.md)
-- AVANT toute exécution en production.
--
-- Ordre respecté : supprimer les FK / indexes avant les colonnes, DROP TABLE
-- en dernier pour éviter les violations de contraintes.
-- ============================================================================

-- 1. Supprimer la table user_food_bans
--    Les policies, index et séquences sont supprimés en cascade par DROP TABLE.
DROP TABLE IF EXISTS public.user_food_bans;

-- 2. Supprimer l'index partiel sur nutrition_plan_meals.generated_recipe_id
DROP INDEX IF EXISTS public.idx_npm_generated_recipe_id;

-- 3. Supprimer les colonnes ajoutées à nutrition_plan_meals
ALTER TABLE public.nutrition_plan_meals
  DROP COLUMN IF EXISTS generated_recipe_id,
  DROP COLUMN IF EXISTS is_leftover,
  DROP COLUMN IF EXISTS cooked_dish_id;

-- 4. Supprimer les colonnes ajoutées à plan_regen_requests
ALTER TABLE public.plan_regen_requests
  DROP COLUMN IF EXISTS error_message,
  DROP COLUMN IF EXISTS updated_at;

-- 5. Supprimer la colonne ajoutée à nutrition_plan_batch_recipes
ALTER TABLE public.nutrition_plan_batch_recipes
  DROP COLUMN IF EXISTS ingredients_json;

-- Vérification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_food_bans'
  ) THEN
    RAISE NOTICE 'Rollback 20260709_routine_v5 : user_food_bans supprimée.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nutrition_plan_meals'
      AND column_name = 'generated_recipe_id'
  ) THEN
    RAISE NOTICE 'Rollback 20260709_routine_v5 : colonnes nutrition_plan_meals supprimées.';
  END IF;
END $$;
