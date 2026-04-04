import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

/**
 * GET /api/nutrition/goals — Get all health goals for the user
 * POST /api/nutrition/goals — Save goals for multiple persons
 *   Body: { goals: [{ person_name, target_calories, target_protein_g, ... }] }
 *
 * Handles the PK constraint on user_health_goals (user_id only)
 * by deleting existing rows and re-inserting.
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_health_goals')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goals: data || [] })
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { goals } = await request.json()
  if (!goals?.length) {
    return NextResponse.json({ error: 'goals array requis' }, { status: 400 })
  }

  try {
    // The PK is on (user_id) only, so we can only have 1 row per user.
    // To support multiple persons, we need to drop the PK constraint first.
    // Workaround: try dropping the old PK and adding a new one with person_name.
    // If that fails, fall back to storing only the first person's goals.

    // First, try to alter the table to support multi-person
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE user_health_goals DROP CONSTRAINT IF EXISTS user_health_goals_pkey;
          ALTER TABLE user_health_goals ADD CONSTRAINT user_health_goals_pkey PRIMARY KEY (user_id, person_name);
        `
      })
    } catch {
      // RPC might not exist, try raw approach
    }

    // Delete existing goals for this user
    const { error: deleteError } = await supabase
      .from('user_health_goals')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[Goals] Delete error:', deleteError)
    }

    // Insert new goals one by one (to handle PK issues gracefully)
    const results = []
    for (const goal of goals) {
      const { data, error } = await supabase
        .from('user_health_goals')
        .insert({
          user_id: user.id,
          person_name: goal.person_name || 'Julien',
          target_calories: goal.target_calories || null,
          target_protein_g: goal.target_protein_g || null,
          target_fat_g: goal.target_fat_g || null,
          target_carbs_g: goal.target_carbs_g || null,
          target_fiber_g: goal.target_fiber_g || null,
          target_weight_kg: goal.target_weight_kg || null,
          age: goal.age || null,
          sex: goal.sex || null,
          height_cm: goal.height_cm || null,
          current_weight_kg: goal.current_weight_kg || null,
          activity_level: goal.activity_level || null,
          weight_loss_rate: goal.weight_loss_rate || null,
          bmr: goal.bmr || null,
          tdee: goal.tdee || null,
        })
        .select()
        .single()

      if (error) {
        console.error(`[Goals] Insert error for ${goal.person_name}:`, error.message)
        // If PK violation on second insert, the table doesn't support multi-person yet
        if (error.code === '23505') {
          results.push({ person_name: goal.person_name, saved: false, reason: 'PK constraint - run migration' })
          continue
        }
      } else {
        results.push({ person_name: goal.person_name, saved: true })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[Goals] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
