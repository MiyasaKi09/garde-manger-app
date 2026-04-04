import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { createImport } from '@/lib/nutritionPlanService'
import { parseJsonPlan } from '@/lib/jsonPlanParser'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'

/**
 * POST /api/ai/plan/generate
 * 1. Saves the plan to nutrition_plan_* tables
 * 2. Auto-saves all unique recipes to generated_recipes (for future reuse)
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { plan } = body
  if (!plan?.days?.length) {
    return NextResponse.json({ error: 'Plan invalide : "days" requis' }, { status: 400 })
  }

  try {
    const jsonString = JSON.stringify(plan)
    const parsed = parseJsonPlan(jsonString, `myko-ai-${new Date().toISOString().slice(0, 10)}.json`)
    parsed.meta.fileName = `Planning Myko IA - ${plan.label || new Date().toLocaleDateString('fr-FR')}`

    const result = await createImport(supabase, user.id, {
      ...parsed,
      rawJson: jsonString,
    })

    // ── Auto-save recipes to generated_recipes ──
    if (plan.recipes?.length) {
      const savedCount = await autoSaveRecipes(supabase, user.id, plan.recipes)
      console.log(`[Plan Generate] ${savedCount}/${plan.recipes.length} recettes sauvegardées`)
    }

    return NextResponse.json({
      success: true,
      importId: result.importId,
      summary: result.summary,
    })
  } catch (err) {
    console.error('[AI Plan Generate] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur sauvegarde du plan' },
      { status: 500 }
    )
  }
}

/**
 * Save all recipes from the plan to generated_recipes,
 * skipping any that already exist (by normalized name).
 */
async function autoSaveRecipes(supabase, userId, recipes) {
  let saved = 0

  for (const recipe of recipes) {
    const normalized = normalizeRecipeName(recipe.name)
    if (!normalized) continue

    // Check if already exists
    const { data: existing } = await supabase
      .from('generated_recipes')
      .select('id')
      .eq('user_id', userId)
      .eq('name_normalized', normalized)
      .limit(1)

    if (existing?.length > 0) continue // Already saved

    // Parse ingredients from string to array if needed
    let ingredients = []
    if (typeof recipe.ingredients === 'string') {
      ingredients = recipe.ingredients.split(',').map(s => {
        const trimmed = s.trim()
        const match = trimmed.match(/^(\d+[.,]?\d*)\s*(g|kg|ml|L|cl)?\s*(.+)$/)
        if (match) return { quantity: parseFloat(match[1]), unit: match[2] || '', name: match[3].trim() }
        return { name: trimmed, quantity: null, unit: '' }
      })
    } else if (Array.isArray(recipe.ingredients)) {
      ingredients = recipe.ingredients
    }

    // Parse macros
    let nutrition = null
    if (recipe.macros100g) {
      nutrition = {
        kcal: recipe.macros100g.kcal,
        protein_g: recipe.macros100g.p,
        carbs_g: recipe.macros100g.g,
        fat_g: recipe.macros100g.l,
        fiber_g: recipe.macros100g.f,
      }
    }

    // Parse timing
    let prep_min = null, cook_min = null
    if (recipe.timing) {
      const actifMatch = (recipe.timing.actif || '').match(/(\d+)/)
      const totalMatch = (recipe.timing.total || '').match(/(\d+)/)
      if (actifMatch) prep_min = parseInt(actifMatch[1])
      if (totalMatch) cook_min = Math.max(0, parseInt(totalMatch[1]) - (prep_min || 0))
    }

    const { error } = await supabase
      .from('generated_recipes')
      .insert({
        user_id: userId,
        name_normalized: normalized,
        title: recipe.name,
        description: null,
        servings: 2,
        prep_min,
        cook_min,
        ingredients: ingredients,
        steps: [], // Steps will be generated on-demand when cooking
        chef_tips: null,
        nutrition_per_serving: nutrition,
        source: 'plan',
      })

    if (!error) saved++
  }

  return saved
}
