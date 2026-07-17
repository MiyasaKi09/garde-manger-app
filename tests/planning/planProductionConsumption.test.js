import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// Tests E et L (audit §15) :
//   • Test E — Publication atomique : les productions et consommations arrivent
//     dans le plan ; la résolution via planned_consumptions → planned_productions
//     → materialized_cooked_dish_id donne accès au plat matérialisé lors de la
//     consommation du repas (POST /api/meals/cook).
//   • Test L — Aucun orphelin : la consommation d'un créneau ne réussit que si
//     une production matérialisée est trouvée ; sans production, prodDishId=null
//     et la route utilise le chemin normal (pas d'erreur).

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/deductNeeds', () => ({
  deductFromStock: vi.fn(async () => ({ deductedCount: 0, usedLots: [], shortfalls: [], error: null })),
}))

import { POST } from '@/app/api/meals/cook/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { deductFromStock } from '@/lib/deductNeeds'

const request = (body) => ({ json: async () => body })
const BASE = { meal_date: '2026-07-19', meal_type: 'dejeuner', entries: [{ person_name: 'Julien', kcal: 650 }] }

const SLOT_ID      = 'slot-prod-1'
const PLAN_VER_ID  = 'pv-prod-1'
const PROD_ID      = 'prod-uuid-1'
const DISH_ID      = 77        // cooked_dishes.id de la production matérialisée

/** Tables de base avec une production matérialisée liée via planned_consumptions. */
function makeBase() {
  return {
    meal_log: [],
    meal_stock_deductions: [],
    // Créneau de plan publié — PAS de cooked_dish_id direct (P1 absent)
    meal_plan_slots: [{
      id: SLOT_ID, user_id: 'u1',
      meal_date: '2026-07-19', meal_type: 'dejeuner',
      plan_version_id: PLAN_VER_ID,
      cooked_dish_id: null,         // pas de référence P1 directe
    }],
    meal_plan_versions: [{
      id: PLAN_VER_ID, user_id: 'u1', status: 'published',
    }],
    // Consommation planifiée qui pointe vers la production
    planned_consumptions: [{
      id: 'cons-1',
      user_id: 'u1',
      plan_version_id: PLAN_VER_ID,
      slot_id: SLOT_ID,
      planned_production_id: PROD_ID,
      cooked_dish_id: null,
      lot_id: null,
      portions: 2,
      role: 'main',
    }],
    // Production matérialisée (done=true sur la tâche de cuisson)
    planned_productions: [{
      id: PROD_ID,
      user_id: 'u1',
      plan_version_id: PLAN_VER_ID,
      source_task_id: '101',
      production_key: 'batch-lentilles-2026-07-17',
      status: 'materialized',
      materialized_cooked_dish_id: DISH_ID,
    }],
    // Plat physique créé par la matérialisation
    cooked_dishes: [{
      id: DISH_ID, user_id: 'u1',
      name: 'Dahl de lentilles (batch)',
      portions_cooked: 4, portions_remaining: 4,
      expiration_date: null,
      kcal_per_portion: 480, protein_g_per_portion: 22,
      carbs_g_per_portion: 60, fat_g_per_portion: 10, fiber_g_per_portion: 8,
    }],
    inventory_reservations: [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test E — Consommation d'un repas via production matérialisée (P2 path)
// ─────────────────────────────────────────────────────────────────────────────

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

    // Le plat matérialisé a été décrémenté (1 portion consommée)
    const dishes = mock.rows('cooked_dishes')
    expect(dishes[0].portions_remaining).toBe(3)

    // Log créé avec cooked_dish_id pointant sur le plat matérialisé
    const logs = mock.rows('meal_log')
    expect(logs).toHaveLength(1)
    expect(logs[0].cooked_dish_id).toBe(DISH_ID)
  })

  it('production non matérialisée (status=planned) → prodDishId null, pas de décrément', async () => {
    // Test L corollaire : la route ne plante pas si la production n'est pas encore
    // matérialisée — elle passe simplement au chemin normal (pas de plat).
    const tables = makeBase()
    tables.planned_productions[0].status = 'planned'
    tables.planned_productions[0].materialized_cooked_dish_id = null
    setup(tables)

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    // Aucun décrément (pas de plat trouvé)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(4)
    // Log créé sans cooked_dish_id
    const logs = mock.rows('meal_log')
    expect(logs[0].cooked_dish_id).toBeFalsy()
  })

  it('aucune consommation planifiée pour ce slot → prodDishId null, chemin normal', async () => {
    // Test L : slot sans planned_consumptions → pas d'erreur, juste un log sans plat.
    const tables = makeBase()
    tables.planned_consumptions = []
    setup(tables)

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(4) // inchangé
  })

  it('planned_consumptions sans planned_production_id (lot ou plat direct) → prodDishId null', async () => {
    // Consommation via lot_id (pas de production planifiée) → P2 path ignoré
    const tables = makeBase()
    tables.planned_consumptions[0].planned_production_id = null
    tables.planned_consumptions[0].lot_id = 'lot-uuid-abc'
    setup(tables)

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(200)
    // Le chemin P2 n'a rien résolu, mais aucune erreur
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(4)
  })

  it('eaten_dish_id explicite prioritaire sur la résolution P2', async () => {
    // Si eaten_dish_id est fourni, la résolution P2 n'est pas déclenchée.
    const tables = makeBase()
    // Ajouter un deuxième plat pour l'eaten_dish_id
    tables.cooked_dishes.push({
      id: 99, user_id: 'u1', name: 'Autre plat',
      portions_cooked: 2, portions_remaining: 2,
      expiration_date: null,
    })
    setup(tables)

    const res = await POST(request({ ...BASE, eaten_dish_id: 99 }))
    expect(res.status).toBe(200)

    // C'est le plat 99 qui est décrémenté, pas le DISH_ID (77)
    const dishes = mock.rows('cooked_dishes')
    const dish77 = dishes.find(d => d.id === DISH_ID)
    const dish99 = dishes.find(d => d.id === 99)
    expect(dish77.portions_remaining).toBe(4) // inchangé
    expect(dish99.portions_remaining).toBe(1) // décrémenté
  })

  it('plat matérialisé périmé → 409, aucune déduction', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-21T12:00:00Z')) // après la DLC

    const tables = makeBase()
    tables.cooked_dishes[0].expiration_date = '2026-07-20'
    setup(tables)

    const res = await POST(request({ ...BASE }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toContain('périmé')
    expect(deductFromStock).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('P2 sans planned_consumptions table (erreur supabase) → fail-soft, cuisson continue', async () => {
    // Simule l'absence de la table (erreur select sur planned_consumptions)
    setup(makeBase())
    mock.queueError('planned_consumptions', 'select', 'relation does not exist')

    const res = await POST(request({ ...BASE }))
    // La route ne plante pas (resolveProductionDish est fail-soft)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
