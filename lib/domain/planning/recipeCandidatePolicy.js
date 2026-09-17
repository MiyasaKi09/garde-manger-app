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
 * Plafond de candidats présentés au faisceau. **Mesuré, pas hérité.**
 *
 * Il valait 96 — un reste de l'époque où `get_operational_recipe_catalog_v3`
 * ne rendait que cent recettes (livrable 0a.3). La pagination levée, les quatre
 * valeurs demandées par le livrable 0a.4 ont été rejouées sur le vivier du
 * dépôt (515 plats servables), **deux séries indépendantes de six semaines
 * consécutives**, historique cumulé, foyer réel, mêmes paramètres que
 * `app/api/planning/generate-v3` — 168 créneaux par valeur.
 *
 * | maxCandidates | pool moyen | P1 (min) | P2 pâtes /84 | P3 lait+œuf /84 | P4 Julien /42 | P16 max |
 * |---|---|---|---|---|---|---|
 * | 96  | 354 | 12 · 12 | 20,2 % · 21,4 % | 23,8 % · 25,0 % |  7 · 10 | 4,25 s · 4,63 s |
 * | 200 | 396 | 12 · 12 | 20,2 % · 25,0 % | 27,4 % · 26,2 % |  8 ·  5 | 4,75 s · 4,34 s |
 * | 400 | 460 | 12 · 12 | 20,2 % · 29,8 % | 27,4 % · 26,2 % |  8 ·  5 | 5,72 s · 4,97 s |
 * | 800 | 505 | 12 · 12 | 20,2 % · 26,2 % | 27,4 % · 26,2 % |  8 ·  4 | 6,41 s · 5,26 s |
 *
 * (Deux chiffres par case : série partant du 21 septembre · série partant du
 * 2 novembre. Le « pool moyen » est le nombre de candidats réellement présentés
 * au faisceau — voir la réserve plus bas : ce n'est PAS `maxCandidates`.)
 *
 * TABLE REJOUÉE À LA RELECTURE, sur une autre machine et par un harnais écrit
 * indépendamment : les 32 cases de pool, P1, P2, P3 et P4 sont retombées au
 * chiffre près (un seul écart d'une unité, le pool moyen de la seconde série à
 * 400 : 459 au lieu de 460 — un arrondi de moyenne). Seule la colonne P16 a
 * changé, entre 4,62 s et 7,04 s au lieu de 4,25 s à 6,41 s : c'est une durée
 * machine, et le choix ci-dessous reste le même à cette échelle. Ces mesures
 * ne sont donc pas déduites : elles se rejouent.
 *
 * CE QUE LA MESURE DIT.
 * — **P1 ne bouge pas** : douze plats distincts sur quatorze, toutes valeurs,
 *   toutes semaines, les deux séries.
 * — **P2 ne bouge pas de façon cohérente** : dans la première série il vaut
 *   20,2 % aux QUATRE valeurs — le plafond n'y change rien du tout ; dans la
 *   seconde il vaut 21,4 / 25,0 / 29,8 / 26,2 %, une variation non monotone
 *   dont le maximum tombe à 400 et non à 800. Un effet qui disparaît dans une
 *   série et change de sens dans l'autre n'est pas un effet.
 * — **P4 change de SIGNE d'une série à l'autre** : 96 est la pire
 *   valeur dans la première (7 jours contre 8), la meilleure dans la seconde
 *   (10 contre 5). L'écart entre deux dates de départ à valeur CONSTANTE
 *   dépasse l'écart entre deux valeurs : c'est sous la résolution de la
 *   mesure, et on ne calibre pas sur du bruit.
 * — **P3 est le seul écart de sens constant** : 96 est meilleur que 200/400/800
 *   dans les deux séries (23,8 % contre 27,4 %, puis 25,0 % contre 26,2 %), et
 *   200, 400 et 800 sont indiscernables entre eux. Le passage de 96 à 400 coûte
 *   donc 1 à 3 créneaux sur 84. Il est écrit ici plutôt que masqué. Il ne
 *   justifie pas de revenir à 96 : la cible P3 (≤ 20 %) est manquée à TOUTES
 *   les valeurs, et c'est le livrable 3.1 — lever l'exemption de `laitiers` et
 *   `oeufs` dans `weeklyBalance.js:51` — qui la déplacera, pas l'élagage.
 * — **P16 est la seule chose que ce nombre décide vraiment**, et il la décide
 *   linéairement : 10,2 à 12,8 ms par candidat sur les quatre valeurs et les
 *   deux séries (le plan de septembre relevait ≈ 11,7 ms/recette, §2.3). C'est
 *   donc sur P16 que le choix se fait.
 *
 * POURQUOI 400. Au haut de la fourchette mesurée (12,8 ms par candidat), un
 * plafond de 800 coûterait ≈ 10,2 s le jour où il mordra — au-dessus de la
 * cible P16 (≤ 10 s à 3 000 recettes) ; 400 coûte ≈ 4,1 à 5,1 s et garde
 * au moins 4,9 s de marge, tout en montrant au solveur 460 des 515 plats
 * servables d'aujourd'hui (89 %) au lieu de 354 (69 %) à 96. Écarté : 800,
 * sans marge ; 200, qui n'améliore aucun critère par rapport à 400 et cache
 * 64 plats de plus ; 96, qui n'est meilleur que sur P3, d'un écart que la
 * cible P3 ne franchit de toute façon à aucune valeur.
 *
 * RÉSERVE, ET ELLE EST IMPORTANTE. Ce plafond **ne borne pas** le vivier
 * aujourd'hui : le quota par catégorie ci-dessous (8 par catégorie, sur 140
 * catégories distinctes pour 515 recettes — dont 89 n'en comptent qu'une)
 * peut à lui seul admettre jusqu'à 1 120 codes. C'est pourquoi le pool vaut
 * 460 et non 400. Tant que ce quota reste un ajout sans budget, `maxCandidates`
 * ne tiendra pas P16 à 3 000 recettes. Le corriger change la POLITIQUE de
 * sélection et invaliderait les quatre mesures ci-dessus : ce n'est pas 0a.4,
 * c'est à traiter avec P15/P16 quand le corpus l'exigera.
 */
export const PLANNING_POOL_MAX_CANDIDATES = 400

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
  maxCandidates = PLANNING_POOL_MAX_CANDIDATES,
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
