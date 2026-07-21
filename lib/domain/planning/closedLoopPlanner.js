import { COOKED_DISH_SHELF_LIFE } from '../../shelfLifeRules'
import {
  BATCH_PORTIONING_ACTIVE_MINUTES,
  FREEZE_TASK_MINUTES,
  DEFROST_TASK_MINUTES,
  freezerShelfLifeDays,
  isRecipeFreezable,
  resolveSessionCapMinutes,
  sessionWindowForMealType,
} from './cookingSessions'

const round = (value, digits = 3) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const addDaysIso = (isoDate, count) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const daysBetween = (left, right) => {
  if (!left || !right) return null
  return Math.round((new Date(`${left}T00:00:00Z`) - new Date(`${right}T00:00:00Z`)) / 86400000)
}

function cloneAvailability(availability) {
  return new Map([...availability].map(([form, lots]) => [form, lots.map((lot) => ({ ...lot }))]))
}

export function buildAvailability(lots = [], reservations = []) {
  const reservedByLot = new Map()
  for (const reservation of reservations) {
    if (reservation.status && reservation.status !== 'active') continue
    reservedByLot.set(reservation.lotId, (reservedByLot.get(reservation.lotId) || 0) + Number(reservation.grams || 0))
  }
  const availability = new Map()
  for (const lot of lots) {
    const grams = Math.max(0, Number(lot.gramsAvailable ?? lot.grams_available ?? 0) - (reservedByLot.get(lot.id) || 0))
    if (!lot.formNormalized || grams <= 0) continue
    if (!availability.has(lot.formNormalized)) availability.set(lot.formNormalized, [])
    availability.get(lot.formNormalized).push({
      id: lot.id,
      grams,
      expiresOn: lot.expiresOn ?? lot.expiration_date ?? null,
      opened: Boolean(lot.opened ?? lot.is_opened),
    })
  }
  for (const lotsForForm of availability.values()) {
    lotsForForm.sort(compareLotsFefo)
  }
  return availability
}

/**
 * Ordre d'allocation d'un lot : ouvert d'abord, puis FEFO, puis id croissant
 * même à péremption identique (départage stable — l'ordre des lignes SQL n'est
 * pas garanti). Exporté pour re-trier l'union de plusieurs formes (aliases des
 * suppléments) sans dupliquer la règle.
 */
export function compareLotsFefo(a, b) {
  if (a.opened !== b.opened) return a.opened ? -1 : 1
  if (a.expiresOn && b.expiresOn) {
    return a.expiresOn.localeCompare(b.expiresOn) || String(a.id).localeCompare(String(b.id))
  }
  if (a.expiresOn) return -1
  if (b.expiresOn) return 1
  return String(a.id).localeCompare(String(b.id))
}

/**
 * Ordre de consommation des plats cuisinés (audit P1-5) : FEFO strict —
 * péremption la plus proche d'abord, DLC absente en dernier (plat legacy sans
 * date = le moins urgent), départage par identifiant croissant (numérique
 * quand possible, les id sont des bigint) pour rester déterministe à
 * péremption identique.
 */
export function compareDishesFefo(a, b) {
  const left = a.expiresOn || '9999-12-31'
  const right = b.expiresOn || '9999-12-31'
  if (left !== right) return left.localeCompare(right)
  const idA = Number(a.id)
  const idB = Number(b.id)
  if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB
  return String(a.id).localeCompare(String(b.id))
}

/**
 * Portions réellement allouables par plat cuisiné (audit P1-1/P1-4) :
 * portions restantes moins les réservations actives d'AUTRES versions de plan
 * — l'appelant exclut déjà les réservations de la version remplacée
 * (excludedPlanVersionId), exactement comme pour les lots. Aucune
 * décrémentation : la consommation réelle n'a lieu qu'à la validation du
 * repas. Trie FEFO et écarte les plats sans portion allouable.
 */
export function buildDishAvailability(cookedDishes = [], existingDishReservations = []) {
  const reservedByDish = new Map()
  for (const reservation of existingDishReservations) {
    if (reservation.status && reservation.status !== 'active') continue
    reservedByDish.set(reservation.cookedDishId,
      (reservedByDish.get(reservation.cookedDishId) || 0) + Number(reservation.portions || 0))
  }
  return cookedDishes
    .map((dish) => ({
      id: dish.id,
      name: dish.name,
      portionsAvailable: Math.max(0,
        Number(dish.portionsRemaining ?? dish.portionsAvailable ?? 0) - (reservedByDish.get(dish.id) || 0)),
      expiresOn: dish.expiresOn ?? null,
      recipeCode: dish.recipeCode ?? null,
      nutritionPerPortion: dish.nutritionPerPortion ?? null,
    }))
    .filter((dish) => dish.portionsAvailable > 0)
    .sort(compareDishesFefo)
}

/**
 * Appariement plat cuisiné → recette du catalogue. cooked_dishes ne porte
 * aucun lien vers le catalogue canonique V3 (recipe_id/batch_recipe_id/
 * generated_recipe_id pointent vers des tables legacy) : on accepte donc un
 * `recipeCode` explicite s'il est fourni (préparé pour l'avenir, jamais de
 * repli sur le nom s'il est inconnu), sinon une égalité EXACTE de nom
 * normalisé avec `recipe.family` — aucun rapprochement flou. À familles
 * homonymes, le code le plus petit gagne (déterminisme).
 */
function dishRecipeIndexes(recipes) {
  const byCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const byFamily = new Map()
  for (const recipe of [...recipes].sort((a, b) => String(a.code).localeCompare(String(b.code)))) {
    const key = fold(recipe.family)
    if (key && !byFamily.has(key)) byFamily.set(key, recipe)
  }
  return { byCode, byFamily }
}

function matchDishRecipe(dish, indexes) {
  if (dish.recipeCode) return indexes.byCode.get(dish.recipeCode) || null
  return indexes.byFamily.get(fold(dish.name)) || null
}

/**
 * Premier plat cuisiné consommable pour ce créneau, en ordre FEFO (audit §10
 * étape 3 : la consommation directe d'un reste passe AVANT toute cuisson
 * fraîche). Règles conservatrices :
 * - le plat doit couvrir ENTIÈREMENT les portions du créneau (jamais de
 *   complément partiel en P1 — un plat de 4 portions ne nourrit pas un
 *   créneau de 6) ;
 * - il doit être encore valide à la date du créneau (comparaison UTC,
 *   DLC absente = valide) ;
 * - sa recette appariée respecte les contraintes dures du foyer, SANS la
 *   limite de temps (réchauffer n'est pas cuisiner) ;
 * - un créneau figé n'est nourri que si la recette appariée est exactement
 *   la recette figée ; une recette exclue du créneau exclut aussi le plat.
 */
