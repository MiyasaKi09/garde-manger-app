import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const corpus = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'corpus-v3.json'), 'utf8'))

describe('corpus culinaire V3', () => {
  // Le corpus vise 3000 recettes : un compte figé obligerait à retoucher ce
  // test à chaque lot ajouté, et un test qu'on édite par habitude ne protège
  // plus de rien. On vérifie donc qu'il ne RÉTRÉCIT pas, et que les graphes
  // suivent — un ajout de recettes qui n'élargit aucun graphe signalerait un
  // corpus qui se répète.
  it('ne rétrécit pas et garde ses graphes cohérents', () => {
    expect(corpus.corpus_version).toBe('v3-300-real-dishes')
    expect(corpus.recipes.length).toBeGreaterThanOrEqual(315)
    expect(corpus.food_form_graph.length).toBeGreaterThanOrEqual(719)
    expect(corpus.technique_graph.length).toBeGreaterThanOrEqual(364)
    expect(corpus.aroma_graph.length).toBeGreaterThanOrEqual(337)
  })

  it('ne contient aucune fiche vide', () => {
    expect(corpus.recipes.every((recipe) => recipe.ingredients.length > 0)).toBe(true)
    expect(corpus.recipes.every((recipe) => recipe.steps.length > 0)).toBe(true)
  })

  it('impose une empreinte sensorielle complète et bornée', () => {
    for (const recipe of corpus.recipes) {
      expect(Object.keys(recipe.sensory.scores)).toHaveLength(10)
      expect(Object.values(recipe.sensory.scores).every((value) => value >= 0 && value <= 5)).toBe(true)
      expect(recipe.sensory.profile).toBeTruthy()
      expect(recipe.sensory.identity_guardrails.length).toBeGreaterThan(0)
    }
  })

  it('conserve les identités nommées et les standards domestiques comme catégories distinctes', () => {
    const counts = corpus.recipes.reduce((acc, recipe) => {
      acc[recipe.identity_level] = (acc[recipe.identity_level] || 0) + 1
      return acc
    }, {})
    // Les trois catégories restent peuplées et exhaustives : c'est l'invariant.
    // Leur volume exact bouge à chaque lot et ne dit rien de la santé du corpus.
    // « documented_variation » est apparu avec les recettes dérivées : une
    // variante n'a pas d'identité propre au répertoire, elle emprunte celle de
    // sa base — la distinguer évite de la compter comme un plat de plus.
    expect(Object.keys(counts).sort()).toEqual(['documented_variation', 'domestic_standard', 'named_traditional_dish'])
    expect(counts.named_traditional_dish).toBeGreaterThanOrEqual(269)
    expect(counts.domestic_standard).toBeGreaterThanOrEqual(46)
    expect(counts.documented_variation).toBeGreaterThanOrEqual(26)
  })

  it('porte les règles sensorielles du planificateur', () => {
    expect(corpus.planner_sensory_rules.length).toBeGreaterThanOrEqual(7)
    expect(corpus.doctrine.substitution_requires_identity_and_texture_preservation).toBe(true)
  })
})

