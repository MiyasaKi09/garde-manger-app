import { authenticateRequest } from '@/lib/apiAuth'
import { guessIngredient } from '@/lib/ingredientImage'
import { searchPexelsCandidates } from '@/lib/pexels'
import Anthropic from '@anthropic-ai/sdk'

// POST /api/courses/item-images  { name, query? }
// Renvoie des photos candidates (Pexels) pour CE produit → correction « 1 clic ».
// La requête est générée par Claude (intelligente) sauf si `query` est fourni
// (l'utilisateur affine la recherche lui-même).
export const maxDuration = 20

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function cleanName(name) {
  return (name || '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\d+([.,]\d+)?\s*[a-zàâäéèêëïîôöùûüç]*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function smartQueryOne(name) {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 40,
      messages: [{
        role: 'user',
        content: `Donne UNIQUEMENT la meilleure requête de recherche d'image en ANGLAIS (2 à 4 mots, minuscules) pour trouver une belle photo de ce produit de courses tel qu'on l'achète : l'ingrédient CRU/BRUT seul, JAMAIS un plat cuisiné, et désambiguïsé (ex : « dinde » → raw turkey breast et pas le pays ; « semoule » → raw semolina grains). Produit : « ${name} ». Réponds uniquement par la requête, sans guillemets.`,
      }],
    })
    const text = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
    const q = (text.split('\n')[0] || '').replace(/["'`.]/g, '').trim()
    return q || null
  } catch {
    return null
  }
}

export async function POST(req) {
  const { user, error: authError } = await authenticateRequest(req)
  if (authError || !user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const name = (body.name || '').trim()
  const override = (body.query || '').trim()
  if (!name && !override) return Response.json({ candidates: [] })

  const PEXELS_KEY = process.env.PEXELS_API_KEY
  if (!PEXELS_KEY) return Response.json({ candidates: [], error: 'Clé Pexels manquante' })

  // requête : soit l'override utilisateur, soit Claude (puis repli mapping local)
  let query = override
  if (!query) query = (await smartQueryOne(name)) || guessIngredient(name) || cleanName(name)

  const candidates = await searchPexelsCandidates(query, PEXELS_KEY, 12)
  return Response.json({ candidates, query })
}
