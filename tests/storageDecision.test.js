import { describe, expect, it } from 'vitest'
import {
  addDaysUtc,
  decideStorage,
  normalizeStorageDays,
} from '@/lib/storageDecision'

const PINTADE = {
  id: 8012,
  canonical_name: 'pintade',
  shelf_life_days_pantry: 0,
  shelf_life_days_fridge: 2,
  shelf_life_days_freezer: 365,
}

describe('decideStorage', () => {
  it('range une pintade fraîche au frigo pendant 2 jours', () => {
    const decision = decideStorage({
      name: 'Suprêmes de pintade',
      category: 'Viandes et poissons',
      canonical: PINTADE,
      acquiredOn: '2026-07-13',
    })

    expect(decision.valid).toBe(true)
    expect(decision.method).toBe('fridge')
    expect(decision.place).toBe('Frigo')
    expect(decision.shelfLifeDays).toBe(2)
    expect(decision.expirationDate).toBe('2026-07-15')
    expect(decision.expirationSource).toBe('canonical_catalog')
    expect(decision.requiresConfirmation).toBe(false)
    expect(decision.forbiddenMethods).toContain('pantry')
  })

  it('ne choisit le congélateur que pour une pintade achetée surgelée', () => {
    const decision = decideStorage({
      name: 'Pintade surgelée',
      category: 'Surgelés',
      canonical: PINTADE,
      acquiredOn: '2026-07-13',
    })

    expect(decision.method).toBe('freezer')
    expect(decision.shelfLifeDays).toBe(365)
    expect(decision.expirationDate).toBe('2027-07-13')
    expect(decision.storageSource).toBe('purchase_state')
  })

  it('refuse explicitement le garde-manger pour une volaille fraîche', () => {
    const decision = decideStorage({
      name: 'Pintade',
      canonical: PINTADE,
      explicitStorageMethod: 'pantry',
      acquiredOn: '2026-07-13',
    })

    expect(decision.valid).toBe(false)
    expect(decision.error).toMatch(/interdit/i)
  })

  it("fait toujours primer la DLC de l'emballage", () => {
    const decision = decideStorage({
      name: 'Pintade',
      canonical: PINTADE,
      labelUseByDate: '2026-07-14',
      acquiredOn: '2026-07-13',
    })

    expect(decision.expirationDate).toBe('2026-07-14')
    expect(decision.expirationSource).toBe('label_use_by')
    expect(decision.expiryKind).toBe('DLC')
  })

  it("ne transforme pas un lieu inconnu en garde-manger pendant 90 jours", () => {
    const decision = decideStorage({
      name: 'Produit mystère',
      acquiredOn: '2026-07-13',
    })

    expect(decision.valid).toBe(true)
    expect(decision.method).toBeNull()
    expect(decision.expirationDate).toBeNull()
    expect(decision.requiresConfirmation).toBe(true)
  })

  it('accepte un produit clairement stable au garde-manger', () => {
    const decision = decideStorage({
      name: 'Riz basmati',
      category: 'Épicerie',
      acquiredOn: '2026-07-13',
    })

    expect(decision.method).toBe('pantry')
    expect(decision.shelfLifeDays).toBe(365)
    expect(decision.expirationDate).toBe('2027-07-13')
  })

  it('préfère une politique vérifiée aux champs historiques', () => {
    const decision = decideStorage({
      name: 'Pintade',
      canonical: PINTADE,
      acquiredOn: '2026-07-13',
      policies: [{
        canonical_food_id: 8012,
        food_state: 'raw',
        purchase_state: 'any',
        storage_method: 'fridge',
        suitability: 'recommended',
        duration_days: 2,
        confidence: 0.99,
        policy_version: 'test-policy',
        reason: 'Règle test',
        active: true,
      }],
    })

    expect(decision.storageSource).toBe('storage_policy')
    expect(decision.policyVersion).toBe('test-policy')
    expect(decision.reason).toBe('Règle test')
  })

  it("n'applique pas une politique de volaille crue à un produit transformé", () => {
    const rawPoultryPolicy = {
      canonical_food_id: 2054,
      food_state: 'raw',
      purchase_state: 'any',
      storage_method: 'fridge',
      suitability: 'recommended',
      duration_days: 2,
      confidence: 0.99,
      active: true,
    }
    const decision = decideStorage({
      name: 'Bouillon cube de volaille',
      category: 'Épicerie',
      foodState: 'unknown',
      archetype: {
        shelf_life_days_pantry: 730,
        shelf_life_days_fridge: null,
        shelf_life_days_freezer: null,
      },
      canonical: {
        shelf_life_days_pantry: 0,
        shelf_life_days_fridge: 2,
        shelf_life_days_freezer: 365,
      },
      policies: [rawPoultryPolicy],
      acquiredOn: '2026-07-13',
    })

    expect(decision.method).toBe('pantry')
    expect(decision.shelfLifeDays).toBe(730)
  })
})

describe('storage date helpers', () => {
  it('conserve zéro comme valeur explicite et null comme inconnu', () => {
    expect(normalizeStorageDays(0)).toBe(0)
    expect(normalizeStorageDays(null)).toBeNull()
  })

  it('ajoute les jours en UTC, y compris au changement de mois', () => {
    expect(addDaysUtc('2026-07-31', 2)).toBe('2026-08-02')
  })
})
