-- Migration 011: Meal log (per-person consumption tracking) + Weight entries
-- Supports Phase 4 (Cook flow) and Phase 5 (Nutrition dashboard)

-- ============================================================
-- 1. meal_log — What was actually eaten, per person, per meal
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  person_name     TEXT NOT NULL,
  meal_date       DATE NOT NULL,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('pdj','dejeuner','diner','collation')),
  cooked_dish_id  BIGINT REFERENCES cooked_dishes(id) ON DELETE SET NULL,
  recipe_id       BIGINT REFERENCES recipes(id) ON DELETE SET NULL,
  description     TEXT,
  portions_eaten  NUMERIC(4,2) DEFAULT 1.0,
  kcal            NUMERIC(7,1),
  protein_g       NUMERIC(6,1),
  carbs_g         NUMERIC(6,1),
  fat_g           NUMERIC(6,1),
  fiber_g         NUMERIC(6,1),
  micronutrients  JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries (date range per user per person)
CREATE INDEX IF NOT EXISTS idx_meal_log_user_date
  ON meal_log(user_id, person_name, meal_date);

-- ============================================================
-- 2. weight_entries — Weight tracking per person
-- ============================================================
CREATE TABLE IF NOT EXISTS weight_entries (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  person_name     TEXT NOT NULL,
  date            DATE NOT NULL,
  weight_kg       NUMERIC(5,2) NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, person_name, date)
);

-- ============================================================
-- 3. Extend user_health_goals for multi-person + weight target
-- ============================================================
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS person_name TEXT DEFAULT 'Julien';
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5,2);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS target_fiber_g NUMERIC(6,1);

-- ============================================================
-- 4. Row Level Security
-- ============================================================
ALTER TABLE meal_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY meal_log_user_policy ON meal_log
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY weight_entries_user_policy ON weight_entries
  FOR ALL USING (auth.uid() = user_id);
