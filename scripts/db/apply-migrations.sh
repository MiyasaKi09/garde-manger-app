#!/usr/bin/env bash
# ============================================================================
# apply-migrations.sh — Applicateur de migrations Postgres sécurisé (Myko V2)
# ============================================================================
# Applique les fichiers supabase/migrations/*.sql dans l'ordre LC_ALL=C,
# en excluant les fichiers *_rollback.sql.
#
# Garanties :
#   - Ordre déterministe : find + LC_ALL=C sort (pas de globbing bare).
#   - Idempotence : une version déjà enregistrée dans schema_migrations est
#     ignorée sans réapplication.
#   - Atomicité : chaque migration est exécutée dans UNE transaction unique
#     (advisory lock → re-check → drift check → \i fichier → INSERT × 2 → commit).
#   - Drift de checksum : si le fichier a changé depuis son enregistrement dans
#     ops.schema_migration_checksums, l'applicateur refuse et sort en erreur.
#   - Traçabilité : chaque migration est enregistrée dans DEUX tables :
#       supabase_migrations.schema_migrations (compatible CLI Supabase)
#       ops.schema_migration_checksums       (sha256 + horodatage)
#   - Concurrence : pg_advisory_xact_lock() à portée transaction empêche deux
#     instances parallèles d'appliquer la même migration simultanément.
#
# Usage :
#   DATABASE_URL=postgres://user:pass@host:5432/db bash apply-migrations.sh [apply|status|--dry-run] [MIGRATION_DIR]
#
#   apply (défaut) : applique les migrations manquantes.
#   status / --dry-run : liste ce qui serait appliqué / ignoré, sans rien changer.
#                        Retourne 0 même s'il y a des migrations à appliquer.
#
# MIGRATION_DIR : répertoire des fichiers .sql (défaut : supabase/migrations
#                 depuis la racine du dépôt). Peut être un chemin absolu ou
#                 relatif à la racine du dépôt.
#
# Variables d'environnement :
#   DATABASE_URL (requis) : DSN PostgreSQL.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

CMD="apply"
MIGRATION_DIR=""

for arg in "$@"; do
  case "$arg" in
    apply|status|--dry-run)
      CMD="$arg"
      ;;
    *)
      MIGRATION_DIR="$arg"
      ;;
  esac
done

[ "$CMD" = "--dry-run" ] && CMD="status"

if [ -z "$MIGRATION_DIR" ]; then
  MIGRATION_DIR="$REPO_ROOT/supabase/migrations"
