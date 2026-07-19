import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'
import {
  buildCookingSessions,
  freezerShelfLifeDays,
  isRecipeFreezable,
  resolveSessionCapMinutes,
  sessionWindowForHour,
  sessionWindowForMealType,
} from '@/lib/domain/planning/cookingSessions'

// Lot P3, volet A (audit §10 étape 6, §13 « Session de cuisine », §14 P3
// items 2/4/5/6) — sessions de cuisine déterministes, plafond de minutes
// actives par session, chaîne congélation/décongélation et surproduction
// volontaire bornée. Tout est exprimé avec les mécanismes existants du
// payload (tâches versionnées + dependencies[]) plus un bloc informatif
// payload.sessions[] que le RPC publish_closed_loop_plan ignore (seules les
// clés connues de p_payload sont lues).

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

// La congélabilité vient de la PROPRIÉTÉ éditoriale `conservation` du corpus
// V3 (jamais du nom du plat, F13).
const FREEZABLE_CONSERVATION = '3 jours au réfrigérateur ; congélation 3 mois.'
const GRATIN = makeRecipe('FR-GRA', 'Gratin de courgettes')
const GRATIN_CONGELABLE = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { conservation: FREEZABLE_CONSERVATION })

const members = [
  { name: 'Alex', portion_multiplier: 1 },
  { name: 'Sam', portion_multiplier: 0.5 },
]

describe('cookingSessions — congélabilité et fenêtres (helpers déterministes)', () => {
  it('congelable uniquement sur information déclarée, jamais par défaut ni depuis le nom', () => {
    expect(isRecipeFreezable(GRATIN_CONGELABLE)).toBe(true)
    expect(isRecipeFreezable(makeRecipe('X', 'Soupe congelable au nom trompeur'))).toBe(false)
    expect(isRecipeFreezable({})).toBe(false)
    expect(isRecipeFreezable({ conservation: '2 jours au réfrigérateur.' })).toBe(false)
    // Négation explicite dans la propriété de conservation → conservateur.
    expect(isRecipeFreezable({ conservation: 'Ne pas congeler.' })).toBe(false)
    // Le booléen déclaré prime sur le texte de conservation.
    expect(isRecipeFreezable({ freezable: false, conservation: FREEZABLE_CONSERVATION })).toBe(false)
    expect(isRecipeFreezable({ freezable: true })).toBe(true)
    expect(isRecipeFreezable({ freezerShelfLifeDays: 60 })).toBe(true)
  })

  it('la durée congélateur vient de lib/shelfLifeRules (90 j), jamais du texte de conservation', () => {
    // « congélation 3 mois » n'est PAS parsé : règle unique COOKED_DISH_SHELF_LIFE.freezer.
    expect(freezerShelfLifeDays(GRATIN_CONGELABLE)).toBe(90)
    expect(freezerShelfLifeDays({ freezerShelfLifeDays: 60 })).toBe(60)
  })

  it('fenêtre de session déduite de l’heure de la première consommation couverte', () => {
    expect(sessionWindowForHour(10)).toBe('matin')
    expect(sessionWindowForHour(14)).toBe('apres_midi')
    expect(sessionWindowForHour(17)).toBe('soir')
    expect(sessionWindowForMealType('dejeuner')).toBe('matin')
    expect(sessionWindowForMealType('diner')).toBe('soir')
  })

  it('plafond par défaut : 60 min les jours avec déjeuner planifié sur place, sinon 90 ; la préférence transmise prime', () => {
    expect(resolveSessionCapMinutes({}, true)).toBe(60)
    expect(resolveSessionCapMinutes({}, false)).toBe(90)
    expect(resolveSessionCapMinutes({ planning: { maxSessionActiveMinutes: 45 } }, true)).toBe(45)
    expect(resolveSessionCapMinutes({ planning: { maxSessionActiveMinutes: 0 } }, false)).toBe(90)
  })
})

