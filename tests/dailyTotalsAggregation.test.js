import { describe, it, expect } from 'vitest'
import { aggregateDailyTotals } from '@/lib/nutritionPlanService'

const meal = (over = {}) => ({
  meal_date: '2026-07-06',
  person_name: 'Julien',
  meal_type: 'dejeuner',
  kcal: 500,
  protein_g: 30,
  carbs_g: 50,
  fat_g: 15,
  fiber_g: 6,
  ...over,
})

describe('aggregateDailyTotals', () => {
  it('retourne [] sans repas', () => {
    expect(aggregateDailyTotals([])).toEqual([])
    expect(aggregateDailyTotals()).toEqual([])
  })

  it('agrège par (meal_date, person_name) en sommant les macros', () => {
    const totals = aggregateDailyTotals([
      meal({ meal_type: 'pdj', kcal: 400, protein_g: 20, carbs_g: 40, fat_g: 12, fiber_g: 4 }),
      meal({ meal_type: 'dejeuner', kcal: 650, protein_g: 40, carbs_g: 60, fat_g: 20, fiber_g: 8 }),
      meal({ meal_type: 'diner', kcal: 600, protein_g: 35, carbs_g: 55, fat_g: 18, fiber_g: 7 }),
    ])
    expect(totals).toHaveLength(1)
    expect(totals[0]).toMatchObject({
      meal_date: '2026-07-06',
      person_name: 'Julien',
      kcal: 1650,
      protein_g: 95,
      carbs_g: 155,
      fat_g: 50,
      fiber_g: 19,
    })
  })

  it('sépare les personnes et les jours', () => {
    const totals = aggregateDailyTotals([
      meal({ person_name: 'Julien', kcal: 500 }),
      meal({ person_name: 'Zoé', kcal: 450 }),
      meal({ person_name: 'Julien', meal_date: '2026-07-07', kcal: 700 }),
    ])
    expect(totals).toHaveLength(3)
    expect(totals.map(t => `${t.meal_date}|${t.person_name}`)).toEqual([
      '2026-07-06|Julien',
      '2026-07-06|Zoé',
      '2026-07-07|Julien',
    ])
  })

  it('trie par date puis par personne', () => {
    const totals = aggregateDailyTotals([
      meal({ meal_date: '2026-07-08', person_name: 'Zoé' }),
      meal({ meal_date: '2026-07-07', person_name: 'Julien' }),
      meal({ meal_date: '2026-07-07', person_name: 'Zoé' }),
    ])
    expect(totals.map(t => `${t.meal_date}|${t.person_name}`)).toEqual([
      '2026-07-07|Julien',
      '2026-07-07|Zoé',
      '2026-07-08|Zoé',
    ])
  })

  it('arrondit : kcal à l’entier, macros à 1 décimale', () => {
    const totals = aggregateDailyTotals([
      meal({ kcal: 500.4, protein_g: 30.14, carbs_g: 50.25, fat_g: 15.06, fiber_g: 3.33 }),
      meal({ meal_type: 'diner', kcal: 300.3, protein_g: 20.13, carbs_g: 30.11, fat_g: 10.01, fiber_g: 3.33 }),
    ])
    expect(totals[0].kcal).toBe(801)
    expect(totals[0].protein_g).toBe(50.3)
    expect(totals[0].carbs_g).toBe(80.4)
    expect(totals[0].fat_g).toBe(25.1)
    expect(totals[0].fiber_g).toBe(6.7)
  })

  it('traite les macros null/absentes comme 0', () => {
    const totals = aggregateDailyTotals([
      meal({ kcal: null, protein_g: null, carbs_g: undefined, fat_g: null, fiber_g: null }),
      meal({ meal_type: 'diner', kcal: 400, protein_g: 25, carbs_g: 35, fat_g: 12, fiber_g: null }),
    ])
    expect(totals[0].kcal).toBe(400)
    expect(totals[0].protein_g).toBe(25)
    expect(totals[0].carbs_g).toBe(35)
    expect(totals[0].fat_g).toBe(12)
  })

  it('fiber_g reste null si aucun repas ne renseigne les fibres', () => {
    const totals = aggregateDailyTotals([
      meal({ fiber_g: null }),
      meal({ meal_type: 'diner', fiber_g: null }),
    ])
    expect(totals[0].fiber_g).toBeNull()
  })

  it('fiber_g est sommé dès qu’au moins un repas le renseigne', () => {
    const totals = aggregateDailyTotals([
      meal({ fiber_g: null }),
      meal({ meal_type: 'diner', fiber_g: 5 }),
    ])
    expect(totals[0].fiber_g).toBe(5)
  })

  it('ignore les lignes sans meal_date ou person_name', () => {
    const totals = aggregateDailyTotals([
      meal(),
      meal({ meal_date: null }),
      meal({ person_name: null }),
      null,
    ])
    expect(totals).toHaveLength(1)
    expect(totals[0].kcal).toBe(500)
  })

  describe('validated (dans la cible ±10 % de target_calories)', () => {
    const goals = [
      { person_name: 'Julien', target_calories: 2000 },
      { person_name: 'Zoé', target_calories: 1350 },
    ]

    it('true quand le total est dans ±10 % de la cible', () => {
      const totals = aggregateDailyTotals(
        [meal({ kcal: 1900 }), meal({ meal_type: 'diner', kcal: 0 })],
        goals,
      )
      expect(totals[0].validated).toBe(true)
    })

    it('true aux bornes exactes (±10 %)', () => {
      const low = aggregateDailyTotals([meal({ kcal: 1800 })], goals)
      const high = aggregateDailyTotals([meal({ kcal: 2200 })], goals)
      expect(low[0].validated).toBe(true)
      expect(high[0].validated).toBe(true)
    })

    it('false hors cible', () => {
      const under = aggregateDailyTotals([meal({ kcal: 1500 })], goals)
      const over = aggregateDailyTotals([meal({ kcal: 2400 })], goals)
      expect(under[0].validated).toBe(false)
      expect(over[0].validated).toBe(false)
    })

    it('omis quand la personne n’a pas d’objectif', () => {
      const totals = aggregateDailyTotals([meal({ person_name: 'Invitée' })], goals)
      expect('validated' in totals[0]).toBe(false)
    })

    it('omis quand target_calories est absent, nul ou invalide', () => {
      const totals = aggregateDailyTotals(
        [meal()],
        [{ person_name: 'Julien', target_calories: 0 }, { person_name: 'Julien' }],
      )
      expect('validated' in totals[0]).toBe(false)
    })
  })
})
