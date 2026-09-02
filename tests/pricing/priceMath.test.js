import { describe, it, expect } from 'vitest'
import {
  arrondirFourchette,
  arrondirMontant,
  calculerCouverture,
  composerFourchettes,
  diviserFourchette,
  formaterEuros,
  fourchetteLigne,
  joursEntre,
  masseAcheteeGrammes,
  moisEntre,
  moisFrancais,
  phraseEstimation,
  verdictAffichage,
  SEUIL_COUVERTURE_LIGNES,
  SEUIL_COUVERTURE_MASSE,
} from '@/lib/domain/pricing/priceMath'
import { moisEntre as moisEntreControleur } from '@/scripts/data/prices/check-price-provenance.mjs'

describe('moisEntre — verrou sur la duplication avec le contrôleur de provenance', () => {
  // La couche de domaine ne peut pas importer un script de CI (la dépendance
  // irait à l'envers), donc l'algorithme est écrit deux fois. Ce test est le
  // prix de cette duplication : elle est surveillée, pas subie.
  const dates = [
    ['2026-07-31', '2026-08-24'],
    ['2024-08-25', '2026-08-24'],
    ['2024-08-24', '2026-08-24'],
    ['2024-08-23', '2026-08-24'],
    ['2025-01-31', '2026-02-01'],
    ['2025-12-31', '2026-01-01'],
    ['2026-08-24', '2026-08-24'],
  ]
  for (const [depuis, jusqu] of dates) {
    it(`donne le même écart que le contrôleur pour ${depuis} → ${jusqu}`, () => {
      expect(moisEntre(depuis, jusqu)).toBe(moisEntreControleur(depuis, jusqu))
    })
  }

  it('refuse une date mal formée plutôt que de rendre un écart inventé', () => {
    expect(moisEntre('2026-08', '2026-08-24')).toBeNull()
    expect(moisEntre(null, '2026-08-24')).toBeNull()
  })
})

describe('joursEntre — comparaison UTC stricte (CLAUDE.md, piège 4)', () => {
  it('compte les jours sans décalage de fuseau', () => {
    expect(joursEntre('2026-08-24', '2026-08-27')).toBe(3)
    expect(joursEntre('2026-08-27', '2026-08-24')).toBe(-3)
    expect(joursEntre('2026-08-24', '2026-08-24')).toBe(0)
  })

  it('traverse correctement un changement d\'heure', () => {
    // Le dernier dimanche de mars 2026 : 29 mars. En heure locale, l'écart
    // 28→30 mars fait 47 h, ce qui arrondit à 1 jour avec une division naïve.
    expect(joursEntre('2026-03-28', '2026-03-30')).toBe(2)
  })

  it('rend null et non 0 quand la date manque', () => {
    expect(joursEntre('2026-08-24', null)).toBeNull()
  })
})

describe('masseAcheteeGrammes — le rendement comestible', () => {
  it('laisse la masse inchangée au rendement par défaut de 1,00', () => {
    expect(masseAcheteeGrammes(250, 1)).toBe(250)
  })

  it('majore la masse achetée quand le rendement est sourcé et inférieur à 1', () => {
    // 200 g d'oignon épluché demandent 250 g d'oignon acheté à 0,80 de rendement.
    expect(masseAcheteeGrammes(200, 0.8)).toBeCloseTo(250, 9)
  })

  it('refuse un rendement hors de ]0, 1] au lieu de le ramener à 1', () => {
    expect(masseAcheteeGrammes(200, 1.2)).toBeNull()
    expect(masseAcheteeGrammes(200, 0)).toBeNull()
    expect(masseAcheteeGrammes(200, -1)).toBeNull()
    expect(masseAcheteeGrammes(200, null)).toBeNull()
  })
})

