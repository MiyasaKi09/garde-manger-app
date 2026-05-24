import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// La génération d'une semaine complète par la Routine 1 est longue (souvent
// > 60s). On NE l'attend PAS : on déclenche le webhook puis on rend la main.
// Le client poll ensuite Supabase (nouvel import) — voir docs/ROUTINES.md.
const TRIGGER_TIMEOUT_MS = 20_000

/**
 * POST /api/routine/generate-plan
 * Déclenche la Routine 1 "Myko - Planning hebdo" (webhook). Fire-and-forget :
 * la routine lit Supabase, génère le planning et écrit nutrition_plan_*.
 * Body optionnel : { days?: string[], from?: string, to?: string }
 *   (transmis à la routine ; ignoré tant que ses instructions ne le lisent pas)
 */
export async function POST(request) {
  const { user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try {
    body = await request.json()
  } catch {
    // body optionnel : pas d'erreur si vide
  }
  const { days, from, to } = body || {}

  const url = process.env.CLAUDE_ROUTINE_GENERATE_PLAN_URL
  const token = process.env.CLAUDE_ROUTINE_GENERATE_PLAN_TOKEN
  if (!url || !token) {
    return NextResponse.json(
      {
        error: 'Routine non configurée',
        hint: 'Configurer CLAUDE_ROUTINE_GENERATE_PLAN_URL et CLAUDE_ROUTINE_GENERATE_PLAN_TOKEN dans les variables d\'environnement Vercel.',
      },
      { status: 503 },
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TRIGGER_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: '{}',
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `Routine Claude erreur (${response.status})`, detail: detail.slice(0, 500) },
        { status: 502 },
      )
    }

    // 202 : déclenchée. La génération continue côté routine ; le client poll.
    return NextResponse.json({ triggered: true }, { status: 202 })
  } catch (e) {
    if (e.name === 'AbortError') {
      // Le webhook n'a pas répondu dans le délai : la routine a très
      // probablement été acceptée et tourne en asynchrone. Le client poll.
      return NextResponse.json({ triggered: true, pending: true }, { status: 202 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  } finally {
    clearTimeout(timeout)
  }
}
