import { describe, expect, it } from 'vitest'
import { getMemberPlanningRules } from '@/lib/domain/planning/memberPlanningRules'
import { buildMealPlate } from '@/lib/domain/planning/mealComposition'
import { buildPersonalizedMeals } from '@/lib/domain/planning/personalizedMeals'

// Tests de câblage du réglage dessert → `attachDessert` dans `buildMealPlate`.
//
// Contrat à deux versants :
//  1. `getMemberPlanningRules` expose `dessertAfterLunch` et `dessertAfterDinner`
//     lus dans `preferences.planning`.
//  2. Réglage désactivé (valeur par défaut) → aucun composant `role:'dessert'`
//     dans l'assiette ; réglage activé → un dessert apparaît et sa nutrition
//     est comptée dans le créneau (via `portion_details.companions`).

// --------------------------------------------------------------------------
// Fixtures partagées
// --------------------------------------------------------------------------

const mainRecipe = (code, family) => ({
  code,
  family,
  category: 'plat mijoté',
  cuisineOrigin: 'France',
  eligible: true,
  servings: 4,
  prepMinutes: 20,
  cookMinutes: 25,
  allergens: [],
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic' },
  exactIngredients: [
    { name: 'poulet', formNormalized: 'poulet', category: 'volailles', grams: 500, optional: false, per100g: { kcal: 165, proteinG: 30, carbsG: 0, fatG: 4, fiberG: 0 } },
    { name: 'riz basmati cru', formNormalized: 'riz basmati cru', category: 'cereales_feculents', grams: 280, optional: false, per100g: { kcal: 352, proteinG: 7.4, carbsG: 78, fatG: 0.9, fiberG: 1 } },
    { name: 'carotte crue', formNormalized: 'carotte crue', category: 'legumes', grams: 400, optional: false, per100g: { kcal: 36, proteinG: 0.8, carbsG: 6, fatG: 0.2, fiberG: 2.6 } },
  ],
  nutritionPerServing: { kcal: 520, proteinG: 35, carbsG: 60, fatG: 12, fiberG: 5 },
})

const dessertRecipeFixture = {
  code: 'DESS-01',
  family: 'Mousse au chocolat',
  category: 'dessert',
  cuisineOrigin: 'France',
  eligible: true,
  servings: 6,
  prepMinutes: 15,
  cookMinutes: 0,
  allergens: ['oeuf', 'lait'],
  techniques: [],
  sensory: { profile: 'sweet_rich' },
  exactIngredients: [
    { name: 'chocolat noir', formNormalized: 'chocolat noir', category: 'epicerie_sucree', grams: 200, optional: false, per100g: { kcal: 540, proteinG: 5, carbsG: 60, fatG: 30, fiberG: 5 } },
  ],
  nutritionPerServing: { kcal: 280, proteinG: 5, carbsG: 32, fatG: 15, fiberG: 2 },
  plate: { role: 'dessert', accepts: [], reason: 'dessert de fin de repas' },
}

const lundi = mainRecipe('MAIN-01', 'Poulet basquaise')
const mardi = mainRecipe('MAIN-02', 'Poulet rôti')

// Plan minimal de 2 jours (déjeuner + dîner)
function tinyPlan() {
  return {
    slots: [
      { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'MAIN-01' },
      { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'MAIN-02' },
    ],
  }
}

// --------------------------------------------------------------------------
// 1. Les préférences sont bien exposées par getMemberPlanningRules
// --------------------------------------------------------------------------

describe('getMemberPlanningRules — dessertAfterLunch / dessertAfterDinner', () => {
  it('vaut false par défaut quand les champs sont absents', () => {
    const rules = getMemberPlanningRules({ name: 'Julien', preferences: {} })
    expect(rules.dessertAfterLunch).toBe(false)
    expect(rules.dessertAfterDinner).toBe(false)
  })

  it('reflète exactement la valeur stockée dans planning', () => {
    const rules = getMemberPlanningRules({
      name: 'Zoé',
      preferences: { planning: { dessert_after_lunch: true, dessert_after_dinner: false } },
    })
    expect(rules.dessertAfterLunch).toBe(true)
    expect(rules.dessertAfterDinner).toBe(false)
  })

  it('coerce les valeurs truthy/falsy correctement', () => {
    const on = getMemberPlanningRules({ preferences: { planning: { dessert_after_lunch: 1 } } })
    const off = getMemberPlanningRules({ preferences: { planning: { dessert_after_lunch: 0 } } })
    expect(on.dessertAfterLunch).toBe(true)
    expect(off.dessertAfterLunch).toBe(false)
  })
})

// --------------------------------------------------------------------------
// 2. Réglage désactivé → aucun dessert dans l'assiette
// --------------------------------------------------------------------------

