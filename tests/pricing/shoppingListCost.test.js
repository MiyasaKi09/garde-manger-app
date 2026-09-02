import { describe, it, expect } from 'vitest'
import { computeShoppingListCost } from '@/lib/domain/pricing/shoppingListCost'
import { buildPriceIndex, INDEX_PRIX_VIDE } from '@/lib/domain/pricing/priceIndex'
import { entree, jeu } from './fixtures'

const index = buildPriceIndex([jeu({
  entries: [
    entree({ form: 'Huile d\'olive vierge extra', formNormalized: 'huile d olive vierge extra', low: 10, central: 10, high: 10 }),
    entree({ form: 'Sel fin', formNormalized: 'sel fin', low: 1, central: 2, high: 3 }),
    entree({ form: 'Farine de blé T55', formNormalized: 'farine de ble t55', low: 1, central: 1, high: 1 }),
    entree({
      form: 'Œuf cru',
      formNormalized: 'oeuf cru',
      basis: 'piece',
      low: 5,
      central: 5,
      high: 5,
      conversion: { kind: 'grams_per_piece', factor: 50, from: 'catalog:oeuf cru' },
    }),
  ],
})])

/**
 * Item au format exact de `shoppingItemFromRequirement` (finalDemands.js) :
 * une bouteille d'huile de 1 kg achetée pour un besoin de 230 g.
 */
const bouteilleHuile = {
  product_name: 'Huile d\'olive vierge extra',
  category: 'Épicerie',
  purchase_unit: 'g',
  exact_required_qty: 230,
  purchase_qty: 1000,
  projected_surplus_qty: 770,
  container_qty: 1,
  container_size: 1000,
  container_unit: 'g',
  display_quantity: '1 contenant de 1000 g',
}

describe('computeShoppingListCost — on n\'achète pas 230 g d\'huile, on achète une bouteille', () => {
  const resultat = computeShoppingListCost([bouteilleHuile], index)

  it('chiffre le CONTENANT, pas le besoin', () => {
    // 1 kg × 10 €/kg = 10 €, quand le besoin réel n'en vaut que 2,30 €.
    expect(resultat.coutAchat.central).toBeCloseTo(10, 9)
  })

  it('chiffre séparément ce que les plats emploieront', () => {
    expect(resultat.coutConsomme.central).toBeCloseTo(2.3, 9)
  })

  it('rend visible le surplus qui rejoint le garde-manger', () => {
    expect(resultat.surplus.central).toBeCloseTo(7.7, 9)
  })

  it('garde les trois montants additifs AU CENTRE', () => {
    expect(resultat.coutAchat.central).toBeCloseTo(resultat.coutConsomme.central + resultat.surplus.central, 9)
  })

  it('ne rend PAS les bornes additives, et c\'est correct', () => {
    // Chaque agrégat compose sa PROPRE quadrature sur ses propres lignes, et
    // ‖a+b‖₂ ≤ ‖a‖₂ + ‖b‖₂ : la fourchette d'achat est plus serrée que la somme
    // des fourchettes « consommé » et « surplus ». Une interface qui vérifierait
    // l'additivité des bornes trouverait un écart qui n'est pas une erreur.
    // (L'égalité tient dans le cas dégénéré où toutes les lignes ont le même
    // rapport surplus/besoin — d'où deux rapports différents ici, 4 et 0,25.)
    const disperse = buildPriceIndex([jeu({
      entries: [
        entree({ formNormalized: 'sel fin', low: 1.6, central: 2, high: 2.4 }),
        entree({ formNormalized: 'farine de ble t55', low: 1.6, central: 2, high: 2.4 }),
      ],
    })])
    const multi = computeShoppingListCost([
      { product_name: 'Sel fin', purchase_unit: 'g', exact_required_qty: 100, purchase_qty: 500, projected_surplus_qty: 400 },
      { product_name: 'Farine de blé T55', purchase_unit: 'g', exact_required_qty: 800, purchase_qty: 1000, projected_surplus_qty: 200 },
    ], disperse)
    expect(multi.coutAchat.central).toBeCloseTo(multi.coutConsomme.central + multi.surplus.central, 9)
    expect(multi.coutAchat.low).toBeGreaterThan(multi.coutConsomme.low + multi.surplus.low)
    expect(multi.coutAchat.high).toBeLessThan(multi.coutConsomme.high + multi.surplus.high)
  })
})

