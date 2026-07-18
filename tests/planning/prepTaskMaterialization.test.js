import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { PATCH } from '@/app/api/planning/prep-tasks/[taskId]/route'
import { authenticateRequest } from '@/lib/apiAuth'

const request = (body) => ({ json: async () => body })
const TASK_ID = '101'
const PROD_ID = 'prod-uuid-1'
const USER_ID = 'u1'
const VERSION_ID = 'ver-1'

function makeBase() {
  return {
    nutrition_plan_prep_tasks: [{
      id: TASK_ID, user_id: USER_ID, import_id: 1, done: false, done_at: null, workflow_status: 'pending',
    }],
    prep_task_dependencies: [],
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

describe('PATCH /api/planning/prep-tasks/[taskId] — exécution cohérente', () => {
  let mock
  const setup = (tables) => {
    mock = createSupabaseMock(tables)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: USER_ID }, error: null })
  }

  beforeEach(() => vi.clearAllMocks())

  it('matérialise toutes les productions avant de terminer la tâche', async () => {
    setup(makeBase())
    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.task.done).toBe(true)
    expect(body.materialized).toHaveLength(1)
    expect(body.materialized[0].production_id).toBe(PROD_ID)
    expect(mock.rows('cooked_dishes')).toHaveLength(1)
    expect(mock.rows('planned_productions')[0].status).toBe('materialized')
  })

  it('termine une tâche sans production sans créer de plat', async () => {
    const tables = makeBase()
    tables.planned_productions = []
    setup(tables)
    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    expect((await res.json()).materialized).toEqual([])
    expect(mock.rows('nutrition_plan_prep_tasks')[0].done).toBe(true)
  })

  it('refuse une tâche dont une dépendance est encore ouverte', async () => {
    const tables = makeBase()
    tables.nutrition_plan_prep_tasks.push({ id: '100', done: false, done_at: null })
    tables.prep_task_dependencies.push({ task_id: TASK_ID, depends_on_task_id: '100' })
    setup(tables)
    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(409)
    expect(mock.rows('nutrition_plan_prep_tasks')[0].done).toBe(false)
    expect(mock.rows('cooked_dishes')).toHaveLength(0)
  })

  it('une erreur de création laisse la tâche ouverte', async () => {
    setup(makeBase())
    mock.queueError('cooked_dishes', 'insert', 'disk full')
    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(500)
    expect(mock.rows('nutrition_plan_prep_tasks')[0].done).toBe(false)
    expect(mock.rows('planned_productions')[0].status).toBe('planned')
    expect(mock.rows('cooked_dishes')).toHaveLength(0)
  })

  it('refuse de décocher une tâche ayant déjà créé un plat physique', async () => {
    const tables = makeBase()
    tables.nutrition_plan_prep_tasks[0].done = true
    tables.nutrition_plan_prep_tasks[0].done_at = '2026-07-17T08:00:00Z'
    tables.planned_productions[0].status = 'materialized'
    tables.planned_productions[0].materialized_cooked_dish_id = 42
    tables.cooked_dishes = [{ id: 42, user_id: USER_ID, portions_remaining: 4 }]
    setup(tables)
    const res = await PATCH(request({ done: false }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(409)
    expect(mock.rows('nutrition_plan_prep_tasks')[0].done).toBe(true)
    expect(mock.rows('cooked_dishes')).toHaveLength(1)
  })

  it('refuse de décocher un parent si un enfant est déjà terminé', async () => {
    const tables = makeBase()
    tables.planned_productions = []
    tables.nutrition_plan_prep_tasks[0].done = true
    tables.nutrition_plan_prep_tasks.push({ id: '102', done: true, done_at: '2026-07-17T09:00:00Z' })
    tables.prep_task_dependencies.push({ task_id: '102', depends_on_task_id: TASK_ID })
    setup(tables)
    const res = await PATCH(request({ done: false }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(409)
    expect(mock.rows('nutrition_plan_prep_tasks')[0].done).toBe(true)
  })

  it('ne rematérialise pas une production déjà matérialisée', async () => {
    const tables = makeBase()
    tables.planned_productions[0].status = 'materialized'
    tables.planned_productions[0].materialized_cooked_dish_id = 99
    tables.cooked_dishes = [{ id: 99, user_id: USER_ID, portions_remaining: 4 }]
    setup(tables)
    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    expect((await res.json()).materialized).toEqual([])
    expect(mock.rows('cooked_dishes')).toHaveLength(1)
  })

  it('retourne 404 pour une tâche absente', async () => {
    setup(makeBase())
    const res = await PATCH(request({ done: true }), { params: { taskId: '999-unknown' } })
    expect(res.status).toBe(404)
  })

  it('conserve la méthode congélateur lors de la matérialisation', async () => {
    const tables = makeBase()
    tables.planned_productions[0].storage_method = 'freezer'
    setup(tables)
    const res = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(res.status).toBe(200)
    expect(mock.rows('cooked_dishes')[0].storage_method).toBe('freezer')
  })
})
