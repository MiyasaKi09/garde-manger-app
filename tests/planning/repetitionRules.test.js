import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REPETITION_RULES,
  MEAL_SOURCES,
  MEAL_STATUS,
  auditWeekRepetition,
  buildDiversityProfile,
  buildPlanningHistory,
  buildRepetitionRules,
  classifyMealStatus,
  familiarityBalance,
  historyReturnPenalty,
  mealOrdinal,
  proximityWarnings,
  repetitionViolations,
  weekDiversity,
} from '@/lib/domain/planning/repetitionRules'

// Plan de refonte du planning — §3 (règles absolues et délais de retour),
// §4 (répétitions justifiées), §11 (diversité multidimensionnelle),
// §17 (contrôles avant publication).

const slot = (date, mealType, recipeCode, source = MEAL_SOURCES.FRESH, diversity = null) => ({
  key: `${date}-${mealType}`, date, mealType, recipeCode, source, diversity,
})

const profile = (overrides = {}) => buildDiversityProfile({
  recipeCode: 'FR-001',
  family: 'plat mijoté',
  cuisine: 'France',
  protein: 'boeuf',
  starch: 'pates',
  technique: 'mijotage',
  sensoryProfile: 'warm_aromatic',
  texture: 'fondant',
  richness: 'riche',
  temperature: 'chaud',
  vegetarian: false,
  ...overrides,
})

describe('mealOrdinal', () => {
  it('place le dîner après le déjeuner du même jour et le déjeuner du lendemain après les deux', () => {
    const lundiMidi = mealOrdinal({ date: '2026-07-20', mealType: 'dejeuner' })
    const lundiSoir = mealOrdinal({ date: '2026-07-20', mealType: 'diner' })
    const mardiMidi = mealOrdinal({ date: '2026-07-21', mealType: 'dejeuner' })
    expect(lundiSoir - lundiMidi).toBe(1)
    expect(mardiMidi - lundiSoir).toBe(1)
  })

  it('rend null sans date : l’appelant retombe alors sur la position dans la séquence', () => {
    expect(mealOrdinal({ mealType: 'diner' })).toBeNull()
    expect(mealOrdinal(null)).toBeNull()
  })

  it('ne mélange jamais positions absolues et positions de séquence', () => {
    // Un créneau daté suivi d'un candidat sans date : si les deux bases se
    // mélangeaient, l'écart calculé vaudrait des dizaines de milliers de repas
    // et la règle de proximité ne se déclencherait plus jamais.
    const violations = repetitionViolations({
      plannedSlots: [{ key: 'a', date: '2026-07-20', mealType: 'dejeuner', recipeCode: 'CARBO' }],
      recipeCode: 'CARBO',
      source: MEAL_SOURCES.COOKED_DISH,
    })
    expect(violations.map((violation) => violation.code)).toContain('recipe_repeat_too_close')
  })
})

describe('repetitionViolations — règles absolues (§3)', () => {
  it('interdit la même recette au déjeuner et au dîner du même jour', () => {
    const violations = repetitionViolations({
      plannedSlots: [slot('2026-07-20', 'dejeuner', 'PIZZA')],
      date: '2026-07-20',
      mealType: 'diner',
      recipeCode: 'PIZZA',
    })
    expect(violations.map((violation) => violation.code)).toContain('same_day_recipe_repeat')
  })

  it('exige au moins deux repas d’écart entre deux consommations', () => {
    const planned = [slot('2026-07-20', 'diner', 'CARBO')]
    const mardiMidi = repetitionViolations({ plannedSlots: planned, date: '2026-07-21', mealType: 'dejeuner', recipeCode: 'CARBO', source: MEAL_SOURCES.COOKED_DISH })
    const mercrediMidi = repetitionViolations({ plannedSlots: planned, date: '2026-07-22', mealType: 'dejeuner', recipeCode: 'CARBO', source: MEAL_SOURCES.COOKED_DISH })
    expect(mardiMidi.map((violation) => violation.code)).toContain('recipe_repeat_too_close')
    expect(mercrediMidi).toEqual([])
  })

  it('mesure l’écart sur l’axe du temps, pas sur la position dans le tableau', () => {
    // Deux créneaux isolés à trois jours d'intervalle : ils sont voisins dans
    // le tableau mais éloignés dans la semaine réelle.
    const violations = repetitionViolations({
      plannedSlots: [slot('2026-07-20', 'dejeuner', 'CARBO')],
      date: '2026-07-23',
      mealType: 'dejeuner',
      recipeCode: 'CARBO',
      source: MEAL_SOURCES.COOKED_DISH,
    })
    expect(violations).toEqual([])
  })

  it('n’autorise qu’une cuisson par recette et par semaine ; un reste ne compte pas comme une cuisson', () => {
    const planned = [slot('2026-07-20', 'dejeuner', 'CARBO')]
    const recuisson = repetitionViolations({ plannedSlots: planned, date: '2026-07-23', mealType: 'diner', recipeCode: 'CARBO' })
    const reste = repetitionViolations({ plannedSlots: planned, date: '2026-07-23', mealType: 'diner', recipeCode: 'CARBO', source: MEAL_SOURCES.PLANNED_PRODUCTION })
    expect(recuisson.map((violation) => violation.code)).toContain('recipe_recooked_within_week')
    expect(reste).toEqual([])
  })

  it('refuse une quatrième consommation du même plat', () => {
    const planned = [
      slot('2026-07-20', 'dejeuner', 'PESTO'),
      slot('2026-07-21', 'diner', 'PESTO', MEAL_SOURCES.COOKED_DISH),
      slot('2026-07-23', 'dejeuner', 'PESTO', MEAL_SOURCES.COOKED_DISH),
    ]
    const violations = repetitionViolations({
      plannedSlots: planned, date: '2026-07-24', mealType: 'diner', recipeCode: 'PESTO', source: MEAL_SOURCES.COOKED_DISH,
    })
    expect(violations.map((violation) => violation.code)).toContain('recipe_over_consumed')
  })
})

