import { describe, it, expect } from 'vitest'
import {
  canonicalUnit, toGrams, normalizeProductMeta, tryConvert,
  SPOON_GRAMS, PIECE_FALLBACK_GRAMS,
} from '@/lib/domain/units'

describe('canonicalUnit', () => {
  it('mappe les alias vers les codes canoniques', () => {
    expect(canonicalUnit('Pièce')).toBe('u')
    expect(canonicalUnit('unités')).toBe('u')
    expect(canonicalUnit('càs')).toBe('cs')
    expect(canonicalUnit('c. à café')).toBe('cc')
    expect(canonicalUnit('gr')).toBe('g')
    expect(canonicalUnit('KG')).toBe('kg')
    expect(canonicalUnit('mg')).toBe('mg')
    expect(canonicalUnit(null)).toBe(null)
    expect(canonicalUnit('pincée')).toBe('pincée') // inconnu → tel quel
  })
})

describe('toGrams (parité CASE SQL + cuillères)', () => {
  it('masses', () => {
    expect(toGrams(200, 'g')).toBe(200)
    expect(toGrams(1, 'kg')).toBe(1000)
    expect(toGrams(5, 'mg')).toBe(0.005)
  })
  it('volumes via densité (défaut 1.0)', () => {
    expect(toGrams(100, 'ml', { density_g_per_ml: 1.03 })).toBeCloseTo(103)
    expect(toGrams(5, 'cl')).toBe(50) // 5×10×1.0
    expect(toGrams(1, 'l')).toBe(1000)
  })
  it('cuillères', () => {
    expect(toGrams(2, 'c. à soupe')).toBe(2 * SPOON_GRAMS.cs)
    expect(toGrams(1, 'cc')).toBe(SPOON_GRAMS.cc)
  })
  it('pièces via poids unitaire, sinon repli 100 g', () => {
    expect(toGrams(3, 'pièce', { unit_weight_grams: 120 })).toBe(360)
    expect(toGrams(3, 'pièce', {})).toBe(3 * PIECE_FALLBACK_GRAMS)
  })
  it('refus explicite quand on désactive les replis (usage stock)', () => {
    expect(toGrams(3, 'pièce', {}, { pieceFallbackGrams: null })).toBe(null)
    expect(toGrams(100, 'ml', {}, { densityFallback: null })).toBe(null)
  })
  it('unité inconnue → grammes (parité SQL else) ; quantité invalide → null', () => {
    expect(toGrams(50, 'zzz')).toBe(50)
    expect(toGrams('x', 'g')).toBe(null)
  })
})

describe('normalizeProductMeta', () => {
  it('unifie unit_weight_grams / grams_per_unit / density', () => {
    expect(normalizeProductMeta({ unit_weight_grams: 120, density_g_per_ml: 1.03 }))
      .toEqual({ gramsPerUnit: 120, density: 1.03 })
    expect(normalizeProductMeta({ grams_per_unit: 60 })).toEqual({ gramsPerUnit: 60, density: null })
    expect(normalizeProductMeta({})).toEqual({ gramsPerUnit: null, density: null })
  })
})

describe('tryConvert', () => {
  it('ok=true pour une conversion aboutie', () => {
    expect(tryConvert(1, 'kg', 'g')).toMatchObject({ ok: true, qty: 1000, unit: 'g' })
  })
  it('ok=false quand la conversion est impossible (count→ml sans meta)', () => {
    expect(tryConvert(2, 'u', 'ml', {}).ok).toBe(false)
  })
})
