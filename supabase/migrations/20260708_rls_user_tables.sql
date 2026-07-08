-- ============================================================================
-- Migration: 20260708_rls_user_tables.sql
-- Activation RLS + policies manquantes — audit juillet 2026 §C1 / Phase 0.1
-- ============================================================================
--
-- CONTEXTE
-- --------
-- L'audit de juillet 2026 a identifié que plusieurs tables critiques n'avaient
-- aucune policy RLS versionnée dans le repo (constat §C1). Cette migration
-- installe les policies manquantes en deux groupes :
--
-- SECTION A — Tables per-utilisateur (données privées)
--   inventory_lots, user_profiles, user_health_goals, user_allergies, user_diets
--   Politique : SELECT/INSERT/UPDATE/DELETE restreints à auth.uid() = user_id.
--
-- SECTION B — Catalogue partagé (recettes + nomenclature)
--   recipes, recipe_ingredients, recipe_steps, canonical_foods, archetypes,
--   cultivars, products, nutritional_data
--   Politique : accès complet aux utilisateurs authentifiés uniquement.
--   Objectif : bloquer l'accès via la clé anon (lecture publique non souhaitée),
--   sans restreindre les utilisateurs connectés entre eux — l'application est un
--   usage foyer où le catalogue est partagé et doit rester éditable.
--
-- TABLES VOLONTAIREMENT EXCLUES (déjà couvertes)
--   weight_entries, meal_log           : migrations 011 + 20260609_db_hardening
--   cooked_dishes, cooked_dish_ingredients : migration 002
--   generated_recipes                  : migrations 012 + 20260609_db_hardening
--   nutrition_plan_*                   : migrations 009 + 20260609_db_hardening
--
-- TABLES EXCLUES PAR INCOMPATIBILITÉ DE SCHÉMA
--   pantry_items           : user_id :: integer (FK legacy_users.id ≠ auth.uid())
--   meal_plans             : user_id :: integer (legacy_users.id)
--   user_recipe_interactions : user_id :: integer (legacy_users.id)
--   planned_meals          : pas de user_id direct
--
-- TABLE ABSENTE DU SCHÉMA
--   recipe_utensils : n'existe pas dans la base (vérifié dans schema.md, juin 2026)
--
-- IDEMPOTENCE
--   ALTER TABLE ... ENABLE ROW LEVEL SECURITY est sans effet si déjà actif.
--   Chaque CREATE POLICY est protégé par un DO $$ BEGIN ... END $$ qui vérifie
--   pg_policies avant d'exécuter, évitant l'erreur "policy already exists".
--
-- FORME DE auth.uid()
--   On utilise (SELECT auth.uid()) plutôt que auth.uid() directement pour que
--   l'expression soit évaluée une seule fois par requête et non par ligne
--   (optimisation recommandée dans le hardening 20260609).
-- ============================================================================