describe('computeShoppingListCost — la jointure des lignes', () => {
  it('joint par form_normalized quand la ligne le porte', () => {
    const r = computeShoppingListCost([{ ...bouteilleHuile, form_normalized: 'huile d olive vierge extra' }], index)
    expect(r.lines[0].joinedBy).toBe('form_normalized')
    expect(r.lines[0].priced).toBe(true)
  })

  it('se rabat sur le libellé, qui ne peut produire qu\'une correspondance exacte', () => {
    const r = computeShoppingListCost([bouteilleHuile], index)
    expect(r.lines[0].joinedBy).toBe('product_name_normalized')
    expect(r.lines[0].priced).toBe(true)
  })

  it('ne rapproche jamais deux aliments voisins par le libellé', () => {
    const r = computeShoppingListCost([{ ...bouteilleHuile, product_name: 'Huile d\'olive' }], index)
    expect(r.lines[0].priced).toBe(false)
    expect(r.lines[0].reason).toBe('forme_non_couverte')
  })

  it('refuse une ligne sans forme identifiable au lieu d\'en deviner une', () => {
    const r = computeShoppingListCost([{ purchase_unit: 'g', purchase_qty: 500 }], index)
    expect(r.lines[0].reason).toBe('forme_absente_de_la_ligne')
  })
})

describe('computeShoppingListCost — la conversion vers les grammes', () => {
  it('convertit une ligne à la pièce par le facteur que l\'entrée recopie du catalogue', () => {
    // 12 œufs × 50 g = 600 g ; 0,6 kg × 5 €/kg = 3 €.
    const r = computeShoppingListCost([{
      product_name: 'Œuf cru',
      purchase_unit: 'u',
      purchase_qty: 12,
      exact_required_qty: 8,
      projected_surplus_qty: 4,
    }], index)
    expect(r.lines[0].grams).toBeCloseTo(600, 9)
    expect(r.coutAchat.central).toBeCloseTo(3, 9)
  })

  it('préfère la métadonnée portée par la ligne au facteur du référentiel', () => {
    const r = computeShoppingListCost([{
      product_name: 'Œuf cru',
      purchase_unit: 'u',
      purchase_qty: 12,
      grams_per_unit: 60,
    }], index)
    expect(r.lines[0].grams).toBeCloseTo(720, 9)
  })

  it('refuse une ligne au litre sans densité connue — jamais densité 1,00', () => {
    // Supposer 1,00 sur une huile sous-estime de 8 %, et personne ne le verrait.
    const r = computeShoppingListCost([{ product_name: 'Sel fin', purchase_unit: 'l', purchase_qty: 1 }], index)
    expect(r.lines[0].priced).toBe(false)
    expect(r.lines[0].reason).toBe('masse_indeterminee:missing_density')
  })

  it('refuse une ligne à la pièce sans poids unitaire connu', () => {
    const r = computeShoppingListCost([{ product_name: 'Sel fin', purchase_unit: 'u', purchase_qty: 3 }], index)
    expect(r.lines[0].reason).toBe('masse_indeterminee:missing_unit_weight')
  })
})