describe('generateClosedLoopPlan — capacité temporelle des sessions (audit P3 item 6)', () => {
  const fourSlots = [
    { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
    { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
    { key: '2026-07-21-dejeuner', date: '2026-07-21', mealType: 'dejeuner' },
    { key: '2026-07-21-diner', date: '2026-07-21', mealType: 'diner' },
  ]

  it('borne la stratégie quand elle déborde : 50 min de cuisson + 5 min de portionnage par repas couvert ≤ 60', () => {
    const longPrep = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { prepMinutes: 50 })
    const plan = generateClosedLoopPlan({ slots: fourSlots, recipes: [longPrep], constraints: { allowShopping: true } })
    // 3 consommateurs = 50 + 15 = 65 > 60 → borné à 2 (50 + 10 = 60).
    expect(plan.slots[0].production.consumerSlotKeys).toEqual(['2026-07-20-diner', '2026-07-21-dejeuner'])
  })

  it('respecte une préférence planning transmise par l’appelant (household preferences → constraints.planning)', () => {
    const longPrep = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { prepMinutes: 50 })
    const plan = generateClosedLoopPlan({
      slots: fourSlots,
      recipes: [longPrep],
      constraints: { allowShopping: true, planning: { maxSessionActiveMinutes: 55 } },
    })
    expect(plan.slots[0].production.consumerSlotKeys).toEqual(['2026-07-20-diner'])
  })

  it('renonce à la production quand même un seul consommateur déborde — la cuisson fraîche n’est jamais bloquée', () => {
    const heavyPrep = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { prepMinutes: 58 })
    const plan = generateClosedLoopPlan({
      slots: [fourSlots[0], fourSlots[1]],
      recipes: [heavyPrep],
      constraints: { allowShopping: true },
    })
    // 58 + 5 = 63 > 60 (jour avec déjeuner) : aucune production, deux
    // cuissons fraîches publiées quand même.
    expect(plan.status).toBe('published')
    expect(JSON.stringify(plan)).not.toContain('production')
  })

  it('un jour sans déjeuner planifié laisse 90 min : la même stratégie redevient possible', () => {
    const heavyPrep = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { prepMinutes: 58 })
    const plan = generateClosedLoopPlan({
      slots: [
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
        { key: '2026-07-21-diner', date: '2026-07-21', mealType: 'diner' },
      ],
      recipes: [heavyPrep],
      constraints: { allowShopping: true },
    })
    // 58 + 5 = 63 ≤ 90 → production possible.
    expect(plan.slots[0].production.consumerSlotKeys).toEqual(['2026-07-21-diner'])
  })
})

describe('generateClosedLoopPlan — congélation/décongélation (audit P3 item 5)', () => {
  // Vendredi 24 : au-delà de la fenêtre réfrigérateur (lundi + 72 h = jeudi
  // 23) mais dans la fenêtre congélateur (lundi + 90 j).
  const freezeSlots = [
    { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
    { key: '2026-07-24-dejeuner', date: '2026-07-24', mealType: 'dejeuner' },
  ]
  // 200 g couvrent exactement 2 parts foyer : la surproduction « semaine
  // suivante » (3 parts → 300 g) coûterait des courses et perd au score.
  const lots = [{ id: 'lot-c', formNormalized: 'courgette cuite', gramsAvailable: 200, expiresOn: '2026-07-30' }]

  it('couvre un consommateur hors fenêtre frigo avec des portions congelées (recette congelable)', () => {
    const plan = generateClosedLoopPlan({
      slots: freezeSlots,
      recipes: [GRATIN_CONGELABLE],
      inventoryLots: lots,
      constraints: { allowShopping: true },
    })
    const producer = plan.slots[0]
    expect(producer.production).toMatchObject({
      productionKey: 'production-2026-07-20-dejeuner',
      scale: 2,
      storageMethod: 'refrigerator',
      useBy: '2026-07-23',
      consumerSlotKeys: [],
      freezer: {
        productionKey: 'production-2026-07-20-dejeuner-congelation',
        consumerSlotKeys: ['2026-07-24-dejeuner'],
        // Règle congélateur de lib/shelfLifeRules.js : 90 jours.
        useBy: '2026-10-18',
      },
    })
    const consumer = plan.slots[1]
    expect(consumer).toMatchObject({
      source: 'planned_production',
      productionKey: 'production-2026-07-20-dejeuner-congelation',
      producerSlotKey: '2026-07-20-dejeuner',
      storageMethod: 'freezer',
      allocations: [],
      stockCoverage: 1,
    })
    // Les ingrédients sont réservés UNE fois, à hauteur des 2 parts foyer.
    expect(plan.reservations).toEqual([
      { lotId: 'lot-c', formNormalized: 'courgette cuite', ingredientName: 'courgette cuite', grams: 200, slotKey: '2026-07-20-dejeuner', status: 'active' },
    ])
  })

  it('reste déterministe : deux exécutions identiques produisent le même plan congelé', () => {
    const build = () => generateClosedLoopPlan({
      slots: freezeSlots,
      recipes: [GRATIN_CONGELABLE],
      inventoryLots: lots,
      constraints: { allowShopping: true },
    })
    expect(JSON.parse(JSON.stringify(build()))).toEqual(JSON.parse(JSON.stringify(build())))
  })

  it('sans information de congélabilité : PAS de congélation, recuisson fraîche (conservateur)', () => {
    const plan = generateClosedLoopPlan({
      slots: freezeSlots,
      recipes: [GRATIN],
      inventoryLots: lots,
      constraints: { allowShopping: true },
    })
    expect(plan.status).toBe('published')
    expect(JSON.stringify(plan)).not.toContain('congelation')
    expect(JSON.stringify(plan)).not.toContain('production')
    expect(plan.slots[1].explanations).toContain('recipe_repeated')
  })

  it('surproduction volontaire bornée (item 4) : +1 part foyer congelée pour la semaine suivante quand elle ne coûte rien de plus', () => {
    // Sans stock, produire 3 parts au lieu de 2 ne change ni la couverture ni
    // la pénalité de courses : le bonus de mutualisation différée l’emporte.
    const plan = generateClosedLoopPlan({
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
      ],
      recipes: [GRATIN_CONGELABLE],
      constraints: { allowShopping: true },
    })
    const producer = plan.slots[0]
    expect(producer.production).toMatchObject({
      scale: 3,
      portions: 6,
      consumerSlotKeys: ['2026-07-20-diner'],
      freezer: {
        productionKey: 'production-2026-07-20-dejeuner-congelation',
        consumerSlotKeys: [],
        nextWeekPortions: 2,
        useBy: '2026-10-18',
      },
    })
    // Les courses sont dimensionnées à hauteur des 3 parts foyer.
    expect(plan.shoppingItems).toEqual([
      { formNormalized: 'courgette cuite', ingredientName: 'courgette cuite', grams: 300, neededBy: '2026-07-20' },
    ])
  })

  it('jamais de surproduction sans congélabilité : le plan non congelable reste identique au lot P2', () => {
    const plan = generateClosedLoopPlan({
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
      ],
      recipes: [GRATIN],
      constraints: { allowShopping: true },
    })
    expect(plan.slots[0].production).toEqual({
      productionKey: 'production-2026-07-20-dejeuner',
      outputName: 'Gratin de courgettes',
      portions: 4,
      scale: 2,
      storageMethod: 'refrigerator',
      availableFrom: '2026-07-20',
      useBy: '2026-07-23',
      consumerSlotKeys: ['2026-07-20-diner'],
    })
  })
})

