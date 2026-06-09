// lib/scale.js
export function scaleQty(qty, fromServings, toServings) {
  if (qty == null) return qty;
  if (!fromServings || !toServings) return qty;
  return (Number(qty) * Number(toServings)) / Number(fromServings);
}

export function mealsFromBatch(servingsPerBatch, people) {
  if (!servingsPerBatch || !people) return null;
  // nb de repas complets possibles avec un "batch" (sans le diviser)
  // ex: quiche 6 portions, vous êtes 2 => 3 repas
  return Math.floor(Number(servingsPerBatch) / Number(people));
}

/**
 * Scale le temps de cuisson passif (four, mijotage) selon un ratio de portions.
 *
 * Les temps de cuisson ne scalent PAS linéairement : doubler les portions ne double pas
 * le temps de cuisson (la chaleur pénètre le volume, pas la surface).
 * Formule : cookMin × ratio^0.6, arrondi à la minute entière, minimum 1 si cookMin > 0.
 *
 * Exemples :
 *   scaleCookTime(30, 2)   → 30 × 2^0.6  ≈ 46 min
 *   scaleCookTime(30, 0.5) → 30 × 0.5^0.6 ≈ 20 min
 *   scaleCookTime(30, 1)   → 30 min (ratio = 1, pas de changement)
 *
 * @param {number} cookMin - Temps de cuisson de base en minutes
 * @param {number} ratio   - Facteur de scaling (portions cibles / portions de base)
 * @returns {number} Temps de cuisson scalé, en minutes entières
 */
export function scaleCookTime(cookMin, ratio) {
  if (!cookMin || cookMin <= 0) return 0;
  if (!ratio || ratio <= 0) return cookMin;
  const scaled = Math.round(cookMin * Math.pow(ratio, 0.6));
  return Math.max(1, scaled);
}

/**
 * Scale le temps de préparation selon un ratio de portions.
 *
 * La préparation (découpe, pesée, assemblage) scale de façon quasi-linéaire mais
 * légèrement sous-linéaire (organisation et parallélisation au-delà d'un certain volume).
 * Formule : prepMin × ratio^0.8, arrondi à la minute entière, minimum 1 si prepMin > 0.
 *
 * Exemples :
 *   scalePrepTime(20, 2)   → 20 × 2^0.8  ≈ 35 min
 *   scalePrepTime(20, 0.5) → 20 × 0.5^0.8 ≈ 11 min
 *
 * @param {number} prepMin - Temps de préparation de base en minutes
 * @param {number} ratio   - Facteur de scaling
 * @returns {number} Temps de préparation scalé, en minutes entières
 */
export function scalePrepTime(prepMin, ratio) {
  if (!prepMin || prepMin <= 0) return 0;
  if (!ratio || ratio <= 0) return prepMin;
  const scaled = Math.round(prepMin * Math.pow(ratio, 0.8));
  return Math.max(1, scaled);
}
