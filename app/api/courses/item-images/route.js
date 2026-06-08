import { authenticateRequest } from '@/lib/apiAuth'
import { guessIngredient } from '@/lib/ingredientImage'
import { searchPexelsCandidates } from '@/lib/pexels'

// POST /api/courses/item-images  { name }
// Renvoie plusieurs photos candidates (Pexels) pour CE produit → correction « 1 clic ».
export const maxDuration = 20

function cleanName(name) {
  return (name || '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\d+([.,]\d+)?\s*[a-zàâäéèêëïîôöùûüç]*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req) {
  const { user, error: authError } = await authenticateRequest(req)
  if (authError || !user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const name = (body.name || '').trim()
  if (!name) return Response.json({ candidates: [] })

  const PEXELS_KEY = process.env.PEXELS_API_KEY
  if (!PEXELS_KEY) return Response.json({ candidates: [], error: 'Clé Pexels manquante' })

  const query = guessIngredient(name) || cleanName(name)
  const candidates = await searchPexelsCandidates(query, PEXELS_KEY, 9)
  return Response.json({ candidates, query })
}
