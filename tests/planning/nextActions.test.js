import { describe, expect, it } from 'vitest'
import { buildNextActions } from '@/lib/domain/planning/nextActions'

// Lot P5 — vue « prochaines actions du jour » (audit §13 niveau 1).
// Module pur : déterministe, sans dépendance réseau ni DB.

const TODAY = '2026-07-17'
const YESTERDAY = '2026-07-16'
const TOMORROW = '2026-07-18'

// Helpers de construction de tâches / slots
const makeTask = (overrides = {}) => ({
  prep_date: TODAY,
  task_type: 'prepare_recipe',
  duration_min: 30,
  prep_label: 'Préparer le gratin',
  task: 'Préparer le gratin de courgettes',
  meal_plan_slot_id: null,
  ...overrides,
})

const makeSlot = (overrides = {}) => ({
  meal_date: TODAY,
  source: 'canonical_v3',
  preparation: {},
  stock_summary: { coverage: 1, shortages: [] },
  dish_name: null,
  ...overrides,
})

describe('buildNextActions — cas nominaux', () => {

  it('liste vide si aucune tâche ni slot pour aujourd\'hui', () => {
    const { actions, totalActiveMinutes } = buildNextActions({ todayIso: TODAY, slots: [], tasks: [] })
    expect(actions).toHaveLength(0)
    expect(totalActiveMinutes).toBe(0)
  })

  it('jours sans action → résultat vide (déterministe)', () => {
    const tasks = [makeTask({ prep_date: YESTERDAY }), makeTask({ prep_date: TOMORROW })]
    const slots = [makeSlot({ meal_date: YESTERDAY }), makeSlot({ meal_date: TOMORROW })]
    const { actions } = buildNextActions({ todayIso: TODAY, slots, tasks })
    expect(actions).toHaveLength(0)
  })

  it('tâche defrost → action kind=defrost, pas dans totalActiveMinutes', () => {
    const tasks = [makeTask({ task_type: 'defrost', prep_label: 'Sortir le poulet du congél.', duration_min: 2 })]
    const { actions, totalActiveMinutes } = buildNextActions({ todayIso: TODAY, tasks })
    expect(actions).toHaveLength(1)
    expect(actions[0].kind).toBe('defrost')
    expect(actions[0].label).toBe('Sortir le poulet du congél.')
    expect(totalActiveMinutes).toBe(0) // defrost n'est pas du temps actif
  })

  it('tâche prepare_recipe → action kind=prepare + totalActiveMinutes', () => {
    const tasks = [makeTask({ duration_min: 45, prep_label: 'Cuire les pâtes' })]
    const { actions, totalActiveMinutes } = buildNextActions({ todayIso: TODAY, tasks })
    const a = actions.find(x => x.kind === 'prepare')
    expect(a).toBeTruthy()
    expect(a.label).toBe('Cuire les pâtes')
    expect(a.minutes).toBe(45)
    expect(totalActiveMinutes).toBe(45)
  })

  it('tâche prepare sans duration_min → minutes undefined (pas de durée connue)', () => {
    const tasks = [makeTask({ task_type: 'prepare', duration_min: null })]
    const { actions } = buildNextActions({ todayIso: TODAY, tasks })
    const a = actions.find(x => x.kind === 'prepare')
    expect(a).toBeTruthy()
    expect(a.minutes).toBeUndefined()
  })

  it('tâche reheat → action kind=reheat + ajouté aux minutes actives', () => {
    const tasks = [makeTask({ task_type: 'reheat', duration_min: 10, prep_label: 'Réchauffer la soupe' })]
    const { actions, totalActiveMinutes } = buildNextActions({ todayIso: TODAY, tasks })
    const a = actions.find(x => x.kind === 'reheat')
    expect(a).toBeTruthy()
    expect(a.label).toBe('Réchauffer la soupe')
    expect(totalActiveMinutes).toBe(10)
  })

  it('slot source=cooked_dish → action eat_urgent (reste à finir)', () => {
    const slots = [makeSlot({ source: 'cooked_dish', dish_name: 'Hachis Parmentier' })]
    const { actions } = buildNextActions({ todayIso: TODAY, slots })
    const a = actions.find(x => x.kind === 'eat_urgent')
    expect(a).toBeTruthy()
    expect(a.label).toContain('Hachis Parmentier')
  })

  it('slot planned_production sans tâche reheat → fallback kind=reheat', () => {
    const slots = [makeSlot({ source: 'planned_production', preparation: { mode: 'reheat' }, dish_name: 'Gratin' })]
    const { actions } = buildNextActions({ todayIso: TODAY, slots, tasks: [] })
    const a = actions.find(x => x.kind === 'reheat')
    expect(a).toBeTruthy()
    expect(a.label).toContain('Réchauffer')
  })

  it('slot avec coverage < 1 → action buy avec label des ingrédients manquants', () => {
    const slots = [makeSlot({
      stock_summary: {
        coverage: 0.4,
        shortages: [
          { ingredientName: 'courgettes', formNormalized: 'courgette crue', grams: 300 },
          { ingredientName: 'parmesan', formNormalized: 'parmesan rapé', grams: 50 },
        ],
      },
    })]
    const { actions } = buildNextActions({ todayIso: TODAY, slots })
    const a = actions.find(x => x.kind === 'buy')
    expect(a).toBeTruthy()
    expect(a.label).toContain('courgettes')
    expect(a.href).toBe('/courses')
  })

  it('slot coverage = 1 → pas d\'action buy', () => {
    const slots = [makeSlot({ stock_summary: { coverage: 1, shortages: [] } })]
    const { actions } = buildNextActions({ todayIso: TODAY, slots })
    expect(actions.find(x => x.kind === 'buy')).toBeUndefined()
  })

  it('plusieurs shortages → agrégés (pas de doublon)', () => {
    const slots = [
      makeSlot({ stock_summary: { coverage: 0, shortages: [{ ingredientName: 'poulet' }] } }),
      makeSlot({ meal_type: 'diner', stock_summary: { coverage: 0, shortages: [{ ingredientName: 'poulet' }] } }),
    ]
    const { actions } = buildNextActions({ todayIso: TODAY, slots })
    const buys = actions.filter(x => x.kind === 'buy')
    expect(buys).toHaveLength(1)
    // "poulet" n'apparaît qu'une fois
    expect((buys[0].label.match(/poulet/g) || []).length).toBe(1)
  })
})

