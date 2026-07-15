import { describe, it, expect } from 'vitest'
import {
  activeInventoryLots,
  computeRecipeAvailability,
  availabilityStatusOf,
  recipeCatalogSourcePolicy,
} from '@/app/api/recipes/catalog/route'

// ── Helpers ──────────────────────────────────────────────────────────────────

const nameOf = (ing) =>
  ing.canonical_food_id ? `Canonique ${ing.canonical_food_id}` : `Archetype ${ing.archetype_id}`

// "now" fixe pour des calculs de jours déterministes
const NOW = new Date('2026-07-10T00:00:00Z')

function inDays(n) {
  return new Date(NOW.getTime() + n * 86400000).toISOString()
}

function recipe(linked, { prep = 0, cook = 0 } = {}) {
  return { key: 'gen-1', prep_min: prep, cook_min: cook, linked_ingredients: linked }
}

// ── availabilityStatusOf ─────────────────────────────────────────────────────

describe('availabilityStatusOf', () => {
  it('verrouille le catalogue principal sur le corpus V3 opérationnel', () => {
    expect(recipeCatalogSourcePolicy).toBe('v3_editorial_complete')
  })

  it('retourne manque si pas de statut ou pas d\'ingrédients liés', () => {
    expect(availabilityStatusOf(null)).toBe('manque')
    expect(availabilityStatusOf({ total: 0, missing: 0, urgent: 0 })).toBe('manque')
  })

  it('priorise anti-gaspi sur cuisinable (urgent > 0)', () => {
    expect(availabilityStatusOf({ total: 3, missing: 0, urgent: 1 })).toBe('anti-gaspi')
  })

  it('cuisinable quand rien ne manque, presque à 1-2 manquants, manque au-delà', () => {
    expect(availabilityStatusOf({ total: 3, missing: 0, urgent: 0 })).toBe('cuisinable')
    expect(availabilityStatusOf({ total: 4, missing: 2, urgent: 0 })).toBe('presque')
    expect(availabilityStatusOf({ total: 5, missing: 3, urgent: 0 })).toBe('manque')
  })
})

// ── computeRecipeAvailability ────────────────────────────────────────────────

