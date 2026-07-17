import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

// Test F (audit §15) : Validation d'une tâche de préparation (done=true)
// doit matérialiser les planned_productions dont source_task_id = taskId.
//   • Un cooked_dishes réel est inséré pour chaque production planned.
//   • planned_productions.status → 'materialized'.
//   • planned_productions.materialized_cooked_dish_id = cooked_dishes.id créé.
//   • La dé-validation (done=false) ne supprime pas le plat déjà matérialisé.

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { PATCH } from '@/app/api/planning/prep-tasks/[taskId]/route'
import { authenticateRequest } from '@/lib/apiAuth'

const request = (body) => ({ json: async () => body })

const TASK_ID   = '101'
const PROD_ID   = 'prod-uuid-1'
const USER_ID   = 'u1'
const VERSION_ID = 'ver-1'

function makeBase() {
  return {
    nutrition_plan_prep_tasks: [{
      id: TASK_ID,
      user_id: USER_ID,
      import_id: 1,
      done: false,
      done_at: null,
    }],
    planned_productions: [{
      id: PROD_ID,
      user_id: USER_ID,
      plan_version_id: VERSION_ID,
      source_task_id: TASK_ID,
      production_key: 'batch-lentilles-2026-07-17',
      output_name: 'Dahl de lentilles',
      planned_portions: 4,
      storage_method: 'refrigerator',
      available_from: '2026-07-17',
      use_by: '2026-07-20',
      status: 'planned',
      materialized_cooked_dish_id: null,
    }],
    cooked_dishes: [],
  }
}

describe('PATCH /api/planning/prep-tasks/[taskId] — matérialisation P2 (test F)', () => {
  let mock

  const setup = (tables) => {
    mock = createSupabaseMock(tables)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: USER_ID }, error: null })
  }

  it('done=true : matérialise la production planifiée → crée un cooked_dishes', async () => {
    setup(makeBase())

    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    const body = await res.json()

    // Tâche bien marquée done
    expect(body.task.done).toBe(true)
    expect(body.task.done_at).not.toBeNull()

    // Matérialisation : un plat créé
    expect(body.materialized).toHaveLength(1)
    expect(body.materialized[0].production_id).toBe(PROD_ID)
    expect(body.materialized[0].name).toBe('Dahl de lentilles')
    expect(body.materialized[0].portions).toBe(4)

    // cooked_dishes a bien été inséré
    const dishes = mock.rows('cooked_dishes')
    expect(dishes).toHaveLength(1)
    expect(dishes[0].portions_remaining).toBe(4)
    expect(dishes[0].portions_cooked).toBe(4)
    expect(dishes[0].expiration_date).toBe('2026-07-20')
    expect(dishes[0].user_id).toBe(USER_ID)

    // planned_productions.status mis à jour
    const prods = mock.rows('planned_productions')
    expect(prods[0].status).toBe('materialized')
    expect(String(prods[0].materialized_cooked_dish_id)).toBe(String(dishes[0].id))
  })

  it('done=true sans production liée → tâche marquée, materialized=[]', async () => {
    const tables = makeBase()
    tables.planned_productions = [] // aucune production liée à cette tâche
    setup(tables)

    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.task.done).toBe(true)
    expect(body.materialized).toHaveLength(0)
    expect(mock.rows('cooked_dishes')).toHaveLength(0)
  })

  it('done=true avec production déjà materialized → non re-matérialisée', async () => {
    const tables = makeBase()
    tables.planned_productions[0].status = 'materialized'
    tables.planned_productions[0].materialized_cooked_dish_id = 99
    tables.cooked_dishes = [{ id: 99, user_id: USER_ID, portions_remaining: 4 }]
    setup(tables)

    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    const body = await res.json()

    // La production est 'materialized' pas 'planned' → non reprise par la requête
    expect(body.materialized).toHaveLength(0)
    // Un seul cooked_dishes (aucun nouveau créé)
    expect(mock.rows('cooked_dishes')).toHaveLength(1)
  })

  it('done=false : tâche décochée, plat déjà matérialisé conservé', async () => {
    // Simulation après une première validation : production matérialisée, plat existant
    const tables = makeBase()
    tables.nutrition_plan_prep_tasks[0].done = true
    tables.nutrition_plan_prep_tasks[0].done_at = '2026-07-17T08:00:00Z'
    tables.planned_productions[0].status = 'materialized'
    tables.planned_productions[0].materialized_cooked_dish_id = 42
    tables.cooked_dishes = [{ id: 42, user_id: USER_ID, name: 'Dahl de lentilles', portions_remaining: 4 }]
    setup(tables)

    const res = await PATCH(request({ done: false }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    const body = await res.json()

    // Tâche décochée
    expect(body.task.done).toBe(false)
    expect(body.task.done_at).toBeNull()

    // Plat physique intact (non supprimé)
    expect(mock.rows('cooked_dishes')).toHaveLength(1)

    // Pas de nouvelle matérialisation
    expect(body.materialized).toHaveLength(0)
  })

  it('erreur insert cooked_dishes → fail-soft, tâche toujours done, materialization_error renseigné', async () => {
    setup(makeBase())
    mock.queueError('cooked_dishes', 'insert', 'disk full')

    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    const body = await res.json()

    // Tâche markée done malgré l'erreur
    expect(body.task.done).toBe(true)
    expect(body.materialized).toHaveLength(0)
    expect(body.materialization_error).toBe('disk full')
  })

  it('tâche introuvable → 404', async () => {
    setup(makeBase())

    const res = await PATCH(request({ done: true }), { params: { taskId: '999-unknown' } })
    expect(res.status).toBe(404)
  })

  it('stockage freezer → storage_method="freezer" dans cooked_dishes', async () => {
    const tables = makeBase()
    tables.planned_productions[0].storage_method = 'freezer'
    setup(tables)

    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)

    const dishes = mock.rows('cooked_dishes')
    expect(dishes[0].storage_method).toBe('freezer')
  })
})
