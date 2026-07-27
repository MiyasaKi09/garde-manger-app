/**
 * « Reste compatible » — la huitième famille de petits-déjeuners du plan (§13),
 * et la seule qui ne soit pas un assemblage d'aliments : elle sert une portion
 * d'un plat déjà cuisiné plutôt que d'acheter de quoi composer une prise.
 *
 * Trois garde-fous, parce qu'une portion promise deux fois est un incident plus
 * grave qu'une portion jetée :
 *
 * 1. Seuls les plats qu'AUCUN créneau principal n'utilise entrent dans le pool.
 *    Au moment où le support est choisi, la personnalisation n'a pas encore
 *    fixé les portions des déjeuners et dîners : « combien en restera-t-il ? »
 *    n'a donc pas de réponse, et la deviner serait exactement la double
 *    promesse qu'on veut éviter. Ce sont d'ailleurs les plats délaissés par les
 *    créneaux principaux — trop petits pour couvrir un repas, recette non
 *    appariée — qui finissent réellement à la poubelle.
 *
 * 2. Une portion entière, jamais fractionnée : c'est ce qui reste dans la
 *    boîte, et le registre de réservation compte en portions.
 *
 * 3. Un plat sans recette appariée est écarté. Sans recette, impossible de
 *    vérifier les allergies et les interdits du foyer — et un support n'est pas
 *    un endroit où prendre ce risque.
 *
 * Module PUR. Le pool est une structure de travail : `claimSupportLeftover` le
 * décrémente, ce qui EST le registre des portions déjà promises aux supports.
 */

import { buildDishAvailability, dishRecipeIndexes, matchDishRecipe, violatesHardConstraints } from './closedLoopPlanner'
import { REHEAT_QUALITY, recipePlanningProfile } from './recipePlanningProfile'

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .trim()

/**
 * Part d'énergie de la journée qu'une prise support couvre. Sert à juger si une
 * portion de plat a la bonne TAILLE pour ce créneau : une portion de carbonade
 * à 700 kcal n'est pas un petit-déjeuner, quand bien même on l'aimerait.
 */
export const SUPPORT_ENERGY_SHARE = Object.freeze({ pdj: 0.25, collation: 0.12 })

/** Bande d'acceptation autour de cette part : ni une bouchée, ni un festin. */
const ENERGY_BAND = Object.freeze({ min: 0.55, max: 1.45 })

/**
 * Vocabulaire des plats qu'on accepte à une prise support. Liste blanche
 * assumée : mieux vaut refuser un reste acceptable que servir un ragoût à
 * sept heures du matin. Le matin est le plus strict ; la collation hérite de
 * cette liste et l'élargit.
 */
const BREAKFAST_FRIENDLY = /soupe|veloute|potage|omelette|frittata|tortilla|quiche|tarte|porridge|compote|salade de fruits|riz au lait|pain perdu|clafoutis|flan|crumble|granola|muesli|pancake|crepe|gaufre|brioche|cake/
const SNACK_ALSO_FRIENDLY = /houmous|tartinade|caviar|muffin|barre|taboule|salade|verrine|falafel|beignet|samoussa|empanada|croquette|galette|houmus|dip/

/**
 * Un plat est-il servable à ce type de prise ? On interroge le NOM du plat et
 * la catégorie de sa recette : c'est le vocabulaire que porte réellement
 * `cooked_dishes`.
 */
export function isSupportCompatible({ name, recipe }, mealType) {
  const vocabulary = fold(`${name} ${recipe?.family ?? ''} ${recipe?.category ?? ''}`)
  if (!vocabulary) return false
  if (BREAKFAST_FRIENDLY.test(vocabulary)) return true
  return mealType === 'collation' && SNACK_ALSO_FRIENDLY.test(vocabulary)
}

/**
 * Portions de plats cuisinés réellement disponibles pour les prises support.
 * FEFO : le plat le plus urgent est proposé en premier — c'est tout l'intérêt
 * anti-gaspillage de la famille.
 */
