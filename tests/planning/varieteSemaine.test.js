import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { DEFAULT_REPETITION_RULES, MEAL_SOURCES, repetitionViolations } from '@/lib/domain/planning/repetitionRules'

/**
 * Ce fichier existe parce qu'un utilisateur a ouvert son planning et y a trouvé
 * SIX PIZZAS sur quatorze repas, puis, la semaine mesurée localement, le même
 * pan bagnat servi trois fois.
 *
 * Le moteur ne fautait pas : `maxConsumptionsPerRecipe` valait 3, donc trois
 * assiettes du même plat étaient explicitement autorisées. Ce nombre avait été
 * calibré sur un corpus pauvre où l'interdire laissait des créneaux vides ; le
 * corpus en compte aujourd'hui plus de cinq cents publiables, et la mesure
 * refaite avant de trancher montre que le premier pas ne coûte presque rien.
 *
 * Ce que ces tests tiennent, c'est le RÉSULTAT — une semaine variée — et non le
 * réglage : un réglage se relit, un résultat se vérifie.
 */
const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }

const semaine = (debut, recipes) => generateClosedLoopPlan({
  slots: buildWeekSlots(debut),
  recipes,
  inventoryLots: [],
  constraints: {
    allowShopping: true,
    targetByMeal: { dejeuner: TARGET, diner: TARGET },
    maxMinutesByMeal: { dejeuner: 120, diner: 240 },
    preferredActiveMinutes: 30,
  },
  beamWidth: 48,
})

describe('variété de la semaine servie', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })

  it('ne sert jamais trois fois le même plat dans la semaine', () => {
    // Trois semaines de départs différents : une seule pourrait passer par
    // chance sur un corpus qui tourne avec la saison.
    for (const debut of ['2026-08-31', '2026-09-07', '2026-09-14']) {
      const plan = semaine(debut, recipes)
      const codes = plan.slots.map((slot) => slot.recipeCode)
      const parCode = new Map()
      for (const code of codes) parCode.set(code, (parCode.get(code) || 0) + 1)
      const trop = [...parCode.entries()].filter(([, n]) => n > 2)
      expect(trop, `${debut} : ${JSON.stringify(trop)}`).toEqual([])
    }
  })

  it('remplit la semaine entière malgré la contrainte resserrée', () => {
    // Le garde-fou du garde-fou. Interdire la troisième assiette ne vaut que si
    // le corpus permet encore de remplir quatorze créneaux : sinon on aurait
    // troqué la monotonie contre des trous, ce qui est pire.
    for (const debut of ['2026-08-31', '2026-09-07', '2026-09-14']) {
      const plan = semaine(debut, recipes)
      expect(plan.slots.length, debut).toBe(14)
      expect(plan.slots.map((slot) => slot.recipeCode).filter(Boolean).length, debut).toBe(14)
    }
  })

  it('sert au moins douze plats distincts sur quatorze créneaux', () => {
    for (const debut of ['2026-08-31', '2026-09-07', '2026-09-14']) {
      const plan = semaine(debut, recipes)
      const distincts = new Set(plan.slots.map((slot) => slot.recipeCode)).size
      expect(distincts, debut).toBeGreaterThanOrEqual(12)
    }
  })
})

describe('le plafond distingue ce qui existe de ce qu’on planifie', () => {
  /**
   * LE test de ce lot, et celui qui a demandé deux essais.
   *
   * La première version élargissait le plafond pour tout `isReuseSource`, qui
   * regroupe `cooked_dish` ET `planned_production`. Elle n'a RIEN changé à la
   * monotonie mesurée — toujours onze plats distincts, toujours trois assiettes
   * identiques — parce que les répétitions venaient précisément des productions
   * planifiées.
   *
   * La nuance est celle qui décide de tout : un `cooked_dish` est un plat qui
   * EXISTE au frigo et qu'il faut écouler — le brider revient à jeter des
   * portions réelles, l'inverse de la mission de cette application. Une
   * `planned_production` est le planificateur qui DÉCIDE d'en cuire davantage,
   * et rien n'oblige à décider trois fois le même plat.
   */
  const troisFois = (source) => repetitionViolations({
    plannedSlots: [
      { date: '2026-09-01', mealType: 'dejeuner', recipeCode: 'X', source },
      { date: '2026-09-03', mealType: 'dejeuner', recipeCode: 'X', source },
    ],
    date: '2026-09-05',
    mealType: 'dejeuner',
    recipeCode: 'X',
    source,
    rules: DEFAULT_REPETITION_RULES,
  }).map((violation) => violation.code)

  it('refuse une TROISIÈME production planifiée du même plat', () => {
    expect(troisFois(MEAL_SOURCES.PLANNED_PRODUCTION)).toContain('recipe_over_consumed')
  })

  it('refuse une troisième assiette fraîche du même plat', () => {
    expect(troisFois(MEAL_SOURCES.FRESH)).toContain('recipe_over_consumed')
  })

  it('accepte d’écouler en trois fois un plat DÉJÀ cuisiné', () => {
    // Six portions au frigo nourrissent trois créneaux : c'est l'anti-gaspillage
    // sur de la nourriture qui existe, pas un choix de menu.
    expect(troisFois(MEAL_SOURCES.COOKED_DISH)).not.toContain('recipe_over_consumed')
  })
})
