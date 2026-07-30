// Verrous des deux invariants introduits par le lot correctif « protéines
// dures + assiette non divergente » (incidents Zoé 03/08 et bacalao 07/08) :
//
// 1. Sur un plat partagé, deux membres du foyer reçoivent la MÊME composition,
//    à un facteur de portion près, borné à `MAX_MEMBER_PORTION_RATIO` (2.0).
//    Le corollaire : le ratio protéines/glucides ne peut plus dériver d'un
//    membre à l'autre pour la même recette.
//
// 2. L'apport en protéines d'un jour respecte le plancher de 90 % de la cible
//    du membre, OU le plan est marqué DÉGRADÉ via `daily.protein_valid=false`
//    (mécanisme existant : `nutritionIssues` → `nutrition_week_review_required`
//    → statut `review_required`). Jamais silencieusement.
//
// Le solveur ne rend JAMAIS rien : ces contrats se traduisent par des flags
// sur `daily`, jamais par des throws — la couche supérieure décide de la
// suite (publier, marquer en revue, ou signaler).

import { describe, expect, it } from 'vitest'
import { buildPersonalizedMeals, optimizeCoupledDailyPortions, optimizeDailyPortions } from '@/lib/domain/planning/personalizedMeals'

const MAX_MEMBER_PORTION_RATIO = 2.0

