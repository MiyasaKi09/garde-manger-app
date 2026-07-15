import { describe, expect, it } from 'vitest'
import {
  materializeOperationalCatalog,
  materializeOperationalRecipe,
  operationalRecipeCards,
} from '@/lib/domain/recipes/operationalCatalog'

const record = {
  code: 'TEST-001',
  family: 'Plat test',
  cuisineOrigin: 'France',
  category: 'plat complet',
  servings: 2,
  prepMinutes: 10,
  cookMinutes: 20,
  confidence: 'B',
  catalogStatus: 'operational_candidate',
  exactIngredients: [{
    foodFormId: 'form-1',
    name: 'Lentilles cuites',
    formNormalized: 'lentilles cuites',
    quantity: 200,
    unit: 'g',
    grams: 200,
    optional: false,
    per100g: { kcal: 100, proteinG: 8, carbsG: 12, fatG: 1, fiberG: 5 },
  }],
  exactSteps: [{ n: 1, instruction: 'Réchauffer.' }],
}

describe('operational recipe catalog mapper', () => {
  it('recomputes deterministic nutrition from database quantities', () => {
    const recipe = materializeOperationalRecipe(record)
    expect(recipe.eligible).toBe(true)
    expect(recipe.nutritionCoverage.pct).toBe(100)
    expect(recipe.nutritionPerServing).toMatchObject({ kcal: 100, proteinG: 8, carbsG: 12, fatG: 1, fiberG: 5 })
  })

  it('scales ingredients without changing nutrition per serving', () => {
    const recipe = materializeOperationalRecipe(record, { servings: 4 })
    expect(recipe.exactIngredients[0]).toMatchObject({ quantity: 400, grams: 400 })
    expect(recipe.nutritionPerServing.kcal).toBe(100)
  })

  it('preserves database governance metadata and builds stable cards', () => {
    const catalog = materializeOperationalCatalog({
      contractVersion: 'v3-operational-1',
      metadata: { eligibleCount: 50, corpusVersion: 'v3-300-real-dishes' },
      recipes: [record],
    })
    const card = operationalRecipeCards(catalog.recipes)[0]
    expect(catalog.metadata).toMatchObject({ source: 'supabase', eligibleCount: 50, returnedCount: 1 })
    expect(card).toMatchObject({ source: 'canonical_v3', id: 'TEST-001', catalog_status: 'operational_candidate' })
    expect(card.linked_ingredients[0]).toMatchObject({ canonical_form_id: 'form-1', quantity_grams: 200 })
  })
})
