import { describe, expect, it } from 'vitest'
import { SUPPLEMENT_FORMS, buildPersonalizedMeals, optimizeDailyPortions } from '@/lib/domain/planning/personalizedMeals'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'

const recipe = (code, family, nutrition, category = 'legumes') => ({
  code, family, eligible: true, servings: 2, prepMinutes: 20, cookMinutes: 25, cuisineOrigin: 'France',
  nutritionPerServing: nutrition,
  exactIngredients: [{ name: category === 'viandes' ? 'Bœuf' : 'Lentilles', formNormalized: category === 'viandes' ? 'boeuf' : 'lentilles', category, grams: 200 }],
  sensory: { profile: 'warm_aromatic', scores: { richness: 3 } },
})

const meat = recipe('MEAT', 'Bœuf mijoté', { kcal: 600, proteinG: 48, carbsG: 45, fatG: 24, fiberG: 7 }, 'viandes')
const fish = recipe('FISH', 'Saumon rôti', { kcal: 520, proteinG: 42, carbsG: 40, fatG: 20, fiberG: 6 }, 'poissons_fruits_de_mer')
const veggie = recipe('VEG', 'Lentilles aux légumes', { kcal: 510, proteinG: 30, carbsG: 68, fatG: 13, fiberG: 18 })

function plan() {
  const slots = []
  for (let day = 20; day <= 26; day++) {
    const date = `2026-07-${day}`
    slots.push({ key: `${date}-dejeuner`, date, mealType: 'dejeuner', recipeCode: day === 20 ? 'MEAT' : 'VEG' })
    slots.push({ key: `${date}-diner`, date, mealType: 'diner', recipeCode: 'FISH' })
  }
  return { slots }
}

