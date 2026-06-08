import { authenticateRequest } from '@/lib/apiAuth'

// Open Food Facts demande un User-Agent identifiant l'app.
const OFF_UA = 'Myko-GardeManger/1.0 (https://garde-manger-app.vercel.app)'

// Les recherches OFF sont lentes → on autorise jusqu'à 60s (plan Vercel le permettant).
export const maxDuration = 60

// plage des diacritiques combinants U+0300–U+036F (construite en ASCII pur)
const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g')

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// petit "stem" : pluriels FR courants
const stem = (w) => w.replace(/(eaux|aux|es|s|x)$/, '')

const STOP = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'un', 'une', 'et', 'en', 'a',
  'bio', 'frais', 'fraiche', 'fraiches', 'nature', 'maison', 'tranche', 'tranches', 'pour',
])

function keywords(name) {
  // enlève le contenu entre parenthèses + quantités/unités
  const cleaned = (name || '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\d+([.,]\d+)?\s*(g|kg|ml|cl|l|x|tr|pcs?|pieces?|pavés?|boites?|sachets?|tetes?)?/gi, ' ')
  return normalize(cleaned).split(' ').filter((w) => w.length > 2 && !STOP.has(w))
}

async function searchOpenFoodFacts(name) {
  const words = keywords(name)
  const query = words.join(' ') || normalize(name)
  if (!query) return null

  const url =
    `https://fr.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=16` +
    `&fields=product_name,product_name_fr,image_front_small_url,image_small_url,image_front_url`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': OFF_UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(6500),
    })
    if (!res.ok) return null
    const data = await res.json()
    const products = data.products || []

    const wantStems = words.map(stem).filter(Boolean)
    let best = null
    let bestScore = 0

    for (const p of products) {
      const img = p.image_front_small_url || p.image_small_url || p.image_front_url
      if (!img) continue
      const pname = normalize(p.product_name_fr || p.product_name || '')
      if (!pname) continue
      const pstems = new Set(pname.split(' ').map(stem))

      let score = 0
      for (const w of wantStems) if (pstems.has(w)) score += 1
      // bonus si l'aliment principal (1er mot-clé) est présent
      if (wantStems[0] && pstems.has(wantStems[0])) score += 0.5
      // léger malus si le nom produit est très long (souvent un dérivé/plat transformé)
      if (pname.split(' ').length > 6) score -= 0.25

      if (score > bestScore) {
        bestScore = score
        best = img
      }
    }

    // il faut au moins un mot-clé en commun, sinon on ne met rien (→ vignette monogramme)
    return bestScore >= 1 ? best : null
  } catch {
    return null
  }
}

// exécute `worker` sur `list` avec une concurrence bornée
async function runPool(list, concurrency, worker) {
  let idx = 0
  const runners = Array.from({ length: Math.min(concurrency, list.length) }, async () => {
    while (idx < list.length) {
      const i = idx++
      await worker(list[i])
    }
  })
  await Promise.all(runners)
}

export async function POST(req) {
  const { supabase, user, error: authError } = await authenticateRequest(req)
  if (authError || !user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { importId, replace } = body
  if (!importId) {
    return Response.json({ error: 'importId requis' }, { status: 400 })
  }

  // mode "fill" : seulement les articles sans image. mode "replace" : tous (on corrige l'existant).
  let q = supabase
    .from('nutrition_plan_shopping_items')
    .select('id, product_name, image_url')
    .eq('import_id', importId)
  if (!replace) q = q.or('image_url.is.null,image_url.eq.')

  const { data: items, error } = await q
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!items?.length) return Response.json({ updated: 0, total: 0, cleared: 0, source: 'openfoodfacts' })

  // 1 recherche par nom de produit unique
  const uniqueNames = [...new Set(items.map((i) => (i.product_name || '').trim()).filter(Boolean))]
  const imageByName = {}
  await runPool(uniqueNames, 4, async (name) => {
    imageByName[name.toLowerCase()] = await searchOpenFoodFacts(name)
  })

  // regroupe les mises à jour (peu de requêtes Supabase)
  const idsByImage = new Map()
  const clearIds = []
  for (const item of items) {
    const img = imageByName[(item.product_name || '').trim().toLowerCase()]
    if (img) {
      if (!idsByImage.has(img)) idsByImage.set(img, [])
      idsByImage.get(img).push(item.id)
    } else if (replace && item.image_url) {
      clearIds.push(item.id) // efface l'ancienne image hors-sujet → repli monogramme
    }
  }

  let updated = 0
  let cleared = 0
  for (const [img, ids] of idsByImage) {
    const { error: upErr } = await supabase
      .from('nutrition_plan_shopping_items')
      .update({ image_url: img })
      .in('id', ids)
    if (!upErr) updated += ids.length
  }
  if (clearIds.length) {
    const { error: clErr } = await supabase
      .from('nutrition_plan_shopping_items')
      .update({ image_url: null })
      .in('id', clearIds)
    if (!clErr) cleared = clearIds.length
  }

  return Response.json({ updated, total: items.length, cleared, source: 'openfoodfacts' })
}
