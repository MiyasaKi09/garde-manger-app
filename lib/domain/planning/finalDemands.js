import { createHash } from 'node:crypto'
import { allocateFromLots, buildAvailability, compareLotsFefo } from './closedLoopPlanner'
import { SUPPLEMENT_FORMS } from './personalizedMeals'
import { PLATE_COMPONENT_FORMS } from './mealComposition'
import { DEFAULT_HOUSEHOLD_TIME_ZONE, zonedDateTimeToUtc } from './planningTime'

const NUTRIENTS = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
const MEAL_ORDER = { pdj: 0, dejeuner: 1, collation: 2, diner: 3 }

const round = (value, digits = 3) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const nutritionOfMeal = (meal) => ({
  kcal: Number(meal?.kcal) || 0,
  proteinG: Number(meal?.protein_g) || 0,
  carbsG: Number(meal?.carbs_g) || 0,
  fatG: Number(meal?.fat_g) || 0,
  fiberG: Number(meal?.fiber_g) || 0,
})

const sumNutrition = (meals) => Object.fromEntries(NUTRIENTS.map((key) => [
  key,
  round((meals || []).reduce((sum, meal) => sum + nutritionOfMeal(meal)[key], 0), 2),
]))

const scaleNutrition = (nutrition, factor) => Object.fromEntries(NUTRIENTS.map((key) => [
  key,
  round((Number(nutrition?.[key]) || 0) * factor, 2),
]))

const addNutrition = (parts) => Object.fromEntries(NUTRIENTS.map((key) => [
  key,
  round((parts || []).reduce((sum, part) => sum + (Number(part?.[key]) || 0), 0), 2),
]))

const scaleMicronutrients = (micronutrients, factor) => Object.fromEntries(
  Object.entries(micronutrients || {}).map(([key, value]) => [key, round((Number(value) || 0) * factor, 3)]),
)

const minIso = (left, right) => (!left || (right && right < left) ? right : left)

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

const USUAL_PACKAGES = [
  { pattern: /laurier/, size: 10, unit: 'g', label: 'sachet' },
  { pattern: /muscade/, size: 20, unit: 'g', label: 'pot' },
  { pattern: /paprika|cumin|curcuma|cannelle|poivre|curry|piment/, size: 40, unit: 'g', label: 'pot' },
  { pattern: /farine|sucre|riz|pates|pâtes|semoule|lentilles|pois chiches|boulgour|quinoa/, size: 500, unit: 'g', label: 'paquet' },
  { pattern: /beurre/, size: 250, unit: 'g', label: 'plaquette' },
  { pattern: /creme|crème/, size: 200, unit: 'g', label: 'pot' },
  { pattern: /fromage|parmesan|comte|comté|mozzarella|feta|ricotta/, size: 200, unit: 'g', label: 'paquet' },
  { pattern: /oeuf|œuf/, size: 360, unit: 'g', label: 'boîte de 6 œufs', completeLabel: true },
  { pattern: /pomme(?! de terre)/, size: 150, unit: 'g', label: 'pièce', completeLabel: true },
  { pattern: /poire/, size: 170, unit: 'g', label: 'pièce', completeLabel: true },
  { pattern: /banane/, size: 120, unit: 'g', label: 'pièce', completeLabel: true },
  { pattern: /orange/, size: 180, unit: 'g', label: 'pièce', completeLabel: true },
  { pattern: /kiwi/, size: 80, unit: 'g', label: 'pièce', completeLabel: true },
  { pattern: /peche|pêche|nectarine/, size: 150, unit: 'g', label: 'pièce', completeLabel: true },
  { pattern: /citron/, size: 120, unit: 'g', label: 'pièce', completeLabel: true },
]

const PANTRY_STAPLE_PATTERN = /laurier|muscade|paprika|cumin|curcuma|cannelle|poivre|curry|piment|farine|sucre|riz|pates|pâtes|semoule|huile|vinaigre|sel/

function usualPackageForIngredient(ingredient, inventoryPackageByForm) {
  const explicitSize = Number(ingredient.packageSizeGrams ?? ingredient.packageSize)
  if (explicitSize > 0 && (!ingredient.packageUnit || ingredient.packageUnit === 'g')) {
    return {
      packageSize: explicitSize,
      packageUnit: 'g',
      packageLabel: ingredient.packageLabel || ingredient.packagingType || 'contenant',
      packageLabelIsComplete: Boolean(ingredient.packageLabelIsComplete),
      source: 'catalog_or_preference',
    }
  }
  const stockPackage = inventoryPackageByForm.get(ingredient.formNormalized)
  if (stockPackage) return { ...stockPackage, source: 'household_stock_preference' }
  const normalized = String(ingredient.formNormalized || ingredient.name || '').toLowerCase()
  const usual = USUAL_PACKAGES.find((rule) => rule.pattern.test(normalized))
  if (!usual) return {}
  return {
    packageSize: usual.size,
    packageUnit: usual.unit,
    packageLabel: usual.label,
    packageLabelIsComplete: Boolean(usual.completeLabel),
    source: 'usual_package_rule',
  }
}

function supplementCategory(label) {
  if (/œuf|skyr/i.test(label)) return 'Crèmerie'
  if (/pomme|kiwi|poire|banane|pêche|nectarine|orange/i.test(label)) return 'Fruits et légumes'
  if (/jambon/i.test(label)) return 'Viandes'
  if (/thon/i.test(label)) return 'Poissons'
  return 'Épicerie'
}

function collectLots(availability, forms) {
  const result = []
  const seen = new Set()
  for (const form of forms || []) {
    for (const lot of availability.get(form) || []) {
      if (seen.has(lot)) continue
      seen.add(lot)
      result.push(lot)
    }
  }
  return result.sort(compareLotsFefo)
}

