import { describe, expect, it } from 'vitest'
import { canonicalRecipeHref } from '@/app/planning/components/openMealRecipe'

describe('planning recipe links', () => {
  it('opens the exact canonical recipe assigned to the person', () => {
    expect(canonicalRecipeHref({ canonical_recipe_code: 'IT-005' })).toBe('/recipes/canonical/IT-005')
    expect(canonicalRecipeHref({ recipe_href: '/recipes/canonical/FR-042' })).toBe('/recipes/canonical/FR-042')
  })

  it('rejects non-recipe links from persisted data', () => {
    expect(canonicalRecipeHref({ recipe_href: 'https://example.com', canonical_recipe_code: '../admin' })).toBeNull()
  })
})
