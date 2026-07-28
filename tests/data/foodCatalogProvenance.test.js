import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Le catalogue des formes d'aliments mélange trois provenances : une mesure de
// l'ANSES, une mesure américaine qui COMBLE un trou français, et — en tout
// dernier recours — une valeur déduite par fermeture énergétique. Les trois ne
// valent pas la même chose, et une valeur déduite ne doit jamais pouvoir passer
// pour une mesure. Ces tests verrouillent cette distinction.

const catalog = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'out', 'recipe-food-catalog.json'), 'utf8'))
const report = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'out', 'recipe-food-match-report.json'), 'utf8'))

const MACROS = ['proteinG', 'carbsG', 'fatG']
const FACTEURS = { proteinG: 4, carbsG: 4, fatG: 9 }

describe('provenance du catalogue des formes d’aliments', () => {
  const derivees = catalog.forms.filter((form) => form.derived)

  it('déclare chaque valeur déduite avec sa méthode et sa formule', () => {
    expect(derivees.length).toBeGreaterThan(0)
    for (const form of derivees) {
      expect(form.derived.method, form.canonical_name).toBe('atwater_closure')
      expect(form.derived.formula, form.canonical_name).toBeTruthy()
      expect(form.derived.field, form.canonical_name).toMatch(/^(energy_kcal|protein_g|carbohydrate_g|fat_g)$/)
    }
  })

  it('ne déduit que ce qui se vérifie par l’identité d’Atwater', () => {
    for (const form of derivees) {
      const { kcal } = form.per100g
      const reconstruit = MACROS.reduce((somme, cle) => somme + form.per100g[cle] * FACTEURS[cle], 0)
      // La fermeture n'a qu'une inconnue : réinjectée, elle doit redonner
      // l'énergie mesurée. Seule exception admise, et déclarée : un résidu
      // négatif infime, artefact des arrondis de Ciqual, ramené à zéro. La
      // valeur brute reste dans `derived`, faute de quoi l'écart deviendrait
      // invisible.
      const brute = form.derived.clamped_to_zero ? form.derived.raw_value : form.derived.value
      expect(brute, form.canonical_name).toBeGreaterThanOrEqual(-0.05)
      const exact = form.derived.clamped_to_zero
        ? reconstruit + brute * FACTEURS[{ protein_g: 'proteinG', carbohydrate_g: 'carbsG', fat_g: 'fatG' }[form.derived.field]]
        : reconstruit
      expect(Math.abs(exact - kcal), `${form.canonical_name} : ${exact} ≠ ${kcal}`).toBeLessThan(0.05)
      // Et jamais une valeur publiée physiquement impossible.
      for (const cle of MACROS) expect(form.per100g[cle], form.canonical_name).toBeGreaterThanOrEqual(0)
    }
  })

  it('fait réellement compter la valeur déduite dans le verdict d’éligibilité', () => {
    // Le piège est d'ordre : si la fermeture s'applique APRÈS l'évaluation de
    // `nutrition_complete`, elle enrichit le catalogue sans jamais débloquer une
    // recette — le travail est fait et ne sert à rien. Ce test échoue si la
    // dérivation redevient purement décorative.
    const nomsDerives = new Set(derivees.map((form) => form.canonical_name))
    expect(nomsDerives.size).toBeGreaterThan(0)

    for (const forme of report.forms) {
      if (!nomsDerives.has(forme.form)) continue
      expect(forme.selected?.nutrition_complete, forme.form).toBe(true)
      expect(forme.selected?.derived_field, forme.form).toBeTruthy()
    }

    // Et au moins une recette publiable doit en dépendre, sinon la garde
    // ci-dessus passerait à vide.
    const eligiblesAvecDerivee = report.recipe_eligibility.filter((recipe) => recipe.eligible_for_publication)
    expect(eligiblesAvecDerivee.length).toBeGreaterThan(0)
  })

  it('ne laisse jamais un proxy assumé rendre une recette publiable', () => {
    // Une confiance C dit « profil approchant », pas « mesure de cet aliment ».
    // La gousse de vanille en est l'exemple : l'ANSES la référence (11057) mais
    // n'en mesure aucune macro, USDA n'en a aucune, et aucune valeur d'ancrage
    // ne permet de fermer l'équation. On retient l'agrégat « Epice (aliment
    // moyen) » du sous-groupe auquel elle appartient, et les desserts qui
    // l'emploient restent hors publication — documentés, pas silencieux.
    for (const recipe of report.recipe_eligibility) {
      if (recipe.low_confidence_required_forms.length === 0) continue
      expect(recipe.eligible_for_publication, recipe.code).toBe(false)
    }
    const vanille = catalog.forms.find((form) => form.canonical_name_normalized === 'gousse de vanille')
    expect(vanille.confidence).toBe('C')
    expect(vanille.note).toBeTruthy()
    expect(vanille.derived).toBeUndefined()
  })

  it('prend les fibres dans le classeur ANSES, pas dans le CSV d’import', () => {
    // Le CSV `data/ciqual_nutrition_import.csv` était prioritaire sur le
    // classeur. Il est faux sur les fibres pour 153 des 233 formes comparables,
    // de deux façons : il sous-estime lourdement les épices et herbes séchées,
    // et sur les condiments salés il porte la teneur en SEL. Le classeur ANSES
    // fait foi désormais ; le CSV ne sert plus qu'en secours, et pour l'énergie
    // qu'il est seul à fournir.
    const fibres = (nom) => catalog.forms.find((form) => form.canonical_name_normalized === nom)?.per100g.fiberG
    // Sauce poisson : le CSV lisait 22,2 — c'est son sel, pas ses fibres.
    expect(fibres('sauce poisson')).toBeCloseTo(0.2, 2)
    // Cannelle : 3,6 au CSV, 53,1 au classeur. Une écorce séchée est presque
    // entièrement fibreuse.
    expect(fibres('cannelle moulue')).toBeCloseTo(53.1, 1)
    // Ail cru : 1,51 au CSV, 5,8 au classeur — la valeur publiée partout.
    expect(fibres('ail cru')).toBeCloseTo(5.8, 1)
    // Et une viande n'a aucune fibre : le CSV en donnait 0,96 à l'agneau haché.
    expect(fibres('agneau hache cru')).toBe(0)

    // L'énergie, elle, reste hors du classeur : sans le CSV, aucune forme n'en
    // aurait. C'est la seule raison de le garder.
    const avecEnergie = catalog.forms.filter((form) => Number.isFinite(form.per100g.kcal))
    expect(avecEnergie.length).toBeGreaterThan(catalog.forms.length * 0.9)
  })

  it('trace la provenance USDA champ par champ, sans écraser Ciqual', () => {
    const comblees = catalog.forms.filter((form) => form.filled_from_usda)
    expect(comblees.length).toBeGreaterThan(0)
    for (const form of comblees) {
      expect(form.source, form.canonical_name).toBe('ciqual_2020+usda_fdc')
      expect(form.filled_from_usda.fields.length, form.canonical_name).toBeGreaterThan(0)
      expect(form.filled_from_usda.fdc_id, form.canonical_name).toMatch(/^\d+$/)
      // Le code Ciqual reste la référence d'identité : USDA n'a comblé que des
      // trous, il n'a pas remplacé l'aliment.
      expect(form.source_record_key, form.canonical_name).toBeTruthy()
    }
  })
})