describe('computeShoppingListCost — référentiel vide et partiel', () => {
  it('ne lève pas et n\'affiche rien sur un référentiel vide', () => {
    const r = computeShoppingListCost([bouteilleHuile], INDEX_PRIX_VIDE)
    expect(r.coutAchat).toBeNull()
    expect(r.displayable).toBe(false)
    expect(r.displayRefusal).toBe('aucune_ligne_chiffree')
  })

  it('ne lève pas sur une liste vide', () => {
    const r = computeShoppingListCost([], index)
    expect(r.coverage.pct).toBeNull()
    expect(r.displayRefusal).toBe('rien_de_quantifie')
  })

  it('chiffre ce qu\'il peut et nomme le reste', () => {
    const r = computeShoppingListCost([
      bouteilleHuile,
      { product_name: 'Safran en pistils', purchase_unit: 'g', purchase_qty: 2, exact_required_qty: 1, projected_surplus_qty: 1 },
    ], index)
    expect(r.coverage.priced).toBe(1)
    expect(r.coverage.unpriced).toEqual(['Safran en pistils'])
    expect(r.coutAchat.central).toBeCloseTo(10, 9)
  })

  it('mesure la couverture par la masse ACHETÉE, celle qu\'on paie', () => {
    const r = computeShoppingListCost([
      bouteilleHuile, // 1000 g chiffrés
      { product_name: 'Safran en pistils', purchase_unit: 'g', purchase_qty: 2 }, // 2 g non chiffrés
    ], index)
    expect(r.coverage.pctByMass).toBe(100) // 1000 / 1002 arrondi
    expect(r.coverage.pct).toBe(50)
  })
})

describe('computeShoppingListCost — le rendement comestible', () => {
  it('majore la masse payée quand le rendement est sourcé', () => {
    const indexRendement = buildPriceIndex([jeu({
      entries: [entree({ formNormalized: 'sel fin', low: 2, central: 2, high: 2, yieldValue: 0.8, yieldKnown: true })],
    })])
    const r = computeShoppingListCost([{ product_name: 'Sel fin', purchase_unit: 'g', purchase_qty: 800 }], indexRendement)
    expect(r.lines[0].purchasedGrams).toBeCloseTo(1000, 9)
    expect(r.coutAchat.central).toBeCloseTo(2, 9)
  })

  it('signale le parage inconnu tant qu\'aucun rendement n\'est sourcé', () => {
    const r = computeShoppingListCost([bouteilleHuile], index)
    expect(r.parageInconnu).toBe(true)
    expect(r.minorant).toBe(true)
  })
})

describe('computeShoppingListCost — une liste réaliste', () => {
  const liste = [
    bouteilleHuile,
    { product_name: 'Farine de blé T55', purchase_unit: 'g', exact_required_qty: 350, purchase_qty: 500, projected_surplus_qty: 150, container_qty: 1, container_size: 500, container_unit: 'g' },
    { product_name: 'Sel fin', purchase_unit: 'g', exact_required_qty: 40, purchase_qty: 500, projected_surplus_qty: 460 },
    { product_name: 'Œuf cru', purchase_unit: 'u', exact_required_qty: 8, purchase_qty: 12, projected_surplus_qty: 4, container_qty: 2, container_size: 6, container_unit: 'u' },
  ]

  it('affiche un total quand la couverture le permet', () => {
    const r = computeShoppingListCost(liste, index)
    expect(r.displayable).toBe(true)
    expect(r.coverage.pct).toBe(100)
  })

  it('reste additif au centre sur toute la liste', () => {
    const r = computeShoppingListCost(liste, index)
    expect(r.coutAchat.central).toBeCloseTo(r.coutConsomme.central + r.surplus.central, 9)
  })

  it('paie toujours plus que ce qu\'on mange dès qu\'un contenant dépasse le besoin', () => {
    const r = computeShoppingListCost(liste, index)
    expect(r.coutAchat.central).toBeGreaterThan(r.coutConsomme.central)
    expect(r.surplus.central).toBeGreaterThan(0)
  })

  it('rend les montants arrondis selon le §7.2', () => {
    const r = computeShoppingListCost(liste, index)
    expect(r.coutAchatArrondi.central).toBeCloseTo(Math.round(r.coutAchat.central / 0.5) * 0.5, 9)
  })
})