describe('computeRecipeAvailability', () => {
  it('recette sans ingrédient lié → statut vide (total 0, score 0)', () => {
    const s = computeRecipeAvailability(recipe([]), [], {}, nameOf, NOW)
    expect(s).toEqual({
      total: 0, available: 0, missing: 0, missingNames: [], urgent: 0,
      expiringName: null, expiringDays: null, percent: 0, mykoScore: 0,
    })
  })

  it('match canonique direct, stock suffisant → disponible', () => {
    const linked = [{ canonical_food_id: 1, quantity: 200, unit: 'g' }]
    const inv = [{ canonical_food_id: 1, archetype_id: null, qty_remaining: 500, unit: 'g', expiration_date: inDays(30) }]
    const s = computeRecipeAvailability(recipe(linked), inv, {}, nameOf, NOW)
    expect(s.available).toBe(1)
    expect(s.missing).toBe(0)
    expect(s.urgent).toBe(0)
    expect(s.percent).toBe(100)
  })

  it('somme multi-lots avec conversion d\'unités (kg → g)', () => {
    const linked = [{ canonical_food_id: 1, quantity: 1500, unit: 'g' }]
    const inv = [
      { canonical_food_id: 1, qty_remaining: 1, unit: 'kg', expiration_date: inDays(30) },
      { canonical_food_id: 1, qty_remaining: 600, unit: 'g', expiration_date: inDays(30) },
    ]
    const s = computeRecipeAvailability(recipe(linked), inv, {}, nameOf, NOW)
    expect(s.available).toBe(1) // 1000 g + 600 g >= 1500 g
  })

  it('exclut un lot inconvertible de la somme (u → g sans meta)', () => {
    const linked = [{ canonical_food_id: 1, quantity: 100, unit: 'g' }]
    const inv = [{ canonical_food_id: 1, qty_remaining: 5, unit: 'u', expiration_date: inDays(30) }]
    const s = computeRecipeAvailability(recipe(linked), inv, {}, nameOf, NOW)
    expect(s.available).toBe(0)
    expect(s.missing).toBe(1)
    expect(s.missingNames).toEqual(['Canonique 1'])
  })

  it('matche un lot archétype à un ingrédient canonique via le mapping', () => {
    const linked = [{ canonical_food_id: 7, quantity: 2, unit: 'u' }]
    const inv = [{ canonical_food_id: null, archetype_id: 42, qty_remaining: 3, unit: 'u', expiration_date: inDays(30) }]
    const s = computeRecipeAvailability(recipe(linked), inv, { 42: 7 }, nameOf, NOW)
    expect(s.available).toBe(1)
  })

  it('marque urgent (J-7) le lot qui expire et remonte le plus proche', () => {
    const linked = [
      { canonical_food_id: 1, quantity: 1, unit: 'u' },
      { canonical_food_id: 2, quantity: 1, unit: 'u' },
    ]
    const inv = [
      { canonical_food_id: 1, qty_remaining: 2, unit: 'u', expiration_date: inDays(5) },
      { canonical_food_id: 2, qty_remaining: 2, unit: 'u', expiration_date: inDays(3) },
    ]
    const s = computeRecipeAvailability(recipe(linked), inv, {}, nameOf, NOW)
    expect(s.urgent).toBe(2)
    expect(s.expiringDays).toBe(3)
    expect(s.expiringName).toBe('Canonique 2')
    expect(availabilityStatusOf(s)).toBe('anti-gaspi')
  })

  it('quantité par défaut = 1 quand l\'ingrédient n\'a pas de quantité', () => {
    const linked = [{ canonical_food_id: 1, unit: 'u' }]
    const inv = [{ canonical_food_id: 1, qty_remaining: 1, unit: 'u', expiration_date: inDays(30) }]
    const s = computeRecipeAvailability(recipe(linked), inv, {}, nameOf, NOW)
    expect(s.available).toBe(1)
  })

  it('ignore les ingrédients facultatifs dans le calcul des manquants', () => {
    const linked = [
      { canonical_food_id: 1, quantity: 1, unit: 'u' },
      { canonical_food_id: 2, quantity: 1, unit: 'u', optional: true },
    ]
    const inv = [{ canonical_food_id: 1, qty_remaining: 1, unit: 'u', expiration_date: inDays(30) }]
    const s = computeRecipeAvailability(recipe(linked), inv, {}, nameOf, NOW)
    expect(s.total).toBe(1)
    expect(s.missing).toBe(0)
    expect(s.missingNames).toEqual([])
  })

  it('mykoScore : formule identique au client (percent, urgent, bonus temps)', () => {
    const linked = [{ canonical_food_id: 1, quantity: 1, unit: 'u' }]
    const inv = [{ canonical_food_id: 1, qty_remaining: 2, unit: 'u', expiration_date: inDays(30) }]
    // percent 100, urgent 0, temps 30 min → 60 + 0 + (10 - 30/120*10) = 67.5 → 68
    const s = computeRecipeAvailability(recipe(linked, { prep: 10, cook: 20 }), inv, {}, nameOf, NOW)
    expect(s.mykoScore).toBe(68)
    // sans temps renseigné → bonus forfaitaire 5 → 65
    const s2 = computeRecipeAvailability(recipe(linked), inv, {}, nameOf, NOW)
    expect(s2.mykoScore).toBe(65)
  })
})

describe('activeInventoryLots', () => {
  it('garde les lots sans date et retire ceux dont la date effective est passée', () => {
    const lots = activeInventoryLots([
      { id: 'sans-date', expiration_date: null },
      { id: 'futur', expiration_date: '2026-07-20' },
      { id: 'expire', expiration_date: '2026-07-09' },
      { id: 'ouvert-expire', expiration_date: '2026-07-20', adjusted_expiration_date: '2026-07-09' },
    ], NOW)

    expect(lots.map((lot) => lot.id)).toEqual(['sans-date', 'futur'])
  })
})
