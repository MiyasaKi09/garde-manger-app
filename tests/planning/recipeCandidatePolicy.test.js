import { describe, expect, it } from 'vitest'
import { nutritionCandidatePenalty, selectPlanningRecipePool } from '@/lib/domain/planning/recipeCandidatePolicy'

const recipe = (code, nutrition, category = 'plat complet') => ({
  code,
  category,
  nutritionPerServing: nutrition,
})

const targetByMeal = {
  dejeuner: { kcal: 700, proteinG: 55, carbsG: 60, fatG: 24, fiberG: 12 },
  diner: { kcal: 700, proteinG: 55, carbsG: 60, fatG: 24, fiberG: 12 },
}

describe('recipeCandidatePolicy', () => {
  it('pénalise fortement un plat très gras et pauvre en protéines', () => {
    const poor = recipe('POOR', { kcal: 900, proteinG: 18, carbsG: 42, fatG: 78, fiberG: 4 })
    const balanced = recipe('OK', { kcal: 680, proteinG: 52, carbsG: 62, fatG: 22, fiberG: 12 })
    expect(nutritionCandidatePenalty(poor, targetByMeal.dejeuner))
      .toBeGreaterThan(nutritionCandidatePenalty(balanced, targetByMeal.dejeuner) + 100)
  })

  it('retire les recettes de la semaine précédente sans toucher aux repas protégés', () => {
    const recipes = [
      recipe('OLD', { kcal: 680, proteinG: 52, carbsG: 62, fatG: 22, fiberG: 12 }),
      recipe('FRESH', { kcal: 700, proteinG: 55, carbsG: 60, fatG: 24, fiberG: 12 }),
    ]
    expect(selectPlanningRecipePool({ recipes, targetByMeal, previousWeekRecipeCodes: ['OLD'] }).map((item) => item.code))
      .toEqual(['FRESH'])
    expect(selectPlanningRecipePool({ recipes, targetByMeal, previousWeekRecipeCodes: ['OLD'], fixedRecipeCodes: ['OLD'] }).map((item) => item.code))
      .toEqual(['OLD', 'FRESH'])
  })
})
