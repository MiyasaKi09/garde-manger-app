import { authenticateRequest } from '@/lib/apiAuth'
import { guessIngredient } from '@/lib/ingredientImage'
import Anthropic from '@anthropic-ai/sdk'

// Pexels (photo lifestyle) interrogé avec une requête INTELLIGENTE :
// Claude génère, pour chaque produit FR, la meilleure requête anglaise
// (ingrédient cru, pas un plat ; désambiguïsé). Repli sur le mapping local.
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function cleanName(name) {
  return (name || '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\d+([.,]\d+)?\s*[a-zàâäéèêëïîôöùûüç]*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Claude : produit FR → requête image anglaise précise ──
async function smartQueries(productNames) {
  if (!process.env.ANTHROPIC_API_KEY || !productNames.length) return {}
  const list = productNames.map((n, i) => `${i + 1}. ${n}`).join('\n')
  const prompt = `Tu aides à illustrer une liste de courses française avec de jolies photos.
Pour CHAQUE produit ci-dessous, donne la meilleure REQUÊTE de recherche d'image en ANGLAIS (2 à 4 mots, minuscules) pour trouver une belle photo de CE produit/ingrédient tel qu'on l'achète au marché ou en magasin — l'ingrédient CRU/BRUT seul, JAMAIS un plat cuisiné, une recette ou une assiette dressée.

Règles impératives :
- ingrédient seul, pas un plat : « Parmesan AOP » → "parmesan cheese wedge" (PAS des pâtes) ; « Basilic » → "fresh basil leaves" (PAS un plat) ; « Crème fraîche épaisse » → "creme fraiche bowl".
- désambiguïse : « dinde » → "raw turkey breast" (PAS le pays Turquie) ; « poulet » → "raw chicken breast" (PAS une poule vivante) ; « bœuf » → "raw beef steak".
- spécificité utile : « Jambon de Bayonne » → "cured ham slices" ; « Mâche » → "lambs lettuce" ; « Champignons shiitaké » → "shiitake mushrooms".
- produits transformés/conserves : illustre l'ingrédient principal cru (« Tomates concassées (boîte) » → "fresh tomatoes").

Réponds UNIQUEMENT par un objet JSON, clés = numéros (en chaînes), valeurs = requêtes. Aucun autre texte.

Produits :
${list}`
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return {}
    const obj = JSON.parse(m[0])
    const out = {}
    productNames.forEach((n, i) => {
      const q = obj[String(i + 1)]
      if (q && typeof q === 'string') out[n] = q.trim()
    })
    return out
  } catch {
    return {}
  }
}

// ── Filtre de pertinence sur la description (alt) Pexels ──
const MODIFIERS = new Set(['raw', 'fresh', 'meat', 'fillet', 'sliced', 'food', 'breast', 'whole', 'block', 'wedge', 'bunch', 'leaves'])
const GOOD = ['food', 'fresh', 'raw', 'ingredient', 'vegetable', 'vegetables', 'fruit', 'fruits', 'organic', 'closeup', 'close-up', 'wooden', 'market', 'harvest', 'bunch', 'whole', 'isolated']
const DISH = ['cooked', 'recipe', 'pasta', 'spaghetti', 'noodles', 'pizza', 'soup', 'stew', 'curry', 'sandwich', 'burger', 'cake', 'dessert', 'pancake', 'casserole', 'fried', 'lasagna', 'risotto', 'served', 'sauce on']
const BAD = ['mountain', 'landscape', 'scenery', 'skyline', 'cityscape', 'city', 'town', 'village', 'building', 'architecture', 'street', 'road', 'highway', 'beach', 'seaside', 'ocean', 'desert', 'flag', 'map', 'airport', 'aircraft', 'vehicle', 'portrait', 'selfie', 'woman', 'man', 'people', 'person', 'child', 'baby', 'crowd', 'grazing', 'pasture', 'barn', 'meadow', 'farm', 'hen', 'rooster', 'sunset']

function scoreAlt(alt, subjectTerms) {
  const a = (alt || '').toLowerCase()
  if (!a) return 0
  let s = 0
  for (const t of subjectTerms) if (a.includes(t)) s += 3
  for (const g of GOOD) if (a.includes(g)) s += 1
  for (const d of DISH) if (a.includes(d)) s -= 3
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

  let q = supabase
    .from('nutrition_plan_shopping_items')
    .select('id, product_name, image_url')
    .eq('import_id', importId)
  if (!replace) q = q.or('image_url.is.null,image_url.eq.')

  const { data: items, error } = await q
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!items?.length) return Response.json({ updated: 0, total: 0, cleared: 0, source: 'pexels' })

  const uniqueNames = [...new Set(items.map((i) => (i.product_name || '').trim()).filter(Boolean))]

  // Claude génère les requêtes (intelligent) ; repli mapping local puis nom nettoyé
  const claudeQ = await smartQueries(uniqueNames)

  // regroupe par requête pour distribuer des photos DIFFÉRENTES aux produits identiques
  const byQuery = new Map()
  for (const name of uniqueNames) {
    const query = claudeQ[name] || guessIngredient(name) || cleanName(name)
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

  return Response.json({ updated, total: items.length, cleared, source: 'pexels+claude' })
}
