/**
 * Couverture du planning par le stock — « ai-je tout en stock pour ce plat ? »
 *
 * Fonctions PURES (aucun accès DB) consommées par
 * app/api/planning/[importId]/stock-coverage/route.js.
 *
 * Principe : pour chaque plat, on compare ses ingrédients résolus (au niveau
 * canonique) au stock agrégé de l'utilisateur, en tolérant un manque < 15 %
 * (règle métier « faisable si manque < 15 % »). Les staples (épices, huiles,
 * édulcorants, sel/poivre/eau) n'influencent PAS la couleur du statut : on
 * suppose qu'on les a toujours sous la main ; on les signale juste pour info.
 *
 * Hypothèses / limites :
 *   - La couverture est évaluée INDÉPENDAMMENT par recette. Le stock n'est pas
 *     « réservé » d'un repas à l'autre de la semaine (pas de soustraction
 *     cumulative). Deux repas qui demandent le même ingrédient le verront
 *     chacun comme disponible.
 *   - Un ingrédient sans canonical résoluble est ignoré pour le calcul ; si un
 *     plat n'a AUCUN ingrédient résoluble, l'appelant pose status='unknown'.
 */

import { convertWithMeta, unitClass } from '@/lib/units'
import { normalizeFood } from '@/lib/ingredientResolver'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'

// Tolérance métier : un plat reste « faisable » si le manque est < 15 %.
const COVERAGE_TOLERANCE = 0.85

// Staples implicites par nom (toujours considérés disponibles, hors couleur).
const STAPLE_NAMES = new Set(['sel', 'poivre', 'eau'])

// Mots vides repris du matcher de fiches (app/api/recipes/generated/route.js)
// pour garder une logique de recouvrement IDENTIQUE.
const STOPWORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'aux', 'au', 'a', 'et', 'en',
  'l', 'd', 'un', 'une', 'sur', 'fines', 'maison', 'facon', 'fine',
  'portion', 'julien', 'zoe',
])

