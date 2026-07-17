/**
 * Sélection du plat cuisiné à afficher pour une préparation batch.
 *
 * Depuis le fix P0-3 (audit F02), un plat expiré et un plat frais recuit
 * peuvent PARTAGER le même batch_recipe_id. L'état « Au stock » de la page
 * batch doit donc préférer le plat NON expiré le plus récent ; si seuls des
 * expirés existent, on affiche le plus récent en état « Périmé — à retirer ».
 * Fonctions pures, sans dépendance — testées dans
 * tests/planning/cookedDishDisplay.test.js.
 */

// DLC comparée en UTC (piège #4 : pas de décalage selon le fuseau de
// l'utilisateur). Expiré = date strictement antérieure à aujourd'hui ;
// une DLC absente (plats legacy) n'est PAS considérée comme périmée.
export const todayUtcIso = () => new Date().toISOString().slice(0, 10)

export const isDishExpired = (expirationDate, todayIso = todayUtcIso()) =>
  Boolean(expirationDate) && String(expirationDate).slice(0, 10) < todayIso

/**
 * @param {Array<object>} dishes  cooked_dishes d'un même batch_recipe_id
 * @param {string} todayIso       référence UTC YYYY-MM-DD (injectable en test)
 * @returns {object|null}         le plat à afficher (frais le plus récent,
 *                                sinon expiré le plus récent), ou null
 */
export function pickDisplayedCookedDish(dishes = [], todayIso = todayUtcIso()) {
  const newest = (a, b) => (String(b.cooked_at || '') > String(a.cooked_at || '') ? b : a)
  let fresh = null
  let expired = null
  for (const dish of dishes) {
    if (!dish) continue
    if (isDishExpired(dish.expiration_date, todayIso)) {
      expired = expired ? newest(expired, dish) : dish
    } else {
      fresh = fresh ? newest(fresh, dish) : dish
    }
  }
  return fresh || expired || null
}
