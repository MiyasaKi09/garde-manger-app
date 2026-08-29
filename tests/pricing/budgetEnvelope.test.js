import { describe, it, expect } from 'vitest'
import {
  SEMAINES_PAR_MOIS,
  comparerEnveloppe,
  lireEnveloppe,
  normaliserEnveloppe,
  proraterEnveloppe,
  texteEnveloppe,
} from '@/components/pricing/budgetEnvelope'

const fourchette = (low, central, high) => ({ low, central, high })

describe('lireEnveloppe — l’absence d’enveloppe n’est pas une enveloppe vide', () => {
  it('rend null quand aucun montant n’est posé', () => {
    expect(lireEnveloppe(null)).toBeNull()
    expect(lireEnveloppe({})).toBeNull()
    expect(lireEnveloppe({ food_budget_low: null, food_budget_high: null, food_budget_period: 'month' })).toBeNull()
  })

  it('rend null quand la périodicité manque : 400 € « par quoi » ne veut rien dire', () => {
    expect(lireEnveloppe({ food_budget_high: 400, food_budget_period: null })).toBeNull()
  })

  it('accepte un plafond seul — on ne fabrique pas une borne basse par symétrie', () => {
    const enveloppe = lireEnveloppe({ food_budget_high: 400, food_budget_period: 'month', food_budget_currency: 'EUR' })
    expect(enveloppe).toMatchObject({ bas: null, haut: 400, periode: 'month' })
  })
})

describe('normaliserEnveloppe — le premier des deux filets', () => {
  const refus = (saisie) => {
    try {
      normaliserEnveloppe(saisie)
      return null
    } catch (error) {
      return error.message
    }
  }

  it('refuse zéro plutôt que de le prendre pour un effacement', () => {
    // Zéro n'est pas une enveloppe : c'est soit une absence, soit une
    // déclaration qu'on ne mange pas. Le transformer en NULL en silence
    // déciderait à la place de celui qui l'a tapé.
    expect(refus({ low: 0, period: 'week' })).toBe('borne_basse_non_positive')
    expect(refus({ high: 0, period: 'week' })).toBe('borne_haute_non_positive')
  })

  it('refuse une enveloppe sans montant, sans périodicité, ou aux bornes inversées', () => {
    expect(refus({ period: 'week' })).toBe('enveloppe_vide')
    expect(refus({ high: 120 })).toBe('periode_invalide')
    expect(refus({ low: 200, high: 100, period: 'month' })).toBe('bornes_inversees')
  })

  it('accepte la virgule décimale et arrondit au centime', () => {
    expect(normaliserEnveloppe({ low: '90.5', high: '110.239', period: 'week' }))
      .toEqual({ low: 90.5, high: 110.24, period: 'week', currency: 'EUR' })
  })
})

describe('proraterEnveloppe — un mois vaut 4,33 semaines, pas 4', () => {
  it('ramène une enveloppe mensuelle à la semaine', () => {
    const semaine = proraterEnveloppe({ bas: null, haut: 400, periode: 'month', devise: 'EUR' }, 'week')
    expect(semaine.haut).toBeCloseTo(400 / SEMAINES_PAR_MOIS, 6)
    expect(semaine.haut).toBeCloseTo(92.31, 2)
    expect(semaine.proratee).toBe(true)
  })

  it('ne prorate pas quand la période est déjà la bonne', () => {
    const enveloppe = { bas: 80, haut: 120, periode: 'week', devise: 'EUR' }
    expect(proraterEnveloppe(enveloppe, 'week')).toMatchObject({ haut: 120, proratee: false })
  })

  it('ne gonfle pas de 8 % le budget hebdomadaire, comme le ferait « 4 semaines »', () => {
    // Un foyer qui tiendrait 100 €/semaine dépenserait 433 €/mois en s'entendant
    // dire chaque semaine qu'il est dans son enveloppe de 400 €. Une erreur qui
    // alarme finit par se faire remarquer ; une erreur qui rassure, jamais.
    const juste = proraterEnveloppe({ haut: 400, periode: 'month' }, 'week').haut
    expect(juste).toBeLessThan(400 / 4)
    expect(juste * SEMAINES_PAR_MOIS).toBeCloseTo(400, 6)
  })
})

describe('comparerEnveloppe — quatre états, et un seul qui affirme', () => {
  const enveloppe = { bas: 80, haut: 120, periode: 'week', devise: 'EUR', proratee: false }

  it('affirme le dépassement seulement quand la borne BASSE dépasse le plafond', () => {
    expect(comparerEnveloppe(fourchette(130, 140, 150), enveloppe).etat).toBe('dessus')
    // Une fourchette qui chevauche le plafond ne dépasse que peut-être. Alerter
    // là-dessus reviendrait à alerter en permanence, donc à n'alerter jamais.
    expect(comparerEnveloppe(fourchette(110, 125, 140), enveloppe).etat).toBe('dedans')
  })

  it('affirme le dépassement même sur un minorant : ajouter n’y changera rien', () => {
    expect(comparerEnveloppe(fourchette(130, 140, 150), enveloppe, { minorant: true }).etat).toBe('dessus')
  })

  it('n’affirme JAMAIS « en dessous » sur un minorant', () => {
    // Les lignes non chiffrées ne peuvent qu'ajouter : le vrai panier est
    // quelque part au-dessus, et personne ne sait de combien.
    expect(comparerEnveloppe(fourchette(20, 30, 40), enveloppe, { minorant: false }).etat).toBe('dessous')
    expect(comparerEnveloppe(fourchette(20, 30, 40), enveloppe, { minorant: true }).etat).toBe('indetermine')
  })

  it('rend null quand il n’y a rien à comparer', () => {
    expect(comparerEnveloppe(null, enveloppe)).toBeNull()
    expect(comparerEnveloppe(fourchette(1, 2, 3), null)).toBeNull()
  })

  it('écrit le verdict avec l’enveloppe à côté, pour qu’il soit vérifiable', () => {
    const verdict = comparerEnveloppe(fourchette(130, 140, 150), enveloppe)
    expect(texteEnveloppe(verdict))
      .toBe('au-dessus de votre enveloppe · 80,00 € – 120,00 € par semaine')
  })

  it('signale le prorata quand l’enveloppe a été ramenée à la semaine', () => {
    const proratee = proraterEnveloppe({ haut: 400, periode: 'month' }, 'week')
    const verdict = comparerEnveloppe(fourchette(130, 140, 150), proratee)
    expect(texteEnveloppe(verdict)).toContain('(au prorata)')
    expect(texteEnveloppe(verdict)).toContain('plafond')
  })
})
