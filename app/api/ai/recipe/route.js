import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'
import { buildAiContext, formatContextForPrompt } from '@/lib/aiContextBuilder'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'
import { calculatePreciseNutrition } from '@/lib/recipePreciseNutrition'

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

  // Clean description: extract dish name (before ":")
  const cleanDesc = description.indexOf(':') > 0 && description.indexOf(':') < 60
    ? description.substring(0, description.indexOf(':')).trim()
    : description.trim()
  const normalized = normalizeRecipeName(cleanDesc)

  // 1. Check cache — try exact match first, then fuzzy (ilike prefix)
  try {
    let cached = null

    // Exact match
    const { data: exactMatch } = await supabase
      .from('generated_recipes')
      .select('*')
      .eq('user_id', user.id)
      .eq('name_normalized', normalized)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (exactMatch) {
      cached = exactMatch
    } else {
      // Fuzzy: try prefix match (handles cases where plan saved full desc)
      const { data: fuzzyMatches } = await supabase
        .from('generated_recipes')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name_normalized', `${normalized}%`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (fuzzyMatches?.length) cached = fuzzyMatches[0]
    }

    if (cached && cached.steps?.length > 0) {
      // Cache hit with complete recipe (has steps)
      console.log(`[AI Recipe] Cache hit: "${normalized}"`)
      return NextResponse.json({
        recipeDbId: cached.id,
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
    // If cached but steps empty → we'll regenerate and update below
    var existingCacheId = cached?.id || null
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
- IMPORTANT pour les ingrédients :
  - Donne les quantités en GRAMMES (g) autant que possible, pas en "pièces" ou "poignées".
  - Utilise des noms d'ingrédients SIMPLES et courants (ex: "poulet" pas "suprême de volaille fermière").
  - Sépare chaque ingrédient individuellement (pas "sel et poivre" mais 2 lignes séparées).
- Inclus une estimation nutritionnelle par portion dans "nutrition_per_serving".

FORMAT JSON attendu :
{
  "title": "Nom du plat",
  "description": "Description courte et appétissante",
  "servings": 2,
  "prep_min": 15,
  "cook_min": 30,
  "ingredients": [
    { "name": "Poulet", "quantity": 500, "unit": "g", "notes": "", "per100g": { "kcal": 165, "p": 31, "g": 0, "l": 3.6, "f": 0 } }
  ],
  "steps": [
    { "step_no": 1, "instruction": "Titre de l'étape: Description détaillée...", "duration_min": null },
    { "step_no": 2, "instruction": "Cuire le poulet: Faire chauffer la poêle...", "duration_min": 15 }
  ],
  "chef_tips": "Conseil du chef optionnel",
  "nutrition_per_serving": { "kcal": 450, "protein_g": 35, "carbs_g": 40, "fat_g": 15, "fiber_g": 6 }
}

IMPORTANT pour "per100g" : donne les valeurs nutritionnelles POUR 100g de chaque ingrédient CRU.
Utilise les valeurs CIQUAL/table de composition des aliments, pas des estimations. Exemples courants :
- Poulet (blanc) : kcal 121, p 26.2, g 0, l 1.8, f 0
- Riz cuit : kcal 130, p 2.7, g 28, l 0.3, f 0.4
- Huile d'olive : kcal 884, p 0, g 0, l 100, f 0
- Oignon : kcal 40, p 1.1, g 9.3, l 0.1, f 1.7
- Tomate : kcal 18, p 0.9, g 3.9, l 0.2, f 1.2`,
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

    // 3. Save to cache (update if exists with empty steps, insert if new)
    let recipeDbId = existingCacheId || null
    try {
      const recipeData = {
        title: recipe.title || description,
        description: recipe.description || null,
        servings: recipe.servings || servings || 2,
        prep_min: recipe.prep_min || null,
        cook_min: recipe.cook_min || null,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        chef_tips: recipe.chef_tips || null,
        nutrition_per_serving: recipe.nutrition_per_serving || null,
      }

      if (existingCacheId) {
        // Update existing entry that had empty steps
        await supabase.from('generated_recipes')
          .update(recipeData)
          .eq('id', existingCacheId)
        console.log(`[AI Recipe] Updated cache: "${normalized}" (id: ${existingCacheId})`)
      } else {
        // Insert new
        const { data: inserted } = await supabase.from('generated_recipes').insert({
          user_id: user.id,
          name_normalized: normalized,
          ...recipeData,
          source: 'ai',
        }).select('id').single()
        recipeDbId = inserted?.id || null
        console.log(`[AI Recipe] Cached: "${normalized}" (id: ${recipeDbId})`)
      }
    } catch (cacheErr) {
      console.warn('[AI Recipe] Cache save failed:', cacheErr.message)
    }

    // 4. Calculate precise nutrition from CIQUAL (ingredients → canonical_foods → nutritional_data)
    try {
      const preciseResult = await calculatePreciseNutrition(supabase, user.id, recipe)
      if (preciseResult) {
        recipe.nutrition_per_serving = preciseResult.nutrition_per_serving
        recipe.nutrition_source = 'ciqual'
        recipe.nutrition_matched = `${preciseResult.matched_ingredients}/${preciseResult.total_ingredients}`

        // Update cache with precise values
        if (recipeDbId) {
          await supabase.from('generated_recipes')
            .update({ nutrition_per_serving: preciseResult.nutrition_per_serving })
            .eq('id', recipeDbId)
          console.log(`[AI Recipe] Nutrition CIQUAL mise à jour pour "${normalized}"`)
        }
      } else {
        recipe.nutrition_source = 'estimate'
        console.log(`[AI Recipe] Fallback estimation IA pour "${normalized}"`)
      }
    } catch (nutritionErr) {
      recipe.nutrition_source = 'estimate'
      console.warn('[AI Recipe] Calcul nutrition précis échoué, fallback estimation:', nutritionErr.message)
    }

    return NextResponse.json({ recipe, recipeDbId, cached: false })
  } catch (err) {
    console.error('[AI Recipe] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
