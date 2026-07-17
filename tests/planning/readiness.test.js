import { describe, expect, it } from 'vitest'
import { computeWeekReadiness } from '@/lib/domain/planning/readiness'

// P0-5 (audit F16) : une semaine n'est « prête » que si les prises attendues
// sont connues, toutes présentes, et qu'au moins une tâche de préparation existe.
describe('computeWeekReadiness', () => {
  it('0 prise attendue (objectifs absents ou en échec) → jamais prête', () => {
    const result = computeWeekReadiness({ expectedMeals: 0, uniqueMealCount: 28, prepTaskCount: 14 })
    expect(result.ready).toBe(false)
    expect(result.reason).toBe('goals_missing')
    expect(result.missingMeals).toBe(0)
  })

  it('28 prises sur 49 attendues → incomplète, avec le compte des manquantes', () => {
    const result = computeWeekReadiness({ expectedMeals: 49, uniqueMealCount: 28, prepTaskCount: 14 })
    expect(result.ready).toBe(false)
    expect(result.reason).toBe('meals_missing')
    expect(result.missingMeals).toBe(21)
  })

  it('49/49 prises mais 0 tâche de préparation → pas prête', () => {
    const result = computeWeekReadiness({ expectedMeals: 49, uniqueMealCount: 49, prepTaskCount: 0 })
    expect(result.ready).toBe(false)
    expect(result.reason).toBe('tasks_missing')
    expect(result.missingMeals).toBe(0)
  })

  it('49/49 prises + tâches présentes → prête', () => {
    const result = computeWeekReadiness({ expectedMeals: 49, uniqueMealCount: 49, prepTaskCount: 14 })
    expect(result).toEqual({ ready: true, missingMeals: 0, reason: null })
  })

  it('plus de prises que prévu ne casse rien (surplus toléré)', () => {
    const result = computeWeekReadiness({ expectedMeals: 49, uniqueMealCount: 52, prepTaskCount: 3 })
    expect(result.ready).toBe(true)
  })

  it('entrées absentes ou non numériques → traitées comme 0 (jamais prête)', () => {
    expect(computeWeekReadiness().ready).toBe(false)
    expect(computeWeekReadiness().reason).toBe('goals_missing')
    expect(computeWeekReadiness({ expectedMeals: 'abc', uniqueMealCount: 49, prepTaskCount: 2 }).reason).toBe('goals_missing')
    expect(computeWeekReadiness({ expectedMeals: 49, uniqueMealCount: null, prepTaskCount: 2 }).missingMeals).toBe(49)
  })
})
