import { describe, it, expect } from 'vitest'
import { computeNutrition, fourNineCoherencePercent } from '@/lib/domain/nutrition/calculator'

describe('computeNutrition', () => {
  it('somme (per100g × grammes/100) ÷ portions, arrondis kcal/1/2', () => {
    const { perServing } = computeNutrition([
      { name: 'poulet', grams: 200, per100g: { kcal: 120, proteinG: 23, carbsG: 0, fatG: 2.6, fiberG: 0 } },
      { name: 'riz', grams: 150, per100g: { kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4 } },
    ], { servings: 2 })
    // poulet: ×2 (200/100) ; riz: ×1.5 → totaux ÷2
    expect(perServing.kcal).toBe(Math.round((120 * 2 + 130 * 1.5) / 2)) // (240+195)/2 = 217.5 → 218
    expect(perServing.proteinG).toBe(Math.round((23 * 2 + 2.7 * 1.5) / 2 * 10) / 10)
    expect(perServing.carbsG).toBe(Math.round((0 + 28 * 1.5) / 2 * 10) / 10)
  })

  it('applique les facteurs de process (multiplicatifs)', () => {
    const { perServing } = computeNutrition([
      { grams: 100, per100g: { kcal: 100, proteinG: 10 }, factors: { kcal: 1.2, proteinG: 0.9 } },
    ], { servings: 1 })
    expect(perServing.kcal).toBe(120)
    expect(perServing.proteinG).toBe(9)
  })

  it('agrège et arrondit les micros à 2 décimales, retire les zéros', () => {
    const { perServing } = computeNutrition([
      { grams: 100, per100g: { kcal: 50, micros: { fer_mg: 2.5, calcium_mg: 0 } } },
    ], { servings: 1 })
    expect(perServing.micros.fer_mg).toBe(2.5)
    expect('calcium_mg' in perServing.micros).toBe(false)
  })

  it('couverture : quantifiés vs avec données CIQUAL ; ingrédients sans data listés', () => {
    const { coverage } = computeNutrition([
      { name: 'a', grams: 100, per100g: { kcal: 50 } },
      { name: 'sel', grams: 5, per100g: null }, // quantifié mais sans data
      { name: 'huile', grams: null }, // non quantifié → ignoré
    ], { servings: 1 })
    expect(coverage.quantified).toBe(2)
    expect(coverage.withData).toBe(1)
    expect(coverage.pct).toBe(50)
    expect(coverage.unresolved).toEqual(['sel'])
  })

  it('liste vide → zéros et couverture nulle', () => {
    const r = computeNutrition([], { servings: 2 })
    expect(r.perServing.kcal).toBe(0)
    expect(r.coverage.pct).toBe(null)
  })
})

describe('fourNineCoherencePercent', () => {
  it('écart 4-4-9 en %', () => {
    expect(fourNineCoherencePercent({ kcal: 656, proteinG: 59.7, carbsG: 57.8, fatG: 20.7 })).toBeLessThan(2)
    expect(fourNineCoherencePercent({ kcal: 0 })).toBe(null)
  })
})