describe('personalized deterministic meals', () => {
  it('plans 4 daily intakes for Julien and 3 for Zoé, including one vegetarian swap', () => {
    const result = buildPersonalizedMeals({
      plan: plan(), recipes: [meat, fish, veggie],
      members: [
        { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
        { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true, vegetarian_meat_swaps_per_week: 1 } } },
      ],
      goals: [
        { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
        { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
      ],
    })

    expect(result.meals).toHaveLength(49)
    expect(result.meals.filter((meal) => meal.person_name === 'Julien' && meal.meal_type === 'pdj')).toHaveLength(7)
    expect(result.meals.filter((meal) => meal.meal_type === 'collation')).toHaveLength(14)
    expect(result.meals.filter((meal) => meal.person_name === 'Zoé' && meal.variant_kind === 'vegetarian_swap')).toHaveLength(1)
    expect(result.meals.find((meal) => meal.person_name === 'Zoé' && meal.meal_date === '2026-07-20' && meal.meal_type === 'dejeuner'))
      .toMatchObject({ canonical_recipe_code: 'VEG', short_label: 'Lentilles aux légumes' })
    expect(result.valid).toBe(true)
    expect(result.daily.every((day) => day.energy_deviation <= 0.05)).toBe(true)
    const supportMeals = result.meals.filter((meal) => ['fixed_breakfast', 'fixed_snack'].includes(meal.variant_kind))
    const skyrItems = supportMeals.flatMap((meal) => meal.portion_details.items).filter((item) => item.food === 'skyr')
    expect(skyrItems.length).toBeGreaterThan(0)
    expect(skyrItems.every((item) => item.quantity === 200)).toBe(true)
    const skyrQuantity = skyrItems.reduce((sum, item) => sum + item.quantity, 0)
    expect(result.supplementalRequirements.find((item) => item.label === 'skyr nature')).toMatchObject({
      quantity: skyrQuantity,
      packageSize: 200,
      packageCount: skyrQuantity / 200,
      packageLabel: 'pot',
    })
    const julienProteinSnacks = result.meals
      .filter((meal) => meal.person_name === 'Julien' && meal.variant_kind === 'fixed_snack')
      .flatMap((meal) => meal.portion_details.items)
      .filter((item) => ['tuna', 'skyr', 'ham'].includes(item.food))
    expect(julienProteinSnacks.length).toBeGreaterThan(0)
    expect(result.meals.filter((meal) => meal.variant_kind === 'fixed_breakfast')
      .every((meal) => !meal.description.includes('œufs de œufs'))).toBe(true)
    // Les écarts par dimension sont vrais et explicites : une journée qui
    // manque sa cible protéique/glucidique n'est plus présentée comme parfaite.
    expect(result.daily.some((day) => day.macro_valid === false)).toBe(true)
    expect(result.daily.every((day) => typeof day.protein_valid === 'boolean')).toBe(true)
    expect(result.daily.every((day) => typeof day.carbs_valid === 'boolean')).toBe(true)
    expect(result.weeklyMicronutrients).toHaveLength(2)
    expect(result.weeklyMicronutrients.every((week) => week.data_complete === false)).toBe(true)
  })

  it('chooses different portions while holding each personal calorie target', () => {
    const breakfast = { nutrition: { kcal: 600, proteinG: 60, carbsG: 40, fatG: 20, fiberG: 5 } }
    const snack = { nutrition: { kcal: 350, proteinG: 30, carbsG: 30, fatG: 13, fiberG: 5 } }
    const julien = optimizeDailyPortions({ target: { kcal: 2357, proteinG: 216, carbsG: 196, fatG: 79, fiberG: 33 }, breakfast, snack, lunch: meat.nutritionPerServing, dinner: fish.nutritionPerServing })
    const zoe = optimizeDailyPortions({ target: { kcal: 1525, proteinG: 75, carbsG: 192, fatG: 51, fiberG: 21 }, breakfast: null, snack, lunch: veggie.nutritionPerServing, dinner: fish.nutritionPerServing })

    expect(Math.abs(julien.total.kcal - 2357) / 2357).toBeLessThanOrEqual(0.05)
    expect(Math.abs(zoe.total.kcal - 1525) / 1525).toBeLessThanOrEqual(0.05)
    expect(julien).toMatchObject({ breakfastScale: 1, snackScale: 1 })
    expect(zoe).toMatchObject({ breakfastScale: 0, snackScale: 1 })
    for (const scale of [julien.lunchScale, julien.dinnerScale, zoe.lunchScale, zoe.dinnerScale]) {
      expect(scale).toBeGreaterThanOrEqual(0.5)
      expect(scale).toBeLessThanOrEqual(2)
      expect(scale * 10).toBe(Math.round(scale * 10))
    }
    expect(julien.lunchScale).not.toBe(zoe.lunchScale)
  })

  it('never serves a preparation-requiring food in any snack of a 7-day plan', () => {
    const result = buildPersonalizedMeals({
      plan: plan(), recipes: [meat, fish, veggie],
      members: [
        { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
        { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true, vegetarian_meat_swaps_per_week: 1 } } },
      ],
      goals: [
        { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
        { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
      ],
    })

    const snackItems = result.meals
      .filter((meal) => meal.variant_kind === 'fixed_snack')
      .flatMap((meal) => meal.portion_details.items)
    expect(snackItems.length).toBeGreaterThan(0)
    // Aucun aliment de collation ne demande une préparation sans tâche source.
    expect(snackItems.every((item) => item.food !== 'chicken')).toBe(true)
    expect(snackItems.every((item) => !/r[ôo]ti|cuit|grill/i.test(item.displayLabel || ''))).toBe(true)
    const julienSnacks = result.meals.filter((meal) => meal.person_name === 'Julien' && meal.variant_kind === 'fixed_snack')
    expect(julienSnacks.some((meal) => meal.portion_details.items.some((item) => ['tuna', 'skyr', 'ham'].includes(item.food)))).toBe(true)

    // Le remplacement conserve la barrière énergétique ±5 % du foyer.
    expect(result.valid).toBe(true)

    expect(result.supplementalRequirements.every((item) => item.label !== 'blanc de poulet rôti')).toBe(true)
    expect(result.supplementalRequirements.every((item) => !/r[ôo]ti/i.test(item.label))).toBe(true)
  })

  it('replaces forbidden recipes and support foods before creating demands', () => {
    const result = buildPersonalizedMeals({
      plan: plan(), recipes: [meat, fish, veggie],
      members: [{ id: 'm', name: 'Camille', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } }],
      goals: [{ person_name: 'Camille', target_calories: 1700, target_protein_g: 140 }],
      constraints: { allergens: ['poisson'], forbiddenForms: ['thon'], diets: ['sans poisson'] },
    })

    expect(result.daily.every((day) => day.support_safe && day.recipes_safe)).toBe(true)
    expect(result.meals.filter((item) => item.meal_type === 'diner').every((item) => item.canonical_recipe_code !== 'FISH')).toBe(true)
    expect(result.meals.flatMap((item) => item.portion_details?.items || []).every((item) => item.food !== 'tuna')).toBe(true)
    expect(result.supplementalRequirements.every((item) => !/thon/i.test(item.label))).toBe(true)
  })

  it('persists every nutrition dimension without inflating portions past the hard ceiling', () => {
    const result = buildPersonalizedMeals({
      plan: plan(), recipes: [meat, fish, veggie],
      members: [{ id: 'a', name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } }],
      goals: [{ person_name: 'Alex', target_calories: 2000, target_protein_g: 300, target_carbs_g: 230, target_fat_g: 70, target_fiber_g: 25 }],
    })

    expect(result.daily).toHaveLength(7)
    for (const day of result.daily) {
      // L'énergie tient (journée « valide ») mais le plancher protéique de
      // 90 % de la cible est manqué : la journée est signalée, pas bloquée.
      expect(day.valid).toBe(true)
      expect(day.protein_valid).toBe(false)
      expect(day.total.proteinG).toBeLessThan(0.9 * day.target.proteinG)
      const expectedDeviation = Math.round(((day.total.proteinG - day.target.proteinG) / day.target.proteinG) * 10000) / 10000
      expect(day.protein_deviation).toBe(expectedDeviation)
      expect(day.protein_deviation).toBeLessThan(0)
      expect(day.macro_deviations).toMatchObject({
        proteinG: expectedDeviation,
        carbsG: expect.any(Number),
        fatG: expect.any(Number),
        fiberG: expect.any(Number),
      })
    }
    expect(result.valid).toBe(true)
    expect(result.daily.every((day) => day.portion_safe)).toBe(true)
    expect(result.meals.filter((meal) => meal.canonical_recipe_code).every((meal) => meal.planned_servings <= 2)).toBe(true)
  })

  it('exposes purchasable supplement forms with their gram conversions', () => {
    const byLabel = new Map(SUPPLEMENT_FORMS.map((form) => [form.label, form]))
    expect(byLabel.get('skyr nature')).toMatchObject({ unit: 'g', gramsPerUnit: 1, formNormalized: 'skyr nature', packageSize: 200 })
    expect(byLabel.get('œufs durs')).toMatchObject({ unit: 'œuf', gramsPerUnit: 60, formNormalized: 'oeufs durs' })
    for (const fruit of ['pomme', 'kiwi', 'poire', 'banane', 'pêche', 'nectarine', 'orange']) {
      expect(byLabel.get(fruit)).toMatchObject({ unit: 'pièce', gramsPerUnit: 150 })
    }
    expect(byLabel.get('pêche').formNormalized).toBe('peche')
    expect(byLabel.has('blanc de poulet rôti')).toBe(false)
    expect(SUPPLEMENT_FORMS.every((form) => Number(form.gramsPerUnit) > 0)).toBe(true)
  })

  // MAJOR 2 : les aliases couvrent le vocabulaire réel des lots (canonical_foods /
  // archetypes des exports) — égalité exacte, jamais de fuzzy.
  it('expose des aliases normalisés du vocabulaire réel, sans collision entre entrées', () => {
    const byLabel = new Map(SUPPLEMENT_FORMS.map((form) => [form.label, form]))
    expect(byLabel.get('œufs durs').aliases).toEqual(['oeuf']) // canonique « œuf »
    expect(byLabel.get('thon au naturel égoutté').aliases).toEqual(
      expect.arrayContaining(['thon', 'thon en conserve']), // canonique + archétype
    )
    expect(byLabel.get('flocons d’avoine').aliases).toEqual(
      expect.arrayContaining(['flocon d avoine', 'avoine']), // archétype + canonique
    )
    expect(byLabel.get('amandes').aliases).toEqual(['amande']) // canonique (singulier)
    expect(byLabel.get('pain complet').aliases).toEqual(['pain']) // archétype « pain »
    expect(byLabel.get('jambon blanc').aliases).toEqual(['jambon']) // archétype
    expect(byLabel.get('skyr nature').aliases).toEqual([]) // déjà le nom exact de l'archétype

    for (const form of SUPPLEMENT_FORMS) {
      expect(Array.isArray(form.aliases)).toBe(true)
      for (const alias of form.aliases) {
        // Chaque alias est déjà une forme normalisée (comparable telle quelle).
        expect(normalizeFoodForm(alias)).toBe(alias)
        // Jamais redondant avec la forme principale de sa propre entrée.
        expect(alias).not.toBe(form.formNormalized)
        // Aucune collision : un alias ne capte jamais la forme principale
        // d'une AUTRE entrée ('pain' ≠ 'pain d épices' par égalité exacte).
        for (const other of SUPPLEMENT_FORMS) {
          if (other === form) continue
          expect(alias).not.toBe(other.formNormalized)
        }
      }
    }
  })
})