// Petit corpus artificiel — pas de dépendance au corpus prod, on veut tester
// la mécanique du solveur, pas le catalogue.
const recipe = (code, family, nutrition, category = 'legumes') => ({
  code,
  family,
  eligible: true,
  servings: 2,
  prepMinutes: 20,
  cookMinutes: 25,
  cuisineOrigin: 'France',
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

function planFixed() {
  // Sept jours, le MÊME couple (meat déjeuner / fish dîner) partout : on veut
  // tester le couplage inter-membres, pas la rotation.
  const slots = []
  for (let day = 20; day <= 26; day++) {
    const date = `2026-07-${day}`
    slots.push({ key: `${date}-dejeuner`, date, mealType: 'dejeuner', recipeCode: 'MEAT' })
    slots.push({ key: `${date}-diner`, date, mealType: 'diner', recipeCode: 'FISH' })
  }
  return { slots }
}

describe('couplage inter-membres et composition d\'assiette', () => {
  it('borne le rapport de portions entre deux membres partageant le même plat', () => {
    const result = buildPersonalizedMeals({
      plan: planFixed(),
      recipes: [meat, fish, veggie],
      members: [
        // Julien affamé, Zoé peu affamée : les cibles sont différentes, mais le
        // couplage doit borner l'écart à 2x max sur chaque plat partagé.
        { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
        { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } },
      ],
      goals: [
        { person_name: 'Julien', target_calories: 2800, target_protein_g: 130 },
        { person_name: 'Zoé', target_calories: 1400, target_protein_g: 60 },
      ],
    })

    // Regroupement des repas partagés (même date, même créneau, même recette).
    const byShared = new Map()
    for (const meal of result.meals) {
      if (!meal.canonical_recipe_code) continue
      const key = `${meal.meal_date}-${meal.meal_type}`
      if (!byShared.has(key)) byShared.set(key, [])
      byShared.get(key).push(meal)
    }

    const sharedGroups = [...byShared.values()].filter((meals) => {
      const codes = new Set(meals.map((m) => m.canonical_recipe_code))
      return meals.length >= 2 && codes.size === 1
    })
    expect(sharedGroups.length).toBeGreaterThan(0)

    for (const meals of sharedGroups) {
      const scales = meals.map((m) => Number(m.planned_servings))
      const min = Math.min(...scales)
      const max = Math.max(...scales)
      // Ratio strictement ≤ MAX_MEMBER_PORTION_RATIO (avec la tolérance
      // habituelle sur les arrondis 0.1 du solveur).
      expect(max / min).toBeLessThanOrEqual(MAX_MEMBER_PORTION_RATIO + 1e-6)
    }

    // Le champ observé sur `daily` reflète cette borne et il est bien renseigné.
    for (const day of result.daily) {
      if (day.portion_ratio_lunch != null) expect(day.portion_ratio_lunch).toBeLessThanOrEqual(MAX_MEMBER_PORTION_RATIO + 1e-6)
      if (day.portion_ratio_dinner != null) expect(day.portion_ratio_dinner).toBeLessThanOrEqual(MAX_MEMBER_PORTION_RATIO + 1e-6)
      expect(day.portion_ratio_cap).toBe(MAX_MEMBER_PORTION_RATIO)
    }
  })

  it('sert exactement la même composition d\'assiette aux membres sur un plat partagé', () => {
    const result = buildPersonalizedMeals({
      plan: planFixed(),
      recipes: [meat, fish, veggie],
      members: [
        { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
        { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } },
      ],
      goals: [
        { person_name: 'Julien', target_calories: 2357, target_protein_g: 130 },
        { person_name: 'Zoé', target_calories: 1525, target_protein_g: 60 },
      ],
    })

    const byShared = new Map()
    for (const meal of result.meals) {
      if (!meal.canonical_recipe_code) continue
      const key = `${meal.meal_date}-${meal.meal_type}`
      if (!byShared.has(key)) byShared.set(key, [])
      byShared.get(key).push(meal)
    }

    for (const meals of byShared.values()) {
      const codes = new Set(meals.map((m) => m.canonical_recipe_code))
      if (meals.length < 2 || codes.size !== 1) continue
      // La composition (part protéines dans le total protéines+glucides) est
      // identique entre membres à ε près. Elle ne peut plus diverger : le
      // solveur verrouille `companionScale = mainScale`, donc l'assiette est
      // structurellement la même — juste plus ou moins grande.
      const proteinShares = meals.map((m) => m.protein_g / Math.max(1, m.protein_g + m.carbs_g))
      const shareRange = Math.max(...proteinShares) - Math.min(...proteinShares)
      expect(shareRange).toBeLessThan(0.02) // < 2 points de pourcentage

      // Ratio du companion == ratio du main pour chaque membre (verrou compo).
      for (const meal of meals) {
        const details = meal.portion_details || {}
        if (details.companions?.length) {
          // Le multiplicateur companion égale exactement le multiplicateur main.
          expect(details.companion_multiplier).toBeCloseTo(details.multiplier, 6)
        }
      }
    }
  })

  it('active la contrainte dure protéines : réussite quand le corpus le permet', () => {
    // Cible réaliste (0.06 g/kcal) atteignable par notre recette meat+fish.
    const result = optimizeCoupledDailyPortions({
      members: [
        {
          name: 'Julien',
          target: { kcal: 2000, proteinG: 120, carbsG: 200, fatG: 70, fiberG: 25 },
          breakfast: null,
          snack: null,
          lunch: meat.nutritionPerServing,
          dinner: fish.nutritionPerServing,
          lunchCompanion: null,
          dinnerCompanion: null,
          rules: {},
        },
      ],
    })
    const [res] = result.perMember
    expect(res.feasible).toBe(true)
    expect(res.proteinGateRelaxed).toBe(false)
    // La cible protéines est bien atteinte à au moins 90 %.
    expect(res.total.proteinG).toBeGreaterThanOrEqual(120 * 0.9)
  })

  it('signale explicitement le repli quand la cible protéique est hors d\'atteinte', () => {
    // Cible surhumaine : 300 g de protéines pour 2000 kcal — le corpus test
    // (recettes à ~48g/portion) ne peut pas fournir même avec les portions
    // maximales. Le solveur doit alors relâcher le plancher ET le dire.
    const result = optimizeCoupledDailyPortions({
      members: [
        {
          name: 'Alex',
          target: { kcal: 2000, proteinG: 300, carbsG: 200, fatG: 70, fiberG: 25 },
          breakfast: null,
          snack: null,
          lunch: meat.nutritionPerServing,
          dinner: fish.nutritionPerServing,
          lunchCompanion: null,
          dinnerCompanion: null,
          rules: {},
        },
      ],
    })
    const [res] = result.perMember
    // Le solveur RÉPOND (jamais rien) : il rend le meilleur candidat énergie.
    expect(res.feasible).toBe(true)
    // Mais il annonce que le plancher n'a pas été tenu.
    expect(res.proteinGateRelaxed).toBe(true)
    // Et la liste des membres au plancher raté est propagée.
    expect(result.proteinRelaxedFor).toContain('Alex')
  })

  it('propage le repli protéines vers daily.protein_valid et daily.protein_gate_relaxed', () => {
    const result = buildPersonalizedMeals({
      plan: planFixed(),
      recipes: [meat, fish, veggie],
      members: [{ id: 'a', name: 'Alex', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } }],
      goals: [{ person_name: 'Alex', target_calories: 2000, target_protein_g: 300 }],
    })
    // Le plan est bien rendu.
    expect(result.daily).toHaveLength(7)
    // Le solveur signale le repli sur AU MOINS un jour (cible surhumaine).
    expect(result.daily.some((day) => day.protein_gate_relaxed === true)).toBe(true)
    // Cohérence : quand protein_valid=false le plancher n'est pas tenu.
    for (const day of result.daily) {
      if (day.protein_valid === false) {
        expect(day.total.proteinG).toBeLessThan(0.9 * day.target.proteinG)
      }
    }
  })

  it('rend un plan complet même quand toutes les contraintes ne peuvent être satisfaites', () => {
    // Un membre avec des cibles hors-corpus + contrainte de couplage : le
    // solveur DOIT rendre 7 journées, jamais bloquer.
    const result = buildPersonalizedMeals({
      plan: planFixed(),
      recipes: [meat, fish, veggie],
      members: [
        { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
        { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } },
      ],
      goals: [
        { person_name: 'Julien', target_calories: 3200, target_protein_g: 300 }, // hors-corpus
        { person_name: 'Zoé', target_calories: 1200, target_protein_g: 45 },
      ],
    })
    // Toujours 14 jours (2 membres × 7 dates), jamais rien de sauté.
    expect(result.daily).toHaveLength(14)
    // Le plan est rendu même dégradé (le résultat top-level `valid` peut être
    // false, mais chaque journée existe et porte ses flags).
    for (const day of result.daily) {
      expect(day.total).toBeDefined()
      expect(day.portion_safe).toBe(true) // scales toujours physiquement bornées
    }
  })

  it('émet un blocker « couplage relâché » quand aucun master n\'existe pour les deux membres', () => {
    // Cible protéique surhumaine pour Alex mais raisonnable pour Sam : la
    // combinaison force à traiter les deux membres INDÉPENDAMMENT, ce qui
    // déclenche le mode « couplage relâché ». On vérifie via l'appel direct
    // au solveur joint que le drapeau `couplingRelaxed` est bien remonté.
    const meatNutrition = { kcal: 600, proteinG: 48, carbsG: 45, fatG: 24, fiberG: 7 }
    const fishNutrition = { kcal: 520, proteinG: 42, carbsG: 40, fatG: 20, fiberG: 6 }
    // Deux cibles caloriques très éloignées (3200 vs 1000) : aucun master ne
    // peut coupler leurs échelles dans un rapport ≤ 2.
    const res = optimizeCoupledDailyPortions({
      members: [
        {
          name: 'Grand',
          target: { kcal: 3200, proteinG: 130 },
          breakfast: null, snack: null,
          lunch: meatNutrition, dinner: fishNutrition,
          lunchCompanion: null, dinnerCompanion: null,
          rules: {},
        },
        {
          name: 'Petit',
          target: { kcal: 900, proteinG: 45 },
          breakfast: null, snack: null,
          lunch: meatNutrition, dinner: fishNutrition,
          lunchCompanion: null, dinnerCompanion: null,
          rules: {},
        },
      ],
    })
    // Le solveur rend un plan (jamais rien), mais annonce le repli.
    expect(res.perMember).toHaveLength(2)
    expect(res.couplingRelaxed).toBe(true)
  })

  it('conserve le verrou compositionnel : companionScale = mainScale toujours', () => {
    const target = { kcal: 2000, proteinG: 100, carbsG: 200, fatG: 70, fiberG: 25 }
    // Multi-échelles : la sortie doit toujours avoir companionScale === mainScale.
    const res = optimizeDailyPortions({
      target,
      breakfast: null,
      snack: null,
      lunch: meat.nutritionPerServing,
      dinner: fish.nutritionPerServing,
      lunchCompanion: { nutrition: { kcal: 232, proteinG: 8, carbsG: 46, fatG: 1.3, fiberG: 0.6 } },
      dinnerCompanion: { nutrition: { kcal: 232, proteinG: 8, carbsG: 46, fatG: 1.3, fiberG: 0.6 } },
      rules: {},
    })
    // Verrou : les deux scales de companion sont exactement les mains.
    expect(res.lunchCompanionScale).toBe(res.lunchScale)
    expect(res.dinnerCompanionScale).toBe(res.dinnerScale)
  })
})