describe('buildRepetitionRules — configurabilité (§3)', () => {
  it('reprend les valeurs par défaut quand rien n’est fourni', () => {
    expect(buildRepetitionRules()).toMatchObject({
      minSeparatingMeals: DEFAULT_REPETITION_RULES.minSeparatingMeals,
      maxConsumptionsPerRecipe: DEFAULT_REPETITION_RULES.maxConsumptionsPerRecipe,
    })
    expect(buildRepetitionRules().returnDelays).toEqual({ ...DEFAULT_REPETITION_RULES.returnDelays })
  })

  it('accepte des délais de retour personnalisés et ignore les valeurs aberrantes', () => {
    const rules = buildRepetitionRules({
      returnDelays: { exactRecipeDays: 28, recipeFamilyDays: 'nawak' },
      minSeparatingMeals: 3,
      maxConsumptionsPerRecipe: -4,
    })
    expect(rules.returnDelays.exactRecipeDays).toBe(28)
    expect(rules.returnDelays.recipeFamilyDays).toBe(DEFAULT_REPETITION_RULES.returnDelays.recipeFamilyDays)
    expect(rules.minSeparatingMeals).toBe(3)
    // Une règle absolue ne peut pas être désactivée par un réglage absurde :
    // une valeur négative retombe sur la valeur par défaut, pas sur « aucune
    // limite ».
    expect(rules.maxConsumptionsPerRecipe).toBe(DEFAULT_REPETITION_RULES.maxConsumptionsPerRecipe)
  })

  it('un écart configuré plus large resserre réellement la règle', () => {
    const rules = buildRepetitionRules({ minSeparatingMeals: 4 })
    const violations = repetitionViolations({
      plannedSlots: [slot('2026-07-20', 'dejeuner', 'CARBO')],
      date: '2026-07-21', mealType: 'diner', recipeCode: 'CARBO', source: MEAL_SOURCES.COOKED_DISH, rules,
    })
    expect(violations.map((violation) => violation.code)).toContain('recipe_repeat_too_close')
  })
})

describe('historyReturnPenalty — délais de retour (§3, §9)', () => {
  const history = buildPlanningHistory({
    referenceDate: '2026-07-20',
    entries: [
      { recipeCode: 'FR-001', date: '2026-07-13', diversity: profile() },
      { recipeCode: 'FR-050', date: '2026-06-01', diversity: profile({ recipeCode: 'FR-050', cuisine: 'Japon', protein: 'saumon', starch: 'riz', family: 'poisson grillé' }) },
    ],
  })

  it('pénalise une recette revenue bien avant son délai, et d’autant plus qu’elle est récente', () => {
    const proche = historyReturnPenalty({ history, diversity: profile(), date: '2026-07-20' })
    const lointain = historyReturnPenalty({ history, diversity: profile(), date: '2026-07-30' })
    expect(proche.total).toBeGreaterThan(lointain.total)
    expect(proche.reasons.map((reason) => reason.code)).toContain('recipe_returned_too_soon')
  })

  it('ne pénalise rien au-delà du délai configuré', () => {
    const penalty = historyReturnPenalty({ history, diversity: profile({ recipeCode: 'FR-050', cuisine: 'Japon', protein: 'saumon', starch: 'riz', family: 'poisson grillé' }), date: '2026-07-20' })
    expect(penalty.total).toBe(0)
    expect(penalty.reasons).toEqual([])
  })

  it('n’invente aucune pénalité pour une recette jamais vue', () => {
    expect(historyReturnPenalty({ history, diversity: profile({ recipeCode: 'INCONNUE', cuisine: null, protein: null, starch: null, family: null }), date: '2026-07-20' }))
      .toEqual({ total: 0, reasons: [] })
  })
})

