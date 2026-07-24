#!/usr/bin/env node
/**
 * build-manifest.mjs — Génère scripts/db/migration-manifest.json
 * depuis les fichiers supabase/migrations/ + la carte de correspondance historique.
 *
 * Usage : node scripts/db/build-manifest.mjs
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const MIGRATIONS_DIR = resolve(REPO_ROOT, 'supabase/migrations');
const OUTPUT_FILE = resolve(__dirname, 'migration-manifest.json');

const LEDGER_MATCH = {
  '20260714200001': '20260714133658',
  '20260714200002': '20260714133728',
  '20260714200003': '20260714133812',
  '20260714200004': '20260714133854',
  '20260714200005': '20260714133939',
  '20260714210001': '20260714145929',
  '20260714220001': '20260714151219',
  '20260714220002': '20260714151408',
  '20260714220003': '20260714152756',
  '20260714220004': '20260714153652',
  '20260714220005': '20260714153956',
  '20260714220008': '20260714155027',
};

const VERIFY_OBJECTS = {
  '20260714220006': [
    { type: 'table', schema: 'catalog', name: 'food_forms' },
  ],
  '20260714230001': [
    { type: 'function', schema: 'ops', name: 'confidence_rank' },
    { type: 'function', schema: 'ops', name: 'publish_catalog_release' },
  ],
  '20260714230002': [
    { type: 'trigger', schema: 'culinary', name: 'trg_recipe_steps_immutable', table: 'recipe_steps' },
    { type: 'trigger', schema: 'culinary', name: 'trg_recipe_components_immutable', table: 'recipe_components' },
  ],
  '20260714230003': [
    { type: 'column', schema: 'catalog', name: 'is_composite', table: 'commercial_products' },
  ],
  '20260715170000': [
    { type: 'column', schema: 'culinary', name: 'sensory_profile', table: 'recipe_families' },
    { type: 'column', schema: 'culinary', name: 'planning_eligible', table: 'recipe_versions' },
    { type: 'column', schema: 'culinary', name: 'variant_candidates', table: 'recipe_versions' },
  ],
};

const NEW_VERSIONS = new Set([
  '20260715090001',
  '20260715090002',
  '20260715090003',
  '20260715090004',
  '20260717000001',
  '20260717000002',
  '20260719000001',
  '20260721195504',
  '20260721210000',
  '20260721211500',
  '20260724000001',
  '20260715190000',
  '20260715214547',
  '20260715221042',
  '20260715221509',
  '20260716111718',
  '20260716152121',
  '20260716162509',
]);

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
  '20260716111718': [
    { type: 'table', schema: 'public', name: 'inventory_containers' },
  ],
  '20260716152121': [
    { type: 'function', schema: 'public', name: 'ensure_plan_validation_issue_message' },
    { type: 'trigger', schema: 'public', name: 'meal_plan_validation_issues_ensure_message', table: 'meal_plan_validation_issues' },
  ],
  '20260716162509': [
    { type: 'column', schema: 'public', name: 'canonical_recipe_code', table: 'nutrition_plan_meals' },
    { type: 'column', schema: 'public', name: 'canonical_recipe_execution_id', table: 'nutrition_plan_meals' },
    { type: 'column', schema: 'public', name: 'target_snapshot', table: 'nutrition_plan_meals' },
  ],
  '20260717000002': [
    { type: 'table', schema: 'public', name: 'planned_productions' },
    { type: 'table', schema: 'public', name: 'planned_consumptions' },
    { type: 'function', schema: 'public', name: 'set_planned_task_done' },
  ],
  '20260721195504': [
    { type: 'table', schema: 'public', name: 'planned_demands' },
    { type: 'function', schema: 'public', name: 'publish_canonical_final_demand_plan' },
    { type: 'function', schema: 'public', name: 'planning_schema_compatibility' },
    { type: 'column', schema: 'public', name: 'canonical_recipe_code', table: 'cooked_dishes' },
    { type: 'column', schema: 'public', name: 'exact_required_qty', table: 'nutrition_plan_shopping_items' },
    { type: 'trigger', schema: 'public', name: 'trg_sync_materialized_production_identity', table: 'planned_productions' },
  ],
  '20260721211500': [
    { type: 'index', schema: 'public', name: 'idx_planned_demands_slot_id', table: 'planned_demands' },
    { type: 'index', schema: 'public', name: 'idx_planned_demands_user_id', table: 'planned_demands' },
    { type: 'index', schema: 'public', name: 'idx_planned_productions_recipe_execution_id', table: 'planned_productions' },
    { type: 'index', schema: 'public', name: 'idx_cooked_dishes_canonical_recipe_execution_id', table: 'cooked_dishes' },
    { type: 'index', schema: 'public', name: 'idx_cooked_dishes_planned_production_id', table: 'cooked_dishes' },
    { type: 'index', schema: 'public', name: 'idx_cooked_dishes_source_plan_version_id', table: 'cooked_dishes' },
  ],
  '20260724000001': [
    { type: 'function', schema: 'public', name: 'planning_food_ban_fold' },
    { type: 'function', schema: 'public', name: 'planning_food_ban_matches' },
  ],
};

// Fichiers auxiliaires chargés dans la même transaction/version que le fichier
// principal. Ils participent à l'empreinte : toute dérive est donc détectée par
// apply-migrations.sh comme si le contrat P2 était monolithique.
const COMPOSITE_INCLUDES = {
  '20260717000002': [
    resolve(MIGRATIONS_DIR, 'includes/20260717000002_atomic_planned_task_materialization.sql'),
  ],
};

function sha256(filepath, version) {
  const hash = createHash('sha256');
  for (const file of [filepath, ...(COMPOSITE_INCLUDES[version] || [])]) {
    hash.update(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
  }
  return hash.digest('hex');
}

function extractVersion(base) {
  const idx = base.indexOf('_');
  return idx === -1 ? base : base.slice(0, idx);
}

function extractName(base, version) {
  return base.slice(version.length + 1);
}

function isRollback(base) {
  return base.endsWith('_rollback');
}

function classify(version, rollback) {
  if (rollback) return { role: 'rollback', baseline: null };
  if (NEW_VERSIONS.has(version)) return { role: 'apply', baseline: 'new' };
  if (LEDGER_MATCH[version]) return { role: 'apply', baseline: 'ledger_match' };
  if (VERIFY_OBJECTS[version]) return { role: 'apply', baseline: 'verify_objects' };
  return { role: 'apply', baseline: 'trust' };
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

// Quelques migrations historiques utilisent seulement YYYYMMDD comme préfixe
// et plusieurs fichiers partagent alors la même date. Le ledger a une clé
// primaire sur version : ces collisions doivent recevoir une version stable et
// unique. Pour elles uniquement, le basename complet devient la version. Les
// timestamps Supabase modernes (14 chiffres) restent inchangés.
const applyVersionCounts = new Map();
for (const filename of files) {
  const base = filename.replace(/\.sql$/, '');
  if (isRollback(base)) continue;
  const rawVersion = extractVersion(base);
  applyVersionCounts.set(rawVersion, (applyVersionCounts.get(rawVersion) || 0) + 1);
}

const manifest = files.map(filename => {
  const base = filename.replace(/\.sql$/, '');
  const rawVersion = extractVersion(base);
  const rollback = isRollback(base);
  const version = !rollback && applyVersionCounts.get(rawVersion) > 1 ? base : rawVersion;
  const name = extractName(base, rawVersion);
  const filepath = resolve(MIGRATIONS_DIR, filename);
  const hash = sha256(filepath, rawVersion);
  const { role, baseline } = classify(rawVersion, rollback);

  let expected_objects = [];
  if (baseline === 'verify_objects' && VERIFY_OBJECTS[rawVersion]) {
    expected_objects = VERIFY_OBJECTS[rawVersion];
  } else if (baseline === 'new' && NEW_EXPECTED_OBJECTS[rawVersion]) {
    expected_objects = NEW_EXPECTED_OBJECTS[rawVersion];
  }

  return {
    file: filename,
    github_version: version,
    name,
    sha256: hash,
    role,
    baseline,
    historical_version: LEDGER_MATCH[rawVersion] || null,
    expected_objects,
  };
});

const duplicateApplyVersions = Object.entries(
  Object.groupBy(manifest.filter(entry => entry.role === 'apply'), entry => entry.github_version),
).filter(([, entries]) => entries.length > 1);
if (duplicateApplyVersions.length > 0) {
  throw new Error(`Versions de migration encore dupliquées : ${duplicateApplyVersions.map(([v]) => v).join(', ')}`);
}

writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest généré : ${manifest.length} entrées → ${OUTPUT_FILE}`);