describe('buildNextActions — ordre des actions', () => {

  it('ordre : defrost → prepare → reheat → eat_urgent → buy', () => {
    const tasks = [
      makeTask({ task_type: 'defrost', duration_min: 2, prep_label: 'Décongeler' }),
      makeTask({ task_type: 'prepare_recipe', duration_min: 30, prep_label: 'Cuire' }),
      makeTask({ task_type: 'reheat', duration_min: 10, prep_label: 'Réchauffer' }),
    ]
    const slots = [
      makeSlot({ source: 'cooked_dish', dish_name: 'Reste de gratin' }),
      makeSlot({ meal_type: 'diner', stock_summary: { coverage: 0.5, shortages: [{ ingredientName: 'tomates' }] } }),
    ]
    const { actions } = buildNextActions({ todayIso: TODAY, slots, tasks })
    const kinds = actions.map(a => a.kind)
    expect(kinds.indexOf('defrost')).toBeLessThan(kinds.indexOf('prepare'))
    expect(kinds.indexOf('prepare')).toBeLessThan(kinds.indexOf('reheat'))
    expect(kinds.indexOf('reheat')).toBeLessThan(kinds.indexOf('eat_urgent'))
    expect(kinds.indexOf('eat_urgent')).toBeLessThan(kinds.indexOf('buy'))
  })
})

describe('buildNextActions — totalActiveMinutes', () => {

  it('totalActiveMinutes = somme des minutes prepare + reheat', () => {
    const tasks = [
      makeTask({ task_type: 'defrost', duration_min: 2 }),
      makeTask({ task_type: 'prepare_recipe', duration_min: 45 }),
      makeTask({ task_type: 'prepare_recipe', duration_min: 20 }),
      makeTask({ task_type: 'reheat', duration_min: 10 }),
    ]
    const { totalActiveMinutes } = buildNextActions({ todayIso: TODAY, tasks })
    expect(totalActiveMinutes).toBe(45 + 20 + 10) // defrost exclu
  })

  it('0 minute active si toutes les tâches sont defrost', () => {
    const tasks = [makeTask({ task_type: 'defrost', duration_min: 5 })]
    const { totalActiveMinutes } = buildNextActions({ todayIso: TODAY, tasks })
    expect(totalActiveMinutes).toBe(0)
  })
})

describe('buildNextActions — robustesse', () => {

  it('appelé sans arguments → {actions: [], totalActiveMinutes: 0}', () => {
    const result = buildNextActions()
    expect(result.actions).toHaveLength(0)
    expect(result.totalActiveMinutes).toBe(0)
  })

  it('todayIso absent → aucune tâche ni slot ne correspond', () => {
    const tasks = [makeTask()]
    const { actions } = buildNextActions({ todayIso: null, tasks })
    expect(actions).toHaveLength(0)
  })

  it('tâche sans prep_label ni task → label fallback', () => {
    const tasks = [makeTask({ task_type: 'defrost', prep_label: '', task: '' })]
    const { actions } = buildNextActions({ todayIso: TODAY, tasks })
    expect(actions[0].label).toBeTruthy()
  })

  it('slot avec stock_summary.shortages vide → label générique pour buy', () => {
    const slots = [makeSlot({ stock_summary: { coverage: 0, shortages: [] } })]
    const { actions } = buildNextActions({ todayIso: TODAY, slots })
    const a = actions.find(x => x.kind === 'buy')
    expect(a).toBeTruthy()
    expect(a.label).toContain('manquants')
  })

  it('eat_urgent dédupliqué si même dish_name sur 2 slots', () => {
    const slots = [
      makeSlot({ source: 'cooked_dish', dish_name: 'Soupe' }),
      makeSlot({ meal_type: 'diner', source: 'cooked_dish', dish_name: 'Soupe' }),
    ]
    const { actions } = buildNextActions({ todayIso: TODAY, slots })
    expect(actions.filter(a => a.kind === 'eat_urgent')).toHaveLength(1)
  })

  it('reheat dédupliqué si même label de tâche', () => {
    const tasks = [
      makeTask({ task_type: 'reheat', prep_label: 'Réchauffer le gratin' }),
      makeTask({ task_type: 'reheat', prep_label: 'Réchauffer le gratin' }),
    ]
    const { actions } = buildNextActions({ todayIso: TODAY, tasks })
    expect(actions.filter(a => a.kind === 'reheat')).toHaveLength(1)
  })
})
