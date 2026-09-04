import { classifyRecipe, recipeLineage } from './closedLoopPlanner'
import { ingredientOrigin, isVeganExcludedOrigin } from '../foods/origins'
import { normalizeFoodForm } from '../recipes/materializeRecipe'
import { getMemberPlanningRules } from './memberPlanningRules'
import { matchesBannedFood } from './foodBanMatch'
import { buildMealPlate, plateComponentsNutrition, scalePlateComponents } from './mealComposition'
import {
  SUPPORT_ENERGY_SHARE, buildSupportLeftoverPool, claimSupportLeftover, leftoverSupport,
} from './supportLeftovers'

const NUTRIENTS = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
const FRUITS = ['pomme', 'kiwi', 'poire', 'banane', 'pêche', 'nectarine', 'orange']

// Plancher protéique journalier. Les dimensions sont évaluées séparément et
// peuvent placer la version en revue sans jamais gonfler artificiellement les
// assiettes au-delà des bornes physiques.
const PROTEIN_FLOOR_RATIO = 0.9
const MACRO_LIMITS = { carbsG: 0.2, fatG: 0.2, fiberG: -0.2 }

// Écart énergétique toléré par membre : ±5 % de sa cible calorique. Historique
// et convention du solveur — les protéines rejoignent désormais l'énergie
// comme contrainte dure, avec un plancher relatif exprimé plus haut.
const ENERGY_TOLERANCE = 0.05

// Ratio maximum entre les portions de deux membres sur un même plat. Rationnel :
// une portion double reste dans la norme humaine (un adulte qui a très faim vs
// un adolescent peu affamé) ; au-delà, la « part » n'a plus de sens partagé et
// le foyer ne reconnaît pas l'assiette comme la sienne. Le corollaire, verrou
// compositional plus bas, garantit que « plus » signifie « la même assiette
// en plus grand » — jamais « une autre assiette ».
const MAX_MEMBER_PORTION_RATIO = 2.0

const MICRONUTRIENT_DAILY_REFERENCES = {
  calcium_mg: 800,
  fer_mg: 14,
  magnesium_mg: 375,
  zinc_mg: 10,
  selenium_ug: 55,
  vitamine_a_ug: 800,
  vitamine_c_mg: 80,
  vitamine_d_ug: 5,
  vitamine_b9_ug: 200,
  vitamine_b12_ug: 2.5,
  potassium_mg: 2000,
}

// `aliases` : noms ALTERNATIFS que portent réellement les lots de production
// (canonical_foods.canonical_name / archetypes.name — vérifiés dans
// supabase/exports/latest/csv). Le matching stock reste une égalité EXACTE sur
// formes normalisées : chaque alias est un nom du vocabulaire réel (ou un
// synonyme strict), et aucun alias n'est identique au nom normalisé d'un
// AUTRE aliment ('pain' ne capte jamais 'pain d épices').
const FOOD = {
  skyr: {
    label: 'skyr nature', unit: 'g', per: 100,
    packageSize: 200, packageUnit: 'g', packageLabel: 'pot',
    nutrition: { kcal: 63, proteinG: 11, carbsG: 4, fatG: 0.2, fiberG: 0 },
    allergens: ['lait'], diets: ['vegetarian'],
  },
  oats: {
    label: 'flocons d’avoine', unit: 'g', per: 100,
    nutrition: { kcal: 370, proteinG: 13, carbsG: 59, fatG: 7, fiberG: 10 },
    aliases: ["flocon d'avoine", 'avoine'], allergens: ['gluten'], diets: ['vegan'],
  },
  eggs: {
    label: 'œufs durs', unit: 'œuf', per: 1,
    nutrition: { kcal: 78, proteinG: 6.3, carbsG: 0.6, fatG: 5.3, fiberG: 0 }, gramsPerUnit: 60,
    aliases: ['œuf'], allergens: ['oeuf'], diets: ['vegetarian'],
  },
  almonds: {
    label: 'amandes', unit: 'g', per: 100,
    nutrition: { kcal: 579, proteinG: 21, carbsG: 9, fatG: 50, fiberG: 12.5 },
    aliases: ['amande'], allergens: ['fruits a coque', 'amande'], diets: ['vegan'],
  },
  bread: {
    label: 'pain complet', unit: 'g', per: 100,
    nutrition: { kcal: 265, proteinG: 9, carbsG: 49, fatG: 3.2, fiberG: 4.9 },
    aliases: ['pain'], allergens: ['gluten'], diets: ['vegan'],
  },
  tuna: {
    label: 'thon au naturel égoutté', unit: 'g', per: 100,
    packageSize: 100, packageUnit: 'g', packageLabel: 'boîte',
    nutrition: { kcal: 116, proteinG: 26, carbsG: 0, fatG: 1, fiberG: 0 },
    // canonique 2064 « thon », archétype 531 « Thon en conserve » + synonyme strict.
    aliases: ['thon', 'thon en conserve', 'thon au naturel en conserve égoutté'], allergens: ['poisson'], diets: ['pescetarian'],
  },
  ham: {
    label: 'jambon blanc', unit: 'g', per: 100,
    packageSize: 80, packageUnit: 'g', packageLabel: 'paquet',
    nutrition: { kcal: 120, proteinG: 20, carbsG: 1, fatG: 4, fiberG: 0 },
    aliases: ['jambon'], allergens: [], diets: [],
  },
  honey: {
    label: 'miel', unit: 'g', per: 100,
    packageSize: 250, packageUnit: 'g', packageLabel: 'pot',
    nutrition: { kcal: 320, proteinG: 0.4, carbsG: 79, fatG: 0, fiberG: 0 },
    // canonique 14001 « miel ».
    aliases: [], allergens: [], diets: ['vegetarian'],
  },
  fromageBlanc: {
    label: 'fromage blanc 0%', unit: 'g', per: 100,
    packageSize: 500, packageUnit: 'g', packageLabel: 'pot',
    nutrition: { kcal: 47, proteinG: 7.5, carbsG: 4.4, fatG: 0.2, fiberG: 0 },
    // archétypes 215 « Fromage blanc 0% » et 316 « fromage blanc ».
    aliases: ['fromage blanc'], allergens: ['lait'], diets: ['vegetarian'],
  },
  yogurt: {
    label: 'yaourt nature', unit: 'g', per: 100,
    packageSize: 125, packageUnit: 'g', packageLabel: 'pot',
    nutrition: { kcal: 61, proteinG: 3.5, carbsG: 4.7, fatG: 3.2, fiberG: 0 },
    // archétypes 335 « yaourt nature » et 333 « yaourt ».
    aliases: ['yaourt'], allergens: ['lait'], diets: ['vegetarian'],
  },
  muesli: {
    label: 'muesli', unit: 'g', per: 100,
    nutrition: { kcal: 380, proteinG: 10, carbsG: 60, fatG: 8, fiberG: 8 },
    // archétype 561 « muesli ».
    aliases: [], allergens: ['gluten'], diets: ['vegan'],
  },
  walnuts: {
    label: 'noix', unit: 'g', per: 100,
    nutrition: { kcal: 654, proteinG: 15, carbsG: 11, fatG: 65, fiberG: 6.7 },
    // canonique 11005 « noix ».
    aliases: [], allergens: ['fruits a coque', 'noix'], diets: ['vegan'],
  },
  // gramsPerUnit : poids par défaut d'un fruit entier moyen (~150 g), utilisé
  // pour rapprocher les fruits « à la pièce » des lots de stock pesés en grammes.
  // Les fruits sont exposés individuellement via FRUITS (leur singulier est déjà
  // le nom canonique exact — aucun nom pluriel n'existe dans le vocabulaire).
  apple: { label: 'fruit', unit: 'pièce', per: 1, gramsPerUnit: 150, allergens: [], diets: ['vegan'], nutrition: { kcal: 82, proteinG: 0.7, carbsG: 19, fatG: 0.3, fiberG: 3.4 } },
}

// Aliases normalisés d'une entrée : formes ALTERNATIVES uniquement (jamais la
// forme principale), dédupliquées — la boucle stock accepte
// [formNormalized, ...aliases] en égalité exacte.
const normalizedAliases = (label, aliases = []) => {
  const primary = normalizeFoodForm(label)
  return [...new Set(aliases.map(normalizeFoodForm))].filter((alias) => alias && alias !== primary)
}

/**
 * Formes achetables des petits-déjeuners et collations, exposées à la boucle
 * stock (chargement des lots + allocation FEFO résiduelle). Chaque entrée donne
 * la conversion en grammes d'une unité de besoin (`per`-based : 1 pour les
 * aliments pesés, gramsPerUnit pour l'œuf et les fruits à la pièce) et ses
 * `aliases` — les formes normalisées alternatives du vocabulaire réel des lots
 * (égalité exacte uniquement, voir le commentaire de FOOD).
 */
export const SUPPLEMENT_FORMS = [
  ...Object.values(FOOD).map((food) => ({
    label: food.label,
    unit: food.unit,
    gramsPerUnit: food.unit === 'g' ? 1 : food.gramsPerUnit,
    formNormalized: normalizeFoodForm(food.label),
    aliases: normalizedAliases(food.label, food.aliases),
    packageSize: food.packageSize || null,
    packageUnit: food.packageUnit || null,
    packageLabel: food.packageLabel || null,
  })),
  ...FRUITS.map((fruit) => ({
    label: fruit,
    unit: 'pièce',
    gramsPerUnit: FOOD.apple.gramsPerUnit,
    formNormalized: normalizeFoodForm(fruit),
    aliases: [],
    packageSize: null,
  })),
]

const round = (value, digits = 2) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const emptyNutrition = () => Object.fromEntries(NUTRIENTS.map((key) => [key, 0]))

