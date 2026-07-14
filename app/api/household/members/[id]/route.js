import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { updateMember, deactivateMember } from '@/lib/domain/household/memberRepository'

export const dynamic = 'force-dynamic'

/** PATCH /api/household/members/[id] — met à jour un membre (RLS = propriété). */
export async function PATCH(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  let body = {}
  try { body = await request.json() } catch {}
  try {
    const member = await updateMember(supabase, id, body || {})
    if (!member) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
    return NextResponse.json({ member })
  } catch (e) {
    const status = e.code === 'validation' ? 400 : 500
    return NextResponse.json({ error: e.message }, { status })
  }
}

/** DELETE /api/household/members/[id] — désactive un membre (soft-delete). */
export async function DELETE(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  try {
    const res = await deactivateMember(supabase, id)
    if (!res) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
    return NextResponse.json({ success: true, id: res.id, active: res.active })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
