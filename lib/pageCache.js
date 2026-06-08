/**
 * Cache mémoire ultra-simple pour les pages qui lisent Supabase EN DIRECT
 * (stock, recettes) — non couvertes par le cache de authFetch.
 *
 * Usage : au montage, `readCache(key)` rend instantanément la dernière donnée vue
 * (revisite sans skeleton), puis la page rafraîchit en arrière-plan et appelle
 * `writeCache(key, data)`. Les mutations doivent appeler `invalidateCache(key)`.
 * Volontairement module-scoped (persiste entre navigations, vidé au reload).
 */
const CACHE = new Map() // key -> { ts, data }
const MAX_AGE = 120_000

export function readCache(key) {
  const e = CACHE.get(key)
  if (!e) return null
  if (Date.now() - e.ts > MAX_AGE) { CACHE.delete(key); return null }
  return e.data
}

export function writeCache(key, data) {
  CACHE.set(key, { ts: Date.now(), data })
}

export function invalidateCache(key) {
  if (key) CACHE.delete(key)
  else CACHE.clear()
}
