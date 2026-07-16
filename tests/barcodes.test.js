import { describe, expect, it } from 'vitest'
import { isValidGtin, normalizeBarcode } from '../lib/barcodes'

describe('barcodes', () => {
  it('normalise les espaces et tirets d’un EAN', () => {
    expect(normalizeBarcode('3 564-7070 87384')).toBe('3564707087384')
  })

  it('valide les chiffres de contrôle GTIN connus', () => {
    expect(isValidGtin('3564707087384')).toBe(true)
    expect(isValidGtin('3302740101076')).toBe(true)
  })

  it('refuse un code tronqué ou modifié', () => {
    expect(isValidGtin('356470708738')).toBe(false)
    expect(isValidGtin('3564707087385')).toBe(false)
  })
})
