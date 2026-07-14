/**
 * Unités & conversions — MODULE CANONIQUE (point d'entrée unique). Réf. plan
 * directeur PR 2, commit 1.
 *
 * Ce module RÉ-EXPORTE la logique existante déjà couverte par les tests
 * (lib/units.js, lib/parseQuantity.js) — aucun changement de comportement — et
 * AJOUTE les briques réconciliées que le pipeline nutritionnel déterministe
 * (PR 2, commit 2) consommera :
 *   - `canonicalUnit`  : alias texte libre → code canonique (g|kg|mg|ml|cl|l|u|cs|cc)
 *   - `toGrams`        : conversion → grammes ALIGNÉE sur le CASE SQL de
 *                        calculate_recipe_nutrition (supabase/migrations/
 *                        20260708_nutrition_functions_consolidated.sql:141-181)
 *                        + les cuillères (cs=15 g, cc=5 g, JS avant insertion).
 *   - `normalizeProductMeta` : unifie unit_weight_grams / grams_per_unit / density.
 *   - `tryConvert`     : convertWithMeta avec un contrat explicite { ok }.
 *
 * Les modules historiques restent valides ; la migration progressive des
 * appelants vers ce module se fera dans les étapes suivantes (sans régression).
 */

// ── Ré-exports (comportement identique, imports existants préservés) ──
export {
  UNIT_CLASS,
  unitClass,
  toBase,
  fromBase,
  convertWithMeta,
  sumAvailableInUnitWithMeta,
} from '@/lib/units'
export { parseQuantity, normalizeUnit } from '@/lib/parseQuantity'

import { convertWithMeta as _convertWithMeta, unitClass as _unitClass } from '@/lib/units'

const num = (v) => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// ── Codes canoniques + alias (fr/en, cuillères, pièces) ──
const UNIT_ALIASES = {
  g: 'g', gr: 'g', gramme: 'g', grammes: 'g',
  kg: 'kg', kilo: 'kg', kilos: 'kg', kilogramme: 'kg', kilogrammes: 'kg',
  mg: 'mg', milligramme: 'mg', milligrammes: 'mg',
  ml: 'ml', millilitre: 'ml', millilitres: 'ml',
  cl: 'cl', centilitre: 'cl', centilitres: 'cl',
  l: 'l', litre: 'l', litres: 'l',
  cs: 'cs', 'c. à soupe': 'cs', 'càs': 'cs', 'cuillère à soupe': 'cs', 'cuillere à soupe': 'cs', 'cuillères à soupe': 'cs',
  cc: 'cc', 'c. à café': 'cc', 'càc': 'cc', 'cuillère à café': 'cc', 'cuillere à cafe': 'cc', 'cuillères à café': 'cc',
  u: 'u', unite: 'u', unité: 'u', unites: 'u', unités: 'u',
  piece: 'u', pièce: 'u', pieces: 'u', pièces: 'u', pcs: 'u', pc: 'u', unit: 'u', units: 'u',
}

/** Alias texte libre → code canonique (g|kg|mg|ml|cl|l|u|cs|cc). Inconnu → tel quel (minuscule). */
export function canonicalUnit(unit) {
  if (unit == null) return null
  const k = String(unit).trim().toLowerCase()
  return UNIT_ALIASES[k] ?? k
}

// ── Facteurs réconciliés (source de vérité = CASE SQL + cuillères JS) ──
export const SPOON_GRAMS = { cs: 15, cc: 5 } // c. à soupe / c. à café
export const PIECE_FALLBACK_GRAMS = 100 // COALESCE(..., 100.0) côté SQL
export const DENSITY_FALLBACK = 1.0 // COALESCE(density, 1.0) côté SQL

/**
 * Convertit (quantité, unité) en grammes, à l'identique du CASE SQL de
 * calculate_recipe_nutrition (+ cuillères). `meta` = ligne produit
 * (unit_weight_grams|grams_per_unit, density_g_per_ml).
 * `opts.pieceFallbackGrams` / `opts.densityFallback` : mettre à null pour REFUSER
 * la conversion quand l'info manque (usage stock) plutôt que d'inventer une valeur
 * (par défaut : parité SQL nutrition → 100 g / 1.0).
 * @returns {number|null} grammes, ou null si non convertible.
 */
