#!/usr/bin/env bash
# ============================================================================
# reconcile-ledger.sh — Réconcilie le ledger de migrations avec le manifest
# ============================================================================
# CONTEXTE DU PROBLÈME
# --------------------
# Le ledger Supabase (supabase_migrations.schema_migrations) enregistre les
# migrations sous des timestamps différents de ceux des fichiers GitHub. De
# plus, certaines migrations ont été appliquées via execute_sql (ad-hoc) et
# sont donc absentes du ledger. Si on exécute apply-migrations.sh sans passer
# par ce script, il rejouerait des migrations déjà appliquées — ce qui est
# dangereux pour celles qui contiennent des opérations non idempotentes.
#
# CE SCRIPT FAIT
# --------------
# Pour chaque migration apply+baseline (trust/ledger_match/verify_objects)
# dont le github_version N'EST PAS encore dans schema_migrations :
#
#   ledger_match  : vérifie que historical_version existe dans le ledger ;
#                   enregistre le github_version + sha256 sans réapplication.
#
#   verify_objects : vérifie que chaque objet marqueur existe en base ;
#                   si tous présents → enregistre sans réapplication ;
#                   si un manque → AVERTISSEMENT, laissé pour apply réel.
#
#   trust          : enregistre directement (migrations pré-V2, historiquement
#                   appliquées depuis des années).
#
#   new            : ignoré (laissé pour apply-migrations.sh).
#
# Toutes les écritures se font dans UNE transaction atomique avec verrou
# advisory : schema_migrations + ops.schema_migration_checksums ensemble.
#
# Usage :
#   DATABASE_URL=postgres://... bash reconcile-ledger.sh [apply|--dry-run]
#
#   apply (défaut) : reconcile réel.
#   --dry-run      : affiche le plan, ne modifie rien, sort 0.
#
# Critères de succès après un apply réel :
#   - Chaque github_version de non-rollback est dans schema_migrations.
#   - Un apply-migrations.sh subséquent ne voit que les migrations post-snapshot.
#   - Un second apply-migrations.sh rapporte 0 appliquées.
# ============================================================================
set -euo pipefail

# ── Résolution des chemins ───────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$SCRIPT_DIR/migration-manifest.json"

# ── Arguments ────────────────────────────────────────────────────────────────
CMD="${1:-apply}"
[ "$CMD" = "--dry-run" ] && MODE="dry-run" || MODE="apply"

: "${DATABASE_URL:?DATABASE_URL est requis (postgres://...)}"

if [ ! -f "$MANIFEST" ]; then
  echo "ERREUR : manifest introuvable : $MANIFEST" >&2
  echo "  Générer avec : node scripts/db/build-manifest.mjs" >&2
  exit 1
fi

# Vérifie la disponibilité de jq (requis pour parser le manifest JSON).
if ! command -v jq &>/dev/null; then
  echo "ERREUR : jq est requis (apt install jq)" >&2
  exit 1
fi

# ── Bootstrap des tables de suivi (idempotent) ───────────────────────────────
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

echo "=== Reconcile du ledger de migrations (mode: $MODE) ==="
[ "$MODE" = "dry-run" ] && echo "  (Dry-run : aucune modification en base)"
echo ""

recorded=0
skipped=0
warnings=0
errors=0

