import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { normalizeFood } from '@/lib/ingredientResolver'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ingredients/search?q=<terme>&limit=8
 *
 * Recherche d'aliments pour l'ajout libre d'un ingrédient à la cuisson.
 * Retourne des entités de stock résolvables (canonical_food / archetype) avec
 * leur unité par défaut, pour construire un `needs[]` côté /api/meals/cook.
 *
 * Réponse : { results: [{ type:'canonical'|'archetype', canonical_food_id?,
 *             archetype_id?, name, unit }] }
 * Les canoniques (aliments de base) priment sur les archétypes (produits
 * transformés) ; tri par longueur de nom (le plus court = le plus générique).
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  const limit = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 8))
  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // ilike est insensible à la casse mais pas aux accents → on cherche sur le
  // terme brut ET sa forme sans accents pour couvrir « épinard » / « epinard ».
  const like = `%${q}%`
  const likeNorm = `%${normalizeFood(q)}%`

  const [{ data: cfs }, { data: archs }] = await Promise.all([
    supabase
      .from('canonical_foods')
      .select('id, canonical_name, primary_unit')
      .or(`canonical_name.ilike.${like},canonical_name.ilike.${likeNorm}`)
      .limit(limit),
    supabase
      .from('archetypes')
      .select('id, name, primary_unit')
      .or(`name.ilike.${like},name.ilike.${likeNorm}`)
      .limit(limit),
  ])

  const results = []
  const seen = new Set()
  const push = (r) => {
    const key = normalizeFood(r.name)
    if (!key || seen.has(key)) return
    seen.add(key)
    results.push(r)
  }

  for (const c of (cfs || [])) {
    push({ type: 'canonical', canonical_food_id: c.id, archetype_id: null, name: c.canonical_name, unit: c.primary_unit || 'g' })
  }
  for (const a of (archs || [])) {
    push({ type: 'archetype', canonical_food_id: null, archetype_id: a.id, name: a.name, unit: a.primary_unit || 'g' })
  }

  results.sort((a, b) => a.name.length - b.name.length)
  return NextResponse.json({ results: results.slice(0, limit) })
}
