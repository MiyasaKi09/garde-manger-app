import { describe, expect, it } from 'vitest'
import {
  DESSERT_FRUIT_FORMS,
  DESSERT_KCAL_THRESHOLDS,
  buildDessertComponent,
  buildMealPlate,
  plateComponentsNutrition,
  scalePlateComponents,
} from '@/lib/domain/planning/mealComposition'
import { generateClosedLoopPlan, isMealSuitableRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { PLATE_ROLES, isDessertRecipe } from '@/lib/domain/planning/plateRole'

// Incident production plan f84800ec-2a71-4d1f-8682-6548c9b5520c : un kouign-
// amann servi trois dîners de la même semaine, 1006 kcal pour 7,8 g de
// protéines. Le rôle `plate.dessert` est le contrat qu'un dessert est un
// dessert — pas un repas. Ce fichier vérifie les deux versants :
//
//  1. règle DURE — un dessert ne remplit jamais un créneau `dejeuner`/`diner`
//     comme plat principal, qu'il soit déclaré via `plate: { role: 'dessert' }`
//     par l'éditeur du corpus ou dérivé par sa catégorie/son nom ;
//
//  2. règle SOUPLE — un dessert PEUT être attaché à un repas en fin de repas,
//     à trois conditions : l'appelant l'a demandé explicitement
//     (`constraints.attachDessert === true`), le budget calorique restant le
//     permet (`remainingKcalBudget` — le solveur par membre reste maître de
//     ses cibles), et la portion est calibrée pour la FIN d'un repas — pas
//     la part entière d'un gâteau.

const dessertRecipe = (family, { code = 'DESS-01', kcal = 1006, mass = 166, allergens = ['gluten', 'lait'], forms = ['farine t65', 'beurre doux'], plate = { role: 'dessert', accepts: [], reason: 'pâtisserie de fin de repas' } } = {}) => ({
  code,
  family,
  category: 'pâtisserie levée feuilletée',
  cuisineOrigin: 'France',
  eligible: true,
  servings: 6,
  prepMinutes: 45,
  cookMinutes: 40,
  allergens,
  techniques: ['four'],
  sensory: { profile: 'sweet_rich', scores: { richness: 5 } },
  exactIngredients: forms.map((form) => ({
    name: form, formNormalized: form, grams: (mass * 6) / forms.length, per100g: { kcal: kcal / 4, proteinG: 4, carbsG: 40, fatG: 20, fiberG: 1 },
  })),
  nutritionPerServing: { kcal, proteinG: 7.8, carbsG: 100, fatG: 55, fiberG: 2 },
  plate,
})

const mainDish = (code, family, overrides = {}) => ({
  code,
  family,
  category: overrides.category || 'plat mijoté',
  cuisineOrigin: 'France',
  eligible: true,
  servings: 4,
  prepMinutes: 20,
  cookMinutes: 25,
  allergens: [],
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', target_textures: ['fondant'] },
  exactIngredients: [
    { name: 'poulet', formNormalized: 'poulet', category: 'volailles', grams: 500, optional: false, per100g: { kcal: 165, proteinG: 30, carbsG: 0, fatG: 4, fiberG: 0 } },
    { name: 'riz basmati cru', formNormalized: 'riz basmati cru', category: 'cereales_feculents', grams: 280, optional: false, per100g: { kcal: 352, proteinG: 7.4, carbsG: 78, fatG: 0.9, fiberG: 1 } },
    { name: 'carotte crue', formNormalized: 'carotte crue', category: 'legumes', grams: 400, optional: false, per100g: { kcal: 36, proteinG: 0.8, carbsG: 6, fatG: 0.2, fiberG: 2.6 } },
  ],
  nutritionPerServing: { kcal: 520, proteinG: 35, carbsG: 60, fatG: 12, fiberG: 5 },
  ...overrides,
})

describe('règle dure — un dessert n’occupe pas un créneau de repas', () => {
  it('rejette du catalogue une recette dont le rôle DÉCLARÉ est `dessert`', () => {
    const kouign = dessertRecipe('Kouign-amann')
    expect(isDessertRecipe(kouign)).toBe(true)
    expect(isMealSuitableRecipe(kouign)).toBe(false)
  })

  it('reste INERTE tant que le rôle n’est pas déclaré : la dérivation par nom ne mord pas seule', () => {
    // Contrat avec l'agent des rôles : la règle dure n'agit que sur les
    // recettes marquées `plate.role='dessert'`. Une recette sans
    // déclaration, même reconnue « pâtisserie » par la dérivation, reste
    // éligible tant que le champ n'est pas posé. Rationale : les motifs de
    // dérivation sont volontairement larges pour composer l'assiette (« tarte
    // aux ») et feraient régresser des recettes salées comme
    // « Tarte aux poireaux et lardons » si on les convoquait ici.
    const patisserie = dessertRecipe('Sablé breton', {
      code: 'REAL-XYZ', plate: null, forms: ['farine t65'], allergens: [],
    })
    expect(isDessertRecipe(patisserie)).toBe(false)
    // L'ancien filtre par catégorie l'exclut quand même via `gateau` ou
    // `patisserie` — mais avec une catégorie neutre, la recette passe.
    const neutre = { ...patisserie, category: 'plat unique' }
    expect(isMealSuitableRecipe(neutre)).toBe(true)
  })

  it('mord dès que la déclaration est posée par l’éditeur du corpus', () => {
    // Le kouign-amann de production sera marqué par l'agent des rôles ; à ce
    // moment-là, la règle dure l'exclut immédiatement du solveur.
    const kouign = dessertRecipe('Kouign-amann', {
      code: 'REAL-089', plate: { role: 'dessert', accepts: [], reason: 'pâtisserie de fin de repas' },
    })
    expect(isDessertRecipe(kouign)).toBe(true)
    expect(isMealSuitableRecipe(kouign)).toBe(false)
  })

  it('laisse passer un plat non-dessert dont la catégorie n’évoque pas un dessert', () => {
    expect(isMealSuitableRecipe(mainDish('MAIN-01', 'Poulet basquaise'))).toBe(true)
  })

  it('n’occupe jamais un créneau `dejeuner`/`diner` — même quand la recette dessert est présente au catalogue', () => {
    // Le solveur reçoit deux recettes : un dessert et un plat principal. Le
    // filtre `evaluateCandidate` interdit d'attribuer le dessert au dîner ;
    // le plat principal doit gagner les deux créneaux.
    const kouign = dessertRecipe('Kouign-amann')
    const poulet = mainDish('MAIN-01', 'Poulet basquaise')
    const plan = generateClosedLoopPlan({
      slots: [
        { key: 'lundi-diner', date: '2026-07-20', mealType: 'diner' },
        { key: 'mardi-diner', date: '2026-07-25', mealType: 'diner' },
      ],
      recipes: [kouign, poulet],
      constraints: { allowShopping: true, targetPerMeal: { kcal: 600, proteinG: 30 } },
    })
    expect(plan.slots.map((slot) => slot.recipeCode)).not.toContain('DESS-01')
  })

  it('respecte pourtant un créneau FIGÉ sur une recette dessert : le libre arbitre de l’utilisateur l’emporte', () => {
    // Un utilisateur peut vouloir un « soir de fête » où un dessert est LE
    // plat. Le filtre du solveur ne dénoue pas les choix explicites.
    const kouign = dessertRecipe('Kouign-amann')
    const poulet = mainDish('MAIN-01', 'Poulet basquaise')
    const plan = generateClosedLoopPlan({
      slots: [
        { key: 'lundi-diner', date: '2026-07-20', mealType: 'diner', fixedRecipeCode: 'DESS-01' },
      ],
      recipes: [kouign, poulet],
      constraints: { allowShopping: true, targetPerMeal: { kcal: 600, proteinG: 30 } },
    })
    expect(plan.slots[0].recipeCode).toBe('DESS-01')
  })
})

describe('règle souple — attacher un dessert de fin de repas', () => {
  it('reste inerte tant que `attachDessert` n’est pas explicitement demandé', () => {
    // C'est la garantie de rétro-compatibilité : sans le flag, tous les
    // appels historiques à `buildMealPlate` produisent le même résultat
    // qu'avant. Le test « ramène l'accompagnement à une proportion défendable
    // du corpus » (plateRole.test.js) en dépend directement.
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {})
    expect(plate.components.every((component) => component.role !== 'dessert')).toBe(true)
    expect(plate.dessert).toBeNull()
    expect(plate.dessertSkippedReason).toBeNull()
  })

  it('sert un FRUIT quand le budget est modéré — le cas ordinaire', () => {
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true,
      remainingKcalBudget: 180,
      dayIndex: 0,
    })
    const dessert = plate.components.find((component) => component.role === 'dessert')
    expect(dessert).toBeTruthy()
    expect(dessert.category).toBe('fruits')
    // Un fruit typique tient sous ~120 kcal ; jamais plus que le budget.
    expect(dessert.nutrition.kcal).toBeLessThanOrEqual(180)
    expect(dessert.nutrition.kcal).toBeGreaterThan(0)
  })

  it('sert une PORTION DE FIN DE REPAS d’un dessert-recette quand le budget est large', () => {
    // Kouign-amann servi APRÈS le poulet : pas la part entière (1006 kcal),
    // mais une fraction calibrée sur `richMaxAdd` (~220 kcal). La portion en
    // grammes descend proportionnellement.
    const kouign = dessertRecipe('Kouign-amann')
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true,
      remainingKcalBudget: 400,
      dessertPool: [kouign],
      dayIndex: 0,
    })
    const dessert = plate.components.find((component) => component.role === 'dessert')
    expect(dessert).toBeTruthy()
    expect(dessert.recipeCode).toBe('DESS-01')
    expect(dessert.fractionOfServing).toBeLessThan(1)
    // Le dessert-recette tient dans le budget ET dans la cible « fin de repas ».
    expect(dessert.nutrition.kcal).toBeLessThanOrEqual(400)
    expect(dessert.nutrition.kcal).toBeLessThanOrEqual(DESSERT_KCAL_THRESHOLDS.richMaxAdd + 5)
    // Une part réduite pèse moins qu'une part nominale (~166 g le kouign).
    expect(dessert.quantityGrams).toBeLessThan(166)
  })

  it('REFUSE motivé quand le budget est trop mince : mieux vaut pas de dessert qu’un excès non demandé', () => {
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true,
      remainingKcalBudget: 40,
    })
    expect(plate.components.some((component) => component.role === 'dessert')).toBe(false)
    expect(plate.dessertSkippedReason).toBe('insufficient_budget')
    expect(plate.completeAfter).toBe(true)
  })

  it('ne rentre pas dans `missingUnresolved` — l’absence de dessert ne rend pas une assiette incomplète', () => {
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true,
      remainingKcalBudget: 10,
    })
    expect(plate.missingUnresolved).not.toContain('dessert')
  })

  it('n’attache JAMAIS un dessert à un dessert, un accompagnement ou une préparation de base', () => {
    for (const role of [PLATE_ROLES.DESSERT, PLATE_ROLES.SIDE, PLATE_ROLES.COMPONENT]) {
      const recipe = { ...mainDish(`SPECIAL-${role}`, `Spécial ${role}`), plate: { role, accepts: [], reason: 'test' } }
      const plate = buildMealPlate(recipe, {
        attachDessert: true, remainingKcalBudget: 500, dessertPool: [dessertRecipe('Kouign-amann')],
      })
      expect(plate.components.every((component) => component.role !== 'dessert'), role).toBe(true)
      expect(plate.dessert).toBeNull()
    }
  })

  it('respecte les allergènes du foyer pour un dessert-recette', () => {
    // Un kouign porte gluten et lait ; un foyer sans gluten ne le recevra
    // pas. À défaut de dessert-recette compatible, on retombe sur le fruit.
    const kouign = dessertRecipe('Kouign-amann', { allergens: ['gluten', 'lait'] })
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true, remainingKcalBudget: 400,
      dessertPool: [kouign], allergens: ['gluten'],
    })
    const dessert = plate.components.find((component) => component.role === 'dessert')
    expect(dessert).toBeTruthy()
    expect(dessert.recipeCode).toBeUndefined()
    expect(dessert.category).toBe('fruits')
  })

  it('respecte les aliments interdits pour un fruit — s’en passe si aucun fruit n’est autorisé', () => {
    // Tous les fruits par défaut sont dans DESSERT_FRUIT_FORMS ; bannir
    // toutes leurs formes normalisées doit forcer le refus motivé.
    const bans = DESSERT_FRUIT_FORMS.map((fruit) => fruit.formNormalized)
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true, remainingKcalBudget: 180, forbiddenForms: bans,
    })
    expect(plate.components.some((component) => component.role === 'dessert')).toBe(false)
    expect(plate.dessertSkippedReason).toBe('no_allowed_candidate')
  })

  it('applique une rotation déterministe sur les fruits selon `dayIndex`', () => {
    // Deux dîners consécutifs sur le même plat ne servent pas le même fruit.
    // La rotation est PURE d'un `dayIndex` : reproductibilité totale.
    const lundi = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true, remainingKcalBudget: 200, dayIndex: 0,
    }).dessert
    const mardi = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true, remainingKcalBudget: 200, dayIndex: 1,
    }).dessert
    expect(lundi.formNormalized).not.toBe(mardi.formNormalized)
  })

  it('compte le dessert dans la nutrition de l’assiette', () => {
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true, remainingKcalBudget: 200, dayIndex: 0,
    })
    // `nutritionPerServing` de l'assiette = somme des composants (dessert
    // compris) — c'est ce qu'attend le solveur par membre pour ajuster le
    // multiplicateur du plat sans casser la cible énergétique.
    expect(plate.nutritionPerServing.kcal).toBeGreaterThan(0)
    const scaled = scalePlateComponents(plate, 1)
    const sumKcal = scaled.reduce((sum, component) => sum + (component.nutrition?.kcal || 0), 0)
    expect(sumKcal).toBeCloseTo(plate.nutritionPerServing.kcal, 1)
    expect(plateComponentsNutrition(scaled).kcal).toBeCloseTo(plate.nutritionPerServing.kcal, 1)
  })

  it('propage `recipe_code` et `fraction_of_serving` sur un dessert-recette matérialisé', () => {
    const kouign = dessertRecipe('Kouign-amann')
    const plate = buildMealPlate(mainDish('MAIN-01', 'Poulet basquaise'), {
      attachDessert: true, remainingKcalBudget: 400, dessertPool: [kouign], dayIndex: 0,
    })
    const scaled = scalePlateComponents(plate, 1)
    const dessert = scaled.find((component) => component.role === 'dessert')
    expect(dessert.recipe_code).toBe('DESS-01')
    expect(dessert.fraction_of_serving).toBeGreaterThan(0)
    expect(dessert.fraction_of_serving).toBeLessThan(1)
  })
})

describe('API pure — `buildDessertComponent`', () => {
  it('sans budget, cible la borne de fruit — le mode « démonstration » reste léger', () => {
    const { component } = buildDessertComponent({})
    expect(component).toBeTruthy()
    expect(component.category).toBe('fruits')
  })

  it('renvoie `null` motivé quand le budget est sous le seuil minimum', () => {
    const outcome = buildDessertComponent({ remainingKcalBudget: 10 })
    expect(outcome.component).toBeNull()
    expect(outcome.reason).toBe('insufficient_budget')
    expect(outcome.budget).toBe(10)
  })

  it('préfère le fruit quand le budget est modéré, même si un dessert-recette est disponible', () => {
    // À 150 kcal, un kouign portionné ferait ~25 g soit ~150 kcal — un peu
    // en dessous du plancher « intérêt gustatif » (`richMinAdd`). Le fruit
    // est ordinaire et suffit.
    const outcome = buildDessertComponent({
      remainingKcalBudget: 150,
      dessertPool: [dessertRecipe('Kouign-amann')],
    })
    expect(outcome.component.category).toBe('fruits')
  })
})
