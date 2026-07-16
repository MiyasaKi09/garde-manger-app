import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { fetchDietaryConstraints } from '@/lib/aiContextBuilder'
import { listOperationalRecipes } from '@/lib/db/operationalRecipeCatalog'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { toGramsV2 } from '@/lib/domain/units'
import { generateClosedLoopPlan, isMealSuitableRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { buildCanonicalPlanPayload, buildWeekSlots, nextMondayIso } from '@/lib/domain/planning/canonicalPlanPayload'

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

function nutritionTargets(goals) {
  const daily = {
    kcal: average(goals.map((goal) => goal.target_calories)),
    proteinG: average(goals.map((goal) => goal.target_protein_g)),
    carbsG: average(goals.map((goal) => goal.target_carbs_g)),
    fatG: average(goals.map((goal) => goal.target_fat_g)),
    fiberG: average(goals.map((goal) => goal.target_fiber_g)),
  }
  const mealTarget = (share) => Object.fromEntries(Object.entries(daily)
    .filter(([, value]) => Number.isFinite(value))
    .map(([key, value]) => [key, value * share]))
  return { dejeuner: mealTarget(0.35), diner: mealTarget(0.35) }
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

async function loadExistingImport(supabase, userId, importId) {
  if (!importId) return { planImport: null, slots: [], activePlanVersionId: null }
  const { data: planImport, error } = await supabase
    .from('nutrition_plan_imports')
    .select('id, user_id, date_range_start, date_range_end, active_plan_version_id')
    .eq('id', importId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !planImport) throw new Error('Planning introuvable ou non autorisé')
  if (!planImport.active_plan_version_id) return { planImport, slots: [], activePlanVersionId: null }
  const { data: slots, error: slotError } = await supabase
    .from('meal_plan_slots')
    .select('meal_date, meal_type, title, preparation')
    .eq('plan_version_id', planImport.active_plan_version_id)
    .eq('user_id', userId)
  if (slotError) throw new Error(`Lecture du planning impossible: ${slotError.message}`)
  return { planImport, slots: slots || [], activePlanVersionId: planImport.active_plan_version_id }
}

async function loadRecentRecipeTitles(supabase, windowStart) {
  const { data } = await supabase
    .from('nutrition_plan_meals')
    .select('description, short_label')
    .gte('meal_date', addDays(windowStart, -14))
    .lt('meal_date', windowStart)
    .in('meal_type', ['dejeuner', 'diner'])
  return [...new Set((data || []).flatMap((row) => [fold(row.short_label), fold(row.description)]).filter(Boolean))]
}

async function loadPlannerInventory(supabase, recipes, excludedPlanVersionId = null) {
  const [{ data: lots, error: lotError }, { data: reservations }] = await Promise.all([
    supabase.from('inventory_lots')
      .select('id, canonical_food_id, archetype_id, qty_remaining, unit, expiration_date, adjusted_expiration_date, is_opened, requires_storage_review')
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
  const exactForms = new Set(recipes.flatMap((recipe) => recipe.exactIngredients.map((ingredient) => ingredient.formNormalized)))
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
    lotMeta.set(lot.id, canonical || {})
    plannerLots.push({ id: lot.id, formNormalized, gramsAvailable: conversion.grams, expiresOn: expiry ? String(expiry).slice(0, 10) : null, opened: Boolean(lot.is_opened) })
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

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const importId = Number(body.import_id ?? body.importId) || null
    const existing = await loadExistingImport(supabase, user.id, importId)
    const windowStart = existing.planImport?.date_range_start || (ISO_DATE.test(body.window_start || '') ? body.window_start : nextMondayIso())
    const scope = ['week', 'days', 'meals'].includes(body.scope) ? body.scope : 'week'
    const selectedDays = new Set((body.days || []).filter((value) => ISO_DATE.test(value)))
    const selectedMeals = new Set((body.meals || [])
      .filter((meal) => ISO_DATE.test(meal?.date) && ['dejeuner', 'diner'].includes(meal?.type))
      .map((meal) => `${meal.date}|${meal.type}`))
    if (scope === 'days' && !selectedDays.size) return NextResponse.json({ error: 'Sélectionne au moins un jour' }, { status: 400 })
    if (scope === 'meals' && !selectedMeals.size) return NextResponse.json({ error: 'Sélectionne au moins un repas' }, { status: 400 })

    const [membersResult, goalsResult, dietary, recentRecipeTitles] = await Promise.all([
      supabase.from('household_members').select('id, name, portion_multiplier, preferences').eq('user_id', user.id).eq('active', true).order('created_at'),
      supabase.from('user_health_goals').select('person_name, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g').eq('user_id', user.id),
      fetchDietaryConstraints(supabase, user.id),
      loadRecentRecipeTitles(supabase, windowStart),
    ])
    let members = membersResult.data || []
    if (!members.length) {
      const { data: defaultMember, error: memberError } = await supabase.from('household_members')
        .insert({ user_id: user.id, name: 'Foyer', portion_multiplier: 1, active: true })
        .select('id, name, portion_multiplier, preferences').single()
      if (memberError) throw new Error(`Initialisation du foyer impossible: ${memberError.message}`)
      members = [defaultMember]
    }
    const servings = Math.max(1, members.reduce((sum, member) => sum + (Number(member.portion_multiplier) || 1), 0))
    const operationalCatalog = await listOperationalRecipes(supabase, { servings })
    const recipes = operationalCatalog.recipes.filter(isMealSuitableRecipe)
    if (!recipes.length) throw new Error('Aucune recette complète n’est disponible pour le planning')

    const recipeCodes = new Set(recipes.map((recipe) => recipe.code))
    const existingBySlot = new Map(existing.slots.map((slot) => [
      `${slot.meal_date}|${slot.meal_type}`,
      slot.preparation?.recipe_code || null,
    ]))
    const intent = resolveIntent(body)
    const slots = buildWeekSlots(windowStart).map((slot) => {
      const currentCode = existingBySlot.get(`${slot.date}|${slot.mealType}`)
      const target = !currentCode || !recipeCodes.has(currentCode) || isTargeted(slot, scope, selectedDays, selectedMeals)
      return {
        ...slot,
        ...(target ? { intent, excludedRecipeCodes: currentCode ? [currentCode] : [] } : { fixedRecipeCode: currentCode }),
      }
    })

    const { plannerLots, existingReservations } = await loadPlannerInventory(supabase, recipes, existing.activePlanVersionId)
    const forbiddenForms = [...new Set([...dietary.allergies, ...dietary.bans].map(normalizeFoodForm).filter(Boolean))]
    const constraints = {
      allowShopping: true,
      allergens: dietary.allergies.map((value) => String(value).toLowerCase()),
      forbiddenForms,
      dislikedForms: dietary.dislikes.map(normalizeFoodForm).filter(Boolean),
      diets: dietary.diets,
      targetByMeal: nutritionTargets(goalsResult.data || []),
      maxMinutesByMeal: { dejeuner: 120, diner: 240 },
      preferredActiveMinutes: 30,
      recentRecipeTitles,
    }
    const plan = generateClosedLoopPlan({ slots, recipes, inventoryLots: plannerLots, existingReservations, constraints, beamWidth: 48 })
    if (plan.status !== 'published') {
      return NextResponse.json({ error: 'Aucun planning sûr ne satisfait les contraintes du foyer', issues: plan.issues }, { status: 422 })
    }

    const payload = buildCanonicalPlanPayload({
      plan, recipes, members, goals: goalsResult.data || [], windowStart, constraints, inventoryLots: plannerLots,
      corpusVersion: operationalCatalog.metadata.corpusVersion,
    })
    if (existing.planImport) payload.import_id = existing.planImport.id
    const { data, error } = await supabase.rpc('publish_canonical_closed_loop_plan', { p_payload: payload })
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
    return NextResponse.json({ error: error.message || 'Échec de génération du planning' }, { status: 500 })
  }
}
