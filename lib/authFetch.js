import { supabase } from '@/lib/supabaseClient'
import { hydrate, schedulePersist, dropPersist } from '@/lib/cachePersist'
import { clearPageCache } from '@/lib/pageCache'

/**
 * authFetch — fetch authentifié (Bearer depuis la session locale) avec un cache
 * « stale-while-revalidate » persisté sur disque + déduplication des GET en vol.
 *
 * - Revisite (même après rechargement de l'app) : rendu INSTANTANÉ depuis le cache
 *   (mémoire puis localStorage), rafraîchi en arrière-plan.
 * - Mutations (POST/PATCH/PUT/DELETE) : vident le cache mémoire (les données ont
 *   pu changer) ; le prochain GET re-remplit le cache disque.
 * - Changement de compte : on vide tout (mémoire + disque, ce cache ET pageCache).
 * Concernés : accueil, planning, courses, nutrition (routes /api/*).
 */

const STORAGE_KEY = 'myko:authcache:v1'
const MAX_AGE = 24 * 60 * 60 * 1000 // 24 h : on rend l'état d'hier puis on rafraîchit

const GET_CACHE = new Map()   // url -> { ts, status, ok, contentType, body }
const INFLIGHT = new Map()    // url -> Promise<entry>
let lastToken = null

for (const [k, v] of hydrate(STORAGE_KEY, MAX_AGE)) GET_CACHE.set(k, v)

const persist = () => schedulePersist(STORAGE_KEY, () => [...GET_CACHE.entries()])
const isGet = (options) => (options.method || 'GET').toUpperCase() === 'GET'
const buildResponse = (entry) =>
  new Response(entry.body, { status: entry.status, headers: { 'Content-Type': entry.contentType || 'application/json' } })

async function networkFetch(url, options, session) {
  const base = session?.access_token
    ? { ...options, headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` } }
    : { ...options, credentials: 'include' }
  const res = await fetch(url, base)
  const body = await res.text()
  return {
    ts: Date.now(),
    status: res.status,
    ok: res.ok,
    contentType: res.headers.get('content-type') || 'application/json',
    body,
  }
}

function revalidate(key, url, options, session) {
  if (INFLIGHT.has(key)) return
  const p = networkFetch(url, options, session)
    .then(entry => { if (entry.ok) { GET_CACHE.set(key, entry); persist() } return entry })
    .catch(() => null)
    .finally(() => INFLIGHT.delete(key))
  INFLIGHT.set(key, p)
}

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  // Changement de compte (login/logout) → on vide tout pour ne pas fuiter.
  const token = session?.access_token || null
  if (token !== lastToken) {
    GET_CACHE.clear(); INFLIGHT.clear(); dropPersist(STORAGE_KEY); clearPageCache()
    lastToken = token
  }

  // Mutations : passe-plat + invalidation du cache mémoire.
  if (!isGet(options)) {
    GET_CACHE.clear()
    const base = token
      ? { ...options, headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` } }
      : { ...options, credentials: 'include' }
    return fetch(url, base)
  }

  const key = url
  const cached = GET_CACHE.get(key)

  // En cache (≤ 24 h) → rendu immédiat + rafraîchissement en arrière-plan (SWR).
  if (cached && Date.now() - cached.ts < MAX_AGE) {
    revalidate(key, url, options, session)
    return buildResponse(cached)
  }

  // Miss (ou trop vieux) → fetch réseau dédupliqué.
  if (INFLIGHT.has(key)) {
    const entry = await INFLIGHT.get(key)
    if (entry) return buildResponse(entry)
  }
  const p = networkFetch(url, options, session)
    .then(entry => { if (entry.ok) { GET_CACHE.set(key, entry); persist() } return entry })
    .finally(() => INFLIGHT.delete(key))
  INFLIGHT.set(key, p)
  const entry = await p
  return buildResponse(entry)
}

/** À appeler après une écriture faite hors authFetch (ex. insert Supabase direct). */
export function invalidateAuthCache() {
  GET_CACHE.clear()
  INFLIGHT.clear()
  dropPersist(STORAGE_KEY)
}
