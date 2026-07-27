/**
 * Modèle des goûts et compromis de foyer (plan de refonte §5, §6).
 *
 * Les réponses sont INDIVIDUELLES — chaque membre décrit ce qu'il aime, évite
 * ou refuse — puis le moteur calcule un compromis. Ce compromis n'est jamais
 * stocké : il se recalcule à chaque génération, si bien qu'un profil modifié
 * prend effet immédiatement.
 *
 * Deux principes gouvernent le compromis :
 *
 * 1. LE REFUS L'EMPORTE. Un interdit strict d'une seule personne interdit le
 *    plat pour tout le foyer. On ne fait pas la moyenne d'une allergie.
 * 2. L'ENVIE SE PARTAGE. Hors refus, les appréciations se moyennent : un plat
 *    que l'un adore et que l'autre trouve neutre reste un bon plat.
 *
 * Module PUR : aucune dépendance au solveur, aucune lecture de base.
 */

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

/** Les sept niveaux du plan (§5), du refus absolu à la curiosité. */
export const APPRECIATION = {
  FORBIDDEN: 'forbidden',
  DISLIKED: 'disliked',
  AVOIDED: 'avoided',
  NEUTRAL: 'neutral',
  LIKED: 'liked',
  FAVORITE: 'favorite',
  TO_DISCOVER: 'to_discover',
}

/**
 * Poids de score de chaque niveau. L'échelle est volontairement asymétrique :
 * déplaire coûte plus cher que plaire ne rapporte. Une semaine sans plat
 * détesté vaut mieux qu'une semaine avec un favori et une aversion.
 */
const APPRECIATION_WEIGHT = {
  [APPRECIATION.FORBIDDEN]: -100,
  [APPRECIATION.DISLIKED]: -45,
  [APPRECIATION.AVOIDED]: -18,
  [APPRECIATION.NEUTRAL]: 0,
  [APPRECIATION.LIKED]: 10,
  [APPRECIATION.FAVORITE]: 20,
  // « À découvrir » n'est pas une appréciation acquise : c'est une invitation.
  // Elle vaut un petit encouragement, jamais un favori.
  [APPRECIATION.TO_DISCOVER]: 6,
}

const RANK = {
  [APPRECIATION.FORBIDDEN]: 0,
  [APPRECIATION.DISLIKED]: 1,
  [APPRECIATION.AVOIDED]: 2,
  [APPRECIATION.NEUTRAL]: 3,
  [APPRECIATION.TO_DISCOVER]: 4,
  [APPRECIATION.LIKED]: 5,
  [APPRECIATION.FAVORITE]: 6,
}

export const APPRECIATION_LEVELS = Object.freeze(Object.values(APPRECIATION))

/**
 * Sujets sur lesquels un goût peut porter. Ils miroitent les dimensions de
 * diversité du moteur : une préférence se rapproche donc d'une recette sans
 * table de traduction.
 */
export const PREFERENCE_SUBJECTS = Object.freeze([
  'ingredient', 'recipe', 'cuisine', 'technique', 'texture',
  'sensory_profile', 'temperature', 'richness', 'vegetarian', 'leftovers',
])

const isKnownLevel = (value) => APPRECIATION_LEVELS.includes(value)

/**
 * Normalise une ligne de `member_food_preferences`. Une ligne inexploitable
 * (sujet inconnu, niveau inconnu, valeur vide) est écartée plutôt que
 * silencieusement interprétée.
 */
export function normalizeTastePreference(row = {}) {
  const subjectType = String(row.subject_type ?? row.subjectType ?? '').trim()
  const subjectValue = fold(row.subject_value ?? row.subjectValue)
  const appreciation = String(row.appreciation ?? '').trim()
  if (!PREFERENCE_SUBJECTS.includes(subjectType)) return null
  if (!subjectValue) return null
  if (!isKnownLevel(appreciation)) return null
  const delay = Number(row.repeat_delay_days ?? row.repeatDelayDays)
  return {
    memberId: row.household_member_id ?? row.householdMemberId ?? null,
    subjectType,
    subjectValue,
    subjectLabel: row.subject_label ?? row.subjectLabel ?? null,
    appreciation,
    // Un interdit est TOUJOURS strict, même si la ligne ne le dit pas :
    // « interdit » n'a pas de version souple.
    strict: appreciation === APPRECIATION.FORBIDDEN || row.strict === true,
    repeatDelayDays: Number.isFinite(delay) && delay >= 0 ? Math.floor(delay) : null,
  }
}

