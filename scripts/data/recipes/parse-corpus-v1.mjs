/**
 * parse-corpus-v1.mjs
 * Parseur déterministe du corpus culinaire Myko V1 (Markdown scraped).
 *
 * Lecture  : data/recipes/sources/corpus-v1-scraped.md (3720 lignes)
 * Écriture : data/recipes/corpus-v1.json
 *
 * Garanties :
 *  - Aucun timestamp ni chemin absolu dans le JSON de sortie.
 *  - Idempotent : exécutions successives sur le même source produisent le même JSON.
 *  - 72 recettes parsées, 160 formes dans forms_order.
 *  - Chaque recette possède ≥ 1 ingrédient et ≥ 1 étape.
 *
 * Usage : node scripts/data/recipes/parse-corpus-v1.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')

// ── Chemins relatifs à la racine du projet ──────────────────────────────────
const SOURCE_PATH = join(ROOT, 'data', 'recipes', 'sources', 'corpus-v1-scraped.md')
const OUTPUT_PATH = join(ROOT, 'data', 'recipes', 'corpus-v1.json')

// ── Lecture du source ───────────────────────────────────────────────────────
const raw = readFileSync(SOURCE_PATH, 'utf8')
const lines = raw.split('\n')

// ══════════════════════════════════════════════════════════════════════════════
// Utilitaires de nettoyage
// ══════════════════════════════════════════════════════════════════════════════

/** Supprime les backticks entourant une valeur et espace autour. */
function stripBackticks(s) {
  return s.replace(/`/g, '').trim()
}

/**
 * Découpe une chaîne par virgule, nettoie chaque fragment.
 * Supprime les backticks dans chaque fragment.
 * @param {string} s
 * @returns {string[]}
 */
function splitComma(s) {
  return s
    .split(',')
    .map((x) => stripBackticks(x))
    .filter((x) => x.length > 0)
}

/**
 * Découpe les variantes sur « ; », préserve les sous-phrases intactes.
 * @param {string} s
 * @returns {string[]}
 */
function splitVariants(s) {
  return s
    .split(';')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
}

// ══════════════════════════════════════════════════════════════════════════════
// Extraction de la section §7 — Ordre recommandé de création des formes
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Cherche la section "## 7." et extrait les 160 entrées de la forme :
 *   N. **Nom de la forme** — K recette(s)
 *
 * @returns {{ rank: number, name: string, recipe_count: number }[]}
 */
function parseForms() {
  // Regex de chaque ligne de forme
  const lineRe = /^(\d+)\.\s+\*\*(.+?)\*\*\s+—\s+(\d+)\s+recette\(s\)/
  const forms = []

  let inSection = false
  for (const line of lines) {
    if (/^## 7\./.test(line)) { inSection = true; continue }
    if (inSection && /^## \d+\./.test(line)) break  // section suivante
    if (!inSection) continue

    const m = lineRe.exec(line)
    if (m) {
      forms.push({
        rank: parseInt(m[1], 10),
        name: m[2].trim(),
        recipe_count: parseInt(m[3], 10),
      })
    }
  }
  return forms
}

// ══════════════════════════════════════════════════════════════════════════════
// Extraction des blocs recettes (section §4)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Découpe le Markdown en blocs de recettes délimités par :
 *   ### CODE — Titre
 * Les blocs se terminent soit à la séparation « --- » suivante, soit au
 * prochain en-tête de même niveau, soit à la fin du document.
 *
 * @returns {{ code: string, title: string, body: string }[]}
 */
function splitRecipeBlocks() {
  // En-tête recette : lettres majuscules + tiret + chiffres
  const headerRe = /^### ([A-Z]+-\d+) — (.+)$/
  const blocks = []
  let current = null

  for (const line of lines) {
    const m = headerRe.exec(line)
    if (m) {
      if (current) blocks.push(current)
      current = { code: m[1], title: m[2].trim(), bodyLines: [] }
      continue
    }
    if (current) {
      // Stopper à la prochaine section de niveau ## (hors recette)
      if (/^## \d+\./.test(line)) {
        blocks.push(current)
        current = null
        continue
      }
      current.bodyLines.push(line)
    }
  }
  if (current) blocks.push(current)

  return blocks.map((b) => ({ code: b.code, title: b.title, body: b.bodyLines.join('\n') }))
}

// ══════════════════════════════════════════════════════════════════════════════
// Parseur d'un bloc recette individuel
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Extrait la valeur après « **Champ** : » sur la même ligne.
 * Retourne null si le champ est absent.
 *
 * @param {string} body
 * @param {string} fieldLabel  Libellé exact tel qu'il apparaît dans le MD (sans **)
 * @returns {string|null}
 */
function extractField(body, fieldLabel) {
  // Accepte des espaces variables après **: et le séparateur :
  const re = new RegExp(`\\*\\*${escapeRegex(fieldLabel)}\\*\\*\\s*:\\s*(.+)`)
  const m = re.exec(body)
  return m ? m[1].trim() : null
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Parse le tableau Markdown des ingrédients.
 * Format attendu :
 *   | Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
 *   |---|---:|---|---|---|
 *   | <form> | <qty> | <unit> | <role> | oui|non |
 *
 * @param {string} body
 * @returns {{ form: string, quantity: number, unit: string, role: string, optional: boolean }[]}
 */
function parseIngredients(body) {
  const ingredients = []
  // Trouver la section ingrédients
  const sectionStart = body.indexOf('#### Ingrédients normalisés')
  if (sectionStart === -1) return ingredients

  const sectionEnd = body.indexOf('\n####', sectionStart + 1)
  const section = sectionEnd === -1 ? body.slice(sectionStart) : body.slice(sectionStart, sectionEnd)

  // Chaque ligne de tableau commence par | et n'est pas la ligne d'en-tête ni le séparateur
  const tableLineRe = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/
  const headerSeen = { seen: false, sep: false }

  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue

    // Ligne d'en-tête (contient "Forme alimentaire")
    if (line.includes('Forme alimentaire')) { headerSeen.seen = true; continue }
    // Ligne séparateur (contient ---)
    if (line.includes('---')) { headerSeen.sep = true; continue }
    if (!headerSeen.seen || !headerSeen.sep) continue

    const m = tableLineRe.exec(line)
    if (!m) continue

    const form = m[1].trim()
    const qtyStr = m[2].trim()
    const unit = m[3].trim().toLowerCase()
    const role = m[4].trim()
    const optStr = m[5].trim().toLowerCase()

    if (!form || form === 'Forme alimentaire exacte') continue

    const quantity = parseFloat(qtyStr)
    const optional = optStr === 'oui'

    ingredients.push({ form, quantity, unit, role, optional })
  }
  return ingredients
}

/**
 * Parse les étapes numérotées de la section « Étapes canoniques originales ».
 * Préserve le texte original (accents, ponctuation) sans paraphrase.
 *
 * @param {string} body
 * @returns {{ n: number, instruction: string }[]}
 */
function parseSteps(body) {
  const steps = []
  const sectionStart = body.indexOf('#### Étapes canoniques originales')
  if (sectionStart === -1) return steps

  const sectionEnd = body.indexOf('\n**Techniques**', sectionStart)
  const section = sectionEnd === -1 ? body.slice(sectionStart) : body.slice(sectionStart, sectionEnd)

  // Ligne numérotée : "N. texte"
  const stepRe = /^(\d+)\.\s+(.+)$/
  for (const line of section.split('\n')) {
    const m = stepRe.exec(line.trim())
    if (m) {
      steps.push({ n: parseInt(m[1], 10), instruction: m[2].trim() })
    }
  }
  return steps
}

/**
 * Parse les techniques (champ **Techniques** : a, b, c.)
 * Supprime le point final éventuel.
 *
 * @param {string} body
 * @returns {string[]}
 */
function parseTechniques(body) {
  const raw = extractField(body, 'Techniques')
  if (!raw) return []
  // Supprimer le point final
  const clean = raw.replace(/\.\s*$/, '').trim()
  return splitComma(clean)
}

/**
 * Parse les variantes (champ **Variantes validables** : …)
 * Découpe sur « ; », conserve les sous-phrases intactes.
 *
 * @param {string} body
 * @returns {string[]}
 */
function parseVariants(body) {
  const raw = extractField(body, 'Variantes validables')
  if (!raw) return []
  // Supprimer le point final éventuel
  const clean = raw.replace(/\.\s*$/, '').trim()
  return splitVariants(clean)
}

/**
 * Parse les allergènes.
 * Quand la valeur contient « aucun », retourne un tableau vide.
 *
 * @param {string} body
 * @returns {string[]}
 */
function parseAllergens(body) {
  const raw = extractField(body, 'Allergènes')
  if (!raw) return []
  if (/aucun/i.test(raw)) return []
  return splitComma(raw.replace(/\.\s*$/, '').trim())
}

/**
 * Parseur principal d'un bloc recette.
 *
 * @param {{ code: string, title: string, body: string }} block
 * @returns {object} Objet recette conforme au schéma corpus-v1.json
 */
function parseRecipe(block) {
  const { code, title, body } = block

  // ── Métadonnées ──────────────────────────────────────────────────────────
  const statutRaw = extractField(body, 'Statut') ?? 'candidate'
  const status = stripBackticks(statutRaw)

  const confianceRaw = extractField(body, 'Confiance') ?? 'B'
  const confidence = stripBackticks(confianceRaw)

  const category = extractField(body, 'Catégorie') ?? ''
  const servingsStr = extractField(body, 'Portions') ?? '0'
  const servings = parseInt(servingsStr, 10)

  // Temps : "préparation 35 min · cuisson 180 min"
  const tempsRaw = extractField(body, 'Temps') ?? ''
  const prepMatch = /préparation\s+(\d+)\s+min/.exec(tempsRaw)
  const cookMatch = /cuisson\s+(\d+)\s+min/.exec(tempsRaw)
  const prep_minutes = prepMatch ? parseInt(prepMatch[1], 10) : null
  const cook_minutes = cookMatch ? parseInt(cookMatch[1], 10) : null

  const difficulty = extractField(body, 'Difficulté') ?? ''

  // Tags : "batch-cooking, congélation, hiver"
  const tagsRaw = extractField(body, 'Tags') ?? ''
  const tags = splitComma(tagsRaw)

  // Sources : "`marmiton_bourguignon`, `bbc_bourguignon`"
  const sourcesRaw = extractField(body, 'Sources de comparaison') ?? ''
  const sources = splitComma(sourcesRaw)

  // Arbitrage (optionnel)
  const arbitrageRaw = extractField(body, 'Arbitrage')
  const arbitrage = arbitrageRaw ? arbitrageRaw.trim() : null

  // ── Ingrédients ──────────────────────────────────────────────────────────
  const ingredients = parseIngredients(body)

  // ── Étapes ───────────────────────────────────────────────────────────────
  const steps = parseSteps(body)

  // ── Champs textuels post-étapes ──────────────────────────────────────────
  const techniques = parseTechniques(body)
  const variants = parseVariants(body)

  const conservationRaw = extractField(body, 'Conservation')
  const conservation = conservationRaw ? conservationRaw.trim() : null

  const allergens = parseAllergens(body)

  return {
    code,
    family: title,
    category,
    status,
    confidence,
    servings,
    prep_minutes,
    cook_minutes,
    difficulty,
    tags,
    sources,
    arbitrage,
    ingredients,
    steps,
    techniques,
    variants,
    conservation,
    allergens,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Exécution principale
// ══════════════════════════════════════════════════════════════════════════════

// Parsing des formes (§7)
const forms_order = parseForms()

// Parsing de tous les blocs recettes
const blocks = splitRecipeBlocks()
const recipes = blocks.map(parseRecipe)

// ── Construction du JSON de sortie ──────────────────────────────────────────
const output = {
  corpus_version: 'scraped-v1',
  source_doc: 'data/recipes/sources/corpus-v1-scraped.md',
  doctrine: {
    status: 'candidate',
    min_confidence: 'B',
  },
  forms_order,
  recipes,
}

// ── Écriture du fichier ──────────────────────────────────────────────────────
mkdirSync(join(ROOT, 'data', 'recipes'), { recursive: true })
writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8')

// ══════════════════════════════════════════════════════════════════════════════
// Résumé de validation (émis sur stdout, jamais inclus dans le JSON)
// ══════════════════════════════════════════════════════════════════════════════

// Formes d'ingrédients distinctes à travers toutes les recettes
const distinctForms = new Set(
  recipes.flatMap((r) => r.ingredients.map((i) => i.form))
)

// Recettes avec 0 ingrédient ou 0 étape
const noIngredients = recipes.filter((r) => r.ingredients.length === 0).map((r) => r.code)
const noSteps = recipes.filter((r) => r.steps.length === 0).map((r) => r.code)

// Validation des compteurs attendus
const errors = []
if (recipes.length !== 72) {
  errors.push(`ERREUR : ${recipes.length} recettes parsées, attendu 72`)
}
if (forms_order.length !== 160) {
  errors.push(`ERREUR : ${forms_order.length} formes dans forms_order, attendu 160`)
}
if (noIngredients.length > 0) {
  errors.push(`ERREUR : recettes sans ingrédients → ${noIngredients.join(', ')}`)
}
if (noSteps.length > 0) {
  errors.push(`ERREUR : recettes sans étapes → ${noSteps.join(', ')}`)
}

const summary = {
  recipe_count: recipes.length,
  forms_order_length: forms_order.length,
  distinct_ingredient_forms: distinctForms.size,
  recipes_with_0_ingredients: noIngredients,
  recipes_with_0_steps: noSteps,
  validation_errors: errors,
  output_path: 'data/recipes/corpus-v1.json',
}

console.log(JSON.stringify(summary, null, 2))

if (errors.length > 0) {
  process.exit(1)
}
