import { NextResponse } from 'next/server'
import manifest from '@/data/encyclopedia/manifest.json'
import index from '@/data/encyclopedia/index.json'
import { authenticateRequest } from '@/lib/apiAuth'
import { buildEncyclopediaView } from '@/lib/domain/encyclopedia/catalog'

export const dynamic = 'force-dynamic'

/**
 * GET /api/encyclopedie
 *
 * Le manifeste versionné reste disponible même si le contrat SQL n'est pas
 * encore déployé. Une session authentifiée enrichit la réponse avec les
 * agrégats canoniques live, sans exposer de lignes métier.
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let liveCoverage = null
  let liveError = null
  try {
    const { data, error } = await supabase.rpc('get_encyclopedia_coverage_v1')
    if (error) {
      liveError = 'Agrégats live indisponibles'
    } else {
      liveCoverage = data
    }
  } catch {
    liveError = 'Agrégats live indisponibles'
  }

  return NextResponse.json({
    ...buildEncyclopediaView(manifest, index, liveCoverage),
    live_error: liveError,
  })
}
