import { authenticateRequest } from '@/lib/apiAuth'

async function searchPexels(name, apiKey) {
  const clean = name.replace(/\(.*?\)/g, '').replace(/\d+/g, '').trim()
  const query = `${clean} food ingredient`
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=square&size=small`,
      { headers: { Authorization: apiKey } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const photo = data.photos?.[0]
    if (!photo) return null
    return photo.src?.small || photo.src?.tiny || null
  } catch {
    return null
  }
}

export async function POST(req) {
  const PEXELS_KEY = process.env.PEXELS_API_KEY
  if (!PEXELS_KEY) {
    return Response.json({ error: 'Clé API Pexels manquante' }, { status: 400 })
  }

  const { supabase, user, error: authError } = await authenticateRequest(req)
  if (authError || !user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json()
  const { importId } = body

  if (!importId) {
    return Response.json({ error: 'importId requis' }, { status: 400 })
  }

  const { data: items, error } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('id, product_name')
    .eq('import_id', importId)
    .or('image_url.is.null,image_url.eq.')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!items?.length) return Response.json({ updated: 0, total: 0 })

  const seen = new Map()
  let updated = 0

  for (const item of items) {
    const key = item.product_name.toLowerCase().trim()

    let imageUrl
    if (seen.has(key)) {
      imageUrl = seen.get(key)
    } else {
      imageUrl = await searchPexels(item.product_name, PEXELS_KEY)
      seen.set(key, imageUrl)
      await new Promise(r => setTimeout(r, 200))
    }

    if (imageUrl) {
      const { error: upErr } = await supabase
        .from('nutrition_plan_shopping_items')
        .update({ image_url: imageUrl })
        .eq('id', item.id)
      if (!upErr) updated++
    }
  }

  return Response.json({ updated, total: items.length })
}
