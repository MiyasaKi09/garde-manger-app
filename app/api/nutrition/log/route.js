import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

/**
 * POST /api/nutrition/log — Create meal_log entry
 * GET  /api/nutrition/log?from=YYYY-MM-DD&to=YYYY-MM-DD&person=Julien
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const {
    person_name, meal_date, meal_type,
    cooked_dish_id, recipe_id, description,
    portions_eaten, kcal, protein_g, carbs_g, fat_g, fiber_g,
    micronutrients,
  } = body

  if (!person_name || !meal_date || !meal_type) {
    return NextResponse.json({ error: 'person_name, meal_date et meal_type requis' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('meal_log')
    .insert({
      user_id: user.id,
      person_name,
      meal_date,
      meal_type,
      cooked_dish_id: cooked_dish_id || null,
      recipe_id: recipe_id || null,
      description: description || null,
      portions_eaten: portions_eaten || 1,
      kcal: kcal || null,
      protein_g: protein_g || null,
      carbs_g: carbs_g || null,
      fat_g: fat_g || null,
      fiber_g: fiber_g || null,
      micronutrients: micronutrients || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[Nutrition Log] Insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, entry: data })
}

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const person = searchParams.get('person')

  let query = supabase
    .from('meal_log')
    .select('*')
    .eq('user_id', user.id)
    .order('meal_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (from) query = query.gte('meal_date', from)
  if (to) query = query.lte('meal_date', to)
  if (person) query = query.eq('person_name', person)

  const { data, error } = await query.limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data })
}
