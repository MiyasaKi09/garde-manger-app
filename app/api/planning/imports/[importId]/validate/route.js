import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { expectedMealTypesForMember } from '@/lib/domain/planning/memberPlanningRules'

export const dynamic = 'force-dynamic'

/**
 * GET /api/planning/imports/[importId]/validate
 *
 * Validation post-génération d'un plan (comptages SQL déterministes).
 * Appelé par le poller de /planning quand une requête de régénération passe
 * à `done` : détecte les manques laissés par la Routine (créneaux absents,
 * macros nulles, repas sans fiche recette, courses vides).
 *
 * Réponse :
 * {
 *   meals_count, expected_count,
 *   missing_slots:        [{ date, type, person }],
 *   invalid_macros:       [{ date, type, person }],   — kcal null/0 hors restes
 *   dej_diner_sans_fiche: [{ date, type }],           — aucune fiche générée ou canonique
 *   shopping_count,
 *   ok: boolean
 * }
 */

// Comparaison en UTC (piège DLC/timezone du projet) ; garde-fou 62 jours.
function datesBetween(startIso, endIso) {
  if (!startIso || !endIso) return []
  const start = new Date(`${startIso}T00:00:00Z`)
  const end = new Date(`${endIso}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
  const out = []
  for (let t = start.getTime(); t <= end.getTime() && out.length < 62; t += 86_400_000) {
    out.push(new Date(t).toISOString().split('T')[0])
  }
  return out
}

// Un repas « Restes » : flag v5 is_leftover, avec repli sur le préfixe texte.
function isLeftover(meal) {
  if (meal.is_leftover === true) return true
  return /^restes\s*[—–-]/i.test(String(meal.description || '').trim())
}

export async function GET(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { importId } = await params

  // ── Propriété de l'import ──
  const { data: imp, error: impErr } = await supabase
    .from('nutrition_plan_imports')
    .select('id, date_range_start, date_range_end')
    .eq('id', importId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (impErr) {
    return NextResponse.json({ error: 'Erreur vérification planning' }, { status: 500 })
  }
  if (!imp) {
    return NextResponse.json({ error: 'Planning introuvable' }, { status: 404 })
  }

  // ── Repas : colonnes v5 (generated_recipe_id, is_leftover) avec repli si la
  //    migration n'est pas encore appliquée. ──
  const BASE_COLS = 'meal_date, meal_type, person_name, household_member_id, description, kcal'
  let hasV5Columns = true
  let { data: meals, error: mealsErr } = await supabase
    .from('nutrition_plan_meals')
    .select(`${BASE_COLS}, generated_recipe_id, canonical_recipe_execution_id, canonical_recipe_code, is_leftover`)
    .eq('import_id', importId)
  if (mealsErr) {
    hasV5Columns = false
    ;({ data: meals, error: mealsErr } = await supabase
      .from('nutrition_plan_meals')
      .select(BASE_COLS)
      .eq('import_id', importId))
  }
  if (mealsErr) {
    return NextResponse.json({ error: 'Erreur lecture repas' }, { status: 500 })
  }
  meals = meals || []

  const { data: members, error: memberError } = await supabase
    .from('household_members')
    .select('id, name, preferences')
    .eq('user_id', user.id)
    .eq('active', true)
  if (memberError) return NextResponse.json({ error: 'Erreur lecture foyer' }, { status: 500 })
  const expectedGrid = (members || []).map((member) => ({
    id: member.id,
    person: member.name,
    types: expectedMealTypesForMember(member),
  }))
  const linesPerDay = expectedGrid.reduce((sum, member) => sum + member.types.length, 0)

  // ── Liste de courses (comptage seul) ──
  const { count: shoppingCount, error: shopErr } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('id', { count: 'exact', head: true })
    .eq('import_id', importId)
  if (shopErr) {
    return NextResponse.json({ error: 'Erreur lecture courses' }, { status: 500 })
  }

  // ── Créneaux manquants sur la plage de l'import ──
  // Repli robuste : si la plage est absente, on la dérive des dates distinctes.
  let dates = datesBetween(imp.date_range_start, imp.date_range_end)
  if (!dates.length) dates = [...new Set(meals.map(m => m.meal_date))].sort()

  const present = new Set(meals.map(m => `${m.meal_date}|${m.meal_type}|${m.household_member_id || m.person_name}`))
  const missing_slots = []
  for (const date of dates) {
    for (const g of expectedGrid) {
      for (const type of g.types) {
        if (!present.has(`${date}|${type}|${g.id}`) && !present.has(`${date}|${type}|${g.person}`)) {
          missing_slots.push({ date, type, person: g.person })
        }
      }
    }
  }
  const expected_count = dates.length * linesPerDay

  // ── Macros invalides : kcal null/0 sur un repas non-restes ──
  const invalid_macros = meals
    .filter(m => !isLeftover(m) && (m.kcal == null || Number(m.kcal) === 0))
    .map(m => ({ date: m.meal_date, type: m.meal_type, person: m.person_name }))

  // ── Déj/dîners sans fiche recette générée OU canonique ──
  // Indéterminable tant que la colonne v5 n'existe pas → liste vide (repli).
  const sansFiche = new Map()
  if (hasV5Columns) {
    for (const m of meals) {
      if (!['dejeuner', 'diner'].includes(m.meal_type)) continue
      if (isLeftover(m)) continue
      if (m.generated_recipe_id != null || m.canonical_recipe_execution_id != null || m.canonical_recipe_code) continue
      sansFiche.set(`${m.meal_date}|${m.meal_type}`, { date: m.meal_date, type: m.meal_type })
    }
  }
  const dej_diner_sans_fiche = [...sansFiche.values()]

  const ok =
    meals.length > 0 &&
    missing_slots.length === 0 &&
    invalid_macros.length === 0 &&
    dej_diner_sans_fiche.length === 0

  return NextResponse.json({
    meals_count: meals.length,
    expected_count,
    missing_slots,
    invalid_macros,
    dej_diner_sans_fiche,
    shopping_count: shoppingCount || 0,
    ok,
  })
}
