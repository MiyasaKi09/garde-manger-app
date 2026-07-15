#!/usr/bin/env bash
# ============================================================================
# Mécanisme d'application des migrations Postgres (ordonné, idempotent, tracé).
# Réf. verdict directeur #7 : « créer un vrai mécanisme d'application des migrations ».
#
# - Applique les fichiers supabase/migrations/*.sql dans l'ORDRE lexicographique.
# - Enregistre chaque version dans supabase_migrations.schema_migrations (comme le
#   fait la CLI Supabase) : une version déjà présente est IGNORÉE → réexécutable.
# - S'arrête à la première erreur (ON_ERROR_STOP). Chaque migration est censée être
#   idempotente ; le registre évite les réapplications inutiles.
#
# Utilisé par la CI (job db-tests) sur un Postgres éphémère, et localement/en
# préprod pour réconcilier le registre avec les fichiers versionnés.
#
# Usage : DATABASE_URL=postgres://user:pass@host:5432/db bash scripts/db/apply-migrations.sh [dir]
# ============================================================================
set -euo pipefail

DIR="${1:-supabase/migrations}"
: "${DATABASE_URL:?DATABASE_URL est requis (postgres://…)}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    text PRIMARY KEY,
  name       text,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL

shopt -s nullglob
applied=0 skipped=0
for f in $(ls "$DIR"/*.sql | sort); do
  base="$(basename "$f" .sql)"
  version="${base%%_*}"      # préfixe horodaté avant le premier '_'
  name="${base#*_}"          # reste = nom lisible
  present="$(psql "$DATABASE_URL" -tAc "select 1 from supabase_migrations.schema_migrations where version = '${version}'")"
  if [ "${present}" = "1" ]; then
    echo "skip   ${base}"
    skipped=$((skipped+1))
    continue
  fi
  echo "apply  ${base}"
  # --single-transaction : chaque migration est ATOMIQUE (comme la CLI Supabase) et
  # les tables temporaires ON COMMIT DROP survivent jusqu'à la fin du fichier.
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q --single-transaction -f "$f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q \
    -c "insert into supabase_migrations.schema_migrations(version, name) values ('${version}', \$name\$${name}\$name\$)"
  applied=$((applied+1))
done

echo "migrations : ${applied} appliquées, ${skipped} déjà présentes."
