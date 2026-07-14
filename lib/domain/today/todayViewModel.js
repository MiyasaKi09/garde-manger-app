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
  members = [],
  targetsByMember = new Map(),
  loggedByMember = new Map(),
  leftovers = [],
  shopping = { requiredCount: 0, items: [] },
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
      consumed: { kcal: consumedKcal },
      kcalPercent: targetKcal ? Math.round((consumedKcal / targetKcal) * 100) : null,
    }
  })

  return {
    date,
    timezone,
    activePlan: null,
    members: members.map((m) => ({ id: m.id, name: m.name, active: m.active ?? true })),
    alerts: [],
    nextAction: null,
    tasks: [],
    meals: [],
    leftovers,
    shopping: {
      requiredCount: Number(shopping?.requiredCount) || 0,
      items: Array.isArray(shopping?.items) ? shopping.items : [],
    },
    nutritionStatus,
    dataQuality: [],
  }
}
