import { classifyRecipe } from './closedLoopPlanner'

const NUTRIENTS = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
const FRUITS = ['pomme', 'kiwi', 'poire', 'banane', 'abricots', 'pêche', 'framboises']

const FOOD = {
  skyr: { label: 'skyr nature', unit: 'g', per: 100, nutrition: { kcal: 63, proteinG: 11, carbsG: 4, fatG: 0.2, fiberG: 0 } },
  oats: { label: 'flocons d’avoine', unit: 'g', per: 100, nutrition: { kcal: 370, proteinG: 13, carbsG: 59, fatG: 7, fiberG: 10 } },
  eggs: { label: 'œufs durs', unit: 'œuf', per: 1, nutrition: { kcal: 78, proteinG: 6.3, carbsG: 0.6, fatG: 5.3, fiberG: 0 }, gramsPerUnit: 60 },
  almonds: { label: 'amandes', unit: 'g', per: 100, nutrition: { kcal: 579, proteinG: 21, carbsG: 9, fatG: 50, fiberG: 12.5 } },
  bread: { label: 'pain complet', unit: 'g', per: 100, nutrition: { kcal: 265, proteinG: 9, carbsG: 49, fatG: 3.2, fiberG: 4.9 } },
  apple: { label: 'fruit', unit: 'g', per: 100, nutrition: { kcal: 60, proteinG: 0.5, carbsG: 14, fatG: 0.2, fiberG: 2.5 } },
}

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
    quantity: round(item.quantity * factor, item.food === 'eggs' ? 1 : 0),
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
  if (food.unit === 'œuf') {
    const value = round(item.quantity, 1)
    return `${String(value).replace('.', ',')} ${value > 1 ? 'œufs' : 'œuf'}`
  }
  return `${Math.max(1, Math.round(item.quantity))} g`
}

function describeItems(items, fruit) {
  return items.map((item) => {
    const food = FOOD[item.food]
    const label = item.food === 'apple' ? fruit : food.label
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

function breakfastTemplate() {
  return {
    shortLabel: 'Skyr, œufs durs et avoine',
    items: [
      { food: 'skyr', quantity: 350 },
      { food: 'eggs', quantity: 3 },
      { food: 'oats', quantity: 40 },
    ],
  }
}

function snackTemplate(member, dayIndex, target) {
  const julien = fold(member.name) === 'julien'
  const highProteinTarget = Number(target?.proteinG) / Math.max(Number(target?.kcal), 1) >= 0.065
  if (!julien && !highProteinTarget) {
    return {
      shortLabel: 'Fruit, pain complet et amandes',
      items: [{ food: 'bread', quantity: 80 }, { food: 'almonds', quantity: 20 }, { food: 'apple', quantity: 180 }],
    }
  }
  if (julien && dayIndex % 2 === 1) {
    return {
      shortLabel: 'Skyr, œufs durs et fruit',
      items: [
        { food: 'skyr', quantity: 250 },
        { food: 'eggs', quantity: 2 },
        { food: 'almonds', quantity: 15 },
        { food: 'apple', quantity: 140 },
      ],
    }
  }
  return {
    shortLabel: julien ? 'Skyr, amandes et fruit' : (dayIndex % 2 ? 'Œufs durs, amandes et fruit' : 'Skyr, amandes et fruit'),
    items: dayIndex % 2 && !julien
      ? [{ food: 'eggs', quantity: 2 }, { food: 'almonds', quantity: 15 }, { food: 'apple', quantity: 150 }]
      : [{ food: 'skyr', quantity: julien ? 300 : 200 }, { food: 'almonds', quantity: julien ? 30 : 20 }, { food: 'apple', quantity: 150 }],
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

function macroScore(total, target, breakfastScale, snackScale, lunchScale, dinnerScale) {
  const weights = { proteinG: 1.7, carbsG: 1, fatG: 1, fiberG: 0.8 }
  const nutritionScore = Object.entries(weights).reduce((sum, [key, weight]) => {
    const expected = Number(target[key])
    if (!expected) return sum
    return sum + ((Number(total[key]) - expected) / expected) ** 2 * weight
  }, 0)
  const regularity = ((breakfastScale - 1) ** 2 + (snackScale - 1) ** 2) * 0.025
    + (Math.max(0, lunchScale - 2) ** 2 + Math.max(0, dinnerScale - 2) ** 2) * 0.04
  return nutritionScore + regularity
}

function steps(min, max, step) {
  const values = []
  for (let value = min; value <= max + step / 2; value += step) values.push(round(value, 3))
  return values
}

/**
 * Calcule les portions d'une journée sous contrainte calorique dure. Les trois
 * degrés de liberté restants rapprochent ensuite protéines, glucides, lipides
 * et fibres de la cible personnelle, sans modifier la recette elle-même.
 */
export function optimizeDailyPortions({ target, breakfast, snack, lunch, dinner }) {
  const breakfastScales = breakfast ? steps(0.65, 1.65, 0.05) : [0]
  const snackScales = snack ? steps(0.55, 1.8, 0.05) : [0]
  const lunchScales = steps(0.35, 4.5, 0.05)
  let best = null

  for (const breakfastScale of breakfastScales) {
    const breakfastNutrition = breakfast ? scaleNutrition(breakfast.nutrition, breakfastScale) : emptyNutrition()
    for (const snackScale of snackScales) {
      const snackNutrition = snack ? scaleNutrition(snack.nutrition, snackScale) : emptyNutrition()
      const fixedKcal = breakfastNutrition.kcal + snackNutrition.kcal
      for (const lunchScale of lunchScales) {
        const lunchNutrition = scaleNutrition(lunch, lunchScale)
        const dinnerScale = (target.kcal - fixedKcal - lunchNutrition.kcal) / Math.max(Number(dinner.kcal) || 1, 1)
        if (dinnerScale < 0.35 || dinnerScale > 4.5) continue
        const dinnerNutrition = scaleNutrition(dinner, dinnerScale)
        const total = addNutrition(breakfastNutrition, snackNutrition, lunchNutrition, dinnerNutrition)
        const score = macroScore(total, target, breakfastScale, snackScale, lunchScale, dinnerScale)
        if (!best || score < best.score) {
          best = { score, breakfastScale, snackScale, lunchScale, dinnerScale, total }
        }
      }
    }
  }

  if (best) return { ...best, dinnerScale: round(best.dinnerScale, 3) }
  const lunchScale = 1
  const dinnerScale = Math.max(0.1, (target.kcal - (breakfast?.nutrition.kcal || 0) - (snack?.nutrition.kcal || 0) - lunch.kcal) / Math.max(dinner.kcal, 1))
  const total = addNutrition(breakfast?.nutrition, snack?.nutrition, lunch, scaleNutrition(dinner, dinnerScale))
  return { score: Infinity, breakfastScale: breakfast ? 1 : 0, snackScale: snack ? 1 : 0, lunchScale, dinnerScale, total }
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
      daily.push({ person_name: member.name, meal_date: date, target, total, energy_deviation: round(energyDeviation, 4), valid: energyDeviation <= 0.05 })
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
        const current = map.get(key) || { label, unit: food.unit, quantity: 0 }
        current.quantity += Number(item.quantity) || 0
        map.set(key, current)
        return map
      }, new Map()).values()].map((item) => ({ ...item, quantity: round(item.quantity, item.unit === 'œuf' ? 1 : 0) })),
    valid: daily.length > 0 && daily.every((item) => item.valid),
  }
}
