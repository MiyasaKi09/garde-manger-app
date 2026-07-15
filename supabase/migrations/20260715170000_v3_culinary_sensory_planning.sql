-- Myko V3: named culinary identities, sensory contract and planner eligibility.
-- The editorial corpus remains candidate data. Only versions whose exact food
-- forms, conversions and deterministic nutrition pass quality gates may become
-- planning-eligible.

ALTER TABLE culinary.recipe_families
  ADD COLUMN IF NOT EXISTS cuisine_origin text,
  ADD COLUMN IF NOT EXISTS identity_level text,
  ADD COLUMN IF NOT EXISTS sensory_profile text;

ALTER TABLE culinary.recipe_versions
  ADD COLUMN IF NOT EXISTS sensory_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dominant_flavors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS aroma_families text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_textures text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS signature_ingredients text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS identity_guardrails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS techniques text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS variant_candidates text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergens text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS conservation_text text,
  ADD COLUMN IF NOT EXISTS planning_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eligibility_issues jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION culinary.sensory_scores_valid(scores jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_typeof(scores) = 'object'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each_text(scores) score
      WHERE score.value !~ '^[0-5]([.]0+)?$'
         OR score.value::numeric < 0
         OR score.value::numeric > 5
    );
$$;

DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_families_identity_level_check'
      AND conrelid = 'culinary.recipe_families'::regclass
  ) THEN
    ALTER TABLE culinary.recipe_families
      ADD CONSTRAINT recipe_families_identity_level_check
      CHECK (identity_level IS NULL OR identity_level IN ('named_traditional_dish', 'domestic_standard'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_versions_sensory_scores_check'
      AND conrelid = 'culinary.recipe_versions'::regclass
  ) THEN
    ALTER TABLE culinary.recipe_versions
      ADD CONSTRAINT recipe_versions_sensory_scores_check
      CHECK (culinary.sensory_scores_valid(sensory_scores));
  END IF;
END
$constraints$;

CREATE INDEX IF NOT EXISTS idx_recipe_families_identity_profile
  ON culinary.recipe_families (identity_level, sensory_profile, status);
CREATE INDEX IF NOT EXISTS idx_recipe_versions_planning_eligible
  ON culinary.recipe_versions (planning_eligible, publication_status)
  WHERE planning_eligible;

CREATE TABLE IF NOT EXISTS culinary.recipe_planner_rule_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version integer NOT NULL,
  rules jsonb NOT NULL,
  source_dataset_id uuid REFERENCES ops.source_datasets(id),
  status text NOT NULL DEFAULT 'candidate',
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (code, version),
  UNIQUE (content_hash)
);

ALTER TABLE culinary.recipe_planner_rule_sets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON culinary.recipe_planner_rule_sets FROM anon, authenticated;
GRANT ALL ON culinary.recipe_planner_rule_sets TO service_role;

COMMENT ON COLUMN culinary.recipe_versions.planning_eligible IS
  'True only after exact form resolution, A/B confidence, strict unit conversion and deterministic macro coverage.';
COMMENT ON COLUMN culinary.recipe_versions.identity_guardrails IS
  'Non-negotiable dish identity constraints. A substitution violating one is forbidden regardless of nutrition.';
