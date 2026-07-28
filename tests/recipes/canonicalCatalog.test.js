import { describe, expect, it } from 'vitest'
import {
  canonicalCatalogMetadata,
  getCanonicalRecipe,
  getCanonicalRecipeCards,
  getCanonicalRecipes,
} from '@/lib/domain/recipes/canonicalCatalog'
import { dedupCatalog } from '@/app/recipes/catalogDedup'

describe('canonical recipe catalog V3', () => {
  it('publishes only fully executable recipes', () => {
    const recipes = getCanonicalRecipes()
    // Le nombre de recettes publiables ne peut que croître : chaque ingrédient
    // arbitré en débloque, aucun n'en rebloque. Un recul serait la vraie alerte.
    expect(recipes.length).toBeGreaterThanOrEqual(123)
    expect(recipes.every((recipe) => recipe.eligible)).toBe(true)
    expect(recipes.every((recipe) => recipe.nutritionCoverage.pct === 100)).toBe(true)
  })

  it('keeps every candidate auditable without exposing blockers', () => {
    const tous = getCanonicalRecipes({ eligibleOnly: false })
    expect(tous.length).toBeGreaterThanOrEqual(315)
    // Ce qui compte n'est pas le total mais qu'aucun candidat ne se perde en
    // route : le catalogue expose exactement ce que le corpus contient.
    expect(canonicalCatalogMetadata.recipeCount).toBe(tous.length)
    expect(canonicalCatalogMetadata.eligibleCount).toBe(getCanonicalRecipes().length)
  })

  it('builds stable canonical cards and a code lookup', () => {
    const card = getCanonicalRecipeCards()[0]
    const recipe = getCanonicalRecipe(card.id.toLowerCase())
    expect(card.source).toBe('canonical_v3')
    expect(card.href).toBe(`/recipes/canonical/${card.id}`)
    expect(recipe.code).toBe(card.id)
  })

  it('prefers canonical V3 when legacy titles are duplicates', () => {
    const result = dedupCatalog([
      { key: 'classic-1', source: 'classic', id: 1, title: 'Poulet rôti' },
      { key: 'generated-2', source: 'generated', id: 2, title: 'Poulet rôti' },
      { key: 'canonical-FR-011', source: 'canonical_v3', id: 'FR-011', title: 'Poulet rôti' },
    ])
    expect(result).toEqual([expect.objectContaining({ source: 'canonical_v3', id: 'FR-011' })])
  })
})
