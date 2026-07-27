import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'
import { demandOf, findSupportWindow, supportFoods } from './supportWindow'

// Lot P4 — Bloquant #4 du verdict directeur : les petits-déjeuners et
// collations sont désormais des créneaux « support » (source='support') qui
// PORTENT leurs réservations de lots (slot_id non nul), fermant la double
// promesse (un lot réservé pour un pdj ne peut plus l'être ailleurs).

const recipe = {
  code: 'FR-TEST', family: 'Plat test', servings: 2, prepMinutes: 20,
  identityLevel: 'named_traditional_dish', techniques: ['saisie'],
  sensory: { profile: 'fresh_acidic', identity_guardrails: [] },
  exactIngredients: [{
    name: 'Carotte crue', formNormalized: 'carotte crue', quantity: 200,
    unit: 'g', grams: 200, optional: false, category: 'legumes',
  }],
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionPerServing: { kcal: 300, proteinG: 12, carbsG: 40, fatG: 10, fiberG: 8 },
  nutritionCoverage: { pct: 100 },
}

const basePlan = (date = '2026-07-20') => ({
  status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
  slots: [
    { key: `${date}-dejeuner`, date, mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
    { key: `${date}-diner`, date, mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
  ],
})

// Julien prend petit-déjeuner ET collation (memberRules) → deux créneaux support.
const julien = { name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } }

// Depuis le lot 7, la rotation des supports est dérivée de la date : ni les œufs
// durs ni le skyr ne sont servis tous les matins. Les fenêtres ci-dessous sont
// donc CHERCHÉES, pas figées — sinon chaque famille ajoutée à la rotation (§13)
// casserait ces tests sans qu'aucune régression ne se soit produite.
const demandPayload = (date) => buildCanonicalPlanPayload({
  plan: basePlan(date), recipes: [recipe], windowStart: date,
  members: [julien], constraints: {}, inventoryLots: [],
})

/** Une semaine dont le petit-déjeuner du jour 0 sert un pot entier de skyr. */
const SKYR_PDJ_DATE = findSupportWindow(demandPayload, (payload) => (
  supportFoods(payload, 'pdj').some((item) => item.food === 'skyr' && item.quantity === 200)
  && demandOf(payload, 'Skyr nature') === 200
))

/** Une semaine dont un support du jour 0 porte des œufs à cuire. */
const EGG_SUPPORT_DATE = findSupportWindow(demandPayload, (payload) => payload.legacy_meals
  .some((meal) => String(meal.short_label || '').includes('Œufs')))

describe('P4 — créneaux support et réservations pdj/collation', () => {
  it('émet des créneaux support (pdj + collation) avec source=support et sans recette ni plat', () => {
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(), recipes: [recipe], windowStart: '2026-07-20',
      members: [julien], constraints: {}, inventoryLots: [],
    })
    const support = payload.slots.filter((slot) => slot.source === 'support')
    expect(support.map((slot) => slot.slot_key).sort()).toEqual(['2026-07-20-collation', '2026-07-20-pdj'])
    for (const slot of support) {
      expect(['pdj', 'collation']).toContain(slot.meal_type)
      expect(slot.recipe_code).toBeUndefined()
      expect(slot.cooked_dish_id).toBeUndefined()
      expect(slot.production_key).toBeUndefined()
      expect(slot.title).toBe(slot.meal_type === 'pdj' ? 'Petit-déjeuner' : 'Collation')
    }
    // Créneaux support ajoutés APRÈS les principaux : les deux premiers restent
    // les créneaux recette du plan.
    expect(payload.slots.slice(0, 2).map((slot) => slot.slot_key))
      .toEqual(['2026-07-20-dejeuner', '2026-07-20-diner'])
  })

  it('persiste une réservation de lot rattachée au créneau support (fin de la double promesse)', () => {
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(SKYR_PDJ_DATE), recipes: [recipe], windowStart: SKYR_PDJ_DATE,
      members: [julien], constraints: {},
      // Un pot de skyr de 200 g couvre exactement le pdj du jour 0 (skyr 200 g).
      inventoryLots: [{ id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 200 }],
    })
    const skyrReservation = payload.reservations.find((res) => res.lot_id === 'lot-skyr')
    expect(skyrReservation).toMatchObject({
      slot_key: `${SKYR_PDJ_DATE}-pdj`,
      lot_id: 'lot-skyr',
      reserved_unit: 'g',
      reserved_quantity: 200,
      metadata: { support: true, form_normalized: 'skyr nature' },
    })
    // La réservation référence un créneau réellement publié (slot_id résoluble
    // par le RPC via slot_key).
    expect(payload.slots.some((slot) => slot.slot_key === skyrReservation.slot_key)).toBe(true)
    // Anti double-promesse : le stock réservé n'est PAS aussi envoyé aux courses.
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    expect(skyr).toBeUndefined() // 200 g demandés, 200 g réservés → rien à acheter.
  })

  it('ne réserve que le stock disponible et envoie le résidu aux courses (stock_qty inchangé)', () => {
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(SKYR_PDJ_DATE), recipes: [recipe], windowStart: SKYR_PDJ_DATE,
      members: [julien], constraints: {},
      // Un demi-pot (100 g) : la moitié réservée, puis un pot physique acheté.
      inventoryLots: [{ id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 100 }],
    })
    const reserved = payload.reservations
      .filter((res) => res.lot_id === 'lot-skyr')
      .reduce((sum, res) => sum + res.reserved_quantity, 0)
    expect(reserved).toBe(100)
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    expect(skyr).toMatchObject({
      stock_qty: 100,
      required_qty: 200,
      exact_required_qty: 100,
      purchase_qty: 200,
      projected_surplus_qty: 100,
    })
  })

  it('est déterministe : deux constructions identiques produisent un payload identique', () => {
    const args = {
      plan: basePlan(), recipes: [recipe], windowStart: '2026-07-20',
      members: [julien], constraints: {},
      inventoryLots: [{ id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 120 }],
    }
    const a = buildCanonicalPlanPayload({ ...args, plan: basePlan(), inventoryLots: [{ id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 120 }] })
    const b = buildCanonicalPlanPayload({ ...args, plan: basePlan(), inventoryLots: [{ id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 120 }] })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(a.input_hash).toBe(b.input_hash)
  })

  it('reste octet pour octet identique quand aucun membre ne prend de prise support', () => {
    const noSupport = { name: 'Sans-support', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: false } } }
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(), recipes: [recipe], windowStart: '2026-07-20',
      members: [noSupport], constraints: {},
      inventoryLots: [{ id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 200 }],
    })
    expect(payload.slots.some((slot) => slot.source === 'support')).toBe(false)
    expect(payload.slots.map((slot) => slot.slot_key)).toEqual(['2026-07-20-dejeuner', '2026-07-20-diner'])
    // Aucune réservation support : le lot de skyr n'est pas réservé (pas de pdj).
    expect(payload.reservations.some((res) => res.metadata?.support)).toBe(false)
    // Le skyr reste entièrement disponible → rien ne le consomme.
    expect(payload.reservations.some((res) => res.lot_id === 'lot-skyr')).toBe(false)
  })

  it('links support meals, uses a bounded support mode and schedules boiled eggs', () => {
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(EGG_SUPPORT_DATE), recipes: [recipe], windowStart: EGG_SUPPORT_DATE,
      members: [julien], constraints: {},
      inventoryLots: [
        { id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 200 },
        { id: 'lot-eggs', formNormalized: 'oeuf', gramsAvailable: 600 },
      ],
    })
    const breakfast = payload.slots.find((slot) => slot.meal_type === 'pdj')
    const breakfastMeals = payload.legacy_meals.filter((meal) => meal.meal_type === 'pdj')
    expect(breakfast).toBeTruthy()
    expect(breakfast.preparation.mode).toBe('support')
    expect(breakfast.servings).toBeGreaterThanOrEqual(1)
    expect(breakfastMeals.every((meal) => meal.slot_key === breakfast.slot_key)).toBe(true)
    // La cuisson des œufs est programmée sur le créneau support qui en
    // contient, quel qu'il soit ce jour-là.
    const eggMeal = payload.legacy_meals.find((meal) => String(meal.short_label || '').includes('Œufs'))
    expect(eggMeal).toBeTruthy()
    expect(payload.tasks.some((task) => task.slot_key === eggMeal.slot_key && task.task_type === 'prepare_support')).toBe(true)
  })

})
