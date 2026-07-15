/**
 * Builds a reviewable mapping between every food form used by the editorial
 * recipe corpus and the official Ciqual 2020 workbook.
 *
 * This script deliberately does not publish anything. A mapping is considered
 * usable only when it is either explicitly curated in
 * `data/foods/recipe-food-mappings.json` or has an exact normalized Ciqual
 * label. Fuzzy suggestions remain review-only.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseCiqualWorkbook } from '../parse/ciqual.mjs'
import { normalizeName, parseFoodName } from '../lib/normalize.mjs'
import { resolveCategory } from '../lib/categories.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const OUT = join(__dirname, '..', 'out')
const CORPUS_PATH = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const CIQUAL_PATH = join(ROOT, 'data', 'sources', 'raw', 'ciqual_2020_FR_2020-07-07.xls.gz')
const MAPPINGS_PATH = join(ROOT, 'data', 'foods', 'recipe-food-mappings-v3.json')
const NUTRITION_PATH = join(ROOT, 'data', 'ciqual_nutrition_import.csv')

const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'))
const mappings = existsSync(MAPPINGS_PATH)
  ? JSON.parse(readFileSync(MAPPINGS_PATH, 'utf8')).mappings || {}
  : {}
const { records } = parseCiqualWorkbook(CIQUAL_PATH)
const nutritionRows = readFileSync(NUTRITION_PATH, 'utf8').split(/\r?\n/).slice(1)
const nutritionByCode = new Map()
for (const row of nutritionRows) {
  if (!row.trim()) continue
  const columns = row.split(',')
  nutritionByCode.set(columns[0], {
    energy_kcal: columns[1] === '' ? null : Number(columns[1]),
    protein_g: columns[2] === '' ? null : Number(columns[2]),
    carbohydrate_g: columns[3] === '' ? null : Number(columns[3]),
    fat_g: columns[4] === '' ? null : Number(columns[4]),
    fiber_g: columns[5] === '' ? null : Number(columns[5]),
  })
}

const MODIFIERS = new Set([
  'a', 'au', 'aux', 'avec', 'de', 'des', 'du', 'en', 'et', 'l', 'la', 'le', 'les',
  'cru', 'crue', 'crus', 'crues', 'cuit', 'cuite', 'cuits', 'cuites', 'frais',
  'fraiche', 'fraiches', 'fume', 'fumee', 'seche', 'seches', 'moulu', 'moulue',
  'raffinee', 'preparee', 'entier', 'entiere', 'egoutte', 'egouttee', 'epluchee',
  'denoyautee', 'epépine', 'epepine', 'refroidi', 'pret', 'cuire', 'alimentaire',
])

const SYNONYM_GROUPS = [
  ['boeuf', 'bovin'], ['porc', 'porcine'], ['poulet', 'volaille'],
  ['cabillaud', 'morue'], ['champignon', 'champignons'], ['ble', 'froment'],
  ['cassonade', 'sucre', 'roux'], ['fecule', 'amidon'], ['mais', 'maizena'],
  ['pois', 'chiche'], ['haricot', 'flageolet'], ['creme', 'fraiche'],
  ['lardon', 'poitrine'], ['cacao', 'chocolat'], ['persil', 'aromatique'],
  ['bouillon', 'fond'], ['pate', 'pates'], ['oeuf', 'oeufs'],
]

const tokenAliases = new Map()
for (const group of SYNONYM_GROUPS) {
  for (const token of group) tokenAliases.set(token, new Set(group))
}

function tokens(value, { meaningful = false } = {}) {
  const result = normalizeName(value).split(' ').filter(Boolean)
  return meaningful ? result.filter((token) => !MODIFIERS.has(token)) : result
}

function tokenMatches(token, candidateSet) {
  if (candidateSet.has(token)) return true
  const aliases = tokenAliases.get(token)
  return aliases ? [...aliases].some((alias) => candidateSet.has(alias)) : false
}

const STATE_RULES = [
  { re: /\b(cru|crue|crus|crues)\b/, positive: /\b(cru|crue|crus|crues)\b/, negative: /\b(cuit|cuite|cuits|cuites|grille|roti|bouilli)\b/ },
  { re: /\b(cuit|cuite|cuits|cuites)\b/, positive: /\b(cuit|cuite|cuits|cuites)\b/, negative: /\b(cru|crue|crus|crues)\b/ },
  { re: /\b(conserve|appertise|appertisee)\b/, positive: /\b(conserve|appertise|appertisee|boite)\b/, negative: /\b(frais|fraiche|cru|crue)\b/ },
  { re: /\b(sec|seche|secs|seches)\b/, positive: /\b(sec|seche|secs|seches|deshydrate)\b/, negative: /\b(frais|fraiche|cuit|cuite)\b/ },
  { re: /\b(entier|entiere)\b/, positive: /\b(entier|entiere)\b/, negative: /\b(demi|ecreme)\b/ },
  { re: /\b(demi ecreme)\b/, positive: /\b(demi ecreme)\b/, negative: /\b(entier|entiere)\b/ },
  { re: /\b(sans peau)\b/, positive: /\b(sans peau)\b/, negative: /\b(avec peau)\b/ },
  { re: /\b(avec peau)\b/, positive: /\b(avec peau)\b/, negative: /\b(sans peau)\b/ },
  { re: /\b(desosse|desossee|sans os)\b/, positive: /\b(desosse|desossee|sans os)\b/, negative: /\b(avec os)\b/ },
  { re: /\b(avec os)\b/, positive: /\b(avec os)\b/, negative: /\b(desosse|desossee|sans os)\b/ },
]

function semanticScore(targetName, record) {
  const target = normalizeName(targetName)
  const candidate = normalizeName(record.alim_nom_fr)
  if (target === candidate) return 1000

  const targetTokens = tokens(targetName, { meaningful: true })
  const candidateTokens = new Set(tokens(record.alim_nom_fr))
  let score = 0
  let matched = 0
  for (const token of targetTokens) {
    if (tokenMatches(token, candidateTokens)) { score += token.length > 4 ? 16 : 10; matched++ }
    else score -= token.length > 4 ? 13 : 7
  }
  score += targetTokens.length ? (matched / targetTokens.length) * 45 : 0
  if (candidate.includes(target) || target.includes(candidate)) score += 35
  score -= Math.max(0, candidateTokens.size - targetTokens.length) * 1.5

  for (const rule of STATE_RULES) {
    if (!rule.re.test(target)) continue
    if (rule.positive.test(candidate)) score += 14
    if (rule.negative.test(candidate)) score -= 40
  }
  return Math.round(score * 10) / 10
}

const UNIT_WEIGHTS_G = new Map(Object.entries({
  'bouquet garni frais': 15,
  'jaune d oeuf cru': 18,
  'citron jaune frais': 120,
  'feuille de laurier sechee': 0.2,
  'oeuf cru': 50,
  'os a moelle de boeuf': 50,
  'clou de girofle': 0.2,
  'endive fraiche': 150,
  'gousse de vanille': 4,
  'blanc d oeuf cru': 33,
}))

function conversionFor(form, units) {
  const normalized = normalizeName(form)
  const conversion = {}
  if (units.has('u') && UNIT_WEIGHTS_G.has(normalized)) conversion.grams_per_unit = UNIT_WEIGHTS_G.get(normalized)
  if (units.has('tranche')) {
    if (/jambon/.test(normalized)) conversion.grams_per_unit = 40
    if (/pain de mie/.test(normalized)) conversion.grams_per_unit = 30
  }
  if (units.has('ml')) {
    if (/huile/.test(normalized)) conversion.density_g_per_ml = 0.92
    else if (/rhum|alcool/.test(normalized)) conversion.density_g_per_ml = 0.95
    else if (/lait|creme|yaourt/.test(normalized)) conversion.density_g_per_ml = 1.03
    else if (/jus de citron/.test(normalized)) conversion.density_g_per_ml = 1.03
    else if (/eau|bouillon|vin|biere|vinaigre|cafe|vanille liquide|marsala/.test(normalized)) conversion.density_g_per_ml = 1
  }
  return conversion
}

const allRecords = records
  .map((record) => {
    const imported = nutritionByCode.get(record.alim_code) || {}
    const protein = imported.protein_g ?? record.values.protein_g ?? null
    const carbohydrate = imported.carbohydrate_g ?? record.values.carbohydrate_g ?? null
    const fat = imported.fat_g ?? record.values.fat_g ?? null
    const fiber = imported.fiber_g ?? record.values.fiber_g ?? null
    const energy = imported.energy_kcal ?? record.values.energy_kcal
      ?? ([protein, carbohydrate, fat].every(Number.isFinite)
        ? protein * 4 + carbohydrate * 4 + fat * 9
        : null)
    return {
      ...record,
      normalized: normalizeName(record.alim_nom_fr),
      category: resolveCategory(record.grp_nom, record.ssgrp_nom, record.alim_nom_fr),
      nutrition: { energy_kcal: energy, protein_g: protein, carbohydrate_g: carbohydrate, fat_g: fat, fiber_g: fiber },
    }
  })
const candidates = allRecords.filter((record) => record.category)
const byCode = new Map(allRecords.map((record) => [record.alim_code, record]))

if (process.argv[2] === '--search') {
  const queries = process.argv.slice(3).join(' ').split('|').map(normalizeName).filter(Boolean)
  for (const query of queries) {
    console.log(`\n# ${query}`)
    for (const record of candidates.filter((item) => item.normalized.includes(query)).slice(0, 30)) {
      console.log(`${record.alim_code}\t${record.alim_nom_fr}\t${record.category}`)
    }
  }
  process.exit(0)
}

const usedBy = new Map()
for (const recipe of corpus.recipes) {
  for (const ingredient of recipe.ingredients) {
    const normalized = normalizeName(ingredient.form)
    if (!usedBy.has(normalized)) usedBy.set(normalized, { name: ingredient.form, recipes: new Set(), required: false, units: new Set() })
    const entry = usedBy.get(normalized)
    entry.recipes.add(recipe.code)
    entry.required ||= !ingredient.optional
    entry.units.add(ingredient.unit)
  }
}

const results = []
const selectedCatalog = []
for (const [normalized, usage] of [...usedBy].sort((a, b) => a[1].name.localeCompare(b[1].name, 'fr'))) {
  const explicit = mappings[normalized] || null
  const ranked = candidates
    .map((record) => ({ record, score: semanticScore(usage.name, record) }))
    .sort((a, b) => b.score - a.score || a.record.alim_code.localeCompare(b.record.alim_code))
    .slice(0, 5)
  const exact = ranked.find(({ record }) => record.normalized === normalized)
  const selected = explicit?.nutrition_override
    ? {
        alim_code: null,
        alim_nom_fr: usage.name,
        category: explicit.category,
        nutrition: explicit.nutrition_override,
      }
    : explicit?.ciqual_alim_code
      ? byCode.get(String(explicit.ciqual_alim_code))
      : exact?.record
  const selectionMode = explicit ? 'curated' : exact ? 'exact_label' : 'review_required'
  results.push({
    form: usage.name,
    normalized,
    required: usage.required,
    recipe_count: usage.recipes.size,
    units: [...usage.units].sort(),
    selection_mode: selectionMode,
    selected: selected ? {
      ciqual_alim_code: selected.alim_code,
      ciqual_name: selected.alim_nom_fr,
      category: explicit?.category || selected.category,
      nutrition_complete: ['energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g']
        .every((key) => Number.isFinite(selected.nutrition?.[key])),
      confidence: explicit?.confidence || 'B',
      note: explicit?.note || null,
    } : null,
    suggestions: ranked.map(({ record, score }) => ({
      ciqual_alim_code: record.alim_code,
      ciqual_name: record.alim_nom_fr,
      category: record.category,
      nutrition_complete: Object.values(record.nutrition || {}).every(Number.isFinite),
      score,
    })),
  })
  if (selected) {
    selectedCatalog.push({
      canonical_name: usage.name,
      canonical_name_normalized: normalized,
      category: explicit?.category || selected.category,
      confidence: explicit?.confidence || 'B',
      source: explicit?.nutrition_override ? 'myko_curated_override' : 'ciqual_2020',
      source_record_key: selected.alim_code,
      source_name: selected.alim_nom_fr,
      state: parseFoodName(usage.name),
      units_used: [...usage.units].sort(),
      conversion: conversionFor(usage.name, usage.units),
      per100g: {
        kcal: selected.nutrition?.energy_kcal ?? null,
        proteinG: selected.nutrition?.protein_g ?? null,
        carbsG: selected.nutrition?.carbohydrate_g ?? null,
        fatG: selected.nutrition?.fat_g ?? null,
        fiberG: selected.nutrition?.fiber_g ?? null,
      },
      note: explicit?.note || null,
    })
  }
}

const summary = results.reduce((acc, item) => {
  acc[item.selection_mode] = (acc[item.selection_mode] || 0) + 1
  return acc
}, {})
const resultByNormalized = new Map(results.map((item) => [item.normalized, item]))
const catalogByNormalized = new Map(selectedCatalog.map((item) => [item.canonical_name_normalized, item]))
const recipeEligibility = corpus.recipes.map((recipe) => {
  const required = recipe.ingredients.filter((ingredient) => !ingredient.optional)
  const unresolved = required
    .filter((ingredient) => !resultByNormalized.get(normalizeName(ingredient.form))?.selected)
    .map((ingredient) => ingredient.form)
  const lowConfidence = required
    .filter((ingredient) => resultByNormalized.get(normalizeName(ingredient.form))?.selected?.confidence === 'C')
    .map((ingredient) => ingredient.form)
  const incompleteNutrition = required
    .filter((ingredient) => resultByNormalized.get(normalizeName(ingredient.form))?.selected?.nutrition_complete === false)
    .map((ingredient) => ingredient.form)
  const unresolvedConversions = required
    .filter((ingredient) => {
      if (ingredient.unit === 'g') return false
      const conversion = catalogByNormalized.get(normalizeName(ingredient.form))?.conversion || {}
      if (ingredient.unit === 'ml') return !Number.isFinite(conversion.density_g_per_ml)
      if (ingredient.unit === 'u') return !Number.isFinite(conversion.grams_per_unit)
      if (ingredient.unit === 'tranche') return !Number.isFinite(conversion.grams_per_unit)
      return true
    })
    .map((ingredient) => ingredient.form)
  return {
    code: recipe.code,
    family: recipe.family,
    eligible_for_publication: unresolved.length === 0 && lowConfidence.length === 0
      && incompleteNutrition.length === 0 && unresolvedConversions.length === 0,
    unresolved_required_forms: [...new Set(unresolved)],
    low_confidence_required_forms: [...new Set(lowConfidence)],
    incomplete_nutrition_required_forms: [...new Set(incompleteNutrition)],
    unresolved_conversion_required_forms: [...new Set(unresolvedConversions)],
  }
})
const report = {
  generated_from: 'data/recipes/corpus-v3.json',
  nutrition_source: 'Ciqual 2020',
  forms_total: results.length,
  summary,
  recipes_total: recipeEligibility.length,
  recipes_eligible_for_publication: recipeEligibility.filter((recipe) => recipe.eligible_for_publication).length,
  v1_enriched_eligible_for_publication: recipeEligibility.slice(0, 72).filter((recipe) => recipe.eligible_for_publication).length,
  unresolved_required: results.filter((item) => item.required && !item.selected).map((item) => item.form),
  recipe_eligibility: recipeEligibility,
  forms: results,
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'recipe-food-match-report.json'), JSON.stringify(report, null, 2))
writeFileSync(join(OUT, 'recipe-food-catalog.json'), JSON.stringify({
  corpus_version: corpus.corpus_version,
  source: 'Ciqual 2020 + explicit Myko overrides',
  forms: selectedCatalog,
}, null, 2))
console.log(JSON.stringify({
  forms_total: results.length,
  summary,
  unresolved_required: report.unresolved_required.length,
  recipes_eligible_for_publication: report.recipes_eligible_for_publication,
  v1_enriched_eligible_for_publication: report.v1_enriched_eligible_for_publication,
}, null, 2))
