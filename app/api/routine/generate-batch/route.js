import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TRIGGER_TIMEOUT_MS = 20_000

/**
 * POST /api/routine/generate-batch
 * Déclenche la Routine claude.ai « Batch déjeuners » : elle lit les déjeuners
 * lun–ven de la semaine active, crée une préparation à l'avance par plat
 * (nutrition_plan_batch_recipes : cook_date, portions_total, ingrédients,
 * reheat…), relie chaque repas (nutrition_plan_meals.batch_recipe_id) et écrit
 * la check-list du jour de cuisine (nutrition_plan_prep_tasks).
 * Optionnel : { importId } pour cibler une semaine précise (sinon la routine
 * traite l'import le plus récent de l'utilisateur).
 */
export async function POST(request) {
  const { user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch { /* body optionnel */ }
  const { importId } = body || {}

  const url = process.env.CLAUDE_ROUTINE_GENERATE_BATCH_URL
  const token = process.env.CLAUDE_ROUTINE_GENERATE_BATCH_TOKEN
  if (!url || !token) {
    return NextResponse.json(
      {
        error: 'Routine batch non configurée',
        hint: 'Configurer CLAUDE_ROUTINE_GENERATE_BATCH_URL et CLAUDE_ROUTINE_GENERATE_BATCH_TOKEN dans Vercel.',
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
      body: JSON.stringify(importId ? { user_id: user.id, import_id: importId } : { user_id: user.id }),
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
