import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// Tests E et L (audit §15) :
//   • une consommation reliée à une production ne peut réussir qu'après
//     matérialisation physique du plat ;
//   • une source impossible à vérifier bloque avant toute mutation ;
//   • un créneau sans consommation de production conserve le chemin frais normal.

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/deductNeeds', () => ({
  deductFromStock: vi.fn(async () => ({ deductedCount: 0, usedLots: [], shortfalls: [], error: null })),
}))

import { POST } from '@/app/api/meals/cook/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { deductFromStock } from '@/lib/deductNeeds'

const request = (body) => ({ json: async () => body })
const BASE = { meal_date: '2026-07-19', meal_type: 'dejeuner', entries: [{ person_name: 'Julien', kcal: 650 }] }

const SLOT_ID = 'slot-prod-1'
const PLAN_VER_ID = 'pv-prod-1'
const PROD_ID = 'prod-uuid-1'
const DISH_ID = 77

function makeBase() {
  return {
    meal_log: [],
    meal_stock_deductions: [],
    meal_plan_slots: [{
      id: SLOT_ID, user_id: 'u1',
      meal_date: '2026-07-19', meal_type: 'dejeuner',
      plan_version_id: PLAN_VER_ID, cooked_dish_id: null,
    }],
    meal_plan_versions: [{ id: PLAN_VER_ID, user_id: 'u1', status: 'published' }],
    planned_consumptions: [{
      id: 'cons-1', user_id: 'u1', plan_version_id: PLAN_VER_ID,
      slot_id: SLOT_ID, planned_production_id: PROD_ID,
      cooked_dish_id: null, lot_id: null, portions: 2, role: 'main',
    }],
    planned_productions: [{
      id: PROD_ID, user_id: 'u1', plan_version_id: PLAN_VER_ID,
      source_task_id: '101', production_key: 'batch-lentilles-2026-07-17',
      status: 'materialized', materialized_cooked_dish_id: DISH_ID,
    }],
    cooked_dishes: [{
      id: DISH_ID, user_id: 'u1', name: 'Dahl de lentilles (batch)',
      portions_cooked: 4, portions_remaining: 4, expiration_date: null,
      kcal_per_portion: 480, protein_g_per_portion: 22,
      carbs_g_per_portion: 60, fat_g_per_portion: 10, fiber_g_per_portion: 8,
    }],
    inventory_reservations: [],
  }
}

describe('POST /api/meals/cook — consommation via production matérialisée (P2 test E)', () => {
  let mock

  beforeEach(() => { deductFromStock.mockClear() })

  const setup = (tables) => {
    mock = createSupabaseMock(tables)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
  }

  it('consomme le plat matérialisé résolu via planned_consumptions → planned_productions', async () => {
    setup(makeBase())

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(3)
    expect(mock.rows('meal_log')).toHaveLength(1)
    expect(mock.rows('meal_log')[0].cooked_dish_id).toBe(DISH_ID)
    expect(deductFromStock).toHaveBeenCalledWith(mock, 'u1', { needs: [], deductions: [] })
  })

  it('production non matérialisée → 409 avant log, plat et stock intouchés', async () => {
    const tables = makeBase()
    tables.planned_productions[0].status = 'planned'
    tables.planned_productions[0].materialized_cooked_dish_id = null
    setup(tables)

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain('pas encore terminée')
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(4)
    expect(mock.rows('meal_log')).toHaveLength(0)
    expect(deductFromStock).not.toHaveBeenCalled()
  })

  it('aucune consommation planifiée pour ce slot → chemin frais normal', async () => {
    const tables = makeBase()
    tables.planned_consumptions = []
    setup(tables)

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(4)
  })

  it('planned_consumptions via lot direct → chemin normal, sans production', async () => {
    const tables = makeBase()
    tables.planned_consumptions[0].planned_production_id = null
    tables.planned_consumptions[0].lot_id = 'lot-uuid-abc'
    setup(tables)

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(200)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(4)
  })

  it('eaten_dish_id explicite reste prioritaire sur la production planifiée', async () => {
    const tables = makeBase()
    tables.cooked_dishes.push({
      id: 99, user_id: 'u1', name: 'Autre plat',
      portions_cooked: 2, portions_remaining: 2, expiration_date: null,
    })
    setup(tables)

    const res = await POST(request({ ...BASE, eaten_dish_id: 99 }))
    expect(res.status).toBe(200)

    const dishes = mock.rows('cooked_dishes')
    expect(dishes.find((dish) => dish.id === DISH_ID).portions_remaining).toBe(4)
    expect(dishes.find((dish) => dish.id === 99).portions_remaining).toBe(1)
  })

  it('plat matérialisé périmé → 409, aucune déduction', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-21T12:00:00Z'))

    const tables = makeBase()
    tables.cooked_dishes[0].expiration_date = '2026-07-20'
    setup(tables)

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain('périmé')
    expect(deductFromStock).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('erreur inattendue de lecture des sources P2 → 500 fail-closed, aucune mutation', async () => {
    setup(makeBase())
    mock.queueError('planned_consumptions', 'select', 'database unavailable')

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toContain('Lecture de la source')
    expect(mock.rows('meal_log')).toHaveLength(0)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(4)
    expect(deductFromStock).not.toHaveBeenCalled()
  })
})
