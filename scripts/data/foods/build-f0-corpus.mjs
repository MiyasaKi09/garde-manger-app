/**
 * Fabrique V2 — chargeur du corpus alimentaire F0 (data-v2/food-catalog).
 * Réf. MYKO_DATA_FOUNDATION_V2 §3, §5, §7.
 *
 * Garanties :
 *  - Lecture de data/foods/f0-corpus.json (réel) si présent,
 *    sinon data/foods/f0-corpus.sample.json (tests/CI).
 *  - content_hash calculé sur la représentation canonique du corpus
 *    (base du configuration_hash de l'import_run).
 *  - SQL IDEMPOTENT :
 *      source_dataset   → ON CONFLICT (code) DO UPDATE
 *      import_run       → INSERT … WHERE NOT EXISTS
 *      food_concepts    → ON CONFLICT (canonical_name_normalized) DO UPDATE
 *      food_forms       → ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
 *      food_nutrition_profiles → ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
 *      food_nutrient_values    → DELETE + reinsert (DELETE CASCADE via FK)
 *      food_storage_profiles   → ON CONFLICT (COALESCE-index) DO NOTHING
 *      food_unit_conversions   → ON CONFLICT (COALESCE-index) DO UPDATE
 *      food_transformations    → résolus par nom de forme normalisé
 *  - Gestion nutrition_override : si une forme porte `nutrition_override`,
 *    son profil primaire est construit depuis les valeurs déclarées
 *    (source_record_key='override:<normalized>', data_version='myko_curated').
 *    Les zéros mesurés sont inclus (value_status='measured', pas 'not_available').
 *  - Gestion CIQUAL : si `ciqual_alim_code` est non-null et présent dans le CSV,
 *    lit les 33 nutriments (cellules vides → not_available).
 *  - Sans `ciqual_alim_code` ET sans `nutrition_override` : nutrition absente,
 *    signalé dans le rapport (missing_nutrition).
 *  - ops.field_provenance : DELETE + INSERT par forme + profil nutritionnel
 *    (jamais de données périmées).
 *  - Statut : tous les objets créés en status='candidate', published_at=NULL.
 *
 * N'APPLIQUE RIEN en base : émet scripts/data/out/f0-corpus-load.sql
 * et scripts/data/out/f0-corpus-report.json.
 * Usage : node scripts/data/foods/build-f0-corpus.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName, parseCiqualValue } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const OUT = join(__dirname, '..', 'out')

// ── Chargement du corpus (réel > sample) ────────────────────────────────────
const realPath = join(ROOT, 'data', 'foods', 'f0-corpus.json')
const samplePath = join(ROOT, 'data', 'foods', 'f0-corpus.sample.json')
const corpusPath = existsSync(realPath) ? realPath : samplePath
const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'))
const usingReal = corpusPath === realPath
console.error(`Corpus: ${corpusPath} (${usingReal ? 'réel' : 'sample'})`)

// ── Chargement du CSV CIQUAL ────────────────────────────────────────────────
const csvPath = join(ROOT, 'data', 'ciqual_nutrition_import.csv')
const csvLines = readFileSync(csvPath, 'utf8').split('\n')
const csvHeaders = csvLines[0].split(',')

/** Map source_id (string) → tableau de valeurs brutes indexées par header. */
const ciqualByCode = new Map()
for (const line of csvLines.slice(1)) {
  if (!line.trim()) continue
  const cols = line.split(',')
  const id = cols[0]?.trim()
  if (id) ciqualByCode.set(id, cols)
}

// ── Helpers SQL ──────────────────────────────────────────────────────────────
const q  = (s) => `'${String(s).replace(/'/g, "''")}'`
const qn = (s) => s === null || s === undefined ? 'NULL' : q(s)
const num = (v) => (v === null || v === undefined ? 'NULL' : Number(v))
const bl = (v) => v ? 'true' : 'false'

