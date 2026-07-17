import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// Lot P1 (audit §14, items 1 et 6) — generate-v3 charge les plats cuisinés :
// portions restantes > 0, non expirés (UTC, DLC absente = valide), MOINS les
// réservations de portions actives des AUTRES versions de plan. Les
// réservations de la version remplacée (active_plan_version_id de l'import)
// ne comptent pas — la régénération les libère, exactement comme les lots.

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/aiContextBuilder', () => ({
  fetchDietaryConstraints: vi.fn(async () => ({ allergies: [], bans: [], dislikes: [], diets: [] })),
}))
vi.mock('@/lib/db/operationalRecipeCatalog', () => ({ listOperationalRecipes: vi.fn() }))

import { POST } from '@/app/api/planning/generate-v3/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { listOperationalRecipes } from '@/lib/db/operationalRecipeCatalog'

const request = (body) => ({ json: async () => body })

const makeRecipe = (code, family, form) => ({
  code,
  family,
  category: 'plat principal',
  eligible: true,
  servings: 2,
  prepMinutes: 15,
  cookMinutes: 20,
  cuisineOrigin: 'France',
  allergens: [],
  identityLevel: 'named_traditional_dish',
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', scores: { richness: 2, acidic: 1, freshness: 1 }, target_textures: ['fondant'] },
  exactIngredients: [{ name: form, formNormalized: form, quantity: 100, unit: 'g', grams: 100, optional: false, category: 'legumes' }],
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 },
  nutritionCoverage: { pct: 100 },
})

// Deux recettes végétales : aucune règle hebdomadaire bloquante, la semaine
// entière reste faisable avec un petit catalogue de test.
const CATALOG = [
  makeRecipe('FR-HAC', 'Hachis parmentier', 'carotte crue'),
  makeRecipe('FR-SAL', 'Salade de courgettes', 'courgette cuite'),
]

// Reste de 6 portions, DLC au mercredi de la semaine planifiée (2026-07-22) :
// seuls les créneaux jusqu'au mercredi peuvent le consommer.
const dishRow = {
  id: 501, user_id: 'u1', name: 'Hachis parmentier',
  portions_cooked: 6, portions_remaining: 6,
  storage_method: 'fridge', expiration_date: '2026-07-22',
  kcal_per_portion: 480, protein_g_per_portion: 33,
  carbs_g_per_portion: 50, fat_g_per_portion: 15, fiber_g_per_portion: 6,
}

function seedMock({ dishReservations = [] } = {}) {
  const mock = createSupabaseMock({
    nutrition_plan_imports: [{
      id: 42, user_id: 'u1', date_range_start: '2026-07-20', date_range_end: '2026-07-26',
      active_plan_version_id: 'v-old',
    }],
    meal_plan_slots: [],
    nutrition_plan_meals: [],
    household_members: [{
      id: 'm1', user_id: 'u1', name: 'Membre', portion_multiplier: 1, active: true,
      preferences: { planning: { breakfast: false, snack: false } }, created_at: '2026-01-01',
    }],
    user_health_goals: [{
      user_id: 'u1', person_name: 'Membre', target_calories: 2000,
      target_protein_g: 120, target_carbs_g: 220, target_fat_g: 72, target_fiber_g: 32,
    }],
    inventory_lots: [],
    inventory_reservations: dishReservations,
    cooked_dishes: [dishRow],
  })
  mock.rpc = vi.fn(async () => ({ data: { import_id: 42, plan_version_id: 'v-new', status: 'published' }, error: null }))
  return mock
}

async function generate(mock) {
  authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
  listOperationalRecipes.mockResolvedValue({ recipes: CATALOG, metadata: { corpusVersion: 'test-corpus' } })
  const response = await POST(request({ import_id: 42 }))
  const body = await response.json()
  return { response, body, payload: mock.rpc.mock.calls[0]?.[1]?.p_payload }
}

