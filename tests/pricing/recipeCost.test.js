import { describe, it, expect } from 'vitest'
import { computeRecipeCost, classerParCout } from '@/lib/domain/pricing/recipeCost'
import { buildPriceIndex, INDEX_PRIX_VIDE } from '@/lib/domain/pricing/priceIndex'
import { materializeRecipe } from '@/lib/domain/recipes/materializeRecipe'
import { composerFourchettes } from '@/lib/domain/pricing/priceMath'
import { entree, jeu, recette } from './fixtures'

const indexSimple = buildPriceIndex([jeu({
  entries: [
    entree({ form: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', central: 2, low: 2, high: 2 }),
    entree({ form: 'Sel fin', formNormalized: 'sel fin', central: 1, low: 1, high: 1, category: 'condiments_sauces' }),
    entree({ form: 'Huile d\'olive vierge extra', formNormalized: 'huile d olive vierge extra', central: 10, low: 10, high: 10 }),
  ],
})])

describe('computeRecipeCost — le référentiel vide et le référentiel partiel', () => {
  const plat = recette([
    { name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 500 },
    { name: 'Sel fin', formNormalized: 'sel fin', grams: 10 },
  ], 4)

  it('ne lève pas et n\'affiche rien sur un référentiel vide', () => {
    const cout = computeRecipeCost(plat, INDEX_PRIX_VIDE)
    expect(cout.coutConsomme.total).toBeNull()
    expect(cout.displayable).toBe(false)
    expect(cout.displayRefusal).toBe('aucune_ligne_chiffree')
    expect(cout.coverage.pct).toBe(0)
  })

  it('ne lève pas quand l\'index est absent', () => {
    expect(() => computeRecipeCost(plat, null)).not.toThrow()
    expect(computeRecipeCost(plat, undefined).coutConsomme.total).toBeNull()
  })

  it('chiffre ce qu\'il peut et nomme le reste sur un référentiel partiel', () => {
    const partiel = buildPriceIndex([jeu({ entries: [entree({ formNormalized: 'sel fin', central: 1, low: 1, high: 1 })] })])
    const cout = computeRecipeCost(plat, partiel)
    expect(cout.coverage.priced).toBe(1)
    expect(cout.coverage.quantified).toBe(2)
    expect(cout.coverage.unpriced).toEqual(['Oignon jaune cru'])
    expect(cout.lines.find((l) => l.name === 'Oignon jaune cru').reason).toBe('forme_non_couverte')
  })

  it('motive une forme absente autrement qu\'une ligne non quantifiée', () => {
    const plat2 = recette([
      { name: 'Safran en pistils', formNormalized: 'safran en pistils', grams: 1 },
      { name: 'Eau', formNormalized: 'eau', grams: 0 },
    ], 2)
    const cout = computeRecipeCost(plat2, indexSimple)
    expect(cout.lines[0].reason).toBe('forme_non_couverte')
    expect(cout.lines[1].reason).toBe('non_quantifie')
    // La ligne non quantifiée n'entre dans aucun dénominateur, comme en nutrition.
    expect(cout.coverage.quantified).toBe(1)
  })
})

describe('computeRecipeCost — l\'arithmétique', () => {
  it('somme les coûts au centre', () => {
    const plat = recette([
      { name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 500 }, // 0,5 kg × 2 € = 1 €
      { name: 'Huile d\'olive vierge extra', formNormalized: 'huile d olive vierge extra', grams: 100 }, // 0,1 kg × 10 € = 1 €
    ], 4)
    const cout = computeRecipeCost(plat, indexSimple)
    expect(cout.coutConsomme.total.central).toBeCloseTo(2, 9)
  })

  it('divise par les portions pour le coût par portion', () => {
    const plat = recette([{ name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 2000 }], 4)
    const cout = computeRecipeCost(plat, indexSimple)
    expect(cout.coutConsomme.total.central).toBeCloseTo(4, 9)
    expect(cout.coutConsomme.parPortion.central).toBeCloseTo(1, 9)
  })

  it('fournit les montants arrondis à côté des bruts, jamais à leur place', () => {
    const plat = recette([{ name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 2137 }], 4)
    const cout = computeRecipeCost(plat, indexSimple)
    expect(cout.coutConsomme.total.central).toBeCloseTo(4.274, 9)
    expect(cout.coutConsomme.totalArrondi.central).toBeCloseTo(4.3, 9)
    expect(cout.coutConsomme.parPortionArrondi.central).toBeCloseTo(1.05, 9)
  })

  it('applique le rendement comestible une seule fois', () => {
    const index = buildPriceIndex([jeu({
      entries: [entree({ formNormalized: 'oignon jaune cru', low: 2, central: 2, high: 2, yieldValue: 0.8, yieldKnown: true })],
    })])
    const plat = recette([{ name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 800 }], 4)
    const cout = computeRecipeCost(plat, index)
    // 800 g comestibles → 1000 g achetés → 2 €. Une double application donnerait 2,50 €.
    expect(cout.coutConsomme.total.central).toBeCloseTo(2, 9)
    expect(cout.lines[0].purchasedGrams).toBeCloseTo(1000, 9)
  })

  it('laisse la masse achetée égale à la masse de la forme quand le rendement est inconnu', () => {
    const plat = recette([{ name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 800 }], 4)
    const cout = computeRecipeCost(plat, indexSimple)
    expect(cout.lines[0].purchasedGrams).toBe(800)
    expect(cout.lines[0].yieldKnown).toBe(false)
  })
})

describe('computeRecipeCost — le rendement comestible absent', () => {
  it('marque l\'estimation comme minorant et signale le parage inconnu', () => {
    const plat = recette([{ name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 500 }], 4)
    const cout = computeRecipeCost(plat, indexSimple)
    expect(cout.coverage.yieldKnownPct).toBe(0)
    expect(cout.parageInconnu).toBe(true)
    expect(cout.minorant).toBe(true)
  })

  it('ne marque plus le parage inconnu quand tous les rendements sont sourcés', () => {
    const index = buildPriceIndex([jeu({
      entries: [entree({ formNormalized: 'sel fin', low: 1, central: 1, high: 1, yieldValue: 1, yieldKnown: true })],
    })])
    const plat = recette([{ name: 'Sel fin', formNormalized: 'sel fin', grams: 10 }], 4)
    const cout = computeRecipeCost(plat, index)
    expect(cout.coverage.yieldKnownPct).toBe(100)
    expect(cout.parageInconnu).toBe(false)
    expect(cout.minorant).toBe(false)
  })

  it('ne peut que MONTER quand un rendement inconnu devient sourcé', () => {
    // Le sens de l'erreur est connu : sans correction de parage, l'estimation
    // est nécessairement un minorant (§2.3).
    const plat = recette([{ name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 800 }], 4)
    const sansRendement = computeRecipeCost(plat, indexSimple).coutConsomme.total.central
    const indexAvec = buildPriceIndex([jeu({
      entries: [entree({ formNormalized: 'oignon jaune cru', low: 2, central: 2, high: 2, yieldValue: 0.8, yieldKnown: true })],
    })])
    const avecRendement = computeRecipeCost(plat, indexAvec).coutConsomme.total.central
    expect(avecRendement).toBeGreaterThan(sansRendement)
  })
})

describe('computeRecipeCost — la fourchette sur vingt ingrédients', () => {
  const vingtFormes = Array.from({ length: 20 }, (_, i) => entree({
    form: `Forme ${i}`,
    formNormalized: `forme ${i}`,
    low: 8,
    central: 10,
    high: 12,
  }))
  const index = buildPriceIndex([jeu({ entries: vingtFormes })])
  const plat = recette(
    Array.from({ length: 20 }, (_, i) => ({ name: `Forme ${i}`, formNormalized: `forme ${i}`, grams: 100 })),
    4,
  )

  it('additionne exactement les valeurs centrales', () => {
    // 20 lignes × 0,1 kg × 10 €/kg = 20 €
    expect(computeRecipeCost(plat, index).coutConsomme.total.central).toBeCloseTo(20, 9)
  })

  it('N\'additionne PAS les bornes : le panier des vingt déciles bas n\'existe pas', () => {
    const total = computeRecipeCost(plat, index).coutConsomme.total
    const sommeNaiveBasse = 20 * 0.8 // 16 €
    const sommeNaiveHaute = 20 * 1.2 // 24 €
    expect(total.low).toBeGreaterThan(sommeNaiveBasse)
    expect(total.high).toBeLessThan(sommeNaiveHaute)
  })

  it('compose en quadrature : demi-étendue = √(Σdᵢ²)', () => {
    const total = computeRecipeCost(plat, index).coutConsomme.total
    // dᵢ = (1,2 − 0,8)/2 = 0,2 € par ligne → √(20 × 0,04) ≈ 0,894 €
    expect(total.high - total.central).toBeCloseTo(Math.sqrt(20 * 0.04), 9)
  })

  it('n\'est jamais annoncé plus serré que sa ligne la plus incertaine', () => {
    const melange = buildPriceIndex([jeu({
      entries: [
        entree({ formNormalized: 'cher', low: 40, central: 100, high: 160 }),
        ...Array.from({ length: 19 }, (_, i) => entree({ formNormalized: `petit ${i}`, low: 1, central: 1, high: 1 })),
      ],
    })])
    const platMelange = recette([
      { name: 'cher', formNormalized: 'cher', grams: 1000 },
      ...Array.from({ length: 19 }, (_, i) => ({ name: `petit ${i}`, formNormalized: `petit ${i}`, grams: 10 })),
    ], 4)
    const total = computeRecipeCost(platMelange, melange).coutConsomme.total
    expect(total.high - total.central).toBeGreaterThanOrEqual(60)
  })

  it('ne compose que sur les lignes chiffrées', () => {
    const platAvecTrou = recette([
      ...Array.from({ length: 20 }, (_, i) => ({ name: `Forme ${i}`, formNormalized: `forme ${i}`, grams: 100 })),
      { name: 'Safran', formNormalized: 'safran en pistils', grams: 1 },
    ], 4)
    const cout = computeRecipeCost(platAvecTrou, index)
    expect(cout.coutConsomme.total.central).toBeCloseTo(20, 9)
    expect(cout.coverage.priced).toBe(20)
    expect(cout.coverage.quantified).toBe(21)
  })

  it('donne le même résultat que la composition nue des mêmes fourchettes', () => {
    const cout = computeRecipeCost(plat, index)
    const attendu = composerFourchettes(cout.lines.filter((l) => l.priced).map((l) => l.range))
    expect(cout.coutConsomme.total).toEqual(attendu)
  })
})

describe('computeRecipeCost — la mise à l\'échelle des portions', () => {
  const plat = recette([
    { name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 500 },
    { name: 'Huile d\'olive vierge extra', formNormalized: 'huile d olive vierge extra', grams: 100 },
  ], 4)

  it('double le total quand on double les portions', () => {
    const base = computeRecipeCost(plat, indexSimple)
    const double = computeRecipeCost(plat, indexSimple, { servings: 8 })
    expect(double.servings).toBe(8)
    expect(double.scale).toBe(2)
    expect(double.coutConsomme.total.central).toBeCloseTo(base.coutConsomme.total.central * 2, 9)
  })

  it('laisse le coût PAR PORTION inchangé — c\'est l\'invariant qui compte', () => {
    const base = computeRecipeCost(plat, indexSimple)
    for (const portions of [1, 2, 3, 6, 8, 12]) {
      const echelle = computeRecipeCost(plat, indexSimple, { servings: portions })
      expect(echelle.coutConsomme.parPortion.central).toBeCloseTo(base.coutConsomme.parPortion.central, 9)
    }
  })

  it('met aussi la fourchette à l\'échelle, sans la resserrer artificiellement', () => {
    const index = buildPriceIndex([jeu({ entries: [entree({ formNormalized: 'oignon jaune cru', low: 1, central: 2, high: 3 })] })])
    const p = recette([{ name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 1000 }], 4)
    const base = computeRecipeCost(p, index).coutConsomme.total
    const triple = computeRecipeCost(p, index, { servings: 12 }).coutConsomme.total
    expect(triple.central).toBeCloseTo(base.central * 3, 9)
    expect(triple.high - triple.central).toBeCloseTo((base.high - base.central) * 3, 9)
  })

  it('donne le même montant que la re-matérialisation de la recette', () => {
    // Le raccourci « multiplier les grammes » n'en est pas un : toGramsV2 est
    // linéaire en la quantité, donc les deux chemins coïncident exactement.
    const editoriale = {
      code: 'ECH-01',
      servings: 4,
      ingredients: [
        { form: 'Oignon jaune cru', quantity: 500, unit: 'g' },
        { form: 'Sel fin', quantity: 10, unit: 'g' },
      ],
      steps: [],
    }
    const catalogue = [
      { canonical_name: 'Oignon jaune cru', canonical_name_normalized: 'oignon jaune cru', confidence: 'B', conversion: {}, per100g: { kcal: 38, proteinG: 1, carbsG: 6, fatG: 0.5 } },
      { canonical_name: 'Sel fin', canonical_name_normalized: 'sel fin', confidence: 'B', conversion: {}, per100g: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 } },
    ]
    const parEchelleInterne = computeRecipeCost(materializeRecipe(editoriale, catalogue), indexSimple, { servings: 7 })
    const parRematerialisation = computeRecipeCost(materializeRecipe(editoriale, catalogue, { servings: 7 }), indexSimple)
    expect(parEchelleInterne.coutConsomme.total.central).toBeCloseTo(parRematerialisation.coutConsomme.total.central, 9)
  })

  it('ignore un nombre de portions absurde plutôt que de diviser par zéro', () => {
    for (const portions of [0, -3, null, 'quatre']) {
      const cout = computeRecipeCost(plat, indexSimple, { servings: portions })
      expect(cout.scale).toBe(1)
      expect(cout.servings).toBe(4)
    }
  })
})

describe('computeRecipeCost — accepte une recette matérialisée réelle', () => {
  it('lit exactIngredients sans que la recette ait à être adaptée', () => {
    const editoriale = {
      code: 'REEL-01',
      servings: 2,
      ingredients: [{ form: 'Sel fin', quantity: 10, unit: 'g' }],
      steps: [],
    }
    const catalogue = [{ canonical_name: 'Sel fin', canonical_name_normalized: 'sel fin', confidence: 'B', conversion: {}, per100g: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 } }]
    const materialisee = materializeRecipe(editoriale, catalogue)
    const cout = computeRecipeCost(materialisee, indexSimple)
    expect(cout.coverage.priced).toBe(1)
    expect(cout.coutConsomme.total.central).toBeCloseTo(0.01, 9)
  })

  it('accepte aussi un simple tableau de lignes', () => {
    const cout = computeRecipeCost([{ name: 'Sel fin', formNormalized: 'sel fin', grams: 1000 }], indexSimple)
    expect(cout.coutConsomme.total.central).toBeCloseTo(1, 9)
    expect(cout.servings).toBeNull()
    expect(cout.coutConsomme.parPortion).toBeNull()
  })

  it('déduit la clé du libellé quand formNormalized manque', () => {
    const cout = computeRecipeCost([{ name: 'Sel fin', grams: 1000 }], indexSimple)
    expect(cout.coverage.priced).toBe(1)
  })
})

