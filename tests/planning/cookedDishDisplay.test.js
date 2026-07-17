import { describe, expect, it } from 'vitest'
import { isDishExpired, pickDisplayedCookedDish } from '@/lib/domain/planning/cookedDishDisplay'

// MAJOR 3 : un plat expiré et un plat frais recuit peuvent partager le même
// batch_recipe_id (P0-3). La page batch doit afficher le frais le plus récent ;
// si seuls des expirés existent → état « Périmé — à retirer ».

const TODAY = '2026-07-17'

describe('isDishExpired — DLC en UTC', () => {
  it('expiré = date strictement antérieure à aujourd’hui ; null et aujourd’hui = non expiré', () => {
    expect(isDishExpired('2026-07-16', TODAY)).toBe(true)
    expect(isDishExpired('2026-07-17', TODAY)).toBe(false) // DLC du jour : consommable
    expect(isDishExpired('2026-07-18', TODAY)).toBe(false)
    expect(isDishExpired(null, TODAY)).toBe(false) // legacy sans DLC
    expect(isDishExpired(undefined, TODAY)).toBe(false)
    expect(isDishExpired('2026-07-16T00:00:00Z', TODAY)).toBe(true) // timestamp toléré
  })
})

describe('pickDisplayedCookedDish — préférence du frais', () => {
  const expired = { id: 'ex', expiration_date: '2026-07-10', cooked_at: '2026-07-06T10:00:00Z' }
  const freshOld = { id: 'f1', expiration_date: '2026-07-20', cooked_at: '2026-07-15T10:00:00Z' }
  const freshNew = { id: 'f2', expiration_date: '2026-07-21', cooked_at: '2026-07-16T10:00:00Z' }

  it('préfère le plat NON expiré le plus récent, même si l’expiré arrive en premier', () => {
    expect(pickDisplayedCookedDish([expired, freshOld, freshNew], TODAY)?.id).toBe('f2')
    expect(pickDisplayedCookedDish([freshNew, freshOld, expired], TODAY)?.id).toBe('f2')
  })

  it('si seuls des expirés existent → l’expiré le plus récent (à retirer)', () => {
    const olderExpired = { id: 'ex0', expiration_date: '2026-07-08', cooked_at: '2026-07-04T10:00:00Z' }
    expect(pickDisplayedCookedDish([olderExpired, expired], TODAY)?.id).toBe('ex')
  })

  it('DLC null = non expiré → éligible comme plat frais', () => {
    const legacy = { id: 'nul', expiration_date: null, cooked_at: '2026-07-14T10:00:00Z' }
    expect(pickDisplayedCookedDish([expired, legacy], TODAY)?.id).toBe('nul')
  })

  it('liste vide ou entrées nulles → null', () => {
    expect(pickDisplayedCookedDish([], TODAY)).toBeNull()
    expect(pickDisplayedCookedDish([null, undefined], TODAY)).toBeNull()
  })
})
