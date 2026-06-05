import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/meals/cook — Marque un repas du plan comme « cuisiné / mangé ».
 *   - logue la nutrition du jour dans meal_log (une ligne par personne) ;
 *   - déduit les lots choisis de l'inventaire.
 * Idempotent sur le créneau (date + type) : on remplace les logs existants.
 *
 * body: {
 *   meal_date, meal_type, dish_name?,
 *   entries: [{ person_name, kcal, protein_g, carbs_g, fat_g, fiber_g, portions_eaten? }],
 *   deductions: [{ lot_id, quantity_used, unit?, product_name? }]
 * }
 *
 * DELETE /api/meals/cook — Annule la nutrition d'un créneau (le stock n'est PAS
 *   restauré automatiquement). body: { meal_date, meal_type }
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const { meal_date, meal_type, dish_name, entries = [], deductions = [] } = body || {}
  if (!meal_date || !meal_type) {
    return NextResponse.json({ error: 'meal_date et meal_type requis' }, { status: 400 })
  }

  // 1. Nutrition du jour — remplace les logs du créneau (idempotent)
  await supabase
    .from('meal_log')
    .delete()
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)

  const logRows = (entries || [])
    .filter(e => e && e.person_name)
    .map(e => ({
      user_id: user.id,
      person_name: e.person_name,
      meal_date,
      meal_type,
      description: dish_name || null,
      portions_eaten: e.portions_eaten || 1,
      kcal: e.kcal ?? null,
      protein_g: e.protein_g ?? null,
      carbs_g: e.carbs_g ?? null,
      fat_g: e.fat_g ?? null,
      fiber_g: e.fiber_g ?? null,
    }))

  if (logRows.length) {
    const { error: logErr } = await supabase.from('meal_log').insert(logRows)
    if (logErr) {
      return NextResponse.json({ error: `Log nutrition: ${logErr.message}` }, { status: 500 })
    }
  }

  // 2. Déduction du stock
  let deductedCount = 0
  for (const d of (deductions || [])) {
    const lotId = d?.lot_id
    const qty = Number(d?.quantity_used)
    if (!lotId || !(qty > 0)) continue
    const { data: lot, error: lotErr } = await supabase
      .from('inventory_lots')
      .select('id, qty_remaining')
      .eq('id', lotId)
      .eq('user_id', user.id)
      .single()
    if (lotErr || !lot) continue
    const newQty = Math.max(0, (lot.qty_remaining || 0) - qty)
    const { error: updErr } = await supabase
      .from('inventory_lots')
      .update({ qty_remaining: newQty })
      .eq('id', lotId)
      .eq('user_id', user.id)
    if (!updErr) deductedCount++
  }

  return NextResponse.json({ success: true, logged: logRows.length, deducted: deductedCount })
}

export async function DELETE(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  let body = {}
  try { body = await request.json() } catch {}
  const { meal_date, meal_type } = body || {}
  if (!meal_date || !meal_type) {
    return NextResponse.json({ error: 'meal_date et meal_type requis' }, { status: 400 })
  }
  const { error } = await supabase
    .from('meal_log')
    .delete()
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
