import { describe, expect, it } from 'vitest'
import { buildFinalDemandModel } from '@/lib/domain/planning/finalDemands'

const recipe = (code, grams = 175) => ({
  code,
  family: `Recette ${code}`,
  servings: 2,
  prepMinutes: 20,
  identityLevel: 'named_traditional_dish',
  techniques: ['mijoter'],
  allergens: [],
  exactIngredients: [{
    name: 'Pois chiches',
    formNormalized: 'pois chiches',
    quantity: grams,
    grams,
    unit: 'g',
    category: 'legumineuses',
    optional: false,
  }],
  exactSteps: [{ n: 1, instruction: 'Cuire.' }],
  nutritionPerServing: { kcal: 400, proteinG: 20, carbsG: 55, fatG: 10, fiberG: 12 },
})

function meal({ name, memberId, servings, code = 'BASE', slot = '2026-07-22-dejeuner' }) {
  return {
    slot_key: slot,
    household_member_id: memberId,
    person_name: name,
    meal_date: slot.slice(0, 10),
    meal_type: 'dejeuner',
    canonical_recipe_code: code,
    planned_servings: servings,
    kcal: 400 * servings,
    protein_g: 20 * servings,
    carbs_g: 55 * servings,
    fat_g: 10 * servings,
    fiber_g: 12 * servings,
    micronutrients: {},
    portion_details: {},
    target_snapshot: {},
    variant_kind: code === 'BASE' ? 'household_base' : 'constraint_substitution',
  }
}

