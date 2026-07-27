import { describe, expect, it } from 'vitest'
import { ALTERNATIVE_KINDS, buildMealAlternatives, replacementConsequences } from '@/lib/domain/planning/mealAlternatives'
import { recipeDiversityProfile } from '@/lib/domain/planning/closedLoopPlanner'
import { buildPlanningHistory, buildRepetitionRules } from '@/lib/domain/planning/repetitionRules'
import { buildHouseholdTasteProfile } from '@/lib/domain/planning/tastePreferences'

// Lot 8 du plan de refonte — remplacement contextualisé (§16). Proposer un plat
// ne suffit pas : il faut dire ce qu'il coûte au reste de la semaine.

const recipe = (code, overrides = {}) => ({
  code,
  family: `Plat ${code}`,
  category: 'plat principal',
  cuisineOrigin: 'France',
  eligible: true,
  servings: 2,
  prepMinutes: 25,
  cookMinutes: 30,
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', scores: { richness: 3 }, target_textures: ['fondant'] },
  exactIngredients: [
    { name: 'carotte cuite', formNormalized: 'carotte cuite', category: 'legumes', grams: 200, optional: false },
  ],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 50, fatG: 18, fiberG: 6 },
  ...overrides,
})

const RULES = buildRepetitionRules()

const week = [
  { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'A', source: 'fresh' },
  { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner', recipeCode: 'B', source: 'fresh' },
  { key: '2026-07-21-dejeuner', date: '2026-07-21', mealType: 'dejeuner', recipeCode: 'C', source: 'fresh' },
  { key: '2026-07-21-diner', date: '2026-07-21', mealType: 'diner', recipeCode: 'D', source: 'fresh' },
]

describe('replacementConsequences — cohérence du reste de la semaine (§16)', () => {
  it('signale un doublon avec un repas ANTÉRIEUR', () => {
    const { violations, compatible } = replacementConsequences({
      slots: week, slotKey: '2026-07-21-dejeuner', recipeCode: 'B', rules: RULES,
    })
    expect(compatible).toBe(false)
    expect(violations.map((item) => item.code)).toContain('recipe_repeat_too_close')
  })

  it('signale aussi un doublon avec un repas ULTÉRIEUR — regarder en arrière ne suffit pas', () => {
    const { violations, compatible } = replacementConsequences({
      slots: week, slotKey: '2026-07-21-dejeuner', recipeCode: 'D', rules: RULES,
    })
    expect(compatible).toBe(false)
    expect(violations.some((item) => item.conflictsWith === '2026-07-21-diner')).toBe(true)
  })

  it('valide un remplacement qui ne heurte rien', () => {
    expect(replacementConsequences({ slots: week, slotKey: '2026-07-21-dejeuner', recipeCode: 'NEUF', rules: RULES }))
      .toMatchObject({ compatible: true, violations: [] })
  })

  it('signale le doublon déjeuner/dîner du même jour', () => {
    const { violations } = replacementConsequences({
      slots: week, slotKey: '2026-07-20-dejeuner', recipeCode: 'B', rules: RULES,
    })
    expect(violations.map((item) => item.code)).toContain('same_day_recipe_repeat')
  })
})

describe('buildMealAlternatives — les cinq angles du §16', () => {
  const candidates = [
    recipe('A'),
    recipe('B'),
    recipe('C'),
    recipe('D'),
    recipe('RAPIDE', { prepMinutes: 5, cookMinutes: 5 }),
    recipe('STOCK', {
      exactIngredients: [{ name: 'poireau cuit', formNormalized: 'poireau cuit', category: 'legumes', grams: 200, optional: false }],
    }),
    recipe('FAVORI'),
    recipe('INEDIT'),
  ]
  const history = buildPlanningHistory({
    referenceDate: '2026-07-20',
    entries: [
      { recipeCode: 'FAVORI', date: '2026-07-10', diversity: recipeDiversityProfile(recipe('FAVORI')) },
      { recipeCode: 'RAPIDE', date: '2026-07-05', diversity: recipeDiversityProfile(recipe('RAPIDE')) },
    ],
  })
  const tasteProfile = buildHouseholdTasteProfile([
    { household_member_id: 'm1', subject_type: 'recipe', subject_value: 'FAVORI', appreciation: 'favorite' },
  ])
  const result = buildMealAlternatives({
    slots: week,
    slotKey: '2026-07-21-dejeuner',
    candidates,
    inventoryLots: [{ formNormalized: 'poireau cuit', gramsAvailable: 500, expiresOn: '2026-07-25' }],
    history,
    tasteProfile,
    rules: RULES,
    diversityOf: recipeDiversityProfile,
  })

  it('décrit le plat actuellement prévu', () => {
    expect(result.current).toMatchObject({ recipeCode: 'C' })
  })

  it('couvre les cinq angles, sans jamais répéter le même plat', () => {
    // Un plat peut porter plusieurs étiquettes — le favori est souvent aussi le
    // meilleur équivalent — mais les cinq angles doivent tous trouver réponse.
    const kinds = new Set(result.alternatives.flatMap((item) => item.kinds))
    for (const kind of ALTERNATIVE_KINDS) expect([...kinds]).toContain(kind)
    const codes = result.alternatives.map((item) => item.recipeCode)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('choisit la plus rapide pour l’option rapide, et la mieux couverte pour l’option stock', () => {
    const has = (kind) => result.alternatives.find((item) => item.kinds.includes(kind))
    expect(has('quick').recipeCode).toBe('RAPIDE')
    const stock = has('uses_stock')
    expect(stock.recipeCode).toBe('STOCK')
    expect(stock.stockCoverage).toBe(1)
    expect(stock.missingIngredients).toEqual([])
  })

  it('ne propose comme découverte qu’un plat jamais servi', () => {
    const discovery = result.alternatives.find((item) => item.kinds.includes('discovery'))
    expect(discovery.neverServed).toBe(true)
    expect(discovery.lastServedOn).toBeNull()
  })

  it('remonte le favori du foyer avec la raison de son score', () => {
    const favorite = result.alternatives.find((item) => item.kinds.includes('favorite'))
    expect(favorite.tasteScore).toBeGreaterThan(0)
    expect(favorite.tasteReasons.map((reason) => reason.code)).toContain('taste_liked')
  })

  it('n’écarte jamais le plat prévu de la semaine des candidats proposés ailleurs', () => {
    expect(result.alternatives.some((item) => item.recipeCode === 'C')).toBe(false)
  })

  it('classe les alternatives compatibles avant celles qui cassent la semaine', () => {
    // 'B' est servi la veille au dîner et 'D' le soir même : les deux
    // introduisent une violation, elles ne doivent pas être en tête.
    const first = result.alternatives[0]
    expect(first.compatible).toBe(true)
    for (const alternative of result.alternatives) {
      expect(Array.isArray(alternative.consequences)).toBe(true)
      if (!alternative.compatible) expect(alternative.consequences.length).toBeGreaterThan(0)
    }
  })

  it('chiffre l’écart nutritionnel par rapport au plat remplacé', () => {
    const quick = result.alternatives.find((item) => item.kinds.includes('quick'))
    expect(quick.nutritionDelta).toBeTruthy()
    expect(Object.keys(quick.nutritionDelta)).toContain('kcal')
  })

  it('rend une réponse exploitable quand aucun autre plat n’est possible', () => {
    const solo = buildMealAlternatives({
      slots: week, slotKey: '2026-07-21-dejeuner', candidates: [recipe('C')], rules: RULES,
    })
    expect(solo.alternatives).toEqual([])
    expect(solo.current).toMatchObject({ recipeCode: 'C' })
  })
})
