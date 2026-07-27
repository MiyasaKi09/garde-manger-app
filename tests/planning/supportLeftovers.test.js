import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'
import {
  SUPPORT_ENERGY_SHARE, buildSupportLeftoverPool, claimSupportLeftover, isSupportCompatible,
} from '@/lib/domain/planning/supportLeftovers'

// §13 — famille « reste compatible » : une prise support peut être nourrie par
// une portion d'un plat déjà cuisiné plutôt que par un assemblage acheté.
// L'enjeu de ces tests n'est pas qu'un reste soit servi — c'est qu'une portion
// ne soit JAMAIS promise deux fois.

const DATE = '2026-07-20'

const recipeBase = {
  servings: 4, prepMinutes: 15, cookMinutes: 25, eligible: true,
  identityLevel: 'named_traditional_dish',
  sensory: { profile: 'fresh_acidic', identity_guardrails: [] },
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionCoverage: { pct: 100 },
}

const soup = {
  ...recipeBase,
  code: 'FR-SOUPE', family: 'Soupe de potiron', category: 'soupe', techniques: ['mijotage'],
  exactIngredients: [{
    name: 'Potiron', formNormalized: 'potiron', quantity: 800, unit: 'g', grams: 800,
    optional: false, category: 'legumes',
  }],
  nutritionPerServing: { kcal: 420, proteinG: 12, carbsG: 55, fatG: 14, fiberG: 9 },
}

// Un plat de dîner : personne ne mange de carbonade à sept heures du matin.
const stew = {
  ...recipeBase,
  code: 'FR-CARBONADE', family: 'Carbonade flamande', category: 'plat mijoté', techniques: ['braisage'],
  exactIngredients: [{
    name: 'Bœuf à braiser', formNormalized: 'boeuf a braiser', quantity: 800, unit: 'g', grams: 800,
    optional: false, category: 'viandes',
  }],
  nutritionPerServing: { kcal: 620, proteinG: 45, carbsG: 30, fatG: 32, fiberG: 4 },
}

// Recette du créneau principal, sans rapport avec les restes testés.
const mainCourse = {
  ...recipeBase,
  code: 'FR-TEST', family: 'Plat test', servings: 2, category: 'plat', techniques: ['saisie'],
  exactIngredients: [{
    name: 'Carotte crue', formNormalized: 'carotte crue', quantity: 200, unit: 'g', grams: 200,
    optional: false, category: 'legumes',
  }],
  nutritionPerServing: { kcal: 300, proteinG: 12, carbsG: 40, fatG: 10, fiberG: 8 },
}

const RECIPES = [mainCourse, soup, stew]

const soupDish = (overrides = {}) => ({
  id: 501, name: 'Soupe de potiron', portionsRemaining: 4, expiresOn: '2026-07-26',
  nutritionPerPortion: { kcal: 420, proteinG: 12, carbsG: 55, fatG: 14, fiberG: 9 },
  ...overrides,
})

const julien = {
  name: 'Julien', portion_multiplier: 1,
  preferences: { planning: { breakfast: true, snack: false } },
}
const goals = [{ person_name: 'Julien', target_calories: 2000, target_protein_g: 120 }]

