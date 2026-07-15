/**
 * Construction du ViewModel « Aujourd'hui » — fonction PURE (aucun accès réseau),
 * testable. Réf. plan directeur PR 1, §9.15 (contrat) et §7.2 (ordre d'affichage).
 * Les données sont déjà résolues par la couche serveur (lib/db/queries/today.js).
 */

/**
 * @param {object} p
 * @param {string} p.date  YYYY-MM-DD
 * @param {Array}  p.members  [{ id, name, active }]
 * @param {Map}    p.targetsByMember  member_id → objectif normalisé (ou null)
 * @param {Map}    p.loggedByMember   member_id → { kcal }
 * @param {Array}  p.leftovers
 * @param {object} p.shopping  { requiredCount, items }
 */
export function buildTodayViewModel({
  date,
  timezone = 'Europe/Paris',
  now = new Date(),
  activePlan = null,
  members = [],
  targetsByMember = new Map(),
  loggedByMember = new Map(),
  alerts = [],
  tasks = [],
  meals = [],
  leftovers = [],
  shopping = { requiredCount: 0, items: [] },
  dataQuality = [],
} = {}) {
  const getFrom = (map, id) => (map && typeof map.get === 'function' ? map.get(id) : null)

  const nutritionStatus = members.map((m) => {
    const target = getFrom(targetsByMember, m.id) ?? null
    const logged = getFrom(loggedByMember, m.id) ?? { kcal: 0 }
    const consumedKcal = Math.round(Number(logged.kcal) || 0)
    const targetKcal = target?.kcal ?? null
    return {
      memberId: m.id,
      memberName: m.name,
      target,
      consumed: {
        kcal: consumedKcal,
        proteinG: Math.round((Number(logged.proteinG) || 0) * 10) / 10,
        carbsG: Math.round((Number(logged.carbsG) || 0) * 10) / 10,
        fatG: Math.round((Number(logged.fatG) || 0) * 10) / 10,
        fiberG: Math.round((Number(logged.fiberG) || 0) * 10) / 10,
      },
      kcalPercent: targetKcal ? Math.round((consumedKcal / targetKcal) * 100) : null,
    }
  })

  const actionableAlerts = alerts.filter((alert) => !alert.resolved)
  const pendingTasks = tasks
    .filter((task) => !['done', 'completed', 'skipped'].includes(task.status))
    .sort((left, right) => String(left.dueAt || '').localeCompare(String(right.dueAt || '')) || (right.priority || 0) - (left.priority || 0))
  const plannedMeals = meals
    .filter((meal) => !['completed', 'skipped'].includes(meal.status))
    .sort((left, right) => (left.sortOrder || 99) - (right.sortOrder || 99))
  const blockingAlert = actionableAlerts.find((alert) => alert.severity === 'blocker' || alert.severity === 'error')
  const nowIso = now instanceof Date ? now.toISOString() : String(now)
  const overdueTask = pendingTasks.find((task) => task.dueAt && task.dueAt < nowIso)
  const nextTask = overdueTask || pendingTasks[0]
  const nextMeal = plannedMeals[0]
  let nextAction = null
  if (blockingAlert) {
    nextAction = { type: 'alert', title: blockingAlert.title, href: blockingAlert.href || '/planning', priority: 100, reason: blockingAlert.code }
  } else if (nextTask) {
    nextAction = { type: 'task', title: nextTask.title, href: nextTask.href || '/planning', at: nextTask.dueAt || null, priority: overdueTask ? 90 : 80, reason: overdueTask ? 'task_overdue' : 'task_due' }
  } else if (nextMeal) {
    nextAction = { type: 'meal', title: nextMeal.title, href: nextMeal.href || '/planning', at: nextMeal.plannedAt || null, priority: 60, reason: 'meal_planned' }
  } else if ((shopping?.requiredCount || 0) > 0) {
    nextAction = { type: 'shopping', title: `${shopping.requiredCount} article${shopping.requiredCount > 1 ? 's' : ''} à acheter`, href: '/courses', priority: 40, reason: 'shopping_required' }
  } else if (actionableAlerts.length) {
    nextAction = { type: 'alert', title: actionableAlerts[0].title, href: actionableAlerts[0].href || '/pantry', priority: 30, reason: actionableAlerts[0].code }
  }

  return {
    date,
    timezone,
    activePlan,
    members: members.map((m) => ({ id: m.id, name: m.name, active: m.active ?? true })),
    alerts: actionableAlerts,
    nextAction,
    tasks: pendingTasks,
    meals: plannedMeals,
    leftovers,
    shopping: {
      requiredCount: Number(shopping?.requiredCount) || 0,
      items: Array.isArray(shopping?.items) ? shopping.items : [],
    },
    nutritionStatus,
    dataQuality,
  }
}
