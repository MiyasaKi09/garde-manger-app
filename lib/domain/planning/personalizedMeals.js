import { classifyRecipe } from './closedLoopPlanner'
import { normalizeFoodForm } from '../recipes/materializeRecipe'
import { getMemberPlanningRules } from './memberPlanningRules'
import { matchesBannedFood } from './foodBanMatch'

const NUTRIENTS = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
const FRUITS = ['pomme', 'kiwi', 'poire', 'banane', 'pêche', 'nectarine', 'orange']

// Plancher protéique journalier. Les dimensions sont évaluées séparément et
// peuvent placer la version en revue sans jamais gonfler artificiellement les
// assiettes au-delà des bornes physiques.
const PROTEIN_FLOOR_RATIO = 0.9
const MACRO_LIMITS = { carbsG: 0.2, fatG: 0.2, fiberG: -0.2 }

const MICRONUTRIENT_DAILY_REFERENCES = {
  calcium_mg: 800,
  fer_mg: 14,
  magnesium_mg: 375,
  zinc_mg: 10,
  selenium_ug: 55,
  vitamine_a_ug: 800,
  vitamine_c_mg: 80,
  vitamine_d_ug: 5,
  vitamine_b9_ug: 200,
  vitamine_b12_ug: 2.5,
  potassium_mg: 2000,
}

// `aliases` : noms ALTERNATIFS que portent réellement les lots de production
// (canonical_foods.canonical_name / archetypes.name — vérifiés dans
// supabase/exports/latest/csv). Le matching stock reste une égalité EXACTE sur
// formes normalisées : chaque alias est un nom du vocabulaire réel (ou un
// synonyme strict), et aucun alias n'est identique au nom normalisé d'un
// AUTRE aliment ('pain' ne capte jamais 'pain d épices').
const FOOD = {
  skyr: {
    label: 'skyr nature', unit: 'g', per: 100,
    packageSize: 200, packageUnit: 'g', packageLabel: 'pot',
    nutrition: { kcal: 63, proteinG: 11, carbsG: 4, fatG: 0.2, fiberG: 0 },
    allergens: ['lait'], diets: ['vegetarian'],
  },
  oats: {
    label: 'flocons d’avoine', unit: 'g', per: 100,
    nutrition: { kcal: 370, proteinG: 13, carbsG: 59, fatG: 7, fiberG: 10 },
    aliases: ["flocon d'avoine", 'avoine'], allergens: ['gluten'], diets: ['vegan'],
  },
  eggs: {
    label: 'œufs durs', unit: 'œuf', per: 1,
    nutrition: { kcal: 78, proteinG: 6.3, carbsG: 0.6, fatG: 5.3, fiberG: 0 }, gramsPerUnit: 60,
    aliases: ['œuf'], allergens: ['oeuf'], diets: ['vegetarian'],
  },
  almonds: {
    label: 'amandes', unit: 'g', per: 100,
    nutrition: { kcal: 579, proteinG: 21, carbsG: 9, fatG: 50, fiberG: 12.5 },
    aliases: ['amande'], allergens: ['fruits a coque', 'amande'], diets: ['vegan'],
  },
  bread: {
    label: 'pain complet', unit: 'g', per: 100,
    nutrition: { kcal: 265, proteinG: 9, carbsG: 49, fatG: 3.2, fiberG: 4.9 },
    aliases: ['pain'], allergens: ['gluten'], diets: ['vegan'],
  },
  tuna: {
    label: 'thon au naturel égoutté', unit: 'g', per: 100,
    packageSize: 100, packageUnit: 'g', packageLabel: 'boîte',
    nutrition: { kcal: 116, proteinG: 26, carbsG: 0, fatG: 1, fiberG: 0 },
    // canonique 2064 « thon », archétype 531 « Thon en conserve » + synonyme strict.
    aliases: ['thon', 'thon en conserve', 'thon au naturel en conserve égoutté'], allergens: ['poisson'], diets: ['pescetarian'],
  },
  ham: {
    label: 'jambon blanc', unit: 'g', per: 100,
    packageSize: 80, packageUnit: 'g', packageLabel: 'paquet',
    nutrition: { kcal: 120, proteinG: 20, carbsG: 1, fatG: 4, fiberG: 0 },
    aliases: ['jambon'], allergens: [], diets: [],
  },
  // gramsPerUnit : poids par défaut d'un fruit entier moyen (~150 g), utilisé
  // pour rapprocher les fruits « à la pièce » des lots de stock pesés en grammes.
  // Les fruits sont exposés individuellement via FRUITS (leur singulier est déjà
  // le nom canonique exact — aucun nom pluriel n'existe dans le vocabulaire).
  apple: { label: 'fruit', unit: 'pièce', per: 1, gramsPerUnit: 150, allergens: [], diets: ['vegan'], nutrition: { kcal: 82, proteinG: 0.7, carbsG: 19, fatG: 0.3, fiberG: 3.4 } },
}

