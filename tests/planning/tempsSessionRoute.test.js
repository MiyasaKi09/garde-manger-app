import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { GET, POST } from '@/app/api/planning/session-time/route'
import { authenticateRequest } from '@/lib/apiAuth'

/**
 * CONSIGNER LE TEMPS RÉELLEMENT PASSÉ — livrable 2.4, seconde moitié du
 * critère : « l'écart entre annoncé et constaté est consigné après chaque
 * session réelle ».
 *
 * CE QUE CE FICHIER EXIGE :
 *   — la route n'écrit QUE dans `cooking_session_times`. Le §9.3 du plan pose
 *     l'interdit : « zéro écriture dans les tables de planning hors
 *     publication atomique ». Une table de plus touchée ici et le test échoue ;
 *   — elle recopie l'annonce telle qu'elle a été affichée, sans la recalculer ;
 *   — elle rend l'écart CALCULÉ, jamais stocké ;
 *   — une saisie invalide est refusée avec son motif, jamais devinée.
 */

const VERSION = '3f1b9c2a-0000-4000-8000-000000000001'

/** Client Supabase minimal, qui NOTE chaque table touchée. */
function fauxClient({ data = null, error = null } = {}) {
  const tables = []
  const upserts = []
  const from = vi.fn((table) => {
    tables.push(table)
    return {
      upsert: (ligne) => {
        upserts.push(ligne)
        return { select: () => ({ single: async () => ({ data: data || ligne, error }) }) }
      },
      select: () => ({
        eq: () => ({ order: async () => ({ data: data || [], error }) }),
      }),
    }
  })
  return { client: { from }, tables, upserts }
}

describe('POST /api/planning/session-time', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exige une authentification', async () => {
    authenticateRequest.mockResolvedValue({ supabase: null, user: null, error: 'Non authentifié' })
    const response = await POST({ json: async () => ({}) })
    expect(response.status).toBe(401)
  })

  it('consigne l’annonce et le constat, et rend l’écart calculé', async () => {
    const { client, tables, upserts } = fauxClient()
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })

    const response = await POST({
      json: async () => ({
        plan_version_id: VERSION,
        session_date: '2026-09-27',
        session_window: 'matin',
        announced_active_minutes: 120,
        observed_active_minutes: 336,
        note: 'Le riz a pris deux fois plus longtemps.',
      }),
    })
    expect(response.status).toBe(200)
    const corps = await response.json()

    // L'écart est CALCULÉ à la lecture, à partir des deux nombres qui le
    // produisent — il n'est pas stocké, et rien ne l'écrit dans la ligne.
    expect(corps.session.ecart).toEqual({ annonce: 120, constate: 336, minutes: 216, facteur: 2.8 })
    expect(upserts[0]).not.toHaveProperty('ecart')
    expect(upserts[0]).toMatchObject({
      user_id: 'u1',
      plan_version_id: VERSION,
      session_date: '2026-09-27',
      session_window: 'matin',
      announced_active_minutes: 120,
      observed_active_minutes: 336,
    })
    // UNE SEULE table touchée, et ce n'est aucune table de planning.
    expect(tables).toEqual(['cooking_session_times'])
  })

  it('refuse une saisie invalide avec son motif, sans rien écrire', async () => {
    const cas = [
      [{}, 'plan_version_id'],
      [{ plan_version_id: VERSION }, 'session_date'],
      [{ plan_version_id: VERSION, session_date: '2026-09-27', session_window: 'nuit' }, 'session_window'],
      [{
        plan_version_id: VERSION, session_date: '2026-09-27', session_window: 'soir',
        announced_active_minutes: 'beaucoup', observed_active_minutes: 30,
      }, 'announced_active_minutes'],
      [{
        plan_version_id: VERSION, session_date: '2026-09-27', session_window: 'soir',
        announced_active_minutes: 30, observed_active_minutes: 4000,
      }, 'observed_active_minutes'],
    ]
    for (const [corpsEnvoye, motif] of cas) {
      const { client, tables } = fauxClient()
      authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })
      const response = await POST({ json: async () => corpsEnvoye })
      expect(response.status, JSON.stringify(corpsEnvoye)).toBe(400)
      expect((await response.json()).error).toContain(motif)
      expect(tables).toEqual([])
    }
  })

  it('accepte une session de six heures : plafonner la saisie effacerait le cas à voir', async () => {
    const { client } = fauxClient()
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })
    const response = await POST({
      json: async () => ({
        plan_version_id: VERSION,
        session_date: '2026-09-27',
        session_window: 'soir',
        announced_active_minutes: 90,
        observed_active_minutes: 360,
      }),
    })
    expect(response.status).toBe(200)
    expect((await response.json()).session.ecart.minutes).toBe(270)
  })

  it('dit que la migration manque plutôt que d’échouer en silence', async () => {
    const { client } = fauxClient({ error: { code: '42P01', message: 'relation absente' } })
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })
    const response = await POST({
      json: async () => ({
        plan_version_id: VERSION,
        session_date: '2026-09-27',
        session_window: 'soir',
        announced_active_minutes: 90,
        observed_active_minutes: 95,
      }),
    })
    expect(response.status).toBe(503)
    expect((await response.json()).code).toBe('migration_required')
  })
})

describe('GET /api/planning/session-time', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rend les sessions chronométrées avec leur écart', async () => {
    const { client } = fauxClient({
      data: [{
        id: '1', plan_version_id: VERSION, session_date: '2026-09-27', session_window: 'matin',
        announced_active_minutes: 75, observed_active_minutes: 100, note: null,
      }],
    })
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })
    const response = await GET({ url: `https://myko.test/api/planning/session-time?plan_version_id=${VERSION}` })
    expect(response.status).toBe(200)
    const { sessions } = await response.json()
    expect(sessions[0].ecart).toMatchObject({ minutes: 25 })
  })

  it('refuse un identifiant de version qui n’en est pas un', async () => {
    const { client, tables } = fauxClient()
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })
    const response = await GET({ url: 'https://myko.test/api/planning/session-time?plan_version_id=42' })
    expect(response.status).toBe(400)
    expect(tables).toEqual([])
  })
})
