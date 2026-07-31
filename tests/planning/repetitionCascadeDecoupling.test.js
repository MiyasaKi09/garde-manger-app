// Verrou du découplage protéines/répétition (correctif lot 0).
//
// Contexte : la passe dégradée du planificateur désactivait AUTREFOIS toutes les
// règles de répétition dès qu'une seule contrainte forte échouait — la
// « pizza margherita trois fois » de l'observation initiale. Le fix introduit
// une passe INTERMÉDIAIRE `core` qui préserve le SOCLE des règles absolues
// (même jour, repas contigus, seconde cuisson d'une même recette, variantes
// d'une même lignée) tout en cédant les règles souples (délai de retour,
// plafond de 3 consommations, fenêtre glissante).
//
// Ce que ces tests verrouillent :
//
// 1. Quand `strict` est infaisable mais que `core` est faisable, le solveur
//    doit passer par `core` — pas directement à `off`. Le motif remonté est
//    `repetition_rules_softened` (distinct de `repetition_rules_relaxed`), ce
//    qui permet à l'affichage de dire « un délai a cédé » plutôt que « le
//    socle a cédé ».
//
// 2. Un plan produit par la passe `core` ne peut JAMAIS contenir de violation
//    du socle : ni deux services du même plat le même jour, ni sur deux repas
//    contigus, ni deux cuissons de la même recette, ni deux variantes d'une
//    même lignée. C'est le verrou anti « trois pizzas cuisinées ».
//
// 3. Rater une cible nutritionnelle (protéines relâchées côté personalizedMeals)
//    n'entraîne PAS une répétition. Le beam search reste orthogonal — c'est le
//    contrat de découplage.

import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import {
  filterCoreRepetitionViolations,
  isCoreRepetitionViolation,
} from '@/lib/domain/planning/repetitionRules'
import { buildPersonalizedMeals } from '@/lib/domain/planning/personalizedMeals'

const WINDOW_START = '2026-07-20'

// Petit corpus synthétique — la même structure que closedLoopPlanner.test.js.
// L'important est d'avoir plusieurs recettes distinctes pour que le socle soit
// tenable, tout en dimensionnant les plats cuisinés pour forcer une règle
// SOUPLE (`recipe_over_consumed`) à échouer en mode strict.
const makeRecipe = (code, profile, form, overrides = {}) => ({
  code,
  family: `Recette ${code}`,
  eligible: true,
  servings: 2,
  prepMinutes: 15,
  cookMinutes: 20,
  cuisineOrigin: 'France',
  allergens: [],
  techniques: ['mijotage'],
  sensory: {
    profile,
    scores: { richness: 3, acidic: 1, freshness: 1 },
    target_textures: ['fondant'],
  },
  exactIngredients: [{ name: form, formNormalized: form, grams: 100, optional: false }],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 },
  ...overrides,
})

const PROFILES = ['warm_aromatic', 'creamy_delicate', 'fresh_acidic', 'rich_winey', 'sweet_spiced', 'smoky_umami', 'tangy_pickled']
const buildRecipePool = (count) => Array.from({ length: count }, (_, index) =>
  makeRecipe(`R${index}`, PROFILES[index % PROFILES.length], `ingr-${index}`))

// Répétitions du socle sur un plan (audit — même définition que le solveur).
// On applique les prédicats à la main pour ne dépendre d'aucune assertion
// interne à la cascade : si la cascade cassait, ce test le verrait quand même.
const socleViolations = (plan) => {
  const byKey = []
  for (const slot of plan.slots) {
    for (const previous of byKey) {
      if (previous.recipeCode !== slot.recipeCode) continue
      if (previous.date === slot.date) {
        byKey.push({ code: 'same_day_recipe_repeat', slotKey: slot.key, recipeCode: slot.recipeCode })
      }
    }
    byKey.push({
      ...slot,
      // aucun `code` sur les entrées originales : distingue les slots des
      // violations empilées dans le même tableau.
      code: null,
    })
  }
  // Passe distincte pour les adjacences : positions successives dans le plan.
  const violations = []
  const slots = plan.slots
  for (let i = 1; i < slots.length; i += 1) {
    if (slots[i].recipeCode === slots[i - 1].recipeCode) {
      violations.push({ code: 'adjacent_recipe_repeat', slotKey: slots[i].key })
    }
  }
  // Cuissons fraîches multiples de la même recette.
  const freshCookings = new Map()
  for (const slot of slots.filter((s) => (s.source || 'fresh') === 'fresh')) {
    freshCookings.set(slot.recipeCode, (freshCookings.get(slot.recipeCode) || 0) + 1)
  }
  for (const [code, count] of freshCookings) {
    if (count > 1) violations.push({ code: 'multiple_fresh_cookings', recipeCode: code, count })
  }
  // Récupère aussi les violations du plan lui-même qui appartiennent au socle.
  for (const issue of plan.issues || []) {
    if (isCoreRepetitionViolation(issue)) violations.push({ code: issue.code, slotKey: issue.slotKey })
  }
  return violations.filter((v) => v.code)
}

