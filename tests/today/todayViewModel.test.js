import { describe, it, expect } from 'vitest'
import { buildTodayViewModel } from '@/lib/domain/today/todayViewModel'
import { assertTodayViewModel } from '@/lib/contracts/today'

describe('buildTodayViewModel', () => {
  it('produit un ViewModel conforme au contrat', () => {
    const vm = buildTodayViewModel({
      date: '2026-07-14',
      members: [{ id: 'm1', name: 'Julien', active: true }],
      targetsByMember: new Map([['m1', { kcal: 2357 }]]),
      loggedByMember: new Map([['m1', { kcal: 700 }]]),
      leftovers: [],
      shopping: { requiredCount: 2, items: [] },
    })
    expect(() => assertTodayViewModel(vm)).not.toThrow()
    expect(vm.date).toBe('2026-07-14')
    expect(vm.nutritionStatus[0]).toMatchObject({ memberId: 'm1', kcalPercent: 30 })
    expect(vm.nutritionStatus[0].consumed.kcal).toBe(700)
    expect(vm.shopping.requiredCount).toBe(2)
  })

  it('kcalPercent null si pas de cible ; tableaux vides par défaut', () => {
    const vm = buildTodayViewModel({ date: '2026-07-14', members: [{ id: 'm2', name: 'Zoé' }] })
    expect(() => assertTodayViewModel(vm)).not.toThrow()
    expect(vm.nutritionStatus[0].kcalPercent).toBe(null)
    expect(vm.tasks).toEqual([])
    expect(vm.shopping.requiredCount).toBe(0)
  })

  it('priorise un blocage puis une tâche avant le prochain repas', () => {
    const common = {
      date: '2026-07-15',
      now: new Date('2026-07-15T08:00:00Z'),
      tasks: [{ id: 't1', title: 'Préparer la sauce', status: 'pending', dueAt: '2026-07-15T10:00:00Z', href: '/planning' }],
      meals: [{ id: 'm1', title: 'Poulet rôti', status: 'planned', sortOrder: 2, href: '/recipes/canonical/FR-011' }],
    }
    const taskFirst = buildTodayViewModel(common)
    expect(taskFirst.nextAction).toMatchObject({ type: 'task', title: 'Préparer la sauce' })

    const blocked = buildTodayViewModel({
      ...common,
      alerts: [{ id: 'a1', code: 'stock_changed', severity: 'blocker', title: 'Stock modifié', href: '/planning' }],
    })
    expect(blocked.nextAction).toMatchObject({ type: 'alert', priority: 100, reason: 'stock_changed' })
  })

  it('expose repas, plan actif, courses et macros consommées', () => {
    const vm = buildTodayViewModel({
      date: '2026-07-15',
      activePlan: { id: 'p1', status: 'published' },
      members: [{ id: 'm1', name: 'Alex' }],
      loggedByMember: new Map([['m1', { kcal: 500, proteinG: 32, carbsG: 50, fatG: 14, fiberG: 7 }]]),
      meals: [{ id: 'meal', title: 'Dahl', status: 'planned', sortOrder: 2 }],
      shopping: { requiredCount: 1, items: [{ id: 's1', name: 'Lentilles' }] },
    })
    expect(vm.activePlan.id).toBe('p1')
    expect(vm.meals).toHaveLength(1)
    expect(vm.nutritionStatus[0].consumed).toMatchObject({ kcal: 500, proteinG: 32, fiberG: 7 })
    expect(vm.shopping.items).toHaveLength(1)
  })
})
