import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'

// Lot P2, volet solveur (audit §8, §10 étapes 4-6, §14 P2 items 2/4/5) —
// stratégies de production multi-portions :
// - le créneau producteur cuisine N portions et réserve les ingrédients UNE
//   fois, à hauteur de N (dimensionnement au niveau foyer) ;
// - les créneaux consommateurs (source 'planned_production') réchauffent sans
//   ingrédients propres et DÉPENDENT de la tâche de cuisson (F10, test L) ;
// - fenêtre de conservation déterministe : profil de la recette si déclaré,
//   sinon 72 h réfrigérateur (même règle que la matérialisation réelle,
//   lib/shelfLifeRules.js — F13) ;
// - portions publiées depuis les planned_servings, jamais le nombre de
//   lignes (test K) ;
// - zéro production quand la mutualisation ne domine pas → plan et payload
//   octet pour octet identiques à l'existant.

const makeRecipe = (code, family, form = 'courgette cuite', overrides = {}) => ({
  code,
  family,
  category: 'plat principal',
  eligible: true,
  servings: 2,
  prepMinutes: 30,
  cookMinutes: 20,
  cuisineOrigin: 'France',
  allergens: [],
  identityLevel: 'named_traditional_dish',
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', scores: { richness: 2, acidic: 1, freshness: 1 }, target_textures: ['fondant'] },
  exactIngredients: [{ name: form, formNormalized: form, quantity: 100, unit: 'g', grams: 100, optional: false, category: 'legumes' }],
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 },
  nutritionCoverage: { pct: 100 },
  ...overrides,
})

const GRATIN = makeRecipe('FR-GRA', 'Gratin de courgettes')