-- ============================================================================
-- SECTION A : Tables per-utilisateur
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A1. inventory_lots
-- user_id :: uuid DEFAULT auth.uid() — lots du garde-manger d'un utilisateur
-- Chaque utilisateur ne voit et ne modifie que ses propres lots.
-- ----------------------------------------------------------------------------
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_lots'
      AND policyname = 'inv_lots_select_own'
  ) THEN
    CREATE POLICY inv_lots_select_own ON public.inventory_lots
      FOR SELECT
      -- USING : filtre les lignes lues ; seuls les lots du user courant sont visibles
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_lots'
      AND policyname = 'inv_lots_insert_own'
  ) THEN
    CREATE POLICY inv_lots_insert_own ON public.inventory_lots
      FOR INSERT
      -- WITH CHECK : garantit qu'on ne peut insérer que pour son propre user_id
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_lots'
      AND policyname = 'inv_lots_update_own'
  ) THEN
    CREATE POLICY inv_lots_update_own ON public.inventory_lots
      FOR UPDATE
      USING     ((SELECT auth.uid()) = user_id)  -- filtre source (avant update)
      WITH CHECK ((SELECT auth.uid()) = user_id); -- filtre cible (après update)
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_lots'
      AND policyname = 'inv_lots_delete_own'
  ) THEN
    CREATE POLICY inv_lots_delete_own ON public.inventory_lots
      FOR DELETE
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- A2. user_profiles
-- user_id :: uuid NOT NULL — profil de préférences de l'utilisateur
-- PK : user_id (1 ligne par utilisateur)
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
      AND policyname = 'user_profiles_select_own'
  ) THEN
    CREATE POLICY user_profiles_select_own ON public.user_profiles
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
      AND policyname = 'user_profiles_insert_own'
  ) THEN
    CREATE POLICY user_profiles_insert_own ON public.user_profiles
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
      AND policyname = 'user_profiles_update_own'
  ) THEN
    CREATE POLICY user_profiles_update_own ON public.user_profiles
      FOR UPDATE
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
      AND policyname = 'user_profiles_delete_own'
  ) THEN
    CREATE POLICY user_profiles_delete_own ON public.user_profiles
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- A3. user_health_goals
-- user_id :: uuid NOT NULL — objectifs nutritionnels par utilisateur
-- PK composite : (user_id, person_name) — un utilisateur peut avoir plusieurs
-- personnes (ex. Julien + Zoé). La policy user_id = auth.uid() expose toutes
-- les personnes de l'utilisateur et seulement les siennes.
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_health_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_health_goals'
      AND policyname = 'user_health_goals_select_own'
  ) THEN
    CREATE POLICY user_health_goals_select_own ON public.user_health_goals
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_health_goals'
      AND policyname = 'user_health_goals_insert_own'
  ) THEN
    CREATE POLICY user_health_goals_insert_own ON public.user_health_goals
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_health_goals'
      AND policyname = 'user_health_goals_update_own'
  ) THEN
    CREATE POLICY user_health_goals_update_own ON public.user_health_goals
      FOR UPDATE
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_health_goals'
      AND policyname = 'user_health_goals_delete_own'
  ) THEN
    CREATE POLICY user_health_goals_delete_own ON public.user_health_goals
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- A4. user_allergies
-- user_id :: uuid NOT NULL — allergies/intolérances de l'utilisateur
-- PK composite : (canonical_food_id, user_id)
-- La policy user_id = auth.uid() expose uniquement les allergies de l'utilisateur.
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_allergies'
      AND policyname = 'user_allergies_select_own'
  ) THEN
    CREATE POLICY user_allergies_select_own ON public.user_allergies
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_allergies'
      AND policyname = 'user_allergies_insert_own'
  ) THEN
    CREATE POLICY user_allergies_insert_own ON public.user_allergies
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_allergies'
      AND policyname = 'user_allergies_update_own'
  ) THEN
    CREATE POLICY user_allergies_update_own ON public.user_allergies
      FOR UPDATE
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_allergies'
      AND policyname = 'user_allergies_delete_own'
  ) THEN
    CREATE POLICY user_allergies_delete_own ON public.user_allergies
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- A5. user_diets
-- user_id :: uuid NOT NULL — régimes alimentaires suivis par l'utilisateur
-- PK composite : (diet_id, user_id)
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_diets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_diets'
      AND policyname = 'user_diets_select_own'
  ) THEN
    CREATE POLICY user_diets_select_own ON public.user_diets
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_diets'
      AND policyname = 'user_diets_insert_own'
  ) THEN
    CREATE POLICY user_diets_insert_own ON public.user_diets
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_diets'
      AND policyname = 'user_diets_update_own'
  ) THEN
    CREATE POLICY user_diets_update_own ON public.user_diets
      FOR UPDATE
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_diets'
      AND policyname = 'user_diets_delete_own'
  ) THEN
    CREATE POLICY user_diets_delete_own ON public.user_diets
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;