const basePlan = (extra = {}) => ({
  status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
  slots: [
    { key: `${DATE}-dejeuner`, date: DATE, mealType: 'dejeuner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
    { key: `${DATE}-diner`, date: DATE, mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
  ],
  ...extra,
})

const build = ({ plan = basePlan(), cookedDishes = [], ...rest } = {}) => buildCanonicalPlanPayload({
  plan, recipes: RECIPES, windowStart: DATE, members: [julien], goals,
  constraints: {}, inventoryLots: [], cookedDishes, ...rest,
})

describe('« reste compatible » — compatibilité', () => {
  it('accepte une soupe au petit-déjeuner et refuse un plat mijoté', () => {
    expect(isSupportCompatible({ name: 'Soupe de potiron', recipe: soup }, 'pdj')).toBe(true)
    expect(isSupportCompatible({ name: 'Carbonade flamande', recipe: stew }, 'pdj')).toBe(false)
    // Même refus à la collation : la liste élargie ne rattrape pas un ragoût.
    expect(isSupportCompatible({ name: 'Carbonade flamande', recipe: stew }, 'collation')).toBe(false)
    // La collation élargit bien la liste, elle. (Recette neutre : c'est le nom
    // du plat qu'on interroge ici, pas la famille de sa recette.)
    const hummus = { name: 'Houmous maison', recipe: { ...mainCourse } }
    expect(isSupportCompatible(hummus, 'collation')).toBe(true)
    expect(isSupportCompatible(hummus, 'pdj')).toBe(false)
  })

  it('écarte une portion qui n’a pas la taille d’une prise support', () => {
    const pool = buildSupportLeftoverPool({
      plan: basePlan(), recipes: RECIPES,
      cookedDishes: [soupDish({ nutritionPerPortion: { kcal: 1400, proteinG: 40, carbsG: 120, fatG: 60, fiberG: 20 } })],
    })
    // 2000 kcal × 25 % = 500 kcal attendues au petit-déjeuner : 1400 déborde.
    expect(claimSupportLeftover(pool, { mealType: 'pdj', date: DATE, targetKcal: 2000 * SUPPORT_ENERGY_SHARE.pdj })).toBeNull()
  })

  it('écarte un plat périmé avant le repas et un plat sans recette appariée', () => {
    const expired = buildSupportLeftoverPool({
      plan: basePlan(), recipes: RECIPES, cookedDishes: [soupDish({ expiresOn: '2026-07-19' })],
    })
    expect(claimSupportLeftover(expired, { mealType: 'pdj', date: DATE, targetKcal: 500 })).toBeNull()

    // Sans recette appariée, impossible de vérifier allergies et interdits.
    const orphan = buildSupportLeftoverPool({
      plan: basePlan(), recipes: RECIPES, cookedDishes: [soupDish({ name: 'Soupe mystère' })],
    })
    expect(orphan).toHaveLength(0)
  })

  it('respecte les interdits du foyer comme sur un repas principal', () => {
    const pool = buildSupportLeftoverPool({ plan: basePlan(), recipes: RECIPES, cookedDishes: [soupDish()] })
    expect(claimSupportLeftover(pool, {
      mealType: 'pdj', date: DATE, targetKcal: 500, constraints: { forbiddenForms: ['potiron'] },
    })).toBeNull()
  })
})

describe('« reste compatible » — aucune portion promise deux fois', () => {
  it('exclut du pool tout plat qu’un créneau principal utilise déjà', () => {
    const plan = basePlan({
      slots: [
        { key: `${DATE}-dejeuner`, date: DATE, mealType: 'dejeuner', recipeCode: 'FR-SOUPE', cookedDishId: 501, cookedDishName: 'Soupe de potiron', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
        { key: `${DATE}-diner`, date: DATE, mealType: 'diner', recipeCode: 'FR-TEST', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
      ],
    })
    // Quatre portions restantes, une seule consommée par le déjeuner : la
    // tentation serait d'en offrir trois au petit-déjeuner. On refuse — les
    // portions du déjeuner ne sont pas encore fixées à cet instant.
    expect(buildSupportLeftoverPool({ plan, recipes: RECIPES, cookedDishes: [soupDish()] })).toHaveLength(0)
  })

  it('ne sert jamais plus de portions que le plat n’en contient', () => {
    const pool = buildSupportLeftoverPool({
      plan: basePlan(), recipes: RECIPES, cookedDishes: [soupDish({ portionsRemaining: 2 })],
    })
    const claims = Array.from({ length: 5 }, () => claimSupportLeftover(pool, { mealType: 'pdj', date: DATE, targetKcal: 500 }))
    expect(claims.filter(Boolean)).toHaveLength(2)
    expect(claims.slice(2)).toEqual([null, null, null])
  })

  it('soustrait les réservations déjà actives sur d’autres versions', () => {
    const pool = buildSupportLeftoverPool({
      plan: basePlan(), recipes: RECIPES, cookedDishes: [soupDish({ portionsRemaining: 3 })],
      existingDishReservations: [{ cookedDishId: 501, portions: 2, status: 'active' }],
    })
    expect(pool[0].portionsFree).toBe(1)
  })
})

describe('« reste compatible » — publication du créneau support', () => {
  const payload = build({ cookedDishes: [soupDish()] })
  const breakfast = payload.slots.find((slot) => slot.meal_type === 'pdj')
  const meal = payload.legacy_meals.find((item) => item.meal_type === 'pdj')

  it('sert le reste au petit-déjeuner, avec la nutrition du plat', () => {
    expect(meal.short_label).toBe('Reste de Soupe de potiron')
    expect(meal.kcal).toBe(420)
    expect(meal.protein_g).toBe(12)
    expect(meal.portion_details.items).toEqual([])
    expect(meal.portion_details.leftover).toMatchObject({
      cooked_dish_id: 501, name: 'Soupe de potiron', canonical_recipe_code: 'FR-SOUPE', portions: 1,
    })
  })

  it('n’achète rien pour un plat déjà cuisiné', () => {
    // Le potiron du plat n'apparaît pas aux courses : il a été acheté et cuisiné
    // avant cette semaine.
    expect(payload.shopping_items.find((item) => item.product_name === 'Potiron')).toBeUndefined()
    // Et aucun supplément de petit-déjeuner n'est acheté à sa place.
    for (const item of payload.shopping_items) {
      expect(item.shortage_reason).not.toBe('final_support_demand')
    }
  })

  it('rattache la portion au créneau : réservation, consommation et réchauffage', () => {
    expect(breakfast).toMatchObject({ source: 'support', cooked_dish_id: 501 })
    expect(breakfast.preparation.mode).toBe('support_leftover')

    const reservation = payload.reservations.find((item) => item.cooked_dish_id === 501)
    expect(reservation).toMatchObject({
      slot_key: `${DATE}-pdj`, reserved_unit: 'portion', reserved_quantity: 1,
      metadata: { support: true },
    })
    // La réservation vise un créneau réellement publié (slot_id résoluble par le RPC).
    expect(payload.slots.some((slot) => slot.slot_key === reservation.slot_key)).toBe(true)

    expect(payload.consumptions).toContainEqual({
      slot_key: `${DATE}-pdj`, source: { cooked_dish_id: 501 }, portions: 1, role: 'main',
    })

    const task = payload.tasks.find((item) => item.slot_key === `${DATE}-pdj`)
    expect(task).toMatchObject({ task_type: 'reheat_dish', prep_date: DATE })
    expect(task.instructions[0].instruction).toContain('Soupe de potiron')
  })

  it('reste déterministe et ne réserve jamais au-delà du stock, sur une semaine entière', () => {
    const week = Array.from({ length: 7 }, (_, index) => new Date(new Date(`${DATE}T00:00:00Z`).getTime() + index * 86_400_000)
      .toISOString().slice(0, 10))
    const plan = basePlan({
      slots: week.flatMap((date) => ['dejeuner', 'diner'].map((mealType) => ({
        key: `${date}-${mealType}`, date, mealType, recipeCode: 'FR-TEST',
        allocations: [], shortages: [], stockCoverage: 0, explanations: [],
      }))),
    })
    const args = { plan, cookedDishes: [soupDish({ portionsRemaining: 3, expiresOn: '2026-07-30' })] }
    const first = build(args)
    const second = build(args)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))

    const reserved = first.reservations
      .filter((item) => item.cooked_dish_id === 501)
      .reduce((sum, item) => sum + item.reserved_quantity, 0)
    expect(reserved).toBe(3)
    // Trois petits-déjeuners sur sept sont des restes ; les quatre autres
    // reviennent à la rotation d'aliments.
    const leftoverBreakfasts = first.legacy_meals
      .filter((item) => item.meal_type === 'pdj' && item.portion_details?.leftover)
    expect(leftoverBreakfasts).toHaveLength(3)
    expect(first.legacy_meals.filter((item) => item.meal_type === 'pdj')).toHaveLength(7)
  })

  it('laisse le petit-déjeuner ordinaire quand aucun reste ne convient', () => {
    const plain = build({ cookedDishes: [{ ...soupDish(), name: 'Carbonade flamande' }] })
    const pdj = plain.legacy_meals.find((item) => item.meal_type === 'pdj')
    expect(pdj.portion_details.leftover).toBeUndefined()
    expect(pdj.portion_details.items.length).toBeGreaterThan(0)
    expect(plain.reservations.some((item) => item.cooked_dish_id != null)).toBe(false)
  })
})
