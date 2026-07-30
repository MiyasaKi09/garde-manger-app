import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Retirer une recette est la seule opération du versement qui SOUSTRAIT. Elle
 * n'efface rien en base — la ligne reste, marquée — mais elle sort la recette du
 * corpus, donc du catalogue et du planificateur. Un retrait de trop est donc un
 * plat qui disparaît de l'application sans que personne l'ait décidé.
 *
 * Chaque cas ci-dessous est un retrait qui laisserait le corpus incohérent, et
 * que le versement doit refuser AVANT d'écrire quoi que ce soit.
 */
const RACINE = process.cwd()
const SCRIPT = join(RACINE, 'scripts', 'data', 'recipes', 'merge-recipe-batch.mjs')
const corpus = JSON.parse(readFileSync(join(RACINE, 'data', 'recipes', 'corpus-v3.json'), 'utf8'))

const retirer = (args) => {
  try {
    return { code: 0, sortie: execFileSync('node', [SCRIPT, ...args, '--dry-run'], { encoding: 'utf8' }) }
  } catch (erreur) {
    return { code: erreur.status ?? 1, sortie: `${erreur.stdout || ''}${erreur.stderr || ''}` }
  }
}

// Une base dont au moins une variante dérive : la retirer laisserait ses
// dérivées sans parent, et une dérivée sans base n'a plus de quoi se calculer.
const baseAvecDerivees = corpus.recipes.find((recette) =>
  corpus.recipes.some((autre) => autre.derived_from === recette.code))

describe('retrait d’une recette du corpus', () => {
  it('refuse un code absent du corpus', () => {
    const { code, sortie } = retirer(['--retirer', 'ZZZ-999', '--motif', 'témoin'])
    expect(code).not.toBe(0)
    expect(sortie).toMatch(/n'est pas au corpus/)
  })

  // Un retrait sans motif est illisible six mois plus tard : on sait qu'un plat
  // a disparu, pas pourquoi, donc on ne peut ni le défendre ni le refaire.
  it('refuse un retrait sans motif', () => {
    const { code, sortie } = retirer(['--retirer', 'FR-025'])
    expect(code).not.toBe(0)
    expect(sortie).toMatch(/sans motif ne se relit pas/)
  })

  it('refuse de retirer une base dont des variantes dérivent', () => {
    expect(baseAvecDerivees).toBeTruthy()
    const { code, sortie } = retirer(['--retirer', baseAvecDerivees.code, '--motif', 'témoin'])
    expect(code).not.toBe(0)
    expect(sortie).toMatch(/dérivent de/)
    expect(sortie).toMatch(/orphelines/)
  })

  it('accepte un retrait motivé et décompte une recette', () => {
    const { code, sortie } = retirer(['--retirer', 'FR-025', '--motif', 'Retrait témoin de test, jamais versé.'])
    expect(code).toBe(0)
    expect(sortie).toMatch(new RegExp(`${corpus.recipes.length} → ${corpus.recipes.length - 1} \\(0 ajout`))
    expect(sortie).toMatch(/1 retrait/)
  })
})
