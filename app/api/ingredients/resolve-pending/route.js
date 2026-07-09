import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { resolveShoppingItems, linkRecipesForUser } from '@/lib/ingredientResolver'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/ingredients/resolve-pending
 *
 * Résout les items de courses et les ingrédients de recettes sans identité FK,
 * en les reliant au référentiel (canonical_foods / archetypes) via le résolveur
 * central. Crée des canoniques traçables (source='auto', verified=false) pour les
 * libellés sans correspondance existante.
 *
 * Deux usages :
 *   1. Hook post-génération : appelé juste après qu'une Routine a écrit un plan
 *      (les items n'ont que product_name, sans FK). Assure que tous les items sont
 *      reliés avant que l'utilisateur puisse cocher / ranger dans le stock.
 *   2. Backfill : endpoint à appeler manuellement (ou via script) pour récupérer
 *      les items historiques non résolus.
 *
 * Body (optionnel) :
 *   { import_id?: number }   ← si fourni, limite au plan donné ; sinon, tous les
 *                               items non reliés de l'utilisateur sont traités.
 *
 * Réponse :
 *   { shopping: { scanned, resolved, created, stillUnmatched },
 *     recipes:  { recipes, ingredients_total, ingredients_matched, created, match_rate, details } }
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const { import_id } = body || {}

  try {
    // Les deux résolutions sont indépendantes : on les lance en parallèle.
    const [shoppingResult, recipesResult] = await Promise.all([
      resolveShoppingItems(supabase, user.id, { importId: import_id ?? null }),
      linkRecipesForUser(supabase, user.id, { onlyUnlinked: true, autoCreate: true }),
    ])

    return NextResponse.json({ shopping: shoppingResult, recipes: recipesResult })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
