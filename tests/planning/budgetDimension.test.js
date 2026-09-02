// Le budget comme DIMENSION du solveur (§budget).
//
// Ce que ces tests verrouillent, dans l'ordre des risques :
//
// 1. INERTIE. Sans enveloppe — le cas nominal — le moteur est celui d'avant :
//    aucune clé nouvelle sur les créneaux, aucun changement de sélection. Une
//    enveloppe LARGE ne change rien non plus : un plafond doit être inerte tant
//    qu'il est respecté, sinon régler un budget affaiblirait en silence
//    l'arbitrage nutritionnel.
// 2. MORSURE. Une enveloppe serrée déplace la sélection vers le plat sobre —
//    mais ne fait jamais passer un plat nutritionnellement pauvre devant un plat
//    coûteux et adéquat. C'est le double écueil du réglage du poids.
// 3. REPLI. Une enveloppe intenable ne bloque pas : la semaine est rendue,
//    complète, marquée `review_required` avec `budget_envelope_exceeded` — et
//    SANS entraîner le relâchement des règles de répétition, qui vivent sur un
//    autre axe.
// 4. CORPUS PARTIELLEMENT CHIFFRÉ. Une recette dont le coût n'est pas connu
//    n'est jamais écartée : l'écarter biaiserait la sélection vers le seul
//    sous-corpus coté, sans que rien dans le plan ne le dise.
//
// Les prix employés ici sont SYNTHÉTIQUES (fixtures de tests/pricing) : ils
// servent à vérifier un arbitrage, pas à chiffrer un oignon.

import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildMealAlternatives } from '@/lib/domain/planning/mealAlternatives'
import { explainWeek, explainSlot } from '@/lib/domain/planning/planExplanation'
import { buildRepetitionRules } from '@/lib/domain/planning/repetitionRules'
import {
  BORNE_ARBITRAGE,
  BUDGET_ISSUE_CODES,
  BUDGET_ORIGINS,
  POIDS_EUROS,
  buildBudgetContext,
  coutRecette,
  evaluerCreneauBudget,
  rapportBudget,
  termeEuros,
  verdictDepassement,
} from '@/lib/domain/planning/budgetDimension'
import { buildPriceIndex } from '@/lib/domain/pricing/priceIndex'
import { entree, jeu } from '../pricing/fixtures'

const FORME = 'oignon jaune cru'

/**
 * Un référentiel qui ne cote qu'UNE forme, à 3 €/kg (fourchette 2,40 – 3,60).
 * Toutes les recettes ci-dessous n'emploient que cette forme : leur coût ne
 * dépend donc que de leur masse, et rien d'autre ne les distingue. C'est ce qui
 * rend les tests d'arbitrage lisibles — le seul écart entre deux candidats est
 * celui qu'on veut mesurer.
 */
const indexPrix = (options = {}) => buildPriceIndex(
  [jeu({ entries: [entree({ central: 3 })], ...options.jeu })],
  { today: options.today ?? '2026-08-24' },
)

/**
 * Recette d'essai. `grams` est le seul levier de coût : à 3 €/kg,
 * 2 000 g valent 6 € au centre et 7,20 € en borne haute, 200 g valent 0,60 € et
 * 0,72 €.
 */
const makeRecipe = (code, grams, overrides = {}) => ({
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
    profile: 'warm_aromatic',
    scores: { richness: 3, acidic: 1, freshness: 1 },
    target_textures: ['fondant'],
  },
  exactIngredients: [{ name: 'Oignon jaune cru', formNormalized: FORME, grams, optional: false }],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 },
  ...overrides,
})

const CIBLE = { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 }

const planAvec = ({ recipes, envelope = null, slots = null, priceIndex = undefined, ...rest }) => generateClosedLoopPlan({
  slots: slots || [{ key: 'd1', date: '2026-09-07', mealType: 'dejeuner' }],
  recipes,
  constraints: {
    allowShopping: true,
    targetPerMeal: CIBLE,
    ...(envelope == null ? {} : {
      budget: {
        weeklyEnvelopeEur: envelope,
        priceIndex: priceIndex === undefined ? indexPrix({ today: '2026-09-07' }) : priceIndex,
      },
    }),
  },
  ...rest,
})

// « A-COUTEUX » précède « B-SOBRE » à l'alphabet : à score égal, le
// départage déterministe du faisceau retient A. Toute inversion observée
// ci-dessous vient donc du budget, et de rien d'autre.
const COUTEUX = makeRecipe('A-COUTEUX', 2000)
const SOBRE = makeRecipe('B-SOBRE', 200)

