import { createHash } from 'node:crypto'
import { buildPersonalizedMeals } from './personalizedMeals'

const NUTRIENT_KEYS = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']

const round = (value, digits = 2) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

function scaleNutrition(nutrition, factor) {
  return Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, round((nutrition?.[key] || 0) * factor)]))
}

function addDays(isoDate, count) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

export function nextMondayIso(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() + (day === 0 ? 1 : 8 - day))
  return date.toISOString().slice(0, 10)
}

export function buildWeekSlots(windowStart) {
  return Array.from({ length: 7 }).flatMap((_, dayIndex) => {
    const date = addDays(windowStart, dayIndex)
    return [
      { key: `${date}-dejeuner`, date, mealType: 'dejeuner' },
      { key: `${date}-diner`, date, mealType: 'diner' },
    ]
  })
}

const categoryLabels = {
  viandes: 'Viandes',
  poissons_fruits_de_mer: 'Poissons',
  produits_laitiers: 'Crèmerie',
  oeufs: 'Crèmerie',
  legumes: 'Fruits et légumes',
  fruits: 'Fruits et légumes',
  herbes_aromates: 'Fruits et légumes',
  cereales_feculents: 'Féculents',
  legumineuses: 'Épicerie',
  huiles_matieres_grasses: 'Épicerie',
}

const aisleOrder = {
  'Fruits et légumes': 10,
  Viandes: 20,
  Poissons: 25,
  Crèmerie: 30,
  Féculents: 40,
  Épicerie: 50,
}

const PLAN_ISSUE_MESSAGES = {
  fish_quota: 'Le nombre de repas de poisson recommandé n’est pas atteint.',
  meat_max: 'Le nombre maximal de repas de viande est dépassé.',
  vegetarian_min: 'Le nombre minimal de repas végétariens n’est pas atteint.',
  red_meat_min: 'Le repère hebdomadaire de viande rouge n’est pas atteint.',
  fatty_fish_min: 'Le repère hebdomadaire de poisson gras n’est pas atteint.',
  legumes_min: 'Le nombre minimal de repas avec légumineuses n’est pas atteint.',
  cuisines_min: 'La semaine manque de diversité entre les cuisines proposées.',
  proteins_min: 'La semaine manque de diversité entre les sources de protéines.',
  no_feasible_plan: 'Aucun planning ne satisfait toutes les contraintes du foyer.',
}

export function normalizePlanIssues(issues = []) {
  return issues.map((issue = {}) => {
    const code = String(issue.code || 'planning_rule').trim() || 'planning_rule'
    const repeatedProtein = code.startsWith('protein_repeat_')
    const message = String(issue.message || '').trim()
      || PLAN_ISSUE_MESSAGES[code]
      || (repeatedProtein
        ? 'Une même source de protéines revient trop souvent dans la semaine.'
        : `La règle de planning « ${code} » demande une vérification.`)
    const { severity, slotKey, slot_key: slotKeySnake, details, message: _message, code: _code, ...context } = issue

    return {
      severity: ['blocker', 'error', 'warning', 'info'].includes(severity) ? severity : 'warning',
      code,
      message,
      ...(slotKey || slotKeySnake ? { slot_key: slotKey || slotKeySnake } : {}),
      details: { ...(details && typeof details === 'object' ? details : {}), ...context },
    }
  })
}

function taskTimes(slot, prepMinutes) {
  const dueHourUtc = slot.mealType === 'dejeuner' ? 10 : 17
  const due = new Date(`${slot.date}T${String(dueHourUtc).padStart(2, '0')}:30:00Z`)
  const earliest = new Date(due.getTime() - Math.max(Number(prepMinutes) || 15, 15) * 60000)
  return { due: due.toISOString(), earliest: earliest.toISOString() }
}

