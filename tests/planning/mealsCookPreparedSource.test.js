import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/deductNeeds', () => ({
  deductFromStock: vi.fn(async () => ({ deductedCount: 0, usedLots: [], shortfalls: [], error: null })),
}))

import { POST } from '@/app/api/meals/cook/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { deductFromStock } from '@/lib/deductNeeds'

const request = (body) => ({ json: async () => body })
const baseBody = {
  meal_date: '2026-07-20',
  meal_type: 'dejeuner',
  entries: [{ person_name: 'Julien', kcal: 600 }],
  needs: [{ canonical_food_id: 12, quantity: 300, unit: 'g' }],
  deductions: [{ lot_id: 'lot-1', quantity_used: 300, unit: 'g' }],
}

describe('POST /api/meals/cook — sources déjà préparées', () => {
  beforeEach(() => {
    deductFromStock.mockClear()
  })

  it('un reste existant consomme uniquement ses portions, jamais les ingrédients bruts envoyés par le client', async () => {
    const mock = createSupabaseMock({
      meal_log: [],
      meal_stock_deductions: [],
      cooked_dishes: [{
        id: 'dish-1', user_id: 'u1', name: 'Poulet rôti',
        portions_cooked: 4, portions_remaining: 3, expiration_date: '2999-01-01',
      }],
      meal_plan_slots: [],
      meal_plan_versions: [],
      planned_consumptions: [],
    })
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const response = await POST(request({ ...baseBody, eaten_dish_id: 'dish-1' }))
    expect(response.status).toBe(200)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(2)
    expect(deductFromStock).toHaveBeenCalledTimes(1)
    expect(deductFromStock).toHaveBeenCalledWith(mock, 'u1', { needs: [], deductions: [] })
  })

  it('un plat batch déjà produit neutralise aussi les besoins bruts du repas', async () => {
    const mock = createSupabaseMock({
      meal_log: [],
      meal_stock_deductions: [],
      cooked_dishes: [{
        id: 'batch-dish', user_id: 'u1', batch_recipe_id: 77,
        name: 'Dahl batch', portions_cooked: 6, portions_remaining: 6,
        expiration_date: '2999-01-01',
      }],
      meal_plan_slots: [],
      meal_plan_versions: [],
      planned_consumptions: [],
    })
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const response = await POST(request({ ...baseBody, batch_recipe_id: 77 }))
    expect(response.status).toBe(200)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(5)
    expect(deductFromStock).toHaveBeenCalledWith(mock, 'u1', { needs: [], deductions: [] })
  })

  it('un repas frais sans source préparée conserve sa déduction normale', async () => {
    const mock = createSupabaseMock({
      meal_log: [],
      meal_stock_deductions: [],
      cooked_dishes: [],
      meal_plan_slots: [],
      meal_plan_versions: [],
      planned_consumptions: [],
    })
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const response = await POST(request(baseBody))
    expect(response.status).toBe(200)
    expect(deductFromStock).toHaveBeenCalledWith(mock, 'u1', {
      needs: baseBody.needs,
      deductions: baseBody.deductions,
    })
  })
})
