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
    expect(card.linked_ingredients[0]).toMatchObject({
      canonical_form_id: 'form-1',
      quantity_grams: 200,
      optional: false,
    })
  })

  it('keeps an editorial recipe readable without pretending its nutrition is complete', () => {
    const recipe = materializeOperationalRecipe({
      ...record,
      catalogStatus: 'editorial_candidate',
      operationalEligible: false,
      exactIngredients: [{ name: 'Produit éditorial', quantity: 2, unit: 'pièce', grams: null, per100g: null }],
    })

    expect(recipe.eligible).toBe(true)
    expect(recipe.operationalEligible).toBe(false)
    expect(recipe.exactIngredients[0].grams).toBeNull()
    expect(recipe.nutritionCoverage).toMatchObject({ pct: 0, ingredientCount: 1, resolvedCount: 0 })
  })

  it('scales the quantity requested from a linked sub-recipe', () => {
    const recipe = materializeOperationalRecipe({
      ...record,
      exactIngredients: [{
        ...record.exactIngredients[0],
        component: { code: 'FR-024', requiredQuantity: 240, requiredUnit: 'g', yieldQuantity: 870, yieldUnit: 'g' },
      }],
    }, { servings: 4 })

    expect(recipe.exactIngredients[0].component.requiredQuantity).toBe(480)
  })
})
