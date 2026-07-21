import { createHash } from 'node:crypto'
import { buildPersonalizedMeals } from './personalizedMeals'
import { compareLotsFefo } from './closedLoopPlanner'
import { buildCookingSessions, DEFROST_TASK_MINUTES, FREEZE_TASK_MINUTES } from './cookingSessions'
import { buildFinalDemandModel } from './finalDemands'
import { DEFAULT_HOUSEHOLD_TIME_ZONE, nextMondayIsoInTimeZone, zonedDateTimeToUtc } from './planningTime'

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

export function nextMondayIso(now = new Date(), timeZone = 'UTC') {
  return nextMondayIsoInTimeZone(now, timeZone)
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
  daily_micronutrient_data_incomplete: 'Les données micronutritionnelles de cette journée sont incomplètes ; aucune conformité artificielle n’est annoncée.',
  weekly_micronutrient_deficit: 'Un apport micronutritionnel hebdomadaire documenté reste sous son repère.',
  nutrition_week_review_required: 'Les objectifs nutritionnels ne sont pas assez couverts pour annoncer cette semaine comme prête.',
}

// Seuils par dimension. Les écarts quotidiens restent détaillés ; une couverture
// hebdomadaire insuffisante place la version en revue au lieu de l'annoncer prête.
const MACRO_WARNING_RULES = {
  carbsG: { dimension: 'carbs', outOfRange: (deviation) => Math.abs(deviation) > 0.2 },
  fatG: { dimension: 'fat', outOfRange: (deviation) => Math.abs(deviation) > 0.2 },
  fiberG: { dimension: 'fiber', outOfRange: (deviation) => deviation < -0.2 },
}

function demandKeysForDay(demands, day) {
  return (demands || [])
    .filter((demand) => demand.person_name === day.person_name && demand.meal_date === day.meal_date)
    .map((demand) => demand.demand_key)
}

