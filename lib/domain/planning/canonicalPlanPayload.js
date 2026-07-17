import { createHash } from 'node:crypto'
import { buildPersonalizedMeals, SUPPLEMENT_FORMS } from './personalizedMeals'
import { allocateFromLots, buildAvailability, compareLotsFefo } from './closedLoopPlanner'

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
  daily_protein_floor: 'L’apport en protéines d’une journée est sous le plancher de 90 % de la cible.',
  daily_macro_deviation: 'Une journée s’écarte sensiblement d’une cible de macronutriments.',
}

// Seuils de signalement non bloquants par macronutriment. Les protéines et les
// fibres sont des planchers (alignés sur le score d'optimisation), les glucides
// et lipides tolèrent ±25 % avant alerte. Aucun de ces seuils ne bloque la
// publication : seule l'énergie ±5 % reste la barrière dure.
const MACRO_WARNING_RULES = {
  carbsG: { dimension: 'carbs', outOfRange: (deviation) => Math.abs(deviation) > 0.25 },
  fatG: { dimension: 'fat', outOfRange: (deviation) => Math.abs(deviation) > 0.25 },
  fiberG: { dimension: 'fiber', outOfRange: (deviation) => deviation < -0.2 },
}

function nutritionWarningIssues(daily) {
  const issues = []
  for (const day of daily) {
    if (day.protein_valid === false) {
      issues.push({
        severity: 'warning',
        code: 'daily_protein_floor',
        person_name: day.person_name,
        meal_date: day.meal_date,
        protein_deviation: day.protein_deviation,
      })
    }
    for (const [key, rule] of Object.entries(MACRO_WARNING_RULES)) {
      const deviation = Number(day.macro_deviations?.[key])
      if (!Number.isFinite(deviation) || !rule.outOfRange(deviation)) continue
      issues.push({
        severity: 'warning',
        code: 'daily_macro_deviation',
        person_name: day.person_name,
        meal_date: day.meal_date,
        dimension: rule.dimension,
        deviation,
      })
    }
  }
  return issues
}