// Aliases normalisés d'une entrée : formes ALTERNATIVES uniquement (jamais la
// forme principale), dédupliquées — la boucle stock accepte
// [formNormalized, ...aliases] en égalité exacte.
const normalizedAliases = (label, aliases = []) => {
  const primary = normalizeFoodForm(label)
  return [...new Set(aliases.map(normalizeFoodForm))].filter((alias) => alias && alias !== primary)
}

/**
 * Formes achetables des petits-déjeuners et collations, exposées à la boucle
 * stock (chargement des lots + allocation FEFO résiduelle). Chaque entrée donne
 * la conversion en grammes d'une unité de besoin (`per`-based : 1 pour les
 * aliments pesés, gramsPerUnit pour l'œuf et les fruits à la pièce) et ses
 * `aliases` — les formes normalisées alternatives du vocabulaire réel des lots
 * (égalité exacte uniquement, voir le commentaire de FOOD).
 */
export const SUPPLEMENT_FORMS = [
  ...Object.values(FOOD).map((food) => ({
    label: food.label,
    unit: food.unit,
    gramsPerUnit: food.unit === 'g' ? 1 : food.gramsPerUnit,
    formNormalized: normalizeFoodForm(food.label),
    aliases: normalizedAliases(food.label, food.aliases),
    packageSize: food.packageSize || null,
    packageUnit: food.packageUnit || null,
    packageLabel: food.packageLabel || null,
  })),
  ...FRUITS.map((fruit) => ({
    label: fruit,
    unit: 'pièce',
    gramsPerUnit: FOOD.apple.gramsPerUnit,
    formNormalized: normalizeFoodForm(fruit),
    aliases: [],
    packageSize: null,
  })),
]

const round = (value, digits = 2) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const emptyNutrition = () => Object.fromEntries(NUTRIENTS.map((key) => [key, 0]))

function addNutrition(...values) {
  return Object.fromEntries(NUTRIENTS.map((key) => [key, round(values.reduce((sum, value) => sum + (Number(value?.[key]) || 0), 0))]))
}

function scaleMicronutrients(micros = {}, factor = 1) {
  return Object.fromEntries(Object.entries(micros || {})
    .map(([key, value]) => [key, round((Number(value) || 0) * factor, 2)])
    .filter(([, value]) => value > 0))
}

export function scaleNutrition(nutrition, factor) {
  return Object.fromEntries(NUTRIENTS.map((key) => [key, round((Number(nutrition?.[key]) || 0) * factor)]))
}

function itemNutrition(item) {
  const food = FOOD[item.food]
  return scaleNutrition(food.nutrition, item.quantity / food.per)
}

function supportNutrition(items) {
  return items.reduce((total, item) => addNutrition(total, itemNutrition(item)), emptyNutrition())
}

function scaledSupport(support, factor, fruit) {
  const items = support.items.map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * factor),
    displayLabel: item.food === 'apple' ? fruit : FOOD[item.food].label,
  }))
  return {
    ...support,
    items,
    description: describeItems(items, fruit),
    nutrition: supportNutrition(items),
    scale: round(factor, 2),
  }
}

function formatQuantity(item) {
  const food = FOOD[item.food]
  if (food.packageSize && item.quantity % food.packageSize === 0) {
    const count = item.quantity / food.packageSize
    return `${count} ${food.packageLabel}${count > 1 ? 's' : ''} de ${food.packageSize} ${food.packageUnit}`
  }
  if (food.unit === 'œuf') {
    const value = Math.round(item.quantity)
    return `${String(value).replace('.', ',')} ${value > 1 ? 'œufs' : 'œuf'}`
  }
  if (food.unit === 'pièce') return `${Math.round(item.quantity)}`
  return `${Math.max(1, Math.round(item.quantity))} g`
}

function describeItems(items, fruit) {
  return items.map((item) => {
    const food = FOOD[item.food]
    const label = item.food === 'apple' ? fruit : food.label
    if (food.unit === 'œuf') {
      const quantity = Math.round(item.quantity)
      return `${quantity} œuf${quantity > 1 ? 's' : ''} dur${quantity > 1 ? 's' : ''}`
    }
    if (food.unit === 'pièce') return `${formatQuantity(item)} ${label}${item.quantity > 1 ? 's' : ''}`
    return `${formatQuantity(item)} de ${label}`
  }).join(' + ')
}

function targetFor(member, goals) {
  const goal = goals.find((item) => fold(item.person_name) === fold(member.name)) || {}
  const multiplier = Number(member.portion_multiplier) || 1
  return {
    kcal: Number(goal.target_calories) || 2000 * multiplier,
    proteinG: Number(goal.target_protein_g) || 100 * multiplier,
    carbsG: Number(goal.target_carbs_g) || 230 * multiplier,
    fatG: Number(goal.target_fat_g) || 70 * multiplier,
    fiberG: Number(goal.target_fiber_g) || 25 * multiplier,
  }
}

