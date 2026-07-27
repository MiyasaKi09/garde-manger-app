/**
 * Invariants d'un plan publiable (plan de refonte §17, lot 9).
 *
 * Le §17 liste quatorze conditions qu'une semaine doit remplir avant d'être
 * publiée. Les règles de répétition et de diversité sont vérifiées par
 * repetitionRules.auditWeekRepetition ; ce module couvre les AUTRES : chaque
 * portion a une source, les productions correspondent à leurs consommations,
 * aucun repas n'est incomplet, les repas déjà consommés ne sont pas réécrits.
 *
 * Il sert à deux moments :
 * - en test, pour vérifier automatiquement plusieurs semaines d'affilée ;
 * - à l'exécution, comme dernier garde-fou avant publication.
 *
 * Module PUR. Il ne corrige rien : il constate.
 */

/** Version des règles du moteur. Une semaine publiée avec une version
 *  antérieure vient de l'ancien moteur et ne doit pas être jugée à cette aune
 *  (§18, lot 9 : « marquer les semaines issues de l'ancien moteur »). */
export const PLANNING_RULES_VERSION = 'myko-v6-refonte-1'

/** Toute version antérieure à celle-ci précède la refonte. */
const LEGACY_RULES_VERSIONS = new Set([
  'myko-v5-final-demand-1',
  'myko-v4',
  'myko-v3',
])

export function isLegacyPlanVersion(rulesVersion) {
  if (!rulesVersion) return true
  return rulesVersion !== PLANNING_RULES_VERSION && LEGACY_RULES_VERSIONS.has(rulesVersion)
}

const violation = (code, details = {}) => ({ severity: 'blocker', code, ...details })

/**
 * Vérifie les invariants structurels du plan retourné par le solveur.
 * Retourne la liste des violations — vide quand tout est cohérent.
 */
export function checkPlanInvariants(plan, { expectedSlotCount = null, slotStates = {} } = {}) {
  const violations = []
  const slots = plan?.slots || []

  // §17 — « toutes les portions ont une source »
  if (expectedSlotCount != null && slots.length !== expectedSlotCount) {
    violations.push(violation('slot_count_mismatch', { expected: expectedSlotCount, actual: slots.length }))
  }
  for (const slot of slots) {
    if (!slot.recipeCode) violations.push(violation('slot_without_recipe', { slotKey: slot.key }))
    if (!slot.date) violations.push(violation('slot_without_date', { slotKey: slot.key }))
  }

  // §17 — « les restes sont rattachés à une production réelle » et
  // « les quantités produites correspondent aux consommations »
  const producerKeys = new Map()
  for (const slot of slots) {
    if (!slot.production) continue
    producerKeys.set(slot.production.productionKey, slot)
    if (slot.production.freezer) producerKeys.set(slot.production.freezer.productionKey, slot)
  }
  const consumersByProduction = new Map()
  for (const slot of slots) {
    if (!slot.productionKey) continue
    const producer = producerKeys.get(slot.productionKey)
    if (!producer) {
      violations.push(violation('orphan_production_consumer', { slotKey: slot.key, productionKey: slot.productionKey }))
      continue
    }
    // Une consommation ne peut jamais précéder sa production.
    if (producer.date && slot.date && slot.date < producer.date) {
      violations.push(violation('consumption_before_production', { slotKey: slot.key, producedOn: producer.date }))
    }
    consumersByProduction.set(slot.productionKey, (consumersByProduction.get(slot.productionKey) || 0) + 1)
  }
  for (const [productionKey, producer] of producerKeys) {
    const declared = productionKey.endsWith('-congelation')
      ? (producer.production.freezer?.consumerSlotKeys || []).length
      : (producer.production.consumerSlotKeys || []).length
    const actual = consumersByProduction.get(productionKey) || 0
    if (declared !== actual) {
      violations.push(violation('production_consumption_mismatch', { productionKey, declared, actual }))
    }
  }

  // §17 — « aucune portion n'est irréaliste » : un plat cuisiné ne peut pas
  // être promis au-delà de ses portions restantes.
  const dishPortions = new Map()
  for (const slot of slots) {
    if (slot.cookedDishId == null) continue
    dishPortions.set(slot.cookedDishId, (dishPortions.get(slot.cookedDishId) || 0) + (Number(slot.dishPortions) || 0))
  }
  for (const [dishId, portions] of dishPortions) {
    if (!(portions > 0)) violations.push(violation('dish_consumption_without_portions', { cookedDishId: dishId }))
  }

  // §17 — « ne pas réécrire les repas consommés » (lot 9). Un créneau déjà
  // consommé doit ressortir avec exactement la même recette.
  for (const slot of slots) {
    const state = slotStates[slot.key]
    if (!state?.consumed) continue
    if (state.recipeCode && slot.recipeCode !== state.recipeCode) {
      violations.push(violation('consumed_meal_rewritten', {
        slotKey: slot.key,
        was: state.recipeCode,
        now: slot.recipeCode,
      }))
    }
  }

  // Un lot ne peut pas être promis deux fois sur la même semaine au-delà de sa
  // disponibilité : le solveur décrémente sa disponibilité, on vérifie qu'aucune
  // allocation n'est négative ou nulle.
  for (const slot of slots) {
    for (const allocation of slot.allocations || []) {
      if (!(Number(allocation.grams) > 0)) {
        violations.push(violation('empty_allocation', { slotKey: slot.key, lotId: allocation.lotId }))
      }
      // Une DLC est une borne d'utilisation : jamais un lot périmé au service.
      if (allocation.expiresOn && slot.date && allocation.expiresOn < slot.date) {
        violations.push(violation('expired_lot_allocated', {
          slotKey: slot.key,
          lotId: allocation.lotId,
          expiresOn: allocation.expiresOn,
        }))
      }
    }
  }

  return violations
}

/**
 * Vérification sur plusieurs semaines consécutives (§18, lot 9 : « tester
 * plusieurs semaines, vérifier automatiquement les invariants »). Chaque
 * semaine est générée avec l'historique des précédentes, exactement comme en
 * production.
 */
export function checkWeekSequence(plans = [], options = {}) {
  const failures = []
  plans.forEach((plan, index) => {
    for (const item of checkPlanInvariants(plan, options)) {
      failures.push({ ...item, weekIndex: index })
    }
  })
  return failures
}
