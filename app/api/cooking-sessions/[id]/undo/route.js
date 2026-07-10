import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cooking-sessions/[id]/undo — annule une session validée.
 *
 * Délègue tout à la RPC transactionnelle undo_cooking_session : restauration
 * des lots depuis inventory_movements, suppression du plat/meal_log, session
 * marquée 'undone'. La RPC refuse (exception) si des portions ont déjà été
 * consommées → mappé en 409 ici.
 */
export async function POST(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: sessionId } = await params

  // ── Propriété + statut ──
  const { data: session, error: sessionError } = await supabase
    .from('cooking_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (sessionError) {
    return NextResponse.json({ error: 'Erreur lecture session' }, { status: 500 })
  }
  if (!session) {
    return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
  }
  if (session.status !== 'committed') {
    return NextResponse.json(
      { error: session.status === 'draft' ? 'Session non validée — rien à annuler' : 'Session déjà annulée' },
      { status: 409 }
    )
  }

  const { data, error: rpcError } = await supabase.rpc('undo_cooking_session', {
    p_session_id: session.id,
  })

  if (rpcError) {
    // Exceptions métier de la RPC ('portions déjà consommées', état inattendu…)
    // → conflit applicatif, le message est directement affichable.
    return NextResponse.json({ error: rpcError.message }, { status: 409 })
  }

  return NextResponse.json(data ?? { success: true })
}