export function toGrams(qty, unit, meta = {}, opts = {}) {
  const q = num(qty)
  if (q == null) return null
  const u = canonicalUnit(unit)
  const pieceFallback = 'pieceFallbackGrams' in opts ? opts.pieceFallbackGrams : PIECE_FALLBACK_GRAMS
  const densityFallback = 'densityFallback' in opts ? opts.densityFallback : DENSITY_FALLBACK
  const { gramsPerUnit, density } = normalizeProductMeta(meta)
  const dens = density ?? densityFallback

  switch (u) {
    case 'g': return q
    case 'kg': return q * 1000
    case 'mg': return q * 0.001
    case 'ml': return dens == null ? null : q * dens
    case 'cl': return dens == null ? null : q * 10 * dens
    case 'l': return dens == null ? null : q * 1000 * dens
    case 'cs': return q * SPOON_GRAMS.cs
    case 'cc': return q * SPOON_GRAMS.cc
    case 'u': {
      const g = gramsPerUnit ?? pieceFallback
      return g == null ? null : q * g
    }
    default: return q // unité inconnue → traitée comme des grammes (parité SQL "else")
  }
}

/** Unifie la métadonnée produit : { gramsPerUnit, density }. */
export function normalizeProductMeta(row = {}) {
  return {
    gramsPerUnit: num(row.grams_per_unit ?? row.gramsPerUnit ?? row.unit_weight_grams),
    density: num(row.density_g_per_ml ?? row.density),
  }
}

/**
 * convertWithMeta avec contrat explicite. `ok:true` seulement si la conversion a
 * réellement abouti vers l'unité cible (même classe), pas le repli « unité source ».
 * Supprime la garde dupliquée dans stockAllocator/cookingSessionDraft/
 * shoppingListBuilder/stockCoverage (rewiring dans une étape ultérieure).
 * @returns {{ ok:boolean, qty:number, unit:string }}
 */
export function tryConvert(qty, from, to, meta = {}) {
  const conv = _convertWithMeta(qty, from, to, meta)
  const sameClassAsTarget = conv.unit === to || _unitClass(conv.unit) === _unitClass(to)
  const refusedSource = conv.unit === from && _unitClass(from) !== _unitClass(to)
  return {
    ok: sameClassAsTarget && !refusedSource && Number.isFinite(conv.qty) && conv.qty > 0,
    qty: conv.qty,
    unit: conv.unit,
  }
}

// ── Conversion STRICTE V2 (audit directeur, point 13) ───────────────────────
// Aucun repli inventé : ce qui n'est pas connu reste NON RÉSOLU (jamais 100 g,
// jamais densité 1, jamais « grammes par défaut »). Une cuillère d'huile, de
// farine et de persil ne peut pas recevoir le même poids artificiel.
//   pièce sans poids connu     → unresolved(missing_unit_weight)
//   ml/cl/l sans densité       → unresolved(missing_density)
//   cuillère sans poids aliment→ unresolved(spoon_needs_food_grams)
//   unité inconnue             → error(unknown_unit)
// Les replis legacy restent dans toGrams() pour l'ancien chemin uniquement.
const _v2ok = (grams) => ({ ok: true, grams, reason: null })
const _v2no = (reason) => ({ ok: false, grams: null, reason })

/**
 * @param {number} qty
 * @param {string} unit
 * @param {object} meta ligne produit : { unit_weight_grams|grams_per_unit,
 *   density_g_per_ml|density, spoon_grams:{cs,cc} } — poids de cuillère PROPRE à l'aliment.
 * @returns {{ ok:boolean, grams:number|null, reason:string|null }}
 */
export function toGramsV2(qty, unit, meta = {}) {
  const q = num(qty)
  if (q == null) return _v2no('invalid_quantity')
  const u = canonicalUnit(unit)
  const { gramsPerUnit, density } = normalizeProductMeta(meta)
  const spoon = meta?.spoon_grams || {}
  switch (u) {
    case 'g': return _v2ok(q)
    case 'kg': return _v2ok(q * 1000)
    case 'mg': return _v2ok(q * 0.001)
    case 'ml': return density == null ? _v2no('missing_density') : _v2ok(q * density)
    case 'cl': return density == null ? _v2no('missing_density') : _v2ok(q * 10 * density)
    case 'l':  return density == null ? _v2no('missing_density') : _v2ok(q * 1000 * density)
    case 'cs': return num(spoon.cs) == null ? _v2no('spoon_needs_food_grams') : _v2ok(q * num(spoon.cs))
    case 'cc': return num(spoon.cc) == null ? _v2no('spoon_needs_food_grams') : _v2ok(q * num(spoon.cc))
    case 'u':  return gramsPerUnit == null ? _v2no('missing_unit_weight') : _v2ok(q * gramsPerUnit)
    default:   return _v2no('unknown_unit')
  }
}
