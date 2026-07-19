/**
 * humanQuantities.js — Formatage humain des quantités et portions (audit §12, lot P5).
 *
 * RÈGLES PORTIONS — barème documenté et déterministe :
 *   Si servings < 0,75 → « ½ portion »
 *   Si |servings - N| ≤ 0,25 pour l'entier N le plus proche (N ≥ 1) → « N portion(s) standard »
 *   Sinon (entre deux zones) → « N grande(s) portion(s) » où N = Math.floor(servings)
 *
 * Exemples canoniques (test I) :
 *   0,5  → ½ portion
 *   0,75 → 1 portion standard
 *   1,0  → 1 portion standard
 *   1,25 → 1 portion standard  ← test I obligatoire
 *   1,5  → 1 grande portion
 *   1,75 → 2 portions standard
 *   2,0  → 2 portions standard
 *   2,5  → 2 grandes portions
 *
 * RÈGLES POIDS / VOLUMES :
 *   < 100 g (ou ml) → arrondi à 5 g près
 *   < 1 000 g → arrondi à 10 g près
 *   ≥ 1 000 g → arrondi à 50 g près, exprimé en kg
 *
 * Toutes les fonctions renvoient { display, exact } : jamais de perte d'information.
 * L'appelant peut replier l'exact dans un attribut title / aria-label.
 */

// Unités comptables : la quantité est arrondie à l'entier le plus proche.
const COUNTABLE_UNITS = new Set([
  'u', 'unite', 'unité', 'unités',
  'piece', 'pieces', 'pièce', 'pièces',
  'oeuf', 'oeufs', 'œuf', 'œufs',
  'tranche', 'tranches',
  'sachet', 'sachets',
  'boite', 'bo\xEEte', 'boites', 'bo\xEEtes',
  'pot', 'pots',
  'bol', 'bols',
  'verre', 'verres',
  'portion', 'portions',
  'fruit', 'fruits',
])

/**
 * Arrondit un poids en grammes selon la magnitude.
 *
 * @param {number} grams
 * @returns {number}
 */
function roundGrams(grams) {
  if (grams < 100) return Math.round(grams / 5) * 5
  if (grams < 1000) return Math.round(grams / 10) * 10
  return Math.round(grams / 50) * 50
}

/**
 * Formate un nombre de portions pour l'affichage humain.
 *
 * Barème déterministe (voir en-tête du module) :
 *   servings < 0,75 → « ½ portion »
 *   |servings - N| ≤ 0,25 → « N portion(s) standard »
 *   sinon → « N grande(s) portion(s) » (N = entier inférieur)
 *
 * @param {number} servings
 * @returns {{ display: string, exact: number }}
 */
export function formatServingsHuman(servings) {
  const s = Number(servings)
  if (!Number.isFinite(s) || s <= 0) return { display: '—', exact: Number(servings) || 0 }

  // Demi-portion : tout ce qui est strictement inférieur à 0,75
  if (s < 0.75) {
    return { display: '\xBD portion', exact: s }
  }

  // Zone standard : |s - N| ≤ 0,25 pour l'entier N le plus proche (≥ 1)
  const N = Math.round(s)
  if (N >= 1 && Math.abs(s - N) <= 0.25) {
    const display = N === 1 ? '1 portion standard' : `${N} portions standard`
    return { display, exact: s }
  }

  // Zone intermédiaire : grande(s) portion(s)
  const base = Math.floor(s)
  if (base >= 1) {
    const display = base === 1 ? '1 grande portion' : `${base} grandes portions`
    return { display, exact: s }
  }

  // Fallback (s ≥ 0,75 mais Math.floor = 0 — ne se produit pas avec les
  // valeurs du système qui progressent par 0,25)
  return { display: `${s} portion${s !== 1 ? 's' : ''}`, exact: s }
}

/**
 * Formate une quantité avec unité pour l'affichage humain.
 *
 * - Unités comptables (œuf, pièce, pot…) → entier arrondi + libellé
 * - Grammes → arrondi par magnitude, précédé de « environ »
 * - Kilogrammes → converti en g, arrondi, exprimé en kg
 * - Millilitres → même logique que les grammes
 * - Centilitres → converti en ml
 * - Litres → exprimé en l avec une décimale
 * - Autres → valeur arrondie à 1 décimale + unité brute
 *
 * @param {number} quantity
 * @param {string} unit
 * @param {string} [foodLabel]  libellé de l'aliment (ex. « œuf », « fruit »)
 * @returns {{ display: string, exact: number }}
 */
export function formatQuantityHuman(quantity, unit, foodLabel = null) {
  const q = Number(quantity)
  if (!Number.isFinite(q) || q < 0) return { display: '—', exact: Number(quantity) || 0 }

  const u = String(unit || '').toLowerCase().trim()

  // ── Unités comptables ─────────────────────────────────────────────────────
  if (COUNTABLE_UNITS.has(u) || !u) {
    const rounded = Math.max(1, Math.round(q))
    const label = foodLabel || unit || ''
    const display = label ? `${rounded} ${label}` : String(rounded)
    return { display, exact: q }
  }

  // ── Grammes ───────────────────────────────────────────────────────────────
  if (u === 'g' || u === 'gr' || u === 'gramme' || u === 'grammes') {
    const rounded = roundGrams(q)
    if (rounded >= 1000) {
      const kg = (rounded / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
      return { display: `environ ${kg} kg`, exact: q }
    }
    return { display: `environ ${rounded} g`, exact: q }
  }

  // ── Kilogrammes ───────────────────────────────────────────────────────────
  if (u === 'kg' || u === 'kilogramme' || u === 'kilogrammes') {
    const grams = q * 1000
    const rounded = roundGrams(grams)
    if (rounded >= 1000) {
      const kg = (rounded / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
      return { display: `environ ${kg} kg`, exact: q }
    }
    return { display: `environ ${rounded} g`, exact: q }
  }

  // ── Millilitres ───────────────────────────────────────────────────────────
  if (u === 'ml' || u === 'millilitre' || u === 'millilitres') {
    const rounded = roundGrams(q)
    if (rounded >= 1000) {
      const l = (rounded / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
      return { display: `environ ${l} l`, exact: q }
    }
    return { display: `environ ${rounded} ml`, exact: q }
  }

  // ── Centilitres ───────────────────────────────────────────────────────────
  if (u === 'cl' || u === 'centilitre' || u === 'centilitres') {
    const ml = q * 10
    const rounded = roundGrams(ml)
    if (rounded >= 1000) {
      const l = (rounded / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
      return { display: `environ ${l} l`, exact: q }
    }
    return { display: `environ ${rounded} ml`, exact: q }
  }

  // ── Litres ────────────────────────────────────────────────────────────────
  if (u === 'l' || u === 'litre' || u === 'litres') {
    const ml = q * 1000
    const rounded = roundGrams(ml)
    const l = (rounded / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    return { display: `environ ${l} l`, exact: q }
  }

  // ── Autres unités ─────────────────────────────────────────────────────────
  const rounded = Math.round(q * 10) / 10
  const label = foodLabel || unit || ''
  const display = label ? `${rounded} ${label}` : String(rounded)
  return { display, exact: q }
}
