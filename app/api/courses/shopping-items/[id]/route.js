import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

/**
 * PATCH /api/courses/shopping-items/[id]
 * Met à jour les informations de conditionnement d'un article de courses.
 * Body: { container_qty?, container_size?, container_unit? }
 */
export async function PATCH(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const body = await request.json()
    const updates = {}

    if ('checked' in body)        updates.checked        = Boolean(body.checked)
    if ('image_url' in body)      updates.image_url      = body.image_url ?? null
    if ('container_qty' in body)  updates.container_qty  = body.container_qty  ?? null
    if ('container_size' in body) updates.container_size = body.container_size ?? null
    if ('container_unit' in body) updates.container_unit = body.container_unit ?? null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    // RLS: la policy "users_own_shopping" vérifie via import_id → nutrition_plan_imports.user_id
    const { data, error } = await supabase
      .from('nutrition_plan_shopping_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
