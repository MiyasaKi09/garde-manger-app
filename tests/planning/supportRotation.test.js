import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload, buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { supportRotationOffset } from '@/lib/domain/planning/personalizedMeals'

// Lot 7 du plan de refonte — « Petits-déjeuners et collations ».
//
// Constat initial : les prises de support étaient presque toujours construites
// autour des mêmes aliments — œufs durs cinq matins sur sept, pain complet à
// presque chaque prise, et le même assemblage plusieurs jours d'affilée.

const recipe = {
  code: 'FR-TEST',
  family: 'Plat test',
  category: 'plat principal',
  servings: 2,
  prepMinutes: 20,
  identityLevel: 'named_traditional_dish',
  techniques: ['saisie'],
  sensory: { profile: 'fresh_acidic', identity_guardrails: [] },
  exactIngredients: [{
    name: 'Carotte crue', formNormalized: 'carotte crue', quantity: 200,
    unit: 'g', grams: 200, optional: false, category: 'legumes',
  }],
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionPerServing: { kcal: 600, proteinG: 40, carbsG: 60, fatG: 20, fiberG: 10 },
  nutritionCoverage: { pct: 100 },
}

const julien = {
  name: 'Julien',
  portion_multiplier: 1,
  preferences: { planning: { breakfast: true, snack: true } },
}

function weekSupports(windowStart) {
  const plan = {
    status: 'published',
    issues: [],
    objectiveScores: {},
    reservations: [],
    shoppingItems: [],
    slots: buildWeekSlots(windowStart).map((slot) => ({
      ...slot, recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [],
    })),
  }
  const payload = buildCanonicalPlanPayload({
    plan,
    recipes: [recipe],
    windowStart,
    members: [julien],
    goals: [{ person_name: 'Julien', target_calories: 2600, target_protein_g: 170 }],
    constraints: {},
    inventoryLots: [],
  })
  const byType = (mealType) => payload.legacy_meals
    .filter((meal) => meal.meal_type === mealType)
    .sort((left, right) => left.meal_date.localeCompare(right.meal_date))
  return { payload, breakfasts: byType('pdj'), snacks: byType('collation') }
}

const foodsOf = (meal) => (meal.portion_details?.items || []).map((item) => item.food)

describe('lot 7 — rotation des petits-déjeuners', () => {
  const { breakfasts } = weekSupports('2026-07-20')

  it('sert sept assemblages différents sur sept jours', () => {
    expect(breakfasts).toHaveLength(7)
    expect(new Set(breakfasts.map((meal) => meal.short_label)).size).toBe(7)
  })

  it('ne répète jamais le même assemblage deux jours de suite', () => {
    const labels = breakfasts.map((meal) => meal.short_label)
    for (let index = 1; index < labels.length; index += 1) {
      expect(labels[index]).not.toBe(labels[index - 1])
    }
  })

  it('ne sert ni œufs durs ni pain complet tous les matins', () => {
    const withEggs = breakfasts.filter((meal) => foodsOf(meal).includes('eggs'))
    const withBread = breakfasts.filter((meal) => foodsOf(meal).includes('bread'))
    expect(withEggs.length).toBeLessThanOrEqual(3)
    expect(withBread.length).toBeLessThanOrEqual(3)
    expect(withEggs.length).toBeGreaterThan(0)
  })

  it('fait tourner les fruits au lieu de servir la même pomme chaque jour', () => {
    const fruits = breakfasts
      .flatMap((meal) => (meal.portion_details?.items || []).filter((item) => item.food === 'apple'))
      .map((item) => item.displayLabel || item.label)
      .filter(Boolean)
    expect(new Set(fruits).size).toBeGreaterThan(1)
  })

  it('décale la séquence d’une semaine à l’autre', () => {
    const semaineSuivante = weekSupports('2026-07-27').breakfasts.map((meal) => meal.short_label)
    expect(semaineSuivante).not.toEqual(breakfasts.map((meal) => meal.short_label))
  })
})

describe('lot 7 — rotation des collations', () => {
  const { breakfasts, snacks } = weekSupports('2026-07-20')

  it('ne redouble jamais l’assemblage du petit-déjeuner du jour', () => {
    expect(snacks).toHaveLength(7)
    for (const [index, snack] of snacks.entries()) {
      expect(snack.short_label).not.toBe(breakfasts[index].short_label)
    }
  })

  it('propose plusieurs assemblages sur la semaine', () => {
    expect(new Set(snacks.map((meal) => meal.short_label)).size).toBeGreaterThan(1)
  })
})

describe('supportRotationOffset', () => {
  it('est stable à l’intérieur d’une semaine et avance d’un cran à la suivante', () => {
    const lundi = supportRotationOffset('2026-07-20')
    expect(supportRotationOffset('2026-07-22')).toBe(lundi)
    expect(supportRotationOffset('2026-07-27')).toBe(lundi + 1)
  })

  it('est purement déterministe et tolère une date absente', () => {
    expect(supportRotationOffset('2026-07-20')).toBe(supportRotationOffset('2026-07-20'))
    expect(supportRotationOffset(null)).toBe(0)
  })
})
