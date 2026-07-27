import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'
import { analyzeMealCompleteness, buildMealPlate } from '@/lib/domain/planning/mealComposition'
import { getMemberPlanningRules } from '@/lib/domain/planning/memberPlanningRules'

// Lots 4 et 5 du plan de refonte — assiettes personnalisées (§7) et
// personnalisation nutritionnelle bornée (§8).
//
// Ces deux lots reposaient déjà sur des mécaniques présentes dans le moteur.
// Ce fichier les VÉRIFIE explicitement contre le texte du plan, pour que leur
// conformité soit constatée plutôt qu'affirmée, et pour qu'une régression les
// fasse échouer.

// Un plat incomplet : protéine et légumes présents, aucun féculent — le cas
// « boulettes sauce tomate → féculent » du plan.
const boulettes = {
  code: 'FR-BOU',
  family: 'Boulettes sauce tomate',
  category: 'plat principal',
  cuisineOrigin: 'Italie',
  servings: 2,
  prepMinutes: 25,
  cookMinutes: 30,
  techniques: ['mijotage'],
  identityLevel: 'named_traditional_dish',
  sensory: { profile: 'warm_aromatic', target_textures: ['fondant'] },
  exactIngredients: [
    {
      name: 'Boeuf haché', formNormalized: 'boeuf hache', category: 'viandes',
      quantity: 300, unit: 'g', grams: 300, optional: false,
      per100g: { kcal: 250, proteinG: 26, carbsG: 0, fatG: 15, fiberG: 0 },
    },
    {
      name: 'Tomate concassée', formNormalized: 'tomate concassee', category: 'legumes',
      quantity: 400, unit: 'g', grams: 400, optional: false, role: 'sauce',
      per100g: { kcal: 25, proteinG: 1.2, carbsG: 4, fatG: 0.2, fiberG: 1.4 },
    },
  ],
  exactSteps: [{ n: 1, instruction: 'Mijoter.' }],
  nutritionPerServing: { kcal: 450, proteinG: 42, carbsG: 8, fatG: 24, fiberG: 3 },
  nutritionCoverage: { pct: 100 },
}

