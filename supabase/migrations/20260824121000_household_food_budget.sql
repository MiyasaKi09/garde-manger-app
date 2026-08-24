-- ============================================================================
-- Le budget alimentaire du foyer — enveloppe durable et surcharge d'une semaine
-- Contrat : data/prices/CONTRAT.md (v1.0.0)
-- ============================================================================
--
-- CE QUE CETTE MIGRATION POSE
-- ---------------------------
--   public.user_profiles                 + 5 colonnes d'enveloppe
--   public.meal_plan_budget_overrides    la surcharge d'une semaine donnée
--
-- POURQUOI UNE FOURCHETTE ET NON UN PLAFOND SEC
-- ---------------------------------------------
-- L'utilisateur a demandé « une gamme de prix », et ce n'est pas une préférence
-- d'affichage : c'est la seule forme comparable à ce que la couche de prix sait
-- produire. Le CONTRAT §3.2 dit qu'une estimation de panier est un intervalle
-- (central ± la demi-étendue composée en quadrature), jamais un point.
--
-- Comparer un intervalle à un nombre unique force un arbitrage impossible à
-- faire une fois pour toutes :
--   - comparer la borne HAUTE au plafond alerte dès qu'un dépassement est
--     seulement possible, donc presque toujours, donc plus personne ne regarde ;
--   - comparer la valeur CENTRALE ne dit rien tant que le dépassement n'est pas
--     déjà à moitié acquis ;
--   - et surtout, chaque appelant trancherait dans son coin, ce qui donnerait
--     deux réponses différentes à la même question dans deux écrans.
--
-- Deux bornes rendent la comparaison décidable et honnête, en trois états qui
-- se disent en français sans arrière-pensée :
--     haut_panier < budget_low     → « en dessous de votre enveloppe »
--     les intervalles se chevauchent → « dans votre enveloppe »
--     bas_panier > budget_high     → « au-dessus de votre enveloppe »
-- Le troisième cas est le seul qui affirme un dépassement, et il l'affirme
-- quand même la borne la plus favorable dépasse — c'est-à-dire quand c'est vrai.
--
-- La borne basse n'est pas décorative non plus : un panier nettement sous
-- l'enveloppe n'est pas une bonne nouvelle en soi, c'est souvent le signe d'un
-- plan sous-approvisionné ou d'une couverture de prix trop partielle pour
-- signifier quoi que ce soit.
--
-- Le cas « je n'ai qu'un plafond » reste exprimable : budget_low à NULL. On ne
-- fabrique pas une borne basse par symétrie — ce serait inventer un chiffre que
-- personne n'a donné, exactement ce que le §0 proscrit côté prix.
--
-- POURQUOI L'ENVELOPPE EST DATÉE
-- ------------------------------
-- `food_budget_set_on`. Une enveloppe vieillit comme un prix vieillit : « 400 €
-- par mois » fixé il y a deux ans ne dit plus la même chose après deux ans
-- d'inflation alimentaire. On ne la réindexe pas — ce serait décider à la place
-- de quelqu'un ce qu'il peut dépenser — mais on garde de quoi lui demander si
-- elle est encore la sienne.
--
-- POURQUOI LA SURCHARGE EST CLÉE SUR LA SEMAINE ET NON SUR LA VERSION DE PLAN
-- ---------------------------------------------------------------------------
-- `meal_plan_versions` est republié à chaque replanification. Une surcharge
-- attachée à une version disparaîtrait au premier arbitrage — or « cette
-- semaine-là, on reçoit du monde, l'enveloppe est de 120 € » est une décision
-- du foyer, pas une propriété du plan. La clé est donc (user_id, week_start) ;
-- `plan_version_id` reste en colonne, informatif, pour savoir dans quel plan la
-- décision a été prise, et il se met à NULL si ce plan disparaît.
--
-- IDEMPOTENCE : IF NOT EXISTS, contraintes et policies gardées.
-- ROLLBACK    : 20260824121000_household_food_budget_rollback.sql
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- 1. public.user_profiles — la table, puis l'enveloppe
-- ════════════════════════════════════════════════════════════════════════════
-- user_profiles a été créée au dashboard Supabase et n'a jamais été versionnée
-- (c'est le constat de l'audit §C1, dont 20260708_rls_user_tables a codifié les
-- policies sans jamais poser la table). On la déclare ici IF NOT EXISTS pour que
-- cette migration soit auto-portante sur une base neuve : en production c'est un
-- no-op strict, et sur une base vierge c'est la différence entre une migration
-- qui s'applique et une migration qui échoue sur « relation inexistante ».

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  novelty_preference numeric,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Même nom et même expression que la policy relevée en production le 08/07/2026
-- (20260708_rls_user_tables) : sur une base où la table préexiste, ce bloc ne
-- fait rien ; sur une base neuve, il évite de créer une table de profil sans RLS.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
      AND policyname = 'users_own_profile'
  ) THEN
    CREATE POLICY users_own_profile ON public.user_profiles
      FOR ALL
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS food_budget_low      numeric(10,2),
  ADD COLUMN IF NOT EXISTS food_budget_high     numeric(10,2),
  ADD COLUMN IF NOT EXISTS food_budget_currency text,
  ADD COLUMN IF NOT EXISTS food_budget_period   text,
  ADD COLUMN IF NOT EXISTS food_budget_set_on   date;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_food_budget_check'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_food_budget_check CHECK (
        -- Bornes positives. Zéro n'est pas une enveloppe : c'est soit une
        -- absence (NULL), soit une déclaration qu'on ne mange pas.
        (food_budget_low  IS NULL OR food_budget_low  > 0)
        AND (food_budget_high IS NULL OR food_budget_high > 0)
        AND (food_budget_low IS NULL OR food_budget_high IS NULL
             OR food_budget_low <= food_budget_high)

        -- Une enveloppe sans périodicité ne veut rien dire (400 € par jour et
        -- par mois, ce n'est pas la même vie), et une périodicité sans montant
        -- est une coquille vide. Les deux vont ensemble ou aucun des deux.
        AND ((food_budget_low IS NULL AND food_budget_high IS NULL)
             = (food_budget_period IS NULL))

        -- Et un montant sans devise est un nombre qu'on ne peut pas comparer à
        -- une estimation en euros.
        AND ((food_budget_low IS NULL AND food_budget_high IS NULL)
             = (food_budget_currency IS NULL))

        AND (food_budget_period IS NULL OR food_budget_period IN ('week', 'month'))
        AND (food_budget_currency IS NULL OR food_budget_currency ~ '^[A-Z]{3}$')
      );
  END IF;