describe('la dimension euros — forme et bornes', () => {
  it('est strictement à une face : sous l’allocation, elle ne coûte rien et ne rapporte rien', () => {
    const budget = buildBudgetContext({ weeklyEnvelopeEur: 100, priceIndex: indexPrix() })
    const dessous = evaluerCreneauBudget(budget, {
      slotIndex: 0, slotCount: 1, cout: { priced: true, range: { low: 1, central: 2, high: 3 } },
    })
    expect(dessous.relative).toBeLessThan(0)
    expect(termeEuros(dessous)).toBe(0)
    // Un plat dix fois moins cher ne marque pas davantage : c'est ce qui
    // interdit au solveur de CHERCHER le bon marché — il ne fait qu'éviter le
    // trop cher. Les « semaines de pâtes » naissent d'un score qui récompense
    // la modicité ; cette forme-là ne le peut pas.
    const bienDessous = evaluerCreneauBudget(budget, {
      slotIndex: 0, slotCount: 1, cout: { priced: true, range: { low: 0.1, central: 0.2, high: 0.3 } },
    })
    expect(termeEuros(bienDessous)).toBe(termeEuros(dessous))
  })

  it('arbitre sur la borne HAUTE, jamais sur la centrale ni sur la basse', () => {
    expect(BORNE_ARBITRAGE).toBe('high')
    const budget = buildBudgetContext({ weeklyEnvelopeEur: 10, priceIndex: indexPrix() })
    // Fourchette dont le CENTRE tient sous l'allocation mais dont la borne
    // haute la franchit : un plafond arbitré sur le centre serait franchi une
    // fois sur deux en magasin.
    const evaluation = evaluerCreneauBudget(budget, {
      slotIndex: 0, slotCount: 1, cout: { priced: true, range: { low: 6, central: 9, high: 12 } },
    })
    expect(evaluation.relative).toBeCloseTo((12 - 10) / 10, 6)
    expect(termeEuros(evaluation)).toBeGreaterThan(0)
  })

  it('sature au plafond quand l’enveloppe est déjà épuisée, au lieu de redevenir gratuite', () => {
    const budget = buildBudgetContext({ weeklyEnvelopeEur: 10, priceIndex: indexPrix() })
    const evaluation = evaluerCreneauBudget(budget, {
      engage: { low: 10, central: 12, high: 14 },
      slotIndex: 1,
      slotCount: 3,
      cout: { priced: true, range: { low: 1, central: 1, high: 1 } },
    })
    expect(evaluation.saturee).toBe(true)
    expect(termeEuros(evaluation)).toBeCloseTo(2 * POIDS_EUROS, 6)
  })

  it('reste INERTE — ni pénalité ni bonus — sur une recette dont le coût est inconnu', () => {
    const budget = buildBudgetContext({ weeklyEnvelopeEur: 1, priceIndex: indexPrix() })
    const evaluation = evaluerCreneauBudget(budget, {
      slotIndex: 0, slotCount: 1, cout: { priced: false, range: null, reason: 'couverture_masse_insuffisante' },
    })
    expect(evaluation.applicable).toBe(false)
    expect(evaluation.reason).toBe('couverture_masse_insuffisante')
    expect(termeEuros(evaluation)).toBe(0)
  })

  it('ne chiffre pas les ingrédients facultatifs, que le solveur n’achète pas non plus', () => {
    const budget = buildBudgetContext({ weeklyEnvelopeEur: 100, priceIndex: indexPrix() })
    // `allocateRecipe` ignore les lignes facultatives : les chiffrer ferait dire
    // au budget qu'on achète ce que le plan n'achète pas.
    const avecFacultatif = makeRecipe('X', 200, {
      exactIngredients: [
        { name: 'Oignon jaune cru', formNormalized: FORME, grams: 200, optional: false },
        { name: 'Oignon jaune cru', formNormalized: FORME, grams: 5000, optional: true },
      ],
    })
    expect(coutRecette(budget, avecFacultatif).range.central)
      .toBeCloseTo(coutRecette(budget, SOBRE).range.central, 6)
  })

  it('rend l’allocation d’un créneau libéré aux créneaux suivants', () => {
    const budget = buildBudgetContext({ weeklyEnvelopeEur: 30, priceIndex: indexPrix() })
    const cout = { priced: true, range: { low: 5, central: 5, high: 5 } }
    const premier = evaluerCreneauBudget(budget, { slotIndex: 0, slotCount: 3, cout })
    // Deux créneaux passés, mais un seul a réellement dépensé (l'autre était un
    // reste, déjà payé) : l'allocation du dernier monte.
    const dernier = evaluerCreneauBudget(budget, {
      engage: { low: 5, central: 5, high: 5 }, slotIndex: 2, slotCount: 3, cout,
    })
    expect(premier.allowanceEur).toBeCloseTo(10, 6)
    expect(dernier.allowanceEur).toBeCloseTo(25, 6)
  })

  it('ne s’active pas sur un référentiel périmé, et le DIT au lieu de se taire', () => {
    // §5.4 du contrat : passé 24 mois, la fonctionnalité s'éteint entièrement.
    const perime = buildPriceIndex([jeu({ entries: [entree({ central: 3 })], referenceDate: '2023-01-15' })], { today: '2026-08-24' })
    const budget = buildBudgetContext({ weeklyEnvelopeEur: 50, priceIndex: perime })
    expect(budget.active).toBe(false)
    expect(budget.reason).toBe('referentiel_perime')
    expect(rapportBudget(budget, []).sentence).toContain('referentiel_perime')
  })
})

