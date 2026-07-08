import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * API lot unitaire — cible de migration des mutations directes côté client.
 *
 * PATCH /api/lots/[id]
 *   body (tous champs optionnels, whitelist stricte) : {
 *     qty_remaining?: number >= 0,
 *     expiration_date?: 'YYYY-MM-DD' | null,
 *     adjusted_expiration_date?: 'YYYY-MM-DD' | null,
 *     storage_place?: string | null,
 *     is_opened?: boolean,
 *     opened_at?: ISO timestamp | null
 *   }
 *   → 200 { success: true, lot }   (lot = ligne inventory_lots mise à jour)
 *   → 400 { error } si aucun champ valide / valeur invalide
 *   → 404 { error } si lot introuvable ou n'appartenant pas à l'utilisateur
 *
 * DELETE /api/lots/[id]
 *   → 200 { success: true }
 *   → 404 { error } si lot introuvable ou n'appartenant pas à l'utilisateur
 *
 * Auth : authenticateRequest + scoping .eq('user_id', user.id) sur chaque requête.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function buildPatch(body) {
  const patch = {}
  const errors = []

  if ('qty_remaining' in body) {
    const q = Number(body.qty_remaining)
    if (!Number.isFinite(q) || q < 0) errors.push('qty_remaining doit être un nombre >= 0')
    else patch.qty_remaining = q
  }
  for (const field of ['expiration_date', 'adjusted_expiration_date']) {
    if (field in body) {
      const v = body[field]
      if (v === null) patch[field] = null
      else if (typeof v === 'string' && DATE_RE.test(v)) patch[field] = v
      else errors.push(`${field} doit être une date YYYY-MM-DD ou null`)
    }
  }
  if ('storage_place' in body) {
    const v = body.storage_place
    if (v === null || typeof v === 'string') patch.storage_place = v
    else errors.push('storage_place doit être une chaîne ou null')
  }
  if ('is_opened' in body) {
    if (typeof body.is_opened === 'boolean') patch.is_opened = body.is_opened
    else errors.push('is_opened doit être un booléen')
  }
  if ('opened_at' in body) {
    const v = body.opened_at
    if (v === null) patch.opened_at = null
    else if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) patch.opened_at = v
    else errors.push('opened_at doit être un timestamp ISO ou null')
  }

  return { patch, errors }
}

export async function PATCH(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  let body = {}
  try { body = await request.json() } catch {}

  const { patch, errors } = buildPatch(body || {})
  if (errors.length) {
    return NextResponse.json({ error: errors.join(' ; ') }, { status: 400 })
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Aucun champ modifiable fourni' }, { status: 400 })
  }

  const { data: lot, error } = await supabase
    .from('inventory_lots')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!lot) return NextResponse.json({ error: 'Lot introuvable' }, { status: 404 })

  return NextResponse.json({ success: true, lot })
}

export async function DELETE(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data: deleted, error } = await supabase
    .from('inventory_lots')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!deleted?.length) return NextResponse.json({ error: 'Lot introuvable' }, { status: 404 })

  return NextResponse.json({ success: true })
}
