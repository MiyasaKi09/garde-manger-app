-- Rollback de 20260824121000_household_food_budget.sql
--
-- ATTENTION : ce rollback DÉTRUIT des données saisies par l'utilisateur — son
-- enveloppe alimentaire et ses surcharges hebdomadaires. Elles ne se
-- reconstituent depuis aucun artefact ; seule une sauvegarde les ramène.
--
-- public.user_profiles n'est PAS supprimée : cette migration ne fait que la
-- déclarer IF NOT EXISTS pour être auto-portante sur une base neuve, elle ne
-- l'a pas créée en production. La supprimer emporterait novelty_preference et
-- toutes les préférences du foyer.

BEGIN;

DROP TABLE IF EXISTS public.meal_plan_budget_overrides;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_food_budget_check;

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS food_budget_low,
  DROP COLUMN IF EXISTS food_budget_high,
  DROP COLUMN IF EXISTS food_budget_currency,
  DROP COLUMN IF EXISTS food_budget_period,
  DROP COLUMN IF EXISTS food_budget_set_on;

COMMIT;
