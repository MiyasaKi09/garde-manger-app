-- ============================================================================
-- ROLLBACK: 20260708_rls_user_tables_rollback.sql
-- ============================================================================
-- Annule 20260708_rls_user_tables.sql : supprime les policies et désactive RLS
-- sur les tables concernées.
--
-- ATTENTION : DISABLE ROW LEVEL SECURITY rend la table accessible à tous les
-- rôles, y compris anon. N'exécuter qu'en développement ou avant de remplacer
-- par une policy plus restrictive.
--
-- Ce fichier ne touche PAS aux tables déjà couvertes par d'autres migrations
-- (cooked_dishes, meal_log, weight_entries, generated_recipes, nutrition_plan_*)
-- car leur RLS n'a pas été modifié par 20260708_rls_user_tables.sql.
-- ============================================================================

-- ============================================================================
-- SECTION A — Tables per-utilisateur
-- ============================================================================

-- A1. inventory_lots
DROP POLICY IF EXISTS inv_lots_select_own ON public.inventory_lots;
DROP POLICY IF EXISTS inv_lots_insert_own ON public.inventory_lots;
DROP POLICY IF EXISTS inv_lots_update_own ON public.inventory_lots;
DROP POLICY IF EXISTS inv_lots_delete_own ON public.inventory_lots;
ALTER TABLE public.inventory_lots DISABLE ROW LEVEL SECURITY;

-- A2. user_profiles
DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_own ON public.user_profiles;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- A3. user_health_goals
DROP POLICY IF EXISTS user_health_goals_select_own ON public.user_health_goals;
DROP POLICY IF EXISTS user_health_goals_insert_own ON public.user_health_goals;
DROP POLICY IF EXISTS user_health_goals_update_own ON public.user_health_goals;
DROP POLICY IF EXISTS user_health_goals_delete_own ON public.user_health_goals;
ALTER TABLE public.user_health_goals DISABLE ROW LEVEL SECURITY;

-- A4. user_allergies
DROP POLICY IF EXISTS user_allergies_select_own ON public.user_allergies;
DROP POLICY IF EXISTS user_allergies_insert_own ON public.user_allergies;
DROP POLICY IF EXISTS user_allergies_update_own ON public.user_allergies;
DROP POLICY IF EXISTS user_allergies_delete_own ON public.user_allergies;
ALTER TABLE public.user_allergies DISABLE ROW LEVEL SECURITY;

-- A5. user_diets
DROP POLICY IF EXISTS user_diets_select_own ON public.user_diets;
DROP POLICY IF EXISTS user_diets_insert_own ON public.user_diets;
DROP POLICY IF EXISTS user_diets_update_own ON public.user_diets;
DROP POLICY IF EXISTS user_diets_delete_own ON public.user_diets;
ALTER TABLE public.user_diets DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION B — Catalogue partagé
-- ============================================================================

DROP POLICY IF EXISTS recipes_auth_all ON public.recipes;
ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipe_ingredients_auth_all ON public.recipe_ingredients;
ALTER TABLE public.recipe_ingredients DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipe_steps_auth_all ON public.recipe_steps;
ALTER TABLE public.recipe_steps DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION C — Référentiels
-- ============================================================================

DROP POLICY IF EXISTS canonical_foods_auth_all ON public.canonical_foods;
ALTER TABLE public.canonical_foods DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS archetypes_auth_all ON public.archetypes;
ALTER TABLE public.archetypes DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cultivars_auth_all ON public.cultivars;
ALTER TABLE public.cultivars DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_auth_all ON public.products;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nutritional_data_auth_all ON public.nutritional_data;
ALTER TABLE public.nutritional_data DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE 'Rollback 20260708_rls_user_tables appliqué. RLS désactivé sur 13 tables.';
END $$;
