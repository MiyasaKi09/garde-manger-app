import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * Boîte « Aliments à confirmer » — revue des liaisons douteuses.
 *
 * GET /api/ingredients/review
 *   Liste tout ce qui attend une revue pour l'utilisateur :
 *   {
 *     recipe_ingredients: [{ id, raw_name, quantity, unit, match_status,
 *                            review_status, match_confidence, canonical_food_id,
 *                            archetype_id, recipe_id, recipe_title }],
 *     shopping_items:     [{ id, product_name, review_status, match_confidence,
 *                            canonical_food_id, archetype_id, import_id }],
 *     canonicals:         [{ id, canonical_name, source }],   ← verified=false
 *   }
 *
 * POST /api/ingredients/review
 *   Body : {
 *     action: 'confirm' | 'relink',
 *     target: 'recipe_ingredient' | 'shopping_item' | 'canonical',
 *     id,
 *     canonical_food_id?,   ← requis pour relink (XOR archetype_id)
 *     archetype_id?,
 *   }
 *   - confirm : review_status='confirmed' (canonical : verified=true).
 *   - relink  : met à jour la FK (canonical_food_id XOR archetype_id),
 *               resolution_source='manual', match_confidence=1, puis confirme.
 *
 * Propriété : recipe_ingredients via generated_recipes.user_id, shopping_items
 * via la RLS (import_id → nutrition_plan_imports.user_id). Les canoniques sont
 * un catalogue partagé du foyer : tout utilisateur authentifié peut vérifier.
 */

const REVIEWABLE = ['pending', 'proposed']

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Les trois listes sont indépendantes ; chaque requête est fail-soft (les
  // colonnes review_status peuvent manquer avant la migration 20260712).
  const [recipeIngredients, shoppingItems, canonicals] = await Promise.all([
    loadRecipeIngredients(supabase, user.id),
    loadShoppingItems(supabase),
    loadUnverifiedCanonicals(supabase),
  ])

  return NextResponse.json({
    recipe_ingredients: recipeIngredients,
    shopping_items: shoppingItems,
    canonicals,
  })
}

async function loadRecipeIngredients(supabase, userId) {
  const { data, error } = await supabase
    .from('generated_recipe_ingredients')
    .select('id, raw_name, quantity, unit, match_status, review_status, match_confidence, canonical_food_id, archetype_id, generated_recipes!inner(id, title, user_id)')
    .in('review_status', REVIEWABLE)
    .eq('generated_recipes.user_id', userId)
    .order('id', { ascending: false })
    .limit(200)
  if (error || !data) return []
  return data.map(({ generated_recipes, ...row }) => ({
    ...row,
    recipe_id: generated_recipes?.id ?? null,
    recipe_title: generated_recipes?.title ?? null,
  }))
}

async function loadShoppingItems(supabase) {
  // RLS scope les items via import_id → nutrition_plan_imports.user_id.
  const { data, error } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('id, product_name, review_status, match_confidence, canonical_food_id, archetype_id, import_id')
    .in('review_status', REVIEWABLE)
    .order('id', { ascending: false })
    .limit(200)
  if (error || !data) return []
  return data
}

async function loadUnverifiedCanonicals(supabase) {
  const { data, error } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name, source')
    .eq('verified', false)
    .order('id', { ascending: false })
    .limit(200)
  if (error || !data) return []
  return data
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const { action, target, id, canonical_food_id, archetype_id } = body || {}

  if (!['confirm', 'relink'].includes(action)) {
    return NextResponse.json({ error: "action doit être 'confirm' ou 'relink'" }, { status: 400 })
  }
  if (!['recipe_ingredient', 'shopping_item', 'canonical'].includes(target)) {
    return NextResponse.json({ error: "target doit être 'recipe_ingredient', 'shopping_item' ou 'canonical'" }, { status: 400 })
  }
  if (id == null) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  try {
    if (target === 'canonical') {
      if (action === 'relink') {
        return NextResponse.json({ error: "relink n'est pas applicable à un canonique" }, { status: 400 })
      }
      // Catalogue partagé du foyer : tout utilisateur authentifié peut vérifier.
      const { data, error } = await supabase
        .from('canonical_foods')
        .update({ verified: true })
        .eq('id', id)
        .select('id')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data?.length) return NextResponse.json({ error: 'Canonique introuvable' }, { status: 404 })
      return NextResponse.json({ ok: true, target, id, verified: true })
    }

    // Charge utile commune : confirm simple, ou relink (FK + confirmation).
    let payload = { review_status: 'confirmed' }
    if (action === 'relink') {
      const hasCanonical = canonical_food_id != null
      const hasArchetype = archetype_id != null
      if (hasCanonical === hasArchetype) {
        // Contrainte gri_not_both_entities : exactement une des deux FK.
        return NextResponse.json(
          { error: 'relink requiert canonical_food_id OU archetype_id (exactement un des deux)' },
          { status: 400 }
        )
      }
      payload = {
        canonical_food_id: hasCanonical ? canonical_food_id : null,
        archetype_id: hasArchetype ? archetype_id : null,
        match_confidence: 1,
        resolution_source: 'manual',
        resolved_at: new Date().toISOString(),
        review_status: 'confirmed',
      }
      // match_status n'existe que sur generated_recipe_ingredients.
      if (target === 'recipe_ingredient') {
        payload.match_status = hasCanonical ? 'canonical' : 'archetype'
      }
    }

    if (target === 'recipe_ingredient') {
      // Pas de RLS sur generated_recipe_ingredients : propriété vérifiée
      // explicitement via la recette parente.
      const { data: row, error: rowErr } = await supabase
        .from('generated_recipe_ingredients')
        .select('id, generated_recipes!inner(user_id)')
        .eq('id', id)
        .single()
      if (rowErr || !row) {
        return NextResponse.json({ error: 'Ingrédient introuvable' }, { status: 404 })
      }
      if (row.generated_recipes?.user_id !== user.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
      const { error } = await supabase
        .from('generated_recipe_ingredients')
        .update(payload)
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, target, id, review_status: 'confirmed' })
    }

    // target === 'shopping_item' — la RLS garantit la propriété : un update
    // hors périmètre ne touche aucune ligne (data vide → 404).
    const { data, error } = await supabase
      .from('nutrition_plan_shopping_items')
      .update(payload)
      .eq('id', id)
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: 'Item introuvable' }, { status: 404 })
    return NextResponse.json({ ok: true, target, id, review_status: 'confirmed' })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
