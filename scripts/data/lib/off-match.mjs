/**
 * Fabrique V2 — rapprochement produit commercial → concept alimentaire (PURE).
 * Réf. MYKO_DATA_FOUNDATION_V2 §5.6 (résolution d'identité).
 *
 * Heuristique par recouvrement de tokens (tolérante au pluriel) : un produit est
 * lié à un concept si assez de mots significatifs du CONCEPT sont présents dans le
 * nom du produit. confidence = tokens partagés / tokens significatifs du concept.
 * Un concept mono-mot exactement présent → confidence 1. Seuil de liaison : 0,5.
 * Le food_form reste NULLABLE : un produit commercial ne remplace jamais une forme.
 */

const STOPWORDS = new Set([
  'les', 'des', 'aux', 'avec', 'sans', 'pour', 'the', 'and', 'of', 'bio',
  'sec', 'nature', 'naturel', 'extra', 'fin', 'fine', 'gros', 'petit',
])

/** Tokens significatifs (≥3 lettres, hors stopwords), singularisés (pluriel -s). */
export function significantTokens(nameNormalized) {
  return String(nameNormalized || '')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map((t) => (t.endsWith('s') ? t.slice(0, -1) : t))
}

export const LINK_THRESHOLD = 0.5

/**
 * @param {string} productNameNormalized
 * @param {Array<{normalized:string, category:string, form_id?:string}>} concepts
 * @returns {{concept:string, category:string, form_id?:string, confidence:number}|null}
 */
export function matchProductToConcept(productNameNormalized, concepts = []) {
  const ptoks = new Set(significantTokens(productNameNormalized))
  if (ptoks.size === 0) return null

  let best = null
  for (const c of concepts) {
    const ctoks = significantTokens(c.normalized)
    if (ctoks.length === 0) continue
    let shared = 0
    for (const t of ctoks) if (ptoks.has(t)) shared++
    if (shared === 0) continue
    const confidence = shared / ctoks.length
    // départage : confiance ↑, puis concept le plus spécifique (plus de tokens),
    // puis nom le plus court (plus générique) — déterministe.
    if (
      !best ||
      confidence > best.confidence ||
      (confidence === best.confidence && ctoks.length > best._ctokCount) ||
      (confidence === best.confidence && ctoks.length === best._ctokCount &&
        c.normalized.length < best.concept.length)
    ) {
      best = {
        concept: c.normalized, category: c.category, form_id: c.form_id,
        confidence: Math.round(confidence * 100) / 100, _ctokCount: ctoks.length,
      }
    }
  }
  if (!best || best.confidence < LINK_THRESHOLD) return null
  delete best._ctokCount
  return best
}
