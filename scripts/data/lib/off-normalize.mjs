/**
 * Fabrique V2 — normalisation des produits Open Food Facts (PURE).
 * Réf. MYKO_DATA_FOUNDATION_V2 §3.9, §5.1 (OFF = produits commerciaux uniquement).
 * Testé par tests/data/offNormalize.test.js.
 */
import { normalizeName } from './normalize.mjs'

const UNIT_MAP = {
  g: 'g', gr: 'g', gramme: 'g', grammes: 'g', kg: 'kg', mg: 'mg',
  ml: 'ml', cl: 'cl', l: 'l', litre: 'l', litres: 'l', cc: 'cl',
  piece: 'u', pieces: 'u', 'pièce': 'u', 'pièces': 'u', unite: 'u', unites: 'u',
}

/**
 * Parse une chaîne de quantité OFF ("360 g", "1 L", "6 x 125 g", "50 cl").
 * @returns {{ package_quantity:number|null, package_unit:string|null }}
 */
export function parseQuantityString(qty, productQuantityGrams) {
  const s = String(qty ?? '').trim().toLowerCase()
  // "6 x 125 g" → 750 g
  const mult = s.match(/^(\d+)\s*[x×]\s*([\d.,]+)\s*([a-zàéè]+)/)
  if (mult) {
    const n = Number(mult[1])
    const each = Number(mult[2].replace(',', '.'))
    const unit = UNIT_MAP[mult[3]] || null
    if (Number.isFinite(n) && Number.isFinite(each) && unit) {
      return { package_quantity: Math.round(n * each * 100) / 100, package_unit: unit }
    }
  }
  const single = s.match(/([\d.,]+)\s*([a-zàéè]+)/)
  if (single) {
    const n = Number(single[1].replace(',', '.'))
    const unit = UNIT_MAP[single[2]] || null
    if (Number.isFinite(n) && unit) return { package_quantity: n, package_unit: unit }
  }
  // Repli : product_quantity numérique (grammes) fourni par OFF.
  const g = Number(productQuantityGrams)
  if (Number.isFinite(g) && g > 0) return { package_quantity: g, package_unit: 'g' }
  return { package_quantity: null, package_unit: null }
}

/** Type d'emballage principal depuis la chaîne `packaging` OFF. */
export function parsePackagingType(packaging) {
  const s = String(packaging ?? '').toLowerCase()
  if (!s) return null
  const rules = [
    [/bocal|verre|jar|glass/, 'verre'],
    [/boîte|boite|conserve|métal|metal|can|aluminium/, 'metal'],
    [/brique|carton|tetra/, 'carton'],
    [/sachet|film|flowpack/, 'sachet'],
    [/bouteille|bottle/, 'bouteille'],
    [/barquette|tray/, 'barquette'],
    [/plastique|plastic|pot/, 'plastique'],
  ]
  for (const [re, type] of rules) if (re.test(s)) return type
  return null
}

/**
 * Extrait un enregistrement produit normalisé d'un objet produit OFF brut.
 * @returns {object|null} null si invalide (pas de code-barres ou nom).
 */
export function normalizeOffProduct(p) {
  if (!p) return null
  const barcode = String(p.code ?? '').trim()
  const name = String(p.product_name_fr || p.product_name || '').trim()
  if (!barcode || !name) return null

  const { package_quantity, package_unit } = parseQuantityString(p.quantity, p.product_quantity)
  const brand = String(p.brands ?? '').split(',')[0].trim() || null
  const n = p.nutriments || {}
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

  return {
    barcode,
    commercial_name: name,
    name_normalized: normalizeName(name),
    brand,
    package_quantity,
    package_unit,
    packaging_type: parsePackagingType(p.packaging),
    categories_tags: Array.isArray(p.categories_tags) ? p.categories_tags : [],
    // valeurs d'étiquette (pour 100 g/ml) — indicatif, non source de vérité générique
    label_nutriments: {
      energy_kcal: num(n['energy-kcal_100g']),
      protein_g: num(n['proteins_100g']),
      carbohydrate_g: num(n['carbohydrates_100g']),
      fat_g: num(n['fat_100g']),
      saturated_fat_g: num(n['saturated-fat_100g']),
      sugars_g: num(n['sugars_100g']),
      salt_g: num(n['salt_100g']),
      fiber_g: num(n['fiber_100g']),
    },
  }
}
