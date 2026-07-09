/**
 * Helper partagé : charge et ouvre la fiche recette d'un repas.
 * Utilisé par TodayMeals, WeeklyPlanView et WeekGrid.
 *
 * @param {object}   options
 * @param {object[]} options.typeMeals       - Entrées du repas (person_name, description…)
 * @param {object}   options.recipeCacheRef  - Ref mutable { current: { [query]: recipe|false|null } }
 * @param {function} options.setGeneratingFor - setState(dishName | null)
 * @param {function} options.setGeneratedRecipe
 * @param {function} options.setCookModeOpen
 * @param {function} options.authFetch       - Fonction authFetch du projet
 * @param {function} options.toastError      - toast.error(msg)
 */
const NO_SHEET_MSG =
  "Pas encore de fiche recette pour ce plat. Elle est créée par la routine lors de la génération du planning."

export async function openMealRecipe({
  typeMeals,
  recipeCacheRef,
  setGeneratingFor,
  setGeneratedRecipe,
  setCookModeOpen,
  authFetch,
  toastError,
  dishName,
}) {
  const julien = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
  const query = julien?.description
  // FK-first : les repas écrits par la routine v5 portent generated_recipe_id.
  const recipeId = julien?.generated_recipe_id ?? null
  if (!query && !recipeId) return

  const cacheKey = recipeId ? `id:${recipeId}` : query
  const cached = recipeCacheRef.current[cacheKey]
  if (cached) {
    setGeneratedRecipe(cached)
    setCookModeOpen(true)
    return
  }
  if (cached === false) {
    toastError(NO_SHEET_MSG)
    return
  }

  setGeneratingFor(dishName)
  try {
    let res = null
    let data = {}

    // 1) Fetch exact par FK
    if (recipeId) {
      res = await authFetch(`/api/recipes/generated?id=${encodeURIComponent(recipeId)}`)
      data = await res.json().catch(() => ({}))
    }

    // 2) Repli fuzzy (pas de FK, ou fiche supprimée depuis)
    if ((!res || !res.ok) && query) {
      res = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(query)}`)
      data = await res.json().catch(() => ({}))
    }

    if (!res || !res.ok) {
      recipeCacheRef.current[cacheKey] = false
      toastError(
        !res || res.status === 404
          ? NO_SHEET_MSG
          : (data.error || 'Erreur lors du chargement de la recette.')
      )
      return
    }
    recipeCacheRef.current[cacheKey] = data.recipe || false
    setGeneratedRecipe(data.recipe)
    setCookModeOpen(true)
  } catch (err) {
    console.error('Erreur recette:', err)
    toastError('Erreur lors du chargement de la recette. Réessaie.')
  } finally {
    setGeneratingFor(null)
  }
}
