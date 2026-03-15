import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { parseWorkbook } from '@/lib/xlsxParser'
import { parseJsonPlan } from '@/lib/jsonPlanParser'
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

    const isXlsx = file.name.endsWith('.xlsx')
    const isJson = file.name.endsWith('.json')

    if (!isXlsx && !isJson) {
      return NextResponse.json({ error: 'Format invalide, .xlsx ou .json requis' }, { status: 400 })
    }

    let parsed

    if (isXlsx) {
      const buffer = await file.arrayBuffer()
      parsed = parseWorkbook(new Uint8Array(buffer), file.name)
    } else {
      const text = await file.text()
      parsed = parseJsonPlan(text, file.name)
    }

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
