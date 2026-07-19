import { describe, expect, it } from 'vitest'
import {
  buildDishAvailability,
  compareDishesFefo,
  generateClosedLoopPlan,
} from '@/lib/domain/planning/closedLoopPlanner'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'

// Lot P1 (audit §14) — reconnexion des restes au solveur :
// - un plat cuisiné qui couvre un créneau bat toute cuisson fraîche (pré-passe) ;
// - FEFO strict entre plats, départage par id ;
// - jamais de complément partiel : le plat couvre TOUT le créneau ou rien ;
// - les portions sont suivies dans le plan (un plat de 6 nourrit 3 × 2) ;
// - réservation de portions par (créneau, plat), aucune allocation de lots ;
// - zéro plat → plan et payload octet pour octet identiques à l'existant.

const makeRecipe = (code, family, form = 'carotte crue', overrides = {}) => ({
  code,
  family,
  eligible: true,
  servings: 2,
  prepMinutes: 15,
  cookMinutes: 20,
  cuisineOrigin: 'France',
  allergens: [],
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', scores: { richness: 2, acidic: 1, freshness: 1 }, target_textures: ['fondant'] },
  exactIngredients: [{ name: form, formNormalized: form, grams: 100, optional: false }],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 },
  ...overrides,
})

const weekSlots = [
  { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
  { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
  { key: '2026-07-21-dejeuner', date: '2026-07-21', mealType: 'dejeuner' },
  { key: '2026-07-21-diner', date: '2026-07-21', mealType: 'diner' },
]

const HACHIS = makeRecipe('FR-HAC', 'Hachis parmentier', 'boeuf hache cuit')
const SALADE = makeRecipe('FR-SAL', 'Salade de lentilles', 'lentilles cuites')

describe('generateClosedLoopPlan — plats cuisinés (audit P1)', () => {
  it('test B : un plat de six portions nourrit trois créneaux de deux portions, sans rachat ni recuisson', () => {
    const plan = generateClosedLoopPlan({
      slots: weekSlots,
      recipes: [HACHIS, SALADE],
      cookedDishes: [{ id: 7, name: 'Hachis Parmentier', portionsRemaining: 6, expiresOn: '2026-07-25' }],
      constraints: { allowShopping: true },
    })
    expect(plan.status).toBe('published')

    const dishSlots = plan.slots.filter((slot) => slot.cookedDishId != null)
    expect(dishSlots).toHaveLength(3)
    expect(plan.slots.slice(0, 3).map((slot) => slot.cookedDishId)).toEqual([7, 7, 7])
    for (const slot of dishSlots) {
      expect(slot.source).toBe('cooked_dish')
      expect(slot.recipeCode).toBe('FR-HAC')
      expect(slot.dishPortions).toBe(2)
      expect(slot.allocations).toEqual([])
      expect(slot.shortages).toEqual([])
      expect(slot.stockCoverage).toBe(1)
    }
    // Portions suivies : jamais plus que le restant (6 = 3 × 2).
    expect(dishSlots.reduce((sum, slot) => sum + slot.dishPortions, 0)).toBe(6)
    expect(plan.slots[3].cookedDishId).toBeUndefined()

    // Une réservation de portions par (créneau, plat) — aucun lot pour ces créneaux.
    const dishReservations = plan.reservations.filter((row) => row.cookedDishId != null)
    expect(dishReservations).toEqual([
      { cookedDishId: 7, dishName: 'Hachis Parmentier', portions: 2, slotKey: '2026-07-20-dejeuner', status: 'active' },
      { cookedDishId: 7, dishName: 'Hachis Parmentier', portions: 2, slotKey: '2026-07-20-diner', status: 'active' },
      { cookedDishId: 7, dishName: 'Hachis Parmentier', portions: 2, slotKey: '2026-07-21-dejeuner', status: 'active' },
    ])
    // Le plat ne repart jamais aux courses.
    expect(plan.shoppingItems.some((item) => item.formNormalized === 'boeuf hache cuit' && item.grams > 100)).toBe(false)
  })

  it('test C : entre deux plats compatibles, celui qui expire le premier est consommé en premier', () => {
    const plan = generateClosedLoopPlan({
      slots: weekSlots.slice(0, 2),
      recipes: [HACHIS, SALADE],
      cookedDishes: [
        { id: 3, name: 'Hachis parmentier', portionsRemaining: 2, expiresOn: '2026-07-24' },
        { id: 9, name: 'Salade de lentilles', portionsRemaining: 2, expiresOn: '2026-07-21' },
      ],
      constraints: { allowShopping: true },
    })
    expect(plan.slots.map((slot) => slot.cookedDishId)).toEqual([9, 3])
  })

  it('départage les péremptions identiques par identifiant croissant, DLC absente en dernier', () => {
    expect(compareDishesFefo({ id: 12, expiresOn: '2026-07-22' }, { id: 5, expiresOn: '2026-07-22' })).toBeGreaterThan(0)
    expect(compareDishesFefo({ id: 1, expiresOn: null }, { id: 99, expiresOn: '2026-12-31' })).toBeGreaterThan(0)
    const pool = buildDishAvailability([
      { id: 12, name: 'A', portionsRemaining: 2, expiresOn: '2026-07-22' },
      { id: 5, name: 'B', portionsRemaining: 2, expiresOn: '2026-07-22' },
      { id: 2, name: 'C', portionsRemaining: 2, expiresOn: null },
    ])
    expect(pool.map((dish) => dish.id)).toEqual([5, 12, 2])
  })

  it('jamais de complément partiel en P1 : un plat de 4 portions ne nourrit pas un créneau de 6', () => {
    const bigRecipe = makeRecipe('FR-HAC', 'Hachis parmentier', 'boeuf hache cuit', { servings: 6 })
    const plan = generateClosedLoopPlan({
      slots: weekSlots.slice(0, 1),
      recipes: [bigRecipe],
      cookedDishes: [{ id: 7, name: 'Hachis parmentier', portionsRemaining: 4, expiresOn: '2026-07-25' }],
      constraints: { allowShopping: true },
    })
    expect(plan.slots[0].cookedDishId).toBeUndefined()
    expect(plan.reservations.every((row) => row.cookedDishId == null)).toBe(true)
  })

  it('ne consomme jamais un plat après sa date limite : le créneau du jeudi cuisine frais', () => {
    const plan = generateClosedLoopPlan({
      slots: [{ key: '2026-07-23-diner', date: '2026-07-23', mealType: 'diner' }],
      recipes: [HACHIS, SALADE],
      cookedDishes: [{ id: 7, name: 'Hachis parmentier', portionsRemaining: 6, expiresOn: '2026-07-21' }],
      constraints: { allowShopping: true },
    })
    expect(plan.slots[0].cookedDishId).toBeUndefined()
  })

  it('déduit les réservations de portions des AUTRES versions ; celles de la version remplacée ne sont pas transmises', () => {
    const base = {
      slots: weekSlots.slice(0, 1),
      recipes: [HACHIS, SALADE],
      cookedDishes: [{ id: 7, name: 'Hachis parmentier', portionsRemaining: 2, expiresOn: '2026-07-25' }],
      constraints: { allowShopping: true },
    }
    // Une autre version active réserve tout le plat → indisponible.
    const blocked = generateClosedLoopPlan({
      ...base,
      existingDishReservations: [{ cookedDishId: 7, portions: 2, status: 'active' }],
    })
    expect(blocked.slots[0].cookedDishId).toBeUndefined()
    // La régénération exclut les réservations de la version remplacée : elles
    // ne sont simplement pas transmises → le plat redevient consommable.
    const freed = generateClosedLoopPlan(base)
    expect(freed.slots[0].cookedDishId).toBe(7)
    // Une réservation libérée ne bloque pas non plus.
    const released = generateClosedLoopPlan({
      ...base,
      existingDishReservations: [{ cookedDishId: 7, portions: 2, status: 'released' }],
    })
    expect(released.slots[0].cookedDishId).toBe(7)
  })

  it('respecte les contraintes dures du foyer : un plat dont la recette porte un allergène est écarté', () => {
    const unsafe = makeRecipe('FR-HAC', 'Hachis parmentier', 'boeuf hache cuit', { allergens: ['gluten'] })
    const plan = generateClosedLoopPlan({
      slots: weekSlots.slice(0, 1),
      recipes: [unsafe, SALADE],
      cookedDishes: [{ id: 7, name: 'Hachis parmentier', portionsRemaining: 6, expiresOn: '2026-07-25' }],
      constraints: { allowShopping: true, allergens: ['gluten'] },
    })
    expect(plan.slots[0].cookedDishId).toBeUndefined()
    expect(plan.slots[0].recipeCode).toBe('FR-SAL')
  })

  it('n’apparie un plat que par égalité exacte de nom normalisé — jamais de flou', () => {
    const plan = generateClosedLoopPlan({
      slots: weekSlots.slice(0, 1),
      recipes: [HACHIS, SALADE],
      cookedDishes: [{ id: 7, name: 'Hachis parmentier maison', portionsRemaining: 6, expiresOn: '2026-07-25' }],
      constraints: { allowShopping: true },
    })
    expect(plan.slots[0].cookedDishId).toBeUndefined()
  })

  it('reste déterministe : deux exécutions identiques produisent exactement le même plan', () => {
    const build = () => generateClosedLoopPlan({
      slots: weekSlots,
      recipes: [HACHIS, SALADE],
      inventoryLots: [{ id: 'lot-1', formNormalized: 'lentilles cuites', gramsAvailable: 150, expiresOn: '2026-07-22' }],
      cookedDishes: [
        { id: 7, name: 'Hachis parmentier', portionsRemaining: 4, expiresOn: '2026-07-23' },
        { id: 2, name: 'Salade de lentilles', portionsRemaining: 2, expiresOn: '2026-07-23' },
      ],
      constraints: { allowShopping: true },
    })
    expect(JSON.parse(JSON.stringify(build()))).toEqual(JSON.parse(JSON.stringify(build())))
  })

  it('régression zéro plat : le plan est identique octet pour octet à l’existant', () => {
    const inputs = {
      slots: weekSlots.slice(0, 2),
      recipes: [HACHIS, SALADE],
      inventoryLots: [{ id: 'lot-1', formNormalized: 'boeuf hache cuit', gramsAvailable: 150, expiresOn: '2026-07-21' }],
      constraints: { allowShopping: true },
    }
    const before = generateClosedLoopPlan(inputs)
    const withEmpty = generateClosedLoopPlan({ ...inputs, cookedDishes: [], existingDishReservations: [] })
    expect(JSON.stringify(withEmpty)).toBe(JSON.stringify(before))
    expect(JSON.stringify(before)).not.toContain('cookedDish')
  })
})

describe('buildCanonicalPlanPayload — créneaux nourris par un plat cuisiné', () => {
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
  const members = [{ name: 'Alex', portion_multiplier: 1 }, { name: 'Sam', portion_multiplier: 1 }]

  const freshSlot = {
    key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner',
    recipeCode: 'FR-TEST', allocations: [], shortages: [{ formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 200 }],
    stockCoverage: 0, explanations: [],
  }
  const dishSlot = (overrides = {}) => ({
    key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner',
    recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 1, explanations: [],
    source: 'cooked_dish', cookedDishId: 42, cookedDishName: 'Plat test', dishPortions: 2,
    dishNutritionPerPortion: { kcal: 320, proteinG: 14, carbsG: 42, fatG: 11, fiberG: 7 },
    ...overrides,
  })
  const dishPlan = (slotOverrides = {}) => ({
    status: 'published', issues: [], objectiveScores: {},
    slots: [freshSlot, dishSlot(slotOverrides)],
    reservations: [{ slotKey: '2026-07-20-diner', cookedDishId: 42, dishName: 'Plat test', portions: 2, status: 'active' }],
    shoppingItems: [{ formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 200, neededBy: '2026-07-20' }],
  })

  it('lie le créneau au plat, publie une réservation de portions et une tâche de réchauffage', () => {
    const payload = buildCanonicalPlanPayload({
      plan: dishPlan(), recipes: [recipe], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
      cookedDishes: [{ id: 42, name: 'Plat test', portionsRemaining: 4, expiresOn: '2026-07-24' }],
    })

    const slot = payload.slots[1]
    expect(slot).toMatchObject({
      slot_key: '2026-07-20-diner',
      recipe_code: 'FR-TEST',
      cooked_dish_id: 42,
      source: 'cooked_dish',
      nutrition_source: 'cooked_dish_stored',
    })
    // Nutrition mémorisée du plat : 2 portions × 320 kcal.
    expect(slot.nutrition_total).toEqual({ kcal: 640, proteinG: 28, carbsG: 84, fatG: 22, fiberG: 14 })
    expect(slot.preparation).toMatchObject({ recipe_code: 'FR-TEST', mode: 'reheat', cooked_dish_id: 42 })
    expect(slot.preparation.exact_steps).toHaveLength(1)
    expect(slot.preparation.exact_steps[0].instruction).toContain('Réchauffer')
    expect(slot.stock_summary).toMatchObject({
      coverage: 1, allocations: [], shortages: [],
      cooked_dish: { id: 42, name: 'Plat test', portions: 2 },
    })

    // Contrat partagé : réservation de portions, jamais de lot.
    expect(payload.reservations).toEqual([{
      slot_key: '2026-07-20-diner',
      cooked_dish_id: 42,
      ingredient_name: 'Plat test',
      reserved_quantity: 2,
      reserved_unit: 'portion',
      needed_quantity: 2,
      needed_unit: 'portion',
      metadata: { allocation_strategy: 'cooked_dish_fefo' },
    }])

    // Jamais de « Préparer X » pour un plat déjà cuisiné.
    const reheatTask = payload.tasks.find((task) => task.slot_key === '2026-07-20-diner')
    expect(reheatTask).toMatchObject({
      task_key: 'reheat-2026-07-20-diner',
      task_type: 'reheat_dish',
      title: 'Réchauffer Plat test',
      duration_min: 10,
      priority: 80,
    })
    expect(reheatTask.title).not.toContain('Préparer')
    expect(payload.tasks.find((task) => task.slot_key === '2026-07-20-dejeuner').task_type).toBe('prepare_recipe')

    // Le créneau nourri par le plat ne consomme aucun ingrédient : le besoin
    // total reste celui du seul créneau frais (200 g, pas 400).
    const carrot = payload.shopping_items.find((item) => item.product_name === 'Carotte crue')
    expect(carrot).toMatchObject({ required_qty: 200, purchase_qty: 200 })

    // Les plats en jeu sont snapshotés dans les entrées du plan.
    expect(payload.input_snapshot.cooked_dishes).toEqual([
      { id: 42, name: 'Plat test', portions_remaining: 4, expires_on: '2026-07-24' },
    ])
  })

  it('retombe sur la nutrition de la recette appariée quand le plat ne mémorise pas la sienne', () => {
    const payload = buildCanonicalPlanPayload({
      plan: dishPlan({ dishNutritionPerPortion: null }), recipes: [recipe], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
    })
    const slot = payload.slots[1]
    expect(slot.nutrition_source).toBe('deterministic_exact_forms')
    expect(slot.nutrition_total.kcal).toBe(600)
  })

  it('régression zéro plat : le payload est identique octet pour octet à l’existant', () => {
    const plan = {
      status: 'published', issues: [], objectiveScores: {}, shoppingItems: [],
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-TEST', allocations: [{ lotId: 'lot-1', formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 150 }], shortages: [], stockCoverage: 0.75, explanations: [] },
      ],
      reservations: [{ slotKey: '2026-07-20-diner', lotId: 'lot-1', formNormalized: 'carotte crue', ingredientName: 'Carotte crue', grams: 150 }],
    }
    const build = (extra = {}) => buildCanonicalPlanPayload({
      plan, recipes: [recipe], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [{ id: 'lot-1', formNormalized: 'carotte crue', gramsAvailable: 150 }],
      ...extra,
    })
    const before = build()
    const withEmpty = build({ cookedDishes: [] })
    expect(JSON.stringify(withEmpty)).toBe(JSON.stringify(before))
    expect(JSON.stringify(before)).not.toContain('cooked_dish')
    // La forme historique des réservations de lots est inchangée.
    expect(before.reservations[0]).toEqual({
      slot_key: '2026-07-20-diner',
      lot_id: 'lot-1',
      ingredient_name: 'Carotte crue',
      reserved_quantity: 150,
      reserved_unit: 'g',
      needed_quantity: 150,
      needed_unit: 'g',
      metadata: { form_normalized: 'carotte crue', allocation_strategy: 'opened_first_then_fefo' },
    })
  })
})
