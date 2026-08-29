import { describe, it, expect } from 'vitest'
import { buildPriceIndex } from '@/lib/domain/pricing/priceIndex'
import { articleVersLigneDeCout, estimationCourses } from '@/app/_pricing/estimations'
import { entree, jeu } from './fixtures'

/**
 * La liste de courses se chiffre au CONTENANT (§6.2) : on n'achète pas 230 g
 * d'huile, on achète une bouteille. Ces tests portent sur le seul endroit du
 * chemin d'affichage où une quantité est calculée — le passage du
 * conditionnement saisi par l'utilisateur aux trois quantités que la couche de
 * coût attend.
 */

const index = buildPriceIndex([jeu({
  entries: [
    entree({ form: 'Oignon jaune cru', formNormalized: 'oignon jaune cru', central: 2, low: 2, high: 2 }),
    entree({ form: 'Sel fin', formNormalized: 'sel fin', central: 1, low: 1, high: 1 }),
    entree({ form: 'Poivre noir moulu', formNormalized: 'poivre noir moulu', central: 20, low: 20, high: 20 }),
  ],
})])

const article = (over = {}) => ({
  product_name: 'Oignon jaune cru',
  category: 'Légumes',
  week_label: 'Semaine 1',
  quantity: '600 g',
  ...over,
})

describe('articleVersLigneDeCout — du conditionnement à la quantité d’achat', () => {
  it('achète des contenants entiers quand le conditionnement est renseigné', () => {
    const { ligne, contenantConnu } = articleVersLigneDeCout(article({
      container_qty: 2, container_size: 500, container_unit: 'g',
    }))
    expect(contenantConnu).toBe(true)
    expect(ligne.purchase_qty).toBe(1000)
    expect(ligne.purchase_unit).toBe('g')
    // Le besoin et le surplus suivent : c'est l'écart qui explique pourquoi une
    // semaine à 62 € de courses ne « coûte » pas 62 € de nourriture mangée.
    expect(ligne.exact_required_qty).toBe(600)
    expect(ligne.projected_surplus_qty).toBe(400)
  })

  it('retombe sur le besoin quand le conditionnement manque, et le signale', () => {
    const { ligne, contenantConnu } = articleVersLigneDeCout(article())
    expect(contenantConnu).toBe(false)
    // Ce n'est pas un nombre inventé : c'est une quantité connue employée comme
    // borne inférieure, puisqu'on n'achète jamais moins que ce qu'on utilise.
    expect(ligne.purchase_qty).toBe(600)
    expect(ligne.projected_surplus_qty).toBe(0)
  })

  it('refuse de comparer des grammes à des litres plutôt que de supposer une densité', () => {
    const { ligne } = articleVersLigneDeCout(article({
      quantity: '600 g', container_qty: 2, container_size: 1, container_unit: 'l',
    }))
    expect(ligne.purchase_qty).toBe(2)
    expect(ligne.purchase_unit).toBe('l')
    expect(ligne.exact_required_qty).toBeUndefined()
    // NaN et non 0 : un surplus faussement nul se serait affiché comme une
    // certitude, alors qu'il est simplement indéterminable.
    expect(Number.isNaN(ligne.projected_surplus_qty)).toBe(true)
  })

  it('normalise les quantités écrites à la française, annotations comprises', () => {
    expect(articleVersLigneDeCout(article({ quantity: '1,5 kg (400 g en stock)' })).ligne.purchase_qty).toBe(1500)
    expect(articleVersLigneDeCout(article({ quantity: '2 x 400 g' })).ligne.purchase_qty).toBe(800)
  })
})

describe('estimationCourses — par semaine, et jamais l’un pour l’autre', () => {
  const items = [
    article({ quantity: '1 kg', container_qty: 1, container_size: 1000, container_unit: 'g' }),
    article({ product_name: 'Sel fin', quantity: '500 g' }),
    article({ week_label: 'Semaine 2', quantity: '2 kg', container_qty: 2, container_size: 1000, container_unit: 'g' }),
  ]

  it('découpe par semaine et rend aussi le total', () => {
    const estimation = estimationCourses(items, { index, today: '2026-08-25' })
    expect(Object.keys(estimation.parSemaine)).toEqual(['Semaine 1', 'Semaine 2'])
    expect(estimation.parSemaine['Semaine 1'].articles).toBe(2)
    expect(estimation.total.articles).toBe(3)
  })

  it('affiche `coutAchat`, en contenants, et non ce qui sera mangé', () => {
    const semaine = estimationCourses(items, { index, today: '2026-08-25' }).parSemaine['Semaine 1']
    // 1 kg d'oignon à 2 €/kg + 500 g de sel à 1 €/kg = 2,50 €
    expect(semaine.achat.montant).toBe('2,50 €')
    expect(semaine.achat.prefixe).toBe('Estimation ≈')
  })

  it('compte les articles sans conditionnement, pour que l’écran puisse le dire', () => {
    const estimation = estimationCourses(items, { index, today: '2026-08-25' })
    // La différence entre « il manque des prix » et « il manque une saisie » :
    // la seconde, l'utilisateur peut la corriger lui-même sur cette page.
    expect(estimation.parSemaine['Semaine 1'].sansContenant).toBe(1)
    expect(estimation.parSemaine['Semaine 2'].sansContenant).toBe(0)
  })

  it('ne confronte pas un total de plusieurs semaines à une enveloppe hebdomadaire', () => {
    const enveloppe = { bas: 1, haut: 2, periode: 'week', devise: 'EUR' }
    const estimation = estimationCourses(items, { index, today: '2026-08-25', enveloppe })
    // Additionner quatre semaines et les comparer à une enveloppe de semaine
    // annoncerait un dépassement mécanique, vrai de toute liste mensuelle.
    expect(estimation.total.budget).toBeNull()
    expect(estimation.parSemaine['Semaine 1'].budget.etat).toBe('dessus')
    expect(estimation.parSemaine['Semaine 1'].budget.texte).toContain('au-dessus de votre enveloppe')
  })

  it('sur une liste d’une seule semaine, le total EST la semaine et se confronte', () => {
    const uneSemaine = items.filter((item) => item.week_label === 'Semaine 1')
    const enveloppe = { bas: 10, haut: 40, periode: 'week', devise: 'EUR' }
    const estimation = estimationCourses(uneSemaine, { index, today: '2026-08-25', enveloppe })
    expect(estimation.total.budget.etat).toBe('dessous')
  })

  it('n’affirme pas « en dessous » quand des articles n’ont pas de prix sourcé', () => {
    const avecInconnu = [
      article({ quantity: '1 kg', container_qty: 1, container_size: 1000, container_unit: 'g' }),
      article({ product_name: 'Sel fin', quantity: '900 g', container_qty: 1, container_size: 900, container_unit: 'g' }),
      article({ product_name: 'Poivre noir moulu', quantity: '10 g', container_qty: 1, container_size: 10, container_unit: 'g' }),
      article({ product_name: 'Safran en pistils', quantity: '2 g', container_qty: 1, container_size: 2, container_unit: 'g' }),
    ]
    const enveloppe = { bas: 50, haut: 90, periode: 'week', devise: 'EUR' }
    const estimation = estimationCourses(avecInconnu, { index, today: '2026-08-25', enveloppe })
    expect(estimation.parSemaine['Semaine 1'].achat.prefixe).toBe('Au moins')
    // Le vrai panier est quelque part au-dessus du minorant : on ne peut pas
    // affirmer qu'il tient sous l'enveloppe.
    expect(estimation.parSemaine['Semaine 1'].budget.etat).toBe('indetermine')
  })
})