function pickDishCandidate(state, slot, dishPool, indexes, constraints) {
  const mealType = slot.mealType ?? slot.meal_type
  for (const dish of dishPool) {
    const recipe = matchDishRecipe(dish, indexes)
    if (!recipe) continue
    if (slot.fixedRecipeCode && recipe.code !== slot.fixedRecipeCode) continue
    if ((slot.excludedRecipeCodes || []).includes(recipe.code)) continue
    if (dish.expiresOn && slot.date && dish.expiresOn < slot.date) continue
    const remaining = dish.portionsAvailable - (state.dishPortionsUsed.get(dish.id) || 0)
    if (remaining + 1e-9 < Number(recipe.servings)) continue
    if (violatesHardConstraints(recipe, {
      ...constraints, currentMealType: mealType, maxMinutesByMeal: undefined, maxTotalMinutes: undefined,
    })) continue
    return { dish, recipe }
  }
  return null
}

/**
 * État après consommation d'un plat cuisiné sur un créneau : aucun lot
 * alloué (la nourriture existe déjà), couverture stock totale, portions du
 * plat suivies dans le plan (deux créneaux peuvent partager un plat de six
 * portions sans jamais dépasser le restant). Le créneau est EXCLU de la
 * pénalité de répétition et des transitions sensorielles : manger un reste
 * n'est pas recuisiner. La nutrition vient du plat si mémorisée, sinon de la
 * recette appariée.
 */
function consumeDishState(state, slot, { dish, recipe }, constraints) {
  const mealType = slot.mealType ?? slot.meal_type
  const nutrition = dish.nutritionPerPortion || recipe.nutritionPerServing
  const penalty = nutritionPenalty(nutrition, constraints.targetByMeal?.[mealType] || constraints.targetPerMeal)
  const days = daysBetween(dish.expiresOn, slot.date)
  const urgencyBonus = days == null ? 0 : Math.max(0, 12 - Math.max(days, 0))
  // Le score ne départage que les états du faisceau entre eux (le plat est
  // imposé par la pré-passe) : couverture totale + urgence anti-gaspillage.
  const score = 48 + urgencyBonus - penalty
  const dishPortionsUsed = new Map(state.dishPortionsUsed)
  dishPortionsUsed.set(dish.id, (dishPortionsUsed.get(dish.id) || 0) + Number(recipe.servings))
  return {
    score: state.score + score,
    availability: state.availability,
    recipes: state.recipes,
    weeklySummary: addToWeekSummary(state.weeklySummary, classifyRecipe(recipe)),
    usedCodes: state.usedCodes,
    dishPortionsUsed,
    productionCovers: state.productionCovers,
    productionsUsed: state.productionsUsed,
    sessionMinutes: state.sessionMinutes,
    slots: [...state.slots, {
      ...slot,
      recipeCode: recipe.code,
      title: recipe.family,
      servings: recipe.servings,
      nutrition,
      sensory: recipe.sensory,
      allocations: [],
      shortages: [],
      stockCoverage: 1,
      score: round(score, 2),
      explanations: [],
      source: 'cooked_dish',
      cookedDishId: dish.id,
      cookedDishName: dish.name,
      dishPortions: Number(recipe.servings),
      dishNutritionPerPortion: dish.nutritionPerPortion || null,
    }],
  }
}

/**
 * Fenêtre de conservation d'une production planifiée (audit P2 item 4, F13).
 * Source de la durée, dans l'ordre :
 * 1. le profil de conservation déclaré par la recette (`recipe.shelfLifeDays`)
 *    quand le catalogue V3 le publiera (audit §9.3 — pas encore exposé) ;
 * 2. sinon la MÊME règle déterministe que la matérialisation réelle des plats
 *    cuisinés : COOKED_DISH_SHELF_LIFE.fridge = 3 jours (72 h) au
 *    réfrigérateur, définie dans lib/shelfLifeRules.js et appliquée par
 *    /api/meals/cook à la validation — la prévision (`use_by`) coïncide donc
 *    avec la DLC que portera le plat matérialisé.
 * Jamais d'appel IA, jamais de regex sur le nom du plat.
 */
function productionShelfLifeDays(recipe) {
  const declared = Number(recipe.shelfLifeDays)
  return Number.isFinite(declared) && declared > 0 ? Math.floor(declared) : COOKED_DISH_SHELF_LIFE.fridge
}

// Réchauffer coûte ~10 min actives (aligné sur REHEAT_TASK_MINUTES du
// payload) : le bonus de mutualisation d'une production est le temps actif
// économisé par créneau consommateur — (prep − réchauffage) × 0.8 — explicite
// et déterministe. Nul ou négatif → la stratégie n'est jamais générée.
const REHEAT_ACTIVE_MINUTES = 10
const MUTUALISATION_WEIGHT = 0.8
// Bornes conservatrices (audit P2, pas de sur-ingénierie) : une production
// couvre au plus 3 créneaux consommateurs en plus du producteur, et un plan
// contient au plus 2 productions — deux sessions de batch par semaine. La
// planification conjointe des sessions (capacité temporelle de l'utilisateur,
// congélation) relève du lot P3 ; sans cette borne, un garde-manger vide
// pousse le faisceau vers des semaines à 4 recettes, au détriment des règles
// de diversité hebdomadaires.
const MAX_PRODUCTION_CONSUMERS = 3
const MAX_PLAN_PRODUCTIONS = 2
// Score d'un créneau consommateur : l'équivalent du stockReward de couverture
// totale (28, même barème que les recettes hors intent stock) moins l'écart
// nutritionnel. Pas de bonus d'urgence (la production n'existe pas encore),
// pas de pénalité de répétition : l'arbitrage batch/frais est payé une seule
// fois, au producteur, via le bonus de mutualisation.
const PRODUCTION_CONSUMPTION_BASE_SCORE = 28

/**
 * Prélève `requestedGrams` sur des lots déjà triés par `buildAvailability`
 * (ouverts d'abord, puis péremption la plus proche, puis id croissant).
 * Mutation en place : les grammes pris sont retirés des lots. Déterministe,
 * ne prélève jamais plus que la disponibilité d'un lot.
 */
