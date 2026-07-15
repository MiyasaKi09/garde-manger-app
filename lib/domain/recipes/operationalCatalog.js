import { computeNutrition } from '@/lib/domain/nutrition/calculator'

const asNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const scaledOrNull = (value, scale) => {
  if (value == null || value === '') return null
  return asNumber(value) * scale
}

export function materializeOperationalRecipe(record, { servings, quantityScale = 1 } = {}) {
  const baseServings = Math.max(1, asNumber(record?.servings, 1))
  const targetServings = Number(servings) > 0 ? Number(servings) : baseServings
  const scale = (targetServings / baseServings) * Math.max(0, asNumber(quantityScale, 1))
  const exactIngredients = (record?.exactIngredients || []).map((ingredient) => ({
    ...ingredient,
    quantity: asNumber(ingredient.quantity) * scale,
    grams: scaledOrNull(ingredient.grams, scale),
    optional: Boolean(ingredient.optional),
    component: ingredient.component ? {
      ...ingredient.component,
      requiredQuantity: scaledOrNull(ingredient.component.requiredQuantity, scale),
    } : null,
  }))
  const nutrition = computeNutrition(exactIngredients, { servings: targetServings })
  const nutritionResolved = exactIngredients.filter((ingredient) => ingredient.grams > 0 && ingredient.per100g).length
  const nutritionCoverage = {
    ...nutrition.coverage,
    pct: exactIngredients.length > 0 ? Math.round((nutritionResolved / exactIngredients.length) * 100) : null,
    ingredientCount: exactIngredients.length,
    resolvedCount: nutritionResolved,
  }
  const operationalEligible = Boolean(record?.operationalEligible ?? record?.catalogStatus === 'operational_candidate')

  return {
    ...record,
    servings: targetServings,
    prepMinutes: asNumber(record?.prepMinutes),
    cookMinutes: asNumber(record?.cookMinutes),
    restMinutes: asNumber(record?.restMinutes),
    exactIngredients,
    exactSteps: record?.exactSteps || [],
    allergens: record?.allergens || [],
    techniques: record?.techniques || [],
    variants: record?.variants || [],
    sources: record?.sources || [],
    sensory: record?.sensory || null,
    nutritionPerServing: nutrition.perServing,
    nutritionCoverage,
    issues: record?.eligibilityIssues || [],
    operationalEligible,
    eligible: true,
  }
}

export function materializeOperationalCatalog(payload, options = {}) {
  const records = Array.isArray(payload?.recipes) ? payload.recipes : []
  const recipes = records.map((record) => materializeOperationalRecipe(record, options))
  return {
    contractVersion: payload?.contractVersion || 'unknown',
    metadata: {
      source: 'supabase',
      catalogStatus: 'operational_candidate',
      ...(payload?.metadata || {}),
      returnedCount: recipes.length,
    },
    recipes,
  }
}

export function operationalRecipeCards(recipes = []) {
  return recipes.map((recipe) => ({
    key: `canonical-${recipe.code}`,
    source: 'canonical_v3',
    id: recipe.code,
    title: recipe.family,
    description: [recipe.cuisineOrigin, recipe.category].filter(Boolean).join(' · '),
    image_url: null,
    prep_min: recipe.prepMinutes,
    cook_min: recipe.cookMinutes,
    servings: recipe.servings,
    rating: null,
    href: `/recipes/canonical/${recipe.code}`,
    catalog_status: recipe.catalogStatus,
    canonical_quality: {
      confidence: recipe.confidence,
      nutrition_coverage_pct: recipe.nutritionCoverage.pct,
      sensory_profile: recipe.sensory?.profile || null,
      identity_level: recipe.identityLevel,
    },
    planning_ready: recipe.operationalEligible,
    variant_count: recipe.variants.length,
    variant_status: recipe.variantStatus,
    linked_ingredients: recipe.exactIngredients.map((ingredient) => ({
      canonical_form_id: ingredient.foodFormId,
      canonical_form_normalized: ingredient.formNormalized,
      canonical_form_name: ingredient.name,
      quantity_grams: ingredient.grams,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      optional: ingredient.optional,
    })),
  }))
}