describe('buildCanonicalPlanPayload — chaîne congélation et sessions (contrat P3)', () => {
  // Lundi complet + vendredi complet : le vendredi (J+4) est au-delà de la
  // fenêtre réfrigérateur (lundi + 72 h = jeudi 23) mais dans la fenêtre
  // congélateur. Le dîner de lundi reste couvert au réfrigérateur.
  const freezeSlots = [
    { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
    { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
    { key: '2026-07-24-dejeuner', date: '2026-07-24', mealType: 'dejeuner' },
    { key: '2026-07-24-diner', date: '2026-07-24', mealType: 'diner' },
  ]
  // 400 g couvrent exactement les 4 parts foyer : la surproduction « semaine
  // suivante » (5 parts → 500 g) coûterait des courses et perd au score.
  const lots = [{ id: 'lot-c', formNormalized: 'courgette cuite', gramsAvailable: 400, expiresOn: '2026-07-30' }]
  const buildFreezerPayload = () => {
    const plan = generateClosedLoopPlan({
      slots: freezeSlots,
      recipes: [GRATIN_CONGELABLE],
      inventoryLots: lots,
      constraints: { allowShopping: true },
    })
    return buildCanonicalPlanPayload({
      plan, recipes: [GRATIN_CONGELABLE], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
    })
  }

  it('publie une production sœur congélateur : storage_method=freezer, use_by règle congélateur, tâche source « Congeler »', () => {
    const payload = buildFreezerPayload()
    // Portions depuis les planned_servings personnalisés (test K) : 2 au
    // déjeuner + 2,5 au dîner, par jour couvert.
    expect(payload.productions).toEqual([
      {
        production_key: 'production-2026-07-20-dejeuner',
        task_key: 'prepare-2026-07-20-dejeuner',
        slot_key: '2026-07-20-dejeuner',
        recipe_code: 'FR-GRA',
        output_name: 'Gratin de courgettes',
        planned_portions: 4.5,
        storage_method: 'refrigerator',
        available_from: '2026-07-20',
        use_by: '2026-07-23',
      },
      {
        production_key: 'production-2026-07-20-dejeuner-congelation',
        task_key: 'freeze-2026-07-20-dejeuner',
        slot_key: '2026-07-20-dejeuner',
        recipe_code: 'FR-GRA',
        output_name: 'Gratin de courgettes',
        planned_portions: 4.5,
        storage_method: 'freezer',
        available_from: '2026-07-20',
        use_by: '2026-10-18',
      },
    ])
    // Les consommateurs congelés référencent la production congélateur ; le
    // use_by congélateur satisfait la validation temporelle du RPC.
    expect(payload.consumptions).toEqual([
      { slot_key: '2026-07-20-dejeuner', source: { production_key: 'production-2026-07-20-dejeuner' }, portions: 2, role: 'main' },
      { slot_key: '2026-07-20-diner', source: { production_key: 'production-2026-07-20-dejeuner' }, portions: 2.5, role: 'main' },
      { slot_key: '2026-07-24-dejeuner', source: { production_key: 'production-2026-07-20-dejeuner-congelation' }, portions: 2, role: 'main' },
      { slot_key: '2026-07-24-diner', source: { production_key: 'production-2026-07-20-dejeuner-congelation' }, portions: 2.5, role: 'main' },
    ])
  })

  it('chaîne cuire → congeler → décongeler (la veille) → manger : tâches et dépendances de la même version', () => {
    const payload = buildFreezerPayload()
    const freezeTask = payload.tasks.find((task) => task.task_key === 'freeze-2026-07-20-dejeuner')
    expect(freezeTask).toMatchObject({
      task_type: 'freeze_dish',
      prep_date: '2026-07-20',
      title: 'Congeler Gratin de courgettes (4,5 portions)',
      duration_min: 5,
      priority: 75,
    })
    const defrostTask = payload.tasks.find((task) => task.task_key === 'defrost-2026-07-24-dejeuner')
    expect(defrostTask).toMatchObject({
      task_type: 'defrost_dish',
      // La VEILLE du repas couvert.
      prep_date: '2026-07-23',
      title: 'Sortir Gratin de courgettes du congélateur',
      duration_min: 2,
      priority: 75,
    })
    expect(defrostTask.instructions[0].instruction).toContain('congélateur')
    expect(payload.dependencies).toEqual([
      { task_key: 'freeze-2026-07-20-dejeuner', depends_on_task_key: 'prepare-2026-07-20-dejeuner' },
      { task_key: 'reheat-2026-07-20-diner', depends_on_task_key: 'prepare-2026-07-20-dejeuner' },
      { task_key: 'defrost-2026-07-24-dejeuner', depends_on_task_key: 'freeze-2026-07-20-dejeuner' },
      { task_key: 'reheat-2026-07-24-dejeuner', depends_on_task_key: 'defrost-2026-07-24-dejeuner' },
      { task_key: 'defrost-2026-07-24-diner', depends_on_task_key: 'freeze-2026-07-20-dejeuner' },
      { task_key: 'reheat-2026-07-24-diner', depends_on_task_key: 'defrost-2026-07-24-diner' },
    ])
    // Test L : aucune dépendance orpheline — toutes les extrémités existent
    // dans les tâches de la même version.
    const taskKeys = new Set(payload.tasks.map((task) => task.task_key))
    for (const dependency of payload.dependencies) {
      expect(taskKeys.has(dependency.task_key)).toBe(true)
      expect(taskKeys.has(dependency.depends_on_task_key)).toBe(true)
    }
    // Le titre du producteur annonce les portions TOTALES (part congelée comprise).
    const cookTask = payload.tasks.find((task) => task.task_key === 'prepare-2026-07-20-dejeuner')
    expect(cookTask.title).toBe('Préparer Gratin de courgettes — 9 portions (4 repas)')
  })

  it('sessions[] : bloc informatif déterministe — jour, fenêtre, tâches de cuisson, minutes actives, portions, repas couverts', () => {
    const payload = buildFreezerPayload()
    expect(payload.sessions).toEqual([{
      session_key: 'session-2026-07-20-matin',
      date: '2026-07-20',
      window: 'matin',
      task_keys: ['prepare-2026-07-20-dejeuner', 'freeze-2026-07-20-dejeuner'],
      // 30 min de cuisson + 5 min « Congeler » + 5 min de portionnage par
      // repas consommateur couvert (1 frigo + 2 congelés).
      active_minutes_total: 50,
      portions_produced: 9,
      meals_covered: 4,
    }])
    // Mêmes entrées → mêmes sessions, reconstructibles côté lecture depuis
    // les tâches et productions publiées.
    expect(buildCookingSessions(payload)).toEqual(payload.sessions)
    expect(JSON.stringify(buildFreezerPayload())).toBe(JSON.stringify(payload))
  })

  it('surproduction semaine suivante : production congélateur sans consommation, congélation sans décongélation', () => {
    const plan = generateClosedLoopPlan({
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
      ],
      recipes: [GRATIN_CONGELABLE],
      constraints: { allowShopping: true },
    })
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [GRATIN_CONGELABLE], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
    })
    const freezer = payload.productions.find((production) => production.storage_method === 'freezer')
    // 2 portions foyer (recipe.servings) SANS créneau dans ce plan : le RPC
    // valide Σ consommations ≤ planned_portions ; matérialisées congelées,
    // elles reviendront par la boucle P1 (cooked_dishes FEFO) la semaine
    // suivante.
    expect(freezer).toMatchObject({
      production_key: 'production-2026-07-20-dejeuner-congelation',
      task_key: 'freeze-2026-07-20-dejeuner',
      planned_portions: 2,
      storage_method: 'freezer',
      use_by: '2026-10-18',
    })
    expect(payload.consumptions.every((consumption) => consumption.source.production_key !== freezer.production_key)).toBe(true)
    expect(payload.tasks.some((task) => task.task_key === 'freeze-2026-07-20-dejeuner')).toBe(true)
    expect(payload.tasks.some((task) => task.task_type === 'defrost_dish')).toBe(false)
    expect(payload.dependencies).toEqual([
      { task_key: 'freeze-2026-07-20-dejeuner', depends_on_task_key: 'prepare-2026-07-20-dejeuner' },
      { task_key: 'reheat-2026-07-20-diner', depends_on_task_key: 'prepare-2026-07-20-dejeuner' },
    ])
    // Le besoin d'ingrédients couvre les 3 parts foyer (surproduction incluse).
    const courgette = payload.shopping_items.find((item) => item.product_name === 'courgette cuite')
    expect(courgette).toMatchObject({ required_qty: 300, purchase_qty: 300 })
  })

  it('régression : un plan sans production n’a NI sessions NI tâches de congélation — payload identique à l’existant', () => {
    const quick = makeRecipe('FR-GRA', 'Gratin de courgettes', 'courgette cuite', { prepMinutes: 10 })
    const plan = generateClosedLoopPlan({
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
      ],
      recipes: [quick],
      inventoryLots: [{ id: 'lot-c', formNormalized: 'courgette cuite', gramsAvailable: 200, expiresOn: '2026-07-24' }],
      constraints: { allowShopping: true },
    })
    const build = () => buildCanonicalPlanPayload({
      plan, recipes: [quick], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
    })
    const payload = build()
    expect(payload.sessions).toBeUndefined()
    expect(payload.productions).toBeUndefined()
    expect(JSON.stringify(payload)).not.toContain('freeze')
    expect(JSON.stringify(payload)).not.toContain('session')
    expect(JSON.stringify(build())).toBe(JSON.stringify(payload))
  })

  it('un plan de production frigo-seul gagne le bloc sessions mais garde le contrat P2 inchangé', () => {
    const plan = generateClosedLoopPlan({
      slots: [
        { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
        { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
      ],
      recipes: [GRATIN],
      constraints: { allowShopping: true },
    })
    const payload = buildCanonicalPlanPayload({
      plan, recipes: [GRATIN], windowStart: '2026-07-20',
      members, constraints: {}, inventoryLots: [],
    })
    // Contrat P2 : une seule production réfrigérateur, dépendance réchauffage
    // → cuisson, aucun artefact congélation.
    expect(payload.productions).toHaveLength(1)
    expect(payload.productions[0]).toMatchObject({ storage_method: 'refrigerator', planned_portions: 4.5 })
    expect(payload.dependencies).toEqual([
      { task_key: 'reheat-2026-07-20-diner', depends_on_task_key: 'prepare-2026-07-20-dejeuner' },
    ])
    expect(JSON.stringify(payload)).not.toContain('congelation')
    expect(payload.sessions).toEqual([{
      session_key: 'session-2026-07-20-matin',
      date: '2026-07-20',
      window: 'matin',
      task_keys: ['prepare-2026-07-20-dejeuner'],
      // 30 min de cuisson + 5 min de portionnage pour le repas consommateur.
      active_minutes_total: 35,
      portions_produced: 4.5,
      meals_covered: 2,
    }])
  })
})
