-- ============================================================================
-- Migration V2 · 0003 — Modèle alimentaire (schéma `catalog`)
-- Réf. MYKO_DATA_FOUNDATION_V2 §3.
-- ============================================================================
-- Concept → Forme (objet stockable/cuisinable) → profils nutrition/conservation,
-- conversions, transformations, produits commerciaux. Confiance & statut portés
-- par ligne (D→A+). Aucun aliment importé : structure seule. Idempotent.
-- ============================================================================

-- ── Catégories (taxonomie limitée et stable) — §3.4 ─────────────────────────
-- La catégorie sert au rangement, pas à la vérité culinaire.
CREATE TABLE IF NOT EXISTS catalog.food_categories (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code     text NOT NULL UNIQUE,
  label    text NOT NULL,
  position integer NOT NULL DEFAULT 0
);
COMMENT ON TABLE catalog.food_categories IS 'Taxonomie Myko limitée et stable (§3.4) — rangement, pas vérité culinaire.';

INSERT INTO catalog.food_categories (code, label, position) VALUES
  ('fruits', 'Fruits', 10),
  ('legumes', 'Légumes', 20),
  ('legumineuses', 'Légumineuses', 30),
  ('cereales_feculents', 'Céréales et féculents', 40),
  ('viandes', 'Viandes', 50),
  ('volailles', 'Volailles', 60),
  ('poissons_fruits_de_mer', 'Poissons et fruits de mer', 70),
  ('oeufs', 'Œufs', 80),
  ('produits_laitiers', 'Produits laitiers', 90),
  ('matieres_grasses', 'Matières grasses', 100),
  ('herbes_aromates', 'Herbes et aromates', 110),
  ('epices', 'Épices', 120),
  ('condiments_sauces', 'Condiments et sauces', 130),
  ('boissons', 'Boissons', 140),
  ('produits_sucres', 'Produits sucrés', 150),
  ('produits_transformes', 'Produits transformés', 160),
  ('preparations_culinaires', 'Préparations culinaires', 170)
ON CONFLICT (code) DO NOTHING;

-- ── Concept alimentaire (identité générale) — §3.1 ──────────────────────────
CREATE TABLE IF NOT EXISTS catalog.food_concepts (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name            text NOT NULL,
  canonical_name_normalized text NOT NULL,
  category_id               uuid NOT NULL REFERENCES catalog.food_categories(id),
  scientific_name           text,
  biological_origin         text,
  description               text,
  status                    text NOT NULL DEFAULT 'candidate',
  confidence_level          text NOT NULL DEFAULT 'D',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_name_normalized)
);
COMMENT ON TABLE catalog.food_concepts IS 'Identité alimentaire générale (poulet, pomme de terre…). Ne porte pas nutrition/conservation directes (§3.1).';

-- ── Forme alimentaire (objet concret stockable/cuisinable) — §3.2 ───────────
CREATE TABLE IF NOT EXISTS catalog.food_forms (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_concept_id           uuid NOT NULL REFERENCES catalog.food_concepts(id),
  parent_form_id            uuid REFERENCES catalog.food_forms(id),
  canonical_name            text NOT NULL,
  canonical_name_normalized text NOT NULL,
  physical_state            text,
  cooking_state             text,
  preservation_state        text,
  cut_name                  text,
  bone_state                text,
  skin_state                text,
  preparation_state         text,
  fat_level                 text,
  default_quantity_unit     text NOT NULL,
  edible_yield_ratio        numeric CHECK (edible_yield_ratio > 0 AND edible_yield_ratio <= 1),
  status                    text NOT NULL DEFAULT 'candidate',
  confidence_level          text NOT NULL DEFAULT 'D',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (food_concept_id, canonical_name_normalized)
);
COMMENT ON TABLE catalog.food_forms IS 'Objet alimentaire concret (cuisse crue avec os, purée préparée…). Unité culinaire de référence (§3.2).';
CREATE INDEX IF NOT EXISTS idx_food_forms_concept ON catalog.food_forms (food_concept_id);

-- ── Alias & synonymes — §3.3 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog.food_aliases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_concept_id  uuid REFERENCES catalog.food_concepts(id),
  food_form_id     uuid REFERENCES catalog.food_forms(id),
  alias            text NOT NULL,
  alias_normalized text NOT NULL,
  language_code    text NOT NULL DEFAULT 'fr',
  region_code      text,
  source_record_id uuid,
  confidence       numeric NOT NULL,
  CHECK ((food_concept_id IS NOT NULL) <> (food_form_id IS NOT NULL))
);
-- unicité avec region_code nullable → index d'expression (COALESCE)
CREATE UNIQUE INDEX IF NOT EXISTS uq_food_aliases_norm
  ON catalog.food_aliases (alias_normalized, language_code, COALESCE(region_code, ''));
COMMENT ON TABLE catalog.food_aliases IS 'Synonymes contextuels avec confiance ; peuvent viser un concept OU une forme, pas les deux (§3.3).';

