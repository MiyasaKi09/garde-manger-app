-- ============================================================================
-- L'écart entre le temps ANNONCÉ et le temps CONSTATÉ — livrable 2.4 de
-- docs/PLAN_FINIR_MYKO.md (§5, phase 2)
-- ============================================================================
-- Le critère du livrable a deux moitiés. La première — « le chiffre affiché est
-- la somme » — est du code : lib/domain/planning/cookingTime.js additionne des
-- minutes déclarées et refuse de rendre un total quand une déclaration manque.
-- La seconde — « l'écart entre annoncé et constaté est consigné après chaque
-- session réelle » — demande une table, parce qu'un temps constaté ne se
-- calcule pas : il se chronomètre, et quelqu'un doit le dire.
--
-- CE QUE CETTE TABLE STOCKE : une ligne par session de cuisine réellement
-- vécue, avec DEUX nombres — ce qui avait été annoncé à l'écran ce jour-là, et
-- ce que le foyer a constaté. L'écart n'est PAS stocké : c'est une
-- soustraction, et un écart rangé à côté de ses opérandes finit par ne plus
-- correspondre à aucun des deux. C'est déjà la doctrine du dépôt pour les
-- fourchettes de prix (data/prices/CONTRAT.md).
--
-- POURQUOI L'ANNONCÉ EST RECOPIÉ ICI plutôt que relu du plan. Parce que c'est
-- l'annonce FAITE CE JOUR-LÀ qui est en cause. Une régénération de la semaine,
-- un plat remplacé, une tâche cochée changent le plan ; relire l'annonce dans
-- le plan d'aujourd'hui pour la comparer à un chronomètre d'hier compare deux
-- semaines différentes et ne mesure plus rien.
--
-- CE QUE L'ABSENCE DE LIGNE VEUT DIRE : la session n'a pas été chronométrée.
-- Pas qu'elle a tenu son annonce. L'écran affiche alors l'annonce seule, avec
-- sa définition, et propose de saisir le temps réel — il n'affiche jamais un
-- écart de zéro qui n'a été mesuré par personne.
--
-- Migration idempotente (IF NOT EXISTS partout, policies gardées par
-- pg_policies). Rollback : 20260918120000_temps_session_constate_rollback.sql
--
-- Cette migration est ÉCRITE, jamais appliquée à la main : elle entre au
-- manifeste par `node scripts/db/build-manifest.mjs`, et c'est le pipeline
-- release-production.yml qui l'applique.

CREATE TABLE IF NOT EXISTS public.cooking_session_times (
  id                        uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   uuid        NOT NULL DEFAULT auth.uid()
                                        REFERENCES auth.users(id) ON DELETE CASCADE,
  -- La version de plan qui a produit l'annonce. Obligatoire : une session sans
  -- plan n'a rien annoncé, il n'y a donc pas d'écart à mesurer.
  plan_version_id           uuid        NOT NULL
                                        REFERENCES public.meal_plan_versions(id) ON DELETE CASCADE,
  session_date              date        NOT NULL,
  -- Les trois fenêtres de session du moteur (lib/domain/planning/cookingSessions.js,
  -- `sessionWindowForHour`). Mêmes libellés, sans quoi l'écran et le moteur ne
  -- parleraient pas de la même session.
  session_window            text        NOT NULL
                                        CHECK (session_window IN ('matin', 'apres_midi', 'soir')),
  -- Le chiffre affiché au moment de la session, en minutes : la somme des
  -- durées de ses tâches de cuisine plus le portionnage des repas couverts.
  announced_active_minutes  integer     NOT NULL CHECK (announced_active_minutes >= 0),
  -- Ce que le foyer a constaté, en minutes. Une session qui a duré six heures
  -- se déclare telle quelle : aucune borne haute n'est posée, et c'est
  -- volontaire — plafonner la saisie effacerait précisément le cas qu'on veut
  -- voir (« 2 h annoncées, j'ai chronométré, 5 h 36 »).
  observed_active_minutes   integer     NOT NULL CHECK (observed_active_minutes >= 0),
  -- Texte libre, jamais interprété. Aucune nomenclature de motifs n'est
  -- imposée : inventer des catégories qu'on n'a pas relevées reviendrait à
  -- fabriquer de la donnée pour faire joli dans un graphique.
  note                      text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cooking_session_times IS
  'Temps annoncé et temps constaté d''une session de cuisine réellement vécue
   (livrable 2.4, docs/PLAN_FINIR_MYKO.md §5 phase 2). Une ligne = une session
   chronométrée. L''écart se calcule (constaté − annoncé), il n''est pas stocké.
   Aucune ligne = session non chronométrée, jamais « écart nul ».';

COMMENT ON COLUMN public.cooking_session_times.announced_active_minutes IS
  'Le chiffre AFFICHÉ ce jour-là : somme des durées des tâches de cuisine de la
   session plus cinq minutes de portionnage par repas couvert. Recopié au moment
   de la saisie — une régénération du plan ne doit pas réécrire l''annonce
   contre laquelle le foyer s''est chronométré.';

-- Une session n'a qu'un temps constaté : re-déclarer corrige la ligne au lieu
-- d'empiler deux chronomètres contradictoires sur la même session.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cooking_session_times_session
  ON public.cooking_session_times (plan_version_id, session_date, session_window);

-- La lecture se fait toujours par fenêtre de sept jours, pour un utilisateur.
CREATE INDEX IF NOT EXISTS idx_cooking_session_times_user_date
  ON public.cooking_session_times (user_id, session_date);

ALTER TABLE public.cooking_session_times ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'cooking_session_times'
                   AND policyname = 'cooking_session_times_select_own') THEN
    CREATE POLICY cooking_session_times_select_own ON public.cooking_session_times
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'cooking_session_times'
                   AND policyname = 'cooking_session_times_insert_own') THEN
    CREATE POLICY cooking_session_times_insert_own ON public.cooking_session_times
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'cooking_session_times'
                   AND policyname = 'cooking_session_times_update_own') THEN
    CREATE POLICY cooking_session_times_update_own ON public.cooking_session_times
      FOR UPDATE USING ((SELECT auth.uid()) = user_id)
              WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'cooking_session_times'
                   AND policyname = 'cooking_session_times_delete_own') THEN
    CREATE POLICY cooking_session_times_delete_own ON public.cooking_session_times
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

REVOKE ALL ON public.cooking_session_times FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cooking_session_times TO authenticated;
GRANT ALL ON public.cooking_session_times TO service_role;

-- `updated_at` est écrit par l'appelant, comme pour `meal_presence`
-- (20260917130000) et `member_food_preferences` (20260727120000) : c'est la
-- convention de ce dépôt, et aucun trigger BEFORE UPDATE n'y existe. En ajouter
-- un ici créerait un second mécanisme pour la même chose, qu'il faudrait
-- ensuite tenir à deux endroits.
