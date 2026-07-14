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
})
