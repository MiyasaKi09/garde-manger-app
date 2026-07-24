import { describe, expect, it } from 'vitest'
import {
  mergePlanningPreferences,
  normalizeFoodPreference,
  normalizeGoalInput,
  resolvePlanningGoals,
} from '@/lib/domain/settings/planningSettings'

describe('planning settings', () => {
  const member = { id: 'member-1', name: 'Nora' }

  it('validates a questionnaire result and binds it to the household member', () => {
    expect(normalizeGoalInput({
      target_calories: 2100,
      target_protein_g: 110,
      target_carbs_g: 240,
      target_fat_g: 70,
      target_fiber_g: 30,
      age: 31,
      sex: 'F',
      height_cm: 172,
      current_weight_kg: 72,
      target_weight_kg: 66,
      activity_level: 'light',
      weight_loss_rate: 0.5,
      bmr: 1500,
      tdee: 2100,
    }, member)).toMatchObject({ household_member_id: 'member-1', person_name: 'Nora', target_calories: 2100, calculation_source: 'questionnaire' })
  })

  it('keeps unrelated preferences while updating planning rules', () => {
    expect(mergePlanningPreferences({ locale: 'fr', planning: { breakfast: false } }, {
      breakfast: true,
      snack: true,
      vegetarian_meat_swaps_per_week: 3,
    })).toEqual({
      locale: 'fr',
      planning: { breakfast: true, snack: true, vegetarian_meat_swaps_per_week: 3 },
    })
  })

  it('normalizes strict bans and dislikes', () => {
    expect(normalizeFoodPreference({ name: '  Fruits   de mer ', kind: 'ban' }))
      .toMatchObject({ name: 'Fruits de mer', normalized_name: 'fruits de mer', kind: 'ban' })
    expect(normalizeFoodPreference({ name: 'Fenouil', kind: 'dislike' }).kind).toBe('dislike')
  })

  it('uses the active version as planning truth and falls back to legacy goals', () => {
    const members = [member, { id: 'member-2', name: 'Eli' }]
    const goals = resolvePlanningGoals({
      members,
      windowStart: '2026-07-27',
      healthGoals: [
        { household_member_id: 'member-1', person_name: 'Nora', target_calories: 1800, target_protein_g: 90 },
        { household_member_id: 'member-2', person_name: 'Eli', target_calories: 2200, target_protein_g: 120 },
      ],
      targetVersions: [
        { member_id: 'member-1', effective_from: '2026-07-24', effective_to: null, target_kcal: 1950, target_protein_g: 105, source: 'questionnaire' },
      ],
    })
    expect(goals[0]).toMatchObject({ person_name: 'Nora', target_calories: 1950, target_protein_g: 105, target_source: 'questionnaire' })
    expect(goals[1]).toMatchObject({ person_name: 'Eli', target_calories: 2200, target_source: 'user_health_goals' })
  })
})
