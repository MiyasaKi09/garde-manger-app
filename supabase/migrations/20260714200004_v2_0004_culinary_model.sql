-- ============================================================================
-- Migration V2 · 0004 — Modèle culinaire (schéma `culinary`)
-- Réf. MYKO_DATA_FOUNDATION_V2 §4.
-- ============================================================================
-- Famille (identité du plat) → Version (recette complète immuable une fois
-- publiée) → composants, exigences d'ingrédients, options validées, axes de
-- variation, compatibilités, branches d'étapes, et snapshot d'exécution figé
-- référencé par le planning. Aucune recette importée : structure seule.
-- ============================================================================

-- ── Famille de recettes — §4.1 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_families (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name            text NOT NULL,
  canonical_name_normalized text NOT NULL UNIQUE,
  description               text,
  culinary_origin           text,
  meal_role                 text,
  dish_structure            text,
  status                    text NOT NULL DEFAULT 'candidate',
  confidence_level          text NOT NULL DEFAULT 'D',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE culinary.recipe_families IS 'Identité du plat (poulet à la moutarde et purée, risotto…) (§4.1).';

-- ── Version de recette (immuable après publication) — §4.2 ──────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_versions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_family_id   uuid NOT NULL REFERENCES culinary.recipe_families(id),
  version_number     integer NOT NULL,
  title              text NOT NULL,
  source_dataset_id  uuid REFERENCES ops.source_datasets(id),
  source_record_key  text,
  author_name        text,
  source_url         text,
  source_license     text,
  servings           numeric NOT NULL,
  prep_minutes       numeric,
  cook_minutes       numeric,
  rest_minutes       numeric,
  difficulty         text,
  quality_level      text NOT NULL DEFAULT 'D',
  publication_status text NOT NULL DEFAULT 'draft',
  content_hash       text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  published_at       timestamptz,
  UNIQUE (recipe_family_id, version_number),
  UNIQUE (content_hash)
);
COMMENT ON TABLE culinary.recipe_versions IS 'Recette complète sourcée. Publiée = immuable ; une correction crée une nouvelle version (§4.2).';

-- ── Composants et sous-recettes — §4.3 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_components (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_version_id     uuid NOT NULL REFERENCES culinary.recipe_versions(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  component_role        text NOT NULL,
  position              integer NOT NULL,
  sub_recipe_version_id uuid REFERENCES culinary.recipe_versions(id)
);
COMMENT ON TABLE culinary.recipe_components IS 'Composants d''une recette (viande, sauce, purée…), éventuellement sous-recettes (§4.3).';

-- ── Branches d'instructions (créées avant les options qui les référencent) ──
CREATE TABLE IF NOT EXISTS culinary.recipe_instruction_branches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_version_id uuid NOT NULL REFERENCES culinary.recipe_versions(id) ON DELETE CASCADE,
  name              text NOT NULL,
  selection_condition jsonb NOT NULL,
  confidence_level  text NOT NULL
);
COMMENT ON TABLE culinary.recipe_instruction_branches IS 'Branche d''étapes conditionnelle (ex. selon le morceau choisi) (§4.8).';

-- ── Exigences d'ingrédients — §4.4 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_ingredient_requirements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_version_id     uuid NOT NULL REFERENCES culinary.recipe_versions(id) ON DELETE CASCADE,
  component_id          uuid REFERENCES culinary.recipe_components(id),
  requirement_type      text NOT NULL,
  preferred_food_form_id uuid REFERENCES catalog.food_forms(id),
  quantity              numeric NOT NULL,
  unit                  text NOT NULL,
  strictness            text NOT NULL,
  culinary_role         text,
  preparation_note      text,
  is_optional           boolean NOT NULL DEFAULT false,
  position              integer NOT NULL
);
COMMENT ON COLUMN culinary.recipe_ingredient_requirements.requirement_type IS
  'exact_form|validated_options|functional_requirement|sub_recipe|seasoning_to_taste (§4.4).';

