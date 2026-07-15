const round = (value, digits = 3) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const daysBetween = (left, right) => {
  if (!left || !right) return null
  return Math.round((new Date(`${left}T00:00:00Z`) - new Date(`${right}T00:00:00Z`)) / 86400000)
}

function cloneAvailability(availability) {
  return new Map([...availability].map(([form, lots]) => [form, lots.map((lot) => ({ ...lot }))]))
}

export function buildAvailability(lots = [], reservations = []) {
  const reservedByLot = new Map()
  for (const reservation of reservations) {
    if (reservation.status && reservation.status !== 'active') continue
    reservedByLot.set(reservation.lotId, (reservedByLot.get(reservation.lotId) || 0) + Number(reservation.grams || 0))
  }
  const availability = new Map()
  for (const lot of lots) {
    const grams = Math.max(0, Number(lot.gramsAvailable ?? lot.grams_available ?? 0) - (reservedByLot.get(lot.id) || 0))
    if (!lot.formNormalized || grams <= 0) continue
    if (!availability.has(lot.formNormalized)) availability.set(lot.formNormalized, [])
    availability.get(lot.formNormalized).push({
      id: lot.id,
      grams,
      expiresOn: lot.expiresOn ?? lot.expiration_date ?? null,
      opened: Boolean(lot.opened ?? lot.is_opened),
    })
  }
  for (const lotsForForm of availability.values()) {
    lotsForForm.sort((a, b) => {
      if (a.opened !== b.opened) return a.opened ? -1 : 1
      if (a.expiresOn && b.expiresOn) return a.expiresOn.localeCompare(b.expiresOn)
      if (a.expiresOn) return -1
      if (b.expiresOn) return 1
      return String(a.id).localeCompare(String(b.id))
    })
  }
  return availability
}

function allocateRecipe(recipe, availability, slotDate) {
  const next = cloneAvailability(availability)
  const allocations = []
  const shortages = []
  let requiredGrams = 0
  let stockGrams = 0
  let urgencyCredit = 0

  for (const ingredient of recipe.exactIngredients || []) {
    if (ingredient.optional) continue
    let remaining = Number(ingredient.grams) || 0
    requiredGrams += remaining
    const lots = next.get(ingredient.formNormalized) || []
    for (const lot of lots) {
      if (remaining <= 0) break
      const take = Math.min(lot.grams, remaining)
      if (take <= 0) continue
      lot.grams -= take
      remaining -= take
      stockGrams += take
      const days = daysBetween(lot.expiresOn, slotDate)
      if (days != null && days <= 3) urgencyCredit += take * (4 - Math.max(days, 0))
      allocations.push({
        lotId: lot.id,
        formNormalized: ingredient.formNormalized,
        ingredientName: ingredient.name,
        grams: round(take),
      })
    }
    if (remaining > 0.001) {
      shortages.push({
        formNormalized: ingredient.formNormalized,
        ingredientName: ingredient.name,
        grams: round(remaining),
      })
    }
  }
  return {
    availability: next,
    allocations,
    shortages,
    requiredGrams,
    stockGrams,
    coverage: requiredGrams > 0 ? stockGrams / requiredGrams : 1,
    urgencyCredit,
  }
}

export function sensoryTransitionPenalty(previous, candidate, recent = []) {
  if (!previous) return { total: 0, reasons: [] }
  const reasons = []
  let total = 0
  if (previous.sensory?.profile && previous.sensory.profile === candidate.sensory?.profile) {
    total += 18
    reasons.push('sensory_profile_repeated')
  }
  const previousTechnique = previous.techniques?.[0]
  if (previousTechnique && previousTechnique === candidate.techniques?.[0]) {
    total += 10
    reasons.push('primary_technique_repeated')
  }
  const recentTextures = [...recent.slice(-2), candidate]
  if (recentTextures.length === 3 && recentTextures.every((recipe) =>
    (recipe.sensory?.target_textures || recipe.sensory?.targetTextures || [])
      .some((texture) => /fondant|moelleux|cremeux|onctueux|puree|molle/.test(texture)))) {
    total += 14
    reasons.push('three_soft_textures')
  }
  const previousRichness = Number(previous.sensory?.scores?.richness) || 0
  const candidateAcidity = Number(candidate.sensory?.scores?.acidic) || 0
  const candidateFreshness = Number(candidate.sensory?.scores?.freshness) || 0
  if (previousRichness >= 4 && candidateAcidity < 2 && candidateFreshness < 3) {
    total += 12
    reasons.push('rich_meal_without_fresh_counterpoint')
  }
  return { total, reasons }
}

