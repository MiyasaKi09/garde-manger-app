import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

const EMPTY_COVERAGE = {
  status: 'unknown',
  have: 0,
  need: 0,
  missing: [],
  staplesMissing: [],
  reason: 'no_published_snapshot',
}

function requirementKey(row = {}) {
  return row.form_normalized || row.ingredient_name || ''
}

/**
 * Convertit le snapshot d'allocation publié avec le plan en indicateur UI.
 * Il est volontairement interdit de relire le stock courant ici : cela ferait
 * une seconde promesse de stock, indépendante des réservations canoniques.
 */
export function coverageFromSnapshot(stockSummary) {
  if (!stockSummary || typeof stockSummary !== 'object' || Array.isArray(stockSummary)) {
    return EMPTY_COVERAGE
  }

  const allocations = Array.isArray(stockSummary.allocations) ? stockSummary.allocations : []
  const shortages = Array.isArray(stockSummary.shortages) ? stockSummary.shortages : []
  const keys = new Set([...allocations, ...shortages].map(requirementKey).filter(Boolean))

  if (!keys.size && stockSummary.cooked_dish) {
    return { status: 'full', have: 1, need: 1, missing: [], staplesMissing: [], reason: 'reserved_cooked_dish' }
  }
  if (!keys.size && Number(stockSummary.coverage) === 1) {
    return { status: 'full', have: 0, need: 0, missing: [], staplesMissing: [], reason: 'published_snapshot' }
  }
  if (!keys.size) return EMPTY_COVERAGE

  const shortageKeys = new Set(shortages.map(requirementKey).filter(Boolean))
  const allocatedKeys = new Set(allocations.map(requirementKey).filter(Boolean))
  const fullyCovered = [...keys].filter(key => !shortageKeys.has(key)).length
  const allocatedGrams = allocations.reduce((sum, row) => sum + (Number(row.grams) || 0), 0)
  const status = shortageKeys.size === 0
    ? 'full'
    : allocatedGrams > 0 || allocatedKeys.size > 0
      ? 'partial'
      : 'none'

  return {
    status,
    have: fullyCovered,
    need: keys.size,
    missing: shortages.map(row => row.ingredient_name || row.form_normalized).filter(Boolean),
    staplesMissing: [],
    reason: 'published_allocation_snapshot',
    coverage: Number(stockSummary.coverage) || 0,
  }
}

/**
 * GET /api/planning/[importId]/stock-coverage
 *
 * Expose uniquement la couverture figée lors de la publication atomique du
 * plan. La disponibilité en temps réel reste consultable dans le garde-manger,
 * mais ne réécrit jamais rétroactivement la promesse de ce planning.
 */
export async function GET(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Non authentifié' }, { status: 401 })
    }

    const { importId } = await params
    const { data: planImport, error: importError } = await supabase
      .from('nutrition_plan_imports')
      .select('id, active_plan_version_id')
      .eq('id', importId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (importError) throw importError
    if (!planImport) return NextResponse.json({ error: 'Import introuvable' }, { status: 404 })

    if (!planImport.active_plan_version_id) {
      return NextResponse.json({ import_id: Number(importId), plan_version_id: null, meals: {}, summary: { full: 0, partial: 0, none: 0, unknown: 0 } })
    }

    const [{ data: meals, error: mealsError }, { data: slots, error: slotsError }, { data: version, error: versionError }] = await Promise.all([
      supabase
        .from('nutrition_plan_meals')
        .select('id, meal_plan_slot_id')
        .eq('import_id', importId)
        .in('meal_type', ['dejeuner', 'diner']),
      supabase
        .from('meal_plan_slots')
        .select('id, stock_summary')
        .eq('plan_version_id', planImport.active_plan_version_id),
      supabase
        .from('meal_plan_versions')
        .select('id, published_at')
        .eq('id', planImport.active_plan_version_id)
        .maybeSingle(),
    ])

    if (mealsError) throw mealsError
    if (slotsError) throw slotsError
    if (versionError) throw versionError

    const slotCoverage = new Map((slots || []).map(slot => [String(slot.id), coverageFromSnapshot(slot.stock_summary)]))
    const mealsOut = {}
    const summary = { full: 0, partial: 0, none: 0, unknown: 0 }
    for (const meal of meals || []) {
      const coverage = slotCoverage.get(String(meal.meal_plan_slot_id)) || EMPTY_COVERAGE
      mealsOut[String(meal.id)] = coverage
      summary[coverage.status] += 1
    }

    return NextResponse.json({
      import_id: Number(importId),
      plan_version_id: version?.id || planImport.active_plan_version_id,
      generated_at: version?.published_at || null,
      meals: mealsOut,
      summary,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