-- ============================================================================
-- SECTION B : Catalogue partagé — recettes et nomenclature
-- ============================================================================
-- Ces tables n'ont pas de colonne user_id : le catalogue de recettes est partagé
-- entre tous les utilisateurs du foyer. L'objectif est uniquement de bloquer
-- l'accès via la clé anon (accès public non souhaité).
-- Politique : FOR ALL TO authenticated USING (true) WITH CHECK (true)
-- Le role service_role contourne le RLS et garde accès total (seeds, migrations).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- B1. recipes — catalogue de recettes
-- Pas de user_id : catalogue commun, éditable par tout utilisateur connecté.
-- (L'audit §M2 signale l'absence de scoping owner — à traiter en Phase 2
--  par ajout d'un champ created_by optionnel et policy d'écriture resserrée.)
-- ----------------------------------------------------------------------------
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'recipes'
      AND policyname = 'recipes_auth_all'
  ) THEN
    -- USING (true) : tout utilisateur authentifié peut lire/modifier
    CREATE POLICY recipes_auth_all ON public.recipes
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- B2. recipe_ingredients — ingrédients des recettes
-- Liée à recipes (recipe_id FK). Même politique catalogue.
-- ----------------------------------------------------------------------------
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'recipe_ingredients'
      AND policyname = 'recipe_ingredients_auth_all'
  ) THEN
    CREATE POLICY recipe_ingredients_auth_all ON public.recipe_ingredients
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- B3. recipe_steps — étapes des recettes
-- ----------------------------------------------------------------------------
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'recipe_steps'
      AND policyname = 'recipe_steps_auth_all'
  ) THEN
    CREATE POLICY recipe_steps_auth_all ON public.recipe_steps
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ============================================================================
-- SECTION C : Référentiels nutritionnels et alimentaires
-- ============================================================================
-- Tables de référence (CIQUAL, hiérarchie canonique, produits).
-- Même politique que le catalogue : accès complet aux utilisateurs connectés,
-- accès anonyme bloqué.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- C1. canonical_foods — aliments canoniques (nœuds de la hiérarchie)
-- ----------------------------------------------------------------------------
ALTER TABLE public.canonical_foods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'canonical_foods'
      AND policyname = 'canonical_foods_auth_all'
  ) THEN
    CREATE POLICY canonical_foods_auth_all ON public.canonical_foods
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- C2. archetypes — variantes d'un aliment canonique (avec process et DLC)
-- ----------------------------------------------------------------------------
ALTER TABLE public.archetypes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'archetypes'
      AND policyname = 'archetypes_auth_all'
  ) THEN
    CREATE POLICY archetypes_auth_all ON public.archetypes
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- C3. cultivars — variétés botaniques (ex. Granny Smith d'une pomme canonique)
-- ----------------------------------------------------------------------------
ALTER TABLE public.cultivars ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cultivars'
      AND policyname = 'cultivars_auth_all'
  ) THEN
    CREATE POLICY cultivars_auth_all ON public.cultivars
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- C4. products — produits physiques liés aux archétypes (EAN, taille, marque)
-- ----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
      AND policyname = 'products_auth_all'
  ) THEN
    CREATE POLICY products_auth_all ON public.products
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- C5. nutritional_data — données CIQUAL (macros + micros pour 100 g)
-- Note : inclut aussi les lignes créées par l'IA (source_id LIKE 'ai_%').
-- Le problème de contamination IA (audit §I4) sera traité dans le chantier R2.
-- Pour l'instant on sécurise uniquement l'accès anon.
-- ----------------------------------------------------------------------------
ALTER TABLE public.nutritional_data ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'nutritional_data'
      AND policyname = 'nutritional_data_auth_all'
  ) THEN
    CREATE POLICY nutritional_data_auth_all ON public.nutritional_data
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ============================================================================
-- VÉRIFICATION FINALE (informatif, non bloquant)
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'inventory_lots', 'user_profiles', 'user_health_goals',
      'user_allergies', 'user_diets',
      'recipes', 'recipe_ingredients', 'recipe_steps',
      'canonical_foods', 'archetypes', 'cultivars', 'products', 'nutritional_data'
    )
    AND policyname IN (
      'inv_lots_select_own', 'inv_lots_insert_own', 'inv_lots_update_own', 'inv_lots_delete_own',
      'user_profiles_select_own', 'user_profiles_insert_own', 'user_profiles_update_own', 'user_profiles_delete_own',
      'user_health_goals_select_own', 'user_health_goals_insert_own', 'user_health_goals_update_own', 'user_health_goals_delete_own',
      'user_allergies_select_own', 'user_allergies_insert_own', 'user_allergies_update_own', 'user_allergies_delete_own',
      'user_diets_select_own', 'user_diets_insert_own', 'user_diets_update_own', 'user_diets_delete_own',
      'recipes_auth_all', 'recipe_ingredients_auth_all', 'recipe_steps_auth_all',
      'canonical_foods_auth_all', 'archetypes_auth_all', 'cultivars_auth_all',
      'products_auth_all', 'nutritional_data_auth_all'
    );
  RAISE NOTICE 'Migration 20260708_rls_user_tables : % policy/policies actives sur 28 attendues', v_count;
END $$;