# ── Lecture du manifest : seulement les entrées apply+baseline non-null ───────
while IFS= read -r entry; do
  github_version="$(echo "$entry" | jq -r '.github_version')"
  name="$(echo "$entry" | jq -r '.name')"
  sha256="$(echo "$entry" | jq -r '.sha256')"
  baseline="$(echo "$entry" | jq -r '.baseline')"
  historical_version="$(echo "$entry" | jq -r '.historical_version // ""')"
  file="$(echo "$entry" | jq -r '.file')"

  # ── Déjà reconcilié (github_version dans schema_migrations) ? ─────────────
  present="$(psql "$DATABASE_URL" -tAq \
    -c "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='${github_version}' LIMIT 1" \
    | tr -d '[:space:]')"
  if [ "$present" = "1" ]; then
    echo "skip   $file (github_version déjà dans le ledger)"
    skipped=$((skipped + 1))
    continue
  fi

  # ── Traitement selon le type de baseline ─────────────────────────────────
  case "$baseline" in

    # ── ledger_match ─────────────────────────────────────────────────────────
    # La migration est dans le ledger sous une version historique différente.
    # Vérification : historical_version doit être dans schema_migrations.
    ledger_match)
      if [ -z "$historical_version" ]; then
        echo "ERREUR interne : ledger_match sans historical_version pour $file" >&2
        errors=$((errors + 1))
        continue
      fi

      hist_present="$(psql "$DATABASE_URL" -tAq \
        -c "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='${historical_version}' LIMIT 1" \
        | tr -d '[:space:]')"

      if [ "$hist_present" != "1" ]; then
        echo "ERREUR : version historique ${historical_version} absente du ledger pour $file" >&2
        echo "  La migration aurait dû être appliquée sous cette version sur prod." >&2
        echo "  Investigation manuelle requise avant de poursuivre." >&2
        errors=$((errors + 1))
        continue
      fi

      if [ "$MODE" = "dry-run" ]; then
        echo "would_record [ledger_match] $file"
        echo "  historical=${historical_version} → github=${github_version}"
        recorded=$((recorded + 1))
        continue
      fi

      echo "record [ledger_match] $file (hist=${historical_version})"
      ;;

    # ── verify_objects ────────────────────────────────────────────────────────
    # Appliquée via execute_sql, absente du ledger.
    # On confirme que les objets marqueurs existent, puis on enregistre.
    verify_objects)
      expected_objects_json="$(echo "$entry" | jq -c '.expected_objects')"
      obj_count="$(echo "$expected_objects_json" | jq 'length')"

      all_ok=true
      missing_obj=""

      if [ "$obj_count" -gt 0 ]; then
        while IFS= read -r obj; do
          [ -z "$obj" ] && continue
          obj_type="$(echo "$obj" | jq -r '.type')"
          obj_schema="$(echo "$obj" | jq -r '.schema')"
          obj_name="$(echo "$obj" | jq -r '.name')"
          obj_table="$(echo "$obj" | jq -r '.table // ""')"

          case "$obj_type" in
            function)
              exists="$(psql "$DATABASE_URL" -tAq \
                -c "SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='${obj_schema}' AND p.proname='${obj_name}' LIMIT 1" \
                | tr -d '[:space:]')"
              ;;
            table)
              exists="$(psql "$DATABASE_URL" -tAq \
                -c "SELECT 1 FROM pg_tables WHERE schemaname='${obj_schema}' AND tablename='${obj_name}' LIMIT 1" \
                | tr -d '[:space:]')"
              ;;
            column)
              exists="$(psql "$DATABASE_URL" -tAq \
                -c "SELECT 1 FROM information_schema.columns WHERE table_schema='${obj_schema}' AND table_name='${obj_table}' AND column_name='${obj_name}' LIMIT 1" \
                | tr -d '[:space:]')"
              ;;
            trigger)
              exists="$(psql "$DATABASE_URL" -tAq \
                -c "SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='${obj_schema}' AND t.tgname='${obj_name}' LIMIT 1" \
                | tr -d '[:space:]')"
              ;;
            policy)
              exists="$(psql "$DATABASE_URL" -tAq \
                -c "SELECT 1 FROM pg_policies WHERE schemaname='${obj_schema}' AND policyname='${obj_name}' LIMIT 1" \
                | tr -d '[:space:]')"
              ;;
            *)
              echo "  AVERTISSEMENT : type d'objet inconnu '$obj_type' dans $file" >&2
              exists=""
              ;;
          esac

          if [ "$exists" != "1" ]; then
            all_ok=false
            missing_obj="${obj_type} ${obj_schema}.${obj_name}"
            break
          fi
        done < <(echo "$expected_objects_json" | jq -c '.[]' 2>/dev/null)
      fi

      if [ "$all_ok" = "false" ]; then
        echo "AVERTISSEMENT : $file non-baseable — objet manquant : ${missing_obj}" >&2
        echo "  La migration sera tentée par apply-migrations.sh (traitement réel)." >&2
        warnings=$((warnings + 1))
        continue
      fi

      if [ "$MODE" = "dry-run" ]; then
        echo "would_record [verify_objects] $file (${obj_count} objet(s) vérifiés)"
        recorded=$((recorded + 1))
        continue
      fi

      echo "record [verify_objects] $file (${obj_count} objet(s) vérifiés)"
      ;;

    # ── trust ─────────────────────────────────────────────────────────────────
    # Migrations pré-V2 : historiquement appliquées, on fait confiance sans vérif.
    trust)
      if [ "$MODE" = "dry-run" ]; then
        echo "would_record [trust] $file"
        recorded=$((recorded + 1))
        continue
      fi
      echo "record [trust] $file"
      ;;

    # ── new ───────────────────────────────────────────────────────────────────
    # Genuinement nouvelles : ignorées ici, réservées à apply-migrations.sh.
    new)
      echo "skip   $file (nouvelle migration — réservée pour apply)"
      skipped=$((skipped + 1))
      continue
      ;;

    *)
      echo "ERREUR interne : baseline inconnu '$baseline' pour $file" >&2
      errors=$((errors + 1))
      continue
      ;;
  esac

  # ── Enregistrement dans les deux tables (transaction atomique + verrou) ────
  # (Atteint seulement si MODE=apply et que la vérification a réussi.)
  # PERFORM dans un DO block pour éviter l'affichage du résultat du verrou advisory.
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q --single-transaction \
    -c "DO \$lock\$ BEGIN PERFORM pg_advisory_xact_lock(hashtext('myko_schema_migrations')); END \$lock\$;" \
    -c "INSERT INTO supabase_migrations.schema_migrations(version, name)
          VALUES ('${github_version}', '${name}')
          ON CONFLICT DO NOTHING;" \
    -c "INSERT INTO ops.schema_migration_checksums(version, name, sha256)
          VALUES ('${github_version}', '${name}', '${sha256}')
          ON CONFLICT DO NOTHING;"

  recorded=$((recorded + 1))

done < <(jq -c '.[] | select(.role == "apply" and .baseline != null)' "$MANIFEST")

# ── Résumé ─────────────────────────────────────────────────────────────────
echo ""
echo "reconcile : ${recorded} enregistrées, ${skipped} ignorées, ${warnings} avertissements."

if [ "$errors" -gt 0 ]; then
  echo "ERREUR : ${errors} entrée(s) en erreur — reconcile incomplet." >&2
  exit 4
fi