function demandKey(meal) {
  const member = meal.household_member_id || encodeURIComponent(String(meal.person_name || 'foyer'))
  return `${member}:${meal.meal_date}:${meal.meal_type}`
}

function taskKeyForExecution(executionKey) {
  return `prepare-${String(executionKey).replace(/[^a-zA-Z0-9_-]+/g, '-')}`.slice(0, 180)
}

function addRequirement(aggregate, requirement, allocatedGrams, shortageGrams) {
  const key = requirement.shoppingKey || requirement.formNormalized
  const current = aggregate.get(key) || {
    key,
    productName: requirement.productName,
    formNormalized: requirement.formNormalized,
    category: requirement.category || 'Épicerie',
    gramsPerUnit: requirement.gramsPerUnit || 1,
    purchaseUnit: requirement.purchaseUnit || 'g',
    displayUnit: requirement.displayUnit || requirement.purchaseUnit || 'g',
    packageSize: requirement.packageSize || null,
    packageUnit: requirement.packageUnit || null,
    packageLabel: requirement.packageLabel || null,
    packageLabelIsComplete: Boolean(requirement.packageLabelIsComplete),
    packageSource: requirement.packageSource || null,
    pantryStaple: Boolean(requirement.pantryStaple),
    requiredGrams: 0,
    reservedGrams: 0,
    shortageGrams: 0,
    neededBy: null,
    sourceTypes: new Set(),
  }
  // Une même forme demandée à la fois par une recette et à la pièce est
  // consolidée en grammes : aucune conversion ambiguë dans la liste d'achat.
  if (current.purchaseUnit !== (requirement.purchaseUnit || 'g')) {
    current.gramsPerUnit = 1
    current.purchaseUnit = 'g'
    current.displayUnit = 'g'
    current.packageSize = null
    current.packageUnit = null
    current.packageLabel = null
    current.packageLabelIsComplete = false
    current.packageSource = null
  }
  current.requiredGrams += requirement.grams
  current.reservedGrams += allocatedGrams
  current.shortageGrams += shortageGrams
  current.neededBy = minIso(current.neededBy, requirement.neededOn)
  current.sourceTypes.add(requirement.sourceType)
  current.pantryStaple = current.pantryStaple || Boolean(requirement.pantryStaple)
  aggregate.set(key, current)
}

function shoppingItemFromRequirement(item) {
  const gramsPerUnit = Number(item.gramsPerUnit) || 1
  const requiredQty = round(item.requiredGrams / gramsPerUnit, 3)
  const stockQty = round(item.reservedGrams / gramsPerUnit, 3)
  const exactPurchaseQty = round(item.shortageGrams / gramsPerUnit, 3)
  if (!(exactPurchaseQty > 0.001)) return null

  const containerQty = item.packageSize ? Math.ceil(exactPurchaseQty / item.packageSize) : null
  const physicalPurchaseQty = containerQty ? round(containerQty * item.packageSize, 3) : exactPurchaseQty
  const projectedSurplusQty = round(Math.max(0, physicalPurchaseQty - exactPurchaseQty), 3)
  const displayQuantity = containerQty
    ? item.packageLabelIsComplete
      ? item.packageLabel === 'pièce'
        ? `${containerQty} pièce${containerQty > 1 ? 's' : ''} (~${physicalPurchaseQty} ${item.packageUnit || item.displayUnit})`
        : `${containerQty === 1 ? '' : `${containerQty} × `}${item.packageLabel}`
      : `${containerQty} ${item.packageLabel || 'contenant'}${containerQty > 1 ? 's' : ''} de ${item.packageSize} ${item.packageUnit || item.displayUnit}`
    : `${round(physicalPurchaseQty, 2)} ${item.displayUnit}`

  return {
    week_label: 'S1',
    category: item.category,
    product_name: item.productName,
    display_quantity: displayQuantity,
    required_qty: requiredQty,
    stock_qty: stockQty,
    reserved_qty: stockQty,
    incoming_qty: projectedSurplusQty,
    purchase_qty: physicalPurchaseQty,
    exact_required_qty: exactPurchaseQty,
    projected_surplus_qty: projectedSurplusQty,
    purchase_unit: item.purchaseUnit,
    purchase_decision: {
      exact_shortage: exactPurchaseQty,
      physical_purchase: physicalPurchaseQty,
      projected_surplus: projectedSurplusQty,
      unit: item.purchaseUnit,
      package_source: item.packageSource,
      forecast_stock_incoming: projectedSurplusQty,
      stock_role: item.pantryStaple ? 'pantry_staple' : 'weekly_need',
    },
    shopping_status: 'needed',
    planning_source: 'final_demands',
    aisle_order: aisleOrder[item.category] || 999,
    shortage_reason: item.pantryStaple
      ? 'pantry_refill_from_final_demand'
      : item.sourceTypes.has('support')
        ? 'final_support_demand'
        : item.sourceTypes.has('companion') ? 'final_companion_demand' : 'final_recipe_demand',
    needed_by: item.neededBy,
    notes: containerQty
      ? `Besoin exact ${exactPurchaseQty} ${item.purchaseUnit}; achat physique ${containerQty} × ${item.packageSize} ${item.packageUnit}; surplus prévu ${projectedSurplusQty} ${item.purchaseUnit}.`
      : 'Quantité issue des demandes finales personnalisées.',
    ...(containerQty ? {
      container_qty: containerQty,
      container_size: item.packageSize,
      container_unit: item.packageUnit || item.purchaseUnit,
    } : {}),
  }
}