/** Tokens significatifs d'un nom de recette (≥ 3 lettres, hors stopwords). */
function recipeTokens(str) {
  return normalizeRecipeName(str || '')
    .split('-')
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

// Unité de base par classe de mesure.
const BASE_UNIT = { mass: 'g', vol: 'ml', count: 'u' }

/**
 * Agrège le stock résolu par canonical.
 *
 * @param {Array} resolvedLots  lots de inventory_lots_resolved :
 *   { resolved_canonical_food_id, resolved_archetype_id, qty_remaining, unit }
 * @param {Map<number,object>} canonicalMetaById  id → { category_id,
 *   unit_weight_grams, density_g_per_ml, canonical_name }
 * @param {Map<number,number>} [archetypeCanonicalMap]  archetypeId → canonicalId
 * @returns {Map<number,{qtyBase:number, unitClass:string, present:boolean}>}
 *   canonicalId → { qtyBase (g|ml|u), unitClass, present:true }.
 *   qtyBase = Infinity si une conversion s'est révélée impossible (présence
 *   garantie mais quantité non contraignante).
 */
export function aggregateStockByCanonical(resolvedLots, canonicalMetaById, archetypeCanonicalMap = new Map()) {
  const out = new Map()

  for (const lot of resolvedLots || []) {
    let canonicalId = lot.resolved_canonical_food_id || null
    if (!canonicalId && lot.resolved_archetype_id != null) {
      canonicalId = archetypeCanonicalMap.get(lot.resolved_archetype_id) || null
    }
    if (!canonicalId) continue

    const meta = canonicalMetaById.get(canonicalId) || {}
    const qty = Number(lot.qty_remaining)
    const cls = unitClass(lot.unit)
    const baseUnit = cls ? BASE_UNIT[cls] : null

    const prev = out.get(canonicalId) || { qtyBase: 0, unitClass: cls, present: true }
    prev.present = true
    // La classe de l'entrée suit le 1er lot mesurable rencontré.
    if (!prev.unitClass && cls) prev.unitClass = cls

    if (!cls || !baseUnit || !Number.isFinite(qty)) {
      // Unité inconnue / quantité non numérique → on garde la présence sans bloquer.
      prev.qtyBase = Infinity
      out.set(canonicalId, prev)
      continue
    }

    const conv = convertWithMeta(qty, lot.unit, baseUnit, {
      grams_per_unit: meta.unit_weight_grams,
      density_g_per_ml: meta.density_g_per_ml,
    })
    // convertWithMeta renvoie l'unité d'ORIGINE quand il ne sait pas convertir.
    if (conv.unit !== baseUnit || !Number.isFinite(conv.qty)) {
      prev.qtyBase = Infinity
    } else if (prev.qtyBase !== Infinity) {
      prev.qtyBase += conv.qty
    }
    out.set(canonicalId, prev)
  }

  return out
}

/**
 * Meilleure fiche generated_recipes pour une description de plat.
 * Logique IDENTIQUE à app/api/recipes/generated/route.js : recouvrement de
 * tokens, seuil ≥ 2 tokens significatifs communs, départage par ratio.
 *
 * @param {string} name  description / libellé du plat
 * @param {Array} recipes  [{ id, title, name_normalized, ... }]
 * @returns {object|null}  la fiche gagnante (sans champ interne) ou null
 */
export function matchGeneratedRecipe(name, recipes) {
  const qSet = new Set(recipeTokens(name))
  if (!qSet.size) return null

  let best = null
  let bestScore = 0
  let bestRatio = 0
  for (const r of recipes || []) {
    const rTokens = recipeTokens(r.name_normalized || r.title)
    if (!rTokens.length) continue
    const overlap = rTokens.filter(t => qSet.has(t)).length
    const ratio = overlap / rTokens.length
    if (overlap > bestScore || (overlap === bestScore && best && ratio > bestRatio)) {
      bestScore = overlap
      bestRatio = ratio
      best = r
    }
  }

  // Au moins 2 mots-clés significatifs en commun (anti faux-positifs).
  if (!best || bestScore < 2) return null
  return best
}

/** Métadonnées + canonical effectif d'un ingrédient résolu, ou null. */
function resolveCanonical(ing, { canonicalMetaById, archetypeCanonicalMap }) {
  let canonicalId = ing.canonical_food_id || null
  if (!canonicalId && ing.archetype_id != null) {
    canonicalId = archetypeCanonicalMap.get(ing.archetype_id) || null
  }
  if (!canonicalId) return null
  const meta = canonicalMetaById.get(canonicalId) || {}
  return { canonicalId, meta }
}

/**
 * Calcule la couverture d'un plat par le stock.
 *
 * @param {Array} ingredients  ingrédients RÉSOLUS :
 *   { raw_name, quantity, unit, canonical_food_id, archetype_id }
 * @param {object} ctx
 *   { stockByCanonical, canonicalMetaById, archetypeCanonicalMap, stapleCategoryIds }
 * @returns {{status, have, need, missing:string[], staplesMissing:string[]}}
 *   status ∈ 'full'|'partial'|'none' (jamais 'unknown' ici : 0 ingrédient
 *   résoluble est géré par l'appelant). Si 0 ingrédient principal mais des
 *   staples résolus → 'full'.
 */
export function computeDishCoverage(ingredients, ctx) {
  const {
    stockByCanonical,
    canonicalMetaById,
    archetypeCanonicalMap = new Map(),
    stapleCategoryIds = new Set(),
  } = ctx

  let need = 0
  let have = 0
  const missing = []
  const staplesMissing = []

  for (const ing of ingredients || []) {
    const resolved = resolveCanonical(ing, { canonicalMetaById, archetypeCanonicalMap })
    if (!resolved) continue // non résoluble → ignoré
    const { canonicalId, meta } = resolved

    const normName = normalizeFood(ing.raw_name || meta.canonical_name || '')
    const isStaple =
      (meta.category_id != null && stapleCategoryIds.has(meta.category_id)) ||
      STAPLE_NAMES.has(normName)

    const covered = isIngredientCovered(ing, canonicalId, meta, stockByCanonical)

    if (isStaple) {
      if (!covered) staplesMissing.push(ing.raw_name || meta.canonical_name || '')
      continue
    }

    need++
    if (covered) {
      have++
    } else {
      missing.push(ing.raw_name || meta.canonical_name || '')
    }
  }

  let status
  if (need === 0) {
    // Aucun ingrédient principal mais des staples résolus (ex: vinaigrette).
    status = 'full'
  } else if (have === need) {
    status = 'full'
  } else if (have === 0) {
    status = 'none'
  } else {
    status = 'partial'
  }

  return { status, have, need, missing: missing.slice(0, 6), staplesMissing }
}

/** Un ingrédient est-il couvert par le stock agrégé ? */
function isIngredientCovered(ing, canonicalId, meta, stockByCanonical) {
  const entry = stockByCanonical.get(canonicalId)
  if (!entry || !entry.present) return false

  const qty = ing.quantity != null && ing.quantity !== '' ? Number(ing.quantity) : null
  // Pas de quantité requise → la présence suffit.
  if (qty == null || !Number.isFinite(qty) || qty <= 0) return true

  // Présence garantie mais quantité de stock non contraignante (conversion KO).
  if (entry.qtyBase === Infinity) return true

  const needCls = unitClass(ing.unit)
  // Unité du besoin inconnue ou incomparable à celle du stock → présence suffit.
  if (!needCls || !entry.unitClass || needCls !== entry.unitClass) return true

  const baseUnit = BASE_UNIT[needCls]
  const conv = convertWithMeta(qty, ing.unit, baseUnit, {
    grams_per_unit: meta.unit_weight_grams,
    density_g_per_ml: meta.density_g_per_ml,
  })
  // Conversion du besoin impossible → on ne bloque pas sur la quantité.
  if (conv.unit !== baseUnit || !Number.isFinite(conv.qty)) return true

  return entry.qtyBase >= conv.qty * COVERAGE_TOLERANCE
}
