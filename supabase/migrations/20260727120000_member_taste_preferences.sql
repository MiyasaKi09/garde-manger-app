-- ============================================================================
-- Lot 2 du plan de refonte du planning — modèle complet des goûts (§5, §15)
-- ============================================================================
-- Jusqu'ici, Myko ne connaissait des goûts que leur versant négatif, et au
-- niveau du COMPTE : user_allergies, user_diets, user_food_bans (ban/dislike).
-- Le plan demande un modèle par MEMBRE, à sept niveaux d'appréciation, couvrant
-- bien plus que les ingrédients — cuisines, techniques, textures, profils
-- aromatiques, température de service, tolérance aux restes.
--
-- Deux tables :
--   member_food_preferences : le profil de goûts, alimenté par le questionnaire
--                             puis enrichi par les retours après consommation ;
--   meal_feedback           : ces retours eux-mêmes (§15).
--
-- Migration idempotente. Rollback : 20260727120000_member_taste_preferences_rollback.sql

-- ── 1. member_food_preferences ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.member_food_preferences (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL DEFAULT auth.uid()
                                  REFERENCES auth.users(id) ON DELETE CASCADE,
  -- household_members.id est un uuid (20260713134235_closed_loop_planning_v2),
  -- comme partout ailleurs où cette clé est référencée.
  household_member_id uuid        NOT NULL
                                  REFERENCES public.household_members(id) ON DELETE CASCADE,
  -- Ce sur quoi porte le goût. Les valeurs miroitent les dimensions de
  -- diversité du moteur (lib/domain/planning/repetitionRules.js) pour qu'une
  -- préférence puisse être rapprochée d'une recette sans table de traduction.
  subject_type        text        NOT NULL
                                  CHECK (subject_type IN (
                                    'ingredient', 'recipe', 'cuisine', 'technique',
                                    'texture', 'sensory_profile', 'temperature',
                                    'richness', 'vegetarian', 'leftovers'
                                  )),
  -- Forme NORMALISÉE du sujet (pliage des accents, minuscules, espaces
  -- simples) : même convention que normalizeFoodForm côté application.
  subject_value       text        NOT NULL,
  -- Libellé affichable, tel que saisi par la personne.
  subject_label       text,
  -- Les sept niveaux du plan (§5).
  appreciation        text        NOT NULL
                                  CHECK (appreciation IN (
                                    'forbidden', 'disliked', 'avoided', 'neutral',
                                    'liked', 'favorite', 'to_discover'
                                  )),
  -- Contrainte STRICTE (jamais servi, quelles que soient les circonstances) ou
  -- SOUPLE (le moteur pondère). Une allergie est stricte ; « plutôt évité » ne
  -- l'est pas.
  strict              boolean     NOT NULL DEFAULT false,
  -- Fréquence de retour souhaitée, en jours, quand la personne l'a exprimée
  -- (« ce plat peut revenir chaque semaine » vs « une fois par mois »).
  repeat_delay_days   integer     CHECK (repeat_delay_days IS NULL OR repeat_delay_days BETWEEN 0 AND 365),
  source              text        NOT NULL DEFAULT 'questionnaire'
                                  CHECK (source IN ('questionnaire', 'feedback', 'import', 'inferred')),
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.member_food_preferences IS
  'Profil de goûts par membre du foyer (plan de refonte §5, §15).
   Les réponses sont INDIVIDUELLES ; le compromis de foyer est calculé par
   lib/domain/planning/tastePreferences.js, jamais stocké — il change dès qu''un
   membre modifie son profil.';

COMMENT ON COLUMN public.member_food_preferences.strict IS
  'true  : contrainte dure — le moteur écarte toute recette concernée.
   false : contrainte souple — le moteur pondère le score sans jamais interdire.';

COMMENT ON COLUMN public.member_food_preferences.repeat_delay_days IS
  'Délai de retour souhaité pour ce sujet, en jours. Prend le pas sur le délai
   par défaut des règles de répétition quand il est renseigné.';

-- Un membre n'a qu'un avis par sujet : une nouvelle réponse met à jour
-- l'ancienne au lieu d'empiler des avis contradictoires.
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_food_preferences_subject
  ON public.member_food_preferences (household_member_id, subject_type, subject_value);

CREATE INDEX IF NOT EXISTS idx_member_food_preferences_user
  ON public.member_food_preferences (user_id);

ALTER TABLE public.member_food_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'member_food_preferences'
                   AND policyname = 'mfp_select_own') THEN
    CREATE POLICY mfp_select_own ON public.member_food_preferences
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'member_food_preferences'
                   AND policyname = 'mfp_insert_own') THEN
    CREATE POLICY mfp_insert_own ON public.member_food_preferences
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'member_food_preferences'
                   AND policyname = 'mfp_update_own') THEN
    CREATE POLICY mfp_update_own ON public.member_food_preferences
      FOR UPDATE USING ((SELECT auth.uid()) = user_id)
              WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'member_food_preferences'
                   AND policyname = 'mfp_delete_own') THEN
    CREATE POLICY mfp_delete_own ON public.member_food_preferences
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ── 2. meal_feedback ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meal_feedback (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL DEFAULT auth.uid()
                                  REFERENCES auth.users(id) ON DELETE CASCADE,
  household_member_id uuid        REFERENCES public.household_members(id) ON DELETE CASCADE,
  meal_date           date        NOT NULL,
  meal_type           text        NOT NULL
                                  CHECK (meal_type IN ('pdj', 'dejeuner', 'collation', 'diner')),
  canonical_recipe_code text,
  -- Les quatre retours proposés après une découverte (§6).
  appreciation        text        NOT NULL
                                  CHECK (appreciation IN ('loved', 'acceptable', 'to_adjust', 'never_again')),
  -- Les axes de retour du plan (§15). NULL = non renseigné, jamais « faux ».
  portion_fit         text        CHECK (portion_fit IS NULL OR portion_fit IN ('too_small', 'right', 'too_large')),
  too_repetitive      boolean,
  too_heavy           boolean,
  too_light           boolean,
  side_dish_fit       boolean,
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.meal_feedback IS
  'Retour après consommation (plan de refonte §6, §15). Alimente progressivement
   member_food_preferences : « ne plus proposer » y écrit une aversion, « aimé »
   un favori.';

CREATE INDEX IF NOT EXISTS idx_meal_feedback_user_date
  ON public.meal_feedback (user_id, meal_date DESC);

CREATE INDEX IF NOT EXISTS idx_meal_feedback_recipe
  ON public.meal_feedback (canonical_recipe_code)
  WHERE canonical_recipe_code IS NOT NULL;

ALTER TABLE public.meal_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'meal_feedback'
                   AND policyname = 'mfb_select_own') THEN
    CREATE POLICY mfb_select_own ON public.meal_feedback
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'meal_feedback'
                   AND policyname = 'mfb_insert_own') THEN
    CREATE POLICY mfb_insert_own ON public.meal_feedback
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'meal_feedback'
                   AND policyname = 'mfb_delete_own') THEN
    CREATE POLICY mfb_delete_own ON public.meal_feedback
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;