function validateFinalModel(model, inventoryLots, cookedDishes, existingDishReservations) {
  for (const demand of model.demands) {
    const servings = Number(demand.requested_servings)
    if (!(servings > 0)) throw new Error(`final_demand_portion_non_positive:${demand.demand_key}`)
    if (demand.person_name && demand.status !== 'consumed' && servings > 2 + 0.001) {
      throw new Error(`final_demand_portion_above_hard_max:${demand.demand_key}`)
    }
  }
  const lotCapacity = new Map((inventoryLots || []).map((lot) => [String(lot.id), Number(lot.gramsAvailable) || 0]))
  const lotReserved = new Map()
  for (const reservation of model.reservations.filter((item) => item.lot_id != null)) {
    const key = String(reservation.lot_id)
    lotReserved.set(key, (lotReserved.get(key) || 0) + Number(reservation.reserved_quantity || 0))
    const neededOn = reservation.metadata?.needed_on
    const expiresOn = reservation.metadata?.expires_on
    if (neededOn && expiresOn && expiresOn < neededOn) throw new Error(`final_demand_expired_lot:${key}:${neededOn}`)
  }
  for (const [lotId, quantity] of lotReserved) {
    if (quantity > (lotCapacity.get(lotId) || 0) + 0.001) throw new Error(`final_demand_lot_overallocated:${lotId}`)
  }
  const dishCapacity = new Map((cookedDishes || []).map((dish) => [
    String(dish.id),
    Number(dish.portionsRemaining ?? dish.portionsAvailable) || 0,
  ]))
  for (const reservation of existingDishReservations || []) {
    if (reservation.status && reservation.status !== 'active') continue
    const key = String(reservation.cookedDishId)
    dishCapacity.set(key, Math.max(0, (dishCapacity.get(key) || 0) - (Number(reservation.portions) || 0)))
  }
  const dishReserved = new Map()
  for (const reservation of model.reservations.filter((item) => item.cooked_dish_id != null)) {
    const key = String(reservation.cooked_dish_id)
    dishReserved.set(key, (dishReserved.get(key) || 0) + Number(reservation.reserved_quantity || 0))
  }
  for (const [dishId, portions] of dishReserved) {
    if (portions > (dishCapacity.get(dishId) || 0) + 0.001) throw new Error(`final_demand_dish_overallocated:${dishId}`)
  }
  for (const summary of model.mainSlotSummaries.values()) {
    const expected = sumNutrition(summary.meals)
    for (const key of NUTRIENTS) {
      if (Math.abs(expected[key] - summary.nutritionTotal[key]) > 0.01) throw new Error(`final_demand_slot_nutrition_mismatch:${summary.slotKey}:${key}`)
    }
    const expectedServings = round(summary.meals.reduce((sum, meal) => sum + (Number(meal.planned_servings) || 0), 0), 3)
    if (Math.abs(expectedServings - summary.servings) > 0.001) throw new Error(`final_demand_slot_servings_mismatch:${summary.slotKey}`)
  }
  for (const execution of model.recipeExecutions) {
    const demandServings = round(model.demands
      .filter((demand) => demand.execution_key === execution.execution_key)
      .reduce((sum, demand) => sum + (Number(demand.requested_servings) || 0), 0), 3)
    if (Math.abs(demandServings - Number(execution.servings)) > 0.001) throw new Error(`final_demand_execution_servings_mismatch:${execution.execution_key}`)
  }
}

/**
 * Source de vérité du planning publié. Toutes les ressources sont allouées
 * après personnalisation, sur les portions et variantes réellement servies.
 */
