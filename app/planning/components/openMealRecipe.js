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
  if (!query) return

  const cached = recipeCacheRef.current[query]
  if (cached) {
    setGeneratedRecipe(cached)
    setCookModeOpen(true)
    return
  }
  if (cached === false) {
    toastError("Pas encore de fiche recette pour ce plat. Elle est créée par la routine lors de la génération du planning.")
    return
  }

  setGeneratingFor(dishName)
  try {
    const res = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(query)}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      recipeCacheRef.current[query] = false
      toastError(
        res.status === 404
          ? "Pas encore de fiche recette pour ce plat. Elle est créée par la routine lors de la génération du planning."
          : (data.error || 'Erreur lors du chargement de la recette.')
      )
      return
    }
    recipeCacheRef.current[query] = data.recipe || false
    setGeneratedRecipe(data.recipe)
    setCookModeOpen(true)
  } catch (err) {
    console.error('Erreur recette:', err)
    toastError('Erreur lors du chargement de la recette. Réessaie.')
  } finally {
    setGeneratingFor(null)
  }
}
