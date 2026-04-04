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

    // ── Auto-save recipes to generated_recipes (with steps from cooking data) ──
    if (plan.recipes?.length) {
      const savedCount = await autoSaveRecipes(supabase, user.id, plan.recipes, plan.days || [])
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
 * Save all recipes from the plan to generated_recipes with COMPLETE data
 * (ingredients + steps extracted from cooking data in days).
 * Skips recipes that already exist with steps. Updates those without steps.
 */
async function autoSaveRecipes(supabase, userId, recipes, days) {
  let saved = 0

  // Build a map of cooking steps from all days (dinner + prep)
  const cookingStepsMap = buildCookingStepsMap(days)

  for (const recipe of recipes) {
    const normalized = normalizeRecipeName(recipe.name)
    if (!normalized) continue

    // Check if already exists
    const { data: existing } = await supabase
      .from('generated_recipes')
      .select('id, steps')
      .eq('user_id', userId)
      .eq('name_normalized', normalized)
      .limit(1)

    // Skip if already saved WITH steps
    if (existing?.length > 0 && existing[0].steps?.length > 0) continue

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

    // Extract steps from cooking data — match by recipe name
    const steps = findStepsForRecipe(recipe.name, cookingStepsMap)

    // Build description from recipe data
    const description = [
      recipe.rendement ? `Rendement: ${recipe.rendement}` : null,
      recipe.portions ? `Portions — J: ${recipe.portions.j}, Z: ${recipe.portions.z}` : null,
      recipe.jour2 ? `Jour 2: ${recipe.jour2}` : null,
    ].filter(Boolean).join('. ')

    const recipeData = {
      user_id: userId,
      name_normalized: normalized,
      title: recipe.name,
      description: description || null,
      servings: 2,
      prep_min,
      cook_min,
      ingredients,
      steps,
      chef_tips: recipe.jour2 ? `Variation jour 2 : ${recipe.jour2}` : null,
      nutrition_per_serving: nutrition,
      source: 'plan',
    }

    if (existing?.length > 0) {
      // Update existing entry that had empty steps
      const { error } = await supabase
        .from('generated_recipes')
        .update({
          ingredients,
          steps,
          description: recipeData.description,
          chef_tips: recipeData.chef_tips,
          prep_min,
          cook_min,
          nutrition_per_serving: nutrition,
        })
        .eq('id', existing[0].id)
      if (!error) saved++
    } else {
      // Insert new
      const { error } = await supabase
        .from('generated_recipes')
        .insert(recipeData)
      if (!error) saved++
    }
  }

  return saved
}

/**
 * Builds a map of recipe name → cooking steps from all days in the plan.
 * Extracts from cooking.dinner and cooking.prep.
 */
function buildCookingStepsMap(days) {
  const map = {} // normalized name → steps array

  for (const day of (days || [])) {
    const cooking = day.cooking
    if (!cooking) continue

    // Dinner steps
    if (cooking.dinner?.steps?.length && cooking.dinner.name) {
      const key = normalizeRecipeName(cooking.dinner.name)
      if (key && !map[key]) {
        map[key] = cooking.dinner.steps.map((s, i) => ({
          step_no: i + 1,
          instruction: `${s.action}: ${s.detail}`,
          duration_min: parseDuration(s.duration),
        }))
      }
    }

    // Prep steps (for batch cooking)
    if (cooking.prep?.steps?.length && cooking.prep.for) {
      const prepName = cooking.prep.for
      const key = normalizeRecipeName(prepName)
      if (key && !map[key]) {
        map[key] = cooking.prep.steps.map((s, i) => ({
          step_no: i + 1,
          instruction: `${s.action}: ${s.detail}`,
          duration_min: parseDuration(s.duration),
        }))
      }
    }
  }

  return map
}

/**
 * Find cooking steps that match a recipe name.
 * Tries exact match first, then fuzzy (recipe name contained in cooking name or vice versa).
 */
function findStepsForRecipe(recipeName, stepsMap) {
  const normalized = normalizeRecipeName(recipeName)
  if (!normalized) return []

  // Exact match
  if (stepsMap[normalized]) return stepsMap[normalized]

  // Fuzzy: check if any cooking name contains the recipe name or vice versa
  for (const [key, steps] of Object.entries(stepsMap)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return steps
    }
  }

  // No match found — steps will be empty, but the recipe API will regenerate on first cook
  return []
}

/**
 * Parse duration string like "5min", "15 min" → number
 */
function parseDuration(str) {
  if (!str) return null
  const match = String(str).match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}
