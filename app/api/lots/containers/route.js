import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

const ACTIONS = new Set(['open', 'consume', 'discard_open'])

/**
 * POST /api/lots/containers
 * Body: { lotId, action: 'open'|'consume'|'discard_open', quantity? }
 *
 * The database function locks the lot and applies the complete physical
 * container transition atomically. RLS and an explicit auth.uid() owner check
 * keep every action inside the current household account.
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

  const lotId = typeof body?.lotId === 'string' ? body.lotId : ''
  const action = typeof body?.action === 'string' ? body.action : ''
  if (!lotId || !ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Lot ou action contenant invalide' }, { status: 400 })
  }

  let quantity = null
  if (action === 'consume') {
    quantity = Number(body.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'La quantité doit être positive' }, { status: 400 })
    }
  }

  const { data, error } = await supabase.rpc('manage_inventory_container', {
    p_lot_id: lotId,
    p_action: action,
    p_quantity: quantity,
  })

  if (error) {
    const status = /introuvable|authentifié/i.test(error.message) ? 404 : 422
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ success: true, summary: data })
}