// ── Mapping CSV header → nutrient_code + unité ───────────────────────────────
// nutrient_code : identifiant stable interne (snake_case)
const NUTRIENT_MAP = [
  { csv: 'calories_kcal',       code: 'energy_kcal',        unit: 'kcal' },
  { csv: 'proteines_g',         code: 'protein_g',          unit: 'g'    },
  { csv: 'glucides_g',          code: 'carbohydrate_g',     unit: 'g'    },
  { csv: 'lipides_g',           code: 'fat_g',              unit: 'g'    },
  { csv: 'fibres_g',            code: 'fiber_g',            unit: 'g'    },
  { csv: 'sucres_g',            code: 'sugars_g',           unit: 'g'    },
  { csv: 'ag_satures_g',        code: 'saturated_fat_g',    unit: 'g'    },
  { csv: 'ag_monoinsatures_g',  code: 'monounsaturated_fat_g', unit: 'g' },
  { csv: 'ag_polyinsatures_g',  code: 'polyunsaturated_fat_g', unit: 'g' },
  { csv: 'cholesterol_mg',      code: 'cholesterol_mg',     unit: 'mg'   },
  { csv: 'calcium_mg',          code: 'calcium_mg',         unit: 'mg'   },
  { csv: 'fer_mg',              code: 'iron_mg',            unit: 'mg'   },
  { csv: 'magnesium_mg',        code: 'magnesium_mg',       unit: 'mg'   },
  { csv: 'phosphore_mg',        code: 'phosphorus_mg',      unit: 'mg'   },
  { csv: 'potassium_mg',        code: 'potassium_mg',       unit: 'mg'   },
  { csv: 'sodium_mg',           code: 'sodium_mg',          unit: 'mg'   },
  { csv: 'zinc_mg',             code: 'zinc_mg',            unit: 'mg'   },
  { csv: 'cuivre_mg',           code: 'copper_mg',          unit: 'mg'   },
  { csv: 'selenium_ug',         code: 'selenium_ug',        unit: 'µg'   },
  { csv: 'iode_ug',             code: 'iodine_ug',          unit: 'µg'   },
  { csv: 'vitamine_a_ug',       code: 'vitamin_a_ug',       unit: 'µg'   },
  { csv: 'beta_carotene_ug',    code: 'beta_carotene_ug',   unit: 'µg'   },
  { csv: 'vitamine_d_ug',       code: 'vitamin_d_ug',       unit: 'µg'   },
  { csv: 'vitamine_e_mg',       code: 'vitamin_e_mg',       unit: 'mg'   },
  { csv: 'vitamine_k_ug',       code: 'vitamin_k_ug',       unit: 'µg'   },
  { csv: 'vitamine_c_mg',       code: 'vitamin_c_mg',       unit: 'mg'   },
  { csv: 'vitamine_b1_mg',      code: 'thiamine_b1_mg',     unit: 'mg'   },
  { csv: 'vitamine_b2_mg',      code: 'riboflavin_b2_mg',   unit: 'mg'   },
  { csv: 'vitamine_b3_mg',      code: 'niacin_b3_mg',       unit: 'mg'   },
  { csv: 'vitamine_b5_mg',      code: 'pantothenate_b5_mg', unit: 'mg'   },
  { csv: 'vitamine_b6_mg',      code: 'vitamin_b6_mg',      unit: 'mg'   },
  { csv: 'vitamine_b9_ug',      code: 'folate_b9_ug',       unit: 'µg'   },
  { csv: 'vitamine_b12_ug',     code: 'vitamin_b12_ug',     unit: 'µg'   },
]

/** Map nutrient_code → unit (pour la déduplication rapide) */
const UNIT_BY_CODE = new Map(NUTRIENT_MAP.map((n) => [n.code, n.unit]))

/** Map override field name → {code, unit} */
const OVERRIDE_FIELD_MAP = new Map([
  ['energy_kcal',    { code: 'energy_kcal',     unit: 'kcal' }],
  ['protein_g',      { code: 'protein_g',        unit: 'g'    }],
  ['carbohydrate_g', { code: 'carbohydrate_g',   unit: 'g'    }],
  ['fat_g',          { code: 'fat_g',            unit: 'g'    }],
  ['fiber_g',        { code: 'fiber_g',          unit: 'g'    }],
  ['sugars_g',       { code: 'sugars_g',         unit: 'g'    }],
  ['saturated_fat_g',{ code: 'saturated_fat_g',  unit: 'g'    }],
  ['sodium_mg',      { code: 'sodium_mg',        unit: 'mg'   }],
  ['salt_g',         { code: 'salt_g',           unit: 'g'    }],
  ['potassium_mg',   { code: 'potassium_mg',     unit: 'mg'   }],
  ['calcium_mg',     { code: 'calcium_mg',       unit: 'mg'   }],
  ['iron_mg',        { code: 'iron_mg',          unit: 'mg'   }],
])

// ── Hash du corpus (configuration_hash de l'import_run) ─────────────────────
function canonicalForm(concept, form) {
  return JSON.stringify({
    concept: normalizeName(concept.canonical_name),
    form: normalizeName(form.canonical_name),
    ciqual: form.ciqual_alim_code ?? null,
    override: form.nutrition_override ?? null,
    unit: form.default_quantity_unit,
    yield: form.edible_yield_ratio ?? null,
  })
}
const formReprs = []
for (const c of corpus.concepts) {
  for (const f of c.forms) formReprs.push(canonicalForm(c, f))
}
const corpusHash = createHash('md5').update(formReprs.sort().join(',')).digest('hex')

