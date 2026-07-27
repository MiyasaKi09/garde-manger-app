/**
 * Équilibre entre habitudes et nouveautés (plan de refonte §6).
 *
 * Le plan donne trois profils et leurs proportions cibles :
 *
 *   Mode            Repères  Rotation  Découverte
 *   Très familier     80 %     15 %       5 %
 *   Équilibré         60 %     25 %      15 %
 *   Curieux           40 %     35 %      25 %
 *
 * Ces proportions ne sont PAS des contraintes dures. Une semaine ne devient pas
 * invalide parce qu'elle compte une découverte de trop : elle est simplement
 * moins bien notée. Interdire une découverte sous prétexte d'un quota
 * produirait exactement le travers que la refonte combat — un moteur qui
 * applique une règle sans regarder ce qu'elle donne à manger.
 *
 * Module PUR.
 */

import { MEAL_STATUS } from './repetitionRules'

export const DISCOVERY_MODES = Object.freeze({
  FAMILIAR: 'very_familiar',
  BALANCED: 'balanced',
  CURIOUS: 'curious',
})

/**
 * Cibles du §6. `familiar` regroupe les repères ET les restes planifiés : un
 * reste est par nature un plat déjà connu.
 */
const MODE_TARGETS = Object.freeze({
  [DISCOVERY_MODES.FAMILIAR]: { familiar: 0.80, rotation: 0.15, discovery: 0.05 },
  [DISCOVERY_MODES.BALANCED]: { familiar: 0.60, rotation: 0.25, discovery: 0.15 },
  [DISCOVERY_MODES.CURIOUS]: { familiar: 0.40, rotation: 0.35, discovery: 0.25 },
})

export const DISCOVERY_MODE_LABELS = Object.freeze({
  [DISCOVERY_MODES.FAMILIAR]: 'Très familier',
  [DISCOVERY_MODES.BALANCED]: 'Équilibré',
  [DISCOVERY_MODES.CURIOUS]: 'Curieux',
})

const clamp01 = (value) => Math.max(0, Math.min(1, value))

/**
 * Mode du foyer. Les réponses sont individuelles ; le foyer prend le mode le
 * plus PRUDENT exprimé — proposer trop de nouveautés à qui n'en veut pas est
 * plus coûteux que d'en proposer trop peu à qui en voudrait.
 */
export function resolveDiscoveryMode(members = []) {
  const order = [DISCOVERY_MODES.FAMILIAR, DISCOVERY_MODES.BALANCED, DISCOVERY_MODES.CURIOUS]
  const declared = members
    .map((member) => member?.preferences?.planning?.discovery_mode)
    .filter((mode) => order.includes(mode))
  if (!declared.length) return DISCOVERY_MODES.BALANCED
  return declared.reduce((prudent, mode) => (order.indexOf(mode) < order.indexOf(prudent) ? mode : prudent), declared[0])
}

/**
 * Cible de découvertes pour une semaine, en nombre de repas. Un foyer peut
 * fixer un nombre exact (`weekly_discoveries`), qui prime sur le pourcentage.
 */
export function discoveryTarget({ members = [], mealCount = 0 } = {}) {
  const mode = resolveDiscoveryMode(members)
  const targets = MODE_TARGETS[mode]
  const explicit = members
    .map((member) => Number(member?.preferences?.planning?.weekly_discoveries))
    .find((value) => Number.isFinite(value) && value >= 0)
  const desired = explicit != null ? explicit : Math.round(targets.discovery * mealCount)
  return {
    mode,
    modeLabel: DISCOVERY_MODE_LABELS[mode],
    ratios: targets,
    discoveries: Math.max(0, Math.min(mealCount, desired)),
    familiarMin: Math.floor(targets.familiar * mealCount),
  }
}

/**
 * Écart entre la semaine produite et la cible de nouveautés. Positif = trop de
 * découvertes, négatif = pas assez. Sert à l'aperçu et à la notation, jamais à
 * invalider une semaine.
 */
export function discoveryBalance({ slots = [], target = null } = {}) {
  const total = slots.length
  if (!total || !target) return null
  const discoveries = slots.filter((slot) => slot.mealStatus === MEAL_STATUS.NEW).length
  const familiar = slots.filter((slot) => slot.mealStatus === MEAL_STATUS.FAVORITE
    || slot.mealStatus === MEAL_STATUS.LEFTOVER).length
  return {
    mode: target.mode,
    discoveries,
    expectedDiscoveries: target.discoveries,
    discoveryGap: discoveries - target.discoveries,
    familiar,
    familiarRatio: clamp01(familiar / total),
    expectedFamiliarRatio: target.ratios.familiar,
    // Une semaine « conforme » tolère un écart d'un repas : sur quatorze
    // créneaux, exiger le compte exact reviendrait à piloter au repas près.
    onTarget: Math.abs(discoveries - target.discoveries) <= 1,
  }
}

/**
 * Pénalité de score appliquée à une découverte quand le quota est déjà atteint,
 * et bonus quand il ne l'est pas encore. Volontairement modeste : elle départage
 * des candidats comparables, elle ne renverse jamais un choix de stock urgent ou
 * de goût marqué.
 */
export function discoveryScoreAdjustment({ isDiscovery, discoveriesSoFar = 0, target = null } = {}) {
  if (!target || !isDiscovery) return 0
  return discoveriesSoFar < target.discoveries ? 8 : -14
}
