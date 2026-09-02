import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildPriceIndex,
  trouverPrix,
  metadonneesReferentiel,
  obtenirIndexPrix,
  reinitialiserIndexPrix,
  INDEX_PRIX_VIDE,
} from '@/lib/domain/pricing/priceIndex'
import { entree, jeu } from './fixtures'

describe('buildPriceIndex — le référentiel vide', () => {
  it('rend l\'index vide sans lever, quelle que soit l\'entrée dégénérée', () => {
    for (const cas of [null, undefined, [], [null], [{}], [{ entries: null }]]) {
      const index = buildPriceIndex(cas)
      expect(index.empty).toBe(true)
      expect(index.formCount).toBe(0)
    }
  })

  it('rend un motif exploitable plutôt qu\'un null nu', () => {
    expect(trouverPrix(INDEX_PRIX_VIDE, 'Oignon jaune cru')).toEqual({
      trouve: false,
      raison: 'referentiel_vide',
      entree: null,
    })
  })

  it('distingue « référentiel vide » de « forme non couverte »', () => {
    const index = buildPriceIndex([jeu({ entries: [entree()] })])
    expect(trouverPrix(index, 'Safran en pistils').raison).toBe('forme_non_couverte')
  })
})

describe('buildPriceIndex — le filtrage à l\'entrée (§9)', () => {
  it('n\'expose jamais une entrée en C : ici, C équivaut à l\'absence', () => {
    const index = buildPriceIndex([jeu({ entries: [entree({ confidence: 'C' })] })])
    expect(index.formCount).toBe(0)
    expect(trouverPrix(index, 'oignon jaune cru').raison).toBe('referentiel_vide')
    expect(index.rejected).toContainEqual(expect.objectContaining({ raison: 'confiance_insuffisante' }))
  })

  it('retient A et B', () => {
    const index = buildPriceIndex([jeu({
      entries: [
        entree({ formNormalized: 'a', confidence: 'A' }),
        entree({ formNormalized: 'b', confidence: 'B' }),
      ],
    })])
    expect(index.formCount).toBe(2)
  })

  it('écarte un relevé de plus de 24 mois — §5.3', () => {
    const index = buildPriceIndex([jeu({
      referenceDate: '2026-08-24',
      entries: [entree({ observedOn: '2024-06-30' })],
    })])
    expect(index.formCount).toBe(0)
    expect(index.rejected).toContainEqual(expect.objectContaining({ raison: 'prix_perime' }))
  })

  it('retient un relevé de 23 mois — la limite est à 24, pas avant', () => {
    const index = buildPriceIndex([jeu({
      referenceDate: '2026-08-24',
      entries: [entree({ observedOn: '2024-09-24' })],
    })])
    expect(index.formCount).toBe(1)
  })

  it('écarte une fourchette inversée au lieu de la retourner', () => {
    const index = buildPriceIndex([jeu({ entries: [entree({ low: 5, central: 3, high: 4, incoherenceVoulue: true })] })])
    expect(index.rejected).toContainEqual(expect.objectContaining({ raison: 'fourchette_inversee' }))
  })

  it('écarte un rendement hors de ]0, 1]', () => {
    const index = buildPriceIndex([jeu({ entries: [entree({ yieldValue: 1.5, yieldKnown: true })] })])
    expect(index.rejected).toContainEqual(expect.objectContaining({ raison: 'rendement_hors_domaine' }))
  })

  it('écarte un rendement ≠ 1 non sourcé plutôt que de le ramener à 1', () => {
    // Ramener à 1 masquerait le défaut ; refuser le signale. Le rendement est la
    // porte de service par laquelle les nombres inventés entreraient (§2.2).
    const index = buildPriceIndex([jeu({ entries: [entree({ yieldValue: 0.8, yieldKnown: false })] })])
    expect(index.formCount).toBe(0)
    expect(index.rejected).toContainEqual(expect.objectContaining({ raison: 'rendement_non_source' }))
  })

  it('accepte un rendement ≠ 1 accompagné de sa provenance', () => {
    const index = buildPriceIndex([jeu({ entries: [entree({ yieldValue: 0.8, yieldKnown: true })] })])
    expect(index.formCount).toBe(1)
    expect(trouverPrix(index, 'oignon jaune cru').entree.edibleYield).toMatchObject({ value: 0.8, known: true })
  })

  it('refuse un jeu déclarant une autre version de schéma', () => {
    const index = buildPriceIndex([jeu({ schemaVersion: '2.0.0', entries: [entree()] })])
    expect(index.formCount).toBe(0)
    expect(index.rejected).toContainEqual(expect.objectContaining({ raison: 'schema_version_incompatible' }))
  })
})