elif [[ "$MIGRATION_DIR" != /* ]]; then
  MIGRATION_DIR="$REPO_ROOT/$MIGRATION_DIR"
fi

: "${DATABASE_URL:?DATABASE_URL est requis (postgres://...)}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q << 'BOOTSTRAP_SQL'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    text        PRIMARY KEY,
  name       text,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE SCHEMA IF NOT EXISTS ops;
CREATE TABLE IF NOT EXISTS ops.schema_migration_checksums (
  version    text        PRIMARY KEY,
  name       text,
  sha256     text        NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
BOOTSTRAP_SQL

mapfile -t FILES < <(
  find "$MIGRATION_DIR" -maxdepth 1 -name '*.sql' \
    | grep -v '_rollback\.sql$' \
    | LC_ALL=C sort
)

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "Aucun fichier .sql trouvé dans $MIGRATION_DIR" >&2
  exit 1
fi

# Les anciens fichiers préfixés seulement par YYYYMMDD peuvent être plusieurs
# le même jour. Une version brute partagée ne peut pas servir de clé primaire au
# ledger. Comme le générateur de manifeste, utiliser le basename complet pour
# les seules versions collisionnelles.
declare -A VERSION_COUNTS=()
for f in "${FILES[@]}"; do
  count_base="$(basename "$f" .sql)"
  count_version="${count_base%%_*}"
  VERSION_COUNTS["$count_version"]=$(( ${VERSION_COUNTS["$count_version"]:-0} + 1 ))
done

applied=0
skipped=0

for f in "${FILES[@]}"; do
  base="$(basename "$f" .sql)"
  raw_version="${base%%_*}"
  version="$raw_version"
  if [ "${VERSION_COUNTS["$raw_version"]}" -gt 1 ]; then
    version="$base"
  fi
  name="${base#${raw_version}_}"

  # P2 est une migration composée : le gros contrat de publication reste dans le
  # fichier historique, tandis que la clôture atomique des tâches est isolée dans
  # un include lisible. Les deux sont inclus dans la même transaction et dans la
  # même empreinte de drift ; ils constituent donc une seule version logique.
  extra_include=""
  if [ "$raw_version" = "20260717000002" ]; then
    candidate="$MIGRATION_DIR/includes/20260717000002_atomic_planned_task_materialization.sql"
    if [ ! -f "$candidate" ]; then
      echo "ERREUR include P2 manquant : $candidate" >&2
      exit 3
    fi
    extra_include="$candidate"
  fi

  if [ -n "$extra_include" ]; then
    current_sha256="$(cat "$f" "$extra_include" | sha256sum | cut -d' ' -f1)"
  else
    current_sha256="$(sha256sum "$f" | cut -d' ' -f1)"
  fi

  state_row="$(psql "$DATABASE_URL" -tAq << PRECHECK_SQL
SELECT
  CASE WHEN sm.version IS NOT NULL THEN 't' ELSE 'f' END AS in_ledger,
  COALESCE(ck.sha256, '') AS recorded_sha,
  COALESCE(ck.name,   '') AS recorded_name
FROM (SELECT 1) AS dummy
LEFT JOIN supabase_migrations.schema_migrations sm ON sm.version = '${version}'
LEFT JOIN ops.schema_migration_checksums       ck ON ck.version  = '${version}'
LIMIT 1
PRECHECK_SQL
)"

  in_ledger="$(echo    "$state_row" | cut -d'|' -f1 | tr -d '[:space:]')"
  recorded_sha="$(echo "$state_row" | cut -d'|' -f2 | tr -d '[:space:]')"
  recorded_name="$(echo "$state_row" | cut -d'|' -f3 | tr -d '[:space:]')"

  if [ -n "$recorded_sha" ] && [ "$recorded_name" = "$name" ] && [ "$recorded_sha" != "$current_sha256" ]; then
    echo "ERREUR drift de checksum : $base" >&2
    echo "  Enregistré : $recorded_sha" >&2
    echo "  Actuel     : $current_sha256" >&2
    echo "  Le fichier (et ses includes éventuels) a changé après son enregistrement. Opération refusée." >&2
    exit 2
  fi

  if [ "$in_ledger" = "t" ]; then
    [ "$CMD" = "status" ] && echo "skip   $base"
    skipped=$((skipped + 1))
    continue
  fi

  if [ "$CMD" = "status" ]; then
    echo "apply  $base"
    applied=$((applied + 1))
    continue
  fi

  tmpf="$(mktemp --suffix=.sql)"
  trap "rm -f '$tmpf'" EXIT

  include_sql=""
  if [ -n "$extra_include" ]; then
    include_sql="\\i ${extra_include}"
  fi

  cat > "$tmpf" << WRAPPER_SQL
-- Wrapper atomique pour : ${base}
DO \$lock\$ BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('myko_schema_migrations'));
END \$lock\$;

SELECT
  EXISTS(
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version = '${version}'
  ) AS should_skip
\gset

DO \$drift_check\$
DECLARE v_sha text; v_name text;
BEGIN
  SELECT sha256, name INTO v_sha, v_name
    FROM ops.schema_migration_checksums
    WHERE version = '${version}';
  IF v_sha IS NOT NULL AND v_name = '${name}' AND v_sha <> '${current_sha256}' THEN
    RAISE EXCEPTION
      'Drift de checksum pour la version ${version} (${name}) : enregistré=% actuel=${current_sha256}',
      v_sha;
  END IF;
END \$drift_check\$;

\if :should_skip
  SELECT 'skip (race)' AS migration_result;
\else
\i ${f}
${include_sql}
  INSERT INTO supabase_migrations.schema_migrations(version, name)
    VALUES ('${version}', '${name}');
  INSERT INTO ops.schema_migration_checksums(version, name, sha256)
    VALUES ('${version}', '${name}', '${current_sha256}');
\endif
WRAPPER_SQL

  echo "apply  $base"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q --single-transaction -f "$tmpf"
  rm -f "$tmpf"
  trap - EXIT

  applied=$((applied + 1))
done

if [ "$CMD" = "status" ]; then
  echo "status : ${applied} à appliquer, ${skipped} déjà présentes."
else
  echo "migrations : ${applied} appliquées, ${skipped} déjà présentes."
fi
