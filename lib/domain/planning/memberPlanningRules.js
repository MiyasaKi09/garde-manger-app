const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

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
    vegetarianMeatSwaps: Number.isFinite(swaps) ? clamp(swaps, 0, 7) : 0,
    minMealServings: clamp(Number(planning.min_meal_servings) || 0.5, 0.25, 1),
    preferredMinMealServings: clamp(Number(planning.preferred_min_meal_servings) || 0.75, 0.5, 1),
    preferredMaxMealServings: clamp(Number(planning.preferred_max_meal_servings) || 1.5, 1, 2),
    toleratedMaxMealServings: clamp(Number(planning.tolerated_max_meal_servings) || 1.75, 1, 2),
    hardMaxMealServings: clamp(Number(planning.hard_max_meal_servings) || 2, 1, 2),
    maxMealMassGrams: clamp(Number(planning.max_meal_mass_grams) || 900, 300, 1200),
  }
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
