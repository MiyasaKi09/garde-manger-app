/**
 * Fabrique V2 — chargeur du corpus recette scraped V1 (72 recettes candidates).
 * Réf. MYKO_DATA_FOUNDATION_V2 §8.
 *
 * Garanties :
 *  - Lit data/recipes/corpus-v1.json (réel) si présent, sinon corpus-v1.sample.json.
 *  - content_hash = md5 du contenu CANONIQUE COMPLET : famille, catégorie, portions,
 *    temps, difficulté, ingrédients ordonnés {forme normalisée, qty, unit, role, opt},
 *    étapes ordonnées {n, instruction}, techniques/variants/allergens TRIÉS (order-indep).
 *  - configuration_hash du run d'import = hash du corpus (union ordonnée des hashes).
 *  - Famille upsert par canonical_name_normalized ; meal_role déduit de category.
 *  - Un composant 'plat' (role 'main') par recette ; assaisonnements → component NULL.
 *  - preferred_food_form_id résolu par identité exacte (canonical_name_normalized)
 *    sur catalog.food_forms (status <> 'rejected').
 *  - quality.review_tasks (open) : missing_food_form par exigence non résolue ;
 *    unresolved_required_ingredient par recette bloquée ; variants_need_branch_modeling
 *    par recette avec variants non vides (low priority, non-bloquant).
 *  - provenance RÉÉCRITE (delete+insert) par version sur le champ 'content'.
 *  - SQL IDEMPOTENT : upsert familles/versions + purge des enfants + purge des tâches.
 *
 * N'applique RIEN en base : émet scripts/data/out/corpus-v1-load.sql (idempotent)
 * et scripts/data/out/corpus-v1-report.json.
 *
 * Usage : node scripts/data/recipes/build-corpus-v1.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const OUT  = join(__dirname, '..', 'out')

// ── Chargement du corpus (réel > sample) ─────────────────────────────────────
const realPath   = join(ROOT, 'data', 'recipes', 'corpus-v1.json')
const samplePath = join(ROOT, 'data', 'recipes', 'corpus-v1.sample.json')
const corpusPath = existsSync(realPath) ? realPath : samplePath
const corpus     = JSON.parse(readFileSync(corpusPath, 'utf8'))
const usingReal  = corpusPath === realPath
console.error(`Corpus : ${corpusPath} (${usingReal ? 'réel' : 'sample'})`)

// ── Chargement du corpus F0 pour la résolution anticipée des formes ───────────
// (résolution statique au moment de la génération du rapport)
const f0RealPath   = join(ROOT, 'data', 'foods', 'f0-corpus.json')
const f0SamplePath = join(ROOT, 'data', 'foods', 'f0-corpus.sample.json')
const f0CorpusPath = existsSync(f0RealPath) ? f0RealPath : f0SamplePath
const f0Corpus     = JSON.parse(readFileSync(f0CorpusPath, 'utf8'))

/** Ensemble des formes F0 normalisées déjà dans le catalogue. */
const f0KnownForms = new Set()
for (const concept of f0Corpus.concepts) {
  for (const form of concept.forms) {
    f0KnownForms.add(normalizeName(form.canonical_name))
  }
}

// ── Helpers SQL ───────────────────────────────────────────────────────────────
const q       = (s) => `'${String(s).replace(/'/g, "''")}'`
const qn      = (s) => (s === null || s === undefined ? 'NULL' : q(s))
const num     = (v) => (v === null || v === undefined ? 'NULL' : Number(v))
const jsonLit = (o) => `${q(JSON.stringify(o))}::jsonb`

// ── Détection d'un assaisonnement pur (sel / poivre / épices) ─────────────────
// N'est appliqué que si l'ingrédient est aussi optional=true (§8.4).
const SEASONING_KEYWORDS = [
  'sel', 'poivre', 'piment', 'muscade', 'curcuma', 'paprika',
  'cannelle', 'cumin', 'cardamome', 'girofle', 'safran', 'curry',
  'ras el hanout', 'cinq epice', 'epice', 'quatre epice',
  'herbes de provence', 'herbe de provence',
]

export function isSeasoning(formNorm) {
  return SEASONING_KEYWORDS.some((kw) => formNorm.includes(kw))
}

