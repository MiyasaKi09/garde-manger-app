/**
 * Deterministic parser for the Myko V3 canonical culinary corpus.
 *
 * Input:  data/recipes/sources/corpus-v3-300-real-dishes.md
 * Output: data/recipes/corpus-v3.json
 *
 * The Markdown remains the editorial source of truth. The JSON is a stable,
 * machine-readable artefact used by loaders, quality checks and the planner.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const SOURCE_REL = 'data/recipes/sources/corpus-v3-300-real-dishes.md'
const OUTPUT_REL = 'data/recipes/corpus-v3.json'
const SOURCE_PATH = join(ROOT, ...SOURCE_REL.split('/'))
const OUTPUT_PATH = join(ROOT, ...OUTPUT_REL.split('/'))
const raw = readFileSync(SOURCE_PATH, 'utf8').replace(/\r\n/g, '\n')
const lines = raw.split('\n')

const stripTicks = (value = '') => value.replace(/`/g, '').trim()
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const splitList = (value = '') => value
  .replace(/\.\s*$/, '')
  .split(/[;,]/)
  .map(stripTicks)
  .filter((item) => item && !/^aucun/i.test(item))

function extractField(body, label) {
  const match = new RegExp(`^- \\*\\*${escapeRegex(label)}\\*\\*\\s*:\\s*(.+)$`, 'm').exec(body)
  return match ? match[1].trim() : null
}

function section(body, heading, next = /\n#### |\n\*\*Techniques\*\*/) {
  const start = body.indexOf(`#### ${heading}`)
  if (start < 0) return ''
  const rest = body.slice(start + heading.length + 5)
  const match = next.exec(rest)
  return match ? rest.slice(0, match.index) : rest
}

function parseIndex() {
  const start = raw.indexOf('## 5. Index des recettes')
  const end = raw.indexOf('## 6.', start)
  const map = new Map()
  for (const line of raw.slice(start, end).split('\n')) {
    const match = /^\| `([^`]+)` \| (.+?) \| (.+?) \| `([^`]+)` \| `([^`]+)` \|$/.exec(line)
    if (!match) continue
    map.set(match[1], {
      title: match[2],
      cuisine: match[3],
      identity_level: match[4],
      sensory_profile: match[5],
    })
  }
  return map
}

function parseFormsGraph() {
  const start = raw.indexOf('## 7. Graphe formes alimentaires')
  const end = raw.indexOf('## 8.', start)
  const forms = []
  for (const line of raw.slice(start, end).split('\n')) {
    const match = /^\| (.+?) \| (\d+) \| (.+?) \|$/.exec(line)
    if (!match || match[1] === 'Forme alimentaire') continue
    forms.push({
      name: match[1],
      normalized: normalizeName(match[1]),
      recipe_count: Number(match[2]),
      recipes: match[3].split(',').map((item) => item.trim()).filter(Boolean),
    })
  }
  return forms
}

function parseGraph(sectionNumber, nextSection, firstColumn, key) {
  const start = raw.indexOf(`## ${sectionNumber}.`)
  const end = raw.indexOf(`## ${nextSection}.`, start)
  const entries = []
  for (const line of raw.slice(start, end).split('\n')) {
    const match = /^\| (.+?) \| (\d+) \| (.+?) \|$/.exec(line)
    if (!match || match[1] === firstColumn) continue
    entries.push({
      [key]: match[1],
      recipe_count: Number(match[2]),
      recipes: match[3].split(',').map((item) => item.trim()).filter(Boolean),
    })
  }
  return entries
}