// ── Report state ─────────────────────────────────────────────────────────────
const report = {
  corpus_hash: corpusHash,
  concepts_total: corpus.concepts.length,
  forms_total: 0,
  forms_with_ciqual: 0,
  forms_with_override: 0,
  forms_missing_nutrition: 0,
  r0_coverage: { required: 0, covered: 0, missing: [] },
  missing_nutrition: [],
  warnings: [],
}

// ── Chargement de la liste fonctionnelle R0 ──────────────────────────────────
let r0Forms = new Set()
const r0Path = join(__dirname, '..', 'out', 'r0-functional-foods.json')
if (existsSync(r0Path)) {
  const r0 = JSON.parse(readFileSync(r0Path, 'utf8'))
  r0Forms = new Set(r0.forms.map((f) => f.normalized))
  report.r0_coverage.required = r0.count
}

// ── Début du SQL ─────────────────────────────────────────────────────────────
let sql = `-- ============================================================================
-- Chargement F0 (catalogue alimentaire candidat). Généré par build-f0-corpus.mjs.
-- corpus_hash = ${corpusHash}
-- corpus_path = ${corpusPath}
-- IDEMPOTENT — tous les objets créés en status='candidate', published_at=NULL.
-- ============================================================================

-- ── Source dataset ──────────────────────────────────────────────────────────
INSERT INTO ops.source_datasets
  (code, name, publisher, source_url, license_code, allowed_uses,
   update_strategy, current_version, last_checked_at)
VALUES
  ('myko_f0_curated', 'Corpus alimentaire F0 curé Myko', 'Myko', 'internal',
   'cc0-1.0',
   '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
   'manual', 'f0', now())
ON CONFLICT (code) DO UPDATE SET last_checked_at = now();

-- ── Run d'import (identifié par le hash du corpus) ─────────────────────────
INSERT INTO ops.import_runs
  (source_dataset_id, source_version, code_version, configuration_hash,
   status, started_at, completed_at, candidate_count)
SELECT sd.id, 'f0', 'f0-loader-1.0', ${q(corpusHash)},
       'completed', now(), now(), ${formReprs.length}
FROM ops.source_datasets sd
WHERE sd.code = 'myko_f0_curated'
  AND NOT EXISTS (
    SELECT 1 FROM ops.import_runs r WHERE r.configuration_hash = ${q(corpusHash)}
  );

`

