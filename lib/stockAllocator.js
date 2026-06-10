/**
 * Répartiteur de consommation multi-lots — rend la déduction du stock AUTOMATIQUE.
 *
 * Exemple : 5 L de lait en bouteilles de 1 L, besoin de 1,5 L →
 *   1 bouteille vidée entièrement + 0,5 L pris sur une 2e bouteille.
 *   La 2e bouteille reste au stock avec 0,5 L, marquée « ouverte » par le
 *   trigger SQL auto_open_lot (DLC réduite selon les durées après ouverture).
 *
 * Politique d'allocation (ordre de priorité) :
 *   1. Lots déjà OUVERTS d'abord (finir la bouteille entamée avant d'en ouvrir une autre),
 *   2. puis FEFO : date d'expiration effective (ajustée > originale) croissante,
 *   3. greedy : chaque lot est vidé avant de toucher au suivant →
 *      un seul lot au maximum est entamé par allocation.
 *
 * Les quantités des lots sont converties vers l'unité du besoin via
 * convertWithMeta (poids unitaire / densité du canonique). Un lot dont
 * l'unité n'est pas convertible vers celle du besoin est ignoré (on ne
 * déduit jamais à l'aveugle).
 */

import { convertWithMeta, unitClass } from '@/lib/units'

const effectiveExpiration = (lot) =>
  lot.adjusted_expiration_date ?? lot.expiration_date ?? lot.best_before ?? null

/**
 * @param {Array} lots — lots disponibles (qty_remaining, unit, is_opened,
 *   expiration_date, adjusted_expiration_date, id)
 * @param {number} neededQty — quantité requise
 * @param {string} neededUnit — unité du besoin ('g'|'kg'|'ml'|'cl'|'l'|'u')
 * @param {Object} meta — { grams_per_unit?, density_g_per_ml? } du canonique
 * @returns {{ allocations: Array<{lot_id, qty, lot_unit, qty_in_lot_unit, depleted}>, shortfall: number }}
 *   - qty : quantité prélevée exprimée dans l'unité du BESOIN
 *   - qty_in_lot_unit : la même, exprimée dans l'unité du LOT (pour l'UPDATE)
 *   - shortfall : reste non couvert (0 si le stock suffit)
 */
export function allocateConsumption(lots, neededQty, neededUnit, meta = {}) {
  const allocations = []
  let remaining = Number(neededQty) || 0
  if (remaining <= 0) return { allocations, shortfall: 0 }

  const usable = (lots || [])
    .filter(l => (l.qty_remaining || 0) > 0)
    .map(l => {
      // Quantité du lot exprimée dans l'unité du besoin
      const conv = convertWithMeta(l.qty_remaining, l.unit, neededUnit, meta)
      const convertible = unitClass(l.unit) != null
        && (conv.unit === neededUnit || unitClass(conv.unit) === unitClass(neededUnit))
        && conv.qty > 0
        // convertWithMeta retourne la quantité inchangée avec l'unité SOURCE
        // quand la conversion est impossible — on l'écarte dans ce cas.
        && !(conv.unit === l.unit && unitClass(l.unit) !== unitClass(neededUnit))
      return { lot: l, qtyInNeed: convertible ? conv.qty : null }
    })
    .filter(x => x.qtyInNeed != null)
    .sort((a, b) => {
      // 1. lots ouverts d'abord
      const ao = a.lot.is_opened ? 0 : 1
      const bo = b.lot.is_opened ? 0 : 1
      if (ao !== bo) return ao - bo
      // 2. FEFO sur la date effective (sans date en dernier)
      const ad = effectiveExpiration(a.lot)
      const bd = effectiveExpiration(b.lot)
      if (ad && bd && ad !== bd) return ad < bd ? -1 : 1
      if (ad && !bd) return -1
      if (!ad && bd) return 1
      return 0
    })

  for (const { lot, qtyInNeed } of usable) {
    if (remaining <= 1e-9) break
    const take = Math.min(qtyInNeed, remaining)
    // Reconvertir le prélèvement vers l'unité du lot pour l'UPDATE en base
    const ratio = take / qtyInNeed
    const takeInLotUnit = Math.min(lot.qty_remaining, lot.qty_remaining * ratio)
    allocations.push({
      lot_id: lot.id,
      qty: Math.round(take * 1000) / 1000,
      lot_unit: lot.unit,
      qty_in_lot_unit: Math.round(takeInLotUnit * 1000) / 1000,
      depleted: ratio >= 1 - 1e-9,
    })
    remaining -= take
  }

  return { allocations, shortfall: Math.max(0, Math.round(remaining * 1000) / 1000) }
}
