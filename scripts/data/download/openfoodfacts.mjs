/**
 * Fabrique V2 — client Open Food Facts (seed produits commerciaux).
 * Réf. MYKO_DATA_FOUNDATION_V2 §5.1 (OFF = produits commerciaux, pas base générique)
 * et §3.9 (catalog.commercial_products).
 *
 * Récupère les produits FRANÇAIS populaires de quelques catégories qui recoupent
 * les concepts publiés en F0, les normalise, et écrit un artefact candidat.
 * Bounded seed (pas de dump massif) : l'import massif OFF passerait par les exports.
 *
 * Usage : node scripts/data/download/openfoodfacts.mjs
 * Sortie : scripts/data/out/commercial-seed.json
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeOffProduct } from '../lib/off-normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'out')

// Catégories OFF (tag en:) recoupant des concepts F0. N produits populaires FR chacune.
const CATEGORIES = [
  'mustards', 'basmati-rice', 'olive-oils', 'lardons', 'raw-hams', 'cashew-nuts',
  'balsamic-vinegars', 'chickpeas', 'red-kidney-beans', 'green-lentils', 'quinoa',
  'ground-ginger', 'chicken-eggs', 'paprika-powder', 'white-beans',
]
const PER_CATEGORY = 3
const FIELDS = 'code,product_name_fr,product_name,brands,quantity,product_quantity,packaging,categories_tags,nutriments'
const UA = 'MykoGardeManger/1.0 (data-factory; contact via github.com/MiyasaKi09/garde-manger-app)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchCategory(cat) {
  const url = `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=${encodeURIComponent(cat)}` +
    `&countries_tags_en=france&sort_by=unique_scans_n&page_size=${PER_CATEGORY}&fields=${FIELDS}`
  // OFF renvoie parfois 503/429 (limitation) : retry avec backoff.
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA } })
    } catch (e) {
      if (attempt === 4) { console.error(`  ${cat}: fetch error ${e.message}`); return [] }
      await sleep(1500 * attempt); continue
    }
    if (res.ok) {
      const data = await res.json()
      return (data.products || []).map((p) => ({ ...p, _seed_category: cat }))
    }
    if ((res.status === 503 || res.status === 429) && attempt < 4) { await sleep(1500 * attempt); continue }
    console.error(`  ${cat}: HTTP ${res.status}`); return []
  }
  return []
}

async function main() {
  const seen = new Set()
  const products = []
  for (const cat of CATEGORIES) {
    const raw = await fetchCategory(cat)
    for (const p of raw) {
      const norm = normalizeOffProduct(p)
      if (!norm) continue
      if (seen.has(norm.barcode)) continue
      seen.add(norm.barcode)
      products.push({ ...norm, seed_category: cat })
    }
    console.error(`  ${cat}: +${raw.length}`)
    await sleep(800) // courtoisie envers l'API OFF entre catégories
  }

  const withQty = products.filter((p) => p.package_quantity != null).length
  const release = {
    source: { code: 'openfoodfacts', license: 'odbl-1.0' },
    fetched_categories: CATEGORIES,
    products,
  }
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, 'commercial-seed.json'), JSON.stringify(release, null, 2))
  console.log(JSON.stringify({ products: products.length, with_quantity: withQty, categories: CATEGORIES.length }, null, 2))
}

main().catch((e) => { console.error(e.message); process.exit(1) })