export function buildFinalDemandModel({
  plan,
  recipes,
  personalized,
  inventoryLots = [],
  existingReservations = [],
  cookedDishes = [],
  existingDishReservations = [],
  constraints = {},
  slotStates = {},
  householdTimeZone = DEFAULT_HOUSEHOLD_TIME_ZONE,
}) {
  const recipeByCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const slotByKey = new Map(plan.slots.map((slot) => [slot.key, slot]))
  const mealsBySlot = new Map()
  for (const meal of personalized.meals) {
    if (!mealsBySlot.has(meal.slot_key)) mealsBySlot.set(meal.slot_key, [])
    mealsBySlot.get(meal.slot_key).push(meal)
  }

  const dishRemaining = new Map(cookedDishes.map((dish) => [
    String(dish.id),
    Number(dish.portionsRemaining ?? dish.portionsAvailable) || 0,
  ]))
  const cookedDishById = new Map(cookedDishes.map((dish) => [String(dish.id), dish]))
  const inventoryPackageByForm = new Map()
  for (const lot of inventoryLots || []) {
    const size = Number(lot.packageSizeGrams)
    if (!(size > 0) || inventoryPackageByForm.has(lot.formNormalized)) continue
    inventoryPackageByForm.set(lot.formNormalized, {
      packageSize: size,
      packageUnit: 'g',
      packageLabel: lot.packageLabel || lot.packagingType || 'contenant',
      packageLabelIsComplete: false,
    })
  }
  for (const reservation of existingDishReservations || []) {
    if (reservation.status && reservation.status !== 'active') continue
    const key = String(reservation.cookedDishId)
    dishRemaining.set(key, Math.max(0, (dishRemaining.get(key) || 0) - (Number(reservation.portions) || 0)))
  }

  const sourceBySlot = new Map()
  const issues = []
  for (const slot of plan.slots) {
    if (slot.cookedDishId == null) continue
    const requested = (mealsBySlot.get(slot.key) || [])
      .filter((meal) => meal.canonical_recipe_code === slot.recipeCode)
      .reduce((sum, meal) => sum + (Number(meal.planned_servings) || 0), 0)
    const dish = cookedDishes.find((item) => String(item.id) === String(slot.cookedDishId))
    const consumed = slotStates[slot.key]?.consumed === true
    const validAtUse = dish && (!dish.expiresOn || dish.expiresOn >= slot.date)
    const available = consumed ? requested : (validAtUse ? Math.max(0, dishRemaining.get(String(slot.cookedDishId)) || 0) : 0)
    const dishPortions = Math.min(requested, available)
    if (requested > 0 && dishPortions + 0.001 >= requested) {
      sourceBySlot.set(slot.key, { type: 'cooked_dish', id: slot.cookedDishId, portions: round(requested, 3), consumed })
      if (!consumed) dishRemaining.set(String(slot.cookedDishId), available - requested)
    } else if (requested > 0 && dishPortions > 0.001) {
      const freshPortions = round(requested - dishPortions, 3)
      sourceBySlot.set(slot.key, {
        type: 'mixed', id: slot.cookedDishId, portions: round(dishPortions, 3), freshPortions, consumed: false,
      })
      dishRemaining.set(String(slot.cookedDishId), available - dishPortions)
      issues.push({
        severity: 'info', code: 'cooked_dish_partial_with_fresh_complement', slot_key: slot.key,
        requested_portions: round(requested, 3), dish_portions: round(dishPortions, 3), fresh_portions: freshPortions,
      })
    } else {
      sourceBySlot.set(slot.key, { type: 'fresh_recipe' })
      issues.push({
        severity: 'warning', code: 'cooked_dish_replaced_by_fresh_execution', slot_key: slot.key,
        requested_portions: round(requested, 3), available_portions: round(available, 3),
      })
    }
  }

  const groups = new Map()
  const demands = []
  const enrichedMeals = []

  function getExecutionIdentity(meal, slot) {
    const isBase = meal.canonical_recipe_code === slot.recipeCode
    const source = sourceBySlot.get(slot.key)
    if (isBase && source?.type === 'cooked_dish') {
      return { key: `dish:${source.id}:${slot.key}:${meal.canonical_recipe_code}`, mode: 'existing_dish', sourceId: String(source.id), sourceSlotKey: slot.key, neededOn: slot.date }
    }
    const referencedProductionKey = isBase ? (slot.production?.productionKey || slot.productionKey) : null
    if (referencedProductionKey) {
      const producer = plan.slots.find((candidate) => candidate.production?.productionKey === referencedProductionKey
        || candidate.production?.freezer?.productionKey === referencedProductionKey)
      const productionKey = producer?.production?.productionKey || referencedProductionKey
      return {
        key: `production:${productionKey}:${meal.canonical_recipe_code}`,
        mode: 'planned_production',
        sourceId: referencedProductionKey,
        sourceSlotKey: producer?.key || slot.producerSlotKey || slot.key,
        neededOn: producer?.date || slot.date,
      }
    }
    return { key: `meal:${slot.key}:${meal.canonical_recipe_code}`, mode: 'fresh_recipe', sourceId: slot.key, sourceSlotKey: slot.key, neededOn: slot.date }
  }

  const remainingDishDemandBySlot = new Map([...sourceBySlot]
    .filter(([, source]) => source.type === 'mixed')
    .map(([slotKey, source]) => [slotKey, Number(source.portions) || 0]))

  for (const meal of personalized.meals) {
    const baseKey = demandKey(meal)
    const slot = slotByKey.get(meal.slot_key)
    const recipeCode = meal.canonical_recipe_code || null
    const totalServings = Number(meal.planned_servings) || 1
    const defaultIdentity = recipeCode && slot ? getExecutionIdentity(meal, slot) : null
    let parts = [{ identity: defaultIdentity, servings: totalServings }]

    if (recipeCode && slot && recipeCode === slot.recipeCode && sourceBySlot.get(slot.key)?.type === 'mixed') {
      const remainingDish = remainingDishDemandBySlot.get(slot.key) || 0
      const dishServings = Math.min(totalServings, remainingDish)
      const freshServings = round(totalServings - dishServings, 3)
      parts = [
        ...(dishServings > 0.001 ? [{
          identity: {
            key: `dish:${slot.cookedDishId}:${slot.key}:${recipeCode}`,
            mode: 'existing_dish',
            sourceId: String(slot.cookedDishId),
            sourceSlotKey: slot.key,
            neededOn: slot.date,
          },
          servings: round(dishServings, 3),
        }] : []),
        ...(freshServings > 0.001 ? [{ identity: defaultIdentity, servings: freshServings }] : []),
      ]
      remainingDishDemandBySlot.set(slot.key, Math.max(0, remainingDish - dishServings))
    }

    const split = parts.length > 1
    const partRows = parts.map((part) => {
      const suffix = part.identity?.mode === 'existing_dish' ? 'dish' : 'fresh'
      const key = split ? `${baseKey}:${suffix}` : baseKey
      const storedDishNutrition = part.identity?.mode === 'existing_dish'
        ? (cookedDishById.get(part.identity.sourceId)?.nutritionPerPortion || slot?.dishNutritionPerPortion)
        : null
      const nutrition = storedDishNutrition
        ? scaleNutrition(storedDishNutrition, part.servings)
        : scaleNutrition(nutritionOfMeal(meal), part.servings / totalServings)
      return { ...part, key, nutrition }
    })
    const sourceNutrition = addNutrition(partRows.map((part) => part.nutrition))
    const primaryPart = partRows.find((part) => part.identity?.mode !== 'existing_dish') || partRows[0]
    const enriched = {
      ...meal,
      kcal: sourceNutrition.kcal,
      protein_g: sourceNutrition.proteinG,
      carbs_g: sourceNutrition.carbsG,
      fat_g: sourceNutrition.fatG,
      fiber_g: sourceNutrition.fiberG,
      demand_key: primaryPart?.key || baseKey,
      execution_key: primaryPart?.identity?.key || null,
      constraints_snapshot: constraints,
      planning_status: slotStates[meal.slot_key]?.consumed ? 'consumed' : 'planned',
      locked: Boolean(slotStates[meal.slot_key]?.locked || meal.locked),
      micronutrients: meal.micronutrients || {},
      ...(split ? {
        portion_details: {
          ...(meal.portion_details || {}),
          sources: partRows.map((part) => ({
            source_type: part.identity?.mode || 'support',
            source_id: part.identity?.sourceId || meal.slot_key,
            execution_key: part.identity?.key || null,
            servings: part.servings,
          })),
        },
      } : {}),
    }
    enrichedMeals.push(enriched)

    for (const part of partRows) {
      const demand = {
        demand_key: part.key,
        slot_key: meal.slot_key,
        household_member_id: meal.household_member_id || null,
        person_name: meal.person_name,
        meal_date: meal.meal_date,
        meal_type: meal.meal_type,
        recipe_code: recipeCode,
        requested_servings: part.servings,
        source_type: part.identity?.mode || 'support',
        source_id: part.identity?.sourceId || meal.slot_key,
        execution_key: part.identity?.key || null,
        nutritional_target: meal.target_snapshot || {},
        constraints_snapshot: constraints,
        nutrition: {
          ...part.nutrition,
          micros: scaleMicronutrients(meal.micronutrients, part.servings / totalServings),
        },
        support_items: recipeCode ? [] : (meal.portion_details?.items || []),
        status: slotStates[meal.slot_key]?.consumed ? 'consumed' : 'planned',
      }
      demands.push(demand)
      if (!part.identity) continue
      const recipe = recipeByCode.get(recipeCode)
      if (!recipe) throw new Error(`final_demand_recipe_missing:${recipeCode}`)
      const group = groups.get(part.identity.key) || {
        executionKey: part.identity.key,
        recipe,
        mode: part.identity.mode,
        sourceSlotKey: part.identity.sourceSlotKey,
        neededOn: part.identity.neededOn,
        servings: 0,
        demandKeys: [],
        allocations: [],
        shortages: [],
        memberNames: [],
        isVariant: recipeCode !== slot.recipeCode,
      }
      group.servings += part.servings
      group.demandKeys.push(part.key)
      group.memberNames.push(meal.person_name)
      groups.set(part.identity.key, group)
    }
  }

  // La part explicitement destinée à la semaine suivante est une demande
  // réelle du batch, même sans créneau de consommation dans cette version.
  for (const slot of plan.slots.filter((item) => item.production?.freezer?.nextWeekPortions > 0)) {
    const executionKey = `production:${slot.production.productionKey}:${slot.recipeCode}`
    const recipe = recipeByCode.get(slot.recipeCode)
    if (!recipe) throw new Error(`final_demand_recipe_missing:${slot.recipeCode}`)
    const group = groups.get(executionKey) || {
      executionKey,
      recipe,
      mode: 'planned_production',
      sourceSlotKey: slot.key,
      neededOn: slot.date,
      servings: 0,
      demandKeys: [],
      allocations: [],
      shortages: [],
      memberNames: [],
      isVariant: false,
    }
    const servings = Number(slot.production.freezer.nextWeekPortions) || 0
    const key = `future:${slot.production.productionKey}`
    group.servings += servings
    group.demandKeys.push(key)
    demands.push({
      demand_key: key, slot_key: slot.key, household_member_id: null, person_name: null,
      meal_date: slot.date, meal_type: slot.mealType, recipe_code: slot.recipeCode,
      requested_servings: servings, source_type: 'future_buffer', source_id: slot.production.freezer.productionKey,
      execution_key: executionKey, nutritional_target: {}, constraints_snapshot: constraints,
      nutrition: scaleNutrition(group.recipe.nutritionPerServing, servings), support_items: [], status: 'planned',
    })
    groups.set(executionKey, group)
  }

  const events = []
  for (const group of groups.values()) {
    if (group.mode === 'existing_dish' || slotStates[group.sourceSlotKey]?.consumed) continue
    const scale = group.servings / Math.max(Number(group.recipe.servings) || 1, 1)
    const requirementsByForm = new Map()
    for (const ingredient of group.recipe.exactIngredients || []) {
      if (ingredient.optional) continue
      const packageDecision = usualPackageForIngredient(ingredient, inventoryPackageByForm)
      const current = requirementsByForm.get(ingredient.formNormalized) || {
        formNormalized: ingredient.formNormalized,
        productName: ingredient.name,
        category: categoryLabels[ingredient.category] || 'Épicerie',
        grams: 0,
        ...packageDecision,
        pantryStaple: PANTRY_STAPLE_PATTERN.test(String(ingredient.formNormalized || ingredient.name || '').toLowerCase()),
      }
      current.grams += (Number(ingredient.grams) || 0) * scale
      requirementsByForm.set(ingredient.formNormalized, current)
    }
    events.push({
      key: group.executionKey, kind: 'recipe', neededOn: group.neededOn, mealType: slotByKey.get(group.sourceSlotKey)?.mealType || 'dejeuner',
      sourceSlotKey: group.sourceSlotKey, executionKey: group.executionKey, demandKeys: group.demandKeys,
      requirements: [...requirementsByForm.values()].map((item) => ({
        ...item, grams: round(item.grams), acceptedForms: [item.formNormalized], neededOn: group.neededOn,
        sourceType: 'recipe', purchaseUnit: 'g', displayUnit: 'g', gramsPerUnit: 1,
        packageSource: item.source || null,
      })),
    })
  }

  const supportBySlot = new Map()
  for (const meal of enrichedMeals.filter((item) => !item.canonical_recipe_code)) {
    // Seuls les petits-déjeuners et collations sont des prises « support ».
    // Un repas principal sans code recette dupliquerait le slot_key de son
    // créneau en créneau support (payload > 31 slots, rejet invalid_plan_payload
    // du 24/07) : on échoue avec un diagnostic clair plutôt que de publier un
    // plan faux ou de laisser le garde-fou SQL rejeter sans explication.
    if (!['pdj', 'collation'].includes(meal.meal_type)) {
      throw new Error(`final_demand_main_meal_without_recipe:${meal.slot_key}:${meal.person_name}`)
    }
    if (!supportBySlot.has(meal.slot_key)) supportBySlot.set(meal.slot_key, [])
    supportBySlot.get(meal.slot_key).push(meal)
  }
  const supplementByLabel = new Map(SUPPLEMENT_FORMS.map((form) => [form.label, form]))
  for (const [slotKey, meals] of supportBySlot) {
    if (slotStates[slotKey]?.consumed) continue
    const requirementsByLabel = new Map()
    for (const meal of meals) {
      for (const item of meal.portion_details?.items || []) {
        const label = item.displayLabel || item.food
        const current = requirementsByLabel.get(label) || { label, quantity: 0 }
        current.quantity += Number(item.quantity) || 0
        requirementsByLabel.set(label, current)
      }
    }
    const first = meals[0]
    events.push({
      key: `support:${slotKey}`, kind: 'support', neededOn: first.meal_date, mealType: first.meal_type,
      sourceSlotKey: slotKey, executionKey: null, demandKeys: meals.map((meal) => meal.demand_key),
      requirements: [...requirementsByLabel.values()].sort((a, b) => a.label.localeCompare(b.label)).map(({ label, quantity }) => {
        const form = supplementByLabel.get(label)
        if (!form?.gramsPerUnit) throw new Error(`final_demand_support_form_missing:${label}`)
        return {
          formNormalized: form.formNormalized,
          shoppingKey: form.formNormalized,
          productName: label.charAt(0).toUpperCase() + label.slice(1),
          category: supplementCategory(label),
          grams: round(quantity * form.gramsPerUnit),
          acceptedForms: [form.formNormalized, ...(form.aliases || [])],
          neededOn: first.meal_date,
          sourceType: 'support',
          purchaseUnit: ['œuf', 'pièce'].includes(form.unit) ? 'u' : form.unit,
          displayUnit: form.unit === 'œuf' ? 'œufs' : form.unit === 'pièce' ? 'pièces' : form.unit,
          gramsPerUnit: form.gramsPerUnit,
          packageSize: form.packageSize,
          packageUnit: form.packageUnit,
          packageLabel: form.packageLabel,
        }
      }),
    })
  }

  // Les accompagnements font partie de l'assiette personnalisée mais restent
  // des aliments simples : ils sont réservés et achetés sur le même créneau que
  // la recette principale, sans fabriquer une seconde recette ou un faux slot.
  const plateComponentByForm = new Map()
  for (const form of PLATE_COMPONENT_FORMS) {
    plateComponentByForm.set(form.formNormalized, form)
    for (const alias of form.aliases || []) plateComponentByForm.set(alias, form)
  }
  const companionsBySlot = new Map()
  for (const meal of enrichedMeals.filter((item) => item.canonical_recipe_code)) {
    const companions = meal.portion_details?.companions || []
    if (!companions.length || slotStates[meal.slot_key]?.consumed) continue
    const aggregate = companionsBySlot.get(meal.slot_key) || { meals: [], byForm: new Map() }
    aggregate.meals.push(meal)
    for (const companion of companions) {
      const formNormalized = companion.form_normalized
      const current = aggregate.byForm.get(formNormalized) || { ...companion, quantity_g: 0 }
      current.quantity_g += Number(companion.quantity_g) || 0
      aggregate.byForm.set(formNormalized, current)
    }
    companionsBySlot.set(meal.slot_key, aggregate)
  }
  for (const [slotKey, aggregate] of companionsBySlot) {
    const first = aggregate.meals[0]
    events.push({
      key: `companion:${slotKey}`,
      kind: 'companion',
      neededOn: first.meal_date,
      mealType: first.meal_type,
      sourceSlotKey: slotKey,
      executionKey: null,
      demandKeys: aggregate.meals.map((meal) => meal.demand_key),
      requirements: [...aggregate.byForm.values()].map((companion) => {
        const form = plateComponentByForm.get(companion.form_normalized)
        if (!form) throw new Error(`final_demand_companion_form_missing:${companion.form_normalized}`)
        const packageDecision = usualPackageForIngredient({
          formNormalized: form.formNormalized,
          name: form.label,
          category: form.category,
        }, inventoryPackageByForm)
        return {
          formNormalized: form.formNormalized,
          shoppingKey: form.formNormalized,
          productName: form.label,
          category: form.aisle || categoryLabels[form.category] || 'Épicerie',
          grams: round(companion.quantity_g),
          acceptedForms: [form.formNormalized, ...(form.aliases || [])],
          neededOn: first.meal_date,
          sourceType: 'companion',
          purchaseUnit: 'g',
          displayUnit: 'g',
          gramsPerUnit: 1,
          packageSize: packageDecision.packageSize || null,
          packageUnit: packageDecision.packageUnit || null,
          packageLabel: packageDecision.packageLabel || null,
          packageLabelIsComplete: Boolean(packageDecision.packageLabelIsComplete),
          packageSource: packageDecision.source || null,
          pantryStaple: PANTRY_STAPLE_PATTERN.test(form.formNormalized),
        }
      }),
    })
  }

  events.sort((left, right) => left.neededOn.localeCompare(right.neededOn)
    || (MEAL_ORDER[left.mealType] ?? 9) - (MEAL_ORDER[right.mealType] ?? 9)
    || left.key.localeCompare(right.key))

  const availability = buildAvailability(inventoryLots, existingReservations)
  const resourcesBySlot = new Map()
  const reservations = []
  const requirementAggregate = new Map()

  for (const event of events) {
    const resource = resourcesBySlot.get(event.sourceSlotKey) || { allocations: [], shortages: [], requiredGrams: 0, reservedGrams: 0 }
    for (const requirement of event.requirements) {
      const lots = collectLots(availability, requirement.acceptedForms)
      const result = allocateFromLots(lots, requirement.grams, requirement.neededOn)
      resource.requiredGrams += requirement.grams
      resource.reservedGrams += result.allocatedGrams
      for (const allocation of result.allocations) {
        const row = {
          lot_id: allocation.lotId,
          ingredient_name: requirement.productName,
          grams: round(allocation.grams),
          form_normalized: requirement.formNormalized,
          execution_key: event.executionKey,
          demand_keys: event.demandKeys,
        }
        resource.allocations.push(row)
        reservations.push({
          slot_key: event.sourceSlotKey,
          lot_id: allocation.lotId,
          ingredient_name: requirement.productName,
          reserved_quantity: round(allocation.grams),
          reserved_unit: 'g',
          needed_quantity: round(requirement.grams),
          needed_unit: 'g',
          metadata: {
            form_normalized: requirement.formNormalized,
            allocation_strategy: 'opened_first_then_fefo_before_use',
            support: event.kind === 'support',
            companion: event.kind === 'companion',
            execution_key: event.executionKey,
            demand_keys: event.demandKeys,
            needed_on: requirement.neededOn,
            expires_on: allocation.expiresOn || null,
          },
        })
        if (event.executionKey) groups.get(event.executionKey).allocations.push(row)
      }
      if (result.shortageGrams > 0.001) {
        const shortage = {
          form_normalized: requirement.formNormalized,
          ingredient_name: requirement.productName,
          grams: round(result.shortageGrams),
          execution_key: event.executionKey,
          demand_keys: event.demandKeys,
        }
        resource.shortages.push(shortage)
        if (event.executionKey) groups.get(event.executionKey).shortages.push(shortage)
      }
      addRequirement(requirementAggregate, requirement, result.allocatedGrams, result.shortageGrams)
    }
    resource.coverage = resource.requiredGrams > 0 ? round(resource.reservedGrams / resource.requiredGrams, 4) : 1
    resourcesBySlot.set(event.sourceSlotKey, resource)
  }

  for (const [slotKey, source] of sourceBySlot) {
    if (!['cooked_dish', 'mixed'].includes(source.type) || source.consumed) continue
    const slot = slotByKey.get(slotKey)
    reservations.push({
      slot_key: slotKey,
      cooked_dish_id: source.id,
      ingredient_name: slot.cookedDishName || recipeByCode.get(slot.recipeCode)?.family || 'Plat cuisiné',
      reserved_quantity: source.portions,
      reserved_unit: 'portion',
      needed_quantity: source.portions,
      needed_unit: 'portion',
      metadata: {
        allocation_strategy: 'cooked_dish_fefo',
        needed_on: slot.date,
        expires_on: cookedDishById.get(String(source.id))?.expiresOn || null,
      },
    })
  }

  const shoppingItems = [...requirementAggregate.values()]
    .map(shoppingItemFromRequirement)
    .filter(Boolean)
    .sort((left, right) => left.aisle_order - right.aisle_order || left.product_name.localeCompare(right.product_name))

  for (const requirement of requirementAggregate.values()) {
    if (Math.abs(requirement.requiredGrams - requirement.reservedGrams - requirement.shortageGrams) > 0.01) {
      throw new Error(`final_demand_resource_balance_mismatch:${requirement.key}`)
    }
  }

  const mainSlotSummaries = new Map()
  for (const slot of plan.slots) {
    const meals = enrichedMeals.filter((meal) => meal.slot_key === slot.key && meal.canonical_recipe_code)
    const nutritionByMember = Object.fromEntries(meals.map((meal) => [meal.person_name, nutritionOfMeal(meal)]))
    const base = meals.find((meal) => meal.canonical_recipe_code === slot.recipeCode)
    const sourceExecutions = [...groups.values()].filter((group) => (
      group.sourceSlotKey === slot.key && group.recipe.code === slot.recipeCode
    ))
    const sourceExecution = sourceExecutions.find((group) => group.mode !== 'existing_dish') || sourceExecutions[0]
    const primaryMeal = base || meals[0]
    mainSlotSummaries.set(slot.key, {
      slotKey: slot.key,
      meals,
      servings: round(meals.reduce((sum, meal) => sum + (Number(meal.planned_servings) || 0), 0), 3),
      baseServings: round(meals.filter((meal) => meal.canonical_recipe_code === slot.recipeCode).reduce((sum, meal) => sum + (Number(meal.planned_servings) || 0), 0), 3),
      nutritionByMember,
      nutritionTotal: sumNutrition(meals),
      executionKey: sourceExecution?.executionKey || primaryMeal?.execution_key || null,
      source: sourceBySlot.get(slot.key) || { type: 'fresh_recipe' },
      primaryRecipeCode: sourceExecution?.recipe.code || primaryMeal?.canonical_recipe_code || slot.recipeCode,
      memberVariants: meals.filter((meal) => meal.canonical_recipe_code !== slot.recipeCode).map((meal) => ({
        person_name: meal.person_name,
        recipe_code: meal.canonical_recipe_code,
        execution_key: meal.execution_key,
        href: `/recipes/canonical/${meal.canonical_recipe_code}`,
        reason: meal.variant_kind,
      })),
    })
  }

  const supportSlots = [...supportBySlot.entries()].map(([slotKey, meals]) => {
    const meal = meals[0]
    const resource = resourcesBySlot.get(slotKey) || { allocations: [], shortages: [], coverage: 1 }
    return {
      slot_key: slotKey,
      meal_date: meal.meal_date,
      meal_type: meal.meal_type,
      title: meal.meal_type === 'pdj' ? 'Petit-déjeuner' : 'Collation',
      servings: round(meals.reduce((sum, item) => sum + (Number(item.planned_servings) || 1), 0), 2),
      status: slotStates[slotKey]?.status || 'planned', locked: Boolean(slotStates[slotKey]?.locked), source: 'support',
      nutrition_by_member: Object.fromEntries(meals.map((item) => [item.person_name, nutritionOfMeal(item)])),
      nutrition_total: sumNutrition(meals),
      nutrition_source: 'deterministic_supplement_forms', nutrition_confidence: 1,
      preparation: {
        mode: 'support',
        exact_steps: [{ n: 1, instruction: `Assembler : ${[...new Set(meals.map((item) => item.description))].join(' / ')}.` }],
        member_variants: [],
      },
      stock_summary: { coverage: resource.coverage, allocations: resource.allocations, shortages: resource.shortages, explanations: [], support: true },
    }
  }).sort((left, right) => left.meal_date.localeCompare(right.meal_date) || (MEAL_ORDER[left.meal_type] ?? 9) - (MEAL_ORDER[right.meal_type] ?? 9))

  const supportTasks = supportSlots.flatMap((slot) => {
    const meals = supportBySlot.get(slot.slot_key) || []
    const eggCount = meals.flatMap((meal) => meal.portion_details?.items || [])
      .filter((item) => item.food === 'eggs')
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    if (!(eggCount > 0)) return []
    const prepDate = slot.meal_type === 'pdj'
      ? new Date(`${slot.meal_date}T00:00:00Z`).toISOString().slice(0, 10)
      : slot.meal_date
    const actualPrepDate = slot.meal_type === 'pdj'
      ? new Date(new Date(`${slot.meal_date}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10)
      : prepDate
    const dueHour = slot.meal_type === 'pdj' ? '20:00:00' : '09:00:00'
    const due = zonedDateTimeToUtc(actualPrepDate, dueHour, householdTimeZone).toISOString()
    return [{
      task_key: `support-eggs-${slot.slot_key}`, slot_key: slot.slot_key,
      prep_date: actualPrepDate, prep_label: 'Préparation support',
      title: `Cuire ${Math.round(eggCount)} œuf${eggCount > 1 ? 's' : ''} dur${eggCount > 1 ? 's' : ''}`,
      task_type: 'prepare_support', earliest_start_at: zonedDateTimeToUtc(actualPrepDate, '07:00:00', householdTimeZone).toISOString(),
      due_at: due, safety_deadline_at: due, duration_min: 12, priority: 65,
      instructions: [{ n: 1, instruction: `Cuire ${Math.round(eggCount)} œuf${eggCount > 1 ? 's' : ''}, refroidir rapidement puis conserver au réfrigérateur.` }],
    }]
  })

  const recipeExecutions = [...groups.values()].sort((a, b) => a.executionKey.localeCompare(b.executionKey)).map((group) => {
    const scale = group.servings / Math.max(Number(group.recipe.servings) || 1, 1)
    const exactIngredients = (group.recipe.exactIngredients || []).map((ingredient) => ({
      ...ingredient,
      quantity: round((Number(ingredient.quantity) || 0) * scale),
      grams: round((Number(ingredient.grams) || 0) * scale),
    }))
    const execution = {
      execution_key: group.executionKey,
      recipe_code: group.recipe.code,
      servings: round(group.servings, 3),
      selected_configuration: {
        identity_level: group.recipe.identityLevel,
        sensory_profile: group.recipe.sensory?.profile || null,
        source_mode: group.mode,
        allergens: group.recipe.allergens || [],
        diets: group.recipe.diets || [],
        substitutions: [],
      },
      exact_ingredients_snapshot: exactIngredients,
      exact_steps_snapshot: group.recipe.exactSteps,
      nutrition_snapshot: { per_serving: group.recipe.nutritionPerServing, total: scaleNutrition(group.recipe.nutritionPerServing, group.servings), coverage: group.recipe.nutritionCoverage },
      transformation_plan_snapshot: group.recipe.techniques,
      source_lot_plan_snapshot: group.allocations,
      source_slot_key: group.sourceSlotKey,
      demand_keys: group.demandKeys,
      task_key: taskKeyForExecution(group.executionKey),
      is_variant: group.isVariant,
      member_names: [...new Set(group.memberNames)],
      shortages: group.shortages,
    }
    return { ...execution, content_hash: createHash('sha256').update(JSON.stringify(execution)).digest('hex') }
  })

  const model = {
    demands,
    meals: enrichedMeals,
    recipeExecutions,
    reservations,
    shoppingItems,
    resourcesBySlot,
    mainSlotSummaries,
    supportSlots,
    supportTasks,
    sourceBySlot,
    issues,
  }
  validateFinalModel(model, inventoryLots, cookedDishes, existingDishReservations)
  return model
}
