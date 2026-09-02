import corpus from '@/data/recipes/corpus-v3.json'
import foodCatalog from '@/scripts/data/out/recipe-food-catalog.json'
import { materializeRecipe } from '@/lib/domain/recipes/materializeRecipe'
import { obtenirIndexPrix } from '@/lib/domain/pricing/priceIndex'
import { computeRecipeCost } from '@/lib/domain/pricing/recipeCost'

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
 * Le coût d'une carte : les ARGUMENTS de la rédaction, pas la rédaction.
 *
 * Ce bloc porte volontairement des nombres bruts et un verdict, jamais des
 * chaînes formatées. La mise en mots — « au moins », les pas d'arrondi du §7.2,
 * la date à côté du montant — appartient à `components/pricing/estimationView`,
 * qui n'a rien à faire dans la couche de domaine ; et la forme choisie ici est
 * exactement celle que `vueEstimation` consomme, de sorte qu'un écran écrit
 * `vueEstimation(carte.canonical_quality.cost)` et rien d'autre.
 *
 * L'ordre des dépendances est ainsi préservé : le domaine calcule, la
 * présentation rédige, et aucun `lib/` n'importe de `components/`.
 *
 * §8.4 rappelé ici parce que c'est ici que la tentation naîtra : ces cartes ne
 * doivent JAMAIS être triées par `central`. Une recette paraît moins chère
 * quand elle est moins couverte ; trier des couvertures inégales, c'est trier
 * par ignorance. `classerParCout` existe pour le faire correctement, en
 * séparant explicitement le sous-ensemble intégralement chiffré.
 *
 * Exportée parce que le catalogue servi par l'API construit ses cartes depuis
 * la base et non depuis le corpus versionné : les deux chemins doivent poser le
 * MÊME bloc, sans quoi une même recette n'aurait pas la même carte selon
 * l'écran qui la demande.
 */
export function coutDeCarte(recipe, index) {
  const cout = computeRecipeCost(recipe, index)
  return {
    fourchette: cout.coutConsomme.parPortion,
    fourchetteTotale: cout.coutConsomme.total,
    couverture: cout.coverage,
    referenceDate: cout.referenceDate,
    affichable: cout.displayable,
    refus: cout.displayRefusal,
    parageInconnu: cout.parageInconnu,
    parPortion: true,
    adaptations: cout.lines.filter((ligne) => ligne.priced && ligne.confidence === 'B').length,
    attributions: cout.attributions,
  }
}

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
