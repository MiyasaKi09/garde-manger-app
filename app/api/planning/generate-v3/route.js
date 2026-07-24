import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { fetchDietaryConstraints } from '@/lib/aiContextBuilder'
import { listOperationalRecipes } from '@/lib/db/operationalRecipeCatalog'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { toGramsV2 } from '@/lib/domain/units'
import { generateClosedLoopPlan, isMealSuitableRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { selectPlanningRecipePool } from '@/lib/domain/planning/recipeCandidatePolicy'
import { buildCanonicalPlanPayload, buildWeekSlots, nextMondayIso } from '@/lib/domain/planning/canonicalPlanPayload'
import { isDishExpired, todayUtcIso } from '@/lib/domain/planning/cookedDishDisplay'
import { SUPPLEMENT_FORMS } from '@/lib/domain/planning/personalizedMeals'
import { resolveHouseholdTimeZone, zonedDateTimeToUtc } from '@/lib/domain/planning/planningTime'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const average = (values) => {
  const numbers = values.map(Number).filter((value) => Number.isFinite(value) && value > 0)
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null
}

const addDays = (iso, count) => {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

function nutritionTargets(goals, members = []) {
  const byName = new Map((goals || []).map((goal) => [fold(goal.person_name), goal]))
  const metrics = {
    kcal: 'target_calories',
    proteinG: 'target_protein_g',
    carbsG: 'target_carbs_g',
    fatG: 'target_fat_g',
    fiberG: 'target_fiber_g',
  }

  // La part disponible pour les plats principaux dépend des prises réellement
  // activées pour chaque membre. Zoé sans petit-déjeuner ne doit pas recevoir
  // la même cible déjeuner/dîner que Julien avec quatre prises quotidiennes.
  const perMemberShare = (member) => {
    const planning = member?.preferences?.planning || {}
    const supportShare = (planning.breakfast ? 0.20 : 0) + (planning.snack ? 0.15 : 0)
    return Math.max(0.25, (1 - supportShare) / 2)
  }

  const mealTarget = Object.fromEntries(Object.entries(metrics).flatMap(([key, field]) => {
    const values = (members || []).flatMap((member) => {
      const goal = byName.get(fold(member.name))
      const value = Number(goal?.[field])
      return Number.isFinite(value) && value > 0 ? [value * perMemberShare(member)] : []
    })
    const fallback = average((goals || []).map((goal) => goal[field]))
    const value = values.length ? average(values) : (fallback ? fallback * 0.35 : null)
    return Number.isFinite(value) ? [[key, value]] : []
  }))

  return { dejeuner: mealTarget, diner: mealTarget }
}

function resolveIntent(body) {
  const allowed = new Set(['balanced', 'quick', 'light', 'vegetarian', 'stock'])
  if (allowed.has(body.intent) && body.intent !== 'balanced') return body.intent
  const text = fold(body.instructions)
  if (/vegetar|sans viande/.test(text)) return 'vegetarian'
  if (/rapide|express|moins de/.test(text)) return 'quick'
  if (/leger|digeste|moins riche/.test(text)) return 'light'
  if (/stock|gaspillage|perime|urgent/.test(text)) return 'stock'
  return allowed.has(body.intent) ? body.intent : 'balanced'
}

function isTargeted(slot, scope, days, meals) {
  if (scope === 'week') return true
  if (scope === 'days') return days.has(slot.date)
  return meals.has(`${slot.date}|${slot.mealType}`)
}

async function ensurePlanningSchema(supabase) {
  const { data, error } = await supabase.rpc('planning_schema_compatibility')
  if (error || data?.compatible !== true || Number(data?.contract_version) < 5) {
    const upgrade = new Error('Le schéma Planning doit être mis à niveau avant toute génération')
    upgrade.code = 'schema_upgrade_required'
    upgrade.status = 503
    upgrade.details = data || { database_error: error?.message || null }
    throw upgrade
  }
}

function slotProtectionState(slot, meals, tasks, now = new Date(), timeZone = 'Europe/Paris') {
  const slotMeals = meals.filter((meal) => meal.meal_plan_slot_id === slot.id)
  const slotTasks = tasks.filter((task) => task.meal_plan_slot_id === slot.id)
  const localServiceTime = {
    pdj: '08:00:00',
    dejeuner: '12:30:00',
    collation: '16:30:00',
    diner: '19:30:00',
  }[slot.meal_type] || '12:30:00'
  const serviceAt = zonedDateTimeToUtc(slot.meal_date, localServiceTime, timeZone)
  const within48Hours = serviceAt.getTime() <= now.getTime() + 48 * 60 * 60 * 1000
  const consumed = ['consumed', 'completed', 'cooked', 'skipped'].includes(slot.status)
    || slotTasks.some((task) => task.done === true || task.workflow_status === 'done')
  const locked = Boolean(slot.locked) || slotMeals.some((meal) => meal.locked)
  return {
    status: slot.status || 'planned',
    locked,
    consumed,
    protected: consumed || locked || within48Hours,
    protection_reason: consumed ? 'consumed' : locked ? 'locked' : within48Hours ? 'within_48_hours' : null,
  }
}

async function loadExistingImport(supabase, userId, importId) {
  if (!importId) return { planImport: null, slots: [], meals: [], tasks: [], slotStates: {}, activePlanVersionId: null }
  const { data: planImport, error } = await supabase
    .from('nutrition_plan_imports')
    .select('id, user_id, date_range_start, date_range_end, active_plan_version_id')
    .eq('id', importId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !planImport) throw new Error('Planning introuvable ou non autorisé')
  if (!planImport.active_plan_version_id) return { planImport, slots: [], meals: [], tasks: [], slotStates: {}, activePlanVersionId: null }
  const [slotResult, mealResult, taskResult] = await Promise.all([
    supabase.from('meal_plan_slots')
      .select('id, slot_key, meal_date, meal_type, title, preparation, status, locked, source')
      .eq('plan_version_id', planImport.active_plan_version_id)
      .eq('user_id', userId),
    supabase.from('nutrition_plan_meals')
      .select('person_name, household_member_id, meal_date, meal_type, day_type, short_label, description, kcal, protein_g, carbs_g, fat_g, fiber_g, micronutrients, meal_plan_slot_id, planned_servings, locked, canonical_recipe_code, variant_kind, portion_details, target_snapshot, constraints_snapshot, planning_status, demand_key, execution_key')
      .eq('import_id', planImport.id),
    supabase.from('nutrition_plan_prep_tasks')
      .select('meal_plan_slot_id, done, workflow_status')
      .eq('plan_version_id', planImport.active_plan_version_id),
  ])
  const { data: slots, error: slotError } = slotResult
  if (slotError) throw new Error(`Lecture du planning impossible: ${slotError.message}`)
  if (mealResult.error) throw new Error(`Lecture des repas impossible: ${mealResult.error.message}`)
  if (taskResult.error) throw new Error(`Lecture des tâches impossible: ${taskResult.error.message}`)
  const meals = mealResult.data || []
  const tasks = taskResult.data || []
  const slotStates = Object.fromEntries((slots || []).map((slot) => [slot.slot_key, slotProtectionState(slot, meals, tasks)]))
  return { planImport, slots: slots || [], meals, tasks, slotStates, activePlanVersionId: planImport.active_plan_version_id }
}

async function loadRecentRecipeUsage(supabase, windowStart) {
  const previousWeekStart = addDays(windowStart, -7)
  const { data, error } = await supabase
    .from('nutrition_plan_meals')
    .select('canonical_recipe_code, meal_date, description, short_label')
    .gte('meal_date', addDays(windowStart, -35))
    .lt('meal_date', windowStart)
    .in('meal_type', ['dejeuner', 'diner'])
  if (error) throw new Error(`Historique des recettes indisponible: ${error.message}`)

  const previousWeekRecipeCodes = new Set()
  const recentRecipeUsage = {}
  const recentRecipeTitles = new Set()
  for (const row of data || []) {
    const code = String(row.canonical_recipe_code || '').trim()
    if (code) {
      recentRecipeUsage[code] = (recentRecipeUsage[code] || 0) + 1
      if (row.meal_date >= previousWeekStart) previousWeekRecipeCodes.add(code)
    }
    for (const title of [fold(row.short_label), fold(row.description)]) {
      if (title) recentRecipeTitles.add(title)
    }
  }
  return {
    previousWeekRecipeCodes: [...previousWeekRecipeCodes].sort(),
    recentRecipeUsage,
    recentRecipeTitles: [...recentRecipeTitles],
  }
}

async function loadPlannerInventory(supabase, recipes, excludedPlanVersionId = null) {
  const [{ data: lots, error: lotError }, { data: reservations }] = await Promise.all([
    supabase.from('inventory_lots')
      .select('id, canonical_food_id, archetype_id, qty_remaining, unit, expiration_date, adjusted_expiration_date, is_opened, requires_storage_review, container_size, container_unit, packaging_type')
      .gt('qty_remaining', 0),
    supabase.from('inventory_reservations')
      .select('lot_id, plan_version_id, reserved_quantity, reserved_unit, status')
      .eq('status', 'active'),
  ])
  if (lotError) throw new Error(`Stock indisponible: ${lotError.message}`)

  const canonicalIds = [...new Set((lots || []).map((lot) => lot.canonical_food_id).filter(Boolean))]
  const archetypeIds = [...new Set((lots || []).map((lot) => lot.archetype_id).filter(Boolean))]
  const [canonicalResult, archetypeResult] = await Promise.all([
    canonicalIds.length
      ? supabase.from('canonical_foods').select('id, canonical_name, density_g_per_ml, unit_weight_grams').in('id', canonicalIds)
      : Promise.resolve({ data: [] }),
    archetypeIds.length
      ? supabase.from('archetypes').select('id, name').in('id', archetypeIds)
      : Promise.resolve({ data: [] }),
  ])
  const canonicalById = new Map((canonicalResult.data || []).map((row) => [row.id, row]))
  const archetypeById = new Map((archetypeResult.data || []).map((row) => [row.id, row]))
  // Les formes des petits-déjeuners/collations rejoignent les formes exactes
  // des recettes : leurs lots (skyr, œufs, fruits…) entrent ainsi dans la
  // boucle d'allocation au lieu d'être rachetés systématiquement. Les aliases
  // couvrent le vocabulaire réel des lots ('œuf', 'Thon en conserve'…) qui ne
  // porte pas les libellés d'affichage des suppléments.
  const exactForms = new Set([
    ...recipes.flatMap((recipe) => recipe.exactIngredients.map((ingredient) => ingredient.formNormalized)),
    ...SUPPLEMENT_FORMS.flatMap((form) => [form.formNormalized, ...(form.aliases || [])]),
  ])
  const today = new Date().toISOString().slice(0, 10)
  const plannerLots = []
  const lotMeta = new Map()

  for (const lot of lots || []) {
    const expiry = lot.adjusted_expiration_date || lot.expiration_date
    if (expiry && String(expiry).slice(0, 10) < today) continue
    if (lot.requires_storage_review) continue
    const canonical = canonicalById.get(lot.canonical_food_id)
    const archetype = archetypeById.get(lot.archetype_id)
    const candidates = [canonical?.canonical_name, archetype?.name].filter(Boolean).map(normalizeFoodForm)
    const formNormalized = candidates.find((candidate) => exactForms.has(candidate))
    if (!formNormalized) continue
    const conversion = toGramsV2(lot.qty_remaining, lot.unit, canonical || {})
    if (!conversion.ok || conversion.grams <= 0) continue
    const packageConversion = Number(lot.container_size) > 0 && lot.container_unit
      ? toGramsV2(lot.container_size, lot.container_unit, canonical || {})
      : null
    lotMeta.set(lot.id, canonical || {})
    plannerLots.push({
      id: lot.id,
      formNormalized,
      gramsAvailable: conversion.grams,
      expiresOn: expiry ? String(expiry).slice(0, 10) : null,
      opened: Boolean(lot.is_opened),
      packageSizeGrams: packageConversion?.ok ? packageConversion.grams : null,
      packageLabel: lot.packaging_type || null,
      packagingType: lot.packaging_type || null,
    })
  }

  const existingReservations = []
  for (const reservation of reservations || []) {
    if (excludedPlanVersionId && reservation.plan_version_id === excludedPlanVersionId) continue
    if (!plannerLots.some((lot) => lot.id === reservation.lot_id)) continue
    const conversion = toGramsV2(reservation.reserved_quantity, reservation.reserved_unit, lotMeta.get(reservation.lot_id) || {})
    if (conversion.ok) existingReservations.push({ lotId: reservation.lot_id, grams: conversion.grams, status: 'active' })
  }
  return { plannerLots, existingReservations }
}

// Nutrition mémorisée du plat, PAR portion. Utilisée seulement si les quatre
// macros principales sont toutes présentes (les restes créés par
// /api/meals/cook les remplissent, les plats saisis à la main non) ; sinon le
// solveur retombe sur la nutrition de la recette appariée.
function dishStoredNutrition(dish) {
  const values = {
    kcal: Number(dish.kcal_per_portion),
    proteinG: Number(dish.protein_g_per_portion),
    carbsG: Number(dish.carbs_g_per_portion),
    fatG: Number(dish.fat_g_per_portion),
  }
  if (!Object.values(values).every(Number.isFinite)) return null
  const fiber = Number(dish.fiber_g_per_portion)
  return { ...values, fiberG: Number.isFinite(fiber) ? fiber : 0 }
}

/**
 * Plats cuisinés visibles du solveur (audit P1-1) : portions restantes > 0 et
 * non expirés (comparaison UTC, DLC absente = valide), accompagnés des
 * réservations de portions actives des AUTRES versions de plan — celles de la
 * version remplacée (excludedPlanVersionId) ne comptent pas, exactement comme
 * pour les lots. Le net par plat est calculé par buildDishAvailability côté
 * solveur ; rien n'est décrémenté ici.
 */
async function loadPlannerCookedDishes(supabase, excludedPlanVersionId = null) {
  const { data: dishes, error: dishError } = await supabase
    .from('cooked_dishes')
    .select('id, name, portions_remaining, expiration_date, kcal_per_portion, protein_g_per_portion, carbs_g_per_portion, fat_g_per_portion, fiber_g_per_portion, canonical_recipe_code, canonical_recipe_execution_id, planned_production_id, source_plan_version_id')
    .gt('portions_remaining', 0)
  if (dishError) throw new Error(`Plats cuisinés indisponibles: ${dishError.message}`)
  const today = todayUtcIso()
  const cookedDishes = (dishes || [])
    .filter((dish) => !isDishExpired(dish.expiration_date, today))
    .map((dish) => ({
      id: dish.id,
      name: dish.name,
      portionsRemaining: Number(dish.portions_remaining) || 0,
      expiresOn: dish.expiration_date ? String(dish.expiration_date).slice(0, 10) : null,
      nutritionPerPortion: dishStoredNutrition(dish),
      recipeCode: dish.canonical_recipe_code || null,
      recipeExecutionId: dish.canonical_recipe_execution_id || null,
      plannedProductionId: dish.planned_production_id || null,
      sourcePlanVersionId: dish.source_plan_version_id || null,
    }))
  if (!cookedDishes.length) return { cookedDishes: [], existingDishReservations: [] }

  const { data: reservations, error: reservationError } = await supabase
    .from('inventory_reservations')
    .select('cooked_dish_id, plan_version_id, reserved_quantity, status')
    .eq('status', 'active')
  if (reservationError) {
    // 42703 : colonne cooked_dish_id pas encore migrée (déploiement croisé
    // avec la migration du lot P1) — aucune réservation de plat n'a donc pu
    // être écrite, on continue sans.
    if (reservationError.code === '42703') return { cookedDishes, existingDishReservations: [] }
    throw new Error(`Réservations de plats indisponibles: ${reservationError.message}`)
  }
  const existingDishReservations = (reservations || [])
    .filter((reservation) => reservation.cooked_dish_id != null)
    .filter((reservation) => !excludedPlanVersionId || reservation.plan_version_id !== excludedPlanVersionId)
    .map((reservation) => ({
      cookedDishId: reservation.cooked_dish_id,
      portions: Number(reservation.reserved_quantity) || 0,
      status: 'active',
    }))
  return { cookedDishes, existingDishReservations }
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    await ensurePlanningSchema(supabase)
    const body = await request.json().catch(() => ({}))
    const importId = Number(body.import_id ?? body.importId) || null
    const existing = await loadExistingImport(supabase, user.id, importId)
    let householdTimeZone = resolveHouseholdTimeZone(user)
    let windowStart = existing.planImport?.date_range_start
      || (ISO_DATE.test(body.window_start || '') ? body.window_start : nextMondayIso(new Date(), householdTimeZone))
    const scope = ['week', 'days', 'meals'].includes(body.scope) ? body.scope : 'week'
    const selectedDays = new Set((body.days || []).filter((value) => ISO_DATE.test(value)))
    const selectedMeals = new Set((body.meals || [])
      .filter((meal) => ISO_DATE.test(meal?.date) && ['dejeuner', 'diner'].includes(meal?.type))
      .map((meal) => `${meal.date}|${meal.type}`))
    if (scope === 'days' && !selectedDays.size) return NextResponse.json({ error: 'Sélectionne au moins un jour' }, { status: 400 })
    if (scope === 'meals' && !selectedMeals.size) return NextResponse.json({ error: 'Sélectionne au moins un repas' }, { status: 400 })

    const [membersResult, goalsResult, dietary] = await Promise.all([
      supabase.from('household_members').select('id, name, portion_multiplier, preferences').eq('user_id', user.id).eq('active', true).order('created_at'),
      supabase.from('user_health_goals').select('person_name, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g').eq('user_id', user.id),
      fetchDietaryConstraints(supabase, user.id),
    ])
    let members = membersResult.data || []
    if (!members.length) {
      const { data: defaultMember, error: memberError } = await supabase.from('household_members')
        .insert({ user_id: user.id, name: 'Foyer', portion_multiplier: 1, active: true })
        .select('id, name, portion_multiplier, preferences').single()
      if (memberError) throw new Error(`Initialisation du foyer impossible: ${memberError.message}`)
      members = [defaultMember]
    }
    householdTimeZone = resolveHouseholdTimeZone(user, members)
    if (!existing.planImport && !ISO_DATE.test(body.window_start || '')) {
      windowStart = nextMondayIso(new Date(), householdTimeZone)
    }
    existing.slotStates = Object.fromEntries(existing.slots.map((slot) => [
      slot.slot_key,
      slotProtectionState(slot, existing.meals, existing.tasks, new Date(), householdTimeZone),
    ]))
    const recentRecipes = await loadRecentRecipeUsage(supabase, windowStart)
    const goalNames = new Set((goalsResult.data || []).map((goal) => fold(goal.person_name)).filter(Boolean))
    const missingGoals = members.filter((member) => !goalNames.has(fold(member.name))).map((member) => member.name)
    if (missingGoals.length) {
      const error = new Error(`Objectifs nutritionnels manquants pour : ${missingGoals.join(', ')}`)
      error.code = 'nutrition_goals_required'
      error.status = 422
      throw error
    }
    const servings = Math.max(1, members.reduce((sum, member) => sum + (Number(member.portion_multiplier) || 1), 0))
    const operationalCatalog = await listOperationalRecipes(supabase, { servings })
    const allRecipes = operationalCatalog.recipes.filter(isMealSuitableRecipe)
    if (!allRecipes.length) throw new Error('Aucune recette complète n’est disponible pour le planning')

    const recipeCodes = new Set(allRecipes.map((recipe) => recipe.code))
    const existingBySlot = new Map(existing.slots.map((slot) => [
      `${slot.meal_date}|${slot.meal_type}`,
      { recipeCode: slot.preparation?.recipe_code || null, slotKey: slot.slot_key, state: existing.slotStates[slot.slot_key] || {} },
    ]))
    const intent = resolveIntent(body)
    const slots = buildWeekSlots(windowStart).map((slot) => {
      const current = existingBySlot.get(`${slot.date}|${slot.mealType}`)
      const currentCode = current?.recipeCode || null
      if (current?.state?.protected && (!currentCode || !recipeCodes.has(currentCode))) {
        const error = new Error(`Le repas protégé ${slot.date} ${slot.mealType} n'a plus de recette canonique disponible`)
        error.code = 'protected_meal_requires_review'
        error.status = 409
        throw error
      }
      const requested = !currentCode || !recipeCodes.has(currentCode) || isTargeted(slot, scope, selectedDays, selectedMeals)
      const target = requested && !current?.state?.protected
      return {
        ...slot,
        ...(target ? { intent, excludedRecipeCodes: currentCode ? [currentCode] : [] } : { fixedRecipeCode: currentCode }),
      }
    })

    const targetByMeal = nutritionTargets(goalsResult.data || [], members)
    const fixedRecipeCodes = slots.map((slot) => slot.fixedRecipeCode).filter(Boolean)
    const recipes = selectPlanningRecipePool({
      recipes: allRecipes,
      targetByMeal,
      previousWeekRecipeCodes: recentRecipes.previousWeekRecipeCodes,
      fixedRecipeCodes,
      allowPreviousWeek: false,
    })

    const [{ plannerLots, existingReservations }, { cookedDishes, existingDishReservations }] = await Promise.all([
      // Le stock est indexé sur tout le corpus : le repli diversité ne perd
      // aucune forme alimentaire déjà présente dans le garde-manger.
      loadPlannerInventory(supabase, allRecipes, existing.activePlanVersionId),
      loadPlannerCookedDishes(supabase, existing.activePlanVersionId),
    ])
    const forbiddenForms = [...new Set([...dietary.allergies, ...dietary.bans].map(normalizeFoodForm).filter(Boolean))]
    const constraints = {
      allowShopping: true,
      allergens: dietary.allergies.map((value) => String(value).toLowerCase()),
      forbiddenForms,
      dislikedForms: dietary.dislikes.map(normalizeFoodForm).filter(Boolean),
      diets: dietary.diets,
      targetByMeal,
      maxMinutesByMeal: { dejeuner: 120, diner: 240 },
      preferredActiveMinutes: 30,
      recentRecipeTitles: recentRecipes.recentRecipeTitles,
    }
    let plan = generateClosedLoopPlan({ slots, recipes, inventoryLots: plannerLots, existingReservations, cookedDishes, existingDishReservations, constraints, beamWidth: 48 })
    // La semaine précédente est exclue en priorité. Un repli explicite et
    // fortement pénalisé n'est autorisé que si le corpus ne permet réellement
    // aucun plan sûr — jamais une répétition silencieuse.
    if (plan.status !== 'published' && recentRecipes.previousWeekRecipeCodes.length) {
      const fallbackRecipes = selectPlanningRecipePool({
        recipes: allRecipes,
        targetByMeal,
        previousWeekRecipeCodes: recentRecipes.previousWeekRecipeCodes,
        fixedRecipeCodes,
        allowPreviousWeek: true,
      })
      plan = generateClosedLoopPlan({
        slots,
        recipes: fallbackRecipes,
        inventoryLots: plannerLots,
        existingReservations,
        cookedDishes,
        existingDishReservations,
        constraints,
        beamWidth: 48,
      })
      if (plan.status === 'published') {
        plan = {
          ...plan,
          issues: [...(plan.issues || []), { severity: 'warning', code: 'previous_week_recipe_reuse_fallback' }],
        }
      }
    }
    if (plan.status !== 'published') {
      return NextResponse.json({ error: 'Aucun planning sûr ne satisfait les contraintes du foyer', issues: plan.issues }, { status: 422 })
    }

    const payload = buildCanonicalPlanPayload({
      plan, recipes: allRecipes, members, goals: goalsResult.data || [], windowStart, constraints, inventoryLots: plannerLots,
      existingReservations,
      cookedDishes,
      existingDishReservations,
      preservedMeals: existing.meals.flatMap((meal) => {
        const currentSlot = existing.slots.find((slot) => slot.id === meal.meal_plan_slot_id)
        const state = currentSlot ? existing.slotStates[currentSlot.slot_key] : null
        if (!state?.protected) return []
        // Les plans publiés avant la colonne canonical_recipe_code (V5) ont des
        // repas principaux sans code : on réhydrate depuis le créneau, sinon le
        // modèle à demandes finales requalifiait ces repas en « support » et
        // dupliquait les slot_keys principaux (payload à 40 créneaux → rejet
        // invalid_plan_payload du garde-fou, incident prod du 24/07).
        const rehydratedCode = meal.canonical_recipe_code
          || (['dejeuner', 'diner'].includes(meal.meal_type) ? currentSlot?.preparation?.recipe_code || null : null)
        return [{ ...meal, canonical_recipe_code: rehydratedCode, planning_status: state.consumed ? 'consumed' : 'planned' }]
      }),
      slotStates: existing.slotStates,
      corpusVersion: operationalCatalog.metadata.corpusVersion,
      householdTimeZone,
    })
    if (existing.planImport) payload.import_id = existing.planImport.id
    const { data, error } = await supabase.rpc('publish_canonical_final_demand_plan', { p_payload: payload })
    if (error) throw new Error(error.message)

    return NextResponse.json({
      ok: true,
      import_id: data.import_id,
      plan_version_id: data.plan_version_id,
      status: data.status,
      summary: {
        meals: payload.slots.length,
        personalized_meals: payload.legacy_meals.length,
        changed: slots.filter((slot) => !slot.fixedRecipeCode).length,
        recipes: new Set(payload.slots.map((slot) => slot.recipe_code)).size,
        stock_coverage: plan.objectiveScores.stockCoverage,
        shopping_items: payload.shopping_items.length,
        weekly_rule_violations: plan.objectiveScores.weeklyRuleViolations,
      },
    })
  } catch (error) {
    console.error('[Planning V3]', error)
    return NextResponse.json({
      error: error.message || 'Échec de génération du planning',
      code: error.code || 'planning_generation_failed',
      ...(error.details ? { details: error.details } : {}),
    }, { status: Number(error.status) || 500 })
  }
}
