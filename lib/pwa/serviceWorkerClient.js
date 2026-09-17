/**
 * serviceWorkerClient.js — le côté page du service worker (livrable 3.7).
 *
 * Trois messages, et rien d'autre :
 *   — `declarerPlanCourant(id)` dit quelle version de plan est active. C'est ce
 *     qui VERSIONNE le cache : un identifiant différent efface tout ce qui avait
 *     été gardé pour le précédent. Une semaine republiée ne peut donc pas
 *     survivre hors réseau sous les traits de la semaine en cours.
 *   — `etatDuCache()` demande de quand date ce qui est gardé, pour qu'un écran
 *     puisse l'annoncer au lieu de laisser croire à une donnée fraîche. AUCUN
 *     ÉCRAN NE L'APPELLE AUJOURD'HUI : la fonction est là, le bandeau qui
 *     l'afficherait reste à poser, et c'est dit plutôt que laissé croire.
 *   — `purgerLeCache()` vide tout à la déconnexion.
 *
 * Chaque fonction est sans effet — et sans erreur — là où il n'y a pas de
 * service worker : rendu serveur, navigateur qui n'en a pas, contexte non
 * sécurisé, ou développement (on ne l'enregistre pas en `next dev`, où il
 * intercepterait le rechargement à chaud).
 */

/** L'enregistrement n'a lieu qu'en production et en contexte sécurisé. */
export function serviceWorkerDisponible() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false
  return Boolean(window.isSecureContext)
}

/** Enregistre `/sw.js` à la racine, donc avec la portée de toute l'application. */
export async function enregistrerServiceWorker() {
  if (!serviceWorkerDisponible()) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    // Un enregistrement refusé n'empêche rien : l'application marche en ligne
    // exactement comme avant. On ne le signale pas à l'écran, parce qu'il n'y a
    // rien que l'utilisateur puisse en faire.
    return null
  }
}

/**
 * Envoie un message au service worker actif et attend sa réponse.
 * Rend `null` quand il n'y en a pas, ou qu'il ne répond pas à temps.
 */
function demander(message, delaiMs = 2000) {
  if (!serviceWorkerDisponible()) return Promise.resolve(null)
  return new Promise((resoudre) => {
    let repondu = false
    const fini = (valeur) => { if (!repondu) { repondu = true; resoudre(valeur) } }
    const minuteur = setTimeout(() => fini(null), delaiMs)

    navigator.serviceWorker.ready.then((enregistrement) => {
      const cible = enregistrement.active
      if (!cible) { clearTimeout(minuteur); fini(null); return }
      const canal = new MessageChannel()
      canal.port1.onmessage = (evenement) => { clearTimeout(minuteur); fini(evenement.data) }
      cible.postMessage(message, [canal.port2])
    }).catch(() => { clearTimeout(minuteur); fini(null) })
  })
}

/**
 * Déclare la version de plan active. C'est l'appel qui versionne le cache.
 *
 * Un identifiant absent (aucune semaine publiée) est déclaré tel quel : le
 * service worker range alors sous « sans-plan », et le premier plan publié
 * effacera ce cache-là comme les autres.
 */
export function declarerPlanCourant(planId) {
  return demander({ type: 'myko/plan', planId: planId || null })
}

/** De quand date ce qui est gardé : `{ planId, entrees, enregistreLe }`. */
export function etatDuCache() {
  return demander({ type: 'myko/etat' })
}

/** Vide tout. Appelé à la déconnexion : un téléphone se prête. */
export function purgerLeCache() {
  return demander({ type: 'myko/purger' })
}
