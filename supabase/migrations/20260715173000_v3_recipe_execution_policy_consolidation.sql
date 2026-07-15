-- Recipe executions are immutable, user-scoped planning snapshots.
-- Consolidate the legacy published-recipe read policy with the V3 ownership policy.

BEGIN;

DROP POLICY IF EXISTS p_recipe_executions_read
  ON culinary.recipe_executions;

DROP POLICY IF EXISTS recipe_executions_select_own
  ON culinary.recipe_executions;
CREATE POLICY recipe_executions_select_own
  ON culinary.recipe_executions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

COMMIT;
