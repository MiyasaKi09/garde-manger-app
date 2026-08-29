import { describe, it, expect } from 'vitest'
import { buildPriceIndex, INDEX_PRIX_VIDE } from '@/lib/domain/pricing/priceIndex'
import { computeRecipeCost } from '@/lib/domain/pricing/recipeCost'
import { computeWasteValue } from '@/lib/domain/pricing/wasteValue'
import { phraseEstimation } from '@/lib/domain/pricing/priceMath'
import {
  NOMS,
  recomposerPhrase,
  vueCoutRecette,
  vueEstimation,
  vueLotsValorises,
  vueValeurGardeManger,
} from '@/components/pricing/estimationView'
import { entree, jeu, recette } from './fixtures'

/**
 * Ce que ces tests vérifient, et pourquoi ils sont écrits sur des fonctions et
 * non sur du JSX rendu : le dépôt teste ses affichages par leurs modèles de
 * vue (cf. tests/planning/weekGridDisplay.test.js, tests/recipes/
 * catalogPresentation.test.js), sans bibliothèque de rendu. Tout ce que le
 * contrat impose à l'interface — les mots, les arrondis, la date, le compte des
 * lignes — vit dans ces chaînes ; les composants ne font que les poser.
 */

const index = buildPriceIndex([jeu({
  entries: [
    entree({ form: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', central: 2, low: 1.6, high: 2.4 }),
    entree({ form: 'Sel fin', formNormalized: 'sel fin', central: 1, low: 1, high: 1 }),
    entree({ form: 'Poivre noir moulu', formNormalized: 'poivre noir moulu', central: 20, low: 20, high: 20 }),
  ],
})])

const platComplet = recette([
  { name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 500 },
  { name: 'Sel fin', formNormalized: 'sel fin', grams: 10 },
], 4)

/**
 * Le cas NORMAL : trois lignes sur quatre chiffrées, et la quatrième pèse
 * assez peu pour que les deux seuils du §8.1 restent tenus. C'est exactement la
 * situation du référentiel réel — 160 formes couvertes sur 534 — et c'est elle
 * que l'affichage doit rendre lisible plutôt que d'en faire une alerte.
 */
const platPartiel = recette([
  { name: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', grams: 900 },
  { name: 'Sel fin', formNormalized: 'sel fin', grams: 60 },
  { name: 'Poivre noir moulu', formNormalized: 'poivre noir moulu', grams: 5 },
  { name: 'Safran en pistils', formNormalized: 'safran en pistils', grams: 1 },
], 4)

describe('vueEstimation — les trois états d’une estimation', () => {
  it('aucun prix connu : pas de montant, un motif nommé, et rien qui ressemble à une panne', () => {
    const cout = computeRecipeCost(platComplet, INDEX_PRIX_VIDE)
    const vue = vueEstimation({
      fourchette: cout.coutConsomme.total,
      couverture: cout.coverage,
      referenceDate: cout.referenceDate,
      affichable: cout.displayable,
      refus: cout.displayRefusal,
    })
    expect(vue.affichable).toBe(false)
    expect(vue.montant).toBeNull()
    expect(vue.prefixe).toBeNull()
    expect(vue.indisponibleTexte).toBe('Estimation indisponible — 2 ingrédients sur 2 sans prix sourcé.')
    // Les noms manquants restent disponibles : c'est ce qui rend le refus utile
    // plutôt que fataliste — on sait quoi aller sourcer.
    expect(vue.nonChiffres).toEqual(['Oignon jaune cru', 'Sel fin'])
  })

  it('couverture partielle : « au moins », le compte, la masse, et les non chiffrés nommés', () => {
    const cout = computeRecipeCost(platPartiel, index)
    const vue = vueEstimation({
      fourchette: cout.coutConsomme.total,
      couverture: cout.coverage,
      referenceDate: cout.referenceDate,
      affichable: cout.displayable,
      refus: cout.displayRefusal,
      parageInconnu: cout.parageInconnu,
    })
    expect(cout.displayable).toBe(true)
    expect(vue.prefixe).toBe('Au moins')
    expect(vue.minorant).toBe(true)
    expect(vue.couvertureTexte).toBe('estimation portant sur 3 des 4 ingrédients (100 % de la masse)')
    expect(vue.nonChiffresTexte).toBe('non chiffrés : Safran en pistils')
    // §2.3 : le rendement laissé à 1,00 fait de l'estimation un minorant de plus.
    expect(vue.parageTexte).toBe('hors pertes de parage')
  })

  it('couverture complète : « Estimation ≈ », et le compte s’affiche quand même (§8.5)', () => {
    const cout = computeRecipeCost(platComplet, index)
    const vue = vueEstimation({
      fourchette: cout.coutConsomme.total,
      couverture: cout.coverage,
      referenceDate: cout.referenceDate,
      affichable: cout.displayable,
      refus: cout.displayRefusal,
      parageInconnu: cout.parageInconnu,
    })
    expect(vue.prefixe).toBe('Estimation ≈')
    expect(vue.minorant).toBe(false)
    // « 2 sur 2 » est une information, pas du bruit : sans elle, une estimation
    // complète et une estimation muette sur ce qu'elle ignore se ressemblent.
    expect(vue.couvertureTexte).toBe('2 ingrédients sur 2')
    expect(vue.nonChiffresTexte).toBeNull()
  })
})

describe('vueEstimation — le vocabulaire imposé (§7.1)', () => {
  const vue = (plat) => {
    const cout = computeRecipeCost(plat, index)
    return vueEstimation({
      fourchette: cout.coutConsomme.total,
      couverture: cout.coverage,
      referenceDate: cout.referenceDate,
      affichable: cout.displayable,
      refus: cout.displayRefusal,
      parageInconnu: cout.parageInconnu,
    })
  }

  it('n’écrit jamais « prix » ni « coût » en tête d’un montant', () => {
    for (const plat of [platComplet, platPartiel]) {
      expect(['Estimation ≈', 'Au moins']).toContain(vue(plat).prefixe)
    }
  })

  it('porte toujours la date du référentiel à côté du montant', () => {
    // Un montant sans date est une affirmation intemporelle ; un prix n'en est
    // jamais une. La date n'est donc pas dans un repli mais dans la vue elle-même.
    expect(vue(platComplet).mois).toBe('août 2026')
    expect(vue(platComplet).referentielTexte).toBe('référentiel août 2026')
  })

  it('affiche la fourchette comme une fourchette, jamais comme un point', () => {
    const v = vue(platComplet)
    expect(v.fourchette).toMatch(/^\d+,\d\d € – \d+,\d\d €$/)
    expect(v.bas).not.toBe(v.haut)
  })

  it('n’écrit jamais « 0 € » : un lot acheté n’est pas gratuit', () => {
    // 2 g d'une épice à 1 €/kg valent 0,002 €, que le pas de 0,10 € ramène à
    // zéro. « 0,00 € » affirmerait la gratuité d'une chose achetée — c'est le
    // seul montant que le §7.1 interdit explicitement d'écrire.
    const minuscule = vueEstimation({
      fourchette: { low: 0.001, central: 0.002, high: 0.003 },
      couverture: { pct: 100, quantified: 1, priced: 1, unpriced: [], pctByMass: 100, yieldKnownPct: 100 },
      referenceDate: '2026-08-24',
    })
    expect(minuscule.montant).toBe('moins de 0,10 €')
    expect(minuscule.negligeable).toBe(true)
    // Pas de fourchette non plus : « 0,00 € – 0,00 € » réintroduirait le zéro.
    expect(minuscule.fourchette).toBeNull()
    expect(recomposerPhrase(minuscule)).not.toContain('0,00 €')
  })

  it('dit que le référentiel est éteint plutôt que d’accuser les ingrédients (§5.4)', () => {
    const perime = vueEstimation({
      couverture: { pct: 0, quantified: 12, priced: 0, unpriced: [], pctByMass: 0, yieldKnownPct: null },
      affichable: false,
      refus: 'referentiel_perime',
    })
    expect(perime.indisponibleTexte).toContain('référentiel de prix a plus de deux ans')
    expect(perime.indisponibleTexte).not.toContain('sans prix sourcé')
  })
})

describe('recomposerPhrase — verrou contre la dérive du vocabulaire', () => {
  /**
   * La phrase du contrat (§7.3) est rendue par `phraseEstimation`, dans la
   * couche de domaine. L'affichage la re-découpe en fragments pour pouvoir la
   * mettre en page. Ce test verrouille l'égalité des deux écritures : le jour
   * où le contrat change un mot et où seule l'une des deux suit, il tombe.
   *
   * Même dispositif que la duplication surveillée de `moisEntre` entre le
   * domaine et le contrôleur de CI : on ne supprime pas la duplication, on la
   * rend impossible à faire diverger en silence.
   */
  for (const [nom, plat, parPortion] of [
    ['couverture complète', platComplet, false],
    ['couverture partielle', platPartiel, false],
    ['coût par portion', platComplet, true],
  ]) {
    it(`rend exactement la phrase du domaine — ${nom}`, () => {
      const cout = computeRecipeCost(plat, index)
      const fourchette = parPortion ? cout.coutConsomme.parPortion : cout.coutConsomme.total
      const args = {
        fourchette,
        couverture: cout.coverage,
        referenceDate: cout.referenceDate,
        affichable: cout.displayable,
        refus: cout.displayRefusal,
        parPortion,
        parageInconnu: cout.parageInconnu,
      }
      expect(recomposerPhrase(vueEstimation(args))).toBe(phraseEstimation(args))
    })
  }
})

describe('vueCoutRecette — la fiche recette montre ce que le plat consomme', () => {
  it('rend le coût par portion et le total, chacun avec son pas d’arrondi (§7.2)', () => {
    const cout = computeRecipeCost(platComplet, index)
    const vue = vueCoutRecette(cout)
    expect(vue.servings).toBe(4)
    // Le coût par portion s'arrondit à 0,05 € : appliquer le pas des petits
    // montants (0,10 €) à une portion à 1,20 € effacerait la moitié de
    // l'information utile.
    expect(vue.parPortion.montant).toMatch(/,(00|05|10|15|20|25|30|35|40|45|50|55|60|65|70|75|80|85|90|95) €$/)
    expect(vue.total.montant).toMatch(/,\d0 €$/)
  })
})

describe('vueValeurGardeManger — le rendement ne s’y applique pas', () => {
  const lots = [
    { id: 'l1', canonical_name: 'Oignon jaune cru', qty_remaining: 400, unit: 'g', expiration_date: '2026-08-27', expiry_kind: 'DLC' },
    { id: 'l2', canonical_name: 'Sel fin', qty_remaining: 200, unit: 'g', expiration_date: '2026-08-26', expiry_kind: 'DLC' },
    { id: 'l3', canonical_name: 'Poivre noir moulu', qty_remaining: 10, unit: 'g', expiration_date: '2026-08-27', expiry_kind: 'DLC' },
    { id: 'l4', canonical_name: 'Safran en pistils', qty_remaining: 2, unit: 'g', expiration_date: '2026-08-27', expiry_kind: 'DLC' },
  ]

  it('n’écrit jamais « hors pertes de parage » sur un lot déjà acheté', () => {
    const valeur = computeWasteValue(lots, index, { today: '2026-08-25' })
    const vue = vueValeurGardeManger(valeur.aRisque, { referenceDate: '2026-08-24' })
    // `wasteValue` ne divise jamais par le rendement — un lot EST le produit
    // acheté. Reprendre la mention annoncerait une sous-estimation inexistante,
    // et un chiffre trop prudent est aussi faux qu'un chiffre trop confiant.
    expect(vue.parageTexte).toBeNull()
    expect(vue.couvertureTexte).toContain('lots')
  })

  it('compte des lots, pas des ingrédients', () => {
    const valeur = computeWasteValue(lots, index, { today: '2026-08-25' })
    const vue = vueValeurGardeManger(valeur.aRisque, { referenceDate: '2026-08-24' })
    expect(vue.couvertureTexte).toBe('estimation portant sur 3 des 4 lots (100 % de la masse)')
    expect(NOMS.lot.plusieurs).toBe('lots')
  })
})

describe('vueLotsValorises — la ligne s’affiche même quand le total est refusé', () => {
  it('classe par valeur, garde les lots non chiffrés, et n’invente aucun montant', () => {
    const valeur = computeWasteValue([
      { id: 'a', canonical_name: 'Sel fin', qty_remaining: 100, unit: 'g', expiration_date: '2026-08-26' },
      { id: 'b', canonical_name: 'Oignon jaune cru', qty_remaining: 1000, unit: 'g', expiration_date: '2026-08-27' },
      { id: 'c', canonical_name: 'Safran en pistils', qty_remaining: 5, unit: 'g', expiration_date: '2026-08-26' },
    ], index, { today: '2026-08-25' })
    const rangees = vueLotsValorises(valeur.aRisque.lots)

    expect(rangees.map((r) => r.id)).toEqual(['b', 'a', 'c'])
    expect(rangees[0].montant).toBe('2,00 €')
    expect(rangees[2].chiffre).toBe(false)
    expect(rangees[2].montant).toBeNull()
    // Le motif est conservé : un lot non valorisé doit pouvoir s'expliquer.
    expect(rangees[2].motif).toBe('forme_non_couverte')
  })

  it('signale un lot dont l’ouverture a raccourci la date', () => {
    const valeur = computeWasteValue([{
      id: 'ouvert',
      canonical_name: 'Sel fin',
      qty_remaining: 250,
      unit: 'g',
      expiration_date: '2026-12-01',
      adjusted_expiration_date: '2026-08-27',
      is_opened: true,
    }], index, { today: '2026-08-25' })
    const [ligne] = vueLotsValorises(valeur.aRisque.lots)
    // Sans cette mention, un lot acheté la veille et déjà urgent paraîtrait
    // incohérent avec sa date imprimée.
    expect(ligne.dateRaccourcieParOuverture).toBe(true)
    expect(ligne.joursRestants).toBe(2)
  })
})
