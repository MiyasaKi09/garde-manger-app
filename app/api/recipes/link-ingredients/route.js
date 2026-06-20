import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { linkRecipesForUser } from '@/lib/ingredientResolver'
import { recomputeGeneratedNutritionBatch } from '@/lib/generatedRecipeNutrition'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Relie les ingrédients (texte libre) des recettes générées aux entités
 * d'inventaire (canonical_foods / archetypes). AUCUN appel Anthropic — pur
 * code déterministe + Supabase. Écrit dans generated_recipe_ingredients.
 *
 * POST /api/recipes/link-ingredients
 *   body: { recipe_id?: number, all?: true, only_unlinked?: true }
 *
 * La logique de résolution vit dans lib/ingredientResolver.js (source unique
 * partagée avec la génération de recettes). Ce endpoint sert au backfill et à
 * la re-liaison à la demande.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const { recipe_id, all, only_unlinked } = body || {}
  if (!recipe_id && !all) {
    return NextResponse.json({ error: 'recipe_id ou all requis' }, { status: 400 })
  }

  try {
    const result = await linkRecipesForUser(supabase, user.id, {
      recipeId: recipe_id,
      all,
      onlyUnlinked: only_unlinked,
    })
    if (recipe_id && result.recipes === 0) {
      return NextResponse.json({ error: 'Aucune recette' }, { status: 404 })
    }

    // Recalcul nutritionnel CIQUAL pour chaque recette (re)liée — garde la
    // nutrition cohérente avec les ingrédients fraîchement résolus.
    const linkedIds = (result.details || []).map(d => d.recipe_id).filter(Boolean)
    const nutrition = await recomputeGeneratedNutritionBatch(supabase, linkedIds)

    return NextResponse.json({ ...result, nutrition })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
