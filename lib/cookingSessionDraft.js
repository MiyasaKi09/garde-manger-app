/**
 * Helpers PURS pour les brouillons de session de cuisson (Vague 1).
 *
 * Utilisés par POST /api/cooking-sessions (préremplissage du brouillon) et par
 * les routes available-ingredients (badge « Cuisinable » = somme multi-lots
 * avec conversion d'unités, plus jamais un test sur un lot unique).
 *
 * Aucune I/O ici : les lots et les résultats d'allocation (lib/stockAllocator)
 * sont fournis par l'appelant — ce qui rend ces fonctions testables unitairement.
 */

import { convertWithMeta, unitClass } from '@/lib/units'

const round3 = (n) => Math.round(n * 1000) / 1000

/**
 * Ratio de rescaling linéaire des quantités : portions demandées / portions
 * de la recette. Retombe sur 1 si l'une des deux valeurs est absente/invalide.
 */
export function computeScaleRatio(requestedServings, recipeServings) {
  const requested = Number(requestedServings)
  const base = Number(recipeServings)
  if (!(requested > 0) || !(base > 0)) return 1
  return requested / base
}

/**
 * Quantité rescalée linéairement (arrondie au millième).
 * Une quantité absente (« sel », « poivre ») reste null — on ne l'invente pas.
 */
export function scaleQuantity(quantity, ratio) {
  if (quantity == null || quantity === '') return null
  const q = Number(quantity)
  if (Number.isNaN(q)) return null
  const r = Number(ratio) > 0 ? Number(ratio) : 1
  return round3(q * r)
}

/**
 * Construit une ligne d'ingrédient du brouillon à partir :
 *   - d'un ingrédient normalisé { name, entity_type: 'canonical'|'archetype'|null,
 *     entity_id, quantity, unit },
 *   - du ratio de portions,
 *   - du résultat d'allocation multi-lots ({ allocations, shortfall } de
 *     lib/stockAllocator, éventuellement enrichi de label/expiration_date par
 *     l'appelant) — ou null si aucune allocation n'a pu être tentée
 *     (ingrédient non lié au référentiel, quantité inconnue…).
 *
 * @returns {{ planned_name, planned_entity_type, planned_entity_id,
 *   planned_quantity, planned_unit, allocations, missing_qty,
 *   status: 'ok'|'partial'|'missing' }}
 */
export function buildDraftIngredient(ing, ratio, allocation = null) {
  const plannedQuantity = scaleQuantity(ing?.quantity, ratio)
  const allocations = allocation?.allocations || []

  let status
  let missingQty
  if (!allocation) {
    // Pas d'allocation possible → manquant explicite (jamais ignoré en silence).
    status = 'missing'
    missingQty = plannedQuantity
  } else {
    const shortfall = Math.max(0, Number(allocation.shortfall) || 0)
    if (shortfall <= 1e-9) {
      status = 'ok'
      missingQty = 0
    } else {
      status = allocations.length > 0 ? 'partial' : 'missing'
      missingQty = round3(shortfall)
    }
  }

  return {
    planned_name: ing?.name || 'Ingrédient',
    planned_entity_type: ing?.entity_type || null,
    planned_entity_id: ing?.entity_id ?? null,
    planned_quantity: plannedQuantity,
    planned_unit: ing?.unit || null,
    allocations,
    missing_qty: missingQty,
    status,
  }
}

/**
 * Somme les quantités disponibles d'une liste de lots, exprimée dans l'unité
 * du besoin, via convertWithMeta (poids unitaire / densité du canonique).
 * Un lot dont l'unité n'est pas convertible vers celle du besoin est EXCLU
 * de la somme (on ne compte jamais à l'aveugle) — même règle que
 * lib/stockAllocator.
 *
 * @param {Array<{qty_remaining?:number, qty?:number, unit:string}>} lots
 * @param {string} neededUnit — unité du besoin ('g'|'kg'|'ml'|'cl'|'l'|'u')
 * @param {Object} meta — { grams_per_unit?, density_g_per_ml? } du canonique
 * @returns {number} total disponible dans l'unité du besoin (arrondi au millième)
 */
export function sumAvailableForNeed(lots, neededUnit, meta = {}) {
  let total = 0
  for (const lot of lots || []) {
    const qty = Number(lot?.qty_remaining ?? lot?.qty ?? 0)
    if (!(qty > 0)) continue
    const conv = convertWithMeta(qty, lot.unit, neededUnit, meta)
    const convertible = unitClass(lot.unit) != null
      && (conv.unit === neededUnit || unitClass(conv.unit) === unitClass(neededUnit))
      && conv.qty > 0
      // convertWithMeta retourne la quantité inchangée avec l'unité SOURCE
      // quand la conversion est impossible — on écarte le lot dans ce cas.
      && !(conv.unit === lot.unit && unitClass(lot.unit) !== unitClass(neededUnit))
    if (convertible) total += conv.qty
  }
  return round3(total)
}

/**
 * Le stock couvre-t-il le besoin ? Somme multi-lots convertie, avec une petite
 * tolérance flottante. Quantité inconnue → false (on ne promet rien).
 */
export function hasEnoughStock(lots, neededQty, neededUnit, meta = {}) {
  const needed = Number(neededQty)
  if (!(needed > 0)) return false
  return sumAvailableForNeed(lots, neededUnit, meta) + 1e-9 >= needed
}