describe('réglage désactivé — aucun dessert attaché', () => {
  it('buildMealPlate sans attachDessert ne produit aucun composant dessert', () => {
    const plate = buildMealPlate(lundi, {})
    const hasDessert = plate.components.some((c) => c.role === 'dessert')
    expect(hasDessert).toBe(false)
    expect(plate.dessert).toBeNull()
  })

  it('buildPersonalizedMeals sans réglage ne produit aucun companion dessert', () => {
    const member = {
      id: 'm1', name: 'Julien', portion_multiplier: 1,
      preferences: { planning: { breakfast: false, snack: false } },
    }
    const goals = [{ person_name: 'Julien', target_calories: 2000, target_protein_g: 100, target_carbs_g: 240, target_fat_g: 67, target_fiber_g: 25 }]
    const result = buildPersonalizedMeals({
      plan: tinyPlan(),
      recipes: [lundi, mardi],
      members: [member],
      goals,
      constraints: { dessertPool: [dessertRecipeFixture] },
    })
    const mainMeals = result.meals.filter((m) => ['dejeuner', 'diner'].includes(m.meal_type))
    for (const meal of mainMeals) {
      const companions = meal.portion_details?.companions || []
      const hasDessert = companions.some((c) => c.role === 'dessert')
      expect(hasDessert, `${meal.meal_type} du ${meal.meal_date}`).toBe(false)
    }
  })
})

// --------------------------------------------------------------------------
// 3. Réglage activé → dessert présent et nutrition comptée
// --------------------------------------------------------------------------

describe('réglage activé — dessert présent et nutrition comptée dans le créneau', () => {
  it('buildMealPlate avec attachDessert:true produit un composant dessert', () => {
    const rules = getMemberPlanningRules({
      preferences: { planning: { dessert_after_lunch: true } },
    })
    const plate = buildMealPlate(lundi, {
      attachDessert: rules.dessertAfterLunch,
      dessertPool: [dessertRecipeFixture],
      dayIndex: 0,
    })
    const dessert = plate.components.find((c) => c.role === 'dessert')
    expect(dessert).toBeTruthy()
    expect(plate.dessert).toBeTruthy()
  })

  it('buildPersonalizedMeals avec dessert_after_lunch produit un companion dessert au déjeuner', () => {
    const member = {
      id: 'm1', name: 'Julien', portion_multiplier: 1,
      preferences: { planning: { breakfast: false, snack: false, dessert_after_lunch: true } },
    }
    const goals = [{ person_name: 'Julien', target_calories: 2000, target_protein_g: 100, target_carbs_g: 240, target_fat_g: 67, target_fiber_g: 25 }]
    const result = buildPersonalizedMeals({
      plan: tinyPlan(),
      recipes: [lundi, mardi],
      members: [member],
      goals,
      constraints: { dessertPool: [dessertRecipeFixture] },
    })
    const lunch = result.meals.find((m) => m.meal_type === 'dejeuner' && m.person_name === 'Julien')
    expect(lunch).toBeTruthy()
    const dessertComp = (lunch.portion_details?.companions || []).find((c) => c.role === 'dessert')
    expect(dessertComp).toBeTruthy()
    expect(dessertComp.quantity_g).toBeGreaterThan(0)
  })

  it('la nutrition du dessert est comptée dans le total calorique du créneau', () => {
    const member = {
      id: 'm1', name: 'Julien', portion_multiplier: 1,
      preferences: { planning: { breakfast: false, snack: false, dessert_after_dinner: true } },
    }
    const goals = [{ person_name: 'Julien', target_calories: 2000, target_protein_g: 100, target_carbs_g: 240, target_fat_g: 67, target_fiber_g: 25 }]
    const result = buildPersonalizedMeals({
      plan: tinyPlan(),
      recipes: [lundi, mardi],
      members: [member],
      goals,
      constraints: { dessertPool: [dessertRecipeFixture] },
    })
    const dinner = result.meals.find((m) => m.meal_type === 'diner' && m.person_name === 'Julien')
    const dessertComp = (dinner?.portion_details?.companions || []).find((c) => c.role === 'dessert')
    expect(dessertComp).toBeTruthy()
    // La nutrition du créneau inclut la nutrition des companions (dessert compris).
    // Le total kcal du repas doit dépasser la recette seule à sa portion.
    const recipeKcal = lundi.nutritionPerServing.kcal * (dinner.planned_servings || 1)
    expect(dinner.kcal).toBeGreaterThan(recipeKcal)
    // La nutrition du dessert contribue positivement.
    expect(dessertComp.nutrition?.kcal).toBeGreaterThan(0)
  })

  it('dessert_after_lunch n\'affecte pas le dîner (réglages indépendants)', () => {
    const member = {
      id: 'm1', name: 'Julien', portion_multiplier: 1,
      preferences: { planning: { breakfast: false, snack: false, dessert_after_lunch: true, dessert_after_dinner: false } },
    }
    const goals = [{ person_name: 'Julien', target_calories: 2000, target_protein_g: 100, target_carbs_g: 240, target_fat_g: 67, target_fiber_g: 25 }]
    const result = buildPersonalizedMeals({
      plan: tinyPlan(),
      recipes: [lundi, mardi],
      members: [member],
      goals,
      constraints: { dessertPool: [dessertRecipeFixture] },
    })
    const lunch = result.meals.find((m) => m.meal_type === 'dejeuner' && m.person_name === 'Julien')
    const dinner = result.meals.find((m) => m.meal_type === 'diner' && m.person_name === 'Julien')
    const lunchDessert = (lunch?.portion_details?.companions || []).find((c) => c.role === 'dessert')
    const dinnerDessert = (dinner?.portion_details?.companions || []).find((c) => c.role === 'dessert')
    expect(lunchDessert).toBeTruthy()
    expect(dinnerDessert).toBeUndefined()
  })
})
