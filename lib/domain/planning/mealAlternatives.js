/**
 * Remplacement contextualisé d'un repas (plan de refonte §16).
 *
 * « Proposer plusieurs alternatives contextualisées : meilleur équivalent,
 * option rapide, option utilisant le stock, favori, découverte. Chaque
 * remplacement doit préserver la cohérence du reste de la semaine ou indiquer
 * les conséquences. »
 *
 * Deux exigences, donc, et la seconde est la plus importante : proposer un plat
 * ne suffit pas, il faut dire ce qu'il coûte. Chaque alternative est donc
 * accompagnée de ses CONSÉQUENCES réelles — règles de répétition qu'elle
 * franchirait, part du plat à acheter, écart nutritionnel — calculées contre le
 * reste de la semaine, pas dans l'abstrait.
 *
 * Module PUR : le solveur lui passe le plan et le corpus, il ne lit rien.
 */

import { repetitionViolations, MEAL_SOURCES } from './repetitionRules'
import { tasteScore } from './tastePreferences'
import { BUDGET_ORIGINS, coutRecette, verdictDepassement } from './budgetDimension'
import { composerFourchettes } from '../pricing/priceMath'

const round = (value, digits = 2) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

/** Les cinq angles du §16, dans l'ordre d'AFFICHAGE. */
export const ALTERNATIVE_KINDS = Object.freeze([
  'best_match', 'quick', 'uses_stock', 'favorite', 'discovery',
])

/**
 * Ordre d'ATTRIBUTION, du plus contraint au plus général — volontairement
 * différent de l'ordre d'affichage.
 *
 * Servir les angles dans l'ordre d'affichage affamait les derniers :
 * « meilleur équivalent » prend volontiers le favori, « option rapide » prend
 * la recette déjà connue, et il ne reste plus rien pour « favori » ni
 * « découverte ». Or ces deux-là ont les viviers les plus étroits — une
 * découverte doit n'avoir jamais été servie.
 */
const ASSIGNMENT_ORDER = Object.freeze([
  'discovery', 'favorite', 'uses_stock', 'quick', 'best_match',
])

const KIND_LABEL = {
  best_match: 'Meilleur équivalent',
  quick: 'Option rapide',
  uses_stock: 'Utilise le stock',
  favorite: 'Un favori',
  discovery: 'Une découverte',
}

const totalMinutes = (recipe) => (Number(recipe?.prepMinutes) || 0) + (Number(recipe?.cookMinutes) || 0)

/**
 * Écart nutritionnel entre deux recettes, rapporté à la recette remplacée.
 * Sert à dire « un peu plus léger » plutôt qu'à interdire.
 */
function nutritionDelta(candidate, current) {
  const keys = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
  return Object.fromEntries(keys.map((key) => [
    key,
    round((Number(candidate?.nutritionPerServing?.[key]) || 0) - (Number(current?.nutritionPerServing?.[key]) || 0), 1),
  ]))
}

/**
 * Couverture du plat par le stock disponible, à la date du créneau. Approche
 * volontairement simple — le solveur recalculera l'allocation exacte à la
 * régénération ; ici on classe des options, on ne réserve rien.
 */
function stockCoverage(recipe, availableGramsByForm, slotDate) {
  const ingredients = (recipe?.exactIngredients || []).filter((ingredient) => !ingredient?.optional)
  if (!ingredients.length) return { coverage: 1, missing: [] }
  let required = 0
  let covered = 0
  const missing = []
  for (const ingredient of ingredients) {
    const needed = Number(ingredient.grams) || 0
    required += needed
    const lots = availableGramsByForm.get(ingredient.formNormalized) || []
    const usable = lots
      .filter((lot) => !lot.expiresOn || !slotDate || lot.expiresOn >= slotDate)
      .reduce((sum, lot) => sum + (Number(lot.grams) || 0), 0)
    const take = Math.min(usable, needed)
    covered += take
    if (take + 0.001 < needed) missing.push(ingredient.name || ingredient.formNormalized)
  }
  return { coverage: required > 0 ? round(covered / required, 3) : 1, missing }
}