function nutritionIssues(daily, weeklyMicronutrients, demands) {
  const issues = []
  for (const day of daily) {
    const demandKeys = demandKeysForDay(demands, day)
    if (day.micronutrient_data_complete === false) {
      issues.push({
        severity: 'warning',
        code: 'daily_micronutrient_data_incomplete',
        person_name: day.person_name,
        meal_date: day.meal_date,
        available_dimensions: Object.keys(day.micronutrients || {}),
        demand_keys: demandKeys,
      })
    }
    if (day.protein_valid === false) {
      issues.push({
        severity: 'warning',
        code: 'daily_protein_floor',
        person_name: day.person_name,
        meal_date: day.meal_date,
        protein_deviation: day.protein_deviation,
        demand_keys: demandKeys,
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
        demand_keys: demandKeys,
      })
    }
  }

  for (const week of weeklyMicronutrients || []) {
    if (!week.data_complete) continue
    for (const [dimension, ratio] of Object.entries(week.ratios || {})) {
      if (Number(ratio) >= 0.8) continue
      issues.push({
        severity: 'warning',
        code: 'weekly_micronutrient_deficit',
        person_name: week.person_name,
        dimension,
        ratio,
        demand_keys: (demands || []).filter((demand) => demand.person_name === week.person_name).map((demand) => demand.demand_key),
      })
    }
  }

  const people = [...new Set(daily.map((day) => day.person_name))]
  const failingDimensions = []
  for (const personName of people) {
    const days = daily.filter((day) => day.person_name === personName)
    if (!days.length) continue
    const dimensions = {
      energy: days.filter((day) => day.valid && day.target_feasible !== false).length,
      protein: days.filter((day) => day.protein_valid !== false).length,
      carbs: days.filter((day) => day.carbs_valid !== false).length,
      fat: days.filter((day) => day.fat_valid !== false).length,
      fiber: days.filter((day) => day.fiber_valid !== false).length,
    }
    for (const [dimension, validDays] of Object.entries(dimensions)) {
      const requiredRatio = dimension === 'energy' ? 1 : 0.8
      if (validDays / days.length + Number.EPSILON < requiredRatio) {
        failingDimensions.push({ person_name: personName, dimension, valid_days: validDays, days_total: days.length })
      }
    }
  }
  if (failingDimensions.length) {
    issues.push({
      severity: 'error',
      code: 'nutrition_week_review_required',
      failing_dimensions: failingDimensions,
      demand_keys: [...new Set((demands || []).filter((demand) => failingDimensions.some((failure) => failure.person_name === demand.person_name)).map((demand) => demand.demand_key))],
    })
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
    carbs: { valid_days: count((day) => day.carbs_valid !== false), days_total: daysTotal, rule: 'deviation_max_20_pct' },
    fat: { valid_days: count((day) => day.fat_valid !== false), days_total: daysTotal, rule: 'deviation_max_20_pct' },
    fiber: { valid_days: count((day) => !MACRO_WARNING_RULES.fiberG.outOfRange(Number(day.macro_deviations?.fiberG) || 0)), days_total: daysTotal, rule: 'floor_80_pct' },
    micronutrients: {
      valid_days: count((day) => day.micronutrient_data_complete === true),
      days_total: daysTotal,
      rule: 'complete_source_data_required_before_target_validation',
    },
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

function taskTimes(slot, prepMinutes, timeZone) {
  const localTime = slot.mealType === 'dejeuner' ? '12:30:00' : '19:30:00'
  const due = zonedDateTimeToUtc(slot.date, localTime, timeZone)
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

/** Retire les productions devenues vides après les variantes personnelles. */
function normalizeProductionsForFinalMeals(plan, meals) {
  const baseServings = (slotKey, recipeCode) => meals
    .filter((meal) => meal.slot_key === slotKey && meal.canonical_recipe_code === recipeCode)
    .reduce((sum, meal) => sum + (Number(meal.planned_servings) || 0), 0)
  const removedProductionKeys = new Set()
  const emptyConsumerSlots = new Set()
  const productionByRoot = new Map()

  for (const slot of plan.slots.filter((candidate) => candidate.production)) {
    const fridgeKeys = [slot.key, ...(slot.production.consumerSlotKeys || [])]
    const freezerKeys = slot.production.freezer?.consumerSlotKeys || []
    for (const key of [...(slot.production.consumerSlotKeys || []), ...freezerKeys]) {
      if (!(baseServings(key, slot.recipeCode) > 0)) emptyConsumerSlots.add(key)
    }
    const fridgePortions = fridgeKeys.reduce((sum, key) => sum + baseServings(key, slot.recipeCode), 0)
    const freezerPortions = freezerKeys.reduce((sum, key) => sum + baseServings(key, slot.recipeCode), 0)
      + (Number(slot.production.freezer?.nextWeekPortions) || 0)
    if (!(fridgePortions > 0)) removedProductionKeys.add(slot.production.productionKey)
    if (slot.production.freezer && !(freezerPortions > 0)) removedProductionKeys.add(slot.production.freezer.productionKey)
    productionByRoot.set(slot.key, { fridgePortions, freezerPortions })
  }

  return {
    ...plan,
    slots: plan.slots.map((slot) => {
      if (slot.productionKey && (removedProductionKeys.has(slot.productionKey) || emptyConsumerSlots.has(slot.key))) {
        const { productionKey: _productionKey, producerSlotKey: _producerSlotKey, productionPortions: _productionPortions, storageMethod: _storageMethod, ...fresh } = slot
        return { ...fresh, source: 'canonical_v3' }
      }
      if (!slot.production) return slot
      const totals = productionByRoot.get(slot.key)
      if (!totals || (!(totals.fridgePortions > 0) && !(totals.freezerPortions > 0))) {
        const { production: _production, ...fresh } = slot
        return { ...fresh, source: 'canonical_v3' }
      }
      return {
        ...slot,
        production: {
          ...slot.production,
          consumerSlotKeys: totals.fridgePortions > 0
            ? (slot.production.consumerSlotKeys || []).filter((key) => !emptyConsumerSlots.has(key))
            : [],
          ...(slot.production.freezer && totals.freezerPortions > 0 ? {
            freezer: {
              ...slot.production.freezer,
              consumerSlotKeys: (slot.production.freezer.consumerSlotKeys || []).filter((key) => !emptyConsumerSlots.has(key)),
            },
          } : { freezer: undefined }),
        },
      }
    }),
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
  existingDishReservations = [],
  preservedMeals = [],
  slotStates = {},
  corpusVersion = 'v3-300-real-dishes',
  householdTimeZone = DEFAULT_HOUSEHOLD_TIME_ZONE,
}) {
  const recipeByCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const memberList = members?.length ? members : [{ name: 'Foyer', portion_multiplier: 1 }]
  const windowEnd = addDays(windowStart, 6)

  const personalized = buildPersonalizedMeals({ plan, recipes, members: memberList, goals, constraints, preservedMeals })
  const unsafeDays = personalized.daily.filter((day) => day.portion_safe === false || day.support_safe === false || day.recipes_safe === false)
  if (unsafeDays.length) {
    const error = new Error(`Contraintes alimentaires ou physiques non satisfaites pour ${unsafeDays.map((day) => `${day.person_name} le ${day.meal_date}`).join(', ')}`)
    error.code = 'planning_constraints_unsatisfied'
    error.status = 422
    error.details = unsafeDays
    throw error
  }
  const demandPlan = normalizeProductionsForFinalMeals(plan, personalized.meals)
  const finalModel = buildFinalDemandModel({
    plan: demandPlan, recipes, personalized, inventoryLots, existingReservations,
    cookedDishes, existingDishReservations, constraints, slotStates, householdTimeZone,
  })

  // Si les portions finales dépassent un reste sélectionné par le solveur à
  // son grain foyer, on recuisine la recette entière. Aucun complément
  // implicite et aucune réservation de plat insuffisante.
  const effectivePlan = {
    ...demandPlan,
    slots: demandPlan.slots.map((slot) => {
      if (slot.cookedDishId == null || ['cooked_dish', 'mixed'].includes(finalModel.sourceBySlot.get(slot.key)?.type)) return slot
      const {
        cookedDishId: _cookedDishId,
        cookedDishName: _cookedDishName,
        dishPortions: _dishPortions,
        dishNutritionPerPortion: _dishNutritionPerPortion,
        ...fresh
      } = slot
      return { ...fresh, source: 'canonical_v3' }
    }),
  }

  const slots = effectivePlan.slots.map((slot) => {
    const baseRecipe = recipeByCode.get(slot.recipeCode)
    if (!baseRecipe) throw new Error(`Recette absente du snapshot: ${slot.recipeCode}`)
    const summary = finalModel.mainSlotSummaries.get(slot.key) || {
      servings: 0, baseServings: 0, nutritionByMember: {}, nutritionTotal: {}, memberVariants: [], executionKey: null, primaryRecipeCode: slot.recipeCode,
    }
    const recipe = recipeByCode.get(summary.primaryRecipeCode) || baseRecipe
    const resource = finalModel.resourcesBySlot.get(slot.key) || { coverage: 1, allocations: [], shortages: [] }
    const state = slotStates[slot.key] || {}
    const finalSource = summary.source || finalModel.sourceBySlot.get(slot.key) || { type: 'fresh_recipe' }
    const dishFed = finalSource.type === 'cooked_dish'
    const mixedFed = finalSource.type === 'mixed'
    const productionFed = slot.productionKey != null
    if (mixedFed) {
      return {
        slot_key: slot.key,
        recipe_code: recipe.code,
        execution_key: summary.executionKey,
        cooked_dish_id: slot.cookedDishId,
        meal_date: slot.date,
        meal_type: slot.mealType,
        title: recipe.family,
        servings: round(summary.servings, 2),
        status: state.status || 'planned',
        locked: Boolean(state.locked),
        source: 'mixed_dish_and_fresh',
        nutrition_by_member: summary.nutritionByMember,
        nutrition_total: summary.nutritionTotal,
        nutrition_source: 'mixed_final_personal_demands',
        nutrition_confidence: 1,
        preparation: {
          recipe_code: recipe.code,
          href: `/recipes/canonical/${recipe.code}`,
          mode: 'partial_dish_with_fresh_complement',
          cooked_dish_id: slot.cookedDishId,
          exact_steps: recipe.exactSteps,
          techniques: recipe.techniques,
          sensory: recipe.sensory,
          member_variants: summary.memberVariants,
        },
        stock_summary: {
          coverage: resource.coverage,
          allocations: resource.allocations,
          shortages: resource.shortages,
          explanations: slot.explanations,
          cooked_dish: {
            id: slot.cookedDishId,
            name: slot.cookedDishName || recipe.family,
            portions: finalSource.portions,
          },
          fresh_complement: { portions: finalSource.freshPortions },
        },
      }
    }
    if (dishFed) {
      return {
        slot_key: slot.key,
        recipe_code: recipe.code,
        execution_key: summary.executionKey,
        cooked_dish_id: slot.cookedDishId,
        meal_date: slot.date,
        meal_type: slot.mealType,
        title: recipe.family,
        servings: round(summary.servings, 2),
        status: state.status || 'planned',
        locked: Boolean(state.locked),
        source: 'cooked_dish',
        nutrition_by_member: summary.nutritionByMember,
        nutrition_total: summary.nutritionTotal,
        nutrition_source: slot.dishNutritionPerPortion
          ? 'cooked_dish_stored_final_demands'
          : 'final_personal_demands_recipe_fallback',
        nutrition_confidence: 1,
        preparation: reheatPreparation(slot, recipe, summary.memberVariants),
        stock_summary: {
          coverage: resource.coverage,
          allocations: resource.allocations,
          shortages: resource.shortages,
          explanations: slot.explanations,
          cooked_dish: { id: slot.cookedDishId, name: slot.cookedDishName || recipe.family, portions: finalSource.portions },
        },
      }
    }
    if (productionFed) {
      return {
        slot_key: slot.key,
        recipe_code: recipe.code,
        execution_key: summary.executionKey,
        production_key: slot.productionKey,
        meal_date: slot.date,
        meal_type: slot.mealType,
        title: recipe.family,
        servings: round(summary.servings, 2),
        status: state.status || 'planned',
        locked: Boolean(state.locked),
        source: 'planned_production',
        nutrition_by_member: summary.nutritionByMember,
        nutrition_total: summary.nutritionTotal,
        nutrition_source: 'final_personal_demands',
        nutrition_confidence: 1,
        preparation: {
          recipe_code: recipe.code,
          href: `/recipes/canonical/${recipe.code}`,
          mode: 'reheat',
          production_key: slot.productionKey,
          exact_steps: [{ n: 1, instruction: reheatInstruction(recipe.family, slot.productionPortions) }],
          member_variants: summary.memberVariants,
        },
        stock_summary: {
          coverage: resource.coverage,
          allocations: resource.allocations,
          shortages: resource.shortages,
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
      execution_key: summary.executionKey,
      ...(slot.production ? { production_key: slot.production.productionKey } : {}),
      meal_date: slot.date,
      meal_type: slot.mealType,
      title: recipe.family,
      servings: round(summary.servings, 2),
      status: state.status || 'planned',
      locked: Boolean(state.locked),
      source: 'canonical_v3',
      nutrition_by_member: summary.nutritionByMember,
      nutrition_total: summary.nutritionTotal,
      nutrition_source: 'final_personal_demands',
      nutrition_confidence: 1,
      preparation: {
        recipe_code: recipe.code,
        href: `/recipes/canonical/${recipe.code}`,
        exact_steps: recipe.exactSteps,
        techniques: recipe.techniques,
        sensory: recipe.sensory,
        identity_guardrails: recipe.sensory?.identity_guardrails || [],
        member_variants: summary.memberVariants,
      },
      stock_summary: {
        coverage: resource.coverage,
        allocations: resource.allocations,
        shortages: resource.shortages,
        explanations: slot.explanations,
      },
    }
  })

  const recipeExecutions = finalModel.recipeExecutions
  const reservations = [...finalModel.reservations]
  const shoppingItems = [...finalModel.shoppingItems]
  const supportTasks = finalModel.supportTasks
  slots.push(...finalModel.supportSlots)

  // Productions planifiées (audit P2 items 2 et 4, contrat partagé avec la
  // couche schéma) : une par créneau producteur ET par méthode de stockage —
  // le RPC impose UNE storage_method et UN use_by par production, la part
  // congelée d'un même batch est donc publiée comme production sœur
  // « -congelation » (storage_method='freezer', fenêtre congélateur, tâche
  // source = la tâche « Congeler »). Les portions publiées sont recalculées
  // depuis les planned_servings des repas personnalisés — somme du créneau
  // producteur et de ses consommateurs, JAMAIS le nombre de lignes (test K).
  // Les portions « semaine suivante » (audit P3 item 4) n'ont pas de créneau
  // dans ce plan : elles valent recipe.servings (part foyer du solveur).
  // Le solveur a dimensionné les ingrédients au niveau foyer.
  const servingsBySlotKey = new Map([...finalModel.mainSlotSummaries].map(([key, summary]) => [key, summary.baseServings]))
  const productions = effectivePlan.slots
    .filter((slot) => slot.production)
    .flatMap((slot) => {
      const coveredKeys = [slot.key, ...slot.production.consumerSlotKeys]
      const entries = [{
        production_key: slot.production.productionKey,
        task_key: `prepare-${slot.key}`,
        slot_key: slot.key,
        recipe_code: slot.recipeCode,
        execution_key: finalModel.mainSlotSummaries.get(slot.key)?.executionKey || null,
        output_name: slot.production.outputName,
        planned_portions: round(coveredKeys.reduce((sum, key) => sum + (Number(servingsBySlotKey.get(key)) || 0), 0), 2),
        storage_method: slot.production.storageMethod,
        available_from: slot.production.availableFrom,
        use_by: slot.production.useBy,
      }]
      const freezer = slot.production.freezer
      if (freezer) {
        entries.push({
          production_key: freezer.productionKey,
          task_key: `freeze-${slot.key}`,
          slot_key: slot.key,
          recipe_code: slot.recipeCode,
          execution_key: finalModel.mainSlotSummaries.get(slot.key)?.executionKey || null,
          output_name: slot.production.outputName,
          planned_portions: round(
            freezer.consumerSlotKeys.reduce((sum, key) => sum + (Number(servingsBySlotKey.get(key)) || 0), 0)
            + (Number(freezer.nextWeekPortions) || 0), 2),
          storage_method: 'freezer',
          available_from: slot.production.availableFrom,
          use_by: freezer.useBy,
        })
      }
      return entries.filter((entry) => Number(entry.planned_portions) > 0)
    })
  const productionBySlotKey = new Map(productions
    .filter((production) => production.storage_method === 'refrigerator')
    .map((production) => [production.slot_key, production]))
  const freezerProductionBySlotKey = new Map(productions
    .filter((production) => production.storage_method === 'freezer')
    .map((production) => [production.slot_key, production]))
  const productionKeys = new Set(productions.map((production) => production.production_key))

  // Consommations planifiées (audit §8 : un repas référence une SOURCE) : une
  // par créneau nourri par une production (producteur compris — il mange une
  // part de ce qu'il produit) ou par un plat cuisiné existant. La réservation
  // de portions du P1 reste émise en parallèle : la consommation est le lien
  // repas → source, la réservation protège le plat des autres versions.
  const consumptions = effectivePlan.slots.flatMap((slot) => {
    const portions = round(Number(servingsBySlotKey.get(slot.key)) || 0, 2)
    if (!(portions > 0)) return []
    const finalSource = finalModel.mainSlotSummaries.get(slot.key)?.source
    if (slot.cookedDishId != null && ['cooked_dish', 'mixed'].includes(finalSource?.type)) {
      return [{
        slot_key: slot.key,
        source: { cooked_dish_id: slot.cookedDishId },
        portions: round(Number(finalSource.portions) || portions, 2),
        role: finalSource.type === 'mixed' ? 'component' : 'main',
      }]
    }
    const productionKey = slot.production?.productionKey || slot.productionKey
    if (!productionKey || !productionKeys.has(productionKey)) return []
    return [{ slot_key: slot.key, source: { production_key: productionKey }, portions, role: 'main' }]
  })

  // Dépendances (F10, test L) : chaque tâche de réchauffage d'une production
  // dépend de la tâche de cuisson de son producteur — publiées ensemble dans
  // la même version. Les créneaux plats-existants du P1 n'ont pas de
  // dépendance : le plat existe déjà. Chaîne congélation (audit P3 item 5) :
  // cuire → congeler → décongeler (la veille) → manger, chaque maillon dans
  // dependencies[] de la même version.
  const dependencies = effectivePlan.slots.flatMap((slot) => {
    const links = []
    if (slot.production?.freezer) {
      links.push({ task_key: `freeze-${slot.key}`, depends_on_task_key: `prepare-${slot.key}` })
    }
    if (slot.productionKey != null) {
      if (slot.storageMethod === 'freezer') {
        links.push({ task_key: `defrost-${slot.key}`, depends_on_task_key: `freeze-${slot.producerSlotKey}` })
        links.push({ task_key: `reheat-${slot.key}`, depends_on_task_key: `defrost-${slot.key}` })
      } else {
        links.push({ task_key: `reheat-${slot.key}`, depends_on_task_key: `prepare-${slot.producerSlotKey}` })
      }
    }
    return links
  })

  const tasks = effectivePlan.slots.map((slot) => {
    const summary = finalModel.mainSlotSummaries.get(slot.key)
    const recipe = recipeByCode.get(summary?.primaryRecipeCode || slot.recipeCode) || recipeByCode.get(slot.recipeCode)
    if (summary?.source?.type === 'mixed') {
      const time = taskTimes(slot, recipe.prepMinutes, householdTimeZone)
      return {
        task_key: `prepare-${slot.key}`,
        slot_key: slot.key,
        prep_date: slot.date,
        prep_label: slot.mealType === 'dejeuner' ? 'Déjeuner — complément' : 'Dîner — complément',
        title: `Préparer le complément de ${recipe.family} (${formatPortionsFr(summary.source.freshPortions)} portions)`,
        task_type: 'prepare_recipe',
        earliest_start_at: time.earliest,
        due_at: time.due,
        safety_deadline_at: time.due,
        duration_min: recipe.prepMinutes,
        priority: 78,
        instructions: recipe.exactSteps,
      }
    }
    if (slot.cookedDishId != null) {
      // Jamais de « Préparer X » pour un plat qui existe déjà : tâche de
      // réchauffage courte, même mécanisme versionné. Priorité 80 : un reste
      // à consommer avant péremption passe devant une cuisson couverte (70).
      const time = taskTimes(slot, REHEAT_TASK_MINUTES, householdTimeZone)
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
        instructions: [{ n: 1, instruction: reheatInstruction(slot.cookedDishName || recipe.family, servingsBySlotKey.get(slot.key)) }],
      }
    }
    if (slot.productionKey != null) {
      // Réchauffage d'une production planifiée : dépend de la tâche de
      // cuisson du producteur (payload.dependencies). Priorité 75 : sous les
      // restes réels à sauver (80), au-dessus d'une cuisson couverte (70).
      const time = taskTimes(slot, REHEAT_TASK_MINUTES, householdTimeZone)
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
    const time = taskTimes(slot, recipe.prepMinutes, householdTimeZone)
    const production = productionBySlotKey.get(slot.key)
    const freezerProduction = freezerProductionBySlotKey.get(slot.key)
    // Producteur : le titre annonce la production complète — portions au
    // niveau foyer (part congelée comprise) et nombre de repas couverts DANS
    // ce plan (test I : quantités pratiques, lisibles par un humain).
    const producedPortions = production
      ? round(production.planned_portions + (freezerProduction?.planned_portions || 0), 2)
      : null
    const coveredMeals = production
      ? 1 + slot.production.consumerSlotKeys.length + (slot.production.freezer?.consumerSlotKeys.length || 0)
      : null
    return {
      task_key: `prepare-${slot.key}`,
      slot_key: slot.key,
      prep_date: slot.date,
      prep_label: slot.mealType === 'dejeuner' ? 'Déjeuner' : 'Dîner',
      title: production
        ? `Préparer ${recipe.family} — ${formatPortionsFr(producedPortions)} portions (${coveredMeals} repas)`
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
  tasks.push(...effectivePlan.slots
    .filter((slot) => finalModel.mainSlotSummaries.get(slot.key)?.source?.type === 'mixed')
    .map((slot) => {
      const summary = finalModel.mainSlotSummaries.get(slot.key)
      const recipe = recipeByCode.get(summary?.primaryRecipeCode || slot.recipeCode) || recipeByCode.get(slot.recipeCode)
      const time = taskTimes(slot, REHEAT_TASK_MINUTES, householdTimeZone)
      return {
        task_key: `reheat-partial-${slot.key}`,
        slot_key: slot.key,
        prep_date: slot.date,
        prep_label: slot.mealType === 'dejeuner' ? 'Déjeuner — reste' : 'Dîner — reste',
        title: `Réchauffer le reste de ${slot.cookedDishName || recipe.family}`,
        task_type: 'reheat_dish',
        earliest_start_at: time.earliest,
        due_at: time.due,
        safety_deadline_at: time.due,
        duration_min: REHEAT_TASK_MINUTES,
        priority: 80,
        instructions: [{ n: 1, instruction: reheatInstruction(slot.cookedDishName || recipe.family, summary.source.portions) }],
      }
    }))
  tasks.push(...supportTasks)

  // Une variante personnelle est une exécution culinaire à part entière : elle
  // reçoit sa propre tâche et les lots qui lui sont réservés, même si la base
  // du créneau vient d'un reste ou d'un batch.
  const primaryExecutionKeys = new Set([...finalModel.mainSlotSummaries.values()].map((summary) => summary.executionKey).filter(Boolean))
  for (const execution of recipeExecutions.filter((item) => item.is_variant && !primaryExecutionKeys.has(item.execution_key))) {
    const sourceSlot = effectivePlan.slots.find((slot) => slot.key === execution.source_slot_key)
    const recipe = recipeByCode.get(execution.recipe_code)
    if (!sourceSlot || !recipe) continue
    const time = taskTimes(sourceSlot, recipe.prepMinutes, householdTimeZone)
    tasks.push({
      task_key: execution.task_key,
      slot_key: sourceSlot.key,
      prep_date: sourceSlot.date,
      prep_label: sourceSlot.mealType === 'dejeuner' ? 'Déjeuner — variante' : 'Dîner — variante',
      title: `Préparer ${recipe.family} pour ${execution.member_names.join(', ')}`,
      task_type: 'prepare_recipe_variant',
      earliest_start_at: time.earliest,
      due_at: time.due,
      safety_deadline_at: time.due,
      duration_min: recipe.prepMinutes,
      priority: 72,
      instructions: recipe.exactSteps,
    })
  }

  // Chaîne congélation (audit P3 item 5) : « Congeler » juste après la
  // cuisson (même session, même horaire pivot que le repas producteur) et
  // « Sortir du congélateur » la VEILLE du repas couvert. Tâches ajoutées
  // APRÈS les tâches de créneau, en ordre de parcours des créneaux : les
  // plans sans congélation restent octet pour octet identiques.
  for (const slot of effectivePlan.slots) {
    const recipe = recipeByCode.get(slot.recipeCode)
    if (slot.production?.freezer) {
      const freezerProduction = freezerProductionBySlotKey.get(slot.key)
      const time = taskTimes(slot, recipe.prepMinutes, householdTimeZone)
      tasks.push({
        task_key: `freeze-${slot.key}`,
        slot_key: slot.key,
        prep_date: slot.date,
        prep_label: slot.mealType === 'dejeuner' ? 'Déjeuner' : 'Dîner',
        title: `Congeler ${recipe.family} (${formatPortionsFr(freezerProduction.planned_portions)} portions)`,
        task_type: 'freeze_dish',
        earliest_start_at: time.due,
        due_at: time.due,
        safety_deadline_at: time.due,
        duration_min: FREEZE_TASK_MINUTES,
        priority: 75,
        instructions: [{
          n: 1,
          instruction: `Portionner « ${recipe.family} » (${formatPortionsFr(freezerProduction.planned_portions)} portion${freezerProduction.planned_portions > 1 ? 's' : ''}), laisser refroidir puis congeler. À consommer avant le ${freezerProduction.use_by}.`,
        }],
      })
    }
    if (slot.productionKey != null && slot.storageMethod === 'freezer') {
      const eve = addDays(slot.date, -1)
      const portions = round(Number(servingsBySlotKey.get(slot.key)) || Number(slot.productionPortions) || 0, 2)
      const due = zonedDateTimeToUtc(eve, '19:00:00', householdTimeZone).toISOString()
      tasks.push({
        task_key: `defrost-${slot.key}`,
        slot_key: slot.key,
        prep_date: eve,
        prep_label: 'Décongélation',
        title: `Sortir ${recipe.family} du congélateur`,
        task_type: 'defrost_dish',
        earliest_start_at: zonedDateTimeToUtc(eve, '09:00:00', householdTimeZone).toISOString(),
        due_at: due,
        safety_deadline_at: due,
        duration_min: DEFROST_TASK_MINUTES,
        priority: 75,
        instructions: [{
          n: 1,
          instruction: `Sortir « ${recipe.family} » du congélateur (${formatPortionsFr(portions)} portion${portions > 1 ? 's' : ''}) et laisser décongeler au réfrigérateur pour demain.`,
        }],
      })
    }
  }

  for (const task of tasks) {
    const state = slotStates[task.slot_key]
    if (state?.consumed) task.done = true
  }

  const legacyMeals = finalModel.meals

  // Sessions de cuisine (audit §13, P3 item 2) : bloc purement INFORMATIF,
  // dérivé déterministiquement des tâches et productions publiées
  // (cookingSessions.js — la même fonction reconstruit les sessions côté
  // lecture). Le RPC publish_closed_loop_plan ignore les clés inconnues du
  // payload (vérifié : seules les clés listées sont lues) ; la clé est
  // absente des plans sans production pour préserver l'identité octet pour
  // octet avec le comportement antérieur.
  const sessions = productions.length ? buildCookingSessions({ slots, tasks, productions }) : []

  const inputSnapshot = {
    corpus_version: corpusVersion,
    household_timezone: householdTimeZone,
    inventory: inventoryLots.map((lot) => ({
      id: lot.id,
      form_normalized: lot.formNormalized,
      grams_available: lot.gramsAvailable,
      expires_on: lot.expiresOn,
      opened: lot.opened,
      package_size_grams: lot.packageSizeGrams || null,
      package_label: lot.packageLabel || null,
    })),
    // Clé absente quand aucun plat n'est en jeu : le payload (et input_hash)
    // reste octet pour octet identique au comportement antérieur.
    ...(cookedDishes.length ? {
      cooked_dishes: cookedDishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        portions_remaining: dish.portionsRemaining ?? dish.portionsAvailable ?? null,
        expires_on: dish.expiresOn ?? null,
        canonical_recipe_code: dish.recipeCode ?? null,
        canonical_recipe_execution_id: dish.recipeExecutionId ?? null,
        planned_production_id: dish.plannedProductionId ?? null,
      })),
    } : {}),
    constraints,
    selected_slots: demandPlan.slots,
    member_profiles: memberList.map((member) => ({
      id: member.id || null,
      name: member.name,
      multiplier: member.portion_multiplier,
      planning: member.preferences?.planning || {},
    })),
    member_targets: goals,
    existing_reservations: existingReservations,
    existing_dish_reservations: existingDishReservations,
    preserved_meals: preservedMeals.map((meal) => ({
      household_member_id: meal.household_member_id || null,
      person_name: meal.person_name,
      meal_date: meal.meal_date,
      meal_type: meal.meal_type,
      canonical_recipe_code: meal.canonical_recipe_code || null,
      planned_servings: meal.planned_servings,
      locked: meal.locked || false,
    })),
    slot_states: slotStates,
  }
  const inputHash = createHash('sha256').update(JSON.stringify(inputSnapshot)).digest('hex')
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: householdTimeZone })
    .format(new Date(`${windowStart}T12:00:00Z`))

  const issues = normalizePlanIssues([
    ...(effectivePlan.issues || []),
    ...finalModel.issues,
    ...nutritionIssues(personalized.daily, personalized.weeklyMicronutrients, finalModel.demands),
  ])
  const reviewRequired = issues.some((issue) => ['blocker', 'error'].includes(issue.severity))

  return {
    source: 'canonical_v3_deterministic',
    rules_version: 'myko-v5-final-demand-1',
    window_start: windowStart,
    window_end: windowEnd,
    month_label: monthLabel,
    input_hash: inputHash,
    input_snapshot: inputSnapshot,
    objective_scores: effectivePlan.objectiveScores,
    validation_summary: {
      status: reviewRequired ? 'review_required' : effectivePlan.status,
      recipes_executable: true,
      slot_count: slots.length,
      personalized_meal_count: legacyMeals.length,
      daily_energy_targets_valid: personalized.daily.every((day) => day.valid && day.target_feasible !== false),
      days_total: personalized.daily.length,
      energy_valid_days: personalized.daily.filter((day) => day.valid).length,
      protein_valid_days: personalized.daily.filter((day) => day.protein_valid !== false).length,
      nutrition_dimensions: nutritionDimensionSummary(personalized.daily),
      daily_nutrition: personalized.daily,
      weekly_micronutrients: personalized.weeklyMicronutrients,
      shopping_item_count: shoppingItems.length,
    },
    slots,
    issues,
    recipe_executions: recipeExecutions,
    planned_demands: finalModel.demands,
    recipe_snapshots: [],
    reservations,
    tasks,
    dependencies,
    // Clés absentes quand aucune production/consommation n'est en jeu : le
    // payload reste octet pour octet identique au comportement antérieur
    // (régression zéro-production), même contrat que cooked_dishes du P1.
    ...(productions.length ? { productions } : {}),
    ...(consumptions.length ? { consumptions } : {}),
    ...(sessions.length ? { sessions } : {}),
    shopping_items: shoppingItems,
    legacy_meals: legacyMeals,
  }
}
