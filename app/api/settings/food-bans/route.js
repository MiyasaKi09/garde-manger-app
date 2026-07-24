import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { foldPlanningSetting, normalizeFoodPreference } from '@/lib/domain/settings/planningSettings'

export const dynamic = 'force-dynamic'

async function listFoodPreferences(supabase, userId) {
  const { data, error } = await supabase
    .from('user_food_bans')
    .select('id, name, canonical_food_id, kind, note, created_at')
    .eq('user_id', userId)
    .order('kind')
    .order('name')
  if (error) throw new Error(`Lecture des préférences alimentaires impossible: ${error.message}`)
  return data || []
}

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  try {
    return NextResponse.json({ items: await listFoodPreferences(supabase, user.id) })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch {}

  try {
    const preference = normalizeFoodPreference(body)
    const existing = await listFoodPreferences(supabase, user.id)
    const duplicate = existing.find((item) => foldPlanningSetting(item.name) === preference.normalized_name && item.kind === preference.kind)
    if (duplicate) return NextResponse.json({ item: duplicate, duplicate: true })

    const { data, error } = await supabase
      .from('user_food_bans')
      .insert({
        user_id: user.id,
        name: preference.name,
        kind: preference.kind,
        note: preference.note,
        canonical_food_id: body.canonical_food_id || null,
      })
      .select('id, name, canonical_food_id, kind, note, created_at')
      .single()
    if (error) throw new Error(`Ajout impossible: ${error.message}`)
    return NextResponse.json({ item: data }, { status: 201 })
  } catch (error) {
    const status = error.code === 'validation' ? 400 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}

export async function DELETE(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch {}
  const id = String(body.id || '').trim()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('user_food_bans')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: `Suppression impossible: ${error.message}` }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Préférence introuvable' }, { status: 404 })
  return NextResponse.json({ success: true, id })
}
