import { describe, expect, it } from 'vitest'
import { banTermMatches, matchesBannedFood } from '@/lib/domain/planning/foodBanMatch'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'

// Incident prod du 24/07 : les interdits du foyer (« veau », « agneau »,
// « fruits de mer », « thon », …) bannissaient par sous-chaînes des aliments
// sans rapport — « fruit » (⊂ « fruits de mer ») tuait TOUTES les collations,
// « eau » (⊂ « veau »/« agneau ») et « navet nouveau cru » (⊃ « veau »)
// tuaient des recettes. Chaque membre × chaque jour ressortait en
// « Contraintes alimentaires ou physiques non satisfaites ».

const PROD_BANS = ['épinards', 'agneau', 'thon', 'panais', 'céleri', 'whey', 'fruits de mer', 'veau']

describe('foodBanMatch — frontières de mots', () => {
  it('un interdit générique couvre toutes ses formes spécifiques', () => {
    expect(banTermMatches('thon au naturel en conserve égoutté', 'thon')).toBe(true)
    expect(banTermMatches('épaule de veau crue', 'veau')).toBe(true)
    expect(banTermMatches('bouillon d’agneau non salé', 'agneau')).toBe(true)
    expect(banTermMatches('céleri branche cru', 'céleri')).toBe(true)
    expect(banTermMatches('fruits de mer surgelés', 'fruits de mer')).toBe(true)
  })

  it('tolère le singulier/pluriel mot à mot (« s » ET « x » finaux)', () => {
    expect(banTermMatches('épinard frais', 'épinards')).toBe(true)
    expect(banTermMatches('épinards hachés surgelés', 'épinard')).toBe(true)
    // Pluriels français en -x, présents dans le vocabulaire réel du corpus.
    expect(banTermMatches('poireaux', 'poireau')).toBe(true)
    expect(banTermMatches('choux de bruxelles', 'chou')).toBe(true)
    expect(banTermMatches('chou rouge émincé', 'choux')).toBe(true)
    expect(banTermMatches('gâteaux apéritifs', 'gâteau')).toBe(true)
    expect(banTermMatches('oignons nouveaux', 'oignon nouveau')).toBe(true)
    expect(banTermMatches('pruneaux prunes sechees', 'pruneau')).toBe(true)
  })

  it('la dépluralisation ne crée pas de faux positifs sur radicaux courts', () => {
    // « maïs » plié devient « mais » : le radical « mai » est trop court pour
    // être dépluralisé — un interdit « maïs » ne bannit pas le mot « mai ».
    expect(banTermMatches('salade de mai', 'maïs')).toBe(false)
    expect(banTermMatches('maïs doux en grains', 'maïs')).toBe(true)
  })

  it('ne banni JAMAIS un fragment de l’interdit (les collisions de l’incident prod)', () => {
    expect(banTermMatches('eau', 'veau')).toBe(false)
    expect(banTermMatches('eau', 'agneau')).toBe(false)
    expect(banTermMatches('fruit', 'fruits de mer')).toBe(false)
    expect(banTermMatches('pomme', 'fruits de mer')).toBe(false)
    expect(banTermMatches('navet nouveau cru', 'veau')).toBe(false)
    expect(banTermMatches('oignon nouveau frais', 'veau')).toBe(false)
    expect(banTermMatches('pain complet', 'panais')).toBe(false)
    expect(banTermMatches('skyr nature', 'whey')).toBe(false)
  })

  it('ignore les accents, la casse et la ponctuation', () => {
    expect(banTermMatches('CÉLERI-RAVE cru', 'celeri')).toBe(true)
    expect(banTermMatches('thon à l’huile', 'THON')).toBe(true)
  })

  it('un interdit vide ne matche jamais', () => {
    expect(banTermMatches('eau', '')).toBe(false)
    expect(matchesBannedFood('eau', ['', '  ', null])).toBe(false)
  })

  it('matchesBannedFood agrège les interdits du foyer sans faux positifs', () => {
    expect(matchesBannedFood('eau', PROD_BANS)).toBe(false)
    expect(matchesBannedFood('fruit', PROD_BANS)).toBe(false)
    expect(matchesBannedFood('navet nouveau cru', PROD_BANS)).toBe(false)
    expect(matchesBannedFood('thon au naturel en conserve égoutté', PROD_BANS)).toBe(true)
    expect(matchesBannedFood('veau haché cru', PROD_BANS)).toBe(true)
  })
})

// ── Régression bout-en-bout : le scénario prod exact ────────────────────────
// Deux membres (Julien pdj+collation, Zoé collation), les 8 interdits réels du
// foyer, un corpus où chaque recette contient de l'eau. Avant le correctif :
// aucune collation possible (« fruit » banni par « fruits de mer ») et
// recettes à l'eau interdites → 422 pour chaque membre × chaque jour.

