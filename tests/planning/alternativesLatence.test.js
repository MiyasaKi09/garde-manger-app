import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'
import { APPELS_MESURES, centile, mesurerLatenceAlternatives } from './mesureAlternatives'

/**
 * LA LATENCE DU REMPLACEMENT — critère du livrable 3.2.
 *
 * « Réponse < 3 s au 95e centile sur vingt appels, mesurée après la phase 0a
 * avec le vivier élargi. Au-delà de 3 s, on ne débranche pas la Routine et on
 * écrit le chiffre obtenu — la référence de départ est le 30-60 s de la
 * Routine. »
 *
 * CE QUI EST MESURÉ, ET CE QUI NE L'EST PAS — à lire avant le chiffre, sans quoi
 * il ne veut rien dire.
 *   — MESURÉ (a) : le calcul pur des alternatives sur le VIVIER ÉLARGI, c'est-
 *     à-dire les recettes servables du corpus du dépôt, et non les cent que la
 *     RPC rendait avant la phase 0a. C'est le cœur du service rendu.
 *   — MESURÉ (b) : la route `/api/planning/alternatives` de bout en bout contre
 *     une base EN MÉMOIRE — ses lectures, ses conversions de stock, la
 *     reconstruction de l'historique, le classement. Tout son travail.
 *   — NON MESURÉ : le réseau et les aller-retours Supabase réels. La CI n'a pas
 *     de base ; on ne les estime pas, on dit qu'ils manquent. Le chiffre
 *     ci-dessous est donc un PLANCHER de la latence servie, pas une promesse de
 *     temps de réponse en production. Ce qu'il tranche est la question posée par
 *     le livrable : le moteur déterministe est-il d'un autre ordre de grandeur
 *     que les 30 à 60 secondes de la Routine ?
 *
 * VINGT APPELS, un créneau différent à chaque tour. Le rang retenu pour le 95e
 * centile est le plus proche (le 19e des vingt triés) : une valeur réellement
 * observée, jamais interpolée.
 */

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/aiContextBuilder', () => ({
  fetchDietaryConstraints: vi.fn(async () => ({ allergies: [], bans: [], dislikes: [], diets: [] })),
}))
vi.mock('@/lib/db/operationalRecipeCatalog', () => ({ listOperationalRecipes: vi.fn() }))

import { POST as ALTERNATIVES } from '@/app/api/planning/alternatives/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { listOperationalRecipes } from '@/lib/db/operationalRecipeCatalog'
import { generateClosedLoopPlan, isMealSuitableRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { MEAL_SOURCES } from '@/lib/domain/planning/repetitionRules'

const CIBLE_MS = 3000
const DEBUT = '2026-09-21'
const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }

const fr = (valeur, decimales = 1) => Number(valeur).toFixed(decimales).replace('.', ',')

