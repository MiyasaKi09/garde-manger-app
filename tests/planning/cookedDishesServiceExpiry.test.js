import { describe, expect, it } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'
import { getCookedDishes } from '@/lib/cookedDishesService'

// P0-3 (audit F02) : getCookedDishes exclut par défaut les plats périmés
// (DLC < aujourd'hui, comparaison UTC ; DLC null = non périmé) et expose un
// booléen calculé `expired` quand includeExpired: true.

const DISHES = [
  { id: 'ex', user_id: 'u1', name: 'Curry périmé', portions_remaining: 2, expiration_date: '2000-01-01' },
  { id: 'ok', user_id: 'u1', name: 'Chili valide', portions_remaining: 3, expiration_date: '2999-12-31' },
  { id: 'nul', user_id: 'u1', name: 'Gratin legacy', portions_remaining: 1, expiration_date: null },
]

describe('getCookedDishes — filtre DLC', () => {
  it('exclut les périmés par défaut, garde les DLC null (legacy)', async () => {
    const mock = createSupabaseMock({ cooked_dishes: DISHES })
    const result = await getCookedDishes('u1', {}, mock)
    expect(result.success).toBe(true)
    expect(result.dishes.map((d) => d.id).sort()).toEqual(['nul', 'ok'])
    expect(result.dishes.every((d) => d.expired === false)).toBe(true)
  })

  it('includeExpired: true → tous les plats, flag `expired` calculé', async () => {
    const mock = createSupabaseMock({ cooked_dishes: DISHES })
    const result = await getCookedDishes('u1', { includeExpired: true }, mock)
    expect(result.success).toBe(true)
    expect(result.dishes).toHaveLength(3)
    const byId = Object.fromEntries(result.dishes.map((d) => [d.id, d]))
    expect(byId.ex.expired).toBe(true)
    expect(byId.ok.expired).toBe(false)
    expect(byId.nul.expired).toBe(false) // DLC absente = non périmé
  })

  it('combine toujours les autres filtres (onlyWithPortions)', async () => {
    const mock = createSupabaseMock({
      cooked_dishes: [...DISHES, { id: 'vide', user_id: 'u1', name: 'Fini', portions_remaining: 0, expiration_date: '2999-12-31' }],
    })
    const result = await getCookedDishes('u1', { onlyWithPortions: true }, mock)
    expect(result.dishes.map((d) => d.id).sort()).toEqual(['nul', 'ok'])
  })
})
