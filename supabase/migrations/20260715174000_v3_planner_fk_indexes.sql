-- Cover the foreign keys exercised by recipe publication and planner reads.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_recipe_executions_recipe_version_id
  ON culinary.recipe_executions (recipe_version_id);

CREATE INDEX IF NOT EXISTS idx_recipe_planner_rule_sets_source_dataset_id
  ON culinary.recipe_planner_rule_sets (source_dataset_id)
  WHERE source_dataset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_versions_source_dataset_id
  ON culinary.recipe_versions (source_dataset_id)
  WHERE source_dataset_id IS NOT NULL;

COMMIT;
