// lib/aiRecipeSchema.js
// Validation maison (zéro dépendance) des recettes générées par l'IA.
//
// Philosophie : RÉPARER quand c'est possible (trim, coercion numérique,
// renumérotation des étapes, suppression des lignes vides), collecter chaque
// réparation dans `errors`, et ne refuser (ok=false) que l'irréparable :
// pas de titre, aucun ingrédient valide, aucune étape valide.
// Les routes appelantes ne doivent JAMAIS persister quoi que ce soit quand
// ok=false (pas de sauvegarde partielle).

const MAX_TITLE = 200
const MAX_DESCRIPTION = 1000
const MAX_UNIT = 20
const MAX_NOTES = 200
const MAX_INSTRUCTION = 2000
const MAX_CHEF_TIPS = 1000
const MAX_INGREDIENTS = 40
const MAX_STEPS = 30
const MIN_SERVINGS = 1
const MAX_SERVINGS = 24
const DEFAULT_SERVINGS = 2

const NUTRITION_KEYS = ['kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g']

/**
 * Coerce une valeur vers un nombre fini, ou null.
 * Accepte les chaînes numériques ("12", " 12.5 ", "12,5" avec virgule).
 */
function toNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const s = value.trim().replace(',', '.')
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Coerce vers une chaîne trimée ('' si non représentable). */
function toCleanString(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Valide et répare une recette générée par l'IA.
 *
 * Règles :
 * - title       : chaîne non vide, ≤ 200 caractères (tronqué sinon). Absent → ok=false.
 * - servings    : entier 1-24 (coercition + arrondi ; hors bornes → défaut 2).
 * - ingredients : tableau 1-40 de { name non vide, quantity > 0 ou null,
 *                 unit ≤ 20 ('' ok), notes ≤ 200 }. Lignes sans nom ou à
 *                 quantité ≤ 0 supprimées. Zéro ligne valide → ok=false.
 * - steps       : tableau 1-30 de { step_no entier positif (renuméroté 1..n),
 *                 instruction non vide ≤ 2000, duration_min > 0 ou null }.
 *                 Étapes sans instruction supprimées. Zéro étape → ok=false.
 * - chef_tips   : chaîne ≤ 1000 ou null.
 * - nutrition_per_serving : null ou objet { kcal, protein_g, carbs_g, fat_g,
 *                 fiber_g } numériques nullable (chaînes coercées, négatifs rejetés → null).
 *
 * @param {*} obj recette brute (sortie JSON du modèle)
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
export function validateGeneratedRecipe(obj) {
  const errors = []

  if (!isPlainObject(obj)) {
    return { ok: false, errors: ['recette : objet JSON attendu'], value: null }
  }

  const value = {}

  // ── title (irréparable si absent) ──
  let title = toCleanString(obj.title)
  if (!title) {
    errors.push('title : chaîne non vide requise')
    return { ok: false, errors, value: null }
  }
  if (title.length > MAX_TITLE) {
    errors.push(`title : tronqué à ${MAX_TITLE} caractères`)
    title = title.slice(0, MAX_TITLE).trim()
  }
  value.title = title

  // ── description (pass-through nettoyé) ──
  const description = toCleanString(obj.description)
  value.description = description ? description.slice(0, MAX_DESCRIPTION) : null

  // ── servings ──
  let servings = toNumber(obj.servings)
  if (servings == null) {
    if (obj.servings != null) errors.push(`servings : non numérique, défaut ${DEFAULT_SERVINGS}`)
    servings = DEFAULT_SERVINGS
  } else {
    servings = Math.round(servings)
    if (servings < MIN_SERVINGS || servings > MAX_SERVINGS) {
      errors.push(`servings : hors bornes ${MIN_SERVINGS}-${MAX_SERVINGS}, défaut ${DEFAULT_SERVINGS}`)
      servings = DEFAULT_SERVINGS
    }
  }
  value.servings = servings

  // ── prep_min / cook_min (pass-through coercé, jamais bloquant) ──
  for (const key of ['prep_min', 'cook_min']) {
    const n = toNumber(obj[key])
    value[key] = n != null && n > 0 ? Math.round(n) : null
  }

  // ── ingredients ──
  if (!Array.isArray(obj.ingredients)) {
    errors.push('ingredients : tableau attendu')
  }
  const rawIngredients = Array.isArray(obj.ingredients) ? obj.ingredients : []
  const ingredients = []
  rawIngredients.forEach((row, i) => {
    if (!isPlainObject(row)) {
      errors.push(`ingredients[${i}] : ligne invalide supprimée`)
      return
    }
    const name = toCleanString(row.name)
    if (!name) {
      errors.push(`ingredients[${i}] : nom vide, ligne supprimée`)
      return
    }
    let quantity = null
    if (row.quantity != null && row.quantity !== '') {
      quantity = toNumber(row.quantity)
      if (quantity == null) {
        errors.push(`ingredients[${i}] (${name}) : quantité non numérique → null`)
      } else if (quantity <= 0) {
        errors.push(`ingredients[${i}] (${name}) : quantité ≤ 0, ligne supprimée`)
        return
      }
    }
    let unit = toCleanString(row.unit)
    if (unit.length > MAX_UNIT) {
      errors.push(`ingredients[${i}] (${name}) : unité tronquée à ${MAX_UNIT} caractères`)
      unit = unit.slice(0, MAX_UNIT).trim()
    }
    let notes = toCleanString(row.notes)
    if (notes.length > MAX_NOTES) {
      errors.push(`ingredients[${i}] (${name}) : notes tronquées à ${MAX_NOTES} caractères`)
      notes = notes.slice(0, MAX_NOTES).trim()
    }
    const cleaned = { name, quantity, unit, notes }
    // per100g : pass-through (utilisé par le calcul nutrition en aval).
    if (isPlainObject(row.per100g)) cleaned.per100g = row.per100g
    ingredients.push(cleaned)
  })
  if (ingredients.length > MAX_INGREDIENTS) {
    errors.push(`ingredients : tronqué à ${MAX_INGREDIENTS} lignes`)
    ingredients.length = MAX_INGREDIENTS
  }
  if (ingredients.length === 0) {
    errors.push('ingredients : aucun ingrédient valide')
    return { ok: false, errors, value: null }
  }
  value.ingredients = ingredients

  // ── steps ──
  if (!Array.isArray(obj.steps)) {
    errors.push('steps : tableau attendu')
  }
  const rawSteps = Array.isArray(obj.steps) ? obj.steps : []
  const steps = []
  let needsRenumber = false
  rawSteps.forEach((row, i) => {
    if (!isPlainObject(row)) {
      errors.push(`steps[${i}] : étape invalide supprimée`)
      return
    }
    let instruction = toCleanString(row.instruction)
    if (!instruction) {
      errors.push(`steps[${i}] : instruction vide, étape supprimée`)
      return
    }
    if (instruction.length > MAX_INSTRUCTION) {
      errors.push(`steps[${i}] : instruction tronquée à ${MAX_INSTRUCTION} caractères`)
      instruction = instruction.slice(0, MAX_INSTRUCTION).trim()
    }
    let duration = null
    if (row.duration_min != null && row.duration_min !== '') {
      duration = toNumber(row.duration_min)
      if (duration == null || duration <= 0) {
        errors.push(`steps[${i}] : duration_min invalide → null`)
        duration = null
      }
    }
    const providedNo = toNumber(row.step_no)
    if (providedNo == null || Math.round(providedNo) !== steps.length + 1) {
      needsRenumber = true
    }
    steps.push({ step_no: steps.length + 1, instruction, duration_min: duration })
  })
  if (steps.length > MAX_STEPS) {
    errors.push(`steps : tronqué à ${MAX_STEPS} étapes`)
    steps.length = MAX_STEPS
  }
  if (steps.length === 0) {
    errors.push('steps : aucune étape valide')
    return { ok: false, errors, value: null }
  }
  if (needsRenumber) {
    errors.push('steps : step_no renumérotés séquentiellement (1..n)')
  }
  value.steps = steps

  // ── chef_tips ──
  let chefTips = obj.chef_tips == null ? null : toCleanString(obj.chef_tips)
  if (chefTips === '') chefTips = null
  if (chefTips && chefTips.length > MAX_CHEF_TIPS) {
    errors.push(`chef_tips : tronqué à ${MAX_CHEF_TIPS} caractères`)
    chefTips = chefTips.slice(0, MAX_CHEF_TIPS).trim()
  }
  value.chef_tips = chefTips

  // ── nutrition_per_serving ──
  let nutrition = null
  if (obj.nutrition_per_serving != null) {
    if (!isPlainObject(obj.nutrition_per_serving)) {
      errors.push('nutrition_per_serving : objet attendu → null')
    } else {
      nutrition = {}
      for (const key of NUTRITION_KEYS) {
        const raw = obj.nutrition_per_serving[key]
        if (raw == null || raw === '') {
          nutrition[key] = null
          continue
        }
        const n = toNumber(raw)
        if (n == null) {
          errors.push(`nutrition_per_serving.${key} : non numérique → null`)
          nutrition[key] = null
        } else if (n < 0) {
          errors.push(`nutrition_per_serving.${key} : valeur négative rejetée → null`)
          nutrition[key] = null
        } else {
          nutrition[key] = n
        }
      }
    }
  }
  value.nutrition_per_serving = nutrition

  return { ok: true, errors, value }
}
