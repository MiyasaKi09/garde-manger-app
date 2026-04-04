import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { createImport } from '@/lib/nutritionPlanService'
import { parseJsonPlan } from '@/lib/jsonPlanParser'

/**
 * POST /api/ai/plan/generate
 * Saves an AI-generated plan using the same infrastructure as JSON/XLSX imports.
 * Accepts: { plan: { label, days, groceries, recipes } }
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { plan } = body
  if (!plan?.days?.length) {
    return NextResponse.json({ error: 'Plan invalide : "days" requis' }, { status: 400 })
  }

  try {
    // Re-use the jsonPlanParser by stringifying the plan and parsing it back
    // This ensures consistent format with all existing import infrastructure
    const jsonString = JSON.stringify(plan)
    const parsed = parseJsonPlan(jsonString, `myko-ai-${new Date().toISOString().slice(0, 10)}.json`)

    // Override meta to flag as AI-generated
    parsed.meta.fileName = `Planning Myko IA - ${plan.label || new Date().toLocaleDateString('fr-FR')}`

    const result = await createImport(supabase, user.id, {
      ...parsed,
      rawJson: jsonString,
    })

    return NextResponse.json({
      success: true,
      importId: result.importId,
      summary: result.summary,
    })
  } catch (err) {
    console.error('[AI Plan Generate] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur sauvegarde du plan' },
      { status: 500 }
    )
  }
}
