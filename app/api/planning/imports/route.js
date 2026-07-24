import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) return NextResponse.json({ error: authError }, { status: 401 })

    // La navigation du planning n'a besoin que des métadonnées de semaine.
    // Ne jamais charger raw_json ni les colonnes historiques lourdes ici.
    const { data, error } = await supabase
      .from('nutrition_plan_imports')
      .select('id, file_name, month_label, date_range_start, date_range_end, active_plan_version_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40)

    if (error) throw new Error(`Erreur liste imports: ${error.message}`)
    return NextResponse.json({ imports: data || [] }, {
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