function splitRecipeBlocks() {
  const header = /^### ([A-Z]+-\d+) — (.+)$/
  const blocks = []
  let current = null
  let inRecipes = false
  for (const line of lines) {
    if (line === '## 6. Fiches canoniques complètes') { inRecipes = true; continue }
    if (inRecipes && /^## 7\./.test(line)) break
    if (!inRecipes) continue
    const match = header.exec(line)
    if (match) {
      if (current) blocks.push(current)
      current = { code: match[1], title: match[2].trim(), lines: [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) blocks.push(current)
  return blocks.map((block) => ({ ...block, body: block.lines.join('\n') }))
}

function parseIngredients(body) {
  const result = []
  for (const line of section(body, 'Ingrédients normalisés').split('\n')) {
    const match = /^\|\s*(.+?)\s*\|\s*([0-9]+(?:[.,][0-9]+)?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(oui|non)\s*\|$/.exec(line)
    if (!match || match[1] === 'Forme alimentaire exacte') continue
    result.push({
      form: match[1].trim(),
      quantity: Number(match[2].replace(',', '.')),
      unit: match[3].trim().toLowerCase(),
      role: match[4].trim(),
      optional: match[5] === 'oui',
    })
  }
  return result
}

function parseSteps(body) {
  const result = []
  for (const line of section(body, 'Méthode canonique').split('\n')) {
    const match = /^(\d+)\.\s+(.+)$/.exec(line.trim())
    if (match) result.push({ n: Number(match[1]), instruction: match[2].trim() })
  }
  return result
}

const SENSORY_KEYS = new Map([
  ['sucre', 'sweet'], ['sale', 'salty'], ['acide', 'acidic'], ['amer', 'bitter'],
  ['umami', 'umami'], ['chaleur pimentee', 'heat'], ['pungence', 'pungency'],
  ['richesse', 'richness'], ['fraicheur', 'freshness'], ['intensite', 'intensity'],
])

function parseSensory(body) {
  const scores = {}
  for (const line of section(body, 'Empreinte sensorielle', /\n---|$/).split('\n')) {
    const match = /^\| (.+?) \| ([0-5])\/5 \|$/.exec(line)
    if (!match) continue
    const key = SENSORY_KEYS.get(normalizeName(match[1]))
    if (key) scores[key] = Number(match[2])
  }
  return scores
}

function matchedIngredientList(rawValue, ingredients) {
  if (!rawValue) return []
  return ingredients
    .filter((ingredient) => rawValue.includes(ingredient.form))
    .sort((a, b) => rawValue.indexOf(a.form) - rawValue.indexOf(b.form))
    .map((ingredient) => ingredient.form)
}

function parseRecipe(block, indexMap) {
  const body = block.body
  const index = indexMap.get(block.code) || {}
  const statusConfidence = (extractField(body, 'Statut / confiance') || 'candidate / B')
    .split('/').map(stripTicks)
  const time = extractField(body, 'Temps') || ''
  const ingredients = parseIngredients(body)
  const signatureRaw = extractField(body, 'Ingrédients signatures') || ''
  return {
    code: block.code,
    family: block.title,
    cuisine_origin: extractField(body, 'Cuisine / origine') || index.cuisine || null,
    identity_level: stripTicks(extractField(body, 'Identité') || index.identity_level || ''),
    category: extractField(body, 'Catégorie') || null,
    status: statusConfidence[0] || 'candidate',
    confidence: statusConfidence[1] || 'B',
    servings: Number(extractField(body, 'Portions')),
    prep_minutes: Number(/préparation\s+(\d+)\s+min/.exec(time)?.[1] || 0),
    cook_minutes: Number(/cuisson\s+(\d+)\s+min/.exec(time)?.[1] || 0),
    difficulty: extractField(body, 'Difficulté') || null,
    sources: splitList(extractField(body, 'Sources-signaux') || ''),
    canonical_arbitration: extractField(body, 'Arbitrage canonique'),
    ingredients,
    steps: parseSteps(body),
    techniques: splitList((/^\*\*Techniques\*\*\s*:\s*(.+)$/m.exec(body)?.[1]) || ''),
    variants: splitList((/^\*\*Variantes candidates\*\*\s*:\s*(.+)$/m.exec(body)?.[1]) || ''),
    sensory: {
      profile: index.sensory_profile || null,
      scores: parseSensory(body),
      dominant_flavors: splitList(extractField(body, 'Dominantes') || ''),
      aroma_families: splitList(extractField(body, 'Aromas signatures') || ''),
      target_textures: splitList(extractField(body, 'Textures cibles') || ''),
      signature_ingredients: matchedIngredientList(signatureRaw, ingredients),
      identity_guardrails: splitList(extractField(body, 'Garde-fous / dérives interdites') || ''),
    },
    conservation: extractField(body, 'Conservation'),
    allergens: splitList(extractField(body, 'Allergènes structurels') || ''),
  }
}

function parsePlannerRules() {
  const start = raw.indexOf('## 10. Règles de planification sensorielle')
  const end = raw.indexOf('## 11.', start)
  return raw.slice(start, end).split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).replace(/;$/, '').trim())
}

function parseDeclaredSummary() {
  const start = raw.indexOf('## 11. Résumé machine')
  const match = /```json\s*([\s\S]+?)```/.exec(raw.slice(start))
  return match ? JSON.parse(match[1]) : null
}

const index = parseIndex()
const foodForms = parseFormsGraph()
const recipes = splitRecipeBlocks().map((block) => parseRecipe(block, index))
const sourceSha256 = createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex')
const declaredSummary = parseDeclaredSummary()
const output = {
  corpus_version: 'v3-300-real-dishes',
  source_doc: SOURCE_REL,
  source_sha256: sourceSha256,
  declared_content_sha256: declaredSummary?.content_sha256 || null,
  doctrine: {
    status: declaredSummary?.status || 'candidate',
    min_confidence: declaredSummary?.minimum_confidence || 'B',
    invalidates: declaredSummary?.invalidates || null,
    substitution_requires_identity_and_texture_preservation: true,
  },
  planner_sensory_rules: parsePlannerRules(),
  forms_order: foodForms.map((form, rank) => ({ rank: rank + 1, name: form.name, recipe_count: form.recipe_count })),
  food_form_graph: foodForms,
  technique_graph: parseGraph(8, 9, 'Technique', 'technique'),
  aroma_graph: parseGraph(9, 10, 'Aroma', 'aroma'),
  recipes,
}

const distinctForms = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.form)))
const normalizedForms = new Map()
for (const form of distinctForms) {
  const key = normalizeName(form)
  if (!normalizedForms.has(key)) normalizedForms.set(key, [])
  normalizedForms.get(key).push(form)
}
const errors = []
if (recipes.length !== 302) errors.push(`recipe_count=${recipes.length}, attendu 302`)
if (foodForms.length !== 727) errors.push(`food_form_graph=${foodForms.length}, attendu 727`)
if (distinctForms.size !== 727) errors.push(`distinct_forms=${distinctForms.size}, attendu 727`)
const missingIngredients = recipes.filter((recipe) => recipe.ingredients.length === 0).map((recipe) => recipe.code)
const missingSteps = recipes.filter((recipe) => recipe.steps.length === 0).map((recipe) => recipe.code)
const incompleteSensory = recipes.filter((recipe) => Object.keys(recipe.sensory.scores).length !== 10).map((recipe) => recipe.code)
if (missingIngredients.length) errors.push(`sans ingrédients: ${missingIngredients.join(', ')}`)
if (missingSteps.length) errors.push(`sans étapes: ${missingSteps.join(', ')}`)
if (incompleteSensory.length) errors.push(`empreinte sensorielle incomplète: ${incompleteSensory.join(', ')}`)

mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({
  recipe_count: recipes.length,
  food_form_count: distinctForms.size,
  technique_count: output.technique_graph.length,
  aroma_count: output.aroma_graph.length,
  normalized_form_collisions: [...normalizedForms.values()].filter((items) => items.length > 1),
  source_sha256: sourceSha256,
  declared_hash_matches_source: sourceSha256 === declaredSummary?.content_sha256,
  validation_errors: errors,
  output_path: OUTPUT_REL,
}, null, 2))
if (errors.length) process.exit(1)
