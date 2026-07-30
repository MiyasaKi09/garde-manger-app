import { describe, expect, it } from 'vitest'
import { SUPPLEMENT_FORMS, buildPersonalizedMeals, optimizeDailyPortions } from '@/lib/domain/planning/personalizedMeals'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'

const recipe = (code, family, nutrition, category = 'legumes') => ({
  code, family, eligible: true, servings: 2, prepMinutes: 20, cookMinutes: 25, cuisineOrigin: 'France',
  nutritionPerServing: nutrition,
  exactIngredients: [
    {
      name: category === 'viandes' ? 'Bœuf' : category === 'poissons_fruits_de_mer' ? 'Poisson' : 'Lentilles',
      formNormalized: category === 'viandes' ? 'boeuf' : category === 'poissons_fruits_de_mer' ? 'poisson' : 'lentilles',
      category,
      role: 'protéine',
      grams: 200,
      per100g: { kcal: 180, proteinG: 20, carbsG: category === 'legumes' ? 20 : 0, fatG: 5, fiberG: category === 'legumes' ? 8 : 0 },
    },
    { name: 'Riz', formNormalized: 'riz blanc cru', category: 'cereales_feculents', role: 'féculent', grams: 140, per100g: { kcal: 352, proteinG: 7.4, carbsG: 78, fatG: 0.91, fiberG: 1.05 } },
    { name: 'Haricots verts', formNormalized: 'haricot vert cru', category: 'legumes', role: 'accompagnement', grams: 360, per100g: { kcal: 25.9, proteinG: 1.85, carbsG: 4.14, fatG: 0.21, fiberG: 2.68 } },
  ],
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
    const pasta = { nutrition: { kcal: 232, proteinG: 8, carbsG: 46, fatG: 1.3, fiberG: 0.6 } }
    const julien = optimizeDailyPortions({ target: { kcal: 2357, proteinG: 216, carbsG: 196, fatG: 79, fiberG: 33 }, breakfast, snack, lunch: meat.nutritionPerServing, dinner: fish.nutritionPerServing, lunchCompanion: pasta })
    const zoe = optimizeDailyPortions({ target: { kcal: 1525, proteinG: 75, carbsG: 192, fatG: 51, fiberG: 21 }, breakfast: null, snack, lunch: veggie.nutritionPerServing, dinner: fish.nutritionPerServing, lunchCompanion: pasta })

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
    expect(julien.lunchCompanionScale).not.toBe(zoe.lunchCompanionScale)
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

  // Deux membres aux régimes différents sur un même créneau : le membre végétarien
  // reçoit d'abord une VARIANTE DU MÊME PLAT (même lignée) si le corpus la
  // fournit ; sinon un plat entièrement différent — cas dégradé qui doit être
  // SIGNALÉ, pas dissimulé. C'est l'exigence sortie de l'incident du planning :
  // Zoé ne doit pas recevoir une shakshuka pendant que Julien mange un suya de
  // bœuf sans que le moteur avoue qu'il n'a pas trouvé mieux.
  it('sert la même lignée en deux versions quand elle existe, sinon signale le repli', () => {
    // Plat carné A : dispose d'une variante végétarienne de la MÊME LIGNÉE.
    const suyaMeat = recipe('SUYA', 'Suya de bœuf', { kcal: 620, proteinG: 50, carbsG: 20, fatG: 32, fiberG: 4 }, 'viandes')
    const suyaVeg = {
      ...recipe('SUYA-D1', 'Suya végétarien de tofu grillé', { kcal: 540, proteinG: 30, carbsG: 30, fatG: 26, fiberG: 6 }),
      derivedFrom: 'SUYA',
    }

    // Plat carné B : AUCUNE variante végétarienne de sa lignée n'existe
    // au corpus. Le solveur doit tomber sur un plat végétarien différent
    // et marquer la substitution comme hors-lignée.
    const boeufSeul = recipe('BOEUF', 'Bœuf mijoté aux carottes', { kcal: 600, proteinG: 48, carbsG: 45, fatG: 24, fiberG: 7 }, 'viandes')

    // Plat végétarien candidat au fallback (lignée « ratatouille » distincte).
    const ratatouille = recipe('RATA', 'Ratatouille de saison', { kcal: 480, proteinG: 25, carbsG: 60, fatG: 15, fiberG: 16 })

    // Dîner constant (plat neutre pour ne pas parasiter le test).
    const pasta = recipe('PASTA', 'Pâtes aux légumes', { kcal: 520, proteinG: 20, carbsG: 90, fatG: 10, fiberG: 8 })

    const slots = []
    for (let day = 20; day <= 26; day++) {
      const date = `2026-07-${day}`
      // Lundi (20) : SUYA — Zoé aura sa variante lignée.
      // Mardi (21) : BOEUF — Zoé aura un plat différent, SIGNALÉ.
      // Les autres jours : PASTA (végé pour tous, aucun swap déclenché).
      let lunchCode = 'PASTA'
      if (day === 20) lunchCode = 'SUYA'
      else if (day === 21) lunchCode = 'BOEUF'
      slots.push({ key: `${date}-dejeuner`, date, mealType: 'dejeuner', recipeCode: lunchCode })
      slots.push({ key: `${date}-diner`, date, mealType: 'diner', recipeCode: 'PASTA' })
    }

    const result = buildPersonalizedMeals({
      plan: { slots },
      recipes: [suyaMeat, suyaVeg, boeufSeul, ratatouille, pasta],
      members: [
        { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: false } } },
        // Zoé demande DEUX swaps végétariens dans la semaine — le solveur va
        // les affecter aux deux slots carnés dans l'ordre (SUYA puis BOEUF).
        { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: false, vegetarian_meat_swaps_per_week: 2 } } },
      ],
      goals: [
        { person_name: 'Julien', target_calories: 2200, target_protein_g: 140, target_carbs_g: 220, target_fat_g: 75, target_fiber_g: 30 },
        { person_name: 'Zoé', target_calories: 1700, target_protein_g: 90, target_carbs_g: 200, target_fat_g: 55, target_fiber_g: 22 },
      ],
    })

    // Julien mange son plat du foyer les deux jours.
    const julienSuya = result.meals.find((m) => m.person_name === 'Julien' && m.meal_date === '2026-07-20' && m.meal_type === 'dejeuner')
    const julienBoeuf = result.meals.find((m) => m.person_name === 'Julien' && m.meal_date === '2026-07-21' && m.meal_type === 'dejeuner')
    expect(julienSuya).toMatchObject({ canonical_recipe_code: 'SUYA', variant_kind: 'household_base' })
    expect(julienBoeuf).toMatchObject({ canonical_recipe_code: 'BOEUF', variant_kind: 'household_base' })

    // Zoé — cas idéal : variante VÉGÉ de la MÊME LIGNÉE (SUYA-D1 dérive de SUYA).
    const zoeSuya = result.meals.find((m) => m.person_name === 'Zoé' && m.meal_date === '2026-07-20' && m.meal_type === 'dejeuner')
    expect(zoeSuya).toMatchObject({
      canonical_recipe_code: 'SUYA-D1',
      variant_kind: 'vegetarian_swap_lineage',
    })
    expect(zoeSuya.portion_details.same_lineage).toBe(true)
    expect(zoeSuya.portion_details.substitution_fallback).toBeUndefined()

    // Zoé — cas dégradé : aucune variante lignée du BOEUF, tombe sur un plat
    // entièrement différent (RATA ou toute autre végé compatible que le solveur
    // aura jugée la plus proche nutritionnellement). Peu importe l'identité
    // exacte du remplaçant — ce qui compte est que ce ne soit PAS de la
    // lignée BOEUF et que la substitution soit tracée comme repli.
    const zoeBoeuf = result.meals.find((m) => m.person_name === 'Zoé' && m.meal_date === '2026-07-21' && m.meal_type === 'dejeuner')
    expect(zoeBoeuf.canonical_recipe_code).not.toBe('BOEUF')
    expect(zoeBoeuf.variant_kind).toBe('vegetarian_swap')
    expect(zoeBoeuf.portion_details.same_lineage).toBe(false)
    expect(zoeBoeuf.portion_details.substitution_fallback).toMatchObject({
      reason: 'vegetarian_swap',
      baseCode: 'BOEUF',
      altCode: zoeBoeuf.canonical_recipe_code,
    })

    // Compteur au niveau de la journée : ZÉRO le lundi (variante lignée),
    // UN le mardi (repli signalé).
    const zoeMondayDaily = result.daily.find((d) => d.person_name === 'Zoé' && d.meal_date === '2026-07-20')
    const zoeTuesdayDaily = result.daily.find((d) => d.person_name === 'Zoé' && d.meal_date === '2026-07-21')
    expect(zoeMondayDaily.substitutions_out_of_lineage).toEqual([])
    expect(zoeTuesdayDaily.substitutions_out_of_lineage).toHaveLength(1)
    expect(zoeTuesdayDaily.substitutions_out_of_lineage[0]).toMatchObject({
      reason: 'vegetarian_swap',
      baseCode: 'BOEUF',
      altCode: zoeBoeuf.canonical_recipe_code,
    })

    // Julien, lui, n'a jamais de substitution — sa journée reste vierge de
    // toute liste hors-lignée.
    const julienMondayDaily = result.daily.find((d) => d.person_name === 'Julien' && d.meal_date === '2026-07-20')
    expect(julienMondayDaily.substitutions_out_of_lineage).toEqual([])
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
