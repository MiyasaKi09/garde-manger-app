import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { fetchDietaryConstraints } from '@/lib/aiContextBuilder'
import { getCanonicalRecipes, canonicalCatalogMetadata } from '@/lib/domain/recipes/canonicalCatalog'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { toGramsV2 } from '@/lib/domain/units'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import {
  buildCanonicalPlanPayload,
  buildWeekSlots,
  nextMondayIso,
} from '@/lib/domain/planning/canonicalPlanPayload'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const average = (values) => {
  const numbers = values.map(Number).filter((value) => Number.isFinite(value) && value > 0)
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null
}

function nutritionTargets(goals) {
  const daily = {
    kcal: average(goals.map((goal) => goal.target_calories)),
    proteinG: average(goals.map((goal) => goal.target_protein_g)),
    carbsG: average(goals.map((goal) => goal.target_carbs_g)),
    fatG: average(goals.map((goal) => goal.target_fat_g)),
    fiberG: average(goals.map((goal) => goal.target_fiber_g)),
  }
  const mealTarget = (share) => Object.fromEntries(
    Object.entries(daily)
      .filter(([, value]) => Number.isFinite(value))
      .map(([key, value]) => [key, value * share]),
  )
  return { dejeuner: mealTarget(0.35), diner: mealTarget(0.35) }
}

async function loadPlannerInventory(supabase, recipes) {
  const [{ data: lots, error: lotError }, { data: reservations }] = await Promise.all([
    supabase
      .from('inventory_lots')
      .select('id, canonical_food_id, archetype_id, qty_remaining, unit, expiration_date, adjusted_expiration_date, is_opened, requires_storage_review')
      .gt('qty_remaining', 0),
    supabase
      .from('inventory_reservations')
      .select('lot_id, reserved_quantity, reserved_unit, status')
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
    plannerLots.push({
      id: lot.id,
      formNormalized,
      gramsAvailable: conversion.grams,
      expiresOn: expiry ? String(expiry).slice(0, 10) : null,
      opened: Boolean(lot.is_opened),
    })
  }

  const existingReservations = []
  for (const reservation of reservations || []) {
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
    const windowStart = /^\d{4}-\d{2}-\d{2}$/.test(body.window_start || '')
      ? body.window_start
      : nextMondayIso()

    const [membersResult, goalsResult, dietary] = await Promise.all([
      supabase.from('household_members').select('id, name, portion_multiplier, preferences').eq('active', true).order('created_at'),
      supabase.from('user_health_goals').select('person_name, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g'),
      fetchDietaryConstraints(supabase, user.id),
    ])
    let members = membersResult.data || []
    if (!members.length) {
      const { data: defaultMember, error: memberError } = await supabase
        .from('household_members')
        .insert({ user_id: user.id, name: 'Foyer', portion_multiplier: 1, active: true })
        .select('id, name, portion_multiplier, preferences')
        .single()
      if (memberError) throw new Error(`Initialisation du foyer impossible: ${memberError.message}`)
      members = [defaultMember]
    }
    const servings = Math.max(1, members.reduce((sum, member) => sum + (Number(member.portion_multiplier) || 1), 0))
    const recipes = getCanonicalRecipes({ servings })
    if (!recipes.length) throw new Error('Aucune recette V3 exécutable')

    const { plannerLots, existingReservations } = await loadPlannerInventory(supabase, recipes)
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
    }
    const slots = buildWeekSlots(windowStart)
    const plan = generateClosedLoopPlan({
      slots,
      recipes,
      inventoryLots: plannerLots,
      existingReservations,
      constraints,
      beamWidth: 32,
    })
    if (plan.status !== 'published') {
      return NextResponse.json({ error: 'Aucun planning sûr ne satisfait les contraintes du foyer', issues: plan.issues }, { status: 422 })
    }

    const payload = buildCanonicalPlanPayload({
      plan,
      recipes,
      members,
      windowStart,
      constraints,
      inventoryLots: plannerLots,
      corpusVersion: canonicalCatalogMetadata.version,
    })
    const { data, error } = await supabase.rpc('publish_canonical_closed_loop_plan', { p_payload: payload })
    if (error) throw new Error(error.message)

    return NextResponse.json({
      ok: true,
      import_id: data.import_id,
      plan_version_id: data.plan_version_id,
      status: data.status,
      summary: {
        meals: payload.slots.length,
        recipes: new Set(payload.slots.map((slot) => slot.recipe_code)).size,
        stock_coverage: plan.objectiveScores.stockCoverage,
        shopping_items: payload.shopping_items.length,
        sensory_rule_violations: plan.objectiveScores.sensoryRuleViolations,
      },
    })
  } catch (error) {
    console.error('[Planning V3]', error)
    return NextResponse.json({ error: error.message || 'Échec de génération du planning V3' }, { status: 500 })
  }
}