function addNutrition(...values) {
  return Object.fromEntries(NUTRIENTS.map((key) => [key, round(values.reduce((sum, value) => sum + (Number(value?.[key]) || 0), 0))]))
}

function scaleMicronutrients(micros = {}, factor = 1) {
  return Object.fromEntries(Object.entries(micros || {})
    .map(([key, value]) => [key, round((Number(value) || 0) * factor, 2)])
    .filter(([, value]) => value > 0))
}

export function scaleNutrition(nutrition, factor) {
  return Object.fromEntries(NUTRIENTS.map((key) => [key, round((Number(nutrition?.[key]) || 0) * factor)]))
}

function itemNutrition(item) {
  const food = FOOD[item.food]
  return scaleNutrition(food.nutrition, item.quantity / food.per)
}

function supportNutrition(items) {
  return items.reduce((total, item) => addNutrition(total, itemNutrition(item)), emptyNutrition())
}

function scaledSupport(support, factor, fruit) {
  // Un « reste compatible » (§13) est une portion physique : on ne la réduit ni
  // ne la multiplie, et sa nutrition vient du plat, pas d'un assemblage.
  if (support.leftover) return { ...support, scale: 1 }
  const items = support.items.map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * factor),
    displayLabel: item.food === 'apple' ? fruit : FOOD[item.food].label,
  }))
  return {
    ...support,
    items,
    description: describeItems(items, fruit),
    nutrition: supportNutrition(items),
    scale: round(factor, 2),
  }
}

function formatQuantity(item) {
  const food = FOOD[item.food]
  if (food.packageSize && item.quantity % food.packageSize === 0) {
    const count = item.quantity / food.packageSize
    return `${count} ${food.packageLabel}${count > 1 ? 's' : ''} de ${food.packageSize} ${food.packageUnit}`
  }
  if (food.unit === 'œuf') {
    const value = Math.round(item.quantity)
    return `${String(value).replace('.', ',')} ${value > 1 ? 'œufs' : 'œuf'}`
  }
  if (food.unit === 'pièce') return `${Math.round(item.quantity)}`
  return `${Math.max(1, Math.round(item.quantity))} g`
}

function describeItems(items, fruit) {
  return items.map((item) => {
    const food = FOOD[item.food]
    const label = item.food === 'apple' ? fruit : food.label
    if (food.unit === 'œuf') {
      const quantity = Math.round(item.quantity)
      return `${quantity} œuf${quantity > 1 ? 's' : ''} dur${quantity > 1 ? 's' : ''}`
    }
    if (food.unit === 'pièce') return `${formatQuantity(item)} ${label}${item.quantity > 1 ? 's' : ''}`
    return `${formatQuantity(item)} de ${label}`
  }).join(' + ')
}

function targetFor(member, goals) {
  const goal = goals.find((item) => fold(item.person_name) === fold(member.name)) || {}
  const multiplier = Number(member.portion_multiplier) || 1
  return {
    kcal: Number(goal.target_calories) || 2000 * multiplier,
    proteinG: Number(goal.target_protein_g) || 100 * multiplier,
    carbsG: Number(goal.target_carbs_g) || 230 * multiplier,
    fatG: Number(goal.target_fat_g) || 70 * multiplier,
    fiberG: Number(goal.target_fiber_g) || 25 * multiplier,
  }
}

/**
 * Familles de petits-déjeuners (plan de refonte §13). L'ancienne rotation ne
 * comptait que quatre assemblages pour sept jours : les œufs durs revenaient
 * cinq matins sur sept et le pain complet trois. Huit familles distinctes
 * suppriment les répétitions d'assemblage tout en restant des aliments
 * réellement achetables, présents dans le vocabulaire des lots.
 *
 * Deux invariants tenus par construction, vérifiés par les tests :
 * - aucun assemblage deux jours de suite ;
 * - ni œufs ni pain complet quotidiens (deux matins sur huit chacun).
 *
 * La rotation compte huit entrées et non sept : une semaine ne rejoue donc pas
 * la même séquence que la précédente, et aucun assemblage n'est attaché à un
 * jour de la semaine.
 *
 * La neuvième famille du plan, « reste compatible », ne figure pas ici : elle
 * ne sert pas un assemblage mais une portion de plat déjà cuisiné, et n'est
 * donc pas dérivable d'une date. Elle vit dans `supportLeftovers.js` et passe
 * AVANT la rotation quand un reste convient.
 */
const BREAKFAST_ROTATION = [
  {
    family: 'laitier_cereales',
    shortLabel: 'Skyr, avoine et fruit',
    items: [{ food: 'skyr', quantity: 200 }, { food: 'oats', quantity: 40 }, { food: 'apple', quantity: 1 }],
  },
  {
    family: 'oeufs_tartine',
    shortLabel: 'Œufs durs, pain complet et fruit',
    items: [{ food: 'eggs', quantity: 3 }, { food: 'bread', quantity: 80 }, { food: 'apple', quantity: 1 }],
  },
  {
    family: 'fromage_blanc_muesli',
    shortLabel: 'Fromage blanc, muesli et fruit',
    items: [{ food: 'fromageBlanc', quantity: 250 }, { food: 'muesli', quantity: 45 }, { food: 'apple', quantity: 1 }],
  },
  {
    family: 'porridge',
    shortLabel: 'Porridge d’avoine, skyr et noix',
    items: [{ food: 'oats', quantity: 60 }, { food: 'skyr', quantity: 200 }, { food: 'walnuts', quantity: 15 }],
  },
  {
    family: 'tartine_salee',
    shortLabel: 'Tartine de jambon et fruit',
    items: [{ food: 'bread', quantity: 80 }, { food: 'ham', quantity: 80 }, { food: 'apple', quantity: 1 }],
  },
  {
    family: 'overnight_oats',
    shortLabel: 'Avoine trempée, fromage blanc et amandes',
    items: [{ food: 'oats', quantity: 50 }, { food: 'fromageBlanc', quantity: 200 }, { food: 'almonds', quantity: 15 }],
  },
  {
    family: 'oeufs_laitier',
    shortLabel: 'Œufs durs, yaourt et fruit',
    items: [{ food: 'eggs', quantity: 3 }, { food: 'yogurt', quantity: 200 }, { food: 'apple', quantity: 1 }],
  },
  {
    // « préparation maison » (§13) : les ingrédients restent des aliments
    // achetables ordinaires — c'est le GESTE qui distingue cette famille, et il
    // se matérialise par une tâche de préparation, comme la cuisson des œufs.
    family: 'preparation_maison',
    shortLabel: 'Granola maison, fromage blanc et fruit',
    items: [
      { food: 'oats', quantity: 60 }, { food: 'walnuts', quantity: 20 },
      { food: 'honey', quantity: 15 }, { food: 'fromageBlanc', quantity: 200 },
    ],
    homemade: {
      key: 'granola',
      title: 'Préparer le granola maison',
      instruction: 'Mélanger les flocons d’avoine, les noix concassées et le miel, étaler sur une plaque et torréfier 15 min à 160 °C. Se conserve une semaine en bocal.',
      durationMin: 20,
      // Une préparation qui se garde : on ne la refait pas chaque matin.
      keepsDays: 7,
    },
  },
]

/**
 * Décalage de rotation dérivé de la DATE de début de fenêtre : deux semaines
 * consécutives ne rejouent pas la même séquence de petits-déjeuners. Fonction
 * PURE d'une date ISO — le déterminisme des supports porte les réservations
 * FEFO et la reproductibilité des courses, jamais d'aléatoire ni d'horloge.
 */
export function supportRotationOffset(isoDate) {
  if (!isoDate) return 0
  const days = Math.floor(new Date(`${String(isoDate).slice(0, 10)}T00:00:00Z`).getTime() / 86400000)
  return Number.isFinite(days) ? Math.floor(days / 7) : 0
}

function breakfastTemplate(dayIndex) {
  const length = BREAKFAST_ROTATION.length
  return BREAKFAST_ROTATION[((dayIndex % length) + length) % length]
}

/**
 * Familles de collations (§13), classées par adéquation à la cible. Nouveauté
 * du lot 7 : la famille du petit-déjeuner du jour passe en dernier — la
 * collation ne redouble plus l'assemblage du matin.
 */