describe('une enveloppe LARGE ne change rien au comportement du solveur', () => {
  it('rend exactement la même sélection que sans enveloppe', () => {
    const sans = planAvec({ recipes: [COUTEUX, SOBRE] })
    const large = planAvec({ recipes: [COUTEUX, SOBRE], envelope: 200 })
    expect(sans.slots.map((slot) => slot.recipeCode)).toEqual(['A-COUTEUX'])
    expect(large.slots.map((slot) => slot.recipeCode)).toEqual(['A-COUTEUX'])
    // Le score du créneau est identique au centième : le terme euros vaut 0, et
    // il est AJOUTÉ au vecteur plutôt que moyenné avec lui — sans quoi régler
    // une enveloppe jamais approchée diviserait toutes les dimensions
    // nutritionnelles par 1,30.
    expect(large.slots[0].score).toBe(sans.slots[0].score)
    expect(large.status).toBe('published')
    expect(large.budget.exceeds).toBe(false)
  })

  it('ne pose aucune clé de budget sur les créneaux quand aucune enveloppe n’est demandée', () => {
    const sans = planAvec({ recipes: [COUTEUX, SOBRE] })
    expect(sans.budget).toBeUndefined()
    expect(sans.slots[0].budget).toBeUndefined()
    expect(sans.slots[0].budgetForgone).toBeUndefined()
    expect(sans.issues.map((issue) => issue.code)).not.toContain(BUDGET_ISSUE_CODES.EXCEEDED)
  })
})

describe('une enveloppe SERRÉE déplace la sélection sans détruire la nutrition', () => {
  it('préfère le plat sobre au plat coûteux, à mérite égal par ailleurs', () => {
    const serre = planAvec({ recipes: [COUTEUX, SOBRE], envelope: 2 })
    expect(serre.slots.map((slot) => slot.recipeCode)).toEqual(['B-SOBRE'])
    expect(serre.status).toBe('published')
    expect(serre.budget.exceeds).toBe(false)
    expect(serre.slots[0].budget).toMatchObject({ chargeable: true, priced: true, applicable: true })
  })

  it('ne fait PAS passer un plat nutritionnellement pauvre devant un plat coûteux mais adéquat', () => {
    // Volontairement extrême : 25 kcal et 1 g de protéines pour une cible à
    // 500 kcal / 30 g. Sa pénalité nutritionnelle (~30 points) doit rester
    // au-dessus du plafond de la dimension euros (2 × 0,30 × 35 = 21).
    const creux = makeRecipe('C-CREUX', 100, {
      nutritionPerServing: { kcal: 25, proteinG: 1, carbsG: 3, fatG: 0.3, fiberG: 0.2 },
    })
    const serre = planAvec({ recipes: [COUTEUX, creux], envelope: 2 })
    expect(serre.slots.map((slot) => slot.recipeCode)).toEqual(['A-COUTEUX'])
    // L'enveloppe a bien mordu — elle a simplement perdu contre la nutrition.
    expect(serre.slots[0].budget.relative).toBeGreaterThan(0)
    expect(serre.budget.exceeds).toBe(true)
  })
})

