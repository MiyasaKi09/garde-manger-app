import { computeNutrition } from '@/lib/domain/nutrition/calculator'
import { toGramsV2 } from '@/lib/domain/units'

export function normalizeFoodForm(value) {
  return String(value || '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Freezes an editorial recipe into an exact, executable recipe instance.
 * Unknown unit conversions or nutrition are blockers: no silent 100 g / density
 * fallback is allowed in the V2 path.
 */
export function materializeRecipe(recipe, foodCatalog, { servings = recipe.servings } = {}) {
  const catalogByName = foodCatalog instanceof Map
    ? foodCatalog
    : new Map((foodCatalog || []).map((food) => [food.canonical_name_normalized, food]))
  const scale = Number(servings) / Number(recipe.servings || 1)
  const issues = []
  const exactIngredients = []

  for (const ingredient of recipe.ingredients || []) {
    const normalized = normalizeFoodForm(ingredient.form)
    const food = catalogByName.get(normalized)
    if (!food) {
      if (!ingredient.optional) issues.push({ severity: 'blocker', code: 'food_form_unresolved', form: ingredient.form })
      continue
    }
    if (food.confidence === 'C' || food.confidence === 'D') {
      if (!ingredient.optional) issues.push({ severity: 'blocker', code: 'food_form_low_confidence', form: ingredient.form })
      continue
    }
    const conversion = toGramsV2(Number(ingredient.quantity) * scale, ingredient.unit, food.conversion || {})
    if (!conversion.ok) {
      if (!ingredient.optional) issues.push({ severity: 'blocker', code: conversion.reason, form: ingredient.form, unit: ingredient.unit })
      continue
    }
    const macroValues = ['kcal', 'proteinG', 'carbsG', 'fatG']
    if (!food.per100g || !macroValues.every((key) => Number.isFinite(food.per100g[key]))) {
      if (!ingredient.optional) issues.push({ severity: 'blocker', code: 'nutrition_incomplete', form: ingredient.form })
      continue
    }
    exactIngredients.push({
      name: ingredient.form,
      formNormalized: normalized,
      quantity: Number(ingredient.quantity) * scale,
      unit: ingredient.unit,
      grams: conversion.grams,
      per100g: food.per100g,
      role: ingredient.role,
      optional: ingredient.optional,
      category: food.category || null,
      source: food.source,
      sourceRecordKey: food.source_record_key,
    })
  }

  const nutrition = computeNutrition(exactIngredients, { servings })
  if (nutrition.coverage.pct !== 100) {
    issues.push({ severity: 'blocker', code: 'nutrition_coverage_incomplete', coverage: nutrition.coverage })
  }

  return {
    code: recipe.code,
    family: recipe.family,
    cuisineOrigin: recipe.cuisine_origin,
    identityLevel: recipe.identity_level,
    servings: Number(servings),
    prepMinutes: Number(recipe.prep_minutes) || 0,
    cookMinutes: Number(recipe.cook_minutes) || 0,
    difficulty: recipe.difficulty,
    category: recipe.category,
    status: recipe.status,
    confidence: recipe.confidence,
    allergens: recipe.allergens || [],
    techniques: recipe.techniques || [],
    sensory: recipe.sensory || null,
    variants: recipe.variants || [],
    conservation: recipe.conservation || null,
    canonicalArbitration: recipe.canonical_arbitration || null,
    sources: recipe.sources || [],
    exactIngredients,
    exactSteps: (recipe.steps || []).map((step) => ({ ...step })),
    nutritionPerServing: nutrition.perServing,
    nutritionCoverage: nutrition.coverage,
    issues,
    eligible: !issues.some((issue) => issue.severity === 'blocker'),
  }
}