function snackTemplates(dayIndex, target, breakfastFamily = null) {
  const highProteinTarget = Number(target?.proteinG) / Math.max(Number(target?.kcal), 1) >= 0.065
  const standard = {
    family: 'tartine',
    shortLabel: 'Fruit, pain complet et amandes',
    items: [{ food: 'bread', quantity: 60 }, { food: 'almonds', quantity: 15 }, { food: 'apple', quantity: 1 }],
  }
  const egg = {
    family: 'oeufs_tartine',
    shortLabel: 'Œufs durs, pain complet et fruit',
    items: [{ food: 'eggs', quantity: 2 }, { food: 'bread', quantity: 50 }, { food: 'apple', quantity: 1 }],
  }
  // Les collations riches en protéines évitent le couple « protéines basses /
  // lipides hauts » observé en production.
  const proteinRotation = [
    { family: 'tartine_salee', shortLabel: 'Thon, pain complet et fruit', items: [{ food: 'tuna', quantity: 100 }, { food: 'bread', quantity: 60 }, { food: 'apple', quantity: 1 }] },
    { family: 'laitier_cereales', shortLabel: 'Skyr, pain complet et fruit', items: [{ food: 'skyr', quantity: 200 }, { food: 'bread', quantity: 60 }, { food: 'apple', quantity: 1 }] },
    { family: 'tartine_salee', shortLabel: 'Jambon, pain complet et fruit', items: [{ food: 'ham', quantity: 80 }, { food: 'bread', quantity: 60 }, { food: 'apple', quantity: 1 }] },
    { family: 'laitier_proteine', shortLabel: 'Fromage blanc et fruit', items: [{ food: 'fromageBlanc', quantity: 250 }, { food: 'apple', quantity: 1 }] },
    { family: 'oleagineux', shortLabel: 'Noix et fruit', items: [{ food: 'walnuts', quantity: 30 }, { food: 'apple', quantity: 1 }] },
    {
      // « Préparation maison » côté collation (§13) : une fournée couvre la
      // semaine, comme le granola du matin.
      family: 'preparation_maison',
      shortLabel: 'Barres maison avoine et noix',
      items: [{ food: 'oats', quantity: 40 }, { food: 'walnuts', quantity: 25 }, { food: 'honey', quantity: 15 }],
      homemade: {
        key: 'barres',
        title: 'Préparer les barres maison',
        instruction: 'Mélanger les flocons d’avoine, les noix concassées et le miel, presser dans un moule et cuire 15 min à 170 °C, puis détailler en barres.',
        durationMin: 25,
        keepsDays: 7,
      },
    },
  ]
  const shift = ((dayIndex % proteinRotation.length) + proteinRotation.length) % proteinRotation.length
  const rotated = [...proteinRotation.slice(shift), ...proteinRotation.slice(0, shift)]
  const ordered = highProteinTarget
    ? [...rotated, egg, standard]
    : [dayIndex % 2 ? egg : standard, standard, egg, ...rotated]
  if (!breakfastFamily) return ordered
  const different = ordered.filter((candidate) => candidate.family !== breakfastFamily)
  // Jamais de liste vide : si toutes les collations partagent la famille du
  // matin, l'ordre initial reprend la main.
  return different.length
    ? [...different, ...ordered.filter((candidate) => candidate.family === breakfastFamily)]
    : ordered
}

// Correspondance à frontières de mots (foodBanMatch) : l'ancien matching par
// sous-chaînes bannissait « fruit » via « fruits de mer » et « eau » via
// « veau »/« agneau » — toutes les collations et une partie du corpus
// devenaient interdites (incident prod du 24/07).
function matchesForbidden(value, forbidden) {
  return matchesBannedFood(value, forbidden)
}

function dietMatches(diets, pattern) {
  return [...diets].some((diet) => pattern.test(diet))
}

function supportItemAllowed(item, constraints = {}) {
  const food = FOOD[item.food]
  if (!food) return false
  const forbidden = [...(constraints.forbiddenForms || []), ...(constraints.dislikedForms || [])].map(fold).filter(Boolean)
  const allergens = (constraints.allergens || []).map(fold).filter(Boolean)
  const names = [food.label, ...(food.aliases || []), item.displayLabel].filter(Boolean)
  if (names.some((name) => matchesForbidden(name, forbidden))) return false
  if ((food.allergens || []).some((allergen) => matchesForbidden(allergen, allergens))) return false
  const diets = new Set((constraints.diets || []).map(fold))
  if (dietMatches(diets, /vegan|vegetalien/) && !(food.diets || []).includes('vegan')) return false
  if (dietMatches(diets, /vegetar|vegan|vegetalien/) && !(food.diets || []).some((diet) => ['vegan', 'vegetarian'].includes(diet))) return false
  if (dietMatches(diets, /sans porc|no pork/) && item.food === 'ham') return false
  if (dietMatches(diets, /sans poisson|no fish/) && item.food === 'tuna') return false
  return true
}