function nutritionPenalty(nutrition, target = {}) {
  const dimensions = [
    ['kcal', 0.45], ['proteinG', 0.3], ['fiberG', 0.15], ['carbsG', 0.05], ['fatG', 0.05],
  ]
  let total = 0
  let weights = 0
  for (const [key, weight] of dimensions) {
    const expected = Number(target[key])
    const actual = Number(nutrition?.[key])
    if (!Number.isFinite(expected) || expected <= 0 || !Number.isFinite(actual)) continue
    total += Math.min(Math.abs(actual - expected) / expected, 2) * weight
    weights += weight
  }
  return weights ? (total / weights) * 35 : 0
}

function violatesHardConstraints(recipe, constraints) {
  if (!recipe.eligible) return 'recipe_not_executable'
  const allergies = new Set((constraints.allergens || []).map((value) => String(value).toLowerCase()))
  if ((recipe.allergens || []).some((value) => allergies.has(String(value).toLowerCase()))) return 'allergen'
  const disliked = new Set(constraints.dislikedForms || [])
  if ((recipe.exactIngredients || []).some((ingredient) => disliked.has(ingredient.formNormalized))) return 'disliked_food'
  const forbidden = (constraints.forbiddenForms || []).filter(Boolean)
  if ((recipe.exactIngredients || []).some((ingredient) => forbidden.some((term) =>
    ingredient.formNormalized === term || ingredient.formNormalized.includes(term) || term.includes(ingredient.formNormalized)))) {
    return 'forbidden_food'
  }
  const diets = new Set((constraints.diets || []).map((value) => String(value).toLowerCase()))
  const categories = new Set((recipe.exactIngredients || []).map((ingredient) => ingredient.category).filter(Boolean))
  const hasAnimalFlesh = [...categories].some((category) => category === 'viandes' || category === 'poissons_fruits_de_mer')
  const hasAnimalProduct = hasAnimalFlesh || [...categories].some((category) =>
    category === 'produits_laitiers' || category === 'oeufs')
  if ([...diets].some((diet) => /vegetar/.test(diet)) && hasAnimalFlesh) return 'vegetarian_diet'
  if ([...diets].some((diet) => /vegan|vegetalien/.test(diet)) && hasAnimalProduct) return 'vegan_diet'
  const maxMinutes = Number(constraints.maxMinutesByMeal?.[constraints.currentMealType] ?? constraints.maxTotalMinutes)
  if (Number.isFinite(maxMinutes) && recipe.prepMinutes + recipe.cookMinutes > maxMinutes) return 'time_limit'
  return null
}

function evaluateCandidate(state, recipe, slot, constraints) {
  const mealType = slot.mealType ?? slot.meal_type
  const hardFailure = violatesHardConstraints(recipe, { ...constraints, currentMealType: mealType })
  if (hardFailure) return null
  const allocation = allocateRecipe(recipe, state.availability, slot.date)
  if (!constraints.allowShopping && allocation.shortages.length) return null
  const sensory = sensoryTransitionPenalty(state.recipes.at(-1), recipe, state.recipes)
  const nutrition = nutritionPenalty(recipe.nutritionPerServing, constraints.targetByMeal?.[mealType] || constraints.targetPerMeal)
  const shoppingPenalty = allocation.requiredGrams > 0
    ? (1 - allocation.coverage) * 32
    : 0
  const timePenalty = Math.max(0, recipe.prepMinutes - (constraints.preferredActiveMinutes || 30)) * 0.15
  const stockReward = allocation.coverage * 28
  const wasteReward = Math.min(allocation.urgencyCredit / 100, 20)
  const cuisineRepeat = state.recipes.slice(-3).filter((item) => item.cuisineOrigin === recipe.cuisineOrigin).length * 5
  const recipeRepeatCount = state.recipes.filter((item) => item.code === recipe.code).length
  const recipeRepeatPenalty = recipeRepeatCount * 36 + (state.recipes.at(-1)?.code === recipe.code ? 60 : 0)
  const score = stockReward + wasteReward - sensory.total - nutrition - shoppingPenalty - timePenalty - cuisineRepeat - recipeRepeatPenalty
  return { score, allocation, sensory, nutritionPenalty: nutrition, recipeRepeatCount }
}

