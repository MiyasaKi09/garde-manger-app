import { describe, expect, it } from 'vitest'
import { materializeRecipe } from '@/lib/domain/recipes/materializeRecipe'

const recipe = {
  code: 'T-001', family: 'Plat test', servings: 2, prep_minutes: 10, cook_minutes: 20,
  ingredients: [{ form: 'Carotte crue', quantity: 200, unit: 'g', role: 'légume', optional: false }],
  steps: [{ n: 1, instruction: 'Cuire.' }], sensory: { profile: 'fresh_acidic', scores: { richness: 1 } },
}

describe('materializeRecipe', () => {
  it('produit une instance exacte et une nutrition calculée depuis la forme liée', () => {
    const result = materializeRecipe(recipe, [{
      canonical_name_normalized: 'carotte crue', confidence: 'B', conversion: {}, source: 'ciqual_2020',
      source_record_key: '20009', per100g: { kcal: 40, proteinG: 1, carbsG: 8, fatG: 0.2, fiberG: 3 },
    }])
    expect(result.eligible).toBe(true)
    expect(result.exactIngredients[0].grams).toBe(200)
    expect(result.nutritionPerServing).toMatchObject({ kcal: 40, proteinG: 1, carbsG: 8, fiberG: 3 })
  })

  it('bloque une conversion de pièce sans poids connu', () => {
    const withPiece = { ...recipe, ingredients: [{ ...recipe.ingredients[0], quantity: 2, unit: 'u' }] }
    const result = materializeRecipe(withPiece, [{
      canonical_name_normalized: 'carotte crue', confidence: 'B', conversion: {}, source: 'ciqual_2020',
      per100g: { kcal: 40, proteinG: 1, carbsG: 8, fatG: 0.2 },
    }])
    expect(result.eligible).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'missing_unit_weight' }))
  })

  it('refuse une forme nutritionnelle de confiance C', () => {
    const result = materializeRecipe(recipe, [{
      canonical_name_normalized: 'carotte crue', confidence: 'C', conversion: {},
      per100g: { kcal: 40, proteinG: 1, carbsG: 8, fatG: 0.2 },
    }])
    expect(result.eligible).toBe(false)
    expect(result.issues[0].code).toBe('food_form_low_confidence')
  })
})
