import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { convertWithMeta } from '@/lib/units'
import { listEditorialRecipes } from '@/lib/db/operationalRecipeCatalog'
import { operationalRecipeCards } from '@/lib/domain/recipes/operationalCatalog'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { getEffectiveExpiration } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const recipeCatalogSourcePolicy = 'v3_editorial_complete'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' }
const cap = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)

function jsonNoStore(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...(init.headers || {}) },
  })
}

/** Statut synthétique utilisé par la page recettes. */
export function availabilityStatusOf(status) {
  if (!status || !status.total) return 'manque'
  if (status.urgent > 0) return 'anti-gaspi'
  if (status.missing === 0) return 'cuisinable'
  if (status.missing <= 2) return 'presque'
  return 'manque'
}

/**
 * Conserve les lots utilisables, y compris ceux qui n'ont pas de date, et
 * applique en priorité la date recalculée d'un produit ouvert.
 */
export function activeInventoryLots(lots = [], now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  return lots
    .map((lot) => ({
      ...lot,
      expiration_date: getEffectiveExpiration(lot),
    }))
    .filter((lot) => !lot.expiration_date || String(lot.expiration_date).slice(0, 10) >= today)
}

/** Calcule la faisabilité d'une recette face au stock réel de l'utilisateur. */
export function computeRecipeAvailability(recipe, inventory, archetypeToCanonical, nameOf, now = new Date()) {
  const linked = (recipe.linked_ingredients || []).filter((ingredient) => !ingredient.optional)
  if (linked.length === 0) {
    return {
      total: 0, available: 0, missing: 0, missingNames: [], urgent: 0,
      expiringName: null, expiringDays: null, percent: 0, mykoScore: 0,
    }
  }

  let available = 0
  let urgent = 0
  const missingNames = []
  let expiringName = null
  let expiringDays = null

  for (const ingredient of linked) {
    let totalAvailable = 0
    let earliestExpiration = null

    for (const lot of inventory) {
      let matches = false
      if (ingredient.canonical_food_id && lot.canonical_food_id === ingredient.canonical_food_id) matches = true
      else if (
        ingredient.canonical_food_id
        && lot.archetype_id
        && archetypeToCanonical[lot.archetype_id] === ingredient.canonical_food_id
      ) matches = true
      else if (ingredient.archetype_id && lot.archetype_id === ingredient.archetype_id) matches = true
      else if (
        ingredient.canonical_form_normalized
        && lot.form_normalized_candidates?.includes(ingredient.canonical_form_normalized)
      ) matches = true

      if (!matches) continue

      const ingredientUnit = ingredient.canonical_form_normalized ? 'g' : (ingredient.unit || 'g')
      const converted = convertWithMeta(lot.qty_remaining || 0, lot.unit || 'g', ingredientUnit)
      if (converted.unit === ingredientUnit) totalAvailable += converted.qty

      if (lot.expiration_date) {
        const expiration = new Date(lot.expiration_date)
        if (!earliestExpiration || expiration < earliestExpiration) earliestExpiration = expiration
      }
    }

    const required = ingredient.canonical_form_normalized
      ? ingredient.quantity_grams
      : (ingredient.quantity || 1)

    if (totalAvailable >= required) {
      available++
      if (earliestExpiration) {
        const days = Math.floor((earliestExpiration - now) / 86400000)
        if (days <= 7) {
          urgent++
          if (expiringDays === null || days < expiringDays) {
            expiringDays = days
            expiringName = nameOf(ingredient)
          }
        }
      }
    } else {
      missingNames.push(nameOf(ingredient))
    }
  }

  const total = linked.length
  const missing = total - available
  const percent = Math.round((available / total) * 100)
  let mykoScore = (percent / 100) * 60 + (urgent / total) * 30
  const totalMinutes = (recipe.prep_min || 0) + (recipe.cook_min || 0)
  mykoScore += totalMinutes > 0 ? Math.max(0, 10 - (totalMinutes / 120) * 10) : 5

  return {
    total,
    available,
    missing,
    missingNames,
    urgent,
    expiringName,
    expiringDays,
    percent,
    mykoScore: Math.round(mykoScore),
  }
}

