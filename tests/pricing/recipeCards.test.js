import { describe, it, expect } from 'vitest'
import { getCanonicalRecipeCards } from '@/lib/domain/recipes/canonicalCatalog'
import { vueCoutCarte } from '@/components/pricing/estimationView'

/**
 * Les cartes de catalogue portent le coût par portion. Ces tests s'appuient sur
 * le référentiel RÉEL — c'est assumé, et c'est pourquoi ils n'affirment aucun
 * montant : ils vérifient la FORME du contrat entre la couche de domaine, qui
 * transporte des nombres, et la couche de rédaction, qui les met en mots. Un
 * test qui figerait un prix ici mesurerait l'avancement du référentiel plutôt
 * que la justesse du chemin d'affichage.
 */

const cartes = getCanonicalRecipeCards({ today: '2026-08-29' })

describe('getCanonicalRecipeCards — le coût a sa place dans canonical_quality', () => {
  it('pose un bloc `cost` sur chaque carte, à côté de la couverture nutritionnelle', () => {
    expect(cartes.length).toBeGreaterThan(0)
    for (const carte of cartes) {
      const cout = carte.canonical_quality.cost
      expect(cout).toBeTruthy()
      expect(cout.couverture).toHaveProperty('quantified')
      expect(typeof cout.affichable).toBe('boolean')
      expect(cout.parPortion).toBe(true)
    }
  })

  it('transporte des nombres et un verdict, jamais des chaînes déjà rédigées', () => {
    // C'est ce qui garde l'ordre des dépendances : le domaine calcule, la
    // présentation rédige, et aucun `lib/` n'importe de `components/`.
    const chiffree = cartes.find((carte) => carte.canonical_quality.cost.affichable)
    expect(chiffree).toBeTruthy()
    expect(typeof chiffree.canonical_quality.cost.fourchette.central).toBe('number')
  })

  it('rend le montant par portion avec son compte de lignes chiffrées (§8.5)', () => {
    const chiffree = cartes.find((carte) => carte.canonical_quality.cost.affichable)
    const vue = vueCoutCarte(chiffree.canonical_quality.cost)
    expect(vue.montant).toMatch(/^\d+,\d\d €$/)
    expect(vue.quantified).toBeGreaterThan(0)
    expect(vue.priced).toBeGreaterThan(0)
    // §7.1 : la date reste attachée au montant, même sur une carte.
    expect(vue.mois).toBeTruthy()
  })

  it('refuse un montant plutôt que d’en composer un sur une couverture trop faible (§8.1)', () => {
    // L'état partiel est le régime de croisière : une bonne partie du catalogue
    // n'atteint pas les deux seuils, et ces cartes doivent le dire sans montant.
    const refusee = cartes.find((carte) => !carte.canonical_quality.cost.affichable)
    expect(refusee).toBeTruthy()
    const vue = vueCoutCarte(refusee.canonical_quality.cost)
    expect(vue.montant).toBeNull()
    expect(vue.indisponibleTexte).toContain('sans prix sourcé')
  })

  it('ne trie jamais les cartes par montant (§8.4)', () => {
    // Une recette paraît moins chère quand elle est moins couverte : trier des
    // couvertures inégales, c'est trier par ignorance. L'ordre du catalogue
    // reste celui du corpus.
    const codes = cartes.map((carte) => carte.id)
    const parCout = [...cartes]
      .sort((a, b) => (a.canonical_quality.cost.fourchette?.central ?? Infinity)
        - (b.canonical_quality.cost.fourchette?.central ?? Infinity))
      .map((carte) => carte.id)
    expect(codes).not.toEqual(parCout)
  })
})
