import { describe, expect, it } from 'vitest'
import {
  DISCOVERY_MODES,
  discoveryBalance,
  discoveryScoreAdjustment,
  discoveryTarget,
  resolveDiscoveryMode,
} from '@/lib/domain/planning/discoveryProfile'
import { getMemberPlanningRules } from '@/lib/domain/planning/memberPlanningRules'
import { QUESTION_STEPS, answeredCount, answersFromExisting } from '@/app/settings/tastes/questionnaire'

// Lot 2 (§5, questionnaire) et §6 (équilibre habitudes / nouveautés).

const member = (planning) => ({ preferences: { planning } })

describe('resolveDiscoveryMode — compromis de foyer', () => {
  it('retient le mode le plus PRUDENT exprimé', () => {
    // Proposer trop de nouveautés à qui n'en veut pas coûte plus cher que
    // d'en proposer trop peu à qui en voudrait.
    expect(resolveDiscoveryMode([
      member({ discovery_mode: 'curious' }),
      member({ discovery_mode: 'very_familiar' }),
    ])).toBe(DISCOVERY_MODES.FAMILIAR)
  })

  it('retombe sur « équilibré » quand personne ne s’est prononcé', () => {
    expect(resolveDiscoveryMode([])).toBe(DISCOVERY_MODES.BALANCED)
    expect(resolveDiscoveryMode([member({}), member({ discovery_mode: 'nawak' })])).toBe(DISCOVERY_MODES.BALANCED)
  })
})

describe('discoveryTarget — les proportions du §6', () => {
  it('traduit chaque mode en nombre de découvertes sur quatorze repas', () => {
    const forMode = (mode) => discoveryTarget({ members: [member({ discovery_mode: mode })], mealCount: 14 })
    expect(forMode('very_familiar').discoveries).toBe(1)
    expect(forMode('balanced').discoveries).toBe(2)
    expect(forMode('curious').discoveries).toBe(4)
    expect(forMode('curious').ratios).toEqual({ familiar: 0.40, rotation: 0.35, discovery: 0.25 })
  })

  it('fait primer un nombre exact demandé par le foyer', () => {
    const target = discoveryTarget({
      members: [member({ discovery_mode: 'very_familiar', weekly_discoveries: 5 })],
      mealCount: 14,
    })
    expect(target.discoveries).toBe(5)
  })

  it('ne demande jamais plus de découvertes que de repas', () => {
    expect(discoveryTarget({ members: [member({ weekly_discoveries: 99 })], mealCount: 4 }).discoveries).toBe(4)
  })
})

describe('discoveryBalance et notation', () => {
  const target = discoveryTarget({ members: [member({ discovery_mode: 'balanced' })], mealCount: 14 })
  const week = (discoveries) => Array.from({ length: 14 }, (_, index) => ({
    mealStatus: index < discoveries ? 'new_meal' : 'favorite_rotation',
  }))

  it('mesure l’écart à la cible sans jamais invalider la semaine', () => {
    const balance = discoveryBalance({ slots: week(2), target })
    expect(balance).toMatchObject({ discoveries: 2, expectedDiscoveries: 2, discoveryGap: 0, onTarget: true })
    // Un repas d'écart reste conforme : sur quatorze créneaux, exiger le compte
    // exact reviendrait à piloter au repas près.
    expect(discoveryBalance({ slots: week(3), target }).onTarget).toBe(true)
    expect(discoveryBalance({ slots: week(6), target }).onTarget).toBe(false)
  })

  it('compte les restes comme du familier', () => {
    const slots = [{ mealStatus: 'planned_leftover' }, { mealStatus: 'new_meal' }]
    expect(discoveryBalance({ slots, target }).familiar).toBe(1)
  })

  it('encourage une découverte sous le quota et la freine au-dessus, sans jamais l’interdire', () => {
    expect(discoveryScoreAdjustment({ isDiscovery: true, discoveriesSoFar: 0, target })).toBeGreaterThan(0)
    expect(discoveryScoreAdjustment({ isDiscovery: true, discoveriesSoFar: 5, target })).toBeLessThan(0)
    // Un plat connu n'est jamais ajusté par ce levier.
    expect(discoveryScoreAdjustment({ isDiscovery: false, discoveriesSoFar: 5, target })).toBe(0)
    // Sans cible exprimée, le levier est neutre.
    expect(discoveryScoreAdjustment({ isDiscovery: true, discoveriesSoFar: 9, target: null })).toBe(0)
  })
})

describe('getMemberPlanningRules — réponses d’organisation (§5)', () => {
  it('lit les jours de cuisine et les jours à repas rapide', () => {
    const rules = getMemberPlanningRules(member({ cooking_days: [6, 7, 6], quick_days: [2] }))
    expect(rules.cookingDays).toEqual([6, 7])
    expect(rules.quickDays).toEqual([2])
  })

  it('écarte les jours invalides sans faire échouer la lecture', () => {
    expect(getMemberPlanningRules(member({ cooking_days: [0, 8, 'lundi', 3] })).cookingDays).toEqual([3])
    expect(getMemberPlanningRules(member({ cooking_days: 'samedi' })).cookingDays).toEqual([])
  })

  it('lit la préférence de déjeuner et ignore une valeur inconnue', () => {
    expect(getMemberPlanningRules(member({ lunch_style: 'light' })).lunchStyle).toBe('light')
    expect(getMemberPlanningRules(member({ lunch_style: 'copieux' })).lunchStyle).toBeNull()
  })
})

describe('questionnaire guidé (§5)', () => {
  it('couvre les onze questions du plan', () => {
    expect(QUESTION_STEPS).toHaveLength(11)
    const keys = QUESTION_STEPS.map((step) => step.key)
    for (const expected of [
      'weekly_favorites', 'monthly_dishes', 'refused_foods', 'disliked_textures',
      'liked_cuisines', 'leftovers', 'discovery_mode', 'weekly_discoveries',
      'cooking_days', 'quick_days', 'lunch_style',
    ]) expect(keys).toContain(expected)
  })

  it('dirige chaque question vers la bonne destination', () => {
    const byKey = Object.fromEntries(QUESTION_STEPS.map((step) => [step.key, step]))
    // Un goût va dans le profil de goûts…
    expect(byKey.refused_foods).toMatchObject({ kind: 'preference', subjectType: 'ingredient', appreciation: 'forbidden' })
    // …une organisation dans les préférences du membre.
    expect(byKey.cooking_days).toMatchObject({ kind: 'setting', field: 'cooking_days' })
  })

  it('reprend un parcours déjà commencé au lieu de tout redemander', () => {
    const answers = answersFromExisting({
      preferences: [
        { subject_type: 'ingredient', subject_value: 'coriandre', subject_label: 'coriandre', appreciation: 'forbidden' },
        { subject_type: 'leftovers', subject_value: 'restes', appreciation: 'avoided' },
      ],
      planning: { discovery_mode: 'curious', cooking_days: [6, 7] },
    })
    expect(answers.refused_foods).toEqual(['coriandre'])
    expect(answers.leftovers).toBe('avoided')
    expect(answers.discovery_mode).toBe('curious')
    expect(answers.cooking_days).toEqual([6, 7])
    expect(answeredCount(answers)).toBe(4)
  })

  it('ne compte pas une liste vide comme une réponse', () => {
    expect(answeredCount({ refused_foods: [], discovery_mode: '' })).toBe(0)
  })
})
