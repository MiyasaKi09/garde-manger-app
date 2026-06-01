/**
 * Normalise un nom de recette pour le matching en cache.
 * "Poulet rôti aux herbes" → "poulet-roti-aux-herbes"
 */
export function normalizeRecipeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .replace(/\s+/g, '-')           // spaces → dashes
    .replace(/-+/g, '-')            // collapse dashes
    .replace(/^-|-$/g, '')          // trim dashes
}

/**
 * Nettoie un nom de recette avant normalisation pour le dedup.
 * Supprime les annotations de quantités, parenthèses, suffixes numériques.
 * "Rougail saucisses (350g, 120g saucisses)" → "Rougail saucisses"
 * "Tajine d'agneau aux légumes de printemps et riz basmati" reste tel quel (c'est une vraie variante)
 */
export function cleanRecipeName(name) {
  if (!name) return ''
  return name
    .replace(/\(.*?\)/g, '')              // strip parenthetical content
    .replace(/\d+[.,]?\d*\s*(g|kg|ml|mL|cl|L)\b/g, '') // strip quantities like 350g, 120g
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Nettoie un nom d'ingrédient pour la liste de courses.
 * Supprime les annotations "(pour le rougail)", "(burger)", "(minestrone)" etc.
 */
export function cleanIngredientName(name) {
  if (!name) return ''
  return name
    .replace(/\s*\((?:pour\s+(?:le|la|les|l')?\s*)?[^)]*\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