/**
 * Conséquences d'un remplacement sur le RESTE de la semaine (§16 : « préserver
 * la cohérence du reste de la semaine ou indiquer les conséquences »).
 *
 * Le créneau remplacé est retiré du plan, puis le candidat est confronté aux
 * créneaux qui l'entourent — ceux d'avant comme ceux d'après. Un plat servi
 * mardi soir doit être compatible avec le lundi ET avec le mercredi ; ne
 * regarder que le passé laisserait passer un doublon avec le lendemain.
 */
export function replacementConsequences({ slots = [], slotKey, recipeCode, rules }) {
  const index = slots.findIndex((slot) => slot.key === slotKey)
  if (index < 0) return { violations: [], compatible: true }
  const target = slots[index]
  const others = slots.filter((slot) => slot.key !== slotKey)

  const before = others.filter((slot) => (slot.date || '') < (target.date || '')
    || (slot.date === target.date && slots.indexOf(slot) < index))
  const backward = repetitionViolations({
    plannedSlots: before,
    date: target.date,
    mealType: target.mealType ?? target.meal_type,
    recipeCode,
    source: MEAL_SOURCES.FRESH,
    rules,
  })

  // Regard vers l'avant : on rejoue la règle en plaçant le candidat AVANT
  // chaque créneau ultérieur portant la même recette.
  const forward = []
  const after = others.filter((slot) => !before.includes(slot))
  for (const later of after) {
    if (later.recipeCode !== recipeCode) continue
    for (const violation of repetitionViolations({
      plannedSlots: [{ ...target, recipeCode, source: MEAL_SOURCES.FRESH }],
      date: later.date,
      mealType: later.mealType ?? later.meal_type,
      recipeCode,
      source: later.source || MEAL_SOURCES.FRESH,
      rules,
    })) {
      forward.push({ ...violation, conflictsWith: later.key })
    }
  }

  const violations = [...backward, ...forward]
  return { violations, compatible: violations.length === 0 }
}

/**
 * Effet d'un échange sur le total de la semaine — le prédicat de prix des
 * alternatives (§budget).
 *
 * LA DISTINCTION QUI GOUVERNE TOUT : le dépassement est INTERDIT quand il vient
 * de la génération automatique, AUTORISÉ ET CHIFFRÉ quand il résulte d'un choix
 * explicite de l'utilisateur. C'est la règle qui a déjà fait ses preuves sur les
 * créneaux figés du solveur — « le plan de `fixed_recipe_code` est un pacte » —
 * et sur les desserts, qu'un créneau figé peut servir alors que le moteur ne se
 * l'autorise jamais. Ici, elle donne : `origin: USER`, donc `allowed: true`, et
 * un montant à côté. Cacher l'alternative coûteuse déciderait à la place de
 * l'utilisateur ; la proposer sans son prix le laisserait décider à l'aveugle.
 *
 * Le total projeté est composé EN QUADRATURE (contrat §3.2) sur les créneaux
 * conservés plus le candidat — jamais par addition de bornes.
 *
 * L'ÉCART entre les deux plats, lui, n'est rendu que sur sa valeur CENTRALE.
 * C'est le seul point qui se compose exactement (« l'espérance d'une somme est
 * la somme des espérances, quelles que soient les dépendances »), et fabriquer
 * une fourchette autour d'une différence reviendrait à écrire une dispersion
 * qu'aucune source ne publie — ce que le §3.1 refuse.
 */
