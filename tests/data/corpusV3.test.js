import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const corpus = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'corpus-v3.json'), 'utf8'))

describe('corpus culinaire V3', () => {
  it('contient les 302 plats réels et les graphes annoncés', () => {
    expect(corpus.corpus_version).toBe('v3-300-real-dishes')
    expect(corpus.recipes).toHaveLength(302)
    expect(corpus.food_form_graph).toHaveLength(727)
    expect(corpus.technique_graph).toHaveLength(351)
    expect(corpus.aroma_graph).toHaveLength(328)
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
    expect(counts).toEqual({ named_traditional_dish: 260, domestic_standard: 42 })
  })

  it('porte les règles sensorielles du planificateur', () => {
    expect(corpus.planner_sensory_rules.length).toBeGreaterThanOrEqual(7)
    expect(corpus.doctrine.substitution_requires_identity_and_texture_preservation).toBe(true)
  })
})
