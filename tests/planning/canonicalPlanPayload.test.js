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
    expect(payload.shopping_items[0]).toMatchObject({ purchase_qty: 50, required_qty: 200, stock_qty: 150 })
    expect(payload.tasks[0].instructions).toEqual(recipe.exactSteps)
    expect(payload.legacy_meals).toHaveLength(2)
    expect(payload.slots[0].nutrition_by_member).toHaveProperty('Alex')
  })

  it('computes the next Monday in UTC deterministically', () => {
    expect(nextMondayIso(new Date('2026-07-15T12:00:00Z'))).toBe('2026-07-20')
    expect(nextMondayIso(new Date('2026-07-19T12:00:00Z'))).toBe('2026-07-20')
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
