import { normalizeFoodForm } from '../recipes/materializeRecipe'
import { matchesBannedFood } from './foodBanMatch'

const round = (value, digits = 3) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const fold = (value) => normalizeFoodForm(value)

const NUTRIENTS = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']

const scaleNutrition = (nutrition, grams) => Object.fromEntries(NUTRIENTS.map((key) => [
  key,
  round((Number(nutrition?.[key]) || 0) * (Number(grams) || 0) / 100, 2),
]))

const sumNutrition = (parts = []) => Object.fromEntries(NUTRIENTS.map((key) => [
  key,
  round(parts.reduce((sum, part) => sum + (Number(part?.[key]) || 0), 0), 2),
]))

/**
 * Petit corpus d'accompagnements issus des formes canoniques Supabase.
 * Les quantités restent exprimées dans l'état d'achat afin que le stock, les
 * courses et la recette utilisent exactement la même unité physique.
 */
export const PLATE_COMPONENT_FORMS = [
  {
    key: 'pasta',
    foodFormId: '3ff3658b-6227-416c-870c-1e043ba9bbaf',
    label: 'Pâtes sèches courtes',
    formNormalized: 'pates seches courtes',
    aliases: ['petites pates seches', 'spaghetti secs', 'pates seches', 'pates'],
    category: 'cereales_feculents',
    aisle: 'Féculents',
    baseGrams: 70,
    allergens: ['gluten', 'blé'],
    per100g: { kcal: 331, proteinG: 11.5, carbsG: 65.8, fatG: 1.79, fiberG: 0.8 },
    preparation: 'Cuire les pâtes dans une grande casserole d’eau salée, puis égoutter.',
  },
  {
    key: 'rice',
    foodFormId: '1304df86-06d3-46da-9e56-4c818b98b84d',
    label: 'Riz blanc cru',
    formNormalized: 'riz blanc cru',
    aliases: ['riz blanc etuve cru', 'riz basmati cru', 'riz cru', 'riz'],
    category: 'cereales_feculents',
    aisle: 'Féculents',
    baseGrams: 70,
    allergens: [],
    per100g: { kcal: 352, proteinG: 7.4, carbsG: 78, fatG: 0.91, fiberG: 1.05 },
    preparation: 'Rincer le riz puis le cuire à couvert jusqu’à absorption.',
  },
  {
    key: 'potato',
    foodFormId: '2f550bb7-ba8d-4581-a94f-610caa0c537d',
    label: 'Pommes de terre crues épluchées',
    formNormalized: 'pomme de terre crue epluchee',
    aliases: ['pomme de terre crue avec peau', 'pomme de terre nouvelle crue', 'pommes de terre', 'pomme de terre'],
    category: 'cereales_feculents',
    aisle: 'Féculents',
    baseGrams: 250,
    allergens: [],
    per100g: { kcal: 80.5, proteinG: 2.16, carbsG: 16.2, fatG: 0.18, fiberG: 1.02 },
    preparation: 'Cuire les pommes de terre à l’eau ou à la vapeur, puis assaisonner.',
  },
  {
    key: 'green_beans',
    foodFormId: '8f4c8934-f55a-43e0-86d4-f2fde3a9e93c',
    label: 'Haricots verts',
    formNormalized: 'haricot vert cru',
    aliases: ['haricot vert cuit', 'haricots verts', 'haricot vert'],
    category: 'legumes',
    aisle: 'Fruits et légumes',
    baseGrams: 180,
    allergens: [],
    per100g: { kcal: 25.9, proteinG: 1.85, carbsG: 4.14, fatG: 0.21, fiberG: 0.68 },
    preparation: 'Cuire les haricots verts à la vapeur ou dans l’eau salée, en les gardant légèrement fermes.',
  },
  {
    key: 'broccoli',
    foodFormId: '686f35b8-1a79-43ba-bec2-65028ea7b5f8',
    label: 'Brocoli',
    formNormalized: 'brocoli cuit a la vapeur',
    aliases: ['brocoli cru', 'brocoli', 'chou romanesco ou brocoli a pomme cuit'],
    category: 'legumes',
    aisle: 'Fruits et légumes',
    baseGrams: 180,
    allergens: [],
    per100g: { kcal: 37.6, proteinG: 4.13, carbsG: 2.53, fatG: 0.7, fiberG: 2.2 },
    preparation: 'Cuire le brocoli à la vapeur jusqu’à ce qu’il soit tendre mais encore vert.',
  },
]

function ingredientContribution(ingredient, servings) {
  const grams = (Number(ingredient?.grams) || 0) / Math.max(Number(servings) || 1, 1)
  const carbs = grams * (Number(ingredient?.per100g?.carbsG) || 0) / 100
  const role = fold(ingredient?.role)
  const category = fold(ingredient?.category)
  return { grams, carbs, role, category }
}

function isCompositionDocumented(ingredient) {
  return !ingredient?.optional
    && Number(ingredient?.grams) > 0
    && Boolean(fold(ingredient?.category))
    && ingredient?.per100g
    && typeof ingredient.per100g === 'object'
}

/**
 * Analyse la composition réelle, pas uniquement le titre. La chapelure de
 * liaison ne transforme pas des boulettes en plat féculent ; une sauce tomate
 * suffisamment abondante peut en revanche compter comme portion de légumes.
 *
 * En cas de corpus incomplet, la politique est volontairement conservatrice :
 * Myko n'invente aucun accompagnement. Les anciennes recettes et les plats
 * cuisinés restent ainsi stables jusqu'à leur enrichissement dans le corpus.
 */
