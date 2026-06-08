// Recherche d'images Pexels + score de pertinence sur la description (alt).
// Utilisé par la correction « 1 clic » (propose plusieurs candidats à choisir).

const MODIFIERS = new Set(['raw', 'fresh', 'meat', 'fillet', 'sliced', 'food', 'breast', 'whole', 'block', 'wedge', 'bunch', 'leaves'])
const GOOD = ['food', 'fresh', 'raw', 'ingredient', 'vegetable', 'vegetables', 'fruit', 'fruits', 'organic', 'closeup', 'close-up', 'wooden', 'market', 'harvest', 'bunch', 'whole', 'isolated']
const DISH = ['cooked', 'recipe', 'pasta', 'spaghetti', 'noodles', 'pizza', 'soup', 'stew', 'curry', 'sandwich', 'burger', 'cake', 'dessert', 'pancake', 'casserole', 'fried', 'lasagna', 'risotto', 'served', 'sauce on']
const BAD = ['mountain', 'landscape', 'scenery', 'skyline', 'cityscape', 'city', 'town', 'village', 'building', 'architecture', 'street', 'road', 'highway', 'beach', 'seaside', 'ocean', 'desert', 'flag', 'map', 'airport', 'aircraft', 'vehicle', 'portrait', 'selfie', 'woman', 'man', 'people', 'person', 'child', 'baby', 'crowd', 'grazing', 'pasture', 'barn', 'meadow', 'farm', 'hen', 'rooster', 'sunset']

export function scoreAlt(alt, subjectTerms) {
  const a = (alt || '').toLowerCase()
  if (!a) return 0
  let s = 0
  for (const t of subjectTerms) if (a.includes(t)) s += 3
  for (const g of GOOD) if (a.includes(g)) s += 1
  for (const d of DISH) if (a.includes(d)) s -= 3
  for (const b of BAD) if (a.includes(b)) s -= 5
  return s
}

// Renvoie jusqu'à `limit` URLs candidates, triées par pertinence (assez large
// pour offrir un choix : on exclut seulement le franchement hors-sujet).
export async function searchPexelsCandidates(query, apiKey, limit = 9) {
  if (!query || !apiKey) return []
  const subjectTerms = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !MODIFIERS.has(w))
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=24&orientation=landscape`,
      { headers: { Authorization: apiKey }, signal: AbortSignal.timeout(6500) }
    )
    if (!res.ok) return []
    const data = await res.json()
    const photos = data.photos || []
    return photos
      .map((p) => ({ url: p.src?.medium || p.src?.large || p.src?.small || null, score: scoreAlt(p.alt, subjectTerms) }))
      .filter((x) => x.url && x.score > -3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.url)
  } catch {
    return []
  }
}
