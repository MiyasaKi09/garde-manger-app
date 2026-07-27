/**
 * Ce qu'une régénération n'a PAS le droit de réécrire.
 *
 * Deux raisons, et deux seulement : le repas a été mangé (ou sa préparation est
 * faite), ou l'utilisateur l'a explicitement épinglé. Tout le reste est
 * remplaçable, même le dîner de ce soir.
 *
 * Une troisième raison existait — « le repas est servi dans moins de 48 h » —
 * et elle produisait exactement l'inverse de ce qu'on attend d'un bouton
 * « modifier cette semaine » : lancée un lundi soir, la régénération gelait les
 * six créneaux principaux de lundi, mardi et mercredi et n'en recalculait que
 * huit sur quatorze. Trois symptômes en découlaient, longtemps pris pour des
 * défauts distincts :
 *
 *   - la semaine ne changeait qu'à moitié ;
 *   - un créneau gelé reçoit `fixedRecipeCode` et échappe donc aux règles
 *     absolues de répétition (§3) — d'où le même plat au déjeuner ET au dîner du
 *     même jour, que le moteur signalait sans pouvoir le corriger ;
 *   - ses prises support étaient préservées telles quelles, si bien que des
 *     assemblages d'une rotation antérieure survivaient d'une semaine à l'autre.
 *
 * Protéger un repas non mangé, c'est décider à la place de l'utilisateur qu'il
 * est trop tard pour en changer. Ce n'est pas au planificateur d'en juger :
 * qui veut garder un repas l'épingle.
 *
 * Module PUR.
 */

/** Statuts de créneau qui valent « c'est mangé, on n'y touche plus ». */
export const CONSUMED_STATUSES = Object.freeze(['consumed', 'completed', 'cooked', 'skipped'])

export function slotProtectionState(slot, meals = [], tasks = []) {
  const slotMeals = meals.filter((meal) => meal.meal_plan_slot_id === slot.id)
  const slotTasks = tasks.filter((task) => task.meal_plan_slot_id === slot.id)
  // Une préparation faite vaut consommation : le plat existe déjà, le remplacer
  // reviendrait à jeter le travail.
  const consumed = CONSUMED_STATUSES.includes(slot.status)
    || slotTasks.some((task) => task.done === true || task.workflow_status === 'done')
  const locked = Boolean(slot.locked) || slotMeals.some((meal) => meal.locked)
  return {
    status: slot.status || 'planned',
    locked,
    consumed,
    protected: consumed || locked,
    protection_reason: consumed ? 'consumed' : locked ? 'locked' : null,
  }
}