describe('computeRecipeCost — ce que la couche prix NE fait PAS (§6.1)', () => {
  it('ne bloque rien : une recette sans prix reste une recette', () => {
    const editoriale = {
      code: 'BLOQ-01',
      servings: 2,
      ingredients: [{ form: 'Sel fin', quantity: 10, unit: 'g' }],
      steps: [],
    }
    const catalogue = [{ canonical_name: 'Sel fin', canonical_name_normalized: 'sel fin', confidence: 'B', conversion: {}, per100g: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 } }]
    const materialisee = materializeRecipe(editoriale, catalogue)
    const avant = { eligible: materialisee.eligible, issues: materialisee.issues.length }
    computeRecipeCost(materialisee, INDEX_PRIX_VIDE)
    expect(materialisee.eligible).toBe(avant.eligible)
    expect(materialisee.issues).toHaveLength(avant.issues)
  })
})

describe('computeRecipeCost — les refus d\'affichage (§8)', () => {
  it('refuse un total bâti sur une poignée d\'ingrédients', () => {
    const index = buildPriceIndex([jeu({ entries: [entree({ formNormalized: 'sel fin', low: 1, central: 1, high: 1 })] })])
    const plat = recette([
      { name: 'Sel fin', formNormalized: 'sel fin', grams: 1000 },
      ...Array.from({ length: 5 }, (_, i) => ({ name: `Inconnu ${i}`, formNormalized: `inconnu ${i}`, grams: 1 })),
    ], 4)
    expect(computeRecipeCost(plat, index).displayRefusal).toBe('couverture_lignes_insuffisante')
  })

  it('refuse un total dont la viande manque, même à 92 % des lignes', () => {
    const index = buildPriceIndex([jeu({
      entries: Array.from({ length: 11 }, (_, i) => entree({ formNormalized: `epice ${i}`, low: 20, central: 20, high: 20 })),
    })])
    const plat = recette([
      { name: 'Bœuf', formNormalized: 'boeuf bourguignon cru', grams: 1200 },
      ...Array.from({ length: 11 }, (_, i) => ({ name: `epice ${i}`, formNormalized: `epice ${i}`, grams: 3 })),
    ], 4)
    const cout = computeRecipeCost(plat, index)
    expect(cout.coverage.pct).toBe(92)
    expect(cout.displayRefusal).toBe('couverture_masse_insuffisante')
    expect(cout.displayable).toBe(false)
    // Le montant reste calculé — c'est son AFFICHAGE qui est refusé, et la
    // distinction permet de dire pourquoi plutôt que de rester muet.
    expect(cout.coutConsomme.total).not.toBeNull()
  })

  it('n\'affiche rien quand le référentiel est éteint', () => {
    const vieux = buildPriceIndex([jeu({ referenceDate: '2023-01-15', entries: [entree({ formNormalized: 'sel fin', observedOn: '2023-01-10' })] })], { today: '2026-08-24' })
    const cout = computeRecipeCost(recette([{ name: 'Sel fin', formNormalized: 'sel fin', grams: 100 }], 4), vieux)
    expect(cout.displayRefusal).toBe('referentiel_perime')
  })
})

describe('classerParCout — §8.4, trier par prix des couvertures inégales, c\'est trier par ignorance', () => {
  const complet = (central) => ({
    displayable: true,
    coverage: { pct: 100 },
    coutConsomme: { total: { low: central, central, high: central } },
  })
  const partiel = { displayable: true, coverage: { pct: 80 }, coutConsomme: { total: { low: 1, central: 1, high: 1 } } }

  it('trie le sous-ensemble intégralement couvert', () => {
    const { comparables } = classerParCout([complet(9), complet(3), complet(6)])
    expect(comparables.map((c) => c.coutConsomme.total.central)).toEqual([3, 6, 9])
  })

  it('écarte les couvertures incomplètes du classement au lieu de les y glisser', () => {
    const { comparables, nonComparables, complet: total } = classerParCout([complet(9), partiel])
    expect(comparables).toHaveLength(1)
    expect(nonComparables).toEqual([partiel])
    expect(total).toBe(false)
  })

  it('ne signale « complet » que lorsque tout l\'ensemble est comparable', () => {
    expect(classerParCout([complet(1), complet(2)]).complet).toBe(true)
  })
})