/**
 * Compromis de foyer (§5 : « Les réponses sont individuelles, puis le moteur
 * calcule un compromis de foyer »).
 *
 * Pour chaque sujet :
 * - `forbidden` si au moins une personne l'interdit strictement ;
 * - sinon le niveau le plus BAS exprimé quand il est négatif — on ne sert pas
 *   à quelqu'un un plat qu'il déteste sous prétexte que l'autre l'adore ;
 * - sinon la moyenne des poids, arrondie au niveau le plus proche.
 */
export function buildHouseholdTasteProfile(rows = []) {
  const bySubject = new Map()
  for (const raw of rows) {
    const preference = normalizeTastePreference(raw)
    if (!preference) continue
    const key = `${preference.subjectType}|${preference.subjectValue}`
    if (!bySubject.has(key)) bySubject.set(key, [])
    bySubject.get(key).push(preference)
  }

  const subjects = {}
  for (const [key, preferences] of bySubject) {
    const [subjectType, subjectValue] = key.split('|')
    const strictlyForbidden = preferences.some((preference) => preference.strict
      && preference.appreciation === APPRECIATION.FORBIDDEN)
    const worst = preferences.reduce((lowest, preference) => (
      RANK[preference.appreciation] < RANK[lowest.appreciation] ? preference : lowest
    ), preferences[0])

    let appreciation
    if (strictlyForbidden) {
      appreciation = APPRECIATION.FORBIDDEN
    } else if (RANK[worst.appreciation] < RANK[APPRECIATION.NEUTRAL]) {
      appreciation = worst.appreciation
    } else {
      const average = preferences.reduce((sum, preference) => sum + APPRECIATION_WEIGHT[preference.appreciation], 0)
        / preferences.length
      appreciation = APPRECIATION_LEVELS
        .filter((level) => level !== APPRECIATION.FORBIDDEN)
        .reduce((closest, level) => (
          Math.abs(APPRECIATION_WEIGHT[level] - average) < Math.abs(APPRECIATION_WEIGHT[closest] - average)
            ? level
            : closest
        ), APPRECIATION.NEUTRAL)
    }

    const delays = preferences.map((preference) => preference.repeatDelayDays).filter((value) => value != null)
    subjects[key] = {
      subjectType,
      subjectValue,
      label: preferences.find((preference) => preference.subjectLabel)?.subjectLabel || subjectValue,
      appreciation,
      strict: strictlyForbidden,
      // Le délai retenu est le PLUS LONG demandé : si l'un accepte un plat
      // chaque semaine et l'autre une fois par mois, on espace.
      repeatDelayDays: delays.length ? Math.max(...delays) : null,
      memberCount: preferences.length,
      dissenting: new Set(preferences.map((preference) => preference.appreciation)).size > 1,
    }
  }

  return {
    subjects,
    /** Sujets strictement interdits, par type — injectés dans les contraintes dures. */
    forbidden: Object.values(subjects)
      .filter((subject) => subject.appreciation === APPRECIATION.FORBIDDEN)
      .reduce((acc, subject) => {
        acc[subject.subjectType] = [...(acc[subject.subjectType] || []), subject.subjectValue]
        return acc
      }, {}),
    isEmpty: Object.keys(subjects).length === 0,
  }
}

export const EMPTY_TASTE_PROFILE = Object.freeze(buildHouseholdTasteProfile([]))

const lookup = (profile, subjectType, subjectValue) => {
  const value = fold(subjectValue)
  if (!value) return null
  return profile?.subjects?.[`${subjectType}|${value}`] || null
}

/**
 * Sujets d'une recette, exprimés dans le vocabulaire des préférences. Le profil
 * de diversité fournit déjà cuisine, technique, texture, profil aromatique,
 * température et caractère végétarien ; on y ajoute la recette elle-même et ses
 * ingrédients.
 */
export function recipeTasteSubjects(recipe, diversity = null) {
  const subjects = []
  if (recipe?.code) subjects.push(['recipe', recipe.code])
  if (recipe?.family) subjects.push(['recipe', recipe.family])
  for (const ingredient of recipe?.exactIngredients || []) {
    if (ingredient?.optional) continue
    const form = ingredient.formNormalized || ingredient.name
    if (form) subjects.push(['ingredient', form])
  }
  if (diversity) {
    for (const [subjectType, key] of [
      ['cuisine', 'cuisine'], ['technique', 'technique'], ['texture', 'texture'],
      ['sensory_profile', 'sensoryProfile'], ['temperature', 'temperature'], ['richness', 'richness'],
    ]) {
      if (diversity[key]) subjects.push([subjectType, diversity[key]])
    }
    if (diversity.vegetarian) subjects.push(['vegetarian', diversity.vegetarian])
  }
  return subjects
}

