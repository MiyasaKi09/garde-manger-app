/**
 * Normalise un nom de recette pour le matching en cache.
 * "Poulet rôti aux herbes" → "poulet-roti-aux-herbes"
 */
export function normalizeRecipeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .replace(/\s+/g, '-')           // spaces → dashes
    .replace(/-+/g, '-')            // collapse dashes
    .replace(/^-|-$/g, '')          // trim dashes
}
