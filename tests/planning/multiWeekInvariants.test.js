import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan, recipeDiversityProfile } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { buildPlanningHistory } from '@/lib/domain/planning/repetitionRules'
import { checkPlanInvariants, checkWeekSequence, isLegacyPlanVersion, PLANNING_RULES_VERSION } from '@/lib/domain/planning/planInvariants'
import { explainSlot, explainWeek } from '@/lib/domain/planning/planExplanation'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

// Lot 9 du plan de refonte — reprise en production : « tester plusieurs
// semaines, vérifier automatiquement les invariants ». Et lot 8 — explication.

const CONSTRAINTS = { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 }, preferredActiveMinutes: 30 }
const addWeeks = (isoDate, count) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 7 * count)
  return date.toISOString().slice(0, 10)
}

/**
 * Quatre semaines consécutives, chacune générée avec l'historique réel des
 * précédentes — exactement l'enchaînement de la production.
 */
function generateSequence(weekCount, { recipes, firstWeek = '2026-07-20' }) {
  const plans = []
  const seen = []
  for (let index = 0; index < weekCount; index += 1) {
    const windowStart = addWeeks(firstWeek, index)
    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(windowStart),
      recipes,
      constraints: CONSTRAINTS,
      beamWidth: 24,
      history: buildPlanningHistory({ referenceDate: windowStart, entries: seen }),
    })
    plans.push({ windowStart, plan })
    for (const slot of plan.slots) {
      const recipe = recipes.find((candidate) => candidate.code === slot.recipeCode)
      seen.push({ recipeCode: slot.recipeCode, date: slot.date, diversity: recipe ? recipeDiversityProfile(recipe) : null })
    }
  }
  return plans
}

describe('lot 9 — invariants sur quatre semaines consécutives', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })
  const sequence = generateSequence(4, { recipes })

  it('publie chaque semaine, historique compris', () => {
    for (const { windowStart, plan } of sequence) {
      expect(plan.slots, `semaine du ${windowStart}`).toHaveLength(14)
      expect(plan.status, `semaine du ${windowStart}`).toBe('published')
    }
  })

  it('ne viole aucun invariant structurel sur la séquence', () => {
    const failures = checkWeekSequence(sequence.map((entry) => entry.plan), { expectedSlotCount: 14 })
    expect(failures).toEqual([])
  })

  it('ne fait jamais consommer une production avant de l’avoir cuisinée', () => {
    for (const { plan } of sequence) {
      const producers = new Map(plan.slots.filter((slot) => slot.production)
        .map((slot) => [slot.production.productionKey, slot.date]))
      for (const slot of plan.slots.filter((candidate) => candidate.productionKey)) {
        const producedOn = producers.get(slot.productionKey)
        if (producedOn) expect(slot.date >= producedOn).toBe(true)
      }
    }
  })

  it('renouvelle réellement le menu d’une semaine à l’autre', () => {
    const [first, second] = sequence.map((entry) => new Set(entry.plan.slots.map((slot) => slot.recipeCode)))
    const shared = [...first].filter((code) => second.has(code))
    // L'historique pèse sans interdire : le recouvrement doit rester minoritaire.
    expect(shared.length).toBeLessThan(first.size)
  })

  it('reste déterministe : la même séquence rejouée donne le même résultat', () => {
    const replay = generateSequence(2, { recipes })
    const signature = (entries) => JSON.stringify(entries.map((entry) => entry.plan.slots.map((slot) => slot.recipeCode)))
    expect(signature(replay)).toBe(signature(sequence.slice(0, 2)))
  })
})

describe('lot 9 — invariants détectent réellement une incohérence', () => {
  it('signale un consommateur de production orphelin', () => {
    const violations = checkPlanInvariants({
      slots: [{ key: 'a', date: '2026-07-20', recipeCode: 'X', productionKey: 'production-inexistante' }],
    })
    expect(violations.map((item) => item.code)).toContain('orphan_production_consumer')
  })

  it('signale une consommation antérieure à sa production', () => {
    const violations = checkPlanInvariants({
      slots: [
        { key: 'p', date: '2026-07-23', recipeCode: 'X', production: { productionKey: 'k', consumerSlotKeys: ['c'] } },
        { key: 'c', date: '2026-07-20', recipeCode: 'X', productionKey: 'k' },
      ],
    })
    expect(violations.map((item) => item.code)).toContain('consumption_before_production')
  })

  it('signale un lot périmé alloué au service', () => {
    const violations = checkPlanInvariants({
      slots: [{ key: 'a', date: '2026-07-25', recipeCode: 'X', allocations: [{ lotId: 'l1', grams: 100, expiresOn: '2026-07-22' }] }],
    })
    expect(violations.map((item) => item.code)).toContain('expired_lot_allocated')
  })

  it('signale la réécriture d’un repas déjà consommé', () => {
    const violations = checkPlanInvariants(
      { slots: [{ key: 'a', date: '2026-07-20', recipeCode: 'NOUVEAU' }] },
      { slotStates: { a: { consumed: true, recipeCode: 'ANCIEN' } } },
    )
    expect(violations.map((item) => item.code)).toContain('consumed_meal_rewritten')
  })

  it('distingue une semaine de l’ancien moteur d’une semaine de la refonte', () => {
    expect(isLegacyPlanVersion('myko-v5-final-demand-1')).toBe(true)
    expect(isLegacyPlanVersion(null)).toBe(true)
    expect(isLegacyPlanVersion(PLANNING_RULES_VERSION)).toBe(false)
  })
})

describe('lot 8 — explication des décisions', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })
  const plan = generateClosedLoopPlan({
    slots: buildWeekSlots('2026-07-20'),
    recipes,
    cookedDishes: [{ id: 3, name: recipes[0].family, portionsRemaining: 4, expiresOn: '2026-07-26' }],
    constraints: CONSTRAINTS,
    beamWidth: 24,
  })

  it('explique pourquoi un reste est servi ce jour-là', () => {
    const leftover = plan.slots.find((slot) => slot.source === 'cooked_dish')
    expect(leftover).toBeTruthy()
    const explanation = explainSlot(leftover)
    expect(explanation.text).toMatch(/est proposé/)
    expect(explanation.reasons.map((reason) => reason.code)).toContain('uses_existing_dish')
  })

  it('explique une production par le nombre de repas qu’elle couvre', () => {
    const producer = plan.slots.find((slot) => slot.production)
    if (!producer) return
    const explanation = explainSlot(producer)
    expect(explanation.reasons.map((reason) => reason.code)).toContain('batch_producer')
    expect(explanation.text).toMatch(/cuisiné en quantité pour couvrir \d+ repas/)
  })

  it('résume la semaine avec les chiffres du plan, sans rien estimer', () => {
    const summary = explainWeek(plan)
    expect(summary.meals).toBe(14)
    expect(summary.distinctRecipes).toBe(new Set(plan.slots.map((slot) => slot.recipeCode)).size)
    expect(summary.diversityScore).toBe(plan.objectiveScores.diversityScore)
    expect(summary.familiarity.leftovers + summary.familiarity.discoveries + summary.familiarity.familiar + summary.familiarity.backup)
      .toBe(14)
    expect(summary.perMeal.length).toBeGreaterThan(0)
  })

  it('ne fabrique aucune explication pour un repas sans raison particulière', () => {
    expect(explainSlot({ key: 'x', date: '2026-07-20', mealType: 'diner', title: 'Plat', recipeCode: 'A' })).toBeNull()
  })
})