-- ── Options validées d'une exigence — §4.5 ──────────────────────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_requirement_options (
  requirement_id      uuid NOT NULL REFERENCES culinary.recipe_ingredient_requirements(id) ON DELETE CASCADE,
  food_form_id        uuid NOT NULL REFERENCES catalog.food_forms(id),
  preference_rank     integer NOT NULL,
  quantity_factor     numeric NOT NULL DEFAULT 1,
  instruction_branch_id uuid REFERENCES culinary.recipe_instruction_branches(id),
  quality_impact      numeric NOT NULL DEFAULT 0,
  confidence_level    text NOT NULL,
  PRIMARY KEY (requirement_id, food_form_id)
);
COMMENT ON TABLE culinary.recipe_requirement_options IS 'Formes acceptées pour une exigence, classées par préférence, avec impact qualité (§4.5).';

-- ── Axes de variation culinaire — §4.6 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_variation_axes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_family_id uuid NOT NULL REFERENCES culinary.recipe_families(id) ON DELETE CASCADE,
  name             text NOT NULL,
  selection_mode   text NOT NULL,
  required         boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS culinary.recipe_variation_options (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_axis_id uuid NOT NULL REFERENCES culinary.recipe_variation_axes(id) ON DELETE CASCADE,
  name             text NOT NULL,
  component_recipe_version_id uuid REFERENCES culinary.recipe_versions(id),
  confidence_level text NOT NULL,
  status           text NOT NULL DEFAULT 'candidate'
);
COMMENT ON TABLE culinary.recipe_variation_axes IS 'Axes de choix d''une famille (morceau, sauce, purée…) (§4.6).';

-- ── Compatibilités entre options — §4.7 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_configuration_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_family_id uuid NOT NULL REFERENCES culinary.recipe_families(id) ON DELETE CASCADE,
  left_option_id   uuid NOT NULL REFERENCES culinary.recipe_variation_options(id) ON DELETE CASCADE,
  right_option_id  uuid NOT NULL REFERENCES culinary.recipe_variation_options(id) ON DELETE CASCADE,
  compatibility    text NOT NULL,
  reason           text,
  confidence_level text NOT NULL,
  UNIQUE (left_option_id, right_option_id)
);
COMMENT ON COLUMN culinary.recipe_configuration_rules.compatibility IS
  'required|recommended|allowed|discouraged|forbidden (§4.7).';

-- ── Étapes — §4.8 ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_steps (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_version_id uuid NOT NULL REFERENCES culinary.recipe_versions(id) ON DELETE CASCADE,
  branch_id         uuid REFERENCES culinary.recipe_instruction_branches(id),
  step_number       integer NOT NULL,
  instruction       text NOT NULL,
  active_minutes    numeric,
  passive_minutes   numeric,
  temperature_c     numeric,
  target_core_temperature_c numeric,
  equipment_codes   text[] NOT NULL DEFAULT '{}',
  safety_critical   boolean NOT NULL DEFAULT false,
  UNIQUE (recipe_version_id, branch_id, step_number)
);
COMMENT ON TABLE culinary.recipe_steps IS 'Étapes de préparation, éventuellement rattachées à une branche (§4.8).';

-- ── Snapshot d'exécution figé — §4.9 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS culinary.recipe_executions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_version_id uuid NOT NULL REFERENCES culinary.recipe_versions(id),
  selected_configuration jsonb NOT NULL,
  servings          numeric NOT NULL,
  exact_ingredients_snapshot jsonb NOT NULL,
  exact_steps_snapshot jsonb NOT NULL,
  nutrition_snapshot jsonb NOT NULL,
  transformation_plan_snapshot jsonb NOT NULL,
  source_lot_plan_snapshot jsonb NOT NULL,
  content_hash      text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_hash)
);
COMMENT ON TABLE culinary.recipe_executions IS
  'Configuration retenue figée et reproductible. Le planning référence recipe_execution_id, pas une recette mutable (§4.9).';