export function allocateFromLots(lots, requestedGrams, neededOn = null) {
  const requested = Number(requestedGrams) || 0
  const allocations = []
  let remaining = requested
  for (const lot of lots || []) {
    if (remaining <= 0) break
    // Une DLC est une borne d'utilisation, pas seulement un critère de tri :
    // un lot encore valide aujourd'hui ne peut jamais couvrir un repas servi
    // après sa date limite.
    if (neededOn && lot.expiresOn && String(lot.expiresOn).slice(0, 10) < String(neededOn).slice(0, 10)) continue
    const take = Math.min(lot.grams, remaining)
    if (take <= 0) continue
    lot.grams -= take
    remaining -= take
    allocations.push({ lotId: lot.id, grams: take, expiresOn: lot.expiresOn ?? null, opened: Boolean(lot.opened) })
  }
  return { allocations, allocatedGrams: requested - remaining, shortageGrams: remaining }
}

function allocateRecipe(recipe, availability, slotDate, scale = 1) {
  const next = cloneAvailability(availability)
  const allocations = []
  const shortages = []
  let requiredGrams = 0
  let stockGrams = 0
  let urgencyCredit = 0

  for (const ingredient of recipe.exactIngredients || []) {
    if (ingredient.optional) continue
    // `scale` > 1 : créneau producteur d'une production multi-portions — les
    // ingrédients sont réservés UNE fois, à hauteur de N portions (audit P2
    // item 4), les créneaux consommateurs n'allouent rien.
    const needed = (Number(ingredient.grams) || 0) * scale
    requiredGrams += needed
    const { allocations: taken, shortageGrams } = allocateFromLots(next.get(ingredient.formNormalized) || [], needed, slotDate)
    for (const entry of taken) {
      stockGrams += entry.grams
      const days = daysBetween(entry.expiresOn, slotDate)
      if (days != null && days <= 3) urgencyCredit += entry.grams * (4 - Math.max(days, 0))
      allocations.push({ lotId: entry.lotId, formNormalized: ingredient.formNormalized, ingredientName: ingredient.name, grams: round(entry.grams) })
    }
    if (shortageGrams > 0.001) shortages.push({ formNormalized: ingredient.formNormalized, ingredientName: ingredient.name, grams: round(shortageGrams) })
  }
  return {
    availability: next,
    allocations,
    shortages,
    requiredGrams,
    stockGrams,
    coverage: requiredGrams > 0 ? stockGrams / requiredGrams : 1,
    urgencyCredit,
  }
}

export function sensoryTransitionPenalty(previous, candidate, recent = []) {
  if (!previous) return { total: 0, reasons: [] }
  const reasons = []
  let total = 0
  if (previous.sensory?.profile && previous.sensory.profile === candidate.sensory?.profile) {
    total += 18
    reasons.push('sensory_profile_repeated')
  }
  const previousTechnique = previous.techniques?.[0]
  if (previousTechnique && previousTechnique === candidate.techniques?.[0]) {
    total += 10
    reasons.push('primary_technique_repeated')
  }
  const recentTextures = [...recent.slice(-2), candidate]
  if (recentTextures.length === 3 && recentTextures.every((recipe) =>
    (recipe.sensory?.target_textures || recipe.sensory?.targetTextures || [])
      .some((texture) => /fondant|moelleux|cremeux|onctueux|puree|molle/.test(fold(texture))))) {
    total += 14
    reasons.push('three_soft_textures')
  }
  const previousRichness = Number(previous.sensory?.scores?.richness) || 0
  const candidateAcidity = Number(candidate.sensory?.scores?.acidic) || 0
  const candidateFreshness = Number(candidate.sensory?.scores?.freshness) || 0
  if (previousRichness >= 4 && candidateAcidity < 2 && candidateFreshness < 3) {
    total += 12
    reasons.push('rich_meal_without_fresh_counterpoint')
  }
  return { total, reasons }
}

function nutritionPenalty(nutrition, target = {}) {
  const dimensions = [['kcal', 0.45], ['proteinG', 0.3], ['fiberG', 0.15], ['carbsG', 0.05], ['fatG', 0.05]]
  let total = 0
  let weights = 0
  for (const [key, weight] of dimensions) {
    const expected = Number(target[key])
    const actual = Number(nutrition?.[key])
    if (!Number.isFinite(expected) || expected <= 0 || !Number.isFinite(actual)) continue
    total += Math.min(Math.abs(actual - expected) / expected, 2) * weight
    weights += weight
  }
  return weights ? (total / weights) * 35 : 0
}

const ANIMAL_MEAT = /\b(boeuf|veau|agneau|mouton|porc|poulet|dinde|canard|jambon|lardon|saucisse|merguez|viande)\b/
const FISH = /\b(saumon|cabillaud|morue|thon|sardine|maquereau|poisson|lieu|colin)\b/
const RED_MEAT = /\b(boeuf|veau|agneau|mouton)\b/
const FATTY_FISH = /\b(saumon|sardine|maquereau|hareng)\b/
const classificationCache = new WeakMap()

export function classifyRecipe(recipe) {
  const cached = classificationCache.get(recipe)
  if (cached) return cached
  const categories = new Set((recipe.exactIngredients || []).map((ingredient) => fold(ingredient.category)).filter(Boolean))
  const ingredientText = (recipe.exactIngredients || []).map((ingredient) => fold(`${ingredient.name} ${ingredient.formNormalized}`)).join(' ')
  const fish = categories.has('poissons fruits de mer') || FISH.test(ingredientText)
  const meat = !fish && (categories.has('viandes') || categories.has('volailles') || ANIMAL_MEAT.test(ingredientText))
  const legumes = categories.has('legumineuses')
  const eggs = categories.has('oeufs')
  const dairy = categories.has('produits laitiers')
  let mainProtein = 'vegetal'
  const proteinMatchers = [
    ['boeuf', /\bboeuf\b/], ['veau', /\bveau\b/], ['agneau', /\b(agneau|mouton)\b/], ['porc', /\b(porc|jambon|lardon|saucisse)\b/],
    ['poulet', /\b(poulet|volaille)\b/], ['canard', /\bcanard\b/], ['saumon', /\bsaumon\b/], ['cabillaud', /\b(cabillaud|morue)\b/],
    ['poisson', FISH], ['lentilles', /\blentille/], ['pois_chiches', /\bpois chiche/], ['haricots', /\bharicot/], ['oeufs', /\boeuf cru\b|\boeuf mollet\b|\boeufs?\b/],
  ]
  for (const [key, matcher] of proteinMatchers) {
    if (matcher.test(ingredientText)) { mainProtein = key; break }
  }
  if (mainProtein === 'vegetal' && eggs) mainProtein = 'oeufs'
  if (mainProtein === 'vegetal' && dairy) mainProtein = 'laitiers'
  const richness = Number(recipe.sensory?.scores?.richness) || 0
  const kcal = Number(recipe.nutritionPerServing?.kcal) || 0
  const classification = {
    fish,
    meat,
    vegetarian: !fish && !meat,
    redMeat: meat && RED_MEAT.test(ingredientText),
    fattyFish: fish && FATTY_FISH.test(ingredientText),
    legumes,
    mainProtein,
    cuisine: fold(recipe.cuisineOrigin) || 'non renseignee',
    rich: richness >= 4 || kcal >= 650,
    light: richness <= 3 && (!kcal || kcal <= 550),
  }
  classificationCache.set(recipe, classification)
  return classification
}