// ── Correspondance catégorie → meal_role (best-effort) ───────────────────────
const CATEGORY_MEAL_ROLE = {
  'plat mijote':         'diner',
  'plat en sauce':       'diner',
  'plat complet':        'diner',
  'plat bouilli':        'diner',
  'curry vegetarien':    'diner',
  'legumineuses':        'diner',
  'legumes mijoter':     'diner',
  'cereales et legumes': 'diner',
  'tarte salee':         'diner',
  'pizza':               'diner',
  'gratin complet':      'diner',
  'gratin de legumes':   'diner',
  'roti':                'diner',
  'viande en sauce':     'diner',
  'poisson':             'diner',
  'boulettes':           'diner',
  'boulettes vegetales': 'diner',
  'riz cremeux':         'diner',
  'pates':               'diner',
  'pates en sauce':      'diner',
  'pates au four':       'diner',
  'soupe':               'dejeuner',
  'soupe complete':      'dejeuner',
  'salade':              'dejeuner',
  'salade complete':     'dejeuner',
  'entree':              'dejeuner',
  'oeufs':               'dejeuner',
  'oeufs et tomate':     'dejeuner',
  'cake sale':           'dejeuner',
  'pate a choux salee':  'dejeuner',
  'sandwich chaud':      'dejeuner',
  'petit dejeuner':      'petit-dejeuner',
  'dessert et petit dejeuner': 'petit-dejeuner',
}

/** Déduit le meal_role d'une catégorie (null si non mappée). */
function mealRoleFromCategory(category) {
  if (!category) return null
  const key = normalizeName(category)
  return CATEGORY_MEAL_ROLE[key] ?? null
}

// ── Représentation canonique déterministe (base du content_hash) ─────────────
// Garanties d'order-independence : techniques, variants, allergens TRIÉS.
// Ingrédients ordonnés par position (index 0-based → position dans la liste).
// Étapes ordonnées par numéro de step.
export function canonicalRecipeV1(r) {
  const ings = (r.ingredients || []).map((ing, idx) => ({
    pos:  idx + 1,
    form: normalizeName(ing.form || ''),
    qty:  ing.quantity,
    unit: ing.unit || '',
    role: normalizeName(ing.role || ''),
    opt:  !!ing.optional,
  }))
  const steps = (r.steps || [])
    .map((s) => ({ n: s.n, i: s.instruction || '' }))
    .sort((a, b) => a.n - b.n)
  const techniques = (r.techniques || []).map(normalizeName).sort()
  const variants   = (r.variants   || []).map(normalizeName).sort()
  const allergens  = (r.allergens  || []).map(normalizeName).sort()

  return JSON.stringify({
    family:     normalizeName(r.family),
    category:   normalizeName(r.category || ''),
    servings:   r.servings,
    prep:       r.prep_minutes  ?? null,
    cook:       r.cook_minutes  ?? null,
    difficulty: r.difficulty    ?? null,
    ings,
    steps,
    techniques,
    variants,
    allergens,
  })
}

/** content_hash = md5 hex du contenu canonique complet. */
const contentHash  = (r) => createHash('md5').update(canonicalRecipeV1(r)).digest('hex')

/** configuration_hash = md5 hex de l'union ordonnée des hashes (identité du corpus). */
const corpusHash   = createHash('md5')
  .update(corpus.recipes.map(contentHash).sort().join(','))
  .digest('hex')

/** Sous-requête SQL de résolution d'une forme par canonical_name_normalized exact. */
function exactFormSql(formNorm) {
  return `(SELECT ff.id FROM catalog.food_forms ff
              WHERE ff.status <> 'rejected'
                AND ff.canonical_name_normalized = ${q(formNorm)}
              ORDER BY ff.canonical_name_normalized LIMIT 1)`
}

// ── Construction du SQL ───────────────────────────────────────────────────────
let sql = `-- Chargement corpus-v1 (recettes candidates scraped). Généré par build-corpus-v1.mjs. IDEMPOTENT.
-- corpus_hash = ${corpusHash}
-- recipes     = ${corpus.recipes.length}

-- Source de données editoriale scrappée (myko_editorial_scraped_v1)
INSERT INTO ops.source_datasets
  (code, name, publisher, source_url, license_code, allowed_uses, update_strategy, current_version, last_checked_at)
VALUES
  ('myko_editorial_scraped_v1',
   'Corpus recettes scraped V1 (éditorial Myko)',
   'Myko',
   'internal',
   'editorial',
   '{"store_raw":true,"redistribute":false,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
   'manual',
   'scraped-v1',
   now())
ON CONFLICT (code) DO UPDATE SET last_checked_at = now();

-- Run d'import : identifié par le hash du corpus (corpus modifié => nouveau run).
INSERT INTO ops.import_runs
  (source_dataset_id, source_version, code_version, configuration_hash, status,
   started_at, completed_at, candidate_count)
SELECT sd.id, 'scraped-v1', 'corpus-v1-loader-1.0', ${q(corpusHash)},
       'completed', now(), now(), ${corpus.recipes.length}
FROM   ops.source_datasets sd
WHERE  sd.code = 'myko_editorial_scraped_v1'
  AND  NOT EXISTS (
         SELECT 1 FROM ops.import_runs r
         WHERE  r.configuration_hash = ${q(corpusHash)}
       );
`

