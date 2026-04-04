-- Migration 012: Cache for AI-generated recipes
-- Prevents regenerating the same recipe on every click

CREATE TABLE IF NOT EXISTS generated_recipes (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  name_normalized TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  servings        INT DEFAULT 2,
  prep_min        INT,
  cook_min        INT,
  ingredients     JSONB NOT NULL DEFAULT '[]',
  steps           JSONB NOT NULL DEFAULT '[]',
  chef_tips       TEXT,
  nutrition_per_serving JSONB,
  source          TEXT DEFAULT 'ai',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_recipes_name
  ON generated_recipes(user_id, name_normalized);

ALTER TABLE generated_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY generated_recipes_user_policy ON generated_recipes
  FOR ALL USING (auth.uid() = user_id);

-- Extend user_health_goals for detailed nutrition questionnaire
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS sex TEXT;
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC(5,2);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS weight_loss_rate NUMERIC(3,2);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS bmr NUMERIC(7,1);
ALTER TABLE user_health_goals ADD COLUMN IF NOT EXISTS tdee NUMERIC(7,1);
