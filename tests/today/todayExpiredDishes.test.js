import { describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// P0-3 (audit F02 / test H) : getToday exclut les plats cuisinés périmés des
// restes consommables MAIS émet une alerte `cooked_dish_expired` par plat
// périmé avec portions restantes — fini l'exclusion silencieuse. Comparaison
// de DLC en chaînes UTC YYYY-MM-DD ; DLC null (legacy) = non périmé.

vi.mock('@/lib/domain/household/memberRepository', () => ({
  listMembers: vi.fn(async () => []),
}))
vi.mock('@/lib/domain/household/getActiveNutritionTargets', () => ({
  getActiveNutritionTargets: vi.fn(async () => new Map()),
}))

import { getToday } from '@/lib/db/queries/today'
import { assertTodayViewModel } from '@/lib/contracts/today'

const DATE = '2026-07-17'

function buildMock(cookedDishes) {
  return createSupabaseMock({
    meal_plan_versions: [],
    meal_log: [],
    inventory_lots: [],
    nutrition_plan_imports: [],
    cooked_dishes: cookedDishes,
  })
}

describe('getToday — plats cuisinés périmés signalés', () => {
  it('exclut le périmé des restes et émet une alerte cooked_dish_expired', async () => {
    const mock = buildMock([
      { id: 'd1', name: 'Dahl de lentilles', portions_remaining: 2, expiration_date: '2026-06-28', storage_method: 'fridge' },
      { id: 'd2', name: 'Riz sauté', portions_remaining: 1, expiration_date: '2026-07-20', storage_method: 'fridge' },
      { id: 'd3', name: 'Soupe congelée', portions_remaining: 3, expiration_date: null, storage_method: 'freezer' },
    ])

    const vm = await getToday(mock, DATE)
    expect(() => assertTodayViewModel(vm)).not.toThrow()

    // Restes consommables : valide + DLC null (legacy), jamais le périmé.
    expect(vm.leftovers.map((l) => l.id).sort()).toEqual(['d2', 'd3'])

    const alerts = vm.alerts.filter((a) => a.code === 'cooked_dish_expired')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'cooked-dish-expired-d1',
      severity: 'error',
      href: '/pantry',
      portionsRemaining: 2,
      expirationDate: '2026-06-28',
    })
    expect(alerts[0].title).toContain('Dahl de lentilles')
    expect(alerts[0].title).toContain('2 portions')
    expect(alerts[0].daysRemaining).toBeLessThan(0)

    // severity 'error' → l'alerte devient l'action prioritaire du jour.
    expect(vm.nextAction).toMatchObject({ type: 'alert', reason: 'cooked_dish_expired' })
  })

  it('un plat expirant AUJOURD’HUI reste un reste consommable (pas d’alerte)', async () => {
    const mock = buildMock([
      { id: 'd4', name: 'Gratin', portions_remaining: 2, expiration_date: DATE, storage_method: 'fridge' },
    ])

    const vm = await getToday(mock, DATE)
    expect(vm.leftovers.map((l) => l.id)).toEqual(['d4'])
    expect(vm.alerts.filter((a) => a.code === 'cooked_dish_expired')).toHaveLength(0)
  })

  it('une alerte par plat périmé, aucune pour les plats valides', async () => {
    const mock = buildMock([
      { id: 'e1', name: 'Curry', portions_remaining: 1, expiration_date: '2026-07-01', storage_method: 'fridge' },
      { id: 'e2', name: 'Bolognaise', portions_remaining: 4, expiration_date: '2026-07-16', storage_method: 'fridge' },
      { id: 'ok', name: 'Chili', portions_remaining: 2, expiration_date: '2026-07-19', storage_method: 'fridge' },
    ])

    const vm = await getToday(mock, DATE)
    const codes = vm.alerts.filter((a) => a.code === 'cooked_dish_expired').map((a) => a.id).sort()
    expect(codes).toEqual(['cooked-dish-expired-e1', 'cooked-dish-expired-e2'])
    expect(vm.leftovers.map((l) => l.id)).toEqual(['ok'])
  })
})
