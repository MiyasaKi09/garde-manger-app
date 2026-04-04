import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'
import { buildAiContext, formatContextForPrompt } from '@/lib/aiContextBuilder'
import { getSystemPrompt } from '@/lib/aiSystemPrompts'
import { updateMeal, addShoppingItems, removeShoppingItems } from '@/lib/nutritionPlanService'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * POST /api/ai/plan/swap
 * Swap a single meal in the planning.
 * Body: { importId, mealDate, mealType, currentDescription, preference? }
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

  const { importId, mealDate, mealType, currentDescription, preference } = body

  if (!importId || !mealDate || !mealType || !currentDescription) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  try {
    // Build context
    const ctx = await buildAiContext(supabase, user.id)
    const formattedContext = formatContextForPrompt(ctx)
    const systemPrompt = getSystemPrompt('meal_swap', formattedContext)

    // Build user message
    const mealLabel = mealType === 'dejeuner' ? 'déjeuner' : mealType === 'diner' ? 'dîner' : mealType
    let userMessage = `Change le ${mealLabel} du ${mealDate} actuellement "${currentDescription}".`
    if (preference) {
      userMessage += ` Je voudrais plutôt : ${preference}.`
    }

    // Call Claude (non-streaming for simplicity)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content?.[0]?.text || ''

    // Extract JSON
    const parsed = extractJson(text)
    if (!parsed?.replacement) {
      return NextResponse.json({ error: 'Réponse IA invalide', raw: text }, { status: 500 })
    }

    const { replacement, groceries_add, groceries_remove } = parsed

    // Update meals for both Julien and Zoé
    if (replacement.j) {
      await updateMeal(supabase, importId, mealDate, mealType, 'Julien', {
        description: replacement.j.desc,
        kcal: replacement.j.kcal,
        protein_g: replacement.j.p,
        carbs_g: replacement.j.g,
        fat_g: replacement.j.l,
        fiber_g: replacement.j.f,
      })
    }

    if (replacement.z) {
      await updateMeal(supabase, importId, mealDate, mealType, 'Zoé', {
        description: replacement.z.desc,
        kcal: replacement.z.kcal,
        protein_g: replacement.z.p,
        carbs_g: replacement.z.g,
        fat_g: replacement.z.l,
        fiber_g: replacement.z.f,
      })
    }

    // Update shopping list
    let groceriesUpdated = false

    if (groceries_add?.length) {
      await addShoppingItems(supabase, importId, groceries_add)
      groceriesUpdated = true
    }

    if (groceries_remove?.length) {
      await removeShoppingItems(supabase, importId, groceries_remove)
      groceriesUpdated = true
    }

    return NextResponse.json({
      success: true,
      replacement,
      groceriesUpdated,
    })
  } catch (err) {
    console.error('[Meal Swap] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur lors du swap' },
      { status: 500 }
    )
  }
}

function extractJson(text) {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    try { return JSON.parse(jsonBlockMatch[1]) } catch {}
  }
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)) } catch {}
  }
  return null
}
