import { describe, it, expect } from 'vitest'
import {
  aggregateStockByCanonical,
  matchGeneratedRecipe,
  computeDishCoverage,
} from '@/lib/stockCoverage'

// ───────────────────────── Helpers ─────────────────────────

// Catalogue canonique de test. Ids arbitraires.
//  1 poulet (masse, 0 unit_weight)   2 œuf (count, 60 g/u)   3 riz (masse)
//  4 brocoli (masse)                 5 huile (masse, staple cat 99)
//  6 lait (vol, densité 1.03)        7 sel (masse)
const META = new Map([
  [1, { canonical_name: 'poulet', category_id: 10, unit_weight_grams: null, density_g_per_ml: null }],
  [2, { canonical_name: 'oeuf', category_id: 10, unit_weight_grams: 60, density_g_per_ml: null }],
  [3, { canonical_name: 'riz', category_id: 11, unit_weight_grams: null, density_g_per_ml: null }],
  [4, { canonical_name: 'brocoli', category_id: 12, unit_weight_grams: null, density_g_per_ml: null }],
  [5, { canonical_name: 'huile olive', category_id: 99, unit_weight_grams: null, density_g_per_ml: 0.91 }],
  [6, { canonical_name: 'lait', category_id: 13, unit_weight_grams: null, density_g_per_ml: 1.03 }],
  [7, { canonical_name: 'sel', category_id: 14, unit_weight_grams: null, density_g_per_ml: null }],
])

const STAPLE_CATS = new Set([99]) // catégorie « Huiles »

function ing(name, quantity, unit, canonical_food_id, archetype_id = null) {
  return { raw_name: name, quantity, unit, canonical_food_id, archetype_id }
}

function ctx(stockByCanonical) {
  return {
    stockByCanonical,
    canonicalMetaById: META,
    archetypeCanonicalMap: new Map([[500, 1]]), // archetype 500 → poulet
    stapleCategoryIds: STAPLE_CATS,
  }
}

// ───────────────────────── aggregateStockByCanonical ─────────────────────────

describe('aggregateStockByCanonical', () => {
  it('somme les lots du même canonical dans une base homogène', () => {
    const lots = [
      { resolved_canonical_food_id: 3, qty_remaining: 300, unit: 'g' },
      { resolved_canonical_food_id: 3, qty_remaining: 0.5, unit: 'kg' }, // 500 g
    ]
    const m = aggregateStockByCanonical(lots, META)
    expect(m.get(3)).toEqual({ qtyBase: 800, unitClass: 'mass', present: true })
  })

  it('convertit count → masse via grams_per_unit puis somme', () => {
    // œufs : 3 u, 60 g/u → la classe suit le 1er lot (count) ; on garde count.
    const lots = [{ resolved_canonical_food_id: 2, qty_remaining: 3, unit: 'u' }]
    const m = aggregateStockByCanonical(lots, META)
    expect(m.get(2)).toEqual({ qtyBase: 3, unitClass: 'count', present: true })
  })

  it('mappe un lot par archetype vers son canonical', () => {
    const lots = [{ resolved_archetype_id: 500, qty_remaining: 400, unit: 'g' }]
    const m = aggregateStockByCanonical(lots, META, new Map([[500, 1]]))
    expect(m.get(1)).toEqual({ qtyBase: 400, unitClass: 'mass', present: true })
  })

  it('garde la présence avec qtyBase=Infinity si l’unité est inconnue', () => {
    const lots = [{ resolved_canonical_food_id: 4, qty_remaining: 1, unit: 'botte' }]
    const m = aggregateStockByCanonical(lots, META)
    expect(m.get(4).present).toBe(true)
    expect(m.get(4).qtyBase).toBe(Infinity)
  })

  it('ignore les lots sans canonical ni archetype résoluble', () => {
    const lots = [{ qty_remaining: 100, unit: 'g' }]
    const m = aggregateStockByCanonical(lots, META)
    expect(m.size).toBe(0)
  })
})

// ───────────────────────── matchGeneratedRecipe ─────────────────────────

describe('matchGeneratedRecipe', () => {
  const recipes = [
    { id: 1, name_normalized: 'poulet-roti-aux-herbes', title: 'Poulet rôti aux herbes' },
    { id: 2, name_normalized: 'riz-cantonais', title: 'Riz cantonais' },
    { id: 3, name_normalized: 'salade-verte', title: 'Salade verte' },
  ]

  it('matche sur ≥ 2 tokens communs', () => {
    const hit = matchGeneratedRecipe('Poulet rôti aux herbes de Provence', recipes)
    expect(hit?.id).toBe(1)
  })

  it('retourne null si < 2 tokens communs', () => {
    expect(matchGeneratedRecipe('Riz pilaf', recipes)).toBeNull()
  })

  it('retourne null pour une description vide', () => {
    expect(matchGeneratedRecipe('', recipes)).toBeNull()
  })
})

// ───────────────────────── computeDishCoverage ─────────────────────────