function budgetImpact({ budget, slots, slotKey, candidate, current }) {
  if (!budget?.active) return { verdict: null, costDeltaCentralEur: null, priced: false }
  const engages = slots
    .filter((slot) => slot.key !== slotKey)
    .map((slot) => slot.budget?.range)
    .filter(Boolean)
  const coutCandidat = coutRecette(budget, candidate)
  const coutActuel = current ? coutRecette(budget, current) : { priced: false, range: null }
  if (!coutCandidat.priced) {
    // Le coût du candidat n'est pas établi. On ne rend AUCUN verdict — pas même
    // un « n'excède pas » — parce que le total projeté serait celui des seuls
    // autres créneaux, c'est-à-dire l'affirmation que ce plat est gratuit.
    // Une absence de verdict se raconte ; un verdict rassurant faux, non.
    return { priced: false, reason: coutCandidat.reason, costRange: null, costDeltaCentralEur: null, verdict: null }
  }
  return {
    priced: true,
    reason: null,
    costRange: coutCandidat.range,
    costDeltaCentralEur: coutActuel.priced
      ? round(coutCandidat.range.central - coutActuel.range.central, 2)
      : null,
    verdict: verdictDepassement({
      budget,
      projected: composerFourchettes([...engages, coutCandidat.range]),
      origin: BUDGET_ORIGINS.USER,
    }),
  }
}

/**
 * Alternatives contextualisées pour un créneau.
 *
 * `eligible` filtre en amont ce que le foyer peut manger (allergies, régimes,
 * interdits) : cette fonction ne refait pas ce travail, elle classe. Une
 * alternative incompatible avec le reste de la semaine n'est pas cachée — elle
 * est proposée AVEC ses conséquences, à l'utilisateur de trancher. Il en va de
 * même d'une alternative qui fait franchir l'enveloppe : elle descend dans le
 * classement, elle ne disparaît jamais.
 */