async function computeCatalogAvailability(supabase, recipes, rawInventory) {
  const inventory = activeInventoryLots(rawInventory)
  const lotArchetypeIds = inventory.filter((lot) => lot.archetype_id).map((lot) => lot.archetype_id)
  const canonicalIds = new Set(
    inventory.filter((lot) => lot.canonical_food_id).map((lot) => lot.canonical_food_id),
  )
  const ingredientArchetypeIds = new Set()

  recipes.forEach((recipe) => (recipe.linked_ingredients || []).forEach((ingredient) => {
    if (ingredient.canonical_food_id) canonicalIds.add(ingredient.canonical_food_id)
    if (ingredient.archetype_id) ingredientArchetypeIds.add(ingredient.archetype_id)
  }))

  const requestedArchetypeIds = [...new Set([...lotArchetypeIds, ...ingredientArchetypeIds])]
  const [archetypeResult, canonicalResult] = await Promise.all([
    requestedArchetypeIds.length
      ? supabase.from('archetypes').select('id, canonical_food_id, name').in('id', requestedArchetypeIds)
      : Promise.resolve({ data: [], error: null }),
    canonicalIds.size
      ? supabase.from('canonical_foods').select('id, canonical_name').in('id', [...canonicalIds])
      : Promise.resolve({ data: [], error: null }),
  ])

  const archetypeToCanonical = {}
  const canonicalNames = {}
  const archetypeNames = {}
  ;(archetypeResult.data || []).forEach((archetype) => {
    archetypeToCanonical[archetype.id] = archetype.canonical_food_id
    archetypeNames[archetype.id] = archetype.name
  })
  ;(canonicalResult.data || []).forEach((food) => {
    canonicalNames[food.id] = food.canonical_name
  })

  const nameOf = (ingredient) => cap(
    ingredient.canonical_form_name
    || canonicalNames[ingredient.canonical_food_id]
    || archetypeNames[ingredient.archetype_id]
    || 'ingrédient',
  )
  const inventoryWithNames = inventory.map((lot) => ({
    ...lot,
    form_normalized_candidates: [
      canonicalNames[lot.canonical_food_id],
      archetypeNames[lot.archetype_id],
    ].filter(Boolean).map(normalizeFoodForm),
  }))

  const now = new Date()
  return Object.fromEntries(recipes.map((recipe) => {
    const status = computeRecipeAvailability(recipe, inventoryWithNames, archetypeToCanonical, nameOf, now)
    return [recipe.key, {
      status: availabilityStatusOf(status),
      missing_count: status.missing,
      expiring_count: status.urgent,
      ...status,
    }]
  }))
}

/**
 * Le catalogue principal expose les 302 recettes éditoriales V3. Le statut
 * planning_ready sépare les recettes totalement rapprochées du stock de celles
 * qui restent consultables mais ne doivent pas encore piloter le planning.
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return jsonNoStore({ error: 'Non authentifié' }, { status: 401 })
  }

  let operationalCatalog
  let inventoryResult
  try {
    ;[operationalCatalog, inventoryResult] = await Promise.all([
      listEditorialRecipes(supabase),
      supabase
        .from('inventory_lots')
        .select('canonical_food_id, archetype_id, qty_remaining, unit, expiration_date, adjusted_expiration_date')
        .gt('qty_remaining', 0),
    ])
  } catch (error) {
    console.error('[recipes/catalog] V3 catalog unavailable', error)
    return jsonNoStore({ error: 'Le catalogue de recettes est momentanément indisponible.' }, { status: 503 })
  }

  const recipes = operationalRecipeCards(operationalCatalog.recipes)
  const planningRecipes = recipes.filter((recipe) => recipe.planning_ready)
  let availabilityByKey = null
  if (!inventoryResult.error) {
    availabilityByKey = await computeCatalogAvailability(supabase, planningRecipes, inventoryResult.data || [])
  } else {
    console.error('[recipes/catalog] Inventory unavailable', inventoryResult.error)
  }

  const recipesOut = recipes.map(({ linked_ingredients: _linkedIngredients, ...card }) => ({
    ...card,
    availability: availabilityByKey?.[card.key] || null,
  }))

  return jsonNoStore({
    recipes: recipesOut,
    canonical_catalog: operationalCatalog.metadata,
    source_policy: recipeCatalogSourcePolicy,
  })
}
