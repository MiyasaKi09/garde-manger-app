/**
 * Explication des décisions de planification (plan de refonte §10, §16).
 *
 * « Myko doit pouvoir expliquer ses décisions. » Le solveur produit déjà toutes
 * les raisons — provenance du repas, statut, urgence du stock, goûts du foyer,
 * règles franchies — mais elles restent des codes. Ce module les traduit en
 * phrases, sans jamais en inventer : chaque phrase correspond à une donnée
 * réellement présente dans le plan.
 *
 * Module PUR. Il ne décide de rien : il raconte ce qui a été décidé.
 */

const MEAL_LABEL = { pdj: 'petit-déjeuner', dejeuner: 'déjeuner', collation: 'collation', diner: 'dîner' }

const WEEKDAY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

const dayLabel = (isoDate) => {
  if (!isoDate) return null
  const date = new Date(`${String(isoDate).slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : WEEKDAY[date.getUTCDay()]
}

const joinFr = (parts) => {
  const items = parts.filter(Boolean)
  if (items.length <= 1) return items[0] || ''
  return `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`
}

const RULE_LABEL = {
  same_day_recipe_repeat: 'le même plat au déjeuner et au dîner du même jour',
  recipe_repeat_too_close: 'deux consommations trop rapprochées',
  recipe_recooked_within_week: 'une seconde cuisson de la même recette',
  recipe_over_consumed: 'trop de consommations du même plat',
  recipe_repeat_burst: 'trois prises rapprochées du même plat',
}

/**
 * Motifs d'absence de chiffrage, dits en clair. Un repas sans montant n'est pas
 * une case vide : c'est une information — le référentiel ne couvre pas encore
 * assez de ses ingrédients — et la taire ferait croire que le total annoncé
 * porte sur toute la semaine.
 */
const BUDGET_UNPRICED_LABEL = {
  couverture_lignes_insuffisante: 'trop d’ingrédients sans prix sourcé',
  couverture_masse_insuffisante: 'les ingrédients les plus lourds n’ont pas de prix sourcé',
  aucune_ligne_chiffree: 'aucun ingrédient n’a de prix sourcé',
  rien_de_quantifie: 'aucune quantité exploitable',
  referentiel_perime: 'le référentiel de prix est trop ancien',
  cout_inconnu: 'coût non établi',
}

/**
 * Raisons de la présence d'un repas, de la plus décisive à la plus accessoire.
 * L'ordre compte : c'est celui de la phrase.
 */
function slotReasons(slot, { history = null } = {}) {
  const reasons = []

  if (slot.source === 'cooked_dish') {
    reasons.push({
      code: 'uses_existing_dish',
      text: `il reste des portions de ${slot.cookedDishName || slot.title} à finir`,
    })
  }
  if (slot.source === 'planned_production' && slot.producerSlotKey) {
    const producedOn = dayLabel(String(slot.producerSlotKey).slice(0, 10))
    reasons.push({
      code: 'from_planned_production',
      text: producedOn
        ? `il provient de la cuisson de ${producedOn}${slot.storageMethod === 'freezer' ? ', sortie du congélateur' : ''}`
        : 'il provient d’une cuisson déjà prévue cette semaine',
    })
  }
  if (slot.production) {
    const meals = 1 + (slot.production.consumerSlotKeys?.length || 0)
      + (slot.production.freezer?.consumerSlotKeys?.length || 0)
    if (meals > 1) {
      reasons.push({
        code: 'batch_producer',
        text: `il est cuisiné en quantité pour couvrir ${meals} repas`,
      })
    }
    if (slot.production.freezer?.nextWeekPortions > 0) {
      reasons.push({ code: 'freezes_for_next_week', text: 'une part est congelée pour la semaine suivante' })
    }
  }

  // Anti-gaspillage : un lot qui arrive à échéance justifie à lui seul la
  // place d'un plat dans la semaine.
  const urgent = (slot.allocations || []).filter((allocation) => allocation.expiresOn
    && slot.date && allocation.expiresOn <= slot.date)
  if (urgent.length) {
    reasons.push({
      code: 'uses_expiring_stock',
      text: `${joinFr([...new Set(urgent.map((allocation) => allocation.ingredientName))].slice(0, 2))} arrive à échéance`,
    })
  }

  for (const reason of slot.tasteReasons || []) {
    if (reason.code === 'taste_liked') {
      reasons.push({
        code: 'liked',
        text: reason.dissenting
          ? `${reason.subject} plaît à une partie du foyer`
          : `vous appréciez ${reason.subject}`,
      })
    }
  }

  if (slot.mealStatus === 'new_meal' && history && !history.lastUsedByRecipe?.[slot.recipeCode]) {
    reasons.push({ code: 'discovery', text: 'c’est une découverte, jamais servie ces dernières semaines' })
  }

  // Ce à quoi l'enveloppe a fait renoncer. Le solveur ne l'inscrit que lorsque
  // le budget est BIEN ce qui a départagé les deux plats (voir le suivi des
  // deux têtes de classement dans closedLoopPlanner) : sans cette précaution on
  // attribuerait au budget des arbitrages qui lui sont étrangers, et le §0 du
  // contrat de prix vaut ici aussi — une explication plausible et fausse est
  // pire qu'une explication absente.
  if (slot.budgetForgone?.title) {
    const economie = Number.isFinite(slot.budgetForgone.savedEur) && slot.budgetForgone.savedEur > 0
      ? ` (environ ${formatEur(slot.budgetForgone.savedEur)} de moins)`
      : ''
    reasons.push({
      code: 'budget_forgone',
      text: `l’enveloppe de la semaine a écarté ${slot.budgetForgone.title}${economie}`,
    })
  }

  return reasons
}

/** Écriture française d'un écart en euros. Deux décimales : c'est un écart, pas un total annoncé. */
const formatEur = (value) => `${(Math.round(Number(value) * 100) / 100).toFixed(2).replace('.', ',')} €`

/**
 * Phrase explicative d'un repas. Rend `null` quand le plan ne porte aucune
 * raison particulière : mieux vaut ne rien dire qu'inventer une justification.
 */
export function explainSlot(slot, options = {}) {
  if (!slot) return null
  const reasons = slotReasons(slot, options)
  const violations = slot.repetitionViolations || []
  const day = dayLabel(slot.date)
  const meal = MEAL_LABEL[slot.mealType ?? slot.meal_type] || 'repas'
  const place = day ? `${day} au ${meal}` : `au ${meal}`

  if (!reasons.length && !violations.length) return null

  const sentences = []
  if (reasons.length) {
    sentences.push(`${slot.title || 'Ce plat'} est proposé ${place} car ${joinFr(reasons.map((reason) => reason.text))}.`)
  }
  if (violations.length) {
    const labels = [...new Set(violations.map((violation) => RULE_LABEL[violation.code] || violation.code))]
    sentences.push(`À revoir : ce créneau accepte ${joinFr(labels)} faute d’une meilleure option.`)
  }
  // Un repas sans montant se dit, il ne se saute pas : sinon le total de la
  // semaine paraîtrait porter sur tous les repas.
  if (slot.budget && slot.budget.chargeable !== false && slot.budget.priced === false) {
    sentences.push(`Coût non estimé pour ce repas : ${BUDGET_UNPRICED_LABEL[slot.budget.reason] || slot.budget.reason}.`)
  }

  return { slotKey: slot.key, text: sentences.join(' '), reasons, violations }
}

/**
 * Aperçu APRÈS génération (§16). Tout vient du plan : rien n'est estimé.
 */
export function explainWeek(plan, options = {}) {
  const slots = plan?.slots || []
  const scores = plan?.objectiveScores || {}
  const familiarity = scores.familiarity || {}
  const productions = slots.filter((slot) => slot.production)
  const leftovers = slots.filter((slot) => slot.source === 'cooked_dish')
  const urgentSlots = slots.filter((slot) => (slot.allocations || [])
    .some((allocation) => allocation.expiresOn && slot.date && allocation.expiresOn <= slot.date))

  return {
    // Bloc budget (§budget) : présent seulement quand une enveloppe a été
    // demandée. Il transporte la phrase déjà écrite par la couche prix, avec
    // son vocabulaire imposé (« estimation », « au moins », la date du
    // référentiel à côté du montant) — la recomposer ici serait la deuxième
    // occasion de la composer, donc la première occasion de la composer mal.
    ...(plan?.budget ? { budget: budgetSummary(plan.budget) } : {}),
    status: plan?.status || 'unknown',
    meals: slots.length,
    distinctRecipes: new Set(slots.map((slot) => slot.recipeCode)).size,
    diversityScore: scores.diversityScore ?? null,
    diversityBalance: scores.diversityBalance ?? null,
    familiarity: {
      discoveries: familiarity.discovery ?? 0,
      familiar: familiarity.familiar ?? 0,
      leftovers: familiarity.leftover ?? 0,
      backup: familiarity.backup ?? 0,
      discoveryRatio: familiarity.discoveryRatio ?? null,
    },
    cookingSessions: slots.filter((slot) => (slot.source || 'fresh') === 'fresh').length,
    batchProductions: productions.length,
    plannedLeftovers: leftovers.length + slots.filter((slot) => slot.source === 'planned_production').length,
    urgentStockUsed: urgentSlots.length,
    shoppingItems: plan?.shoppingItems?.length ?? 0,
    // Compromis éventuels : ce que la semaine a dû accepter.
    tradeoffs: (plan?.issues || [])
      .filter((issue) => ['blocker', 'error'].includes(issue.severity))
      .map((issue) => issue.message || issue.code),
    warnings: (plan?.issues || [])
      .filter((issue) => issue.severity === 'warning')
      .map((issue) => issue.message || issue.code),
    perMeal: slots.map((slot) => explainSlot(slot, options)).filter(Boolean),
  }
}

/**
 * Le budget vu de la semaine : ce que l'enveloppe a donné, et ce qu'elle a fait
 * renoncer à faire. Aucune reformulation des montants — la phrase vient de
 * `rapportBudget`, sous le vocabulaire du contrat.
 */
function budgetSummary(budget) {
  if (!budget?.active) {
    return { active: false, reason: budget?.reason ?? null, sentence: budget?.sentence ?? null }
  }
  return {
    active: true,
    envelopeEur: budget.envelopeEur,
    estimate: budget.estimate,
    exceeded: budget.exceeds,
    overrunEur: budget.exceeds ? budget.overrunEur : 0,
    /** Un total partiel est un minorant : les repas manquants ne peuvent qu'ajouter. */
    minorant: budget.minorant,
    coveragePct: budget.coveragePct,
    pricedMeals: budget.meals.priced,
    chargeableMeals: budget.meals.chargeable,
    alreadyPaidMeals: budget.meals.alreadyPaid,
    unpricedMeals: budget.unpricedMeals.map((meal) => meal.title).filter(Boolean),
    sentence: budget.sentence,
    // Ce que le budget a fait renoncer, repas par repas — la réponse à
    // « qu'est-ce que l'enveloppe m'a coûté ? », en plats et pas en points.
    forgone: budget.forgone.map((entry) => ({
      slotKey: entry.slotKey,
      title: entry.title,
      savedEur: entry.savedEur,
    })),
  }
}

/**
 * Aperçu AVANT génération (§16). Il décrit ce que le moteur va devoir concilier,
 * à partir de l'état réel du foyer — sans lancer de calcul.
 */
export function previewInputs({
  slots = [],
  cookedDishes = [],
  inventoryLots = [],
  tasteProfile = null,
  history = null,
  today = null,
} = {}) {
  const reference = today || slots[0]?.date || null
  const urgentLots = inventoryLots.filter((lot) => lot.expiresOn && reference
    && lot.expiresOn <= addDays(reference, 3))
  const favorites = Object.values(tasteProfile?.subjects || {})
    .filter((subject) => subject.appreciation === 'favorite')
  const knownCodes = new Set(Object.keys(history?.lastUsedByRecipe || {}))

  return {
    meals: slots.length,
    lockedMeals: slots.filter((slot) => slot.fixedRecipeCode).length,
    urgentProducts: urgentLots.length,
    readyDishes: cookedDishes.length,
    favorites: favorites.length,
    knownRecipes: knownCodes.size,
    // Ce que Myko sait déjà de vous : sert à expliquer pourquoi une semaine
    // sera plus ou moins personnalisée.
    tasteSubjects: Object.keys(tasteProfile?.subjects || {}).length,
  }
}

function addDays(isoDate, count) {
  const date = new Date(`${String(isoDate).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}