export function isMealSuitableRecipe(recipe) {
  const category = fold(recipe.category)
  if (/^dess-/.test(fold(recipe.code).replace(/ /g, '-'))) return false
  return !/(dessert|gateau|petit dejeuner|sauce de base|accompagnement|entree|tartinade|pate a choux sale|puree d aubergine)/.test(category)
}

function violatesHardConstraints(recipe, constraints) {
  if (!recipe.eligible) return 'recipe_not_executable'
  const allergies = new Set((constraints.allergens || []).map((value) => String(value).toLowerCase()))
  if ((recipe.allergens || []).some((value) => allergies.has(String(value).toLowerCase()))) return 'allergen'
  const disliked = new Set(constraints.dislikedForms || [])
  if ((recipe.exactIngredients || []).some((ingredient) => disliked.has(ingredient.formNormalized))) return 'disliked_food'
  const forbidden = (constraints.forbiddenForms || []).filter(Boolean)
  if ((recipe.exactIngredients || []).some((ingredient) => forbidden.some((term) =>
    ingredient.formNormalized === term || ingredient.formNormalized.includes(term) || term.includes(ingredient.formNormalized)))) return 'forbidden_food'
  const diets = new Set((constraints.diets || []).map((value) => fold(value)))
  const classification = classifyRecipe(recipe)
  if ([...diets].some((diet) => /vegetar/.test(diet)) && (classification.meat || classification.fish)) return 'vegetarian_diet'
  if ([...diets].some((diet) => /vegan|vegetalien/.test(diet))) {
    const categories = new Set((recipe.exactIngredients || []).map((ingredient) => fold(ingredient.category)))
    if (classification.meat || classification.fish || categories.has('produits laitiers') || categories.has('oeufs')) return 'vegan_diet'
  }
  const maxMinutes = Number(constraints.maxMinutesByMeal?.[constraints.currentMealType] ?? constraints.maxTotalMinutes)
  if (Number.isFinite(maxMinutes) && recipe.prepMinutes + recipe.cookMinutes > maxMinutes) return 'time_limit'
  return null
}

function matchesIntent(recipe, intent) {
  const classification = classifyRecipe(recipe)
  if (intent === 'quick') return recipe.prepMinutes + recipe.cookMinutes <= 50 && recipe.prepMinutes <= 30
  if (intent === 'light') return classification.light
  if (intent === 'vegetarian') return classification.vegetarian
  return true
}

function seasonalBonus(recipe, slotDate) {
  const month = Number(String(slotDate || '').slice(5, 7))
  const seasonal = {
    1: /poireau|chou|carotte|courge|endive/, 2: /poireau|chou|carotte|endive/, 3: /epinard|poireau|carotte/,
    4: /asperge|epinard|radis/, 5: /asperge|fraise|petit pois|epinard/, 6: /courgette|tomate|cerise|concombre|poivron/,
    7: /courgette|tomate|aubergine|cerise|concombre|poivron/, 8: /courgette|tomate|aubergine|peche|poivron/,
    9: /tomate|aubergine|raisin|courge|poivron/, 10: /courge|champignon|pomme|poire/, 11: /courge|chou|poireau|champignon/, 12: /courge|chou|poireau|endive/,
  }[month]
  if (!seasonal) return 0
  const names = (recipe.exactIngredients || []).map((ingredient) => fold(ingredient.name)).join(' ')
  return seasonal.test(names) ? 4 : 0
}

function weeklyTargets(constraints, totalSlots) {
  const vegetarianDiet = (constraints.diets || []).some((diet) => /vegetar|vegan|vegetalien/.test(fold(diet)))
  return vegetarianDiet
    ? { fish: 0, meatMax: 0, vegetarianMin: totalSlots, redMeatMin: 0, fattyFishMin: 0, legumesMin: 2, cuisinesMin: 3, proteinsMin: 4 }
    : { fish: Math.min(2, totalSlots), meatMax: Math.min(4, totalSlots), vegetarianMin: Math.min(8, totalSlots), redMeatMin: totalSlots >= 7 ? 1 : 0, fattyFishMin: totalSlots >= 7 ? 1 : 0, legumesMin: Math.min(2, totalSlots), cuisinesMin: Math.min(3, totalSlots), proteinsMin: Math.min(4, totalSlots) }
}

function emptyWeekSummary() {
  return { fish: 0, meat: 0, vegetarian: 0, redMeat: 0, fattyFish: 0, legumes: 0, cuisines: new Set(), proteins: new Map(), rich: 0, light: 0 }
}

function addToWeekSummary(current, c) {
  const summary = {
    ...current,
    cuisines: new Set(current.cuisines),
    proteins: new Map(current.proteins),
  }
    if (c.fish) summary.fish++
    if (c.meat) summary.meat++
    if (c.vegetarian) summary.vegetarian++
    if (c.redMeat) summary.redMeat++
    if (c.fattyFish) summary.fattyFish++
    if (c.legumes) summary.legumes++
    if (c.rich) summary.rich++
    if (c.light) summary.light++
    summary.cuisines.add(c.cuisine)
    summary.proteins.set(c.mainProtein, (summary.proteins.get(c.mainProtein) || 0) + 1)
  return summary
}

