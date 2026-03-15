import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { getImport, deleteImport } from '@/lib/nutritionPlanService'

export async function GET(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    const data = await getImport(supabase, params.importId)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    await deleteImport(supabase, params.importId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