describe('computeDishCoverage', () => {
  it('full : tous les ingrédients principaux couverts', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 1, qty_remaining: 500, unit: 'g' },
      { resolved_canonical_food_id: 3, qty_remaining: 400, unit: 'g' },
    ], META)
    const res = computeDishCoverage(
      [ing('poulet', 200, 'g', 1), ing('riz', 300, 'g', 3)],
      ctx(stock),
    )
    expect(res.status).toBe('full')
    expect(res).toMatchObject({ have: 2, need: 2, missing: [], staplesMissing: [] })
  })

  it('partial : un ingrédient présent, un absent', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 1, qty_remaining: 500, unit: 'g' },
    ], META)
    const res = computeDishCoverage(
      [ing('poulet', 200, 'g', 1), ing('riz', 300, 'g', 3)],
      ctx(stock),
    )
    expect(res.status).toBe('partial')
    expect(res.have).toBe(1)
    expect(res.need).toBe(2)
    expect(res.missing).toEqual(['riz'])
  })

  it('none : aucun ingrédient principal couvert', () => {
    const stock = aggregateStockByCanonical([], META)
    const res = computeDishCoverage(
      [ing('poulet', 200, 'g', 1), ing('riz', 300, 'g', 3)],
      ctx(stock),
    )
    expect(res.status).toBe('none')
    expect(res).toMatchObject({ have: 0, need: 2 })
    expect(res.missing).toEqual(['poulet', 'riz'])
  })

  it('exclut les staples du calcul de statut (par catégorie)', () => {
    // huile (cat 99 = staple) absente ; poulet présent → full quand même.
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 1, qty_remaining: 500, unit: 'g' },
    ], META)
    const res = computeDishCoverage(
      [ing('poulet', 200, 'g', 1), ing('huile olive', 10, 'ml', 5)],
      ctx(stock),
    )
    expect(res.status).toBe('full')
    expect(res.need).toBe(1)
    expect(res.have).toBe(1)
    expect(res.staplesMissing).toEqual(['huile olive'])
  })

  it('exclut les staples par nom (sel) et plat 100 % staples = full', () => {
    const stock = aggregateStockByCanonical([], META)
    const res = computeDishCoverage(
      [ing('sel', 5, 'g', 7), ing('huile olive', 10, 'ml', 5)],
      ctx(stock),
    )
    expect(res.status).toBe('full') // 0 ingrédient principal
    expect(res.need).toBe(0)
    expect(res.staplesMissing.sort()).toEqual(['huile olive', 'sel'])
  })

  it('tolérance 15 % : besoin 100 g, stock 90 g → couvert', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 3, qty_remaining: 90, unit: 'g' },
    ], META)
    const res = computeDishCoverage([ing('riz', 100, 'g', 3)], ctx(stock))
    expect(res.status).toBe('full')
  })

  it('hors tolérance : besoin 100 g, stock 80 g → manquant', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 3, qty_remaining: 80, unit: 'g' },
    ], META)
    const res = computeDishCoverage([ing('riz', 100, 'g', 3)], ctx(stock))
    expect(res.status).toBe('none')
    expect(res.missing).toEqual(['riz'])
  })

  it('conversion d’unités : besoin en kg, stock en g', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 3, qty_remaining: 1200, unit: 'g' },
    ], META)
    const res = computeDishCoverage([ing('riz', 1, 'kg', 3)], ctx(stock))
    expect(res.status).toBe('full') // 1200 g ≥ 1000 g
  })

  it('conversion count : besoin 3 œufs (count) vs stock 3 u → couvert', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 2, qty_remaining: 3, unit: 'u' },
    ], META)
    const res = computeDishCoverage([ing('oeufs', 3, 'u', 2)], ctx(stock))
    expect(res.status).toBe('full')
  })

  it('count insuffisant : besoin 6 œufs vs stock 3 u → manquant', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 2, qty_remaining: 3, unit: 'u' },
    ], META)
    const res = computeDishCoverage([ing('oeufs', 6, 'u', 2)], ctx(stock))
    expect(res.status).toBe('none')
  })

  it('quantity null → la présence suffit', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 4, qty_remaining: 50, unit: 'g' },
    ], META)
    const res = computeDishCoverage([ing('brocoli', null, null, 4)], ctx(stock))
    expect(res.status).toBe('full')
  })

  it('unité non comparable (besoin en u, stock en masse) → présence suffit', () => {
    // riz en stock en grammes (mass) ; besoin exprimé en « u » (count).
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 3, qty_remaining: 10, unit: 'g' },
    ], META)
    const res = computeDishCoverage([ing('riz', 2, 'u', 3)], ctx(stock))
    expect(res.status).toBe('full')
  })

  it('stock avec unité inconnue (qtyBase=Infinity) → ne bloque pas sur la quantité', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 4, qty_remaining: 1, unit: 'botte' },
    ], META)
    const res = computeDishCoverage([ing('brocoli', 300, 'g', 4)], ctx(stock))
    expect(res.status).toBe('full')
  })

  it('mappe un ingrédient lié par archetype_id vers son canonical', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 1, qty_remaining: 500, unit: 'g' },
    ], META)
    const res = computeDishCoverage([ing('poulet', 200, 'g', null, 500)], ctx(stock))
    expect(res.status).toBe('full')
  })

  it('ignore les ingrédients non résolubles (sans canonical ni archetype)', () => {
    const stock = aggregateStockByCanonical([
      { resolved_canonical_food_id: 1, qty_remaining: 500, unit: 'g' },
    ], META)
    const res = computeDishCoverage(
      [ing('poulet', 200, 'g', 1), ing('mystère', 50, 'g', null)],
      ctx(stock),
    )
    expect(res.need).toBe(1)
    expect(res.status).toBe('full')
  })

  it('tronque missing à 6 entrées', () => {
    const stock = aggregateStockByCanonical([], META)
    const many = Array.from({ length: 10 }, (_, i) => ing(`ing-${i}`, 100, 'g', 3))
    const res = computeDishCoverage(many, ctx(stock))
    expect(res.missing.length).toBe(6)
    expect(res.need).toBe(10)
  })
})
