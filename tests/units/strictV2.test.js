import { describe, it, expect } from 'vitest'
import { toGramsV2 } from '@/lib/domain/units'

describe('toGramsV2 — conversion stricte V2 (aucun repli inventé)', () => {
  it('masses connues → résolues', () => {
    expect(toGramsV2(200, 'g')).toEqual({ ok: true, grams: 200, reason: null })
    expect(toGramsV2(1, 'kg')).toEqual({ ok: true, grams: 1000, reason: null })
    expect(toGramsV2(5, 'mg')).toEqual({ ok: true, grams: 0.005, reason: null })
  })

  it('pièce sans poids connu → NON résolu (jamais 100 g)', () => {
    expect(toGramsV2(3, 'pièce', {})).toEqual({ ok: false, grams: null, reason: 'missing_unit_weight' })
    expect(toGramsV2(3, 'pièce', { unit_weight_grams: 120 })).toEqual({ ok: true, grams: 360, reason: null })
  })

  it('volume sans densité → NON résolu (jamais densité 1)', () => {
    expect(toGramsV2(100, 'ml', {})).toEqual({ ok: false, grams: null, reason: 'missing_density' })
    expect(toGramsV2(100, 'ml', { density_g_per_ml: 1.03 })).toMatchObject({ ok: true, grams: 103 })
  })

  it('cuillère sans poids propre à l\'aliment → NON résolu (pas de 15/5 g universel)', () => {
    expect(toGramsV2(2, 'c. à soupe', {})).toEqual({ ok: false, grams: null, reason: 'spoon_needs_food_grams' })
    // huile vs persil : poids différents fournis par l'aliment
    expect(toGramsV2(1, 'cs', { spoon_grams: { cs: 13.5 } })).toMatchObject({ ok: true, grams: 13.5 })
    expect(toGramsV2(1, 'cc', { spoon_grams: { cc: 2 } })).toMatchObject({ ok: true, grams: 2 })
  })

  it('unité inconnue → erreur de données (jamais traitée comme des grammes)', () => {
    expect(toGramsV2(50, 'zzz')).toEqual({ ok: false, grams: null, reason: 'unknown_unit' })
  })

  it('quantité invalide → non résolu', () => {
    expect(toGramsV2('x', 'g')).toEqual({ ok: false, grams: null, reason: 'invalid_quantity' })
  })
})
