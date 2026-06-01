/**
 * Résolution intelligente d'ingrédients : nom → canonical_food / archetype.
 * Utilisé lors de la construction de la liste de courses ET au cochage (add-to-stock).
 *
 * Stratégie :
 *   1. Match exact (case-insensitive)
 *   2. Canonical_foods en priorité (noms génériques : "Pomme", "Poulet")
 *   3. Archetypes en fallback (noms spécifiques : "Pomme Pink Lady")
 *   4. Scoring par pertinence : exact > starts-with > mot isolé > substring
 *   5. Noms courts préférés (plus proches de l'ingrédient de base)
 */

const STOP_WORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'au', 'aux', 'en',
  'pour', 'avec', 'sans', 'un', 'une', 'et', 'ou',
])

function extractWords(text) {
  return text
    .trim()
    .toLowerCase()
    .split(/[\s/,()]+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

/**
 * Résout un nom d'ingrédient vers un canonical_food_id et/ou archetype_id.
 * @returns {{ canonicalFoodId: number|null, archetypeId: number|null, matchedName: string|null }}
 */
export async function matchIngredient(supabase, name) {
  if (!name?.trim()) return { canonicalFoodId: null, archetypeId: null, matchedName: null }

  const normalized = name.trim().toLowerCase()
  const words = extractWords(normalized)
  if (!words.length) return { canonicalFoodId: null, archetypeId: null, matchedName: null }

  // 1. Exact match on canonical_foods
  const { data: exactCf } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name')
    .ilike('canonical_name', normalized)
    .limit(1)
  if (exactCf?.length) {
    return { canonicalFoodId: exactCf[0].id, archetypeId: null, matchedName: exactCf[0].canonical_name }
  }

  // 2. Exact match on archetypes
  const { data: exactArch } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id')
    .ilike('name', normalized)
    .limit(1)
  if (exactArch?.length) {
    return {
      canonicalFoodId: exactArch[0].canonical_food_id ?? null,
      archetypeId: exactArch[0].id,
      matchedName: exactArch[0].name,
    }
  }

  // 3. Fuzzy: canonical_foods by first significant word
  const mainWord = words[0]
  const { data: cfMatches } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name')
    .ilike('canonical_name', `%${mainWord}%`)
    .limit(15)

  if (cfMatches?.length) {
    const best = scoreBestMatch(cfMatches, 'canonical_name', mainWord, normalized)
    if (best) {
      return { canonicalFoodId: best.id, archetypeId: null, matchedName: best.canonical_name }
    }
  }

  // 4. Fuzzy: archetypes by first significant word
  const { data: archMatches } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id')
    .ilike('name', `%${mainWord}%`)
    .limit(15)

  if (archMatches?.length) {
    const best = scoreBestMatch(archMatches, 'name', mainWord, normalized)
    if (best) {
      return {
        canonicalFoodId: best.canonical_food_id ?? null,
        archetypeId: best.id,
        matchedName: best.name,
      }
    }
  }

  // 5. Try remaining significant words if the first didn't match
  for (let i = 1; i < Math.min(words.length, 3); i++) {
    const word = words[i]
    const { data: cfs } = await supabase
      .from('canonical_foods')
      .select('id, canonical_name')
      .ilike('canonical_name', `%${word}%`)
      .limit(10)
    if (cfs?.length) {
      const best = scoreBestMatch(cfs, 'canonical_name', word, normalized)
      if (best) {
        return { canonicalFoodId: best.id, archetypeId: null, matchedName: best.canonical_name }
      }
    }
  }

  return { canonicalFoodId: null, archetypeId: null, matchedName: null }
}

/**
 * Résout un lot d'ingrédients en batch (avec cache interne pour éviter les doublons).
 * @param {Array<{name: string}>} ingredients
 * @returns {Map<string, {canonicalFoodId, archetypeId, matchedName}>}
 */
export async function batchMatchIngredients(supabase, ingredients) {
  const cache = new Map()
  const results = new Map()

  for (const ing of ingredients) {
    const key = (ing.name || '').trim().toLowerCase()
    if (!key) continue
    if (cache.has(key)) {
      results.set(ing.name, cache.get(key))
      continue
    }
    const match = await matchIngredient(supabase, ing.name)
    cache.set(key, match)
    results.set(ing.name, match)
  }

  return results
}

/**
 * Score et retourne le meilleur candidat, ou null si aucun n'est assez bon.
 */
function scoreBestMatch(candidates, nameField, searchWord, fullNormalized) {
  const scored = candidates.map(item => {
    const itemName = (item[nameField] || '').toLowerCase()
    const itemWords = itemName.split(/\s+/)

    let score = 0

    if (itemName === fullNormalized) score = 100
    else if (itemName.startsWith(searchWord)) score = 80
    else if (itemWords.some(w => w === searchWord || w === searchWord + 's' || searchWord === w + 's')) score = 60
    else if (itemWords.some(w => w.startsWith(searchWord))) score = 40
    else score = 10

    // Shorter names = closer to the base ingredient
    score -= itemName.length * 0.5

    return { ...item, _score: score }
  })

  scored.sort((a, b) => b._score - a._score)
  if (scored[0]._score < 20) return null
  return scored[0]
}
