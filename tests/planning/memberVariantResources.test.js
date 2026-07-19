import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'

// Lot P3 — Bloquant #3 du verdict directeur : une variante membre (échange
// végétarien affiché via preparation.member_variants) doit désormais être
// PROVISIONNÉE en plus de la recette de base — réservée sur le stock résiduel
// ou envoyée aux courses — jamais juste affichée sans ingrédients réels.

const meatRecipe = {
  code: 'MEAT-TEST', family: 'Bœuf mijoté', eligible: true, servings: 2, prepMinutes: 25,
  identityLevel: 'named_traditional_dish', techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', scores: { richness: 3 }, identity_guardrails: [] },
  exactIngredients: [{
    name: 'Bœuf', formNormalized: 'boeuf', quantity: 300,
    unit: 'g', grams: 300, optional: false, category: 'viandes',
  }],
  exactSteps: [{ n: 1, instruction: 'Mijoter le bœuf.' }],
  nutritionPerServing: { kcal: 500, proteinG: 35, carbsG: 30, fatG: 20, fiberG: 5 },
  nutritionCoverage: { pct: 100 },
}

const veggieRecipe = {
  code: 'VEG-TEST', family: 'Lentilles corail', eligible: true, servings: 2, prepMinutes: 20,
  identityLevel: 'named_traditional_dish', techniques: ['cuisson'],
  sensory: { profile: 'earthy', scores: { richness: 2 }, identity_guardrails: [] },
  exactIngredients: [{
    name: 'Lentilles corail', formNormalized: 'lentilles corail', quantity: 250,
    unit: 'g', grams: 250, optional: false, category: 'legumineuses',
  }],
  exactSteps: [{ n: 1, instruction: 'Cuire les lentilles corail.' }],
  nutritionPerServing: { kcal: 500, proteinG: 25, carbsG: 60, fatG: 12, fiberG: 15 },
  nutritionCoverage: { pct: 100 },
}

// Zoé déclenche par défaut un échange végétarien par semaine (memberRules,
// personalizedMeals.js) — un seul créneau viande (le premier du parcours,
// donc le déjeuner) est swappé, le dîner reste la recette de base.
const zoe = { name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: false } } }

