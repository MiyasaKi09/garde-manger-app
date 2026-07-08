-- ============================================================================
-- Migration: 20260708_rls_user_tables.sql
-- Versionne les policies RLS effectives — Phase 0.1 / §C1 de l'audit juillet 2026
-- ============================================================================
--
-- CONTEXTE
-- --------
-- L'audit §C1 signalait qu'aucune migration du repo n'activait le RLS sur
-- inventory_lots ni sur les tables de profil utilisateur. La vérification sur
-- la base live (08/07/2026) a montré que le RLS EST actif et cohérent sur
-- toutes ces tables — il avait été configuré via le dashboard Supabase, donc
-- jamais versionné. Cette migration codifie l'état live réel, à l'identique
-- (mêmes noms de policies, mêmes expressions), pour que le repo soit la source
-- de vérité. Elle est un no-op sur la base de production.
--
-- ÉTAT VERSIONNÉ (relevé pg_policies du 08/07/2026)
-- --------------------------------------------------
-- 1. Tables per-user (owner-only, FOR ALL) :
--    - inventory_lots      : policy inventory_lots_owner_all (authenticated)
--    - user_profiles       : policy users_own_profile        (public)
--    - user_health_goals   : policy users_own_health_goals   (public)
--    - user_allergies      : policy users_own_allergies      (public)
--    - user_diets          : policy users_own_diets          (public)
-- 2. Catalogue partagé (usage foyer : lecture anon + IA, écriture authentifiée) :
--    - recipes, recipe_ingredients, recipe_steps,
--      canonical_foods, archetypes, cultivars, products, nutritional_data :
--      policies myko_catalog_read (SELECT, rôles ai_claude + anon)
--             + myko_catalog_write (ALL, authenticated)
--
-- TABLES DÉJÀ COUVERTES PAR D'AUTRES MIGRATIONS (exclues ici)
--   weight_entries, meal_log               : 011 + 20260609_db_hardening
--   cooked_dishes, cooked_dish_ingredients : 002
--   generated_recipes                      : 012 + 20260609_db_hardening
--   nutrition_plan_*                       : 009 + 20260609_db_hardening
--
-- TABLES EXCLUES PAR INCOMPATIBILITÉ DE SCHÉMA (legacy, user_id integer)
--   pantry_items, meal_plans, user_recipe_interactions, planned_meals
--
-- NOTE : le rôle ai_claude est un rôle custom existant en production (accès
-- lecture pour les routines IA). Sa création est guardée ci-dessous pour que
-- la migration reste applicable sur un environnement neuf.
--
-- IDEMPOTENCE : chaque CREATE POLICY est guardé par un test pg_policies.
-- ROLLBACK    : 20260708_rls_user_tables_rollback.sql
-- ============================================================================

-- Rôle ai_claude (lecture catalogue pour routines IA) — création guardée
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_claude') THEN
    CREATE ROLE ai_claude NOLOGIN;
  END IF;
END $$;

-- ============================================================================
-- 1. TABLES PER-USER (owner-only)
-- ============================================================================

ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='inventory_lots'
      AND policyname='inventory_lots_owner_all'
  ) THEN
    CREATE POLICY inventory_lots_owner_all ON public.inventory_lots
      FOR ALL TO authenticated
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_profiles'
      AND policyname='users_own_profile'
  ) THEN
    CREATE POLICY users_own_profile ON public.user_profiles
      FOR ALL
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

ALTER TABLE public.user_health_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_health_goals'
      AND policyname='users_own_health_goals'
  ) THEN
    CREATE POLICY users_own_health_goals ON public.user_health_goals
      FOR ALL
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_allergies'
      AND policyname='users_own_allergies'
  ) THEN
    CREATE POLICY users_own_allergies ON public.user_allergies
      FOR ALL
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

ALTER TABLE public.user_diets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_diets'
      AND policyname='users_own_diets'
  ) THEN
    CREATE POLICY users_own_diets ON public.user_diets
      FOR ALL
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================================================
-- 2. CATALOGUE PARTAGÉ (lecture anon + ai_claude, écriture authentifiée)
-- ============================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'recipes', 'recipe_ingredients', 'recipe_steps',
    'canonical_foods', 'archetypes', 'cultivars', 'products', 'nutritional_data'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname='myko_catalog_read'
    ) THEN
      EXECUTE format(
        'CREATE POLICY myko_catalog_read ON public.%I FOR SELECT TO ai_claude, anon USING (true)', t
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname='myko_catalog_write'
    ) THEN
      EXECUTE format(
        'CREATE POLICY myko_catalog_write ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Vérification (informatif)
-- ============================================================================
DO $$
DECLARE
  missing INT;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('inventory_lots'), ('user_profiles'), ('user_health_goals'),
    ('user_allergies'), ('user_diets'),
    ('recipes'), ('recipe_ingredients'), ('recipe_steps'),
    ('canonical_foods'), ('archetypes'), ('cultivars'), ('products'),
    ('nutritional_data')
  ) AS t(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname=t.name AND c.relrowsecurity
  );

  IF missing = 0 THEN
    RAISE NOTICE 'Migration 20260708_rls_user_tables : RLS actif sur les 13 tables.';
  ELSE
    RAISE WARNING 'Migration 20260708_rls_user_tables : % table(s) sans RLS.', missing;
  END IF;
END $$;