function weeklyDeficits(summary, targets) {
  const deficits = []
  const add = (code, missing) => { if (missing > 0) deficits.push({ code, missing }) }
  add('fish_quota', Math.abs(targets.fish - summary.fish))
  add('meat_max', summary.meat - targets.meatMax)
  add('vegetarian_min', targets.vegetarianMin - summary.vegetarian)
  add('red_meat_min', targets.redMeatMin - summary.redMeat)
  add('fatty_fish_min', targets.fattyFishMin - summary.fattyFish)
  add('legumes_min', targets.legumesMin - summary.legumes)
  add('cuisines_min', targets.cuisinesMin - summary.cuisines.size)
  add('proteins_min', targets.proteinsMin - summary.proteins.size)
  for (const [protein, count] of summary.proteins) {
    if (!['vegetal', 'laitiers', 'oeufs'].includes(protein)) add(`protein_repeat_${protein}`, count - 2)
  }
  return deficits
}

function quotaProgressScore(before, recipe, targets) {
  const candidate = classifyRecipe(recipe)
  let score = 0
  if (candidate.fish && before.fish < targets.fish) score += 18
  if (candidate.vegetarian && before.vegetarian < targets.vegetarianMin) score += 7
  if (candidate.redMeat && before.redMeat < targets.redMeatMin) score += 14
  if (candidate.fattyFish && before.fattyFish < targets.fattyFishMin) score += 12
  if (candidate.legumes && before.legumes < targets.legumesMin) score += 10
  if (!before.cuisines.has(candidate.cuisine) && before.cuisines.size < targets.cuisinesMin) score += 7
  if (!before.proteins.has(candidate.mainProtein) && before.proteins.size < targets.proteinsMin) score += 7
  return score
}

function evaluateCandidate(state, recipe, slot, constraints, targets, scale = 1) {
  if (slot.fixedRecipeCode && recipe.code !== slot.fixedRecipeCode) return null
  if ((slot.excludedRecipeCodes || []).includes(recipe.code)) return null
  const intent = slot.intent || constraints.intent || 'balanced'
  if (!matchesIntent(recipe, intent)) return null
  const mealType = slot.mealType ?? slot.meal_type
  const hardFailure = violatesHardConstraints(recipe, { ...constraints, currentMealType: mealType })
  if (hardFailure) return null

  const classification = classifyRecipe(recipe)
  const week = state.weeklySummary
  if (!slot.fixedRecipeCode && classification.fish && week.fish >= targets.fish) return null
  if (!slot.fixedRecipeCode && classification.meat && week.meat >= targets.meatMax) return null
  if (!slot.fixedRecipeCode && !['vegetal', 'laitiers', 'oeufs'].includes(classification.mainProtein) && (week.proteins.get(classification.mainProtein) || 0) >= 2) return null

  const allocation = allocateRecipe(recipe, state.availability, slot.date, scale)
  if (!constraints.allowShopping && allocation.shortages.length) return null
  const sensory = sensoryTransitionPenalty(state.recipes.at(-1), recipe, state.recipes)
  const nutrition = nutritionPenalty(recipe.nutritionPerServing, constraints.targetByMeal?.[mealType] || constraints.targetPerMeal)
  const shoppingPenalty = allocation.requiredGrams > 0 ? (1 - allocation.coverage) * (intent === 'stock' ? 52 : 32) : 0
  const timePenalty = Math.max(0, recipe.prepMinutes - (constraints.preferredActiveMinutes || 30)) * (intent === 'quick' ? .45 : .15)
  const stockReward = allocation.coverage * (intent === 'stock' ? 48 : 28)
  const wasteReward = Math.min(allocation.urgencyCredit / 100, intent === 'stock' ? 32 : 20)
  const cuisineRepeat = state.recipes.slice(-3).filter((item) => item.cuisineOrigin === recipe.cuisineOrigin).length * 5
  const recipeRepeatCount = state.recipes.filter((item) => item.code === recipe.code).length
  const recipeRepeatPenalty = recipeRepeatCount * 36 + (state.recipes.at(-1)?.code === recipe.code ? 60 : 0)
  const recentPenalty = (constraints.recentRecipeTitles || []).includes(fold(recipe.family)) ? 28 : 0
  const quotaScore = quotaProgressScore(week, recipe, targets)
  const score = stockReward + wasteReward + quotaScore + seasonalBonus(recipe, slot.date) - sensory.total - nutrition - shoppingPenalty - timePenalty - cuisineRepeat - recipeRepeatPenalty - recentPenalty
  return { score, allocation, sensory, nutritionPenalty: nutrition, recipeRepeatCount }
}

/**
 * Créneaux consommateurs d'une stratégie de production (audit §10 étape 4,
 * P2 item 4) : quand une recette FRAÎCHE est candidate sur un créneau, le
 * solveur évalue aussi « produire N portions maintenant, consommer le reste
 * sur des créneaux ULTÉRIEURS compatibles ». Règles déterministes et
 * conservatrices :
 * - jamais depuis un créneau figé (le repas verrouillé reste tel quel) ;
 * - au plus MAX_PRODUCTION_CONSUMERS consommateurs, pris en ordre de
 *   parcours des créneaux (déterministe) ;
 * - le consommateur doit tomber dans la fenêtre de conservation
 *   (date ≤ use_by), accepter la recette (exclusions, intent, contraintes
 *   dures SANS limite de temps — réchauffer n'est pas cuisiner) ;
 * - un créneau qu'un reste existant peut nourrir (pré-passe FEFO) garde sa
 *   priorité au reste : il n'est jamais couvert par une production ;
 * - les quotas hebdomadaires ne sont jamais contournés : total
 *   producteur + consommateurs borné par les plafonds poisson/viande et la
 *   répétition de protéine (≤ 2 prises d'une même protéine animale) ;
 * - aucune stratégie si la mutualisation n'économise pas de temps actif
 *   (prep ≤ réchauffage) : dans ce cas le plan reste identique à l'existant.
 *
 * Lot P3 :
 * - congélation (item 5) : un consommateur AU-DELÀ de la fenêtre
 *   réfrigérateur mais dans la fenêtre congélateur (lib/shelfLifeRules.js)
 *   peut être couvert par des portions congelées — uniquement si la recette
 *   est congelable d'après une information déclarée (cookingSessions.js,
 *   jamais le nom du plat) ET si le détour congélation économise encore du
 *   temps actif (prep − réchauffage − congeler − décongeler > 0) ;
 * - capacité temporelle (item 6) : les minutes actives de la session du
 *   producteur (préparation + 5 min de portionnage par repas couvert + tâche
 *   de congélation) ne dépassent jamais le plafond de la session. Si la
 *   stratégie déborde, le solveur retire des consommateurs (les congelés
 *   d'abord — ce sont toujours les dates les plus lointaines), et y renonce
 *   s'il n'en reste aucun. La cuisson fraîche d'un seul repas n'est JAMAIS
 *   bloquée par le plafond (le plan zéro-production reste identique) ;
 * - surproduction volontaire bornée (item 4, partiel) : si la recette est
 *   congelable et que la session a encore de la marge, une variante « +1
 *   part foyer congelée pour la semaine suivante » entre aussi dans le
 *   faisceau (voir l'appelant).
 */
