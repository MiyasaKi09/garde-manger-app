import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// Incident prod du 24/07 (2e volet) — régénérer la semaine COURANTE d'un plan
// publié avant la colonne canonical_recipe_code : les repas préservés (créneaux
// protégés, jours passés) ont canonical_recipe_code = NULL alors que leur
// créneau porte preparation.recipe_code. Sans réhydratation, le modèle à
// demandes finales requalifiait ces repas principaux en « support », dupliquait
// leurs slot_keys (payload à 40 créneaux > 31) et la publication échouait en
// `invalid_plan_payload` — sans aucune exécution de recette pour les jours
// préservés.

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

const CATALOG = [
  makeRecipe('FR-HAC', 'Hachis parmentier', 'carotte crue'),
  makeRecipe('FR-SAL', 'Salade de courgettes', 'courgette cuite'),
]

const DATES = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26']

// Plan actif « legacy » : 14 créneaux avec preparation.recipe_code, 14 repas
// SANS canonical_recipe_code (colonne postérieure à la publication du plan).
const legacySlots = DATES.flatMap((date, dayIndex) => ['dejeuner', 'diner'].map((mealType, mealIndex) => ({
  id: `slot-${dayIndex}-${mealIndex}`,
  user_id: 'u1',
  plan_version_id: 'v-old',
  slot_key: `${date}-${mealType}`,
  meal_date: date,
  meal_type: mealType,
  title: 'Plat legacy',
  preparation: { recipe_code: dayIndex % 2 ? 'FR-SAL' : 'FR-HAC' },
  status: 'planned',
  locked: false,
  source: 'canonical_v3',
})))

const legacyMeals = legacySlots.map((slot) => ({
  import_id: 42,
  person_name: 'Membre',
  household_member_id: 'm1',
  meal_date: slot.meal_date,
  meal_type: slot.meal_type,
  day_type: 'standard',
  short_label: 'Plat legacy',
  description: 'Plat legacy · 1 portion',
  kcal: 500, protein_g: 30, carbs_g: 55, fat_g: 18, fiber_g: 8,
  micronutrients: {},
  meal_plan_slot_id: slot.id,
  planned_servings: 1,
  locked: false,
  canonical_recipe_code: null,
  variant_kind: null,
  portion_details: {},
  target_snapshot: {},
  constraints_snapshot: {},
  planning_status: 'planned',
  demand_key: null,
  execution_key: null,
}))

describe('POST /api/planning/generate-v3 — repas préservés sans canonical_recipe_code', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Jeudi en milieu de semaine : les jours passés (20→23) sont protégés et
    // leurs repas préservés — le cœur de l'incident.
    vi.setSystemTime(new Date('2026-07-24T09:40:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('réhydrate les codes recette et publie sans dupliquer les slot_keys', async () => {
    const mock = createSupabaseMock({
      nutrition_plan_imports: [{
        id: 42, user_id: 'u1', date_range_start: '2026-07-20', date_range_end: '2026-07-26',
        active_plan_version_id: 'v-old',
      }],
      meal_plan_slots: legacySlots,
      nutrition_plan_meals: legacyMeals,
      nutrition_plan_prep_tasks: [],
      household_members: [{
        id: 'm1', user_id: 'u1', name: 'Membre', portion_multiplier: 1, active: true,
        preferences: { planning: { breakfast: false, snack: false } }, created_at: '2026-01-01',
      }],
      user_health_goals: [{
        user_id: 'u1', person_name: 'Membre', target_calories: 2000,
        target_protein_g: 120, target_carbs_g: 220, target_fat_g: 72, target_fiber_g: 32,
      }],
      inventory_lots: [],
      inventory_reservations: [],
      cooked_dishes: [],
    })
    let payload = null
    mock.rpc = vi.fn(async (name, args) => {
      if (name === 'planning_schema_compatibility') {
        return { data: { compatible: true, contract_version: 5 }, error: null }
      }
      if (name === 'publish_canonical_final_demand_plan') payload = args?.p_payload || null
      return { data: { import_id: 42, plan_version_id: 'v-new', status: 'published' }, error: null }
    })

    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    listOperationalRecipes.mockResolvedValue({ recipes: CATALOG, metadata: { corpusVersion: 'test-corpus' } })
    const response = await POST(request({ import_id: 42, scope: 'week' }))
    expect(response.status).toBe(200)
    expect(payload).toBeTruthy()

    // Garde-fou du wrapper : jamais plus de 31 créneaux, aucun slot_key dupliqué.
    expect(payload.slots.length).toBeLessThanOrEqual(31)
    const keys = payload.slots.map((slot) => slot.slot_key)
    expect(new Set(keys).size).toBe(keys.length)

    // Aucun repas principal requalifié en « support » : les créneaux support ne
    // peuvent être que pdj/collation (aucun ici, supports désactivés).
    expect(payload.slots.some((slot) => slot.source === 'support' && !['pdj', 'collation'].includes(slot.meal_type))).toBe(false)

    // Chaque repas préservé retrouve la recette de son créneau : les jours
    // protégés ont une exécution réelle (au moins une par recette legacy).
    const executionKeys = (payload.recipe_executions || []).map((execution) => execution.execution_key)
    expect(executionKeys.length).toBeGreaterThanOrEqual(2)
    const preservedMeals = payload.legacy_meals.filter((meal) => meal.meal_date <= '2026-07-23')
    expect(preservedMeals.length).toBeGreaterThan(0)
    for (const meal of preservedMeals) {
      expect(['FR-HAC', 'FR-SAL']).toContain(meal.canonical_recipe_code)
    }
  }, 60000)
})
