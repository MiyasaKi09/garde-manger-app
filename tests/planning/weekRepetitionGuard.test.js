import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan, recipeDiversityProfile } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { buildPlanningHistory } from '@/lib/domain/planning/repetitionRules'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

// Lot 0 du plan de refonte — « Stopper les mauvaises générations ».
//
// Fixture de non-régression : la semaine observée en production contenait
// quatre pizzas margherita (déjeuner ET dîner identiques), quatre plats de
// pâtes au pesto consécutifs et deux carbonades. Ces tests exercent le
// SOLVEUR RÉEL sur le corpus canonique du dépôt et vérifient que cette semaine
// ne peut plus être produite.

const WINDOW_START = '2026-07-20'
const corpus = () => getCanonicalRecipes({ servings: 2 })

const occurrencesByRecipe = (plan) => {
  const counts = new Map()
  for (const slot of plan.slots) counts.set(slot.recipeCode, (counts.get(slot.recipeCode) || 0) + 1)
  return counts
}

const consecutivePairs = (plan) => plan.slots
  .slice(1)
  .filter((slot, index) => slot.recipeCode === plan.slots[index].recipeCode)

const sameDayPairs = (plan) => plan.slots.filter((slot, index) => plan.slots
  .slice(0, index)
  .some((earlier) => earlier.date === slot.date && earlier.recipeCode === slot.recipeCode))

describe('lot 0 — la semaine dégradée ne peut plus être publiée', () => {
  it('une semaine complète sur le corpus réel ne répète jamais un plat midi et soir, ni deux repas de suite', () => {
    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(WINDOW_START),
      recipes: corpus(),
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 }, preferredActiveMinutes: 30 },
      beamWidth: 24,
    })

    expect(plan.status).toBe('published')
    expect(plan.slots).toHaveLength(14)
    expect(sameDayPairs(plan)).toEqual([])
    expect(consecutivePairs(plan)).toEqual([])
    // Aucun plat plus de trois fois, et jamais plus d'une cuisson par recette.
    for (const [, count] of occurrencesByRecipe(plan)) expect(count).toBeLessThanOrEqual(3)
    const freshCookings = new Map()
    for (const slot of plan.slots.filter((candidate) => (candidate.source || 'fresh') === 'fresh')) {
      freshCookings.set(slot.recipeCode, (freshCookings.get(slot.recipeCode) || 0) + 1)
    }
    for (const [, count] of freshCookings) expect(count).toBe(1)
    expect(plan.issues.filter((issue) => issue.severity === 'blocker')).toEqual([])
  })

  it('un plat cuisiné de huit portions ne nourrit plus quatre créneaux d’affilée', () => {
    const recipes = corpus()
    // Le premier plat du corpus, tel qu'il reviendrait du garde-manger avec
    // assez de portions pour couvrir quatre repas de deux personnes.
    const reference = recipes[0]
    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(WINDOW_START),
      recipes,
      cookedDishes: [{ id: 42, name: reference.family, portionsRemaining: 8, expiresOn: '2026-07-26' }],
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 }, preferredActiveMinutes: 30 },
      beamWidth: 24,
    })

    const dishSlots = plan.slots.filter((slot) => slot.cookedDishId === 42)
    expect(dishSlots.length).toBeGreaterThan(0)
    // Le reste sert toujours à éviter le gaspillage, mais il est réparti :
    // trois prises au maximum, jamais deux repas de suite, jamais le même jour.
    expect(dishSlots.length).toBeLessThanOrEqual(3)
    expect(consecutivePairs(plan)).toEqual([])
    expect(sameDayPairs(plan)).toEqual([])
    for (const slot of dishSlots) expect(slot.mealStatus).toBe('planned_leftover')
  })

  it('marque `review_required` et nomme la règle franchie quand le corpus est trop pauvre', () => {
    // Quatre recettes pour quatorze créneaux : aucune semaine conforme
    // n'existe. Le moteur rend quand même un plan complet — « mieux vaut une
    // semaine à compléter » — mais il l'annonce comme telle.
    //
    // Les quatre sont NOMMÉES, et non prises aux quatre premières places du
    // corpus. Ce découpage par position paraissait équivalent ; il ne l'est pas.
    // Le corpus canonique ne contient que les recettes publiables, donc son
    // ordre change dès qu'une recette le devient : le jour où la quiche lorraine
    // a cessé d'être bloquée par un proxy, elle a pris la quatrième place, et le
    // quatuor obtenu n'avait plus d'accompagnement. Le moteur n'a alors REMPLI
    // AUCUN créneau — sur un corpus trop pauvre pour que même la passe relâchée
    // aboutisse, il rend le meilleur plan partiel plutôt qu'une semaine
    // complète, ce que ce test n'a jamais eu pour objet de vérifier.
    //
    // Nommer les recettes garde au test ce qu'il veut dire : un corpus pauvre
    // MAIS composable — trois plats et un accompagnement.
    const choisies = ['FR-003', 'FR-004', 'IT-001', 'FR-006']
    const recipes = choisies.map((code) => corpus().find((recipe) => recipe.code === code))
    expect(recipes.every(Boolean), `corpus canonique incomplet : ${choisies.join(', ')}`).toBe(true)

    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(WINDOW_START),
      recipes,
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 } },
      beamWidth: 24,
    })

    expect(plan.status).toBe('review_required')
    expect(plan.slots).toHaveLength(14)
    const blockers = plan.issues.filter((issue) => issue.severity === 'blocker')
    expect(blockers.length).toBeGreaterThan(0)
    expect(blockers.map((issue) => issue.code)).toContain('repetition_rules_relaxed')
    // Les repas subis sont identifiés : ce ne sont ni des favoris, ni des restes.
    expect(plan.slots.some((slot) => slot.mealStatus === 'backup_meal')).toBe(true)
  })

  it('publie un score de diversité multidimensionnel et l’équilibre habitudes/nouveautés', () => {
    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(WINDOW_START),
      recipes: corpus(),
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 } },
      beamWidth: 24,
    })

    expect(plan.objectiveScores.diversityScore).toBeGreaterThan(0)
    expect(plan.objectiveScores.repetitionViolations).toBe(0)
    expect(plan.objectiveScores.familiarity).toMatchObject({ total: 14 })
    // Les dimensions au-delà du nom de la recette participent réellement.
    for (const dimension of ['cuisine', 'protein', 'technique']) {
      expect(plan.objectiveScores.diversityDimensions[dimension].documented).toBeGreaterThan(0)
    }
  })
})

