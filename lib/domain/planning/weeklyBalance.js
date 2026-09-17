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

import { getMemberPlanningRules } from './memberPlanningRules'

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

/**
 * Familles exemptées du plafond par famille : ce ne sont pas des espèces.
 * 'inconnu' — la protéine principale d'un plat dont l'origine n'est pas
 * déclarée — n'en est pas une non plus : la plafonner cacherait une donnée
 * manquante derrière une semaine infaisable, alors que l'absence est déjà
 * exposée par `unknownOrigins` et rend le plat non végétarien.
 */
export const UNCAPPED_PROTEIN_FAMILIES = Object.freeze(['vegetal', 'laitiers', 'oeufs', 'inconnu'])

const positiveInt = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback
}

/**
 * LE PLAFOND CARNÉ DU FOYER, DÉDUIT DES QUOTAS DÉCLARÉS — livrable 1.1.
 *
 * CE QU'IL REMPLACE, ET POURQUOI. `meatMax` valait 4 en dur. Ce 4 était un
 * plafond de FOYER, et il produisait un effet que personne n'avait demandé :
 * mesuré au §2.3 de `docs/PLAN_FINIR_MYKO.md`, Zoé mangeait 0 repas carné sur
 * 14 les trois semaines, parce que ses quatre « swaps végétariens »
 * absorbaient exactement les quatre créneaux carnés que le plafond autorisait.
 * Elle a déclaré vouloir manger MOINS de viande que Julien, pas ne plus en
 * manger. Le plafond du foyer devient donc la SOMME des quotas déclarés
 * (§5, livrable 1.1 du plan), et le quota devient la grandeur réglée par
 * chaque personne.
 *
 * CE QUE « DÉCLARÉ » VEUT DIRE ICI, ET CE QUE LA FONCTION REFUSE DE DEVINER.
 * Un membre qui n'a pas réglé son quota n'en a pas : sa valeur est `null`, pas
 * un nombre plausible. Si PERSONNE n'a déclaré de quota, cette fonction rend
 * `null` — et l'appelant garde alors le défaut du foyer. Rendre 0 ferait
 * disparaître la viande d'un foyer qui n'a rien demandé ; rendre 4 par tête
 * fabriquerait un quota que personne n'a écrit. Les deux sont des inventions,
 * et un attribut deviné ne se distingue plus d'un attribut vrai.
 *
 * LA SOMME PLUTÔT QUE LE MAXIMUM. C'est la règle que le plan pose, et elle se
 * lit ainsi : les créneaux carnés de la semaine sont un stock que les membres
 * se partagent, chacun renonçant aux créneaux qui dépassent son quota. Le
 * maximum (4 pour « Julien 4, Zoé 2 ») suffirait à ce que chacun tienne son
 * quota et coûterait moins de jumeaux à cuisiner ; la somme (6) laisse au
 * solveur plus de créneaux carnés, donc plus de substitutions et plus de plats
 * distincts à préparer. L'écart mesuré entre les deux réglages est consigné
 * dans `tests/planning/quotaViandeParMembre.test.js`, qui les rejoue tous les
 * deux sur trois semaines — on applique la règle écrite, on ne la corrige pas
 * en silence.
 *
 * @param {Array<number|null|undefined>} quotas quotas déclarés, `null` quand absent
 * @returns {number|null} la somme, ou `null` si aucun quota n'est déclaré
 */
export function meatMaxFromDeclaredQuotas(quotas = []) {
  const declares = (Array.isArray(quotas) ? quotas : [])
    // L'absence est écartée AVANT la conversion, et c'est tout sauf un détail :
    // `Number(null)` vaut 0, si bien qu'un filtre posé après la conversion
    // aurait compté chaque membre sans quota pour « zéro repas carné ». Un
    // foyer qui n'a rien déclaré serait alors passé à meatMax = 0, c'est-à-dire
    // à aucune viande du tout, sans que personne n'ait touché à un réglage.
    // Le cas est éprouvé par `tests/planning/quotaViandeParMembre.test.js`.
    .filter((quota) => quota != null && quota !== '')
    .map((quota) => Number(quota))
    .filter((quota) => Number.isFinite(quota) && quota >= 0)
  if (!declares.length) return null
  return declares.reduce((total, quota) => total + Math.round(quota), 0)
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
 * Bornes du foyer telles que la route de génération les résout — livrable 1.1.
 *
 * ELLE VIT ICI ET PLUS DANS LA ROUTE. Elle y était, et elle n'y était donc
 * testable qu'en simulant Supabase : c'est une règle de domaine — trois
 * sources, un ordre de précédence, une déduction — et pas un morceau de
 * transport HTTP. La déplacer, c'est pouvoir l'éprouver sans base.
 *
 * ORDRE DE PRÉCÉDENCE, DU PLUS EXPLICITE AU PLUS GÉNÉRAL :
 *   1. un `meatMax` ÉCRIT — par la requête, puis par les réglages du foyer.
 *      C'est une consigne directe ; la réinterpréter serait décider à la place
 *      de qui l'a écrite ;
 *   2. la SOMME des quotas carnés déclarés par les membres actifs ;
 *   3. le défaut du domaine (4), quand personne n'a rien déclaré.
 * Les autres bornes — poisson, plancher végétarien, répétition par famille —
 * ne changent pas : elles se lisent comme avant.
 *
 * Un membre inactif ne compte pas : il ne mange pas cette semaine, et son quota
 * gonflerait le plafond du foyer sans qu'aucune assiette n'y corresponde.
 */
export function resolveHouseholdWeeklyBalance({ members = [], requestBalance = null } = {}) {
  const memberBalance = (members || [])
    .map((member) => member?.preferences?.planning?.weekly_balance)
    .find((balance) => balance && typeof balance === 'object') || {}
  const request = requestBalance && typeof requestBalance === 'object' ? requestBalance : {}
  const declare = { ...memberBalance, ...request }
  if (declare.meatMax != null) return buildWeeklyBalance(declare)
  const deduit = meatMaxFromDeclaredQuotas((members || [])
    .filter((member) => member?.active !== false)
    .map((member) => getMemberPlanningRules(member).meatMealsPerWeek))
  return buildWeeklyBalance(deduit == null ? declare : { ...declare, meatMax: deduit })
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
