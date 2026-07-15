import { describe, it, expect } from 'vitest'
import {
  parseQuantityString, parsePackagingType, normalizeOffProduct, isCompositeProduct, extractLabelNutriments,
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

describe('extractLabelNutriments — clés nulles supprimées + complétude (verdict directeur)', () => {
  it('étiquette complète (4 macros) → complete + confiance A, clés nulles retirées', () => {
    const l = extractLabelNutriments({
      'energy-kcal_100g': 200, 'proteins_100g': 8, 'carbohydrates_100g': 20, 'fat_100g': 9,
      'salt_100g': null, 'fiber_100g': undefined,
    })
    expect(l.complete).toBe(true)
    expect(l.confidence).toBe('A')
    expect('salt_g' in l.values).toBe(false)
    expect('fiber_g' in l.values).toBe(false)
    expect(l.values).toEqual({ energy_kcal: 200, protein_g: 8, carbohydrate_g: 20, fat_g: 9 })
  })
  it('étiquette partielle → non complète + confiance C', () => {
    const l = extractLabelNutriments({ 'energy-kcal_100g': 200, 'proteins_100g': 8 })
    expect(l.complete).toBe(false)
    expect(l.confidence).toBe('C')
  })
  it('étiquette entièrement nulle → objet vide {} (jamais « présente »)', () => {
    const l = extractLabelNutriments({ 'energy-kcal_100g': null })
    expect(l.values).toEqual({})
    expect(l.complete).toBe(false)
    expect(l.confidence).toBe(null)
  })
  it('normalizeOffProduct expose les drapeaux de complétude', () => {
    const p = normalizeOffProduct({
      code: '1', product_name: 'x', nutriments: { 'energy-kcal_100g': 100, 'proteins_100g': 3, 'carbohydrates_100g': 10, 'fat_100g': 5 },
    })
    expect(p.label_nutrition_complete).toBe(true)
    expect(p.label_nutrition_confidence).toBe('A')
    expect(p.label_nutrition_review_status).toBe('unreviewed')
  })
})

describe('isCompositeProduct — nutrition étiquette obligatoire', () => {
  it('produit composé/transformé détecté', () => {
    expect(isCompositeProduct({}, 'curry de pois chiches aux epices')).toBe(true)
    expect(isCompositeProduct({}, 'haricots blancs a la tomate')).toBe(true)
    expect(isCompositeProduct({}, 'quinoa croquant amandes et noisettes')).toBe(true)
    expect(isCompositeProduct({ nova_group: 4 }, 'nutella')).toBe(true)
  })
  it('aliment simple non composé', () => {
    expect(isCompositeProduct({ nova_group: 1 }, 'lentilles vertes')).toBe(false)
    expect(isCompositeProduct({}, 'moutarde de dijon')).toBe(false)
    expect(isCompositeProduct({}, 'riz basmati')).toBe(false)
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
