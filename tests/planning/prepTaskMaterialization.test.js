import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { PATCH } from '@/app/api/planning/prep-tasks/[taskId]/route'
import { authenticateRequest } from '@/lib/apiAuth'

const request = (body) => ({ json: async () => body })
const USER_ID = 'u1'
const TASK_ID = '101'

function setupRpc({ data = null, error = null } = {}) {
  const rpc = vi.fn(async () => ({ data, error }))
  authenticateRequest.mockResolvedValue({
    supabase: { rpc },
    user: { id: USER_ID },
    error: null,
  })
  return rpc
}

describe('PATCH /api/planning/prep-tasks/[taskId] — façade de la transaction SQL', () => {
  beforeEach(() => vi.clearAllMocks())

  it('délègue la clôture complète à set_planned_task_done', async () => {
    const result = {
      task: { id: Number(TASK_ID), done: true, done_at: '2026-07-19T08:00:00Z' },
      materialized: [{ production_id: 'prod-1', cooked_dish_id: 42, portions: 4 }],
      movements: 3,
      reservations_consumed: 3,
    }
    const rpc = setupRpc({ data: result })

    const response = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(result)
    expect(rpc).toHaveBeenCalledWith('set_planned_task_done', {
      p_task_id: Number(TASK_ID),
      p_done: true,
    })
  })

  it('délègue aussi la réouverture à la même transaction', async () => {
    const result = { task: { id: Number(TASK_ID), done: false, done_at: null }, materialized: [], movements: 0 }
    const rpc = setupRpc({ data: result })

    const response = await PATCH(request({ done: false }), { params: { taskId: TASK_ID } })
    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('set_planned_task_done', {
      p_task_id: Number(TASK_ID),
      p_done: false,
    })
  })

  it.each([
    ['dependencies_pending', 'Termine d’abord les préparations'],
    ['completed_dependant', 'préparation dépendante est déjà terminée'],
    ['materialized_production_cannot_reopen', 'créé un plat réel'],
    ['unreserved_ingredients_replan_required', 'Range les courses'],
    ['stock_changed:lot-1', 'Le stock a changé'],
    ['missing_density:lot-2', 'reconvertie dans l’unité réelle'],
  ])('traduit le conflit SQL %s en réponse 409 actionnable', async (technical, expected) => {
    setupRpc({ error: { message: technical } })

    const response = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toContain(expected)
    expect(body.technical_code).toBe(technical.split(':')[0])
  })

  it('retourne 404 lorsque la tâche n’appartient pas au tenant', async () => {
    setupRpc({ error: { message: 'task_not_found_or_forbidden' } })
    const response = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(response.status).toBe(404)
    expect((await response.json()).error).toBe('Tâche introuvable')
  })

  it('conserve les erreurs SQL inattendues en 500', async () => {
    setupRpc({ error: { message: 'disk full' } })
    const response = await PATCH(request({ done: true }), { params: { taskId: TASK_ID } })
    expect(response.status).toBe(500)
    expect((await response.json()).error).toContain('disk full')
  })

  it('refuse un identifiant non numérique avant tout appel RPC', async () => {
    const rpc = setupRpc({ data: {} })
    const response = await PATCH(request({ done: true }), { params: { taskId: 'unknown' } })
    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('refuse un corps sans booléen done', async () => {
    const rpc = setupRpc({ data: {} })
    const response = await PATCH(request({ done: 'oui' }), { params: { taskId: TASK_ID } })
    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })
})
