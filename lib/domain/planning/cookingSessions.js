import { COOKED_DISH_SHELF_LIFE } from '../../shelfLifeRules'

/**
 * Sessions de cuisine déterministes, capacité temporelle et congélation
 * (audit §10 étape 6, §13 « Session de cuisine », §14 Lot P3 items 2/4/5/6).
 *
 * Ce module est purement calculatoire : aucune IA, aucun accès réseau, aucune
 * heuristique sur le NOM des plats (F13). Il est partagé entre le solveur
 * (closedLoopPlanner) et la publication (canonicalPlanPayload), et sert aussi
 * de dérivation côté lecture : `buildCookingSessions` reconstruit les sessions
 * depuis les tâches/productions d'un payload existant — le bloc
 * `payload.sessions[]` publié n'est qu'informatif (le RPC
 * publish_closed_loop_plan ignore les clés inconnues du payload, vérifié dans
 * supabase/migrations/20260717000002_p2_planned_productions.sql : seules les
 * clés listées sont lues via p_payload->'...').
 */

// ─── Fenêtres de session ─────────────────────────────────────────────────────
// La fenêtre d'une session est déduite de l'HEURE (UTC) de la première
// consommation couverte par ses tâches. Le producteur d'une production mange
// toujours en premier (les consommateurs sont des créneaux ultérieurs), donc
// la fenêtre découle de l'heure du repas producteur : déjeuner (10 h 30 UTC,
// aligné sur taskTimes du payload) → 'matin', dîner (17 h 30 UTC) → 'soir'.
// 'apres_midi' couvre les heures intermédiaires (goûters/collations futurs).

export const MEAL_DUE_HOUR_UTC = { dejeuner: 10, diner: 17 }

export function sessionWindowForHour(hour) {
  const value = Number(hour)
  if (Number.isFinite(value) && value < 12) return 'matin'
  if (Number.isFinite(value) && value < 17) return 'apres_midi'
  return 'soir'
}

export function sessionWindowForMealType(mealType) {
  return sessionWindowForHour(MEAL_DUE_HOUR_UTC[mealType] ?? MEAL_DUE_HOUR_UTC.diner)
}

const SESSION_WINDOW_ORDER = { matin: 0, apres_midi: 1, soir: 2 }

// ─── Capacité temporelle (audit P3 item 6) ───────────────────────────────────
// Plafond de minutes ACTIVES de cuisine par session. Défaut déterministe :
// 60 min les jours où un déjeuner est planifié « sur place » (l'utilisateur
// cuisine déjà à midi, son créneau libre est court), 90 min les jours sans
// déjeuner planifié. Aucune préférence obligatoire : si l'appelant transmet
// un jour household_members.preferences.planning.maxSessionActiveMinutes via
// constraints.planning, cette valeur prime — le solveur n'a pas accès aux
// membres, seule la route peut faire ce pont (documenté, non requis).
export const SESSION_CAP_WITH_LUNCH_MINUTES = 60
export const SESSION_CAP_WITHOUT_LUNCH_MINUTES = 90

export function resolveSessionCapMinutes(constraints, dateHasPlannedLunch) {
  const declared = Number(constraints?.planning?.maxSessionActiveMinutes)
  if (Number.isFinite(declared) && declared > 0) return Math.floor(declared)
  return dateHasPlannedLunch ? SESSION_CAP_WITH_LUNCH_MINUTES : SESSION_CAP_WITHOUT_LUNCH_MINUTES
}

// ─── Modèle déterministe des minutes actives d'une session ───────────────────
// Une production multi-portions ajoute, au-delà de la préparation elle-même :
// - 5 min actives de refroidissement/portionnage PAR repas consommateur couvert
//   (contenant à remplir, étiqueter, ranger) ;
// - la tâche « Congeler » (5 min) quand au moins une portion part au
//   congélateur ;
// - la tâche « Sortir du congélateur » (2 min) a lieu la veille du repas,
//   HORS session de cuisine — elle ne compte pas dans le plafond.
export const BATCH_PORTIONING_ACTIVE_MINUTES = 5
export const FREEZE_TASK_MINUTES = 5
export const DEFROST_TASK_MINUTES = 2

