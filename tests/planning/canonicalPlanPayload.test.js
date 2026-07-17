import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload, buildWeekSlots, nextMondayIso, normalizePlanIssues } from '@/lib/domain/planning/canonicalPlanPayload'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

const recipe = {
  code: 'FR-TEST', family: 'Plat test', servings: 2, prepMinutes: 20,
  identityLevel: 'named_traditional_dish', techniques: ['saisie'],
  sensory: { profile: 'fresh_acidic', identity_guardrails: ['acidite_preservee'] },
  exactIngredients: [{
    name: 'Carotte crue', formNormalized: 'carotte crue', quantity: 200,
    unit: 'g', grams: 200, optional: false, category: 'legumes',
  }],
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionPerServing: { kcal: 300, proteinG: 12, carbsG: 40, fatG: 10, fiberG: 8 },
  nutritionCoverage: { pct: 100 },
}

describe('canonical plan publication payload', () => {
  it('builds fourteen ordered lunch and dinner slots', () => {
    const slots = buildWeekSlots('2026-07-20')
    expect(slots).toHaveLength(14)
    expect(slots[0]).toMatchObject({ key: '2026-07-20-dejeuner', mealType: 'dejeuner' })
    expect(slots.at(-1)).toMatchObject({ key: '2026-07-26-diner', mealType: 'diner' })
  })

  it('freezes execution, stock reservation, task, shopping and compatibility meals together', () => {
    const plan = {
      status: 'published', issues: [],
      objectiveScores: { stockCoverage: 0.75, sensoryRuleViolations: 0 },
      slots: [{
        key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner',
        recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [],
      }, {
        key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner',
        recipeCode: 'FR-TEST', allocations: [{ lotId: 'lot-1', formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 150 }],
        shortages: [{ formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 50 }],
        stockCoverage: 0.75, explanations: [],
      }],
      reservations: [{ slotKey: '2026-07-20-diner', lotId: 'lot-1', formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 150 }],
      shoppingItems: [{ formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 50, neededBy: '2026-07-20' }],
    }
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Alex', portion_multiplier: 1 }, { name: 'Sam', portion_multiplier: 1 }],
      constraints: {}, inventoryLots: [{ id: 'lot-1', formNormalized: 'carotte crue', gramsAvailable: 150 }],
    })
    expect(payload.recipe_executions).toHaveLength(1)
    expect(payload.recipe_executions[0].content_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(payload.reservations[0]).toMatchObject({ reserved_quantity: 150, reserved_unit: 'g' })
    expect(payload.shopping_items[0]).toMatchObject({ purchase_qty: 50, required_qty: 400, stock_qty: 150 })
    expect(payload.tasks[0].instructions).toEqual(recipe.exactSteps)
    expect(payload.legacy_meals).toHaveLength(6)
    expect(payload.slots[0].nutrition_by_member).toHaveProperty('Alex')
  })

  it('computes the next Monday in UTC deterministically', () => {
    expect(nextMondayIso(new Date('2026-07-15T12:00:00Z'))).toBe('2026-07-20')
    expect(nextMondayIso(new Date('2026-07-19T12:00:00Z'))).toBe('2026-07-20')
  })

  it('publishes skyr as physical 200 g pots instead of an arbitrary gram total', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Julien', portion_multiplier: 1 }], constraints: {}, inventoryLots: [],
    })
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    expect(skyr).toMatchObject({
      display_quantity: '1 pot de 200 g',
      required_qty: 200,
      purchase_qty: 200,
      purchase_unit: 'g',
      container_qty: 1,
      container_size: 200,
      container_unit: 'g',
    })
  })

  it('publishes every validation issue with a readable message and its context', () => {
    expect(normalizePlanIssues([
      { severity: 'warning', code: 'vegetarian_min', missing: 2 },
      { severity: 'warning', code: 'protein_repeat_poulet', missing: 1 },
    ])).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'vegetarian_min',
        message: expect.stringContaining('repas végétariens'),
        details: { missing: 2 },
      }),
      expect.objectContaining({
        code: 'protein_repeat_poulet',
        message: expect.stringContaining('source de protéines'),
        details: { missing: 1 },
      }),
    ])
  })

  it('publishes a kcal-valid day that misses the protein floor with a warning, never a throw', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } }],
      goals: [{ person_name: 'Alex', target_calories: 2000, target_protein_g: 300, target_carbs_g: 230, target_fat_g: 70, target_fiber_g: 25 }],
      constraints: {}, inventoryLots: [],
    })

    const day = payload.validation_summary.daily_nutrition[0]
    expect(day.valid).toBe(true)
    expect(day.protein_valid).toBe(false)

    const proteinIssue = payload.issues.find((issue) => issue.code === 'daily_protein_floor')
    expect(proteinIssue).toMatchObject({
      severity: 'warning',
      message: expect.stringContaining('protéines'),
      details: expect.objectContaining({ person_name: 'Alex', meal_date: '2026-07-20' }),
    })
    expect(proteinIssue.details.protein_deviation).toBeLessThan(0)

    expect(payload.validation_summary).toMatchObject({
      days_total: 1,
      energy_valid_days: 1,
      protein_valid_days: 0,
      daily_energy_targets_valid: true,
    })
    expect(payload.validation_summary.nutrition_dimensions).toMatchObject({
      energy: { valid_days: 1, days_total: 1 },
      protein: { valid_days: 0, days_total: 1 },
    })
    expect(payload.validation_summary.nutrition_dimensions.carbs.days_total).toBe(1)
    expect(payload.validation_summary.nutrition_dimensions.fat.days_total).toBe(1)
    expect(payload.validation_summary.nutrition_dimensions.fiber.days_total).toBe(1)
    // Plus jamais d'indicateur agrégé « 100 % » codé en dur.
    expect(payload.validation_summary.nutrition_coverage_pct).toBeUndefined()
  })

  it('still refuses to publish when the daily energy target is out of tolerance', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    expect(() => buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } }],
      goals: [{ person_name: 'Alex', target_calories: 500 }],
      constraints: {}, inventoryLots: [],
    })).toThrow(/Cibles énergétiques hors tolérance/)
  })

  it('allocates existing supplement lots FEFO and only ships the residual to shopping', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    const build = () => buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Julien', portion_multiplier: 1 }], constraints: {},
      inventoryLots: [
        { id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 100, expiresOn: '2026-07-22', opened: true },
        { id: 'lot-oeufs', formNormalized: 'oeufs durs', gramsAvailable: 60, expiresOn: '2026-07-24', opened: false },
        { id: 'lot-pomme', formNormalized: 'pomme', gramsAvailable: 300, expiresOn: '2026-07-23', opened: false },
      ],
    })
    const payload = build()

    // Le nom produit reste octet pour octet identique : generate-v3 rattache
    // les conditionnements par product_name et échoue sinon.
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    expect(skyr).toMatchObject({
      required_qty: 200,
      stock_qty: 100,
      reserved_qty: 100,
      purchase_qty: 100,
      purchase_unit: 'g',
      display_quantity: '1 pot de 200 g',
      container_qty: 1,
      container_size: 200,
      container_unit: 'g',
    })

    const eggs = payload.shopping_items.find((item) => item.product_name === 'Œufs durs')
    expect(eggs).toMatchObject({ required_qty: 2, stock_qty: 1, reserved_qty: 1, purchase_qty: 1, purchase_unit: 'u' })

    // Le fruit entièrement couvert par le stock ne part plus aux courses.
    expect(payload.shopping_items.find((item) => item.product_name === 'Pomme')).toBeUndefined()

    // Sans lot correspondant, l'article garde le comportement historique.
    const tuna = payload.shopping_items.find((item) => item.product_name === 'Thon au naturel égoutté')
    expect(tuna).toMatchObject({ stock_qty: 0, reserved_qty: 0, purchase_qty: 100 })

    // Jamais de stock promis au-delà de la disponibilité des lots.
    for (const item of payload.shopping_items) {
      expect(item.stock_qty).toBeGreaterThanOrEqual(0)
      expect(item.stock_qty + item.purchase_qty).toBeGreaterThanOrEqual(item.required_qty)
    }

    // Deux exécutions identiques produisent exactement le même payload.
    expect(JSON.parse(JSON.stringify(build()))).toEqual(JSON.parse(JSON.stringify(payload)))
  })

  it('subtracts recipe reservations and other active plans before allocating supplements', () => {
    const planWithReservation = {
      status: 'published', issues: [], objectiveScores: {}, shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
      reservations: [{ slotKey: '2026-07-20-diner', lotId: 'lot-skyr', formNormalized: 'skyr nature', ingredientName: 'Skyr nature', grams: 120, status: 'active' }],
    }
    const payload = buildCanonicalPlanPayload({
      plan: planWithReservation, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Julien', portion_multiplier: 1 }], constraints: {},
      inventoryLots: [{ id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 200, expiresOn: '2026-07-22', opened: true }],
      existingReservations: [{ lotId: 'lot-skyr', grams: 50, status: 'active' }],
    })
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    // 200 g physiques - 120 g réservés par le plan - 50 g par une autre
    // version = 30 g réellement allouables au petit-déjeuner.
    expect(skyr).toMatchObject({ required_qty: 200, stock_qty: 30, reserved_qty: 30, purchase_qty: 170 })
  })

  it('can compose a full week from the publishable V3 corpus without invented stock', () => {
    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots('2026-07-20'),
      recipes: getCanonicalRecipes({ servings: 2 }),
      inventoryLots: [],
      constraints: {
        allowShopping: true,
        maxMinutesByMeal: { dejeuner: 120, diner: 240 },
        preferredActiveMinutes: 30,
      },
      beamWidth: 24,
    })
    expect(plan.status).toBe('published')
    expect(plan.slots).toHaveLength(14)
    expect(new Set(plan.slots.map((slot) => slot.recipeCode)).size).toBeGreaterThan(10)
    expect(plan.shoppingItems.every((item) => item.grams > 0)).toBe(true)
  })
})
