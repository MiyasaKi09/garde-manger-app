import { matchesBannedFood } from './foodBanMatch'
import { isDessertRecipe } from './plateRole'
import {
  BATCH_PORTIONING_ACTIVE_MINUTES,
  FREEZE_TASK_MINUTES,
  DEFROST_TASK_MINUTES,
  freezerShelfLifeDays,
  isRecipeFreezable,
  refrigeratorShelfLifeDays,
  resolveSessionCapMinutes,
  sessionWindowForMealType,
} from './cookingSessions'
import { batchRejectionReason, isBatchCandidate, recipePlanningProfile } from './recipePlanningProfile'
import {
  EMPTY_BASE_STOCK,
  EMPTY_SLOT_BASES,
  SHARED_BASE_MINUTE_WEIGHT,
  applySharedBaseStock,
  auditSharedBases,
  buildSharedBaseCatalog,
  planSlotBases,
  usesSharedBase,
} from './sharedBases'
import { EMPTY_TASTE_PROFILE, isTasteForbidden, requestedRepeatDelayDays, tasteScore } from './tastePreferences'
import { discoveryBalance, discoveryScoreAdjustment } from './discoveryProfile'
import { UNCAPPED_PROTEIN_FAMILIES, buildWeeklyBalance, weeklyBalanceFor } from './weeklyBalance'
import {
  ingredientOrigin, isFishOrigin, isMeatOrigin, isVeganExcludedOrigin, isVegetarianCompatibleOrigin,
} from '../foods/origins'
import {
  DEFAULT_REPETITION_RULES,
  EMPTY_PLANNING_HISTORY,
  MEAL_SOURCES,
  auditWeekRepetition,
  buildDiversityProfile,
  buildRepetitionRules,
  classifyMealStatus,
  filterCoreRepetitionViolations,
  historyReturnPenalty,
  mealOrdinal,
  proximityWarnings,
  repetitionViolations,
} from './repetitionRules'
import { composerFourchettes } from '../pricing/priceMath'
import {
  BUDGET_ISSUE_CODES,
  buildBudgetContext,
  coutCreneau,
  creneauGratuit,
  evaluerCreneauBudget,
  rapportBudget,
  termeEuros,
} from './budgetDimension'

/**
 * Modes de filtrage des règles absolues de répétition dans le beam search.
 *
 * - `strict` : toutes les règles sont dures. C'est le mode nominal — la
 *   semaine publiée ne peut franchir aucune règle.
 * - `core`   : le SOCLE reste dur (même plat même jour, sur repas contigus,
 *   variantes de la même lignée, seconde cuisson dans la semaine) ; les
 *   règles souples (délai ≥ 2 repas, plafond de 3 consommations, fenêtre
 *   glissante) deviennent des pénalités. C'est le repli intermédiaire quand
 *   `strict` échoue — préserve la garantie « pas trois pizzas » sans exiger
 *   du corpus une diversité qu'il n'a pas.
 * - `off`    : plus aucune règle n'écarte un candidat, seule la pénalité de
 *   score reste. Utilisé en dernier recours, quand même `core` n'aboutit pas.
 */
const REPETITION_MODES = Object.freeze({ STRICT: 'strict', CORE: 'core', OFF: 'off' })

/**
 * Filtrage des violations selon le mode : `strict` garde tout, `core` ne
 * garde que le socle (`isCoreRepetitionViolation`), `off` n'en garde aucune.
 * Point unique de vérité — les trois sites d'appel (candidats frais, plats
 * cuisinés, productions planifiées) passent par cette fonction, la règle
 * ne peut donc pas diverger.
 */
function violationsFilteringMode(violations, mode) {
  if (!violations || !violations.length) return []
  if (mode === REPETITION_MODES.STRICT) return violations
  if (mode === REPETITION_MODES.CORE) return filterCoreRepetitionViolations(violations)
  return []
}

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
export function dishRecipeIndexes(recipes) {
  const byCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const byFamily = new Map()
  for (const recipe of [...recipes].sort((a, b) => String(a.code).localeCompare(String(b.code)))) {
    const key = fold(recipe.family)
    if (key && !byFamily.has(key)) byFamily.set(key, recipe)
  }
  return { byCode, byFamily }
}

export function matchDishRecipe(dish, indexes) {
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
function pickDishCandidate(state, slot, dishPool, indexes, constraints, context = null) {
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
    // Règles absolues de répétition (§3, lot 0) : un reste reste un reste, mais
    // il ne peut ni doubler le déjeuner et le dîner du jour, ni s'enchaîner
    // repas après repas. Sans ce filtre, un plat de huit portions nourrissait
    // quatre créneaux consécutifs — la « pizza margherita quatre fois » de
    // l'observation initiale. Le plat suivant du pool est essayé, puis la
    // cuisson fraîche : le reste perd sa priorité au lieu de l'imposer.
    if (context && repetitionRejects(state, slot, recipe.code, MEAL_SOURCES.COOKED_DISH, context)) continue
    return { dish, recipe }
  }
  return null
}

/**
 * Violations qu'entraînerait ce candidat, à l'ÉCHELLE DE LA SEMAINE (audit §9 :
 * « le moteur ne doit plus sélectionner chaque créneau indépendamment »). Deux
 * regards complémentaires, parce que les créneaux sont décidés dans l'ordre :
 *
 * - EN ARRIÈRE : les créneaux déjà décidés (`state.slots`), dont l'index dans
 *   le tableau EST la distance en repas ;
 * - EN AVANT : les consommations de production déjà promises sur des créneaux
 *   ultérieurs (`productionCovers`). Sans ce regard, un reste pourrait se
 *   glisser la veille d'une portion déjà réservée et recréer l'enchaînement
 *   que la règle interdit.
 */
