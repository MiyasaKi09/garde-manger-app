import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { getEditorialRecipe } from '@/lib/db/operationalRecipeCatalog'

export const dynamic = 'force-dynamic'

const CODE = /^[a-z0-9-]+$/i

function requestedServings(request) {
  const value = Number(new URL(request.url).searchParams.get('portions'))
  return Number.isFinite(value) && value >= 1 && value <= 24 ? value : null
}

function normalizeRecipe(recipe) {
  const nutrition = recipe.nutritionPerServing || {}
  return {
    id: `canonical-${recipe.code}`,
    code: recipe.code,
    title: recipe.family,
    name: recipe.family,
    description: [recipe.cuisineOrigin, recipe.category].filter(Boolean).join(' · '),
    prep_min: Number(recipe.prepMinutes) || 0,
    cook_min: Number(recipe.cookMinutes) || 0,
    servings: Number(recipe.servings) || 1,
    nutrition_per_serving: {
      kcal: Number(nutrition.kcal) || 0,
      protein_g: Number(nutrition.proteinG) || 0,
      carbs_g: Number(nutrition.carbsG) || 0,
      fat_g: Number(nutrition.fatG) || 0,
      fiber_g: Number(nutrition.fiberG) || 0,
    },
    ingredients: (recipe.exactIngredients || []).map((ingredient) => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.optional ? 'Facultatif' : null,
    })),
    steps: (recipe.exactSteps || []).map((step, index) => ({
      n: step.n || index + 1,
      instruction: step.instruction,
      duration_min: Number(step.duration_min ?? step.durationMinutes) || null,
    })),
    canonical: true,
  }
}

export async function GET(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const code = String(params.code || '').trim()
  if (!CODE.test(code)) return NextResponse.json({ error: 'Code recette invalide' }, { status: 400 })

  try {
    const recipe = await getEditorialRecipe(supabase, code, { servings: requestedServings(request) })
    if (!recipe) return NextResponse.json({ error: 'Recette introuvable' }, { status: 404 })
    return NextResponse.json({ recipe: normalizeRecipe(recipe) }, {
      headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=1800' },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Recette indisponible' }, { status: 500 })
  }
}
