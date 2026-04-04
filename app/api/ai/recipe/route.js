import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'
import { buildAiContext, formatContextForPrompt } from '@/lib/aiContextBuilder'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * POST /api/ai/recipe
 * Returns a recipe for a meal description.
 * 1. Checks generated_recipes cache first
 * 2. If not found, generates via Claude and saves to cache
 *
 * Accepts: { description: "Poulet rôti aux herbes", persons: ["Julien", "Zoé"], servings: 2 }
 * Returns: { recipe: {...}, cached: boolean }
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { description, persons, servings } = await request.json()

  if (!description) {
    return NextResponse.json({ error: 'description requis' }, { status: 400 })
  }

  const normalized = normalizeRecipeName(description)

  // 1. Check cache
  try {
    const { data: cached } = await supabase
      .from('generated_recipes')
      .select('*')
      .eq('user_id', user.id)
      .eq('name_normalized', normalized)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      console.log(`[AI Recipe] Cache hit: "${normalized}"`)
      return NextResponse.json({
        recipe: {
          title: cached.title,
          description: cached.description,
          servings: cached.servings,
          prep_min: cached.prep_min,
          cook_min: cached.cook_min,
          ingredients: cached.ingredients,
          steps: cached.steps,
          chef_tips: cached.chef_tips,
          nutrition_per_serving: cached.nutrition_per_serving,
        },
        cached: true,
      })
    }
  } catch {
    // No cache hit, continue to generation
  }

  // 2. Generate via Claude
  try {
    console.log(`[AI Recipe] Generating: "${description}"`)
    const ctx = await buildAiContext(supabase, user.id)
    const context = formatContextForPrompt(ctx)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `Tu es Myko, un chef cuisinier expert. On te donne une description de repas et tu génères une fiche recette complète et détaillée.

${context}

RÈGLES :
- Réponds UNIQUEMENT avec du JSON valide, sans texte autour.
- Les étapes doivent être détaillées, pratiques, avec les temps précis.
- Si une étape nécessite un timer (cuisson, repos, etc.), mets la durée en minutes dans "duration_min".
- Donne le titre de chaque étape avant les deux-points, puis le détail.
- Adapte les quantités au nombre de personnes demandé.
- Utilise les ingrédients du stock en priorité quand ils correspondent.
- Donne les quantités en unités métriques (g, kg, mL, L).
- Inclus une estimation nutritionnelle par portion dans "nutrition_per_serving".

FORMAT JSON attendu :
{
  "title": "Nom du plat",
  "description": "Description courte et appétissante",
  "servings": 2,
  "prep_min": 15,
  "cook_min": 30,
  "ingredients": [
    { "name": "Poulet", "quantity": 500, "unit": "g", "notes": "" }
  ],
  "steps": [
    { "step_no": 1, "instruction": "Titre de l'étape: Description détaillée...", "duration_min": null },
    { "step_no": 2, "instruction": "Cuire le poulet: Faire chauffer la poêle...", "duration_min": 15 }
  ],
  "chef_tips": "Conseil du chef optionnel",
  "nutrition_per_serving": { "kcal": 450, "protein_g": 35, "carbs_g": 40, "fat_g": 15, "fiber_g": 6 }
}`,
      messages: [
        {
          role: 'user',
          content: `Génère une recette complète pour : "${description}"${persons?.length ? `\nPour : ${persons.join(', ')}` : ''}${servings ? `\nNombre de portions : ${servings}` : ''}`
        }
      ]
    })

    const text = response.content?.[0]?.text || ''

    let recipe = null
    try {
      recipe = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) recipe = JSON.parse(match[0])
    }

    if (!recipe) {
      return NextResponse.json({ error: 'Impossible de générer la recette', raw: text }, { status: 500 })
    }

    // 3. Save to cache
    try {
      await supabase.from('generated_recipes').insert({
        user_id: user.id,
        name_normalized: normalized,
        title: recipe.title || description,
        description: recipe.description || null,
        servings: recipe.servings || servings || 2,
        prep_min: recipe.prep_min || null,
        cook_min: recipe.cook_min || null,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        chef_tips: recipe.chef_tips || null,
        nutrition_per_serving: recipe.nutrition_per_serving || null,
        source: 'ai',
      })
      console.log(`[AI Recipe] Cached: "${normalized}"`)
    } catch (cacheErr) {
      console.warn('[AI Recipe] Cache save failed:', cacheErr.message)
    }

    return NextResponse.json({ recipe, cached: false })
  } catch (err) {
    console.error('[AI Recipe] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
