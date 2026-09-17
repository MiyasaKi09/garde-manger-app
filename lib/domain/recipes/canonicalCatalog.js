import corpus from '@/data/recipes/corpus-v3.json'
import foodCatalog from '@/scripts/data/out/recipe-food-catalog.json'
import { materializeRecipe } from '@/lib/domain/recipes/materializeRecipe'
import { obtenirIndexPrix } from '@/lib/domain/pricing/priceIndex'
import { coutDeCarte } from '@/lib/domain/recipes/coutDeCarte'

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

/**
 * `coutDeCarte` est réexportée, pas définie ici — jalon J1 de la phase 5.
 *
 * Elle vit dans `lib/domain/recipes/coutDeCarte.js`, qui n'importe aucun JSON.
 * La raison est écrite là-bas : `app/_pricing/estimations.js` ne veut que cette
 * fonction, et un `import` ES lui donnait en prime le corpus et le catalogue de
 * formes que CE module-ci importe au build. La réexportation reste parce que
 * `getCanonicalRecipeCards` s'en sert juste en dessous et qu'un appelant du
 * corpus versionné n'a pas à savoir que la fonction a déménagé — mais un
 * appelant qui ne veut QUE le coût doit l'importer à la source, et
 * `tests/recipes/corpusHorsBundle.test.js` rougit s'il ne le fait pas.
 */
export { coutDeCarte }

export function getCanonicalRecipeCards({ today = null } = {}) {
  // L'index est construit une fois pour toute la liste : le mémo de
  // `obtenirIndexPrix` est clé par jour, donc un appel par carte reviendrait au
  // même — mais l'écrire ici dit que le référentiel est le même pour toutes les
  // cartes d'une page, ce qui est la condition pour que leurs couvertures
  // soient comparables entre elles.
  const index = obtenirIndexPrix(today ? { today } : {})
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
      cost: coutDeCarte(recipe, index),
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
