import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/garden/harvest — enregistre une récolte du potager dans le stock,
 * côté serveur, via la RPC existante `add_harvest_lot`.
 *
 * Signature RÉELLE de la RPC (vérifiée en base) :
 *   add_harvest_lot(p_user_id uuid, p_product_id uuid, p_location_id uuid,
 *                   p_qty numeric, p_unit text, p_best_before date, p_note text)
 *   → uuid (id du lot créé)
 *
 * ⚠️ NB : l'appel client actuel (app/garden/page.jsx : rpc('add_harvest_lot',
 * { plant_id })) ne correspond PAS à cette signature — cette route expose le
 * contrat correct. `plantId` est accepté comme alias historique de `productId`.
 *
 * body: {
 *   productId | plantId: uuid (requis) — produit récolté,
 *   qty: number > 0 (requis),
 *   unit: string (requis),
 *   locationId?: uuid | null,
 *   bestBefore?: 'YYYY-MM-DD' | null,
 *   note?: string | null
 * }
 * → 200 { success: true, lot_id }
 * → 400 { error } si paramètres invalides
 * → 500 { error } si la RPC échoue
 *
 * p_user_id est TOUJOURS forcé à l'utilisateur authentifié côté serveur
 * (jamais pris du body).
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}

  const productId = body?.productId ?? body?.plantId
  const qty = Number(body?.qty)
  const unit = typeof body?.unit === 'string' ? body.unit.trim() : ''
  const locationId = body?.locationId ?? null
  const bestBefore = body?.bestBefore ?? null
  const note = body?.note ?? null

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'productId (ou plantId) requis' }, { status: 400 })
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    return NextResponse.json({ error: 'qty doit être un nombre > 0' }, { status: 400 })
  }
  if (!unit) {
    return NextResponse.json({ error: 'unit requis' }, { status: 400 })
  }
  if (bestBefore !== null && !(typeof bestBefore === 'string' && DATE_RE.test(bestBefore))) {
    return NextResponse.json({ error: 'bestBefore doit être une date YYYY-MM-DD ou null' }, { status: 400 })
  }

  const { data: lotId, error } = await supabase.rpc('add_harvest_lot', {
    p_user_id: user.id, // forcé serveur — jamais le body
    p_product_id: productId,
    p_location_id: locationId,
    p_qty: qty,
    p_unit: unit,
    p_best_before: bestBefore,
    p_note: note == null ? null : String(note),
  })

  if (error) {
    console.error('[garden/harvest] Erreur RPC add_harvest_lot:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, lot_id: lotId })
}
