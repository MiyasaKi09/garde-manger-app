import { describe, it, expect } from 'vitest'
import { parseIngredient, matchLeadingUnit, resolveIngredient } from '@/lib/ingredientResolver'

describe('parseIngredient — noms & unités', () => {
  it('ne tronque plus le dernier caractère d\'un comptage : « 3 courgettes »', () => {
    // Régression : l\'ancien parseur produisait « courgette s » + unit null.
    const r = parseIngredient('3 courgettes')
    expect(r).toMatchObject({ raw_name: 'courgettes', quantity: 3, unit: 'pièce' })
  })

  it('compte les bare counts en pièces : « 6 œufs »', () => {
    expect(parseIngredient('6 œufs')).toMatchObject({ quantity: 6, unit: 'pièce', raw_name: 'œufs' })
  })

  it('extrait une unité de masse collée : « 150 g chèvre frais »', () => {
    expect(parseIngredient('150 g chèvre frais')).toMatchObject({ quantity: 150, unit: 'g', raw_name: 'chèvre frais' })
  })

  it('normalise les cuillères abrégées : « 2 c.à.s huile d\'olive »', () => {
    expect(parseIngredient("2 c.à.s huile d'olive")).toMatchObject({ quantity: 2, unit: 'c. à soupe', raw_name: "huile d'olive" })
  })

  it('reconnaît « cuillères à soupe » en toutes lettres', () => {
    expect(parseIngredient('2 cuillères à soupe de crème')).toMatchObject({ quantity: 2, unit: 'c. à soupe', raw_name: 'crème' })
  })

  it('gère les contenants : « 1 rouleau de pâte feuilletée »', () => {
    expect(parseIngredient('1 rouleau de pâte feuilletée')).toMatchObject({ quantity: 1, unit: 'rouleau', raw_name: 'pâte feuilletée' })
  })

  it('ne confond pas une unité avec un aliment : « 1 gingembre » reste une pièce', () => {
    expect(parseIngredient('1 gingembre')).toMatchObject({ quantity: 1, unit: 'pièce', raw_name: 'gingembre' })
  })

  it('ne mord pas « cs/cas » dans un aliment : « 1 cassoulet »', () => {
    expect(parseIngredient('1 cassoulet')).toMatchObject({ quantity: 1, unit: 'pièce', raw_name: 'cassoulet' })
  })

  it('sans quantité ni unité, garde le nom tel quel', () => {
    expect(parseIngredient("huile d'olive")).toMatchObject({ quantity: null, unit: null, raw_name: "huile d'olive" })
  })

  it('normalise kg : « 1,5 kg pommes de terre »', () => {
    expect(parseIngredient('1,5 kg pommes de terre')).toMatchObject({ quantity: 1.5, unit: 'kg', raw_name: 'pommes de terre' })
  })

  it('forme objet : normalise une unité abrégée et compte en pièces si besoin', () => {
    expect(parseIngredient({ name: 'courgettes', quantity: 3, unit: null })).toMatchObject({ unit: 'pièce', quantity: 3 })
    expect(parseIngredient({ name: 'crème', quantity: 2, unit: 'càs' })).toMatchObject({ unit: 'c. à soupe', quantity: 2 })
  })
})

describe('matchLeadingUnit', () => {
  it('détecte une unité en tête et renvoie le reste', () => {
    expect(matchLeadingUnit('g chèvre frais')).toEqual({ unit: 'g', rest: 'chèvre frais' })
    expect(matchLeadingUnit('cl vin blanc')).toEqual({ unit: 'cl', rest: 'vin blanc' })
  })

  it('refuse une unité collée à une lettre (faux positif)', () => {
    expect(matchLeadingUnit('gingembre')).toBeNull()
    expect(matchLeadingUnit('clou de girofle')).toBeNull()
  })
})

describe('resolveIngredient — repli « espaces internes »', () => {
  // Catalogue minimal : un canonique « citron ».
  const candidates = [
    { canonical_food_id: 1, archetype_id: null, tier: 'canonical', labelTokens: ['citron'], specificity: 1, is_default: true },
  ]

  it('rattrape un nom coupé par un retour ligne : « citro n » → citron', () => {
    const r = resolveIngredient('citro n', { candidates, stock: null })
    expect(r.canonical_food_id).toBe(1)
    expect(r.match_status).not.toBe('unmatched')
  })
})
