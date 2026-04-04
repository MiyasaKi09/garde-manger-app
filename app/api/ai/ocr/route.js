import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * POST /api/ai/ocr
 * Extracts grocery items from a screenshot using Claude Vision.
 * Accepts: FormData with "image" file, OR JSON { imageBase64: "data:image/..." }
 */
export async function POST(request) {
  const { user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let imageBase64, mediaType

  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('image')
    if (!file) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    imageBase64 = buffer.toString('base64')
    mediaType = file.type || 'image/jpeg'
  } else {
    const body = await request.json()
    if (!body.imageBase64) {
      return NextResponse.json({ error: 'imageBase64 requis' }, { status: 400 })
    }
    // Strip data URL prefix if present
    const match = body.imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
    if (match) {
      mediaType = match[1]
      imageBase64 = match[2]
    } else {
      mediaType = 'image/jpeg'
      imageBase64 = body.imageBase64
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Tu es un assistant d'extraction de produits alimentaires. Analyse cette image (screenshot de commande en ligne, liste de notes, ou liste de courses).

Extrais TOUS les produits alimentaires visibles. Pour chaque produit, déduis :
- name : nom du produit (en français, normalisé)
- quantity : quantité numérique (1 si pas clair)
- unit : unité (g, kg, ml, L, pièce(s), sachet(s), boîte(s), bouteille(s), etc.)
- category : une parmi [Protéines, Légumes, Fruits, Crémerie, Féculents, Épicerie, Surgelés, Condiments, Boissons, Sucré, Herbes, Autre]
- confidence : ta confiance de 0 à 1

Retourne UNIQUEMENT un JSON valide, sans texte autour :
{"items": [{"name": "...", "quantity": 1, "unit": "...", "category": "...", "confidence": 0.95}]}`
            }
          ]
        }
      ]
    })

    const text = response.content?.[0]?.text || ''

    // Extract JSON from response
    let items = []
    try {
      // Try direct parse
      const parsed = JSON.parse(text)
      items = parsed.items || []
    } catch {
      // Try extracting JSON block
      const jsonMatch = text.match(/\{[\s\S]*"items"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        items = parsed.items || []
      }
    }

    return NextResponse.json({ items, raw: text })
  } catch (err) {
    console.error('[OCR] Error:', err)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse de l\'image' },
      { status: 500 }
    )
  }
}
