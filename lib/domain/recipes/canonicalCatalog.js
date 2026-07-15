import corpus from '@/data/recipes/corpus-v3.json'
import foodCatalog from '@/scripts/data/out/recipe-food-catalog.json'
import { materializeRecipe } from '@/lib/domain/recipes/materializeRecipe'

const materializedRecipes = corpus.recipes.map((editorial) => ({
  ...materializeRecipe(editorial, foodCatalog.forms),
  editorial,
}))

const byCode = new Map(materializedRecipes.map((recipe) => [recipe.code, recipe]))

export function getCanonicalRecipes({ eligibleOnly = true, servings = null } = {}) {
  const recipes = Number.isFinite(Number(servings)) && Number(servings) > 0
    ? corpus.recipes.map((editorial) => ({
        ...materializeRecipe(editorial, foodCatalog.forms, { servings: Number(servings) }),
        editorial,
      }))
    : materializedRecipes
  return eligibleOnly ? recipes.filter((recipe) => recipe.eligible) : recipes
}

export function getCanonicalRecipe(code) {
  return byCode.get(String(code || '').toUpperCase()) || null
}

export function getCanonicalRecipeCards() {
  return getCanonicalRecipes().map((recipe) => ({
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
    canonical_quality: {
      confidence: recipe.confidence,
      nutrition_coverage_pct: recipe.nutritionCoverage.pct,
      sensory_profile: recipe.sensory?.profile || null,
      identity_level: recipe.identityLevel,
    },
    linked_ingredients: recipe.exactIngredients.map((ingredient) => ({
      canonical_form_normalized: ingredient.formNormalized,
      canonical_form_name: ingredient.name,
      quantity_grams: ingredient.grams,
    })),
  }))
}

export const canonicalCatalogMetadata = Object.freeze({
  version: corpus.corpus_version,
  recipeCount: corpus.recipes.length,
  eligibleCount: materializedRecipes.filter((recipe) => recipe.eligible).length,
  sourceSha256: corpus.source_sha256,
})
