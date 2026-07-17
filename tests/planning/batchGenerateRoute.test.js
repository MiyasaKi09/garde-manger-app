import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// P0-8 (audit F09) : l'endpoint batch ne doit plus effacer les tâches
// canoniques versionnées (source='closed_loop'). Il ne remplace que SES
// propres tâches (source='batch') et balaie les anciennes lignes non taguées
// (source='legacy' — valeur par défaut NOT NULL de la colonne, jamais NULL).

vi.mock('@anthropic-ai/sdk', () => ({
  default: class AnthropicMock {
    constructor() {
      this.messages = { create: async () => { throw new Error('pas de réseau en test') } }
    }
  },
}))
vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { POST } from '@/app/api/planning/batch/generate/route'
import { authenticateRequest } from '@/lib/apiAuth'

const request = (body) => ({ json: async () => body })

// Semaine du lundi 2026-07-20 : 2 déjeuners « Chili » (lundi) + 1 « Salade » (mercredi).
function seedMock() {
  return createSupabaseMock({
    nutrition_plan_imports: [{
      id: 42, user_id: 'u1', file_name: 'myko-canonical-v3',
      date_range_start: '2026-07-20', date_range_end: '2026-07-26',
    }],
    nutrition_plan_meals: [
      { id: 1, import_id: 42, meal_type: 'dejeuner', meal_date: '2026-07-20', short_label: 'Chili sin carne', person_name: 'Julien', batch_recipe_id: null },
      { id: 2, import_id: 42, meal_type: 'dejeuner', meal_date: '2026-07-20', short_label: 'Chili sin carne', person_name: 'Zoé', batch_recipe_id: null },
      { id: 3, import_id: 42, meal_type: 'dejeuner', meal_date: '2026-07-22', short_label: 'Salade de lentilles', person_name: 'Julien', batch_recipe_id: null },
    ],
    generated_recipes: [],
    nutrition_plan_prep_tasks: [
      // Tâches canoniques versionnées — à préserver ABSOLUMENT (une déjà faite).
      { id: 'c1', import_id: 42, source: 'closed_loop', plan_version_id: 'v1', done: true, task: 'Préparer chili sin carne', prep_date: '2026-07-20' },
      { id: 'c2', import_id: 42, source: 'closed_loop', plan_version_id: 'v1', done: false, task: 'Préparer salade de lentilles', prep_date: '2026-07-22' },
      // Ancienne ligne non taguée de cet endpoint (défaut colonne = 'legacy').
      { id: 'l1', import_id: 42, source: 'legacy', plan_version_id: null, done: false, task: 'Ancienne tâche batch non taguée', prep_date: '2026-07-19' },
      // Ligne d'un run batch précédent, déjà taguée.
      { id: 'b1', import_id: 42, source: 'batch', plan_version_id: null, done: false, task: 'Cuisiner un vieux lot', prep_date: '2026-07-19' },
    ],
    nutrition_plan_batch_recipes: [
      { id: 900, import_id: 42, name: 'Vieux lot', cook_date: '2026-07-19' },
    ],
  })
}

describe('POST /api/planning/batch/generate — idempotence sans effacer le canonique', () => {
  let mock

  beforeEach(() => {
    // Pas de clé → repli déterministe (aucun appel réseau), console silencieuse.
    delete process.env.ANTHROPIC_API_KEY
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mock = seedMock()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deux exécutions : canonique intact, batch remplacé, nouvelles lignes taguées source=batch', async () => {
    for (let run = 1; run <= 2; run += 1) {
      const response = await POST(request({ importId: 42 }))
      expect(response.status, `run ${run}`).toBe(200)
      const body = await response.json()
      expect(body.ok).toBe(true)
      expect(body.batch_recipes).toBe(2)
      expect(body.planner).toBe('rules')

      const tasks = mock.rows('nutrition_plan_prep_tasks')

      // 1. Les tâches canoniques survivent aux deux runs, état `done` préservé.
      const canonical = tasks.filter((t) => t.source === 'closed_loop')
      expect(canonical.map((t) => t.id).sort()).toEqual(['c1', 'c2'])
      expect(canonical.find((t) => t.id === 'c1').done).toBe(true)
      expect(canonical.every((t) => t.plan_version_id === 'v1')).toBe(true)

      // 2. Ancienne ligne non taguée (legacy) et vieux batch balayés.
      expect(tasks.some((t) => t.id === 'l1')).toBe(false)
      expect(tasks.some((t) => t.id === 'b1')).toBe(false)

      // 3. Les lignes recréées portent source='batch' (2 cuissons + 1 étiquetage),
      //    sans doublon d'un run à l'autre.
      const batchTasks = tasks.filter((t) => t.source === 'batch')
      expect(batchTasks).toHaveLength(3)
      expect(batchTasks.every((t) => t.import_id === 42 && t.plan_version_id == null)).toBe(true)
      expect(tasks).toHaveLength(5) // 2 canoniques + 3 batch

      // 4. Recettes batch remplacées idempotemment (jamais cumulées).
      const recipes = mock.rows('nutrition_plan_batch_recipes')
      expect(recipes).toHaveLength(2)
      expect(recipes.some((r) => r.id === 900)).toBe(false)

      // 5. Les repas sont bien reliés aux recettes du DERNIER run.
      const recipeIds = new Set(recipes.map((r) => r.id))
      const meals = mock.rows('nutrition_plan_meals')
      expect(meals.every((m) => recipeIds.has(m.batch_recipe_id))).toBe(true)
    }
  })

  it('échec du delete des tâches → 500 et rien n’est recréé ni supprimé ensuite', async () => {
    mock.queueError('nutrition_plan_prep_tasks', 'delete', 'boom delete')
    const response = await POST(request({ importId: 42 }))
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('boom delete')

    // Toutes les tâches seed sont toujours là, et les recettes batch n'ont pas
    // été touchées (le delete des recettes vient APRÈS celui des tâches).
    expect(mock.rows('nutrition_plan_prep_tasks')).toHaveLength(4)
    expect(mock.rows('nutrition_plan_batch_recipes')).toHaveLength(1)
  })

  it('ne supprime jamais une ligne rattachée à une version de plan, même mal taguée', async () => {
    // Garde-fou plan_version_id : une ligne aberrante source='legacy' MAIS
    // rattachée à une version ne doit pas être balayée.
    mock = seedMock()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    const anomalous = { id: 'x1', import_id: 42, source: 'legacy', plan_version_id: 'v1', done: false, task: 'Tâche versionnée mal taguée', prep_date: '2026-07-20' }
    // Injection directe dans le store via un insert.
    await mock.from('nutrition_plan_prep_tasks').insert(anomalous)

    const response = await POST(request({ importId: 42 }))
    expect(response.status).toBe(200)
    const tasks = mock.rows('nutrition_plan_prep_tasks')
    expect(tasks.some((t) => t.id === 'x1')).toBe(true)
  })
})
