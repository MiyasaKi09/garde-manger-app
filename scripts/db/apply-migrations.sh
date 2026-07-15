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

# ── Résolution des chemins ─────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── Parsing des arguments ─────────────────────────────────────────────────
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

# Normalise --dry-run en status pour simplifier les tests internes.
[ "$CMD" = "--dry-run" ] && CMD="status"

# Résolution du répertoire de migrations.
if [ -z "$MIGRATION_DIR" ]; then
  MIGRATION_DIR="$REPO_ROOT/supabase/migrations"
elif [[ "$MIGRATION_DIR" != /* ]]; then
  # Chemin relatif → relatif à la racine du dépôt.
  MIGRATION_DIR="$REPO_ROOT/$MIGRATION_DIR"
fi

: "${DATABASE_URL:?DATABASE_URL est requis (postgres://...)}"

# ── Bootstrap des tables de suivi (idempotent) ───────────────────────────
# NE PAS modifier supabase_migrations directement en prod (géré par la CLI).
# La table ops.schema_migration_checksums nous appartient entièrement.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q << 'BOOTSTRAP_SQL'
-- Schéma de suivi compatible CLI Supabase (créé si absent, jamais modifié).
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    text        PRIMARY KEY,
  name       text,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- Table de checksums : propriété exclusive de cet applicateur.
-- Permet de détecter les drifts (fichier modifié après application).
CREATE SCHEMA IF NOT EXISTS ops;
CREATE TABLE IF NOT EXISTS ops.schema_migration_checksums (
  version    text        PRIMARY KEY,
  name       text,
  sha256     text        NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
BOOTSTRAP_SQL

# ── Liste de fichiers : déterministe, sans glob bare ─────────────────────
mapfile -t FILES < <(
  find "$MIGRATION_DIR" -maxdepth 1 -name '*.sql' \
    | grep -v '_rollback\.sql$' \
    | LC_ALL=C sort
)

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "Aucun fichier .sql trouvé dans $MIGRATION_DIR" >&2
  exit 1
fi

# ── Boucle principale ─────────────────────────────────────────────────────
applied=0
skipped=0

for f in "${FILES[@]}"; do
  base="$(basename "$f" .sql)"
  # Préfixe horodaté = version (tout avant le premier '_').
  version="${base%%_*}"
  # Nom lisible (après le premier '_').
  name="${base#*_}"
  # Checksum courant du fichier.
  current_sha256="$(sha256sum "$f" | cut -d' ' -f1)"

  # ── Pré-vérification hors transaction (accès rapide) ──────────────────
  # Lit l'état courant : version déjà dans schema_migrations + sha256+name enregistrés.
  # NOTE : plusieurs fichiers pré-V2 partagent le même préfixe de version (ex : deux
  # fichiers 20260518_*.sql → version "20260518"). Le champ `name` permet de distinguer
  # une collision (fichier différent, même version) d'un vrai drift (même fichier, sha256
  # changé). Le drift n'est signalé que si le `name` enregistré correspond à ce fichier.
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

  # Drift : uniquement si le sha256 enregistré concerne CE fichier (même name)
  # et a changé. Ignorer les collisions (même version, nom de fichier différent).
  if [ -n "$recorded_sha" ] && [ "$recorded_name" = "$name" ] && [ "$recorded_sha" != "$current_sha256" ]; then
    echo "ERREUR drift de checksum : $base" >&2
    echo "  Enregistré : $recorded_sha" >&2
    echo "  Actuel     : $current_sha256" >&2
    echo "  Le fichier a été modifié après son enregistrement. Opération refusée." >&2
    exit 2
  fi

  if [ "$in_ledger" = "t" ]; then
    [ "$CMD" = "status" ] && echo "skip   $base"
    skipped=$((skipped + 1))
    continue
  fi

  # ── Mode status : ne rien appliquer ───────────────────────────────────
  if [ "$CMD" = "status" ]; then
    echo "apply  $base"
    applied=$((applied + 1))
    continue
  fi

  # ── Application dans une transaction unique avec verrou advisory ───────
  # Construction d'un fichier SQL wrapper temporaire.
  # Le wrapper :
  #   1. Prend le verrou advisory (portée transaction → libéré au commit).
  #   2. Re-vérifie que la version n'est pas déjà appliquée (garde contre
  #      la concurrence entre le pré-check et l'acquisition du verrou).
  #   3. Vérifie l'absence de drift de checksum.
  #   4. Inclut le fichier de migration (\i).
  #   5. Enregistre dans les deux tables de suivi.
  # Tout cela est atomique : crash entre \i et INSERT → rollback complet.
  tmpf="$(mktemp --suffix=.sql)"
  # shellcheck disable=SC2064
  trap "rm -f '$tmpf'" EXIT

  # Note : la substitution psql (:'varname') n'opère pas dans les blocs
  # dollar-quotés. On utilise donc les valeurs bash déjà substituées dans le
  # heredoc pour les paramètres connus au moment de l'écriture du wrapper.
  cat > "$tmpf" << WRAPPER_SQL
-- Wrapper atomique pour : ${base}
-- Verrou advisory transaction-scoped : PERFORM dans DO pour éviter l'affichage.
DO \$lock\$ BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('myko_schema_migrations'));
END \$lock\$;

-- Re-check dans le verrou (protection contre les races).
-- \gset capture la ligne de résultat sans l'afficher.
SELECT
  EXISTS(
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version = '${version}'
  ) AS should_skip
\gset

-- Vérification drift de checksum dans le verrou.
-- Toutes les valeurs sont substituées par bash pour éviter les problèmes de
-- substitution de variables psql dans les blocs dollar-quotés.
-- La collision de version (deux fichiers avec le meme prefixe) n'est pas un drift :
-- on ne souleve une exception que si le champ name enregistre correspond a ce fichier.
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
  -- Déjà appliqué (race condition gérée), rien à faire.
  SELECT 'skip (race)' AS migration_result;
\else
\i ${f}
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

# ── Résumé ─────────────────────────────────────────────────────────────────
if [ "$CMD" = "status" ]; then
  echo "status : ${applied} à appliquer, ${skipped} déjà présentes."
else
  echo "migrations : ${applied} appliquées, ${skipped} déjà présentes."
fi
