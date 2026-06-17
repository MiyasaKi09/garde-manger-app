import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { loadResolverData, resolveIngredient } from '@/lib/ingredientResolver'

export const dynamic = 'force-dynamic'

/**
 * GET /api/planning/batch/[batchRecipeId]/ingredients
 *
 * Parse le texte des ingrédients d'une préparation batch
 * (nutrition_plan_batch_recipes.ingredients, séparateurs « · », « + », retours
 * ligne) et résout chaque ligne en entité de stock (canonical_food / archetype)
 * via le résolveur déterministe — pour pré-remplir la feuille de cuisson batch
 * (liste éditable, déduction FEFO ensuite).
 *
 * Réponse : { ingredients: [{ name, quantity, unit, canonical_food_id, archetype_id }] }
 */
export async function GET(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { batchRecipeId } = await params

  // RLS : la préparation appartient à l'utilisateur via son import.
  const { data: br, error: brErr } = await supabase
    .from('nutrition_plan_batch_recipes')
    .select('id, ingredients')
    .eq('id', batchRecipeId)
    .maybeSingle()
  if (brErr) return NextResponse.json({ error: brErr.message }, { status: 500 })
  if (!br) return NextResponse.json({ error: 'Préparation introuvable' }, { status: 404 })

  const parts = String(br.ingredients || '')
    .split(/·|\n|\+|\|/)
    .map(s => s.trim())
    .filter(Boolean)

  if (!parts.length) {
    return NextResponse.json({ ingredients: [] })
  }

  const { candidates, stock } = await loadResolverData(supabase, user.id)

  const ingredients = parts.map(raw => {
    const r = resolveIngredient(raw, { candidates, stock })
    return {
      name: r.raw_name || raw,
      quantity: r.quantity ?? null,
      unit: r.unit || 'g',
      canonical_food_id: r.canonical_food_id || null,
      archetype_id: r.archetype_id || null,
    }
  })

  return NextResponse.json({ ingredients })
}