export function buildCanonicalPlanPayload({
  plan,
  recipes,
  members,
  goals = [],
  windowStart,
  constraints,
  inventoryLots = [],
  corpusVersion = 'v3-300-real-dishes',
}) {
  const recipeByCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const memberList = members?.length ? members : [{ name: 'Foyer', portion_multiplier: 1 }]
  const windowEnd = addDays(windowStart, 6)
  const categoryByForm = new Map()
  const requiredByForm = new Map()
  const reservedByForm = new Map()

  for (const recipe of recipes) {
    for (const ingredient of recipe.exactIngredients) {
      if (ingredient.category) categoryByForm.set(ingredient.formNormalized, ingredient.category)
    }
  }

  const personalized = buildPersonalizedMeals({ plan, recipes, members: memberList, goals, constraints })
  if (!personalized.valid) {
    const invalidDays = personalized.daily.filter((day) => !day.valid)
    throw new Error(`Cibles énergétiques hors tolérance pour ${invalidDays.map((day) => `${day.person_name} le ${day.meal_date}`).join(', ')}`)
  }
  const mealsBySlot = new Map()
  for (const meal of personalized.meals) {
    if (!meal.slot_key) continue
    if (!mealsBySlot.has(meal.slot_key)) mealsBySlot.set(meal.slot_key, [])
    mealsBySlot.get(meal.slot_key).push(meal)
  }

  const slots = plan.slots.map((slot) => {
    const recipe = recipeByCode.get(slot.recipeCode)
    if (!recipe) throw new Error(`Recette absente du snapshot: ${slot.recipeCode}`)
    for (const ingredient of recipe.exactIngredients) {
      if (!ingredient.optional) {
        requiredByForm.set(ingredient.formNormalized, (requiredByForm.get(ingredient.formNormalized) || 0) + ingredient.grams)
      }
    }
    for (const allocation of slot.allocations) {
      reservedByForm.set(allocation.formNormalized, (reservedByForm.get(allocation.formNormalized) || 0) + allocation.grams)
    }
    const personalizedSlotMeals = mealsBySlot.get(slot.key) || []
    const nutritionByMember = Object.fromEntries(personalizedSlotMeals.map((meal) => [
      meal.person_name,
      { kcal: meal.kcal, proteinG: meal.protein_g, carbsG: meal.carbs_g, fatG: meal.fat_g, fiberG: meal.fiber_g },
    ]))
    const memberVariants = personalizedSlotMeals
      .filter((meal) => meal.canonical_recipe_code && meal.canonical_recipe_code !== recipe.code)
      .map((meal) => ({
        person_name: meal.person_name,
        recipe_code: meal.canonical_recipe_code,
        href: `/recipes/canonical/${meal.canonical_recipe_code}`,
        reason: meal.variant_kind,
      }))
    const baseServings = personalizedSlotMeals
      .filter((meal) => meal.canonical_recipe_code === recipe.code)
      .reduce((sum, meal) => sum + (Number(meal.planned_servings) || 0), 0)
    return {
      slot_key: slot.key,
      recipe_code: recipe.code,
      meal_date: slot.date,
      meal_type: slot.mealType,
      title: recipe.family,
      servings: round(baseServings || recipe.servings, 2),
      status: 'planned',
      locked: false,
      source: 'canonical_v3',
      nutrition_by_member: nutritionByMember,
      nutrition_total: scaleNutrition(recipe.nutritionPerServing, recipe.servings),
      nutrition_source: 'deterministic_exact_forms',
      nutrition_confidence: 1,
      preparation: {
        recipe_code: recipe.code,
        href: `/recipes/canonical/${recipe.code}`,
        exact_steps: recipe.exactSteps,
        techniques: recipe.techniques,
        sensory: recipe.sensory,
        identity_guardrails: recipe.sensory?.identity_guardrails || [],
        member_variants: memberVariants,
      },
      stock_summary: {
        coverage: slot.stockCoverage,
        allocations: slot.allocations,
        shortages: slot.shortages,
        explanations: slot.explanations,
      },
    }
  })

  const executionRecipeCodes = [...new Set([...plan.slots.map((slot) => slot.recipeCode), ...personalized.recipeCodes])]
  const recipeExecutions = executionRecipeCodes.map((recipeCode) => {
    const recipe = recipeByCode.get(recipeCode)
    const sourceSlots = plan.slots.filter((slot) => slot.recipeCode === recipeCode)
    const execution = {
      recipe_code: recipe.code,
      servings: recipe.servings,
      selected_configuration: {
        identity_level: recipe.identityLevel,
        sensory_profile: recipe.sensory?.profile || null,
        substitutions: [],
      },
      exact_ingredients_snapshot: recipe.exactIngredients,
      exact_steps_snapshot: recipe.exactSteps,
      nutrition_snapshot: {
        per_serving: recipe.nutritionPerServing,
        coverage: recipe.nutritionCoverage,
      },
      transformation_plan_snapshot: recipe.techniques,
      source_lot_plan_snapshot: sourceSlots.flatMap((slot) => slot.allocations || []),
    }
    return {
      ...execution,
      content_hash: createHash('sha256').update(JSON.stringify(execution)).digest('hex'),
    }
  })

  const reservations = plan.reservations.map((reservation) => ({
    slot_key: reservation.slotKey,
    lot_id: reservation.lotId,
    ingredient_name: reservation.ingredientName,
    reserved_quantity: reservation.grams,
    reserved_unit: 'g',
    needed_quantity: reservation.grams,
    needed_unit: 'g',
    metadata: { form_normalized: reservation.formNormalized, allocation_strategy: 'opened_first_then_fefo' },
  }))

  const shoppingItems = plan.shoppingItems.map((item) => {
    const category = categoryLabels[categoryByForm.get(item.formNormalized)] || 'Épicerie'
    return {
      week_label: 'S1',
      category,
      product_name: item.ingredientName,
      display_quantity: `${Math.ceil(item.grams)} g`,
      required_qty: round(requiredByForm.get(item.formNormalized) || item.grams, 3),
      stock_qty: round(reservedByForm.get(item.formNormalized) || 0, 3),
      reserved_qty: round(reservedByForm.get(item.formNormalized) || 0, 3),
      incoming_qty: 0,
      purchase_qty: round(item.grams, 3),
      purchase_unit: 'g',
      shopping_status: 'needed',
      aisle_order: aisleOrder[category] || 999,
      shortage_reason: 'stock_exact_insufficient',
      needed_by: item.neededBy,
      notes: 'Forme exacte requise par la recette V3',
    }
  })
  for (const requirement of personalized.supplementalRequirements) {
    const purchaseUnit = requirement.unit === 'œuf' ? 'u' : requirement.unit
    const displayUnit = requirement.unit === 'œuf' ? 'œufs' : requirement.unit
    shoppingItems.push({
      week_label: 'S1',
      category: requirement.unit === 'œuf' || /skyr/.test(requirement.label) ? 'Crèmerie' : /pomme|kiwi|poire|banane|abricot|pêche|framboise/.test(requirement.label) ? 'Fruits et légumes' : 'Épicerie',
      product_name: requirement.label.charAt(0).toUpperCase() + requirement.label.slice(1),
      display_quantity: `${requirement.quantity} ${displayUnit}`,
      required_qty: requirement.quantity,
      stock_qty: 0,
      reserved_qty: 0,
      incoming_qty: 0,
      purchase_qty: requirement.quantity,
      purchase_unit: purchaseUnit,
      shopping_status: 'needed',
      aisle_order: /skyr/.test(requirement.label) || requirement.unit === 'œuf' ? 30 : 45,
      shortage_reason: 'personalized_breakfast_or_snack',
      needed_by: windowStart,
      notes: 'Quantité calculée pour les petits-déjeuners et collations personnalisés',
    })
  }

  const tasks = plan.slots.map((slot) => {
    const recipe = recipeByCode.get(slot.recipeCode)
    const time = taskTimes(slot, recipe.prepMinutes)
    return {
      task_key: `prepare-${slot.key}`,
      slot_key: slot.key,
      prep_date: slot.date,
      prep_label: slot.mealType === 'dejeuner' ? 'Déjeuner' : 'Dîner',
      title: `Préparer ${recipe.family}`,
      task_type: 'prepare_recipe',
      earliest_start_at: time.earliest,
      due_at: time.due,
      safety_deadline_at: time.due,
      duration_min: recipe.prepMinutes,
      priority: slot.stockCoverage > 0 ? 70 : 50,
      instructions: recipe.exactSteps,
    }
  })

  const legacyMeals = personalized.meals

  const inputSnapshot = {
    corpus_version: corpusVersion,
    inventory: inventoryLots.map((lot) => ({
      id: lot.id,
      form_normalized: lot.formNormalized,
      grams_available: lot.gramsAvailable,
      expires_on: lot.expiresOn,
      opened: lot.opened,
    })),
    constraints,
    member_portions: memberList.map((member) => ({ name: member.name, multiplier: member.portion_multiplier })),
    member_targets: goals,
  }
  const inputHash = createHash('sha256').update(JSON.stringify(inputSnapshot)).digest('hex')
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${windowStart}T00:00:00Z`))

  return {
    source: 'canonical_v3_deterministic',
    rules_version: 'myko-v3-weekly-deterministic-2',
    window_start: windowStart,
    window_end: windowEnd,
    month_label: monthLabel,
    input_hash: inputHash,
    input_snapshot: inputSnapshot,
    objective_scores: plan.objectiveScores,
    validation_summary: {
      status: plan.status,
      recipes_executable: true,
      nutrition_coverage_pct: 100,
      slot_count: slots.length,
      personalized_meal_count: legacyMeals.length,
      daily_energy_targets_valid: personalized.valid,
      daily_nutrition: personalized.daily,
      shopping_item_count: shoppingItems.length,
    },
    slots,
    issues: normalizePlanIssues(plan.issues),
    recipe_executions: recipeExecutions,
    recipe_snapshots: [],
    reservations,
    tasks,
    dependencies: [],
    shopping_items: shoppingItems,
    legacy_meals: legacyMeals,
  }
}