function selectProductionConsumers(state, recipe, slot, slots, slotIndex, dishPool, dishIndexes, constraints, targets, sessionBudget) {
  if (slot.fixedRecipeCode) return null
  if (state.productionsUsed >= MAX_PLAN_PRODUCTIONS) return null
  const prepMinutes = Number(recipe.prepMinutes) || 0
  const activeMinutesSaved = prepMinutes - REHEAT_ACTIVE_MINUTES
  if (activeMinutesSaved <= 0) return null
  const classification = classifyRecipe(recipe)
  let maxMeals = 1 + MAX_PRODUCTION_CONSUMERS
  if (!['vegetal', 'laitiers', 'oeufs'].includes(classification.mainProtein)) {
    maxMeals = Math.min(maxMeals, 2 - (state.weeklySummary.proteins.get(classification.mainProtein) || 0))
  }
  if (classification.fish) maxMeals = Math.min(maxMeals, targets.fish - state.weeklySummary.fish)
  if (classification.meat) maxMeals = Math.min(maxMeals, targets.meatMax - state.weeklySummary.meat)
  if (maxMeals < 2) return null
  const useBy = addDaysIso(slot.date, productionShelfLifeDays(recipe))
  // Congeler puis décongeler coûte du temps actif : un repas congelé n'entre
  // en jeu que si l'économie nette reste positive.
  const frozenMinutesSaved = activeMinutesSaved - FREEZE_TASK_MINUTES - DEFROST_TASK_MINUTES
  const freezerUseBy = isRecipeFreezable(recipe) && frozenMinutesSaved > 0
    ? addDaysIso(slot.date, freezerShelfLifeDays(recipe))
    : null
  const consumers = []
  const frozenConsumers = []
  for (let index = slotIndex + 1; index < slots.length && consumers.length + frozenConsumers.length < maxMeals - 1; index += 1) {
    const candidate = slots[index]
    let storage = null
    if (candidate.date && candidate.date <= useBy) storage = 'refrigerator'
    else if (candidate.date && freezerUseBy && candidate.date <= freezerUseBy) storage = 'freezer'
    if (!storage) continue
    if (candidate.fixedRecipeCode) continue
    if ((candidate.excludedRecipeCodes || []).includes(recipe.code)) continue
    if (!matchesIntent(recipe, candidate.intent || constraints.intent || 'balanced')) continue
    if (violatesHardConstraints(recipe, {
      ...constraints, currentMealType: candidate.mealType ?? candidate.meal_type, maxMinutesByMeal: undefined, maxTotalMinutes: undefined,
    })) continue
    if (state.productionCovers.has(candidate.key)) continue
    if (dishPool.length && pickDishCandidate(state, candidate, dishPool, dishIndexes, constraints)) continue
    ;(storage === 'refrigerator' ? consumers : frozenConsumers).push(candidate)
  }
  // Minutes actives que la stratégie ajoute à la session du producteur
  // (cookingSessions.js) ; les unités « semaine suivante » comptent comme un
  // consommateur congelé de plus.
  const activeMinutesFor = (fridgeCount, frozenCount) => prepMinutes
    + BATCH_PORTIONING_ACTIVE_MINUTES * (fridgeCount + frozenCount)
    + (frozenCount > 0 ? FREEZE_TASK_MINUTES : 0)
  const budget = sessionBudget.cap - sessionBudget.used
  while (consumers.length + frozenConsumers.length > 0
    && activeMinutesFor(consumers.length, frozenConsumers.length) > budget) {
    if (frozenConsumers.length) frozenConsumers.pop()
    else consumers.pop()
  }
  if (!consumers.length && !frozenConsumers.length) return null
  const nextWeekPortions = freezerUseBy
    && activeMinutesFor(consumers.length, frozenConsumers.length + 1) <= budget
    ? Number(recipe.servings) || 0
    : 0
  return {
    consumers,
    frozenConsumers,
    useBy,
    freezerUseBy,
    bonus: round((consumers.length * activeMinutesSaved + frozenConsumers.length * frozenMinutesSaved) * MUTUALISATION_WEIGHT, 4),
    activeMinutes: activeMinutesFor(consumers.length, frozenConsumers.length),
    // Variante surproduction (item 4, partiel) : une part foyer congelée en
    // plus, destinée à un créneau de la semaine SUIVANTE. Elle n'a pas de
    // créneau dans ce plan : matérialisée congelée, elle reviendra dans la
    // boucle P1 (cooked_dishes FEFO) à la prochaine génération.
    nextWeekPortions,
    overproductionBonus: nextWeekPortions ? round(frozenMinutesSaved * MUTUALISATION_WEIGHT, 4) : 0,
    overproductionActiveMinutes: activeMinutesFor(consumers.length, frozenConsumers.length + 1),
  }
}

/**
 * État après consommation d'une production planifiée (audit §10 étapes 4-6) :
 * aucun ingrédient alloué — le producteur a déjà réservé N portions —,
 * couverture stock totale, préparation minimale (réchauffage). La
 * classification rejoint le bilan hebdomadaire : chaque prise compte pour les
 * quotas, produite ou fraîche. Comme pour les restes, pas de pénalité de
 * répétition ni de transition sensorielle : réchauffer n'est pas recuisiner.
 */
