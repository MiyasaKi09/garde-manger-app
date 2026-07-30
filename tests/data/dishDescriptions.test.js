import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DESCRIPTIONS } from '../../scripts/data/recipes/assign-dish-descriptions.mjs'

/**
 * Ces tests protègent le champ `description_courte` du corpus.
 *
 * Une description courte sert au planificateur : elle s'affiche sur une ligne,
 * sous le nom de la recette, pour que l'utilisateur comprenne d'un coup d'œil
 * ce qu'il va manger. « İmam bayıldı » sans description, c'est le blanc que
 * ces tests ferment.
 *
 * Règles vérifiées :
 * — non vide (une recette publiable sans description est un blanc d'affichage)
 * — phrase unique (pas de point suivi d'une lettre majuscule à l'intérieur)
 * — sans superlatifs (le corpus décrit, il ne vend pas)
 */

const corpus = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'corpus-v3.json'), 'utf8'))
const rapport = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'out', 'recipe-food-match-report.json'), 'utf8'))

const publiables = new Set(
  rapport.recipe_eligibility
    .filter((r) => r.eligible_for_publication)
    .map((r) => r.code),
)

const parCode = new Map(corpus.recipes.map((r) => [r.code, r]))

const SUPERLATIFS = [
  'délicieux', 'délicieuse', 'délicieuses', 'délicieux',
  'savoureux', 'savoureuse', 'savoureuses',
  'exquis', 'exquise', 'exquises',
  'magnifique', 'magnifiques',
  'parfait', 'parfaite', 'parfaites', 'parfaits',
  'incroyable', 'incroyables',
  'succulent', 'succulente', 'succulents', 'succulentes',
  'irrésistible', 'irrésistibles',
  'merveilleux', 'merveilleuse', 'merveilleuses',
  'exceptionnel', 'exceptionnelle', 'exceptionnels', 'exceptionnelles',
  'fantastique', 'fantastiques',
  'divin', 'divine', 'divins', 'divines',
  'sublime', 'sublimes',
  'incomparable', 'incomparables',
]

describe('descriptions courtes du corpus', () => {
  it('le script couvre au moins toutes les recettes publiables', () => {
    // Le script peut couvrir des recettes non publiables (ça ne casse rien),
    // mais il ne doit pas laisser de publiable sans entrée.
    const manquantes = [...publiables].filter((code) => !Object.hasOwn(DESCRIPTIONS, code))
    expect(
      manquantes,
      `${manquantes.length} recette(s) publiable(s) sans description dans DESCRIPTIONS : ${manquantes.slice(0, 5).join(', ')}`,
    ).toHaveLength(0)
  })

  it('chaque recette publiable a une description_courte non vide dans le corpus', () => {
    const manquantes = []
    for (const code of publiables) {
      const recette = parCode.get(code)
      if (!recette) continue
      if (!recette.description_courte || recette.description_courte.trim() === '') {
        manquantes.push(`${code} ${recette.family}`)
      }
    }
    expect(
      manquantes,
      `${manquantes.length} recette(s) publiable(s) sans description_courte : ${manquantes.slice(0, 5).join(', ')}`,
    ).toHaveLength(0)
  })

  it('chaque description est une phrase unique — pas de point suivi d\'une majuscule', () => {
    // Détecte « …fondant. Une texture… » mais pas « …d'olive. » en fin de phrase.
    // On cherche un point (ou point d'exclamation, interrogation) suivi d'un espace
    // puis d'une lettre majuscule DANS le corps de la description.
    const phrases_multiples = []
    for (const code of publiables) {
      const recette = parCode.get(code)
      if (!recette?.description_courte) continue
      if (/[.!?]\s+[A-ZÀÂÆÉÈÊËÎÏÔŒÙÛÜŸ]/.test(recette.description_courte)) {
        phrases_multiples.push(`${code} ${recette.family} : "${recette.description_courte}"`)
      }
    }
    expect(
      phrases_multiples,
      `${phrases_multiples.length} description(s) multi-phrases détectée(s) : ${phrases_multiples.slice(0, 3).join(' | ')}`,
    ).toHaveLength(0)
  })

  it('aucune description ne contient de superlatif', () => {
    const avec_superlatifs = []
    for (const code of publiables) {
      const recette = parCode.get(code)
      if (!recette?.description_courte) continue
      const desc = recette.description_courte.toLowerCase()
      const trouve = SUPERLATIFS.filter((s) => {
        // Cherche le mot complet (délimité par des non-lettres)
        return new RegExp(`(?<![a-zàâæéèêëîïôœùûüÿ])${s}(?![a-zàâæéèêëîïôœùûüÿ])`).test(desc)
      })
      if (trouve.length > 0) {
        avec_superlatifs.push(`${code} ${recette.family} : ${trouve.join(', ')}`)
      }
    }
    expect(
      avec_superlatifs,
      `${avec_superlatifs.length} description(s) avec superlatifs : ${avec_superlatifs.slice(0, 3).join(' | ')}`,
    ).toHaveLength(0)
  })

  it('chaque description déclarée dans le script correspond à une recette réelle du corpus', () => {
    const absents = Object.keys(DESCRIPTIONS).filter((code) => !parCode.has(code))
    expect(
      absents,
      `${absents.length} code(s) dans DESCRIPTIONS absent(s) du corpus : ${absents.join(', ')}`,
    ).toHaveLength(0)
  })
})