/**
 * Un plat est-il strictement refusé par le foyer ? Contrainte DURE : le moteur
 * l'écarte sans négociation, exactement comme une allergie.
 */
export function isTasteForbidden(recipe, profile = EMPTY_TASTE_PROFILE, diversity = null) {
  if (!profile || profile.isEmpty) return null
  for (const [subjectType, value] of recipeTasteSubjects(recipe, diversity)) {
    const subject = lookup(profile, subjectType, value)
    if (subject?.appreciation === APPRECIATION.FORBIDDEN) {
      return { subjectType, subjectValue: subject.subjectValue, label: subject.label }
    }
  }
  return null
}

/**
 * Score de goût d'une recette pour le foyer (§10, critère « Goût : maximiser
 * l'acceptation »). Positif = apprécié, négatif = subi. Les sujets absents du
 * profil ne pèsent rien : ne pas s'être prononcé n'est pas un avis.
 *
 * Les ingrédients pèsent moins qu'une recette entière ou qu'une cuisine : aimer
 * la coriandre ne fait pas d'un plat un favori, mais la détester suffit à le
 * plomber.
 */
const SUBJECT_WEIGHT = {
  recipe: 1,
  cuisine: 0.6,
  ingredient: 0.4,
  technique: 0.35,
  sensory_profile: 0.35,
  texture: 0.3,
  temperature: 0.25,
  richness: 0.25,
  vegetarian: 0.3,
  leftovers: 0.5,
}

export function tasteScore(recipe, profile = EMPTY_TASTE_PROFILE, diversity = null) {
  if (!profile || profile.isEmpty) return { total: 0, reasons: [] }
  let total = 0
  const reasons = []
  const seen = new Set()
  for (const [subjectType, value] of recipeTasteSubjects(recipe, diversity)) {
    const subject = lookup(profile, subjectType, value)
    if (!subject) continue
    const key = `${subject.subjectType}|${subject.subjectValue}`
    if (seen.has(key)) continue
    seen.add(key)
    const weight = SUBJECT_WEIGHT[subjectType] ?? 0.3
    const contribution = APPRECIATION_WEIGHT[subject.appreciation] * weight
    if (!contribution) continue
    total += contribution
    reasons.push({
      code: contribution > 0 ? 'taste_liked' : 'taste_disliked',
      subjectType,
      subject: subject.label,
      appreciation: subject.appreciation,
      // Un désaccord dans le foyer mérite d'être dit à l'affichage.
      dissenting: subject.dissenting,
    })
  }
  return { total, reasons }
}

/**
 * Délai de retour demandé pour cette recette, s'il a été exprimé (§5 : « quels
 * plats peuvent revenir chaque semaine ; quels plats ne doivent revenir qu'une
 * fois par mois »). `null` quand personne ne s'est prononcé — le moteur garde
 * alors le délai par défaut de ses règles de répétition.
 */
export function requestedRepeatDelayDays(recipe, profile = EMPTY_TASTE_PROFILE) {
  if (!profile || profile.isEmpty) return null
  const delays = [
    lookup(profile, 'recipe', recipe?.code)?.repeatDelayDays,
    lookup(profile, 'recipe', recipe?.family)?.repeatDelayDays,
  ].filter((value) => value != null)
  return delays.length ? Math.max(...delays) : null
}

/**
 * Traduit un retour après consommation (§6) en préférence à enregistrer.
 * `null` quand le retour n'appelle aucun changement de profil : « acceptable »
 * confirme l'existant, il n'apprend rien.
 */
export function preferenceFromFeedback(feedback = {}) {
  const map = {
    loved: APPRECIATION.FAVORITE,
    never_again: APPRECIATION.DISLIKED,
    to_adjust: APPRECIATION.AVOIDED,
  }
  const appreciation = map[feedback.appreciation]
  if (!appreciation) return null
  const subjectValue = feedback.canonical_recipe_code ?? feedback.canonicalRecipeCode
  if (!subjectValue) return null
  return {
    subject_type: 'recipe',
    subject_value: fold(subjectValue),
    subject_label: feedback.recipe_label ?? feedback.recipeLabel ?? String(subjectValue),
    appreciation,
    // Un retour ne crée JAMAIS une contrainte dure : « ne plus proposer » est
    // une aversion forte, pas un interdit médical.
    strict: false,
    source: 'feedback',
  }
}
