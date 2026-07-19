import { describe, expect, it } from 'vitest'
import { allocateFromLots, buildAvailability, generateClosedLoopPlan, isMealSuitableRecipe, sensoryTransitionPenalty } from '@/lib/domain/planning/closedLoopPlanner'

const makeRecipe = (code, profile, form = 'carotte crue', overrides = {}) => ({
  code,
  family: `Recette ${code}`,
  eligible: true,
  servings: 2,
  prepMinutes: 15,
  cookMinutes: 20,
  cuisineOrigin: code === 'C' ? 'Italie' : 'France',
  allergens: [],
  techniques: [code === 'C' ? 'grillé' : 'mijotage'],
  sensory: {
    profile,
    scores: { richness: profile === 'rich_winey' ? 5 : 2, acidic: profile === 'fresh_acidic' ? 4 : 1, freshness: profile === 'fresh_acidic' ? 4 : 1 },
    target_textures: [profile === 'fresh_acidic' ? 'croquant' : 'fondant'],
  },
  exactIngredients: [{ name: form, formNormalized: form, grams: 100, optional: false }],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 },
  ...overrides,
})

describe('closedLoopPlanner', () => {
  it('réserve le stock globalement sans promettre deux fois le même lot', () => {
    const plan = generateClosedLoopPlan({
      slots: [{ key: 'd1', date: '2026-07-20' }, { key: 'd2', date: '2026-07-21' }],
      recipes: [makeRecipe('A', 'rich_winey'), makeRecipe('B', 'creamy_delicate')],
      inventoryLots: [{ id: 'lot-1', formNormalized: 'carotte crue', gramsAvailable: 150, expiresOn: '2026-07-21' }],
      constraints: { allowShopping: true, targetPerMeal: { kcal: 500, proteinG: 30 } },
    })
    expect(plan.status).toBe('published')
    expect(plan.reservations.reduce((sum, item) => sum + item.grams, 0)).toBe(150)
    expect(plan.shoppingItems).toContainEqual(expect.objectContaining({ formNormalized: 'carotte crue', grams: 50 }))
  })

  it('favorise une transition sensorielle variée', () => {
    const repeated = sensoryTransitionPenalty(makeRecipe('A', 'rich_winey'), makeRecipe('B', 'rich_winey'))
    const contrasted = sensoryTransitionPenalty(makeRecipe('A', 'rich_winey'), makeRecipe('C', 'fresh_acidic'))
    expect(repeated.total).toBeGreaterThan(contrasted.total)
    expect(repeated.reasons).toContain('sensory_profile_repeated')
  })

  it('respecte les allergènes comme contrainte dure', () => {
    const unsafe = makeRecipe('A', 'rich_winey', 'carotte crue', { allergens: ['gluten'] })
    const safe = makeRecipe('B', 'fresh_acidic')
    const plan = generateClosedLoopPlan({
      slots: [{ key: 'd1', date: '2026-07-20' }],
      recipes: [unsafe, safe],
      inventoryLots: [{ id: 'lot-1', formNormalized: 'carotte crue', gramsAvailable: 100 }],
      constraints: { allowShopping: true, allergens: ['gluten'] },
    })
    expect(plan.slots[0].recipeCode).toBe('B')
  })

  it('bloque les aliments interdits jusque dans une forme alimentaire précise', () => {
    const unsafe = makeRecipe('A', 'rich_winey', 'huile d arachide raffinee')
    const safe = makeRecipe('B', 'fresh_acidic', 'carotte crue')
    const plan = generateClosedLoopPlan({
      slots: [{ key: 'd1', date: '2026-07-20' }],
      recipes: [unsafe, safe],
      constraints: { allowShopping: true, forbiddenForms: ['arachide'] },
    })
    expect(plan.slots[0].recipeCode).toBe('B')
  })

  it('garde un plan faisable avec répétition pénalisée si une seule recette est sûre', () => {
    const onlySafe = makeRecipe('A', 'fresh_acidic')
    // Les deux créneaux sont espacés au-delà de la fenêtre de conservation
    // (72 h réfrigérateur) : la stratégie production du lot P2 est impossible,
    // le second créneau recuisine la même recette et la répétition est
    // pénalisée comme avant.
    const plan = generateClosedLoopPlan({
      slots: [{ key: 'd1', date: '2026-07-20' }, { key: 'd2', date: '2026-07-25' }],
      recipes: [onlySafe],
      constraints: { allowShopping: true },
    })
    expect(plan.status).toBe('published')
    expect(plan.slots).toHaveLength(2)
    expect(plan.slots[1].explanations).toContain('recipe_repeated')
    expect(JSON.stringify(plan)).not.toContain('production')
  })

  it('préserve les repas fixes et remplace seulement le créneau ciblé', () => {
    const fixed = makeRecipe('A', 'fresh_acidic', 'poulet', {
      exactIngredients: [{ name: 'Poulet', formNormalized: 'poulet', grams: 100, optional: false, category: 'volailles' }],
    })
    const replacement = makeRecipe('B', 'warm_aromatic', 'lentilles', {
      exactIngredients: [{ name: 'Lentilles', formNormalized: 'lentilles', grams: 100, optional: false, category: 'legumineuses' }],
    })
    const plan = generateClosedLoopPlan({
      slots: [
        { key: 'd1', date: '2026-07-20', mealType: 'dejeuner', fixedRecipeCode: 'A' },
        { key: 'd2', date: '2026-07-20', mealType: 'diner', excludedRecipeCodes: ['A'], intent: 'vegetarian' },
      ],
      recipes: [fixed, replacement],
      constraints: { allowShopping: true },
    })
    expect(plan.slots.map((slot) => slot.recipeCode)).toEqual(['A', 'B'])
  })

  it('écarte desserts, sauces et accompagnements du catalogue des repas', () => {
    expect(isMealSuitableRecipe(makeRecipe('DESS-001', 'sweet_spiced', 'farine', { category: 'dessert' }))).toBe(false)
    expect(isMealSuitableRecipe(makeRecipe('FR-024', 'creamy_delicate', 'lait', { category: 'sauce de base' }))).toBe(false)
    expect(isMealSuitableRecipe(makeRecipe('FR-033', 'fresh_acidic', 'lentilles', { category: 'salade complète' }))).toBe(true)
  })
})