const daySlots = [
  { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
  { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
]

describe('generateClosedLoopPlan — stratégies de production (audit P2)', () => {
  it('test B : produit 4 portions au déjeuner et couvre le dîner — ingrédients réservés UNE fois à hauteur de 4 portions', () => {
    const plan = generateClosedLoopPlan({
      slots: daySlots,
      recipes: [GRATIN],
      inventoryLots: [{ id: 'lot-c', formNormalized: 'courgette cuite', gramsAvailable: 200, expiresOn: '2026-07-24' }],
      constraints: { allowShopping: true },
    })
    expect(plan.status).toBe('published')

    const producer = plan.slots[0]
    expect(producer.production).toEqual({
      productionKey: 'production-2026-07-20-dejeuner',
      outputName: 'Gratin de courgettes',
      portions: 4,
      scale: 2,
      storageMethod: 'refrigerator',
      availableFrom: '2026-07-20',
      useBy: '2026-07-23',
      consumerSlotKeys: ['2026-07-20-diner'],
    })
    // 2 × 100 g réservés sur le créneau producteur, rien ailleurs.
    expect(producer.allocations).toEqual([
      { lotId: 'lot-c', formNormalized: 'courgette cuite', ingredientName: 'courgette cuite', grams: 200 },
    ])
    expect(plan.reservations).toEqual([
      { lotId: 'lot-c', formNormalized: 'courgette cuite', ingredientName: 'courgette cuite', grams: 200, slotKey: '2026-07-20-dejeuner', status: 'active' },
    ])

    const consumer = plan.slots[1]
    expect(consumer).toMatchObject({
      source: 'planned_production',
      recipeCode: 'FR-GRA',
      productionKey: 'production-2026-07-20-dejeuner',
      producerSlotKey: '2026-07-20-dejeuner',
      allocations: [],
      shortages: [],
      stockCoverage: 1,
      productionPortions: 2,
    })
    // Le stock couvrait tout : rien ne part aux courses.
    expect(plan.shoppingItems).toEqual([])
  })

  it('les courses sont dimensionnées comme la production : N portions manquantes, pas une par créneau', () => {
    const plan = generateClosedLoopPlan({
      slots: daySlots,
      recipes: [GRATIN],
      constraints: { allowShopping: true },
    })
    expect(plan.slots[0].production?.scale).toBe(2)
    expect(plan.shoppingItems).toEqual([
      { formNormalized: 'courgette cuite', ingredientName: 'courgette cuite', grams: 200, neededBy: '2026-07-20' },
    ])
  })

  it('respecte la fenêtre de conservation : couvre jusqu’à use_by inclus, jamais au-delà', () => {
    const plan = generateClosedLoopPlan({
      slots: [
        daySlots[0],
        // Jeudi 23 = use_by exact (lundi + 72 h) → couvert.
        { key: '2026-07-23-dejeuner', date: '2026-07-23', mealType: 'dejeuner' },
        // Vendredi 24 > use_by → jamais couvert, recuisson fraîche.
        { key: '2026-07-24-dejeuner', date: '2026-07-24', mealType: 'dejeuner' },
      ],
      recipes: [GRATIN],
      constraints: { allowShopping: true },
    })
    expect(plan.slots[0].production?.consumerSlotKeys).toEqual(['2026-07-23-dejeuner'])
    expect(plan.slots[1].source).toBe('planned_production')
    expect(plan.slots[2].productionKey).toBeUndefined()
    expect(plan.slots[2].explanations).toContain('recipe_repeated')
  })

  it('utilise la fenêtre déclarée par la recette quand elle existe (audit §9.3)', () => {
    const longKeeper = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { shelfLifeDays: 5 })
    const plan = generateClosedLoopPlan({
      slots: [daySlots[0], { key: '2026-07-25-diner', date: '2026-07-25', mealType: 'diner' }],
      recipes: [longKeeper],
      constraints: { allowShopping: true },
    })
    expect(plan.slots[0].production?.useBy).toBe('2026-07-25')
    expect(plan.slots[1].source).toBe('planned_production')
  })

  it('ne dépasse jamais 3 consommateurs ni 2 productions par plan, et ne couvre pas les créneaux figés', () => {
    const week = Array.from({ length: 5 }).flatMap((_, day) => [
      { key: `2026-07-2${day}-dejeuner`, date: `2026-07-2${day}`, mealType: 'dejeuner' },
      { key: `2026-07-2${day}-diner`, date: `2026-07-2${day}`, mealType: 'diner' },
    ])
    week[3] = { ...week[3], fixedRecipeCode: 'FR-GRA' }
    const plan = generateClosedLoopPlan({
      slots: week,
      recipes: [GRATIN],
      constraints: { allowShopping: true },
    })
    const producers = plan.slots.filter((slot) => slot.production)
    expect(producers.length).toBeLessThanOrEqual(2)
    for (const producer of producers) {
      expect(producer.production.consumerSlotKeys.length).toBeLessThanOrEqual(3)
      expect(producer.production.consumerSlotKeys).not.toContain(week[3].key)
    }
    // Le créneau figé reste cuisiné frais, jamais couvert.
    const fixedSlot = plan.slots.find((slot) => slot.key === week[3].key)
    expect(fixedSlot.productionKey).toBeUndefined()
    expect(fixedSlot.recipeCode).toBe('FR-GRA')
  })

  it('un reste existant garde la priorité FEFO : jamais couvert par une production', () => {
    const plan = generateClosedLoopPlan({
      slots: daySlots,
      recipes: [GRATIN],
      cookedDishes: [{ id: 9, name: 'Gratin de courgettes', portionsRemaining: 2, expiresOn: '2026-07-21' }],
      constraints: { allowShopping: true },
    })
    // Le plat existant nourrit le premier créneau (pré-passe) ; le second
    // cuisine frais SANS production (aucun consommateur disponible).
    expect(plan.slots[0].cookedDishId).toBe(9)
    expect(plan.slots[1].production).toBeUndefined()
    expect(plan.slots[1].productionKey).toBeUndefined()
    // Les créneaux plats-existants du P1 n'ont pas de dépendance.
    expect(plan.slots[0].producerSlotKey).toBeUndefined()
  })

  it('reste déterministe : deux exécutions identiques produisent exactement le même plan', () => {
    const build = () => generateClosedLoopPlan({
      slots: daySlots,
      recipes: [GRATIN, makeRecipe('FR-SAL', 'Salade de lentilles', 'lentilles cuites')],
      inventoryLots: [{ id: 'lot-c', formNormalized: 'courgette cuite', gramsAvailable: 200, expiresOn: '2026-07-24' }],
      constraints: { allowShopping: true },
    })
    expect(JSON.parse(JSON.stringify(build()))).toEqual(JSON.parse(JSON.stringify(build())))
  })

  it('régression zéro production : sans temps actif économisé, le plan est identique octet pour octet à l’existant', () => {
    const quick = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { prepMinutes: 10 })
    const plan = generateClosedLoopPlan({
      slots: daySlots,
      recipes: [quick],
      inventoryLots: [{ id: 'lot-c', formNormalized: 'courgette cuite', gramsAvailable: 200, expiresOn: '2026-07-24' }],
      constraints: { allowShopping: true },
    })
    expect(plan.status).toBe('published')
    // Réchauffer coûte autant que cuisiner (10 min) : la mutualisation ne
    // domine pas, aucune stratégie n'est même générée.
    expect(JSON.stringify(plan)).not.toContain('production')
    expect(plan.slots[1].explanations).toContain('recipe_repeated')
  })
})

