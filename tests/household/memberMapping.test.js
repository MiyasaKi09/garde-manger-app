import { describe, it, expect } from 'vitest'
import { normalizeName, buildMemberIndex, resolveMemberId } from '@/lib/domain/household/memberMapping'

describe('normalizeName', () => {
  it('minuscule, sans accents, trim', () => {
    expect(normalizeName(' Julien ')).toBe('julien')
    expect(normalizeName('Zoé')).toBe('zoe')
    expect(normalizeName('JULIEN')).toBe('julien')
    expect(normalizeName('José')).toBe('jose')
  })
  it('gère null / undefined / non-string', () => {
    expect(normalizeName(null)).toBe('')
    expect(normalizeName(undefined)).toBe('')
    expect(normalizeName(42)).toBe('42')
  })
})

describe('buildMemberIndex + resolveMemberId', () => {
  const idx = buildMemberIndex([
    { normalized_name: 'julien', household_member_id: 'm1' },
    { normalized_name: 'zoe', household_member_id: 'm2' },
    { raw_name: 'Léa', household_member_id: 'm3' }, // sans normalized_name → normalisé à la volée
    { household_member_id: null }, // ignoré
  ])

  it('résout un person_name libre en id de membre', () => {
    expect(resolveMemberId('Julien', idx)).toBe('m1')
    expect(resolveMemberId(' ZOÉ ', idx)).toBe('m2')
    expect(resolveMemberId('lea', idx)).toBe('m3')
  })
  it('renvoie null pour un inconnu ou un index absent', () => {
    expect(resolveMemberId('Inconnu', idx)).toBe(null)
    expect(resolveMemberId('Julien', null)).toBe(null)
  })
})
