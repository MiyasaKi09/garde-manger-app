import { computeNutrition } from '@/lib/domain/nutrition/calculator'
import { ingredientOrigin } from '@/lib/domain/foods/origins'
import { conservationProfileFromContract } from '@/lib/domain/recipes/conservationProfile'

// LES DEUX RACCORDS JSON ONT ÉTÉ RETIRÉS ICI — livrable 0b.4 du plan.
//
// CE QU'ILS FAISAIENT. Ce fichier importait `scripts/data/out/recipe-food-catalog.json`
// pour l'origine des formes et `data/recipes/corpus-v3.json` pour le profil de
// conservation, et complétait avec eux ce que la RPC ne publiait pas. Le
// fichier le disait dans son en-tête : sans le premier, chaque ingrédient servi
// par l'API valait « inconnu » et plus aucun plat n'était végétarien en
// production. C'était vrai, et ce n'était pas une figure de style : mesuré sur
// la capture du catalogue servi, raccords retirés et base laissée à la RPC
// v3-operational-1, on obtient 5 297 ingrédients « inconnu » sur 346 formes
// distinctes, 509 recettes sans profil — donc aucune portion produite d'avance —
// et ZÉRO plat végétarien sur les 509 servis.
//
// POURQUOI ILS PARTENT MAINTENANT, ET PAS AVANT. Le contrat opérationnel les a
// remplacés à la source : 20260917110000 ajoute les deux colonnes déclaratives
// et les projette, 20260917111000 les remplit sur une base déjà chargée, et
// 0b.2 fait écrire les quatre champs par la chaîne de publication. La porte de
// test 0b.3 (`tests/planning/contratOperationnel.test.js`) rejoue les quatre
// critères sur le chemin base, ces deux imports neutralisés, et elle passe :
// c'est la condition que le plan pose au retrait (§5, phase 0b, risque *a*), et
// le retrait n'a été écrit qu'après.
//
// CE QUE LE RETRAIT CHANGE, MESURÉ : rien, sur une base qui porte le contrat.
// 509 recettes servies en [A] comme en [B] ; 0 origine « inconnu », 0 recette
// sans profil, 227 plats végétariens — les mêmes chiffres avec les raccords et
// sans eux. Le filet ne portait plus rien. `tests/planning/retraitRaccordsJson.test.js`
// rejoue cette mesure et interdit le retour des deux imports.
//
// CE QUE LE RETRAIT NE FAIT PAS, et qu'il ne faut pas lui prêter : il ne sort
// pas le corpus du bundle. `lib/domain/recipes/canonicalCatalog.js` importe
// encore les deux mêmes fichiers, et `app/_pricing/estimations.js` l'importe.
// Le §9.3 du plan vise nommément CE fichier-ci ; la sortie du bundle est le
// jalon J1 de la phase 5, et elle reste à faire.
//
// CE QU'IL CHANGE AUSSI, ET QU'IL VAUT MIEUX ÉCRIRE QUE LAISSER DÉCOUVRIR : ce
// matérialiseur sert DEUX catalogues. `listEditorialRecipes`
// (lib/db/operationalRecipeCatalog.js) l'emploie sur
// `get_editorial_recipe_catalog_v3`, qui ne publie NI origine NI profil de
// conservation — vérifié, 0 occurrence dans 20260715214547 et 20260729140000,
// dont les seuls « origin » sont `cuisine_origin`, le pays. Les recettes
// servies par ce chemin rendent donc désormais `origin: 'inconnu'` et
// `conservationProfile: null` là où le raccord les complétait. Aucun écran ni
// aucune route ne lit ces deux champs sur le chemin éditorial (`grep` sur
// app/ et components/ : 0 occurrence), et le contrat opérationnel n'a pas
// enrichi la RPC éditoriale parce que ce n'est pas elle que le planificateur
// lit. Si un écran vient à en avoir besoin, c'est la projection éditoriale
// qu'il faudra enrichir — pas un repli à réintroduire ici.
//
// Il ne reste donc qu'une lecture, et elle est appelée directement plus bas :
// `ingredientOrigin` pour l'origine, `conservationProfileFromContract` pour le
// profil. Les deux fonctions d'enrobage qui étaient ici n'existaient que pour
// porter le repli sur les fichiers embarqués ; sans repli, elles ne faisaient
// plus que masquer d'où vient la valeur. Chacune des deux portes retenues rend
// une ABSENCE quand ce qu'elle reçoit n'est pas au contrat — « inconnu » pour
// une origine hors vocabulaire, `null` pour un profil mal formé — c'est-à-dire
// une valeur qui dit qu'on ne sait pas, et jamais une valeur plausible qu'un
// relecteur ne pourrait plus distinguer d'une vraie.

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
    origin: ingredientOrigin(ingredient),
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
    conservationProfile: conservationProfileFromContract(record?.conservationProfile),
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
