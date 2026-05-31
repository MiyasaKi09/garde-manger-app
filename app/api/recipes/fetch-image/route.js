import { supabase } from '@/lib/supabaseClient'

async function searchPexels(recipeName, apiKey) {
  const clean = recipeName.replace(/\(.*?\)/g, '').replace(/\d+/g, '').trim()
  const query = `${clean} food dish`
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape&size=medium`,
      { headers: { Authorization: apiKey } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const photo = data.photos?.[0]
    if (!photo) return null
    return photo.src?.medium || photo.src?.small || null
  } catch {
    return null
  }
}

export async function POST(req) {
  const PEXELS_KEY = process.env.PEXELS_API_KEY
  if (!PEXELS_KEY) {
    return Response.json(
      { error: 'Clé API Pexels manquante. Ajoutez PEXELS_API_KEY dans votre fichier .env.local puis redémarrez le serveur.' },
      { status: 400 }
    )
  }

  if (!supabase) {
    return Response.json({ error: 'Supabase non configuré' }, { status: 500 })
  }

  const body = await req.json()
  const { recipeId, batch } = body

  if (batch) {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, name')
      .or('image_url.is.null,image_url.eq.')

    if (error) return Response.json({ error: error.message }, { status: 500 })
    if (!recipes?.length) return Response.json({ updated: 0, total: 0, message: 'Toutes les recettes ont déjà une image.' })

    let updated = 0
    for (const recipe of recipes) {
      const imageUrl = await searchPexels(recipe.name, PEXELS_KEY)
      if (imageUrl) {
        const { error: upErr } = await supabase
          .from('recipes')
          .update({ image_url: imageUrl })
          .eq('id', recipe.id)
        if (!upErr) updated++
      }
      await new Promise(r => setTimeout(r, 250))
    }

    return Response.json({ updated, total: recipes.length })
  }

  if (!recipeId) {
    return Response.json({ error: 'recipeId requis' }, { status: 400 })
  }

  const { data: recipe } = await supabase
    .from('recipes')
    .select('name')
    .eq('id', recipeId)
    .single()

  if (!recipe) return Response.json({ error: 'Recette introuvable' }, { status: 404 })

  const imageUrl = await searchPexels(recipe.name, PEXELS_KEY)
  if (imageUrl) {
    await supabase.from('recipes').update({ image_url: imageUrl }).eq('id', recipeId)
  }

  return Response.json({ imageUrl })
}
