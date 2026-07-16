import { describe, expect, it } from 'vitest'
import { buildPersonalizedMeals, optimizeDailyPortions } from '@/lib/domain/planning/personalizedMeals'

const recipe = (code, family, nutrition, category = 'legumes') => ({
  code, family, eligible: true, servings: 2, prepMinutes: 20, cookMinutes: 25, cuisineOrigin: 'France',
  nutritionPerServing: nutrition,
  exactIngredients: [{ name: category === 'viandes' ? 'Bœuf' : 'Lentilles', formNormalized: category === 'viandes' ? 'boeuf' : 'lentilles', category, grams: 200 }],
  sensory: { profile: 'warm_aromatic', scores: { richness: 3 } },
})

const meat = recipe('MEAT', 'Bœuf mijoté', { kcal: 600, proteinG: 48, carbsG: 45, fatG: 24, fiberG: 7 }, 'viandes')
const fish = recipe('FISH', 'Saumon rôti', { kcal: 520, proteinG: 42, carbsG: 40, fatG: 20, fiberG: 6 }, 'poissons_fruits_de_mer')
const veggie = recipe('VEG', 'Lentilles aux légumes', { kcal: 510, proteinG: 30, carbsG: 68, fatG: 13, fiberG: 18 })

function plan() {
  const slots = []
  for (let day = 20; day <= 26; day++) {
    const date = `2026-07-${day}`
    slots.push({ key: `${date}-dejeuner`, date, mealType: 'dejeuner', recipeCode: day === 20 ? 'MEAT' : 'VEG' })
    slots.push({ key: `${date}-diner`, date, mealType: 'diner', recipeCode: 'FISH' })
  }
  return { slots }
}

describe('personalized deterministic meals', () => {
  it('plans 4 daily intakes for Julien and 3 for Zoé, including one vegetarian swap', () => {
    const result = buildPersonalizedMeals({
      plan: plan(), recipes: [meat, fish, veggie],
      members: [{ id: 'j', name: 'Julien', portion_multiplier: 1, preferences: {} }, { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: {} }],
      goals: [
        { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
        { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
      ],
    })

    expect(result.meals).toHaveLength(49)
    expect(result.meals.filter((meal) => meal.person_name === 'Julien' && meal.meal_type === 'pdj')).toHaveLength(7)
    expect(result.meals.filter((meal) => meal.meal_type === 'collation')).toHaveLength(14)
    expect(result.meals.filter((meal) => meal.person_name === 'Zoé' && meal.variant_kind === 'vegetarian_swap')).toHaveLength(1)
    expect(result.meals.find((meal) => meal.person_name === 'Zoé' && meal.meal_date === '2026-07-20' && meal.meal_type === 'dejeuner'))
      .toMatchObject({ canonical_recipe_code: 'VEG', short_label: 'Lentilles aux légumes' })
    expect(result.valid).toBe(true)
    expect(result.daily.every((day) => day.energy_deviation <= 0.05)).toBe(true)
    for (const day of result.daily) {
      expect(Math.abs(day.total.proteinG - day.target.proteinG) / day.target.proteinG, JSON.stringify(day)).toBeLessThanOrEqual(0.2)
      expect(Math.abs(day.total.carbsG - day.target.carbsG) / day.target.carbsG).toBeLessThanOrEqual(0.2)
      expect(Math.abs(day.total.fatG - day.target.fatG) / day.target.fatG).toBeLessThanOrEqual(0.2)
      expect(day.total.fiberG).toBeGreaterThanOrEqual(day.target.fiberG * 0.8)
    }
  })

  it('chooses different portions while holding each personal calorie target', () => {
    const breakfast = { nutrition: { kcal: 600, proteinG: 60, carbsG: 40, fatG: 20, fiberG: 5 } }
    const snack = { nutrition: { kcal: 350, proteinG: 30, carbsG: 30, fatG: 13, fiberG: 5 } }
    const julien = optimizeDailyPortions({ target: { kcal: 2357, proteinG: 216, carbsG: 196, fatG: 79, fiberG: 33 }, breakfast, snack, lunch: meat.nutritionPerServing, dinner: fish.nutritionPerServing })
    const zoe = optimizeDailyPortions({ target: { kcal: 1525, proteinG: 75, carbsG: 192, fatG: 51, fiberG: 21 }, breakfast: null, snack, lunch: veggie.nutritionPerServing, dinner: fish.nutritionPerServing })

    expect(julien.total.kcal).toBeCloseTo(2357, 0)
    expect(zoe.total.kcal).toBeCloseTo(1525, 0)
    expect(julien.lunchScale).not.toBe(zoe.lunchScale)
  })
})
