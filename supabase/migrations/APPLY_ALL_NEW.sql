-- ================================================================
-- SCRIPT CONSOLIDÉ — Toutes les nouvelles tables et colonnes
-- Copier-coller dans Supabase → SQL Editor → Run
-- ================================================================

-- 1. meal_log
CREATE TABLE IF NOT EXISTS meal_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  person_name TEXT NOT NULL,
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  cooked_dish_id BIGINT REFERENCES cooked_dishes(id) ON DELETE SET NULL,
  recipe_id BIGINT REFERENCES recipes(id) ON DELETE SET NULL,
  description TEXT,
  portions_eaten NUMERIC(4,2) DEFAULT 1.0,
  kcal NUMERIC(7,1), protein_g NUMERIC(6,1), carbs_g NUMERIC(6,1),
  fat_g NUMERIC(6,1), fiber_g NUMERIC(6,1),
  micronutrients JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meal_log_user_date ON meal_log(user_id, person_name, meal_date);
ALTER TABLE meal_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY meal_log_user_policy ON meal_log FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. weight_entries
CREATE TABLE IF NOT EXISTS weight_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  person_name TEXT NOT NULL,
  date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, person_name, date)
);
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY weight_entries_user_policy ON weight_entries FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. generated_recipes
CREATE TABLE IF NOT EXISTS generated_recipes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name_normalized TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  servings INT DEFAULT 2,
  prep_min INT, cook_min INT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  chef_tips TEXT,
  nutrition_per_serving JSONB,
  source TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Rating et nombre de fois cuisiné
ALTER TABLE generated_recipes ADD COLUMN IF NOT EXISTS rating INT CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE generated_recipes ADD COLUMN IF NOT EXISTS cook_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_generated_recipes_name ON generated_recipes(user_id, name_normalized);
ALTER TABLE generated_recipes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY generated_recipes_user_policy ON generated_recipes FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Colonnes additionnelles sur user_health_goals
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS person_name TEXT DEFAULT 'Julien';
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5,2);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS target_fiber_g NUMERIC(6,1);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS sex TEXT;
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC(5,2);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS weight_loss_rate NUMERIC(3,2);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS bmr NUMERIC(7,1);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS tdee NUMERIC(7,1);

-- 5. Fix PK pour supporter Julien + Zoé
ALTER TABLE user_health_goals DROP CONSTRAINT IF EXISTS user_health_goals_pkey;
ALTER TABLE user_health_goals ALTER COLUMN person_name SET NOT NULL;
ALTER TABLE user_health_goals ADD CONSTRAINT user_health_goals_pkey PRIMARY KEY (user_id, person_name);
