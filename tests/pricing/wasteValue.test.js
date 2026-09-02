import { describe, it, expect } from 'vitest'
import {
  computeWasteValue,
  computeWasteHistoryValue,
  dateEffective,
  ACTIONS_PERTE,
  SEUILS_ALERTE_JOURS,
} from '@/lib/domain/pricing/wasteValue'
import { buildPriceIndex, INDEX_PRIX_VIDE } from '@/lib/domain/pricing/priceIndex'
import { entree, jeu } from './fixtures'

const AUJOURDHUI = '2026-08-24'

const index = buildPriceIndex([jeu({
  entries: [
    entree({ form: 'Crème fraîche épaisse', formNormalized: 'creme fraiche epaisse', low: 4, central: 5, high: 6, category: 'produits_laitiers' }),
    entree({ form: 'Bœuf haché 5% cru', formNormalized: 'boeuf hache 5 cru', low: 12, central: 14, high: 16, category: 'viandes' }),
    entree({
      form: 'Huile d\'olive vierge extra',
      formNormalized: 'huile d olive vierge extra',
      basis: 'l',
      low: 10,
      central: 12,
      high: 14,
      conversion: { kind: 'density', factor: 0.92, from: 'catalog:huile d olive vierge extra' },
    }),
  ],
})])

describe('dateEffective — la date qui gouverne réellement le FEFO', () => {
  it('préfère la DLC ajustée à l\'ouverture', () => {
    expect(dateEffective({ adjusted_expiration_date: '2026-08-26', expiration_date: '2026-09-15' })).toBe('2026-08-26')
  })

  it('retombe sur la DLC d\'origine, puis sur la DDM', () => {
    expect(dateEffective({ expiration_date: '2026-09-15', best_before: '2026-12-01' })).toBe('2026-09-15')
    expect(dateEffective({ best_before: '2026-12-01' })).toBe('2026-12-01')
  })

  it('suit l\'allocateur et non la vue SQL, qui ignore best_before', () => {
    // Un lot que l'allocateur ordonne par sa DDM ne doit pas apparaître « sans
    // date » à la valorisation : le garde-manger à risque serait incohérent avec
    // l'ordre dans lequel on dit de consommer.
    expect(dateEffective({ best_before: '2026-08-25' })).toBe('2026-08-25')
  })

  it('rend null quand aucune date n\'existe', () => {
    expect(dateEffective({})).toBeNull()
  })
})

describe('computeWasteValue — le lot ENTAMÉ', () => {
  const potEntame = {
    id: 'lot-creme',
    canonical_name: 'Crème fraîche épaisse',
    qty_remaining: 180,
    unit: 'g',
    expiration_date: '2026-09-10',
    adjusted_expiration_date: '2026-08-26',
    is_opened: true,
    opened_at: '2026-08-20T10:00:00Z',
  }

  it('ne valorise que ce qui RESTE, jamais le contenant d\'origine', () => {
    const r = computeWasteValue([potEntame], index, { today: AUJOURDHUI })
    // 180 g × 5 €/kg = 0,90 €. Un pot de 500 g en vaudrait 2,50.
    expect(r.aRisque.range.central).toBeCloseTo(0.9, 9)
    expect(r.aRisque.lots[0].qtyRemaining).toBe(180)
  })

  it('ne reconstitue jamais la quantité initiale absente', () => {
    const r = computeWasteValue([{ ...potEntame, qty_remaining: null }], index, { today: AUJOURDHUI })
    expect(r.stock.lots[0].priced).toBe(false)
    expect(r.stock.lots[0].reason).toBe('masse_indeterminee:quantite_absente')
  })

  it('classe le lot par sa DLC AJUSTÉE, celle que l\'ouverture a raccourcie', () => {
    const r = computeWasteValue([potEntame], index, { today: AUJOURDHUI })
    expect(r.aRisque.count).toBe(1)
    expect(r.aRisque.lots[0].daysLeft).toBe(2)
    expect(r.aRisque.lots[0].dateShortenedByOpening).toBe(true)
    // Sans l'ajustement, la DLC d'origine le placerait à 17 jours, hors alerte.
    const nonOuvert = computeWasteValue([{ ...potEntame, adjusted_expiration_date: null, is_opened: false, opened_at: null }], index, { today: AUJOURDHUI })
    expect(nonOuvert.aRisque.count).toBe(0)
  })

  it('marque le lot comme ouvert même si seul opened_at est renseigné', () => {
    const r = computeWasteValue([{ ...potEntame, is_opened: false }], index, { today: AUJOURDHUI })
    expect(r.stock.lots[0].isOpened).toBe(true)
  })
})

