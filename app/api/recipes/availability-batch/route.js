import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/recipes/availability-batch
 *
 * Reçoit une liste de generated_recipe ids et renvoie, pour chacune,
 * un résumé de couverture stock :
 *   { recipe_id, total, in_stock, has_enough_count, missing }
 *
 * `total`           = nombre total d'ingrédients liés
 * `in_stock`        = ingrédients présents dans le stock (available_lots non vide)
 * `has_enough_count`= ingrédients avec quantité suffisante (has_enough = true)
 * `missing`         = ingrédients absents du stock
 *
 * Body attendu : { recipe_ids: number[] }
 *
 * La logique de croisement canonical↔archetype est copiée depuis
 * /api/recipes/generated/[id]/available-ingredients/route.js
 * mais exécutée en un seul passage multi-recettes pour éviter N appels.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { recipe_ids } = body || {}
  if (!Array.isArray(recipe_ids) || recipe_ids.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // Dédupliquer et convertir en nombres
  const ids = [...new Set(recipe_ids.map(Number).filter(n => !isNaN(n) && n > 0))]
  if (ids.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // 1. Tous les ingrédients des recettes demandées en une requête
  const { data: allIngredients, error: ingErr } = await supabase
    .from('generated_recipe_ingredients')
    .select(`
      id, generated_recipe_id, raw_name, quantity, unit, match_status,
      canonical_food_id, archetype_id,
      canonical_foods(id, canonical_name),
      archetypes(id, name, canonical_food_id)
    `)
    .in('generated_recipe_id', ids)
    .order('id')

  if (ingErr) {
    return NextResponse.json({ error: 'Erreur lecture ingrédients' }, { status: 500 })
  }

  if (!allIngredients?.length) {
    // Aucun ingrédient lié pour ces recettes
    return NextResponse.json({
      results: ids.map(id => ({ recipe_id: id, total: 0, in_stock: 0, has_enough_count: 0, missing: 0 }))
    })
  }

  // 2. Collecter tous les IDs canonical et archetype nécessaires
  const allCanonicalIds = [...new Set(allIngredients.map(i => i.canonical_food_id).filter(Boolean))]
  const allArchetypeIds = [...new Set(allIngredients.map(i => i.archetype_id).filter(Boolean))]
  const canonicalFromArchetypes = [...new Set(allIngredients.map(i => i.archetypes?.canonical_food_id).filter(Boolean))]

  // Cross-ref inverse : archetypes dont le canonical est dans la liste
  let expandedArchetypeIds = [...allArchetypeIds]
  if (allCanonicalIds.length) {
    const { data: crossArchs } = await supabase
      .from('archetypes').select('id').in('canonical_food_id', allCanonicalIds)
    if (crossArchs?.length) {
      expandedArchetypeIds = [...new Set([...expandedArchetypeIds, ...crossArchs.map(a => a.id)])]
    }
  }

  const mergedCanonicalIds = [...new Set([...allCanonicalIds, ...canonicalFromArchetypes])]
  const mergedArchetypeIds = expandedArchetypeIds

  // 3. Tous les lots pertinents en une requête
  const todayISO = new Date().toISOString().split('T')[0]
  let allLots = []

  if (mergedCanonicalIds.length || mergedArchetypeIds.length) {
    let lotsQuery = supabase
      .from('inventory_lots')
      .select(`
        id, canonical_food_id, archetype_id, qty_remaining, unit,
        expiration_date,
        archetypes(canonical_food_id)
      `)
      .eq('user_id', user.id)
      .gt('qty_remaining', 0)

    if (mergedCanonicalIds.length && mergedArchetypeIds.length) {
      lotsQuery = lotsQuery.or(
        `canonical_food_id.in.(${mergedCanonicalIds.join(',')}),archetype_id.in.(${mergedArchetypeIds.join(',')})`
      )
    } else if (mergedCanonicalIds.length) {
      lotsQuery = lotsQuery.in('canonical_food_id', mergedCanonicalIds)
    } else {
      lotsQuery = lotsQuery.in('archetype_id', mergedArchetypeIds)
    }

    const { data } = await lotsQuery
    allLots = data || []
  }

  // 4. Construire la map archetype→canonical
  const archetypeCanonicalMap = {}
  allIngredients.forEach(i => {
    if (i.archetype_id && i.archetypes?.canonical_food_id) {
      archetypeCanonicalMap[i.archetype_id] = i.archetypes.canonical_food_id
    }
  })
  allLots.forEach(lot => {
    if (lot.archetype_id && lot.archetypes?.canonical_food_id) {
      archetypeCanonicalMap[lot.archetype_id] = lot.archetypes.canonical_food_id
    }
  })

  // 5. Grouper les ingrédients par recette et croiser avec les lots
  const ingredientsByRecipe = {}
  for (const ing of allIngredients) {
    const rid = ing.generated_recipe_id
    if (!ingredientsByRecipe[rid]) ingredientsByRecipe[rid] = []
    ingredientsByRecipe[rid].push(ing)
  }

  const results = ids.map(recipeId => {
    const ings = ingredientsByRecipe[recipeId] || []
    const total = ings.length

    if (total === 0) {
      return { recipe_id: recipeId, total: 0, in_stock: 0, has_enough_count: 0, missing: 0 }
    }

    let in_stock = 0
    let has_enough_count = 0

    for (const ing of ings) {
      const ingCanonical = ing.canonical_food_id || archetypeCanonicalMap[ing.archetype_id] || null

      const matchingLots = allLots.filter(lot => {
        const lotCanonical = lot.canonical_food_id || archetypeCanonicalMap[lot.archetype_id] || null
        return (
          (ing.canonical_food_id && lot.canonical_food_id === ing.canonical_food_id) ||
          (ing.archetype_id && lot.archetype_id === ing.archetype_id) ||
          (ingCanonical && lotCanonical && ingCanonical === lotCanonical)
        )
      })

      if (matchingLots.length > 0) {
        in_stock++
        const enough = matchingLots.some(lot => ing.quantity != null && lot.qty_remaining >= ing.quantity)
        if (enough) has_enough_count++
      }
    }

    return {
      recipe_id: recipeId,
      total,
      in_stock,
      has_enough_count,
      missing: total - in_stock,
    }
  })

  return NextResponse.json({ results })
}
