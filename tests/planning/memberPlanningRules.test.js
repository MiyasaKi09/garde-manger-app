import { describe, expect, it } from 'vitest'
import { expectedMealCountForWindow, getMemberPlanningRules } from '@/lib/domain/planning/memberPlanningRules'

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
