import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { linkRecipesForUser } from '@/lib/ingredientResolver'
import { rebuildShoppingListFromImport } from '@/lib/shoppingListBuilder'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/courses/rebuild  body: { importId? }
 *
 * Recalcule la liste de courses d'un import à partir des recettes du plan et du
 * stock réel (agrégation canonique + déduction). 100 % déterministe, sans API.
 * Si importId est omis, prend le dernier import de l'utilisateur.
 *
 * S'assure d'abord que les recettes sont reliées (generated_recipe_ingredients).
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  let importId = body?.importId

  // Dernier import si non fourni
  if (!importId) {
    const { data: imports } = await supabase
      .from('nutrition_plan_imports')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
    importId = imports?.[0]?.id
  }
  if (!importId) {
    return NextResponse.json({ error: 'Aucun plan à recalculer' }, { status: 404 })
  }

  try {
    // 1. Relier les recettes non encore liées (déterministe)
    await linkRecipesForUser(supabase, user.id, { onlyUnlinked: true })
    // 2. Reconstruire la liste stock-aware (non destructeur : abandonne sans
    //    rien supprimer s'il ne peut pas produire de liste valide)
    const result = await rebuildShoppingListFromImport(supabase, user.id, importId)
    if (result.aborted) {
      return NextResponse.json({ error: result.reason, aborted: true })
    }
    return NextResponse.json({
      success: true, importId,
      items: result.items, enriched: result.enriched, inStock: result.inStock,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