describe('computeWasteValue — le rendement comestible NE s\'applique PAS à un lot', () => {
  it('valorise la masse physique du lot, sans division par le rendement', () => {
    // Un lot du garde-manger est déjà dans son état ACHETÉ : il porte sa peau et
    // son os. Diviser par le rendement gonflerait sa valeur sans qu'aucune masse
    // ne lui corresponde.
    const indexRendement = buildPriceIndex([jeu({
      entries: [entree({ formNormalized: 'oignon jaune cru', low: 2, central: 2, high: 2, yieldValue: 0.8, yieldKnown: true })],
    })])
    const r = computeWasteValue([{
      id: 'lot-oignon',
      canonical_name: 'Oignon jaune cru',
      qty_remaining: 800,
      unit: 'g',
      expiration_date: '2026-08-25',
    }], indexRendement, { today: AUJOURDHUI })
    // 800 g × 2 €/kg = 1,60 €. Avec le rendement appliqué à tort : 2,00 €.
    expect(r.aRisque.range.central).toBeCloseTo(1.6, 9)
  })
})

describe('computeWasteValue — les seuils d\'alerte', () => {
  const lot = (surcharge) => ({
    id: `lot-${surcharge.expiration_date}`,
    canonical_name: 'Bœuf haché 5% cru',
    qty_remaining: 500,
    unit: 'g',
    ...surcharge,
  })

  it('alerte une DLC à J-3 et une DDM à J-7 (CLAUDE.md)', () => {
    const dlc = computeWasteValue([lot({ expiration_date: '2026-08-29', expiry_kind: 'DLC' })], index, { today: AUJOURDHUI })
    expect(dlc.aRisque.count).toBe(0) // 5 jours > 3
    const ddm = computeWasteValue([lot({ expiration_date: '2026-08-29', expiry_kind: 'DDM' })], index, { today: AUJOURDHUI })
    expect(ddm.aRisque.count).toBe(1) // 5 jours ≤ 7
  })

  it('prend DLC par défaut : le seuil le plus strict', () => {
    const r = computeWasteValue([lot({ expiration_date: '2026-08-29' })], index, { today: AUJOURDHUI })
    expect(r.aRisque.count).toBe(0)
    expect(r.stock.lots[0].expiryKind).toBe('DLC')
  })

  it('sépare ce qui est déjà périmé de ce qui est encore sauvable', () => {
    const r = computeWasteValue([
      lot({ expiration_date: '2026-08-22' }), // périmé depuis 2 jours
      lot({ expiration_date: '2026-08-25' }), // demain
      lot({ expiration_date: '2027-01-01' }), // au loin
    ], index, { today: AUJOURDHUI })
    expect(r.perime.count).toBe(1)
    expect(r.aRisque.count).toBe(1)
    expect(r.stock.count).toBe(3)
    expect(r.perime.range.central).toBeCloseTo(7, 9) // 0,5 kg × 14 €/kg
    expect(r.aRisque.range.central).toBeCloseTo(7, 9)
  })

  it('exclut des deux catégories un lot sans date : il n\'est ni périmé ni imminent', () => {
    const r = computeWasteValue([lot({ expiration_date: null })], index, { today: AUJOURDHUI })
    expect(r.perime.count).toBe(0)
    expect(r.aRisque.count).toBe(0)
    expect(r.stock.count).toBe(1)
  })

  it('accepte des seuils surchargés', () => {
    const r = computeWasteValue([lot({ expiration_date: '2026-09-10' })], index, { today: AUJOURDHUI, seuils: { ...SEUILS_ALERTE_JOURS, DLC: 30 } })
    expect(r.aRisque.count).toBe(1)
  })

  it('compare les dates en UTC, sans décalage d\'un jour', () => {
    const r = computeWasteValue([lot({ expiration_date: AUJOURDHUI })], index, { today: AUJOURDHUI })
    expect(r.stock.lots[0].daysLeft).toBe(0)
    expect(r.perime.count).toBe(0) // périme aujourd'hui, pas hier
    expect(r.aRisque.count).toBe(1)
  })
})

