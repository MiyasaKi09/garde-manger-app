import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { fetchDietaryConstraints, formatDietaryConstraints } from '@/lib/aiContextBuilder'

export const dynamic = 'force-dynamic'
// La routine Claude (génération LLM + écriture Supabase) prend ~30-60s.
export const maxDuration = 60

const ROUTINE_TIMEOUT_MS = 55_000

/**
 * POST /api/routine/regenerate-recipe
 * Déclenche la routine Claude "Myko - Régénérer une recette" (webhook).
 * Cible la table generated_recipes (recettes inventées par Myko).
 * Body : { recipe_id?, recipe_name?, direction? } — au moins l'un des deux ids.
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
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { recipe_id, recipe_name, direction } = body
  if (!recipe_id && !recipe_name) {
    return NextResponse.json(
      { error: 'Champs requis : recipe_id ou recipe_name' },
      { status: 400 },
    )
  }

  // La recette ciblée doit appartenir à l'utilisateur authentifié.
  let query = supabase
    .from('generated_recipes')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
  query = recipe_id ? query.eq('id', recipe_id) : query.ilike('title', recipe_name)

  const { data: rows, error: ownErr } = await query
  if (ownErr) {
    return NextResponse.json({ error: 'Erreur vérification recette' }, { status: 500 })
  }
  if (!rows?.length) {
    return NextResponse.json({ error: 'Recette introuvable' }, { status: 404 })
  }

  const url = process.env.CLAUDE_ROUTINE_REGEN_RECIPE_URL
  const token = process.env.CLAUDE_ROUTINE_REGEN_RECIPE_TOKEN
  if (!url || !token) {
    return NextResponse.json(
      { error: 'Routine non configurée (variables d’environnement manquantes)' },
      { status: 503 },
    )
  }

  // Contraintes alimentaires strictes (allergies + régimes) transmises à la
  // routine — best-effort : un échec ne bloque pas la régénération.
  let dietaryConstraints = ''
  try {
    dietaryConstraints = formatDietaryConstraints(await fetchDietaryConstraints(supabase, user.id))
  } catch (ctxErr) {
    console.error('[Routine Regen Recipe] Contraintes alimentaires indisponibles:', ctxErr.message)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ROUTINE_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipe_id: recipe_id || undefined,
        recipe_name: recipe_name || undefined,
        direction: direction || '',
        dietary_constraints: dietaryConstraints,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `Routine Claude erreur (${response.status})`, detail: detail.slice(0, 500) },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true, message: 'Recette régénérée.' })
  } catch (e) {
    if (e.name === 'AbortError') {
      return NextResponse.json(
        { error: 'La routine a dépassé le délai. Réessaie dans un instant.' },
        { status: 504 },
      )
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  } finally {
    clearTimeout(timeout)
  }
}
