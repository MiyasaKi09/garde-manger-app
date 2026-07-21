import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { POST } from '@/app/api/planning/batch/generate/route'
import { authenticateRequest } from '@/lib/apiAuth'

describe('POST /api/planning/batch/generate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('refuses the obsolete second planning grain without mutating data', async () => {
    const supabase = { from: vi.fn(() => { throw new Error('aucune écriture autorisée') }) }
    authenticateRequest.mockResolvedValue({ supabase, user: { id: 'u1' }, error: null })

    const response = await POST({ json: async () => ({ importId: 42 }) })
    expect(response.status).toBe(410)
    expect(await response.json()).toMatchObject({ code: 'canonical_batch_only' })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('still requires authentication', async () => {
    authenticateRequest.mockResolvedValue({ supabase: null, user: null, error: 'Non authentifié' })
    const response = await POST({ json: async () => ({}) })
    expect(response.status).toBe(401)
  })
})
