import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { listMembers } from '@/lib/domain/household/memberRepository'

export const dynamic = 'force-dynamic'

/**
 * GET /api/household/members — membres du foyer de l'utilisateur (source
 * officielle des personnes, remplace les chaînes « Julien » / « Zoé »).
 * Réf. plan directeur PR 1, §9.10.
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  try {
    const members = await listMembers(supabase)
    return NextResponse.json({ members })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