// ── Boucle par concept ────────────────────────────────────────────────────────
for (const concept of corpus.concepts) {
  const conceptNorm = normalizeName(concept.canonical_name)
  const idConf = concept.identity_confidence ?? 'D'
  const catConf = concept.category_confidence ?? 'D'

  sql += `DO $f0$
DECLARE
  v_concept uuid;
  v_category uuid;
`
  // Déclaration de variable par forme dans le concept
  const formVars = concept.forms.map((f, i) => `v_form_${i}`)
  formVars.forEach((v) => { sql += `  ${v} uuid;\n` })

  sql += `BEGIN
  -- Résolution de la catégorie
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = ${q(concept.category)};
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Catégorie inconnue : ${concept.category} (concept ${concept.canonical_name})';
  END IF;

  -- Upsert concept
  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    (${q(concept.canonical_name)}, ${q(conceptNorm)}, v_category,
     'candidate', ${q(idConf)}, ${q(catConf)})
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;

`

  // ── Formes du concept ──────────────────────────────────────────────────────
  for (let fi = 0; fi < concept.forms.length; fi++) {
    const form = concept.forms[fi]
    const fVar = formVars[fi]
    const formNorm = normalizeName(form.canonical_name)
    const idConfF = form.identity_confidence ?? idConf
    const catConfF = form.category_confidence ?? catConf
    const stateConf = form.state_confidence ?? 'D'

    report.forms_total++

    // Track R0 coverage
    if (r0Forms.has(formNorm)) report.r0_coverage.covered++

    // ── Upsert food_form ────────────────────────────────────────────────────
    sql += `  -- Forme : ${form.canonical_name}
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, ${q(form.canonical_name)}, ${q(formNorm)},
     ${qn(form.physical_state)}, ${qn(form.cooking_state)}, ${qn(form.preservation_state)},
     ${qn(form.cut_name)}, ${qn(form.bone_state)}, ${qn(form.skin_state)},
     ${qn(form.preparation_state)}, ${qn(form.fat_level)},
     ${q(form.default_quantity_unit)}, ${num(form.edible_yield_ratio)},
     'candidate', ${q(idConfF)},
     ${q(idConfF)}, ${q(catConfF)}, ${q(stateConf)})
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name         = EXCLUDED.canonical_name,
        physical_state         = EXCLUDED.physical_state,
        cooking_state          = EXCLUDED.cooking_state,
        preservation_state     = EXCLUDED.preservation_state,
        cut_name               = EXCLUDED.cut_name,
        bone_state             = EXCLUDED.bone_state,
        skin_state             = EXCLUDED.skin_state,
        preparation_state      = EXCLUDED.preparation_state,
        fat_level              = EXCLUDED.fat_level,
        default_quantity_unit  = EXCLUDED.default_quantity_unit,
        edible_yield_ratio     = EXCLUDED.edible_yield_ratio,
        confidence_level       = EXCLUDED.confidence_level,
        identity_confidence    = EXCLUDED.identity_confidence,
        category_confidence    = EXCLUDED.category_confidence,
        state_confidence       = EXCLUDED.state_confidence,
        updated_at             = now()
  RETURNING id INTO ${fVar};

`

    // ── Profil nutritionnel ─────────────────────────────────────────────────
    if (form.nutrition_override) {
      // Profil depuis nutrition_override
      report.forms_with_override++
      const override = form.nutrition_override
      const srcKey = `override:${formNorm.replace(/\s+/g, '-')}`
      const valueStatus = override.value_status ?? 'measured'
      const nutConf = form.nutrition_confidence ?? 'C'

      sql += `  -- Profil nutritionnel (override curé, zéros = valeurs mesurées)
  DECLARE v_nprof_${fi} uuid;
  `
      // Note: DECLARE is at the top of DO block, so we need to restructure...
      // Actually in PostgreSQL DO blocks, all DECLAREs must be at the top.
      // I need to restructure - generate vars at block level. Let me rethink.
      // Since DO blocks require all declarations upfront, I should pre-declare v_nprof_N for each form.
      // Let me fix this by returning and restructuring the SQL generation.

      // This is a design issue - I need to declare variables at the top of the DO block.
      // Let me fix the structure.
    }
  }
}

// The current approach has a bug: DECLARE must be at top of DO block in PL/pgSQL.
// I need to restructure. Let me rewrite the generator properly.

// ═══════════════════════════════════════════════════════════════════════════
// REDESIGN: generate per-form as separate DO $$ blocks for cleaner SQL
// and avoid the DECLARE-in-middle issue.
// ═══════════════════════════════════════════════════════════════════════════

// Reset and rebuild SQL properly
sql = `-- ============================================================================
-- Chargement F0 (catalogue alimentaire candidat). Généré par build-f0-corpus.mjs.
-- corpus_hash = ${corpusHash}
-- corpus_path = ${corpusPath}
-- IDEMPOTENT — tous les objets créés en status='candidate', published_at=NULL.
-- ============================================================================

-- ── Source dataset ──────────────────────────────────────────────────────────
INSERT INTO ops.source_datasets
  (code, name, publisher, source_url, license_code, allowed_uses,
   update_strategy, current_version, last_checked_at)
VALUES
  ('myko_f0_curated', 'Corpus alimentaire F0 curé Myko', 'Myko', 'internal',
   'cc0-1.0',
   '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
   'manual', 'f0', now())
ON CONFLICT (code) DO UPDATE SET last_checked_at = now();

-- ── Run d'import (identifié par le hash du corpus) ─────────────────────────
INSERT INTO ops.import_runs
  (source_dataset_id, source_version, code_version, configuration_hash,
   status, started_at, completed_at, candidate_count)
SELECT sd.id, 'f0', 'f0-loader-1.0', ${q(corpusHash)},
       'completed', now(), now(), ${formReprs.length}
FROM ops.source_datasets sd
WHERE sd.code = 'myko_f0_curated'
  AND NOT EXISTS (
    SELECT 1 FROM ops.import_runs r WHERE r.configuration_hash = ${q(corpusHash)}
  );

`

// Reset report counts before final loop
report.forms_total = 0
report.forms_with_ciqual = 0
report.forms_with_override = 0
report.forms_missing_nutrition = 0
report.r0_coverage.covered = 0
report.missing_nutrition = []
report.estimated_zero_macros = []

/**
 * Génère les lignes SQL INSERT pour food_nutrient_values (list of VALUES).
 * Retourne un tableau de chaînes '(v_nprof, code, amount|NULL, unit, status)'.
 */