describe('POST /api/planning/generate-v3 — plats cuisinés dans la boucle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('nourrit trois créneaux avec le reste de six portions et publie les réservations de portions', async () => {
    const { response, payload } = await generate(seedMock())
    expect(response.status).toBe(200)
    expect(payload).toBeTruthy()

    const dishSlots = payload.slots.filter((slot) => slot.cooked_dish_id === 501)
    expect(dishSlots).toHaveLength(3)
    for (const slot of dishSlots) {
      expect(slot.source).toBe('cooked_dish')
      expect(slot.meal_date <= '2026-07-22').toBe(true)
      expect(slot.stock_summary.coverage).toBe(1)
      expect(slot.stock_summary.allocations).toEqual([])
      // Nutrition mémorisée sur le plat (2 portions × 480 kcal).
      expect(slot.nutrition_source).toBe('cooked_dish_stored')
      expect(slot.nutrition_total.kcal).toBe(960)
    }

    const dishReservations = payload.reservations.filter((row) => row.cooked_dish_id != null)
    expect(dishReservations).toHaveLength(3)
    for (const row of dishReservations) {
      expect(row).toMatchObject({
        cooked_dish_id: 501,
        ingredient_name: 'Hachis parmentier',
        reserved_quantity: 2,
        reserved_unit: 'portion',
      })
      expect(row.lot_id).toBeUndefined()
    }

    // Tâches de réchauffage, jamais « Préparer » pour ces créneaux.
    const dishSlotKeys = new Set(dishSlots.map((slot) => slot.slot_key))
    const dishTasks = payload.tasks.filter((task) => dishSlotKeys.has(task.slot_key))
    expect(dishTasks).toHaveLength(3)
    for (const task of dishTasks) {
      expect(task.task_type).toBe('reheat_dish')
      expect(task.title).toContain('Réchauffer')
    }

    expect(payload.input_snapshot.cooked_dishes).toEqual([
      { id: 501, name: 'Hachis parmentier', portions_remaining: 6, expires_on: '2026-07-22' },
    ])
  })

  it('libère les réservations de la version remplacée (excludedPlanVersionId) lors de la régénération', async () => {
    // L'ancienne version active (v-old) réservait déjà tout le plat : la
    // régénération de ce même import doit l'ignorer et réutiliser le plat.
    const { response, payload } = await generate(seedMock({
      dishReservations: [{
        id: 'r1', user_id: 'u1', plan_version_id: 'v-old', cooked_dish_id: 501,
        lot_id: null, reserved_quantity: 6, reserved_unit: 'portion', status: 'active',
      }],
    }))
    expect(response.status).toBe(200)
    expect(payload.slots.filter((slot) => slot.cooked_dish_id === 501)).toHaveLength(3)
  })

  it('respecte les réservations actives des autres versions : plat entièrement réservé ailleurs → aucun créneau nourri', async () => {
    const { response, payload } = await generate(seedMock({
      dishReservations: [{
        id: 'r2', user_id: 'u1', plan_version_id: 'v-other', cooked_dish_id: 501,
        lot_id: null, reserved_quantity: 6, reserved_unit: 'portion', status: 'active',
      }],
    }))
    expect(response.status).toBe(200)
    // Le plat reste un intrant (snapshoté), mais ne nourrit RIEN : aucun
    // créneau lié, aucune réservation de portions, aucune consommation de
    // plat. Depuis le lot P2, des tâches de réchauffage peuvent exister pour
    // les productions PLANIFIÉES — elles ne référencent jamais ce plat.
    expect(payload.slots.every((slot) => slot.cooked_dish_id === undefined)).toBe(true)
    expect(payload.reservations.every((row) => row.cooked_dish_id === undefined)).toBe(true)
    expect((payload.consumptions || []).every((row) => row.source.cooked_dish_id === undefined)).toBe(true)
    const reheatTasks = payload.tasks.filter((task) => task.task_type === 'reheat_dish')
    const productionConsumerKeys = new Set(payload.slots.filter((slot) => slot.source === 'planned_production').map((slot) => slot.slot_key))
    expect(reheatTasks.every((task) => productionConsumerKeys.has(task.slot_key))).toBe(true)
  })

  it('P2 : le payload étendu passe tel quel au RPC — productions, consommations et dépendances de la même version', async () => {
    const { response, payload } = await generate(seedMock())
    expect(response.status).toBe(200)
    // Le catalogue de test (prep 15 min > réchauffage 10 min) déclenche la
    // mutualisation sur les créneaux que le reste ne couvre pas : le payload
    // porte les trois volets du contrat P2 dans la même publication (test E).
    expect(payload.productions.length).toBeGreaterThan(0)
    expect(payload.productions.length).toBeLessThanOrEqual(2)
    const taskKeys = new Set(payload.tasks.map((task) => task.task_key))
    for (const production of payload.productions) {
      expect(taskKeys.has(production.task_key)).toBe(true)
      expect(production.storage_method).toBe('refrigerator')
      expect(production.use_by >= production.available_from).toBe(true)
    }
    // Test L : chaque dépendance relie deux tâches présentes dans la même version.
    expect(payload.dependencies.length).toBeGreaterThan(0)
    for (const dependency of payload.dependencies) {
      expect(taskKeys.has(dependency.task_key)).toBe(true)
      expect(taskKeys.has(dependency.depends_on_task_key)).toBe(true)
    }
    // Chaque consommation référence exactement UNE source (audit §8).
    for (const row of payload.consumptions) {
      expect(Object.keys(row.source)).toHaveLength(1)
    }
    // Les consommations d'une production totalisent ses planned_portions
    // (producteur + consommateurs, dimensionnés depuis les planned_servings).
    for (const production of payload.productions) {
      const total = payload.consumptions
        .filter((row) => row.source.production_key === production.production_key)
        .reduce((sum, row) => sum + row.portions, 0)
      expect(total).toBeCloseTo(production.planned_portions, 6)
    }
  })

  it('exclut un plat expiré (UTC) même s’il garde des portions restantes', async () => {
    const mock = seedMock()
    // Aujourd'hui simulé : 2026-07-25 → DLC 2026-07-22 dépassée.
    vi.setSystemTime(new Date('2026-07-25T10:00:00Z'))
    const { response, payload } = await generate(mock)
    expect(response.status).toBe(200)
    expect(JSON.stringify(payload)).not.toContain('cooked_dish')
  })
})
