import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * La reprise du corpus historique réécrit des recettes existantes : elle ne les
 * ajoute pas. Le versement doit donc accepter un remplacement — mais seulement
 * DÉCLARÉ, et seulement juste. Chaque cas ci-dessous est une façon de se tromper
 * de cible, et se tromper de cible c'est écraser une recette sans l'avoir
 * regardée.
 */
const RACINE = process.cwd()
const SCRIPT = join(RACINE, 'scripts', 'data', 'recipes', 'merge-recipe-batch.mjs')
const corpus = JSON.parse(readFileSync(join(RACINE, 'data', 'recipes', 'corpus-v3.json'), 'utf8'))
const dossier = mkdtempSync(join(tmpdir(), 'myko-reprise-'))

const existante = corpus.recipes.find((recette) => recette.code === 'FR-025')

const fusionner = (recettes) => {
  const fichier = join(dossier, `lot-${Math.abs(JSON.stringify(recettes).length)}.json`)
  writeFileSync(fichier, JSON.stringify({ recipes: recettes }), 'utf8')
  try {
    return { code: 0, sortie: execFileSync('node', [SCRIPT, fichier, '--dry-run'], { encoding: 'utf8' }) }
  } catch (erreur) {
    return { code: erreur.status ?? 1, sortie: `${erreur.stdout || ''}${erreur.stderr || ''}` }
  }
}

describe('reprise d’une recette existante au versement', () => {
  it('refuse une collision de code non déclarée', () => {
    const { code, sortie } = fusionner([{ ...existante }])
    expect(code).not.toBe(0)
    expect(sortie).toMatch(/code déjà pris.*ajouter « remplace »/)
  })

  // Le code est la référence du planning et de l'historique des repas. Une
  // reprise qui en change orphelinerait ce qui a déjà été cuisiné.
  it('refuse un code neuf qui prétend remplacer une autre recette', () => {
    const { code, sortie } = fusionner([{ ...existante, code: 'ZZZ-001', remplace: 'FR-025' }])
    expect(code).not.toBe(0)
    expect(sortie).toMatch(/garde le code de la recette qu’elle remplace|garde le code de la recette qu'elle remplace/)
  })

  it('refuse un remplacement dont la cible n’existe pas', () => {
    const { code, sortie } = fusionner([{ ...existante, code: 'ZZZ-002', family: 'Plat inexistant témoin', remplace: 'ZZZ-002' }])
    expect(code).not.toBe(0)
    expect(sortie).toMatch(/absent du corpus/)
  })

  // Renommer est permis — une recette reprise peut mériter un nom plus juste —
  // mais pas vers un nom qu'une autre recette porte déjà.
  it('refuse une reprise qui prend le nom d’une autre recette', () => {
    const autre = corpus.recipes.find((recette) => recette.code !== 'FR-025' && recette.family)
    const { code, sortie } = fusionner([{ ...existante, family: autre.family, remplace: 'FR-025' }])
    expect(code).not.toBe(0)
    expect(sortie).toMatch(/déjà porté par/)
  })

  it('accepte une reprise déclarée et n’augmente pas le compte de recettes', () => {
    const reprise = {
      ...existante,
      remplace: 'FR-025',
      steps: Array.from({ length: 6 }, (_, index) => ({
        n: index + 1,
        instruction: `Étape ${index + 1} réécrite depuis le dossier de sources, assez longue pour ne plus compter parmi les étapes maigres.`,
      })),
    }
    const { code, sortie } = fusionner([reprise])
    expect(code).toBe(0)
    expect(sortie).toMatch(/1 recette\(s\) reprise\(s\)/)
    expect(sortie).toMatch(/4 → 6 étapes/)
    expect(sortie).toMatch(new RegExp(`${corpus.recipes.length} → ${corpus.recipes.length} \\(0 ajout`))
  })
})
