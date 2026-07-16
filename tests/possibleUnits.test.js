import { describe, expect, it } from 'vitest'
import { getPossibleUnitsForProduct } from '@/lib/possibleUnits'
import { getPreferredUnit, normalizeProductUnit } from '@/lib/productUnitPolicy'

describe('product unit policy', () => {
  it('keeps butter in mass even when its broad dairy parent has a density', () => {
    const units = getPossibleUnitsForProduct({ name: 'Beurre doux', primary_unit: 'g', density_g_per_ml: 1.03 })
    expect(units.map((unit) => unit.value)).toEqual(['g', 'kg'])
    expect(getPreferredUnit({ name: 'Beurre doux', primary_unit: 'g' })).toBe('g')
  })

  it('offers mass conversion for a liquid only when density is known', () => {
    const units = getPossibleUnitsForProduct({ name: 'Lait', primary_unit: 'L', density_g_per_ml: 1.03 })
    expect(units.map((unit) => unit.value)).toEqual(['g', 'kg', 'ml', 'cl', 'l'])
  })

  it('offers pieces and mass for a countable product with a credible unit weight', () => {
    const units = getPossibleUnitsForProduct({ name: 'Œuf', primary_unit: 'u', grams_per_unit: 50 })
    expect(units.map((unit) => unit.value)).toEqual(['g', 'kg', 'u'])
  })

  it('normalizes legacy casing and falls back conservatively to grams', () => {
    expect(normalizeProductUnit('mL')).toBe('ml')
    expect(normalizeProductUnit('Litres')).toBe('l')
    expect(getPreferredUnit({ name: 'Produit inconnu' })).toBe('g')
  })
})
