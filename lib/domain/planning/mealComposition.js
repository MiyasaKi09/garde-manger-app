import { normalizeFoodForm } from '../recipes/materializeRecipe'
import { matchesBannedFood } from './foodBanMatch'
import { PLATE_ROLES, componentToAdd, isDessertRecipe, plateRoleOf } from './plateRole'

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

/**
 * Corpus des fruits de dessert « à la pièce ». C'est le cas ORDINAIRE — un
 * fruit après le repas — quand le foyer ne peut ni ne veut y ajouter une
 * recette-dessert. Volontairement léger : une pomme pèse ~80 kcal, un demi-
 * pamplemousse ~40, deux clémentines ~70 ; c'est le poids « fin de repas »
 * demandé par l'utilisateur (« comme un fruit ou autre »), pas une portion de
 * pâtisserie.
 *
 * Les valeurs nutritionnelles reprennent celles de `FOOD.apple` dans
 * `personalizedMeals.js` pour la pomme, et complètent par les autres fruits
 * courants du corpus. Aucun `foodFormId` : le composant n'attaque pas encore
 * le stock au sens FEFO — l'appelant qui l'expose au payload doit accepter
 * `food_form_id: null` (les tests d'accompagnement starch/vegetables portent
 * sur ces composants-là et restent verts).
 */
export const DESSERT_FRUIT_FORMS = [
  {
    key: 'apple',
    foodFormId: null,
    label: 'pomme',
    formNormalized: 'pomme',
    aliases: ['pomme fraiche', 'pomme crue'],
    category: 'fruits',
    aisle: 'Fruits et légumes',
    baseGrams: 150,
    allergens: [],
    per100g: { kcal: 55, proteinG: 0.47, carbsG: 12.7, fatG: 0.2, fiberG: 2.27 },
    preparation: 'Servir la pomme entière, ou coupée en quartiers, en fin de repas.',
  },
  {
    key: 'pear',
    foodFormId: null,
    label: 'poire',
    formNormalized: 'poire',
    aliases: ['poire crue'],
    category: 'fruits',
    aisle: 'Fruits et légumes',
    baseGrams: 150,
    allergens: [],
    per100g: { kcal: 53, proteinG: 0.4, carbsG: 12, fatG: 0.15, fiberG: 3 },
    preparation: 'Servir la poire mûre, entière ou coupée en quartiers.',
  },
  {
    key: 'orange',
    foodFormId: null,
    label: 'orange',
    formNormalized: 'orange',
    aliases: ['orange crue'],
    category: 'fruits',
    aisle: 'Fruits et légumes',
    baseGrams: 200,
    allergens: [],
    per100g: { kcal: 45, proteinG: 1, carbsG: 9, fatG: 0.2, fiberG: 2.3 },
    preparation: 'Peler l’orange et la servir en quartiers.',
  },
  {
    key: 'kiwi',
    foodFormId: null,
    label: 'kiwi',
    formNormalized: 'kiwi',
    aliases: ['kiwi cru'],
    category: 'fruits',
    aisle: 'Fruits et légumes',
    baseGrams: 150,
    allergens: [],
    per100g: { kcal: 61, proteinG: 1.14, carbsG: 12, fatG: 0.5, fiberG: 3 },
    preparation: 'Servir deux kiwis coupés en deux, à la cuillère.',
  },
]

/**
 * Budgets énergétiques bornant l'attachement d'un dessert. Trois seuils, pas
 * un curseur continu — l'utilisateur n'a pas à comprendre une fonction de
 * coût. Sous 60 kcal, aucun dessert n'est ajouté (le budget est déjà tenu par
 * les macros et un dessert « gratuit » n'existe pas). De 60 à 250 kcal, on
 * sert un fruit — le cas ordinaire, léger. Au-delà, une portion de FIN DE
 * REPAS d'une recette-dessert du corpus devient acceptable, calibrée pour
 * rester sous le budget disponible.
 */
export const DESSERT_KCAL_THRESHOLDS = Object.freeze({
  minToAttach: 60,       // Sous ce seuil, on ne force pas un dessert.
  fruitCeiling: 250,     // Au-dessus, on peut passer à une recette-dessert.
  richMaxAdd: 220,       // Une portion de fin de repas cible cette énergie.
  richMinAdd: 90,        // Sous ça, la portion perdrait tout intérêt gustatif.
})

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