describe('proximityWarnings — regroupements (§3, §11)', () => {
  it('signale une troisième cuisine identique dans une fenêtre rapprochée', () => {
    const italien = profile({ cuisine: 'Italie' })
    const planned = [
      slot('2026-07-20', 'dejeuner', 'A', MEAL_SOURCES.FRESH, italien),
      slot('2026-07-20', 'diner', 'B', MEAL_SOURCES.FRESH, italien),
    ]
    const warnings = proximityWarnings({ plannedSlots: planned, diversity: italien })
    expect(warnings.map((warning) => warning.code)).toContain('cuisine_cluster')
  })
})

describe('weekDiversity — diversité multidimensionnelle (§11)', () => {
  it('effondre le score d’une semaine « italienne aux pâtes » malgré des recettes toutes distinctes', () => {
    const italienPates = (code) => profile({ recipeCode: code, cuisine: 'Italie', starch: 'pates', protein: 'laitiers', family: 'plat de pâtes' })
    const italienne = weekDiversity([
      slot('2026-07-20', 'dejeuner', 'PIZZA', MEAL_SOURCES.FRESH, italienPates('PIZZA')),
      slot('2026-07-20', 'diner', 'PESTO', MEAL_SOURCES.FRESH, italienPates('PESTO')),
      slot('2026-07-21', 'dejeuner', 'GNOCCHI', MEAL_SOURCES.FRESH, italienPates('GNOCCHI')),
      slot('2026-07-21', 'diner', 'LASAGNE', MEAL_SOURCES.FRESH, italienPates('LASAGNE')),
    ])
    // Quatre recettes distinctes sur quatre repas : le seul comptage de
    // recettes déclarerait cette semaine parfaitement variée.
    expect(italienne.dimensions.recipe.ratio).toBe(1)
    expect(italienne.dimensions.cuisine.ratio).toBe(0.25)
    expect(italienne.dimensions.starch.ratio).toBe(0.25)
    expect(italienne.score).toBeLessThan(0.5)

    const variee = weekDiversity([
      slot('2026-07-20', 'dejeuner', 'A', MEAL_SOURCES.FRESH, profile({ recipeCode: 'A' })),
      slot('2026-07-20', 'diner', 'B', MEAL_SOURCES.FRESH, profile({ recipeCode: 'B', cuisine: 'Japon', starch: 'riz', protein: 'saumon', family: 'poisson grillé', technique: 'vapeur', sensoryProfile: 'fresh_acidic', texture: 'croquant' })),
      slot('2026-07-21', 'dejeuner', 'C', MEAL_SOURCES.FRESH, profile({ recipeCode: 'C', cuisine: 'Maroc', starch: 'semoule', protein: 'pois_chiches', family: 'tajine', technique: 'mijotage', sensoryProfile: 'warm_spiced', texture: 'moelleux' })),
      slot('2026-07-21', 'diner', 'D', MEAL_SOURCES.FRESH, profile({ recipeCode: 'D', cuisine: 'Inde', starch: 'riz', protein: 'lentilles', family: 'dahl', technique: 'braisage', sensoryProfile: 'spiced', texture: 'cremeux' })),
    ])
    expect(variee.score).toBeGreaterThan(italienne.score)
  })

  it('mesure l’équilibre — et non la distinction — sur les dimensions binaires', () => {
    const carne = profile({ vegetarian: false })
    const vegetarien = profile({ recipeCode: 'V', vegetarian: true })
    const equilibree = weekDiversity([
      slot('2026-07-20', 'dejeuner', 'A', MEAL_SOURCES.FRESH, carne),
      slot('2026-07-20', 'diner', 'V', MEAL_SOURCES.FRESH, vegetarien),
    ])
    const monolithique = weekDiversity([
      slot('2026-07-20', 'dejeuner', 'A', MEAL_SOURCES.FRESH, carne),
      slot('2026-07-20', 'diner', 'B', MEAL_SOURCES.FRESH, profile({ recipeCode: 'B', vegetarian: false })),
    ])
    expect(equilibree.dimensions.vegetarian.balance).toBe(1)
    expect(monolithique.dimensions.vegetarian.balance).toBe(0)
    // La distinction n'a pas de sens sur une dimension à deux valeurs.
    expect(equilibree.dimensions.vegetarian.ratio).toBeNull()
  })
})

