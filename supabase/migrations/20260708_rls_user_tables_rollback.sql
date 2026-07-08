-- ============================================================================
-- ROLLBACK: 20260708_rls_user_tables_rollback.sql
-- ============================================================================
-- Annule 20260708_rls_user_tables.sql : supprime les policies versionnées et
-- désactive RLS sur les tables concernées.
--
-- ATTENTION : DISABLE ROW LEVEL SECURITY rend la table accessible à tous les
-- rôles, y compris anon. N'exécuter qu'en développement ou avant de remplacer
-- par une policy plus restrictive. Sur la base de production, ces policies
-- préexistaient à la migration (créées via dashboard) : ce rollback les
-- SUPPRIMERAIT réellement — à n'utiliser qu'en connaissance de cause.
--
-- Ce fichier ne touche PAS aux tables couvertes par d'autres migrations
-- (cooked_dishes, meal_log, weight_entries, generated_recipes, nutrition_plan_*).
-- Le rôle ai_claude n'est pas supprimé (il peut être référencé ailleurs).
-- ============================================================================

-- Tables per-utilisateur
DROP POLICY IF EXISTS inventory_lots_owner_all ON public.inventory_lots;
DROP POLICY IF EXISTS users_own_profile        ON public.user_profiles;
DROP POLICY IF EXISTS users_own_health_goals   ON public.user_health_goals;
DROP POLICY IF EXISTS users_own_allergies      ON public.user_allergies;
DROP POLICY IF EXISTS users_own_diets          ON public.user_diets;

ALTER TABLE public.inventory_lots    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_health_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allergies    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_diets        DISABLE ROW LEVEL SECURITY;

-- Catalogue partagé
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'recipes', 'recipe_ingredients', 'recipe_steps',
    'canonical_foods', 'archetypes', 'cultivars', 'products', 'nutritional_data'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS myko_catalog_read  ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS myko_catalog_write ON public.%I', t);
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
