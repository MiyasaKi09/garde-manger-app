import { describe, it, expect } from 'vitest'
import {
  parseQuantityString, parsePackagingType, normalizeOffProduct,
} from '@/scripts/data/lib/off-normalize.mjs'
import { significantTokens, matchProductToConcept } from '@/scripts/data/lib/off-match.mjs'

describe('parseQuantityString', () => {
  it('parse "360 g", "1 L", "50 cl"', () => {
    expect(parseQuantityString('360 g')).toEqual({ package_quantity: 360, package_unit: 'g' })
    expect(parseQuantityString('1 L')).toEqual({ package_quantity: 1, package_unit: 'l' })
    expect(parseQuantityString('50 cl')).toEqual({ package_quantity: 50, package_unit: 'cl' })
  })
  it('parse les multiplicateurs "6 x 125 g" → 750 g', () => {
    expect(parseQuantityString('6 x 125 g')).toEqual({ package_quantity: 750, package_unit: 'g' })
  })
  it('repli sur product_quantity (grammes) quand la chaîne est vide', () => {
    expect(parseQuantityString('', 250)).toEqual({ package_quantity: 250, package_unit: 'g' })
    expect(parseQuantityString(null, null)).toEqual({ package_quantity: null, package_unit: null })
  })
})

describe('parsePackagingType', () => {
  it('mappe vers un type normalisé', () => {
    expect(parsePackagingType('Bocal')).toBe('verre')
    expect(parsePackagingType('Métal,Verre,Bocal')).toBe('verre')
    expect(parsePackagingType('Plastic,Pot')).toBe('plastique')
    expect(parsePackagingType('')).toBe(null)
  })
})

describe('normalizeOffProduct', () => {
  it('extrait un enregistrement normalisé, gère la ligature œ', () => {
    const p = normalizeOffProduct({
      code: '3564707087384', product_name_fr: '10 Œuf frais', brands: 'Bio Village, X',
      quantity: '320 g', product_quantity: 320, packaging: 'Carton',
      nutriments: { 'energy-kcal_100g': 140, 'proteins_100g': 12.7 },
    })
    expect(p.barcode).toBe('3564707087384')
    expect(p.name_normalized).toBe('10 oeuf frais')
    expect(p.brand).toBe('Bio Village')
    expect(p.package_quantity).toBe(320)
    expect(p.packaging_type).toBe('carton')
    expect(p.label_nutriments.energy_kcal).toBe(140)
  })
  it('retourne null sans code-barres ou nom', () => {
    expect(normalizeOffProduct({ code: '', product_name: 'x' })).toBe(null)
    expect(normalizeOffProduct({ code: '123', product_name: '' })).toBe(null)
  })
})

describe('significantTokens', () => {
  it('≥3 lettres, hors stopwords, singularisé', () => {
    expect(significantTokens('lentilles vertes bio')).toEqual(['lentille', 'verte'])
    expect(significantTokens('pois chiches tres peu de jus')).toEqual(['poi', 'chiche', 'tre', 'peu', 'ju'])
  })
})

describe('matchProductToConcept', () => {
  const concepts = [
    { normalized: 'moutarde', category: 'condiments_sauces' },
    { normalized: 'moutarde a l ancienne', category: 'condiments_sauces' },
    { normalized: 'riz thai ou basmati', category: 'cereales_feculents' },
    { normalized: 'riz blanc', category: 'cereales_feculents' },
    { normalized: 'lentille verte', category: 'legumineuses' },
    { normalized: 'huile vegetale aliment moyen', category: 'matieres_grasses' },
    { normalized: 'huile de palme raffinee', category: 'matieres_grasses' },
  ]

  it('concept mono-mot exact → confiance 1', () => {
    const m = matchProductToConcept('amora moutarde forte verre 430g', concepts)
    expect(m.concept).toBe('moutarde')
    expect(m.confidence).toBe(1)
  })
  it('multi-mot : basmati + riz → riz thai ou basmati (0.67)', () => {
    const m = matchProductToConcept('riz basmati', concepts)
    expect(m.concept).toBe('riz thai ou basmati')
    expect(m.confidence).toBeCloseTo(0.67, 1)
  })
  it('lentilles vertes → lentille verte (1.0)', () => {
    expect(matchProductToConcept('lentilles vertes', concepts).concept).toBe('lentille verte')
  })
  it('huile d olive : un seul token faible → pas de lien (évite huile→palme)', () => {
    expect(matchProductToConcept('huile d olive vierge', concepts)).toBe(null)
  })
  it('nom sans mot alimentaire connu → null', () => {
    expect(matchProductToConcept('stephanie eleveur', concepts)).toBe(null)
  })
})
