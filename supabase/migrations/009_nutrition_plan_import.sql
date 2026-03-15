-- Migration 009: Import de plans nutritionnels depuis fichiers Excel
-- Date: 2026-03-15
-- Description: Tables pour stocker les plans repas importes depuis xlsx

-- ============================================================================
-- TABLE: nutrition_plan_imports
-- ============================================================================
CREATE TABLE IF NOT EXISTS nutrition_plan_imports (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  month_label     TEXT,
  date_range_start DATE,
  date_range_end   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_npi_user ON nutrition_plan_imports(user_id);

ALTER TABLE nutrition_plan_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_imports" ON nutrition_plan_imports
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: nutrition_plan_meals
-- ============================================================================
CREATE TABLE IF NOT EXISTS nutrition_plan_meals (
  id              BIGSERIAL PRIMARY KEY,
  import_id       BIGINT NOT NULL REFERENCES nutrition_plan_imports(id) ON DELETE CASCADE,
  person_name     TEXT NOT NULL,
  meal_date       DATE NOT NULL,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('pdj', 'dejeuner', 'diner', 'collation')),
  day_type        TEXT,
  description     TEXT NOT NULL,
  kcal            NUMERIC(7,1),
  protein_g       NUMERIC(6,1),
  carbs_g         NUMERIC(6,1),
  fat_g           NUMERIC(6,1),
  fiber_g         NUMERIC(6,1),
  UNIQUE(import_id, person_name, meal_date, meal_type)
);

CREATE INDEX idx_npm_import_date ON nutrition_plan_meals(import_id, meal_date);
CREATE INDEX idx_npm_person_date ON nutrition_plan_meals(person_name, meal_date);

ALTER TABLE nutrition_plan_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_meals" ON nutrition_plan_meals
  FOR ALL USING (
    import_id IN (SELECT id FROM nutrition_plan_imports WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABLE: nutrition_plan_daily_totals
-- ============================================================================
CREATE TABLE IF NOT EXISTS nutrition_plan_daily_totals (
  id              BIGSERIAL PRIMARY KEY,
  import_id       BIGINT NOT NULL REFERENCES nutrition_plan_imports(id) ON DELETE CASCADE,
  person_name     TEXT NOT NULL,
  meal_date       DATE NOT NULL,
  kcal            NUMERIC(7,1),
  protein_g       NUMERIC(6,1),
  carbs_g         NUMERIC(6,1),
  fat_g           NUMERIC(6,1),
  fiber_g         NUMERIC(6,1),
  validated       BOOLEAN DEFAULT FALSE,
  UNIQUE(import_id, person_name, meal_date)
);

ALTER TABLE nutrition_plan_daily_totals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_totals" ON nutrition_plan_daily_totals
  FOR ALL USING (
    import_id IN (SELECT id FROM nutrition_plan_imports WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABLE: nutrition_plan_batch_recipes
-- ============================================================================
CREATE TABLE IF NOT EXISTS nutrition_plan_batch_recipes (
  id                  BIGSERIAL PRIMARY KEY,
  import_id           BIGINT NOT NULL REFERENCES nutrition_plan_imports(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  timing              TEXT,
  ingredients         TEXT,
  macros_per_100g     TEXT,
  rendement           TEXT,
  portions            TEXT,
  reheat              TEXT,
  instructions        TEXT
);

ALTER TABLE nutrition_plan_batch_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_batch_recipes" ON nutrition_plan_batch_recipes
  FOR ALL USING (
    import_id IN (SELECT id FROM nutrition_plan_imports WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABLE: nutrition_plan_prep_tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS nutrition_plan_prep_tasks (
  id              BIGSERIAL PRIMARY KEY,
  import_id       BIGINT NOT NULL REFERENCES nutrition_plan_imports(id) ON DELETE CASCADE,
  prep_date       DATE,
  prep_label      TEXT,
  task            TEXT NOT NULL,
  estimated_time  TEXT
);

CREATE INDEX idx_nppt_import_date ON nutrition_plan_prep_tasks(import_id, prep_date);

ALTER TABLE nutrition_plan_prep_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_prep" ON nutrition_plan_prep_tasks
  FOR ALL USING (
    import_id IN (SELECT id FROM nutrition_plan_imports WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABLE: nutrition_plan_shopping_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS nutrition_plan_shopping_items (
  id              BIGSERIAL PRIMARY KEY,
  import_id       BIGINT NOT NULL REFERENCES nutrition_plan_imports(id) ON DELETE CASCADE,
  week_label      TEXT NOT NULL,
  category        TEXT,
  product_name    TEXT NOT NULL,
  quantity        TEXT,
  checked         BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_npsi_import_week ON nutrition_plan_shopping_items(import_id, week_label);

ALTER TABLE nutrition_plan_shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_shopping" ON nutrition_plan_shopping_items
  FOR ALL USING (
    import_id IN (SELECT id FROM nutrition_plan_imports WHERE user_id = auth.uid())
  );
