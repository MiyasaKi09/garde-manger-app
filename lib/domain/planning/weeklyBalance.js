/**
 * Équilibre hebdomadaire du foyer : combien de poisson, de viande, de repas
 * végétariens, et combien de fois la même famille de protéine peut revenir.
 *
 * Ces bornes étaient écrites en dur — au plus 2 poissons, au plus 4 viandes,
 * au moins 8 repas végétariens sur quatorze, et jamais plus de 2 repas par
 * famille de protéine. Ce sont des choix de santé et d'empreinte parfaitement
 * défendables, mais ce sont des CHOIX, et ils entrent en conflit direct avec
 * une cible protéique élevée : mesuré sur le corpus réel, un foyer visant 216 g
 * de protéines par jour plafonne à 62 % parce que huit de ses quatorze repas
 * doivent être végétariens et qu'aucune famille animale ne peut servir plus de
 * deux fois.
 *
 * Le plafond ne venait donc ni du corpus ni de la notation, mais de ces bornes.
 * Un foyer doit pouvoir les assumer autrement : manger plus de poisson en
 * échange de sa cible est un arbitrage qui lui appartient, pas au moteur.
 *
 * Les valeurs par défaut sont EXACTEMENT celles d'avant : sans réglage
 * explicite, le comportement ne change pas d'un repas.
 *
 * Module PUR.
 */

/**
 * Bornes par défaut, exprimées pour une semaine de quatorze repas principaux.
 * Elles sont ramenées au nombre réel de créneaux par `weeklyBalanceFor`.
 */
export const DEFAULT_WEEKLY_BALANCE = Object.freeze({
  fishMeals: 2,
  meatMax: 4,
  vegetarianMin: 8,
  redMeatMin: 1,
  fattyFishMin: 1,
  legumesMin: 2,
  cuisinesMin: 3,
  proteinsMin: 4,
  // Le verrou le plus contraignant, et le moins visible : au-delà de ce nombre,
  // une famille de protéine (bœuf, poulet, poisson…) est refusée pour le reste
  // de la semaine. Les familles ci-dessous y échappent — non par préférence,
  // mais parce qu'elles ne désignent pas un animal en particulier.
  maxMealsPerProteinFamily: 2,
})

/** Familles exemptées du plafond par famille : ce ne sont pas des espèces. */
export const UNCAPPED_PROTEIN_FAMILIES = Object.freeze(['vegetal', 'laitiers', 'oeufs'])

const positiveInt = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback
}

/** Bornes du foyer, valeurs par défaut comprises. Ne dépend pas de la semaine. */
export function buildWeeklyBalance(overrides = {}) {
  const source = overrides && typeof overrides === 'object' ? overrides : {}
  return Object.fromEntries(Object.entries(DEFAULT_WEEKLY_BALANCE)
    .map(([key, fallback]) => [key, key === 'maxMealsPerProteinFamily'
      ? Math.max(1, positiveInt(source[key], fallback))
      : positiveInt(source[key], fallback)]))
}

/**
 * Bornes ramenées à la taille réelle de la semaine. Un régime végétarien déclaré
 * l'emporte sur tout réglage : c'est une contrainte alimentaire, pas un dosage.
 */
export function weeklyBalanceFor({ balance = DEFAULT_WEEKLY_BALANCE, totalSlots = 14, vegetarianDiet = false } = {}) {
  if (vegetarianDiet) {
    return {
      fish: 0,
      meatMax: 0,
      vegetarianMin: totalSlots,
      redMeatMin: 0,
      fattyFishMin: 0,
      legumesMin: 2,
      cuisinesMin: 3,
      proteinsMin: 4,
      maxMealsPerProteinFamily: Math.max(1, balance.maxMealsPerProteinFamily ?? DEFAULT_WEEKLY_BALANCE.maxMealsPerProteinFamily),
    }
  }
  const cap = (value) => Math.min(value, totalSlots)
  return {
    fish: cap(balance.fishMeals),
    meatMax: cap(balance.meatMax),
    vegetarianMin: cap(balance.vegetarianMin),
    // Les minimums « au moins un » n'ont de sens que sur une semaine complète.
    redMeatMin: totalSlots >= 7 ? balance.redMeatMin : 0,
    fattyFishMin: totalSlots >= 7 ? balance.fattyFishMin : 0,
    legumesMin: cap(balance.legumesMin),
    cuisinesMin: cap(balance.cuisinesMin),
    proteinsMin: cap(balance.proteinsMin),
    maxMealsPerProteinFamily: Math.max(1, balance.maxMealsPerProteinFamily),
  }
}
