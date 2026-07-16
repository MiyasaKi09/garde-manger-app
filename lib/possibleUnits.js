import { getPreferredUnit, getProductUnitKind, normalizeProductMeta } from './productUnitPolicy'

const ALL_UNITS = [
  { value: 'g', label: 'Grammes' },
  { value: 'kg', label: 'Kilogrammes' },
  { value: 'ml', label: 'Millilitres' },
  { value: 'cl', label: 'Centilitres' },
  { value: 'l', label: 'Litres' },
  { value: 'u', label: 'Pièce(s)' },
]

/** Returns only units that can be converted without guessing. */
export function getPossibleUnitsForProduct(productMeta = {}) {
  const meta = normalizeProductMeta(productMeta)
  const kind = getProductUnitKind(meta)
  const preferred = getPreferredUnit(meta)
  const possible = new Set()

  if (kind === 'count') {
    possible.add('u')
    if (meta.grams_per_unit) possible.add('g').add('kg')
  } else if (kind === 'volume') {
    possible.add('ml').add('cl').add('l')
    if (meta.density_g_per_ml) possible.add('g').add('kg')
  } else {
    possible.add('g').add('kg')
  }

  possible.add(preferred)
  return ALL_UNITS.filter((unit) => possible.has(unit.value))
}
