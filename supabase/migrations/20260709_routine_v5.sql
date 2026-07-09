-- ============================================================================
-- Migration: 20260709_routine_v5.sql
-- Routine v5 — Colonnes FK repas↔fiche, heartbeat régénération, JSON batch,
--              table user_food_bans (source unique des interdits alimentaires)
-- ============================================================================
--
-- CONTEXTE
-- --------
-- Volet B1 du plan d'audit juillet 2026. Corrige quatre faiblesses structurelles
-- du système de routines identifiées à l'audit :
--
-- 1. nutrition_plan_meals : aucun FK repas↔fiche générée (matching fragile par 2 mots).
--    Ajout generated_recipe_id (FK direct vers generated_recipes), is_leftover (flag
--    restes) et cooked_dish_id (FK vers cooked_dishes pour les repas issus de restes).
--
-- 2. plan_regen_requests : pas de write-back d'erreur ni de heartbeat.
--    Ajout error_message (texte complet de l'erreur, affiché par le poller UI)
--    et updated_at (rafraîchi à chaque checkpoint par la routine → détecte les
--    requêtes bloquées en statut 'processing').
--
-- 3. nutrition_plan_batch_recipes : ingrédients stockés en texte ·-séparé (parsing
--    fragile par regex côté UI). Ajout ingredients_json (jsonb structuré) — le champ
--    texte 'ingredients' reste en fallback pour les imports antérieurs.
--
-- 4. Interdits alimentaires hardcodés dans 4 copies des prompts IA.
--    Nouvelle table user_food_bans (kind='ban' | 'dislike') + seed des interdits
--    actuels de l'utilisateur existant. lib/aiContextBuilder.js (fetchDietaryConstraints)
--    et lib/aiSystemPrompts.js (buildConstraintsBlock) consomment cette table.
--
-- IDEMPOTENCE
-- -----------
-- ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS, DO-block policies.
-- Aucun DROP. Safe à rejouer même si une partie a déjà été appliquée.
--
-- ROLLBACK
-- --------
-- Voir supabase/migrations/20260709_routine_v5_rollback.sql
-- ============================================================================

-- ============================================================================
-- 1. nutrition_plan_meals — colonnes FK et flag restes
-- ============================================================================

ALTER TABLE public.nutrition_plan_meals
  ADD COLUMN IF NOT EXISTS generated_recipe_id bigint
    REFERENCES public.generated_recipes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_leftover         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cooked_dish_id      bigint
    REFERENCES public.cooked_dishes(id) ON DELETE SET NULL;

-- Index partiel sur generated_recipe_id : parcourue fréquemment par
-- openMealRecipe.js pour la lookup directe (remplace le matching fuzzy).
CREATE INDEX IF NOT EXISTS idx_npm_generated_recipe_id
  ON public.nutrition_plan_meals (generated_recipe_id)
  WHERE generated_recipe_id IS NOT NULL;

COMMENT ON COLUMN public.nutrition_plan_meals.generated_recipe_id IS
  'FK directe vers la fiche recette générée (generated_recipes.id).
   Remplace le matching fuzzy par ≥2 mots communs (B4 du plan). NULL = repas sans fiche ou import xlsx.';

COMMENT ON COLUMN public.nutrition_plan_meals.is_leftover IS
  'TRUE si ce créneau est couvert par des restes d''un plat cuisiné.
   Complète le fallback préfixe "Restes — " (B4).';

COMMENT ON COLUMN public.nutrition_plan_meals.cooked_dish_id IS
  'FK vers le plat cuisiné (cooked_dishes.id) dont proviennent les restes.
   NULL si le repas n''est pas un reste ou si la fiche cooked_dish n''est pas disponible.';

-- ============================================================================
-- 2. plan_regen_requests — heartbeat et write-back d'erreur
-- ============================================================================

ALTER TABLE public.plan_regen_requests
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

COMMENT ON COLUMN public.plan_regen_requests.error_message IS
  'Message d''erreur écrit par la routine en cas de status=''error''.
   Affiché par le poller UI (app/planning/page.js) au lieu du faux done après 6 min.';

COMMENT ON COLUMN public.plan_regen_requests.updated_at IS
  'Horodatage du dernier checkpoint de la routine (heartbeat).
   La routine le rafraîchit à chaque étape majeure via UPDATE plan_regen_requests
   SET updated_at = now() WHERE id = <request_id>.
   Si > 6 min sans update et status = ''processing'' → requête bloquée.';

-- ============================================================================
-- 3. nutrition_plan_batch_recipes — JSON structuré des ingrédients
-- ============================================================================

ALTER TABLE public.nutrition_plan_batch_recipes
  ADD COLUMN IF NOT EXISTS ingredients_json jsonb;

COMMENT ON COLUMN public.nutrition_plan_batch_recipes.ingredients_json IS
  'Ingrédients structurés au format [{name, quantity, unit}], écrits par la routine v5.
   Le champ texte "ingredients" (·-séparé) reste en fallback pour les imports et
   générations antérieurs à cette migration (B4 — app/planning/[importId]/batch/page.js
   lit ingredients_json d''abord, fallback split ·).';

-- ============================================================================
-- 4. user_food_bans — source unique des interdits et préférences alimentaires
-- ============================================================================
-- Remplace les listes hardcodées dans lib/aiSystemPrompts.js (4 copies).
-- La table est lue par fetchDietaryConstraints (lib/aiContextBuilder.js)
-- et buildConstraintsBlock (lib/aiSystemPrompts.js).

CREATE TABLE IF NOT EXISTS public.user_food_bans (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        DEFAULT auth.uid()
                                REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  -- Lien optionnel vers canonical_foods (CIQUAL) pour les doublons et nutritions
  canonical_food_id bigint      REFERENCES public.canonical_foods(id) ON DELETE SET NULL,
  kind              text        NOT NULL DEFAULT 'ban'
                                CHECK (kind IN ('ban', 'dislike')),
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_food_bans IS
  'Interdits stricts (kind=''ban'') et préférences négatives (kind=''dislike'') par utilisateur.
   Source unique de vérité — remplace les listes hardcodées dans les prompts IA.
   Consommé par lib/aiContextBuilder.fetchDietaryConstraints (via Promise.all fail-soft)
   et lib/aiSystemPrompts.buildConstraintsBlock pour générer les sections INTERDITS
   et CIBLES NUTRITIONNELLES dynamiquement.';

COMMENT ON COLUMN public.user_food_bans.kind IS
  '''ban''     : aliment strictement interdit (allergie, aversion absolue, règle diét.).
                 Injecté dans CONTRAINTES ALIMENTAIRES STRICTES du contexte IA.
   ''dislike'' : aliment à éviter en priorité mais non interdit en absolu.
                 Injecté comme "À éviter (préférence)" dans le contexte IA.';

COMMENT ON COLUMN public.user_food_bans.canonical_food_id IS
  'Lien optionnel vers canonical_foods pour les correspondances CIQUAL.
   NULL acceptable — le champ name suffit pour la vérification textuelle dans les prompts.';

-- Index pour fetchDietaryConstraints (.eq(''user_id'', userId))
CREATE INDEX IF NOT EXISTS idx_user_food_bans_user_id
  ON public.user_food_bans (user_id);

-- ── RLS — pattern DO-block idempotent (même que 20260708_waste_prevention_log.sql) ──

ALTER TABLE public.user_food_bans ENABLE ROW LEVEL SECURITY;

-- SELECT : l'utilisateur voit uniquement ses propres entrées
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_food_bans'
      AND policyname = 'ufb_select_own'
  ) THEN
    CREATE POLICY ufb_select_own ON public.user_food_bans
      FOR SELECT
      -- USING : l'utilisateur authentifié peut lire ses propres lignes
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- INSERT : l'utilisateur ne peut insérer que pour lui-même
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_food_bans'
      AND policyname = 'ufb_insert_own'
  ) THEN
    CREATE POLICY ufb_insert_own ON public.user_food_bans
      FOR INSERT
      -- WITH CHECK : garantit que user_id correspond au demandeur
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- UPDATE : lecture et écriture limitées à l'utilisateur propriétaire
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_food_bans'
      AND policyname = 'ufb_update_own'
  ) THEN
    CREATE POLICY ufb_update_own ON public.user_food_bans
      FOR UPDATE
      -- USING : ligne déjà visible avant l'update
      USING     ((SELECT auth.uid()) = user_id)
      -- WITH CHECK : la ligne résultante appartient toujours à l'utilisateur
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- DELETE : suppression limitée aux propres lignes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_food_bans'
      AND policyname = 'ufb_delete_own'
  ) THEN
    CREATE POLICY ufb_delete_own ON public.user_food_bans
      FOR DELETE
      -- USING : seule la suppression de ses propres lignes est autorisée
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================================================
-- 5. Seed — interdits actuels de l'utilisateur existant (idempotent)
-- ============================================================================
-- Source : listes hardcodées dans lib/aiSystemPrompts.js (supprimées en B2).
-- Les "fruits de mer" sont une catégorie générique ; la routine et les prompts
-- filtrent par nom textuel. Des entrées plus granulaires (crevettes, moules…)
-- peuvent être ajoutées plus tard via l'UI ou une migration complémentaire.

INSERT INTO public.user_food_bans (user_id, name, kind)
SELECT '9055926b-ed29-49f1-96b8-fc717973b333', v.name, 'ban'
FROM (VALUES
  ('thon'),
  ('panais'),
  ('épinards'),
  ('céleri'),
  ('whey'),
  ('veau'),
  ('agneau'),
  ('fruits de mer')
) v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_food_bans b
  WHERE  b.user_id = '9055926b-ed29-49f1-96b8-fc717973b333'
    AND  b.name    = v.name
);

-- ============================================================================
-- Vérification finale
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_food_bans'
  ) THEN
    RAISE NOTICE 'Migration 20260709_routine_v5 : user_food_bans créée avec RLS activé (4 policies).';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nutrition_plan_meals'
      AND column_name = 'generated_recipe_id'
  ) THEN
    RAISE NOTICE 'Migration 20260709_routine_v5 : nutrition_plan_meals.generated_recipe_id OK.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plan_regen_requests'
      AND column_name = 'updated_at'
  ) THEN
    RAISE NOTICE 'Migration 20260709_routine_v5 : plan_regen_requests.updated_at OK.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nutrition_plan_batch_recipes'
      AND column_name = 'ingredients_json'
  ) THEN
    RAISE NOTICE 'Migration 20260709_routine_v5 : nutrition_plan_batch_recipes.ingredients_json OK.';
  END IF;
END $$;
