import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// Lot P3 volet B (audit F12/F13) : l'endpoint batch est un DÉRIVATEUR
// déterministe — plus aucun appel IA dans le chemin de décision.
// - Aucun appel réseau IA : le mock du SDK explose à la construction et
//   global.fetch échoue le test s'il est appelé (même avec une clé présente).
// - Déterminisme : deux appels sur les mêmes entrées → sorties identiques.
// - Conservation sans regex sur le nom (F13) : un plat « salade » avec profil
//   congélateur DÉCLARÉ par le solveur reste congelable ; un plat sans info
//   (repli legacy) est non congelable, 72 h frigo, conservation_source =
//   'default_conservative'.
// - Portions ≠ nombre de lignes (F08/test K) sur les deux chemins.
// - Régression P0-8 : les tâches canoniques versionnées survivent.

vi.mock('@anthropic-ai/sdk', () => ({
  default: class AnthropicForbidden {
    constructor() {
      throw new Error('Anthropic ne doit plus être instancié dans le chemin batch (audit F12)')
    }
  },
}))
vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { POST } from '@/app/api/planning/batch/generate/route'
import { authenticateRequest } from '@/lib/apiAuth'

const request = (body) => ({ json: async () => body })

/* ───────── seed canonique : version active + productions + consommations ───────── */
function seedCanonical() {
  return createSupabaseMock({
    nutrition_plan_imports: [{
      id: 42, user_id: 'u1', file_name: 'myko-canonical-v3',
      date_range_start: '2026-07-20', date_range_end: '2026-07-26',
    }],
    meal_plan_versions: [
      { id: 'v0', import_id: 42, version_no: 2, status: 'superseded' },
      { id: 'v1', import_id: 42, version_no: 3, status: 'published' },
    ],
    nutrition_plan_prep_tasks: [
      // Tâches canoniques versionnées — la source de vérité (P2).
      {
        id: 101, import_id: 42, source: 'closed_loop', plan_version_id: 'v1',
        task_type: 'prepare_recipe', prep_date: '2026-07-19', done: false, duration_min: 35,
        task: 'Préparer salade de lentilles — 3,5 portions (3 repas)',
        instructions_json: [{ n: 1, instruction: 'Cuire les lentilles.' }, { n: 2, instruction: 'Assembler et portionner.' }],
      },
      {
        id: 104, import_id: 42, source: 'closed_loop', plan_version_id: 'v1',
        task_type: 'prepare_recipe', prep_date: '2026-07-19', done: true, duration_min: 40,
        task: 'Préparer chili sin carne — 4,5 portions (2 repas)',
        instructions_json: [{ n: 1, instruction: 'Mijoter le chili.' }],
      },
      {
        id: 102, import_id: 42, source: 'closed_loop', plan_version_id: 'v1',
        task_type: 'reheat_dish', prep_date: '2026-07-21', done: false, duration_min: 10,
        task: 'Réchauffer salade de lentilles',
      },
      // Résidus d'anciens générateurs — à balayer.
      { id: 'l1', import_id: 42, source: 'legacy', plan_version_id: null, done: false, task: 'Ancienne tâche non taguée', prep_date: '2026-07-18' },
      { id: 'b1', import_id: 42, source: 'batch', plan_version_id: null, done: false, task: 'Cuisiner un vieux lot', prep_date: '2026-07-18' },
    ],
    planned_productions: [
      // « Salade » avec congélation DÉCLARÉE par le solveur : reste congelable
      // (F13 : le nom du plat ne décide de rien).
      {
        id: 'pp-salade', plan_version_id: 'v1', source_task_id: 101, production_key: 'prod-salade',
        output_name: 'Salade de lentilles', planned_portions: 3.5, storage_method: 'freezer',
        available_from: '2026-07-19', use_by: '2026-08-19', status: 'planned',
      },
      {
        id: 'pp-chili', plan_version_id: 'v1', source_task_id: 104, production_key: 'prod-chili',
        output_name: 'Chili sin carne', planned_portions: 4.5, storage_method: 'refrigerator',
        available_from: '2026-07-19', use_by: '2026-07-22', status: 'planned',
      },
      // Production annulée : jamais dérivée.
      {
        id: 'pp-cancel', plan_version_id: 'v1', source_task_id: null, production_key: 'prod-cancel',
        output_name: 'Production annulée', planned_portions: 2, storage_method: 'refrigerator',
        available_from: '2026-07-19', use_by: '2026-07-21', status: 'cancelled',
      },
    ],
    planned_consumptions: [
      { id: 'pc1', plan_version_id: 'v1', slot_id: 's1', planned_production_id: 'pp-salade', portions: 1.25 },
      { id: 'pc2', plan_version_id: 'v1', slot_id: 's2', planned_production_id: 'pp-salade', portions: 2.25 },
      { id: 'pc3', plan_version_id: 'v1', slot_id: 's3', planned_production_id: 'pp-chili', portions: 4.5 },
    ],
    // 2 lignes de repas pour la salade (3,5 portions planifiées ≠ 2 lignes),
    // 2 lignes pour le chili (4,5 portions planifiées ≠ 2 lignes).
    nutrition_plan_meals: [
      { id: 1, import_id: 42, meal_type: 'dejeuner', meal_date: '2026-07-20', short_label: 'Salade de lentilles', person_name: 'Julien', meal_plan_slot_id: 's1', planned_servings: 1.25, batch_recipe_id: null },
      { id: 2, import_id: 42, meal_type: 'dejeuner', meal_date: '2026-07-21', short_label: 'Salade de lentilles', person_name: 'Zoé', meal_plan_slot_id: 's2', planned_servings: 2.25, batch_recipe_id: null },
      { id: 3, import_id: 42, meal_type: 'diner', meal_date: '2026-07-21', short_label: 'Chili sin carne', person_name: 'Julien', meal_plan_slot_id: 's3', planned_servings: 2.25, batch_recipe_id: null },
      { id: 4, import_id: 42, meal_type: 'diner', meal_date: '2026-07-21', short_label: 'Chili sin carne', person_name: 'Zoé', meal_plan_slot_id: 's3', planned_servings: 2.25, batch_recipe_id: null },
    ],
    generated_recipes: [],
    nutrition_plan_batch_recipes: [
      { id: 900, import_id: 42, name: 'Vieux lot', cook_date: '2026-07-18' },
    ],
  })
}

