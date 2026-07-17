import { classifyRecipe } from './closedLoopPlanner'
import { normalizeFoodForm } from '../recipes/materializeRecipe'

const NUTRIENTS = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
const FRUITS = ['pomme', 'kiwi', 'poire', 'banane', 'pêche', 'nectarine', 'orange']

// Plancher protéique journalier : en dessous de 90 % de la cible, la journée
// est signalée (jamais bloquée — seule l'énergie ±5 % reste la barrière dure).
const PROTEIN_FLOOR_RATIO = 0.9

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
    // archétype « Skyr nature » → même forme normalisée, aucun alias requis.
  },
  oats: {
    label: 'flocons d’avoine', unit: 'g', per: 100,
    nutrition: { kcal: 370, proteinG: 13, carbsG: 59, fatG: 7, fiberG: 10 },
    aliases: ["flocon d'avoine", 'avoine'], // archétype 314 + canonique 5001
  },
  eggs: {
    label: 'œufs durs', unit: 'œuf', per: 1,
    nutrition: { kcal: 78, proteinG: 6.3, carbsG: 0.6, fatG: 5.3, fiberG: 0 }, gramsPerUnit: 60,
    aliases: ['œuf'], // canoniques 14027 « œuf » et 58 « Oeuf » → 'oeuf'
  },
  almonds: {
    label: 'amandes', unit: 'g', per: 100,
    nutrition: { kcal: 579, proteinG: 21, carbsG: 9, fatG: 50, fiberG: 12.5 },
    aliases: ['amande'], // canonique 11001 (singulier)
  },
  bread: {
    label: 'pain complet', unit: 'g', per: 100,
    nutrition: { kcal: 265, proteinG: 9, carbsG: 49, fatG: 3.2, fiberG: 4.9 },
    aliases: ['pain'], // archétype 321 — pas de « pain complet » en vocabulaire
  },
  tuna: {
    label: 'thon au naturel égoutté', unit: 'g', per: 100,
    packageSize: 100, packageUnit: 'g', packageLabel: 'boîte',
    nutrition: { kcal: 116, proteinG: 26, carbsG: 0, fatG: 1, fiberG: 0 },
    // canonique 2064 « thon », archétype 531 « Thon en conserve » + synonyme strict.
    aliases: ['thon', 'thon en conserve', 'thon au naturel en conserve égoutté'],
  },
  ham: {
    label: 'jambon blanc', unit: 'g', per: 100,
    packageSize: 80, packageUnit: 'g', packageLabel: 'paquet',
    nutrition: { kcal: 120, proteinG: 20, carbsG: 1, fatG: 4, fiberG: 0 },
    aliases: ['jambon'], // archétype 317 (salaison)
  },
  // gramsPerUnit : poids par défaut d'un fruit entier moyen (~150 g), utilisé
  // pour rapprocher les fruits « à la pièce » des lots de stock pesés en grammes.
  // Les fruits sont exposés individuellement via FRUITS (leur singulier est déjà
  // le nom canonique exact — aucun nom pluriel n'existe dans le vocabulaire).
  apple: { label: 'fruit', unit: 'pièce', per: 1, gramsPerUnit: 150, nutrition: { kcal: 82, proteinG: 0.7, carbsG: 19, fatG: 0.3, fiberG: 3.4 } },
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