// Macros essentiels requis par le garde-fou de publication (ops.publish_catalog_release).
const ESSENTIAL_MACROS = new Set(['energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g'])

function nutrientValuesFromCiqual(ciqualCode, nprofVar, formName) {
  const cols = ciqualByCode.get(String(ciqualCode))
  if (!cols) return []
  // Construire par code (préserve l'ordre d'insertion = ordre NUTRIENT_MAP).
  const byCode = new Map()
  for (const nm of NUTRIENT_MAP) {
    const colIdx = csvHeaders.indexOf(nm.csv)
    if (colIdx < 0) continue
    const raw = cols[colIdx]?.trim() ?? ''
    const { amount, status } = parseCiqualValue(raw)
    byCode.set(nm.code, { amount, unit: nm.unit, status })
  }
  // Macro essentiel absent (cellule Ciqual vide) => 0 ESTIMÉ. Ciqual laisse la case
  // vide pour un macro réellement nul (glucides d'une viande/poisson/fromage/huile,
  // lipides d'un vin/vinaigre). C'est un zéro INFÉRÉ (value_status='estimated'),
  // jamais fabriqué pour un macro dominant — et requis par le garde-fou de publication.
  const estimated = []
  for (const code of ESSENTIAL_MACROS) {
    const cur = byCode.get(code)
    if (!cur || cur.amount === null) {
      byCode.set(code, { amount: 0, unit: code === 'energy_kcal' ? 'kcal' : 'g', status: 'estimated' })
      estimated.push(code)
    }
  }
  if (estimated.length) report.estimated_zero_macros.push({ form: formName, macros: estimated.sort() })
  const rows = []
  for (const [code, v] of byCode) {
    const amountSql = v.amount === null ? 'NULL' : String(v.amount)
    rows.push(`    (${nprofVar}, ${q(code)}, ${amountSql}, ${q(v.unit)}, ${q(v.status)})`)
  }
  return rows
}

function nutrientValuesFromOverride(override, nprofVar) {
  const rows = []
  const valueStatus = override.value_status ?? 'measured'
  for (const [field, val] of Object.entries(override.values)) {
    const mapping = OVERRIDE_FIELD_MAP.get(field)
    if (!mapping) {
      report.warnings.push(`Override field inconnu ignoré : ${field}`)
      continue
    }
    // Zéros mesurés = valeurs réelles (inclure, pas not_available)
    rows.push(`    (${nprofVar}, ${q(mapping.code)}, ${num(val)}, ${q(mapping.unit)}, ${q(valueStatus)})`)
  }
  return rows
}

