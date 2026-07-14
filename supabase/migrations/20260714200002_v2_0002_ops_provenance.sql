-- ============================================================================
-- Migration V2 · 0002 — Fabrique de données : sources, provenance, releases
-- Réf. MYKO_DATA_FOUNDATION_V2 §5.2, §5.3, §7.3-7.7.
-- ============================================================================
-- Registre juridique des sources, copies brutes immuables, runs d'import,
-- provenance par champ, file de révision et releases atomiques.
-- Aucun import réel : uniquement la structure. Idempotent (IF NOT EXISTS).
-- ============================================================================

-- ── Registre des sources (fiche juridique + technique) — §5.2 ───────────────
CREATE TABLE IF NOT EXISTS ops.source_datasets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE,
  name             text NOT NULL,
  publisher        text NOT NULL,
  source_url       text NOT NULL,
  license_code     text NOT NULL,
  license_url      text,
  allowed_uses     jsonb NOT NULL,
  update_strategy  text NOT NULL,
  current_version  text,
  last_checked_at  timestamptz,
  enabled          boolean NOT NULL DEFAULT true
);
COMMENT ON TABLE ops.source_datasets IS
  'Registre des sources autorisées : aucune import sans licence connue et usages compatibles (§5.2).';

-- ── Copies brutes immuables (Zone 0) — §5.3 ─────────────────────────────────
CREATE TABLE IF NOT EXISTS source_raw.import_blobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dataset_id uuid NOT NULL REFERENCES ops.source_datasets(id),
  source_version    text NOT NULL,
  object_path       text NOT NULL,
  sha256            text NOT NULL,
  byte_size         bigint NOT NULL,
  mime_type         text,
  downloaded_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_dataset_id, source_version, sha256)
);
COMMENT ON TABLE source_raw.import_blobs IS
  'Fichiers sources originaux (Storage), immuables + checksum. Jamais exposés au client.';

-- ── Runs d'import — §7.3 ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops.import_runs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dataset_id  uuid NOT NULL REFERENCES ops.source_datasets(id),
  source_version     text NOT NULL,
  code_version       text NOT NULL,
  configuration_hash text NOT NULL,
  status             text NOT NULL,
  started_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz,
  raw_count          integer,
  parsed_count       integer,
  candidate_count    integer,
  rejected_count     integer,
  warning_count      integer,
  error_summary      jsonb
);
COMMENT ON TABLE ops.import_runs IS 'Exécutions d''import : idempotentes, traçables, reprises sur erreur (§7.3).';

-- ── Provenance par champ — §7.4 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops.field_provenance (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_schema      text NOT NULL,
  entity_table       text NOT NULL,
  entity_id          uuid NOT NULL,
  field_name         text NOT NULL,
  source_dataset_id  uuid NOT NULL REFERENCES ops.source_datasets(id),
  source_record_key  text NOT NULL,
  original_value     jsonb,
  normalized_value   jsonb,
  transformation_rule text,
  import_run_id      uuid NOT NULL REFERENCES ops.import_runs(id),
  selected           boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE ops.field_provenance IS
  'Origine par champ d''une donnée fusionnée (Ciqual/USDA/OFF/sanitaire) (§7.4).';
CREATE INDEX IF NOT EXISTS idx_field_provenance_entity
  ON ops.field_provenance (entity_schema, entity_table, entity_id);

-- ── Releases atomiques du catalogue — §7.6 ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ops.catalog_releases (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_type   text NOT NULL,
  version        text NOT NULL UNIQUE,
  status         text NOT NULL,
  manifest       jsonb NOT NULL,
  checksums      jsonb NOT NULL,
  quality_report jsonb NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  published_at   timestamptz,
  rolled_back_at timestamptz
);
COMMENT ON TABLE ops.catalog_releases IS
  'Publication par release : liste exacte des entités + hashes, publication atomique, rollback par pointeur (§7.6-7.7).';

-- ── File de révision ciblée — §7.5 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quality.review_tasks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    text NOT NULL,
  entity_id      uuid NOT NULL,
  task_type      text NOT NULL,
  priority       integer NOT NULL,
  reason_codes   text[] NOT NULL,
  proposed_changes jsonb,
  status         text NOT NULL DEFAULT 'open',
  assigned_to    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  resolution     jsonb
);
COMMENT ON TABLE quality.review_tasks IS
  'Revue humaine ciblée par risque/impact : allergènes, conservation, sécurité, formes animales… (§7.5).';
CREATE INDEX IF NOT EXISTS idx_review_tasks_open
  ON quality.review_tasks (status, priority DESC) WHERE status = 'open';