function breakfastTemplate(dayIndex) {
  const rotation = [
    { shortLabel: 'Skyr, œufs durs et avoine', items: [{ food: 'skyr', quantity: 200 }, { food: 'eggs', quantity: 2 }, { food: 'oats', quantity: 40 }] },
    { shortLabel: 'Œufs durs, pain complet et fruit', items: [{ food: 'eggs', quantity: 3 }, { food: 'bread', quantity: 80 }, { food: 'apple', quantity: 1 }] },
    { shortLabel: 'Skyr, avoine et fruit', items: [{ food: 'skyr', quantity: 200 }, { food: 'oats', quantity: 40 }, { food: 'apple', quantity: 1 }] },
    { shortLabel: 'Œufs durs, pain complet et fruit', items: [{ food: 'eggs', quantity: 3 }, { food: 'bread', quantity: 80 }, { food: 'apple', quantity: 1 }] },
    { shortLabel: 'Skyr, œufs durs et avoine', items: [{ food: 'skyr', quantity: 200 }, { food: 'eggs', quantity: 2 }, { food: 'oats', quantity: 40 }] },
    { shortLabel: 'Œufs durs, pain complet et fruit', items: [{ food: 'eggs', quantity: 3 }, { food: 'bread', quantity: 80 }, { food: 'apple', quantity: 1 }] },
    { shortLabel: 'Skyr, avoine, amandes et fruit', items: [{ food: 'skyr', quantity: 200 }, { food: 'oats', quantity: 40 }, { food: 'almonds', quantity: 20 }, { food: 'apple', quantity: 1 }] },
  ]
  return rotation[dayIndex % rotation.length]
}

function snackTemplates(dayIndex, target) {
  const highProteinTarget = Number(target?.proteinG) / Math.max(Number(target?.kcal), 1) >= 0.065
  const standard = {
    shortLabel: 'Fruit, pain complet et amandes',
    items: [{ food: 'bread', quantity: 60 }, { food: 'almonds', quantity: 15 }, { food: 'apple', quantity: 1 }],
  }
  const egg = {
    shortLabel: 'Œufs durs, pain complet et fruit',
    items: [{ food: 'eggs', quantity: 2 }, { food: 'bread', quantity: 50 }, { food: 'apple', quantity: 1 }],
  }
  // Les collations riches en protéines évitent désormais le couple
  // « protéines basses / lipides hauts » observé en production.
  const proteinRotation = [
    { shortLabel: 'Thon, pain complet et fruit', items: [{ food: 'tuna', quantity: 100 }, { food: 'bread', quantity: 60 }, { food: 'apple', quantity: 1 }] },
    { shortLabel: 'Skyr, pain complet et fruit', items: [{ food: 'skyr', quantity: 200 }, { food: 'bread', quantity: 60 }, { food: 'apple', quantity: 1 }] },
    { shortLabel: 'Jambon, pain complet et fruit', items: [{ food: 'ham', quantity: 80 }, { food: 'bread', quantity: 60 }, { food: 'apple', quantity: 1 }] },
  ]
  const rotated = [...proteinRotation.slice(dayIndex % proteinRotation.length), ...proteinRotation.slice(0, dayIndex % proteinRotation.length)]
  return highProteinTarget
    ? [...rotated, egg, standard]
    : [dayIndex % 2 ? egg : standard, standard, egg, ...rotated]
}

// Correspondance à frontières de mots (foodBanMatch) : l'ancien matching par
// sous-chaînes bannissait « fruit » via « fruits de mer » et « eau » via
// « veau »/« agneau » — toutes les collations et une partie du corpus
// devenaient interdites (incident prod du 24/07).
function matchesForbidden(value, forbidden) {
  return matchesBannedFood(value, forbidden)
}

function dietMatches(diets, pattern) {
  return [...diets].some((diet) => pattern.test(diet))
}

function supportItemAllowed(item, constraints = {}) {
  const food = FOOD[item.food]
  if (!food) return false
  const forbidden = [...(constraints.forbiddenForms || []), ...(constraints.dislikedForms || [])].map(fold).filter(Boolean)
  const allergens = (constraints.allergens || []).map(fold).filter(Boolean)
  const names = [food.label, ...(food.aliases || []), item.displayLabel].filter(Boolean)
  if (names.some((name) => matchesForbidden(name, forbidden))) return false
  if ((food.allergens || []).some((allergen) => matchesForbidden(allergen, allergens))) return false
  const diets = new Set((constraints.diets || []).map(fold))
  if (dietMatches(diets, /vegan|vegetalien/) && !(food.diets || []).includes('vegan')) return false
  if (dietMatches(diets, /vegetar|vegan|vegetalien/) && !(food.diets || []).some((diet) => ['vegan', 'vegetarian'].includes(diet))) return false
  if (dietMatches(diets, /sans porc|no pork/) && item.food === 'ham') return false
  if (dietMatches(diets, /sans poisson|no fish/) && item.food === 'tuna') return false
  return true
}

