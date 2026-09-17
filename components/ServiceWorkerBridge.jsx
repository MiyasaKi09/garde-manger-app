'use client'

import { useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'
import { supabase } from '@/lib/supabaseClient'
import {
  declarerPlanCourant,
  enregistrerServiceWorker,
  purgerLeCache,
  serviceWorkerDisponible,
} from '@/lib/pwa/serviceWorkerClient'

/**
 * ServiceWorkerBridge — le seul endroit d'où le service worker est branché (3.7).
 *
 * POURQUOI CE COMPOSANT EXISTE
 *
 * `public/manifest.webmanifest`, `public/sw.js` et `lib/pwa/serviceWorkerClient.js`
 * peuvent être parfaitement écrits et ne rien faire du tout : un manifeste que le
 * document ne référence pas ne rend l'application installable sur aucun
 * téléphone, et un service worker que personne n'enregistre n'intercepte rien.
 * Le manifeste est référencé par `app/layout.js` ; l'enregistrement est ici,
 * parce qu'il exige `useEffect` et que `app/layout.js` doit rester un composant
 * serveur.
 *
 * TROIS RESPONSABILITÉS, ET AUCUNE AUTRE
 *
 *   1. Enregistrer `/sw.js` — en production et en contexte sécurisé seulement.
 *   2. Déclarer l'identifiant de la version de plan active. C'est lui qui
 *      VERSIONNE le cache : une semaine republiée en a un autre, et le service
 *      worker efface alors tout ce qu'il gardait de la précédente. Sans cette
 *      déclaration, le cache ne saurait pas de quelle semaine il date — et le
 *      plan a écrit noir sur blanc qu'un cache qui sert une semaine périmée est
 *      pire que pas de cache.
 *   3. Vider le cache quand la session change. Deux personnes partagent parfois
 *      un téléphone, et les réponses d'API sont gardées par URL, pas par compte :
 *      le garde-manger de l'une n'a rien à faire dans le cache de l'autre.
 *
 * EN DÉVELOPPEMENT, ON DÉSENREGISTRE AU LIEU D'ENREGISTRER. `next dev` sert
 * `/_next/static/` sous des URL qui ne portent pas l'empreinte du contenu, et
 * le service worker les sert d'abord depuis le cache : un rechargement à chaud
 * remonterait alors l'ancien module. Un service worker installé une fois survit
 * aux rechargements — d'où le désenregistrement explicite, et pas seulement
 * l'abstention.
 */

/** Ce que la page sait de la semaine publiée : rien d'autre n'est demandé. */
async function identifiantDuPlanActif() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  const reponse = await authFetch('/api/planning/imports')
  if (!reponse.ok) return null
  const charge = await reponse.json().catch(() => null)
  // Les imports arrivent du plus récent au plus ancien (`order created_at desc`).
  // On ne devine pas « le bon » : c'est celui que les écrans ouvrent.
  return charge?.imports?.[0]?.active_plan_version_id || null
}

export default function ServiceWorkerBridge() {
  useEffect(() => {
    let vivant = true

    if (process.env.NODE_ENV !== 'production') {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations?.()
          .then((enregistrements) => enregistrements.forEach((e) => e.unregister()))
          .catch(() => {})
      }
      return undefined
    }

    if (!serviceWorkerDisponible()) return undefined

    const brancher = async () => {
      const enregistrement = await enregistrerServiceWorker()
      if (!enregistrement || !vivant) return
      // L'identifiant est déclaré même quand il est nul : le service worker
      // range alors sous « sans-plan », et la première publication effacera ce
      // cache-là comme les autres. Taire l'absence reviendrait à laisser le
      // cache d'avant la publication passer pour celui d'après.
      let planId = null
      try { planId = await identifiantDuPlanActif() } catch { planId = null }
      if (!vivant) return
      await declarerPlanCourant(planId)
    }

    // Après le premier rendu, jamais pendant : l'enregistrement d'un service
    // worker n'a aucune raison de disputer le réseau à l'affichage.
    const auRepos = (typeof window !== 'undefined' && window.requestIdleCallback)
      ? window.requestIdleCallback
      : (rappel) => setTimeout(rappel, 800)
    auRepos(() => { brancher().catch(() => {}) })

    // Une session qui s'en va ou qui change de personne emporte le cache. On
    // écoute l'événement plutôt que de brancher chaque bouton de déconnexion :
    // il y en a deux aujourd'hui, et le troisième oublierait de purger.
    let compteConnu = null
    const { data: abonnement } = supabase.auth.onAuthStateChange((evenement, session) => {
      const compte = session?.user?.id || null
      if (evenement === 'SIGNED_OUT' || (compteConnu && compte && compte !== compteConnu)) {
        purgerLeCache().catch(() => {})
      }
      if (compte) compteConnu = compte
      if (evenement === 'SIGNED_IN') brancher().catch(() => {})
    })

    return () => {
      vivant = false
      abonnement?.subscription?.unsubscribe?.()
    }
  }, [])

  return null
}
