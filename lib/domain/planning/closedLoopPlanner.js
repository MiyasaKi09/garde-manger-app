const round = (value, digits = 3) => {
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
      allocations.push({ lotId: lot.id, formNormalized: ingredient.formNormalized, ingredientName: ingredient.name, grams: round(take) })
    }
    if (remaining > 0.001) shortages.push({ formNormalized: ingredient.formNormalized, ingredientName: ingredient.name, grams: round(remaining) })
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
      .some((texture) => /fondant|moelleux|cremeux|onctueux|puree|molle/.test(fold(texture))))) {
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
  const dimensions = [['kcal', 0.45], ['proteinG', 0.3], ['fiberG', 0.15], ['carbsG', 0.05], ['fatG', 0.05]]
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

const ANIMAL_MEAT = /\b(boeuf|veau|agneau|mouton|porc|poulet|dinde|canard|jambon|lardon|saucisse|merguez|viande)\b/
const FISH = /\b(saumon|cabillaud|morue|thon|sardine|maquereau|poisson|lieu|colin)\b/
const RED_MEAT = /\b(boeuf|veau|agneau|mouton)\b/
const FATTY_FISH = /\b(saumon|sardine|maquereau|hareng)\b/
const classificationCache = new WeakMap()

export function classifyRecipe(recipe) {
  const cached = classificationCache.get(recipe)
  if (cached) return cached
  const categories = new Set((recipe.exactIngredients || []).map((ingredient) => fold(ingredient.category)).filter(Boolean))
  const ingredientText = (recipe.exactIngredients || []).map((ingredient) => fold(`${ingredient.name} ${ingredient.formNormalized}`)).join(' ')
  const fish = categories.has('poissons fruits de mer') || FISH.test(ingredientText)
  const meat = !fish && (categories.has('viandes') || categories.has('volailles') || ANIMAL_MEAT.test(ingredientText))
  const legumes = categories.has('legumineuses')
  const eggs = categories.has('oeufs')
  const dairy = categories.has('produits laitiers')
  let mainProtein = 'vegetal'
  const proteinMatchers = [
    ['boeuf', /\bboeuf\b/], ['veau', /\bveau\b/], ['agneau', /\b(agneau|mouton)\b/], ['porc', /\b(porc|jambon|lardon|saucisse)\b/],
    ['poulet', /\b(poulet|volaille)\b/], ['canard', /\bcanard\b/], ['saumon', /\bsaumon\b/], ['cabillaud', /\b(cabillaud|morue)\b/],
    ['poisson', FISH], ['lentilles', /\blentille/], ['pois_chiches', /\bpois chiche/], ['haricots', /\bharicot/], ['oeufs', /\boeuf cru\b|\boeuf mollet\b|\boeufs?\b/],
  ]
  for (const [key, matcher] of proteinMatchers) {
    if (matcher.test(ingredientText)) { mainProtein = key; break }
  }
  if (mainProtein === 'vegetal' && eggs) mainProtein = 'oeufs'
  if (mainProtein === 'vegetal' && dairy) mainProtein = 'laitiers'
  const richness = Number(recipe.sensory?.scores?.richness) || 0
  const kcal = Number(recipe.nutritionPerServing?.kcal) || 0
  const classification = {
    fish,
    meat,
    vegetarian: !fish && !meat,
    redMeat: meat && RED_MEAT.test(ingredientText),
    fattyFish: fish && FATTY_FISH.test(ingredientText),
    legumes,
    mainProtein,
    cuisine: fold(recipe.cuisineOrigin) || 'non renseignee',
    rich: richness >= 4 || kcal >= 650,
    light: richness <= 3 && (!kcal || kcal <= 550),
  }
  classificationCache.set(recipe, classification)
  return classification
}

export function isMealSuitableRecipe(recipe) {
  const category = fold(recipe.category)
  if (/^dess-/.test(fold(recipe.code).replace(/ /g, '-'))) return false
  return !/(dessert|gateau|petit dejeuner|sauce de base|accompagnement|entree|tartinade|pate a choux sale|puree d aubergine)/.test(category)
}

function violatesHardConstraints(recipe, constraints) {
  if (!recipe.eligible) return 'recipe_not_executable'
  const allergies = new Set((constraints.allergens || []).map((value) => String(value).toLowerCase()))
  if ((recipe.allergens || []).some((value) => allergies.has(String(value).toLowerCase()))) return 'allergen'
  const disliked = new Set(constraints.dislikedForms || [])
  if ((recipe.exactIngredients || []).some((ingredient) => disliked.has(ingredient.formNormalized))) return 'disliked_food'
  const forbidden = (constraints.forbiddenForms || []).filter(Boolean)
  if ((recipe.exactIngredients || []).some((ingredient) => forbidden.some((term) =>
    ingredient.formNormalized === term || ingredient.formNormalized.includes(term) || term.includes(ingredient.formNormalized)))) return 'forbidden_food'
  const diets = new Set((constraints.diets || []).map((value) => fold(value)))
  const classification = classifyRecipe(recipe)
  if ([...diets].some((diet) => /vegetar/.test(diet)) && (classification.meat || classification.fish)) return 'vegetarian_diet'
  if ([...diets].some((diet) => /vegan|vegetalien/.test(diet))) {
    const categories = new Set((recipe.exactIngredients || []).map((ingredient) => fold(ingredient.category)))
    if (classification.meat || classification.fish || categories.has('produits laitiers') || categories.has('oeufs')) return 'vegan_diet'
  }
  const maxMinutes = Number(constraints.maxMinutesByMeal?.[constraints.currentMealType] ?? constraints.maxTotalMinutes)
  if (Number.isFinite(maxMinutes) && recipe.prepMinutes + recipe.cookMinutes > maxMinutes) return 'time_limit'
  return null
}

function matchesIntent(recipe, intent) {
  const classification = classifyRecipe(recipe)
  if (intent === 'quick') return recipe.prepMinutes + recipe.cookMinutes <= 50 && recipe.prepMinutes <= 30
  if (intent === 'light') return classification.light
  if (intent === 'vegetarian') return classification.vegetarian
  return true
}

function seasonalBonus(recipe, slotDate) {
  const month = Number(String(slotDate || '').slice(5, 7))
  const seasonal = {
    1: /poireau|chou|carotte|courge|endive/, 2: /poireau|chou|carotte|endive/, 3: /epinard|poireau|carotte/,
    4: /asperge|epinard|radis/, 5: /asperge|fraise|petit pois|epinard/, 6: /courgette|tomate|cerise|concombre|poivron/,
    7: /courgette|tomate|aubergine|cerise|concombre|poivron/, 8: /courgette|tomate|aubergine|peche|poivron/,
    9: /tomate|aubergine|raisin|courge|poivron/, 10: /courge|champignon|pomme|poire/, 11: /courge|chou|poireau|champignon/, 12: /courge|chou|poireau|endive/,
  }[month]
  if (!seasonal) return 0
  const names = (recipe.exactIngredients || []).map((ingredient) => fold(ingredient.name)).join(' ')
  return seasonal.test(names) ? 4 : 0
}

function weeklyTargets(constraints, totalSlots) {
  const vegetarianDiet = (constraints.diets || []).some((diet) => /vegetar|vegan|vegetalien/.test(fold(diet)))
  return vegetarianDiet
    ? { fish: 0, meatMax: 0, vegetarianMin: totalSlots, redMeatMin: 0, fattyFishMin: 0, legumesMin: 2, cuisinesMin: 3, proteinsMin: 4 }
    : { fish: Math.min(2, totalSlots), meatMax: Math.min(4, totalSlots), vegetarianMin: Math.min(8, totalSlots), redMeatMin: totalSlots >= 7 ? 1 : 0, fattyFishMin: totalSlots >= 7 ? 1 : 0, legumesMin: Math.min(2, totalSlots), cuisinesMin: Math.min(3, totalSlots), proteinsMin: Math.min(4, totalSlots) }
}

function emptyWeekSummary() {
  return { fish: 0, meat: 0, vegetarian: 0, redMeat: 0, fattyFish: 0, legumes: 0, cuisines: new Set(), proteins: new Map(), rich: 0, light: 0 }
}

function addToWeekSummary(current, c) {
  const summary = {
    ...current,
    cuisines: new Set(current.cuisines),
    proteins: new Map(current.proteins),
  }
    if (c.fish) summary.fish++
    if (c.meat) summary.meat++
    if (c.vegetarian) summary.vegetarian++
    if (c.redMeat) summary.redMeat++
    if (c.fattyFish) summary.fattyFish++
    if (c.legumes) summary.legumes++
    if (c.rich) summary.rich++
    if (c.light) summary.light++
    summary.cuisines.add(c.cuisine)
    summary.proteins.set(c.mainProtein, (summary.proteins.get(c.mainProtein) || 0) + 1)
  return summary
}

function weeklyDeficits(summary, targets) {
  const deficits = []
  const add = (code, missing) => { if (missing > 0) deficits.push({ code, missing }) }
  add('fish_quota', Math.abs(targets.fish - summary.fish))
  add('meat_max', summary.meat - targets.meatMax)
  add('vegetarian_min', targets.vegetarianMin - summary.vegetarian)
  add('red_meat_min', targets.redMeatMin - summary.redMeat)
  add('fatty_fish_min', targets.fattyFishMin - summary.fattyFish)
  add('legumes_min', targets.legumesMin - summary.legumes)
  add('cuisines_min', targets.cuisinesMin - summary.cuisines.size)
  add('proteins_min', targets.proteinsMin - summary.proteins.size)
  for (const [protein, count] of summary.proteins) {
    if (!['vegetal', 'laitiers', 'oeufs'].includes(protein)) add(`protein_repeat_${protein}`, count - 2)
  }
  return deficits
}

function quotaProgressScore(before, recipe, targets) {
  const candidate = classifyRecipe(recipe)
  let score = 0
  if (candidate.fish && before.fish < targets.fish) score += 18
  if (candidate.vegetarian && before.vegetarian < targets.vegetarianMin) score += 7
  if (candidate.redMeat && before.redMeat < targets.redMeatMin) score += 14
  if (candidate.fattyFish && before.fattyFish < targets.fattyFishMin) score += 12
  if (candidate.legumes && before.legumes < targets.legumesMin) score += 10
  if (!before.cuisines.has(candidate.cuisine) && before.cuisines.size < targets.cuisinesMin) score += 7
  if (!before.proteins.has(candidate.mainProtein) && before.proteins.size < targets.proteinsMin) score += 7
  return score
}

function evaluateCandidate(state, recipe, slot, constraints, targets) {
  if (slot.fixedRecipeCode && recipe.code !== slot.fixedRecipeCode) return null
  if ((slot.excludedRecipeCodes || []).includes(recipe.code)) return null
  const intent = slot.intent || constraints.intent || 'balanced'
  if (!matchesIntent(recipe, intent)) return null
  const mealType = slot.mealType ?? slot.meal_type
  const hardFailure = violatesHardConstraints(recipe, { ...constraints, currentMealType: mealType })
  if (hardFailure) return null

  const classification = classifyRecipe(recipe)
  const week = state.weeklySummary
  if (!slot.fixedRecipeCode && classification.fish && week.fish >= targets.fish) return null
  if (!slot.fixedRecipeCode && classification.meat && week.meat >= targets.meatMax) return null
  if (!slot.fixedRecipeCode && !['vegetal', 'laitiers', 'oeufs'].includes(classification.mainProtein) && (week.proteins.get(classification.mainProtein) || 0) >= 2) return null

  const allocation = allocateRecipe(recipe, state.availability, slot.date)
  if (!constraints.allowShopping && allocation.shortages.length) return null
  const sensory = sensoryTransitionPenalty(state.recipes.at(-1), recipe, state.recipes)
  const nutrition = nutritionPenalty(recipe.nutritionPerServing, constraints.targetByMeal?.[mealType] || constraints.targetPerMeal)
  const shoppingPenalty = allocation.requiredGrams > 0 ? (1 - allocation.coverage) * (intent === 'stock' ? 52 : 32) : 0
  const timePenalty = Math.max(0, recipe.prepMinutes - (constraints.preferredActiveMinutes || 30)) * (intent === 'quick' ? .45 : .15)
  const stockReward = allocation.coverage * (intent === 'stock' ? 48 : 28)
  const wasteReward = Math.min(allocation.urgencyCredit / 100, intent === 'stock' ? 32 : 20)
  const cuisineRepeat = state.recipes.slice(-3).filter((item) => item.cuisineOrigin === recipe.cuisineOrigin).length * 5
  const recipeRepeatCount = state.recipes.filter((item) => item.code === recipe.code).length
  const recipeRepeatPenalty = recipeRepeatCount * 36 + (state.recipes.at(-1)?.code === recipe.code ? 60 : 0)
  const recentPenalty = (constraints.recentRecipeTitles || []).includes(fold(recipe.family)) ? 28 : 0
  const quotaScore = quotaProgressScore(week, recipe, targets)
  const score = stockReward + wasteReward + quotaScore + seasonalBonus(recipe, slot.date) - sensory.total - nutrition - shoppingPenalty - timePenalty - cuisineRepeat - recipeRepeatPenalty - recentPenalty
  return { score, allocation, sensory, nutritionPenalty: nutrition, recipeRepeatCount }
}

/** Deterministic closed-loop planner with immutable safety and weekly rules. */
export function generateClosedLoopPlan({ slots, recipes, inventoryLots = [], existingReservations = [], constraints = {}, beamWidth = 24 }) {
  const targets = weeklyTargets(constraints, slots.length)
  let beam = [{ score: 0, availability: buildAvailability(inventoryLots, existingReservations), recipes: [], slots: [], usedCodes: new Set(), weeklySummary: emptyWeekSummary() }]

  for (const slot of slots) {
    const expanded = []
    for (const state of beam) {
      for (const recipe of recipes) {
        const evaluated = evaluateCandidate(state, recipe, slot, constraints, targets)
        if (!evaluated) continue
        const usedCodes = new Set(state.usedCodes)
        usedCodes.add(recipe.code)
        expanded.push({
          score: state.score + evaluated.score,
          availability: evaluated.allocation.availability,
          recipes: [...state.recipes, recipe],
          weeklySummary: addToWeekSummary(state.weeklySummary, classifyRecipe(recipe)),
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
            explanations: [...evaluated.sensory.reasons, ...(evaluated.recipeRepeatCount ? ['recipe_repeated'] : [])],
          }],
        })
      }
    }
    expanded.sort((a, b) => b.score - a.score || a.slots.at(-1).recipeCode.localeCompare(b.slots.at(-1).recipeCode))
    beam = expanded.slice(0, beamWidth)
    if (!beam.length) return { status: 'review_required', slots: [], reservations: [], shoppingItems: [], issues: [{ severity: 'blocker', code: 'no_feasible_plan', slot }] }
  }

  const ranked = beam.map((state) => {
    const weeklySummary = state.weeklySummary
    const deficits = weeklyDeficits(weeklySummary, targets)
    const deficitWeight = deficits.reduce((sum, item) => sum + item.missing, 0)
    return { ...state, weeklySummary, deficits, deficitWeight }
  }).sort((a, b) => a.deficitWeight - b.deficitWeight || b.score - a.score)
  const best = ranked[0]
  const reservations = best.slots.flatMap((slot) => slot.allocations.map((allocation) => ({ ...allocation, slotKey: slot.key, status: 'active' })))
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
    issues: best.deficits.map((deficit) => ({ severity: 'warning', code: deficit.code, missing: deficit.missing })),
    objectiveScores: {
      globalScore: round(best.score, 2),
      stockCoverage: round(best.slots.reduce((sum, slot) => sum + slot.stockCoverage, 0) / Math.max(best.slots.length, 1), 4),
      shoppingItemCount: shoppingByForm.size,
      sensoryRuleViolations: best.slots.reduce((sum, slot) => sum + slot.explanations.length, 0),
      weeklyRuleViolations: best.deficits.length,
      weeklyTargets: targets,
      weeklyActual: {
        fish: best.weeklySummary.fish, meat: best.weeklySummary.meat, vegetarian: best.weeklySummary.vegetarian,
        redMeat: best.weeklySummary.redMeat, fattyFish: best.weeklySummary.fattyFish, legumes: best.weeklySummary.legumes,
        cuisines: best.weeklySummary.cuisines.size, proteins: best.weeklySummary.proteins.size,
      },
    },
  }
}
