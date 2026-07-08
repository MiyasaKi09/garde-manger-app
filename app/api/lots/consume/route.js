import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/lots/consume — décrément atomique d'UN lot d'inventaire.
 *
 * body: { lotId: uuid, qty: number > 0 }
 *   La quantité est bornée au stock restant (consommer plus que le restant
 *   consomme simplement tout le lot).
 *
 * → 200 {
 *     success: true,
 *     consumed: number,   // quantité réellement décrémentée (bornée)
 *     remaining: number,  // stock restant après décrément
 *     deleted: boolean,   // true si le lot a été vidé (la RPC supprime le lot à 0)
 *     unit: string
 *   }
 * → 400 { error } si lotId/qty invalides
 * → 404 { error } si lot introuvable ou n'appartenant pas à l'utilisateur
 * → 409 { error } si conflit de concurrence persistant après 3 essais
 *
 * Implémentation : lecture scopée user_id (ownership) puis RPC transactionnelle
 * `consume_lots_fefo` (verrou FOR UPDATE, décrément, suppression du lot vidé).
 * Pas de read-modify-write côté JS : en cas de course entre la lecture et la
 * RPC, celle-ci échoue (stock insuffisant) et on relit/retente jusqu'à 3 fois.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const lotId = body?.lotId
  const qty = Number(body?.qty)

  if (!lotId) return NextResponse.json({ error: 'lotId requis' }, { status: 400 })
  if (!Number.isFinite(qty) || qty <= 0) {
    return NextResponse.json({ error: 'qty doit être un nombre > 0' }, { status: 400 })
  }

  let lastError = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: lot, error: readErr } = await supabase
      .from('inventory_lots')
      .select('id, qty_remaining, unit')
      .eq('id', lotId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
    if (!lot) return NextResponse.json({ error: 'Lot introuvable' }, { status: 404 })

    const available = Number(lot.qty_remaining) || 0
    const consumed = Math.min(qty, available)
    if (consumed <= 0) {
      return NextResponse.json({
        success: true, consumed: 0, remaining: available, deleted: false, unit: lot.unit,
      })
    }

    const { error: rpcErr } = await supabase.rpc('consume_lots_fefo', {
      p_consumptions: [{ lot_id: lotId, qty: consumed }],
    })
    if (!rpcErr) {
      const remaining = Math.max(0, Math.round((available - consumed) * 1000) / 1000)
      return NextResponse.json({
        success: true, consumed, remaining, deleted: remaining <= 0, unit: lot.unit,
      })
    }
    // Course concurrente probable → relire et retenter.
    lastError = rpcErr.message
  }

  console.error('[lots/consume] Échec après 3 essais:', lastError)
  return NextResponse.json(
    { error: `Conflit de mise à jour du stock, réessayez (${lastError})` },
    { status: 409 },
  )
}