// Détail par dimension pour validation_summary : jamais un « 100 % » agrégé,
// chaque dimension expose son propre décompte de journées conformes.
function nutritionDimensionSummary(daily) {
  const count = (predicate) => daily.filter(predicate).length
  const daysTotal = daily.length
  return {
    energy: { valid_days: count((day) => day.valid), days_total: daysTotal, rule: 'deviation_max_5_pct' },
    protein: { valid_days: count((day) => day.protein_valid !== false), days_total: daysTotal, rule: 'floor_90_pct' },
    carbs: { valid_days: count((day) => !MACRO_WARNING_RULES.carbsG.outOfRange(Number(day.macro_deviations?.carbsG) || 0)), days_total: daysTotal, rule: 'deviation_max_25_pct' },
    fat: { valid_days: count((day) => !MACRO_WARNING_RULES.fatG.outOfRange(Number(day.macro_deviations?.fatG) || 0)), days_total: daysTotal, rule: 'deviation_max_25_pct' },
    fiber: { valid_days: count((day) => !MACRO_WARNING_RULES.fiberG.outOfRange(Number(day.macro_deviations?.fiberG) || 0)), days_total: daysTotal, rule: 'floor_80_pct' },
  }
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

/**
 * Lots allouables à un supplément : union de toutes ses formes acceptées
 * (forme d'affichage + aliases du vocabulaire réel des lots), en conservant
 * les MÊMES objets que la disponibilité résiduelle partagée — un lot débité
 * par allocateFromLots pour une entrée n'est donc plus disponible pour la
 * suivante, même si deux entrées acceptent la même forme (jamais de double
 * allocation). Re-tri ouvert d'abord puis FEFO : les listes par forme sont
 * triées individuellement, leur union ne l'est plus.
 */
export function collectSupplementLots(availability, forms = []) {
  const lots = []
  const seen = new Set()
  for (const form of forms) {
    for (const lot of availability.get(form) || []) {
      if (seen.has(lot)) continue
      seen.add(lot)
      lots.push(lot)
    }
  }
  return lots.sort(compareLotsFefo)
}

function taskTimes(slot, prepMinutes) {
  const dueHourUtc = slot.mealType === 'dejeuner' ? 10 : 17
  const due = new Date(`${slot.date}T${String(dueHourUtc).padStart(2, '0')}:30:00Z`)
  const earliest = new Date(due.getTime() - Math.max(Number(prepMinutes) || 15, 15) * 60000)
  return { due: due.toISOString(), earliest: earliest.toISOString() }
}

// Réchauffer un reste n'est pas cuisiner : tâche légère, même mécanisme que
// les tâches de préparation (versionnée, horodatée), durée courte.
const REHEAT_TASK_MINUTES = 10

function reheatInstruction(name, portions) {
  const count = Number(portions) || 1
  return `Réchauffer « ${name} » (${String(count).replace('.', ',')} portion${count > 1 ? 's' : ''}) et servir.`
}

const formatPortionsFr = (value) => String(round(value, 2)).replace('.', ',')

/**
 * Préparation d'un créneau nourri par un plat déjà cuisiné : miroir minimal
 * de la forme habituelle. `recipe_code` et `href` restent présents (la
 * régénération lit preparation.recipe_code pour figer les créneaux non
 * ciblés), mais aucune étape de recette — une seule consigne de réchauffage.
 */
function reheatPreparation(slot, recipe, memberVariants) {
  return {
    recipe_code: recipe.code,
    href: `/recipes/canonical/${recipe.code}`,
    mode: 'reheat',
    cooked_dish_id: slot.cookedDishId,
    exact_steps: [{ n: 1, instruction: reheatInstruction(slot.cookedDishName || recipe.family, slot.dishPortions) }],
    member_variants: memberVariants,
  }
}

export function buildCanonicalPlanPayload({
  plan,
  recipes,
  members,
  goals = [],
  windowStart,
  constraints,
  inventoryLots = [],
  existingReservations = [],
  cookedDishes = [],
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
    // Un créneau nourri par un plat cuisiné ou par une production planifiée
    // ne consomme AUCUN ingrédient en propre : la nourriture existe déjà (ou
    // existera via le producteur), rien ne part aux besoins ni aux courses.
    // Le créneau producteur, lui, porte les besoins de TOUTES les portions
    // produites (× scale, audit P2 item 4).
    const dishFed = slot.cookedDishId != null
    const productionFed = slot.productionKey != null
    if (!dishFed && !productionFed) {
      const productionScale = Number(slot.production?.scale) || 1
      for (const ingredient of recipe.exactIngredients) {
        if (!ingredient.optional) {
          requiredByForm.set(ingredient.formNormalized, (requiredByForm.get(ingredient.formNormalized) || 0) + ingredient.grams * productionScale)
        }
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
    if (dishFed) {
      // Nutrition : celle mémorisée sur le plat quand elle existe (le repas
      // réellement cuisiné), sinon le même chemin déterministe que la recette
      // appariée. nutrition_by_member reste calculé par les repas
      // personnalisés (chemin recette).
      return {
        slot_key: slot.key,
        recipe_code: recipe.code,
        cooked_dish_id: slot.cookedDishId,
        meal_date: slot.date,
        meal_type: slot.mealType,
        title: recipe.family,
        servings: round(baseServings || slot.dishPortions || recipe.servings, 2),
        status: 'planned',
        locked: false,
        source: 'cooked_dish',
        nutrition_by_member: nutritionByMember,
        nutrition_total: scaleNutrition(slot.dishNutritionPerPortion || recipe.nutritionPerServing, slot.dishPortions || recipe.servings),
        nutrition_source: slot.dishNutritionPerPortion ? 'cooked_dish_stored' : 'deterministic_exact_forms',
        nutrition_confidence: 1,
        preparation: reheatPreparation(slot, recipe, memberVariants),
        stock_summary: {
          coverage: slot.stockCoverage,
          allocations: [],
          shortages: [],
          explanations: slot.explanations,
          cooked_dish: { id: slot.cookedDishId, name: slot.cookedDishName || recipe.family, portions: slot.dishPortions },
        },
      }
    }
    if (productionFed) {
      // Créneau consommateur d'une production planifiée : préparation
      // minimale (réchauffage), aucun ingrédient propre. Nutrition : le MÊME
      // chemin déterministe que le producteur — la production est cette
      // recette. La répartition par membre reste celle des repas
      // personnalisés (chemin recette), comme au P1 : elle ne « voit » pas
      // la forme réchauffée, limite assumée jusqu'au lot P4.
      return {
        slot_key: slot.key,
        recipe_code: recipe.code,
        production_key: slot.productionKey,
        meal_date: slot.date,
        meal_type: slot.mealType,
        title: recipe.family,
        servings: round(baseServings || slot.productionPortions || recipe.servings, 2),
        status: 'planned',
        locked: false,
        source: 'planned_production',
        nutrition_by_member: nutritionByMember,
        nutrition_total: scaleNutrition(recipe.nutritionPerServing, recipe.servings),
        nutrition_source: 'deterministic_exact_forms',
        nutrition_confidence: 1,
        preparation: {
          recipe_code: recipe.code,
          href: `/recipes/canonical/${recipe.code}`,
          mode: 'reheat',
          production_key: slot.productionKey,
          exact_steps: [{ n: 1, instruction: reheatInstruction(recipe.family, slot.productionPortions) }],
          member_variants: memberVariants,
        },
        stock_summary: {
          coverage: slot.stockCoverage,
          allocations: [],
          shortages: [],
          explanations: slot.explanations,
          planned_production: {
            production_key: slot.productionKey,
            producer_slot_key: slot.producerSlotKey,
            portions: slot.productionPortions,
          },
        },
      }
    }
    return {
      slot_key: slot.key,
      recipe_code: recipe.code,
      ...(slot.production ? { production_key: slot.production.productionKey } : {}),
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

  // Deux familles de réservations : les lots (forme historique inchangée) et
  // les PORTIONS de plats cuisinés (audit P1-4) — une ligne par (créneau,
  // plat), unité 'portion', jamais décrémentée à la publication.
  const reservations = plan.reservations.map((reservation) => (reservation.cookedDishId != null
    ? {
      slot_key: reservation.slotKey,
      cooked_dish_id: reservation.cookedDishId,
      ingredient_name: reservation.dishName,
      reserved_quantity: reservation.portions,
      reserved_unit: 'portion',
      needed_quantity: reservation.portions,
      needed_unit: 'portion',
      metadata: { allocation_strategy: 'cooked_dish_fefo' },
    }
    : {
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
  // Les petits-déjeuners et collations passent désormais par la boucle stock :
  // disponibilité résiduelle = lots du planificateur moins les réservations du
  // plan (et celles des autres versions actives), allocation FEFO/ouvert
  // d'abord, puis seul le manque résiduel part aux courses. La persistance des
  // réservations sans créneau est reportée au lot P1 (inventory_reservations
  // impose un slot_id non nul).
  const supplementFormByLabel = new Map(SUPPLEMENT_FORMS.map((form) => [form.label, form]))
  const residualAvailability = buildAvailability(inventoryLots, [...existingReservations, ...(plan.reservations || [])])
  for (const requirement of personalized.supplementalRequirements) {
    const supplementForm = supplementFormByLabel.get(requirement.label)
    const gramsPerUnit = Number(supplementForm?.gramsPerUnit) > 0 ? Number(supplementForm.gramsPerUnit) : null
    const isUnit = ['œuf', 'pièce'].includes(requirement.unit)
    let stockQty = 0
    if (gramsPerUnit) {
      // Un lot est accepté s'il porte N'IMPORTE QUELLE forme de l'entrée
      // (forme d'affichage ou alias du vocabulaire réel), égalité exacte.
      const lots = collectSupplementLots(residualAvailability, [supplementForm.formNormalized, ...(supplementForm.aliases || [])])
      const { allocatedGrams } = allocateFromLots(lots, requirement.quantity * gramsPerUnit)
      // Unités entières couvertes par le stock : jamais arrondi vers le haut,
      // pour ne pas promettre plus que la disponibilité réelle des lots.
      stockQty = isUnit ? Math.floor(allocatedGrams / gramsPerUnit + 1e-9) : round(allocatedGrams / gramsPerUnit, 3)
    }
    const purchaseQty = round(Math.max(0, requirement.quantity - stockQty), 3)
    if (purchaseQty <= 0) continue
    const purchaseUnit = isUnit ? 'u' : requirement.unit
    const displayUnit = requirement.unit === 'œuf' ? 'œufs' : requirement.unit === 'pièce' ? 'pièces' : requirement.unit
    const packageCount = requirement.packageSize ? Math.ceil(purchaseQty / requirement.packageSize) : null
    const isPackaged = Boolean(requirement.packageSize && packageCount)
    const packageLabel = requirement.packageLabel || 'contenant'
    const displayQuantity = isPackaged
      ? `${packageCount} ${packageLabel}${packageCount > 1 ? 's' : ''} de ${requirement.packageSize} ${requirement.packageUnit}`
      : `${purchaseQty} ${displayUnit}`
    const category = requirement.unit === 'œuf' || /skyr/.test(requirement.label)
      ? 'Crèmerie'
      : /pomme|kiwi|poire|banane|pêche|nectarine|orange/.test(requirement.label)
        ? 'Fruits et légumes'
        : /poulet|jambon/.test(requirement.label)
          ? 'Viandes'
          : /thon/.test(requirement.label)
            ? 'Poissons'
            : 'Épicerie'
    shoppingItems.push({
      week_label: 'S1',
      category,
      product_name: requirement.label.charAt(0).toUpperCase() + requirement.label.slice(1),
      display_quantity: displayQuantity,
      required_qty: requirement.quantity,
      stock_qty: stockQty,
      reserved_qty: stockQty,
      incoming_qty: 0,
      purchase_qty: purchaseQty,
      purchase_unit: purchaseUnit,
      shopping_status: 'needed',
      aisle_order: aisleOrder[category] || 45,
      shortage_reason: 'personalized_breakfast_or_snack',
      needed_by: windowStart,
      notes: isPackaged
        ? `Conditionnement prévu : ${packageCount} × ${requirement.packageSize} ${requirement.packageUnit}`
        : 'Quantité calculée pour les petits-déjeuners et collations personnalisés',
      ...(isPackaged ? {
        container_qty: packageCount,
        container_size: requirement.packageSize,
        container_unit: requirement.packageUnit,
      } : {}),
    })
  }

  // Productions planifiées (audit P2 items 2 et 4, contrat partagé avec la
  // couche schéma) : une par créneau producteur. Les portions publiées sont
  // recalculées depuis les planned_servings des repas personnalisés — somme
  // du créneau producteur et de ses consommateurs, JAMAIS le nombre de lignes
  // (test K). Le solveur a dimensionné les ingrédients au niveau foyer.
  const servingsBySlotKey = new Map(slots.map((slot) => [slot.slot_key, slot.servings]))
  const productions = plan.slots
    .filter((slot) => slot.production)
    .map((slot) => {
      const coveredKeys = [slot.key, ...slot.production.consumerSlotKeys]
      return {
        production_key: slot.production.productionKey,
        task_key: `prepare-${slot.key}`,
        slot_key: slot.key,
        recipe_code: slot.recipeCode,
        output_name: slot.production.outputName,
        planned_portions: round(coveredKeys.reduce((sum, key) => sum + (Number(servingsBySlotKey.get(key)) || 0), 0), 2),
        storage_method: slot.production.storageMethod,
        available_from: slot.production.availableFrom,
        use_by: slot.production.useBy,
      }
    })
  const productionBySlotKey = new Map(productions.map((production) => [production.slot_key, production]))

  // Consommations planifiées (audit §8 : un repas référence une SOURCE) : une
  // par créneau nourri par une production (producteur compris — il mange une
  // part de ce qu'il produit) ou par un plat cuisiné existant. La réservation
  // de portions du P1 reste émise en parallèle : la consommation est le lien
  // repas → source, la réservation protège le plat des autres versions.
  const consumptions = plan.slots.flatMap((slot) => {
    if (slot.cookedDishId != null) {
      return [{ slot_key: slot.key, source: { cooked_dish_id: slot.cookedDishId }, portions: Number(slot.dishPortions) || 0, role: 'main' }]
    }
    const productionKey = slot.production?.productionKey || slot.productionKey
    if (!productionKey) return []
    return [{ slot_key: slot.key, source: { production_key: productionKey }, portions: round(Number(servingsBySlotKey.get(slot.key)) || 0, 2), role: 'main' }]
  })

  // Dépendances (F10, test L) : chaque tâche de réchauffage d'une production
  // dépend de la tâche de cuisson de son producteur — publiées ensemble dans
  // la même version. Les créneaux plats-existants du P1 n'ont pas de
  // dépendance : le plat existe déjà.
  const dependencies = plan.slots
    .filter((slot) => slot.productionKey != null)
    .map((slot) => ({ task_key: `reheat-${slot.key}`, depends_on_task_key: `prepare-${slot.producerSlotKey}` }))

  const tasks = plan.slots.map((slot) => {
    const recipe = recipeByCode.get(slot.recipeCode)
    if (slot.cookedDishId != null) {
      // Jamais de « Préparer X » pour un plat qui existe déjà : tâche de
      // réchauffage courte, même mécanisme versionné. Priorité 80 : un reste
      // à consommer avant péremption passe devant une cuisson couverte (70).
      const time = taskTimes(slot, REHEAT_TASK_MINUTES)
      return {
        task_key: `reheat-${slot.key}`,
        slot_key: slot.key,
        prep_date: slot.date,
        prep_label: slot.mealType === 'dejeuner' ? 'Déjeuner' : 'Dîner',
        title: `Réchauffer ${slot.cookedDishName || recipe.family}`,
        task_type: 'reheat_dish',
        earliest_start_at: time.earliest,
        due_at: time.due,
        safety_deadline_at: time.due,
        duration_min: REHEAT_TASK_MINUTES,
        priority: 80,
        instructions: [{ n: 1, instruction: reheatInstruction(slot.cookedDishName || recipe.family, slot.dishPortions) }],
      }
    }
    if (slot.productionKey != null) {
      // Réchauffage d'une production planifiée : dépend de la tâche de
      // cuisson du producteur (payload.dependencies). Priorité 75 : sous les
      // restes réels à sauver (80), au-dessus d'une cuisson couverte (70).
      const time = taskTimes(slot, REHEAT_TASK_MINUTES)
      return {
        task_key: `reheat-${slot.key}`,
        slot_key: slot.key,
        prep_date: slot.date,
        prep_label: slot.mealType === 'dejeuner' ? 'Déjeuner' : 'Dîner',
        title: `Réchauffer ${recipe.family}`,
        task_type: 'reheat_dish',
        earliest_start_at: time.earliest,
        due_at: time.due,
        safety_deadline_at: time.due,
        duration_min: REHEAT_TASK_MINUTES,
        priority: 75,
        instructions: [{ n: 1, instruction: reheatInstruction(recipe.family, slot.productionPortions) }],
      }
    }
    const time = taskTimes(slot, recipe.prepMinutes)
    const production = productionBySlotKey.get(slot.key)
    return {
      task_key: `prepare-${slot.key}`,
      slot_key: slot.key,
      prep_date: slot.date,
      prep_label: slot.mealType === 'dejeuner' ? 'Déjeuner' : 'Dîner',
      // Producteur : le titre annonce la production complète — portions au
      // niveau foyer et nombre de repas couverts (test I : quantités
      // pratiques, lisibles par un humain).
      title: production
        ? `Préparer ${recipe.family} — ${formatPortionsFr(production.planned_portions)} portions (${1 + slot.production.consumerSlotKeys.length} repas)`
        : `Préparer ${recipe.family}`,
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
    // Clé absente quand aucun plat n'est en jeu : le payload (et input_hash)
    // reste octet pour octet identique au comportement antérieur.
    ...(cookedDishes.length ? {
      cooked_dishes: cookedDishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        portions_remaining: dish.portionsRemaining ?? dish.portionsAvailable ?? null,
        expires_on: dish.expiresOn ?? null,
      })),
    } : {}),
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
      slot_count: slots.length,
      personalized_meal_count: legacyMeals.length,
      daily_energy_targets_valid: personalized.valid,
      days_total: personalized.daily.length,
      energy_valid_days: personalized.daily.filter((day) => day.valid).length,
      protein_valid_days: personalized.daily.filter((day) => day.protein_valid !== false).length,
      nutrition_dimensions: nutritionDimensionSummary(personalized.daily),
      daily_nutrition: personalized.daily,
      shopping_item_count: shoppingItems.length,
    },
    slots,
    issues: normalizePlanIssues([...(plan.issues || []), ...nutritionWarningIssues(personalized.daily)]),
    recipe_executions: recipeExecutions,
    recipe_snapshots: [],
    reservations,
    tasks,
    dependencies,
    // Clés absentes quand aucune production/consommation n'est en jeu : le
    // payload reste octet pour octet identique au comportement antérieur
    // (régression zéro-production), même contrat que cooked_dishes du P1.
    ...(productions.length ? { productions } : {}),
    ...(consumptions.length ? { consumptions } : {}),
    shopping_items: shoppingItems,
    legacy_meals: legacyMeals,
  }
}
