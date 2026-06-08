-- 20260608_prep_tasks_done.sql
-- Check-list persistante du « jour de cuisine » : une tâche de préparation
-- peut être cochée (et le rester d'un appareil à l'autre).
-- Idempotent (IF NOT EXISTS). RLS inchangée (policy ALL « users_own_prep »).

ALTER TABLE nutrition_plan_prep_tasks
  ADD COLUMN IF NOT EXISTS done boolean NOT NULL DEFAULT false;
ALTER TABLE nutrition_plan_prep_tasks
  ADD COLUMN IF NOT EXISTS done_at timestamptz;
