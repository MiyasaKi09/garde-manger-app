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
import { gunzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseCiqualWorkbook } from '../parse/ciqual.mjs'
import { normalizeName, parseFoodName } from '../lib/normalize.mjs'
import { resolveCategory } from '../lib/categories.mjs'
import { comblerParAtwater } from '../lib/atwater.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const OUT = join(__dirname, '..', 'out')
const CORPUS_PATH = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const CIQUAL_PATH = join(ROOT, 'data', 'sources', 'raw', 'ciqual_2020_FR_2020-07-07.xls.gz')
const MAPPINGS_PATH = join(ROOT, 'data', 'foods', 'recipe-food-mappings-v3.json')
const NUTRITION_PATH = join(ROOT, 'data', 'ciqual_nutrition_import.csv')

// Référence USDA distillée : complément de Ciqual pour les aliments absents du
// classeur français et pour les macronutriments que l'ANSES ne mesure pas. La
// provenance reste tracée par entrée — une valeur américaine ne doit jamais
// pouvoir passer pour une mesure de l'ANSES.
const USDA_PATH = join(ROOT, 'data', 'foods', 'usda-reference', 'sr-legacy-macros.json.gz')
const usdaByFdcId = new Map()
if (existsSync(USDA_PATH)) {
  const usda = JSON.parse(gunzipSync(readFileSync(USDA_PATH)).toString('utf8'))
  for (const entry of usda.entries || []) usdaByFdcId.set(String(entry.fdc_id), entry)
}

const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'))
const mappings = existsSync(MAPPINGS_PATH)
  ? JSON.parse(readFileSync(MAPPINGS_PATH, 'utf8')).mappings || {}
  : {}
const { records } = parseCiqualWorkbook(CIQUAL_PATH)

// Une référence USDA se transcrit à la main, donc elle se trompe : au premier
// lot, trois identifiants sur dix désignaient un autre aliment — le congre
// pointait sur du saumon sockeye, la morue salée sur du thon. Les chiffres
// tombaient juste par hasard (tous les poissons ont zéro glucide) et la
// provenance mentait sans que rien ne le montre. Chaque mapping porte donc le
// libellé attendu, et le générateur refuse de démarrer s'il ne correspond pas.
const desaccordsUsda = []
for (const [cle, mapping] of Object.entries(mappings)) {
  if (!mapping?.usda_fdc_id) continue
  const entree = usdaByFdcId.get(String(mapping.usda_fdc_id))
  if (!entree) { desaccordsUsda.push(`${cle} : identifiant USDA ${mapping.usda_fdc_id} introuvable`); continue }
  if (mapping.usda_name && mapping.usda_name !== entree.description) {
    desaccordsUsda.push(`${cle} : USDA ${mapping.usda_fdc_id} est « ${entree.description} », le mapping annonce « ${mapping.usda_name} »`)
  }
}
if (desaccordsUsda.length) {
  console.error('Références USDA incohérentes :')
  for (const ecart of desaccordsUsda) console.error(`  - ${ecart}`)
  process.exit(1)
}

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

function conversionFor(form, units, explicit = null) {
  const normalized = normalizeName(form)
  const conversion = {}
  // Une conversion arbitrée l'emporte sur la table interne : la décision et son
  // poids appartiennent au même endroit, faute de quoi arbitrer une forme
  // comptée en unités obligerait à modifier le script en plus du registre.
  if (Number.isFinite(explicit?.grams_per_unit)) conversion.grams_per_unit = explicit.grams_per_unit
  if (Number.isFinite(explicit?.density_g_per_ml)) conversion.density_g_per_ml = explicit.density_g_per_ml
  if (units.has('u') && !conversion.grams_per_unit && UNIT_WEIGHTS_G.has(normalized)) conversion.grams_per_unit = UNIT_WEIGHTS_G.get(normalized)
  if (units.has('tranche') && !conversion.grams_per_unit) {
    if (/jambon/.test(normalized)) conversion.grams_per_unit = 40
    if (/pain de mie/.test(normalized)) conversion.grams_per_unit = 30
  }
  if (units.has('ml') && !conversion.density_g_per_ml) {
    if (/huile/.test(normalized)) conversion.density_g_per_ml = 0.92
    else if (/rhum|alcool/.test(normalized)) conversion.density_g_per_ml = 0.95
    else if (/lait|creme|yaourt/.test(normalized)) conversion.density_g_per_ml = 1.03
    else if (/jus de citron/.test(normalized)) conversion.density_g_per_ml = 1.03
    else if (/eau|bouillon|vin|biere|vinaigre|cafe|vanille liquide|marsala/.test(normalized)) conversion.density_g_per_ml = 1
  }
  return conversion
}

