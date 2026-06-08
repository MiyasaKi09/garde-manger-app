/**
 * Persistance disque (localStorage) des caches mémoire → la PREMIÈRE visite d'une
 * page après ouverture/rechargement de l'app s'affiche instantanément depuis le
 * dernier état connu, puis se rafraîchit en arrière-plan.
 *
 * Tolérant aux pannes : tout est try/catch (quota, mode privé, SSR sans window).
 */
const isClient = typeof window !== 'undefined'
const timers = {}

/** Renvoie le tableau d'entrées [key, value] persisté (filtré par âge), ou []. */
export function hydrate(storageKey, maxAgeMs) {
  if (!isClient) return []
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    const cutoff = Date.now() - maxAgeMs
    return arr.filter(([, v]) => v && typeof v.ts === 'number' && v.ts >= cutoff)
  } catch {
    return []
  }
}

/** Persiste (throttle 500 ms) le résultat de getEntries() — un tableau [key,value]. */
export function schedulePersist(storageKey, getEntries) {
  if (!isClient) return
  clearTimeout(timers[storageKey])
  timers[storageKey] = setTimeout(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(getEntries())) } catch { /* quota / privé */ }
  }, 500)
}

export function dropPersist(storageKey) {
  if (!isClient) return
  try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
}
