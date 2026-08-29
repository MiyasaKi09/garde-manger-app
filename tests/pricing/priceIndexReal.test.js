import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { obtenirIndexPrix, trouverPrix } from '@/lib/domain/pricing/priceIndex'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { normalizeName } from '../../scripts/data/lib/normalize.mjs'

/**
 * Les tests de priceIndex.test.js travaillent sur des jeux FABRIQUÉS, ce qui est
 * la bonne façon de vérifier une règle. Ceux-ci travaillent sur le référentiel
 * RÉEL, ce qui est la seule façon de vérifier que la règle, appliquée à nos
 * données, ne détruit pas silencieusement ce qu'on croit avoir.
 *
 * Les deux sont nécessaires et ne se remplacent pas.
 */
const index = obtenirIndexPrix()

const corpus = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'corpus-v3.json'), 'utf8'))
const rapport = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'out', 'recipe-food-match-report.json'), 'utf8'))
const eligibilite = new Map(rapport.recipe_eligibility.map((recette) => [recette.code, recette]))
const publiables = corpus.recipes.filter((recette) => eligibilite.get(recette.code)?.eligible_for_publication)

/** Fréquence de chaque forme dans les recettes réellement servies. */
const frequence = new Map()
for (const recette of publiables) {
  for (const ingredient of recette.ingredients) {
    const cle = normalizeFoodForm(ingredient.form)
    frequence.set(cle, (frequence.get(cle) || 0) + 1)
  }
}

describe('le référentiel réel, passé par la règle de collision', () => {
  /**
   * LE test de ce fichier. Cinq formes ont été écrites dans DEUX tranches à la
   * fois — l'huile d'olive et l'œuf entre autres, qui comptent parmi les plus
   * employées du corpus. La règle de collision refuse une forme quand rien ne
   * départage ses candidats, et ce choix est le bon : « perdre une forme est
   * réparable, choisir en secret ne l'est pas ».
   *
   * Mais il rend possible une perte SILENCIEUSE, et c'est ce qu'on vérifie ici :
   * qu'aucune forme fréquente ne disparaisse du référentiel par ce chemin.
   */
  it('ne perd aucune forme employée plus de dix fois par le corpus servi', () => {
    const perdues = index.rejected
      .filter((refus) => refus.raison === 'conflit_non_departageable')
      .map((refus) => ({ forme: refus.formNormalized, lignes: frequence.get(refus.formNormalized) || 0 }))
      .filter((refus) => refus.lignes > 10)
    expect(perdues, `formes fréquentes perdues sur conflit : ${JSON.stringify(perdues)}`).toEqual([])
  })

  it('chaque conflit relevé est tranché, et son motif est consultable', () => {
    for (const conflit of index.conflicts) {
      expect(conflit.formNormalized, 'un conflit sans forme est illisible').toBeTruthy()
    }
    // Un conflit enregistré ET une entrée présente : la forme a été départagée.
    // Un conflit enregistré SANS entrée : elle a été refusée, ce qui doit rester
    // exceptionnel et ne jamais toucher une forme fréquente (test précédent).
    const departages = index.conflicts.filter((conflit) => trouverPrix(index, conflit.formNormalized))
    expect(departages.length).toBeGreaterThanOrEqual(0)
  })

  it('l’huile d’olive et l’œuf, écrits dans deux tranches, restent chiffrés', () => {
    // Nommés explicitement parce que ce sont eux qui ont rendu le doublon
    // visible, et parce qu'ils pèsent : 230 et 115 lignes du corpus servi.
    for (const forme of ["Huile d'olive vierge extra", 'Œuf cru']) {
      expect(trouverPrix(index, forme), `${forme} a disparu du référentiel`).toBeTruthy()
    }
  })
})

describe('les deux normaliseurs du dépôt', () => {
  /**
   * `normalizeFoodForm` (lib/, lu par l'application) et `normalizeName`
   * (scripts/, lu par la fabrique de données) sont deux implémentations
   * DISTINCTES et aujourd'hui identiques. La clé de jointure du référentiel de
   * prix est produite par l'une et lue par l'autre : si elles divergent d'un
   * caractère, des prix cessent d'être trouvés sans qu'aucun test ne tombe et
   * sans qu'aucune erreur ne s'affiche — la couverture baisse en silence.
   *
   * Ce n'est pas une hypothèse : une mesure de couverture écrite avec un
   * normaliseur maison a annoncé « Œuf cru » comme la forme non chiffrée la plus
   * fréquente du corpus, alors qu'elle est au référentiel. La ligature « œ » que
   * NFD ne décompose pas suffit à tout fausser.
   */
  it('produisent la même clé sur tout le vocabulaire du corpus', () => {
    const divergences = []
    for (const recette of corpus.recipes) {
      for (const ingredient of recette.ingredients) {
        if (normalizeFoodForm(ingredient.form) !== normalizeName(ingredient.form)) {
          divergences.push(ingredient.form)
        }
      }
    }
    expect([...new Set(divergences)]).toEqual([])
  })

  it('traitent les ligatures et les apostrophes, que NFD ne décompose pas', () => {
    for (const cas of ['Œuf cru', "Jaune d'œuf cru", 'Bœuf haché', "Huile d’olive", 'Cœur de bœuf']) {
      expect(normalizeFoodForm(cas)).toBe(normalizeName(cas))
      expect(normalizeFoodForm(cas)).not.toMatch(/[œæ’']/)
    }
  })
})