function memberRules(member) {
  const name = fold(member?.name)
  const planning = member?.preferences?.planning || {}
  return {
    breakfast: planning.breakfast ?? name === 'julien',
    snack: planning.snack ?? true,
    vegetarianMeatSwaps: Number.isFinite(Number(planning.vegetarian_meat_swaps_per_week))
      ? Math.max(0, Math.min(7, Number(planning.vegetarian_meat_swaps_per_week)))
      : (name === 'zoe' ? 1 : 0),
  }
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

function snackTemplate(member, dayIndex, target) {
  const julien = fold(member.name) === 'julien'
  const highProteinTarget = Number(target?.proteinG) / Math.max(Number(target?.kcal), 1) >= 0.065
  if (!julien && !highProteinTarget) {
    return {
      shortLabel: 'Fruit, pain complet et amandes',
      items: [{ food: 'bread', quantity: 60 }, { food: 'almonds', quantity: 15 }, { food: 'apple', quantity: 1 }],
    }
  }
  if (!julien && dayIndex % 2 === 1) {
    return {
      shortLabel: 'Œufs durs, amandes et fruit',
      items: [{ food: 'eggs', quantity: 2 }, { food: 'almonds', quantity: 15 }, { food: 'apple', quantity: 1 }],
    }
  }
  if (julien) {
    // Uniquement des aliments prêts à consommer : aucune entrée de rotation ne
    // doit exiger une cuisson sans tâche source (le poulet rôti est retiré,
    // le thon en boîte est son substitut macro le plus proche).
    const rotation = [
      { shortLabel: 'Thon, amandes et fruit', items: [{ food: 'tuna', quantity: 100 }, { food: 'almonds', quantity: 15 }, { food: 'apple', quantity: 1 }] },
      { shortLabel: 'Œufs durs, jambon et fruit', items: [{ food: 'eggs', quantity: 2 }, { food: 'ham', quantity: 80 }, { food: 'apple', quantity: 1 }] },
      { shortLabel: 'Thon, amandes et fruit', items: [{ food: 'tuna', quantity: 100 }, { food: 'almonds', quantity: 15 }, { food: 'apple', quantity: 1 }] },
    ]
    return rotation[dayIndex % rotation.length]
  }
  return {
    shortLabel: 'Œufs durs, amandes et fruit',
    items: [{ food: 'eggs', quantity: 2 }, { food: 'almonds', quantity: 15 }, { food: 'apple', quantity: 1 }],
  }
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
  const allergies = new Set((constraints.allergens || []).map((value) => fold(value)))
  if ((recipe.allergens || []).some((value) => allergies.has(fold(value)))) return false
  const forbidden = (constraints.forbiddenForms || []).map(fold).filter(Boolean)
  const disliked = new Set((constraints.dislikedForms || []).map(fold))
  return !(recipe.exactIngredients || []).some((ingredient) => {
    const form = fold(ingredient.formNormalized || ingredient.name)
    return disliked.has(form) || forbidden.some((term) => form === term || form.includes(term) || term.includes(form))
  })
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
  const weights = { proteinG: 1.7, carbsG: 1, fatG: 1 }
  const nutritionScore = Object.entries(weights).reduce((sum, [key, weight]) => {
    const expected = Number(target[key])
    if (!expected) return sum
    return sum + ((Number(total[key]) - expected) / expected) ** 2 * weight
  }, 0)
  // Les fibres sont un plancher, pas une cible à ne surtout pas dépasser.
  const fiberDeficit = Math.max(0, Number(target.fiberG) - Number(total.fiberG)) / Math.max(Number(target.fiberG), 1)
  // Le plancher protéique (90 % de la cible) reste une préférence douce :
  // il oriente le choix des portions sans jamais bloquer la journée.
  const proteinFloorDeficit = Math.max(0, PROTEIN_FLOOR_RATIO * Number(target.proteinG) - Number(total.proteinG))
    / Math.max(Number(target.proteinG), 1)
  const regularity = ((lunchScale - 1) ** 2 + (dinnerScale - 1) ** 2) * 0.012
  return nutritionScore + fiberDeficit ** 2 * 0.8 + proteinFloorDeficit ** 2 * 4 + regularity
}

function steps(min, max, step) {
  const values = []
  for (let value = min; value <= max + step / 2; value += step) values.push(round(value, 3))
  return values
}

/**
 * Les supports (petit-déjeuner et collation) restent des aliments achetables :
 * pots, œufs entiers, fruits entiers et grammages ronds. Seules les portions
 * des deux recettes varient, par quarts de portion, pour approcher la cible.
 */
export function optimizeDailyPortions({ target, breakfast, snack, lunch, dinner }) {
  const breakfastScale = breakfast ? 1 : 0
  const snackScale = snack ? 1 : 0
  const breakfastNutrition = breakfast?.nutrition || emptyNutrition()
  const snackNutrition = snack?.nutrition || emptyNutrition()
  const mealScales = steps(0.5, 4, 0.25)
  let best = null
  let bestFallback = null

  for (const lunchScale of mealScales) {
    for (const dinnerScale of mealScales) {
      const total = addNutrition(
        breakfastNutrition,
        snackNutrition,
        scaleNutrition(lunch, lunchScale),
        scaleNutrition(dinner, dinnerScale),
      )
      const energyDeviation = Math.abs(total.kcal - target.kcal) / Math.max(target.kcal, 1)
      const score = macroScore(total, target, lunchScale, dinnerScale) + energyDeviation ** 2 * 12
      const candidate = { score, breakfastScale, snackScale, lunchScale, dinnerScale, total }
      if (!bestFallback || energyDeviation < bestFallback.energyDeviation || (energyDeviation === bestFallback.energyDeviation && score < bestFallback.score)) {
        bestFallback = { ...candidate, energyDeviation }
      }
      if (energyDeviation <= 0.05 && (!best || score < best.score)) {
        best = candidate
      }
    }
  }

  return best || bestFallback
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
    planned_servings: round(multiplier, 3),
    canonical_recipe_code: recipe.code,
    variant_kind: variantKind,
    portion_details: { multiplier: round(multiplier, 3), calculated_for: member.name },
    target_snapshot: target,
  }
}