describe('lot 1 — l’historique des semaines précédentes pèse sur les choix', () => {
  it('écarte une recette servie l’avant-veille au profit d’une autre, à contraintes égales', () => {
    const recipes = corpus().slice(0, 12)
    const options = {
      slots: buildWeekSlots(WINDOW_START),
      recipes,
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 } },
      beamWidth: 24,
    }
    const withoutHistory = generateClosedLoopPlan(options)
    // On cible la recette que le moteur place EN PREMIER sans historique :
    // le test resterait vide de sens sur une recette qu'il n'aurait de toute
    // façon jamais retenue.
    const recent = recipes.find((recipe) => recipe.code === withoutHistory.slots[0].recipeCode)
    expect(recent).toBeTruthy()

    const withHistory = generateClosedLoopPlan({
      ...options,
      history: buildPlanningHistory({
        referenceDate: WINDOW_START,
        entries: [{ recipeCode: recent.code, date: '2026-07-18', diversity: recipeDiversityProfile(recent) }],
      }),
    })

    // La recette n'est pas interdite — le délai de retour est une règle
    // souple — mais elle recule dans la semaine, ou en sort.
    const before = withoutHistory.slots.findIndex((slot) => slot.recipeCode === recent.code)
    const after = withHistory.slots.findIndex((slot) => slot.recipeCode === recent.code)
    expect(before).toBe(0)
    expect(after === -1 || after > before).toBe(true)
  })

  it('un délai de retour configuré à zéro neutralise la pénalité', () => {
    const recipes = corpus().slice(0, 12)
    const recent = recipes[0]
    const history = buildPlanningHistory({
      referenceDate: WINDOW_START,
      entries: [{ recipeCode: recent.code, date: '2026-07-18', diversity: recipeDiversityProfile(recent) }],
    })
    const options = {
      slots: buildWeekSlots(WINDOW_START),
      recipes,
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 } },
      beamWidth: 24,
    }
    const neutralise = generateClosedLoopPlan({
      ...options,
      history,
      repetitionRules: { returnDelays: { exactRecipeDays: 0, recipeFamilyDays: 0, proteinDays: 0, starchDays: 0, cuisineDays: 0 } },
    })
    expect(JSON.stringify(neutralise.slots.map((slot) => slot.recipeCode)))
      .toBe(JSON.stringify(generateClosedLoopPlan(options).slots.map((slot) => slot.recipeCode)))
  })
})
