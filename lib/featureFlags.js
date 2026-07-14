/**
 * Feature flags Myko — lus UNIQUEMENT côté serveur (process.env). Réf. plan PR 1,
 * §9.12. Ne jamais exposer l'objet brut au client : passer par un ViewModel.
 * Valeur par défaut : désactivé. Un flag est actif si sa variable vaut
 * "1", "true" ou "on" (insensible à la casse).
 */
export const FLAG_NAMES = [
  'MYKO_CLOSED_LOOP_READS',
  'MYKO_CLOSED_LOOP_WRITES',
  'MYKO_TODAY_V2',
  'MYKO_PLANNER_V2',
  'MYKO_SHOPPING_V2',
  'MYKO_FEEDBACK_V2',
]

function truthy(raw) {
  const v = String(raw ?? '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'on' || v === 'yes'
}

/** Un flag est-il actif ? (lecture serveur) */
export function getFlag(name, env = process.env) {
  return truthy(env?.[name])
}

/** Tous les flags connus → booléens (pour construire un ViewModel serveur). */
export function getFlags(env = process.env) {
  const out = {}
  for (const name of FLAG_NAMES) out[name] = truthy(env?.[name])
  return out
}