describe('fourchetteLigne', () => {
  it('applique €/kg à la masse achetée', () => {
    const r = fourchetteLigne({ low: 2, central: 3, high: 4 }, 500, 1)
    expect(r).toEqual({ low: 1, central: 1.5, high: 2 })
  })

  it('n\'applique le rendement qu\'une seule fois', () => {
    const r = fourchetteLigne({ low: 2, central: 3, high: 4 }, 800, 0.8)
    // 800 / 0,8 = 1000 g = 1 kg → 3 € au centre. Une double application donnerait 3,75 €.
    expect(r.central).toBeCloseTo(3, 9)
  })

  it('refuse une fourchette inversée plutôt que de la retourner en silence', () => {
    expect(fourchetteLigne({ low: 5, central: 3, high: 4 }, 500, 1)).toBeNull()
  })
})

describe('composerFourchettes — §3.2, on n\'additionne jamais les bornes', () => {
  const vingt = Array.from({ length: 20 }, () => ({ low: 1, central: 2, high: 3 }))

  it('additionne exactement les valeurs centrales', () => {
    expect(composerFourchettes(vingt).central).toBeCloseTo(40, 9)
  })

  it('compose les demi-étendues en quadrature, pas en somme', () => {
    // dᵢ = 1 pour chacune des vingt lignes → demi = √20 ≈ 4,472, jamais 20.
    const r = composerFourchettes(vingt)
    expect(r.high - r.central).toBeCloseTo(Math.sqrt(20), 9)
    expect(r.central - r.low).toBeCloseTo(Math.sqrt(20), 9)
  })

  it('NE rend PAS la somme des bornes basses ni celle des bornes hautes', () => {
    const r = composerFourchettes(vingt)
    const sommeBasses = vingt.reduce((s, f) => s + f.low, 0) // 20
    const sommeHautes = vingt.reduce((s, f) => s + f.high, 0) // 60
    expect(r.low).toBeGreaterThan(sommeBasses)
    expect(r.high).toBeLessThan(sommeHautes)
  })

  it('respecte les deux bornes de la quadrature : √(Σd²) ≥ max d et ≤ Σd', () => {
    const lignes = [
      { low: 0, central: 5, high: 10 }, // d = 5
      { low: 1, central: 2, high: 3 }, // d = 1
      { low: 2, central: 2, high: 2 }, // d = 0
    ]
    const r = composerFourchettes(lignes)
    const demi = r.high - r.central
    expect(demi).toBeGreaterThanOrEqual(5) // jamais plus serré que la ligne la plus incertaine
    expect(demi).toBeLessThanOrEqual(6) // toujours plus serré que la somme naïve
    expect(demi).toBeCloseTo(Math.sqrt(26), 9)
  })

  it('borne la valeur basse à zéro : un panier ne coûte pas moins que rien', () => {
    const r = composerFourchettes([{ low: 0, central: 1, high: 100 }])
    expect(r.low).toBe(0)
  })

  it('rend null sur une liste vide — « rien de chiffré » n\'est pas « chiffré à zéro »', () => {
    expect(composerFourchettes([])).toBeNull()
    expect(composerFourchettes(null)).toBeNull()
  })

  it('ignore les lignes non chiffrées sans les compter comme des zéros', () => {
    const r = composerFourchettes([{ low: 1, central: 2, high: 3 }, null, undefined])
    expect(r.central).toBe(2)
  })
})

describe('diviserFourchette', () => {
  it('divise les trois bornes par le nombre de portions', () => {
    expect(diviserFourchette({ low: 4, central: 8, high: 12 }, 4)).toEqual({ low: 1, central: 2, high: 3 })
  })

  it('refuse un diviseur nul ou négatif', () => {
    expect(diviserFourchette({ low: 4, central: 8, high: 12 }, 0)).toBeNull()
  })
})

