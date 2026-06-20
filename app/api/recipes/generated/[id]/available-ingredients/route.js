import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { linkRecipesForUser } from '@/lib/ingredientResolver'
import { recomputeGeneratedNutrition } from '@/lib/generatedRecipeNutrition'

export const dynamic = 'force-dynamic'

/**
 * GET /api/recipes/generated/[id]/available-ingredients
 *
 * Pour une recette GÉNÉRÉE, retourne ses ingrédients (depuis
 * generated_recipe_ingredients, peuplé par le résolveur déterministe) avec les
 * lots d'inventaire disponibles, en croisant canonical_food_id ↔ archetype_id.
 *
 * Shape de réponse aligné sur les attentes de CookWizard :
 *   ingredients[].{ id, name, quantity, unit, available_lots[].{ id, unit, ... } }
 */
export async function GET(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: recipeId } = await params

  // 0. Self-heal : (re)lier les ingrédients si la recette n'a aucun lien, ou si
  // ses lignes portent la signature de l'ancien parseur (quantité présente mais
  // unité absente → comptait en grammes au lieu de pièces). On relie via le
  // résolveur déterministe puis on recalcule la nutrition CIQUAL. Ainsi chaque
  // recette Routine se répare au 1er affichage / 1re cuisson.
  const { data: existingRows } = await supabase
    .from('generated_recipe_ingredients')
    .select('id, quantity, unit')
    .eq('generated_recipe_id', recipeId)

  const needsRelink =
    !existingRows?.length ||
    existingRows.some(r => r.quantity != null && (r.unit == null || String(r.unit).trim() === ''))

  if (needsRelink) {
    try {
      const res = await linkRecipesForUser(supabase, user.id, { recipeId: Number(recipeId) })
      if (res?.recipes > 0) {
        await recomputeGeneratedNutrition(supabase, Number(recipeId))
      }
    } catch {
      // best-effort : on continue avec l'existant si la liaison échoue
    }
  }

  // Nutrition par portion (macros + micros), relue APRÈS un éventuel self-heal —
  // pour que l'appelant (CookSession) loggue des valeurs à jour, pas l'ancien cache.
  const { data: recRow } = await supabase
    .from('generated_recipes')
    .select('nutrition_per_serving')
    .eq('id', recipeId)
    .maybeSingle()
  const nutritionPerServing = recRow?.nutrition_per_serving || null

  // 1. Ingrédients liés de la recette générée
  const { data: ingredients, error: ingErr } = await supabase
    .from('generated_recipe_ingredients')
    .select(`
      id, raw_name, quantity, unit, notes, match_status,
      canonical_food_id, archetype_id,
      canonical_foods(id, canonical_name),
      archetypes(id, name, canonical_food_id)
    `)
    .eq('generated_recipe_id', recipeId)
    .order('id')

  if (ingErr) {
    return NextResponse.json({ error: 'Erreur lecture ingrédients' }, { status: 500 })
  }
  if (!ingredients?.length) {
    return NextResponse.json({ recipe_id: Number(recipeId), ingredients: [], nutrition_per_serving: nutritionPerServing })
  }

  // 2. IDs à croiser (canonical direct + canonical des archétypes de la recette)
  const canonicalIds = ingredients.map(i => i.canonical_food_id).filter(Boolean)
  const archetypeIds = ingredients.map(i => i.archetype_id).filter(Boolean)
  const canonicalFromArchetypes = ingredients.map(i => i.archetypes?.canonical_food_id).filter(Boolean)

  // Cross-ref inverse : archétypes dont le canonical est demandé par la recette
  let expandedArchetypeIds = [...archetypeIds]
  if (canonicalIds.length) {
    const { data: crossArchs } = await supabase
      .from('archetypes').select('id').in('canonical_food_id', canonicalIds)
    if (crossArchs?.length) {
      expandedArchetypeIds = [...new Set([...expandedArchetypeIds, ...crossArchs.map(a => a.id)])]
    }
  }

  const allCanonicalIds = [...new Set([...canonicalIds, ...canonicalFromArchetypes])]
  const allArchetypeIds = expandedArchetypeIds

  // Map archetype → canonical (pour le croisement en mémoire)
  const archetypeCanonicalMap = {}
  ingredients.forEach(i => {
    if (i.archetype_id && i.archetypes?.canonical_food_id) {
      archetypeCanonicalMap[i.archetype_id] = i.archetypes.canonical_food_id
    }
  })

  // 3. Lots pertinents en une requête
  const todayISO = new Date().toISOString().split('T')[0]
  let allLots = []
  if (allCanonicalIds.length || allArchetypeIds.length) {
    let lotsQuery = supabase
      .from('inventory_lots')
      .select(`
        id, canonical_food_id, archetype_id, qty_remaining, unit,
        expiration_date, opened_at,
        canonical_foods(canonical_name),
        archetypes(name, canonical_food_id)
      `)
      .eq('user_id', user.id)
      .gt('qty_remaining', 0)
      .order('expiration_date', { ascending: true, nullsFirst: false })

    if (allCanonicalIds.length && allArchetypeIds.length) {
      lotsQuery = lotsQuery.or(
        `canonical_food_id.in.(${allCanonicalIds.join(',')}),archetype_id.in.(${allArchetypeIds.join(',')})`
      )
    } else if (allCanonicalIds.length) {
      lotsQuery = lotsQuery.in('canonical_food_id', allCanonicalIds)
    } else {
      lotsQuery = lotsQuery.in('archetype_id', allArchetypeIds)
    }

    const { data } = await lotsQuery
    allLots = data || []
  }

  // Étendre la map avec les archétypes des lots
  allLots.forEach(lot => {
    if (lot.archetype_id && lot.archetypes?.canonical_food_id) {
      archetypeCanonicalMap[lot.archetype_id] = lot.archetypes.canonical_food_id
    }
  })

  // 4. Croisement en mémoire
  const out = ingredients.map(ing => {
    const ingCanonical = ing.canonical_food_id || archetypeCanonicalMap[ing.archetype_id] || null

    const matchingLots = allLots.filter(lot => {
      const lotCanonical = lot.canonical_food_id || archetypeCanonicalMap[lot.archetype_id] || null
      return (
        (ing.canonical_food_id && lot.canonical_food_id === ing.canonical_food_id) ||
        (ing.archetype_id && lot.archetype_id === ing.archetype_id) ||
        (ingCanonical && lotCanonical && ingCanonical === lotCanonical)
      )
    })

    const name = ing.raw_name
      || ing.canonical_foods?.canonical_name
      || ing.archetypes?.name
      || 'Ingrédient'

    return {
      id: ing.id,
      name,
      quantity: ing.quantity,
      unit: ing.unit,
      notes: ing.notes,
      match_status: ing.match_status,
      canonical_food_id: ing.canonical_food_id,
      archetype_id: ing.archetype_id,
      available_lots: matchingLots.map(lot => ({
        id: lot.id,
        product_name: lot.canonical_foods?.canonical_name || lot.archetypes?.name || null,
        quantity_available: lot.qty_remaining,
        unit: lot.unit,
        expiration_date: lot.expiration_date,
        opened_at: lot.opened_at,
        days_until_expiry: lot.expiration_date
          ? Math.round((new Date(String(lot.expiration_date).split('T')[0]) - new Date(todayISO)) / 86400000)
          : null,
      })),
      has_enough: matchingLots.some(lot => ing.quantity != null && lot.qty_remaining >= ing.quantity),
    }
  })

  return NextResponse.json({ recipe_id: Number(recipeId), ingredients: out, nutrition_per_serving: nutritionPerServing })
}