// Fermeture énergétique d'Atwater : voir scripts/data/lib/atwater.mjs.

const allRecords = records
  .map((record) => {
    // Le classeur ANSES fait foi, le CSV ne sert qu'en secours.
    //
    // L'inverse était en place, et le CSV s'est révélé faux sur les fibres pour
    // 153 des 233 formes comparables. Deux défauts distincts : il sous-estime
    // massivement les épices et herbes séchées (cannelle 3,6 g quand l'ANSES
    // mesure 53,1 ; curry 7,07 pour 53,2 ; laurier 3,62 pour 26,3), et sur les
    // condiments salés il porte carrément la teneur en SEL — sauce poisson
    // 22,2 g de « fibres » là où le classeur lit 0,2 g de fibres et 22,2 g de
    // sel. Servir du sel sous l'étiquette « fibres » n'est pas une imprécision.
    //
    // Le CSV n'a par ailleurs aucune provenance vérifiable : il a été produit
    // par un script `/data/import_ciqual.sh` qui ne vit pas dans le dépôt. Le
    // classeur, lui, porte son sha256 au registre des sources. On le garde
    // néanmoins comme secours, car il couvre des codes que le classeur laisse
    // vides — et comme seule source d'énergie, absente du classeur.
    const imported = nutritionByCode.get(record.alim_code) || {}
    const protein = record.values.protein_g ?? imported.protein_g ?? null
    const carbohydrate = record.values.carbohydrate_g ?? imported.carbohydrate_g ?? null
    const fat = record.values.fat_g ?? imported.fat_g ?? null
    const fiber = record.values.fiber_g ?? imported.fiber_g ?? null
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
  // Une référence USDA n'est retenue que si elle est explicitement demandée, et
  // JAMAIS en remplacement d'une valeur française existante. Deux usages, et
  // deux seulement :
  //   - aliment absent de Ciqual (ghee, riz jasmin) : l'entrée USDA fait foi ;
  //   - aliment présent mais dont l'ANSES ne mesure pas toutes les macros
  //     (les glucides du cabillaud, du comté) : Ciqual reste la base et USDA
  //     ne COMBLE que les champs manquants, champ par champ.
  // Écraser une mesure de l'ANSES par une mesure américaine serait perdre de
  // l'information sans le dire.
  const usdaEntry = explicit?.usda_fdc_id ? usdaByFdcId.get(String(explicit.usda_fdc_id)) : null
  const usdaNutrition = usdaEntry ? {
    energy_kcal: usdaEntry.per100g.kcal,
    protein_g: usdaEntry.per100g.proteinG,
    carbohydrate_g: usdaEntry.per100g.carbsG,
    fat_g: usdaEntry.per100g.fatG,
    fiber_g: usdaEntry.per100g.fiberG,
  } : null
  const baseCiqual = explicit?.ciqual_alim_code ? byCode.get(String(explicit.ciqual_alim_code)) : exact?.record
  const champsCombles = []
  const selected = explicit?.nutrition_override
    ? {
        alim_code: null,
        alim_nom_fr: usage.name,
        category: explicit.category,
        nutrition: explicit.nutrition_override,
      }
    : usdaNutrition && baseCiqual
      ? {
          ...baseCiqual,
          nutrition: Object.fromEntries(Object.entries(baseCiqual.nutrition).map(([champ, valeur]) => {
            if (Number.isFinite(valeur)) return [champ, valeur]
            const secours = usdaNutrition[champ]
            if (Number.isFinite(secours)) champsCombles.push(champ)
            return [champ, Number.isFinite(secours) ? secours : valeur]
          })),
        }
      : usdaNutrition
        ? {
            alim_code: String(usdaEntry.fdc_id),
            alim_nom_fr: usdaEntry.description,
            category: explicit.category || null,
            nutrition: usdaNutrition,
          }
        : baseCiqual
  // Dernier recours, après Ciqual puis USDA : fermeture énergétique. Elle doit
  // intervenir AVANT que `nutrition_complete` ne soit évalué, sans quoi la
  // valeur comblée n'atteindrait jamais le verdict d'éligibilité. Et sur une
  // COPIE : `baseCiqual` est l'enregistrement partagé par toutes les formes qui
  // pointent le même code Ciqual, le muter ferait fuiter la valeur dérivée
  // ailleurs, sans mention de provenance.
  const derive = selected?.nutrition ? comblerParAtwater(selected.nutrition) : null
  const retenu = derive
    ? { ...selected, nutrition: { ...selected.nutrition, [derive.champ]: derive.valeur } }
    : selected
  const selectionMode = explicit ? 'curated' : exact ? 'exact_label' : 'review_required'
  results.push({
    form: usage.name,
    normalized,
    required: usage.required,
    recipe_count: usage.recipes.size,
    units: [...usage.units].sort(),
    selection_mode: selectionMode,
    selected: retenu ? {
      ciqual_alim_code: retenu.alim_code,
      ciqual_name: retenu.alim_nom_fr,
      category: explicit?.category || retenu.category,
      nutrition_complete: ['energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g']
        .every((key) => Number.isFinite(retenu.nutrition?.[key])),
      ...(derive ? { derived_field: derive.champ } : {}),
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
  if (retenu) {
    selectedCatalog.push({
      canonical_name: usage.name,
      canonical_name_normalized: normalized,
      category: explicit?.category || retenu.category,
      confidence: explicit?.confidence || 'B',
      source: explicit?.nutrition_override
        ? 'myko_curated_override'
        : champsCombles.length ? 'ciqual_2020+usda_fdc'
          : explicit?.usda_fdc_id && !baseCiqual ? 'usda_fdc' : 'ciqual_2020',
      ...(champsCombles.length ? { filled_from_usda: { fdc_id: String(explicit.usda_fdc_id), fields: champsCombles } } : {}),
      ...(derive ? {
        derived: {
          field: derive.champ,
          value: derive.valeur,
          ...(derive.valeur_brute !== undefined ? { raw_value: derive.valeur_brute, clamped_to_zero: true } : {}),
          method: 'atwater_closure',
          formula: derive.formule,
        },
      } : {}),
      source_record_key: retenu.alim_code,
      source_name: retenu.alim_nom_fr,
      state: parseFoodName(usage.name),
      units_used: [...usage.units].sort(),
      conversion: conversionFor(usage.name, usage.units, explicit),
      per100g: {
        kcal: retenu.nutrition?.energy_kcal ?? null,
        proteinG: retenu.nutrition?.protein_g ?? null,
        carbsG: retenu.nutrition?.carbohydrate_g ?? null,
        fatG: retenu.nutrition?.fat_g ?? null,
        fiberG: retenu.nutrition?.fiber_g ?? null,
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
  // « Non éligible » recouvre deux situations très différentes : une recette
  // dont un ingrédient reste inconnu, et une recette entièrement résolue dont
  // une seule référence est un proxy assumé. La seconde n'attend pas un travail
  // de recherche mais une décision — et le compte global la taisait.
  recipes_blocked_only_by_proxy: recipeEligibility.filter((recipe) => !recipe.eligible_for_publication
    && recipe.low_confidence_required_forms.length > 0
    && recipe.unresolved_required_forms.length === 0
    && recipe.incomplete_nutrition_required_forms.length === 0
    && recipe.unresolved_conversion_required_forms.length === 0).length,
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
  recipes_blocked_only_by_proxy: report.recipes_blocked_only_by_proxy,
  v1_enriched_eligible_for_publication: report.v1_enriched_eligible_for_publication,
}, null, 2))