/**
 * Deterministic beam-search planner. Stock is globally decremented between
 * slots, so one lot can never be promised to two meals.
 */
export function generateClosedLoopPlan({
  slots,
  recipes,
  inventoryLots = [],
  existingReservations = [],
  constraints = {},
  beamWidth = 24,
}) {
  let beam = [{
    score: 0,
    availability: buildAvailability(inventoryLots, existingReservations),
    recipes: [],
    slots: [],
    usedCodes: new Set(),
  }]

  for (const slot of slots) {
    const expanded = []
    for (const state of beam) {
      for (const recipe of recipes) {
        const evaluated = evaluateCandidate(state, recipe, slot, constraints)
        if (!evaluated) continue
        const usedCodes = new Set(state.usedCodes)
        usedCodes.add(recipe.code)
        expanded.push({
          score: state.score + evaluated.score,
          availability: evaluated.allocation.availability,
          recipes: [...state.recipes, recipe],
          usedCodes,
          slots: [...state.slots, {
            ...slot,
            recipeCode: recipe.code,
            title: recipe.family,
            servings: recipe.servings,
            nutrition: recipe.nutritionPerServing,
            sensory: recipe.sensory,
            allocations: evaluated.allocation.allocations,
            shortages: evaluated.allocation.shortages,
            stockCoverage: round(evaluated.allocation.coverage, 4),
            score: round(evaluated.score, 2),
            explanations: [
              ...evaluated.sensory.reasons,
              ...(evaluated.recipeRepeatCount ? ['recipe_repeated'] : []),
            ],
          }],
        })
      }
    }
    expanded.sort((a, b) => b.score - a.score || a.slots.at(-1).recipeCode.localeCompare(b.slots.at(-1).recipeCode))
    beam = expanded.slice(0, beamWidth)
    if (!beam.length) {
      return {
        status: 'review_required',
        slots: [],
        reservations: [],
        shoppingItems: [],
        issues: [{ severity: 'blocker', code: 'no_feasible_plan', slot }],
      }
    }
  }

  const best = beam[0]
  const reservations = best.slots.flatMap((slot) => slot.allocations.map((allocation) => ({
    ...allocation,
    slotKey: slot.key,
    status: 'active',
  })))
  const shoppingByForm = new Map()
  for (const slot of best.slots) {
    for (const shortage of slot.shortages) {
      const current = shoppingByForm.get(shortage.formNormalized) || { ...shortage, grams: 0, neededBy: slot.date }
      current.grams += shortage.grams
      if (slot.date < current.neededBy) current.neededBy = slot.date
      shoppingByForm.set(shortage.formNormalized, current)
    }
  }
  return {
    status: 'published',
    score: round(best.score, 2),
    slots: best.slots,
    reservations,
    shoppingItems: [...shoppingByForm.values()].map((item) => ({ ...item, grams: round(item.grams) })),
    issues: [],
    objectiveScores: {
      globalScore: round(best.score, 2),
      stockCoverage: round(best.slots.reduce((sum, slot) => sum + slot.stockCoverage, 0) / Math.max(best.slots.length, 1), 4),
      shoppingItemCount: shoppingByForm.size,
      sensoryRuleViolations: best.slots.reduce((sum, slot) => sum + slot.explanations.length, 0),
    },
  }
}