describe('arrondis d\'affichage — §7.2', () => {
  it('arrondit un coût par portion au pas de 0,05 €', () => {
    expect(arrondirMontant(1.23, { parPortion: true })).toBeCloseTo(1.25, 9)
    expect(arrondirMontant(1.21, { parPortion: true })).toBeCloseTo(1.2, 9)
  })

  it('arrondit au pas de 0,10 € sous 10 €', () => {
    expect(arrondirMontant(4.27)).toBeCloseTo(4.3, 9)
  })

  it('arrondit au pas de 0,50 € entre 10 et 100 €', () => {
    expect(arrondirMontant(43.27)).toBeCloseTo(43.5, 9)
    expect(arrondirMontant(43.2)).toBeCloseTo(43, 9)
  })

  it('arrondit à l\'euro au-delà de 100 €', () => {
    expect(arrondirMontant(143.6)).toBe(144)
  })

  it('n\'affiche pas de décimales sur un montant arrondi à l\'euro', () => {
    // « 144,00 € » réintroduirait par la virgule la précision que l'arrondi vient d'enlever.
    expect(formaterEuros(143.6)).toBe('144 €')
    expect(formaterEuros(4.27)).toBe('4,30 €')
    expect(formaterEuros(1.23, { parPortion: true })).toBe('1,25 €')
  })

  it('écrit la virgule décimale quelle que soit la locale du processus', () => {
    expect(formaterEuros(4.27)).toContain(',')
  })

  it('arrondit les trois bornes d\'une fourchette', () => {
    expect(arrondirFourchette({ low: 4.27, central: 5.44, high: 6.71 })).toEqual({ low: 4.3, central: 5.4, high: 6.7 })
  })
})

describe('calculerCouverture — §6, deux mesures parce qu\'une seule ment', () => {
  const lignes = [
    { name: 'Bœuf', grams: 1200, priced: false },
    { name: 'Poivre', grams: 2, priced: true, yieldKnown: true },
    { name: 'Sel', grams: 8, priced: true, yieldKnown: false },
  ]

  it('compte les lignes comme la couverture nutritionnelle', () => {
    const c = calculerCouverture(lignes)
    expect(c.quantified).toBe(3)
    expect(c.priced).toBe(2)
    expect(c.pct).toBe(67)
  })

  it('révèle par la masse ce que le comptage de lignes dissimule', () => {
    const c = calculerCouverture(lignes)
    // 10 g chiffrés sur 1210 g : 1 %. Le comptage de lignes annonçait 67 %.
    expect(c.pctByMass).toBe(1)
  })

  it('nomme les lignes non chiffrées', () => {
    expect(calculerCouverture(lignes).unpriced).toEqual(['Bœuf'])
  })

  it('mesure la part des lignes chiffrées dont le rendement est sourcé', () => {
    expect(calculerCouverture(lignes).yieldKnownPct).toBe(50)
  })

  it('exclut des deux dénominateurs les lignes non quantifiées', () => {
    const c = calculerCouverture([{ name: 'Eau', grams: 0, priced: false }, { name: 'Sel', grams: 5, priced: true }])
    expect(c.quantified).toBe(1)
    expect(c.pct).toBe(100)
  })

  it('rend null plutôt que 0 quand rien n\'est quantifié — comme la nutrition', () => {
    const c = calculerCouverture([])
    expect(c.pct).toBeNull()
    expect(c.pctByMass).toBeNull()
  })
})

describe('verdictAffichage — §8, les deux seuils sont conjonctifs', () => {
  it('refuse sous le seuil de lignes, même avec une masse bien couverte', () => {
    const c = calculerCouverture([
      { name: 'Farine', grams: 1000, priced: true },
      { name: 'a', grams: 1, priced: false },
      { name: 'b', grams: 1, priced: false },
      { name: 'c', grams: 1, priced: false },
    ])
    expect(c.pctByMass).toBeGreaterThanOrEqual(SEUIL_COUVERTURE_MASSE)
    expect(c.pct).toBeLessThan(SEUIL_COUVERTURE_LIGNES)
    expect(verdictAffichage(c)).toEqual({ affichable: false, refus: 'couverture_lignes_insuffisante' })
  })

  it('refuse sous le seuil de masse, même avec presque toutes les lignes chiffrées', () => {
    // Le cas que le seuil de masse existe pour attraper : c'est la viande qui manque.
    const c = calculerCouverture([
      { name: 'Bœuf', grams: 1200, priced: false },
      ...Array.from({ length: 11 }, (_, i) => ({ name: `épice ${i}`, grams: 3, priced: true })),
    ])
    expect(c.pct).toBeGreaterThanOrEqual(SEUIL_COUVERTURE_LIGNES)
    expect(verdictAffichage(c)).toEqual({ affichable: false, refus: 'couverture_masse_insuffisante' })
  })

  it('refuse tout quand le référentiel est périmé', () => {
    const c = calculerCouverture([{ name: 'Sel', grams: 5, priced: true }])
    expect(verdictAffichage(c, { referentielPerime: true })).toEqual({ affichable: false, refus: 'referentiel_perime' })
  })

  it('accepte une couverture partielle mais au-dessus des deux seuils', () => {
    const c = calculerCouverture([
      { name: 'Bœuf', grams: 1000, priced: true },
      { name: 'Safran', grams: 1, priced: false },
      { name: 'Sel', grams: 5, priced: true },
      { name: 'Huile', grams: 30, priced: true },
    ])
    expect(verdictAffichage(c)).toEqual({ affichable: true, refus: null })
  })
})