const mkRecipe = (code, family, ingredients, extra = {}) => ({
  code,
  family,
  eligible: true,
  servings: 2,
  prepMinutes: 20,
  cookMinutes: 15,
  identityLevel: 'named_traditional_dish',
  techniques: ['cuisson'],
  sensory: { profile: 'warm_aromatic', identity_guardrails: [] },
  exactIngredients: ingredients.map(([name, formNormalized, grams, category]) => ({
    name, formNormalized, quantity: grams, unit: 'g', grams, optional: false, category,
  })),
  exactSteps: [{ n: 1, instruction: 'Cuire.' }],
  nutritionPerServing: { kcal: 620, proteinG: 42, carbsG: 55, fatG: 22, fiberG: 9 },
  nutritionCoverage: { pct: 100 },
  ...extra,
})

// Toutes les recettes contiennent de l'eau (comme le vrai corpus) ; une seule
// contient du veau — c'est ELLE et elle seule qui doit rester interdite.
const pouletRiz = mkRecipe('FR-POULET', 'Poulet au riz', [
  ['Poulet cru', 'poulet cru', 300, 'viandes'],
  ['Riz blanc cru', 'riz blanc cru', 150, 'cereales_feculents'],
  ['Eau', 'eau', 300, 'huiles_matieres_grasses'],
])
const boeufCarottes = mkRecipe('FR-BOEUF', 'Bœuf aux carottes', [
  ['Bœuf cru', 'boeuf cru', 300, 'viandes'],
  ['Carotte crue', 'carotte crue', 200, 'legumes'],
  ['Eau', 'eau', 250, 'huiles_matieres_grasses'],
])
const blanquette = mkRecipe('FR-VEAU', 'Blanquette de veau', [
  ['Épaule de veau crue', 'epaule de veau crue', 300, 'viandes'],
  ['Eau', 'eau', 300, 'huiles_matieres_grasses'],
])

const PROD_CONSTRAINTS = {
  allowShopping: true,
  allergens: [],
  forbiddenForms: PROD_BANS.map((ban) => ban
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()),
  dislikedForms: [],
  diets: [],
}

const julien = { name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true, vegetarian_meat_swaps_per_week: 0 } } }
const zoe = { name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true, vegetarian_meat_swaps_per_week: 0 } } }
const goals = [
  { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
  { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
]

const basePlan = () => ({
  status: 'published', issues: [], objectiveScores: {}, reservations: [], shoppingItems: [],
  slots: [
    { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'FR-POULET', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
    { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'FR-BOEUF', allocations: [], shortages: [], stockCoverage: 0, explanations: [] },
  ],
})

describe('régression incident prod — interdits foyer et boucle complète', () => {
  it('construit le payload avec les interdits réels du foyer (plus de 422 universel)', () => {
    const payload = buildCanonicalPlanPayload({
      plan: basePlan(),
      recipes: [pouletRiz, boeufCarottes, blanquette],
      members: [julien, zoe],
      goals,
      windowStart: '2026-07-20',
      constraints: PROD_CONSTRAINTS,
      inventoryLots: [],
    })
    // Les recettes à l'eau passent, les collations existent pour les deux
    // membres et le petit-déjeuner de Julien est présent.
    expect(payload.slots.length).toBeGreaterThanOrEqual(2)
    const snacks = payload.legacy_meals.filter((meal) => meal.meal_type === 'collation')
    expect(snacks.some((meal) => meal.person_name === 'Julien')).toBe(true)
    expect(snacks.some((meal) => meal.person_name === 'Zoé')).toBe(true)
    expect(payload.legacy_meals.some((meal) => meal.meal_type === 'pdj' && meal.person_name === 'Julien')).toBe(true)
  })

  it('le solveur exclut toujours les VRAIS interdits (veau) mais plus l’eau', () => {
    const slots = [
      { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
      { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
    ]
    const plan = generateClosedLoopPlan({
      slots,
      recipes: [pouletRiz, boeufCarottes, blanquette],
      inventoryLots: [],
      constraints: PROD_CONSTRAINTS,
    })
    // Assertions NON vacueuses : sur l'ancien matching, TOUTES les recettes
    // (eau ⊂ veau/agneau) étaient forbidden_food → beam vide, slots=[] et
    // status='review_required' — le test doit donc exiger un plan publié
    // avec ses deux créneaux réellement pourvus.
    expect(plan.status).toBe('published')
    expect(plan.slots).toHaveLength(2)
    const chosen = new Set(plan.slots.map((slot) => slot.recipeCode))
    expect(chosen.has('FR-VEAU')).toBe(false)
    // Les recettes à l'eau ne sont plus « forbidden_food » : elles sont bien choisies.
    expect([...chosen].every((code) => ['FR-POULET', 'FR-BOEUF'].includes(code))).toBe(true)
  })
})