function consumeProductionState(state, slot, cover, recipe, constraints) {
  const mealType = slot.mealType ?? slot.meal_type
  const penalty = nutritionPenalty(recipe.nutritionPerServing, constraints.targetByMeal?.[mealType] || constraints.targetPerMeal)
  const score = PRODUCTION_CONSUMPTION_BASE_SCORE - penalty
  const productionCovers = new Map(state.productionCovers)
  productionCovers.delete(slot.key)
  return {
    score: state.score + score,
    availability: state.availability,
    recipes: state.recipes,
    weeklySummary: addToWeekSummary(state.weeklySummary, classifyRecipe(recipe)),
    usedCodes: state.usedCodes,
    dishPortionsUsed: state.dishPortionsUsed,
    productionCovers,
    productionsUsed: state.productionsUsed,
    sessionMinutes: state.sessionMinutes,
    slots: [...state.slots, {
      ...slot,
      recipeCode: recipe.code,
      title: recipe.family,
      servings: recipe.servings,
      nutrition: recipe.nutritionPerServing,
      sensory: recipe.sensory,
      allocations: [],
      shortages: [],
      stockCoverage: 1,
      score: round(score, 2),
      explanations: [],
      source: 'planned_production',
      productionKey: cover.productionKey,
      producerSlotKey: cover.producerSlotKey,
      productionPortions: Number(recipe.servings),
      // Portion sortie du congélateur (audit P3 item 5) : la clé n'existe
      // JAMAIS pour une couverture réfrigérateur — les plans sans congélation
      // restent octet pour octet identiques au lot P2.
      ...(cover.storage === 'freezer' ? { storageMethod: 'freezer' } : {}),
    }],
  }
}

