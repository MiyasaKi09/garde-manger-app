import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { listImports } from '@/lib/nutritionPlanService'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const imports = await listImports(supabase)
    return NextResponse.json({ imports })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
