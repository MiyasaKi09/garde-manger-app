/**
 * Cache mémoire + disque pour les pages qui lisent Supabase EN DIRECT
 * (stock, recettes) — non couvertes par le cache de authFetch.
 *
 * Au montage, `readCache(key)` rend instantanément la dernière donnée vue
 * (même après rechargement de l'app, via localStorage), puis la page rafraîchit
 * en arrière-plan et appelle `writeCache(key, data)`. Les mutations rechargent
 * la page (qui ré-écrit le cache), donc pas d'invalidation explicite nécessaire.
 */
import { hydrate, schedulePersist, dropPersist } from '@/lib/cachePersist'

const STORAGE_KEY = 'myko:pagecache:v1'
const MAX_AGE = 24 * 60 * 60 * 1000 // 24 h : on rend l'état d'hier, on rafraîchit derrière

const CACHE = new Map() // key -> { ts, data }
for (const [k, v] of hydrate(STORAGE_KEY, MAX_AGE)) CACHE.set(k, v)

const persist = () => schedulePersist(STORAGE_KEY, () => [...CACHE.entries()])

export function readCache(key) {
  const e = CACHE.get(key)
  if (!e) return null
  if (Date.now() - e.ts > MAX_AGE) { CACHE.delete(key); return null }
  return e.data
}

export function writeCache(key, data) {
  CACHE.set(key, { ts: Date.now(), data })
  persist()
}

export function invalidateCache(key) {
  if (key) CACHE.delete(key)
  else CACHE.clear()
  persist()
}

/** Vide tout (mémoire + disque) — appelé au changement de compte. */
export function clearPageCache() {
  CACHE.clear()
  dropPersist(STORAGE_KEY)
}