describe('une enveloppe INTENABLE rend une semaine dégradée, jamais un échec', () => {
  const slots = [
    { key: 'd1', date: '2026-09-07', mealType: 'dejeuner' },
    { key: 'd2', date: '2026-09-08', mealType: 'diner' },
  ]

  it('rend la semaine complète, la marque à revoir et nomme le motif', () => {
    const plan = planAvec({ recipes: [COUTEUX, makeRecipe('B-AUSSI-CHER', 2000)], envelope: 1, slots })
    expect(plan.slots).toHaveLength(2)
    expect(plan.status).toBe('review_required')
    const issue = plan.issues.find((item) => item.code === BUDGET_ISSUE_CODES.EXCEEDED)
    expect(issue).toBeDefined()
    expect(issue.severity).toBe('blocker')
    expect(issue.details.envelopeEur).toBe(1)
    expect(issue.details.overrunEur).toBeGreaterThan(0)
    expect(issue.details.arbitrationBound).toBe('high')
    // Le vocabulaire du contrat voyage avec le motif : « estimation », jamais
    // « prix », et la date du référentiel à côté du montant.
    expect(issue.details.reason).toMatch(/[Ee]stimation|Au moins/)
    expect(issue.details.reason).toContain('référentiel')
    expect(issue.details.reason).not.toMatch(/\bprix total\b/i)
  })

  it('ne relâche AUCUNE règle de répétition au passage — les deux axes sont orthogonaux', () => {
    const plan = planAvec({ recipes: [COUTEUX, makeRecipe('B-AUSSI-CHER', 2000)], envelope: 1, slots })
    const codes = plan.issues.map((issue) => issue.code)
    expect(codes).not.toContain('repetition_rules_softened')
    expect(codes).not.toContain('repetition_rules_relaxed')
    expect(new Set(plan.slots.map((slot) => slot.recipeCode)).size).toBe(2)
  })

  it('publie normalement quand l’enveloppe tient, sur les mêmes créneaux', () => {
    const plan = planAvec({ recipes: [COUTEUX, makeRecipe('B-AUSSI-CHER', 2000)], envelope: 200, slots })
    expect(plan.status).toBe('published')
    expect(plan.budget.exceeds).toBe(false)
    expect(plan.budget.coveragePct).toBe(100)
  })
})

describe('un corpus PARTIELLEMENT chiffré ne biaise pas la sélection', () => {
  // « Z-INCONNU » emploie une forme que le référentiel ne cote pas : son coût
  // n'est pas établi. Elle est nommée en fin d'alphabet pour qu'aucun départage
  // déterministe ne la favorise.
  const INCONNU = makeRecipe('Z-INCONNU', 200, {
    exactIngredients: [{ name: 'Racine inconnue crue', formNormalized: 'racine inconnue crue', grams: 200, optional: false }],
  })

  it('n’écarte jamais une recette dont le coût est inconnu, même sous enveloppe serrée', () => {
    const plan = planAvec({
      recipes: [SOBRE, INCONNU],
      envelope: 1,
      slots: [
        { key: 'd1', date: '2026-09-07', mealType: 'dejeuner' },
        { key: 'd2', date: '2026-09-08', mealType: 'diner' },
      ],
    })
    expect(plan.slots).toHaveLength(2)
    expect(plan.slots.map((slot) => slot.recipeCode).sort()).toEqual(['B-SOBRE', 'Z-INCONNU'])
  })

  it('ne l’avantage pas non plus face à une recette chiffrée qui tient dans l’enveloppe', () => {
    // Les deux marquent 0 sur l'axe des euros : le départage redevient
    // strictement celui d'avant (alphabétique), et la recette chiffrée gagne
    // parce qu'elle gagnait déjà, pas parce qu'elle est chiffrée.
    const serre = planAvec({ recipes: [SOBRE, INCONNU], envelope: 5 })
    const sans = planAvec({ recipes: [SOBRE, INCONNU] })
    expect(serre.slots[0].recipeCode).toBe(sans.slots[0].recipeCode)
    expect(serre.slots[0].recipeCode).toBe('B-SOBRE')
  })

  it('compte le repas non chiffré dans la couverture et le nomme, au lieu de le passer sous silence', () => {
    const plan = planAvec({
      recipes: [SOBRE, INCONNU],
      envelope: 50,
      slots: [
        { key: 'd1', date: '2026-09-07', mealType: 'dejeuner' },
        { key: 'd2', date: '2026-09-08', mealType: 'diner' },
      ],
    })
    expect(plan.budget.meals.chargeable).toBe(2)
    expect(plan.budget.meals.priced).toBe(1)
    expect(plan.budget.coveragePct).toBe(50)
    expect(plan.budget.unpricedMeals.map((meal) => meal.title)).toEqual(['Recette Z-INCONNU'])
    // §7.3 : une somme partielle est mathématiquement un minorant.
    expect(plan.budget.minorant).toBe(true)
    expect(plan.budget.sentence).toContain('Au moins')
  })

  it('ne prétend pas qu’une enveloppe est tenue quand rien n’a pu être chiffré', () => {
    const plan = planAvec({ recipes: [INCONNU], envelope: 1 })
    expect(plan.budget.estimate).toBeNull()
    expect(plan.budget.exceeds).toBe(false)
    expect(plan.budget.coveragePct).toBe(0)
    expect(plan.budget.sentence).toContain('Estimation indisponible')
    expect(plan.status).toBe('published')
  })
})

