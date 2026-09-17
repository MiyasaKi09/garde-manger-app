import { describe, expect, it } from 'vitest'
import {
  MAX_MEAT_MEALS_PER_WEEK, expectedMealCountForWindow, getMemberPlanningRules,
} from '@/lib/domain/planning/memberPlanningRules'

describe('member planning rules', () => {
  it('derives the meal grid from preferences and never from a first name', () => {
    const preferences = { planning: { breakfast: true, lunch: true, dinner: true, snack: false } }
    expect(getMemberPlanningRules({ name: 'Nora', preferences }))
      .toMatchObject(getMemberPlanningRules({ name: 'Julien', preferences }))
    expect(getMemberPlanningRules({ name: 'Julien', preferences: {} }).breakfast).toBe(false)
  })

  it('counts an arbitrary household configuration exactly', () => {
    const members = [
      { name: 'Nora', active: true, preferences: { planning: { breakfast: true, snack: true } } },
      { name: 'Eli', active: true, preferences: { planning: { breakfast: false, snack: true } } },
      { name: 'Ancien', active: false, preferences: { planning: { breakfast: true, snack: true } } },
    ]
    expect(expectedMealCountForWindow(members, 7)).toBe(49)
  })
})

describe('quota carné par membre — livrable 1.1', () => {
  it('lit le quota déclaré, et distingue l’absence de zéro', () => {
    // `null` n'est pas 0 : l'un dit « rien n'est réglé », l'autre « aucune
    // viande ». Confondre les deux, c'est fabriquer un choix que personne n'a
    // fait — et c'est exactement ce qui a mis Zoé à 0 repas carné sur 14.
    expect(getMemberPlanningRules({ name: 'A' }).meatMealsPerWeek).toBeNull()
    expect(getMemberPlanningRules({ name: 'A', preferences: { planning: {} } }).meatMealsPerWeek).toBeNull()
    expect(getMemberPlanningRules({ name: 'A', preferences: { planning: { meat_meals_per_week: null } } }).meatMealsPerWeek).toBeNull()
    expect(getMemberPlanningRules({ name: 'A', preferences: { planning: { meat_meals_per_week: 0 } } }).meatMealsPerWeek).toBe(0)
    expect(getMemberPlanningRules({ name: 'A', preferences: { planning: { meat_meals_per_week: 4 } } }).meatMealsPerWeek).toBe(4)
  })

  it('borne le quota aux quatorze repas principaux et ignore une valeur inexploitable', () => {
    // Au-delà de quatorze, le quota désignerait des repas qui n'existent pas.
    expect(getMemberPlanningRules({ name: 'A', preferences: { planning: { meat_meals_per_week: 40 } } }).meatMealsPerWeek).toBe(MAX_MEAT_MEALS_PER_WEEK)
    // Une valeur illisible n'est pas un quota : elle retombe sur l'absence, pas
    // sur un nombre plausible. La saisie, elle, est REFUSÉE en amont par
    // `normalizeMeatMealsPerWeek` — ici on lit un profil déjà enregistré.
    expect(getMemberPlanningRules({ name: 'A', preferences: { planning: { meat_meals_per_week: 'deux' } } }).meatMealsPerWeek).toBeNull()
    expect(getMemberPlanningRules({ name: 'A', preferences: { planning: { meat_meals_per_week: -2 } } }).meatMealsPerWeek).toBeNull()
  })

  it('ne dépend d’aucun prénom, quota compris', () => {
    const preferences = { planning: { meat_meals_per_week: 3 } }
    expect(getMemberPlanningRules({ name: 'Julien', preferences }))
      .toEqual(getMemberPlanningRules({ name: 'Zoé', preferences }))
  })
})