/** Somme des grammes d'ingrédients non-optionnels d'une recette, pour une part. */
function recipeMassPerServing(recipe) {
  const servings = Math.max(Number(recipe?.servings) || 1, 1)
  const total = (recipe?.exactIngredients || [])
    .filter((ingredient) => !ingredient?.optional)
    .reduce((sum, ingredient) => sum + (Number(ingredient?.grams) || 0), 0)
  return total / servings
}

function recipeAllowed(recipe, constraints = {}) {
  const banned = [...(constraints.forbiddenForms || []), ...(constraints.dislikedForms || [])]
  const allergens = (constraints.allergens || []).map(fold)
  if ((recipe?.allergens || []).some((allergen) => matchesBannedFood(allergen, allergens))) return false
  for (const ingredient of recipe?.exactIngredients || []) {
    if (ingredient?.optional) continue
    if (matchesBannedFood(ingredient.formNormalized || ingredient.name, banned)) return false
  }
  return true
}

/**
 * Compose un composant `role: 'dessert'` à partir d'une recette-dessert du
 * corpus, portionné en FIN DE REPAS. La portion nominale d'un kouign-amann
 * (1006 kcal / part, 166 g) devient ainsi ~30 g pour ~180 kcal — une part
 * modeste servie après le plat, pas la part entière qui a valu à l'audit
 * « 1006 kcal, 7,8 g protéines » comme dîner.
 *
 * `budgetKcal` borne la portion : on cible `DESSERT_KCAL_THRESHOLDS.richMaxAdd`
 * (~220 kcal) sans jamais dépasser le budget restant. Une recette dont la
 * portion nominale est déjà inférieure au plancher (`richMinAdd`) est servie
 * telle quelle — un fromage blanc pris tel quel reste une part complète.
 */
function fromDessertRecipe(recipe, budgetKcal) {
  const kcalPerServing = Number(recipe?.nutritionPerServing?.kcal) || 0
  if (kcalPerServing <= 0) return null
  const massPerServing = recipeMassPerServing(recipe)
  if (massPerServing <= 0) return null

  const targetKcal = Math.min(
    Math.max(DESSERT_KCAL_THRESHOLDS.richMinAdd, DESSERT_KCAL_THRESHOLDS.richMaxAdd),
    Math.max(0, Number(budgetKcal) || 0),
  )
  if (targetKcal < DESSERT_KCAL_THRESHOLDS.richMinAdd) return null

  const fraction = Math.min(1, targetKcal / kcalPerServing)
  const quantityGrams = round(massPerServing * fraction, 1)
  if (quantityGrams <= 0) return null

  const per100g = {}
  for (const key of NUTRIENTS) {
    per100g[key] = round((Number(recipe?.nutritionPerServing?.[key]) || 0) * 100 / massPerServing, 3)
  }

  return {
    key: `dessert-recipe-${recipe.code}`,
    foodFormId: null,
    label: recipe.family,
    formNormalized: fold(recipe.family),
    aliases: [],
    category: 'desserts',
    aisle: 'Épicerie sucrée',
    baseGrams: quantityGrams,
    allergens: recipe.allergens || [],
    per100g,
    preparation: `Servir une portion modeste (${quantityGrams} g) de « ${recipe.family} » en fin de repas.`,
    recipeCode: recipe.code,
    fractionOfServing: round(fraction, 3),
  }
}

/**
 * Composant dessert de fin de repas, ou `null` motivé si le budget ne le
 * permet pas.
 *
 * ARBITRAGE — l'utilisateur a demandé « potentiellement un dessert après
 * chaque repas », pas un dessert systématique : quand le budget calorique
 * restant est trop faible, on refuse plutôt qu'on impose. Le refus est
 * MOTIVÉ (`reason`) pour que l'appelant puisse le remonter dans les issues du
 * plan et que l'utilisateur voie « la journée est déjà tenue sans dessert »
 * plutôt qu'un dessert manquant sans explication.
 *
 * Politique :
 * - Budget < `minToAttach` (60 kcal) → aucun dessert, `insufficient_budget`.
 * - Budget < `fruitCeiling` (250 kcal) → un fruit, rotation déterministe.
 * - Budget ≥ `fruitCeiling` ET pool non vide → une portion de fin de repas
 *   d'un dessert-recette, choisi par rotation `dayIndex`. Sinon fruit.
 * - Chaque candidat (fruit ou recette) doit passer `componentAllowed` /
 *   `recipeAllowed` : allergènes et bannis stricts.
 */