describe('computeWasteValue — référentiel vide, partiel, forme absente', () => {
  const lots = [
    { id: 'a', canonical_name: 'Bœuf haché 5% cru', qty_remaining: 500, unit: 'g', expiration_date: '2026-08-25' },
    { id: 'b', canonical_name: 'Safran en pistils', qty_remaining: 2, unit: 'g', expiration_date: '2026-08-25' },
  ]

  it('ne lève pas et ne chiffre rien sur un référentiel vide', () => {
    const r = computeWasteValue(lots, INDEX_PRIX_VIDE, { today: AUJOURDHUI })
    expect(r.aRisque.range).toBeNull()
    expect(r.aRisque.displayable).toBe(false)
  })

  it('ne lève pas sur une liste de lots vide ou absente', () => {
    expect(() => computeWasteValue([], index, { today: AUJOURDHUI })).not.toThrow()
    expect(computeWasteValue(null, index, { today: AUJOURDHUI }).stock.count).toBe(0)
  })

  it('valorise ce qu\'il peut et motive le reste', () => {
    const r = computeWasteValue(lots, index, { today: AUJOURDHUI })
    expect(r.aRisque.coverage.priced).toBe(1)
    expect(r.aRisque.coverage.unpriced).toEqual(['Safran en pistils'])
    expect(r.aRisque.range.central).toBeCloseTo(7, 9)
  })

  it('refuse le TOTAL sous les seuils, mais garde la valeur de chaque lot', () => {
    // La valeur d'un lot est un nombre sourcé isolément, avec sa provenance :
    // la montrer est toujours honnête. C'est le total silencieux sur la moitié
    // de la masse qui trompe.
    const r = computeWasteValue([
      ...Array.from({ length: 3 }, (_, i) => ({ id: `a${i}`, canonical_name: 'Bœuf haché 5% cru', qty_remaining: 20, unit: 'g', expiration_date: '2026-08-25' })),
      { id: 'b', canonical_name: 'Safran en pistils', qty_remaining: 2000, unit: 'g', expiration_date: '2026-08-25' },
    ], index, { today: AUJOURDHUI })
    expect(r.aRisque.coverage.pct).toBe(75) // au-dessus du seuil de lignes…
    expect(r.aRisque.displayable).toBe(false)
    expect(r.aRisque.displayRefusal).toBe('couverture_masse_insuffisante')
    expect(r.aRisque.lots.find((l) => l.priced).range.central).toBeCloseTo(0.28, 9)
  })

  it('n\'affiche rien quand le référentiel est éteint', () => {
    const vieux = buildPriceIndex([jeu({ referenceDate: '2023-01-15', entries: [entree({ formNormalized: 'boeuf hache 5 cru', observedOn: '2023-01-10' })] })], { today: AUJOURDHUI })
    const r = computeWasteValue(lots, vieux, { today: AUJOURDHUI })
    expect(r.aRisque.displayRefusal).toBe('referentiel_perime')
  })
})

describe('computeWasteValue — la conversion des unités de lot', () => {
  it('convertit un lot en litres par la densité recopiée du catalogue', () => {
    const r = computeWasteValue([{
      id: 'lot-huile',
      canonical_name: 'Huile d\'olive vierge extra',
      qty_remaining: 0.25,
      unit: 'l',
      expiration_date: '2026-08-25',
    }], index, { today: AUJOURDHUI })
    // 0,25 L × 0,92 = 230 g ; le prix pivot est déjà en €/kg (12 ÷ 0,92 ≈ 13,04
    // dans un vrai référentiel) — ici le pivot fixture vaut 12 €/kg.
    expect(r.aRisque.lots[0].grams).toBeCloseTo(230, 9)
    expect(r.aRisque.range.central).toBeCloseTo(2.76, 9)
  })

  it('refuse un lot en litres sans densité connue plutôt que de supposer 1,00', () => {
    const r = computeWasteValue([{
      id: 'lot-creme',
      canonical_name: 'Crème fraîche épaisse',
      qty_remaining: 0.2,
      unit: 'l',
      expiration_date: '2026-08-25',
    }], index, { today: AUJOURDHUI })
    expect(r.stock.lots[0].priced).toBe(false)
    expect(r.stock.lots[0].reason).toBe('masse_indeterminee:missing_density')
  })

  it('accepte le kilogramme sans métadonnée', () => {
    const r = computeWasteValue([{
      id: 'lot-boeuf',
      canonical_name: 'Bœuf haché 5% cru',
      qty_remaining: 1.2,
      unit: 'kg',
      expiration_date: '2026-08-25',
    }], index, { today: AUJOURDHUI })
    expect(r.aRisque.range.central).toBeCloseTo(16.8, 9)
  })
})

