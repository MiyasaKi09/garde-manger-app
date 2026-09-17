/**
 * PLANCHER DE DENSITÉ PROTÉIQUE PAR MEMBRE — livrable 1.4.
 *
 * CE QU'IL CORRIGE. Mesuré au §2.3 de `docs/PLAN_FINIR_MYKO.md` : pour
 * atteindre les kcal de Julien, la couche personnalisée lui sert 1,86 à 2,00
 * portions du plat du foyer (P5), ce qui gonfle glucides et lipides sans
 * rattraper les protéines — le plancher protéique est relâché 4 à 7 jours sur
 * 7. La cause n'est pas la portion : c'est le PLAT. Un plat à 0,04 g de
 * protéines par kcal ne devient pas protéiné parce qu'on en sert le double ;
 * il devient seulement plus gros. Le remède est donc en amont, au moment où le
 * solveur CHOISIT le plat, et non en aval au moment où il dose l'assiette —
 * c'est ce que demandent C3.1 du plan de septembre et le livrable 1.4.
 *
 * CE QUE CE MODULE CALCULE. Pour chaque membre, la densité protéique que ses
 * repas principaux doivent tenir, en g de protéines par kcal, et le nombre de
 * créneaux de la semaine qui doivent la tenir. Le foyer partage ses plats : le
 * plancher du foyer est donc le plus exigeant des planchers de ses membres —
 * un plat qui ne convient pas au plus exigeant ne convient pas.
 *
 * CE QU'IL NE DEVINE PAS. Le plancher dérivé d'un membre vaut sa cible
 * protéique divisée par sa cible énergétique : deux grandeurs DÉCLARÉES. Un
 * membre sans cible protéique ou sans cible énergétique n'a pas de plancher —
 * `null`, pas une valeur plausible — et n'entre pas dans le calcul du foyer.
 * Si aucun membre n'a de plancher, ce module rend `null` et le planificateur
 * se comporte exactement comme avant ce livrable.
 *
 * POURQUOI LA DENSITÉ DU JOUR, ET PAS UNE VALEUR EN DUR. C3.1 propose « Julien :
 * 0,10 sur ≥ 8 / 14 ». Ce 0,10 était la densité qu'imposait une cible de 216 g
 * — c'est-à-dire, on le sait depuis le livrable 1.3, une cible calculée sur le
 * mauvais poids. Le figer reviendrait à conserver l'erreur sous une autre
 * forme. La densité du jour (cible protéines / cible kcal) est la même grandeur
 * recalculée à partir de la cible juste, et elle suit la personne au lieu de la
 * précéder. Elle reste RÉGLABLE : `protein_density_floor_g_per_kcal` dans les
 * préférences du membre l'emporte sur la dérivation.
 *
 * OÙ LES RÉGLAGES SONT LUS, ET POURQUOI PAS DANS `memberPlanningRules.js`.
 * Ce module lit `member.preferences.planning` directement. `memberPlanningRules`
 * décrit la GRILLE des repas d'une personne (quelles prises, quelles portions,
 * quels jours) ; le plancher de densité est une contrainte de SÉLECTION des
 * plats du foyer, qui ne dit rien de la grille. Les deux lectures restent
 * séparées pour que la grille ne dépende jamais d'un objectif nutritionnel.
 *
 * Module PUR : aucune lecture de base, aucune horloge.
 */

// Les réglages du membre se lisent avec `declaredNumber` et non `Number` :
// `Number('  ')`, `Number([])` et `Number(false)` valent 0, `Number(true)`
// vaut 1. Un `protein_dense_meals_per_week` lu ainsi mettrait le nombre de
// créneaux à 0 — le plancher désarmé sans que personne ne l'ait demandé — et
// un `protein_density_floor_g_per_kcal` à 1 g/kcal, un plancher qu'aucun plat
// ne franchit. Corrigé à la relecture du 17 septembre 2026, même cause que le
// quota carné du livrable 1.1.
import { declaredNumber } from './memberPlanningRules'