function supportMeal({ support, member, date, mealType, target, fruit }) {
  return {
    slot_key: null,
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
    planned_servings: support.scale || 1,
    canonical_recipe_code: null,
    variant_kind: mealType === 'pdj' ? 'fixed_breakfast' : 'fixed_snack',
    portion_details: { scale: support.scale || 1, items: support.items },
    target_snapshot: target,
  }
}

/** Construit les 49 prises attendues et une variante végétarienne traçable. */
export function buildPersonalizedMeals({ plan, recipes, members, goals = [], constraints = {} }) {
  const recipeByCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const memberList = members?.length ? members : [{ name: 'Foyer', portion_multiplier: 1 }]
  const dates = [...new Set(plan.slots.map((slot) => slot.date))].sort()
  const usedCodes = new Set(plan.slots.map((slot) => slot.recipeCode))
  const assignmentByMemberAndSlot = new Map()

  for (const member of memberList) {
    const rules = memberRules(member)
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
      const rules = memberRules(member)
      const target = targetFor(member, goals)
      const fruit = FRUITS[dayIndex % FRUITS.length]
      const lunchCode = assignmentByMemberAndSlot.get(`${member.name}|${lunchSlot.key}`) || lunchSlot.recipeCode
      const dinnerCode = assignmentByMemberAndSlot.get(`${member.name}|${dinnerSlot.key}`) || dinnerSlot.recipeCode
      const lunchRecipe = recipeByCode.get(lunchCode)
      const dinnerRecipe = recipeByCode.get(dinnerCode)
      const breakfastBase = rules.breakfast ? breakfastTemplate(dayIndex) : null
      const snackBase = rules.snack ? snackTemplate(member, dayIndex, target) : null
      const breakfast = breakfastBase ? { ...breakfastBase, nutrition: supportNutrition(breakfastBase.items) } : null
      const snack = snackBase ? { ...snackBase, nutrition: supportNutrition(snackBase.items) } : null
      const optimized = optimizeDailyPortions({
        target,
        breakfast,
        snack,
        lunch: lunchRecipe.nutritionPerServing,
        dinner: dinnerRecipe.nutritionPerServing,
      })
      const actualBreakfast = breakfast ? scaledSupport(breakfast, optimized.breakfastScale, fruit) : null
      const actualSnack = snack ? scaledSupport(snack, optimized.snackScale, fruit) : null
      const lunchVariant = lunchCode === lunchSlot.recipeCode ? 'household_base' : 'vegetarian_swap'
      const dinnerVariant = dinnerCode === dinnerSlot.recipeCode ? 'household_base' : 'vegetarian_swap'

      if (actualBreakfast) meals.push(supportMeal({ support: actualBreakfast, member, date, mealType: 'pdj', target, fruit }))
      meals.push(canonicalMeal({ slot: lunchSlot, member, recipe: lunchRecipe, multiplier: optimized.lunchScale, target, variantKind: lunchVariant }))
      meals.push(canonicalMeal({ slot: dinnerSlot, member, recipe: dinnerRecipe, multiplier: optimized.dinnerScale, target, variantKind: dinnerVariant }))
      if (actualSnack) meals.push(supportMeal({ support: actualSnack, member, date, mealType: 'collation', target, fruit }))

      const total = meals
        .filter((meal) => meal.person_name === member.name && meal.meal_date === date)
        .reduce((sum, meal) => addNutrition(sum, {
          kcal: meal.kcal, proteinG: meal.protein_g, carbsG: meal.carbs_g, fatG: meal.fat_g, fiberG: meal.fiber_g,
        }), emptyNutrition())
      const energyDeviation = Math.abs(total.kcal - target.kcal) / target.kcal
      // Écarts signés par macronutriment (négatif = sous la cible). Seule
      // l'énergie reste bloquante via `valid` ; les autres dimensions sont
      // persistées pour signalement non bloquant.
      const macroDeviations = Object.fromEntries(['proteinG', 'carbsG', 'fatG', 'fiberG']
        .filter((key) => Number.isFinite(Number(target[key])) && Number(target[key]) > 0)
        .map((key) => [key, round((Number(total[key]) - Number(target[key])) / Number(target[key]), 4)]))
      const proteinTarget = Number(target.proteinG)
      const proteinValid = !(proteinTarget > 0) || Number(total.proteinG) >= PROTEIN_FLOOR_RATIO * proteinTarget
      daily.push({
        person_name: member.name,
        meal_date: date,
        target,
        total,
        energy_deviation: round(energyDeviation, 4),
        valid: energyDeviation <= 0.05,
        protein_deviation: macroDeviations.proteinG ?? null,
        protein_valid: proteinValid,
        macro_deviations: macroDeviations,
      })
    }
  }

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
    valid: daily.length > 0 && daily.every((item) => item.valid),
  }
}