// ── Génération par recette ─────────────────────────────────────────────────────
for (const recipe of corpus.recipes) {
  const famNorm  = normalizeName(recipe.family)
  const hash     = contentHash(recipe)
  const mealRole = mealRoleFromCategory(recipe.category)
  const srcKey   = `scraped-v1:${recipe.code}`

  sql += `
DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp uuid;
BEGIN
`

  // ── 1. Famille : upsert par canonical_name_normalized ───────────────────────
  sql += `  -- §8.1 Famille de recettes
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, meal_role, dish_structure, status, confidence_level)
  VALUES
    (${q(recipe.family)}, ${q(famNorm)}, ${qn(mealRole)}, ${q(recipe.category)}, 'candidate', ${q(recipe.confidence)})
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET meal_role        = EXCLUDED.meal_role,
        dish_structure   = EXCLUDED.dish_structure,
        confidence_level = EXCLUDED.confidence_level,
        updated_at       = now()
  RETURNING id INTO v_fam;

`

  // ── 2. Version v1 : upsert par (recipe_family_id, version_number) ───────────
  sql += `  -- §8.2 Version de recette (draft, candidate)
  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes,
     difficulty, quality_level, publication_status, content_hash)
  SELECT
    v_fam, 1, ${q(recipe.family)}, sd.id, ${q(srcKey)},
    'Myko', 'editorial', ${num(recipe.servings)}, ${num(recipe.prep_minutes)}, ${num(recipe.cook_minutes)},
    ${qn(recipe.difficulty)}, ${q(recipe.confidence)}, 'draft', ${q(hash)}
  FROM ops.source_datasets sd
  WHERE sd.code = 'myko_editorial_scraped_v1'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE
    SET title              = EXCLUDED.title,
        servings           = EXCLUDED.servings,
        prep_minutes       = EXCLUDED.prep_minutes,
        cook_minutes       = EXCLUDED.cook_minutes,
        difficulty         = EXCLUDED.difficulty,
        quality_level      = EXCLUDED.quality_level,
        content_hash       = EXCLUDED.content_hash,
        source_license     = EXCLUDED.source_license
  RETURNING id INTO v_ver;

`

  // ── 3. Provenance RÉÉCRITE (delete+insert) ──────────────────────────────────
  sql += `  -- §8.5 Provenance du champ 'content' (réécrite à chaque rechargement)
  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary'
    AND entity_table  = 'recipe_versions'
    AND entity_id     = v_ver
    AND field_name    = 'content';

  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  SELECT
    'culinary', 'recipe_versions', v_ver, 'content',
    sd.id, ${q(srcKey)}, to_jsonb(${q(hash)}::text),
    'myko_editorial_scraped_v1_recipe',
    run.id, true
  FROM ops.source_datasets sd,
       (SELECT id FROM ops.import_runs
        WHERE  configuration_hash = ${q(corpusHash)} LIMIT 1) run
  WHERE sd.code = 'myko_editorial_scraped_v1';

`

  // ── Purge des enfants et des tâches de révision (idempotence) ───────────────
  sql += `  -- Purge idempotente : tâches de révision puis enfants
  -- Tâches liées aux exigences de cette version (avant de supprimer les exigences)
  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_ver
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id   = req.id;

  -- Tâches liées directement à cette version
  DELETE FROM quality.review_tasks
  WHERE entity_type = 'recipe_version'
    AND entity_id   = v_ver;

  -- Enfants culinaires (ordre de dépendance FK)
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_ver;
  DELETE FROM culinary.recipe_steps                   WHERE recipe_version_id = v_ver;
  DELETE FROM culinary.recipe_components              WHERE recipe_version_id = v_ver;

`

  // ── 3. Composant unique 'plat' ───────────────────────────────────────────────
  sql += `  -- §8.3 Composant principal de la recette ('plat', role 'main')
  INSERT INTO culinary.recipe_components
    (recipe_version_id, name, component_role, position)
  VALUES (v_ver, 'plat', 'main', 1)
  RETURNING id INTO v_comp;

`

  // ── 4. Exigences d'ingrédients ───────────────────────────────────────────────
  sql += `  -- §8.4 Exigences d'ingrédients\n`
  const reqIngredients   = recipe.ingredients.filter((i) => !i.optional || !isSeasoning(normalizeName(i.form || '')))
  const seasonIngredients = recipe.ingredients.filter((i) => i.optional && isSeasoning(normalizeName(i.form || '')))

  for (const [idx, ing] of recipe.ingredients.entries()) {
    const formNorm   = normalizeName(ing.form || '')
    const isSeason   = ing.optional && isSeasoning(formNorm)
    const reqType    = isSeason ? 'seasoning_to_taste' : 'exact_form'
    const strictness = ing.optional ? 'optional' : 'required'
    const compVar    = isSeason ? 'NULL' : 'v_comp'
    const pref       = formNorm ? exactFormSql(formNorm) : 'NULL'
    const pos        = idx + 1

    sql += `  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_ver, ${compVar}, ${q(reqType)}, ${pref},
     ${num(ing.quantity)}, ${q(ing.unit)}, ${q(strictness)},
     ${qn(normalizeName(ing.role || ''))}, ${ing.optional ? 'true' : 'false'}, ${pos});

`
  }

  // ── Étapes ──────────────────────────────────────────────────────────────────
  sql += `  -- §8.4 (suite) Étapes de préparation\n`
  for (const step of (recipe.steps || []).sort((a, b) => a.n - b.n)) {
    sql += `  INSERT INTO culinary.recipe_steps
    (recipe_version_id, step_number, instruction)
  VALUES (v_ver, ${step.n}, ${q(step.instruction)});

`
  }

  // ── 6. Tâches de révision ────────────────────────────────────────────────────
  sql += `  -- §8.6 Tâches de révision qualité (open)\n`

  // missing_food_form : une tâche par exigence non résolue
  for (const [idx, ing] of recipe.ingredients.entries()) {
    const formNorm = normalizeName(ing.form || '')
    const pos      = idx + 1
    const priority = ing.optional ? 3 : 2

    sql += `  -- Tâche missing_food_form si la forme « ${ing.form} » est absente du catalogue
  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT
    'recipe_ingredient_requirement',
    req.id,
    'missing_food_form',
    ${priority},
    ARRAY['form_not_in_catalog'],
    jsonb_build_object(
      'form',            ${q(ing.form)},
      'form_normalized', ${q(formNorm)},
      'recipe_family',   ${q(recipe.family)},
      'recipe_code',     ${q(recipe.code)},
      'position',        ${pos},
      'is_optional',     ${ing.optional ? 'true' : 'false'},
      'note',            'Forme non résolue dans catalog.food_forms à la date du chargement.'
    ),
    'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_ver
    AND req.position = ${pos}
    AND NOT EXISTS (
      SELECT 1 FROM catalog.food_forms ff
      WHERE ff.status <> 'rejected'
        AND ff.canonical_name_normalized = ${q(formNorm)}
    );

`
  }

  // unresolved_required_ingredient : bloquant si au moins une exigence required non résolue
  sql += `  -- Tâche bloquante si ≥ 1 exigence required sans forme résolue
  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT
    'recipe_version',
    v_ver,
    'unresolved_required_ingredient',
    1,
    ARRAY['blocking_form_missing'],
    jsonb_build_object(
      'recipe_family', ${q(recipe.family)},
      'recipe_code',   ${q(recipe.code)},
      'note',          'Au moins un ingrédient required non résolu bloque la publication.'
    ),
    'open'
  WHERE EXISTS (
    SELECT 1 FROM culinary.recipe_ingredient_requirements req
    WHERE  req.recipe_version_id    = v_ver
      AND  req.strictness           = 'required'
      AND  req.preferred_food_form_id IS NULL
  );

`

  // variants_need_branch_modeling : non-bloquant si variants non vide
  if ((recipe.variants || []).length > 0) {
    sql += `  -- Tâche non-bloquante : variants non vides à modéliser en branches (§8.6)
  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_ver, 'variants_need_branch_modeling', 5,
     ARRAY['variants_not_modeled'],
     jsonb_build_object(
       'recipe_family', ${q(recipe.family)},
       'recipe_code',   ${q(recipe.code)},
       'variants',      ${jsonLit(recipe.variants)},
       'note',          'Variantes déclarées ; modélisation en recipe_instruction_branches différée.'
     ),
     'open');

`
  }

  sql += `END $$;\n`
}

