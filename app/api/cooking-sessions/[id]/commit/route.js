import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { calculateCookedDishExpiration } from '@/lib/shelfLifeRules'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cooking-sessions/[id]/commit — valide une session de cuisson.
 *
 * body: {
 *   actual_servings, portions_eaten, portions_left,
 *   meal_date?, meal_type?, storage_method?, persons?: [{person_name, portions}],
 *   dish?: { name?, kcal_per_portion?, protein_g_per_portion?, carbs_g_per_portion?,
 *            fat_g_per_portion?, fiber_g_per_portion?, expiration_date? },
 *   ingredients: [{ planned_name, planned_entity_type, planned_entity_id,
 *     planned_quantity, planned_unit, actual_action: 'used'|'substituted'|'skipped'|'extra',
 *     actual_entity_type, actual_entity_id, actual_quantity, actual_unit,
 *     source: 'inventory'|'external', allocations: [{lot_id, qty}] }]
 * }
 *
 * Toute la mutation (déduction des lots, création du plat, journal
 * inventory_movements, meal_log) est déléguée à la RPC transactionnelle
 * commit_cooking_session — tout ou rien. Cette route ne fait que :
 *   1. vérifier la propriété + le statut draft de la session,
 *   2. compléter les valeurs par défaut du plat côté serveur,
 *   3. relayer le payload à la RPC et mapper ses exceptions en 409.
 */
export async function POST(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: sessionId } = await params
  let body = {}
  try { body = await request.json() } catch {}

  // ── 1. Propriété + statut ──
  const { data: session, error: sessionError } = await supabase
    .from('cooking_sessions')
    .select('id, status, recipe_source, recipe_id, generated_recipe_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (sessionError) {
    return NextResponse.json({ error: 'Erreur lecture session' }, { status: 500 })
  }
  if (!session) {
    return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
  }
  if (session.status !== 'draft') {
    return NextResponse.json(
      { error: `Session déjà ${session.status === 'committed' ? 'validée' : 'annulée'}` },
      { status: 409 }
    )
  }

  // ── 2. Validation des portions ──
  const actualServings = Number(body.actual_servings)
  const portionsEaten = Number(body.portions_eaten ?? 0)
  const portionsLeft = Number(body.portions_left ?? 0)
  if (!(actualServings > 0)) {
    return NextResponse.json({ error: 'actual_servings doit être supérieur à 0' }, { status: 400 })
  }
  if (portionsEaten < 0 || portionsLeft < 0 || Number.isNaN(portionsEaten) || Number.isNaN(portionsLeft)) {
    return NextResponse.json({ error: 'portions_eaten et portions_left doivent être positives ou nulles' }, { status: 400 })
  }
  if (!Array.isArray(body.ingredients)) {
    return NextResponse.json({ error: 'ingredients doit être un tableau' }, { status: 400 })
  }

  const storageMethod = body.storage_method || 'fridge'
  const todayISO = new Date().toISOString().split('T')[0]

  // ── 3. Défauts du plat, dérivés côté serveur si absents ──
  const dish = { ...(body.dish || {}) }

  if (!dish.name || dish.kcal_per_portion == null) {
    if (session.recipe_source === 'ai' && session.generated_recipe_id) {
      const { data: recipe } = await supabase
        .from('generated_recipes')
        .select('title, nutrition_per_serving')
        .eq('id', session.generated_recipe_id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (recipe) {
        if (!dish.name) dish.name = recipe.title
        // Macros par portion depuis nutrition_per_serving ({kcal, protein_g, carbs_g, fat_g, fiber_g})
        const nps = recipe.nutrition_per_serving || {}
        if (dish.kcal_per_portion == null && nps.kcal != null) dish.kcal_per_portion = nps.kcal
        if (dish.protein_g_per_portion == null && nps.protein_g != null) dish.protein_g_per_portion = nps.protein_g
        if (dish.carbs_g_per_portion == null && nps.carbs_g != null) dish.carbs_g_per_portion = nps.carbs_g
        if (dish.fat_g_per_portion == null && nps.fat_g != null) dish.fat_g_per_portion = nps.fat_g
        if (dish.fiber_g_per_portion == null && nps.fiber_g != null) dish.fiber_g_per_portion = nps.fiber_g
      }
    } else if (session.recipe_source === 'curated' && session.recipe_id && !dish.name) {
      const { data: recipe } = await supabase
        .from('recipes')
        .select('name')
        .eq('id', session.recipe_id)
        .maybeSingle()
      if (recipe?.name) dish.name = recipe.name
    }
  }
  if (!dish.name) dish.name = 'Plat cuisiné'

  // DLC du plat : J+3 au frigo (J+90 congélateur, J+1 ambiant) sauf si fournie.
  if (!dish.expiration_date) {
    dish.expiration_date = calculateCookedDishExpiration(new Date(), storageMethod)
      .toISOString()
      .split('T')[0]
  }

  // ── 4. Payload de la RPC transactionnelle ──
  const payload = {
    session_id: session.id,
    actual_servings: actualServings,
    portions_eaten: portionsEaten,
    portions_left: portionsLeft,
    meal_date: body.meal_date || todayISO,
    meal_type: body.meal_type || 'diner',
    storage_method: storageMethod,
    persons: Array.isArray(body.persons) ? body.persons : [],
    dish,
    ingredients: body.ingredients,
  }

  const { data, error: rpcError } = await supabase.rpc('commit_cooking_session', { p: payload })

  if (rpcError) {
    // Les exceptions métier de la RPC (stock insuffisant, session non draft,
    // lot disparu…) remontent comme erreur PostgREST → conflit applicatif.
    return NextResponse.json({ error: rpcError.message }, { status: 409 })
  }

  return NextResponse.json(data)
}