// ─── Congélabilité et fenêtres de conservation (audit P3 item 5, F13) ────────
// Source de vérité, dans l'ordre :
// 1. un booléen explicite `recipe.freezable` (déclaration de premier rang) ;
// 2. le profil de conservation DÉCLARÉ `recipe.conservationProfile.freezable`
//    (écrit dans le corpus par derive-conservation-profiles.mjs depuis la prose
//    et les arbitrages manuels — c'est LÀ que la prose est lue, une fois,
//    avec ses refus en toutes lettres).
// En l'absence de toute déclaration : PAS de congélation.
//
// Ce qui a été retiré, et pourquoi : la lecture directe de la prose
// (`conservation` contient « congel » sans l'une de quatre négations). La
// mesure du plan (§2.5) a compté 90 plats jugés congelables qui refusaient la
// congélation dans la même phrase — « Congélation exclue », « supporte mal la
// congélation » n'étaient pas dans les quatre négations. Un attribut deviné a
// la même tête qu'un attribut vrai ; le moteur ne devine plus.
//
// Une durée congélateur déclarée (`freezerShelfLifeDays`) n'est PAS une
// autorisation : c'est une durée, lue seulement une fois la congélation
// autorisée. La durée vient du déclaré, sinon des mois déclarés au profil,
// sinon de la règle commune de lib/shelfLifeRules.js.

export function isRecipeFreezable(recipe) {
  if (typeof recipe?.freezable === 'boolean') return recipe.freezable
  return recipe?.conservationProfile?.freezable === true
}

export function freezerShelfLifeDays(recipe) {
  const declared = Number(recipe?.freezerShelfLifeDays)
  if (Number.isFinite(declared) && declared > 0) return Math.floor(declared)
  const months = Number(recipe?.conservationProfile?.freezerMonths)
  if (Number.isFinite(months) && months > 0) return Math.floor(months * 30)
  return COOKED_DISH_SHELF_LIFE.freezer
}

/**
 * Fenêtre RÉFRIGÉRATEUR d'un plat cuisiné d'avance, en jours — celle des
 * productions planifiées (closedLoopPlanner) et des bases partagées
 * (sharedBases). Dans l'ordre : `recipe.shelfLifeDays` déclaré, sinon les
 * heures du profil de conservation, arrondies vers le bas — « 36 heures »
 * couvre le lendemain, pas le surlendemain —, sinon NULL.
 *
 * Null veut dire « aucune production » : l'ancienne constante de trois jours
 * (COOKED_DISH_SHELF_LIFE.fridge) servait de durée à TOUTE production, et
 * c'est ainsi qu'un pan bagnat à 24 h a été produit pour trois jours. Un plat
 * à consommer immédiatement n'a pas de fenêtre du tout.
 *
 * Une garde de MOINS de 24 heures rend null, elle aussi : le planificateur
 * raisonne en jours entiers, et un plancher à un jour ajouterait aux quatre
 * heures d'une salade grecque vingt heures que sa prose ne lui donne pas —
 * exactement le genre d'attribut fabriqué que ce chantier retire. Une fenêtre
 * plus courte que la journée ne se planifie pas ; elle se cuisine le jour même.
 */
export function refrigeratorShelfLifeDays(recipe) {
  const declared = Number(recipe?.shelfLifeDays)
  if (Number.isFinite(declared) && declared > 0) return Math.floor(declared)
  const profile = recipe?.conservationProfile
  if (!profile || profile.eatImmediately === true) return null
  const hours = Number(profile.fridgeHours)
  if (!Number.isFinite(hours) || hours < 24) return null
  return Math.floor(hours / 24)
}