describe('buildCanonicalPlanPayload — productions, consommations, dépendances (contrat P2)', () => {
  const members = [
    { name: 'Alex', portion_multiplier: 1 },
    { name: 'Sam', portion_multiplier: 0.5 },
  ]
  const buildPlanAndPayload = (extra = {}) => {
    const plan = generateClosedLoopPlan({
      slots: daySlots,
      recipes: [GRATIN],
      constraints: { allowShopping: true },
    })
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [GRATIN], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
      ...extra,
    })
    return { plan, payload }
  }

  it('test K : les portions produites viennent des planned_servings, jamais du nombre de lignes', () => {
    const { payload } = buildPlanAndPayload()
    // 2 membres × 2 créneaux = 4 lignes de repas ; les planned_servings
    // (multiplicateur de portion × ajustement énergétique) totalisent 4,5 —
    // c'est CETTE somme qui dimensionne la production, pas les 4 lignes.
    const mealLines = payload.legacy_meals.filter((meal) => ['dejeuner', 'diner'].includes(meal.meal_type))
    expect(mealLines).toHaveLength(4)
    const plannedServingsTotal = mealLines.reduce((sum, meal) => sum + meal.planned_servings, 0)
    expect(plannedServingsTotal).toBe(4.5)
    expect(payload.productions).toEqual([{
      production_key: 'production-2026-07-20-dejeuner',
      task_key: 'prepare-2026-07-20-dejeuner',
      slot_key: '2026-07-20-dejeuner',
      recipe_code: 'FR-GRA',
      output_name: 'Gratin de courgettes',
      planned_portions: plannedServingsTotal,
      storage_method: 'refrigerator',
      available_from: '2026-07-20',
      use_by: '2026-07-23',
    }])
    // Une consommation par créneau nourri (producteur compris), la somme
    // égale les portions produites.
    // L'ajustement énergétique diffère entre déjeuner et dîner : 2 + 2,5.
    expect(payload.consumptions).toEqual([
      { slot_key: '2026-07-20-dejeuner', source: { production_key: 'production-2026-07-20-dejeuner' }, portions: 2, role: 'main' },
      { slot_key: '2026-07-20-diner', source: { production_key: 'production-2026-07-20-dejeuner' }, portions: 2.5, role: 'main' },
    ])
  })

  it('tests L et E : la dépendance réchauffage → cuisson relie deux tâches de la même version', () => {
    const { payload } = buildPlanAndPayload()
    expect(payload.dependencies).toEqual([
      { task_key: 'reheat-2026-07-20-diner', depends_on_task_key: 'prepare-2026-07-20-dejeuner' },
    ])
    const taskKeys = new Set(payload.tasks.map((task) => task.task_key))
    for (const dependency of payload.dependencies) {
      expect(taskKeys.has(dependency.task_key)).toBe(true)
      expect(taskKeys.has(dependency.depends_on_task_key)).toBe(true)
    }
  })

  it('test I : tâche de cuisson lisible (« N portions, Y repas ») et tâche de réchauffage minimale', () => {
    const { payload } = buildPlanAndPayload()
    const cookTask = payload.tasks.find((task) => task.task_key === 'prepare-2026-07-20-dejeuner')
    expect(cookTask).toMatchObject({
      task_type: 'prepare_recipe',
      title: 'Préparer Gratin de courgettes — 4,5 portions (2 repas)',
      duration_min: 30,
    })
    const reheatTask = payload.tasks.find((task) => task.task_key === 'reheat-2026-07-20-diner')
    expect(reheatTask).toMatchObject({
      task_type: 'reheat_dish',
      title: 'Réchauffer Gratin de courgettes',
      duration_min: 10,
      priority: 75,
    })
    expect(reheatTask.instructions[0].instruction).toContain('Réchauffer')
  })

  it('le créneau consommateur n’ajoute aucun besoin d’ingrédients : courses à hauteur de N portions, une seule fois', () => {
    const { payload } = buildPlanAndPayload()
    const producerSlot = payload.slots[0]
    const consumerSlot = payload.slots[1]
    expect(producerSlot).toMatchObject({
      source: 'canonical_v3',
      production_key: 'production-2026-07-20-dejeuner',
    })
    expect(consumerSlot).toMatchObject({
      source: 'planned_production',
      production_key: 'production-2026-07-20-dejeuner',
      recipe_code: 'FR-GRA',
      // Même chemin nutritionnel que le producteur (recette produite).
      nutrition_source: 'deterministic_exact_forms',
    })
    expect(consumerSlot.preparation).toMatchObject({ mode: 'reheat', recipe_code: 'FR-GRA' })
    expect(consumerSlot.stock_summary).toMatchObject({
      allocations: [],
      shortages: [],
      planned_production: {
        production_key: 'production-2026-07-20-dejeuner',
        producer_slot_key: '2026-07-20-dejeuner',
        portions: 2,
      },
    })
    // Besoin total = 2 × 100 g (portions produites), pas 100 g par créneau
    // ni 300 g : le consommateur ne compte pas.
    const courgette = payload.shopping_items.find((item) => item.product_name === 'courgette cuite')
    expect(courgette).toMatchObject({ required_qty: 200, purchase_qty: 200 })
  })

  it('régression zéro production : le payload est identique octet pour octet à l’existant', () => {
    const quick = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { prepMinutes: 10 })
    const plan = generateClosedLoopPlan({
      slots: daySlots,
      recipes: [quick],
      constraints: { allowShopping: true },
    })
    const build = () => buildCanonicalPlanPayload({
      plan, recipes: [quick], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
    })
    const payload = build()
    expect(payload.productions).toBeUndefined()
    expect(payload.consumptions).toBeUndefined()
    expect(payload.dependencies).toEqual([])
    expect(JSON.stringify(payload)).not.toContain('production')
    expect(JSON.stringify(build())).toBe(JSON.stringify(payload))
  })

  it('contrat P1 intact : plat existant → consommation avec source cooked_dish_id, réservation de portions conservée, aucune dépendance', () => {
    const plan = generateClosedLoopPlan({
      slots: daySlots,
      recipes: [GRATIN],
      cookedDishes: [{ id: 9, name: 'Gratin de courgettes', portionsRemaining: 4, expiresOn: '2026-07-22' }],
      constraints: { allowShopping: true },
    })
    // 4 portions → les deux créneaux sont nourris par le plat existant.
    expect(plan.slots.map((slot) => slot.cookedDishId)).toEqual([9, 9])
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [GRATIN], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
      cookedDishes: [{ id: 9, name: 'Gratin de courgettes', portionsRemaining: 4, expiresOn: '2026-07-22' }],
    })
    // La réservation de portions du P1 reste émise EN PARALLÈLE de la
    // consommation (contrat partagé).
    expect(payload.reservations).toHaveLength(2)
    expect(payload.reservations[0]).toMatchObject({ cooked_dish_id: 9, reserved_unit: 'portion', reserved_quantity: 2 })
    expect(payload.consumptions).toEqual([
      { slot_key: '2026-07-20-dejeuner', source: { cooked_dish_id: 9 }, portions: 2, role: 'main' },
      { slot_key: '2026-07-20-diner', source: { cooked_dish_id: 9 }, portions: 2, role: 'main' },
    ])
    // Le plat existe déjà : aucune production, aucune dépendance.
    expect(payload.productions).toBeUndefined()
    expect(payload.dependencies).toEqual([])
  })
})
