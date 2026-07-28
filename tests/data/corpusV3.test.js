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
    // Les deux catégories restent peuplées et exhaustives : c'est l'invariant.
    // Leur volume exact bouge à chaque lot et ne dit rien de la santé du corpus.
    expect(Object.keys(counts).sort()).toEqual(['domestic_standard', 'named_traditional_dish'])
    expect(counts.named_traditional_dish).toBeGreaterThanOrEqual(269)
    expect(counts.domestic_standard).toBeGreaterThanOrEqual(46)
  })

  it('porte les règles sensorielles du planificateur', () => {
    expect(corpus.planner_sensory_rules.length).toBeGreaterThanOrEqual(7)
    expect(corpus.doctrine.substitution_requires_identity_and_texture_preservation).toBe(true)
  })
})