function safeSupportTemplates(candidates, constraints) {
  const seen = new Set()
  return (candidates || []).filter((candidate) => {
    if (!candidate?.items?.every((item) => supportItemAllowed(item, constraints))) return false
    const key = candidate.items.map((item) => `${item.food}:${item.quantity}`).join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function recipeDistance(left, right) {
  const dimensions = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
  let score = dimensions.reduce((sum, key) => {
    const expected = Number(left.nutritionPerServing?.[key]) || 1
    const actual = Number(right.nutritionPerServing?.[key]) || 0
    return sum + Math.abs(actual - expected) / expected
  }, 0)
  if (left.sensory?.profile && left.sensory.profile === right.sensory?.profile) score -= 1.5
  if (left.cuisineOrigin && left.cuisineOrigin === right.cuisineOrigin) score -= 0.75
  score += Math.abs((Number(left.prepMinutes) || 0) - (Number(right.prepMinutes) || 0)) / 120
  return score
}

function recipeAllowed(recipe, constraints = {}) {
  const allergies = (constraints.allergens || []).map(fold).filter(Boolean)
  if ((recipe.allergens || []).some((value) => matchesForbidden(value, allergies))) return false
  const forbidden = [...(constraints.forbiddenForms || []), ...(constraints.dislikedForms || [])].map(fold).filter(Boolean)
  const ingredients = recipe.exactIngredients || []
  if (ingredients.some((ingredient) => {
    const form = fold(ingredient.formNormalized || ingredient.name)
    return matchesForbidden(form, forbidden)
  })) return false

  const diets = new Set((constraints.diets || []).map(fold))
  const classification = classifyRecipe(recipe)
  if (dietMatches(diets, /vegetar|vegan|vegetalien/) && !classification.vegetarian) return false
  if (dietMatches(diets, /sans poisson|no fish/) && classification.fish) return false
  if (dietMatches(diets, /sans porc|no pork/)
    && ingredients.some((ingredient) => /\b(porc|jambon|lardon|bacon|chorizo)\b/.test(fold(ingredient.formNormalized || ingredient.name)))) return false
  if (dietMatches(diets, /vegan|vegetalien/)) {
    if (!classification.vegetarian) return false
    if (ingredients.some((ingredient) => /\b(lait|beurre|creme|fromage|oeuf|miel|yaourt|skyr)\b/.test(fold(ingredient.formNormalized || ingredient.name)))) return false
  }
  return true
}

function chooseSafeAlternative(base, recipes, usedCodes, constraints) {
  return recipes
    .filter((recipe) => recipe.eligible && recipe.code !== base.code && recipeAllowed(recipe, constraints))
    .sort((left, right) => {
      const leftPenalty = usedCodes.has(left.code) ? 1.5 : 0
      const rightPenalty = usedCodes.has(right.code) ? 1.5 : 0
      return (recipeDistance(base, left) + leftPenalty) - (recipeDistance(base, right) + rightPenalty)
        || left.code.localeCompare(right.code)
    })[0] || null
}

function chooseVegetarianAlternative(base, recipes, usedCodes, constraints) {
  return recipes
    .filter((recipe) => recipe.eligible && classifyRecipe(recipe).vegetarian && recipe.code !== base.code && recipeAllowed(recipe, constraints))
    .sort((left, right) => {
      const leftPenalty = usedCodes.has(left.code) ? 1.5 : 0
      const rightPenalty = usedCodes.has(right.code) ? 1.5 : 0
      return (recipeDistance(base, left) + leftPenalty) - (recipeDistance(base, right) + rightPenalty)
        || left.code.localeCompare(right.code)
    })[0] || null
}

function macroScore(total, target, lunchScale, dinnerScale) {
  const deviation = (key) => {
    const expected = Number(target[key])
    return expected > 0 ? (Number(total[key]) - expected) / expected : 0
  }
  const protein = deviation('proteinG')
  const carbs = deviation('carbsG')
  const fat = deviation('fatG')
  const fiber = deviation('fiberG')

  // Les déficits protéiques/glucidiques et les excès lipidiques sont
  // asymétriques : ils étaient auparavant trop peu coûteux face à l'énergie.
  const nutritionScore =
    Math.max(0, -protein) ** 2 * 10 + Math.max(0, protein) ** 2 * 1.2
    + Math.max(0, -carbs) ** 2 * 4 + Math.max(0, carbs) ** 2 * 1.2
    + Math.max(0, fat) ** 2 * 7 + Math.max(0, -fat) ** 2 * 0.8
    + Math.max(0, -fiber) ** 2 * 2

  const proteinFloorDeficit = Math.max(0, -protein - (1 - PROTEIN_FLOOR_RATIO))
  const regularity = ((lunchScale - 1) ** 2 + (dinnerScale - 1) ** 2) * 0.012
  return nutritionScore + proteinFloorDeficit ** 2 * 12 + regularity
}

function steps(min, max, step) {
  const values = []
  for (let value = min; value <= max + step / 2; value += step) values.push(round(value, 3))
  return values
}

/**
 * Les supports (petit-déjeuner et collation) restent des aliments achetables :
 * pots, œufs entiers, fruits entiers et grammages ronds. Les plats principaux
 * varient par dixièmes dans une enveloppe pratique et une limite de masse.
 */
export function optimizeDailyPortions({ target, breakfast, snack, lunch, dinner, rules = {} }) {
  const breakfastNutrition = breakfast?.nutrition || emptyNutrition()
  const snackNutrition = snack?.nutrition || emptyNutrition()
  const minScale = Number(rules.minMealServings) || 0.5
  const maxScale = Math.min(2, Number(rules.hardMaxMealServings) || 2)
  const preferredMin = Math.max(minScale, Number(rules.preferredMinMealServings) || 0.75)
  const preferredMax = Math.min(maxScale, Number(rules.preferredMaxMealServings) || 1.5)
  const toleratedMax = Math.min(maxScale, Math.max(preferredMax, Number(rules.toleratedMaxMealServings) || 1.75))
  const maxMealMassGrams = Number(rules.maxMealMassGrams) || 900
  const lunchMass = Number(rules.lunchMassPerServing) || 0
  const dinnerMass = Number(rules.dinnerMassPerServing) || 0
  const mealScales = steps(minScale, maxScale, 0.1)
  const lunchScales = Number(rules.fixedLunchScale) > 0 ? [Number(rules.fixedLunchScale)] : mealScales
  const dinnerScales = Number(rules.fixedDinnerScale) > 0 ? [Number(rules.fixedDinnerScale)] : mealScales
  // Les supports restent des unités physiques cohérentes (un pot, une boîte,
  // des œufs entiers). L'ajustement énergétique se fait sur les deux assiettes.
  const breakfastScales = breakfast ? [1] : [0]
  const snackScales = snack ? [1] : [0]
  const supportAtScale = (support, factor, fallback) => {
    if (!support) return emptyNutrition()
    if (!support.items?.length) return scaleNutrition(fallback, factor)
    return supportNutrition(support.items.map((item) => ({ ...item, quantity: Math.round(item.quantity * factor) })))
  }
  let best = null
  let bestFallback = null

  for (const breakfastScale of breakfastScales) {
    for (const snackScale of snackScales) {
      for (const lunchScale of lunchScales) {
        for (const dinnerScale of dinnerScales) {
          if ((!rules.historicalLunch && lunchMass > 0 && lunchMass * lunchScale > maxMealMassGrams)
            || (!rules.historicalDinner && dinnerMass > 0 && dinnerMass * dinnerScale > maxMealMassGrams)) continue
          const total = addNutrition(
            supportAtScale(breakfast, breakfastScale, breakfastNutrition),
            supportAtScale(snack, snackScale, snackNutrition),
            scaleNutrition(lunch, lunchScale),
            scaleNutrition(dinner, dinnerScale),
          )
          const energyDeviation = Math.abs(total.kcal - target.kcal) / Math.max(target.kcal, 1)
          const preferredRangePenalty = (
            Math.max(0, preferredMin - lunchScale) ** 2
            + Math.max(0, preferredMin - dinnerScale) ** 2
            + Math.max(0, lunchScale - preferredMax) ** 2
            + Math.max(0, dinnerScale - preferredMax) ** 2
          ) * 2
          const toleratedRangePenalty = (
            Math.max(0, lunchScale - toleratedMax) ** 2
            + Math.max(0, dinnerScale - toleratedMax) ** 2
          ) * 10
          const supportPenalty = ((breakfastScale && breakfastScale - 1) ** 2 + (snackScale && snackScale - 1) ** 2) * 0.08
          const score = macroScore(total, target, lunchScale, dinnerScale) + energyDeviation ** 2 * 12
            + preferredRangePenalty + toleratedRangePenalty + supportPenalty
          const candidate = { score, breakfastScale, snackScale, lunchScale, dinnerScale, total, physicalFeasible: true }
          if (!bestFallback || energyDeviation < bestFallback.energyDeviation || (energyDeviation === bestFallback.energyDeviation && score < bestFallback.score)) {
            bestFallback = { ...candidate, energyDeviation }
          }
          if (energyDeviation <= 0.05 && (!best || score < best.score)) {
            best = { ...candidate, energyDeviation, feasible: true }
          }
        }
      }
    }
  }

  return best || {
    ...(bestFallback || {
      breakfastScale: 0,
      snackScale: 0,
      lunchScale: minScale,
      dinnerScale: minScale,
      total: emptyNutrition(),
      physicalFeasible: false,
    }),
    feasible: false,
  }
}

function canonicalMeal({ slot, member, recipe, multiplier, target, variantKind }) {
  const nutrition = scaleNutrition(recipe.nutritionPerServing, multiplier)
  return {
    slot_key: slot.key,
    person_name: member.name,
    household_member_id: member.id || null,
    meal_date: slot.date,
    meal_type: slot.mealType,
    day_type: 'standard',
    short_label: recipe.family,
    description: `${recipe.family} · ${String(round(multiplier, 2)).replace('.', ',')} portion`,
    kcal: nutrition.kcal,
    protein_g: nutrition.proteinG,
    carbs_g: nutrition.carbsG,
    fat_g: nutrition.fatG,
    fiber_g: nutrition.fiberG,
    micronutrients: scaleMicronutrients(recipe.nutritionPerServing?.micros, multiplier),
    planned_servings: round(multiplier, 3),
    canonical_recipe_code: recipe.code,
    variant_kind: variantKind,
    portion_details: { multiplier: round(multiplier, 3), calculated_for: member.name },
    target_snapshot: target,
  }
}

function supportMeal({ support, member, date, mealType, target, fruit }) {
  return {
    slot_key: `${date}-${mealType}`,
    person_name: member.name,
    household_member_id: member.id || null,
    meal_date: date,
    meal_type: mealType,
    day_type: 'standard',
    short_label: support.shortLabel,
    description: support.description || describeItems(support.items, fruit),
    kcal: support.nutrition.kcal,
    protein_g: support.nutrition.proteinG,
    carbs_g: support.nutrition.carbsG,
    fat_g: support.nutrition.fatG,
    fiber_g: support.nutrition.fiberG,
    micronutrients: {},
    planned_servings: support.scale || 1,
    canonical_recipe_code: null,
    variant_kind: mealType === 'pdj' ? 'fixed_breakfast' : 'fixed_snack',
    portion_details: { scale: support.scale || 1, items: support.items },
    target_snapshot: target,
  }
}

/** Construit les 49 prises attendues et une variante végétarienne traçable. */
export function buildPersonalizedMeals({ plan, recipes, members, goals = [], constraints = {}, preservedMeals = [] }) {
  const recipeByCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const memberList = members?.length ? members : [{ name: 'Foyer', portion_multiplier: 1 }]
  const dates = [...new Set(plan.slots.map((slot) => slot.date))].sort()
  const usedCodes = new Set(plan.slots.map((slot) => slot.recipeCode))
  const assignmentByMemberAndSlot = new Map()
  const preservedFor = (member, date, mealType) => preservedMeals.find((meal) => (
    meal.meal_date === date
    && meal.meal_type === mealType
    && (member.id && meal.household_member_id
      ? String(meal.household_member_id) === String(member.id)
      : fold(meal.person_name) === fold(member.name))
  )) || null

  for (const member of memberList) {
    const rules = getMemberPlanningRules(member)
    const meatSlots = plan.slots.filter((slot) => classifyRecipe(recipeByCode.get(slot.recipeCode)).meat)
    for (let index = 0; index < Math.min(rules.vegetarianMeatSwaps, meatSlots.length); index++) {
      const slot = meatSlots[index]
      const base = recipeByCode.get(slot.recipeCode)
      const alternative = chooseVegetarianAlternative(base, recipes, usedCodes, constraints)
      if (alternative) {
        assignmentByMemberAndSlot.set(`${member.name}|${slot.key}`, alternative.code)
        usedCodes.add(alternative.code)
      }
    }
  }

  const meals = []
  const daily = []
  for (const [dayIndex, date] of dates.entries()) {
    const lunchSlot = plan.slots.find((slot) => slot.date === date && slot.mealType === 'dejeuner')
    const dinnerSlot = plan.slots.find((slot) => slot.date === date && slot.mealType === 'diner')
    if (!lunchSlot || !dinnerSlot) continue

    for (const member of memberList) {
      const rules = getMemberPlanningRules(member)
      const target = targetFor(member, goals)
      const fruit = FRUITS[dayIndex % FRUITS.length]
      const preservedLunch = preservedFor(member, date, 'dejeuner')
      const preservedDinner = preservedFor(member, date, 'diner')
      const preservedBreakfast = preservedFor(member, date, 'pdj')
      const preservedSnack = preservedFor(member, date, 'collation')
      const preservedBreakfastSafe = !preservedBreakfast || (preservedBreakfast.portion_details?.items || []).every((item) => supportItemAllowed(item, constraints))
      const preservedSnackSafe = !preservedSnack || (preservedSnack.portion_details?.items || []).every((item) => supportItemAllowed(item, constraints))
      let lunchCode = preservedLunch?.canonical_recipe_code
        || assignmentByMemberAndSlot.get(`${member.name}|${lunchSlot.key}`) || lunchSlot.recipeCode
      let dinnerCode = preservedDinner?.canonical_recipe_code
        || assignmentByMemberAndSlot.get(`${member.name}|${dinnerSlot.key}`) || dinnerSlot.recipeCode
      let lunchRecipe = recipeByCode.get(lunchCode)
      let dinnerRecipe = recipeByCode.get(dinnerCode)
      if (!lunchRecipe || !dinnerRecipe) throw new Error(`Recette personnalisée indisponible pour ${member.name} le ${date}`)
      if (!preservedLunch && !recipeAllowed(lunchRecipe, constraints)) {
        const alternative = chooseSafeAlternative(lunchRecipe, recipes, usedCodes, constraints)
        if (alternative) { lunchRecipe = alternative; lunchCode = alternative.code; usedCodes.add(alternative.code) }
      }
      if (!preservedDinner && !recipeAllowed(dinnerRecipe, constraints)) {
        const alternative = chooseSafeAlternative(dinnerRecipe, recipes, usedCodes, constraints)
        if (alternative) { dinnerRecipe = alternative; dinnerCode = alternative.code; usedCodes.add(alternative.code) }
      }
      const recipesSafe = recipeAllowed(lunchRecipe, constraints) && recipeAllowed(dinnerRecipe, constraints)
      // Les supports restent déterministes pour conserver les unités physiques,
      // les réservations FEFO et les listes de courses reproductibles. On garde
      // le petit-déjeuner du jour s'il est autorisé, puis on prend le premier
      // repli sûr. Les collations sont déjà classées par adéquation à la cible.
      const breakfastBase = rules.breakfast ? (
        safeSupportTemplates([breakfastTemplate(dayIndex)], constraints)[0]
        || safeSupportTemplates(
          Array.from({ length: 7 }, (_, offset) => breakfastTemplate(dayIndex + offset + 1)),
          constraints,
        )[0]
        || null
      ) : null
      const snackBase = rules.snack
        ? (safeSupportTemplates(snackTemplates(dayIndex, target), constraints)[0] || null)
        : null
      const breakfast = breakfastBase ? { ...breakfastBase, nutrition: supportNutrition(breakfastBase.items) } : null
      const snack = snackBase ? { ...snackBase, nutrition: supportNutrition(snackBase.items) } : null
      const optimized = optimizeDailyPortions({
        target,
        breakfast,
        snack,
        lunch: lunchRecipe.nutritionPerServing,
        dinner: dinnerRecipe.nutritionPerServing,
        rules: {
          ...rules,
          lunchMassPerServing: (lunchRecipe.exactIngredients || []).reduce((sum, item) => sum + (Number(item.grams) || 0), 0) / Math.max(Number(lunchRecipe.servings) || 1, 1),
          dinnerMassPerServing: (dinnerRecipe.exactIngredients || []).reduce((sum, item) => sum + (Number(item.grams) || 0), 0) / Math.max(Number(dinnerRecipe.servings) || 1, 1),
          fixedLunchScale: preservedLunch?.planned_servings,
          fixedDinnerScale: preservedDinner?.planned_servings,
          historicalLunch: preservedLunch?.planning_status === 'consumed',
          historicalDinner: preservedDinner?.planning_status === 'consumed',
        },
      })
      const actualBreakfast = breakfast ? scaledSupport(breakfast, optimized.breakfastScale, fruit) : null
      const actualSnack = snack ? scaledSupport(snack, optimized.snackScale, fruit) : null
      const lunchVariant = lunchCode === lunchSlot.recipeCode
        ? 'household_base'
        : assignmentByMemberAndSlot.get(`${member.name}|${lunchSlot.key}`) === lunchCode ? 'vegetarian_swap' : 'constraint_substitution'
      const dinnerVariant = dinnerCode === dinnerSlot.recipeCode
        ? 'household_base'
        : assignmentByMemberAndSlot.get(`${member.name}|${dinnerSlot.key}`) === dinnerCode ? 'vegetarian_swap' : 'constraint_substitution'

      const restore = (existing, fallback) => existing ? {
        ...fallback,
        ...existing,
        slot_key: fallback.slot_key,
        household_member_id: member.id || existing.household_member_id || null,
        person_name: member.name,
        meal_date: date,
        target_snapshot: existing.target_snapshot || target,
        // Un repas préservé d'un plan antérieur à la colonne canonical_recipe_code
        // ne doit pas écraser avec null le code du fallback (la recette du
        // créneau) : sans code, le modèle à demandes finales requalifie le repas
        // principal en « support » et duplique son slot_key (incident du 24/07).
        canonical_recipe_code: existing.canonical_recipe_code || fallback.canonical_recipe_code || null,
        variant_kind: existing.variant_kind || fallback.variant_kind || null,
      } : fallback

      if (actualBreakfast || preservedBreakfast) {
        const fallback = actualBreakfast
          ? supportMeal({ support: actualBreakfast, member, date, mealType: 'pdj', target, fruit })
          : { slot_key: `${date}-pdj`, person_name: member.name, household_member_id: member.id || null, meal_date: date, meal_type: 'pdj', planned_servings: 1, canonical_recipe_code: null, variant_kind: 'fixed_breakfast', portion_details: { items: [] }, target_snapshot: target }
        meals.push(restore(preservedBreakfast, fallback))
      }
      meals.push(restore(preservedLunch, canonicalMeal({ slot: lunchSlot, member, recipe: lunchRecipe, multiplier: optimized.lunchScale, target, variantKind: lunchVariant })))
      meals.push(restore(preservedDinner, canonicalMeal({ slot: dinnerSlot, member, recipe: dinnerRecipe, multiplier: optimized.dinnerScale, target, variantKind: dinnerVariant })))
      if (actualSnack || preservedSnack) {
        const fallback = actualSnack
          ? supportMeal({ support: actualSnack, member, date, mealType: 'collation', target, fruit })
          : { slot_key: `${date}-collation`, person_name: member.name, household_member_id: member.id || null, meal_date: date, meal_type: 'collation', planned_servings: 1, canonical_recipe_code: null, variant_kind: 'fixed_snack', portion_details: { items: [] }, target_snapshot: target }
        meals.push(restore(preservedSnack, fallback))
      }

      const total = meals
        .filter((meal) => meal.person_name === member.name && meal.meal_date === date)
        .reduce((sum, meal) => addNutrition(sum, {
          kcal: meal.kcal, proteinG: meal.protein_g, carbsG: meal.carbs_g, fatG: meal.fat_g, fiberG: meal.fiber_g,
        }), emptyNutrition())
      const micronutrients = meals
        .filter((meal) => meal.person_name === member.name && meal.meal_date === date)
        .reduce((sum, meal) => {
          for (const [key, value] of Object.entries(meal.micronutrients || {})) sum[key] = round((sum[key] || 0) + (Number(value) || 0), 2)
          return sum
        }, {})
      const recipeMeals = meals.filter((meal) => meal.person_name === member.name && meal.meal_date === date && meal.canonical_recipe_code)
      const energyDeviation = Math.abs(total.kcal - target.kcal) / target.kcal
      // Écarts signés par macronutriment (négatif = sous la cible). Seule
      // l'énergie reste bloquante via `valid` ; les autres dimensions sont
      // persistées pour signalement non bloquant.
      const macroDeviations = Object.fromEntries(['proteinG', 'carbsG', 'fatG', 'fiberG']
        .filter((key) => Number.isFinite(Number(target[key])) && Number(target[key]) > 0)
        .map((key) => [key, round((Number(total[key]) - Number(target[key])) / Number(target[key]), 4)]))
      const proteinTarget = Number(target.proteinG)
      const proteinValid = !(proteinTarget > 0) || Number(total.proteinG) >= PROTEIN_FLOOR_RATIO * proteinTarget
      const carbsValid = Math.abs(macroDeviations.carbsG || 0) <= MACRO_LIMITS.carbsG
      const fatValid = Math.abs(macroDeviations.fatG || 0) <= MACRO_LIMITS.fatG
      const fiberValid = (macroDeviations.fiberG || 0) >= MACRO_LIMITS.fiberG
      const lunchSafe = preservedLunch?.planning_status === 'consumed'
        || (optimized.lunchScale >= rules.minMealServings && optimized.lunchScale <= rules.hardMaxMealServings)
      const dinnerSafe = preservedDinner?.planning_status === 'consumed'
        || (optimized.dinnerScale >= rules.minMealServings && optimized.dinnerScale <= rules.hardMaxMealServings)
      const portionSafe = lunchSafe && dinnerSafe
        && optimized.physicalFeasible !== false
      daily.push({
        person_name: member.name,
        meal_date: date,
        target,
        total,
        energy_deviation: round(energyDeviation, 4),
        valid: energyDeviation <= 0.05,
        target_feasible: optimized.feasible !== false,
        portion_feasible: optimized.feasible !== false,
        portion_safe: portionSafe,
        support_safe: (!rules.breakfast || (Boolean(breakfastBase || preservedBreakfast) && preservedBreakfastSafe))
          && (!rules.snack || (Boolean(snackBase || preservedSnack) && preservedSnackSafe)),
        recipes_safe: recipesSafe,
        protein_deviation: macroDeviations.proteinG ?? null,
        protein_valid: proteinValid,
        carbs_valid: carbsValid,
        fat_valid: fatValid,
        fiber_valid: fiberValid,
        macro_valid: proteinValid && carbsValid && fatValid && fiberValid,
        macro_deviations: macroDeviations,
        micronutrients,
        micronutrient_data_complete: recipeMeals.length > 0 && recipeMeals.every((meal) => Object.keys(meal.micronutrients || {}).length > 0),
      })
    }
  }

  const weeklyMicronutrients = memberList.map((member) => {
    const days = daily.filter((day) => day.person_name === member.name)
    const totals = days.reduce((sum, day) => {
      for (const [key, value] of Object.entries(day.micronutrients || {})) sum[key] = round((sum[key] || 0) + (Number(value) || 0), 2)
      return sum
    }, {})
    const targets = Object.fromEntries(Object.entries(MICRONUTRIENT_DAILY_REFERENCES)
      .map(([key, value]) => [key, value * days.length]))
    const ratios = Object.fromEntries(Object.keys(totals)
      .filter((key) => targets[key] > 0)
      .map((key) => [key, round(totals[key] / targets[key], 4)]))
    return {
      person_name: member.name,
      days: days.length,
      totals,
      targets,
      ratios,
      data_complete: days.length > 0 && days.every((day) => day.micronutrient_data_complete),
    }
  })

  return {
    meals,
    daily,
    recipeCodes: [...new Set(meals.map((meal) => meal.canonical_recipe_code).filter(Boolean))],
    supplementalRequirements: [...meals
      .filter((meal) => ['fixed_breakfast', 'fixed_snack'].includes(meal.variant_kind))
      .flatMap((meal) => meal.portion_details.items || [])
      .reduce((map, item) => {
        const food = FOOD[item.food]
        const label = item.displayLabel || food.label
        const key = `${label}|${food.unit}`
        const current = map.get(key) || {
          label, unit: food.unit, quantity: 0,
          packageSize: food.packageSize || null,
          packageUnit: food.packageUnit || null,
          packageLabel: food.packageLabel || null,
        }
        current.quantity += Number(item.quantity) || 0
        map.set(key, current)
        return map
      }, new Map()).values()].map((item) => ({
        ...item,
        quantity: Math.round(item.quantity),
        packageCount: item.packageSize ? Math.ceil(item.quantity / item.packageSize) : null,
      })),
    weeklyMicronutrients,
    valid: daily.length > 0 && daily.every((item) => item.valid && item.portion_feasible !== false && item.support_safe !== false && item.recipes_safe !== false),
  }
}
