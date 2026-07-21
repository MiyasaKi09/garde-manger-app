import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload, buildWeekSlots, collectSupplementLots, nextMondayIso, normalizePlanIssues } from '@/lib/domain/planning/canonicalPlanPayload'
import { allocateFromLots, buildAvailability, generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

const recipe = {
  code: 'FR-TEST', family: 'Plat test', servings: 2, prepMinutes: 20,
  identityLevel: 'named_traditional_dish', techniques: ['saisie'],
  sensory: { profile: 'fresh_acidic', identity_guardrails: ['acidite_preservee'] },
  exactIngredients: [{
    name: 'Carotte crue', formNormalized: 'carotte crue', quantity: 200,
    unit: 'g', grams: 200, optional: false, category: 'legumes',
  }],
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionPerServing: { kcal: 300, proteinG: 12, carbsG: 40, fatG: 10, fiberG: 8 },
  nutritionCoverage: { pct: 100 },
}

describe('canonical plan publication payload', () => {
  it('builds fourteen ordered lunch and dinner slots', () => {
    const slots = buildWeekSlots('2026-07-20')
    expect(slots).toHaveLength(14)
    expect(slots[0]).toMatchObject({ key: '2026-07-20-dejeuner', mealType: 'dejeuner' })
    expect(slots.at(-1)).toMatchObject({ key: '2026-07-26-diner', mealType: 'diner' })
  })

  it('freezes execution, stock reservation, task, shopping and compatibility meals together', () => {
    const plan = {
      status: 'published', issues: [],
      objectiveScores: { stockCoverage: 0.75, sensoryRuleViolations: 0 },
      slots: [{
        key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner',
        recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [],
      }, {
        key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner',
        recipeCode: 'FR-TEST', allocations: [{ lotId: 'lot-1', formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 150 }],
        shortages: [{ formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 50 }],
        stockCoverage: 0.75, explanations: [],
      }],
      reservations: [{ slotKey: '2026-07-20-diner', lotId: 'lot-1', formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 150 }],
      shoppingItems: [{ formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 50, neededBy: '2026-07-20' }],
    }
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Alex', portion_multiplier: 1 }, { name: 'Sam', portion_multiplier: 1 }],
      goals: [
        { person_name: 'Alex', target_calories: 1100, target_protein_g: 50, target_carbs_g: 140, target_fat_g: 35, target_fiber_g: 20 },
        { person_name: 'Sam', target_calories: 1100, target_protein_g: 50, target_carbs_g: 140, target_fat_g: 35, target_fiber_g: 20 },
      ],
      constraints: {}, inventoryLots: [{ id: 'lot-1', formNormalized: 'carotte crue', gramsAvailable: 150 }],
    })
    expect(payload.recipe_executions).toHaveLength(2)
    expect(payload.recipe_executions.every((execution) => /^[a-f0-9]{64}$/.test(execution.content_hash))).toBe(true)
    expect(payload.reservations.filter((reservation) => reservation.lot_id === 'lot-1')
      .reduce((sum, reservation) => sum + reservation.reserved_quantity, 0)).toBe(150)
    const carrots = payload.shopping_items.find((item) => item.product_name === 'Carotte crue')
    const exactRequired = payload.recipe_executions.reduce((sum, execution) => sum + execution.exact_ingredients_snapshot[0].grams, 0)
    expect(carrots).toMatchObject({ purchase_qty: exactRequired - 150, required_qty: exactRequired, stock_qty: 150 })
    expect(payload.tasks[0].instructions).toEqual(recipe.exactSteps)
    expect(payload.legacy_meals).toHaveLength(6)
    expect(payload.slots[0].nutrition_by_member).toHaveProperty('Alex')
  })

  it('computes the next Monday in UTC deterministically', () => {
    expect(nextMondayIso(new Date('2026-07-15T12:00:00Z'))).toBe('2026-07-20')
    expect(nextMondayIso(new Date('2026-07-19T12:00:00Z'))).toBe('2026-07-20')
  })

  it('publishes skyr as physical 200 g pots instead of an arbitrary gram total', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } }], constraints: {}, inventoryLots: [],
    })
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    expect(skyr).toMatchObject({
      display_quantity: '1 pot de 200 g',
      required_qty: 200,
      purchase_qty: 200,
      purchase_unit: 'g',
      container_qty: 1,
      container_size: 200,
      container_unit: 'g',
    })
  })

  it('publishes every validation issue with a readable message and its context', () => {
    expect(normalizePlanIssues([
      { severity: 'warning', code: 'vegetarian_min', missing: 2 },
      { severity: 'warning', code: 'protein_repeat_poulet', missing: 1 },
    ])).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'vegetarian_min',
        message: expect.stringContaining('repas végétariens'),
        details: { missing: 2 },
      }),
      expect.objectContaining({
        code: 'protein_repeat_poulet',
        message: expect.stringContaining('source de protéines'),
        details: { missing: 1 },
      }),
    ])
  })

  it('publishes an executable but nutritionally weak week as review_required', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } }],
      goals: [{ person_name: 'Alex', target_calories: 1450, target_protein_g: 300, target_carbs_g: 230, target_fat_g: 70, target_fiber_g: 25 }],
      constraints: {}, inventoryLots: [],
    })

    const day = payload.validation_summary.daily_nutrition[0]
    expect(day.valid).toBe(true)
    expect(day.protein_valid).toBe(false)

    const proteinIssue = payload.issues.find((issue) => issue.code === 'daily_protein_floor')
    expect(proteinIssue).toMatchObject({
      severity: 'warning',
      message: expect.stringContaining('protéines'),
      details: expect.objectContaining({ person_name: 'Alex', meal_date: '2026-07-20' }),
    })
    expect(proteinIssue.details.protein_deviation).toBeLessThan(0)

    expect(payload.validation_summary).toMatchObject({
      days_total: 1,
      energy_valid_days: 1,
      protein_valid_days: 0,
      daily_energy_targets_valid: true,
    })
    expect(payload.validation_summary.nutrition_dimensions).toMatchObject({
      energy: { valid_days: 1, days_total: 1 },
      protein: { valid_days: 0, days_total: 1 },
    })
    expect(payload.validation_summary.status).toBe('review_required')
    expect(payload.issues).toContainEqual(expect.objectContaining({ code: 'nutrition_week_review_required', severity: 'error' }))
    expect(payload.validation_summary.nutrition_dimensions.carbs.days_total).toBe(1)
    expect(payload.validation_summary.nutrition_dimensions.fat.days_total).toBe(1)
    expect(payload.validation_summary.nutrition_dimensions.fiber.days_total).toBe(1)
    // Plus jamais d'indicateur agrégé « 100 % » codé en dur.
    expect(payload.validation_summary.nutrition_coverage_pct).toBeUndefined()
  })

  it('keeps safe bounded plates and marks infeasible energy targets review_required', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } }],
      goals: [{ person_name: 'Alex', target_calories: 500 }],
      constraints: {}, inventoryLots: [],
    })
    expect(payload.validation_summary.status).toBe('review_required')
    expect(payload.validation_summary.daily_energy_targets_valid).toBe(false)
    expect(payload.legacy_meals.filter((meal) => meal.canonical_recipe_code).every((meal) => meal.planned_servings <= 2)).toBe(true)
  })

  it('allocates existing supplement lots FEFO and only ships the residual to shopping', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    const build = () => buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } }],
      goals: [{ person_name: 'Julien', target_calories: 2000, target_protein_g: 150 }],
      constraints: {},
      inventoryLots: [
        { id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 100, expiresOn: '2026-07-22', opened: true },
        { id: 'lot-oeufs', formNormalized: 'oeufs durs', gramsAvailable: 60, expiresOn: '2026-07-24', opened: false },
        { id: 'lot-pomme', formNormalized: 'pomme', gramsAvailable: 300, expiresOn: '2026-07-23', opened: false },
      ],
    })
    const payload = build()

    // Le nom produit reste octet pour octet identique : generate-v3 rattache
    // les conditionnements par product_name et échoue sinon.
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    expect(skyr).toMatchObject({
      required_qty: 200,
      stock_qty: 100,
      reserved_qty: 100,
      purchase_qty: 200,
      exact_required_qty: 100,
      projected_surplus_qty: 100,
      purchase_unit: 'g',
      display_quantity: '1 pot de 200 g',
      container_qty: 1,
      container_size: 200,
      container_unit: 'g',
    })

    const eggs = payload.shopping_items.find((item) => item.product_name === 'Œufs durs')
    expect(eggs).toMatchObject({ required_qty: 2, stock_qty: 1, reserved_qty: 1, purchase_qty: 1, purchase_unit: 'u' })

    // Le fruit entièrement couvert par le stock ne part plus aux courses.
    expect(payload.shopping_items.find((item) => item.product_name === 'Pomme')).toBeUndefined()

    // Sans lot correspondant, l'article garde le comportement historique.
    const tuna = payload.shopping_items.find((item) => item.product_name === 'Thon au naturel égoutté')
    expect(tuna).toMatchObject({ stock_qty: 0, reserved_qty: 0, purchase_qty: 100 })

    // Jamais de stock promis au-delà de la disponibilité des lots.
    for (const item of payload.shopping_items) {
      expect(item.stock_qty).toBeGreaterThanOrEqual(0)
      expect(item.stock_qty + item.purchase_qty).toBeGreaterThanOrEqual(item.required_qty)
    }

    // Deux exécutions identiques produisent exactement le même payload.
    expect(JSON.parse(JSON.stringify(build()))).toEqual(JSON.parse(JSON.stringify(payload)))
  })

  // MAJOR 2 : les lots de production portent les noms canoniques/archétypes
  // ('œuf', 'Thon en conserve', 'amande', 'avoine'…), pas les libellés
  // d'affichage des suppléments — les aliases doivent suffire à les matcher.
  it('matches production lot vocabulary (canonique/archétype) through supplement aliases', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    }
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } }], constraints: {},
      inventoryLots: [
        // Noms réels du vocabulaire d'export (normalisés par loadPlannerInventory).
        { id: 'lot-oeuf', formNormalized: 'oeuf', gramsAvailable: 600, expiresOn: '2026-07-24', opened: false },
        { id: 'lot-thon', formNormalized: 'thon en conserve', gramsAvailable: 300, expiresOn: '2027-01-01', opened: false },
        { id: 'lot-amande', formNormalized: 'amande', gramsAvailable: 200, expiresOn: '2026-12-01', opened: false },
        { id: 'lot-avoine', formNormalized: 'avoine', gramsAvailable: 25, expiresOn: '2026-11-01', opened: false },
      ],
    })

    // Couvert intégralement par le stock → plus jamais aux courses.
    expect(payload.shopping_items.find((item) => item.product_name === 'Œufs durs')).toBeUndefined()
    expect(payload.shopping_items.find((item) => item.product_name === 'Thon au naturel égoutté')).toBeUndefined()
    expect(payload.shopping_items.find((item) => item.product_name === 'Amandes')).toBeUndefined()

    // Couverture partielle : le lot 'avoine' (25 g) réduit l'achat, le manque part aux courses.
    const oats = payload.shopping_items.find((item) => item.product_name === 'Flocons d’avoine')
    expect(oats).toMatchObject({ stock_qty: 25, reserved_qty: 25 })
    expect(oats.purchase_qty).toBe(oats.required_qty - 25)

    // Sans lot d'aucune forme acceptée, l'article part intégralement aux courses.
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    expect(skyr).toMatchObject({ stock_qty: 0, purchase_qty: 200 })
  })

  it('never serves the same lot twice when two entries accept the same alias, and keeps FEFO across forms', () => {
    // Disponibilité partagée : le lot 'oeuf' (120 g) est accepté par deux
    // « entrées » hypothétiques via le même alias — la première servie
    // consomme la disponibilité résiduelle de la seconde.
    const shared = buildAvailability([{ id: 'lot-oeuf', formNormalized: 'oeuf', gramsAvailable: 120 }], [])
    const first = allocateFromLots(collectSupplementLots(shared, ['oeufs durs', 'oeuf']), 60)
    expect(first.allocatedGrams).toBe(60)
    const second = allocateFromLots(collectSupplementLots(shared, ['oeuf mollet', 'oeuf']), 120)
    expect(second.allocatedGrams).toBe(60)
    expect(second.shortageGrams).toBe(60)

    // L'union de plusieurs formes est re-triée : ouvert d'abord, puis FEFO,
    // même quand le plus urgent vient d'une forme alias.
    const availability = buildAvailability([
      { id: 'lot-forme', formNormalized: 'oeufs durs', gramsAvailable: 60, expiresOn: '2026-07-25', opened: false },
      { id: 'lot-alias', formNormalized: 'oeuf', gramsAvailable: 60, expiresOn: '2026-07-21', opened: false },
    ], [])
    const lots = collectSupplementLots(availability, ['oeufs durs', 'oeuf'])
    expect(lots.map((lot) => lot.id)).toEqual(['lot-alias', 'lot-forme'])
  })

  it('subtracts recipe reservations and other active plans before allocating supplements', () => {
    const planWithReservation = {
      status: 'published', issues: [], objectiveScores: {}, shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
      reservations: [{ slotKey: '2026-07-20-diner', lotId: 'lot-skyr', formNormalized: 'skyr nature', ingredientName: 'Skyr nature', grams: 120, status: 'active' }],
    }
    const payload = buildCanonicalPlanPayload({
      plan: planWithReservation, recipes: [recipe], windowStart: '2026-07-20',
      members: [{ name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } }], constraints: {},
      inventoryLots: [{ id: 'lot-skyr', formNormalized: 'skyr nature', gramsAvailable: 200, expiresOn: '2026-07-22', opened: true }],
      existingReservations: [{ lotId: 'lot-skyr', grams: 50, status: 'active' }],
    })
    const skyr = payload.shopping_items.find((item) => item.product_name === 'Skyr nature')
    // Les réservations de l'ancien grain `plan` sont volontairement ignorées :
    // seule la demande finale est allouée. La réservation externe de 50 g est
    // soustraite, puis l'achat est arrondi au pot physique de 200 g.
    expect(skyr).toMatchObject({
      required_qty: 200,
      stock_qty: 150,
      reserved_qty: 150,
      exact_required_qty: 50,
      purchase_qty: 200,
      projected_surplus_qty: 150,
    })
  })

  it('can compose a full week from the publishable V3 corpus without invented stock', () => {
    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots('2026-07-20'),
      recipes: getCanonicalRecipes({ servings: 2 }),
      inventoryLots: [],
      constraints: {
        allowShopping: true,
        maxMinutesByMeal: { dejeuner: 120, diner: 240 },
        preferredActiveMinutes: 30,
      },
      beamWidth: 24,
    })
    expect(plan.status).toBe('published')
    expect(plan.slots).toHaveLength(14)
    // Depuis le lot P2, la semaine mutualise au plus 2 productions (≤ 4 repas
    // chacune) : la diversité minimale passe de > 10 recettes distinctes à
    // ≥ 6, et les règles hebdomadaires restent arbitrées par les déficits.
    expect(new Set(plan.slots.map((slot) => slot.recipeCode)).size).toBeGreaterThanOrEqual(6)
    const producers = plan.slots.filter((slot) => slot.production)
    expect(producers.length).toBeLessThanOrEqual(2)
    // Aucun consommateur orphelin : chaque créneau couvert référence un
    // producteur antérieur du même plan (test L côté solveur).
    const producerKeys = new Set(producers.map((slot) => slot.key))
    for (const slot of plan.slots.filter((item) => item.productionKey)) {
      expect(producerKeys.has(slot.producerSlotKey)).toBe(true)
      expect(slot.allocations).toEqual([])
    }
    expect(plan.shoppingItems.every((item) => item.grams > 0)).toBe(true)
  })
})
