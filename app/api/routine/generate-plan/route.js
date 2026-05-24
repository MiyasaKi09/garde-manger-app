import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TRIGGER_TIMEOUT_MS = 20_000

/**
 * POST /api/routine/generate-plan
 * Deux modes :
 *   - Sans body (ou body vide) : déclenche la génération de la semaine suivante.
 *   - Avec { importId, targetStart, targetEnd, days? } : crée une requête de
 *     régénération dans plan_regen_requests puis déclenche la routine.
 *     La routine lit la requête au CP0 et régénère les jours demandés.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch { /* body optionnel */ }

  const { importId, targetStart, targetEnd, days, meals, instructions } = body || {}

  // ── Mode régénération : écrire la requête en DB avant de déclencher ──
  if (targetStart && targetEnd) {
    const { error: insertErr } = await supabase
      .from('plan_regen_requests')
      .insert({
        user_id: user.id,
        import_id: importId || null,
        target_days: Array.isArray(days) && days.length ? days : null,
        target_meals: Array.isArray(meals) && meals.length ? meals : null,
        user_instructions: instructions || null,
        target_start: targetStart,
        target_end: targetEnd,
        status: 'pending',
      })

    if (insertErr) {
      return NextResponse.json(
        { error: `Erreur création requête régénération : ${insertErr.message}` },
        { status: 500 },
      )
    }
  }

  const url = process.env.CLAUDE_ROUTINE_GENERATE_PLAN_URL
  const token = process.env.CLAUDE_ROUTINE_GENERATE_PLAN_TOKEN
  if (!url || !token) {
    return NextResponse.json(
      {
        error: 'Routine non configurée',
        hint: 'Configurer CLAUDE_ROUTINE_GENERATE_PLAN_URL et CLAUDE_ROUTINE_GENERATE_PLAN_TOKEN dans Vercel.',
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

    return NextResponse.json({ triggered: true }, { status: 202 })
  } catch (e) {
    if (e.name === 'AbortError') {
      return NextResponse.json({ triggered: true, pending: true }, { status: 202 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  } finally {
    clearTimeout(timeout)
  }
}
