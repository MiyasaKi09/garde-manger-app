/**
 * Parcours guidé du questionnaire de goûts (plan de refonte §5).
 *
 * Le plan énumère onze questions. Elles n'atterrissent pas au même endroit :
 * certaines décrivent un GOÛT (un aliment refusé, une cuisine appréciée) et
 * vont dans `member_food_preferences` ; d'autres décrivent une ORGANISATION
 * (jours de cuisine, niveau de curiosité) et vont dans les préférences du
 * membre. Cette table de description tient les deux, pour que l'écran n'ait
 * qu'à la parcourir.
 *
 * Séparer les deux destinations ici évite qu'un ajout de question oblige à
 * toucher la logique de l'écran.
 */

/** Une étape écrit soit un goût (`preference`), soit un réglage (`setting`). */
export const QUESTION_STEPS = Object.freeze([
  {
    key: 'weekly_favorites',
    kind: 'preference',
    title: 'Quels plats peuvent revenir chaque semaine ?',
    help: 'Ceux dont vous ne vous lassez pas. Myko pourra les reproposer souvent.',
    subjectType: 'recipe',
    appreciation: 'favorite',
    repeatDelayDays: 7,
    placeholder: 'carbonade flamande, gratin dauphinois…',
    multiple: true,
  },
  {
    key: 'monthly_dishes',
    kind: 'preference',
    title: 'Quels plats ne doivent revenir qu’une fois par mois ?',
    help: 'Vous les aimez, mais espacés.',
    subjectType: 'recipe',
    appreciation: 'liked',
    repeatDelayDays: 30,
    placeholder: 'couscous, raclette…',
    multiple: true,
  },
  {
    key: 'refused_foods',
    kind: 'preference',
    title: 'Quels aliments refusez-vous ?',
    help: 'Jamais servis, sans exception. Les allergies se règlent séparément, dans les interdits stricts.',
    subjectType: 'ingredient',
    appreciation: 'forbidden',
    placeholder: 'coriandre, abats, olives…',
    multiple: true,
  },
  {
    key: 'disliked_textures',
    kind: 'preference',
    title: 'Quelles textures ou associations vous déplaisent ?',
    help: 'Myko en tiendra compte sans les interdire.',
    subjectType: 'texture',
    appreciation: 'disliked',
    placeholder: 'gluant, sucré-salé, très épicé…',
    multiple: true,
  },
  {
    key: 'liked_cuisines',
    kind: 'preference',
    title: 'Quelles cuisines appréciez-vous ?',
    help: 'Elles reviendront plus volontiers dans la semaine.',
    subjectType: 'cuisine',
    appreciation: 'liked',
    placeholder: 'italienne, thaïe, marocaine…',
    multiple: true,
  },
  {
    key: 'leftovers',
    kind: 'preference',
    title: 'Acceptez-vous les restes ?',
    help: 'Un reste bien placé évite du gaspillage et une cuisson.',
    subjectType: 'leftovers',
    subjectValue: 'restes',
    choices: [
      { value: 'favorite', label: 'Volontiers' },
      { value: 'neutral', label: 'Sans préférence' },
      { value: 'avoided', label: 'Plutôt pas' },
      { value: 'disliked', label: 'Non merci' },
    ],
  },
  {
    key: 'discovery_mode',
    kind: 'setting',
    field: 'discovery_mode',
    title: 'Quel est votre niveau de curiosité ?',
    help: 'Il fixe la part de nouveautés dans la semaine.',
    choices: [
      { value: 'very_familiar', label: 'Très familier', hint: '80 % de repères, 5 % de découvertes' },
      { value: 'balanced', label: 'Équilibré', hint: '60 % de repères, 15 % de découvertes' },
      { value: 'curious', label: 'Curieux', hint: '40 % de repères, 25 % de découvertes' },
    ],
  },
  {
    key: 'weekly_discoveries',
    kind: 'setting',
    field: 'weekly_discoveries',
    title: 'Combien de nouveautés par semaine ?',
    help: 'Laissez vide pour suivre simplement votre niveau de curiosité.',
    numeric: { min: 0, max: 14 },
  },
  {
    key: 'cooking_days',
    kind: 'setting',
    field: 'cooking_days',
    title: 'Quels jours avez-vous le temps de cuisiner ?',
    help: 'Myko y placera les plats les plus longs.',
    days: true,
  },
  {
    key: 'quick_days',
    kind: 'setting',
    field: 'quick_days',
    title: 'Quels jours faut-il un repas rapide ?',
    help: 'Ces soirs-là, priorité aux plats prêts vite ou aux restes.',
    days: true,
  },
  {
    key: 'lunch_style',
    kind: 'setting',
    field: 'lunch_style',
    title: 'Vos déjeuners : légers ou consistants ?',
    choices: [
      { value: 'light', label: 'Plutôt légers' },
      { value: 'hearty', label: 'Plutôt consistants' },
    ],
  },
])

export const WEEKDAYS = Object.freeze([
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' }, { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' }, { value: 5, label: 'Ven' }, { value: 6, label: 'Sam' },
  { value: 7, label: 'Dim' },
])

/**
 * Réponses d'un membre remises dans la forme du questionnaire, pour reprendre
 * un parcours là où il s'est arrêté plutôt que de le redemander en entier.
 */
export function answersFromExisting({ preferences = [], planning = {} } = {}) {
  const answers = {}
  for (const step of QUESTION_STEPS) {
    if (step.kind === 'setting') {
      const value = planning[step.field]
      if (value != null && value !== '') answers[step.key] = value
      continue
    }
    const matching = preferences.filter((item) => item.subject_type === step.subjectType
      && item.appreciation === step.appreciation
      && (!step.subjectValue || item.subject_value === step.subjectValue))
    if (!matching.length) continue
    answers[step.key] = step.multiple
      ? matching.map((item) => item.subject_label || item.subject_value)
      : matching[0].appreciation
  }
  // Une question à choix (les restes) se relit sur son sujet, pas sur son
  // appréciation attendue : sinon « Non merci » serait invisible à la reprise.
  const leftovers = preferences.find((item) => item.subject_type === 'leftovers')
  if (leftovers) answers.leftovers = leftovers.appreciation
  return answers
}

/** Nombre d'étapes réellement renseignées — sert à la barre de progression. */
export function answeredCount(answers = {}) {
  return QUESTION_STEPS.filter((step) => {
    const value = answers[step.key]
    if (Array.isArray(value)) return value.length > 0
    return value != null && value !== ''
  }).length
}