-- ── Profils nutritionnels — §3.5 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog.food_nutrition_profiles (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_form_id         uuid NOT NULL REFERENCES catalog.food_forms(id),
  source_dataset_id    uuid NOT NULL REFERENCES ops.source_datasets(id),
  source_record_key    text NOT NULL,
  basis_quantity       numeric NOT NULL DEFAULT 100,
  basis_unit           text NOT NULL DEFAULT 'g',
  edible_portion_ratio numeric,
  data_version         text NOT NULL,
  confidence_level     text NOT NULL,
  is_primary           boolean NOT NULL DEFAULT false,
  published_at         timestamptz,
  UNIQUE (source_dataset_id, source_record_key, data_version)
);
COMMENT ON TABLE catalog.food_nutrition_profiles IS 'Profil nutritionnel d''une forme (base 100 g), sourcé et versionné (§3.5).';
-- Un seul profil primaire par forme.
CREATE UNIQUE INDEX IF NOT EXISTS uq_nutrition_primary_per_form
  ON catalog.food_nutrition_profiles (food_form_id) WHERE is_primary;

CREATE TABLE IF NOT EXISTS catalog.food_nutrient_values (
  nutrition_profile_id uuid NOT NULL REFERENCES catalog.food_nutrition_profiles(id) ON DELETE CASCADE,
  nutrient_code        text NOT NULL,
  amount               numeric,
  unit                 text NOT NULL,
  value_status         text NOT NULL DEFAULT 'measured',
  PRIMARY KEY (nutrition_profile_id, nutrient_code)
);
COMMENT ON COLUMN catalog.food_nutrient_values.value_status IS
  'measured|calculated|estimated|trace|not_available — un zéro mesuré ≠ valeur absente (§3.5).';

-- ── Profils de conservation — §3.6 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog.food_storage_profiles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_form_id       uuid NOT NULL REFERENCES catalog.food_forms(id),
  storage_method     text NOT NULL,
  packaging_state    text,
  opened_state       text,
  min_temperature_c  numeric,
  max_temperature_c  numeric,
  shelf_life_min_hours integer,
  shelf_life_max_hours integer,
  recommended_hours  integer,
  safety_level       text NOT NULL,
  source_dataset_id  uuid NOT NULL REFERENCES ops.source_datasets(id),
  source_record_key  text,
  confidence_level   text NOT NULL,
  status             text NOT NULL DEFAULT 'candidate'
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_storage_profile_combo
  ON catalog.food_storage_profiles
     (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''));
COMMENT ON TABLE catalog.food_storage_profiles IS
  'Conservation résolue par forme+cuisson+conservation+emballage+ouverture+température. Règle générique interdite (§3.6).';

-- ── Conversions d'unités — §3.7 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog.food_unit_conversions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_form_id      uuid NOT NULL REFERENCES catalog.food_forms(id),
  from_unit         text NOT NULL,
  to_unit           text NOT NULL,
  factor            numeric NOT NULL CHECK (factor > 0),
  context           text,
  min_factor        numeric,
  max_factor        numeric,
  source_dataset_id uuid REFERENCES ops.source_datasets(id),
  confidence_level  text NOT NULL,
  status            text NOT NULL DEFAULT 'candidate'
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_unit_conversion_combo
  ON catalog.food_unit_conversions (food_form_id, from_unit, to_unit, COALESCE(context, ''));
COMMENT ON TABLE catalog.food_unit_conversions IS 'Conversions par forme, éventuellement en plage (min/max) (§3.7).';

-- ── Transformations alimentaires — §3.8 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog.food_transformations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_food_form_id  uuid NOT NULL REFERENCES catalog.food_forms(id),
  action_code          text NOT NULL,
  action_label         text NOT NULL,
  active_minutes       numeric NOT NULL DEFAULT 0,
  passive_minutes      numeric NOT NULL DEFAULT 0,
  skill_level          text NOT NULL,
  equipment_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  safety_requirements  jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence_level     text NOT NULL,
  status               text NOT NULL DEFAULT 'candidate'
);
COMMENT ON TABLE catalog.food_transformations IS 'Opération réelle sur le stock (désosser, mixer…) créant des lots enfants (§3.8).';

CREATE TABLE IF NOT EXISTS catalog.food_transformation_outputs (
  transformation_id    uuid NOT NULL REFERENCES catalog.food_transformations(id) ON DELETE CASCADE,
  output_food_form_id  uuid NOT NULL REFERENCES catalog.food_forms(id),
  output_role          text NOT NULL,
  expected_yield_ratio numeric NOT NULL,
  min_yield_ratio      numeric,
  max_yield_ratio      numeric,
  is_optional          boolean NOT NULL DEFAULT false,
  PRIMARY KEY (transformation_id, output_food_form_id, output_role)
);
COMMENT ON TABLE catalog.food_transformation_outputs IS 'Sorties d''une transformation avec rendements (ex. désosser → haut de cuisse 68-76 %, os 18-25 %) (§3.8).';

-- ── Produits commerciaux — §3.9 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog.commercial_products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode           text UNIQUE,
  brand             text,
  commercial_name   text NOT NULL,
  food_form_id      uuid REFERENCES catalog.food_forms(id),
  package_quantity  numeric,
  package_unit      text,
  drained_quantity  numeric,
  packaging_type    text,
  source_dataset_id uuid NOT NULL REFERENCES ops.source_datasets(id),
  source_record_key text NOT NULL,
  source_updated_at timestamptz,
  match_confidence  numeric,
  status            text NOT NULL DEFAULT 'candidate'
);
COMMENT ON TABLE catalog.commercial_products IS 'Produit commercial (code-barres, marque, emballage). Ne remplace jamais food_form comme unité culinaire (§3.9).';
