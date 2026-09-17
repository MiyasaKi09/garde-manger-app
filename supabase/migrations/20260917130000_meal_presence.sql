-- ============================================================================
-- Présence par personne et par créneau — livrable 1.5 de docs/PLAN_FINIR_MYKO.md
-- ============================================================================
-- Une semaine réelle a des absences. Jusqu'ici Myko comptait quatorze assiettes
-- par personne quoi qu'il arrive : deux dîners pris dehors et les courses, les
-- quantités et le total nutritionnel de la semaine étaient faux d'autant.
--
-- CE QUE CETTE TABLE STOCKE : des DÉCLARATIONS, une par (personne, jour, prise).
-- Elle ne stocke pas un emploi du temps, elle n'infère rien d'un historique et
-- elle ne contient aucune règle récurrente — « tous les mardis midi au bureau »
-- n'est pas un fait, c'est une prévision, et le jour où elle est fausse
-- personne ne peut plus distinguer le déclaré du deviné.
--
-- CE QUE L'ABSENCE DE LIGNE VEUT DIRE. Elle ne veut PAS dire « présent » : elle
-- veut dire « rien n'a été déclaré », et la grille reste alors celle d'avant ce
-- livrable — les deux prises principales de chaque jour pour chaque membre.
-- C'est pourquoi le moteur n'agit QUE sur `present = false` : il retire une
-- assiette déclarée absente, il n'en ajoute jamais une que personne n'a
-- demandée. Une ligne `present = true` existe pour qu'on puisse revenir sur une
-- absence sans effacer la trace de la déclaration.
--
-- Migration idempotente (IF NOT EXISTS partout, policies gardées par pg_policies).
-- Rollback : 20260917130000_meal_presence_rollback.sql
--
-- Cette migration est ÉCRITE, jamais appliquée à la main : elle entre au
-- manifeste par `node scripts/db/build-manifest.mjs`, et c'est le pipeline
-- release-production.yml qui l'applique.

CREATE TABLE IF NOT EXISTS public.meal_presence (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL DEFAULT auth.uid()
                                  REFERENCES auth.users(id) ON DELETE CASCADE,
  -- household_members.id est un uuid (20260713134235_closed_loop_planning_v2),
  -- comme partout ailleurs où cette clé est référencée. La présence est
  -- attachée au MEMBRE et non au prénom : deux membres peuvent porter le même
  -- prénom, et un prénom peut changer.
  household_member_id uuid        NOT NULL
                                  REFERENCES public.household_members(id) ON DELETE CASCADE,
  meal_date           date        NOT NULL,
  -- Les quatre prises de la grille, mêmes libellés que
  -- public.nutrition_plan_meals.meal_type et que le moteur
  -- (lib/domain/planning/canonicalPlanPayload.js, memberPlanningRules.js).
  meal_type           text        NOT NULL
                                  CHECK (meal_type IN ('pdj', 'dejeuner', 'collation', 'diner')),
  -- false : la personne ne mange pas cette prise à la maison. C'est la seule
  -- valeur qui change quoi que ce soit au plan.
  present             boolean     NOT NULL,
  -- Texte libre, jamais interprété par le moteur. Aucune nomenclature de motifs
  -- n'est imposée : inventer des catégories qu'on n'a pas relevées reviendrait
  -- à fabriquer de la donnée pour faire joli dans un graphique.
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.meal_presence IS
  'Présence déclarée d''un membre du foyer à une prise donnée (livrable 1.5,
   docs/PLAN_FINIR_MYKO.md §5 phase 1). Une ligne = une déclaration.
   Aucune ligne = rien de déclaré, et la grille reste complète : le moteur
   retire une assiette sur present = false, il n''en ajoute jamais.';

COMMENT ON COLUMN public.meal_presence.present IS
  'false : prise NON prise à la maison — l''assiette, ses quantités de courses
   et sa part nutritionnelle sortent de la semaine.
   true  : présence explicitement confirmée ; le plan est celui d''avant.';

COMMENT ON COLUMN public.meal_presence.note IS
  'Texte libre saisi par le foyer. Jamais lu par le moteur de planning.';

-- Une personne n'a qu'un état par prise : redéclarer met à jour la ligne au
-- lieu d'empiler deux déclarations contradictoires sur le même créneau.
CREATE UNIQUE INDEX IF NOT EXISTS uq_meal_presence_member_slot
  ON public.meal_presence (household_member_id, meal_date, meal_type);

-- La lecture du planning se fait toujours par fenêtre de sept jours.
CREATE INDEX IF NOT EXISTS idx_meal_presence_user_date
  ON public.meal_presence (user_id, meal_date);

ALTER TABLE public.meal_presence ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'meal_presence'
                   AND policyname = 'meal_presence_select_own') THEN
    CREATE POLICY meal_presence_select_own ON public.meal_presence
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'meal_presence'
                   AND policyname = 'meal_presence_insert_own') THEN
    CREATE POLICY meal_presence_insert_own ON public.meal_presence
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'meal_presence'
                   AND policyname = 'meal_presence_update_own') THEN
    CREATE POLICY meal_presence_update_own ON public.meal_presence
      FOR UPDATE USING ((SELECT auth.uid()) = user_id)
              WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'meal_presence'
                   AND policyname = 'meal_presence_delete_own') THEN
    CREATE POLICY meal_presence_delete_own ON public.meal_presence
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

REVOKE ALL ON public.meal_presence FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_presence TO authenticated;
GRANT ALL ON public.meal_presence TO service_role;

-- `updated_at` est écrit par l'appelant, comme pour `member_food_preferences`
-- (20260727120000) : c'est la convention de ce dépôt, et aucun trigger
-- BEFORE UPDATE n'y existe. En ajouter un ici créerait un second mécanisme
-- pour la même chose, qu'il faudrait ensuite tenir à deux endroits.
