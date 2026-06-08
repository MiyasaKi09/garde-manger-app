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

async function searchPexels(query, apiKey) {
  if (!query) return null
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: apiKey }, signal: AbortSignal.timeout(6500) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const photo = data.photos?.[0]
    if (!photo) return null
    return photo.src?.large || photo.src?.medium || photo.src?.small || null
  } catch {
    return null
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
  const imageByName = {}
  await runPool(uniqueNames, 4, async (name) => {
    const query = guessIngredient(name) || cleanName(name)
    imageByName[name.toLowerCase()] = await searchPexels(query, PEXELS_KEY)
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