export function buildMealAlternatives({
  slots = [],
  slotKey,
  candidates = [],
  inventoryLots = [],
  history = null,
  tasteProfile = null,
  rules,
  budget = null,
  diversityOf = () => null,
  limitPerKind = 1,
} = {}) {
  const target = slots.find((slot) => slot.key === slotKey)
  if (!target) return { slotKey, current: null, alternatives: [] }
  const current = candidates.find((recipe) => recipe.code === target.recipeCode) || null

  const availableGramsByForm = new Map()
  for (const lot of inventoryLots) {
    if (!lot.formNormalized) continue
    if (!availableGramsByForm.has(lot.formNormalized)) availableGramsByForm.set(lot.formNormalized, [])
    availableGramsByForm.get(lot.formNormalized).push({
      grams: Number(lot.gramsAvailable ?? lot.grams ?? 0),
      expiresOn: lot.expiresOn ?? null,
    })
  }

  const scored = candidates
    .filter((recipe) => recipe.code !== target.recipeCode)
    .map((recipe) => {
      const diversity = diversityOf(recipe)
      const stock = stockCoverage(recipe, availableGramsByForm, target.date)
      const taste = tasteScore(recipe, tasteProfile, diversity)
      const consequences = replacementConsequences({ slots, slotKey, recipeCode: recipe.code, rules })
      const lastSeen = history?.lastUsedByRecipe?.[recipe.code] || null
      return {
        recipe,
        diversity,
        stock,
        taste,
        consequences,
        budget: budgetImpact({ budget, slots, slotKey, candidate: recipe, current }),
        lastSeen,
        neverServed: !lastSeen,
        minutes: totalMinutes(recipe),
      }
    })

  if (!scored.length) return { slotKey, current: current ? summarize(current, null) : null, alternatives: [] }

  // Un candidat qui casse la semaine passe toujours derrière un candidat qui la
  // respecte, quel que soit son autre mérite. Un candidat qui fait franchir
  // l'enveloppe vient ensuite, au même titre : il DESCEND, il ne disparaît pas.
  // L'écarter serait décider à la place de l'utilisateur, alors que c'est
  // précisément le cas où son choix explicite fait autorité.
  const depasse = (item) => Number(Boolean(item.budget?.verdict?.exceeds))
  const byRank = (rank) => (left, right) => Number(left.consequences.violations.length > 0)
      - Number(right.consequences.violations.length > 0)
    || depasse(left) - depasse(right)
    || rank(left, right)
    || String(left.recipe.code).localeCompare(String(right.recipe.code))

  const pools = {
    best_match: [...scored].sort(byRank((left, right) => (right.taste.total + right.stock.coverage * 10)
      - (left.taste.total + left.stock.coverage * 10))),
    quick: [...scored].sort(byRank((left, right) => left.minutes - right.minutes)),
    uses_stock: [...scored].sort(byRank((left, right) => right.stock.coverage - left.stock.coverage)),
    favorite: [...scored].filter((item) => item.taste.total > 0 || item.lastSeen)
      .sort(byRank((left, right) => right.taste.total - left.taste.total)),
    discovery: [...scored].filter((item) => item.neverServed)
      .sort(byRank((left, right) => right.taste.total - left.taste.total)),
  }

  // Un plat peut légitimement porter PLUSIEURS étiquettes : le favori du foyer
  // est souvent aussi le meilleur équivalent. Le forcer à n'en porter qu'une
  // obligeait soit à le montrer deux fois, soit à laisser un angle sans
  // réponse, soit à confier « meilleur équivalent » à un reste de sélection.
  // On sélectionne donc des PLATS, et chacun affiche tous les angles dont il
  // est le premier choix.
  const topOf = (kind) => (pools[kind] || [])[0]?.recipe?.code || null
  const alternatives = []
  const used = new Set()
  const covered = new Set()

  for (const kind of ASSIGNMENT_ORDER) {
    if (covered.has(kind)) continue
    let taken = 0
    for (const item of pools[kind] || []) {
      if (taken >= limitPerKind) break
      if (used.has(item.recipe.code)) continue
      used.add(item.recipe.code)
      taken += 1
      const kinds = ALTERNATIVE_KINDS.filter((other) => other === kind || topOf(other) === item.recipe.code)
      for (const badge of kinds) covered.add(badge)
      alternatives.push({
        kind,
        kinds,
        kindLabel: kinds.map((badge) => KIND_LABEL[badge]).join(' · '),
        ...summarize(item.recipe, current),
        stockCoverage: item.stock.coverage,
        missingIngredients: item.stock.missing.slice(0, 4),
        tasteScore: round(item.taste.total, 1),
        tasteReasons: item.taste.reasons,
        lastServedOn: item.lastSeen,
        neverServed: item.neverServed,
        compatible: item.consequences.compatible,
        consequences: item.consequences.violations,
        // Chiffrage de l'échange (§budget). Clés absentes sans enveloppe
        // demandée : l'écran d'alternatives reste alors exactement celui
        // d'avant. Un candidat non chiffré porte son motif, jamais un verdict.
        ...(budget?.active
          ? (item.budget.priced
            ? {
              costRange: item.budget.costRange,
              costDeltaCentralEur: item.budget.costDeltaCentralEur,
              budget: item.budget.verdict,
              budgetExceeded: item.budget.verdict.exceeds,
            }
            : { costRange: null, costUnknownReason: item.budget.reason || 'cout_inconnu' })
          : {}),
      })
    }
  }

  // Attribution faite, on revient à l'ordre d'affichage.
  const displayRank = new Map(ALTERNATIVE_KINDS.map((kind, index) => [kind, index]))
  const rankOf = (entry) => Math.min(...entry.kinds.map((kind) => displayRank.get(kind)))
  alternatives.sort((left, right) => rankOf(left) - rankOf(right))

  return { slotKey, current: current ? summarize(current, null) : null, alternatives }
}

function summarize(recipe, current) {
  return {
    recipeCode: recipe.code,
    title: recipe.family,
    category: recipe.category || null,
    cuisine: recipe.cuisineOrigin || null,
    totalMinutes: totalMinutes(recipe),
    servings: recipe.servings,
    nutritionPerServing: recipe.nutritionPerServing || null,
    ...(current ? { nutritionDelta: nutritionDelta(recipe, current) } : {}),
  }
}