describe('le prédicat de dépassement — deux origines, deux verdicts', () => {
  const budget = buildBudgetContext({ weeklyEnvelopeEur: 10, priceIndex: indexPrix() })
  const projected = { low: 11, central: 12, high: 13 }

  it('INTERDIT le dépassement issu de la génération automatique', () => {
    const verdict = verdictDepassement({ budget, projected, origin: BUDGET_ORIGINS.GENERATION })
    expect(verdict).toMatchObject({ exceeds: true, allowed: false, code: BUDGET_ISSUE_CODES.EXCEEDED })
    expect(verdict.overrunEur).toBeCloseTo(3, 6)
  })

  it('AUTORISE et CHIFFRE le dépassement issu d’un choix explicite de l’utilisateur', () => {
    const verdict = verdictDepassement({ budget, projected, origin: BUDGET_ORIGINS.USER })
    expect(verdict).toMatchObject({ exceeds: true, allowed: true, code: BUDGET_ISSUE_CODES.OVERRUN_ACCEPTED })
    expect(verdict.overrunCentralEur).toBeCloseTo(2, 6)
  })

  it('ne rend aucun verdict rassurant quand rien n’a été chiffré', () => {
    const verdict = verdictDepassement({ budget, projected: null, origin: BUDGET_ORIGINS.GENERATION })
    expect(verdict.applicable).toBe(false)
    expect(verdict.exceeds).toBe(false)
  })
})

