/**
 * Fabrique V2 — détection d'anomalies nutritionnelles (PURE).
 * Réf. MYKO_DATA_FOUNDATION_V2 §5.7. Les anomalies BLOQUANTES empêchent la publication.
 * Entrée : map { nutrient_code: amount|null } (grammes/mg/µg pour 100 g).
 */

const ENERGY_TOLERANCE_WARN = 0.30 // écart 4-4-9 → revue
const ENERGY_TOLERANCE_BLOCK = 0.55 // écart 4-4-9 → bloquant

/** @returns {{ blocking:string[], warnings:string[] }} */
export function detectAnomalies(v = {}) {
  const blocking = []
  const warnings = []
  const num = (k) => (typeof v[k] === 'number' && Number.isFinite(v[k]) ? v[k] : null)

  const kcal = num('energy_kcal')
  const prot = num('protein_g')
  const carb = num('carbohydrate_g')
  const fat = num('fat_g')
  const fiber = num('fiber_g')
  const salt = num('salt_g')
  const sodium = num('sodium_mg')

  // Nutriment négatif → bloquant.
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && val < 0) blocking.push(`negative:${k}`)
  }

  // Macronutriments impossibles (> 100 g pour 100 g).
  const macroSum = (prot || 0) + (carb || 0) + (fat || 0)
  if (macroSum > 100.5) blocking.push(`macro_sum_impossible:${macroSum.toFixed(1)}`)
  for (const k of ['protein_g', 'carbohydrate_g', 'fat_g', 'fiber_g', 'sugars_g', 'water_g']) {
    const val = num(k)
    if (val != null && val > 100.5) blocking.push(`over_100g:${k}`)
  }

  // Énergie aberrante (> 950 kcal/100 g impossible : lipides purs ≈ 900).
  if (kcal != null && kcal > 950) blocking.push(`energy_out_of_range:${kcal}`)

  // Cohérence 4-4-9 (fibres ≈ 2 kcal/g).
  if (kcal != null && kcal > 50 && (prot != null || carb != null || fat != null)) {
    const computed = (prot || 0) * 4 + (carb || 0) * 4 + (fat || 0) * 9 + (fiber || 0) * 2
    const rel = Math.abs(kcal - computed) / kcal
    if (rel > ENERGY_TOLERANCE_BLOCK) blocking.push(`energy_incoherent:${(rel * 100).toFixed(0)}%`)
    else if (rel > ENERGY_TOLERANCE_WARN) warnings.push(`energy_divergent:${(rel * 100).toFixed(0)}%`)
  }

  // Sel vs sodium (sel ≈ sodium × 2,5). Confusion mg/g fréquente.
  if (salt != null && sodium != null && sodium > 0) {
    const expectedSalt = (sodium * 2.5) / 1000
    if (expectedSalt > 0 && (salt / expectedSalt > 3 || salt / expectedSalt < 0.33)) {
      warnings.push('salt_sodium_mismatch')
    }
  }

  return { blocking, warnings }
}