export function buildSupportLeftoverPool({
  plan, recipes = [], cookedDishes = [], existingDishReservations = [],
} = {}) {
  const claimedByMainSlots = new Set((plan?.slots || [])
    .filter((slot) => slot.cookedDishId != null)
    .map((slot) => String(slot.cookedDishId)))
  const indexes = dishRecipeIndexes(recipes)
  return buildDishAvailability(cookedDishes, existingDishReservations)
    .filter((dish) => !claimedByMainSlots.has(String(dish.id)))
    .map((dish) => ({
      id: dish.id,
      name: dish.name,
      expiresOn: dish.expiresOn,
      nutritionPerPortion: dish.nutritionPerPortion,
      recipe: matchDishRecipe(dish, indexes),
      portionsFree: dish.portionsAvailable,
    }))
    .filter((dish) => dish.recipe && Number(dish.nutritionPerPortion?.kcal) > 0)
}

/**
 * Réserve une portion pour une prise support, ou `null` si aucun reste ne
 * convient. Décrémente le pool : deux membres, ou deux jours, ne peuvent pas
 * se promettre la même portion.
 */
export function claimSupportLeftover(pool, { mealType, date, targetKcal, constraints = {} } = {}) {
  const share = SUPPORT_ENERGY_SHARE[mealType]
  const expected = Number(targetKcal) > 0 ? Number(targetKcal) : null
  if (!share || !expected || !Array.isArray(pool)) return null
  for (const dish of pool) {
    if (dish.portionsFree < 1 - 1e-9) continue
    // Un plat périmé avant le repas n'est pas un reste, c'est une poubelle.
    if (dish.expiresOn && date && dish.expiresOn < date) continue
    if (!isSupportCompatible(dish, mealType)) continue
    const kcal = Number(dish.nutritionPerPortion?.kcal) || 0
    if (kcal < ENERGY_BAND.min * expected || kcal > ENERGY_BAND.max * expected) continue
    // Réchauffer n'est pas cuisiner : la limite de temps ne s'applique pas,
    // mais les allergies et les interdits, si.
    if (violatesHardConstraints(dish.recipe, {
      ...constraints, currentMealType: mealType, maxMinutesByMeal: undefined, maxTotalMinutes: undefined,
    })) continue
    // Un plat qui se dégrade au réchauffage ne se rattrape pas au petit-déjeuner.
    if (recipePlanningProfile(dish.recipe).reheatQuality === REHEAT_QUALITY.POOR) continue
    dish.portionsFree -= 1
    return {
      cookedDishId: dish.id,
      name: dish.name,
      recipeCode: dish.recipe.code,
      portions: 1,
      expiresOn: dish.expiresOn || null,
      nutritionPerPortion: dish.nutritionPerPortion,
    }
  }
  return null
}

/**
 * Habille une portion réclamée en « support », dans la forme que le reste de
 * la personnalisation manipule : pas d'`items` (rien à acheter — le plat est
 * déjà cuisiné), une nutrition fixe, et la trace de sa source.
 */
export function leftoverSupport(leftover, mealType) {
  if (!leftover) return null
  const nutrition = leftover.nutritionPerPortion
  return {
    family: 'reste_compatible',
    shortLabel: `Reste de ${leftover.name}`,
    description: `1 portion de ${leftover.name}, à réchauffer`,
    items: [],
    leftover,
    mealType,
    nutrition: {
      kcal: Number(nutrition.kcal) || 0,
      proteinG: Number(nutrition.proteinG ?? nutrition.protein_g) || 0,
      carbsG: Number(nutrition.carbsG ?? nutrition.carbs_g) || 0,
      fatG: Number(nutrition.fatG ?? nutrition.fat_g) || 0,
      fiberG: Number(nutrition.fiberG ?? nutrition.fiber_g) || 0,
    },
  }
}