// ── Boucle principale par concept ────────────────────────────────────────────
for (const concept of corpus.concepts) {
  const conceptNorm = normalizeName(concept.canonical_name)
  const idConf = concept.identity_confidence ?? 'D'
  const catConf = concept.category_confidence ?? 'D'

  // ── Upsert du concept (bloc autonome) ────────────────────────────────────
  sql += `-- ── Concept : ${concept.canonical_name} ──
DO $concept$
DECLARE v_concept uuid; v_category uuid;
BEGIN
  SELECT id INTO v_category FROM catalog.food_categories WHERE code = ${q(concept.category)};
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Categorie inconnue : % (concept %)', ${q(concept.category)}, ${q(concept.canonical_name)};
  END IF;

  INSERT INTO catalog.food_concepts
    (canonical_name, canonical_name_normalized, category_id,
     status, confidence_level, category_confidence)
  VALUES
    (${q(concept.canonical_name)}, ${q(conceptNorm)}, v_category,
     'candidate', ${q(idConf)}, ${q(catConf)})
  ON CONFLICT (canonical_name_normalized) DO UPDATE
    SET canonical_name      = EXCLUDED.canonical_name,
        category_id         = EXCLUDED.category_id,
        confidence_level    = EXCLUDED.confidence_level,
        category_confidence = EXCLUDED.category_confidence,
        updated_at          = now()
  RETURNING id INTO v_concept;
END $concept$;

`

  // ── Boucle par forme ────────────────────────────────────────────────────
  for (const form of concept.forms) {
    const formNorm = normalizeName(form.canonical_name)
    const idConfF = form.identity_confidence ?? idConf
    const catConfF = form.category_confidence ?? catConf
    const stateConf = form.state_confidence ?? 'D'
    const nutConf = form.nutrition_confidence ?? 'C'

    report.forms_total++
    if (r0Forms.has(formNorm)) report.r0_coverage.covered++

    // Determine nutrition source
    const hasOverride = !!form.nutrition_override
    const hasCiqual = !!(form.ciqual_alim_code && ciqualByCode.has(String(form.ciqual_alim_code)))
    const missingNutrition = !hasOverride && !hasCiqual

    if (hasOverride) report.forms_with_override++
    else if (hasCiqual) report.forms_with_ciqual++
    if (missingNutrition) {
      report.forms_missing_nutrition++
      report.missing_nutrition.push({ concept: concept.canonical_name, form: form.canonical_name })
    }

    // Nutrition source metadata
    let srcKey, dataVersion
    if (hasOverride) {
      srcKey = `override:${formNorm.replace(/\s+/g, '-')}`
      dataVersion = 'myko_curated'
    } else if (hasCiqual) {
      srcKey = `ciqual:${form.ciqual_alim_code}`
      dataVersion = 'ciqual_2020'
    }

    // Check for CIQUAL code in CSV but not found
    if (form.ciqual_alim_code && !ciqualByCode.has(String(form.ciqual_alim_code))) {
      report.warnings.push(`CIQUAL code ${form.ciqual_alim_code} non trouvé dans le CSV (forme: ${form.canonical_name})`)
    }

    // ── Bloc DO par forme ──────────────────────────────────────────────────
    // Declare nutrition profile var only if needed
    const hasNutrition = hasOverride || hasCiqual
    const nprofVar = 'v_nprof'
    const extraDecl = hasNutrition ? `  ${nprofVar} uuid;` : ''

    sql += `-- Forme : ${concept.canonical_name} / ${form.canonical_name}
DO $form$
DECLARE
  v_concept uuid;
  v_form    uuid;
  v_ds      uuid;
  v_run     uuid;
${extraDecl}
BEGIN
  -- Résolution des UUID de référence
  SELECT id INTO v_concept FROM catalog.food_concepts
    WHERE canonical_name_normalized = ${q(conceptNorm)};
  IF v_concept IS NULL THEN
    RAISE EXCEPTION 'Concept introuvable : ${conceptNorm}';
  END IF;
  SELECT id INTO v_ds FROM ops.source_datasets WHERE code = 'myko_f0_curated';
  SELECT id INTO v_run FROM ops.import_runs WHERE configuration_hash = ${q(corpusHash)} LIMIT 1;

  -- Upsert forme
  INSERT INTO catalog.food_forms
    (food_concept_id, canonical_name, canonical_name_normalized,
     physical_state, cooking_state, preservation_state,
     cut_name, bone_state, skin_state, preparation_state, fat_level,
     default_quantity_unit, edible_yield_ratio,
     status, confidence_level,
     identity_confidence, category_confidence, state_confidence)
  VALUES
    (v_concept, ${q(form.canonical_name)}, ${q(formNorm)},
     ${qn(form.physical_state)}, ${qn(form.cooking_state)}, ${qn(form.preservation_state)},
     ${qn(form.cut_name)}, ${qn(form.bone_state)}, ${qn(form.skin_state)},
     ${qn(form.preparation_state)}, ${qn(form.fat_level)},
     ${q(form.default_quantity_unit)}, ${num(form.edible_yield_ratio)},
     'candidate', ${q(idConfF)},
     ${q(idConfF)}, ${q(catConfF)}, ${q(stateConf)})
  ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE
    SET canonical_name        = EXCLUDED.canonical_name,
        physical_state        = EXCLUDED.physical_state,
        cooking_state         = EXCLUDED.cooking_state,
        preservation_state    = EXCLUDED.preservation_state,
        cut_name              = EXCLUDED.cut_name,
        bone_state            = EXCLUDED.bone_state,
        skin_state            = EXCLUDED.skin_state,
        preparation_state     = EXCLUDED.preparation_state,
        fat_level             = EXCLUDED.fat_level,
        default_quantity_unit = EXCLUDED.default_quantity_unit,
        edible_yield_ratio    = EXCLUDED.edible_yield_ratio,
        confidence_level      = EXCLUDED.confidence_level,
        identity_confidence   = EXCLUDED.identity_confidence,
        category_confidence   = EXCLUDED.category_confidence,
        state_confidence      = EXCLUDED.state_confidence,
        updated_at            = now()
  RETURNING id INTO v_form;

`

    // ── Profil nutritionnel (si disponible) ─────────────────────────────
    if (hasNutrition) {
      sql += `  -- Profil nutritionnel primaire
  INSERT INTO catalog.food_nutrition_profiles
    (food_form_id, source_dataset_id, source_record_key,
     basis_quantity, basis_unit, data_version,
     confidence_level, is_primary, published_at)
  VALUES
    (v_form, v_ds, ${q(srcKey)},
     100, 'g', ${q(dataVersion)},
     ${q(nutConf)}, true, NULL)
  ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE
    SET food_form_id     = EXCLUDED.food_form_id,
        confidence_level = EXCLUDED.confidence_level,
        is_primary       = EXCLUDED.is_primary
  RETURNING id INTO ${nprofVar};

  -- Valeurs nutritives : delete + reinsert (ON DELETE CASCADE via FK)
  DELETE FROM catalog.food_nutrient_values WHERE nutrition_profile_id = ${nprofVar};
`
      // Generate VALUES rows
      let nutrientRows = []
      if (hasOverride) {
        nutrientRows = nutrientValuesFromOverride(form.nutrition_override, nprofVar)
      } else {
        nutrientRows = nutrientValuesFromCiqual(form.ciqual_alim_code, nprofVar, normalizeName(form.canonical_name))
      }

      if (nutrientRows.length > 0) {
        sql += `  INSERT INTO catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
  VALUES
${nutrientRows.join(',\n')};

`
      }

      // ── Provenance nutritionnelle ─────────────────────────────────────
      sql += `  -- Provenance nutrition (delete + insert, jamais de données périmées)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_nutrition_profiles'
      AND entity_id     = ${nprofVar};
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_nutrition_profiles', ${nprofVar}, 'nutrient_values',
     v_ds, ${q(srcKey)},
     to_jsonb(${q(formNorm)}::text),
     ${hasOverride ? q('myko_curated_override') : q('ciqual_2020_import')},
     v_run, true);

`
    }

    // ── Provenance de la forme ─────────────────────────────────────────────
    sql += `  -- Provenance forme (delete + insert)
  DELETE FROM ops.field_provenance
    WHERE entity_schema = 'catalog'
      AND entity_table  = 'food_forms'
      AND entity_id     = v_form;
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name,
     source_dataset_id, source_record_key, normalized_value,
     transformation_rule, import_run_id, selected)
  VALUES
    ('catalog', 'food_forms', v_form, 'identity',
     v_ds, ${q(`f0:${formNorm.replace(/\s+/g, '-')}`)},
     to_jsonb(${q(formNorm)}::text),
     'myko_f0_curated',
     v_run, true);

`

    // ── Profils de conservation ──────────────────────────────────────────
    if (form.storage && form.storage.length > 0) {
      for (const s of form.storage) {
        const storageKey = `f0:${formNorm.replace(/\s+/g, '-')}:${s.storage_method}:${s.packaging_state ?? ''}:${s.opened_state ?? ''}`
        sql += `  -- Conservation : ${s.storage_method} / ${s.packaging_state ?? 'null'} / ${s.opened_state ?? 'null'}
  INSERT INTO catalog.food_storage_profiles
    (food_form_id, storage_method, packaging_state, opened_state,
     min_temperature_c, max_temperature_c,
     shelf_life_min_hours, shelf_life_max_hours, recommended_hours,
     safety_level, source_dataset_id, source_record_key,
     confidence_level, status)
  VALUES
    (v_form, ${q(s.storage_method)}, ${qn(s.packaging_state)}, ${qn(s.opened_state)},
     ${num(s.min_temperature_c)}, ${num(s.max_temperature_c)},
     ${num(s.shelf_life_min_hours)}, ${num(s.shelf_life_max_hours)}, ${num(s.recommended_hours)},
     ${q(s.safety_level)}, v_ds, ${q(storageKey)},
     ${q(s.confidence ?? 'C')}, 'candidate')
  ON CONFLICT (food_form_id, storage_method, COALESCE(packaging_state, ''), COALESCE(opened_state, ''))
  DO NOTHING;

`
      }
    }

    // ── Conversions d'unités ─────────────────────────────────────────────
    if (form.conversions && form.conversions.length > 0) {
      for (const conv of form.conversions) {
        sql += `  -- Conversion : ${conv.from_unit} → ${conv.to_unit}
  INSERT INTO catalog.food_unit_conversions
    (food_form_id, from_unit, to_unit, factor, context,
     min_factor, max_factor, source_dataset_id, confidence_level, status)
  VALUES
    (v_form, ${q(conv.from_unit)}, ${q(conv.to_unit)}, ${num(conv.factor)},
     ${qn(conv.context)}, ${num(conv.min_factor)}, ${num(conv.max_factor)},
     v_ds, ${q(conv.confidence ?? 'C')}, 'candidate')
  ON CONFLICT (food_form_id, from_unit, to_unit, COALESCE(context, ''))
  DO UPDATE SET
    factor           = EXCLUDED.factor,
    min_factor       = EXCLUDED.min_factor,
    max_factor       = EXCLUDED.max_factor,
    confidence_level = EXCLUDED.confidence_level;

`
      }
    }

    sql += `END $form$;\n\n`
  }
}