const basePlan = () => ({
  status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
  slots: [
    { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'MEAT-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
    { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'MEAT-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
  ],
})

describe('P3 — provisionnement des variantes membre (bloquant #3)', () => {
  it('réserve les ingrédients de la variante sur le stock résiduel, rattachés au créneau principal', () => {
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(), recipes: [meatRecipe, veggieRecipe], windowStart: '2026-07-20',
      members: [zoe], constraints: {},
      inventoryLots: [{ id: 'lot-lentilles', formNormalized: 'lentilles corail', gramsAvailable: 300 }],
    })
    // La variante doit apparaître à l'affichage, comme avant.
    const lunchSlot = payload.slots.find((slot) => slot.slot_key === '2026-07-20-dejeuner')
    expect(lunchSlot.preparation.member_variants).toEqual([
      { person_name: 'Zoé', recipe_code: 'VEG-TEST', href: '/recipes/canonical/VEG-TEST', reason: 'vegetarian_swap' },
    ])
    // Et désormais aussi provisionnée : réservation de lot rattachée au
    // créneau du déjeuner (jamais un créneau dédié à la variante).
    const variantReservation = payload.reservations.find((res) => res.metadata?.variant === true)
    expect(variantReservation).toMatchObject({
      slot_key: '2026-07-20-dejeuner',
      lot_id: 'lot-lentilles',
      ingredient_name: 'Lentilles corail',
      reserved_quantity: 250,
      reserved_unit: 'g',
      metadata: { form_normalized: 'lentilles corail', allocation_strategy: 'opened_first_then_fefo', variant: true, variant_recipe_code: 'VEG-TEST' },
    })
    // Pleinement couverte par le stock : rien aux courses pour ce résidu.
    expect(payload.shopping_items.some((item) => item.shortage_reason === 'member_variant')).toBe(false)
    // La recette de BASE (viande) reste intacte : aucune réduction de ses
    // propres besoins/réservations du fait de la variante.
    expect(payload.recipe_executions.some((execution) => execution.recipe_code === 'MEAT-TEST')).toBe(true)
  })

  it('envoie le résidu non couvert de la variante aux courses avec shortage_reason member_variant', () => {
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(), recipes: [meatRecipe, veggieRecipe], windowStart: '2026-07-20',
      members: [zoe], constraints: {},
      // 100 g en stock sur 250 g requis : 150 g à acheter.
      inventoryLots: [{ id: 'lot-lentilles', formNormalized: 'lentilles corail', gramsAvailable: 100 }],
    })
    const variantReservation = payload.reservations.find((res) => res.metadata?.variant === true)
    expect(variantReservation).toMatchObject({ reserved_quantity: 100 })
    const shoppingItem = payload.shopping_items.find((item) => item.shortage_reason === 'member_variant')
    expect(shoppingItem).toMatchObject({
      category: 'Épicerie',
      product_name: 'Lentilles corail',
      required_qty: 250,
      stock_qty: 100,
      reserved_qty: 100,
      purchase_qty: 150,
      purchase_unit: 'g',
      needed_by: '2026-07-20',
    })
    expect(shoppingItem.notes).toContain('VEG-TEST')
    expect(shoppingItem.notes).toContain('Zoé')
  })

  it('publie une tâche prepare_recipe pour la variante, rattachée au créneau', () => {
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(), recipes: [meatRecipe, veggieRecipe], windowStart: '2026-07-20',
      members: [zoe], constraints: {},
      inventoryLots: [{ id: 'lot-lentilles', formNormalized: 'lentilles corail', gramsAvailable: 300 }],
    })
    const variantTask = payload.tasks.find((task) => task.task_key === 'prepare-variant-2026-07-20-dejeuner-VEG-TEST')
    expect(variantTask).toMatchObject({
      slot_key: '2026-07-20-dejeuner',
      prep_date: '2026-07-20',
      prep_label: 'Déjeuner',
      title: 'Préparer Lentilles corail (variante Zoé)',
      task_type: 'prepare_recipe',
      duration_min: 20,
      priority: 60,
      instructions: veggieRecipe.exactSteps,
    })
    // La tâche standard du déjeuner (recette de base) reste elle aussi publiée.
    expect(payload.tasks.some((task) => task.task_key === 'prepare-2026-07-20-dejeuner')).toBe(true)
  })

  it('est déterministe : deux constructions identiques produisent un payload identique', () => {
    const build = () => buildCanonicalPlanPayload({
      plan: basePlan(), recipes: [meatRecipe, veggieRecipe], windowStart: '2026-07-20',
      members: [zoe], constraints: {},
      inventoryLots: [{ id: 'lot-lentilles', formNormalized: 'lentilles corail', gramsAvailable: 180 }],
    })
    const a = build()
    const b = build()
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(a.input_hash).toBe(b.input_hash)
  })

  it('reste octet pour octet identique sans membre variant, même avec une recette végétarienne éligible dans le snapshot', () => {
    // Alex ne déclenche aucun échange végétarien (memberRules par défaut).
    const alex = { name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: false } } }
    const withoutVeggie = buildCanonicalPlanPayload({
      plan: basePlan(), recipes: [meatRecipe], windowStart: '2026-07-20',
      members: [alex], constraints: {},
      inventoryLots: [{ id: 'lot-lentilles', formNormalized: 'lentilles corail', gramsAvailable: 300 }],
    })
    const withVeggie = buildCanonicalPlanPayload({
      plan: basePlan(), recipes: [meatRecipe, veggieRecipe], windowStart: '2026-07-20',
      members: [alex], constraints: {},
      inventoryLots: [{ id: 'lot-lentilles', formNormalized: 'lentilles corail', gramsAvailable: 300 }],
    })
    expect(JSON.stringify(withoutVeggie)).toBe(JSON.stringify(withVeggie))
    expect(withoutVeggie.reservations.some((res) => res.metadata?.variant)).toBe(false)
    expect(withoutVeggie.tasks.some((task) => task.task_key.startsWith('prepare-variant-'))).toBe(false)
  })
})
