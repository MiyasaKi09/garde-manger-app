import { buildMealAlternatives } from '@/lib/domain/planning/mealAlternatives'
import { recipeDiversityProfile } from '@/lib/domain/planning/closedLoopPlanner'
import { DEFAULT_REPETITION_RULES } from '@/lib/domain/planning/repetitionRules'

/**
 * MESURER LA LATENCE DES ALTERNATIVES — support du livrable 3.2.
 *
 * Ce module n'est pas un test : il est partagé par
 * `tests/planning/alternativesLatence.test.js`, qui l'exige, et par
 * `tests/planning/rapportQualiteSemaine.test.js`, qui le consigne. Le critère
 * demande que le chiffre soit « consigné dans le rapport de qualité » ; deux
 * mesures écrites séparément finiraient par ne plus dire la même chose.
 *
 * VINGT APPELS, parce que le critère dit vingt. Le créneau tourne sur la
 * semaine : mesurer vingt fois le MÊME créneau mesurerait surtout le cache du
 * moteur de la machine, pas le service rendu.
 */
export const APPELS_MESURES = 20

/**
 * Centile par RANG LE PLUS PROCHE (nearest-rank), la définition la plus simple
 * et la seule qui rende toujours une valeur RÉELLEMENT observée : sur vingt
 * appels, le 95e centile est le 19e plus rapide. Une interpolation rendrait un
 * nombre que la machine n'a jamais mesuré — exactement ce que le contrat des
 * chiffres interdit ailleurs dans ce dépôt.
 */
export function centile(valeurs, rang) {
  if (!valeurs.length) return null
  const triees = [...valeurs].sort((gauche, droite) => gauche - droite)
  const index = Math.min(triees.length - 1, Math.max(0, Math.ceil((rang / 100) * triees.length) - 1))
  return triees[index]
}

/**
 * Le TEMPS DE CALCUL des alternatives, sur le vivier qu'on lui passe. Ce qui
 * est chronométré est exactement ce que la route calcule après ses lectures :
 * classement des candidats, couverture stock, conséquences sur le reste de la
 * semaine, écarts nutritionnels. Ce qui n'y est PAS : le réseau et les
 * aller-retours Supabase, que la CI ne peut pas mesurer et qu'on ne devine pas.
 */
export function mesurerLatenceAlternatives({
  slots,
  candidates,
  inventoryLots = [],
  history = null,
  tasteProfile = null,
  rules = DEFAULT_REPETITION_RULES,
  appels = APPELS_MESURES,
}) {
  const durees = []
  let dernieresAlternatives = []
  for (let index = 0; index < appels; index += 1) {
    const cible = slots[index % slots.length]
    const debut = performance.now()
    const resultat = buildMealAlternatives({
      slots,
      slotKey: cible.key,
      candidates,
      inventoryLots,
      history,
      tasteProfile,
      rules,
      diversityOf: recipeDiversityProfile,
      limitPerKind: 1,
    })
    durees.push(performance.now() - debut)
    dernieresAlternatives = resultat.alternatives
  }
  return {
    appels,
    durees,
    mediane: centile(durees, 50),
    p95: centile(durees, 95),
    max: Math.max(...durees),
    candidats: candidates.length,
    alternativesRendues: dernieresAlternatives.length,
    // Le nombre de PLATS rendus est souvent inférieur aux cinq angles du §16 :
    // un même plat peut être à la fois le meilleur équivalent et la découverte,
    // et le module le montre une fois en portant ses deux étiquettes. C'est donc
    // le nombre d'ANGLES couverts qui dit ce que l'écran propose réellement.
    anglesCouverts: new Set(dernieresAlternatives.flatMap((item) => item.kinds || [item.kind])).size,
  }
}
