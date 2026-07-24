const average = (values) => {
  const numbers = values.map(Number).filter((value) => Number.isFinite(value) && value > 0)
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null
}

function mergedTarget(targetByMeal = {}) {
  const meals = [targetByMeal.dejeuner, targetByMeal.diner].filter(Boolean)
  return Object.fromEntries(['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG'].flatMap((key) => {
    const value = average(meals.map((meal) => meal?.[key]))
    return value ? [[key, value]] : []
  }))
}

const relative = (actual, expected) => {
  const left = Number(actual)
  const right = Number(expected)
  if (!Number.isFinite(left) || !Number.isFinite(right) || right <= 0) return null
  return Math.max(-2, Math.min(2, (left - right) / right))
}

/**
 * Score nutritionnel asymétrique : une carence protéique ou un excès de
 * lipides coûte nettement plus qu'un léger dépassement de protéines.
 */
export function nutritionCandidatePenalty(recipe, target = {}) {
  const nutrition = recipe?.nutritionPerServing || {}
  let score = 0

  const kcal = relative(nutrition.kcal, target.kcal)
  if (kcal != null) score += Math.abs(kcal) * 32

  const protein = relative(nutrition.proteinG, target.proteinG)
  if (protein != null) score += Math.max(0, -protein) * 95 + Math.max(0, protein) * 10

  const carbs = relative(nutrition.carbsG, target.carbsG)
  if (carbs != null) score += Math.max(0, -carbs) * 38 + Math.max(0, carbs) * 12

  const fat = relative(nutrition.fatG, target.fatG)
  if (fat != null) score += Math.max(0, fat) * 70 + Math.max(0, -fat) * 8

  const fiber = relative(nutrition.fiberG, target.fiberG)
  if (fiber != null) score += Math.max(0, -fiber) * 34 + Math.max(0, fiber) * 3

  const expectedKcal = Number(target.kcal)
  const expectedProtein = Number(target.proteinG)
  const actualKcal = Number(nutrition.kcal)
  const actualProtein = Number(nutrition.proteinG)
  if (expectedKcal > 0 && expectedProtein > 0 && actualKcal > 0 && Number.isFinite(actualProtein)) {
    const densityRatio = (actualProtein / actualKcal) / (expectedProtein / expectedKcal)
    if (densityRatio < 0.8) score += (0.8 - densityRatio) * 90
  }

  return score
}

/**
 * Réduit le corpus avant le beam search :
 * - conserve toujours les recettes verrouillées/protégées ;
 * - exclut les codes servis la semaine précédente ;
 * - classe les autres selon la cible nutritionnelle réelle des plats principaux.
 */
export function selectPlanningRecipePool({
  recipes = [],
  targetByMeal = {},
  previousWeekRecipeCodes = [],
  fixedRecipeCodes = [],
  allowPreviousWeek = false,
  maxCandidates = 96,
}) {
  const previous = new Set(previousWeekRecipeCodes)
  const fixed = new Set(fixedRecipeCodes)
  const target = mergedTarget(targetByMeal)
  const available = recipes.filter((recipe) => fixed.has(recipe.code) || allowPreviousWeek || !previous.has(recipe.code))
  const ranked = available
    .map((recipe) => ({ recipe, penalty: nutritionCandidatePenalty(recipe, target) }))
    .sort((left, right) => left.penalty - right.penalty || String(left.recipe.code).localeCompare(String(right.recipe.code)))

  const selectedCodes = new Set(fixed)
  for (const { recipe } of ranked.slice(0, Math.max(maxCandidates, fixed.size))) selectedCodes.add(recipe.code)

  // Préserve quelques représentants par catégorie pour que les quotas poisson,
  // viande, légumineuses et végétarien restent réalisables dans le beam search.
  const categoryCount = new Map()
  for (const { recipe } of ranked) {
    const category = String(recipe.category || 'autre')
    const count = categoryCount.get(category) || 0
    if (count < 8) {
      selectedCodes.add(recipe.code)
      categoryCount.set(category, count + 1)
    }
  }

  return recipes.filter((recipe) => selectedCodes.has(recipe.code))
}
