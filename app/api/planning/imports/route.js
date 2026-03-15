import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { listImports } from '@/lib/nutritionPlanService'

export async function GET(request) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    const imports = await listImports(supabase)
    return NextResponse.json({ imports })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
