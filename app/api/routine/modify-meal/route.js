import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'
// La routine Claude (génération LLM + écritures Supabase) prend ~30-60s.
export const maxDuration = 60

// On coupe avant la limite Vercel pour renvoyer une erreur propre au client.
const ROUTINE_TIMEOUT_MS = 55_000

/**
 * POST /api/routine/modify-meal
 * Déclenche la routine Claude "Myko - Modifier un repas" (webhook).
 * La routine fait elle-même les écritures Supabase (Julien + Zoé).
 * Body : { import_id, meal_date, meal_type, person_name, direction? }
 *   meal_type : valeurs DB réelles 'dejeuner' | 'diner' (jamais 'dej'/'din')
 *   person_name sert d'ancre ; la routine met à jour Julien ET Zoé.
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

  const { import_id, meal_date, meal_type, person_name, direction } = body
  if (!import_id || !meal_date || !meal_type || !person_name) {
    return NextResponse.json(
      { error: 'Champs requis : import_id, meal_date, meal_type, person_name' },
      { status: 400 },
    )
  }

  // Le planning ciblé doit appartenir à l'utilisateur authentifié.
  const { data: imp, error: ownErr } = await supabase
    .from('nutrition_plan_imports')
    .select('id')
    .eq('id', import_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (ownErr) {
    return NextResponse.json({ error: 'Erreur vérification planning' }, { status: 500 })
  }
  if (!imp) {
    return NextResponse.json({ error: 'Planning introuvable' }, { status: 404 })
  }

  const url = process.env.CLAUDE_ROUTINE_MODIFY_MEAL_URL
  const token = process.env.CLAUDE_ROUTINE_MODIFY_MEAL_TOKEN
  if (!url || !token) {
    return NextResponse.json(
      { error: 'Routine non configurée (variables d’environnement manquantes)' },
      { status: 503 },
    )
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
        import_id,
        meal_date,
        meal_type,
        person_name,
        direction: direction || '',
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

    return NextResponse.json({ success: true, message: 'Repas modifié.' })
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
