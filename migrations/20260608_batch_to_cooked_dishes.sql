-- 20260608_batch_to_cooked_dishes.sql
-- Batch → stock : une préparation cuisinée devient un « plat cuisiné »
-- (cooked_dishes) avec sa DLC, décompté quand les déjeuners reliés sont mangés.
-- + conservation chiffrée sur la préparation (keeps_days, freezable) pour
-- calculer la DLC du plat préparé. Idempotent.

ALTER TABLE cooked_dishes ADD COLUMN IF NOT EXISTS batch_recipe_id bigint;
CREATE INDEX IF NOT EXISTS idx_cooked_dishes_batch ON cooked_dishes(batch_recipe_id);

ALTER TABLE nutrition_plan_batch_recipes ADD COLUMN IF NOT EXISTS keeps_days int;
ALTER TABLE nutrition_plan_batch_recipes ADD COLUMN IF NOT EXISTS freezable boolean;
