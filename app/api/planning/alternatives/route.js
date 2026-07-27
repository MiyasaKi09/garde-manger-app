import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { fetchDietaryConstraints } from '@/lib/aiContextBuilder'
import { listOperationalRecipes } from '@/lib/db/operationalRecipeCatalog'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { toGramsV2 } from '@/lib/domain/units'
import { isMealSuitableRecipe, recipeDiversityProfile } from '@/lib/domain/planning/closedLoopPlanner'
import { buildMealAlternatives } from '@/lib/domain/planning/mealAlternatives'
import { buildPlanningHistory, buildRepetitionRules } from '@/lib/domain/planning/repetitionRules'
import { buildHouseholdTasteProfile, isTasteForbidden } from '@/lib/domain/planning/tastePreferences'
import { matchesBannedFood } from '@/lib/domain/planning/foodBanMatch'

export const dynamic = 'force-dynamic'

const HISTORY_WINDOW_DAYS = 56

const addDays = (iso, count) => {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

/**
 * Contraintes DURES du foyer. Un remplacement doit rester mangeable : ce filtre
 * n'est jamais négociable, contrairement aux règles de répétition dont les
 * conséquences sont simplement affichées.
 */
function isEdible(recipe, { allergens, forbiddenForms, dislikedForms, diets, tasteProfile }) {
  if (!recipe.eligible) return false
  if ((recipe.allergens || []).some((value) => matchesBannedFood(value, allergens))) return false
  const ingredients = recipe.exactIngredients || []
  if (ingredients.some((ingredient) => matchesBannedFood(ingredient.formNormalized, forbiddenForms))) return false
  if (ingredients.some((ingredient) => matchesBannedFood(ingredient.formNormalized, dislikedForms))) return false
  if (isTasteForbidden(recipe, tasteProfile, recipeDiversityProfile(recipe))) return false
  const vegetarian = diets.some((diet) => /vegetar|vegan|vegetalien/.test(diet))
  if (vegetarian && !recipeDiversityProfile(recipe).vegetarian?.startsWith('vegetarien')) return false
  return true
}

/**
 * POST /api/planning/alternatives — cinq alternatives contextualisées pour un
 * créneau (§16). Lecture seule : rien n'est publié, rien n'est réservé.
 * L'utilisateur choisit, puis relance une génération ciblée sur ce créneau.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const importId = Number(body.import_id ?? body.importId) || null
    const slotKey = String(body.slot_key ?? body.slotKey ?? '').trim()
    if (!importId) return NextResponse.json({ error: 'import_id requis' }, { status: 400 })
    if (!slotKey) return NextResponse.json({ error: 'slot_key requis' }, { status: 400 })

    const { data: planImport, error: importError } = await supabase
      .from('nutrition_plan_imports')
      .select('id, date_range_start, active_plan_version_id')
      .eq('id', importId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (importError || !planImport?.active_plan_version_id) {
      return NextResponse.json({ error: 'Planning introuvable ou non publié' }, { status: 404 })
    }

    const { data: slotRows, error: slotError } = await supabase
      .from('meal_plan_slots')
      .select('slot_key, meal_date, meal_type, preparation, source, status')
      .eq('plan_version_id', planImport.active_plan_version_id)
      .eq('user_id', user.id)
    if (slotError) throw new Error(`Lecture du planning impossible: ${slotError.message}`)

    const slots = (slotRows || [])
      .filter((row) => ['dejeuner', 'diner'].includes(row.meal_type))
      .map((row) => ({
        key: row.slot_key,
        date: row.meal_date,
        mealType: row.meal_type,
        recipeCode: row.preparation?.recipe_code || null,
        source: row.source === 'planned_production' || row.source === 'cooked_dish' ? row.source : 'fresh',
      }))
      .sort((left, right) => left.date.localeCompare(right.date) || left.mealType.localeCompare(right.mealType))

    const target = slots.find((slot) => slot.key === slotKey)
    if (!target) return NextResponse.json({ error: 'Créneau introuvable dans ce planning' }, { status: 404 })

    const [membersResult, dietary, tasteRows, historyRows, lotRows] = await Promise.all([
      supabase.from('household_members').select('id, name, portion_multiplier, preferences')
        .eq('user_id', user.id).eq('active', true),
      fetchDietaryConstraints(supabase, user.id),
      supabase.from('member_food_preferences')
        .select('household_member_id, subject_type, subject_value, subject_label, appreciation, strict, repeat_delay_days')
        .eq('user_id', user.id),
      supabase.from('nutrition_plan_meals')
        .select('canonical_recipe_code, meal_date, short_label, description')
        .gte('meal_date', addDays(planImport.date_range_start, -HISTORY_WINDOW_DAYS))
        .lt('meal_date', planImport.date_range_start)
        .in('meal_type', ['dejeuner', 'diner']),
      supabase.from('inventory_lots')
        .select('canonical_food_id, archetype_id, qty_remaining, unit, expiration_date, adjusted_expiration_date')
        .gt('qty_remaining', 0),
    ])

    const members = membersResult.data || []
    const servings = Math.max(1, members.reduce((sum, member) => sum + (Number(member.portion_multiplier) || 1), 0))
    const catalog = await listOperationalRecipes(supabase, { servings })
    const recipes = catalog.recipes.filter(isMealSuitableRecipe)
    const byCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))

    // Repli souple sur le profil de goûts : une base sans la migration des
    // goûts renvoie une erreur, jamais un échec de la proposition.
    const tasteProfile = buildHouseholdTasteProfile(tasteRows.error ? [] : (tasteRows.data || []))
    const history = buildPlanningHistory({
      referenceDate: planImport.date_range_start,
      entries: (historyRows.data || []).map((row) => {
        const recipe = row.canonical_recipe_code ? byCode.get(row.canonical_recipe_code) : null
        return {
          recipeCode: row.canonical_recipe_code || null,
          date: row.meal_date,
          title: row.short_label,
          description: row.description,
          diversity: recipe ? recipeDiversityProfile(recipe) : null,
        }
      }),
    })

    // Stock disponible, ramené aux formes exactes du corpus : les mêmes
    // conversions que le solveur, pour que la couverture affichée corresponde à
    // celle qu'il calculera.
    const canonicalIds = [...new Set((lotRows.data || []).map((lot) => lot.canonical_food_id).filter(Boolean))]
    const archetypeIds = [...new Set((lotRows.data || []).map((lot) => lot.archetype_id).filter(Boolean))]
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
    const inventoryLots = []
    for (const lot of lotRows.data || []) {
      const canonical = canonicalById.get(lot.canonical_food_id)
      const archetype = archetypeById.get(lot.archetype_id)
      const formNormalized = [canonical?.canonical_name, archetype?.name].filter(Boolean).map(normalizeFoodForm)[0]
      if (!formNormalized) continue
      const conversion = toGramsV2(lot.qty_remaining, lot.unit, canonical || {})
      if (!conversion.ok || conversion.grams <= 0) continue
      const expiry = lot.adjusted_expiration_date || lot.expiration_date
      inventoryLots.push({
        formNormalized,
        gramsAvailable: conversion.grams,
        expiresOn: expiry ? String(expiry).slice(0, 10) : null,
      })
    }

    const constraints = {
      allergens: dietary.allergies.map((value) => String(value).toLowerCase()),
      forbiddenForms: [...new Set([...dietary.allergies, ...dietary.bans].map(normalizeFoodForm).filter(Boolean))],
      dislikedForms: dietary.dislikes.map(normalizeFoodForm).filter(Boolean),
      diets: dietary.diets.map((value) => String(value).toLowerCase()),
      tasteProfile,
    }
    const memberRules = members.map((member) => member?.preferences?.planning?.repetition)
      .find((value) => value && typeof value === 'object') || {}

    const result = buildMealAlternatives({
      slots,
      slotKey,
      candidates: recipes.filter((recipe) => isEdible(recipe, constraints)),
      inventoryLots,
      history,
      tasteProfile,
      rules: buildRepetitionRules(memberRules),
      diversityOf: recipeDiversityProfile,
      limitPerKind: 1,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[Planning alternatives]', error)
    return NextResponse.json({ error: error.message || 'Alternatives indisponibles' }, { status: 500 })
  }
}
