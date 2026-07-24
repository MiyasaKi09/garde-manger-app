import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { normalizeGoalInput, resolvePlanningGoals } from '@/lib/domain/settings/planningSettings'

export const dynamic = 'force-dynamic'

const isoDate = (date = new Date()) => date.toISOString().slice(0, 10)
const previousIsoDate = (iso) => {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

async function loadGoalContext(supabase, userId, effectiveDate = isoDate()) {
  const [membersResult, healthResult, versionsResult] = await Promise.all([
    supabase
      .from('household_members')
      .select('id, name, active')
      .eq('user_id', userId)
      .order('created_at'),
    supabase
      .from('user_health_goals')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('nutrition_target_versions')
      .select('member_id, effective_from, effective_to, target_kcal, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g, tolerance_percent, source, rationale')
      .eq('user_id', userId)
      .lte('effective_from', effectiveDate)
      .order('effective_from', { ascending: false }),
  ])

  if (membersResult.error) throw new Error(`Lecture du foyer impossible: ${membersResult.error.message}`)
  if (healthResult.error) throw new Error(`Lecture des objectifs impossible: ${healthResult.error.message}`)
  if (versionsResult.error) throw new Error(`Lecture des versions d'objectifs impossible: ${versionsResult.error.message}`)

  const members = (membersResult.data || []).filter((member) => member.active !== false)
  const goals = resolvePlanningGoals({
    members,
    healthGoals: healthResult.data || [],
    targetVersions: versionsResult.data || [],
    windowStart: effectiveDate,
  })
  return { members, goals }
}

/** GET /api/nutrition/goals — objectifs actifs, reliés aux membres du foyer. */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const { goals } = await loadGoalContext(supabase, user.id)
    return NextResponse.json({ goals })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function syncTargetVersion(supabase, userId, goal, effectiveDate) {
  const { data: sameDay, error: sameDayError } = await supabase
    .from('nutrition_target_versions')
    .select('id')
    .eq('user_id', userId)
    .eq('member_id', goal.household_member_id)
    .eq('effective_from', effectiveDate)
    .maybeSingle()
  if (sameDayError) throw new Error(`Lecture de la version nutritionnelle impossible: ${sameDayError.message}`)

  const versionValues = {
    target_kcal: goal.target_calories,
    target_protein_g: goal.target_protein_g,
    target_carbs_g: goal.target_carbs_g,
    target_fat_g: goal.target_fat_g,
    target_fiber_g: goal.target_fiber_g,
    tolerance_percent: 10,
    source: goal.calculation_source,
    rationale: {
      profile: {
        age: goal.age,
        sex: goal.sex,
        height_cm: goal.height_cm,
        current_weight_kg: goal.current_weight_kg,
        target_weight_kg: goal.target_weight_kg,
        activity_level: goal.activity_level,
        weight_loss_rate: goal.weight_loss_rate,
        bmr: goal.bmr,
        tdee: goal.tdee,
      },
      saved_from: 'settings_planning',
    },
  }

  if (sameDay?.id) {
    const { error } = await supabase
      .from('nutrition_target_versions')
      .update({ ...versionValues, effective_to: null })
      .eq('id', sameDay.id)
      .eq('user_id', userId)
    if (error) throw new Error(`Mise à jour de la cible active impossible: ${error.message}`)
    return
  }

  const { error: closeError } = await supabase
    .from('nutrition_target_versions')
    .update({ effective_to: previousIsoDate(effectiveDate) })
    .eq('user_id', userId)
    .eq('member_id', goal.household_member_id)
    .is('effective_to', null)
    .lt('effective_from', effectiveDate)
  if (closeError) throw new Error(`Clôture de l'ancienne cible impossible: ${closeError.message}`)

  const { error: insertError } = await supabase
    .from('nutrition_target_versions')
    .insert({
      user_id: userId,
      member_id: goal.household_member_id,
      effective_from: effectiveDate,
      effective_to: null,
      ...versionValues,
    })
  if (insertError) throw new Error(`Création de la cible active impossible: ${insertError.message}`)
}

/**
 * POST /api/nutrition/goals
 * Body: { goals: [{ household_member_id, targets..., profil..., calculation_source }] }
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch {}
  if (!Array.isArray(body.goals) || !body.goals.length || body.goals.length > 20) {
    return NextResponse.json({ error: 'goals array requis' }, { status: 400 })
  }

  try {
    const { data: memberRows, error: memberError } = await supabase
      .from('household_members')
      .select('id, name, active')
      .eq('user_id', user.id)
    if (memberError) throw new Error(`Lecture du foyer impossible: ${memberError.message}`)

    const members = (memberRows || []).filter((member) => member.active !== false)
    const memberById = new Map(members.map((member) => [member.id, member]))
    const memberByName = new Map(members.map((member) => [String(member.name).trim().toLocaleLowerCase('fr-FR'), member]))
    const normalized = body.goals.map((input) => {
      const member = memberById.get(input.household_member_id)
        || memberByName.get(String(input.person_name || '').trim().toLocaleLowerCase('fr-FR'))
      return normalizeGoalInput(input, member)
    })

    const healthRows = normalized.map((goal) => ({
      user_id: user.id,
      household_member_id: goal.household_member_id,
      person_name: goal.person_name,
      target_calories: goal.target_calories,
      target_protein_g: goal.target_protein_g,
      target_fat_g: goal.target_fat_g,
      target_carbs_g: goal.target_carbs_g,
      target_fiber_g: goal.target_fiber_g,
      target_weight_kg: goal.target_weight_kg,
      age: goal.age,
      sex: goal.sex,
      height_cm: goal.height_cm,
      current_weight_kg: goal.current_weight_kg,
      activity_level: goal.activity_level,
      weight_loss_rate: goal.weight_loss_rate,
      bmr: goal.bmr,
      tdee: goal.tdee,
      updated_at: new Date().toISOString(),
    }))

    const { error: upsertError } = await supabase
      .from('user_health_goals')
      .upsert(healthRows, { onConflict: 'user_id,person_name' })
    if (upsertError) throw new Error(`Sauvegarde des objectifs impossible: ${upsertError.message}`)

    const effectiveDate = isoDate()
    for (const goal of normalized) {
      await syncTargetVersion(supabase, user.id, goal, effectiveDate)
    }

    const { goals } = await loadGoalContext(supabase, user.id, effectiveDate)
    return NextResponse.json({ success: true, goals, effective_from: effectiveDate })
  } catch (error) {
    const status = error.code === 'validation' ? 400 : 500
    return NextResponse.json({ error: error.message, details: error.details || null }, { status })
  }
}
