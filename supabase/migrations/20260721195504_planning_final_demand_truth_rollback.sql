-- Rollback manuel Planning V5 — demandes finales.
--
-- À exécuter uniquement avec la version applicative antérieure à V5. Les
-- imports, versions, repas, réservations et journaux historiques restent
-- intacts ; seules les structures additives de V5 sont retirées.

DROP TRIGGER IF EXISTS trg_sync_materialized_production_identity
  ON public.planned_productions;
DROP FUNCTION IF EXISTS public.sync_materialized_production_identity();
DROP FUNCTION IF EXISTS public.planning_schema_compatibility();
DROP FUNCTION IF EXISTS public.publish_canonical_final_demand_plan(jsonb);

DROP POLICY IF EXISTS planned_demands_own ON public.planned_demands;
DROP TABLE IF EXISTS public.planned_demands;

ALTER TABLE public.cooked_dishes
  DROP COLUMN IF EXISTS source_plan_version_id,
  DROP COLUMN IF EXISTS planned_production_id,
  DROP COLUMN IF EXISTS canonical_recipe_execution_id,
  DROP COLUMN IF EXISTS canonical_recipe_code;

ALTER TABLE public.planned_productions
  DROP COLUMN IF EXISTS recipe_execution_id;

ALTER TABLE public.nutrition_plan_shopping_items
  DROP COLUMN IF EXISTS purchase_decision,
  DROP COLUMN IF EXISTS projected_surplus_qty,
  DROP COLUMN IF EXISTS exact_required_qty;

ALTER TABLE public.nutrition_plan_meals
  DROP COLUMN IF EXISTS micronutrients,
  DROP COLUMN IF EXISTS planning_status,
  DROP COLUMN IF EXISTS constraints_snapshot,
  DROP COLUMN IF EXISTS execution_key,
  DROP COLUMN IF EXISTS demand_key;

ALTER TABLE public.meal_plan_slots
  DROP COLUMN IF EXISTS execution_key;