describe('allocateFromLots', () => {
  const lotsFor = (form, availability) => availability.get(form) || []

  it('prélève les lots ouverts d’abord puis en ordre FEFO', () => {
    const availability = buildAvailability([
      { id: 'ferme-tardif', formNormalized: 'skyr nature', gramsAvailable: 100, expiresOn: '2026-07-28' },
      { id: 'ferme-proche', formNormalized: 'skyr nature', gramsAvailable: 100, expiresOn: '2026-07-22' },
      { id: 'ouvert', formNormalized: 'skyr nature', gramsAvailable: 80, expiresOn: '2026-07-25', opened: true },
    ])
    const { allocations, allocatedGrams, shortageGrams } = allocateFromLots(lotsFor('skyr nature', availability), 150)
    expect(allocations.map((entry) => [entry.lotId, entry.grams])).toEqual([['ouvert', 80], ['ferme-proche', 70]])
    expect(allocatedGrams).toBe(150)
    expect(shortageGrams).toBe(0)
  })

  it('retourne une allocation partielle avec le manque exact', () => {
    const availability = buildAvailability([
      { id: 'lot-1', formNormalized: 'oeufs durs', gramsAvailable: 60, expiresOn: '2026-07-24' },
    ])
    const lots = lotsFor('oeufs durs', availability)
    const { allocations, allocatedGrams, shortageGrams } = allocateFromLots(lots, 120)
    expect(allocations).toEqual([{ lotId: 'lot-1', grams: 60, expiresOn: '2026-07-24', opened: false }])
    expect(allocatedGrams).toBe(60)
    expect(shortageGrams).toBe(60)
    // Le lot est épuisé mais jamais sur-réservé.
    expect(lots[0].grams).toBe(0)
  })

  it('départage les péremptions identiques par identifiant croissant, de façon déterministe', () => {
    const build = () => buildAvailability([
      { id: 'lot-b', formNormalized: 'pomme', gramsAvailable: 150, expiresOn: '2026-07-24' },
      { id: 'lot-a', formNormalized: 'pomme', gramsAvailable: 150, expiresOn: '2026-07-24' },
    ])
    const first = allocateFromLots(lotsFor('pomme', build()), 150)
    const second = allocateFromLots(lotsFor('pomme', build()), 150)
    expect(first.allocations.map((entry) => entry.lotId)).toEqual(['lot-a'])
    expect(first).toEqual(second)
  })

  it('déduit les réservations actives existantes avant toute allocation', () => {
    const availability = buildAvailability(
      [{ id: 'lot-1', formNormalized: 'skyr nature', gramsAvailable: 200, expiresOn: '2026-07-23' }],
      [{ lotId: 'lot-1', grams: 150, status: 'active' }],
    )
    const { allocatedGrams, shortageGrams } = allocateFromLots(lotsFor('skyr nature', availability), 200)
    expect(allocatedGrams).toBe(50)
    expect(shortageGrams).toBe(150)
  })
})