describe('buildPriceIndex — le référentiel PARTIEL est un état normal', () => {
  it('sert les formes couvertes et motive les autres', () => {
    const index = buildPriceIndex([jeu({
      entries: [
        entree({ form: 'Sel fin', formNormalized: 'sel fin' }),
        entree({ form: 'Safran en pistils', formNormalized: 'safran en pistils', confidence: 'C' }),
      ],
    })])
    expect(index.formCount).toBe(1)
    expect(trouverPrix(index, 'Sel fin').trouve).toBe(true)
    expect(trouverPrix(index, 'Safran en pistils').trouve).toBe(false)
  })

  it('ne rend pas la couche inopérante quand une seule forme est couverte', () => {
    const index = buildPriceIndex([jeu({ entries: [entree()] })])
    expect(index.empty).toBe(false)
    expect(metadonneesReferentiel(index).formCount).toBe(1)
  })
})

describe('trouverPrix — la jointure', () => {
  const index = buildPriceIndex([jeu({ entries: [entree({ form: 'Œuf cru', formNormalized: 'oeuf cru' })] })])

  it('accepte le libellé du catalogue comme la clé déjà normalisée', () => {
    expect(trouverPrix(index, 'Œuf cru').trouve).toBe(true)
    expect(trouverPrix(index, 'oeuf cru').trouve).toBe(true)
    expect(trouverPrix(index, "  ŒUF   CRU ").trouve).toBe(true)
  })

  it('ne rapproche jamais « à peu près » deux formes voisines', () => {
    expect(trouverPrix(index, 'Œuf dur').trouve).toBe(false)
    expect(trouverPrix(index, 'Œuf').trouve).toBe(false)
  })

  it('refuse tout quand le référentiel est éteint — §5.4', () => {
    const vieux = buildPriceIndex([jeu({ referenceDate: '2024-01-15', entries: [entree({ observedOn: '2024-01-10' })] })], { today: '2026-08-24' })
    expect(vieux.stale).toBe(true)
    expect(trouverPrix(vieux, 'oignon jaune cru')).toEqual({ trouve: false, raison: 'referentiel_perime', entree: null })
  })

  it('ne s\'éteint pas à 24 mois pile', () => {
    const index24 = buildPriceIndex([jeu({ referenceDate: '2024-08-24', entries: [entree({ observedOn: '2024-08-24' })] })], { today: '2026-08-24' })
    expect(index24.ageMonths).toBe(24)
    expect(index24.stale).toBe(false)
  })
})

describe('buildPriceIndex — la collision entre tranches', () => {
  const ancienne = entree({ formNormalized: 'huile d olive vierge extra', low: 14, central: 15.35, high: 17, observedOn: '2026-03-08', confidence: 'B' })
  const recente = entree({ formNormalized: 'huile d olive vierge extra', low: 13, central: 14.77, high: 16, observedOn: '2026-08-24', confidence: 'B' })

  it('garde le relevé le plus frais à confiance égale, et l\'enregistre', () => {
    const index = buildPriceIndex([
      jeu({ entries: [ancienne], priceSetVersion: 'assaisonnement' }),
      jeu({ entries: [recente], priceSetVersion: 'epicerie' }),
    ])
    expect(index.formCount).toBe(1)
    expect(trouverPrix(index, 'huile d olive vierge extra').entree.perKg.central).toBe(14.77)
    expect(index.conflicts).toHaveLength(1)
    expect(index.conflicts[0]).toMatchObject({ formNormalized: 'huile d olive vierge extra', retained: 'epicerie', resolved: true })
  })

  it('préfère la confiance à la fraîcheur', () => {
    const index = buildPriceIndex([
      jeu({ entries: [entree({ formNormalized: 'x', low: 8, central: 9, high: 10, observedOn: '2026-08-24', confidence: 'B' })], priceSetVersion: 'recent-b' }),
      jeu({ entries: [entree({ formNormalized: 'x', low: 6, central: 7, high: 8, observedOn: '2026-01-01', confidence: 'A' })], priceSetVersion: 'ancien-a' }),
    ])
    expect(trouverPrix(index, 'x').entree.perKg.central).toBe(7)
  })

  it('départage par le nombre d\'observations à confiance et fraîcheur égales', () => {
    const index = buildPriceIndex([
      jeu({ entries: [entree({ formNormalized: 'y', low: 8, central: 9, high: 10, nObservations: 5 })], priceSetVersion: 'peu' }),
      jeu({ entries: [entree({ formNormalized: 'y', low: 6, central: 7, high: 8, nObservations: 50 })], priceSetVersion: 'beaucoup' }),
    ])
    expect(trouverPrix(index, 'y').entree.perKg.central).toBe(7)
  })

  it('refuse la forme entière quand plus rien ne départage — plutôt que de choisir en secret', () => {
    const index = buildPriceIndex([
      jeu({ entries: [entree({ formNormalized: 'z', low: 8, central: 9, high: 10 })], priceSetVersion: 'gauche' }),
      jeu({ entries: [entree({ formNormalized: 'z', low: 6, central: 7, high: 8 })], priceSetVersion: 'droite' }),
    ])
    expect(index.formCount).toBe(0)
    expect(index.conflicts[0].resolved).toBe(false)
    expect(index.rejected).toContainEqual(expect.objectContaining({ raison: 'conflit_non_departageable' }))
  })

  it('ne fabrique jamais une fourchette élargie par fusion des deux relevés', () => {
    const index = buildPriceIndex([
      jeu({ entries: [ancienne], priceSetVersion: 'a' }),
      jeu({ entries: [recente], priceSetVersion: 'b' }),
    ])
    const retenue = trouverPrix(index, 'huile d olive vierge extra').entree
    // Les bornes retenues sont celles d'UN relevé citable, pas l'enveloppe des deux.
    expect(retenue.perKg.low).toBe(13)
    expect(retenue.perKg.high).toBe(16)
  })
})