/* ───────── seed legacy : aucun plan canonique (anciens imports) ───────── */
function seedLegacy() {
  return createSupabaseMock({
    nutrition_plan_imports: [{
      id: 7, user_id: 'u1', file_name: 'ancien-plan',
      date_range_start: '2026-07-20', date_range_end: '2026-07-26',
    }],
    // « Bourguignon » : l'ancien fallback regex le déclarait congelable 5 j.
    // Sans profil validé, la règle prudente s'applique (72 h, non congelable).
    nutrition_plan_meals: [
      { id: 1, import_id: 7, meal_type: 'dejeuner', meal_date: '2026-07-20', short_label: 'Bourguignon de bœuf', person_name: 'Julien', planned_servings: 1.5, batch_recipe_id: null },
      { id: 2, import_id: 7, meal_type: 'dejeuner', meal_date: '2026-07-20', short_label: 'Bourguignon de bœuf', person_name: 'Zoé', planned_servings: 1.25, batch_recipe_id: null },
    ],
    generated_recipes: [],
    nutrition_plan_prep_tasks: [],
    nutrition_plan_batch_recipes: [],
  })
}

// Projection stable d'une recette batch (ignore les ids générés par le mock).
const recipeProjection = (r) => ({
  name: r.name, cook_date: r.cook_date, portions_total: r.portions_total,
  keeps_days: r.keeps_days, freezable: r.freezable, conservation: r.conservation,
  reheat: r.reheat, rendement: r.rendement, portions: r.portions, instructions: r.instructions,
})

