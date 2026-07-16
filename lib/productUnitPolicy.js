const UNIT_ALIASES = new Map([
  ['g', 'g'], ['gramme', 'g'], ['grammes', 'g'],
  ['kg', 'kg'], ['kilogramme', 'kg'], ['kilogrammes', 'kg'],
  ['ml', 'ml'], ['millilitre', 'ml'], ['millilitres', 'ml'],
  ['cl', 'cl'], ['centilitre', 'cl'], ['centilitres', 'cl'],
  ['l', 'l'], ['litre', 'l'], ['litres', 'l'],
  ['u', 'u'], ['unite', 'u'], ['unites', 'u'], ['piece', 'u'], ['pieces', 'u'],
])

const LIQUID_NAME = /\b(eau|lait|jus|huile|vinaigre|vin|biere|cidre|bouillon|sirop|rhum|cognac|porto|sauce liquide|creme liquide|babeurre)\b/i

function fold(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[œ]/gi, 'oe')
    .toLowerCase()
}

export function normalizeProductUnit(value) {
  return UNIT_ALIASES.get(fold(value).trim()) || null
}

export function normalizeProductMeta(product = {}) {
  const gramsPerUnit = Number(product.grams_per_unit ?? product.gramsPerUnit ?? product.unit_weight_grams)
  const density = Number(product.density_g_per_ml ?? product.density)
  return {
    ...product,
    primary_unit: normalizeProductUnit(product.primary_unit ?? product.unit) || null,
    grams_per_unit: Number.isFinite(gramsPerUnit) && gramsPerUnit >= 5 && gramsPerUnit <= 10000 ? gramsPerUnit : null,
    density_g_per_ml: Number.isFinite(density) && density >= 0.1 && density <= 3 ? density : null,
  }
}

export function getPreferredUnit(product = {}) {
  const meta = normalizeProductMeta(product)
  if (meta.primary_unit) return meta.primary_unit
  return LIQUID_NAME.test(fold(product.name ?? product.canonical_name ?? product.product_name)) ? 'ml' : 'g'
}

export function getProductUnitKind(product = {}) {
  const unit = getPreferredUnit(product)
  if (unit === 'u') return 'count'
  if (['ml', 'cl', 'l'].includes(unit)) return 'volume'
  return 'mass'
}

export function getQuantityStep(unit) {
  switch (normalizeProductUnit(unit)) {
    case 'kg': return 0.1
    case 'g': return 50
    case 'l': return 0.25
    case 'cl': return 10
    case 'ml': return 100
    case 'u': return 1
    default: return 1
  }
}
