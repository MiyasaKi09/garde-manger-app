import { MAX_MEAT_MEALS_PER_WEEK, declaredNumber } from '@/lib/domain/planning/memberPlanningRules'
import { PROTEIN_COEFFICIENT_RANGE, calculateMacros } from '@/lib/nutritionCalculator'

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

  goal.protein_coefficient_g_per_kg = asNumber(
    input.protein_coefficient_g_per_kg,
    'protein_coefficient_g_per_kg',
    [PROTEIN_COEFFICIENT_RANGE.min, PROTEIN_COEFFICIENT_RANGE.max],
    { optional: true },
  )

  goal.calculation_source = input.calculation_source === 'manual' ? 'manual' : 'questionnaire'

  // LA CIBLE PROTÉIQUE EST RECALCULÉE ICI — livrable 1.3.
  //
  // Elle l'est côté SERVEUR, à chaque enregistrement, et non reprise telle que
  // l'écran l'envoie. C'est ce qui rend vraie la phrase du plan : « recalculée
  // à chaque changement de poids cible ». Sans cela, un poids cible modifié
  // sans repasser par le bouton « Calculer » laisserait en base une cible
  // périmée, et rien ne distinguerait cette cible périmée d'une cible juste.
  //
  // Le calcul ne s'applique qu'à la source `questionnaire`. Une valeur saisie à
  // la main (`manual`) est une décision de la personne : on l'enregistre telle
  // quelle, et la règle enregistrée dit `basis: 'manual'` pour qu'on puisse
  // plus tard la distinguer d'une cible calculée.
  if (goal.calculation_source === 'questionnaire') {
    const {
      protein_g, carbs_g, fat_g, fiber_g, protein_rule: rule,
    } = calculateMacros({
      targetCalories: goal.target_calories,
      targetWeightKg: goal.target_weight_kg,
      proteinCoefficient: goal.protein_coefficient_g_per_kg,
      weightLossRate: goal.weight_loss_rate,
    })
    if (protein_g == null) {
      // Le poids cible manque : la cible protéique n'existe pas. On le DIT au
      // lieu de retomber sur le poids actuel, qui est exactement le défaut que
      // le livrable 1.3 corrige.
      const error = new Error('target_weight_kg_required')
      error.code = 'validation'
      error.details = { field: 'target_weight_kg', reason: 'protein_target_needs_target_weight' }
      throw error
    }
    // Les quatre macros repartent du même calcul : les glucides sont « le
    // reste » une fois les protéines et les lipides posés, et un reste calculé
    // sur une autre cible protéique que celle qu'on enregistre ne fermerait
    // plus le budget énergétique.
    goal.target_protein_g = protein_g
    goal.target_carbs_g = carbs_g
    goal.target_fat_g = fat_g
    goal.target_fiber_g = fiber_g
    goal.protein_rule = rule
  } else {
    goal.protein_rule = {
      basis: 'manual',
      formula: null,
      coefficient_g_per_kg: goal.protein_coefficient_g_per_kg,
      coefficient_source: goal.protein_coefficient_g_per_kg == null ? null : 'member',
      target_weight_kg: goal.target_weight_kg,
      missing: [],
    }
  }
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

/**
 * Quota carné d'un membre tel qu'il sera ENREGISTRÉ — livrable 1.1.
 *
 * Trois cas, et ils se distinguent : un nombre valide est arrondi et borné aux
 * quatorze repas principaux de la semaine ; une absence (`null`, `undefined`,
 * chaîne vide ou blanche) reste une absence ; une saisie inexploitable —
 * texte, booléen, tableau, nombre négatif, infini — est refusée par une erreur
 * de validation plutôt que silencieusement ramenée à 0. La différence compte :
 * ramener « abc » à 0 enregistrerait « cette personne ne mange pas de
 * viande », ce que personne n'a écrit, et le relecteur suivant ne pourrait
 * plus distinguer ce 0 d'un choix.
 *
 * CORRIGÉ À LA RELECTURE DU 17 SEPTEMBRE 2026. Cette fonction employait
 * `Number(value)`, qui rend **0** pour `'  '`, `[]` et `false`, **1** pour
 * `true` et **3** pour `[3]` : les quatre premières saisies enregistraient
 * donc exactement le « aucune viande » que le commentaire ci-dessus promettait
 * de refuser, et la troisième un quota de trois repas que personne n'avait
 * écrit. Le tri de ce qui est un nombre appartient à `declaredNumber`, qui
 * porte la démonstration.
 */
export function normalizeMeatMealsPerWeek(value) {
  // Une chaîne vide OU BLANCHE est une absence, pas un refus : un champ effacé
  // au clavier arrive ainsi, et le refuser empêcherait de RETIRER un quota
  // posé une fois. Une chaîne non vide qui n'est pas un nombre, elle, est
  // refusée comme n'importe quelle autre saisie inexploitable.
  if (value == null || (typeof value === 'string' && !value.trim())) return null
  const quota = declaredNumber(value)
  if (quota == null || quota < 0 || quota > MAX_MEAT_MEALS_PER_WEEK) {
    const error = new Error('meat_meals_per_week_out_of_range')
    error.code = 'validation'
    error.details = { field: 'meat_meals_per_week', min: 0, max: MAX_MEAT_MEALS_PER_WEEK }
    throw error
  }
  return Math.round(quota)
}

export function mergePlanningPreferences(existing = {}, planning = {}) {
  const current = existing && typeof existing === 'object' ? existing : {}
  const previousPlanning = current.planning && typeof current.planning === 'object' ? current.planning : {}
  const quota = normalizeMeatMealsPerWeek(planning.meat_meals_per_week)
  return {
    ...current,
    planning: {
      ...previousPlanning,
      breakfast: Boolean(planning.breakfast),
      snack: Boolean(planning.snack),
      // Le quota carné de la personne (livrable 1.1). Il n'est écrit que s'il
      // est déclaré : un `meat_meals_per_week: null` posé dans le profil se
      // relirait comme « réglé à rien », et rien ne le distinguerait d'un
      // réglage effacé. L'absence de clé est la seule forme honnête de
      // l'absence de réglage.
      ...(quota == null ? {} : { meat_meals_per_week: quota }),
      // Héritage conservé tel quel : les profils enregistrés avant le quota
      // portent ce champ, et l'effacer ici changerait leur semaine sans que
      // personne n'ait touché à un réglage (cf. `memberPlanningRules.js`).
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
      // La RÈGLE qui a produit la cible protéique, telle qu'elle a été
      // versionnée (livrable 1.3). `null` pour les versions écrites avant ce
      // livrable : leur cible existe, sa règle non — et c'est exactement ce
      // qu'il faut pouvoir lire, plutôt que de supposer laquelle c'était.
      protein_rule: version?.rationale?.protein_rule ?? null,
    }
    return Number(resolved.target_calories) > 0 ? [resolved] : []
  })
}

export { fold as foldPlanningSetting }