// ── Rapport JSON ──────────────────────────────────────────────────────────────
// Résolution statique : cross-référencement avec le corpus F0 au moment du build.
const allFormMap  = new Map() // normName → { name, recipes: [], required: bool }
const reqFormSet  = new Set()

for (const recipe of corpus.recipes) {
  for (const ing of recipe.ingredients) {
    const n = normalizeName(ing.form || '')
    if (!n) continue
    if (!allFormMap.has(n)) allFormMap.set(n, { name: ing.form, recipes: [], required: false })
    const entry = allFormMap.get(n)
    entry.recipes.push(recipe.family)
    if (!ing.optional) {
      entry.required = true
      reqFormSet.add(n)
    }
  }
}

const formsResolved = []
const formsMissing  = []
for (const [n, info] of allFormMap) {
  if (f0KnownForms.has(n)) formsResolved.push({ form: info.name, recipe_count: info.recipes.length, required: info.required })
  else                     formsMissing.push({ form: info.name, recipe_count: info.recipes.length, required: info.required })
}
formsResolved.sort((a, b) => a.form.localeCompare(b.form))
formsMissing.sort((a, b) => a.form.localeCompare(b.form))

// Estimation du nombre de tâches de révision
// missing_food_form : une par ingrédient × recette (pas par forme unique)
let missingFormTaskCount = 0
for (const recipe of corpus.recipes) {
  for (const ing of recipe.ingredients) {
    const n = normalizeName(ing.form || '')
    if (n && !f0KnownForms.has(n)) missingFormTaskCount++
  }
}
// unresolved_required_ingredient : une par recette avec ≥ 1 required non résolu
let blockingTaskCount = 0
for (const recipe of corpus.recipes) {
  const hasUnresolved = recipe.ingredients.some(
    (i) => !i.optional && !f0KnownForms.has(normalizeName(i.form || ''))
  )
  if (hasUnresolved) blockingTaskCount++
}
// variants_need_branch_modeling : une par recette avec variants non vides
const variantTaskCount = corpus.recipes.filter((r) => (r.variants || []).length > 0).length

