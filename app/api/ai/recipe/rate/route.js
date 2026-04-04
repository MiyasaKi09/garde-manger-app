import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

/**
 * POST /api/ai/recipe/rate
 * Rate a generated recipe and/or increment cook count.
 * Body: { recipeId: number, rating?: 1-5, cooked?: boolean }
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { recipeId, rating, cooked } = await request.json()

  if (!recipeId) {
    return NextResponse.json({ error: 'recipeId requis' }, { status: 400 })
  }

  const updates = {}
  if (rating !== undefined) updates.rating = Math.min(5, Math.max(1, rating))
  if (cooked) {
    // Increment cook_count
    const { data: current } = await supabase
      .from('generated_recipes')
      .select('cook_count')
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .single()

    updates.cook_count = (current?.cook_count || 0) + 1
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'rating ou cooked requis' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('generated_recipes')
    .update(updates)
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, recipe: data })
}
