/**
 * Déduction du stock partagée — utilisée par la cuisson d'un repas
 * (/api/meals/cook) ET la cuisson d'un batch (/api/planning/batch/cook).
 *
 * Deux sources de déduction, fusionnées :
 *   - `needs[]`   : { canonical_food_id | archetype_id, qty, unit } → répartition
 *     multi-lots FEFO via lib/stockAllocator (lot ouvert d'abord, puis date
 *     d'expiration la plus proche ; un seul lot entamé). Le trigger SQL
 *     auto_open_lot marque « ouvert » le lot partiellement consommé.
 *   - `deductions[]` : { lot_id, quantity_used } → déduction explicite d'un lot.
 *
 * @returns {{ deductedCount:number, usedLots:Array, shortfalls:Array }}
 *   shortfalls = besoins dont le stock ne couvre pas la quantité (info, non bloquant).
 *   usedLots = lots débités (avec leurs dates) — sert au calcul de DLC d'un reste.
 */
import { allocateConsumption } from '@/lib/stockAllocator'

export async function deductFromStock(supabase, userId, { needs = [], deductions = [] } = {}) {
  const allDeductions = [...(deductions || [])]
  const shortfalls = []

  // ── 1. Besoins automatiques → allocation FEFO multi-lots ──
  for (const n of (needs || [])) {
    const qty = Number(n?.qty)
    if (!(qty > 0) || !n?.unit || (!n?.canonical_food_id && !n?.archetype_id)) continue

    let lotQuery = supabase
      .from('inventory_lots_resolved')
      .select('id, qty_remaining, unit, expiration_date, user_id')
      .eq('user_id', userId)
      .gt('qty_remaining', 0)
    lotQuery = n.canonical_food_id
      ? lotQuery.eq('resolved_canonical_food_id', n.canonical_food_id)
      : lotQuery.eq('resolved_archetype_id', n.archetype_id)
    const { data: candidateLots } = await lotQuery

    if (!candidateLots?.length) {
      shortfalls.push({ ...n, missing: qty })
      continue
    }

    // is_opened / adjusted_expiration_date ne sont pas exposés par la vue → recharge.
    const ids = candidateLots.map(l => l.id)
    const { data: fullLots } = await supabase
      .from('inventory_lots')
      .select('id, qty_remaining, unit, is_opened, expiration_date, adjusted_expiration_date')
      .in('id', ids)

    let meta = {}
    if (n.canonical_food_id) {
      const { data: cf } = await supabase
        .from('canonical_foods')
        .select('unit_weight_grams, density_g_per_ml')
        .eq('id', n.canonical_food_id)
        .maybeSingle()
      meta = { grams_per_unit: cf?.unit_weight_grams, density_g_per_ml: cf?.density_g_per_ml }
    }

    const { allocations, shortfall } = allocateConsumption(fullLots || [], qty, n.unit, meta)
    for (const a of allocations) {
      allDeductions.push({ lot_id: a.lot_id, quantity_used: a.qty_in_lot_unit })
    }
    if (shortfall > 0) shortfalls.push({ ...n, missing: shortfall })
  }

  // ── 2. Application des déductions (besoins alloués + déductions explicites) ──
  let deductedCount = 0
  const usedLots = []
  for (const d of allDeductions) {
    const lotId = d?.lot_id
    const qty = Number(d?.quantity_used)
    if (!lotId || !(qty > 0)) continue
    const { data: lot, error: lotErr } = await supabase
      .from('inventory_lots')
      .select('id, qty_remaining, adjusted_expiration_date, expiration_date, best_before')
      .eq('id', lotId)
      .eq('user_id', userId)
      .single()
    if (lotErr || !lot) continue
    const newQty = Math.max(0, (lot.qty_remaining || 0) - qty)
    const { error: updErr } = await supabase
      .from('inventory_lots')
      .update({ qty_remaining: newQty })
      .eq('id', lotId)
      .eq('user_id', userId)
    if (!updErr) {
      deductedCount++
      usedLots.push(lot)
    }
  }

  return { deductedCount, usedLots, shortfalls }
}
