import { describe, expect, it } from 'vitest'
import { SUPPLEMENT_FORMS, buildPersonalizedMeals, optimizeDailyPortions } from '@/lib/domain/planning/personalizedMeals'

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
    const supportMeals = result.meals.filter((meal) => ['fixed_breakfast', 'fixed_snack'].includes(meal.variant_kind))
    const skyrItems = supportMeals.flatMap((meal) => meal.portion_details.items).filter((item) => item.food === 'skyr')
    expect(skyrItems).toHaveLength(4)
    expect(skyrItems.every((item) => item.quantity === 200)).toBe(true)
    expect(result.meals.filter((meal) => meal.variant_kind === 'fixed_snack')
      .every((meal) => meal.portion_details.items.every((item) => item.food !== 'skyr'))).toBe(true)
    expect(result.supplementalRequirements.find((item) => item.label === 'skyr nature')).toMatchObject({
      quantity: 800,
      packageSize: 200,
      packageCount: 4,
      packageLabel: 'pot',
    })
    expect(result.meals.filter((meal) => meal.variant_kind === 'fixed_breakfast')
      .every((meal) => !meal.description.includes('œufs de œufs'))).toBe(true)
    for (const day of result.daily) {
      expect(Math.abs(day.total.proteinG - day.target.proteinG) / day.target.proteinG, JSON.stringify(day)).toBeLessThanOrEqual(0.2)
      expect(Math.abs(day.total.carbsG - day.target.carbsG) / day.target.carbsG, JSON.stringify(day)).toBeLessThanOrEqual(0.2)
      expect(Math.abs(day.total.fatG - day.target.fatG) / day.target.fatG, JSON.stringify(day)).toBeLessThanOrEqual(0.2)
      expect(day.total.fiberG).toBeGreaterThanOrEqual(day.target.fiberG * 0.8)
    }
  })

  it('chooses different portions while holding each personal calorie target', () => {
    const breakfast = { nutrition: { kcal: 600, proteinG: 60, carbsG: 40, fatG: 20, fiberG: 5 } }
    const snack = { nutrition: { kcal: 350, proteinG: 30, carbsG: 30, fatG: 13, fiberG: 5 } }
    const julien = optimizeDailyPortions({ target: { kcal: 2357, proteinG: 216, carbsG: 196, fatG: 79, fiberG: 33 }, breakfast, snack, lunch: meat.nutritionPerServing, dinner: fish.nutritionPerServing })
    const zoe = optimizeDailyPortions({ target: { kcal: 1525, proteinG: 75, carbsG: 192, fatG: 51, fiberG: 21 }, breakfast: null, snack, lunch: veggie.nutritionPerServing, dinner: fish.nutritionPerServing })

    expect(Math.abs(julien.total.kcal - 2357) / 2357).toBeLessThanOrEqual(0.05)
    expect(Math.abs(zoe.total.kcal - 1525) / 1525).toBeLessThanOrEqual(0.05)
    expect(julien).toMatchObject({ breakfastScale: 1, snackScale: 1 })
    expect(zoe).toMatchObject({ breakfastScale: 0, snackScale: 1 })
    expect(julien.lunchScale * 4).toBe(Math.round(julien.lunchScale * 4))
    expect(julien.dinnerScale * 4).toBe(Math.round(julien.dinnerScale * 4))
    expect(julien.lunchScale).not.toBe(zoe.lunchScale)
  })

  it('never serves a preparation-requiring food in any snack of a 7-day plan', () => {
    const result = buildPersonalizedMeals({
      plan: plan(), recipes: [meat, fish, veggie],
      members: [{ id: 'j', name: 'Julien', portion_multiplier: 1, preferences: {} }, { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: {} }],
      goals: [
        { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
        { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
      ],
    })

    const snackItems = result.meals
      .filter((meal) => meal.variant_kind === 'fixed_snack')
      .flatMap((meal) => meal.portion_details.items)
    expect(snackItems.length).toBeGreaterThan(0)
    // Aucun aliment de collation ne demande une préparation sans tâche source.
    expect(snackItems.every((item) => item.food !== 'chicken')).toBe(true)
    expect(snackItems.every((item) => !/r[ôo]ti|cuit|grill/i.test(item.displayLabel || ''))).toBe(true)
    const julienSnacks = result.meals.filter((meal) => meal.person_name === 'Julien' && meal.variant_kind === 'fixed_snack')
    expect(julienSnacks.some((meal) => meal.portion_details.items.some((item) => item.food === 'tuna'))).toBe(true)

    // Le remplacement conserve la barrière énergétique ±5 % du foyer.
    expect(result.valid).toBe(true)

    expect(result.supplementalRequirements.every((item) => item.label !== 'blanc de poulet rôti')).toBe(true)
    expect(result.supplementalRequirements.every((item) => !/r[ôo]ti/i.test(item.label))).toBe(true)
  })

  it('keeps energy as the only hard gate while persisting per-dimension nutrition validity', () => {
    const result = buildPersonalizedMeals({
      plan: plan(), recipes: [meat, fish, veggie],
      members: [{ id: 'a', name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } }],
      goals: [{ person_name: 'Alex', target_calories: 2000, target_protein_g: 300, target_carbs_g: 230, target_fat_g: 70, target_fiber_g: 25 }],
    })

    expect(result.daily).toHaveLength(7)
    for (const day of result.daily) {
      // L'énergie tient (journée « valide ») mais le plancher protéique de
      // 90 % de la cible est manqué : la journée est signalée, pas bloquée.
      expect(day.valid).toBe(true)
      expect(day.protein_valid).toBe(false)
      expect(day.total.proteinG).toBeLessThan(0.9 * day.target.proteinG)
      const expectedDeviation = Math.round(((day.total.proteinG - day.target.proteinG) / day.target.proteinG) * 10000) / 10000
      expect(day.protein_deviation).toBe(expectedDeviation)
      expect(day.protein_deviation).toBeLessThan(0)
      expect(day.macro_deviations).toMatchObject({
        proteinG: expectedDeviation,
        carbsG: expect.any(Number),
        fatG: expect.any(Number),
        fiberG: expect.any(Number),
      })
    }
    expect(result.valid).toBe(true)
  })

  it('exposes purchasable supplement forms with their gram conversions', () => {
    const byLabel = new Map(SUPPLEMENT_FORMS.map((form) => [form.label, form]))
    expect(byLabel.get('skyr nature')).toMatchObject({ unit: 'g', gramsPerUnit: 1, formNormalized: 'skyr nature', packageSize: 200 })
    expect(byLabel.get('œufs durs')).toMatchObject({ unit: 'œuf', gramsPerUnit: 60, formNormalized: 'oeufs durs' })
    for (const fruit of ['pomme', 'kiwi', 'poire', 'banane', 'pêche', 'nectarine', 'orange']) {
      expect(byLabel.get(fruit)).toMatchObject({ unit: 'pièce', gramsPerUnit: 150 })
    }
    expect(byLabel.get('pêche').formNormalized).toBe('peche')
    expect(byLabel.has('blanc de poulet rôti')).toBe(false)
    expect(SUPPLEMENT_FORMS.every((form) => Number(form.gramsPerUnit) > 0)).toBe(true)
  })
})
