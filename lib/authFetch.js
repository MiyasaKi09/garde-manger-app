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
 * - Les clés incluent l'identifiant du compte : aucun partage entre utilisateurs.
 * - Un simple renouvellement du jeton ne vide plus le cache persistant.
 */

const STORAGE_KEY = 'myko:authcache:v2'
const LEGACY_STORAGE_KEY = 'myko:authcache:v1'
const MAX_AGE = 24 * 60 * 60 * 1000 // 24 h : on rend l'état d'hier puis on rafraîchit

const GET_CACHE = new Map()   // userId:url -> { ts, status, ok, contentType, body }
const INFLIGHT = new Map()    // userId:url -> Promise<entry>
let lastIdentity // undefined au premier appel ; ne jamais purger le cache hydraté à ce moment-là

// Les anciennes entrées n'étaient pas isolées par compte : elles ne doivent
// jamais être reprises après la migration vers v2.
dropPersist(LEGACY_STORAGE_KEY)
for (const [key, value] of hydrate(STORAGE_KEY, MAX_AGE)) GET_CACHE.set(key, value)

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
  const promise = networkFetch(url, options, session)
    .then((entry) => {
      if (entry.ok) {
        GET_CACHE.set(key, entry)
        persist()
      }
      return entry
    })
    .catch(() => null)
    .finally(() => INFLIGHT.delete(key))
  INFLIGHT.set(key, promise)
}

function clearAllCaches() {
  GET_CACHE.clear()
  INFLIGHT.clear()
  dropPersist(STORAGE_KEY)
  clearPageCache()
}

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const identity = session?.user?.id || (session?.access_token ? 'authenticated' : 'anonymous')

  // Au premier appel, le cache v2 est déjà cloisonné par user_id : on le garde.
  // Ensuite seulement, un vrai changement de compte/login/logout le purge.
  if (lastIdentity === undefined) {
    lastIdentity = identity
  } else if (identity !== lastIdentity) {
    clearAllCaches()
    lastIdentity = identity
  }

  // Mutations : passe-plat + invalidation du cache mémoire.
  if (!isGet(options)) {
    clearAllCaches()
    const base = session?.access_token
      ? { ...options, headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` } }
      : { ...options, credentials: 'include' }
    return fetch(url, base)
  }

  const key = `${identity}:${url}`
  const cached = GET_CACHE.get(key)

  // Lecture explicitement fraîche après une mutation : ne jamais rendre
  // l'instantané SWR. La réponse réseau devient le nouvel instantané.
  if (options.cache === 'no-store') {
    const entry = await networkFetch(url, options, session)
    if (entry.ok) {
      GET_CACHE.set(key, entry)
      persist()
    }
    return buildResponse(entry)
  }

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
  const promise = networkFetch(url, options, session)
    .then((entry) => {
      if (entry.ok) {
        GET_CACHE.set(key, entry)
        persist()
      }
      return entry
    })
    .finally(() => INFLIGHT.delete(key))
  INFLIGHT.set(key, promise)
  const entry = await promise
  return buildResponse(entry)
}

/** À appeler après une écriture faite hors authFetch (ex. insert Supabase direct). */
export function invalidateAuthCache() {
  clearAllCaches()
}
