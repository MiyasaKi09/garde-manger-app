import { describe, it, expect } from 'vitest'
import { shapeTargetsFromVersion, shapeTargetsFromGoal } from '@/lib/domain/nutrition/targets'

describe('shapeTargetsFromVersion', () => {
  it('normalise une version (nombres, tolérance)', () => {
    expect(shapeTargetsFromVersion({
      member_id: 'm1', target_kcal: '2357.00', target_protein_g: '120',
      tolerance_percent: '12', source: 'legacy_goal',
    })).toEqual({
      kcal: 2357, proteinG: 120, carbsG: null, fatG: null, fiberG: null,
      tolerancePercent: 12, source: 'legacy_goal', memberId: 'm1',
    })
  })
  it('null → null', () => expect(shapeTargetsFromVersion(null)).toBe(null))
  it('tolérance par défaut 15 si absente', () =>
    expect(shapeTargetsFromVersion({ target_kcal: 2000 }).tolerancePercent).toBe(15))
})

describe('shapeTargetsFromGoal', () => {
  it('mappe target_calories → kcal + source de repli', () => {
    const t = shapeTargetsFromGoal({ household_member_id: 'm2', target_calories: 1525, target_protein_g: 90 })
    expect(t.kcal).toBe(1525)
    expect(t.proteinG).toBe(90)
    expect(t.source).toBe('legacy_goal_fallback')
    expect(t.memberId).toBe('m2')
  })
  it('null → null', () => expect(shapeTargetsFromGoal(null)).toBe(null))
})