// ─── Sessions de cuisine (audit §13) ─────────────────────────────────────────
// Regroupement purement déterministe des tâches de CUISSON (prepare_recipe et
// freeze_dish — congeler appartient à la session qui a cuisiné) par
// (jour, fenêtre). Réchauffer et décongeler ne sont pas de la cuisine et n'y
// figurent jamais. Reconstructible à l'identique côté lecture depuis les
// tâches et productions publiées : mêmes entrées → mêmes sessions.

const COOKING_TASK_TYPES = new Set(['prepare_recipe', 'freeze_dish'])
// À horaire égal, la cuisson précède la congélation (ordre physique).
const COOKING_TASK_TYPE_ORDER = { prepare_recipe: 0, freeze_dish: 1 }

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100

export function buildCookingSessions({ slots = [], tasks = [], productions = [] } = {}) {
  const productionByTaskKey = new Map(productions.filter((production) => production.task_key)
    .map((production) => [production.task_key, production]))
  const servingsBySlotKey = new Map(slots.map((slot) => [slot.slot_key, Number(slot.servings) || 0]))
  const coveredSlotsByProductionKey = new Map()
  for (const slot of slots) {
    if (!slot.production_key) continue
    coveredSlotsByProductionKey.set(slot.production_key,
      (coveredSlotsByProductionKey.get(slot.production_key) || 0) + 1)
  }

  const sessions = new Map()
  for (const task of tasks) {
    if (!COOKING_TASK_TYPES.has(task.task_type)) continue
    const window = sessionWindowForHour(Number(String(task.due_at || '').slice(11, 13)))
    const sessionKey = `session-${task.prep_date}-${window}`
    if (!sessions.has(sessionKey)) {
      sessions.set(sessionKey, {
        session_key: sessionKey,
        date: task.prep_date,
        window,
        task_keys: [],
        active_minutes_total: 0,
        portions_produced: 0,
        meals_covered: 0,
        entries: [],
      })
    }
    sessions.get(sessionKey).entries.push(task)
  }

  const result = []
  for (const session of sessions.values()) {
    session.entries.sort((a, b) => String(a.due_at).localeCompare(String(b.due_at))
      || (COOKING_TASK_TYPE_ORDER[a.task_type] ?? 2) - (COOKING_TASK_TYPE_ORDER[b.task_type] ?? 2)
      || String(a.task_key).localeCompare(String(b.task_key)))
    for (const task of session.entries) {
      session.task_keys.push(task.task_key)
      session.active_minutes_total += Number(task.duration_min) || 0
      const production = productionByTaskKey.get(task.task_key)
      if (production) {
        const covered = coveredSlotsByProductionKey.get(production.production_key) || 0
        // La production réfrigérateur inclut le créneau producteur (qui mange
        // sa part sans portionnage supplémentaire) ; toutes les portions d'une
        // production congélateur sont des consommateurs à portionner. Les
        // portions « semaine suivante » (sans créneau) ne sont pas comptées
        // ici — le solveur, lui, les compte (plafond plus strict que l'info).
        const consumerMeals = Math.max(0, covered - (production.storage_method === 'refrigerator' ? 1 : 0))
        session.portions_produced += Number(production.planned_portions) || 0
        session.meals_covered += covered
        session.active_minutes_total += BATCH_PORTIONING_ACTIVE_MINUTES * consumerMeals
      } else if (task.task_type === 'prepare_recipe') {
        session.portions_produced += servingsBySlotKey.get(task.slot_key) || 0
        session.meals_covered += 1
      }
    }
    const { entries, ...published } = session
    published.portions_produced = round2(published.portions_produced)
    result.push(published)
  }
  return result.sort((a, b) => String(a.date).localeCompare(String(b.date))
    || (SESSION_WINDOW_ORDER[a.window] ?? 3) - (SESSION_WINDOW_ORDER[b.window] ?? 3))
}
