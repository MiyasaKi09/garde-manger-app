import { describe, expect, it } from 'vitest'
import { resolveInventoryDisplayName, sanitizeInventoryLabel } from '@/lib/inventoryDisplayName'

describe('inventory display identity', () => {
  it('keeps the exact shopping label above the generic canonical identity', () => {
    expect(resolveInventoryDisplayName({
      commercial_name: 'Pavé de saumon cru, sans peau',
      canonical_foods: { canonical_name: 'saumon' },
    })).toBe('Pavé de saumon cru, sans peau')

    expect(resolveInventoryDisplayName({
      commercial_name: 'Morue salée sèche',
      canonical_foods: { canonical_name: 'cabillaud' },
    })).toBe('Morue salée sèche')
  })

  it('prefers an exact archetype to its canonical parent', () => {
    expect(resolveInventoryDisplayName({
      archetypes: { name: 'filet de cabillaud' },
      canonical_foods: { canonical_name: 'cabillaud' },
    })).toBe('filet de cabillaud')
  })

  it('keeps the exact course label ready for inventory storage', () => {
    expect(sanitizeInventoryLabel('  Morue salée sèche  ')).toBe('Morue salée sèche')
    expect(sanitizeInventoryLabel('')).toBeNull()
  })
})