describe('helper — sous-ensemble socle des violations', () => {
  it('range chaque code au bon niveau', () => {
    expect(isCoreRepetitionViolation({ code: 'same_day_recipe_repeat' })).toBe(true)
    expect(isCoreRepetitionViolation({ code: 'recipe_lineage_repeat' })).toBe(true)
    expect(isCoreRepetitionViolation({ code: 'recipe_recooked_within_week' })).toBe(true)
    // recipe_repeat_too_close : socle seulement pour deux repas très proches.
    expect(isCoreRepetitionViolation({ code: 'recipe_repeat_too_close', mealsBetween: 0 })).toBe(true)
    expect(isCoreRepetitionViolation({ code: 'recipe_repeat_too_close', mealsBetween: 1 })).toBe(true)
    expect(isCoreRepetitionViolation({ code: 'recipe_repeat_too_close', mealsBetween: 2 })).toBe(false)
    // Règles souples : jamais dans le socle.
    expect(isCoreRepetitionViolation({ code: 'recipe_over_consumed' })).toBe(false)
    expect(isCoreRepetitionViolation({ code: 'recipe_repeat_burst' })).toBe(false)
  })

  it('filtre un tableau de violations mixtes', () => {
    const filtered = filterCoreRepetitionViolations([
      { code: 'same_day_recipe_repeat' },
      { code: 'recipe_over_consumed' },
      { code: 'recipe_repeat_too_close', mealsBetween: 0 },
      { code: 'recipe_repeat_burst' },
      { code: 'recipe_lineage_repeat' },
    ])
    expect(filtered.map((v) => v.code)).toEqual([
      'same_day_recipe_repeat',
      'recipe_repeat_too_close',
      'recipe_lineage_repeat',
    ])
  })
})

describe('cascade — la passe intermédiaire `core` s\'active avant `off`', () => {
  it('choisit `core` quand une règle souple cède mais que le socle est encore tenable', () => {
    // 7 recettes distinctes (assez pour cuisiner chacune UNE fois) + 3 plats
    // cuisinés qui forcent R0 à 4 consommations totales. La règle SOUPLE
    // `recipe_over_consumed` (plafond 3) échoue en mode strict ; le socle
    // (même jour, contigus, lignée, seconde cuisson) reste, lui, tenable.
    const recipes = buildRecipePool(7)
    const cookedDishes = [
      { id: 100, name: recipes[0].family, recipeCode: recipes[0].code, portionsRemaining: 6, expiresOn: '2026-07-26' },
      { id: 101, name: recipes[1].family, recipeCode: recipes[1].code, portionsRemaining: 4, expiresOn: '2026-07-26' },
      { id: 102, name: recipes[2].family, recipeCode: recipes[2].code, portionsRemaining: 4, expiresOn: '2026-07-26' },
    ]

    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(WINDOW_START),
      recipes,
      cookedDishes,
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 } },
      beamWidth: 24,
    })

    expect(plan.slots).toHaveLength(14)
    expect(plan.status).toBe('review_required')
    const blockerCodes = plan.issues.filter((issue) => issue.severity === 'blocker').map((issue) => issue.code)
    // Motif distinct de la passe totalement dégradée : c'est un délai qui a
    // cédé, pas le socle.
    expect(blockerCodes).toContain('repetition_rules_softened')
    expect(blockerCodes).not.toContain('repetition_rules_relaxed')
  })

  it('un plan issu de la passe `core` ne contient aucune violation du socle', () => {
    const recipes = buildRecipePool(7)
    const cookedDishes = [
      { id: 100, name: recipes[0].family, recipeCode: recipes[0].code, portionsRemaining: 6, expiresOn: '2026-07-26' },
      { id: 101, name: recipes[1].family, recipeCode: recipes[1].code, portionsRemaining: 4, expiresOn: '2026-07-26' },
      { id: 102, name: recipes[2].family, recipeCode: recipes[2].code, portionsRemaining: 4, expiresOn: '2026-07-26' },
    ]

    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(WINDOW_START),
      recipes,
      cookedDishes,
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 } },
      beamWidth: 24,
    })

    // Vérification rejouée à la main pour ne dépendre d'aucune assertion
    // interne à la cascade — c'est la garantie même que le fix apporte.
    expect(socleViolations(plan)).toEqual([])
  })

  it('même quand le plan cite une règle souple violée, le socle reste tenu', () => {
    const recipes = buildRecipePool(7)
    const cookedDishes = [
      { id: 100, name: recipes[0].family, recipeCode: recipes[0].code, portionsRemaining: 6, expiresOn: '2026-07-26' },
      { id: 101, name: recipes[1].family, recipeCode: recipes[1].code, portionsRemaining: 4, expiresOn: '2026-07-26' },
      { id: 102, name: recipes[2].family, recipeCode: recipes[2].code, portionsRemaining: 4, expiresOn: '2026-07-26' },
    ]

    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(WINDOW_START),
      recipes,
      cookedDishes,
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 } },
      beamWidth: 24,
    })

    const issueCodes = plan.issues.map((issue) => issue.code)
    // La règle souple `recipe_over_consumed` doit bien être signalée — c'est
    // elle qui bascule la semaine en `review_required` — et par contraste le
    // socle ne l'est pas.
    expect(issueCodes).toContain('recipe_over_consumed')
    expect(issueCodes).not.toContain('same_day_recipe_repeat')
    expect(issueCodes).not.toContain('recipe_recooked_within_week')
    expect(issueCodes).not.toContain('recipe_lineage_repeat')
  })
})

