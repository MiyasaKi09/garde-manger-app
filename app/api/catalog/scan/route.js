import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { scanBarcode, fetchOffProductLive } from '@/lib/db/queries/commercialProducts'

export const dynamic = 'force-dynamic'

/**
 * GET /api/catalog/scan?barcode=XXXX[&live=1]
 * Réf. MYKO_DATA_FOUNDATION_V2 §3.9, §9.1.
 * Renvoie le produit commercial publié (barcode → produit + forme liée + nutrition/100 g).
 * Avec `live=1`, si absent du catalogue, tente un repli Open Food Facts (candidat
 * non fiable, non stocké).
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const barcode = request.nextUrl.searchParams.get('barcode')?.trim()
  if (!barcode) {
    return NextResponse.json({ error: 'Paramètre "barcode" requis' }, { status: 400 })
  }
  const live = request.nextUrl.searchParams.get('live') === '1'

  try {
    const result = await scanBarcode(supabase, barcode)
    if (result.found) return NextResponse.json(result)
    if (live) {
      const off = await fetchOffProductLive(barcode)
      if (off) return NextResponse.json(off)
    }
    return NextResponse.json(result, { status: 404 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