const report = {
  corpus_version:         corpus.corpus_version,
  corpus_hash:            corpusHash,
  using_real_corpus:      usingReal,
  recipe_count:           corpus.recipes.length,
  distinct_required_forms: reqFormSet.size,
  total_distinct_forms:   allFormMap.size,
  forms_resolved_count:   formsResolved.length,
  forms_missing_count:    formsMissing.length,
  forms_resolved:         formsResolved,
  forms_missing:          formsMissing,
  review_tasks_estimate: {
    missing_food_form:                missingFormTaskCount,
    unresolved_required_ingredient:   blockingTaskCount,
    variants_need_branch_modeling:    variantTaskCount,
    total:                            missingFormTaskCount + blockingTaskCount + variantTaskCount,
  },
  note: [
    'forms_resolved/forms_missing établis par cross-référencement statique avec le corpus F0',
    '(fichier f0-corpus.json). Les comptes SQL réels peuvent différer si le catalogue',
    'a été enrichi entre la génération et l\'exécution du SQL.',
    'En CI (base fraîche + F0 seul), les formes manquantes correspondent au backlog de review_tasks.',
  ].join(' '),
}

// ── Émission des fichiers ─────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'corpus-v1-load.sql'),    sql)
writeFileSync(join(OUT, 'corpus-v1-report.json'), JSON.stringify(report, null, 2))

console.log(JSON.stringify({
  recipes:                corpus.recipes.length,
  corpus_hash:            corpusHash,
  distinct_required_forms: reqFormSet.size,
  total_distinct_forms:   allFormMap.size,
  forms_resolved:         formsResolved.length,
  forms_missing:          formsMissing.length,
  review_tasks_estimate:  report.review_tasks_estimate,
  sql_bytes:              Buffer.byteLength(sql),
  sql_path:               join(OUT, 'corpus-v1-load.sql'),
}, null, 2))