describe('final planning demands', () => {
  it('dimensions a 6.25-serving execution from final personal portions', () => {
    const slot = { key: '2026-07-22-dejeuner', date: '2026-07-22', mealType: 'dejeuner', recipeCode: 'BASE' }
    const personalized = {
      meals: [
        meal({ name: 'A', memberId: 'a', servings: 2 }),
        meal({ name: 'B', memberId: 'b', servings: 1.5 }),
        meal({ name: 'C', memberId: 'c', servings: 1.5 }),
        meal({ name: 'D', memberId: 'd', servings: 1.25 }),
      ],
    }
    const model = buildFinalDemandModel({ plan: { slots: [slot] }, recipes: [recipe('BASE')], personalized })

    expect(model.recipeExecutions).toHaveLength(1)
    expect(model.recipeExecutions[0]).toMatchObject({ servings: 6.25 })
    expect(model.recipeExecutions[0].exact_ingredients_snapshot[0].grams).toBe(546.875)
    expect(model.shoppingItems[0]).toMatchObject({
      required_qty: 546.875,
      exact_required_qty: 546.875,
      purchase_qty: 1000,
      projected_surplus_qty: 453.125,
      incoming_qty: 453.125,
      display_quantity: '2 paquets de 500 g',
    })
    expect(model.mainSlotSummaries.get(slot.key).servings).toBe(6.25)
    expect(model.mainSlotSummaries.get(slot.key).nutritionTotal.kcal).toBe(2500)
  })

  it('uses an existing dish only for base demands and cooks a personal variant separately', () => {
    const slot = {
      key: '2026-07-22-dejeuner', date: '2026-07-22', mealType: 'dejeuner', recipeCode: 'BASE',
      cookedDishId: 42, cookedDishName: 'Reste BASE',
    }
    const personalized = {
      meals: [
        meal({ name: 'Base', memberId: 'base', servings: 1 }),
        meal({ name: 'Variante', memberId: 'variant', servings: 1.2, code: 'VEG' }),
      ],
    }
    const model = buildFinalDemandModel({
      plan: { slots: [slot] },
      recipes: [recipe('BASE'), recipe('VEG', 250)],
      personalized,
      cookedDishes: [{ id: 42, portionsRemaining: 1, expiresOn: '2026-07-23' }],
    })

    expect(model.reservations).toContainEqual(expect.objectContaining({ cooked_dish_id: 42, reserved_quantity: 1 }))
    const execution = model.recipeExecutions.find((item) => item.recipe_code === 'VEG')
    expect(execution).toMatchObject({ servings: 1.2, is_variant: true })
    expect(execution.exact_ingredients_snapshot[0].grams).toBe(150)
    expect(model.recipeExecutions.find((item) => item.recipe_code === 'BASE').selected_configuration.source_mode).toBe('existing_dish')
    expect(model.shoppingItems[0]).toMatchObject({ required_qty: 150, exact_required_qty: 150 })
  })

  it('never allocates a lot whose expiry precedes the serving date', () => {
    const slot = { key: '2026-07-22-dejeuner', date: '2026-07-22', mealType: 'dejeuner', recipeCode: 'BASE' }
    const personalized = { meals: [meal({ name: 'A', memberId: 'a', servings: 1 })] }
    const model = buildFinalDemandModel({
      plan: { slots: [slot] }, recipes: [recipe('BASE')], personalized,
      inventoryLots: [{ id: 'expired', formNormalized: 'pois chiches', gramsAvailable: 500, expiresOn: '2026-07-21' }],
    })

    expect(model.reservations.some((reservation) => reservation.lot_id === 'expired')).toBe(false)
    expect(model.shoppingItems[0]).toMatchObject({ required_qty: 87.5, stock_qty: 0, exact_required_qty: 87.5 })
  })

  it('uses a partial leftover and explicitly plans the fresh complement', () => {
    const slot = {
      key: '2026-07-22-dejeuner', date: '2026-07-22', mealType: 'dejeuner', recipeCode: 'BASE',
      cookedDishId: 42, cookedDishName: 'Reste BASE',
      dishNutritionPerPortion: { kcal: 420, proteinG: 22, carbsG: 52, fatG: 12, fiberG: 11 },
    }
    const personalized = {
      meals: [
        meal({ name: 'A', memberId: 'a', servings: 1 }),
        meal({ name: 'B', memberId: 'b', servings: 1 }),
      ],
    }
    const model = buildFinalDemandModel({
      plan: { slots: [slot] }, recipes: [recipe('BASE')], personalized,
      cookedDishes: [{
        id: 42, portionsRemaining: 1.5, expiresOn: '2026-07-23',
        nutritionPerPortion: slot.dishNutritionPerPortion,
      }],
    })

    expect(model.sourceBySlot.get(slot.key)).toEqual({
      type: 'mixed', id: 42, portions: 1.5, freshPortions: 0.5, consumed: false,
    })
    expect(model.reservations).toContainEqual(expect.objectContaining({
      cooked_dish_id: 42, reserved_quantity: 1.5,
      metadata: expect.objectContaining({ needed_on: '2026-07-22', expires_on: '2026-07-23' }),
    }))
    expect(model.recipeExecutions.map((execution) => ({
      mode: execution.selected_configuration.source_mode,
      servings: execution.servings,
    }))).toEqual([
      { mode: 'existing_dish', servings: 1.5 },
      { mode: 'fresh_recipe', servings: 0.5 },
    ])
    expect(model.shoppingItems[0]).toMatchObject({ required_qty: 43.75, exact_required_qty: 43.75 })
    expect(model.demands.reduce((sum, demand) => sum + demand.requested_servings, 0)).toBe(2)
    expect(model.mainSlotSummaries.get(slot.key).nutritionTotal.kcal).toBe(830)
    expect(model.issues).toContainEqual(expect.objectContaining({ code: 'cooked_dish_partial_with_fresh_complement' }))
  })

  it('keeps a fractional culinary need but buys a physical spice package', () => {
    const spiceRecipe = {
      ...recipe('SPICE'),
      exactIngredients: [{
        name: 'Laurier', formNormalized: 'laurier', quantity: 0.266, grams: 0.266,
        unit: 'g', category: 'herbes_aromates', optional: false,
      }],
    }
    const slot = { key: '2026-07-22-dejeuner', date: '2026-07-22', mealType: 'dejeuner', recipeCode: 'SPICE' }
    const model = buildFinalDemandModel({
      plan: { slots: [slot] }, recipes: [spiceRecipe],
      personalized: { meals: [meal({ name: 'A', memberId: 'a', servings: 1, code: 'SPICE' })] },
    })

    expect(model.recipeExecutions[0].exact_ingredients_snapshot[0].grams).toBe(0.133)
    expect(model.shoppingItems[0]).toMatchObject({
      required_qty: 0.133,
      exact_required_qty: 0.133,
      purchase_qty: 10,
      projected_surplus_qty: 9.867,
      incoming_qty: 9.867,
      display_quantity: '1 sachet de 10 g',
      purchase_decision: {
        package_source: 'usual_package_rule',
        forecast_stock_incoming: 9.867,
        stock_role: 'pantry_staple',
      },
    })
  })

  it('never buys fractional eggs or fruit', () => {
    const physicalRecipe = {
      ...recipe('PHYSICAL'),
      exactIngredients: [
        { name: 'Œufs', formNormalized: 'oeufs', quantity: 120, grams: 120, unit: 'g', category: 'oeufs', optional: false },
        { name: 'Pomme', formNormalized: 'pomme', quantity: 200, grams: 200, unit: 'g', category: 'fruits', optional: false },
      ],
    }
    const slot = { key: '2026-07-22-dejeuner', date: '2026-07-22', mealType: 'dejeuner', recipeCode: 'PHYSICAL' }
    const model = buildFinalDemandModel({
      plan: { slots: [slot] }, recipes: [physicalRecipe],
      personalized: { meals: [meal({ name: 'A', memberId: 'a', servings: 1, code: 'PHYSICAL' })] },
    })
    const eggs = model.shoppingItems.find((item) => item.product_name === 'Œufs')
    const apple = model.shoppingItems.find((item) => item.product_name === 'Pomme')
    expect(eggs).toMatchObject({ exact_required_qty: 60, purchase_qty: 360, container_qty: 1, display_quantity: 'boîte de 6 œufs' })
    expect(apple).toMatchObject({ exact_required_qty: 100, purchase_qty: 150, container_qty: 1, display_quantity: '1 pièce (~150 g)' })
  })
})
