/**
 * Parsing des chaînes de quantité des articles de courses en { qty, unit }.
 * Extrait de app/api/courses/add-to-stock/route.js pour être testable
 * (comportement strictement identique).
 */

// Nombre : entier/décimal (virgule ou point), fraction « 1/2 », mixte « 1 1/2 »
const NUM_RE = '(?:\\d+\\s+\\d+\\s*\\/\\s*\\d+|\\d+\\s*\\/\\s*\\d+|\\d+(?:[.,]\\d+)?)'
const UNIT_RE = '(?:kg|gr?|ml|cl|l|unit[ée]s?|pi[èe]ces?|bo[îi]tes?|paquets?|bouteilles?|sachets?|tranches?|gousses?|feuilles?)'

/** Parse « 1 1/2 », « 1/2 », « 1,5 », « 2 » → nombre. */
function parseNum(s) {
  const str = String(s).trim()
  const mixed = str.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixed) return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10)
  const frac = str.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10)
  return parseFloat(str.replace(',', '.'))
}

/**
 * Parse une chaîne de quantité en {qty, unit}.
 * Gère : « 600 g (400 g en stock) », « 1,5 kg », « 500g » (sans espace),
 * « 2 x 400 g » (→ 800 g), « 1/2 l », « 1 1/2 kg », « 3 · en stock ».
 */
export function parseQuantity(qtyStr) {
  if (!qtyStr) return { qty: 1, unit: 'unités' }

  // Retirer les annotations : « (400 g en stock) », « (stock non comparable) », « · en stock »
  const clean = String(qtyStr)
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/·.*$/, ' ')
    .trim()

  // « 2 x 400 g » / « 2×400g » → quantité totale
  const multi = clean.match(new RegExp(`^(${NUM_RE})\\s*[x×*]\\s*(${NUM_RE})\\s*(${UNIT_RE})?(?![a-zà-ü])`))
  if (multi) {
    const total = parseNum(multi[1]) * parseNum(multi[2])
    if (Number.isFinite(total) && total > 0) return normalizeUnit(total, multi[3] || 'unités')
  }

  // « 1,5 kg », « 500g », « 1/2 l »
  const m = clean.match(new RegExp(`^(${NUM_RE})\\s*(${UNIT_RE})(?![a-zà-ü])`))
  if (m) {
    const n = parseNum(m[1])
    if (Number.isFinite(n) && n > 0) return normalizeUnit(n, m[2])
  }

  // Nombre seul (entier, décimal ou fraction)
  const numOnly = clean.match(new RegExp(`^(${NUM_RE})`))
  if (numOnly) {
    const n = parseNum(numOnly[1])
    if (Number.isFinite(n) && n > 0) return { qty: n, unit: 'unités' }
  }

  return { qty: 1, unit: 'unités' }
}

export function normalizeUnit(qty, unit) {
  switch (unit) {
    case 'kg': return { qty: qty * 1000, unit: 'g' }
    case 'l':  return { qty: qty * 1000, unit: 'ml' }
    case 'cl': return { qty: qty * 10,   unit: 'ml' }
    case 'g':
    case 'gr': return { qty, unit: 'g' }
    case 'ml': return { qty, unit: 'ml' }
    default:   return { qty, unit: 'unités' }
  }
}
