/**
 * Prédicat pur de « préparation » d'une semaine de planning (audit F16, lot P0-5).
 *
 * Une semaine ne peut être annoncée « prête » que si :
 *   1. les prises attendues sont connues (objectifs nutritionnels chargés) ;
 *   2. toutes les prises attendues existent (petit-déjeuner, collations incluses) ;
 *   3. au moins une tâche de préparation est planifiée.
 *
 * Aucune dépendance : la formule des prises attendues reste calculée par
 * l'appelant (app/planning/page.js) — voir le commentaire F19 là-bas sur la
 * future source de vérité (memberRules / household_members.preferences).
 *
 * @param {object} params
 * @param {number} params.expectedMeals    Prises attendues sur la semaine (0 = objectifs absents)
 * @param {number} params.uniqueMealCount  Prises uniques réellement publiées (date|type|personne)
 * @param {number} params.prepTaskCount    Tâches de préparation de la semaine
 * @returns {{ ready: boolean, missingMeals: number, reason: 'goals_missing'|'meals_missing'|'tasks_missing'|null }}
 */
export function computeWeekReadiness({ expectedMeals, uniqueMealCount, prepTaskCount, planStatus = null, validationStatus = null } = {}) {
  const expected = Number.isFinite(Number(expectedMeals)) ? Number(expectedMeals) : 0
  const unique = Number.isFinite(Number(uniqueMealCount)) ? Number(uniqueMealCount) : 0
  const tasks = Number.isFinite(Number(prepTaskCount)) ? Number(prepTaskCount) : 0

  if (planStatus && planStatus !== 'published') {
    return { ready: false, missingMeals: 0, reason: 'review_required' }
  }
  if (validationStatus && !['published', 'valid'].includes(validationStatus)) {
    return { ready: false, missingMeals: 0, reason: 'review_required' }
  }

  // Objectifs manquants (ou échec de chargement) : on ne sait pas ce qui est
  // attendu → jamais « prête », sans pouvoir chiffrer les prises manquantes.
  if (expected <= 0) {
    return { ready: false, missingMeals: 0, reason: 'goals_missing' }
  }
  if (unique < expected) {
    return { ready: false, missingMeals: expected - unique, reason: 'meals_missing' }
  }
  // Une semaine complète sans aucune tâche de préparation n'est pas exécutable.
  if (tasks <= 0) {
    return { ready: false, missingMeals: 0, reason: 'tasks_missing' }
  }
  return { ready: true, missingMeals: 0, reason: null }
}

export { expectedMealCountForWindow } from './memberPlanningRules'
