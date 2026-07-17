import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'
import { consumePortions, getCookedDishes } from '@/lib/cookedDishesService'

// P0-3 (audit F02) : getCookedDishes exclut par défaut les plats périmés
// (DLC < aujourd'hui, comparaison UTC ; DLC null = non périmé) et expose un
// booléen calculé `expired` quand includeExpired: true.
// MAJOR 1 (test H) : consumePortions refuse un plat périmé AVANT toute écriture.

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { POST as consumeRoute } from '@/app/api/cooked-dishes/[id]/consume/route'
import { authenticateRequest } from '@/lib/apiAuth'

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

describe('consumePortions — garde d’expiration (MAJOR 1 / test H)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('rejette un plat périmé AVANT toute écriture, message français explicite', async () => {
    const mock = createSupabaseMock({
      cooked_dishes: [{ id: 7, user_id: 'u1', name: 'Curry de pois chiches', portions_cooked: 4, portions_remaining: 3, expiration_date: '2000-01-01' }],
    })
    const result = await consumePortions(7, 'u1', 1, mock)
    expect(result.success).toBe(false)
    expect(result.expired).toBe(true)
    expect(result.error).toContain('Curry de pois chiches')
    expect(result.error).toContain('périmé')
    expect(result.error).toContain('Retirez-le du stock')
    // Aucune écriture : les portions restantes sont intactes.
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(3)
  })

  it('accepte un plat sans DLC (legacy)', async () => {
    const mock = createSupabaseMock({
      cooked_dishes: [{ id: 7, user_id: 'u1', name: 'Gratin legacy', portions_cooked: 3, portions_remaining: 3, expiration_date: null }],
    })
    const result = await consumePortions(7, 'u1', 1, mock)
    expect(result.success).toBe(true)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(2)
  })

  it('accepte un plat dont la DLC est AUJOURD’HUI (comparaison UTC)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T12:00:00Z'))
    const mock = createSupabaseMock({
      cooked_dishes: [{ id: 7, user_id: 'u1', name: 'Dahl du jour', portions_cooked: 2, portions_remaining: 2, expiration_date: '2026-07-17' }],
    })
    const result = await consumePortions(7, 'u1', 1, mock)
    expect(result.success).toBe(true)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(1)
  })
})

describe('POST /api/cooked-dishes/[id]/consume — statut HTTP', () => {
  it('plat périmé → 409 (conflit métier), jamais 500', async () => {
    const mock = createSupabaseMock({
      cooked_dishes: [{ id: 7, user_id: 'u1', name: 'Curry périmé', portions_cooked: 4, portions_remaining: 3, expiration_date: '2000-01-01' }],
    })
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    const response = await consumeRoute({ json: async () => ({ portions: 1 }) }, { params: { id: '7' } })
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toContain('périmé')
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(3)
  })
})
