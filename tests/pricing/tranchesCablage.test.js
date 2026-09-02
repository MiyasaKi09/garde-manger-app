import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TRANCHES } from '@/lib/domain/pricing/tranches'

/**
 * Ce test existe à cause d'une faute déjà commise dans ce dépôt, dans un autre
 * chantier : 392 descriptions de plats ont été écrites, chargées en base,
 * couvertes par cinq contrôles… et jamais affichées, parce que personne n'avait
 * câblé la lecture. Le travail était juste, complet, testé, et il n'existait pas
 * pour l'utilisateur.
 *
 * `tranches.js` importe les tranches STATIQUEMENT, une ligne par fichier. C'est
 * volontaire — l'import au build est ce qui garde le référentiel hors du
 * navigateur — mais ça crée exactement la même faille : écrire une tranche ne
 * suffit pas, il faut l'importer. Un fichier oublié ne produit ni erreur ni
 * avertissement. Il produit une couverture plus basse, que personne ne relie à sa
 * cause.
 *
 * D'où ce test, qui confronte le disque au câblage.
 */
const REPERTOIRE = join(process.cwd(), 'data', 'prices', 'tranches')

const fichiers = readdirSync(REPERTOIRE)
  .filter((nom) => nom.endsWith('.json'))
  .sort()

describe('le câblage des tranches', () => {
  it('importe toutes les tranches présentes sur le disque', () => {
    // `price_set_version` porte le nom de la tranche (« 2026.08-epicerie »), ce
    // qui permet de rapprocher un fichier de son import sans que le test ait à
    // relire les JSON lui-même — il lirait alors la donnée par un chemin que
    // l'application n'emprunte pas, et ne vérifierait plus rien.
    const importees = TRANCHES.map((tranche) => String(tranche.price_set_version || ''))
    const manquantes = fichiers.filter((nom) => {
      const cle = nom.replace(/\.json$/, '')
      return !importees.some((version) => version.endsWith(cle))
    })
    expect(
      manquantes,
      `tranche(s) écrite(s) mais jamais importée(s) par lib/domain/pricing/tranches.js : ${manquantes.join(', ')}`,
    ).toEqual([])
  })

  it('n’importe aucune tranche qui n’existe plus', () => {
    expect(TRANCHES.length).toBeLessThanOrEqual(fichiers.length)
  })

  it('chaque tranche importée porte des entrées exploitables', () => {
    expect(TRANCHES.length).toBeGreaterThan(0)
    for (const tranche of TRANCHES) {
      expect(Array.isArray(tranche.entries), `${tranche.price_set_version} sans entries`).toBe(true)
      expect(tranche.currency, `${tranche.price_set_version} sans devise`).toBe('EUR')
    }
  })
})