function safeSupportTemplates(candidates, constraints) {
  const seen = new Set()
  return (candidates || []).filter((candidate) => {
    if (!candidate?.items?.every((item) => supportItemAllowed(item, constraints))) return false
    const key = candidate.items.map((item) => `${item.food}:${item.quantity}`).join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function recipeDistance(left, right) {
  const dimensions = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
  let score = dimensions.reduce((sum, key) => {
    const expected = Number(left.nutritionPerServing?.[key]) || 1
    const actual = Number(right.nutritionPerServing?.[key]) || 0
    return sum + Math.abs(actual - expected) / expected
  }, 0)
  if (left.sensory?.profile && left.sensory.profile === right.sensory?.profile) score -= 1.5
  if (left.cuisineOrigin && left.cuisineOrigin === right.cuisineOrigin) score -= 0.75
  score += Math.abs((Number(left.prepMinutes) || 0) - (Number(right.prepMinutes) || 0)) / 120
  return score
}

function recipeAllowed(recipe, constraints = {}) {
  const allergies = (constraints.allergens || []).map(fold).filter(Boolean)
  if ((recipe.allergens || []).some((value) => matchesForbidden(value, allergies))) return false
  const forbidden = [...(constraints.forbiddenForms || []), ...(constraints.dislikedForms || [])].map(fold).filter(Boolean)
  const ingredients = recipe.exactIngredients || []
  if (ingredients.some((ingredient) => {
    const form = fold(ingredient.formNormalized || ingredient.name)
    return matchesForbidden(form, forbidden)
  })) return false

  const diets = new Set((constraints.diets || []).map(fold))
  const classification = classifyRecipe(recipe)
  if (dietMatches(diets, /vegetar|vegan|vegetalien/) && !classification.vegetarian) return false
  if (dietMatches(diets, /sans poisson|no fish/) && classification.fish) return false
  if (dietMatches(diets, /sans porc|no pork/)
    && ingredients.some((ingredient) => /\b(porc|jambon|lardon|bacon|chorizo)\b/.test(fold(ingredient.formNormalized || ingredient.name)))) return false
  if (dietMatches(diets, /vegan|vegetalien/)) {
    if (!classification.vegetarian) return false
    // Même lecture que le planificateur : l'origine DÉCLARÉE de chaque forme,
    // et non une liste de mots — « lait de coco » contient « lait » sans rien
    // devoir au végétalien, « ghee » ou « paneer » ne contiennent aucun des
    // mots et lui doivent tout.
    if (ingredients.some((ingredient) => !ingredient.optional && isVeganExcludedOrigin(ingredientOrigin(ingredient)))) return false
  }
  return true
}

// Ordonnancement partagé par les deux sélecteurs : distance nutritionnelle
// contre la base, pénalisée quand le candidat est déjà consommé ailleurs dans
// la semaine, départage lexicographique pour rester déterministe.
const distanceOrder = (base, usedCodes) => (left, right) => {
  const leftPenalty = usedCodes.has(left.code) ? 1.5 : 0
  const rightPenalty = usedCodes.has(right.code) ? 1.5 : 0
  return (recipeDistance(base, left) + leftPenalty) - (recipeDistance(base, right) + rightPenalty)
    || left.code.localeCompare(right.code)
}

/**
 * Alternative respectant une contrainte (allergène, régime, interdit), qui
 * PRIVILÉGIE une variante de la MÊME LIGNÉE avant de tomber sur un plat
 * différent. Deux versions d'un même plat sont préférables à deux plats
 * distincts : une seule cuisson, une liste de courses partagée, une assiette
 * reconnaissable. Le fallback existe — le corpus ne fournit pas toujours ce
 * qu'il faudrait — mais il est explicitement marqué `sameLineage:false` pour
 * que l'appelant sache signaler la substitution comme dégradée.
 *
 * Retourne `null` si aucun candidat n'est admissible ; sinon
 * `{ recipe, sameLineage }`.
 */
function chooseSafeAlternative(base, recipes, usedCodes, constraints) {
  const baseLineage = recipeLineage(base)
  const eligible = recipes.filter((recipe) => (
    recipe.eligible && recipe.code !== base.code && recipeAllowed(recipe, constraints)
  ))
  const sameLineage = eligible.filter((recipe) => recipeLineage(recipe) === baseLineage)
  if (sameLineage.length) {
    return { recipe: sameLineage.sort(distanceOrder(base, usedCodes))[0], sameLineage: true }
  }
  const fallback = eligible.sort(distanceOrder(base, usedCodes))[0]
  return fallback ? { recipe: fallback, sameLineage: false } : null
}

/**
 * Alternative végétarienne d'un plat carné. Même règle que `chooseSafeAlternative` :
 * une variante végétarienne de la même lignée d'abord (la version végé d'un
 * cassoulet, d'une parmigiana, d'un gratin — deux versions du même plat), un
 * plat entièrement différent en dernier recours et signalé.
 *
 * C'est l'exigence directement énoncée : mercredi soir, Zoé ne doit pas
 * recevoir une shakshuka pendant que Julien mange un suya de bœuf. Si le
 * corpus contient une variante végé du suya, elle sort la première ; sinon
 * on remonte le fallback avec `sameLineage:false` pour que la couche
 * supérieure marque « pas de variante disponible » plutôt que de faire passer
 * pour équivalents deux plats sans rapport.
 */
function chooseVegetarianAlternative(base, recipes, usedCodes, constraints) {
  const baseLineage = recipeLineage(base)
  const eligible = recipes.filter((recipe) => (
    recipe.eligible
    && classifyRecipe(recipe).vegetarian
    && recipe.code !== base.code
    && recipeAllowed(recipe, constraints)
  ))
  const sameLineage = eligible.filter((recipe) => recipeLineage(recipe) === baseLineage)
  if (sameLineage.length) {
    return { recipe: sameLineage.sort(distanceOrder(base, usedCodes))[0], sameLineage: true }
  }
  const fallback = eligible.sort(distanceOrder(base, usedCodes))[0]
  return fallback ? { recipe: fallback, sameLineage: false } : null
}

function macroScore(total, target, lunchScale, dinnerScale) {
  const deviation = (key) => {
    const expected = Number(target[key])
    return expected > 0 ? (Number(total[key]) - expected) / expected : 0
  }
  const protein = deviation('proteinG')
  const carbs = deviation('carbsG')
  const fat = deviation('fatG')
  const fiber = deviation('fiberG')

  // Les déficits protéiques/glucidiques et les excès lipidiques sont
  // asymétriques : ils étaient auparavant trop peu coûteux face à l'énergie.
  const nutritionScore =
    Math.max(0, -protein) ** 2 * 10 + Math.max(0, protein) ** 2 * 1.2
    + Math.max(0, -carbs) ** 2 * 4 + Math.max(0, carbs) ** 2 * 1.2
    + Math.max(0, fat) ** 2 * 7 + Math.max(0, -fat) ** 2 * 0.8
    + Math.max(0, -fiber) ** 2 * 2

  const proteinFloorDeficit = Math.max(0, -protein - (1 - PROTEIN_FLOOR_RATIO))
  const regularity = ((lunchScale - 1) ** 2 + (dinnerScale - 1) ** 2) * 0.012
  return nutritionScore + proteinFloorDeficit ** 2 * 12 + regularity
}

function steps(min, max, step) {
  const values = []
  for (let value = min; value <= max + step / 2; value += step) values.push(round(value, 3))
  return values
}

/**
 * Les supports (petit-déjeuner et collation) restent des aliments achetables :
 * pots, œufs entiers, fruits entiers et grammages ronds. Les plats principaux
 * varient par dixièmes dans une enveloppe pratique et une limite de masse.
 *
 * Deux contrats forts (lot correctif protéines / assiettes) :
 *
 * 1. VERROU COMPOSITIONNEL. Le facteur d'accompagnement (`companionScale`) est
 *    verrouillé sur le facteur du plat principal — on ne peut plus doser
 *    séparément « plus de riz » et « moins de viande ». Sans cela, deux membres
 *    partageant la MÊME recette obtenaient des assiettes structurellement
 *    différentes : Zoé 109 g de glucides, Julien 55 g pour le même bacalao du
 *    7 août 2026, parce que le solveur atteignait les deux cibles nutritives
 *    en jouant sur la proportion recette/accompagnement. Verrouiller garantit
 *    « le même plat en plus grand » — pas « un autre plat ».
 *
 * 2. PROTÉINES EN CONTRAINTE DURE. Deux passes : la première refuse tout
 *    candidat sous 90 % de la cible protéique (au même titre que l'énergie
 *    reste dans ±5 %) ; la seconde ne se déclenche que si aucune combinaison
 *    ne satisfait strict, et marque `proteinGateRelaxed: true` pour que la
 *    couche supérieure sache dégrader honnêtement au lieu de publier une
 *    semaine à 15 g de protéines sans le dire (incident Zoé 03/08).
 */
export function optimizeDailyPortions({
  target,
  breakfast,
  snack,
  lunch,
  dinner,
  lunchCompanion = null,
  dinnerCompanion = null,
  rules = {},
  // Bornes issues du couplage inter-membres. Le solveur reste solvable
  // (l'enveloppe globale [minScale, maxScale] est respectée), mais un master
  // scale imposé par un autre membre du foyer restreint la fenêtre — c'est
  // ainsi que les portions d'un même plat restent à un facteur borné entre
  // membres. Valeur par défaut = pas de contrainte de couplage.
  minLunchScale = null,
  maxLunchScale = null,
  minDinnerScale = null,
  maxDinnerScale = null,
  // Contrainte dure protéines. `false` = seule l'énergie est bloquante (mode
  // relaxed pour le repli), `true` = les deux gates sont exigés (mode strict).
  requireProteinFloor = true,
  proteinFloorRatio = PROTEIN_FLOOR_RATIO,
}) {
  const breakfastNutrition = breakfast?.nutrition || emptyNutrition()
  const snackNutrition = snack?.nutrition || emptyNutrition()
  const lunchCompanionNutrition = lunchCompanion?.nutrition || emptyNutrition()
  const dinnerCompanionNutrition = dinnerCompanion?.nutrition || emptyNutrition()
  const minScale = Number(rules.minMealServings) || 0.5
  const maxScale = Math.min(2, Number(rules.hardMaxMealServings) || 2)
  const preferredMin = Math.max(minScale, Number(rules.preferredMinMealServings) || 0.75)
  const preferredMax = Math.min(maxScale, Number(rules.preferredMaxMealServings) || 1.5)
  const toleratedMax = Math.min(maxScale, Math.max(preferredMax, Number(rules.toleratedMaxMealServings) || 1.75))
  const maxMealMassGrams = Number(rules.maxMealMassGrams) || 900
  const lunchMass = Number(rules.lunchMassPerServing) || 0
  const dinnerMass = Number(rules.dinnerMassPerServing) || 0
  const lunchCompanionMass = Number(rules.lunchCompanionMassPerServing) || 0
  const dinnerCompanionMass = Number(rules.dinnerCompanionMassPerServing) || 0
  const mealScales = steps(minScale, maxScale, 0.1)
  // Intersection avec les bornes de couplage : on garde uniquement les échelles
  // compatibles avec le master imposé au foyer. Tolérance 1e-9 pour éviter les
  // pertes dues à l'arithmétique flottante des `steps`.
  const withinRange = (scale, min, max) => (
    (min == null || scale >= min - 1e-9)
    && (max == null || scale <= max + 1e-9)
  )
  const rawLunchScales = Number(rules.fixedLunchScale) > 0 ? [Number(rules.fixedLunchScale)] : mealScales
  const rawDinnerScales = Number(rules.fixedDinnerScale) > 0 ? [Number(rules.fixedDinnerScale)] : mealScales
  const lunchScales = rawLunchScales.filter((scale) => withinRange(scale, minLunchScale, maxLunchScale))
  const dinnerScales = rawDinnerScales.filter((scale) => withinRange(scale, minDinnerScale, maxDinnerScale))
  // Les supports restent des unités physiques cohérentes (un pot, une boîte,
  // des œufs entiers). L'ajustement énergétique se fait sur les deux assiettes.
  const breakfastScales = breakfast ? [1] : [0]
  const snackScales = snack ? [1] : [0]
  const supportAtScale = (support, factor, fallback) => {
    if (!support) return emptyNutrition()
    if (!support.items?.length) return scaleNutrition(fallback, factor)
    return supportNutrition(support.items.map((item) => ({ ...item, quantity: Math.round(item.quantity * factor) })))
  }
  const proteinTarget = Number(target?.proteinG) || 0
  // Le plancher physique dépend UNIQUEMENT de la cible du membre. Le drapeau
  // `proteinGateRelaxed` décrit ensuite le RÉSULTAT (protéines sous plancher),
  // pas le mode d'entrée : c'est ce que la couche supérieure consomme pour
  // décider si la journée est saine ou dégradée, indépendamment de la passe
  // qui a produit le candidat.
  const proteinFloor = proteinTarget > 0 ? proteinTarget * proteinFloorRatio : 0

  let bestStrict = null           // Passe stricte : énergie ±5 % ET protéines ≥ plancher
  let bestEnergyOnly = null       // Passe relaxée : énergie ±5 % seule
  let bestFallback = null         // Repli ultime : le moins mauvais énergétiquement

  for (const breakfastScale of breakfastScales) {
    for (const snackScale of snackScales) {
      for (const lunchScale of lunchScales) {
        for (const dinnerScale of dinnerScales) {
          // Verrou compositionnel : l'accompagnement suit le plat principal.
          // Un membre qui prend une plus grosse portion prend le MÊME plat en
          // plus grand — jamais un mélange où la balance protéines/glucides
          // dérive discrètement d'un membre à l'autre.
          const lunchCompanionScale = lunchCompanion ? lunchScale : 0
          const dinnerCompanionScale = dinnerCompanion ? dinnerScale : 0
          if ((!rules.historicalLunch && lunchMass * lunchScale + lunchCompanionMass * lunchCompanionScale > maxMealMassGrams)
            || (!rules.historicalDinner && dinnerMass * dinnerScale + dinnerCompanionMass * dinnerCompanionScale > maxMealMassGrams)) continue
          const total = addNutrition(
            supportAtScale(breakfast, breakfastScale, breakfastNutrition),
            supportAtScale(snack, snackScale, snackNutrition),
            scaleNutrition(lunch, lunchScale),
            scaleNutrition(lunchCompanionNutrition, lunchCompanionScale),
            scaleNutrition(dinner, dinnerScale),
            scaleNutrition(dinnerCompanionNutrition, dinnerCompanionScale),
          )
          const energyDeviation = Math.abs(total.kcal - target.kcal) / Math.max(target.kcal, 1)
          const preferredRangePenalty = (
            Math.max(0, preferredMin - lunchScale) ** 2
            + Math.max(0, preferredMin - dinnerScale) ** 2
            + Math.max(0, lunchScale - preferredMax) ** 2
            + Math.max(0, dinnerScale - preferredMax) ** 2
          ) * 2
          const toleratedRangePenalty = (
            Math.max(0, lunchScale - toleratedMax) ** 2
            + Math.max(0, dinnerScale - toleratedMax) ** 2
          ) * 10
          const supportPenalty = ((breakfastScale && breakfastScale - 1) ** 2 + (snackScale && snackScale - 1) ** 2) * 0.08
          const score = macroScore(total, target, lunchScale, dinnerScale) + energyDeviation ** 2 * 12
            + preferredRangePenalty + toleratedRangePenalty + supportPenalty
          const candidate = {
            score,
            breakfastScale,
            snackScale,
            lunchScale,
            dinnerScale,
            lunchCompanionScale,
            dinnerCompanionScale,
            total,
            physicalFeasible: true,
          }
          if (!bestFallback || energyDeviation < bestFallback.energyDeviation || (energyDeviation === bestFallback.energyDeviation && score < bestFallback.score)) {
            bestFallback = { ...candidate, energyDeviation }
          }
          if (energyDeviation <= ENERGY_TOLERANCE) {
            // Le flag `proteinGateRelaxed` reflète l'état protéique OBSERVÉ,
            // pas le mode demandé. `bestStrict` a par construction protéines
            // ≥ plancher, `bestEnergyOnly` peut être sous le plancher — c'est
            // ce qui rend la signalisation honnête.
            const belowFloor = proteinFloor > 0 && total.proteinG + 1e-6 < proteinFloor
            if (!bestEnergyOnly || score < bestEnergyOnly.score) {
              bestEnergyOnly = { ...candidate, energyDeviation, feasible: true, proteinGateRelaxed: belowFloor }
            }
            if (!belowFloor && (!bestStrict || score < bestStrict.score)) {
              bestStrict = { ...candidate, energyDeviation, feasible: true, proteinGateRelaxed: false }
            }
          }
        }
      }
    }
  }

  // Contrat de retour selon la contrainte demandée :
  // - `requireProteinFloor=true` : ne rend `feasible:true` QUE si le plancher
  //   protéique est tenu. Sans cela, retour marqué `feasible:false` — c'est
  //   ce qui permet à la cascade jointe (strict → relax protéines → relax
  //   couplage) de bien détecter qu'il faut passer à l'étape suivante, au
  //   lieu d'accepter en silence un candidat énergie seule.
  // - `requireProteinFloor=false` : accepte le repli énergie et le marque
  //   explicitement via `proteinGateRelaxed:true` pour signalement en amont.
  if (bestStrict) return bestStrict
  if (!requireProteinFloor && bestEnergyOnly) return bestEnergyOnly
  return {
    ...(bestFallback || {
      breakfastScale: 0,
      snackScale: 0,
      lunchScale: Math.max(minScale, minLunchScale ?? minScale),
      dinnerScale: Math.max(minScale, minDinnerScale ?? minScale),
      lunchCompanionScale: lunchCompanion ? Math.max(minScale, minLunchScale ?? minScale) : 0,
      dinnerCompanionScale: dinnerCompanion ? Math.max(minScale, minDinnerScale ?? minScale) : 0,
      total: emptyNutrition(),
      physicalFeasible: false,
    }),
    feasible: false,
    proteinGateRelaxed: true,
  }
}

/**
 * Solveur JOINT pour un jour et un foyer. C'est ici que le couplage entre
 * membres se joue : deux personnes partageant un plat obtiennent des portions
 * dont le rapport reste borné (`MAX_MEMBER_PORTION_RATIO`), et le verrou
 * compositionnel garantit que ce sont des versions plus grandes ou plus
 * petites du même plat — jamais un mix différent.
 *
 * Trois passes cascadées, dans le même esprit que `closedLoopPlanner.js` :
 *
 * 1. STRICTE — protéines dures + couplage actif. C'est le mode nominal.
 * 2. PROTÉINES RELÂCHÉES — le corpus ne peut pas fournir 90 % des protéines
 *    ciblées ; on garde le couplage, les jours concernés portent
 *    `protein_gate_relaxed: true` et `protein_valid: false`.
 * 3. COUPLAGE RELÂCHÉ — même les protéines relâchées échouent quand couplées :
 *    on laisse chaque membre optimiser librement et on marque
 *    `portion_coupling_relaxed: true` pour que la couche supérieure signale.
 *
 * À aucune passe on ne rend « rien » : le repli ultime prend le moins mauvais
 * candidat énergétique par membre. Le plan sort DÉGRADÉ, jamais absent.
 */
export function optimizeCoupledDailyPortions({
  members,
  lunchShared = true,
  dinnerShared = true,
  maxRatio = MAX_MEMBER_PORTION_RATIO,
  proteinFloorRatio = PROTEIN_FLOOR_RATIO,
}) {
  if (!Array.isArray(members) || members.length === 0) {
    return { perMember: [], couplingRelaxed: false, proteinRelaxedFor: [] }
  }

  // Grille des masters : chaque master représente le PLANCHER commun aux
  // portions des membres sur un plat partagé. Chaque membre choisit ensuite
  // sa portion dans [master, master*maxRatio]. Le rapport entre deux membres
  // est ainsi mécaniquement borné par maxRatio (le plus petit vaut master,
  // le plus grand au plus master*maxRatio → ratio ≤ maxRatio).
  //
  // Ancienne erreur (corrigée) : borner avec [master/maxRatio, master*maxRatio]
  // laisse un ratio effectif de maxRatio² entre les extrêmes.
  const masterGrid = steps(0.5, 2, 0.1)

  const memberEnvelopes = members.map((member) => {
    const rules = member.rules || {}
    const minScale = Number(rules.minMealServings) || 0.5
    const maxScale = Math.min(2, Number(rules.hardMaxMealServings) || 2)
    return { minScale, maxScale }
  })

  const rangeAround = (master, envelope) => {
    if (master == null) return { min: null, max: null }
    // Fenêtre [master, master*ratio] intersectée avec l'enveloppe du membre.
    // Peut être vide si l'enveloppe est très étroite ; la passe considérée
    // échoue alors pour ce master et le solveur essaie le suivant.
    return {
      min: Math.max(envelope.minScale, master - 1e-9),
      max: Math.min(envelope.maxScale, master * maxRatio + 1e-9),
    }
  }

  const solveMemberIn = (member, envelope, lunchRange, dinnerRange, requireProteinFloor) => optimizeDailyPortions({
    target: member.target,
    breakfast: member.breakfast,
    snack: member.snack,
    lunch: member.lunch,
    dinner: member.dinner,
    lunchCompanion: member.lunchCompanion,
    dinnerCompanion: member.dinnerCompanion,
    rules: member.rules,
    minLunchScale: lunchRange.min,
    maxLunchScale: lunchRange.max,
    minDinnerScale: dinnerRange.min,
    maxDinnerScale: dinnerRange.max,
    requireProteinFloor,
    proteinFloorRatio,
  })

  const searchWithCoupling = (requireProteinFloor) => {
    const lunchMasters = lunchShared ? masterGrid : [null]
    const dinnerMasters = dinnerShared ? masterGrid : [null]
    let best = null

    for (const masterLunch of lunchMasters) {
      for (const masterDinner of dinnerMasters) {
        const perMember = []
        let totalScore = 0
        let feasible = true
        for (let i = 0; i < members.length; i++) {
          const lunchRange = rangeAround(masterLunch, memberEnvelopes[i])
          const dinnerRange = rangeAround(masterDinner, memberEnvelopes[i])
          const res = solveMemberIn(members[i], memberEnvelopes[i], lunchRange, dinnerRange, requireProteinFloor)
          if (!res.feasible) { feasible = false; break }
          perMember.push(res)
          totalScore += res.score
        }
        if (!feasible) continue
        if (!best || totalScore < best.totalScore) best = { totalScore, perMember, masterLunch, masterDinner }
      }
    }
    return best
  }

  // Passe 1 : couplage strict + protéines dures.
  const strict = searchWithCoupling(true)
  if (strict) return { perMember: strict.perMember, couplingRelaxed: false, proteinRelaxedFor: [] }

  // Passe 2 : couplage strict + protéines relâchées (corpus trop peu protéiné
  // pour la cible). Chaque membre dont le plancher n'a pas été tenu est
  // identifié pour propagation dans `daily.protein_gate_relaxed`.
  const relaxProtein = searchWithCoupling(false)
  if (relaxProtein) {
    const proteinRelaxedFor = []
    for (let i = 0; i < members.length; i++) {
      if (relaxProtein.perMember[i]?.proteinGateRelaxed) proteinRelaxedFor.push(members[i].name)
    }
    return { perMember: relaxProtein.perMember, couplingRelaxed: false, proteinRelaxedFor }
  }

  // Passe 3 : couplage désactivé. Chaque membre optimise dans son enveloppe
  // complète. C'est bien un état DÉGRADÉ — les portions d'un même plat
  // peuvent diverger — signalé par `portion_coupling_relaxed`.
  const perMember = members.map((member, i) => {
    const envelope = memberEnvelopes[i]
    const emptyRange = { min: envelope.minScale, max: envelope.maxScale }
    // On tente d'abord protéines dures, puis relaxed si nécessaire.
    const strictRes = solveMemberIn(member, envelope, emptyRange, emptyRange, true)
    return strictRes.feasible ? strictRes : solveMemberIn(member, envelope, emptyRange, emptyRange, false)
  })
  const proteinRelaxedFor = []
  for (let i = 0; i < members.length; i++) {
    if (perMember[i]?.proteinGateRelaxed) proteinRelaxedFor.push(members[i].name)
  }
  return { perMember, couplingRelaxed: true, proteinRelaxedFor }
}

function canonicalMeal({
  slot, member, recipe, multiplier, plate, companionMultiplier, target, variantKind,
  sameLineage = true, outOfLineage = null,
}) {
  const companions = scalePlateComponents(plate, companionMultiplier || 0)
  const nutrition = addNutrition(
    scaleNutrition(recipe.nutritionPerServing, multiplier),
    plateComponentsNutrition(companions),
  )
  const companionLabel = companions.length
    ? ` + ${companions.map((item) => item.label.toLowerCase()).join(' + ')}`
    : ''
  return {
    slot_key: slot.key,
    person_name: member.name,
    household_member_id: member.id || null,
    meal_date: slot.date,
    meal_type: slot.mealType,
    day_type: 'standard',
    short_label: recipe.family,
    description: `${recipe.family}${companionLabel} · ${String(round(multiplier, 2)).replace('.', ',')} portion`,
    kcal: nutrition.kcal,
    protein_g: nutrition.proteinG,
    carbs_g: nutrition.carbsG,
    fat_g: nutrition.fatG,
    fiber_g: nutrition.fiberG,
    micronutrients: scaleMicronutrients(recipe.nutritionPerServing?.micros, multiplier),
    planned_servings: round(multiplier, 3),
    canonical_recipe_code: recipe.code,
    variant_kind: variantKind,
    portion_details: {
      multiplier: round(multiplier, 3),
      main_servings: round(multiplier, 3),
      companion_multiplier: round(companionMultiplier || 0, 3),
      companions,
      plate_complete: plate?.completeAfter !== false,
      calculated_for: member.name,
      // Traçabilité de la substitution : quand un membre ne mange pas le plat
      // du foyer, on documente si son remplaçant est une variante de la MÊME
      // LIGNÉE (le même plat en deux versions — cas idéal) ou un plat
      // entièrement différent (fallback, à signaler). Le champ est présent
      // uniquement sur les repas issus d'une substitution — l'absence indique
      // le repas base du foyer, qui n'a rien à documenter.
      ...(variantKind && variantKind !== 'household_base'
        ? {
          same_lineage: sameLineage,
          ...(outOfLineage ? { substitution_fallback: outOfLineage } : {}),
        }
        : {}),
    },
    target_snapshot: target,
  }
}

function supportMeal({ support, member, date, mealType, target, fruit }) {
  return {
    slot_key: `${date}-${mealType}`,
    person_name: member.name,
    household_member_id: member.id || null,
    meal_date: date,
    meal_type: mealType,
    day_type: 'standard',
    short_label: support.shortLabel,
    description: support.description || describeItems(support.items, fruit),
    kcal: support.nutrition.kcal,
    protein_g: support.nutrition.proteinG,
    carbs_g: support.nutrition.carbsG,
    fat_g: support.nutrition.fatG,
    fiber_g: support.nutrition.fiberG,
    micronutrients: {},
    planned_servings: support.scale || 1,
    canonical_recipe_code: null,
    variant_kind: mealType === 'pdj' ? 'fixed_breakfast' : 'fixed_snack',
    portion_details: {
      scale: support.scale || 1,
      items: support.items,
      // Geste de préparation à programmer (§13, « préparation maison »).
      ...(support.homemade ? { homemade: support.homemade } : {}),
      // Portion de plat cuisiné servie telle quelle (§13, « reste compatible »).
      // C'est cette trace que le modèle à demandes finales convertit en
      // réservation de portions et en tâche de réchauffage.
      ...(support.leftover ? {
        leftover: {
          cooked_dish_id: support.leftover.cookedDishId,
          name: support.leftover.name,
          canonical_recipe_code: support.leftover.recipeCode,
          portions: support.leftover.portions,
          expires_on: support.leftover.expiresOn,
        },
      } : {}),
    },
    target_snapshot: target,
  }
}

/** Construit les 49 prises attendues et une variante végétarienne traçable. */
export function buildPersonalizedMeals({
  plan, recipes, members, goals = [], constraints = {}, preservedMeals = [],
  cookedDishes = [], existingDishReservations = [],
}) {
  const recipeByCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const memberList = members?.length ? members : [{ name: 'Foyer', portion_multiplier: 1 }]
  const dates = [...new Set(plan.slots.map((slot) => slot.date))].sort()
  const usedCodes = new Set(plan.slots.map((slot) => slot.recipeCode))
  const assignmentByMemberAndSlot = new Map()
  // Trace des swaps hors-lignée : la clé porte le membre et le créneau, la
  // valeur documente le repli — on privilégie toujours une variante de la
  // même lignée, mais quand le corpus n'en fournit pas, on veut le SIGNALER
  // plutôt que faire passer un plat entièrement différent pour équivalent.
  const outOfLineageSwaps = new Map()
  const preservedFor = (member, date, mealType) => preservedMeals.find((meal) => (
    meal.meal_date === date
    && meal.meal_type === mealType
    && (member.id && meal.household_member_id
      ? String(meal.household_member_id) === String(member.id)
      : fold(meal.person_name) === fold(member.name))
  )) || null

  for (const member of memberList) {
    const rules = getMemberPlanningRules(member)
    const meatSlots = plan.slots.filter((slot) => classifyRecipe(recipeByCode.get(slot.recipeCode)).meat)
    for (let index = 0; index < Math.min(rules.vegetarianMeatSwaps, meatSlots.length); index++) {
      const slot = meatSlots[index]
      const base = recipeByCode.get(slot.recipeCode)
      const alternative = chooseVegetarianAlternative(base, recipes, usedCodes, constraints)
      if (alternative) {
        assignmentByMemberAndSlot.set(`${member.name}|${slot.key}`, alternative.recipe.code)
        usedCodes.add(alternative.recipe.code)
        if (!alternative.sameLineage) {
          outOfLineageSwaps.set(`${member.name}|${slot.key}`, {
            reason: 'vegetarian_swap',
            baseCode: base.code,
            baseFamily: base.family,
            altCode: alternative.recipe.code,
            altFamily: alternative.recipe.family,
          })
        }
      }
    }
  }

  const meals = []
  const daily = []
  const rotationOffset = supportRotationOffset(dates[0])
  // Portions de plats cuisinés qu'aucun créneau principal ne réclame : la
  // famille « reste compatible » (§13) y puise, une portion à la fois. Le pool
  // se décrémente au fil des jours et des membres — c'est le registre des
  // portions déjà promises.
  const leftoverPool = buildSupportLeftoverPool({ plan, recipes, cookedDishes, existingDishReservations })
  for (const [dayIndex, date] of dates.entries()) {
    const lunchSlot = plan.slots.find((slot) => slot.date === date && slot.mealType === 'dejeuner')
    const dinnerSlot = plan.slots.find((slot) => slot.date === date && slot.mealType === 'diner')
    if (!lunchSlot || !dinnerSlot) continue

    // Phase 1 — collecte des contextes de chaque membre pour la journée.
    // Rien n'est encore émis : le solveur joint a besoin de connaître les
    // recettes retenues, l'assiette et les supports de tous les membres.
    const memberContexts = memberList.map((member) => {
      const rules = getMemberPlanningRules(member)
      const target = targetFor(member, goals)
      const fruit = FRUITS[dayIndex % FRUITS.length]
      const preservedLunch = preservedFor(member, date, 'dejeuner')
      const preservedDinner = preservedFor(member, date, 'diner')
      const preservedBreakfast = preservedFor(member, date, 'pdj')
      const preservedSnack = preservedFor(member, date, 'collation')
      const preservedBreakfastSafe = !preservedBreakfast || (preservedBreakfast.portion_details?.items || []).every((item) => supportItemAllowed(item, constraints))
      const preservedSnackSafe = !preservedSnack || (preservedSnack.portion_details?.items || []).every((item) => supportItemAllowed(item, constraints))
      let lunchCode = preservedLunch?.canonical_recipe_code
        || assignmentByMemberAndSlot.get(`${member.name}|${lunchSlot.key}`) || lunchSlot.recipeCode
      let dinnerCode = preservedDinner?.canonical_recipe_code
        || assignmentByMemberAndSlot.get(`${member.name}|${dinnerSlot.key}`) || dinnerSlot.recipeCode
      let lunchRecipe = recipeByCode.get(lunchCode)
      let dinnerRecipe = recipeByCode.get(dinnerCode)
      if (!lunchRecipe || !dinnerRecipe) throw new Error(`Recette personnalisée indisponible pour ${member.name} le ${date}`)
      if (!preservedLunch && !recipeAllowed(lunchRecipe, constraints)) {
        const alternative = chooseSafeAlternative(lunchRecipe, recipes, usedCodes, constraints)
        if (alternative) {
          const baseCode = lunchRecipe.code
          const baseFamily = lunchRecipe.family
          lunchRecipe = alternative.recipe
          lunchCode = alternative.recipe.code
          usedCodes.add(alternative.recipe.code)
          if (!alternative.sameLineage) {
            outOfLineageSwaps.set(`${member.name}|${lunchSlot.key}`, {
              reason: 'constraint_substitution',
              baseCode,
              baseFamily,
              altCode: alternative.recipe.code,
              altFamily: alternative.recipe.family,
            })
          }
        }
      }
      if (!preservedDinner && !recipeAllowed(dinnerRecipe, constraints)) {
        const alternative = chooseSafeAlternative(dinnerRecipe, recipes, usedCodes, constraints)
        if (alternative) {
          const baseCode = dinnerRecipe.code
          const baseFamily = dinnerRecipe.family
          dinnerRecipe = alternative.recipe
          dinnerCode = alternative.recipe.code
          usedCodes.add(alternative.recipe.code)
          if (!alternative.sameLineage) {
            outOfLineageSwaps.set(`${member.name}|${dinnerSlot.key}`, {
              reason: 'constraint_substitution',
              baseCode,
              baseFamily,
              altCode: alternative.recipe.code,
              altFamily: alternative.recipe.family,
            })
          }
        }
      }
      const recipesSafe = recipeAllowed(lunchRecipe, constraints) && recipeAllowed(dinnerRecipe, constraints)
      // Contraintes d'assiette par-membre : les flags `attachDessert` viennent
      // du réglage personnel (§dessert). Le budget calorique restant n'est pas
      // connu avant le solveur (phase 2) — `undefined` déclenche le plafond de
      // secours (250 kcal → fruit) dans `buildDessertComponent`. Le solveur
      // intègre ensuite la nutrition du dessert via `lunchCompanion.nutrition`.
      const lunchPlate = buildMealPlate(lunchRecipe, {
        ...constraints,
        attachDessert: rules.dessertAfterLunch,
        dessertPool: constraints.dessertPool || [],
        dayIndex,
      })
      const dinnerPlate = buildMealPlate(dinnerRecipe, {
        ...constraints,
        attachDessert: rules.dessertAfterDinner,
        dessertPool: constraints.dessertPool || [],
        dayIndex,
      })
      const platesSafe = (preservedLunch?.planning_status === 'consumed' || lunchPlate.completeAfter)
        && (preservedDinner?.planning_status === 'consumed' || dinnerPlate.completeAfter)
      const rotationIndex = dayIndex + rotationOffset
      const breakfastLeftover = rules.breakfast && !preservedBreakfast
        ? claimSupportLeftover(leftoverPool, {
          mealType: 'pdj', date, constraints, targetKcal: target.kcal * SUPPORT_ENERGY_SHARE.pdj,
        })
        : null
      const breakfastBase = breakfastLeftover ? leftoverSupport(breakfastLeftover, 'pdj') : (rules.breakfast ? (
        safeSupportTemplates([breakfastTemplate(rotationIndex)], constraints)[0]
        || safeSupportTemplates(
          Array.from({ length: BREAKFAST_ROTATION.length }, (_, offset) => breakfastTemplate(rotationIndex + offset + 1)),
          constraints,
        )[0]
        || null
      ) : null)
      const snackLeftover = rules.snack && !preservedSnack
        ? claimSupportLeftover(leftoverPool, {
          mealType: 'collation', date, constraints, targetKcal: target.kcal * SUPPORT_ENERGY_SHARE.collation,
        })
        : null
      const snackBase = snackLeftover ? leftoverSupport(snackLeftover, 'collation') : (rules.snack
        ? (safeSupportTemplates(snackTemplates(rotationIndex, target, breakfastBase?.family || null), constraints)[0] || null)
        : null)
      const withNutrition = (base) => (base
        ? { ...base, nutrition: base.leftover ? base.nutrition : supportNutrition(base.items) }
        : null)
      const breakfast = withNutrition(breakfastBase)
      const snack = withNutrition(snackBase)
      // Classification en trois axes : le membre a-t-il le plat du foyer
      // (`household_base`), une variante du même plat (`*_lineage`, cas idéal),
      // ou un plat entièrement différent (fallback historique, désormais
      // signalé) ? Les suffixes explicites rendent visible en base ce qui,
      // aujourd'hui, n'était différencié nulle part.
      const householdLunchCode = lunchSlot.recipeCode
      const householdDinnerCode = dinnerSlot.recipeCode
      const swapLunch = assignmentByMemberAndSlot.get(`${member.name}|${lunchSlot.key}`)
      const swapDinner = assignmentByMemberAndSlot.get(`${member.name}|${dinnerSlot.key}`)
      const lunchOutOfLineage = outOfLineageSwaps.get(`${member.name}|${lunchSlot.key}`)
      const dinnerOutOfLineage = outOfLineageSwaps.get(`${member.name}|${dinnerSlot.key}`)
      const householdLunchLineage = recipeLineage(recipeByCode.get(householdLunchCode))
      const householdDinnerLineage = recipeLineage(recipeByCode.get(householdDinnerCode))

      let lunchVariant, lunchSameLineage
      if (lunchCode === householdLunchCode) {
        lunchVariant = 'household_base'
        lunchSameLineage = true
      } else {
        const baseKind = swapLunch === lunchCode ? 'vegetarian_swap' : 'constraint_substitution'
        // Une variante hérite de la lignée de sa base ; deux variantes d'un
        // même plat ont donc la MÊME lignée. Un `lunchOutOfLineage` posé plus
        // haut par le sélecteur reste la source de vérité — il documente
        // précisément le repli, y compris quand la comparaison de lignée est
        // ambiguë (données de test, corpus incomplet).
        lunchSameLineage = !lunchOutOfLineage
          && recipeLineage(lunchRecipe) === householdLunchLineage
        lunchVariant = lunchSameLineage ? `${baseKind}_lineage` : baseKind
      }

      let dinnerVariant, dinnerSameLineage
      if (dinnerCode === householdDinnerCode) {
        dinnerVariant = 'household_base'
        dinnerSameLineage = true
      } else {
        const baseKind = swapDinner === dinnerCode ? 'vegetarian_swap' : 'constraint_substitution'
        dinnerSameLineage = !dinnerOutOfLineage
          && recipeLineage(dinnerRecipe) === householdDinnerLineage
        dinnerVariant = dinnerSameLineage ? `${baseKind}_lineage` : baseKind
      }

      return {
        member, rules, target, fruit,
        preservedLunch, preservedDinner, preservedBreakfast, preservedSnack,
        preservedBreakfastSafe, preservedSnackSafe,
        lunchCode, dinnerCode, lunchRecipe, dinnerRecipe,
        lunchPlate, dinnerPlate,
        recipesSafe, platesSafe,
        breakfast, snack, breakfastBase, snackBase,
        lunchVariant, dinnerVariant,
        lunchSameLineage, dinnerSameLineage,
        lunchOutOfLineage, dinnerOutOfLineage,
      }
    })

    // Phase 2 — solveur joint. Le couplage n'a de sens QUE si les membres
    // partagent le même plat (même recette de base, aucun swap végétarien /
    // substitution). Deux membres avec des recettes différentes restent
    // optimisés indépendamment (le solveur joint le détecte via `Shared`).
    const lunchShared = memberContexts.every((ctx) => ctx.lunchRecipe.code === memberContexts[0].lunchRecipe.code)
    const dinnerShared = memberContexts.every((ctx) => ctx.dinnerRecipe.code === memberContexts[0].dinnerRecipe.code)

    const solverMembers = memberContexts.map((ctx) => ({
      name: ctx.member.name,
      target: ctx.target,
      breakfast: ctx.breakfast,
      snack: ctx.snack,
      lunch: ctx.lunchRecipe.nutritionPerServing,
      dinner: ctx.dinnerRecipe.nutritionPerServing,
      lunchCompanion: ctx.lunchPlate.components.length ? { nutrition: ctx.lunchPlate.nutritionPerServing } : null,
      dinnerCompanion: ctx.dinnerPlate.components.length ? { nutrition: ctx.dinnerPlate.nutritionPerServing } : null,
      rules: {
        ...ctx.rules,
        lunchMassPerServing: (ctx.lunchRecipe.exactIngredients || []).reduce((sum, item) => sum + (Number(item.grams) || 0), 0) / Math.max(Number(ctx.lunchRecipe.servings) || 1, 1),
        dinnerMassPerServing: (ctx.dinnerRecipe.exactIngredients || []).reduce((sum, item) => sum + (Number(item.grams) || 0), 0) / Math.max(Number(ctx.dinnerRecipe.servings) || 1, 1),
        lunchCompanionMassPerServing: ctx.lunchPlate.massPerServing,
        dinnerCompanionMassPerServing: ctx.dinnerPlate.massPerServing,
        fixedLunchScale: ctx.preservedLunch?.planned_servings,
        fixedDinnerScale: ctx.preservedDinner?.planned_servings,
        historicalLunch: ctx.preservedLunch?.planning_status === 'consumed',
        historicalDinner: ctx.preservedDinner?.planning_status === 'consumed',
      },
    }))
    const jointResult = optimizeCoupledDailyPortions({
      members: solverMembers,
      lunchShared,
      dinnerShared,
    })
    const optimizedByMember = new Map(memberContexts.map((ctx, i) => [ctx.member.name, jointResult.perMember[i]]))
    const proteinRelaxedSet = new Set(jointResult.proteinRelaxedFor || [])

    // Ratio effectivement observé entre membres sur chaque plat partagé, une
    // fois le solveur passé. Chiffre informatif (persisté sur la journée),
    // utile aux tests et à l'observabilité — le contrôle du bornage est dans
    // le solveur, pas ici.
    const observedRatio = (scales) => {
      if (scales.length < 2) return null
      const positive = scales.filter((scale) => scale > 0)
      if (positive.length < 2) return null
      const max = Math.max(...positive), min = Math.min(...positive)
      return round(max / min, 3)
    }
    const lunchScales = jointResult.perMember.map((res) => Number(res?.lunchScale) || 0)
    const dinnerScales = jointResult.perMember.map((res) => Number(res?.dinnerScale) || 0)
    const lunchRatio = lunchShared ? observedRatio(lunchScales) : null
    const dinnerRatio = dinnerShared ? observedRatio(dinnerScales) : null

    // Phase 3 — émission des repas pour chaque membre avec ses portions.
    for (const ctx of memberContexts) {
      const {
        member, rules, target, fruit,
        preservedLunch, preservedDinner, preservedBreakfast, preservedSnack,
        preservedBreakfastSafe, preservedSnackSafe,
        lunchRecipe, dinnerRecipe,
        lunchPlate, dinnerPlate,
        recipesSafe, platesSafe,
        breakfast, snack, breakfastBase, snackBase,
        lunchVariant, dinnerVariant,
        lunchSameLineage, dinnerSameLineage,
        lunchOutOfLineage, dinnerOutOfLineage,
      } = ctx
      const optimized = optimizedByMember.get(member.name)
      const actualBreakfast = breakfast ? scaledSupport(breakfast, optimized.breakfastScale, fruit) : null
      const actualSnack = snack ? scaledSupport(snack, optimized.snackScale, fruit) : null

      const restore = (existing, fallback) => existing ? {
        ...fallback,
        ...existing,
        slot_key: fallback.slot_key,
        household_member_id: member.id || existing.household_member_id || null,
        person_name: member.name,
        meal_date: date,
        target_snapshot: existing.target_snapshot || target,
        canonical_recipe_code: existing.canonical_recipe_code || fallback.canonical_recipe_code || null,
        variant_kind: existing.variant_kind || fallback.variant_kind || null,
      } : fallback

      if (actualBreakfast || preservedBreakfast) {
        const fallback = actualBreakfast
          ? supportMeal({ support: actualBreakfast, member, date, mealType: 'pdj', target, fruit })
          : { slot_key: `${date}-pdj`, person_name: member.name, household_member_id: member.id || null, meal_date: date, meal_type: 'pdj', planned_servings: 1, canonical_recipe_code: null, variant_kind: 'fixed_breakfast', portion_details: { items: [] }, target_snapshot: target }
        meals.push(restore(preservedBreakfast, fallback))
      }
      meals.push(restore(preservedLunch, canonicalMeal({
        slot: lunchSlot,
        member,
        recipe: lunchRecipe,
        multiplier: optimized.lunchScale,
        plate: lunchPlate,
        companionMultiplier: optimized.lunchCompanionScale,
        target,
        variantKind: lunchVariant,
        sameLineage: lunchSameLineage,
        outOfLineage: lunchOutOfLineage || null,
      })))
      meals.push(restore(preservedDinner, canonicalMeal({
        slot: dinnerSlot,
        member,
        recipe: dinnerRecipe,
        multiplier: optimized.dinnerScale,
        plate: dinnerPlate,
        companionMultiplier: optimized.dinnerCompanionScale,
        target,
        variantKind: dinnerVariant,
        sameLineage: dinnerSameLineage,
        outOfLineage: dinnerOutOfLineage || null,
      })))
      if (actualSnack || preservedSnack) {
        const fallback = actualSnack
          ? supportMeal({ support: actualSnack, member, date, mealType: 'collation', target, fruit })
          : { slot_key: `${date}-collation`, person_name: member.name, household_member_id: member.id || null, meal_date: date, meal_type: 'collation', planned_servings: 1, canonical_recipe_code: null, variant_kind: 'fixed_snack', portion_details: { items: [] }, target_snapshot: target }
        meals.push(restore(preservedSnack, fallback))
      }

      const total = meals
        .filter((meal) => meal.person_name === member.name && meal.meal_date === date)
        .reduce((sum, meal) => addNutrition(sum, {
          kcal: meal.kcal, proteinG: meal.protein_g, carbsG: meal.carbs_g, fatG: meal.fat_g, fiberG: meal.fiber_g,
        }), emptyNutrition())
      const micronutrients = meals
        .filter((meal) => meal.person_name === member.name && meal.meal_date === date)
        .reduce((sum, meal) => {
          for (const [key, value] of Object.entries(meal.micronutrients || {})) sum[key] = round((sum[key] || 0) + (Number(value) || 0), 2)
          return sum
        }, {})
      const recipeMeals = meals.filter((meal) => meal.person_name === member.name && meal.meal_date === date && meal.canonical_recipe_code)
      const energyDeviation = Math.abs(total.kcal - target.kcal) / target.kcal
      const macroDeviations = Object.fromEntries(['proteinG', 'carbsG', 'fatG', 'fiberG']
        .filter((key) => Number.isFinite(Number(target[key])) && Number(target[key]) > 0)
        .map((key) => [key, round((Number(total[key]) - Number(target[key])) / Number(target[key]), 4)]))
      const proteinTarget = Number(target.proteinG)
      const proteinValid = !(proteinTarget > 0) || Number(total.proteinG) >= PROTEIN_FLOOR_RATIO * proteinTarget
      const carbsValid = Math.abs(macroDeviations.carbsG || 0) <= MACRO_LIMITS.carbsG
      const fatValid = Math.abs(macroDeviations.fatG || 0) <= MACRO_LIMITS.fatG
      const fiberValid = (macroDeviations.fiberG || 0) >= MACRO_LIMITS.fiberG
      const lunchSafe = preservedLunch?.planning_status === 'consumed'
        || (optimized.lunchScale >= rules.minMealServings && optimized.lunchScale <= rules.hardMaxMealServings)
      const dinnerSafe = preservedDinner?.planning_status === 'consumed'
        || (optimized.dinnerScale >= rules.minMealServings && optimized.dinnerScale <= rules.hardMaxMealServings)
      const portionSafe = lunchSafe && dinnerSafe
        && optimized.physicalFeasible !== false
      // Substitutions HORS-LIGNÉE de la journée : Zoé qui n'a pas pu recevoir
      // une variante végé de la même lignée et s'est vue proposer un plat
      // entièrement différent — c'est le repli à signaler. Toujours une liste
      // (jamais un booléen) : la couche supérieure peut en afficher le détail
      // sans reconstruire l'information.
      const dailyOutOfLineage = [lunchOutOfLineage, dinnerOutOfLineage].filter(Boolean)

      daily.push({
        person_name: member.name,
        meal_date: date,
        target,
        total,
        energy_deviation: round(energyDeviation, 4),
        valid: energyDeviation <= ENERGY_TOLERANCE,
        target_feasible: optimized.feasible !== false,
        portion_feasible: optimized.feasible !== false,
        portion_safe: portionSafe,
        support_safe: (!rules.breakfast || (Boolean(breakfastBase || preservedBreakfast) && preservedBreakfastSafe))
          && (!rules.snack || (Boolean(snackBase || preservedSnack) && preservedSnackSafe)),
        recipes_safe: recipesSafe,
        plate_safe: platesSafe,
        // Repli signalé : le membre a reçu un plat différent parce qu'aucune
        // variante de la même lignée n'était disponible dans le corpus. Ce
        // n'est pas un bug — c'est un manque du corpus qu'il faut voir pour
        // décider s'il faut écrire la variante manquante.
        substitutions_out_of_lineage: dailyOutOfLineage,
        protein_deviation: macroDeviations.proteinG ?? null,
        protein_valid: proteinValid,
        // Le solveur a signalé le repli explicite du plancher protéique (soit
        // aucune combinaison ne l'atteignait avec l'énergie, soit le couplage
        // avec un autre membre l'a rendu impossible). Toujours propagé — même
        // en présence d'une réussite « bonus » côté total protéique — parce
        // qu'il documente que le solveur a dû relâcher son contrat.
        protein_gate_relaxed: Boolean(optimized.proteinGateRelaxed) || proteinRelaxedSet.has(member.name),
        carbs_valid: carbsValid,
        fat_valid: fatValid,
        fiber_valid: fiberValid,
        macro_valid: proteinValid && carbsValid && fatValid && fiberValid,
        macro_deviations: macroDeviations,
        // Couplage inter-membres sur les plats partagés. `coupling_relaxed`
        // vaut `true` uniquement quand aucun master n'a pu satisfaire les
        // ratios : la journée est signalée pour que la couche supérieure
        // publie un blocker. Sinon `portion_ratio_lunch/dinner` donne le
        // ratio réel observé, ≤ MAX_MEMBER_PORTION_RATIO par construction.
        coupling_relaxed: Boolean(jointResult.couplingRelaxed),
        portion_ratio_lunch: lunchRatio,
        portion_ratio_dinner: dinnerRatio,
        portion_ratio_cap: MAX_MEMBER_PORTION_RATIO,
        micronutrients,
        micronutrient_data_complete: recipeMeals.length > 0 && recipeMeals.every((meal) => Object.keys(meal.micronutrients || {}).length > 0),
      })
    }
  }

  const weeklyMicronutrients = memberList.map((member) => {
    const days = daily.filter((day) => day.person_name === member.name)
    const totals = days.reduce((sum, day) => {
      for (const [key, value] of Object.entries(day.micronutrients || {})) sum[key] = round((sum[key] || 0) + (Number(value) || 0), 2)
      return sum
    }, {})
    const targets = Object.fromEntries(Object.entries(MICRONUTRIENT_DAILY_REFERENCES)
      .map(([key, value]) => [key, value * days.length]))
    const ratios = Object.fromEntries(Object.keys(totals)
      .filter((key) => targets[key] > 0)
      .map((key) => [key, round(totals[key] / targets[key], 4)]))
    return {
      person_name: member.name,
      days: days.length,
      totals,
      targets,
      ratios,
      data_complete: days.length > 0 && days.every((day) => day.micronutrient_data_complete),
    }
  })

  return {
    meals,
    daily,
    recipeCodes: [...new Set(meals.map((meal) => meal.canonical_recipe_code).filter(Boolean))],
    supplementalRequirements: [...meals
      .filter((meal) => ['fixed_breakfast', 'fixed_snack'].includes(meal.variant_kind))
      .flatMap((meal) => meal.portion_details.items || [])
      .reduce((map, item) => {
        const food = FOOD[item.food]
        const label = item.displayLabel || food.label
        const key = `${label}|${food.unit}`
        const current = map.get(key) || {
          label, unit: food.unit, quantity: 0,
          packageSize: food.packageSize || null,
          packageUnit: food.packageUnit || null,
          packageLabel: food.packageLabel || null,
        }
        current.quantity += Number(item.quantity) || 0
        map.set(key, current)
        return map
      }, new Map()).values()].map((item) => ({
        ...item,
        quantity: Math.round(item.quantity),
        packageCount: item.packageSize ? Math.ceil(item.quantity / item.packageSize) : null,
      })),
    weeklyMicronutrients,
    valid: daily.length > 0 && daily.every((item) => item.valid
      && item.portion_feasible !== false
      && item.support_safe !== false
      && item.recipes_safe !== false
      && item.plate_safe !== false),
  }
}