export function repetitionCandidateViolations(state, slot, recipeCode, source, context) {
  const violations = repetitionViolations({
    plannedSlots: state.slots,
    date: slot.date,
    mealType: slot.mealType ?? slot.meal_type,
    recipeCode,
    lineage: context.lineageByCode?.get(recipeCode) || recipeCode,
    source,
    rules: context.rules,
  })
  const position = mealOrdinal(slot) ?? (context.slotIndexByKey.get(slot.key) ?? state.slots.length)
  const requiredGap = Math.max(1, context.rules.minSeparatingMeals) + 1
  for (const [coveredKey, cover] of state.productionCovers) {
    if (cover.recipeCode !== recipeCode) continue
    const covered = context.slotByKey.get(coveredKey)
    const coveredPosition = covered ? (mealOrdinal(covered) ?? context.slotIndexByKey.get(coveredKey)) : null
    if (coveredPosition == null || coveredPosition <= position) continue
    if (!context.rules.allowSameDayRepeat && covered.date && covered.date === slot.date) {
      violations.push({ code: 'same_day_recipe_repeat', recipeCode, date: slot.date })
    } else if (coveredPosition - position < requiredGap) {
      violations.push({
        code: 'recipe_repeat_too_close',
        recipeCode,
        mealsBetween: Math.max(0, coveredPosition - position - 1),
        required: context.rules.minSeparatingMeals,
      })
    }
  }
  // Un conflit vu en arrière ET en avant décrit la même règle franchie sur le
  // même créneau : une seule entrée suffit à l'expliquer.
  const seen = new Set()
  return violations.filter((violation) => {
    const key = `${violation.code}|${violation.recipeCode}|${violation.date || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const repetitionRejects = (state, slot, recipeCode, source, context) => {
  const violations = repetitionCandidateViolations(state, slot, recipeCode, source, context)
  return violationsFilteringMode(violations, context.repetitionMode).length > 0
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
function consumeDishState(state, slot, { dish, recipe }, constraints, context) {
  const mealType = slot.mealType ?? slot.meal_type
  const dishViolations = context
    ? repetitionCandidateViolations(state, slot, recipe.code, MEAL_SOURCES.COOKED_DISH, context)
    : []
  const nutrition = dish.nutritionPerPortion || recipe.nutritionPerServing
  const penalty = slotPenalty(nutrition, constraints.targetByMeal?.[mealType] || constraints.targetPerMeal).total
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
    // Les bases déjà produites traversent la consommation d'un reste sans
    // changer : réchauffer n'en cuit aucune et n'en consomme aucune.
    baseStock: state.baseStock,
    // Un reste ne se paie pas deux fois : la fourchette engagée de la semaine
    // ne bouge pas, et l'allocation de ce créneau revient aux suivants.
    costRanges: state.costRanges,
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
      diversity: recipeDiversityProfile(recipe),
      // Une répétition justifiée (§4) : le plat existe déjà, la consommer évite
      // le gaspillage. Le statut la distingue d'une répétition subie — sauf en
      // mode dégradé, où la prise devient un repas de secours à revoir.
      mealStatus: classifyMealStatus({ source: MEAL_SOURCES.COOKED_DISH, degraded: dishViolations.length > 0 }),
      repetitionViolations: dishViolations,
      source: 'cooked_dish',
      cookedDishId: dish.id,
      cookedDishName: dish.name,
      dishPortions: Number(recipe.servings),
      dishNutritionPerPortion: dish.nutritionPerPortion || null,
      // Clé absente sans enveloppe : un plan sans budget reste octet pour octet
      // celui d'avant.
      ...(context?.budget?.active ? { budget: creneauGratuit('reste_deja_paye') } : {}),
    }],
  }
}

/**
 * Fenêtre de conservation d'une production planifiée (audit P2 item 4, F13).
 * C'est `refrigeratorShelfLifeDays` de cookingSessions.js : la durée DÉCLARÉE
 * par la recette (`shelfLifeDays`, sinon les heures de son profil de
 * conservation), ou null — et null veut dire AUCUNE production.
 *
 * Ce qui a été retiré : le repli sur COOKED_DISH_SHELF_LIFE.fridge (3 jours)
 * pour toute recette sans durée déclarée. La prose « 24 heures » d'un pan
 * bagnat n'était jamais lue et le plat était produit pour trois jours. Le
 * motif lisible d'un refus est `batchRejectionReason(recipe)` :
 * 'conservation_non_declaree', 'a_consommer_immediatement', …
 * Jamais d'appel IA, jamais de regex sur le nom du plat.
 */
export function productionShelfLifeDays(recipe) {
  return refrigeratorShelfLifeDays(recipe)
}

/**
 * Raison lisible pour laquelle une recette n'aura pas de stratégie de
 * production, ou null si elle en est candidate. Exposée pour l'explication
 * des décisions (§10) et les tests : le solveur, lui, se contente de ne pas
 * générer la stratégie.
 */
export function productionRefusalReason(recipe) {
  const rejection = batchRejectionReason(recipe)
  if (rejection) return rejection
  return productionShelfLifeDays(recipe) == null ? 'conservation_non_declaree' : null
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

/**
 * Écart d'un plat à ce qu'on attend du créneau — nutrition ET euros.
 *
 * NUTRITION. Les écarts ne se valent pas selon leur SENS, et cette pénalité les
 * traitait pourtant à égalité. Un plat plus riche en protéines que la cible
 * n'est pas un défaut — c'est précisément ce qui manque à un foyer
 * chroniquement sous la sienne ; un plat qui en manque, si. Symétrique, la
 * pénalité écartait donc les plats mêmes dont le foyer avait besoin, et le
 * solveur choisissait ses recettes sur un critère que l'optimiseur de portions
 * contredisait ensuite (`macroScore`, lui, est asymétrique depuis toujours).
 *
 * Les coûts ci-dessous reprennent la philosophie de `macroScore` pour que les
 * deux étages jugent enfin la même chose : déficit de protéines et de fibres
 * coûteux, excès presque gratuit ; excès de glucides et de lipides coûteux,
 * déficit presque gratuit ; énergie seule réellement à deux faces.
 *
 * EUROS. Sixième dimension, de même grammaire — [clé, poids, coût d'un déficit,
 * coût d'un excès] = ['euros', 0.30, 0, 1] — et de même plafond relatif. Elle
 * est à UNE FACE : rester sous l'allocation du créneau ne coûte rien, la
 * dépasser coûte cher. C'est la forme d'un plafond, et c'est ce qui permet de
 * l'introduire sans toucher au moteur : le faisceau porte la contrainte à
 * chaque créneau, au lieu qu'un filtre la découvre à la fin. Le poids est
 * justifié chiffre par chiffre dans budgetDimension.js.
 *
 * POURQUOI LE TERME EUROS EST AJOUTÉ ET NON MOYENNÉ. Le glisser dans la moyenne
 * pondérée diviserait toutes les dimensions nutritionnelles par 1,30 : régler
 * une enveloppe — même très large, même jamais approchée — affaiblirait en
 * silence l'arbitrage nutritionnel. Un plafond doit être strictement INERTE
 * tant qu'il est respecté. Ajouté hors moyenne, il l'est : sans budget, ou sous
 * l'allocation, cette fonction rend exactement ce qu'elle rendait avant.
 */
function slotPenalty(nutrition, target = {}, budgetEvaluation = null) {
  const dimensions = [
    // [clé, poids, coût d'un déficit, coût d'un excès]
    ['kcal', 0.40, 1, 1],
    ['proteinG', 0.34, 1, 0.15],
    ['fiberG', 0.14, 1, 0.1],
    ['carbsG', 0.06, 0.2, 1],
    ['fatG', 0.06, 0.2, 1],
  ]
  let total = 0
  let weights = 0
  for (const [key, weight, deficitCost, surplusCost] of dimensions) {
    const expected = Number(target[key])
    const actual = Number(nutrition?.[key])
    if (!Number.isFinite(expected) || expected <= 0 || !Number.isFinite(actual)) continue
    const relative = (actual - expected) / expected
    const cost = relative < 0 ? -relative * deficitCost : relative * surplusCost
    total += Math.min(cost, 2) * weight
    weights += weight
  }
  const nutritionnel = weights ? total / weights : 0
  const euros = termeEuros(budgetEvaluation)
  return { total: (nutritionnel + euros) * 35, nutritionnel: nutritionnel * 35, euros: euros * 35 }
}

// Carné / végétarien se lit dans l'ORIGINE déclarée de chaque ingrédient
// (lib/domain/foods/origins.js), jamais dans son nom ni dans sa catégorie de
// rangement. La regex de treize mots qui vivait ici et les trois catégories
// qu'elle complétait ont servi deux fois du boudin noir comme « variante
// végétarienne » et compté le tofu comme de la viande. Les motifs sur les noms
// ne subsistent que pour NOMMER une famille (bœuf plutôt que veau, saumon
// plutôt que cabillaud) parmi des ingrédients dont l'origine concorde déjà.
const RED_MEAT = /\b(boeuf|veau|agneau|mouton)\b/
const FATTY_FISH = /\b(saumon|sardine|maquereau|hareng)\b/
// Famille de protéine nommée, par origine : un motif n'est essayé que sur un
// ingrédient de CETTE origine (« lardon » ne fait plus « porc » d'un bouillon
// de légumes qui n'en contient pas). Sans motif concordant, la famille est
// l'origine elle-même (viande, volaille, poisson…), ce qui reste une famille
// comparable d'un repas à l'autre — une truite n'était « vegetal » avant que
// parce qu'aucun mot ne la nommait.
const NAMED_PROTEIN_FAMILIES = Object.freeze({
  'animal:viande': [['boeuf', /\bboeuf\b/], ['veau', /\bveau\b/], ['agneau', /\b(agneau|mouton)\b/], ['porc', /\b(porc|jambon|lardon|saucisse)\b/]],
  'animal:volaille': [['poulet', /\b(poulet|volaille)\b/], ['canard', /\bcanard\b/]],
  'animal:poisson': [['saumon', /\bsaumon\b/], ['cabillaud', /\b(cabillaud|morue)\b/]],
  vegetal: [['lentilles', /\blentille/], ['pois_chiches', /\bpois chiche/], ['haricots', /\bharicot/]],
})
// 'vegetal' reste la famille par défaut d'un plat sans protéine animale, comme
// avant ce chantier : le sel, l'eau ou le miel en tête des contributions ne
// désignent aucune espèce. 'inconnu' est gardé tel quel — une protéine
// principale non déclarée ne doit pas se faire passer pour végétale.
const DEFAULT_PROTEIN_FAMILY = Object.freeze({
  'animal:viande': 'viande',
  'animal:volaille': 'volaille',
  'animal:poisson': 'poisson',
  'animal:fruits_de_mer': 'fruits_de_mer',
  'animal:oeuf': 'oeufs',
  'animal:lait': 'laitiers',
  'animal:autre': 'autre',
  'animal:miel': 'vegetal',
  vegetal: 'vegetal',
  mineral: 'vegetal',
  inconnu: 'inconnu',
})
// Rôle déclaré « protéine » (le corpus écrit protéine, proteine, protéine
// principale, protéine végétale…) ; une protéine « complémentaire » ne l'est
// pas, par définition.
const PROTEIN_ROLE = /^proteine(?!.*complementaire)/

/**
 * Apport en protéines d'un ingrédient, en grammes — ou null quand la fiche
 * nutritionnelle manque. Quand elle manque pour l'un, on retombe sur la MASSE
 * pour tous : comparer des grammes de protéines à des grammes tout court
 * serait comparer deux unités.
 */
function proteinGrams(ingredient) {
  const grams = Number(ingredient?.grams) || 0
  const per100 = Number(ingredient?.per100g?.proteinG)
  return Number.isFinite(per100) ? grams * per100 / 100 : null
}

/**
 * L'ingrédient qui porte la protéine principale, et sa famille.
 *
 * Pourquoi ni « le premier mot carné » ni « la première origine animale » :
 * la soupe à l'oignon (FR-012) contient 1,5 l de bouillon de volaille — 7 g de
 * protéines — et 180 g de gruyère — 48 g. Elle est carnée (le bouillon), mais
 * sa protéine principale n'est pas « poulet ». Le choix retenu :
 *   1. le RÔLE déclaré d'abord — si la rédaction a marqué des ingrédients
 *      « protéine », la protéine principale est parmi eux ;
 *   2. la MASSE de protéines ensuite — parmi ces candidats, ou parmi tous les
 *      ingrédients obligatoires s'il n'y a pas de rôle déclaré, celui qui en
 *      apporte le plus (à masse égale, le premier écrit).
 * Le rôle prime la masse parce qu'il est déclaré : 100 g de lardons marqués
 * « protéine » dans 300 g de lentilles disent ce que l'auteur a voulu.
 */
function mainProteinOf(required) {
  if (!required.length) return { ingredient: null, family: 'vegetal' }
  const declared = required.filter((ingredient) => PROTEIN_ROLE.test(fold(ingredient.role)))
  const candidates = declared.length ? declared : required
  const proteins = candidates.map(proteinGrams)
  const weights = proteins.every((value) => value !== null) ? proteins : candidates.map((ingredient) => Number(ingredient?.grams) || 0)
  let best = 0
  for (let index = 1; index < candidates.length; index++) if (weights[index] > weights[best]) best = index
  const ingredient = candidates[best]
  const origin = ingredientOrigin(ingredient)
  const text = fold(`${ingredient.name} ${ingredient.formNormalized}`)
  const named = (NAMED_PROTEIN_FAMILIES[origin] || []).find(([, matcher]) => matcher.test(text))
  return { ingredient, family: named ? named[0] : DEFAULT_PROTEIN_FAMILY[origin] }
}
// Familles de féculents (audit §11 : le féculent est une dimension de
// diversité à part entière — quatre plats italiens différents servis sur pâtes
// restent quatre fois le même féculent). L'ordre compte : le premier motif qui
// correspond gagne, du plus spécifique au plus générique.
const STARCH_MATCHERS = [
  ['pates', /\b(pate|pates|spaghetti|tagliatelle|penne|macaroni|linguine|fusilli|lasagne|ravioli|nouille|vermicelle)\b/],
  ['riz', /\b(riz|risotto|basmati|arborio)\b/],
  ['pomme_de_terre', /\b(pomme de terre|pommes de terre|patate|gnocchi|gnocchis)\b/],
  ['pain', /\b(pain|baguette|tortilla|pita|wrap|bun)\b/],
  ['semoule', /\b(semoule|couscous|boulgour|boulghour)\b/],
  ['quinoa', /\b(quinoa|sarrasin|epeautre|millet)\b/],
  ['legumineuses', /\b(lentille|pois chiche|haricot sec|haricots secs|flageolet)\b/],
  ['patate_douce', /\b(patate douce|patates douces)\b/],
  ['polenta', /\b(polenta|mais)\b/],
]
// Plats servis froids : le corpus ne publie pas de température de service, on
// s'appuie donc uniquement sur des marqueurs explicites du nom ou de la
// catégorie. Aucun marqueur = plat chaud (le cas très majoritaire).
const COLD_DISH = /\b(salade|carpaccio|tartare|gaspacho|ceviche|taboule|vitello tonnato|froid|froide)\b/
const classificationCache = new WeakMap()
const diversityCache = new WeakMap()

/**
 * Classification métier d'une recette, lue dans les ORIGINES déclarées de ses
 * ingrédients obligatoires :
 *   - `vegetarian` : toutes les origines sont compatibles (végétal, minéral,
 *     œuf, lait, miel). Un ingrédient optionnel n'entre pas en ligne de compte
 *     (on peut l'omettre), un ingrédient 'inconnu' rend le plat NON végétarien
 *     — on ne devine pas dans le sens favorable — et son nom est exposé dans
 *     `unknownOrigins` pour que l'absence de décision soit visible ;
 *   - `fish` et `meat` sont INDÉPENDANTS : une paella au poulet et aux
 *     crevettes est les deux. L'ancienne exclusion (`meat = !fish && …`)
 *     faisait d'un plat de poisson aux lardons un plat « sans viande » ;
 *   - `redMeat` et `fattyFish` gardent leurs motifs sur les noms, mais
 *     restreints aux ingrédients d'origine viande (resp. poisson) : un « bœuf »
 *     dans le nom d'un bouillon compte, celui d'une « tomate cœur de bœuf »
 *     ne compte plus ;
 *   - `mainProtein` : voir mainProteinOf ;
 *   - `legumes` reste lu dans la catégorie de rangement : c'est une famille
 *     botanique, pas une origine, et la catégorie est ce que le catalogue
 *     déclare pour elle.
 */
export function classifyRecipe(recipe) {
  const cached = classificationCache.get(recipe)
  if (cached) return cached
  const ingredients = recipe.exactIngredients || []
  const required = ingredients.filter((ingredient) => !ingredient?.optional)
  const categories = new Set(ingredients.map((ingredient) => fold(ingredient.category)).filter(Boolean))
  const ingredientText = ingredients.map((ingredient) => fold(`${ingredient.name} ${ingredient.formNormalized}`)).join(' ')
  // Un ingrédient obligatoire écarté par un bloqueur (forme inconnue, proxy de
  // confiance C) n'a ni grammes ni nutrition, mais il a une origine : il compte
  // pour carné / végétarien, sinon une recette non publiable dont l'agneau a
  // été écarté passerait pour végétarienne. Il ne concourt pas à la protéine
  // principale, faute de masse.
  const origins = [...required, ...(recipe.blockedIngredients || [])]
    .map((ingredient) => ({ ingredient, origin: ingredientOrigin(ingredient) }))
  const textOf = (entries) => entries.map(({ ingredient }) => fold(`${ingredient.name} ${ingredient.formNormalized}`)).join(' ')
  const meatOrigins = origins.filter(({ origin }) => isMeatOrigin(origin))
  const fishOrigins = origins.filter(({ origin }) => isFishOrigin(origin))
  const unknownOrigins = origins.filter(({ origin }) => origin === 'inconnu').map(({ ingredient }) => ingredient.name)
  // Ingrédients OPTIONNELS d'origine non compatible (les lardons d'une salade
  // de chèvre chaud, le thon des œufs mimosa) : ils ne rendent pas le plat
  // carné — on peut les omettre — mais celui qui sert ce plat à un végétarien
  // doit le savoir. Douze recettes du corpus sont dans ce cas.
  const optionalNonVegetarian = ingredients
    .filter((ingredient) => ingredient?.optional && !isVegetarianCompatibleOrigin(ingredientOrigin(ingredient)))
    .map((ingredient) => ingredient.name)
  const fish = fishOrigins.length > 0
  const meat = meatOrigins.length > 0
  const vegetarian = origins.every(({ origin }) => isVegetarianCompatibleOrigin(origin))
  const legumes = categories.has('legumineuses')
  const mainProtein = mainProteinOf(required).family
  const richness = Number(recipe.sensory?.scores?.richness) || 0
  const kcal = Number(recipe.nutritionPerServing?.kcal) || 0
  const mainStarch = STARCH_MATCHERS.find(([, matcher]) => matcher.test(ingredientText))?.[0] || null
  const rich = richness >= 4 || kcal >= 650
  const classification = {
    fish,
    meat,
    vegetarian,
    unknownOrigins,
    optionalNonVegetarian,
    redMeat: RED_MEAT.test(textOf(meatOrigins.filter(({ origin }) => origin === 'animal:viande'))),
    fattyFish: FATTY_FISH.test(textOf(fishOrigins.filter(({ origin }) => origin === 'animal:poisson'))),
    legumes,
    mainProtein,
    // Féculent dominant : null quand la recette n'en contient aucun (une
    // dimension absente n'est jamais comptée comme une répétition).
    mainStarch,
    cuisine: fold(recipe.cuisineOrigin) || 'non renseignee',
    rich,
    light: richness <= 3 && (!kcal || kcal <= 550),
    temperature: COLD_DISH.test(fold(`${recipe.family} ${recipe.category}`)) ? 'froid' : 'chaud',
  }
  classificationCache.set(recipe, classification)
  return classification
}

/**
 * Profil de diversité d'une recette (audit §11), mémorisé par recette. Il
 * traduit la classification métier en dimensions comparables d'un repas à
 * l'autre — c'est cette structure, et non le seul code recette, qui mesure la
 * variété d'une semaine et alimente les délais de retour.
 */
/**
 * Lignée d'une recette : sa base si elle en dérive, elle-même sinon. C'est
 * l'identité de PLAT, quand `code` est l'identité de RECETTE — « Blanquette de
 * dinde aux poireaux » a son code propre mais reste une blanquette de dinde.
 */
export function recipeLineage(recipe) {
  return recipe?.derivedFrom || recipe?.derived_from || recipe?.code || null
}

export function recipeDiversityProfile(recipe) {
  const cached = diversityCache.get(recipe)
  if (cached) return cached
  const classification = classifyRecipe(recipe)
  const profile = buildDiversityProfile({
    recipeCode: recipe.code,
    lineage: recipeLineage(recipe),
    // `recipe.family` porte le TITRE de la recette (cf. materializeOperationalRecipe) :
    // il ferait doublon avec le code. La famille culinaire exploitable est
    // `category` — celle-là même qui distingue un mijoté d'une salade complète.
    family: recipe.category,
    cuisine: classification.cuisine,
    protein: classification.mainProtein,
    starch: classification.mainStarch,
    technique: (recipe.techniques || [])[0] || null,
    sensoryProfile: recipe.sensory?.profile || null,
    texture: (recipe.sensory?.target_textures || recipe.sensory?.targetTextures || [])[0] || null,
    richness: classification.rich ? 'riche' : 'leger',
    temperature: classification.temperature,
    vegetarian: classification.vegetarian,
  })
  diversityCache.set(recipe, profile)
  return profile
}

/**
 * Une recette est-elle éligible pour remplir un créneau `dejeuner`/`diner`
 * comme PLAT PRINCIPAL ? C'est la porte d'entrée du catalogue vers le
 * solveur : filtrer trop peu, et un kouign-amann finit servi trois dîners
 * de suite (incident production, plan f84800ec) ; filtrer trop, et les
 * salades-repas ou plats uniques déclarés `complete` disparaissent.
 *
 * Deux règles cumulatives, dans cet ordre :
 *
 * 1. Rôle d'assiette DÉCLARÉ. Une recette dont le corpus déclare
 *    `plate: { role: 'dessert' }` — les 20 recettes sucrées marquées par
 *    l'agent des rôles — ne peut PAS occuper un créneau de repas comme plat
 *    principal. La recette reste au corpus et devient utilisable APRÈS un
 *    repas via `buildDessertComponent` : c'est exactement la demande
 *    utilisateur (« un dessert ne peut pas tenir lieu de repas », mais
 *    « peut être proposé après un repas »). La règle est STRICTEMENT INERTE
 *    tant que la déclaration n'est pas posée : la dérivation par
 *    catégorie/nom n'est PAS convoquée ici — ses motifs volontairement
 *    larges (« tarte aux ») feraient régresser des recettes salées.
 *
 * 2. Ancien filtre par catégorie (compatibilité). Certaines catégories
 *    (`petit dejeuner`, `entree`, `tartinade`, `sauce de base`,
 *    `accompagnement`) n'étaient pas des repas avant ce lot et ne le
 *    deviennent pas. On conserve le motif tel quel — l'invariance sur les
 *    970 tests existants passe par cette continuité, et il capte encore les
 *    desserts évidents par catégorie dans la fenêtre où l'agent des rôles
 *    n'a pas fini son travail.
 */
export function isMealSuitableRecipe(recipe) {
  const category = fold(recipe.category)
  if (/^dess-/.test(fold(recipe.code).replace(/ /g, '-'))) return false
  if (isDessertRecipe(recipe)) return false
  return !/(dessert|gateau|petit dejeuner|sauce de base|accompagnement|entree|tartinade|pate a choux sale|puree d aubergine)/.test(category)
}

export function violatesHardConstraints(recipe, constraints) {
  if (!recipe.eligible) return 'recipe_not_executable'
  // Même matcher que la personnalisation (foodBanMatch) : l'égalité stricte
  // sans pliage d'accents laissait passer « céleri » vs « celeri » et un
  // dislike « épinards » ne filtrait pas « épinard frais » à ce niveau.
  const allergies = constraints.allergens || []
  if ((recipe.allergens || []).some((value) => matchesBannedFood(value, allergies))) return 'allergen'
  const disliked = constraints.dislikedForms || []
  if ((recipe.exactIngredients || []).some((ingredient) => matchesBannedFood(ingredient.formNormalized, disliked))) return 'disliked_food'
  // Correspondance à frontières de mots (foodBanMatch) : le matching par
  // sous-chaînes bannissait « eau » via « veau »/« agneau » et le navet ou
  // l'oignon « nouveau » via « veau » (incident prod du 24/07).
  const forbidden = (constraints.forbiddenForms || []).filter(Boolean)
  if ((recipe.exactIngredients || []).some((ingredient) =>
    matchesBannedFood(ingredient.formNormalized, forbidden))) return 'forbidden_food'
  const diets = new Set((constraints.diets || []).map((value) => fold(value)))
  const classification = classifyRecipe(recipe)
  // Le régime végétarien se juge sur `vegetarian` — « toutes les origines
  // obligatoires sont compatibles » — et non sur « ni viande ni poisson ».
  // Les deux lectures diffèrent exactement là où l'information manque :
  // 'inconnu' (forme que le catalogue versionné ne connaît pas — le chemin
  // API sert des recettes de la base, dont les formes ne sont pas toutes
  // arbitrées) et 'animal:autre' (escargot, grenouille) ne sont ni viande ni
  // poisson, et la lecture faible les servait à un végétarien. Ce qui n'est
  // pas déclaré est absent : on refuse. C'est aussi la lecture que fait déjà
  // personalizedMeals.recipeAllowed — les deux portes disaient l'inverse
  // l'une de l'autre sur la même recette.
  if ([...diets].some((diet) => /vegetar/.test(diet)) && !classification.vegetarian) return 'vegetarian_diet'
  if ([...diets].some((diet) => /vegan|vegetalien/.test(diet))) {
    // Un plat végétalien est un plat végétarien dont aucune origine n'est de
    // celles que le végétalien refuse (œuf, lait, miel). On lit l'origine
    // déclarée, pas la catégorie : « Pâtes fraîches aux œufs » est rangé en
    // céréales, « Ghee » en matières grasses, et les deux lui sont interdits.
    if (!classification.vegetarian) return 'vegan_diet'
    if ((recipe.exactIngredients || []).some((ingredient) => !ingredient.optional && isVeganExcludedOrigin(ingredientOrigin(ingredient)))) return 'vegan_diet'
  }
  const maxMinutes = Number(constraints.maxMinutesByMeal?.[constraints.currentMealType] ?? constraints.maxTotalMinutes)
  if (Number.isFinite(maxMinutes) && recipe.prepMinutes + recipe.cookMinutes > maxMinutes) return 'time_limit'
  // Refus strict d'un membre du foyer (§5) : le refus l'emporte, on ne fait
  // pas la moyenne d'un interdit. Même statut qu'une allergie.
  if (constraints.tasteProfile && isTasteForbidden(recipe, constraints.tasteProfile, recipeDiversityProfile(recipe))) {
    return 'forbidden_taste'
  }
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
  return weeklyBalanceFor({
    balance: buildWeeklyBalance(constraints.weeklyBalance),
    totalSlots,
    vegetarianDiet: (constraints.diets || []).some((diet) => /vegetar|vegan|vegetalien/.test(fold(diet))),
  })
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
    if (!UNCAPPED_PROTEIN_FAMILIES.includes(protein)) add(`protein_repeat_${protein}`, count - targets.maxMealsPerProteinFamily)
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

/**
 * `engage` est la fourchette DÉJÀ ENGAGÉE par les créneaux décidés de cet état,
 * composée en quadrature (contrat §3.2). Elle est passée par l'appelant plutôt
 * que recalculée ici : elle ne dépend pas du candidat, et la recomposer pour
 * chacune des centaines de recettes du corpus serait payer cent fois le même
 * calcul.
 */
function evaluateCandidate(state, recipe, slot, constraints, targets, context, scale = 1, engage = null) {
  if (slot.fixedRecipeCode && recipe.code !== slot.fixedRecipeCode) return null
  if ((slot.excludedRecipeCodes || []).includes(recipe.code)) return null
  const intent = slot.intent || constraints.intent || 'balanced'
  if (!matchesIntent(recipe, intent)) return null
  const mealType = slot.mealType ?? slot.meal_type
  // Un dessert ne peut jamais remplir un créneau de repas comme plat
  // principal — même quand l'appelant a poussé la recette directement dans
  // `recipes` sans passer par le filtre `isMealSuitableRecipe`. Un créneau
  // FIGÉ sur un code dessert est en revanche respecté : c'est le libre
  // arbitre de l'utilisateur — le plan de fixed_recipe_code est un pacte.
  if (!slot.fixedRecipeCode && isDessertRecipe(recipe)) return null
  const hardFailure = violatesHardConstraints(recipe, { ...constraints, currentMealType: mealType })
  if (hardFailure) return null

  // Règles absolues de répétition (§3, lot 0). Trois régimes de filtrage :
  // `strict` toutes les règles écartent, `core` seul le socle écarte (le reste
  // devient pénalité), `off` aucune n'écarte — utilisé quand même le socle est
  // infaisable. Dans tous les cas les violations RESTENT attachées au créneau,
  // ce qui alimente `backup_meal` et place la semaine en `review_required`
  // plutôt que de la publier en silence (§4).
  const repetition = repetitionCandidateViolations(state, slot, recipe.code, MEAL_SOURCES.FRESH, context)
  const rejectingRepetition = violationsFilteringMode(repetition, context.repetitionMode)
  if (rejectingRepetition.length && !slot.fixedRecipeCode) return null

  const classification = classifyRecipe(recipe)
  const week = state.weeklySummary
  if (!slot.fixedRecipeCode && classification.fish && week.fish >= targets.fish) return null
  if (!slot.fixedRecipeCode && classification.meat && week.meat >= targets.meatMax) return null
  if (!slot.fixedRecipeCode
    && !UNCAPPED_PROTEIN_FAMILIES.includes(classification.mainProtein)
    && (week.proteins.get(classification.mainProtein) || 0) >= targets.maxMealsPerProteinFamily) return null

  const allocation = allocateRecipe(recipe, state.availability, slot.date, scale)
  if (!constraints.allowShopping && allocation.shortages.length) return null
  const sensory = sensoryTransitionPenalty(state.recipes.at(-1), recipe, state.recipes)
  // Dimension « euros » (§budget) : la part d'enveloppe qui revient à ce
  // créneau, et ce que le candidat en dépense. `null` sans enveloppe — la
  // pénalité est alors strictement celle d'avant.
  const budget = context.budget?.active
    ? evaluerCreneauBudget(context.budget, {
      engage,
      slotIndex: context.slotIndexByKey.get(slot.key) ?? state.slots.length,
      slotCount: context.slotCount,
      cout: coutCreneau(context.budget, recipe, scale),
    })
    : null
  const penalties = slotPenalty(recipe.nutritionPerServing, constraints.targetByMeal?.[mealType] || constraints.targetPerMeal, budget)
  const nutrition = penalties.total
  const shoppingPenalty = allocation.requiredGrams > 0 ? (1 - allocation.coverage) * (intent === 'stock' ? 52 : 32) : 0
  // BATCH COOKING PAR BASE PARTAGÉE (sharedBases.js). Ce que ce plat doit
  // cuire, ce qu'il reprend d'une base déjà produite par cet état, et le temps
  // que cela change. La décision ne dépend PAS de `scale` : doubler les
  // quantités d'une sauce tomate ne double pas le temps de la faire (piège n° 6
  // de CLAUDE.md), et c'est très exactement pourquoi le procédé fonctionne.
  const sharedBases = context.baseCatalog
    ? planSlotBases({
      recipe,
      baseStock: state.baseStock,
      date: slot.date,
      catalog: context.baseCatalog,
      maxMealsPerSharedBase: context.rules.maxMealsPerSharedBase,
    })
    : EMPTY_SLOT_BASES
  // Le temps ACTIF réel du créneau : la préparation du plat, plus ce que sa base
  // lui coûte ce soir — ses minutes entières s'il faut la cuire, quelques
  // minutes de reprise si elle est déjà au réfrigérateur. C'est ce chiffre-là,
  // et non `prepMinutes` seul, qui doit porter la pénalité de temps : sans quoi
  // un plat qui ouvre une base et un plat qui la reprend coûteraient pareil, et
  // le moteur n'aurait aucune raison de mutualiser.
  const activeMinutes = (Number(recipe.prepMinutes) || 0) + sharedBases.addedActiveMinutes
  const timePenalty = Math.max(0, activeMinutes - (constraints.preferredActiveMinutes || 30)) * (intent === 'quick' ? .45 : .15)
  // Bonus de mutualisation d'une base, au MÊME barème que celui des portions
  // (MUTUALISATION_WEIGHT) : une minute économisée vaut la même chose qu'elle
  // soit gagnée sur une portion ou sur une base. `bonusMinutes` est nul pour une
  // base qui dépasse son plafond — l'économie reste physiquement vraie, elle
  // cesse simplement d'être récompensée (cf. sharedBases.js, décision (c)).
  //
  // CE QUE CE BONUS RÉCOMPENSE AU JUSTE, parce que la question se pose. Il
  // compare ce plat À LUI-MÊME : le même plat, le même soir, selon que sa base
  // est déjà au réfrigérateur ou qu'il faut la faire. Il ne compare pas ce plat
  // à un plat sans base — face à un plat qui n'en emploie aucune, celui qui
  // reprend une base coûte encore ses quelques minutes de reprise, et le bonus
  // le fait quand même passer devant. Ce n'est pas une erreur d'arbitrage :
  // une base cuite est une quantité de nourriture RÉELLE au réfrigérateur, avec
  // sa DLC. Ne pas s'en servir, c'est la jeter. Le moteur traite déjà les restes
  // exactement ainsi — un plat cuisiné disponible vaut 48 points plus une prime
  // d'urgence et bat n'importe quelle cuisson fraîche. Les 17 points d'une base
  // reprise sont, à côté, une préférence modérée.
  const sharedBaseBonus = sharedBases.bonusMinutes * SHARED_BASE_MINUTE_WEIGHT
  const stockReward = allocation.coverage * (intent === 'stock' ? 48 : 28)
  const wasteReward = Math.min(allocation.urgencyCredit / 100, intent === 'stock' ? 32 : 20)
  const cuisineRepeat = state.recipes.slice(-3).filter((item) => item.cuisineOrigin === recipe.cuisineOrigin).length * 5
  const recipeRepeatCount = state.recipes.filter((item) => item.code === recipe.code).length
  const recipeRepeatPenalty = recipeRepeatCount * 36 + (state.recipes.at(-1)?.code === recipe.code ? 60 : 0)
  const recentPenalty = (constraints.recentRecipeTitles || []).includes(fold(recipe.family)) ? 28 : 0
  const quotaScore = quotaProgressScore(week, recipe, targets)
  // Délais de retour (§3) et regroupements sensoriels (§11) : pénalités
  // SOUPLES, calculées sur l'historique réel des semaines précédentes. Elles
  // orientent le choix sans jamais rendre une semaine infaisable.
  const diversity = recipeDiversityProfile(recipe)
  // Délai de retour demandé par le foyer pour CE plat (§5 : « quels plats
  // peuvent revenir chaque semaine, quels plats une fois par mois »). Il prend
  // le pas sur le délai générique des règles de répétition.
  const requestedDelay = requestedRepeatDelayDays(recipe, context.tasteProfile)
  const historyRules = requestedDelay == null
    ? context.rules
    : { ...context.rules, returnDelays: { ...context.rules.returnDelays, exactRecipeDays: requestedDelay } }
  const history = historyReturnPenalty({ history: context.history, diversity, date: slot.date, rules: historyRules })
  const proximity = proximityWarnings({ plannedSlots: state.slots, diversity, rules: context.rules })
  const proximityPenalty = proximity.length * 12
  // Critère « Goût » de la fonction de notation (§10) : maximiser
  // l'acceptation. Positif quand le foyer apprécie, négatif quand il subit.
  const taste = tasteScore(recipe, context.tasteProfile, diversity)
  // Équilibre habitudes / nouveautés (§6). Modeste par construction : il
  // départage des candidats comparables, il ne renverse jamais un stock urgent
  // ni un goût marqué. Une découverte n'est JAMAIS interdite par le quota.
  const isDiscovery = !context.history?.lastUsedByRecipe?.[recipe.code]
  const discoveryAdjustment = discoveryScoreAdjustment({
    isDiscovery,
    discoveriesSoFar: state.slots.filter((planned) => planned.mealStatus === 'new_meal').length,
    target: context.discoveryTarget,
  })
  // Mode dégradé uniquement : une règle absolue franchie coûte plus cher que
  // n'importe quel gain de stock ou de nutrition, pour que le solveur ne la
  // franchisse que faute de toute autre issue.
  const violationPenalty = repetition.length * 500
  const score = stockReward + wasteReward + quotaScore + seasonalBonus(recipe, slot.date) + taste.total
    + discoveryAdjustment + sharedBaseBonus
    - sensory.total - nutrition - shoppingPenalty - timePenalty - cuisineRepeat
    - recipeRepeatPenalty - recentPenalty - history.total - proximityPenalty - violationPenalty
    - sharedBases.ceilingPenalty
  return {
    score,
    allocation,
    sharedBases,
    activeMinutes,
    sensory,
    nutritionPenalty: penalties.nutritionnel,
    budget,
    // Ce que l'enveloppe a retiré à ce candidat, isolé du reste : c'est lui qui
    // permet de rejouer le classement « sans enveloppe » et donc de dire ce que
    // le budget a fait renoncer (§explication).
    budgetPenalty: penalties.euros,
    recipeRepeatCount,
    diversity,
    repetition,
    explanations: [
      ...sensory.reasons,
      ...(recipeRepeatCount ? ['recipe_repeated'] : []),
      ...history.reasons.map((reason) => reason.code),
      ...proximity.map((warning) => warning.code),
      ...repetition.map((violation) => violation.code),
    ],
    tasteReasons: taste.reasons,
  }
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
function selectProductionConsumers(state, recipe, slot, slots, slotIndex, dishPool, dishIndexes, constraints, targets, sessionBudget, context) {
  if (slot.fixedRecipeCode) return null
  if (state.productionsUsed >= MAX_PLAN_PRODUCTIONS) return null
  // Première et deuxième questions du batch (audit §12) : le plat est-il
  // intéressant à préparer en quantité, et supporte-t-il réellement le
  // réchauffage ? Un plat servi froid, une friture, des pâtes déjà mélangées à
  // leur sauce se dégradent — le plan les cite nommément. Une recette dont la
  // composition n'est pas documentée n'entre pas non plus dans le moteur
  // avancé : elle reste cuisinée fraîche.
  if (!isBatchCandidate(recipe)) return null
  // Sans durée de conservation DÉCLARÉE, pas de production : on ne sait pas
  // jusqu'à quand les portions se mangent, et on ne le devine plus (ni trois
  // jours par défaut, ni lecture de la prose). `productionRefusalReason`
  // porte le motif ; ici on s'abstient.
  const shelfLifeDays = productionShelfLifeDays(recipe)
  if (shelfLifeDays == null) return null
  const prepMinutes = Number(recipe.prepMinutes) || 0
  const activeMinutesSaved = prepMinutes - REHEAT_ACTIVE_MINUTES
  if (activeMinutesSaved <= 0) return null
  const classification = classifyRecipe(recipe)
  let maxMeals = 1 + MAX_PRODUCTION_CONSUMERS
  // Même liste d'exemption que le plafond hebdomadaire par famille : une
  // copie locale de cette liste a laissé 'inconnu' plafonné ici alors qu'il
  // ne l'était plus là-bas.
  if (!UNCAPPED_PROTEIN_FAMILIES.includes(classification.mainProtein)) {
    maxMeals = Math.min(maxMeals, 2 - (state.weeklySummary.proteins.get(classification.mainProtein) || 0))
  }
  if (classification.fish) maxMeals = Math.min(maxMeals, targets.fish - state.weeklySummary.fish)
  if (classification.meat) maxMeals = Math.min(maxMeals, targets.meatMax - state.weeklySummary.meat)
  if (maxMeals < 2) return null
  const useBy = addDaysIso(slot.date, shelfLifeDays)
  // Congeler puis décongeler coûte du temps actif : un repas congelé n'entre
  // en jeu que si l'économie nette reste positive.
  const frozenMinutesSaved = activeMinutesSaved - FREEZE_TASK_MINUTES - DEFROST_TASK_MINUTES
  const freezerUseBy = isRecipeFreezable(recipe) && frozenMinutesSaved > 0
    ? addDaysIso(slot.date, freezerShelfLifeDays(recipe))
    : null
  const consumers = []
  const frozenConsumers = []
  // Chronologie de placement des portions (§12 : « où placer les portions sans
  // casser la diversité ? »). Le producteur occupe son propre index, chaque
  // consommateur retenu le sien : les règles absolues sont donc évaluées sur la
  // distance RÉELLE en repas, avant même que les créneaux intermédiaires soient
  // décidés. C'est ce qui interdit les six portions consommées quatre repas de
  // suite.
  const timeline = new Array(slots.length).fill(null)
  state.slots.forEach((planned, index) => { timeline[index] = planned })
  // `mealType` est indispensable : c'est lui qui distingue le déjeuner du dîner
  // dans la position absolue du repas. Sans lui, deux créneaux d'une même
  // journée se confondent et la distance en repas est sous-évaluée.
  timeline[slotIndex] = {
    recipeCode: recipe.code,
    date: slot.date,
    mealType: slot.mealType ?? slot.meal_type,
    source: MEAL_SOURCES.FRESH,
  }
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
    // Un consommateur de production planifiée reprend le même filtrage que les
    // candidats frais : `strict` bloque tout, `core` ne laisse passer que les
    // configurations conformes au socle, `off` accepte (une violation sera
    // signalée via `repetitionViolations` sur le créneau consommateur).
    const productionRepetition = repetitionViolations({
      plannedSlots: timeline.slice(0, index),
      date: candidate.date,
      mealType: candidate.mealType ?? candidate.meal_type,
      recipeCode: recipe.code,
      lineage: recipeLineage(recipe),
      source: MEAL_SOURCES.PLANNED_PRODUCTION,
      rules: context.rules,
    })
    if (violationsFilteringMode(productionRepetition, context.repetitionMode).length) continue
    if (dishPool.length && pickDishCandidate(state, candidate, dishPool, dishIndexes, constraints, context)) continue
    timeline[index] = {
      recipeCode: recipe.code,
      lineage: recipeLineage(recipe),
      date: candidate.date,
      mealType: candidate.mealType ?? candidate.meal_type,
      source: MEAL_SOURCES.PLANNED_PRODUCTION,
    }
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
function consumeProductionState(state, slot, cover, recipe, constraints, context) {
  const mealType = slot.mealType ?? slot.meal_type
  const productionViolations = context
    ? repetitionCandidateViolations(state, slot, recipe.code, MEAL_SOURCES.PLANNED_PRODUCTION, context)
    : []
  const penalty = slotPenalty(recipe.nutritionPerServing, constraints.targetByMeal?.[mealType] || constraints.targetPerMeal).total
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
    // Comme pour un reste : la base d'une production a été cuite au créneau
    // producteur, avec le reste de la série. Le consommateur n'en refait pas.
    baseStock: state.baseStock,
    // Les portions ont été payées par le créneau PRODUCTEUR, qui a réservé les
    // ingrédients de toute la série. Les recompter ici facturerait le même
    // gigot quatre fois.
    costRanges: state.costRanges,
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
      diversity: recipeDiversityProfile(recipe),
      mealStatus: classifyMealStatus({ source: MEAL_SOURCES.PLANNED_PRODUCTION, degraded: productionViolations.length > 0 }),
      repetitionViolations: productionViolations,
      source: 'planned_production',
      productionKey: cover.productionKey,
      producerSlotKey: cover.producerSlotKey,
      productionPortions: Number(recipe.servings),
      // Portion sortie du congélateur (audit P3 item 5) : la clé n'existe
      // JAMAIS pour une couverture réfrigérateur — les plans sans congélation
      // restent octet pour octet identiques au lot P2.
      ...(cover.storage === 'freezer' ? { storageMethod: 'freezer' } : {}),
      ...(context?.budget?.active ? { budget: creneauGratuit('production_deja_reservee') } : {}),
    }],
  }
}

function runBeamSearch({ slots, recipes, inventoryLots, existingReservations, cookedDishes, existingDishReservations, constraints, beamWidth, context }) {
  const targets = weeklyTargets(constraints, slots.length)
  const dishPool = buildDishAvailability(cookedDishes, existingDishReservations)
  const dishIndexes = dishPool.length ? dishRecipeIndexes(recipes) : null
  const recipeByCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  // Capacité temporelle (audit P3 item 6) : les jours avec un déjeuner
  // planifié « sur place » laissent moins de temps libre pour cuisiner.
  const datesWithLunch = new Set(slots
    .filter((slot) => (slot.mealType ?? slot.meal_type) === 'dejeuner')
    .map((slot) => slot.date))
  // `costRanges` : les fourchettes de coût des créneaux déjà décidés par cet
  // état. On garde les LIGNES, jamais un cumul de bornes — c'est
  // `composerFourchettes` qui les recolle en quadrature au moment voulu (§3.2).
  // `baseStock` : les bases partagées déjà produites par cet état, avec leur
  // date de péremption (sharedBases.js). Vide et gelée tant qu'aucune recette
  // n'en déclare — une semaine sans base partagée ne paie donc rien.
  let beam = [{ score: 0, availability: buildAvailability(inventoryLots, existingReservations), recipes: [], slots: [], usedCodes: new Set(), weeklySummary: emptyWeekSummary(), dishPortionsUsed: new Map(), productionCovers: new Map(), productionsUsed: 0, sessionMinutes: new Map(), baseStock: EMPTY_BASE_STOCK, costRanges: [] }]

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
        expanded.push(consumeProductionState(state, slot, cover, recipeByCode.get(cover.recipeCode), constraints, context))
        continue
      }
      // Pré-passe restes (audit §2 / §10 étape 3) : un plat déjà cuisiné qui
      // couvre le créneau BAT toute cuisson fraîche — tant qu'il ne franchit
      // aucune règle absolue de répétition (§3). Déterministe : un seul
      // candidat, le premier en ordre FEFO qui reste conforme.
      const dishCandidate = dishPool.length ? pickDishCandidate(state, slot, dishPool, dishIndexes, constraints, context) : null
      if (dishCandidate) {
        expanded.push(consumeDishState(state, slot, dishCandidate, constraints, context))
        continue
      }
      // Fourchette engagée par cet état : composée UNE fois, pas une fois par
      // recette candidate.
      const engage = context.budget?.active ? composerFourchettes(state.costRanges) : null
      // Le renoncement du budget (§explication). On suit deux têtes de
      // classement : celle du score réel, et celle qu'on aurait eue sans le
      // terme euros. Quand elles diffèrent, l'enveloppe a bel et bien décidé —
      // et c'est cela, et rien d'autre, qu'on a le droit de raconter.
      const debut = expanded.length
      let teteAvec = null
      let teteSans = null
      const retenirTete = (tete, recipe, score, evaluated) => (!tete || score > tete.score
        || (score === tete.score && String(recipe.code).localeCompare(String(tete.code)) < 0)
        ? { code: recipe.code, title: recipe.family, score, range: evaluated.budget?.range || null }
        : tete)
      for (const recipe of recipes) {
        const evaluated = evaluateCandidate(state, recipe, slot, constraints, targets, context, 1, engage)
        if (!evaluated) continue
        if (context.budget?.active) {
          teteAvec = retenirTete(teteAvec, recipe, evaluated.score, evaluated)
          teteSans = retenirTete(teteSans, recipe, evaluated.score + evaluated.budgetPenalty, evaluated)
        }
        const usedCodes = new Set(state.usedCodes)
        usedCodes.add(recipe.code)
        const freshSessionMinutes = new Map(state.sessionMinutes)
        // Le créneau consomme ses minutes actives RÉELLES : sa préparation, plus
        // ce que sa base lui coûte — pleine si elle est cuite ici, réduite à la
        // reprise si un créneau antérieur l'a déjà produite. C'est par là que
        // « cuire une base une fois pour trois plats » devient un vrai gain dans
        // le plafond de session (resolveSessionCapMinutes) et non un décor : le
        // budget rendu aux jours suivants est celui qu'on n'a pas dépensé.
        freshSessionMinutes.set(sessionKey, sessionUsed + evaluated.activeMinutes)
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
          baseStock: applySharedBaseStock(state.baseStock, evaluated.sharedBases, { date: slot.date, slotKey: slot.key }),
          costRanges: evaluated.budget?.range ? [...state.costRanges, evaluated.budget.range] : state.costRanges,
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
            explanations: evaluated.explanations,
            diversity: evaluated.diversity,
            source: MEAL_SOURCES.FRESH,
            mealStatus: classifyMealStatus({
              source: MEAL_SOURCES.FRESH,
              recipeCode: recipe.code,
              history: context.history,
              degraded: evaluated.repetition.length > 0,
            }),
            repetitionViolations: evaluated.repetition,
            tasteReasons: evaluated.tasteReasons,
            ...(evaluated.budget ? { budget: evaluated.budget } : {}),
            // Clé ABSENTE quand le plat n'emploie aucune base (doctrine du lot
            // congélation : « les plans sans congélation restent octet pour
            // octet identiques »). Les 589 recettes du corpus actuel n'en
            // déclarent aucune : leurs plans ne changent pas d'un caractère.
            ...(evaluated.sharedBases.codes.length ? { sharedBases: evaluated.sharedBases } : {}),
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
        // Les minutes de la base sont déjà engagées dans la session : la
        // stratégie de production doit compter avec ce qui RESTE, sinon elle
        // promettrait un batch dans un créneau horaire qui n'existe plus. Une
        // base reprise (quelques minutes) laisse au contraire de la place pour
        // un batch que sa cuisson complète aurait interdit — les deux formes de
        // mutualisation se financent l'une l'autre.
        const strategy = selectProductionConsumers(state, recipe, slot, slots, slotIndex, dishPool, dishIndexes, constraints, targets, { used: sessionUsed + evaluated.sharedBases.addedActiveMinutes, cap: sessionCap }, context)
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
          const batchEvaluated = evaluateCandidate(state, recipe, slot, constraints, targets, context, variant.scale, engage)
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
          batchSessionMinutes.set(sessionKey, sessionUsed + variant.activeMinutes + batchEvaluated.sharedBases.addedActiveMinutes)
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
            baseStock: applySharedBaseStock(state.baseStock, batchEvaluated.sharedBases, { date: slot.date, slotKey: slot.key }),
            // Le créneau producteur porte le coût de TOUTE la série : ses
            // consommateurs ne paieront rien (cf. `consumeProductionState`).
            costRanges: batchEvaluated.budget?.range ? [...state.costRanges, batchEvaluated.budget.range] : state.costRanges,
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
              explanations: batchEvaluated.explanations,
              diversity: batchEvaluated.diversity,
              source: MEAL_SOURCES.FRESH,
              mealStatus: classifyMealStatus({
                source: MEAL_SOURCES.FRESH,
                recipeCode: recipe.code,
                history: context.history,
                degraded: batchEvaluated.repetition.length > 0,
              }),
              repetitionViolations: batchEvaluated.repetition,
              tasteReasons: batchEvaluated.tasteReasons,
              ...(batchEvaluated.budget ? { budget: batchEvaluated.budget } : {}),
              ...(batchEvaluated.sharedBases.codes.length ? { sharedBases: batchEvaluated.sharedBases } : {}),
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
      // Ce à quoi l'enveloppe a fait renoncer, inscrit sur les créneaux de CET
      // état. La comparaison n'a de sens que si le plat retenu est bien celui
      // que le score complet désigne : sinon le budget n'est pour rien dans
      // l'écart, et lui en attribuer le mérite serait raconter une histoire
      // fausse — le défaut exact que planExplanation.js s'interdit.
      if (teteAvec && teteSans && teteAvec.code !== teteSans.code) {
        for (let index = debut; index < expanded.length; index += 1) {
          const dernier = expanded[index].slots.at(-1)
          if (dernier.recipeCode !== teteAvec.code) continue
          dernier.budgetForgone = {
            recipeCode: teteSans.code,
            title: teteSans.title,
            costRange: teteSans.range,
            /** Ce que le renoncement a économisé sur la borne d'arbitrage, ou `null` si le plat écarté n'était pas chiffré. */
            savedEur: teteSans.range && dernier.budget?.range
              ? round(teteSans.range.high - dernier.budget.range.high, 2)
              : null,
          }
        }
      }
    }
    expanded.sort((a, b) => b.score - a.score || a.slots.at(-1).recipeCode.localeCompare(b.slots.at(-1).recipeCode))
    beam = expanded.slice(0, beamWidth)
    if (!beam.length) return { status: 'review_required', slots: [], reservations: [], shoppingItems: [], issues: [{ severity: 'blocker', code: 'no_feasible_plan', slot }] }
  }

  // Classement final à l'ÉCHELLE DE LA SEMAINE (audit §9-§10) : les violations
  // de règles absolues dominent tout — une semaine conforme mais imparfaite
  // passe toujours devant une semaine mieux notée qui répète un plat. Viennent
  // ensuite les déficits de quotas, puis le score cumulé.
  const ranked = beam.map((state) => {
    const weeklySummary = state.weeklySummary
    const deficits = weeklyDeficits(weeklySummary, targets)
    const deficitWeight = deficits.reduce((sum, item) => sum + item.missing, 0)
    const audit = auditWeekRepetition({ slots: state.slots, rules: context.rules, history: context.history })
    return { ...state, weeklySummary, deficits, deficitWeight, audit }
  }).sort((a, b) => a.audit.blockers.length - b.audit.blockers.length
    || a.deficitWeight - b.deficitWeight
    || b.score - a.score)
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
  // Contrôle avant publication (audit §17) : les règles absolues sont rejouées
  // sur le plan RETENU, pas seulement au moment du filtrage. Une violation
  // résiduelle — mode dégradé, créneau figé hérité d'une ancienne version —
  // devient une issue BLOQUANTE : la version part en revue au lieu d'être
  // publiée en silence (§4, lot 0).
  const audit = best.audit
  /**
   * LE REPLI QUAND L'ENVELOPPE EST INTENABLE.
   *
   * Le budget ne bloque pas et n'échoue pas : la meilleure semaine possible est
   * rendue, avec son montant, et le fait que l'enveloppe a cédé devient une
   * issue bloquante nommée. Une semaine servable qu'on refuserait de rendre au
   * motif qu'elle coûte 3 € de trop serait un service pire que rien.
   *
   * POURQUOI IL N'Y A PAS DE CASCADE DE BUDGET, alors que la répétition en a
   * une. La leçon du correctif de découplage est qu'un échec sur un axe ne doit
   * pas relâcher les autres — « rater le plancher protéique se signale sans
   * jamais autoriser une répétition ». Le budget hérite exactement de cette
   * règle, dans les deux sens :
   *
   * - il ne déclenche RIEN. La cascade strict → core → off se décide sur la
   *   COMPLÉTUDE de la semaine (`slots.length`), jamais sur son statut : une
   *   enveloppe dépassée ne peut donc pas, même par accident, faire tomber une
   *   règle de répétition.
   * - il n'est relâché PAR rien. Ce qui cède, c'est le montant, et c'est le
   *   montant qu'on annonce.
   *
   * Ce qu'on a ÉCARTÉ : une seconde passe qui relèverait le poids de la
   * dimension euros pour forcer une semaine sous l'enveloppe. Elle existerait
   * et elle marcherait — au prix de la nutrition, sans que personne l'ait
   * demandé. L'utilisateur a réglé un plafond de dépense, pas un mandat pour
   * manger moins bien ; et doubler le faisceau à chaque semaine serrée coûterait
   * cher pour une décision qui ne lui appartient pas.
   */
  const budget = context.budget ? rapportBudget(context.budget, best.slots) : null
  const budgetIssues = budget?.exceeds
    ? [{
      severity: 'blocker',
      code: BUDGET_ISSUE_CODES.EXCEEDED,
      details: {
        envelopeEur: budget.envelopeEur,
        estimateCentralEur: round(budget.estimate.central, 2),
        overrunEur: round(budget.overrunEur, 2),
        arbitrationBound: budget.arbitrationBound,
        coveragePct: budget.coveragePct,
        // Un dépassement CONSTATÉ SUR UN MINORANT est un dépassement certain :
        // les repas non chiffrés ne peuvent qu'ajouter. L'inverse ne vaut pas,
        // et c'est pourquoi une enveloppe apparemment tenue à couverture
        // partielle ne produit, elle, aucune issue rassurante.
        minorant: budget.minorant,
        reason: budget.sentence,
      },
    }]
    : []
  /**
   * LE REPLI QUAND LE PLAFOND DE MUTUALISATION NE TIENT PAS (sharedBases.js).
   *
   * Il hérite mot pour mot du statut du budget, et pour la même raison : c'est
   * un axe de plus, et un axe qui échoue ne relâche pas les autres. Le plafond
   * de repas par base ne déclenche AUCUN relâchement des règles de répétition —
   * la cascade strict → core → off se décide sur la seule complétude de la
   * semaine — et aucun relâchement de celles-ci ne le desserre. Une semaine où
   * quatre plats se sont appuyés sur la même sauce est rendue, servable, avec le
   * nom de la base qui a trop porté : `shared_base_over_used`.
   *
   * Ce qu'on a ÉCARTÉ : en faire une contrainte dure qui écarterait le candidat.
   * Elle rendrait des semaines infaisables sur un corpus où les bases sont rares
   * — et surtout elle interdirait le repli le plus utile qui soit, celui où
   * l'utilisateur préfère une semaine un peu monotone à une heure de cuisine
   * chaque soir. Le plafond dit ce qui s'est passé ; il ne décide pas à sa place.
   */
  const sharedBases = context.baseCatalog
    ? auditSharedBases({ slots: best.slots, maxMealsPerSharedBase: context.rules.maxMealsPerSharedBase })
    : null
  return {
    status: audit.compliant && !budget?.exceeds && (sharedBases?.compliant ?? true) ? 'published' : 'review_required',
    score: round(best.score, 2),
    slots: best.slots,
    reservations,
    shoppingItems: [...shoppingByForm.values()].map((item) => ({ ...item, grams: round(item.grams) })),
    // Clé absente sans enveloppe demandée : un plan sans budget est celui d'avant.
    ...(budget ? { budget } : {}),
    // Idem : clé absente quand aucune recette n'emploie de base partagée.
    ...(sharedBases && sharedBases.usage.length
      ? { sharedBases: { usage: sharedBases.usage, savedActiveMinutes: sharedBases.savedActiveMinutes } }
      : {}),
    issues: [
      ...best.deficits.map((deficit) => ({ severity: 'warning', code: deficit.code, missing: deficit.missing })),
      ...audit.blockers,
      ...audit.warnings,
      ...budgetIssues,
      ...(sharedBases?.issues || []),
    ],
    objectiveScores: {
      globalScore: round(best.score, 2),
      stockCoverage: round(best.slots.reduce((sum, slot) => sum + slot.stockCoverage, 0) / Math.max(best.slots.length, 1), 4),
      shoppingItemCount: shoppingByForm.size,
      sensoryRuleViolations: best.slots.reduce((sum, slot) => sum + slot.explanations.length, 0),
      weeklyRuleViolations: best.deficits.length,
      repetitionViolations: audit.blockers.length,
      diversityScore: audit.diversity.score == null ? null : round(audit.diversity.score, 4),
      diversityBalance: audit.diversity.balance == null ? null : round(audit.diversity.balance, 4),
      diversityDimensions: Object.fromEntries(Object.entries(audit.diversity.dimensions)
        .map(([dimension, entry]) => [dimension, {
          distinct: entry.distinct,
          documented: entry.documented,
          dominant: entry.dominant,
          dominant_share: entry.dominantShare == null ? null : round(entry.dominantShare, 4),
        }])),
      familiarity: audit.familiarity,
      // Équilibre habitudes/nouveautés mesuré contre la cible du foyer (§6).
      discovery: discoveryBalance({ slots: best.slots, target: context.discoveryTarget }),
      weeklyTargets: targets,
      weeklyActual: {
        fish: best.weeklySummary.fish, meat: best.weeklySummary.meat, vegetarian: best.weeklySummary.vegetarian,
        redMeat: best.weeklySummary.redMeat, fattyFish: best.weeklySummary.fattyFish, legumes: best.weeklySummary.legumes,
        cuisines: best.weeklySummary.cuisines.size, proteins: best.weeklySummary.proteins.size,
      },
    },
  }
}

/**
 * Planificateur déterministe en boucle fermée.
 *
 * Trois passes en cascade (audit §4, lot 0 — correctif de découplage). Chaque
 * relâchement est une DÉGRADATION distincte, motivée séparément, pour qu'on
 * ne puisse pas lire une répétition autorisée comme la conséquence d'un objectif
 * nutritionnel raté ni l'inverse :
 *
 * 1. STRICTE — toutes les règles absolues de répétition (§3) filtrent les
 *    candidats. C'est le mode nominal : la semaine publiée ne peut contenir un
 *    même plat au déjeuner et au dîner, ni deux consommations enchaînées, ni
 *    une seconde cuisson de la même recette, ni un délai de retour non respecté.
 *
 * 2. CORE — déclenchée si `strict` ne remplit pas la semaine. Seul le SOCLE
 *    reste dur : même jour, repas contigus, seconde cuisson, variantes de la
 *    même lignée. Les règles souples (distance ≥ 2 repas, plafond 3
 *    consommations, fenêtre glissante) deviennent des pénalités. La semaine est
 *    publiable mais MARQUÉE `review_required` avec `repetition_rules_softened` :
 *    « on a préservé le socle, un délai de retour a cédé ». C'est la passe qui
 *    empêche la « pizza margherita trois fois » de revenir dès qu'un objectif
 *    nutritionnel force la main.
 *
 * 3. OFF — déclenchée si même `core` ne remplit pas la semaine (corpus
 *    réellement infaisable ou contraintes conjointes irrésolubles). Toutes les
 *    règles cèdent, la semaine part en `review_required` avec
 *    `repetition_rules_relaxed`. Motif distinct de `_softened` : on veut lire à
 *    l'affichage « le socle a cédé, pas seulement un délai ».
 *
 * Le rôle des protéines et de la nutrition — traitées ailleurs, dans
 * `personalizedMeals.js` — reste ORTHOGONAL à cette cascade : rater le
 * plancher protéique se signale via `daily_protein_floor` sans jamais autoriser
 * une répétition. C'est le contrat que ce correctif verrouille.
 *
 * L'ENVELOPPE BUDGÉTAIRE hérite exactement du même statut, et la cascade le lui
 * donne gratuitement : elle se décide sur `slots.length`, c'est-à-dire sur la
 * COMPLÉTUDE de la semaine, jamais sur son statut. Une enveloppe dépassée ne
 * peut donc pas déclencher un relâchement des règles de répétition, ni être
 * relâchée par lui. Elle se signale seule, via `budget_envelope_exceeded`.
 */
export function generateClosedLoopPlan({
  slots,
  recipes,
  inventoryLots = [],
  existingReservations = [],
  cookedDishes = [],
  existingDishReservations = [],
  constraints = {},
  beamWidth = 24,
  repetitionRules = null,
  history = EMPTY_PLANNING_HISTORY,
  // Recettes des BASES partagées (sharedBases.js). Elles vivent à part de
  // `recipes` parce qu'une base n'est pas un plat : `isMealSuitableRecipe`
  // écarte les catégories « sauce de base » et « accompagnement » du catalogue
  // des repas, et c'est très bien — une sauce tomate ne doit jamais occuper un
  // dîner. Il faut pourtant connaître sa recette pour savoir ce qu'elle coûte en
  // minutes et combien de temps elle se garde. Défaut vide : sans elles, le
  // moteur est identique à ce qu'il était.
  baseRecipes = [],
}) {
  const rules = repetitionRules ? buildRepetitionRules(repetitionRules) : buildRepetitionRules(DEFAULT_REPETITION_RULES)
  const baseContext = {
    rules,
    tasteProfile: constraints.tasteProfile || EMPTY_TASTE_PROFILE,
    discoveryTarget: constraints.discoveryTarget || null,
    history: history || EMPTY_PLANNING_HISTORY,
    slotIndexByKey: new Map(slots.map((slot, index) => [slot.key, index])),
    slotByKey: new Map(slots.map((slot) => [slot.key, slot])),
    slotCount: slots.length,
    // Enveloppe hebdomadaire (§budget). `null` quand rien n'est demandé, et
    // c'est le cas nominal : le moteur est alors identique à ce qu'il était.
    // Le contexte est construit UNE fois pour les trois passes de la cascade —
    // elles évaluent le même corpus, et chiffrer une recette n'a pas à être
    // refait trois fois.
    budget: buildBudgetContext(constraints.budget),
    // Lignée de chaque recette, résolue une fois pour toute la recherche : les
    // règles de répétition raisonnent par code, et sans cette table elles ne
    // verraient pas qu'une variante dérivée et la recette DONT ELLE DÉRIVE sont
    // le même plat. À ne pas confondre avec une base partagée (sharedBases.js),
    // qui relie au contraire deux plats DIFFÉRENTS par un travail commun et qui
    // n'entre jamais dans cette table.
    lineageByCode: new Map(recipes.map((recipe) => [recipe.code, recipeLineage(recipe)])),
    // Catalogue des bases exploitables, construit UNE fois pour les trois
    // passes de la cascade : elles évaluent le même corpus. `null` quand aucune
    // recette du plan n'emploie de base — le chemin est alors court-circuité
    // partout, et une semaine sans base partagée ne change pas de comportement.
    baseCatalog: recipes.some(usesSharedBase)
      ? buildSharedBaseCatalog(recipes, baseRecipes)
      : null,
  }
  const input = { slots, recipes, inventoryLots, existingReservations, cookedDishes, existingDishReservations, constraints, beamWidth }

  const strict = runBeamSearch({ ...input, context: { ...baseContext, repetitionMode: REPETITION_MODES.STRICT } })
  if (strict.slots.length === slots.length) return strict

  // Passe intermédiaire : seul le socle des règles absolues reste dur. On
  // préserve « pas deux fois le même plat le même jour ni le lendemain, pas
  // deux cuissons de la même recette, pas deux variantes de la même lignée »
  // — mais on tolère un délai de retour non respecté quand le corpus l'impose.
  const core = runBeamSearch({ ...input, context: { ...baseContext, repetitionMode: REPETITION_MODES.CORE } })
  if (core.slots.length === slots.length) {
    return {
      ...core,
      status: 'review_required',
      issues: [
        ...(core.issues || []),
        {
          severity: 'blocker',
          code: 'repetition_rules_softened',
          details: {
            reason: 'Le corpus ne permet aucune semaine strictement conforme aux délais de retour ; les règles souples ont été relâchées, mais le socle (même jour, repas contigus, seconde cuisson, lignée) reste tenu.',
          },
        },
      ],
    }
  }

  // Dernière passe : plus aucune règle n'écarte un candidat. Motif distinct de
  // la passe précédente — c'est le socle lui-même qui cède, la couche
  // supérieure doit pouvoir le distinguer d'un simple délai relâché.
  const off = runBeamSearch({ ...input, context: { ...baseContext, repetitionMode: REPETITION_MODES.OFF } })
  const mostComplete = [strict, core, off].reduce(
    (best, plan) => (plan.slots.length > best.slots.length ? plan : best),
    strict,
  )
  if (off.slots.length !== slots.length) return mostComplete
  return {
    ...off,
    status: 'review_required',
    issues: [
      ...(off.issues || []),
      {
        severity: 'blocker',
        code: 'repetition_rules_relaxed',
        details: { reason: 'Aucune semaine ne respecte le socle des règles de répétition avec le corpus disponible.' },
      },
    ],
  }
}
