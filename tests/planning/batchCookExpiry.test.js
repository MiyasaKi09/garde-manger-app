import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// P0-3 (audit F02 / test H) : dans POST /api/planning/batch/cook, un plat
// PÉRIMÉ lié à la préparation ne compte pas comme « déjà cuisiné » — l'utilisateur
// peut recuisiner. Le plat périmé n'est ni supprimé ni décrémenté (pas de
// mutation automatique) ; un plat VALIDE existant garde l'idempotence.

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/deductNeeds', () => ({
  deductFromStock: vi.fn(async () => ({ deductedCount: 0, usedLots: [], shortfalls: [], error: null })),
}))

import { POST } from '@/app/api/planning/batch/cook/route'
import { authenticateRequest } from '@/lib/apiAuth'

const request = (body) => ({ json: async () => body })

describe('POST /api/planning/batch/cook — idempotence et plats périmés', () => {
  let mock

  beforeEach(() => {
    mock = createSupabaseMock({
      nutrition_plan_batch_recipes: [{
        id: 9, name: 'Chili sin carne', portions_total: 4,
        keeps_days: 5, freezable: true, reheat: null, conservation: null,
      }],
      cooked_dishes: [{
        id: 'expired1', user_id: 'u1', batch_recipe_id: 9,
        portions_cooked: 4, portions_remaining: 3,
        expiration_date: '2000-01-01', storage_method: 'fridge',
      }],
    })
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
  })

  it('un plat périmé ne compte pas comme « déjà cuisiné » → nouveau plat créé', async () => {
    const response = await POST(request({ batchRecipeId: 9 }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.already).toBeUndefined()
    expect(body.dish.id).not.toBe('expired1')
    expect(body.dish.portions_remaining).toBe(4)

    // Le périmé reste en stock tel quel (aucune mutation automatique).
    const dishes = mock.rows('cooked_dishes')
    expect(dishes).toHaveLength(2)
    const expired = dishes.find((d) => d.id === 'expired1')
    expect(expired.portions_remaining).toBe(3)
    expect(expired.expiration_date).toBe('2000-01-01')
  })

  it('re-POST après création : le plat VALIDE déclenche l’idempotence (already)', async () => {
    const first = await POST(request({ batchRecipeId: 9 }))
    expect(first.status).toBe(200)
    const created = (await first.json()).dish

    const second = await POST(request({ batchRecipeId: 9 }))
    expect(second.status).toBe(200)
    const body = await second.json()
    expect(body.already).toBe(true)
    expect(body.dish.id).toBe(created.id)

    // Pas de troisième plat : périmé + valide seulement.
    expect(mock.rows('cooked_dishes')).toHaveLength(2)
  })
})
