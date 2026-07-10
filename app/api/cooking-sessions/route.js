import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { allocateConsumption } from '@/lib/stockAllocator'
import { parseIngredient } from '@/lib/ingredientResolver'
import { computeScaleRatio, buildDraftIngredient } from '@/lib/cookingSessionDraft'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cooking-sessions — crée un BROUILLON de session de cuisson.
 *
 * body: { recipe_source: 'curated'|'ai', recipe_id?, generated_recipe_id?, servings? }
 *
 * Préremplit la session depuis la recette (classique OU générée) :
 *   - quantités rescalées LINÉAIREMENT par ratio portions demandées / portions recette,
 *   - allocations multi-lots FEFO (lots ouverts d'abord) via lib/stockAllocator,
 *     avec conversion d'unités (lib/units) et sans double-compter un même lot
 *     entre deux ingrédients du brouillon,
 *   - manquants marqués explicitement (status 'partial'/'missing' + missing_qty).
 *
 * Rien n'est déduit du stock ici : la déduction n'a lieu qu'au commit
 * (RPC commit_cooking_session, transaction unique).
 */

// Normalise un ingrédient (recette classique, liée ou JSONB) vers la forme
// attendue par buildDraftIngredient.
function normalizeIngredient({ name, canonicalFoodId, archetypeId, quantity, unit, meta }) {
  const entityType = canonicalFoodId ? 'canonical' : (archetypeId ? 'archetype' : null)
  return {
    name,
    entity_type: entityType,
    entity_id: canonicalFoodId || archetypeId || null,
    quantity: quantity ?? null,
    unit: unit || null,
    meta: meta || {},
  }
}

// Charge une recette CLASSIQUE (table recipes, non scopée user — catalogue partagé).
async function loadCuratedRecipe(supabase, recipeId) {
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('id, name, servings')
    .eq('id', recipeId)
    .maybeSingle()
  if (error || !recipe) return { recipe: null, ingredients: [] }

  const { data: rows, error: ingErr } = await supabase
    .from('recipe_ingredients')
    .select(`
      id, canonical_food_id, archetype_id, quantity, unit, notes,
      canonical_foods(id, canonical_name, unit_weight_grams, density_g_per_ml),
      archetypes(id, name, canonical_food_id)
    `)
    .eq('recipe_id', recipeId)
    .order('id')
  if (ingErr) return { recipe: null, ingredients: [] }

  const ingredients = (rows || []).map(r => normalizeIngredient({
    name: r.canonical_foods?.canonical_name || r.archetypes?.name || 'Ingrédient',
    canonicalFoodId: r.canonical_food_id,
    archetypeId: r.archetype_id,
    quantity: r.quantity,
    unit: r.unit,
    meta: r.canonical_foods
      ? { grams_per_unit: r.canonical_foods.unit_weight_grams, density_g_per_ml: r.canonical_foods.density_g_per_ml }
      : {},
  }))

  return { recipe: { id: recipe.id, title: recipe.name, servings: recipe.servings }, ingredients }
}

// Charge une recette GÉNÉRÉE (scopée user). Préfère les lignes liées de
// generated_recipe_ingredients (résolveur déterministe) ; retombe sur le JSONB
// brut si la liaison n'a jamais tourné.
async function loadGeneratedRecipe(supabase, userId, generatedRecipeId) {
  const { data: recipe, error } = await supabase
    .from('generated_recipes')
    .select('id, title, servings, ingredients')
    .eq('id', generatedRecipeId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !recipe) return { recipe: null, ingredients: [] }

  const { data: rows } = await supabase
    .from('generated_recipe_ingredients')
    .select(`
      id, raw_name, quantity, unit, match_status, canonical_food_id, archetype_id,
      canonical_foods(id, canonical_name, unit_weight_grams, density_g_per_ml),
      archetypes(id, name, canonical_food_id)
    `)
    .eq('generated_recipe_id', generatedRecipeId)
    .order('id')

  let ingredients
  if (rows?.length) {
    ingredients = rows.map(r => {
      // Une ligne 'unmatched' garde son nom brut mais n'a pas d'entité →
      // elle sera marquée 'missing' (jamais ignorée en silence).
      const matched = r.match_status !== 'unmatched'
      return normalizeIngredient({
        name: r.raw_name || r.canonical_foods?.canonical_name || r.archetypes?.name || 'Ingrédient',
        canonicalFoodId: matched ? r.canonical_food_id : null,
        archetypeId: matched ? r.archetype_id : null,
        quantity: r.quantity,
        unit: r.unit,
        meta: matched && r.canonical_foods
          ? { grams_per_unit: r.canonical_foods.unit_weight_grams, density_g_per_ml: r.canonical_foods.density_g_per_ml }
          : {},
      })
    })
  } else {
    // Fallback : ingrédients JSONB bruts ({name, quantity, unit} ou chaîne libre).
    ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map(raw => {
      const parsed = parseIngredient(raw)
      return normalizeIngredient({
        name: parsed.raw_name,
        canonicalFoodId: null,
        archetypeId: null,
        quantity: parsed.quantity,
        unit: parsed.unit,
      })
    })
  }

  return { recipe: { id: recipe.id, title: recipe.title, servings: recipe.servings }, ingredients }
}

// Charge les lots du user pouvant couvrir les ingrédients, en croisant via la
// vue inventory_lots_resolved (même approche que lib/deductNeeds), puis recharge
// inventory_lots pour is_opened / adjusted_expiration_date / noms (absents de la vue).
async function loadCandidateLots(supabase, userId, canonicalIds, archetypeIds) {
  if (!canonicalIds.length && !archetypeIds.length) {
    return { fullLots: [], resolvedByLot: new Map() }
  }

  let query = supabase
    .from('inventory_lots_resolved')
    .select('id, resolved_canonical_food_id, resolved_archetype_id')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)
  if (canonicalIds.length && archetypeIds.length) {
    query = query.or(
      `resolved_canonical_food_id.in.(${canonicalIds.join(',')}),resolved_archetype_id.in.(${archetypeIds.join(',')})`
    )
  } else if (canonicalIds.length) {
    query = query.in('resolved_canonical_food_id', canonicalIds)
  } else {
    query = query.in('resolved_archetype_id', archetypeIds)
  }
  const { data: resolvedLots, error } = await query
  if (error || !resolvedLots?.length) return { fullLots: [], resolvedByLot: new Map() }

  const resolvedByLot = new Map(resolvedLots.map(l => [l.id, {
    canonical: l.resolved_canonical_food_id,
    archetype: l.resolved_archetype_id,
  }]))

  const { data: fullLots, error: fullErr } = await supabase
    .from('inventory_lots')
    .select(`
      id, qty_remaining, unit, is_opened, expiration_date, adjusted_expiration_date,
      storage_place, canonical_foods(canonical_name), archetypes(name)
    `)
    .in('id', [...resolvedByLot.keys()])
    .eq('user_id', userId)
  if (fullErr) return { fullLots: [], resolvedByLot: new Map() }

  return { fullLots: fullLots || [], resolvedByLot }
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const { recipe_source: recipeSource, recipe_id: recipeId, generated_recipe_id: generatedRecipeId, servings } = body || {}

  if (!['curated', 'ai'].includes(recipeSource)) {
    return NextResponse.json({ error: "recipe_source doit être 'curated' ou 'ai'" }, { status: 400 })
  }
  if (recipeSource === 'curated' && !recipeId) {
    return NextResponse.json({ error: 'recipe_id requis pour une recette classique' }, { status: 400 })
  }
  if (recipeSource === 'ai' && !generatedRecipeId) {
    return NextResponse.json({ error: 'generated_recipe_id requis pour une recette générée' }, { status: 400 })
  }

  // ── 1. Chargement de la recette + ingrédients normalisés ──
  const { recipe, ingredients } = recipeSource === 'curated'
    ? await loadCuratedRecipe(supabase, recipeId)
    : await loadGeneratedRecipe(supabase, user.id, generatedRecipeId)

  if (!recipe) {
    return NextResponse.json({ error: 'Recette non trouvée' }, { status: 404 })
  }

  // ── 2. Rescaling linéaire des quantités ──
  const plannedServings = Number(servings) > 0 ? Number(servings) : (Number(recipe.servings) > 0 ? Number(recipe.servings) : 1)
  const ratio = computeScaleRatio(plannedServings, recipe.servings)

  // ── 3. Lots candidats (une requête batch, pas de N+1) ──
  const canonicalIds = [...new Set(ingredients.filter(i => i.entity_type === 'canonical').map(i => i.entity_id))]
  const archetypeIds = [...new Set(ingredients.filter(i => i.entity_type === 'archetype').map(i => i.entity_id))]
  const { fullLots, resolvedByLot } = await loadCandidateLots(supabase, user.id, canonicalIds, archetypeIds)
  const lotById = new Map(fullLots.map(l => [l.id, l]))

  // ── 4. Allocation multi-lots FEFO par ingrédient ──
  // consumedByLot évite qu'un même lot soit promis deux fois à deux ingrédients
  // du même brouillon (ex. deux lignes « oignon »).
  const consumedByLot = new Map()
  const draftIngredients = ingredients.map(ing => {
    let allocation = null
    const scaledQty = Number(ing.quantity) > 0 ? Number(ing.quantity) * ratio : null

    if (ing.entity_id && scaledQty > 0) {
      const candidates = fullLots
        .filter(lot => {
          const resolved = resolvedByLot.get(lot.id)
          if (!resolved) return false
          return ing.entity_type === 'canonical'
            ? resolved.canonical === ing.entity_id
            : resolved.archetype === ing.entity_id
        })
        // Retrancher ce que les ingrédients précédents du brouillon ont déjà réservé.
        .map(lot => ({ ...lot, qty_remaining: (lot.qty_remaining || 0) - (consumedByLot.get(lot.id) || 0) }))
        .filter(lot => lot.qty_remaining > 0)

      // Unité absente (« 2 oeufs ») → on raisonne en unités.
      const neededUnit = ing.unit || 'u'
      const { allocations, shortfall } = allocateConsumption(candidates, scaledQty, neededUnit, ing.meta)

      for (const a of allocations) {
        consumedByLot.set(a.lot_id, (consumedByLot.get(a.lot_id) || 0) + a.qty_in_lot_unit)
      }

      allocation = {
        shortfall,
        allocations: allocations.map(a => {
          const lot = lotById.get(a.lot_id)
          return {
            lot_id: a.lot_id,
            // qty : quantité à déduire, exprimée dans l'unité du LOT (c'est ce
            // que la RPC commit_cooking_session applique telle quelle).
            qty: a.qty_in_lot_unit,
            lot_unit: a.lot_unit,
            qty_in_need_unit: a.qty,
            label: lot?.canonical_foods?.canonical_name || lot?.archetypes?.name || 'Lot',
            storage_place: lot?.storage_place || null,
            expiration_date: lot?.adjusted_expiration_date || lot?.expiration_date || null,
          }
        }),
      }
    }

    return buildDraftIngredient(ing, ratio, allocation)
  })

  // ── 5. Persistance du brouillon (session + lignes d'ingrédients) ──
  const { data: session, error: sessionError } = await supabase
    .from('cooking_sessions')
    .insert({
      user_id: user.id,
      recipe_source: recipeSource,
      recipe_id: recipeSource === 'curated' ? recipe.id : null,
      generated_recipe_id: recipeSource === 'ai' ? recipe.id : null,
      planned_servings: plannedServings,
      status: 'draft',
    })
    .select('id, planned_servings, status')
    .single()

  if (sessionError || !session) {
    console.error('[Cooking Sessions] Erreur création session:', sessionError)
    return NextResponse.json({ error: 'Erreur lors de la création de la session' }, { status: 500 })
  }

  if (draftIngredients.length) {
    const { error: rowsError } = await supabase
      .from('cooking_session_ingredients')
      .insert(draftIngredients.map(d => ({
        session_id: session.id,
        planned_name: d.planned_name,
        planned_entity_type: d.planned_entity_type,
        planned_entity_id: d.planned_entity_id,
        planned_quantity: d.planned_quantity,
        planned_unit: d.planned_unit,
        lot_allocations: d.allocations.map(a => ({ lot_id: a.lot_id, qty: a.qty })),
      })))

    if (rowsError) {
      // Pas de brouillon à moitié écrit : on supprime la session orpheline.
      console.error('[Cooking Sessions] Erreur insertion ingrédients:', rowsError)
      await supabase.from('cooking_sessions').delete().eq('id', session.id).eq('user_id', user.id)
      return NextResponse.json({ error: "Erreur lors de l'enregistrement des ingrédients" }, { status: 500 })
    }
  }

  return NextResponse.json({
    session: {
      id: session.id,
      planned_servings: session.planned_servings,
      recipe: { title: recipe.title, servings: recipe.servings, source: recipeSource },
      ingredients: draftIngredients,
    },
  })
}