describe('POST /api/planning/batch/generate — dérivateur déterministe (Lot P3 volet B)', () => {
  let fetchSpy

  beforeEach(() => {
    // Une clé EST présente : la garantie « pas d'IA » ne repose pas sur son
    // absence mais sur le retrait du code (F12).
    process.env.ANTHROPIC_API_KEY = 'sk-test-presente'
    fetchSpy = vi.fn(() => { throw new Error('appel réseau interdit dans le chemin batch') })
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('ne fait aucun appel réseau IA, même avec une clé configurée', async () => {
    const mock = seedCanonical()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const response = await POST(request({ importId: 42 }))
    expect(response.status).toBe(200)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('dérive les recettes batch des planned_productions de la version active', async () => {
    const mock = seedCanonical()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const response = await POST(request({ importId: 42 }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.planner).toBe('canonical')
    expect(body.batch_recipes).toBe(2) // la production annulée n'est pas dérivée
    expect(body.sessions).toEqual(['2026-07-19'])

    const recipes = mock.rows('nutrition_plan_batch_recipes')
    expect(recipes).toHaveLength(2)
    expect(recipes.some((r) => r.id === 900)).toBe(false) // ancien lot balayé

    const salade = recipes.find((r) => r.name === 'Salade de lentilles')
    const chili = recipes.find((r) => r.name === 'Chili sin carne')

    // F13 : « salade » avec congélation déclarée par le solveur → congelable,
    // conservation issue du profil, réchauffage générique (aucune inférence
    // « se mange froid » par le nom).
    expect(salade.freezable).toBe(true)
    expect(salade.conservation).toMatch(/congélateur/i)
    expect(salade.reheat).not.toMatch(/froid/i)
    const saladeOut = body.recipes.find((r) => r.name === 'Salade de lentilles')
    expect(saladeOut.conservation_source).toBe('recipe_profile')

    // F08/test K : portions = planned_portions du solveur, jamais le nombre
    // de lignes de repas (2 lignes chacun).
    expect(salade.portions_total).toBe(4) // round(3,5) ≠ 2 lignes
    expect(salade.rendement).toBe('3,5 portions')
    expect(chili.portions_total).toBe(5) // round(4,5) ≠ 2 lignes
    expect(chili.freezable).toBe(false) // réfrigérateur choisi par le solveur

    // Dates et durée de vie depuis les données réelles du plan.
    expect(salade.cook_date).toBe('2026-07-19') // prep_date de la tâche source
    expect(salade.keeps_days).toBe(31) // 2026-07-19 → 2026-08-19
    expect(chili.keeps_days).toBe(3)

    // Instructions dérivées de la tâche canonique (aucune IA).
    expect(salade.instructions).toBe('1. Cuire les lentilles.\n2. Assembler et portionner.')

    // Repas reliés via planned_consumptions → slots → lignes.
    const meals = mock.rows('nutrition_plan_meals')
    expect(meals.find((m) => m.id === 1).batch_recipe_id).toBe(salade.id)
    expect(meals.find((m) => m.id === 2).batch_recipe_id).toBe(salade.id)
    expect(meals.find((m) => m.id === 3).batch_recipe_id).toBe(chili.id)
    expect(meals.find((m) => m.id === 4).batch_recipe_id).toBe(chili.id)
    expect(body.linked_meals).toBe(4)
  })

  it('régression P0-8 : les tâches canoniques survivent, aucune tâche batch recréée', async () => {
    const mock = seedCanonical()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    for (let run = 1; run <= 2; run += 1) {
      const response = await POST(request({ importId: 42 }))
      expect(response.status, `run ${run}`).toBe(200)

      const tasks = mock.rows('nutrition_plan_prep_tasks')
      const canonical = tasks.filter((t) => t.source === 'closed_loop')
      expect(canonical.map((t) => t.id).sort()).toEqual([101, 102, 104])
      expect(canonical.find((t) => t.id === 104).done).toBe(true) // état préservé
      // Résidus balayés, et la check-list canonique n'est PAS doublée par des
      // tâches source='batch' (la tâche versionnée matérialise déjà, P2).
      expect(tasks.some((t) => t.id === 'l1' || t.id === 'b1')).toBe(false)
      expect(tasks.filter((t) => t.source === 'batch')).toHaveLength(0)
    }
  })

  it('déterminisme : deux exécutions produisent exactement les mêmes sorties', async () => {
    const runOnce = async () => {
      const mock = seedCanonical()
      authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
      const response = await POST(request({ importId: 42 }))
      expect(response.status).toBe(200)
      return {
        body: await response.json(),
        recipes: mock.rows('nutrition_plan_batch_recipes').map(recipeProjection),
      }
    }

    const first = await runOnce()
    const second = await runOnce()
    expect(second.body).toEqual(first.body)
    expect(second.recipes).toEqual(first.recipes)
  })

  it('repli legacy : conservation prudente par défaut, jamais déduite du nom (F13)', async () => {
    const mock = seedLegacy()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const response = await POST(request({ importId: 7 }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.planner).toBe('rules')
    expect(fetchSpy).not.toHaveBeenCalled()

    const [bourguignon] = mock.rows('nutrition_plan_batch_recipes')
    // L'ancien fallback regex déclarait un bourguignon congelable 5 j : sans
    // profil validé, la règle prudente s'applique.
    expect(bourguignon.freezable).toBe(false)
    expect(bourguignon.keeps_days).toBe(3) // 72 h (lib/shelfLifeRules.js)
    expect(bourguignon.conservation).toMatch(/prudente par défaut/i)
    expect(bourguignon.reheat).not.toMatch(/casserole à feu doux 6–8 min/i)

    const out = body.recipes.find((r) => r.name === 'Bourguignon de bœuf')
    expect(out.conservation_source).toBe('default_conservative')

    // F08 : portions = somme des planned_servings (1,5 + 1,25 = 2,75), pas le
    // nombre de lignes (2).
    expect(bourguignon.portions_total).toBe(3)
    expect(bourguignon.rendement).toBe('2,75 portions')
  })

  it('repli legacy : déterminisme sur deux exécutions', async () => {
    const runOnce = async () => {
      const mock = seedLegacy()
      authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
      const response = await POST(request({ importId: 7 }))
      expect(response.status).toBe(200)
      return {
        body: await response.json(),
        recipes: mock.rows('nutrition_plan_batch_recipes').map(recipeProjection),
      }
    }

    const first = await runOnce()
    const second = await runOnce()
    expect(second.body).toEqual(first.body)
    expect(second.recipes).toEqual(first.recipes)
  })
})