describe('latence du remplacement déterministe — vingt appels', () => {
  const recettes = getCanonicalRecipes({ servings: 2 })
  const vivier = recettes.filter(isMealSuitableRecipe)

  // Une semaine réelle, planifiée UNE FOIS : les vingt appels portent sur ses
  // créneaux, donc sur des plats que le moteur a effectivement retenus.
  const plan = generateClosedLoopPlan({
    slots: buildWeekSlots(DEBUT),
    recipes: recettes,
    inventoryLots: [],
    constraints: {
      allowShopping: true,
      targetByMeal: { dejeuner: TARGET, diner: TARGET },
      maxMinutesByMeal: { dejeuner: 120, diner: 240 },
      preferredActiveMinutes: 30,
    },
    beamWidth: 48,
  })
  const creneaux = plan.slots.map((slot) => ({
    key: slot.key,
    date: slot.date,
    mealType: slot.mealType,
    recipeCode: slot.recipeCode,
    source: MEAL_SOURCES.FRESH,
  }))

  const moteur = mesurerLatenceAlternatives({ slots: creneaux, candidates: vivier })

  let route = null

  beforeAll(async () => {
    // (b) La route entière, contre une base en mémoire.
    const mock = createSupabaseMock({
      nutrition_plan_imports: [{
        id: 42, user_id: 'u1', date_range_start: DEBUT, date_range_end: '2026-09-27',
        active_plan_version_id: 'v-1',
      }],
      meal_plan_slots: creneaux.map((creneau, index) => ({
        id: `slot-${index}`,
        user_id: 'u1',
        plan_version_id: 'v-1',
        slot_key: creneau.key,
        meal_date: creneau.date,
        meal_type: creneau.mealType,
        preparation: { recipe_code: creneau.recipeCode },
        status: 'planned',
        source: 'canonical_v3',
      })),
      nutrition_plan_meals: [],
      member_food_preferences: [],
      household_members: [{
        id: 'm1', user_id: 'u1', name: 'Membre', portion_multiplier: 1, active: true,
        preferences: {}, created_at: '2026-01-01',
      }],
      inventory_lots: [],
      canonical_foods: [],
      archetypes: [],
    })
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    listOperationalRecipes.mockResolvedValue({ recipes: recettes, metadata: { corpusVersion: 'depot' } })

    const durees = []
    let derniere = null
    for (let index = 0; index < APPELS_MESURES; index += 1) {
      const creneau = creneaux[index % creneaux.length]
      const debut = performance.now()
      const reponse = await ALTERNATIVES({
        json: async () => ({ import_id: 42, meal_date: creneau.date, meal_type: creneau.mealType }),
      })
      durees.push(performance.now() - debut)
      derniere = { statut: reponse.status, corps: await reponse.json() }
    }
    route = { durees, p95: centile(durees, 95), mediane: centile(durees, 50), max: Math.max(...durees), derniere }
  }, 120000)

  it('rend bien des alternatives sur le vivier élargi — sans quoi la mesure serait vide', () => {
    // On mesure le service rendu, pas une fonction qui rend zéro vite.
    //
    // Le compte porte sur les ANGLES couverts, pas sur le nombre de plats : un
    // même plat peut être à la fois « meilleur équivalent » et « découverte »,
    // et `mealAlternatives.js` le montre alors UNE fois avec ses deux
    // étiquettes plutôt que deux fois. Sur un foyer sans historique ni profil
    // de goûts — le cas de cette mesure — l'angle « favori » n'a par
    // construction aucun candidat : personne ne s'est encore prononcé.
    expect(vivier.length).toBeGreaterThan(400)
    expect(moteur.anglesCouverts, 'angles du §16 couverts par le moteur').toBeGreaterThanOrEqual(3)
    expect(moteur.alternativesRendues).toBeGreaterThanOrEqual(2)
    expect(route.derniere.statut).toBe(200)
    expect(route.derniere.corps.alternatives.length).toBeGreaterThanOrEqual(2)
  })

  it('tient les 3 s au 95e centile sur vingt appels, et imprime le chiffre obtenu', () => {
    const lignes = [
      `LATENCE DES ALTERNATIVES (livrable 3.2) — ${APPELS_MESURES} appels, vivier de ${moteur.candidats} recettes servables`,
      `  (a) calcul du moteur seul   · médiane ${fr(moteur.mediane)} ms · p95 ${fr(moteur.p95)} ms · max ${fr(moteur.max)} ms`,
      `  (b) route de bout en bout   · médiane ${fr(route.mediane)} ms · p95 ${fr(route.p95)} ms · max ${fr(route.max)} ms`,
      '  (b) porte les lectures, les conversions de stock et l’historique, contre une base EN MÉMOIRE :',
      '  ni le réseau ni les aller-retours Supabase n’y sont — c’est un plancher, pas un temps de réponse en production.',
      `  Référence de départ, la Routine LLM qu’il remplace : 30 000 à 60 000 ms (TodayMeals.jsx, « 30–60s » à l’écran).`,
    ]
    for (const ligne of lignes) console.log(ligne) // eslint-disable-line no-console

    expect(moteur.durees).toHaveLength(APPELS_MESURES)
    expect(route.durees).toHaveLength(APPELS_MESURES)
    expect(moteur.p95, `p95 du moteur : ${fr(moteur.p95)} ms`).toBeLessThan(CIBLE_MS)
    expect(route.p95, `p95 de la route : ${fr(route.p95)} ms`).toBeLessThan(CIBLE_MS)
  })

  it('reste d’un autre ordre de grandeur que la Routine qu’il remplace', () => {
    // Le critère du plan ne demande pas seulement de passer sous trois
    // secondes : il demande de savoir ce qu'on gagne. La Routine annonce
    // elle-même 30 à 60 secondes à l'écran.
    expect(route.p95).toBeLessThan(30000 / 10)
  })
})
