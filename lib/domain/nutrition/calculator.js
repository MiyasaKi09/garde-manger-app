/**
 * Calculateur nutritionnel DÉTERMINISTE — domaine PUR (aucun accès réseau),
 * testable sans Supabase. Réf. plan directeur PR 2, commit 2.
 *
 * Source de vérité unique du calcul, alignée sur la logique SQL existante
 * (calculate_generated_recipe_nutrition) :
 *   pour chaque ingrédient : (valeur CIQUAL / 100 g) × grammes × facteur de process,
 *   sommé puis divisé par le nombre de portions.
 * Arrondis : kcal entier, macros 1 décimale, micros 2 (cf. CLAUDE.md).
 *
 * La CONVERSION en grammes et la LECTURE CIQUAL sont faites en amont (couche
 * serveur `lib/db/queries/*` via `lib/domain/units`), pour garder ce module pur.
 *
 * Entrée : liste d'ingrédients déjà résolus :
 *   {
 *     name?,               // pour le rapport de couverture
 *     grams,               // quantité en grammes (null/0 → ignoré, non quantifié)
 *     per100g?: { kcal, proteinG, carbsG, fatG, fiberG, micros?: {clé: valeur} },
 *     factors?: { kcal, proteinG, carbsG, fatG, fiberG, [clé micro]: number }, // process, défaut 1
 *   }
 */

const num = (v) => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const round = (v, d) => {
  const m = 10 ** d
  return Math.round((Number(v) || 0) * m) / m
}
const MACROS = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']

export function computeNutrition(ingredients = [], { servings = 1 } = {}) {
  const s = Number(servings) > 0 ? Number(servings) : 1

  const totals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  const microTotals = {}
  let quantified = 0
  let withData = 0
  const unresolved = []

  for (const ing of ingredients || []) {
    const g = num(ing?.grams)
    if (g == null || g <= 0) continue // pas de quantité exploitable
    quantified++
    const per = ing.per100g
    if (!per) { unresolved.push(ing?.name ?? null); continue }
    withData++
    const f = ing.factors || {}
    const scale = g / 100

    for (const key of MACROS) {
      totals[key] += (num(per[key]) || 0) * (f[key] ?? 1) * scale
    }
    for (const [k, v] of Object.entries(per.micros || {})) {
      const n = num(v)
      if (n == null) continue
      microTotals[k] = (microTotals[k] || 0) + n * (f[k] ?? 1) * scale
    }
  }

  const micros = {}
  for (const [k, v] of Object.entries(microTotals)) {
    const val = round(v / s, 2)
    if (val > 0) micros[k] = val
  }

  const perServing = {
    kcal: round(totals.kcal / s, 0),
    proteinG: round(totals.proteinG / s, 1),
    carbsG: round(totals.carbsG / s, 1),
    fatG: round(totals.fatG / s, 1),
    fiberG: round(totals.fiberG / s, 1),
    micros,
  }

  return {
    perServing,
    coverage: {
      pct: quantified > 0 ? round((withData / quantified) * 100, 0) : null,
      quantified,
      withData,
      unresolved,
    },
  }
}

/**
 * Cohérence 4-4-9 : écart relatif entre kcal et (4·prot + 4·gluc + 9·lip), en %.
 * Sert au contrôle qualité (PR 2, commit 6). Retourne null si kcal ≤ 0.
 */
export function fourNineCoherencePercent({ kcal, proteinG, carbsG, fatG } = {}) {
  const k = num(kcal)
  if (k == null || k <= 0) return null
  const fromMacros = (num(proteinG) || 0) * 4 + (num(carbsG) || 0) * 4 + (num(fatG) || 0) * 9
  return round((Math.abs(k - fromMacros) / k) * 100, 1)
}
