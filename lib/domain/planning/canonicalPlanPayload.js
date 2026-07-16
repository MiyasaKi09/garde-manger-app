import { createHash } from 'node:crypto'

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
    const nutritionByMember = Object.fromEntries(memberList.map((member) => [
      member.name,
      scaleNutrition(recipe.nutritionPerServing, Number(member.portion_multiplier) || 1),
    ]))
    return {
      slot_key: slot.key,
      recipe_code: recipe.code,
      meal_date: slot.date,
      meal_type: slot.mealType,
      title: recipe.family,
      servings: recipe.servings,
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
      },
      stock_summary: {
        coverage: slot.stockCoverage,
        allocations: slot.allocations,
        shortages: slot.shortages,
        explanations: slot.explanations,
      },
    }
  })

  const recipeExecutions = plan.slots.map((slot) => {
    const recipe = recipeByCode.get(slot.recipeCode)
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
      source_lot_plan_snapshot: slot.allocations,
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

  const legacyMeals = plan.slots.flatMap((slot) => {
    const recipe = recipeByCode.get(slot.recipeCode)
    return memberList.map((member) => {
      const multiplier = Number(member.portion_multiplier) || 1
      const nutrition = scaleNutrition(recipe.nutritionPerServing, multiplier)
      return {
        slot_key: slot.key,
        person_name: member.name,
        meal_date: slot.date,
        meal_type: slot.mealType,
        day_type: 'standard',
        description: recipe.family,
        kcal: nutrition.kcal,
        protein_g: nutrition.proteinG,
        carbs_g: nutrition.carbsG,
        fat_g: nutrition.fatG,
        fiber_g: nutrition.fiberG,
        planned_servings: multiplier,
      }
    })
  })

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
      shopping_item_count: shoppingItems.length,
    },
    slots,
    issues: plan.issues || [],
    recipe_executions: recipeExecutions,
    recipe_snapshots: [],
    reservations,
    tasks,
    dependencies: [],
    shopping_items: shoppingItems,
    legacy_meals: legacyMeals,
  }
}
