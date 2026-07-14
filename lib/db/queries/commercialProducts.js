// lib/db/queries/commercialProducts.js (Server only)
// Réf. MYKO_DATA_FOUNDATION_V2 §3.9, §9.1. Lecture du catalogue commercial V2
// via la RPC contrôlée public.scan_commercial_product (le schéma `catalog` n'est
// pas exposé à l'API). Repli optionnel : lecture live Open Food Facts (non stockée).
import { normalizeOffProduct } from '@/scripts/data/lib/off-normalize.mjs'

const OFF_UA = 'MykoGardeManger/1.0 (scan; garde-manger-app)'

/**
 * Scanne un code-barres dans le catalogue commercial publié.
 * @returns {Promise<object>} { found, barcode, commercial_name?, brand?, food_form?, nutrition_per_100g?, ... }
 */
export async function scanBarcode(supabase, barcode) {
  const code = String(barcode || '').trim()
  if (!code) return { found: false, barcode: '' }
  const { data, error } = await supabase.rpc('scan_commercial_product', { p_barcode: code })
  if (error) throw new Error(error.message)
  return data ?? { found: false, barcode: code }
}

/**
 * Repli live Open Food Facts (produit non présent au catalogue). Ne stocke rien ;
 * renvoie un candidat normalisé signalé comme non fiable (source à contrôler).
 * @returns {Promise<object|null>}
 */
export async function fetchOffProductLive(barcode) {
  const code = String(barcode || '').trim()
  if (!code) return null
  const fields = 'code,product_name_fr,product_name,brands,quantity,product_quantity,packaging,categories_tags,nutriments'
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`
  let res
  try {
    res = await fetch(url, { headers: { 'User-Agent': OFF_UA } })
  } catch {
    return null
  }
  if (!res.ok) return null
  const body = await res.json()
  if (body.status !== 1 || !body.product) return null
  const norm = normalizeOffProduct(body.product)
  if (!norm) return null
  return {
    found: false,
    source: 'openfoodfacts_live',
    trust: 'untrusted', // candidat non validé — ne pas traiter comme vérité
    barcode: norm.barcode,
    commercial_name: norm.commercial_name,
    brand: norm.brand,
    package_quantity: norm.package_quantity,
    package_unit: norm.package_unit,
    packaging_type: norm.packaging_type,
    label_nutriments: norm.label_nutriments,
  }
}
