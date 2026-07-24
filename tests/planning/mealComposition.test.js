import { describe, expect, it } from 'vitest'
import { analyzeMealCompleteness, buildMealPlate } from '@/lib/domain/planning/mealComposition'

const ingredient = (name, category, role, grams, per100g) => ({
  name,
  formNormalized: name.toLowerCase(),
  category,
  role,
  grams,
  per100g,
})

const meatballs = {
  family: 'Boulettes de bœuf sauce tomate',
  category: 'boulettes',
  cuisineOrigin: 'France',
  servings: 6,
  nutritionPerServing: { kcal: 439, proteinG: 33, carbsG: 16, fatG: 26, fiberG: 4 },
  exactIngredients: [
    ingredient('Bœuf', 'viandes', 'protéine', 750, { proteinG: 20, carbsG: 0 }),
    ingredient('Chapelure', 'cereales_feculents', 'liaison', 60, { proteinG: 11, carbsG: 70 }),
    ingredient('Tomate', 'legumes', 'sauce', 900, { proteinG: 1, carbsG: 4 }),
    ingredient('Oignon', 'legumes', 'aromatique', 180, { proteinG: 1, carbsG: 8 }),
  ],
}

const lasagna = {
  family: 'Lasagnes à la bolognaise',
  category: 'pâtes au four',
  cuisineOrigin: 'Italie',
  servings: 8,
  nutritionPerServing: { kcal: 620, proteinG: 34, carbsG: 58, fatG: 26, fiberG: 7 },
  exactIngredients: [
    ingredient('Lasagnes', 'cereales_feculents', 'féculent', 350, { proteinG: 11, carbsG: 70 }),
    ingredient('Bœuf', 'viandes', 'protéine', 600, { proteinG: 20, carbsG: 0 }),
    ingredient('Tomate', 'legumes', 'sauce', 1000, { proteinG: 1, carbsG: 4 }),
    ingredient('Carotte', 'legumes', 'soffritto', 150, { proteinG: 1, carbsG: 8 }),
    ingredient('Céleri', 'legumes', 'soffritto', 120, { proteinG: 1, carbsG: 4 }),
  ],
}

describe('meal plate composition', () => {
  it('adds only a starch to meatballs whose tomato sauce already covers vegetables', () => {
    expect(analyzeMealCompleteness(meatballs)).toMatchObject({ hasStarch: false, hasVegetables: true })
    const plate = buildMealPlate(meatballs)
    expect(plate.components).toHaveLength(1)
    expect(plate.components[0]).toMatchObject({ key: 'pasta', role: 'starch', quantityGrams: 70 })
    expect(plate.completeAfter).toBe(true)
  })

  it('does not add anything to an already complete lasagna', () => {
    expect(analyzeMealCompleteness(lasagna).complete).toBe(true)
    expect(buildMealPlate(lasagna).components).toEqual([])
  })

  it('falls back to rice when gluten and pasta are forbidden', () => {
    const plate = buildMealPlate(meatballs, { allergens: ['gluten'], forbiddenForms: ['pâtes'] })
    expect(plate.components[0]).toMatchObject({ key: 'rice', role: 'starch' })
  })
})
