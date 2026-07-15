/**
 * Utilitaires de déduplication pour le catalogue unifié de recettes.
 * Fonctions pures — importables côté client et côté serveur.
 */
import { normalizeRecipeName } from '@/lib/recipeNormalizer'

const STOPWORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'aux', 'au', 'a', 'et', 'en',
  'l', 'd', 'un', 'une', 'sur', 'fines', 'maison', 'facon', 'fine',
  'portion', 'julien', 'zoe',
])

/**
 * Tokenise un nom de recette pour la comparaison de dedup.
 * Normalise accents/casse, découpe sur les tirets, élimine
 * les stopwords et les tokens courts (< 3 caractères).
 *
 * @param {string|null} name
 * @returns {string[]}
 */
export function tokenizeForDedup(name) {
  return normalizeRecipeName(name || '')
    .split('-')
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

/**
 * Similarité de Jaccard entre deux tableaux de tokens.
 * Retourne 1 si les deux tableaux sont vides, 0 si l'un est vide.
 *
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number} valeur dans [0, 1]
 */
export function jaccardSimilarity(a, b) {
  if (!a.length && !b.length) return 1
  if (!a.length || !b.length) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0
  for (const t of setA) {
    if (setB.has(t)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Déduplique un catalogue unifié de recettes.
 *
 * Stratégie en deux passes :
 *   1. Regroupement par nom normalisé exact (insensible à la casse et aux accents).
 *   2. Fusion des quasi-doublons par similarité de tokens Jaccard ≥ 0.8.
 *   Dans chaque groupe, la version « generated » est préférée (données plus riches).
 *
 * @param {Array<{key: string, source: 'generated'|'classic', title: string}>} recipes
 *   Liste combinée, générées en premier pour optimiser la sélection preferred.
 * @returns {Array} liste dédupliquée
 */
export function dedupCatalog(recipes) {
  // groups : tableau de groupes, chaque groupe = [{recipe, tokens, normalized}]
  const groups = []

  for (const recipe of recipes) {
    const normalized = normalizeRecipeName(recipe.title || '')
    const tokens = tokenizeForDedup(recipe.title || '')

    let added = false

    for (const group of groups) {
      // Passe 1 : correspondance exacte sur le nom normalisé
      if (group.some(g => g.normalized === normalized)) {
        group.push({ recipe, tokens, normalized })
        added = true
        break
      }

      // Passe 2 : quasi-doublon par Jaccard ≥ 0.8 (seulement si les deux
      // tableaux de tokens sont non vides pour éviter les faux positifs)
      if (
        tokens.length > 0 &&
        group.some(g => g.tokens.length > 0 && jaccardSimilarity(g.tokens, tokens) >= 0.8)
      ) {
        group.push({ recipe, tokens, normalized })
        added = true
        break
      }
    }

    if (!added) {
      groups.push([{ recipe, tokens, normalized }])
    }
  }

  // De chaque groupe, choisir le meilleur candidat : canonical_v3 > generated > classic.
  const priority = { canonical_v3: 3, generated: 2, classic: 1 }
  return groups.map(group => {
    return group.reduce((best, candidate) =>
      (priority[candidate.recipe.source] || 0) > (priority[best.recipe.source] || 0)
        ? candidate
        : best).recipe
  })
}
