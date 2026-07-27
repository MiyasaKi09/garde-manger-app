import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import {
  APPRECIATION_LEVELS,
  PREFERENCE_SUBJECTS,
  buildHouseholdTasteProfile,
} from '@/lib/domain/planning/tastePreferences'

export const dynamic = 'force-dynamic'

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const validationError = (message) => {
  const error = new Error(message)
  error.code = 'validation'
  return error
}

/**
 * Valide une réponse du questionnaire de goûts (§5). Le contrôle est fait ici
 * ET par les CHECK de la table : l'API rend un message lisible, la base reste
 * la garantie d'intégrité.
 */
function normalizeInput(body = {}) {
  // household_members.id est un uuid : jamais de conversion numérique, qui
  // rejetterait tout identifiant valide.
  const memberId = String(body.household_member_id ?? body.householdMemberId ?? '').trim()
  if (!memberId) throw validationError('household_member_id requis')

  const subjectType = String(body.subject_type ?? body.subjectType ?? '').trim()
  if (!PREFERENCE_SUBJECTS.includes(subjectType)) {
    throw validationError(`subject_type invalide (attendu : ${PREFERENCE_SUBJECTS.join(', ')})`)
  }

  const label = String(body.subject_label ?? body.subjectLabel ?? body.subject_value ?? '').trim()
  const subjectValue = fold(body.subject_value ?? body.subjectValue ?? label)
  if (!subjectValue) throw validationError('subject_value requis')

  const appreciation = String(body.appreciation ?? '').trim()
  if (!APPRECIATION_LEVELS.includes(appreciation)) {
    throw validationError(`appreciation invalide (attendu : ${APPRECIATION_LEVELS.join(', ')})`)
  }

  const delay = Number(body.repeat_delay_days ?? body.repeatDelayDays)
  if (body.repeat_delay_days != null && (!Number.isFinite(delay) || delay < 0 || delay > 365)) {
    throw validationError('repeat_delay_days doit être compris entre 0 et 365')
  }

  return {
    household_member_id: memberId,
    subject_type: subjectType,
    subject_value: subjectValue,
    subject_label: label || subjectValue,
    appreciation,
    // Un interdit est toujours strict : « interdit » n'a pas de version souple.
    strict: appreciation === 'forbidden' ? true : body.strict === true,
    repeat_delay_days: Number.isFinite(delay) && delay >= 0 ? Math.floor(delay) : null,
    source: 'questionnaire',
  }
}

async function listPreferences(supabase, userId) {
  const { data, error } = await supabase
    .from('member_food_preferences')
    .select('id, household_member_id, subject_type, subject_value, subject_label, appreciation, strict, repeat_delay_days, source, updated_at')
    .eq('user_id', userId)
    .order('subject_type')
    .order('subject_label')
  if (error) {
    const failure = new Error(`Lecture du profil de goûts impossible: ${error.message}`)
    failure.status = error.code === '42P01' ? 503 : 500
    if (error.code === '42P01') failure.message = 'Le profil de goûts nécessite la migration member_food_preferences'
    throw failure
  }
  return data || []
}

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  try {
    const items = await listPreferences(supabase, user.id)
    // Le compromis de foyer est renvoyé avec les réponses individuelles :
    // l'écran peut montrer à la fois « ce que chacun a dit » et « ce que Myko
    // en déduit », y compris les désaccords.
    return NextResponse.json({ items, household: buildHouseholdTasteProfile(items) })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: Number(error.status) || 500 })
  }
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch {}

  try {
    const preference = normalizeInput(body)
    const { data: member, error: memberError } = await supabase
      .from('household_members')
      .select('id')
      .eq('id', preference.household_member_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (memberError || !member) throw validationError('Membre du foyer introuvable')

    // Un membre n'a qu'un avis par sujet : répondre à nouveau met à jour la
    // réponse précédente au lieu d'empiler des avis contradictoires.
    const { data, error } = await supabase
      .from('member_food_preferences')
      .upsert({ ...preference, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'household_member_id,subject_type,subject_value' })
      .select('id, household_member_id, subject_type, subject_value, subject_label, appreciation, strict, repeat_delay_days, source, updated_at')
      .single()
    if (error) throw new Error(`Enregistrement impossible: ${error.message}`)
    return NextResponse.json({ item: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'validation' ? 400 : 500 })
  }
}

export async function DELETE(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabase
    .from('member_food_preferences')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: `Suppression impossible: ${error.message}` }, { status: 500 })
  return NextResponse.json({ ok: true })
}
