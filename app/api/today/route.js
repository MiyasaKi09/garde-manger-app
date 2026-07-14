import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { getToday } from '@/lib/db/queries/today'
import { assertTodayViewModel } from '@/lib/contracts/today'

export const dynamic = 'force-dynamic'

/**
 * GET /api/today?date=YYYY-MM-DD — vue « Aujourd'hui » (contrat stable §9.15).
 * Remplacera à terme les six chargements de la page d'accueil.
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10)
  try {
    const viewModel = await getToday(supabase, date)
    assertTodayViewModel(viewModel) // garde-fou : ne renvoie jamais un contrat cassé
    return NextResponse.json(viewModel)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
