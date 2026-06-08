-- 20260608_batch_conservation.sql
-- Batch cooking intelligent : conseil de conservation par préparation
-- (combien de temps ça se garde, quoi congeler, à manger sous X jours).
-- Le « quand cuisiner » est porté par cook_date ; ceci porte le « comment garder ».
-- Idempotent.

ALTER TABLE nutrition_plan_batch_recipes
  ADD COLUMN IF NOT EXISTS conservation text;
