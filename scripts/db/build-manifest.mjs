#!/usr/bin/env node
/**
 * build-manifest.mjs — Génère scripts/db/migration-manifest.json
 * depuis les fichiers supabase/migrations/ + la carte de correspondance historique.
 *
 * Usage :
 *   node scripts/db/build-manifest.mjs
 *
 * Reproductible : la sortie ne dépend que des fichiers .sql présents dans
 * supabase/migrations/ et des cartes hardcodées dans ce script.
 * Recalcule les sha256 à chaque exécution.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const MIGRATIONS_DIR = resolve(REPO_ROOT, 'supabase/migrations');
const OUTPUT_FILE = resolve(__dirname, 'migration-manifest.json');

// ── Carte de correspondance : github_version → version historique dans le ledger ──
// Source : export prod du 2026-07-15, vérifié manuellement.
// Ces migrations ont été appliquées sous un timestamp différent de leur préfixe de fichier
// (renommage post-apply lors de la restructuration du dépôt).
const LEDGER_MATCH = {
  '20260714200001': '20260714133658', // v2_0001_schemas_and_roles
  '20260714200002': '20260714133728', // v2_0002_ops_provenance
  '20260714200003': '20260714133812', // v2_0003_catalog_food_model
  '20260714200004': '20260714133854', // v2_0004_culinary_model
  '20260714200005': '20260714133939', // v2_0005_rls_and_grants
  '20260714210001': '20260714145929', // v2_commercial_scan_rpc
  '20260714220001': '20260714151219', // v2_release_integrity_and_confidence
  '20260714220002': '20260714151408', // v2_atomic_release_functions
  '20260714220003': '20260714152756', // v2_retract_premature_f0
  '20260714220004': '20260714153652', // v2_f0_provenance
  '20260714220005': '20260714153956', // v1_lock_reference_writes
  '20260714220008': '20260714155027', // v1_revert_reference_writes
};

// Migrations appliquées via execute_sql ad-hoc : absentes du ledger Supabase.
// Les objets listés ici servent de marqueurs pour confirmer l'application en prod.
// Le script reconcile-ledger.sh vérifie leur existence avant d'enregistrer la version.
const VERIFY_OBJECTS = {
  // Migration DML-only (UPDATE sur catalog) — vérifier que les tables cibles existent.
  '20260714220006': [
    { type: 'table', schema: 'catalog', name: 'food_forms' },
  ],
  // Garde-fous de publication — marqueur : fonction ops.confidence_rank + publish.
  '20260714230001': [
    { type: 'function', schema: 'ops', name: 'confidence_rank' },
    { type: 'function', schema: 'ops', name: 'publish_catalog_release' },
  ],
  // Immuabilité enfants — marqueur : triggers trg_*_immutable sur les tables recette.
  '20260714230002': [
    { type: 'trigger', schema: 'culinary', name: 'trg_recipe_steps_immutable', table: 'recipe_steps' },
    { type: 'trigger', schema: 'culinary', name: 'trg_recipe_components_immutable', table: 'recipe_components' },
  ],
  // Nutrition étiquette commerciale — marqueur : colonne is_composite.
  '20260714230003': [
    { type: 'column', schema: 'catalog', name: 'is_composite', table: 'commercial_products' },
  ],
  // Socle sensoriel V3 appliqué avant le snapshot du catalogue opérationnel.
  '20260715170000': [
    { type: 'column', schema: 'culinary', name: 'sensory_profile', table: 'recipe_families' },
    { type: 'column', schema: 'culinary', name: 'planning_eligible', table: 'recipe_versions' },
    { type: 'column', schema: 'culinary', name: 'variant_candidates', table: 'recipe_versions' },
  ],
};

// Versions genuinement nouvelles (non appliquées en prod au 2026-07-15).
// Migrations postérieures au snapshot de production simulé par la CI.
const NEW_VERSIONS = new Set([
  '20260715090001', // v2_immutability_full
  '20260715090002', // v2_publish_release_exclusive
  '20260715090003', // v2_catalog_active_release_rls
  '20260715090004', // v2_off_label_completeness
  '20260715190000', // v3_operational_recipe_api
  '20260715214547', // complete_recipe_catalog_v3
  '20260715221042', // repair_recipe_corpus_v3_utf8
  '20260715221509', // recipe_catalog_v3_indexes
]);

// Objets attendus après application des nouvelles migrations (pour assertions CI).
const NEW_EXPECTED_OBJECTS = {
  '20260715090001': [
    { type: 'function', schema: 'culinary', name: 'family_has_published_version' },
    { type: 'trigger', schema: 'culinary', name: 'trg_recipe_variation_axes_immutable', table: 'recipe_variation_axes' },
    { type: 'trigger', schema: 'culinary', name: 'trg_recipe_variation_options_immutable', table: 'recipe_variation_options' },
  ],
  '20260715090002': [
    { type: 'function', schema: 'ops', name: 'publish_catalog_release' },
    { type: 'function', schema: 'ops', name: 'rollback_catalog_release' },
  ],
  '20260715090003': [
    { type: 'function', schema: 'catalog', name: 'is_in_active_release' },
    { type: 'policy', schema: 'catalog', name: 'p_food_forms_read', table: 'food_forms' },
  ],
  '20260715090004': [
    { type: 'column', schema: 'catalog', name: 'label_nutrition_complete', table: 'commercial_products' },
    { type: 'column', schema: 'catalog', name: 'label_nutrition_review_status', table: 'commercial_products' },
  ],
  '20260715190000': [
    { type: 'function', schema: 'public', name: 'get_operational_recipe_catalog_v3' },
  ],
  '20260715214547': [
    { type: 'function', schema: 'public', name: 'get_editorial_recipe_catalog_v3' },
    { type: 'column', schema: 'culinary', name: 'source_name', table: 'recipe_ingredient_requirements' },
    { type: 'column', schema: 'culinary', name: 'yield_quantity', table: 'recipe_versions' },
    { type: 'column', schema: 'culinary', name: 'required_quantity', table: 'recipe_components' },
  ],
};

// ── Fonctions utilitaires ─────────────────────────────────────────────────────

function sha256(filepath) {
  // Git stocke les migrations avec des fins de ligne LF. Normaliser ici évite
  // qu'un manifest généré depuis Windows contienne des empreintes CRLF qui
  // dérivent ensuite lors du checkout Linux de la CI.
  const content = readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Extrait le préfixe de version depuis le basename sans extension.
 * Ex : "20260714200001_v2_0001_schemas_and_roles" → "20260714200001"
 *      "001_shelf_life_after_opening"              → "001"
 *      "003b_trigger_auto_user_id"                 → "003b"
 */
