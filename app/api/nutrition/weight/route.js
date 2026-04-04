import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

/**
 * POST /api/nutrition/weight — Record weight entry
 * GET  /api/nutrition/weight?person=Julien&limit=90
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { person_name, date, weight_kg, notes } = await request.json()

  if (!person_name || !date || !weight_kg) {
    return NextResponse.json({ error: 'person_name, date et weight_kg requis' }, { status: 400 })
  }

  // Upsert — one entry per person per day
  const { data, error } = await supabase
    .from('weight_entries')
    .upsert({
      user_id: user.id,
      person_name,
      date,
      weight_kg,
      notes: notes || null,
    }, { onConflict: 'user_id,person_name,date' })
    .select()
    .single()

  if (error) {
    console.error('[Weight] Upsert error:', error)
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
  const person = searchParams.get('person')
  const limit = parseInt(searchParams.get('limit') || '90')

  let query = supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)

  if (person) query = query.eq('person_name', person)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data })
}
