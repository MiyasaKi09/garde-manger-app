import { describe, expect, it } from 'vitest'
import {
  BASE_REUSE_ACTIVE_MINUTES,
  SHARED_BASE_ISSUE_CODES,
  applySharedBaseStock,
  auditSharedBases,
  buildSharedBaseCatalog,
  planSlotBases,
  recipeBaseRefs,
  sharedBaseUsage,
  usesSharedBase,
} from '@/lib/domain/planning/sharedBases'
import { generateClosedLoopPlan, recipeDiversityProfile } from '@/lib/domain/planning/closedLoopPlanner'
import { DIVERSITY_DIMENSIONS, buildRepetitionRules, weekDiversity } from '@/lib/domain/planning/repetitionRules'

/**
 * BATCH COOKING PAR BASE PARTAGÉE — cuire une fois, manger DIFFÉRENT.
 *
 * Ces tests verrouillent les trois promesses du modèle (lib/domain/planning/sharedBases.js) :
 * 1. une semaine sans base partagée ne change strictement pas de comportement ;
 * 2. trois plats sur une même base font baisser le temps de cuisine, réellement ;
 * 3. trois plats sur une même base ne sont PAS une répétition, alors que le même
 *    plat servi deux fois continue de l'être.
 */

// ─── Corpus d'essai ──────────────────────────────────────────────────────────
// Recettes volontairement minimales : aucune technique déclarée, aucune
// conservation, aucun `batchable`. `recipePlanningProfile` les juge donc « non
// documentées » et le moteur ne leur propose JAMAIS de production
// multi-portions — ce qui isole ce que ces tests mesurent : la base, et rien
// d'autre. Les légumes gardent la protéine `vegetal`, non plafonnée
// (UNCAPPED_PROTEIN_FAMILIES), pour que les quotas hebdomadaires ne viennent pas
// décider à la place de la base.

const BASE_MINUTES = 25

const makeBaseRecipe = (code = 'SRC-BASE', overrides = {}) => ({
  code,
  family: `Base ${code}`,
  eligible: true,
  servings: 6,
  prepMinutes: BASE_MINUTES,
  cookMinutes: 20,
  category: 'sauce de base',
  cuisineOrigin: 'France',
  allergens: [],
  techniques: [],
  exactIngredients: [{ name: 'Tomate crue', formNormalized: 'tomate crue', grams: 800, optional: false, category: 'legumes' }],
  nutritionPerServing: { kcal: 90, proteinG: 3, carbsG: 12, fatG: 3, fiberG: 3 },
  ...overrides,
})

/**
 * Un plat qui EMPLOIE une base : un ingrédient ordinaire, pesé et compté comme
 * les autres, qui porte en plus `component.code` — le code de la recette de la
 * base. C'est toute la déclaration ; il n'y a pas d'autre champ à remplir.
 */
const makeDish = (code, { form, profile, baseCode = 'SRC-BASE', prepMinutes = 20, ...overrides } = {}) => ({
  code,
  family: `Plat ${code}`,
  eligible: true,
  servings: 2,
  prepMinutes,
  cookMinutes: 15,
  category: 'plat complet',
  cuisineOrigin: 'France',
  allergens: [],
  techniques: [],
  sensory: { profile, scores: { richness: 2, acidic: 2, freshness: 3 }, target_textures: ['fondant'] },
  exactIngredients: [
    { name: form, formNormalized: form, grams: 220, optional: false, category: 'legumes' },
    ...(baseCode
      ? [{
        name: 'Sauce de base',
        formNormalized: 'tomate crue',
        grams: 180,
        optional: false,
        category: 'legumes',
        component: { code: baseCode, name: 'Base partagée', requiredQuantity: 180, requiredUnit: 'g', yieldQuantity: 900, yieldUnit: 'g' },
      }]
      : []),
  ],
  nutritionPerServing: { kcal: 520, proteinG: 22, carbsG: 60, fatG: 16, fiberG: 9 },
  ...overrides,
})

const DINNERS = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10']
const dinnerSlots = (count) => DINNERS.slice(0, count)
  .map((date, index) => ({ key: `d${index + 1}`, date, mealType: 'diner' }))

const plan = (recipes, { slots = dinnerSlots(3), baseRecipes = [makeBaseRecipe()], ...rest } = {}) =>
  generateClosedLoopPlan({
    slots,
    recipes,
    baseRecipes,
    constraints: { allowShopping: true },
    ...rest,
  })

