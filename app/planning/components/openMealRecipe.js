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
  "La fiche recette de ce plat n’est pas disponible."

export function canonicalRecipeCode(meal) {
  const direct = String(meal?.recipe_href || '').trim()
  const directMatch = direct.match(/^\/recipes\/canonical\/([a-z0-9-]+)(?:\?.*)?$/i)
  if (directMatch) return directMatch[1]
  const code = String(
    meal?.canonical_recipe_code
    || meal?.recipe_code
    || meal?.recipeCode
    || meal?.preparation?.recipe_code
    || ''
  ).trim()
  return /^[a-z0-9-]+$/i.test(code) ? code : null
}

export function canonicalRecipeHref(meal) {
  const code = canonicalRecipeCode(meal)
  return code ? `/recipes/canonical/${encodeURIComponent(code)}` : null
}

function personQuantityKeys(meal) {
  return [meal?.household_member_id, meal?.person_name].filter(Boolean).map(String)
}

/** Ajoute au modal les accompagnements réellement calculés pour chaque convive. */
export function decorateRecipeWithMealPlate(recipe, typeMeals = []) {
  if (!recipe) return recipe
  const rows = new Map()

  for (const meal of typeMeals || []) {
    for (const companion of meal?.portion_details?.companions || []) {
      const key = companion.form_normalized || companion.key || companion.label
      const row = rows.get(key) || {
        name: `${companion.label || 'Accompagnement'} · accompagnement calculé`,
        quantity: 0,
        unit: 'g',
        notes: 'Quantité personnalisée selon les objectifs',
        per_person_quantities: {},
        preparation: companion.preparation || null,
        companion: true,
      }
      const quantity = Number(companion.quantity_g) || 0
      row.quantity += quantity
      for (const personKey of personQuantityKeys(meal)) row.per_person_quantities[personKey] = quantity
      rows.set(key, row)
    }
  }

  if (!rows.size) return recipe
  const companionIngredients = [...rows.values()].map((row) => ({
    ...row,
    quantity: Math.round(row.quantity * 10) / 10,
  }))
  const companionSteps = companionIngredients.map((ingredient, index) => {
    const distribution = (typeMeals || []).map((meal) => {
      const quantity = personQuantityKeys(meal)
        .map((key) => ingredient.per_person_quantities[key])
        .find((value) => Number.isFinite(Number(value)))
      return quantity > 0 ? `${meal.person_name}: ${Math.round(quantity * 10) / 10} g` : null
    }).filter(Boolean).join(' · ')
    return {
      n: (recipe.steps?.length || 0) + index + 1,
      instruction: `${ingredient.preparation || `Préparer ${ingredient.name.replace(/ ·.*/, '').toLowerCase()}.`} Répartir ainsi : ${distribution}.`,
      duration_min: null,
      companion: true,
    }
  })

  return {
    ...recipe,
    ingredients: [...(recipe.ingredients || []), ...companionIngredients],
    steps: [...(recipe.steps || []), ...companionSteps],
    plate_components: companionIngredients,
    plate_personalized: true,
  }
}

async function fetchCanonicalRecipe({ code, typeMeals, recipeCacheRef, authFetch }) {
  const portions = (typeMeals || []).reduce((sum, meal) => sum + (Number(meal?.planned_servings) || 0), 0)
  const params = new URLSearchParams()
  if (Number.isFinite(portions) && portions > 0) params.set('portions', String(portions))
  const cacheKey = `canonical:${code}:${params.get('portions') || 'base'}`
  const cached = recipeCacheRef.current[cacheKey]
  if (cached !== undefined) return { cacheKey, recipe: cached || null }

  const suffix = params.size ? `?${params.toString()}` : ''
  const response = await authFetch(`/api/recipes/canonical/${encodeURIComponent(code)}${suffix}`)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || NO_SHEET_MSG)
    error.status = response.status
    throw error
  }
  const recipe = payload.recipe || null
  recipeCacheRef.current[cacheKey] = recipe || false
  return { cacheKey, recipe }
}

export async function prefetchMealRecipe({ typeMeals, recipeCacheRef, authFetch }) {
  const representative = typeMeals?.[0]
  if (!representative) return

  const canonicalCode = canonicalRecipeCode(representative)
  if (canonicalCode) {
    try {
      await fetchCanonicalRecipe({ code: canonicalCode, typeMeals, recipeCacheRef, authFetch })
    } catch {
      // Préchargement best-effort : le clic affichera le message précis.
    }
    return
  }

  const query = representative.generated_recipe_id
    ? `id:${representative.generated_recipe_id}`
    : representative.description
  if (!query || recipeCacheRef.current[query] !== undefined) return

  recipeCacheRef.current[query] = null
  try {
    const endpoint = representative.generated_recipe_id
      ? `/api/recipes/generated?id=${encodeURIComponent(representative.generated_recipe_id)}`
      : `/api/recipes/generated?q=${encodeURIComponent(representative.description)}`
    const response = await authFetch(endpoint)
    const payload = await response.json().catch(() => ({}))
    recipeCacheRef.current[query] = response.ok ? (payload.recipe || false) : false
  } catch {
    recipeCacheRef.current[query] = false
  }
}

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
  const representative = typeMeals[0]
  const canonicalCode = canonicalRecipeCode(representative)
  if (canonicalCode) {
    setGeneratingFor(dishName)
    try {
      const { recipe } = await fetchCanonicalRecipe({
        code: canonicalCode,
        typeMeals,
        recipeCacheRef,
        authFetch,
      })
      if (!recipe) {
        toastError(NO_SHEET_MSG)
        return
      }
      setGeneratedRecipe(decorateRecipeWithMealPlate(recipe, typeMeals))
      setCookModeOpen(true)
    } catch (error) {
      console.error('Erreur recette canonique:', error)
      toastError(error.status === 404 ? NO_SHEET_MSG : (error.message || 'Erreur lors du chargement de la recette.'))
    } finally {
      setGeneratingFor(null)
    }
    return
  }
  const query = representative?.description
  // FK-first : les repas écrits par la routine v5 portent generated_recipe_id.
  const recipeId = representative?.generated_recipe_id ?? null
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