// ── Recettes dérivées ──────────────────────────────────────────────────────
// Une dérivée est une recette complète, pas un renvoi vers sa base : elle porte
// sa propre liste d'ingrédients et ses propres étapes, sans quoi elle ne
// pourrait ni se peser ni se planifier. Ce qu'elle ne doit jamais faire, c'est
// dériver d'une dérivée — la lignée cesserait d'avoir une réponse locale.
describe('recettes dérivées du corpus V3', () => {
  const derivees = corpus.recipes.filter((recipe) => recipe.derived_from)
  const parCode = new Map(corpus.recipes.map((recipe) => [recipe.code, recipe]))

  it('chaque dérivée pointe vers une base réelle qui ne dérive de rien', () => {
    expect(derivees.length).toBeGreaterThanOrEqual(26)
    for (const derivee of derivees) {
      const base = parCode.get(derivee.derived_from)
      expect(base, `base ${derivee.derived_from} de ${derivee.code}`).toBeTruthy()
      expect(base.derived_from, `${base.code} ne doit pas dériver`).toBeFalsy()
    }
  })

  it('chaque dérivée reprend une variante que sa base annonce', () => {
    const plier = (value) => String(value || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    for (const derivee of derivees) {
      const base = parCode.get(derivee.derived_from)
      const annoncees = (base.variants || []).map(plier)
      expect(annoncees, `${derivee.code}`).toContain(plier(derivee.derivation?.variant_label))
    }
  })

  it('chaque dérivée est une recette complète, et n’annonce pas de variantes à son tour', () => {
    for (const derivee of derivees) {
      expect(derivee.ingredients.length, derivee.code).toBeGreaterThan(0)
      expect(derivee.steps.length, derivee.code).toBeGreaterThan(0)
      expect(derivee.variants, derivee.code).toEqual([])
      expect(derivee.derivation.operations.length + derivee.derivation.steps.length,
        `${derivee.code} : un delta vide n'est pas une variante`).toBeGreaterThan(0)
    }
  })

  it('aucune dérivée ne partage son code ni son nom avec une autre recette', () => {
    const codes = corpus.recipes.map((recipe) => recipe.code)
    expect(new Set(codes).size).toBe(codes.length)
    const noms = corpus.recipes.map((recipe) => recipe.family.toLowerCase())
    expect(new Set(noms).size).toBe(noms.length)
  })
})

/**
 * Le chargeur ne supprime jamais une ligne : il remplace ce qu'il porte et laisse
 * le reste. Une recette sortie du corpus garderait donc sa ligne en base,
 * toujours offerte au catalogue et au planificateur — retirée dans le dépôt et
 * nulle part ailleurs. Le registre des retraits existe pour que le chargeur
 * MARQUE ce qu'il ne porte plus, et c'est cette traduction qu'on vérifie ici.
 */
describe('registre des retraits', () => {
  const registre = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'retraits.json'), 'utf8'))
  const sql = readFileSync(join(process.cwd(), 'scripts', 'data', 'out', 'corpus-v3-load.sql'), 'utf8')

  it('chaque retrait porte un code, une famille et un motif', () => {
    expect(registre.retraits.length).toBeGreaterThan(0)
    for (const retrait of registre.retraits) {
      expect(retrait.code).toMatch(/^[A-Z0-9]{2,6}-\d{3,4}(?:-D\d{1,2})?$/)
      expect(String(retrait.family || '').trim().length).toBeGreaterThan(0)
      // Un motif d'une ligne ne se relit pas : on exige de quoi comprendre la
      // décision sans retrouver la conversation qui l'a prise.
      expect(String(retrait.motif || '').trim().length).toBeGreaterThan(80)
    }
  })

  it('aucune recette retirée n’est restée au corpus', () => {
    const codes = new Set(corpus.recipes.map((recipe) => recipe.code))
    for (const retrait of registre.retraits) {
      expect(codes.has(retrait.code)).toBe(false)
    }
  })

  // Retirer une base laisserait ses dérivées sans parent : le versement le
  // refuse, et le corpus doit en porter la preuve.
  it('aucune dérivée ne pointe vers une recette retirée', () => {
    const retires = new Set(registre.retraits.map((retrait) => retrait.code))
    for (const recipe of corpus.recipes) {
      if (recipe.derived_from) expect(retires.has(recipe.derived_from)).toBe(false)
    }
  })

  it('le SQL généré marque chaque retrait au lieu de le supprimer', () => {
    for (const retrait of registre.retraits) {
      const debut = sql.indexOf(`-- Retrait de ${retrait.code} —`)
      expect(debut, `aucun bloc de retrait pour ${retrait.code}`).toBeGreaterThan(-1)
      const bloc = sql.slice(debut, sql.indexOf(';', debut) + 1)

      // Les deux colonnes qui font le retrait : l'une le sort du catalogue
      // éditorial (A et B seulement), l'autre du planificateur.
      expect(bloc).toMatch(/SET quality_level = 'D',/)
      expect(bloc).toMatch(/planning_eligible = false,/)
      // Le motif est écrit là où l'application lit déjà les non-éligibilités.
      expect(bloc).toMatch(/'code', 'recipe_retired'/)
      expect(bloc).toContain(`'${retrait.code}';`)
      // La cible est bien la recette, pas tout le jeu de données.
      expect(bloc).toMatch(/upper\(rv\.source_record_key\) =/)
    }
    // Aucun DELETE ne doit accompagner un retrait : des repas déjà planifiés
    // référencent la recette et gardent leur instantané d'exécution.
    expect(sql).not.toMatch(/DELETE\s+FROM\s+culinary\.recipe_versions/i)
  })
})