/**
 * Part des créneaux de la semaine qui doivent tenir le plancher, par défaut :
 * DIX SUR QUATORZE. C3.1 propose huit ; la valeur a été mesurée avant d'être
 * fixée, et la table complète est dans
 * `tests/planning/plancherDensiteProteique.test.js`.
 *
 * CE QUE LA MESURE DÉPARTAGE. Ce n'est pas P4 : d'une valeur à l'autre il vaut
 * 6,4,3 · 6,5,4 · 6,6,4 · 6,5,4 · 6,5,6 · 6,7,6 sur trois semaines, une
 * variation du même ordre que celle qu'on observe en changeant de date de
 * départ — `recipeCandidatePolicy.js` documente le même piège, et on ne calibre
 * pas sur du bruit. Ce qui varie MONOTONIQUEMENT, donc ce sur quoi on peut
 * décider, c'est la variété : 36, 36, 34, 32, 29 puis 27 plats distincts sur
 * 42 créneaux à mesure que l'exigence monte, et 0, 0, 2, 4, 7 puis 7 plats
 * repris d'une semaine à l'autre — contre 35 distincts et 1 reprise sans
 * plancher.
 *
 * DIX EST LE PLUS GRAND NOMBRE QUI NE COÛTE RIEN À LA VARIÉTÉ. Il gagne
 * l'essentiel sur P4 (2,3,2 → 6,5,4 jours à ≥ 85 %), réduit de moitié les
 * journées à plancher protéique relâché (5,4,5 → 1,2,3), fait tomber la part
 * des pâtes de 8 à 4 créneaux sur 42, et laisse P1bis et P13 tels quels
 * (36 distincts contre 35, 0 reprise inter-semaines contre 1, 17 libellés de
 * cuisine contre 17).
 *
 * ÉCARTÉ, ET AVEC SON CHIFFRE : quatorze sur quatorze — le plancher sur TOUS
 * les repas — est le seul réglage qui tienne P4 ≥ 6/7 sur les trois semaines
 * (6, 7, 6). Il le paie 27 plats distincts au lieu de 35 et 7 reprises d'une
 * semaine à l'autre au lieu d'une, c'est-à-dire qu'il gagne P4 en dégradant
 * P1bis, que le §9.1 du plan exige à 0 reprise. On ne gagne pas un critère en
 * en cassant un autre : le réglage reste disponible
 * (`protein_dense_meals_per_week` dans le profil du membre), il n'est pas le
 * défaut, et l'arbitrage appartient au foyer.
 *
 * Exprimée en part plutôt qu'en nombre pour qu'une semaine partielle
 * (régénération de trois jours) garde la même règle.
 */
export const PROTEIN_DENSE_SLOT_SHARE_DEFAULT = 10 / 14

/** Densité protéique d'une recette, en g de protéines par kcal. `null` si non calculable. */
export function recipeProteinDensity(recipe) {
  const nutrition = recipe?.nutritionPerServing
  const kcal = Number(nutrition?.kcal)
  const protein = Number(nutrition?.proteinG)
  if (!Number.isFinite(kcal) || kcal <= 0 || !Number.isFinite(protein)) return null
  return protein / kcal
}

/** Une recette tient-elle le plancher ? Sans plancher, la question ne se pose pas. */
export function isProteinDense(recipe, floor) {
  if (!Number.isFinite(Number(floor)) || Number(floor) <= 0) return false
  const density = recipeProteinDensity(recipe)
  // Tolérance d'arrondi : une densité égale au plancher le tient.
  return density != null && density >= Number(floor) - 1e-9
}

/**
 * Plancher d'un membre : son réglage s'il en a un, sinon la densité de sa
 * journée. `null` quand ni l'un ni l'autre n'est déclaré.
 *
 * @returns {{ floor: number, source: 'member'|'daily_target' }|null}
 */
export function memberProteinDensityFloor({ targetProteinG, targetKcal, declaredFloor } = {}) {
  const declared = declaredNumber(declaredFloor)
  if (declared != null && declared > 0) return { floor: declared, source: 'member' }
  const protein = Number(targetProteinG)
  const kcal = Number(targetKcal)
  if (!Number.isFinite(protein) || protein <= 0 || !Number.isFinite(kcal) || kcal <= 0) return null
  return { floor: protein / kcal, source: 'daily_target' }
}

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