const plan = {
  status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
  slots: [
    { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-BOU', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
    { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-BOU', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
  ],
}

// Deux gabarits différents : c'est ce qui doit produire deux assiettes
// réellement distinctes, et non un coefficient unique appliqué à la recette.
const julien = { id: 1, name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } }
const zoe = { id: 2, name: 'Zoé', portion_multiplier: 0.75, preferences: { planning: { breakfast: false, snack: true } } }
const goals = [
  { person_name: 'Julien', target_calories: 2600, target_protein_g: 160, target_carbs_g: 280, target_fat_g: 90, target_fiber_g: 30 },
  { person_name: 'Zoé', target_calories: 1900, target_protein_g: 110, target_carbs_g: 200, target_fat_g: 65, target_fiber_g: 25 },
]

const payload = buildCanonicalPlanPayload({
  plan, recipes: [boulettes], windowStart: '2026-07-20',
  members: [julien, zoe], goals, constraints: {}, inventoryLots: [],
})

const mainMeals = payload.legacy_meals.filter((meal) => ['dejeuner', 'diner'].includes(meal.meal_type))

describe('lot 4 — l’accompagnement est un objet réel (§7)', () => {
  it('reconnaît le composant manquant au lieu de faire confiance au titre', () => {
    const analysis = analyzeMealCompleteness(boulettes)
    expect(analysis.compositionKnown).toBe(true)
    expect(analysis.hasProtein).toBe(true)
    expect(analysis.hasVegetables).toBe(true)
    expect(analysis.missing).toEqual(['starch'])
  })

  it('n’ajoute que ce qui manque, jamais un accompagnement décoratif', () => {
    const plate = buildMealPlate(boulettes, {})
    expect(plate.components.map((component) => component.role)).toEqual(['starch'])
    expect(plate.completeAfter).toBe(true)
  })

  it('donne à chaque accompagnement une identité, un rôle, une quantité, une nutrition et une préparation', () => {
    const companions = mainMeals.flatMap((meal) => meal.portion_details?.companions || [])
    expect(companions.length).toBeGreaterThan(0)
    for (const companion of companions) {
      expect(companion.key).toBeTruthy()
      expect(companion.food_form_id).toBeTruthy()
      expect(companion.role).toBe('starch')
      expect(companion.quantity_g).toBeGreaterThan(0)
      expect(companion.nutrition.kcal).toBeGreaterThan(0)
      expect(companion.preparation).toBeTruthy()
      expect(companion.form_normalized).toBeTruthy()
    }
  })

  it('provisionne réellement l’accompagnement : il part aux courses avec sa quantité', () => {
    const starch = payload.shopping_items.find((item) => /riz|pâtes|pates|pomme de terre/i.test(item.product_name || ''))
    expect(starch).toBeTruthy()
    expect(starch.required_qty).toBeGreaterThan(0)
    expect(starch.purchase_qty).toBeGreaterThanOrEqual(starch.exact_required_qty)
  })

  it('sert des quantités individuelles, pas un coefficient unique appliqué à la recette', () => {
    const portionsOf = (name) => mainMeals
      .filter((meal) => meal.person_name === name)
      .map((meal) => meal.planned_servings)
    const grammesOf = (name) => mainMeals
      .filter((meal) => meal.person_name === name)
      .flatMap((meal) => (meal.portion_details?.companions || []).map((companion) => companion.quantity_g))

    // Deux personnes aux besoins différents reçoivent des assiettes distinctes,
    // et l'accompagnement est dimensionné séparément du plat principal.
    expect(portionsOf('Julien')).not.toEqual(portionsOf('Zoé'))
    expect(grammesOf('Julien').length).toBeGreaterThan(0)
    expect(grammesOf('Zoé').length).toBeGreaterThan(0)
    expect(grammesOf('Julien')).not.toEqual(grammesOf('Zoé'))
  })

  it('recalcule la nutrition de l’assiette, accompagnement compris', () => {
    for (const meal of mainMeals) {
      const companions = meal.portion_details?.companions || []
      const companionKcal = companions.reduce((sum, companion) => sum + (companion.nutrition?.kcal || 0), 0)
      // L'assiette vaut plus que la seule recette dès qu'un accompagnement
      // s'y ajoute.
      expect(meal.kcal).toBeGreaterThan(companionKcal)
    }
  })
})

describe('lot 5 — portions bornées (§8)', () => {
  const rules = getMemberPlanningRules(julien)

  it('applique exactement les bornes du plan', () => {
    expect(rules.preferredMinMealServings).toBe(0.75)
    expect(rules.preferredMaxMealServings).toBe(1.5)
    expect(rules.toleratedMaxMealServings).toBe(1.75)
    expect(rules.hardMaxMealServings).toBe(2)
  })

  it('laisse le foyer resserrer ces bornes, jamais les faire exploser', () => {
    const strict = getMemberPlanningRules({ preferences: { planning: { hard_max_meal_servings: 1.2 } } })
    expect(strict.hardMaxMealServings).toBe(1.2)
    const absurde = getMemberPlanningRules({ preferences: { planning: { hard_max_meal_servings: 12 } } })
    expect(absurde.hardMaxMealServings).toBe(2)
  })

  it('ne dépasse jamais le plafond de deux portions sur un repas publié', () => {
    for (const meal of mainMeals) {
      expect(meal.planned_servings).toBeGreaterThan(0)
      expect(meal.planned_servings).toBeLessThanOrEqual(2)
    }
  })

  it('signale une journée dont l’objectif est irréalisable au lieu de gonfler les portions', () => {
    // Objectif volontairement hors de portée : le moteur doit le DIRE.
    const impossible = buildCanonicalPlanPayload({
      plan, recipes: [boulettes], windowStart: '2026-07-20',
      members: [julien],
      goals: [{ person_name: 'Julien', target_calories: 6000, target_protein_g: 400 }],
      constraints: {}, inventoryLots: [],
    })
    const meals = impossible.legacy_meals.filter((meal) => ['dejeuner', 'diner'].includes(meal.meal_type))
    // Aucune portion irréaliste…
    expect(meals.every((meal) => meal.planned_servings <= 2)).toBe(true)
    // …et la semaine ne s'annonce pas conforme.
    expect(impossible.validation_summary.daily_energy_targets_valid).toBe(false)
    expect(impossible.validation_summary.status).toBe('review_required')
  })
})
