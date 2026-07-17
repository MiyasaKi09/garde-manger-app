import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// P0-3 (audit F02 / test d'acceptation H) : un plat cuisiné périmé n'est ni
// consommable explicitement (eaten_dish_id → 409) ni sélectionnable en FEFO
// automatique (batch_recipe_id). DLC comparées en UTC ; DLC null (legacy) =
// non périmé. Aucune mutation automatique du plat périmé.

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/deductNeeds', () => ({
  deductFromStock: vi.fn(async () => ({ deductedCount: 0, usedLots: [], shortfalls: [], error: null })),
}))

import { POST } from '@/app/api/meals/cook/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { deductFromStock } from '@/lib/deductNeeds'

const request = (body) => ({ json: async () => body })
const baseBody = { meal_date: '2026-07-17', meal_type: 'dejeuner', entries: [{ person_name: 'Julien', kcal: 600 }] }

describe('POST /api/meals/cook — plats cuisinés périmés', () => {
  let mock

  const setup = (dishes) => {
    mock = createSupabaseMock({ meal_log: [], cooked_dishes: dishes, meal_stock_deductions: [] })
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
  }

  beforeEach(() => {
    deductFromStock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('eaten_dish_id périmé → 409 explicite en français, plat et stock intouchés', async () => {
    setup([{
      id: 'd1', user_id: 'u1', name: 'Dahl de lentilles',
      portions_cooked: 4, portions_remaining: 2, expiration_date: '2000-01-01',
    }])

    const response = await POST(request({ ...baseBody, eaten_dish_id: 'd1' }))
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toContain('Dahl de lentilles')
    expect(body.error).toContain('périmé')

    // Aucune mutation automatique : le plat reste tel quel, rien n'est loggé,
    // le stock n'a pas été déduit (refus AVANT toute écriture).
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(2)
    expect(mock.rows('meal_log')).toHaveLength(0)
    expect(deductFromStock).not.toHaveBeenCalled()
  })

  it('eaten_dish_id expirant AUJOURD’HUI (comparaison UTC) → encore consommable', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T12:00:00Z'))
    setup([{
      id: 'd1', user_id: 'u1', name: 'Dahl de lentilles',
      portions_cooked: 4, portions_remaining: 2, expiration_date: '2026-07-17',
    }])

    const response = await POST(request({ ...baseBody, eaten_dish_id: 'd1' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.batchConsumed).toBe(1)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(1)
  })

  it('eaten_dish_id sans DLC (reste legacy) → non périmé, consommable', async () => {
    setup([{
      id: 'd1', user_id: 'u1', name: 'Gratin sans DLC',
      portions_cooked: 3, portions_remaining: 3, expiration_date: null,
    }])

    const response = await POST(request({ ...baseBody, eaten_dish_id: 'd1' }))
    expect(response.status).toBe(200)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(2)
  })

  it('FEFO batch_recipe_id : ignore le périmé et prend le valide qui expire en premier', async () => {
    setup([
      { id: 'old', user_id: 'u1', batch_recipe_id: 77, portions_cooked: 4, portions_remaining: 2, expiration_date: '2000-01-02' },
      { id: 'later', user_id: 'u1', batch_recipe_id: 77, portions_cooked: 4, portions_remaining: 4, expiration_date: '2999-01-10' },
      { id: 'soon', user_id: 'u1', batch_recipe_id: 77, portions_cooked: 4, portions_remaining: 3, expiration_date: '2999-01-05' },
    ])

    const response = await POST(request({ ...baseBody, batch_recipe_id: 77 }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.batchConsumed).toBe(1)

    const byId = Object.fromEntries(mock.rows('cooked_dishes').map((d) => [d.id, d]))
    expect(byId.soon.portions_remaining).toBe(2) // le valide qui expire en premier
    expect(byId.old.portions_remaining).toBe(2) // le périmé n'est jamais touché
    expect(byId.later.portions_remaining).toBe(4)

    // Le log pointe bien vers le plat réellement décompté.
    expect(mock.rows('meal_log')[0].cooked_dish_id).toBe('soon')
  })

  it('FEFO batch_recipe_id : une DLC null (legacy) reste éligible quand le reste est périmé', async () => {
    setup([
      { id: 'ex', user_id: 'u1', batch_recipe_id: 88, portions_cooked: 2, portions_remaining: 2, expiration_date: '2000-01-01' },
      { id: 'nul', user_id: 'u1', batch_recipe_id: 88, portions_cooked: 2, portions_remaining: 2, expiration_date: null },
    ])

    const response = await POST(request({ ...baseBody, batch_recipe_id: 88 }))
    expect(response.status).toBe(200)

    const byId = Object.fromEntries(mock.rows('cooked_dishes').map((d) => [d.id, d]))
    expect(byId.nul.portions_remaining).toBe(1)
    expect(byId.ex.portions_remaining).toBe(2)
  })

  it('FEFO batch_recipe_id : tous les plats périmés → aucun décompte, repas quand même validé', async () => {
    setup([
      { id: 'ex1', user_id: 'u1', batch_recipe_id: 99, portions_cooked: 2, portions_remaining: 2, expiration_date: '2000-01-01' },
    ])

    const response = await POST(request({ ...baseBody, batch_recipe_id: 99 }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.batchConsumed).toBe(0)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(2)
  })
})
