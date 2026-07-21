-- Planning V5 — index couvrant chaque nouvelle clé étrangère utilisée par les
-- suppressions, la matérialisation des plats et les lectures par utilisateur.

CREATE INDEX IF NOT EXISTS idx_planned_demands_slot_id
  ON public.planned_demands (slot_id);

CREATE INDEX IF NOT EXISTS idx_planned_demands_user_id
  ON public.planned_demands (user_id);

CREATE INDEX IF NOT EXISTS idx_planned_productions_recipe_execution_id
  ON public.planned_productions (recipe_execution_id)
  WHERE recipe_execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cooked_dishes_canonical_recipe_execution_id
  ON public.cooked_dishes (canonical_recipe_execution_id)
  WHERE canonical_recipe_execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cooked_dishes_planned_production_id
  ON public.cooked_dishes (planned_production_id)
  WHERE planned_production_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cooked_dishes_source_plan_version_id
  ON public.cooked_dishes (source_plan_version_id)
  WHERE source_plan_version_id IS NOT NULL;
