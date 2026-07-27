import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WEEKLY_BALANCE, UNCAPPED_PROTEIN_FAMILIES, buildWeeklyBalance, weeklyBalanceFor,
} from '@/lib/domain/planning/weeklyBalance'

// L'équilibre hebdomadaire (poisson, viande, plancher végétarien, répétition par
// famille de protéine) était écrit en dur. Ce sont des choix légitimes, mais des
// CHOIX : un foyer doit pouvoir les assumer autrement.

describe('buildWeeklyBalance — réglages du foyer', () => {
  it('reproduit exactement l’ancien comportement sans réglage', () => {
    expect(buildWeeklyBalance()).toEqual(DEFAULT_WEEKLY_BALANCE)
    expect(buildWeeklyBalance(null)).toEqual(DEFAULT_WEEKLY_BALANCE)
    expect(DEFAULT_WEEKLY_BALANCE).toMatchObject({
      fishMeals: 2, meatMax: 4, vegetarianMin: 8, maxMealsPerProteinFamily: 2,
    })
  })

  it('accepte un réglage partiel sans perdre les autres bornes', () => {
    expect(buildWeeklyBalance({ fishMeals: 5 })).toMatchObject({
      fishMeals: 5, meatMax: 4, vegetarianMin: 8,
    })
  })

  it('ignore une valeur inexploitable au lieu de casser la génération', () => {
    expect(buildWeeklyBalance({ fishMeals: 'beaucoup', meatMax: -3 })).toMatchObject({
      fishMeals: 2, meatMax: 4,
    })
  })

  it('n’autorise jamais zéro repas par famille de protéine', () => {
    // Zéro rendrait toute viande et tout poisson impossibles, sans le dire.
    expect(buildWeeklyBalance({ maxMealsPerProteinFamily: 0 }).maxMealsPerProteinFamily).toBe(1)
  })
})

describe('weeklyBalanceFor — bornes ramenées à la semaine', () => {
  it('reproduit les valeurs historiques sur quatorze créneaux', () => {
    expect(weeklyBalanceFor({ totalSlots: 14 })).toEqual({
      fish: 2, meatMax: 4, vegetarianMin: 8, redMeatMin: 1, fattyFishMin: 1,
      legumesMin: 2, cuisinesMin: 3, proteinsMin: 4, maxMealsPerProteinFamily: 2,
    })
  })

  it('ne réclame pas plus de repas qu’il n’y a de créneaux', () => {
    const small = weeklyBalanceFor({ totalSlots: 3 })
    expect(small.vegetarianMin).toBe(3)
    expect(small.fish).toBe(2)
    // Les minimums « au moins un » ne valent que sur une semaine complète.
    expect(small.redMeatMin).toBe(0)
    expect(small.fattyFishMin).toBe(0)
  })

  it('laisse un régime végétarien déclaré primer sur tout réglage', () => {
    const balance = buildWeeklyBalance({ fishMeals: 6, meatMax: 8 })
    expect(weeklyBalanceFor({ balance, totalSlots: 14, vegetarianDiet: true })).toMatchObject({
      fish: 0, meatMax: 0, vegetarianMin: 14,
    })
  })

  it('transmet un plafond par famille desserré', () => {
    const balance = buildWeeklyBalance({ maxMealsPerProteinFamily: 4 })
    expect(weeklyBalanceFor({ balance, totalSlots: 14 }).maxMealsPerProteinFamily).toBe(4)
  })

  it('exempte les familles qui ne désignent pas une espèce', () => {
    expect(UNCAPPED_PROTEIN_FAMILIES).toEqual(['vegetal', 'laitiers', 'oeufs'])
  })
})