export function buildDessertComponent({
  remainingKcalBudget = null,
  constraints = {},
  dessertPool = [],
  dayIndex = 0,
} = {}) {
  // Attention : `Number(null)` vaut 0 (et est fini) — on ne peut donc pas
  // reposer sur `Number.isFinite` pour distinguer « budget absent » de
  // « budget nul explicite ». Un budget explicite de 0 doit refuser le
  // dessert (`insufficient_budget`) ; un budget non renseigné retombe sur la
  // borne de fruit (mode démonstration ou appelant qui ne veut pas exposer
  // ses cibles).
  const budgetProvided = remainingKcalBudget !== null && remainingKcalBudget !== undefined
  const parsedBudget = Number(remainingKcalBudget)
  const budget = budgetProvided && Number.isFinite(parsedBudget)
    ? parsedBudget
    : DESSERT_KCAL_THRESHOLDS.fruitCeiling

  if (budget < DESSERT_KCAL_THRESHOLDS.minToAttach) {
    return { component: null, reason: 'insufficient_budget', budget: round(budget, 1) }
  }

  const shift = ((Number(dayIndex) || 0) % Math.max(1, dessertPool.length + DESSERT_FRUIT_FORMS.length))
  const richFirst = budget >= DESSERT_KCAL_THRESHOLDS.fruitCeiling

  const tryDessertRecipe = () => {
    if (!dessertPool.length) return null
    const rotated = [...dessertPool.slice(shift % dessertPool.length), ...dessertPool.slice(0, shift % dessertPool.length)]
    for (const recipe of rotated) {
      if (!recipeAllowed(recipe, constraints)) continue
      const component = fromDessertRecipe(recipe, budget)
      if (!component) continue
      if (component.baseGrams <= 0) continue
      const nutrition = scaleNutrition(component.per100g, component.baseGrams)
      if (nutrition.kcal > budget) continue
      return { ...component, quantityGrams: component.baseGrams, role: 'dessert', nutrition }
    }
    return null
  }

  const tryFruit = () => {
    const rotatedFruits = [...DESSERT_FRUIT_FORMS.slice(shift % DESSERT_FRUIT_FORMS.length), ...DESSERT_FRUIT_FORMS.slice(0, shift % DESSERT_FRUIT_FORMS.length)]
    for (const fruit of rotatedFruits) {
      if (!componentAllowed(fruit, constraints)) continue
      const nutrition = scaleNutrition(fruit.per100g, fruit.baseGrams)
      // Un fruit trop lourd (grosse orange) sur un budget déjà mince : on ne
      // le sert pas, on cherche un fruit plus léger dans la rotation.
      if (nutrition.kcal > budget) continue
      return { ...fruit, quantityGrams: fruit.baseGrams, role: 'dessert', nutrition }
    }
    return null
  }

  const first = richFirst ? tryDessertRecipe() : tryFruit()
  if (first) return { component: first, reason: null, budget: round(budget, 1) }
  const second = richFirst ? tryFruit() : tryDessertRecipe()
  if (second) return { component: second, reason: null, budget: round(budget, 1) }
  return { component: null, reason: 'no_allowed_candidate', budget: round(budget, 1) }
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

/**
 * Construit l'assiette d'après ce que la recette EST, et au plus un ajout.
 *
 * L'ancienne version cumulait les manques : un plat sans féculent ET sans
 * légumes recevait les deux. Sur les 118 recettes publiables, 32 se voyaient
 * ainsi doublement accompagnées — riz blanc et haricots verts sur un tiramisu,
 * sur une mousse au chocolat, sur une béchamel. Le rôle d'assiette
 * (lib/domain/planning/plateRole.js) tranche désormais d'abord ce qu'est le
 * plat ; l'inférence sur les grammes ne sert plus qu'à savoir ce qui manque à
 * un plat principal, jamais à décider qu'il en est un.
 */
export function buildMealPlate(recipe, constraints = {}) {
  const analysis = analyzeMealCompleteness(recipe)
  const plateRole = plateRoleOf(recipe, analysis)
  const components = []

  const aAjouter = componentToAdd(plateRole)
  if (aAjouter === 'starch') {
    const starch = chooseComponent(preferredStarchKeys(recipe), constraints)
    if (starch) components.push(materializeComponent(starch, 'starch'))
  } else if (aAjouter === 'vegetables') {
    const vegetables = chooseComponent(['green_beans', 'broccoli'], constraints)
    if (vegetables) components.push(materializeComponent(vegetables, 'vegetables'))
  }

  // Dessert de FIN DE REPAS (« comme un fruit ou autre »), opt-in strict :
  // sans `attachDessert`, `buildMealPlate` retourne exactement ce qu'elle
  // retournait avant. Rationale : un dessert ajoute des calories, et le
  // solveur par membre — que l'agent en parallèle est en train de durcir sur
  // l'énergie et les protéines — doit choisir explicitement d'attacher un
  // dessert et fournir le budget calorique restant. Rien n'est imposé au
  // corpus existant, et le test « ramène l'accompagnement à une proportion
  // défendable » (plateRole.test.js) reste vert par construction.
  //
  // Un dessert n'est jamais attaché à ce qui EST déjà un dessert, ni à un
  // accompagnement (SIDE), ni à une préparation de base (COMPONENT) — servir
  // un fruit après une béchamel n'a pas de sens.
  let dessert = null
  let dessertSkippedReason = null
  const dessertEligibleRoles = [PLATE_ROLES.MAIN, PLATE_ROLES.COMPLETE]
  if (constraints.attachDessert === true && dessertEligibleRoles.includes(plateRole.role)) {
    const outcome = buildDessertComponent({
      remainingKcalBudget: constraints.remainingKcalBudget,
      constraints,
      dessertPool: constraints.dessertPool || [],
      dayIndex: constraints.dayIndex,
    })
    if (outcome.component) {
      dessert = outcome.component
      components.push(dessert)
    } else {
      dessertSkippedReason = outcome.reason
    }
  }

  // Ce qui manque encore est RAPPORTÉ, pas comblé. Un plat principal auquel il
  // manquait féculent et légumes reçoit le féculent ; l'absence de légumes est
  // dite, à charge de l'utilisateur d'en ajouter — pas au moteur d'empiler.
  // Un `dessert` n'entre jamais dans `missingUnresolved` : son absence ne rend
  // pas l'assiette incomplète, c'est un supplément.
  const ajoutees = new Set(components.map((item) => item.role))
  const missingUnresolved = plateRole.role === PLATE_ROLES.MAIN
    ? [
      ...(!analysis.hasProtein ? ['protein'] : []),
      ...plateRole.accepts
        .filter((composante) => composante !== 'dessert')
        .filter((composante) => !ajoutees.has(composante)),
    ]
    : []

  return {
    analysis,
    plateRole,
    components,
    nutritionPerServing: sumNutrition(components.map((item) => item.nutrition)),
    massPerServing: round(components.reduce((sum, item) => sum + item.quantityGrams, 0), 1),
    completeAfter: missingUnresolved.length === 0,
    missingUnresolved,
    dessert,
    dessertSkippedReason,
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
      // Traçabilité d'un dessert-recette : quand le composant provient d'une
      // recette-dessert du corpus (kouign, tiramisu…), on porte le code de la
      // recette et la fraction de portion servie. `recipe_code` reste absent
      // pour un fruit ou un accompagnement, ce qui laisse le payload inchangé
      // pour tous les composants existants (starch/vegetables).
      ...(component.recipeCode ? { recipe_code: component.recipeCode } : {}),
      ...(component.fractionOfServing != null
        ? { fraction_of_serving: component.fractionOfServing }
        : {}),
    }
  })
}

export function plateComponentsNutrition(components = []) {
  return sumNutrition(components.map((component) => component.nutrition || scaleNutrition(component.per100g, component.quantity_g)))
}
