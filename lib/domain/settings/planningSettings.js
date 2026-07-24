const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const OPTIONAL_RANGES = {
  age: [1, 120],
  height_cm: [80, 250],
  current_weight_kg: [20, 400],
  target_weight_kg: [20, 400],
  weight_loss_rate: [0, 2],
  bmr: [500, 6000],
  tdee: [500, 10000],
}

const TARGET_RANGES = {
  target_calories: [800, 6000],
  target_protein_g: [0, 500],
  target_carbs_g: [0, 1000],
  target_fat_g: [0, 400],
  target_fiber_g: [0, 150],
}

const asNumber = (value, field, [min, max], { optional = false } = {}) => {
  if (value == null || value === '') {
    if (optional) return null
    const error = new Error(`${field}_required`)
    error.code = 'validation'
    throw error
  }
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) {
    const error = new Error(`${field}_out_of_range`)
    error.code = 'validation'
    error.details = { field, min, max }
    throw error
  }
  return number
}

export function normalizeGoalInput(input = {}, member = {}) {
  if (!member?.id || !member?.name) {
    const error = new Error('household_member_required')
    error.code = 'validation'
    throw error
  }

  const goal = {
    household_member_id: member.id,
    person_name: member.name,
  }

  for (const [field, range] of Object.entries(TARGET_RANGES)) {
    goal[field] = asNumber(input[field], field, range)
  }
  for (const [field, range] of Object.entries(OPTIONAL_RANGES)) {
    goal[field] = asNumber(input[field], field, range, { optional: true })
  }

  const sex = String(input.sex || '').toUpperCase()
  goal.sex = ['M', 'F'].includes(sex) ? sex : null

  const activity = String(input.activity_level || '').trim()
  goal.activity_level = ['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activity)
    ? activity
    : null

  goal.calculation_source = input.calculation_source === 'manual' ? 'manual' : 'questionnaire'
  return goal
}

export function normalizeFoodPreference(input = {}) {
  const name = String(input.name || '').replace(/\s+/g, ' ').trim()
  if (name.length < 2 || name.length > 80) {
    const error = new Error('food_preference_name_invalid')
    error.code = 'validation'
    throw error
  }
  const kind = input.kind === 'dislike' ? 'dislike' : 'ban'
  return {
    name,
    normalized_name: fold(name),
    kind,
    note: String(input.note || '').trim().slice(0, 240) || null,
  }
}

export function mergePlanningPreferences(existing = {}, planning = {}) {
  const current = existing && typeof existing === 'object' ? existing : {}
  const previousPlanning = current.planning && typeof current.planning === 'object' ? current.planning : {}
  return {
    ...current,
    planning: {
      ...previousPlanning,
      breakfast: Boolean(planning.breakfast),
      snack: Boolean(planning.snack),
      vegetarian_meat_swaps_per_week: Math.max(0, Math.min(14, Number(planning.vegetarian_meat_swaps_per_week) || 0)),
    },
  }
}

export function resolvePlanningGoals({ members = [], healthGoals = [], targetVersions = [], windowStart }) {
  const start = String(windowStart || '')
  const healthByMember = new Map()
  const healthByName = new Map()
  for (const goal of healthGoals || []) {
    if (goal.household_member_id) healthByMember.set(goal.household_member_id, goal)
    if (goal.person_name) healthByName.set(fold(goal.person_name), goal)
  }

  const versionsByMember = new Map()
  const sortedVersions = [...(targetVersions || [])].sort((a, b) => String(b.effective_from || '').localeCompare(String(a.effective_from || '')))
  for (const version of sortedVersions) {
    if (!version.member_id || versionsByMember.has(version.member_id)) continue
    const effectiveFrom = String(version.effective_from || '')
    const effectiveTo = version.effective_to ? String(version.effective_to) : null
    if (start && effectiveFrom && effectiveFrom > start) continue
    if (start && effectiveTo && effectiveTo < start) continue
    versionsByMember.set(version.member_id, version)
  }

  return (members || []).flatMap((member) => {
    const legacy = healthByMember.get(member.id) || healthByName.get(fold(member.name)) || null
    const version = versionsByMember.get(member.id) || null
    const resolved = {
      ...(legacy || {}),
      household_member_id: member.id,
      person_name: member.name,
      target_calories: version?.target_kcal ?? legacy?.target_calories ?? null,
      target_protein_g: version?.target_protein_g ?? legacy?.target_protein_g ?? null,
      target_carbs_g: version?.target_carbs_g ?? legacy?.target_carbs_g ?? null,
      target_fat_g: version?.target_fat_g ?? legacy?.target_fat_g ?? null,
      target_fiber_g: version?.target_fiber_g ?? legacy?.target_fiber_g ?? null,
      target_source: version?.source || (legacy ? 'user_health_goals' : null),
    }
    return Number(resolved.target_calories) > 0 ? [resolved] : []
  })
}

export { fold as foldPlanningSetting }