describe('mealAlternatives — l’échange est chiffré, jamais filtré', () => {
  const RULES = buildRepetitionRules()
  const budget = buildBudgetContext({ weeklyEnvelopeEur: 5, priceIndex: indexPrix() })
  const semaine = [
    {
      key: '2026-09-07-dejeuner',
      date: '2026-09-07',
      mealType: 'dejeuner',
      recipeCode: 'B-SOBRE',
      source: 'fresh',
      budget: { chargeable: true, priced: true, range: { low: 0.48, central: 0.6, high: 0.72 } },
    },
    {
      key: '2026-09-08-diner',
      date: '2026-09-08',
      mealType: 'diner',
      recipeCode: 'D-AUTRE',
      source: 'fresh',
      budget: { chargeable: true, priced: true, range: { low: 0.48, central: 0.6, high: 0.72 } },
    },
  ]
  // `C-NEUTRE` n'est nulle part dans la semaine : elle ne heurte aucune règle de
  // répétition, et le seul écart qui la sépare de `A-COUTEUX` est le montant.
  const alternatives = () => buildMealAlternatives({
    slots: semaine,
    slotKey: '2026-09-07-dejeuner',
    candidates: [SOBRE, COUTEUX, makeRecipe('C-NEUTRE', 200)],
    rules: RULES,
    budget,
    limitPerKind: 3,
  }).alternatives

  it('propose l’alternative qui fait franchir l’enveloppe, avec son montant', () => {
    const couteux = alternatives().find((item) => item.recipeCode === 'A-COUTEUX')
    expect(couteux).toBeDefined()
    expect(couteux.budgetExceeded).toBe(true)
    expect(couteux.budget).toMatchObject({
      origin: BUDGET_ORIGINS.USER,
      allowed: true,
      code: BUDGET_ISSUE_CODES.OVERRUN_ACCEPTED,
    })
    // L'écart n'est rendu que sur la valeur centrale : c'est le seul point qui
    // se compose exactement (§3.2, raison 1).
    expect(couteux.costDeltaCentralEur).toBeCloseTo(5.4, 2)
    expect(couteux.costRange.central).toBeCloseTo(6, 6)
  })

  it('le fait descendre dans le classement sans jamais le retirer', () => {
    const codes = alternatives().map((item) => item.recipeCode)
    expect(codes).toContain('A-COUTEUX')
    expect(codes.indexOf('A-COUTEUX')).toBeGreaterThan(codes.indexOf('C-NEUTRE'))
  })

  it('dit qu’un candidat n’est pas chiffré plutôt que de le faire passer pour gratuit', () => {
    const inconnu = makeRecipe('Z-INCONNU', 200, {
      exactIngredients: [{ name: 'Racine inconnue crue', formNormalized: 'racine inconnue crue', grams: 200, optional: false }],
    })
    const proposees = buildMealAlternatives({
      slots: semaine,
      slotKey: '2026-09-07-dejeuner',
      candidates: [SOBRE, inconnu],
      rules: RULES,
      budget,
      limitPerKind: 3,
    }).alternatives
    const item = proposees.find((entry) => entry.recipeCode === 'Z-INCONNU')
    expect(item.costRange).toBeNull()
    expect(item.costUnknownReason).toBeTruthy()
    // Aucun verdict, pas même rassurant : dire « n'excède pas » reviendrait à
    // annoncer que ce plat est gratuit.
    expect(item.budget).toBeUndefined()
    expect(item.budgetExceeded).toBeUndefined()
  })

  it('laisse l’écran d’alternatives identique quand aucune enveloppe n’est réglée', () => {
    const sans = buildMealAlternatives({
      slots: semaine, slotKey: '2026-09-07-dejeuner', candidates: [SOBRE, COUTEUX], rules: RULES, limitPerKind: 3,
    }).alternatives
    expect(sans.every((item) => item.budget === undefined && item.costRange === undefined)).toBe(true)
  })
})

describe('l’explication — ce que le budget a fait renoncer à faire', () => {
  it('nomme le plat écarté par l’enveloppe, sur le créneau concerné', () => {
    const plan = planAvec({ recipes: [COUTEUX, SOBRE], envelope: 2 })
    const slot = plan.slots[0]
    expect(slot.recipeCode).toBe('B-SOBRE')
    expect(slot.budgetForgone).toMatchObject({ recipeCode: 'A-COUTEUX', title: 'Recette A-COUTEUX' })
    expect(slot.budgetForgone.savedEur).toBeCloseTo(6.48, 2)
    const phrase = explainSlot(slot)
    expect(phrase.text).toContain('l’enveloppe de la semaine a écarté Recette A-COUTEUX')
    expect(phrase.reasons.map((reason) => reason.code)).toContain('budget_forgone')
  })

  it('n’invente aucun renoncement quand l’enveloppe n’a rien départagé', () => {
    const large = planAvec({ recipes: [COUTEUX, SOBRE], envelope: 200 })
    expect(large.slots[0].budgetForgone).toBeUndefined()
    expect((explainSlot(large.slots[0])?.reasons || []).map((reason) => reason.code))
      .not.toContain('budget_forgone')
  })

  it('rend un bloc budget dans l’aperçu de semaine, avec sa couverture et ses renoncements', () => {
    const plan = planAvec({ recipes: [COUTEUX, SOBRE], envelope: 2 })
    const apercu = explainWeek(plan)
    expect(apercu.budget).toMatchObject({ active: true, envelopeEur: 2, exceeded: false, coveragePct: 100 })
    expect(apercu.budget.forgone).toEqual([
      expect.objectContaining({ slotKey: 'd1', title: 'Recette A-COUTEUX' }),
    ])
    expect(apercu.budget.sentence).toContain('référentiel')
  })

  it('fait remonter le dépassement dans les compromis de la semaine', () => {
    const plan = planAvec({ recipes: [COUTEUX], envelope: 1 })
    const apercu = explainWeek(plan)
    expect(apercu.budget.exceeded).toBe(true)
    expect(apercu.tradeoffs).toContain(BUDGET_ISSUE_CODES.EXCEEDED)
  })

  it('n’ajoute aucun bloc budget quand aucune enveloppe n’est demandée', () => {
    expect(explainWeek(planAvec({ recipes: [COUTEUX, SOBRE] })).budget).toBeUndefined()
  })
})