describe('découplage — rater les protéines n\'autorise pas de répéter un plat', () => {
  // Cible protéique surhumaine : le solveur portion (personalizedMeals) va
  // marquer `protein_gate_relaxed` sur chaque jour. Le beam search — orthogonal
  // par construction — doit continuer à respecter le socle. Le verrou vérifie
  // que les deux couches ne se contaminent pas.
  it('un plan avec protéines relâchées ne recuisine jamais deux fois la même recette', () => {
    // Assez de recettes distinctes pour que le beam remplisse la semaine sans
    // recuisiner deux fois la même (14 recettes couvrent 14 créneaux frais).
    // Chaque recette est structurée pour faire tourner le solveur portion
    // (per100g renseigné) et volontairement PAUVRE en protéines — la cible
    // 300 g/2000 kcal est hors d'atteinte, protein_gate_relaxed va s'activer.
    const recipes = buildRecipePool(14).map((r) => ({
      ...r,
      exactIngredients: [
        {
          name: r.exactIngredients[0].name,
          formNormalized: r.exactIngredients[0].formNormalized,
          category: 'legumineuses',
          role: 'protéine',
          grams: 200,
          per100g: { kcal: 250, proteinG: 15, carbsG: 27.5, fatG: 9, fiberG: 4 },
        },
      ],
    }))
    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(WINDOW_START),
      recipes,
      constraints: { allowShopping: true, maxMinutesByMeal: { dejeuner: 120, diner: 240 } },
      beamWidth: 24,
    })
    expect(plan.slots).toHaveLength(14)

    // Passe le plan dans buildPersonalizedMeals avec une cible protéique
    // surhumaine — force `protein_gate_relaxed` côté personalisation.
    const personalized = buildPersonalizedMeals({
      plan,
      recipes,
      members: [{ id: 'x', name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: false } } }],
      goals: [{ person_name: 'Alex', target_calories: 2000, target_protein_g: 300 }],
    })
    // Les protéines SONT bien relâchées côté personalisation — sinon le test
    // ne mesurerait pas ce qu'il prétend.
    expect(personalized.daily.some((day) => day.protein_gate_relaxed === true)).toBe(true)

    // Contrôle orthogonal : la couche personnalisation n'a PAS modifié la
    // structure recette du plan. Aucun plat n'est cuisiné deux fois en frais
    // dans la semaine — c'est le socle que le beam search a garanti.
    const freshCookings = new Map()
    for (const slot of plan.slots.filter((s) => (s.source || 'fresh') === 'fresh')) {
      freshCookings.set(slot.recipeCode, (freshCookings.get(slot.recipeCode) || 0) + 1)
    }
    for (const [, count] of freshCookings) expect(count).toBeLessThanOrEqual(1)
    // Ni même plat même jour, ni sur deux repas contigus.
    expect(socleViolations(plan)).toEqual([])
  })
})
