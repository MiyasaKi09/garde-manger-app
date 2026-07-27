import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { preferenceFromFeedback } from '@/lib/domain/planning/tastePreferences'

export const dynamic = 'force-dynamic'

const MEAL_TYPES = ['pdj', 'dejeuner', 'collation', 'diner']
const APPRECIATIONS = ['loved', 'acceptable', 'to_adjust', 'never_again']
const PORTION_FITS = ['too_small', 'right', 'too_large']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const validationError = (message) => {
  const error = new Error(message)
  error.code = 'validation'
  return error
}

const asBoolean = (value) => (typeof value === 'boolean' ? value : null)

/**
 * Retour après consommation (§6, §15). Les axes non renseignés restent NULL :
 * ne pas s'être prononcé n'est pas répondre « non ».
 */
function normalizeFeedback(body = {}) {
  if (!ISO_DATE.test(String(body.meal_date || ''))) throw validationError('meal_date (AAAA-MM-JJ) requis')
  if (!MEAL_TYPES.includes(body.meal_type)) throw validationError(`meal_type invalide (attendu : ${MEAL_TYPES.join(', ')})`)
  if (!APPRECIATIONS.includes(body.appreciation)) throw validationError(`appreciation invalide (attendu : ${APPRECIATIONS.join(', ')})`)
  if (body.portion_fit != null && !PORTION_FITS.includes(body.portion_fit)) {
    throw validationError(`portion_fit invalide (attendu : ${PORTION_FITS.join(', ')})`)
  }
  // household_members.id est un uuid : on le transmet tel quel.
  const memberId = String(body.household_member_id ?? '').trim()
  return {
    household_member_id: memberId || null,
    meal_date: body.meal_date,
    meal_type: body.meal_type,
    canonical_recipe_code: body.canonical_recipe_code || null,
    appreciation: body.appreciation,
    portion_fit: body.portion_fit ?? null,
    too_repetitive: asBoolean(body.too_repetitive),
    too_heavy: asBoolean(body.too_heavy),
    too_light: asBoolean(body.too_light),
    side_dish_fit: asBoolean(body.side_dish_fit),
    note: body.note ? String(body.note).slice(0, 500) : null,
  }
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch {}

  try {
    const feedback = normalizeFeedback(body)
    const { data, error } = await supabase
      .from('meal_feedback')
      .insert({ ...feedback, user_id: user.id })
      .select('id, meal_date, meal_type, canonical_recipe_code, appreciation')
      .single()
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Le retour après repas nécessite la migration meal_feedback' }, { status: 503 })
      }
      throw new Error(`Enregistrement du retour impossible: ${error.message}`)
    }

    // « Aimé » et « ne plus proposer » enrichissent le profil de goûts (§6 :
    // « Ces retours enrichissent progressivement le profil »). « Acceptable »
    // ne change rien : il confirme l'existant.
    const preference = preferenceFromFeedback({ ...feedback, recipe_label: body.recipe_label })
    let learned = null
    if (preference && feedback.household_member_id) {
      const { data: saved } = await supabase
        .from('member_food_preferences')
        .upsert({
          ...preference,
          user_id: user.id,
          household_member_id: feedback.household_member_id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'household_member_id,subject_type,subject_value' })
        .select('subject_value, appreciation')
        .maybeSingle()
      learned = saved || null
    }

    return NextResponse.json({ item: data, learned }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'validation' ? 400 : 500 })
  }
}
