import { describe, expect, it, vi } from 'vitest'
import { canonicalRecipeHref, decorateRecipeWithMealPlate, openMealRecipe } from '@/app/planning/components/openMealRecipe'

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

  it('decorates the modal with exact companion quantities for each person', () => {
    const recipe = {
      title: 'Boulettes de bœuf sauce tomate',
      ingredients: [{ name: 'Bœuf', quantity: 250, unit: 'g' }],
      steps: [{ n: 1, instruction: 'Cuire les boulettes.' }],
    }
    const decorated = decorateRecipeWithMealPlate(recipe, [
      {
        household_member_id: 'j', person_name: 'Julien',
        portion_details: { companions: [{ label: 'Pâtes sèches courtes', form_normalized: 'pates seches courtes', quantity_g: 105, preparation: 'Cuire les pâtes.' }] },
      },
      {
        household_member_id: 'z', person_name: 'Zoé',
        portion_details: { companions: [{ label: 'Pâtes sèches courtes', form_normalized: 'pates seches courtes', quantity_g: 52.5, preparation: 'Cuire les pâtes.' }] },
      },
    ])

    expect(decorated.ingredients).toContainEqual(expect.objectContaining({
      name: 'Pâtes sèches courtes · accompagnement calculé',
      quantity: 157.5,
      per_person_quantities: expect.objectContaining({ j: 105, Julien: 105, z: 52.5, Zoé: 52.5 }),
    }))
    expect(decorated.steps.at(-1).instruction).toContain('Julien: 105 g · Zoé: 52.5 g')
    expect(decorated.plate_personalized).toBe(true)
  })

})
