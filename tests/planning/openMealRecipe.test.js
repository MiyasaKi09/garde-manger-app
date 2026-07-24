import { describe, expect, it, vi } from 'vitest'
import { canonicalRecipeHref, openMealRecipe } from '@/app/planning/components/openMealRecipe'

describe('planning recipe links', () => {
  it('resolves the exact canonical recipe assigned to the person', () => {
    expect(canonicalRecipeHref({ canonical_recipe_code: 'IT-005' })).toBe('/recipes/canonical/IT-005')
    expect(canonicalRecipeHref({ recipe_href: '/recipes/canonical/FR-042' })).toBe('/recipes/canonical/FR-042')
  })

  it('opens a canonical dish in CookMode instead of navigating away', async () => {
    const recipe = { code: 'FR-023', title: 'Croque-monsieur', ingredients: [], steps: [] }
    const authFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recipe }),
    })
    const setGeneratedRecipe = vi.fn()
    const setCookModeOpen = vi.fn()
    const setGeneratingFor = vi.fn()
    const toastError = vi.fn()

    await openMealRecipe({
      typeMeals: [
        { canonical_recipe_code: 'FR-023', planned_servings: 1 },
        { canonical_recipe_code: 'FR-023', planned_servings: 0.8 },
      ],
      recipeCacheRef: { current: {} },
      setGeneratingFor,
      setGeneratedRecipe,
      setCookModeOpen,
      authFetch,
      toastError,
      dishName: 'Croque-monsieur',
    })

    expect(authFetch).toHaveBeenCalledWith('/api/recipes/canonical/FR-023?portions=1.8')
    expect(setGeneratedRecipe).toHaveBeenCalledWith(recipe)
    expect(setCookModeOpen).toHaveBeenCalledWith(true)
    expect(toastError).not.toHaveBeenCalled()
  })

  it('rejects non-recipe links from persisted data', () => {
    expect(canonicalRecipeHref({ recipe_href: 'https://example.com', canonical_recipe_code: '../admin' })).toBeNull()
  })
})
