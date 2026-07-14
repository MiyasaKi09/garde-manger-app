import { describe, it, expect } from 'vitest'
import { getFlag, getFlags, FLAG_NAMES } from '@/lib/featureFlags'
import { assertHouseholdMember } from '@/lib/contracts/household'
import { assertTodayViewModel } from '@/lib/contracts/today'
import { ContractError } from '@/lib/domain/errors'

describe('featureFlags', () => {
  it('désactivé par défaut, actif sur 1/true/on', () => {
    expect(getFlag('MYKO_TODAY_V2', {})).toBe(false)
    expect(getFlag('MYKO_TODAY_V2', { MYKO_TODAY_V2: '1' })).toBe(true)
    expect(getFlag('MYKO_TODAY_V2', { MYKO_TODAY_V2: 'true' })).toBe(true)
    expect(getFlag('MYKO_TODAY_V2', { MYKO_TODAY_V2: 'ON' })).toBe(true)
    expect(getFlag('MYKO_TODAY_V2', { MYKO_TODAY_V2: 'off' })).toBe(false)
  })
  it('getFlags renvoie tous les flags connus', () => {
    const f = getFlags({})
    expect(Object.keys(f).sort()).toEqual([...FLAG_NAMES].sort())
    expect(Object.values(f).every(v => v === false)).toBe(true)
  })
})

describe('assertHouseholdMember', () => {
  it('accepte un membre valide', () => {
    expect(assertHouseholdMember({ id: 'x', name: 'Julien' })).toMatchObject({ id: 'x' })
  })
  it('rejette id/nom manquants', () => {
    expect(() => assertHouseholdMember({ name: 'Julien' })).toThrow(ContractError)
    expect(() => assertHouseholdMember({ id: 'x', name: '  ' })).toThrow(ContractError)
  })
})

describe('assertTodayViewModel', () => {
  const valid = {
    date: '2026-07-14', members: [], alerts: [], tasks: [], meals: [], leftovers: [],
    nutritionStatus: [], dataQuality: [], shopping: { requiredCount: 0, items: [] },
  }
  it('accepte un ViewModel conforme', () => {
    expect(assertTodayViewModel(valid)).toBe(valid)
  })
  it('rejette date manquante / champ non tableau / shopping invalide', () => {
    expect(() => assertTodayViewModel({ ...valid, date: '' })).toThrow(ContractError)
    expect(() => assertTodayViewModel({ ...valid, tasks: null })).toThrow(ContractError)
    expect(() => assertTodayViewModel({ ...valid, shopping: {} })).toThrow(ContractError)
  })
})
