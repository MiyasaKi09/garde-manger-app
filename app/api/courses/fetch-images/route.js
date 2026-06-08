import { authenticateRequest } from '@/lib/apiAuth'
import { guessIngredient } from '@/lib/ingredientImage'

// Pexels (photo lifestyle, jolie) interrogé avec l'INGRÉDIENT ANGLAIS propre
// (via le mapping FR→EN) au lieu du nom de produit brut → bon sujet + beau style.
export const maxDuration = 60

function cleanName(name) {
  return (name || '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\d+([.,]\d+)?\s*[a-zàâäéèêëïîôöùûüç]*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// mots-modificateurs (pas le sujet), mots « contexte alimentaire » (+), mots hors-sujet (--)
const MODIFIERS = new Set(['raw', 'fresh', 'meat', 'fillet', 'sliced', 'food', 'breast'])
const GOOD = ['food', 'fresh', 'raw', 'meat', 'vegetable', 'fruit', 'ingredient', 'cooking', 'cuisine', 'dish', 'meal', 'plate', 'bowl', 'sliced', 'fillet', 'grilled', 'seafood', 'organic', 'closeup', 'close-up', 'cutting board', 'wooden']
const BAD = ['mountain', 'landscape', 'scenery', 'skyline', 'cityscape', 'city', 'town', 'village', 'building', 'architecture', 'street', 'road', 'highway', 'beach', 'seaside', 'ocean', 'desert', 'flag', 'map', 'airport', 'aircraft', 'vehicle', 'portrait', 'selfie', 'woman', 'man', 'people', 'person', 'child', 'baby', 'crowd', 'grazing', 'pasture', 'barn', 'grass', 'meadow', 'field', 'farm', 'hen', 'rooster', 'chick ', 'sunset', 'sky']

function scoreAlt(alt, subjectTerms) {
  const a = (alt || '').toLowerCase()
  if (!a) return 0
  let s = 0
  for (const t of subjectTerms) if (a.includes(t)) s += 3
  for (const g of GOOD) if (a.includes(g)) s += 1
  for (const b of BAD) if (a.includes(b)) s -= 5
  return s
}

async function searchPexelsList(query, apiKey) {
  if (!query) return []
  const subjectTerms = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !MODIFIERS.has(w))
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: apiKey }, signal: AbortSignal.timeout(6500) }
    )
    if (!res.ok) return []
    const data = await res.json()
    const photos = data.photos || []
    // ne garde que les photos dont la description colle (score >= 1), triées par pertinence
    return photos
      .map((p) => ({ url: p.src?.large || p.src?.medium || p.src?.small || null, score: scoreAlt(p.alt, subjectTerms) }))
      .filter((x) => x.url && x.score >= 1)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.url)
  } catch {
    return []
  }
}

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
  const { importId, replace, clear } = body
  if (!importId) {
    return Response.json({ error: 'importId requis' }, { status: 400 })
  }

  // mode "clear" : retire toutes les photos → repli icône
  if (clear) {
    const { data: cleared, error: clErr } = await supabase
      .from('nutrition_plan_shopping_items')
      .update({ image_url: null })
      .eq('import_id', importId)
      .not('image_url', 'is', null)
      .select('id')
    if (clErr) return Response.json({ error: clErr.message }, { status: 500 })
    return Response.json({ cleared: cleared?.length || 0, clearedOnly: true })
  }

  const PEXELS_KEY = process.env.PEXELS_API_KEY
  if (!PEXELS_KEY) {
    return Response.json({ error: 'Clé API Pexels manquante' }, { status: 400 })
  }

  // mode "fill" : seulement les articles sans image. "replace" : tous (corrige l'existant).
  let q = supabase
    .from('nutrition_plan_shopping_items')
    .select('id, product_name, image_url')
    .eq('import_id', importId)
  if (!replace) q = q.or('image_url.is.null,image_url.eq.')

  const { data: items, error } = await q
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!items?.length) return Response.json({ updated: 0, total: 0, cleared: 0, source: 'pexels' })

  // 1 recherche par nom de produit unique ; requête = ingrédient EN propre
  const uniqueNames = [...new Set(items.map((i) => (i.product_name || '').trim()).filter(Boolean))]
  // regroupe les produits par requête (ex. toutes les variétés de pomme de terre)
  // pour leur donner des photos DIFFÉRENTES (sinon image identique partout)
  const byQuery = new Map()
  for (const name of uniqueNames) {
    const query = guessIngredient(name) || cleanName(name)
    if (!byQuery.has(query)) byQuery.set(query, [])
    byQuery.get(query).push(name)
  }
  const imageByName = {}
  await runPool([...byQuery.keys()], 4, async (query) => {
    const urls = await searchPexelsList(query, PEXELS_KEY)
    const names = byQuery.get(query)
    names.forEach((nm, i) => {
      imageByName[nm.toLowerCase()] = urls.length ? urls[i % urls.length] : null
    })
  })

  // mises à jour groupées
  const idsByImage = new Map()
  const clearIds = []
  for (const item of items) {
    const img = imageByName[(item.product_name || '').trim().toLowerCase()]
    if (img) {
      if (!idsByImage.has(img)) idsByImage.set(img, [])
      idsByImage.get(img).push(item.id)
    } else if (replace && item.image_url) {
      clearIds.push(item.id)
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

  return Response.json({ updated, total: items.length, cleared, source: 'pexels' })
}