describe('computeWasteValue — la fourchette', () => {
  it('compose les lots en quadrature, jamais en somme de bornes', () => {
    const lots = Array.from({ length: 4 }, (_, i) => ({
      id: `l${i}`,
      canonical_name: 'Bœuf haché 5% cru',
      qty_remaining: 1000,
      unit: 'g',
      expiration_date: '2026-08-25',
    }))
    const r = computeWasteValue(lots, index, { today: AUJOURDHUI })
    expect(r.aRisque.range.central).toBeCloseTo(56, 9) // 4 × 14 €
    // dᵢ = 2 € par lot → √(4 × 4) = 4 €, jamais 8 €.
    expect(r.aRisque.range.high - r.aRisque.range.central).toBeCloseTo(4, 9)
  })
})

describe('computeWasteHistoryValue — ce qui a été jeté sur une période', () => {
  const journal = [
    { lot_id: 'a', form_normalized: 'boeuf hache 5 cru', action: 'discarded', quantity: 500, unit: 'g', created_at: '2026-08-10T09:00:00Z', estimated_value_eur: 2.5 },
    { lot_id: 'b', form_normalized: 'creme fraiche epaisse', action: 'frozen', quantity: 200, unit: 'g', created_at: '2026-08-12T09:00:00Z', estimated_value_eur: 1 },
    { lot_id: 'c', form_normalized: 'boeuf hache 5 cru', action: 'composted', quantity: 300, unit: 'g', created_at: '2026-07-01T09:00:00Z', estimated_value_eur: 1.5 },
  ]

  it('sépare les pertes des sauvetages, sans les compenser', () => {
    const r = computeWasteHistoryValue(journal, index, { from: '2026-08-01', to: '2026-08-31' })
    expect(r.jete.count).toBe(1)
    expect(r.evite.count).toBe(1)
    expect(r.jete.range.central).toBeCloseTo(7, 9) // 0,5 kg × 14 €/kg
    expect(r.evite.range.central).toBeCloseTo(1, 9) // 0,2 kg × 5 €/kg
  })

  it('respecte les bornes de la période', () => {
    const r = computeWasteHistoryValue(journal, index, { from: '2026-07-01', to: '2026-07-31' })
    expect(r.jete.count).toBe(1)
    expect(r.jete.range.central).toBeCloseTo(4.2, 9) // 0,3 kg × 14 €/kg, le compost de juillet
  })

  it('ne relit JAMAIS estimated_value_eur — le champ de l\'estimation à 5 €/kg', () => {
    // Reprendre cette valeur reviendrait à blanchir un chiffre inventé en le
    // faisant passer par une base de données.
    const r = computeWasteHistoryValue(journal, index, { from: '2026-08-01', to: '2026-08-31' })
    expect(r.jete.range.central).not.toBeCloseTo(2.5, 2)
  })

  it('ne valorise pas une ligne dont le lot a été supprimé (lot_id à NULL)', () => {
    const r = computeWasteHistoryValue([
      { lot_id: null, action: 'discarded', quantity: 500, unit: 'g', created_at: '2026-08-10T09:00:00Z' },
    ], index, {})
    expect(r.jete.entries[0].priced).toBe(false)
    expect(r.jete.entries[0].reason).toBe('forme_absente_du_lot')
    expect(r.jete.range).toBeNull()
  })

  it('accepte une liste d\'actions de perte surchargée', () => {
    const r = computeWasteHistoryValue(journal, index, { actionsPerte: new Set(['frozen']) })
    expect(r.jete.count).toBe(1)
    expect(r.jete.entries[0].action).toBe('frozen')
  })

  it('classe le compostage en perte par défaut, mais laisse le choix ouvert', () => {
    expect(ACTIONS_PERTE.has('composted')).toBe(true)
    const r = computeWasteHistoryValue(journal, index, { actionsPerte: new Set(['discarded']) })
    expect(r.jete.count).toBe(1)
    expect(r.evite.count).toBe(2)
  })

  it('ignore une ligne sans date exploitable plutôt que de la dater d\'aujourd\'hui', () => {
    const r = computeWasteHistoryValue([{ action: 'discarded', quantity: 500, unit: 'g', created_at: null }], index, {})
    expect(r.jete.count).toBe(0)
  })

  it('ne lève pas sur un journal vide', () => {
    const r = computeWasteHistoryValue([], index, {})
    expect(r.jete.range).toBeNull()
    expect(r.jete.displayRefusal).toBe('rien_de_quantifie')
  })
})
