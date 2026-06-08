import { supabase } from '@/lib/supabaseClient'

/**
 * authFetch — fetch authentifié (Bearer depuis la session locale) avec un cache
 * « stale-while-revalidate » + déduplication des requêtes GET en vol.
 *
 * Objectif perçu : revenir sur une page déjà visitée s'affiche INSTANTANÉMENT
 * (on rend le cache tout de suite, on rafraîchit en arrière-plan). Les mutations
 * (POST/PATCH/PUT/DELETE) vident le cache pour ne jamais servir de données périmées.
 * Pages concernées : accueil, planning, courses, nutrition (celles qui passent par
 * les routes /api/*). Le stock/les recettes lisent Supabase directement et ne sont
 * donc pas touchés par ce cache.
 */

const GET_CACHE = new Map()   // url -> { ts, status, ok, contentType, body }
const INFLIGHT = new Map()    // url -> Promise<entry>
const MAX_AGE = 120_000       // au-delà, on refait un fetch bloquant
let lastToken = null          // pour vider le cache au changement de compte

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
    .then(entry => { if (entry.ok) GET_CACHE.set(key, entry); return entry })
    .catch(() => null)
    .finally(() => INFLIGHT.delete(key))
  INFLIGHT.set(key, p)
}

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  // Changement de compte (login/logout) → on vide le cache pour ne pas fuiter.
  const token = session?.access_token || null
  if (token !== lastToken) { GET_CACHE.clear(); INFLIGHT.clear(); lastToken = token }

  // Mutations : passe-plat + invalidation totale (les données ont pu changer).
  if (!isGet(options)) {
    GET_CACHE.clear()
    const base = token
      ? { ...options, headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` } }
      : { ...options, credentials: 'include' }
    return fetch(url, base)
  }

  const key = url
  const cached = GET_CACHE.get(key)

  // Frais en cache → on rend tout de suite + rafraîchit en arrière-plan (SWR).
  if (cached && Date.now() - cached.ts < MAX_AGE) {
    revalidate(key, url, options, session)
    return buildResponse(cached)
  }

  // Miss (ou trop vieux) → on déduplique le fetch réseau.
  if (INFLIGHT.has(key)) {
    const entry = await INFLIGHT.get(key)
    if (entry) return buildResponse(entry)
  }
  const p = networkFetch(url, options, session)
    .then(entry => { if (entry.ok) GET_CACHE.set(key, entry); return entry })
    .finally(() => INFLIGHT.delete(key))
  INFLIGHT.set(key, p)
  const entry = await p
  return buildResponse(entry)
}

/** À appeler après une écriture faite hors authFetch (ex. insert Supabase direct). */
export function invalidateAuthCache() {
  GET_CACHE.clear()
  INFLIGHT.clear()
}
