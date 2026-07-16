const clean = (value) => typeof value === 'string' ? value.trim() : ''

export function sanitizeInventoryLabel(value) {
  return clean(value).slice(0, 240) || null
}

/**
 * Le nom visible doit rester la forme réellement achetée. L'identité canonique
 * sert au rapprochement du stock et des recettes, pas à écraser le libellé
 * précis (ex. « Morue salée sèche » → « cabillaud »).
 */
export function resolveInventoryDisplayName(item = {}) {
  const noteLabel = clean(item.notes).split('\n')[0]
  return clean(item.commercial_name)
    || clean(item.products?.name)
    || clean(item.archetypes?.name)
    || clean(item.cultivars?.cultivar_name)
    || clean(item.canonical_foods?.canonical_name)
    || noteLabel
    || clean(item.product_name)
    || 'Produit sans nom'
}