END $$;

COMMENT ON COLUMN public.user_profiles.food_budget_low IS
  'Borne BASSE de l''enveloppe alimentaire, dans food_budget_currency et pour
   food_budget_period. NULL quand le foyer n''a exprimé qu''un plafond : on ne
   fabrique pas une borne basse par symétrie.';
COMMENT ON COLUMN public.user_profiles.food_budget_high IS
  'Borne HAUTE de l''enveloppe. Un dépassement n''est affirmé que si la borne
   BASSE de l''estimation la dépasse — une estimation est un intervalle, et
   affirmer un dépassement possible reviendrait à alerter en permanence.';
COMMENT ON COLUMN public.user_profiles.food_budget_period IS
  'week | month. La périodicité de l''enveloppe, pas celle du plan : un plan
   hebdomadaire se compare à une enveloppe mensuelle au prorata, et c''est à la
   couche de calcul de le faire une fois pour toutes.';
COMMENT ON COLUMN public.user_profiles.food_budget_set_on IS
  'Date à laquelle l''enveloppe a été fixée. Elle vieillit comme un prix
   vieillit ; on ne la réindexe JAMAIS — décider à la place de quelqu''un ce
   qu''il peut dépenser n''est pas un calcul, c''est une substitution.';


-- ════════════════════════════════════════════════════════════════════════════
-- 2. public.meal_plan_budget_overrides — l'enveloppe d'une semaine donnée
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.meal_plan_budget_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL DEFAULT auth.uid()
                       REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lundi ISO de la semaine concernée. Normalisé par contrainte : sans cela,
  -- « la semaine du 3 » et « la semaine du 5 » désigneraient la même semaine
  -- sous deux clés, et l'unicité ne protégerait plus rien.
  week_start      date NOT NULL,

  -- Informatif : dans quel plan la décision a été prise. Volontairement PAS la
  -- clé — republier le plan ne doit pas effacer une décision du foyer.
  plan_version_id uuid,

  budget_low      numeric(10,2),
  budget_high     numeric(10,2),
  currency        text NOT NULL DEFAULT 'EUR',
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT mpbo_week_is_monday CHECK (EXTRACT(ISODOW FROM week_start) = 1),
  CONSTRAINT mpbo_currency_check CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT mpbo_bounds_check CHECK (
    (budget_low  IS NULL OR budget_low  > 0)
    AND (budget_high IS NULL OR budget_high > 0)
    AND (budget_low IS NULL OR budget_high IS NULL OR budget_low <= budget_high)
    -- Une surcharge qui ne surcharge rien n'a pas de raison d'exister : elle
    -- serait indistinguable de l'absence de surcharge, tout en masquant
    -- l'enveloppe durable.
    AND (budget_low IS NOT NULL OR budget_high IS NOT NULL)
  ),
  CONSTRAINT mpbo_unique_week UNIQUE (user_id, week_start)
);

COMMENT ON TABLE public.meal_plan_budget_overrides IS
  'Enveloppe alimentaire d''une semaine donnée, qui prend le pas sur
   user_profiles.food_budget_* pour cette semaine-là uniquement. Clée sur la
   SEMAINE et non sur la version de plan : republier un plan ne doit pas effacer
   une décision budgétaire du foyer.';
COMMENT ON COLUMN public.meal_plan_budget_overrides.plan_version_id IS
  'Plan dans lequel la surcharge a été décidée. Contexte, pas clé : mis à NULL
   si ce plan disparaît, sans que la surcharge disparaisse avec lui.';

-- La FK vers meal_plan_versions n'est posée que si la table existe : le lien est
-- informatif, et l'absence du modèle de plan ne doit pas empêcher un foyer de
-- fixer son budget.
DO $$ BEGIN
  IF to_regclass('public.meal_plan_versions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'mpbo_plan_version_fk'
         AND conrelid = 'public.meal_plan_budget_overrides'::regclass
     ) THEN
    ALTER TABLE public.meal_plan_budget_overrides
      ADD CONSTRAINT mpbo_plan_version_fk
      FOREIGN KEY (plan_version_id) REFERENCES public.meal_plan_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mpbo_user_week
  ON public.meal_plan_budget_overrides (user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_mpbo_plan_version
  ON public.meal_plan_budget_overrides (plan_version_id)
  WHERE plan_version_id IS NOT NULL;


-- ── RLS : donnée personnelle, propriétaire seul ─────────────────────────────
-- Ce que quelqu'un s'autorise à dépenser en dit autant sur lui que ce qu'il
-- dépense. Même régime que user_profiles : propriétaire seul, en lecture comme
-- en écriture, et rien pour anon.

ALTER TABLE public.meal_plan_budget_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mpbo_owner_all ON public.meal_plan_budget_overrides;
CREATE POLICY mpbo_owner_all ON public.meal_plan_budget_overrides
  FOR ALL TO authenticated
  USING     ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.meal_plan_budget_overrides FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan_budget_overrides TO authenticated;