describe('phraseEstimation — §7.1, le vocabulaire imposé', () => {
  const referenceDate = '2026-08-24'

  it('dit « au moins » dès que la couverture est partielle', () => {
    const couverture = calculerCouverture([
      { name: 'Bœuf', grams: 1000, priced: true, yieldKnown: true },
      { name: 'Safran', grams: 1, priced: false },
    ])
    const phrase = phraseEstimation({
      fourchette: { low: 5.8, central: 6.1, high: 6.4 },
      couverture,
      referenceDate,
    })
    expect(phrase).toContain('Au moins')
    expect(phrase).toContain('Safran')
    expect(phrase).not.toContain('≈')
  })

  it('dit « ≈ » quand tout est chiffré', () => {
    const couverture = calculerCouverture([{ name: 'Bœuf', grams: 1000, priced: true, yieldKnown: true }])
    const phrase = phraseEstimation({ fourchette: { low: 5.8, central: 6.1, high: 6.4 }, couverture, referenceDate })
    expect(phrase).toContain('Estimation ≈')
    expect(phrase).toContain('1 ingrédients sur 1')
  })

  it('mentionne « hors pertes de parage » tant qu\'un rendement n\'est pas sourcé', () => {
    const couverture = calculerCouverture([{ name: 'Oignon', grams: 200, priced: true, yieldKnown: false }])
    expect(phraseEstimation({ fourchette: { low: 1, central: 1, high: 1 }, couverture, referenceDate }))
      .toContain('hors pertes de parage')
  })

  it('porte toujours la date du référentiel à côté du montant', () => {
    const couverture = calculerCouverture([{ name: 'Oignon', grams: 200, priced: true, yieldKnown: true }])
    expect(phraseEstimation({ fourchette: { low: 1, central: 1, high: 1 }, couverture, referenceDate }))
      .toContain('référentiel août 2026')
  })

  it('n\'emploie jamais le mot « prix » ni un montant nu', () => {
    const couverture = calculerCouverture([{ name: 'Oignon', grams: 200, priced: true, yieldKnown: true }])
    const phrase = phraseEstimation({ fourchette: { low: 1, central: 1, high: 1 }, couverture, referenceDate })
    expect(phrase.toLowerCase()).not.toContain('prix total')
    expect(phrase.toLowerCase()).not.toContain('vous paierez')
  })

  it('explique le refus au lieu de rester muet', () => {
    const couverture = calculerCouverture([
      { name: 'Bœuf', grams: 1200, priced: false },
      { name: 'Sel', grams: 5, priced: true },
    ])
    const phrase = phraseEstimation({ fourchette: null, couverture, affichable: false, refus: 'couverture_masse_insuffisante' })
    expect(phrase).toContain('Estimation indisponible')
    expect(phrase).toContain('1 ingrédient sur 2')
  })
})

describe('moisFrancais', () => {
  it('rend le mois et l\'année en français', () => {
    expect(moisFrancais('2026-08-24')).toBe('août 2026')
    expect(moisFrancais('2026-01-01')).toBe('janvier 2026')
  })

  it('refuse une date mal formée', () => {
    expect(moisFrancais('août 2026')).toBeNull()
  })
})