export function analyzeMealCompleteness(recipe) {
  const ingredients = (recipe?.exactIngredients || []).filter((ingredient) => !ingredient?.optional)
  const documentedIngredients = ingredients.filter(isCompositionDocumented)
  const compositionKnown = documentedIngredients.length >= 2

  if (!compositionKnown) {
    return {
      compositionKnown: false,
      hasStarch: true,
      hasVegetables: true,
      hasProtein: true,
      starchCarbs: 0,
      vegetableEquivalentGrams: 0,
      complete: true,
      missing: [],
    }
  }

  const servings = Math.max(Number(recipe?.servings) || 1, 1)
  let starchCarbs = 0
  let vegetableEquivalentGrams = 0

  for (const ingredient of documentedIngredients) {
    const { grams, carbs, role, category } = ingredientContribution(ingredient, servings)
    const structuralStarch = /cereales feculents|legumineuses/.test(category)
      && !/liaison|panure|chapelure|bechamel|assaisonnement|enrobage|sauce/.test(role)
    if (structuralStarch) starchCarbs += carbs

    if (/legumes/.test(category)) {
      const weight = /aromatique|soffritto|garniture aromatique/.test(role)
        ? 0.5
        : /sauce|coulis/.test(role) ? 0.75 : 1
      vegetableEquivalentGrams += grams * weight
    }
  }

  const proteinPerServing = Number(recipe?.nutritionPerServing?.proteinG) || 0
  const hasStarch = starchCarbs >= 25
  // 100 g équivalents permettent de reconnaître les plats intégrés comme les
  // lasagnes, sans considérer quelques aromates comme une portion de légumes.
  const hasVegetables = vegetableEquivalentGrams >= 100
  const hasProtein = proteinPerServing >= 15

  return {
    compositionKnown: true,
    hasStarch,
    hasVegetables,
    hasProtein,
    starchCarbs: round(starchCarbs, 2),
    vegetableEquivalentGrams: round(vegetableEquivalentGrams, 1),
    complete: hasStarch && hasVegetables && hasProtein,
    missing: [
      ...(!hasProtein ? ['protein'] : []),
      ...(!hasStarch ? ['starch'] : []),
      ...(!hasVegetables ? ['vegetables'] : []),
    ],
  }
}

function componentAllowed(component, constraints = {}) {
  const banned = [...(constraints.forbiddenForms || []), ...(constraints.dislikedForms || [])]
  if ([component.label, component.formNormalized, ...(component.aliases || [])]
    .some((value) => matchesBannedFood(value, banned))) return false
  const allergens = (constraints.allergens || []).map(fold)
  if ((component.allergens || []).some((allergen) => matchesBannedFood(allergen, allergens))) return false
  return true
}

function preferredStarchKeys(recipe) {
  const context = fold([recipe?.family, recipe?.title, recipe?.category, recipe?.cuisineOrigin].filter(Boolean).join(' '))
  if (/boulette|tomate|ital|bologna|parmesan/.test(context)) return ['pasta', 'rice', 'potato']
  if (/curry|indien|thai|asiatique|basquaise|tajine/.test(context)) return ['rice', 'potato', 'pasta']
  if (/carbonade|mijote|filet mignon|moutarde|boeuf|porc|veau/.test(context)) return ['potato', 'pasta', 'rice']
  return ['rice', 'pasta', 'potato']
}

function chooseComponent(keys, constraints) {
  for (const key of keys) {
    const component = PLATE_COMPONENT_FORMS.find((item) => item.key === key)
    if (component && componentAllowed(component, constraints)) return component
  }
  return null
}

function materializeComponent(component, role) {
  if (!component) return null
  const quantityGrams = Number(component.baseGrams) || 0
  return {
    ...component,
    role,
    quantityGrams,
    nutrition: scaleNutrition(component.per100g, quantityGrams),
  }
}

/** Construit uniquement les éléments manquants de l'assiette. */
export function buildMealPlate(recipe, constraints = {}) {
  const analysis = analyzeMealCompleteness(recipe)
  const components = []

  if (analysis.compositionKnown && !analysis.hasStarch) {
    const starch = chooseComponent(preferredStarchKeys(recipe), constraints)
    if (starch) components.push(materializeComponent(starch, 'starch'))
  }
  if (analysis.compositionKnown && !analysis.hasVegetables) {
    const vegetables = chooseComponent(['green_beans', 'broccoli'], constraints)
    if (vegetables) components.push(materializeComponent(vegetables, 'vegetables'))
  }

  const missingUnresolved = analysis.compositionKnown ? [
    ...(!analysis.hasProtein ? ['protein'] : []),
    ...(!analysis.hasStarch && !components.some((item) => item.role === 'starch') ? ['starch'] : []),
    ...(!analysis.hasVegetables && !components.some((item) => item.role === 'vegetables') ? ['vegetables'] : []),
  ] : []

  return {
    analysis,
    components,
    nutritionPerServing: sumNutrition(components.map((item) => item.nutrition)),
    massPerServing: round(components.reduce((sum, item) => sum + item.quantityGrams, 0), 1),
    completeAfter: missingUnresolved.length === 0,
    missingUnresolved,
  }
}

export function scalePlateComponents(plate, factor) {
  return (plate?.components || []).map((component) => {
    const quantityGrams = round(component.quantityGrams * factor, 1)
    return {
      key: component.key,
      role: component.role,
      label: component.label,
      food_form_id: component.foodFormId,
      form_normalized: component.formNormalized,
      aliases: component.aliases || [],
      category: component.category,
      aisle: component.aisle,
      quantity_g: quantityGrams,
      per100g: component.per100g,
      nutrition: scaleNutrition(component.per100g, quantityGrams),
      preparation: component.preparation,
    }
  })
}

export function plateComponentsNutrition(components = []) {
  return sumNutrition(components.map((component) => component.nutrition || scaleNutrition(component.per100g, component.quantity_g)))
}