// ─────────────────────────────────────────────────────────────────────────────
describe('sharedBases — la déclaration d’une base', () => {
  it('lit la base sur l’ingrédient qui porte `component.code`, et nulle part ailleurs', () => {
    const dish = makeDish('A', { form: 'carotte crue', profile: 'warm_aromatic' })
    expect(usesSharedBase(dish)).toBe(true)
    expect(recipeBaseRefs(dish)).toEqual([expect.objectContaining({
      code: 'SRC-BASE', requiredQuantity: 180, requiredUnit: 'g', yieldQuantity: 900,
    })])
    // Un plat sans `component` n'emploie aucune base : le chemin entier reste inerte.
    expect(recipeBaseRefs(makeDish('B', { form: 'poireau cru', profile: 'fresh_acidic', baseCode: null }))).toEqual([])
  })

  it('ignore une base portée par un ingrédient OPTIONNEL et ne compte jamais deux fois la même', () => {
    const dish = makeDish('A', { form: 'carotte crue', profile: 'warm_aromatic' })
    const withExtras = {
      ...dish,
      exactIngredients: [
        ...dish.exactIngredients,
        // Deuxième mention de la MÊME base : on ne la cuisine pas deux fois.
        { name: 'Rab de sauce', formNormalized: 'tomate crue', grams: 60, optional: false, component: { code: 'SRC-BASE' } },
        // Base FACULTATIVE : elle ne peut pas justifier d'ouvrir une session.
        { name: 'Pesto maison', formNormalized: 'basilic frais', grams: 20, optional: true, component: { code: 'SRC-PESTO' } },
      ],
    }
    expect(recipeBaseRefs(withExtras).map((ref) => ref.code)).toEqual(['SRC-BASE'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('sharedBases — le catalogue des bases', () => {
  it('écarte une base dont la reprise n’économise rien', () => {
    // Reprendre coûte BASE_REUSE_ACTIVE_MINUTES : une base plus rapide que sa
    // propre reprise ne se mutualise pas — même règle que les productions,
    // qui refusent toute stratégie à économie nulle ou négative.
    const catalog = buildSharedBaseCatalog([], [
      makeBaseRecipe('SRC-LONGUE', { prepMinutes: 25 }),
      makeBaseRecipe('SRC-INSTANT', { prepMinutes: BASE_REUSE_ACTIVE_MINUTES }),
    ])
    expect([...catalog.keys()]).toEqual(['SRC-LONGUE'])
    expect(catalog.get('SRC-LONGUE')).toMatchObject({ activeMinutes: 25, savedPerReuse: 25 - BASE_REUSE_ACTIVE_MINUTES, shelfLifeDays: 3 })
  })

  it('respecte une durée de conservation DÉCLARÉE, sans jamais en deviner une', () => {
    const catalog = buildSharedBaseCatalog([], [makeBaseRecipe('SRC-BASE', { shelfLifeDays: 6 })])
    expect(catalog.get('SRC-BASE').shelfLifeDays).toBe(6)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('sharedBases — cuire, reprendre, recuire', () => {
  const catalog = buildSharedBaseCatalog([], [makeBaseRecipe()])
  const dish = makeDish('A', { form: 'carotte crue', profile: 'warm_aromatic' })

  it('cuit la base au premier plat, la reprend aux suivants, et la recuit une fois périmée', () => {
    const first = planSlotBases({ recipe: dish, catalog, date: '2026-09-07' })
    expect(first.cooked).toEqual([expect.objectContaining({ code: 'SRC-BASE', useBy: '2026-09-10' })])
    expect(first.addedActiveMinutes).toBe(BASE_MINUTES)
    expect(first.savedActiveMinutes).toBe(0)

    const stock = applySharedBaseStock(undefined, first, { date: '2026-09-07', slotKey: 'd1' })
    const second = planSlotBases({ recipe: dish, catalog, date: '2026-09-09', baseStock: stock })
    expect(second.reused).toEqual([expect.objectContaining({ code: 'SRC-BASE' })])
    expect(second.addedActiveMinutes).toBe(BASE_REUSE_ACTIVE_MINUTES)
    expect(second.savedActiveMinutes).toBe(BASE_MINUTES - BASE_REUSE_ACTIVE_MINUTES)

    // Au-delà de la fenêtre de conservation, la base n'existe plus : elle est
    // recuite. Ce n'est pas une faute, c'est la conservation qui parle — et le
    // créneau le dit, pour que l'explication puisse le raconter.
    const late = planSlotBases({ recipe: dish, catalog, date: '2026-09-12', baseStock: stock })
    expect(late.addedActiveMinutes).toBe(BASE_MINUTES)
    expect(late.notes.map((note) => note.code)).toContain('shared_base_recooked')
  })

  it('n’invente AUCUNE minute pour une base dont la recette est inconnue', () => {
    // La règle fondatrice du dépôt : un chiffre qu'on n'a pas su sourcer est
    // absent, jamais estimé. Un plat dont la base n'est pas au catalogue se
    // cuisine exactement comme avant.
    const orphan = makeDish('Z', { form: 'courgette crue', profile: 'fresh_acidic', baseCode: 'SRC-INCONNUE' })
    const decision = planSlotBases({ recipe: orphan, catalog, date: '2026-09-07' })
    expect(decision.addedActiveMinutes).toBe(0)
    expect(decision.savedActiveMinutes).toBe(0)
    expect(decision.codes).toEqual([])
    expect(decision.notes).toEqual([{ code: 'shared_base_recipe_unknown', baseCode: 'SRC-INCONNUE' }])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('closedLoopPlanner — une semaine SANS base partagée ne change pas', () => {
  it('produit exactement le même plan, que des recettes de base soient fournies ou non', () => {
    const recipes = [
      makeDish('A', { form: 'carotte crue', profile: 'warm_aromatic', baseCode: null }),
      makeDish('B', { form: 'poireau cru', profile: 'fresh_acidic', baseCode: null }),
      makeDish('C', { form: 'courgette crue', profile: 'creamy_delicate', baseCode: null }),
    ]
    const sans = plan(recipes, { baseRecipes: [] })
    const avec = plan(recipes, { baseRecipes: [makeBaseRecipe()] })

    expect(sans.status).toBe('published')
    expect(avec).toEqual(sans)
    // Aucune clé parasite : le plan est celui d'avant, octet pour octet.
    expect(JSON.stringify(sans)).not.toContain('sharedBases')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('closedLoopPlanner — trois plats sur une base : le temps baisse vraiment', () => {
  const recipes = [
    makeDish('A', { form: 'carotte crue', profile: 'warm_aromatic' }),
    makeDish('B', { form: 'poireau cru', profile: 'fresh_acidic' }),
    makeDish('C', { form: 'courgette crue', profile: 'creamy_delicate' }),
  ]

  it('cuit la base une seule fois pour trois plats et rend les minutes à la semaine', () => {
    const result = plan(recipes)
    expect(result.slots).toHaveLength(3)

    const decisions = result.slots.map((slot) => slot.sharedBases)
    expect(decisions.every(Boolean)).toBe(true)
    // Une cuisson de base sur la semaine, deux reprises.
    expect(decisions.filter((decision) => decision.cooked.length)).toHaveLength(1)
    expect(decisions.filter((decision) => decision.reused.length)).toHaveLength(2)
    // Et c'est bien le PREMIER créneau qui l'ouvre : la base n'existe pas avant
    // d'avoir été cuite.
    expect(decisions[0].cooked).toHaveLength(1)

    // Le gain, en minutes actives, mesuré contre la semaine où chaque plat
    // referait sa propre base.
    const avecPartage = result.slots.reduce((sum, slot) => sum + slot.sharedBases.addedActiveMinutes, 0)
    const sansPartage = recipes.length * BASE_MINUTES
    expect(avecPartage).toBe(BASE_MINUTES + 2 * BASE_REUSE_ACTIVE_MINUTES)
    expect(avecPartage).toBeLessThan(sansPartage)
    expect(result.sharedBases.savedActiveMinutes).toBe(2 * (BASE_MINUTES - BASE_REUSE_ACTIVE_MINUTES))
    expect(sansPartage - avecPartage).toBe(result.sharedBases.savedActiveMinutes)

    expect(result.sharedBases.usage).toEqual([expect.objectContaining({
      baseCode: 'SRC-BASE', meals: 3, cookings: 1, reuses: 2,
    })])
  })

  it('choisit vraiment le plat qui reprend la base : le modèle arbitre, il ne décore pas', () => {
    // Le créneau de lundi est figé sur A, qui ouvre la base. Mardi, deux
    // candidats rigoureusement identiques — mêmes ingrédients, mêmes macros,
    // même temps, même profil sensoriel — sauf que l'un reprend la base cuite
    // la veille et l'autre l'ignore. Si le moteur ne préférait pas le premier,
    // rien de tout ce module ne servirait à rien.
    //
    // Le repreneur porte le code le PLUS GRAND des deux, à dessein : à score
    // égal le faisceau départage par ordre alphabétique de code, et ce test
    // passerait alors sans rien démontrer. Nommé ainsi, il ne peut être gagné
    // que par le bonus de mutualisation.
    const repreneur = makeDish('ZB', { form: 'poireau cru', profile: 'fresh_acidic' })
    const indifferent = {
      ...repreneur,
      code: 'AB',
      family: 'Plat AB',
      exactIngredients: repreneur.exactIngredients.map(({ component, ...ingredient }) => ingredient),
    }
    const result = plan([recipes[0], repreneur, indifferent], {
      slots: [
        { key: 'd1', date: '2026-09-07', mealType: 'diner', fixedRecipeCode: 'A' },
        { key: 'd2', date: '2026-09-08', mealType: 'diner' },
      ],
    })
    expect(result.slots.map((slot) => slot.recipeCode)).toEqual(['A', 'ZB'])
    expect(result.slots[1].sharedBases.reused).toHaveLength(1)
  })

  it('le gain rend du budget à la session, il ne se contente pas de figurer au rapport', () => {
    // La session de cuisine a un plafond de minutes ACTIVES
    // (resolveSessionCapMinutes). Un plat qui reprend une base y consomme
    // BASE_REUSE_ACTIVE_MINUTES au lieu des minutes entières de la base : ce
    // sont ces minutes-là que le plafond retrouve pour le reste de la soirée.
    const catalog = buildSharedBaseCatalog([], [makeBaseRecipe()])
    const dish = makeDish('A', { form: 'carotte crue', profile: 'warm_aromatic' })
    const cap = 60

    const cuite = planSlotBases({ recipe: dish, catalog, date: '2026-09-07' })
    const stock = applySharedBaseStock(undefined, cuite, { date: '2026-09-07', slotKey: 'd1' })
    const reprise = planSlotBases({ recipe: dish, catalog, date: '2026-09-08', baseStock: stock })

    const resteQuandOnCuit = cap - (dish.prepMinutes + cuite.addedActiveMinutes)
    const resteQuandOnReprend = cap - (dish.prepMinutes + reprise.addedActiveMinutes)
    expect(resteQuandOnReprend - resteQuandOnCuit).toBe(BASE_MINUTES - BASE_REUSE_ACTIVE_MINUTES)
    expect(resteQuandOnReprend).toBeGreaterThan(resteQuandOnCuit)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('closedLoopPlanner — LE test : même base ≠ même plat', () => {
  const partageant = [
    makeDish('A', { form: 'carotte crue', profile: 'warm_aromatic' }),
    makeDish('B', { form: 'poireau cru', profile: 'fresh_acidic' }),
    makeDish('C', { form: 'courgette crue', profile: 'creamy_delicate' }),
  ]

  it('trois plats DIFFÉRENTS sur une même base ne sont pas une répétition', () => {
    const result = plan(partageant)
    expect(result.status).toBe('published')
    expect(result.slots.map((slot) => slot.recipeCode).sort()).toEqual(['A', 'B', 'C'])
    // Aucune règle de répétition n'a été franchie, ni le socle, ni le reste.
    expect(result.issues.filter((issue) => issue.severity === 'blocker')).toEqual([])
    expect(result.slots.every((slot) => slot.repetitionViolations.length === 0)).toBe(true)
    expect(result.slots.every((slot) => slot.mealStatus !== 'backup_meal')).toBe(true)
    // Trois recettes distinctes sur trois repas : la diversité de la semaine ne
    // s'effondre pas parce que le travail a été mutualisé.
    expect(weekDiversity(result.slots).dimensions.recipe.ratio).toBe(1)
  })

  it('le MÊME plat servi deux fois reste une répétition, base ou pas', () => {
    // Une seule recette pour deux créneaux distants : aucune semaine
    // strictement conforme n'existe (une recette n'est cuisinée qu'une fois par
    // semaine). Le partage de base n'y change rien — et ne doit rien y changer.
    const result = plan([partageant[0]], { slots: [dinnerSlots(4)[0], dinnerSlots(4)[3]] })
    expect(result.status).toBe('review_required')
    expect(result.slots).toHaveLength(2)
    expect(result.issues.map((issue) => issue.code)).toContain('recipe_recooked_within_week')
    expect(result.slots[1].mealStatus).toBe('backup_meal')
  })

  it('une base n’est JAMAIS une lignée — le piège que le modèle doit éviter', () => {
    // Si la base entrait dans la lignée, trois plats sur une même sauce
    // deviendraient trois `recipe_lineage_repeat`, c'est-à-dire une violation
    // du SOCLE : le partage de base serait mécaniquement interdit au moment
    // même où on le construit. La lignée d'un plat reste son propre code.
    for (const dish of partageant) {
      expect(recipeDiversityProfile(dish).lineage).toBe(dish.code)
      expect(recipeDiversityProfile(dish).lineage).not.toBe('SRC-BASE')
    }
    // Et une VRAIE lignée continue, elle, de dire « même plat ».
    const derive = { ...partageant[0], code: 'A-D1', derived_from: 'A' }
    expect(recipeDiversityProfile(derive).lineage).toBe('A')
  })

  it('la base n’entre pas dans les dimensions du score de diversité', () => {
    // Décision (b) de sharedBases.js : y entrer ferait chuter le score de toute
    // semaine mutualisée, et le moteur fuirait ce qu'on lui demande de faire.
    expect(DIVERSITY_DIMENSIONS).not.toContain('base')
    expect(recipeDiversityProfile(partageant[0])).not.toHaveProperty('base')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('sharedBases — le repli quand le plafond cède', () => {
  it('rend la semaine complète et NOMME la base qui a trop porté', () => {
    // Quatre plats, une seule base, un plafond de trois : le corpus ne laisse
    // aucune autre semaine possible. On rend la meilleure — servable, complète —
    // et on dit ce qui a cédé, plutôt que de publier la monotonie en silence.
    const recipes = [
      makeDish('A', { form: 'carotte crue', profile: 'warm_aromatic' }),
      makeDish('B', { form: 'poireau cru', profile: 'fresh_acidic' }),
      makeDish('C', { form: 'courgette crue', profile: 'creamy_delicate' }),
      makeDish('D', { form: 'fenouil cru', profile: 'herbaceous_green' }),
    ]
    const result = plan(recipes, { slots: dinnerSlots(4) })
    expect(result.slots).toHaveLength(4)
    expect(result.status).toBe('review_required')
    const issue = result.issues.find((item) => item.code === SHARED_BASE_ISSUE_CODES.OVER_USED)
    expect(issue).toMatchObject({ severity: 'blocker', baseCode: 'SRC-BASE', meals: 4, max: 3 })
    expect(issue.details.reason).toContain('4 repas')

    // Le plafond n'a relâché AUCUNE règle de répétition : les deux axes restent
    // étanches, comme le budget et la nutrition avant eux.
    expect(result.issues.map((item) => item.code)).not.toContain('repetition_rules_softened')
    expect(result.issues.map((item) => item.code)).not.toContain('repetition_rules_relaxed')
    expect(result.slots.every((slot) => slot.repetitionViolations.length === 0)).toBe(true)
  })

  it('le plafond est configurable, et trois repas sur une base ne le franchissent pas', () => {
    expect(buildRepetitionRules({}).maxMealsPerSharedBase).toBe(3)
    expect(buildRepetitionRules({ maxMealsPerSharedBase: 5 }).maxMealsPerSharedBase).toBe(5)
    // Un réglage aberrant retombe sur la valeur par défaut plutôt que de
    // désactiver la mesure en silence.
    expect(buildRepetitionRules({ maxMealsPerSharedBase: 0 }).maxMealsPerSharedBase).toBe(1)
    expect(buildRepetitionRules({ maxMealsPerSharedBase: 'beaucoup' }).maxMealsPerSharedBase).toBe(3)

    const slots = [
      { key: 'd1', sharedBases: { codes: ['SRC-BASE'], cooked: [{ code: 'SRC-BASE', name: 'Base' }], reused: [], savedActiveMinutes: 0 } },
      { key: 'd2', sharedBases: { codes: ['SRC-BASE'], cooked: [], reused: [{ code: 'SRC-BASE', saved: 21 }], savedActiveMinutes: 21 } },
      { key: 'd3', sharedBases: { codes: ['SRC-BASE'], cooked: [], reused: [{ code: 'SRC-BASE', saved: 21 }], savedActiveMinutes: 21 } },
    ]
    expect(sharedBaseUsage(slots)).toEqual([expect.objectContaining({ meals: 3, cookings: 1, reuses: 2, savedActiveMinutes: 42 })])
    expect(auditSharedBases({ slots, maxMealsPerSharedBase: 3 })).toMatchObject({ compliant: true, issues: [], savedActiveMinutes: 42 })
    expect(auditSharedBases({ slots, maxMealsPerSharedBase: 2 }).issues).toHaveLength(1)
  })
})
