const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

/**
 * Nombre maximal de repas carnés qu'un quota peut désigner : les quatorze
 * repas principaux d'une semaine. Ce n'est pas une préférence, c'est la borne
 * physique de la grille — au-delà, le quota désignerait des repas qui
 * n'existent pas.
 */
export const MAX_MEAT_MEALS_PER_WEEK = 14

/**
 * UN NOMBRE DÉCLARÉ, OU RIEN — et jamais un nombre fabriqué par coercition.
 *
 * `Number()` accepte bien plus que des nombres : `Number('  ')`, `Number([])`
 * et `Number(false)` valent tous **0**, `Number(true)` vaut 1 et `Number([3])`
 * vaut 3. Un réglage lu ainsi transforme une saisie vide ou une valeur
 * malformée en « cette personne ne mange pas de viande » — exactement la
 * fabrication que ce livrable s'interdit, et qui ne se distingue plus d'un
 * choix une fois écrite au profil. Relecture du 17 septembre 2026 : les quatre
 * cas ci-dessus passaient, au point d'écriture comme au point de lecture.
 *
 * Seuls un `number` fini et une chaîne entièrement numérique sont donc des
 * déclarations. Tout le reste rend `null` : l'absence, qui se distingue de 0.
 *
 * @returns {number|null}
 */
export function declaredNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const texte = value.trim()
  if (!texte) return null
  const nombre = Number(texte)
  return Number.isFinite(nombre) ? nombre : null
}

/**
 * Quota carné DÉCLARÉ d'un membre, ou `null` s'il n'en a pas.
 *
 * `null` n'est pas 0 et ce n'est pas non plus une valeur par défaut déguisée :
 * c'est l'absence de déclaration. Un membre sans quota reçoit le plat du
 * foyer à chaque créneau, exactement comme avant ce livrable ; c'est le
 * réglage, et lui seul, qui met la personne au centre du calcul.
 *
 * ARBITRAGE ASSUMÉ : AUCUN DÉFAUT PAR PRÉNOM. Le §8 du plan recommande
 * « Julien 4, Zoé 2 ». Ces deux valeurs sont des DONNÉES du foyer, réglées sur
 * l'écran Paramètres → Planning, jamais une table de prénoms dans le code : le
 * §7.5 du plan rappelle que ce qui prouve que rien n'est codé en dur pour deux
 * personnes est précisément qu'aucun prénom n'apparaisse dans le moteur. Ce
 * module n'en connaît aucun, et l'en-tête ci-dessous le disait déjà.
 */
function declaredMeatQuota(planning) {
  // `declaredNumber` plutôt que `Number` : voir son en-tête. Un profil peut
  // porter une valeur qui n'est pas un nombre, et la lire comme 0 déclarerait
  // un choix que personne n'a fait.
  const quota = declaredNumber(planning?.meat_meals_per_week)
  if (quota == null || quota < 0) return null
  return clamp(Math.round(quota), 0, MAX_MEAT_MEALS_PER_WEEK)
}

/**
 * Règles de planning d'un membre. Elles viennent uniquement de son profil :
 * aucun prénom, ordre de création ou objectif nutritionnel ne modifie la
 * grille attendue.
 */
export function getMemberPlanningRules(member = {}) {
  const planning = member?.preferences?.planning || {}
  const swaps = Number(planning.vegetarian_meat_swaps_per_week)

  return {
    breakfast: planning.breakfast === true,
    lunch: planning.lunch !== false,
    dinner: planning.dinner !== false,
    snack: planning.snack !== false,
    // Le quota carné de la personne (livrable 1.1). `null` = non déclaré.
    meatMealsPerWeek: declaredMeatQuota(planning),
    // HÉRITAGE, EN VOIE DE RETRAIT. `vegetarian_meat_swaps_per_week` disait
    // combien de repas carnés du foyer la personne remplaçait — une grandeur
    // RELATIVE au plan du foyer, donc impossible à relire : « 4 swaps » ne dit
    // pas combien de viande on mange, il dit de combien on en retire. Le quota
    // le remplace. Ce champ reste lu pour les profils enregistrés avant ce
    // livrable : sans lui, un foyer déjà réglé verrait son comportement changer
    // au déploiement sans que personne n'ait touché à un réglage. Il n'est
    // employé QUE lorsque aucun quota n'est déclaré (`personalizedMeals.js`,
    // `swapsForMember`), et l'écran de réglage ne l'écrit plus.
    vegetarianMeatSwaps: Number.isFinite(swaps) ? clamp(swaps, 0, 7) : 0,
    minMealServings: clamp(Number(planning.min_meal_servings) || 0.5, 0.25, 1),
    preferredMinMealServings: clamp(Number(planning.preferred_min_meal_servings) || 0.75, 0.5, 1),
    preferredMaxMealServings: clamp(Number(planning.preferred_max_meal_servings) || 1.5, 1, 2),
    toleratedMaxMealServings: clamp(Number(planning.tolerated_max_meal_servings) || 1.75, 1, 2),
    hardMaxMealServings: clamp(Number(planning.hard_max_meal_servings) || 2, 1, 2),
    maxMealMassGrams: clamp(Number(planning.max_meal_mass_grams) || 900, 300, 1200),
    // Questionnaire de goûts (§5) — disponibilité de cuisine. `cookingDays` et
    // `quickDays` sont des jours ISO (1 = lundi … 7 = dimanche) ; une liste
    // vide signifie « aucune contrainte », jamais « aucun jour ».
    cookingDays: dayList(planning.cooking_days),
    quickDays: dayList(planning.quick_days),
    // « la préférence pour les déjeuners légers ou consistants »
    lunchStyle: ['light', 'hearty'].includes(planning.lunch_style) ? planning.lunch_style : null,
    // Dessert de fin de repas (opt-in par créneau) — câble `attachDessert`
    // dans `buildMealPlate` via `personalizedMeals.js`.
    dessertAfterLunch: Boolean(planning.dessert_after_lunch),
    dessertAfterDinner: Boolean(planning.dessert_after_dinner),
  }
}

/** Jours ISO valides d'une liste, dédupliqués et triés. */
function dayList(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))].sort()
}

export function expectedMealTypesForMember(member = {}) {
  const rules = getMemberPlanningRules(member)
  return [
    ...(rules.breakfast ? ['pdj'] : []),
    ...(rules.lunch ? ['dejeuner'] : []),
    ...(rules.dinner ? ['diner'] : []),
    ...(rules.snack ? ['collation'] : []),
  ]
}

export function expectedMealCountForWindow(members = [], dayCount = 7) {
  const days = Math.max(0, Number(dayCount) || 0)
  return (members || [])
    .filter((member) => member?.active !== false)
    .reduce((sum, member) => sum + expectedMealTypesForMember(member).length * days, 0)
}
