import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * Les préparations sont désormais publiées dans la même transaction que le
 * planning. Garder un second générateur ferait diverger portions, lots et DLC.
 */
export async function POST(request) {
  const { user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  return NextResponse.json({
    error: 'Les préparations font partie du planning publié. Recalculez le planning pour les modifier.',
    code: 'canonical_batch_only',
  }, { status: 410 })
}
