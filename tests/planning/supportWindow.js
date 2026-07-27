/**
 * Aides de test pour les créneaux support (petits-déjeuners et collations).
 *
 * La rotation des supports est dérivée de la DATE de début de fenêtre (lot 7,
 * §13) : `2026-07-20` ne sert pas le même petit-déjeuner selon le nombre de
 * familles en rotation. Un test qui fige une date encode donc une propriété
 * qu'il ne contrôle pas — l'ajout de la famille « préparation maison » en a
 * cassé sept d'un coup, tous pour la même raison.
 *
 * Ces aides cherchent la fenêtre qui sert réellement le support attendu au lieu
 * de la deviner. Le test garde ainsi son sujet (réservations, alias de lots,
 * décompte en pièces) sans dépendre du contenu de la rotation.
 */

const DAY_MS = 86_400_000

export const isoAddDays = (iso, days) => new Date(
  new Date(`${String(iso).slice(0, 10)}T00:00:00Z`).getTime() + days * DAY_MS,
).toISOString().slice(0, 10)

/** Aliments servis par les créneaux support d'un type donné, tous membres confondus. */
export function supportFoods(payload, mealType) {
  return payload.legacy_meals
    .filter((meal) => meal.meal_type === mealType)
    .flatMap((meal) => meal.portion_details?.items || [])
}

/** Quantité totale demandée pour un article de courses (0 si absent). */
export function demandOf(payload, productName) {
  return payload.shopping_items.find((item) => item.product_name === productName)?.required_qty ?? 0
}

/**
 * Première fenêtre hebdomadaire dont le payload satisfait le prédicat. `build`
 * reçoit la date de début et renvoie un payload canonique — au test de décider
 * avec quels membres et quels objectifs il le construit.
 */
export function findSupportWindow(build, predicate, { from = '2026-07-20', weeks = 12 } = {}) {
  for (let week = 0; week < weeks; week += 1) {
    const date = isoAddDays(from, week * 7)
    if (predicate(build(date), date)) return date
  }
  throw new Error(`Aucune fenêtre de la rotation ne sert le support recherché (${weeks} semaines depuis ${from})`)
}
