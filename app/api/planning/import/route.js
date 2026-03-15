import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { parseWorkbook } from '@/lib/xlsxParser'
import { createImport } from '@/lib/nutritionPlanService'

export async function POST(request) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Format invalide, .xlsx requis' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const parsed = parseWorkbook(new Uint8Array(buffer), file.name)

    if (parsed.meals.length === 0) {
      return NextResponse.json({
        error: 'Aucun repas détecté dans le fichier',
        warnings: parsed.warnings
      }, { status: 400 })
    }

    const result = await createImport(supabase, user.id, parsed)

    return NextResponse.json({
      success: true,
      importId: result.importId,
      summary: result.summary,
      warnings: parsed.warnings,
      meta: parsed.meta
    })

  } catch (error) {
    console.error('Erreur import:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