describe('buildPriceIndex — la licence du référentiel recollé', () => {
  it('laisse passer une licence unique non contaminante', () => {
    const index = buildPriceIndex([jeu({ entries: [entree({ licenseCode: 'etalab-2.0' })] })])
    expect(index.derivedLicense).toBe('etalab-2.0')
  })

  it('impose ODbL dès qu\'une entrée retenue est à partage à l\'identique', () => {
    const index = buildPriceIndex([
      jeu({ entries: [entree({ formNormalized: 'a', licenseCode: 'etalab-2.0' })] }),
      jeu({ entries: [entree({ formNormalized: 'b', licenseCode: 'odbl-1.0', sourceCode: 'open_prices', shareAlike: true })] }),
    ])
    expect(index.derivedLicense).toBe('odbl-1.0')
  })

  it('ne contamine pas quand la seule entrée ODbL a été écartée', () => {
    // Une tranche ODbL dont tous les chiffres sont refusés n'impose plus rien :
    // aucun de ses chiffres n'est servi.
    const index = buildPriceIndex([
      jeu({ entries: [entree({ formNormalized: 'a', licenseCode: 'etalab-2.0' })] }),
      jeu({ entries: [entree({ formNormalized: 'b', licenseCode: 'odbl-1.0', shareAlike: true, confidence: 'C' })] }),
    ])
    expect(index.derivedLicense).toBe('etalab-2.0')
  })

  it('énumère les attributions dues', () => {
    const index = buildPriceIndex([jeu({
      entries: [
        entree({ formNormalized: 'a', sourceCode: 'rnm_franceagrimer' }),
        entree({ formNormalized: 'b', sourceCode: 'open_prices' }),
        entree({ formNormalized: 'c', sourceCode: 'rnm_franceagrimer' }),
      ],
    })])
    expect(index.attributions).toEqual(['open_prices', 'rnm_franceagrimer'])
  })
})

describe('buildPriceIndex — les métadonnées imposées par le §7.1', () => {
  it('date le référentiel par la tranche la PLUS ANCIENNE', () => {
    const index = buildPriceIndex([
      jeu({ referenceDate: '2026-08-24', entries: [entree({ formNormalized: 'a' })] }),
      jeu({ referenceDate: '2026-05-01', entries: [entree({ formNormalized: 'b', observedOn: '2026-04-30' })] }),
    ])
    // Annoncer la plus récente ferait passer un jeu partiellement ancien pour frais.
    expect(index.referenceDate).toBe('2026-05-01')
  })

  it('expose tout ce qu\'un montant doit porter à l\'écran', () => {
    const meta = metadonneesReferentiel(buildPriceIndex([jeu({ entries: [entree()] })], { today: '2026-08-24' }))
    expect(meta).toMatchObject({ referenceDate: '2026-08-24', currency: 'EUR', country: 'FR', formCount: 1, stale: false })
  })
})

describe('obtenirIndexPrix — le référentiel versionné du dépôt', () => {
  beforeEach(() => reinitialiserIndexPrix())

  it('se construit sans lever sur les tranches réellement présentes', () => {
    const index = obtenirIndexPrix({ today: '2026-08-24' })
    expect(index.formCount).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(index.rejected)).toBe(true)
  })

  it('n\'expose que des entrées A ou B', () => {
    for (const entreeIndexee of obtenirIndexPrix({ today: '2026-08-24' }).entries.values()) {
      expect(['A', 'B']).toContain(entreeIndexee.confidence)
    }
  })

  it('n\'expose que des per_kg positifs et ordonnés', () => {
    for (const e of obtenirIndexPrix({ today: '2026-08-24' }).entries.values()) {
      expect(e.perKg.low).toBeGreaterThan(0)
      expect(e.perKg.low).toBeLessThanOrEqual(e.perKg.central)
      expect(e.perKg.central).toBeLessThanOrEqual(e.perKg.high)
    }
  })

  it('mémoïse par jour et non par instant', () => {
    expect(obtenirIndexPrix({ today: '2026-08-24' })).toBe(obtenirIndexPrix({ today: '2026-08-24' }))
    expect(obtenirIndexPrix({ today: '2026-08-24' })).not.toBe(obtenirIndexPrix({ today: '2026-08-25' }))
  })

  it('s\'éteint quand la date d\'affichage dépasse le référentiel de plus de 24 mois', () => {
    expect(obtenirIndexPrix({ today: '2030-01-01' }).stale).toBe(true)
  })
})
