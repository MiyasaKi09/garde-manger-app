import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// P1 (audit §14 Lot P1 items 4 et 6) : quand un créneau de plan publié porte
// un cooked_dish_id, la consommation du plat doit :
//   • flipper la réservation active → consumed (POST) ;
//   • flipper la réservation consumed → active lors de l'annulation (DELETE).
// La résolution du créneau se fait via meal_plan_slots + meal_plan_versions
// (sans slot_id dans le body — rétrocompat assurée).

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/deductNeeds', () => ({
  deductFromStock: vi.fn(async () => ({ deductedCount: 0, usedLots: [], shortfalls: [], error: null })),
}))

import { DELETE, POST } from '@/app/api/meals/cook/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { deductFromStock } from '@/lib/deductNeeds'

const request = (body) => ({ json: async () => body })
const BASE = { meal_date: '2026-07-17', meal_type: 'dejeuner', entries: [{ person_name: 'Julien', kcal: 600 }] }

const SLOT_ID        = 'slot-pub-1'
const PLAN_VER_ID    = 'pv-pub-1'
const DISH_ID        = 42
const RESERVATION_ID = 'res-dish-1'

/** Tables de base pour les tests de réservation P1. */
function makeBase() {
  return {
    meal_log: [],
    cooked_dishes: [{
      id: DISH_ID, user_id: 'u1', name: 'Dahl de lentilles',
      portions_cooked: 4, portions_remaining: 2, expiration_date: null,
    }],
    meal_stock_deductions: [],
    meal_plan_slots: [{
      id: SLOT_ID, user_id: 'u1',
      meal_date: '2026-07-17', meal_type: 'dejeuner',
      plan_version_id: PLAN_VER_ID, cooked_dish_id: DISH_ID,
    }],
    meal_plan_versions: [{
      id: PLAN_VER_ID, user_id: 'u1', status: 'published',
    }],
    inventory_reservations: [{
      id: RESERVATION_ID, user_id: 'u1',
      slot_id: SLOT_ID, cooked_dish_id: DISH_ID,
      plan_version_id: PLAN_VER_ID,
      status: 'active', reserved_quantity: 2, consumed_at: null,
    }],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — flip active → consumed
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/meals/cook — flip réservation active→consumed (P1)', () => {
  let mock

  beforeEach(() => { deductFromStock.mockClear() })

  const setup = (tables) => {
    mock = createSupabaseMock(tables)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
  }

  it('flip active→consumed quand le slot publié a un cooked_dish_id (sans eaten_dish_id)', async () => {
    setup(makeBase())

    const response = await POST(request({ ...BASE }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.batchConsumed).toBe(1)

    // Plat décrémenté
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(1)

    // Réservation passée à consumed
    const res = mock.rows('inventory_reservations')
    expect(res).toHaveLength(1)
    expect(res[0].status).toBe('consumed')
    expect(res[0].consumed_at).not.toBeNull()
  })

  it('avec eaten_dish_id explicite : plat décrémenté et réservation flippée', async () => {
    setup(makeBase())

    const response = await POST(request({ ...BASE, eaten_dish_id: DISH_ID }))
    expect(response.status).toBe(200)
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(1)
    expect(mock.rows('inventory_reservations')[0].status).toBe('consumed')
  })

  it('seconde validation (alreadyLogged=true) : pas de décrément ni de flip supplémentaire', async () => {
    // Le créneau est déjà loggué → alreadyLogged = true
    const tables = makeBase()
    tables.meal_log = [{
      id: 'log-0', user_id: 'u1', meal_date: '2026-07-17', meal_type: 'dejeuner',
      person_name: 'Julien', cooked_dish_id: DISH_ID, portions_eaten: 1,
    }]
    // Réservation déjà consommée depuis la première validation
    tables.inventory_reservations[0].status = 'consumed'
    tables.inventory_reservations[0].consumed_at = '2026-07-17T10:00:00Z'
    tables.cooked_dishes[0].portions_remaining = 1 // déjà décrémenté
    setup(tables)

    const response = await POST(request({ ...BASE }))
    expect(response.status).toBe(200)

    // Aucun décrément supplémentaire
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(1)
    // Réservation inchangée (toujours consumed)
    expect(mock.rows('inventory_reservations')[0].status).toBe('consumed')
    expect(mock.rows('inventory_reservations')[0].consumed_at).toBe('2026-07-17T10:00:00Z')
  })

  it('pas de slot publié → plat décrémenté, aucune erreur, pas de flip', async () => {
    // Aucun slot publié pour ce créneau
    const tables = makeBase()
    tables.meal_plan_slots = []
    setup(tables)

    // On passe eaten_dish_id pour que la route trouve le plat malgré l'absence de slot
    const response = await POST(request({ ...BASE, eaten_dish_id: DISH_ID }))
    expect(response.status).toBe(200)

    // Le plat est bien décrémenté
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(1)

    // La réservation n'a PAS été flippée (pas de slot résolu)
    expect(mock.rows('inventory_reservations')[0].status).toBe('active')
  })

  it('plat du slot périmé → 409, réservation intouchée', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T12:00:00Z'))

    const tables = makeBase()
    tables.cooked_dishes[0].expiration_date = '2000-01-01'
    setup(tables)

    const response = await POST(request({ ...BASE }))
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toContain('périmé')

    // Réservation intouchée
    expect(mock.rows('inventory_reservations')[0].status).toBe('active')
    expect(deductFromStock).not.toHaveBeenCalled()

    vi.useRealTimers()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — flip consumed → active
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/meals/cook — flip réservation consumed→active (P1)', () => {
  let mock

  beforeEach(() => { deductFromStock.mockClear() })

  const setup = (tables) => {
    mock = createSupabaseMock(tables)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
  }

  it('flip consumed→active lors de l annulation du repas', async () => {
    const tables = makeBase()
    // État après une validation réussie
    tables.meal_log = [{
      id: 'log-1', user_id: 'u1', meal_date: '2026-07-17', meal_type: 'dejeuner',
      person_name: 'Julien', cooked_dish_id: DISH_ID, portions_eaten: 1,
    }]
    tables.cooked_dishes[0].portions_remaining = 1
    tables.inventory_reservations[0].status = 'consumed'
    tables.inventory_reservations[0].consumed_at = '2026-07-17T10:00:00Z'
    setup(tables)

    const response = await DELETE(request({ meal_date: '2026-07-17', meal_type: 'dejeuner' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.restoredPortions).toBeGreaterThan(0)

    // Réservation revenue à active, consumed_at vidé
    const res = mock.rows('inventory_reservations')
    expect(res[0].status).toBe('active')
    expect(res[0].consumed_at).toBeNull()

    // Portions restituées au plat
    expect(mock.rows('cooked_dishes')[0].portions_remaining).toBe(2)
  })

  it('réservation non-consumed (active) inchangée lors de l annulation', async () => {
    // Scénario : validation antérieure à P1, réservation jamais flippée
    const tables = makeBase()
    tables.meal_log = [{
      id: 'log-1', user_id: 'u1', meal_date: '2026-07-17', meal_type: 'dejeuner',
      person_name: 'Julien', cooked_dish_id: DISH_ID, portions_eaten: 1,
    }]
    tables.cooked_dishes[0].portions_remaining = 1
    // La réservation est toujours active (pré-P1, pas de flip lors du POST)
    // → le DELETE ne doit pas la modifier (la requête UPDATE WHERE status='consumed'
    //   ne correspondra à aucune ligne)
    setup(tables)

    const response = await DELETE(request({ meal_date: '2026-07-17', meal_type: 'dejeuner' }))
    expect(response.status).toBe(200)

    // La réservation reste active (le DELETE n'a pas changé une réservation non-consumed)
    expect(mock.rows('inventory_reservations')[0].status).toBe('active')
  })

  it('annulation sans slot publié → restauration des portions, aucune erreur', async () => {
    const tables = makeBase()
    tables.meal_plan_slots = [] // pas de slot
    tables.meal_log = [{
      id: 'log-1', user_id: 'u1', meal_date: '2026-07-17', meal_type: 'dejeuner',
      person_name: 'Julien', cooked_dish_id: DISH_ID, portions_eaten: 1,
    }]
    tables.cooked_dishes[0].portions_remaining = 1
    setup(tables)

    const response = await DELETE(request({ meal_date: '2026-07-17', meal_type: 'dejeuner' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    // Portions restaurées quand même (pas de slot ne bloque pas la restauration)
    expect(body.restoredPortions).toBeGreaterThan(0)
  })
})