/** Deterministic closed-loop planner with immutable safety and weekly rules. */
export function generateClosedLoopPlan({ slots, recipes, inventoryLots = [], existingReservations = [], cookedDishes = [], existingDishReservations = [], constraints = {}, beamWidth = 24 }) {
  const targets = weeklyTargets(constraints, slots.length)
  const dishPool = buildDishAvailability(cookedDishes, existingDishReservations)
  const dishIndexes = dishPool.length ? dishRecipeIndexes(recipes) : null
  const recipeByCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  // Capacité temporelle (audit P3 item 6) : les jours avec un déjeuner
  // planifié « sur place » laissent moins de temps libre pour cuisiner.
  const datesWithLunch = new Set(slots
    .filter((slot) => (slot.mealType ?? slot.meal_type) === 'dejeuner')
    .map((slot) => slot.date))
  let beam = [{ score: 0, availability: buildAvailability(inventoryLots, existingReservations), recipes: [], slots: [], usedCodes: new Set(), weeklySummary: emptyWeekSummary(), dishPortionsUsed: new Map(), productionCovers: new Map(), productionsUsed: 0, sessionMinutes: new Map() }]

  for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
    const slot = slots[slotIndex]
    // Session de cuisine du créneau (audit §13) : (jour, fenêtre déduite de
    // l'heure du repas). Toute cuisson fraîche s'y accumule ; le plafond ne
    // gate que les stratégies de production.
    const sessionKey = `${slot.date}|${sessionWindowForMealType(slot.mealType ?? slot.meal_type)}`
    const sessionCap = resolveSessionCapMinutes(constraints, datesWithLunch.has(slot.date))
    const expanded = []
    for (const state of beam) {
      const sessionUsed = state.sessionMinutes.get(sessionKey) || 0
      // Créneau couvert par une production planifiée en amont (audit §10
      // étape 4) : consommation obligée — les portions existent déjà dans le
      // plan, les ingrédients ont été réservés par le producteur.
      const cover = state.productionCovers.get(slot.key)
      if (cover) {
        expanded.push(consumeProductionState(state, slot, cover, recipeByCode.get(cover.recipeCode), constraints))
        continue
      }
      // Pré-passe restes (audit §2 / §10 étape 3) : un plat déjà cuisiné qui
      // couvre le créneau BAT toute cuisson fraîche. Déterministe : un seul
      // candidat, le premier en ordre FEFO.
      const dishCandidate = dishPool.length ? pickDishCandidate(state, slot, dishPool, dishIndexes, constraints) : null
      if (dishCandidate) {
        expanded.push(consumeDishState(state, slot, dishCandidate, constraints))
        continue
      }
      for (const recipe of recipes) {
        const evaluated = evaluateCandidate(state, recipe, slot, constraints, targets)
        if (!evaluated) continue
        const usedCodes = new Set(state.usedCodes)
        usedCodes.add(recipe.code)
        const freshSessionMinutes = new Map(state.sessionMinutes)
        freshSessionMinutes.set(sessionKey, sessionUsed + (Number(recipe.prepMinutes) || 0))
        expanded.push({
          score: state.score + evaluated.score,
          availability: evaluated.allocation.availability,
          recipes: [...state.recipes, recipe],
          weeklySummary: addToWeekSummary(state.weeklySummary, classifyRecipe(recipe)),
          usedCodes,
          dishPortionsUsed: state.dishPortionsUsed,
          productionCovers: state.productionCovers,
          productionsUsed: state.productionsUsed,
          sessionMinutes: freshSessionMinutes,
          slots: [...state.slots, {
            ...slot,
            recipeCode: recipe.code,
            title: recipe.family,
            servings: recipe.servings,
            nutrition: recipe.nutritionPerServing,
            sensory: recipe.sensory,
            allocations: evaluated.allocation.allocations,
            shortages: evaluated.allocation.shortages,
            stockCoverage: round(evaluated.allocation.coverage, 4),
            score: round(evaluated.score, 2),
            explanations: [...evaluated.sensory.reasons, ...(evaluated.recipeRepeatCount ? ['recipe_repeated'] : [])],
          }],
        })
        // Stratégie production multi-portions (audit §10 étapes 4-6) : le
        // même candidat, dimensionné à N portions au niveau foyer, couvrant
        // des créneaux ultérieurs compatibles. Elle entre dans le faisceau à
        // côté de la version « chaque créneau cuisine séparément » et n'est
        // retenue au final que si elle la domine au score (bonus de
        // mutualisation explicite = temps actif économisé). Lot P3 : la
        // stratégie respecte le plafond de minutes actives de la session, et
        // une variante congélation « semaine suivante » entre aussi dans le
        // faisceau quand la recette est congelable.
        const strategy = selectProductionConsumers(state, recipe, slot, slots, slotIndex, dishPool, dishIndexes, constraints, targets, { used: sessionUsed, cap: sessionCap })
        if (!strategy) continue
        const consumerCount = strategy.consumers.length + strategy.frozenConsumers.length
        const variants = [{
          scale: consumerCount + 1,
          bonus: strategy.bonus,
          activeMinutes: strategy.activeMinutes,
          nextWeekPortions: 0,
        }]
        if (strategy.nextWeekPortions > 0) {
          variants.push({
            scale: consumerCount + 2,
            bonus: round(strategy.bonus + strategy.overproductionBonus, 4),
            activeMinutes: strategy.overproductionActiveMinutes,
            nextWeekPortions: strategy.nextWeekPortions,
          })
        }
        for (const variant of variants) {
          const batchEvaluated = evaluateCandidate(state, recipe, slot, constraints, targets, variant.scale)
          if (!batchEvaluated) continue
          const productionKey = `production-${slot.key}`
          const freezerProductionKey = `${productionKey}-congelation`
          const hasFreezerTier = strategy.frozenConsumers.length > 0 || variant.nextWeekPortions > 0
          const productionCovers = new Map(state.productionCovers)
          for (const consumer of strategy.consumers) {
            productionCovers.set(consumer.key, { productionKey, producerSlotKey: slot.key, recipeCode: recipe.code })
          }
          for (const consumer of strategy.frozenConsumers) {
            productionCovers.set(consumer.key, { productionKey: freezerProductionKey, producerSlotKey: slot.key, recipeCode: recipe.code, storage: 'freezer' })
          }
          const batchSessionMinutes = new Map(state.sessionMinutes)
          batchSessionMinutes.set(sessionKey, sessionUsed + variant.activeMinutes)
          expanded.push({
            score: state.score + batchEvaluated.score + variant.bonus,
            availability: batchEvaluated.allocation.availability,
            recipes: [...state.recipes, recipe],
            weeklySummary: addToWeekSummary(state.weeklySummary, classifyRecipe(recipe)),
            usedCodes,
            dishPortionsUsed: state.dishPortionsUsed,
            productionCovers,
            productionsUsed: state.productionsUsed + 1,
            sessionMinutes: batchSessionMinutes,
            slots: [...state.slots, {
              ...slot,
              recipeCode: recipe.code,
              title: recipe.family,
              servings: recipe.servings,
              nutrition: recipe.nutritionPerServing,
              sensory: recipe.sensory,
              allocations: batchEvaluated.allocation.allocations,
              shortages: batchEvaluated.allocation.shortages,
              stockCoverage: round(batchEvaluated.allocation.coverage, 4),
              score: round(batchEvaluated.score + variant.bonus, 2),
              explanations: [...batchEvaluated.sensory.reasons, ...(batchEvaluated.recipeRepeatCount ? ['recipe_repeated'] : [])],
              production: {
                productionKey,
                outputName: recipe.family,
                portions: round(Number(recipe.servings) * variant.scale, 2),
                scale: variant.scale,
                storageMethod: 'refrigerator',
                availableFrom: slot.date,
                useBy: strategy.useBy,
                consumerSlotKeys: strategy.consumers.map((consumer) => consumer.key),
                // Volet congélation (audit P3 items 4-5) : clé absente sans
                // portion congelée — les plans frigo-seuls restent octet pour
                // octet identiques au lot P2.
                ...(hasFreezerTier ? {
                  freezer: {
                    productionKey: freezerProductionKey,
                    consumerSlotKeys: strategy.frozenConsumers.map((consumer) => consumer.key),
                    useBy: strategy.freezerUseBy,
                    ...(variant.nextWeekPortions > 0 ? { nextWeekPortions: round(variant.nextWeekPortions, 2) } : {}),
                  },
                } : {}),
              },
            }],
          })
        }
      }
    }
    expanded.sort((a, b) => b.score - a.score || a.slots.at(-1).recipeCode.localeCompare(b.slots.at(-1).recipeCode))
    beam = expanded.slice(0, beamWidth)
    if (!beam.length) return { status: 'review_required', slots: [], reservations: [], shoppingItems: [], issues: [{ severity: 'blocker', code: 'no_feasible_plan', slot }] }
  }

  const ranked = beam.map((state) => {
    const weeklySummary = state.weeklySummary
    const deficits = weeklyDeficits(weeklySummary, targets)
    const deficitWeight = deficits.reduce((sum, item) => sum + item.missing, 0)
    return { ...state, weeklySummary, deficits, deficitWeight }
  }).sort((a, b) => a.deficitWeight - b.deficitWeight || b.score - a.score)
  const best = ranked[0]
  // Une réservation de PORTIONS par (créneau, plat) rejoint les réservations
  // de lots (audit P1-4) : le plat n'est jamais décrémenté à la publication.
  const reservations = best.slots.flatMap((slot) => [
    ...slot.allocations.map((allocation) => ({ ...allocation, slotKey: slot.key, status: 'active' })),
    ...(slot.cookedDishId != null
      ? [{ cookedDishId: slot.cookedDishId, dishName: slot.cookedDishName, portions: slot.dishPortions, slotKey: slot.key, status: 'active' }]
      : []),
  ])
  const shoppingByForm = new Map()
  for (const slot of best.slots) {
    for (const shortage of slot.shortages) {
      const current = shoppingByForm.get(shortage.formNormalized) || { ...shortage, grams: 0, neededBy: slot.date }
      current.grams += shortage.grams
      if (slot.date < current.neededBy) current.neededBy = slot.date
      shoppingByForm.set(shortage.formNormalized, current)
    }
  }
  return {
    status: 'published',
    score: round(best.score, 2),
    slots: best.slots,
    reservations,
    shoppingItems: [...shoppingByForm.values()].map((item) => ({ ...item, grams: round(item.grams) })),
    issues: best.deficits.map((deficit) => ({ severity: 'warning', code: deficit.code, missing: deficit.missing })),
    objectiveScores: {
      globalScore: round(best.score, 2),
      stockCoverage: round(best.slots.reduce((sum, slot) => sum + slot.stockCoverage, 0) / Math.max(best.slots.length, 1), 4),
      shoppingItemCount: shoppingByForm.size,
      sensoryRuleViolations: best.slots.reduce((sum, slot) => sum + slot.explanations.length, 0),
      weeklyRuleViolations: best.deficits.length,
      weeklyTargets: targets,
      weeklyActual: {
        fish: best.weeklySummary.fish, meat: best.weeklySummary.meat, vegetarian: best.weeklySummary.vegetarian,
        redMeat: best.weeklySummary.redMeat, fattyFish: best.weeklySummary.fattyFish, legumes: best.weeklySummary.legumes,
        cuisines: best.weeklySummary.cuisines.size, proteins: best.weeklySummary.proteins.size,
      },
    },
  }
}
