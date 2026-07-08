/**
 * Déduction du stock partagée — utilisée par la cuisson d'un repas
 * (/api/meals/cook), la cuisson d'un batch (/api/planning/batch/cook) et les
 * routes de cuisson de recettes (/api/recipes/[id]/cook, /api/recipes/generated/[id]/cook).
 *
 * Deux sources de déduction, fusionnées :
 *   - `needs[]`   : { canonical_food_id | archetype_id, qty, unit } → répartition
 *     multi-lots FEFO via lib/stockAllocator (lot ouvert d'abord, puis date
 *     d'expiration la plus proche ; un seul lot entamé). Le trigger SQL
 *     auto_open_lot marque « ouvert » le lot partiellement consommé.
 *   - `deductions[]` : { lot_id, quantity_used } → déduction explicite d'un lot.
 *
 * L'application finale est ATOMIQUE : une seule RPC `consume_lots_fefo`
 * (migration 20260609) qui verrouille chaque ligne (FOR UPDATE), décrémente,
 * et supprime le lot vidé — tout ou rien. Les conversions d'unités et la
 * répartition FEFO restent calculées en JS en amont ; chaque quantité est
 * bornée au stock lu juste avant l'appel (la RPC échoue si qty > restant),
 * et en cas de course concurrente on relit puis retente (3 essais max).
 *
 * @returns {{ deductedCount:number, usedLots:Array, shortfalls:Array, error:string|null }}
 *   shortfalls = besoins dont le stock ne couvre pas la quantité (info, non bloquant).
 *   usedLots = lots débités (avec leurs dates + unit + qty_remaining AVANT déduction,
 *     qty_deducted, et champs d'identité canonical_food_id / cultivar_id /
 *     archetype_id / product_id / storage_place / storage_method / is_opened /
 *     opened_at / acquired_on) — sert au calcul de DLC d'un reste et à la
 *     traçabilité de restauration (table meal_stock_deductions, migration 20260709).
 *   error = message si la déduction atomique a échoué (rien n'a été débité).
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

  // ── 2. Application ATOMIQUE des déductions via la RPC consume_lots_fefo ──
  // Fusion des doublons par lot (deux besoins peuvent viser le même lot).
  const wanted = new Map()
  for (const d of allDeductions) {
    const lotId = d?.lot_id
    const qty = Number(d?.quantity_used)
    if (!lotId || !(qty > 0)) continue
    wanted.set(lotId, (wanted.get(lotId) || 0) + qty)
  }
  if (!wanted.size) return { deductedCount: 0, usedLots: [], shortfalls, error: null }

  const lotIds = [...wanted.keys()]
  let lastError = null
  for (let attempt = 0; attempt < 3; attempt++) {
    // Lecture scopée user_id : sert à la fois de check de propriété (un lot
    // non possédé est simplement ignoré, comme avant) et de borne (la RPC
    // lève une exception si qty > qty_remaining).
    const { data: lots, error: readErr } = await supabase
      .from('inventory_lots')
      .select('id, qty_remaining, unit, expiration_date, adjusted_expiration_date, canonical_food_id, cultivar_id, archetype_id, product_id, storage_place, storage_method, is_opened, opened_at, acquired_on')
      .in('id', lotIds)
      .eq('user_id', userId)
    if (readErr) {
      return { deductedCount: 0, usedLots: [], shortfalls, error: readErr.message }
    }

    const consumptions = []
    const usedLots = []
    for (const lot of (lots || [])) {
      const qty = Math.min(wanted.get(lot.id), lot.qty_remaining || 0)
      if (!(qty > 0)) continue
      consumptions.push({ lot_id: lot.id, qty })
      // qty_deducted : quantité réellement consommée sur ce lot (bornée à
      // qty_remaining) — exposée pour la traçabilité meal_stock_deductions.
      usedLots.push({ ...lot, qty_deducted: qty })
    }
    if (!consumptions.length) {
      return { deductedCount: 0, usedLots: [], shortfalls, error: null }
    }

    const { error: rpcErr } = await supabase.rpc('consume_lots_fefo', {
      p_consumptions: consumptions,
    })
    if (!rpcErr) {
      return { deductedCount: consumptions.length, usedLots, shortfalls, error: null }
    }
    // Course concurrente probable (stock modifié entre lecture et RPC) → relire et retenter.
    lastError = rpcErr.message
  }

  console.error('[deductFromStock] Échec RPC consume_lots_fefo après 3 essais:', lastError)
  return { deductedCount: 0, usedLots: [], shortfalls, error: lastError }
}