describe('classifyMealStatus et familiarityBalance — répétitions justifiées (§4, §6)', () => {
  const history = buildPlanningHistory({ entries: [{ recipeCode: 'CONNUE', date: '2026-07-01', diversity: profile({ recipeCode: 'CONNUE' }) }] })

  it('distingue découverte, favori en rotation, reste planifié et repas de secours', () => {
    expect(classifyMealStatus({ recipeCode: 'INEDITE', history })).toBe(MEAL_STATUS.NEW)
    expect(classifyMealStatus({ recipeCode: 'CONNUE', history })).toBe(MEAL_STATUS.FAVORITE)
    expect(classifyMealStatus({ source: MEAL_SOURCES.COOKED_DISH, recipeCode: 'CONNUE', history })).toBe(MEAL_STATUS.LEFTOVER)
    // Un repas retenu en violation d'une règle absolue est un repas subi.
    expect(classifyMealStatus({ source: MEAL_SOURCES.COOKED_DISH, recipeCode: 'CONNUE', history, degraded: true })).toBe(MEAL_STATUS.BACKUP)
  })

  it('mesure la part de découvertes de la semaine', () => {
    const balance = familiarityBalance([
      { mealStatus: MEAL_STATUS.NEW }, { mealStatus: MEAL_STATUS.NEW },
      { mealStatus: MEAL_STATUS.FAVORITE }, { mealStatus: MEAL_STATUS.LEFTOVER },
    ])
    expect(balance).toMatchObject({ total: 4, discovery: 2, familiar: 1, leftover: 1, backup: 0, discoveryRatio: 0.5 })
  })
})

describe('auditWeekRepetition — contrôle avant publication (§17)', () => {
  const week = (codes) => codes.map((code, index) => {
    const date = `2026-07-${String(20 + Math.floor(index / 2)).padStart(2, '0')}`
    return slot(date, index % 2 ? 'diner' : 'dejeuner', code, MEAL_SOURCES.FRESH, profile({ recipeCode: code }))
  })

  it('rejette une semaine à quatre pizzas et quatre plats de pâtes — critère du lot 0', () => {
    const audit = auditWeekRepetition({
      slots: week([
        'PIZZA', 'PESTO', 'PIZZA', 'PESTO',
        'PIZZA', 'PESTO', 'PIZZA', 'PESTO',
        'CARBO', 'CARBO', 'A', 'B', 'C', 'D',
      ]),
    })
    expect(audit.compliant).toBe(false)
    expect(audit.blockers.every((blocker) => blocker.severity === 'blocker')).toBe(true)
    const codes = new Set(audit.blockers.map((blocker) => blocker.code))
    expect(codes.has('same_day_recipe_repeat')).toBe(true)
    expect(codes.has('recipe_over_consumed')).toBe(true)
    expect(codes.has('week_diversity_below_minimum')).toBe(true)
  })

  it('accepte une semaine de quatorze recettes distinctes', () => {
    const audit = auditWeekRepetition({
      slots: week(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']),
    })
    expect(audit.blockers).toEqual([])
    expect(audit.compliant).toBe(true)
  })

  it('accepte un reste planifié correctement espacé, et le compte comme tel', () => {
    const slots = [
      slot('2026-07-20', 'dejeuner', 'CARBO', MEAL_SOURCES.FRESH, profile({ recipeCode: 'CARBO' })),
      slot('2026-07-20', 'diner', 'B', MEAL_SOURCES.FRESH, profile({ recipeCode: 'B' })),
      slot('2026-07-21', 'dejeuner', 'C', MEAL_SOURCES.FRESH, profile({ recipeCode: 'C' })),
      slot('2026-07-21', 'diner', 'CARBO', MEAL_SOURCES.PLANNED_PRODUCTION, profile({ recipeCode: 'CARBO' })),
    ]
    slots[3].mealStatus = MEAL_STATUS.LEFTOVER
    const audit = auditWeekRepetition({ slots })
    expect(audit.blockers).toEqual([])
    expect(audit.familiarity.leftover).toBe(1)
  })

  it('n’applique le plancher de diversité qu’aux vraies semaines, jamais aux régénérations partielles', () => {
    const partiel = [
      slot('2026-07-20', 'dejeuner', 'A', MEAL_SOURCES.FRESH, profile({ recipeCode: 'A' })),
      slot('2026-07-23', 'dejeuner', 'A', MEAL_SOURCES.COOKED_DISH, profile({ recipeCode: 'A' })),
    ]
    expect(auditWeekRepetition({ slots: partiel }).blockers).toEqual([])
  })
})