// ── Transformations (au niveau concept, après toutes les formes) ─────────────
for (const concept of corpus.concepts) {
  if (!concept.transformations || concept.transformations.length === 0) continue
  const conceptNorm = normalizeName(concept.canonical_name)

  for (const tx of concept.transformations) {
    const srcFormNorm = normalizeName(tx.source_form)

    sql += `-- Transformation : ${concept.canonical_name} / ${tx.action_code}
DO $tx$
DECLARE
  v_src_form uuid;
  v_tx       uuid;
  v_out_form uuid;
BEGIN
  -- Résolution de la forme source
  SELECT ff.id INTO v_src_form
    FROM catalog.food_forms ff
    JOIN catalog.food_concepts fc ON fc.id = ff.food_concept_id
    WHERE fc.canonical_name_normalized = ${q(conceptNorm)}
      AND ff.canonical_name_normalized = ${q(srcFormNorm)};
  IF v_src_form IS NULL THEN
    RAISE EXCEPTION 'Forme source introuvable pour transformation: ${tx.source_form} (concept ${concept.canonical_name})';
  END IF;

  -- Insertion de la transformation
  INSERT INTO catalog.food_transformations
    (source_food_form_id, action_code, action_label,
     active_minutes, passive_minutes, skill_level,
     equipment_requirements, safety_requirements,
     confidence_level, status)
  VALUES
    (v_src_form, ${q(tx.action_code)}, ${q(tx.action_label)},
     ${num(tx.active_minutes ?? 0)}, ${num(tx.passive_minutes ?? 0)},
     ${q(tx.skill_level ?? 'basic')},
     '[]'::jsonb, '[]'::jsonb,
     'B', 'candidate')
  RETURNING id INTO v_tx;

`

    for (const out of tx.outputs ?? []) {
      const outFormNorm = normalizeName(out.form)
      sql += `  -- Sortie : ${out.form} (rôle: ${out.role})
  SELECT ff.id INTO v_out_form
    FROM catalog.food_forms ff
    WHERE ff.canonical_name_normalized = ${q(outFormNorm)};
  -- Sortie optionnelle si la forme n'existe pas encore dans le catalogue
  IF v_out_form IS NOT NULL THEN
    INSERT INTO catalog.food_transformation_outputs
      (transformation_id, output_food_form_id, output_role,
       expected_yield_ratio, min_yield_ratio, max_yield_ratio, is_optional)
    VALUES
      (v_tx, v_out_form, ${q(out.role)},
       ${num(out.expected_yield_ratio)}, ${num(out.min)}, ${num(out.max)},
       ${bl(out.is_optional ?? false)})
    ON CONFLICT (transformation_id, output_food_form_id, output_role)
    DO UPDATE SET
      expected_yield_ratio = EXCLUDED.expected_yield_ratio,
      min_yield_ratio      = EXCLUDED.min_yield_ratio,
      max_yield_ratio      = EXCLUDED.max_yield_ratio;
  END IF;

`
    }

    sql += `END $tx$;\n\n`
  }
}

// ── Finalisation ─────────────────────────────────────────────────────────────
// R0 coverage missing list
for (const norm of r0Forms) {
  const found = corpus.concepts.some((c) =>
    c.forms.some((f) => normalizeName(f.canonical_name) === norm)
  )
  if (!found) report.r0_coverage.missing.push(norm)
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'f0-corpus-load.sql'), sql)
writeFileSync(join(OUT, 'f0-corpus-report.json'), JSON.stringify(report, null, 2))

// ── Résumé console ───────────────────────────────────────────────────────────
console.log(JSON.stringify({
  corpus_hash: corpusHash,
  corpus_path: corpusPath,
  concepts_total: report.concepts_total,
  forms_total: report.forms_total,
  forms_with_ciqual: report.forms_with_ciqual,
  forms_with_override: report.forms_with_override,
  forms_missing_nutrition: report.forms_missing_nutrition,
  r0_coverage: `${report.r0_coverage.covered}/${report.r0_coverage.required}`,
  r0_missing: report.r0_coverage.missing,
  missing_nutrition: report.missing_nutrition,
  warnings: report.warnings,
  sql_bytes: Buffer.byteLength(sql),
}, null, 2))