/**
 * Exigence du foyer, construite depuis les membres et leurs objectifs.
 *
 * @param {object} input
 * @param {Array} input.members membres actifs, avec leurs `preferences`
 * @param {Array} input.goals objectifs résolus (`person_name`, `target_calories`, `target_protein_g`)
 * @param {number} input.totalSlots créneaux principaux de la fenêtre
 * @returns {{ floor: number, minSlots: number, byMember: Array }|null}
 */
export function buildProteinDensityRequirement({ members = [], goals = [], totalSlots = 14 } = {}) {
  const goalByName = new Map((goals || [])
    .filter((goal) => goal?.person_name)
    .map((goal) => [fold(goal.person_name), goal]))
  const goalByMemberId = new Map((goals || [])
    .filter((goal) => goal?.household_member_id)
    .map((goal) => [String(goal.household_member_id), goal]))

  const byMember = []
  for (const member of members || []) {
    const planning = member?.preferences?.planning || {}
    const goal = goalByMemberId.get(String(member?.id)) || goalByName.get(fold(member?.name)) || null
    const resolved = memberProteinDensityFloor({
      targetProteinG: goal?.target_protein_g,
      targetKcal: goal?.target_calories,
      declaredFloor: planning.protein_density_floor_g_per_kcal,
    })
    if (!resolved) continue
    const declaredSlots = declaredNumber(planning.protein_dense_meals_per_week)
    byMember.push({
      name: member?.name || null,
      floor: resolved.floor,
      floor_source: resolved.source,
      min_slots: declaredSlots != null && declaredSlots >= 0 ? Math.round(declaredSlots) : null,
    })
  }
  if (!byMember.length) return null

  // Le plat est partagé : le plancher du foyer est celui du membre le plus
  // exigeant. Le nombre de créneaux suit la même logique — le plus exigeant des
  // réglages déclarés, à défaut la part par défaut.
  const floor = Math.max(...byMember.map((entry) => entry.floor))
  const declaredSlots = byMember.map((entry) => entry.min_slots).filter((value) => value != null)
  const slots = Math.max(0, Math.round(Number(totalSlots) || 0))
  const minSlots = declaredSlots.length
    ? Math.min(slots, Math.max(...declaredSlots))
    : Math.min(slots, Math.round(slots * PROTEIN_DENSE_SLOT_SHARE_DEFAULT))
  return { floor, minSlots, byMember }
}

/**
 * Forme consommée par le planificateur. Sans exigence, `floor` vaut `null` et
 * `minSlots` 0 : toutes les portes de ce livrable sont alors inertes, et le
 * moteur est identique à ce qu'il était.
 */
export function resolveProteinDensityRequirement(requirement, totalSlots = 14) {
  const floor = Number(requirement?.floor)
  if (!Number.isFinite(floor) || floor <= 0) return { floor: null, minSlots: 0 }
  const slots = Math.max(0, Math.round(Number(totalSlots) || 0))
  const declared = Number(requirement?.minSlots)
  const minSlots = Number.isFinite(declared) && declared >= 0
    ? Math.min(slots, Math.round(declared))
    : Math.min(slots, Math.round(slots * PROTEIN_DENSE_SLOT_SHARE_DEFAULT))
  return { floor, minSlots }
}

/**
 * Le vivier peut-il seulement tenir l'exigence ?
 *
 * LA PARADE DU PLAN, ÉCRITE ICI. Le §5 impose qu'une semaine dégradée ne soit
 * jamais publiée en silence, et le solveur ne rend JAMAIS rien. Une contrainte
 * de sélection dure qui écarterait les plats peu denses rendrait la semaine
 * infaisable dès que le corpus ne contient pas assez de plats denses — et
 * `no_feasible_plan` est pire que tout ce que ce livrable corrige. La porte
 * dure n'est donc armée que lorsque le vivier peut la franchir : sinon
 * l'exigence reste une PRÉFÉRENCE notée et un déficit rapporté
 * (`protein_density_min`), c'est-à-dire un avertissement visible.
 */
export function countDenseCandidates(recipes = [], floor) {
  if (!Number.isFinite(Number(floor)) || Number(floor) <= 0) return 0
  return (recipes || []).filter((recipe) => isProteinDense(recipe, floor)).length
}