function extractVersion(base) {
  const idx = base.indexOf('_');
  return idx === -1 ? base : base.slice(0, idx);
}

/**
 * Extrait le nom lisible (tout après la version + premier underscore).
 * Ex : "20260714200001_v2_0001_schemas_and_roles" → "v2_0001_schemas_and_roles"
 */
function extractName(base, version) {
  return base.slice(version.length + 1);
}

function isRollback(base) {
  return base.endsWith('_rollback');
}

/**
 * Détermine le role et le baseline d'une entrée.
 */
function classify(version, rollback) {
  if (rollback) return { role: 'rollback', baseline: null };
  if (NEW_VERSIONS.has(version)) return { role: 'apply', baseline: 'new' };
  if (LEDGER_MATCH[version]) return { role: 'apply', baseline: 'ledger_match' };
  if (VERIFY_OBJECTS[version]) return { role: 'apply', baseline: 'verify_objects' };
  // Tout le reste : migrations pré-V2 ou V2 intermédiaires — traitées comme "trust".
  return { role: 'apply', baseline: 'trust' };
}

// ── Construction du manifest ─────────────────────────────────────────────────

// Ordre lexicographique LC_ALL=C (identique à `find | LC_ALL=C sort`).
const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

const manifest = files.map(filename => {
  const base = filename.replace(/\.sql$/, '');
  const version = extractVersion(base);
  const rollback = isRollback(base);
  const name = extractName(base, version);
  const filepath = resolve(MIGRATIONS_DIR, filename);
  const hash = sha256(filepath);
  const { role, baseline } = classify(version, rollback);

  let expected_objects = [];
  if (baseline === 'verify_objects' && VERIFY_OBJECTS[version]) {
    expected_objects = VERIFY_OBJECTS[version];
  } else if (baseline === 'new' && NEW_EXPECTED_OBJECTS[version]) {
    expected_objects = NEW_EXPECTED_OBJECTS[version];
  }

  return {
    file: filename,
    github_version: version,
    name,
    sha256: hash,
    role,
    baseline,
    historical_version: LEDGER_MATCH[version] || null,
    expected_objects,
  };
});

writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest généré : ${manifest.length} entrées → ${OUTPUT_FILE}`);
