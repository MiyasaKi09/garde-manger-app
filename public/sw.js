/* eslint-disable no-restricted-globals */
/**
 * sw.js — le service worker de Myko (livrable 3.7).
 *
 * CE QU'IL DOIT RENDRE POSSIBLE, ET CE QU'IL NE DOIT JAMAIS FAIRE
 *
 * Possible : lire `/pantry` et la semaine publiée debout devant le frigo, ou
 * dans un magasin dont le sous-sol ne capte pas. C'est là qu'on tient un
 * garde-manger, pas au bureau.
 *
 * Jamais : servir une semaine périmée en la faisant passer pour l'actuelle. Le
 * plan le dit en toutes lettres, et c'est le risque qu'il a déclaré : un cache
 * qui ment est PIRE que pas de cache. Trois règles en découlent, et aucune
 * n'est négociable ici.
 *
 *   1. RÉSEAU D'ABORD, TOUJOURS. Aucune page, aucune réponse d'API n'est servie
 *      depuis le cache tant que le réseau peut répondre. Le cache n'est lu que
 *      lorsque la requête a échoué ou expiré. La seule exception est
 *      `RESSOURCES_IMMUABLES`, et elle est justifiée fichier par fichier, pas
 *      par une formule commode : `/_next/static/` porte l'empreinte du contenu
 *      dans son nom, donc une version différente a une URL différente ;
 *      `/icons/` et `/manifest.webmanifest` n'en portent PAS, et ils sont servis
 *      d'abord depuis le cache parce qu'une icône ou un nom d'application datés
 *      ne peuvent pas faire croire à un stock ou à une semaine qu'on n'a plus.
 *      Ils disparaissent de toute façon avec le plan (règle 2).
 *
 *   2. LE CACHE EST VERSIONNÉ PAR IDENTIFIANT DE PLAN. Le nom du cache porte
 *      l'identifiant de la version de plan active (`active_plan_version_id`).
 *      Dès que la page en déclare un autre — c'est-à-dire dès qu'une semaine est
 *      republiée — tous les caches des plans précédents sont SUPPRIMÉS. Une
 *      semaine périmée ne peut pas survivre à la publication de sa remplaçante,
 *      même hors réseau : elle n'est plus là.
 *
 *   3. CE QUI SORT DU CACHE LE DIT. Toute réponse servie depuis le cache porte
 *      `x-myko-hors-reseau` et la date `x-myko-cache` de son enregistrement.
 *      RÉSERVE, et elle est écrite ici plutôt que tue : ces deux en-têtes sont
 *      ÉMIS, et aucun écran ne les lit encore. `etatDuCache()` en
 *      `lib/pwa/serviceWorkerClient.js` existe pour cela et n'a pas d'appelant.
 *      Un bandeau « lu hors réseau, enregistré le … » reste donc à poser ; d'ici
 *      là, la donnée servie hors réseau est datée dans la réponse et pas à
 *      l'écran. Ce qui est garanti sans ce bandeau, et qui est l'essentiel :
 *      elle appartient à la semaine EN COURS, sans quoi la règle 2 l'aurait
 *      effacée.
 *
 * CE QU'IL NE REND PAS LISIBLE HORS RÉSEAU, ET C'EST UNE LIMITE RÉELLE
 *
 * Une navigation interne de l'App Router ne redemande pas le document : elle
 * demande la charge RSC de la page (`?_rsc=…`), qui n'est ni une navigation ni
 * une des lectures énumérées plus bas, et qui n'est donc pas gardée. Passer
 * d'un écran à l'autre sans réseau ne marche pas. Ouvrir ou recharger
 * directement `/pantry`, `/planning` ou `/courses` — ce qu'on fait en lançant
 * l'application depuis l'écran d'accueil — marche. C'est le geste qui compte
 * devant le frigo, mais ce n'est pas tous les gestes.
 *
 * CE QU'IL NE MET PAS EN CACHE
 *
 * Rien qui ne soit une requête GET de même origine et une réponse 200 propre.
 * Donc : aucune mutation, aucune redirection (une réponse de redirection vers
 * `/login` mise en cache enfermerait l'application hors ligne sur sa page de
 * connexion), aucune réponse `no-store`, aucune réponse d'erreur. Et la
 * déconnexion vide tout : `myko/purger` est envoyé par la page à la fin de
 * session, parce que deux personnes partagent parfois un téléphone et que le
 * garde-manger de l'une n'a rien à faire dans le cache de l'autre.
 */

/**
 * Version de CE fichier. Elle change quand la logique change, pas quand le plan
 * change : le plan, lui, est la seconde moitié du nom du cache.
 */
const VERSION_SW = 'v1'
const PREFIXE_CACHE = 'myko-'

/** Tant qu'aucune page n'a déclaré de plan, le cache porte ce nom-là. */
const PLAN_INDETERMINE = 'sans-plan'

/**
 * Le délai au-delà duquel on cesse d'attendre le réseau et on lit le cache.
 *
 * Sans délai, « réseau d'abord » se comporte très mal dans le cas qui nous
 * intéresse le plus : un téléphone accroché à un réseau qui ne transporte rien
 * (sous-sol de magasin, cuisine au fond de l'appartement). La requête n'échoue
 * pas, elle pend — et l'écran reste blanc. Trois secondes et demie est le point
 * où l'on préfère une donnée datée, ANNONCÉE COMME TELLE, à une page vide.
 */
const DELAI_RESEAU_MS = 3500

/** Les pages qu'on veut pouvoir relire hors réseau. Rien d'autre n'est gardé. */
const PAGES_HORS_RESEAU = ['/pantry', '/planning', '/courses']

/**
 * Les lectures d'API qui nourrissent ces pages. Préfixes, et GET seulement.
 * `/api/auth` et tout ce qui écrit en sont volontairement absents.
 */
const LECTURES_HORS_RESEAU = [
  '/api/pantry',
  '/api/planning/imports',
  '/api/courses',
  '/api/nutrition/goals',
]

/** Ressources à empreinte : leur URL change avec leur contenu. */
const RESSOURCES_IMMUABLES = ['/_next/static/', '/icons/', '/manifest.webmanifest']

const nomDuCache = (plan) => `${PREFIXE_CACHE}${VERSION_SW}-${plan}`
const PREFIXE_VERSION = `${PREFIXE_CACHE}${VERSION_SW}-`

/**
 * Un chemin est couvert par un préfixe s'il l'est exactement, ou s'il en est un
 * descendant. Écrit ainsi et pas en `startsWith(prefixe)` nu : `/api/courses`
 * ne doit pas couvrir une future `/api/coursesRapides`, et `/pantry` ne doit pas
 * couvrir `/pantry-archive`. Un préfixe déjà terminé par `/` se compare tel quel.
 */
const commencePar = (chemin, prefixes) => prefixes.some((prefixe) => (prefixe.endsWith('/')
  ? chemin.startsWith(prefixe)
  : chemin === prefixe || chemin.startsWith(`${prefixe}/`)))

/**
 * LE PLAN COURANT SURVIT À L'EXTINCTION DU SERVICE WORKER, ET IL LE DOIT.
 *
 * Un service worker est arrêté dès qu'il est au repos, et relancé à la requête
 * suivante — module rechargé, variables remises à zéro. Or c'est la NAVIGATION
 * qui arrive en premier : la page ne peut pas déclarer son plan avant d'avoir
 * été servie. Une variable simple aurait donc valu `sans-plan` à chaque
 * réouverture, on aurait cherché la copie gardée dans un cache vide, et
 * l'écran « hors réseau » serait sorti à tous les coups. Le critère
 * — `/pantry` et la semaine publiée lisibles hors réseau — aurait été tenu par
 * le code et faux sur le téléphone.
 *
 * L'identifiant est donc relu du SEUL endroit qui survit : le nom du cache
 * lui-même. `myko/plan` matérialise `myko-<version>-<plan>` même vide, et au
 * démarrage suivant on l'y retrouve. Zéro cache : rien n'a encore été déclaré.
 * Plusieurs : un état qu'on ne sait pas attribuer, donc on les jette tous —
 * une copie dont on ignore de quelle semaine elle date est exactement ce que ce
 * fichier s'interdit de servir.
 */
let planCourant = null

async function planRetabli() {
  if (planCourant !== null) return planCourant
  const miens = (await caches.keys()).filter((nom) => nom.startsWith(PREFIXE_VERSION))
  if (miens.length === 1) planCourant = miens[0].slice(PREFIXE_VERSION.length)
  else {
    planCourant = PLAN_INDETERMINE
    if (miens.length > 1) await Promise.all(miens.map((nom) => caches.delete(nom)))
  }
  return planCourant
}

/** Le cache de la version de plan active, ouvert (et créé) à la demande. */
const cacheCourant = async () => caches.open(nomDuCache(await planRetabli()))

/** Supprime tous les caches Myko sauf celui qu'on garde (null = tous). */
async function purgerSauf(aGarder) {
  const noms = await caches.keys()
  await Promise.all(noms
    .filter((nom) => nom.startsWith(PREFIXE_CACHE) && nom !== aGarder)
    .map((nom) => caches.delete(nom)))
}

self.addEventListener('install', (evenement) => {
  // Aucun préchargement : on ne met en cache que ce qui a été réellement
  // demandé et servi par le réseau. Précharger des pages jamais visitées
  // reviendrait à fabriquer une copie hors ligne de données qu'on n'a pas.
  evenement.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil((async () => {
    // Un nouveau `VERSION_SW` invalide tous les caches de l'ancien : ils ne
    // portent pas le préfixe de version que `planRetabli` reconnaît, donc ils
    // ne sont pas adoptés, et cette purge les emporte.
    await purgerSauf(nomDuCache(await planRetabli()))
    await self.clients.claim()
  })())
})

/**
 * Le canal par lequel la page déclare l'identifiant du plan actif, demande
 * l'état du cache, ou ordonne sa purge.
 */
self.addEventListener('message', (evenement) => {
  const message = evenement.data
  if (!message || typeof message !== 'object') return

  const repondre = (charge) => {
    const port = evenement.ports && evenement.ports[0]
    if (port) port.postMessage(charge)
  }

  if (message.type === 'myko/plan') {
    const plan = message.planId ? String(message.planId) : PLAN_INDETERMINE
    evenement.waitUntil((async () => {
      if (plan !== await planRetabli()) {
        planCourant = plan
        // Le changement de plan EST la péremption : tout ce qui a été gardé
        // pour le plan précédent disparaît, y compris hors réseau. Le prix en
        // est connu et assumé : la page qui déclare le nouveau plan perd la
        // copie d'elle-même prise quelques instants plus tôt, et il faut la
        // rouvrir une fois en ligne pour la relire hors réseau. C'est le seul
        // ordre possible — la publication est postérieure à l'affichage — et
        // c'est moins grave que de garder l'ancienne semaine.
        await purgerSauf(nomDuCache(planCourant))
      }
      // Matérialisé même vide : c'est ce nom qui portera l'identifiant du plan
      // jusqu'au prochain réveil du service worker.
      await caches.open(nomDuCache(planCourant))
      repondre({ type: 'myko/plan-recu', planId: planCourant })
    })())
    return
  }

  if (message.type === 'myko/etat') {
    evenement.waitUntil((async () => repondre(await etatDuCache()))())
    return
  }

  if (message.type === 'myko/purger') {
    evenement.waitUntil((async () => {
      planCourant = PLAN_INDETERMINE
      await purgerSauf(null)
      repondre({ type: 'myko/purge', planId: planCourant, entrees: 0, enregistreLe: null })
    })())
  }
})

/** Ce que le cache courant contient, et de quand il date. */
async function etatDuCache() {
  const cache = await cacheCourant()
  const requetes = await cache.keys()
  let enregistreLe = null
  for (const requete of requetes) {
    const reponse = await cache.match(requete)
    const date = reponse && reponse.headers.get('x-myko-cache')
    if (date && (!enregistreLe || date > enregistreLe)) enregistreLe = date
  }
  return { type: 'myko/etat', planId: planCourant, entrees: requetes.length, enregistreLe }
}

/**
 * Recopie une réponse en y datant son enregistrement.
 *
 * Le corps est lu une fois puis réécrit : c'est le seul moyen d'ajouter un
 * en-tête à une réponse, et c'est ce qui permet à la page de dire « enregistré
 * le … » au lieu de laisser croire que la donnée est fraîche.
 *
 * La réponse reçue ici est TOUJOURS une copie prise avant que la page ne
 * commence à la lire : le corps est consommé, il ne peut pas l'être deux fois.
 */
async function dater(reponse, valeur) {
  const corps = await reponse.arrayBuffer()
  const entetes = new Headers(reponse.headers)
  entetes.set('x-myko-cache', valeur)
  return new Response(corps, { status: reponse.status, statusText: reponse.statusText, headers: entetes })
}

/** Une réponse digne d'être gardée : 200, même origine, et pas `no-store`. */
function gardable(reponse) {
  if (!reponse || !reponse.ok || reponse.status !== 200) return false
  if (reponse.type === 'opaque' || reponse.type === 'opaqueredirect') return false
  if (reponse.redirected) return false
  const controle = reponse.headers.get('cache-control') || ''
  return !/no-store/i.test(controle)
}

/**
 * Garde une COPIE de la réponse.
 *
 * `copie` est prise par l'appelant, de façon synchrone, avant que la réponse ne
 * parte à l'écran. C'est la seule fenêtre où `clone()` est légal : passé le
 * premier `await`, le navigateur a pu commencer à lire le corps original, et
 * cloner une réponse entamée lève. L'erreur aurait été avalée par le `.catch()`
 * de l'appelant — le cache ne se serait simplement jamais rempli, sans que rien
 * ne le dise, et l'application n'aurait rien eu à lire hors réseau.
 */
async function mettreEnCache(requete, copie) {
  if (!gardable(copie)) return
  const cache = await cacheCourant()
  await cache.put(requete, await dater(copie, new Date().toISOString()))
}

/** La réponse gardée, marquée comme telle pour que la page puisse le dire. */
async function depuisLeCache(requete) {
  const cache = await cacheCourant()
  const gardee = await cache.match(requete, { ignoreSearch: false })
  if (!gardee) return null
  const entetes = new Headers(gardee.headers)
  entetes.set('x-myko-hors-reseau', '1')
  return new Response(await gardee.arrayBuffer(), { status: 200, statusText: 'OK (cache Myko)', headers: entetes })
}

/** Le réseau, avec une borne de temps. Rejette au-delà de `DELAI_RESEAU_MS`. */
function reseauBorne(requete) {
  return new Promise((resoudre, rejeter) => {
    const minuteur = setTimeout(() => rejeter(new Error('delai_reseau')), DELAI_RESEAU_MS)
    fetch(requete).then(
      (reponse) => { clearTimeout(minuteur); resoudre(reponse) },
      (erreur) => { clearTimeout(minuteur); rejeter(erreur) },
    )
  })
}

/**
 * La page servie quand il n'y a ni réseau ni copie gardée.
 *
 * Elle ne montre aucune donnée, et elle le dit. Rendre une coquille vide
 * ressemblant à l'application ferait croire à un garde-manger vide.
 */
function pageHorsReseau() {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Myko — hors réseau</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;
         background:#F3EFE4; color:#181C16; font:16px/1.5 system-ui, -apple-system, sans-serif; }
  main { max-width:30rem; text-align:center; }
  h1 { font-size:1.35rem; margin:0 0 .6rem; }
  p { margin:0 0 .8rem; color:#4A5247; }
  button { font:inherit; padding:.6rem 1.1rem; border:1.5px solid #2F5D3A; border-radius:3px;
           background:#2F5D3A; color:#F3EFE4; cursor:pointer; }
</style></head><body><main>
<h1>Hors réseau</h1>
<p>Cet écran n’a pas encore été consulté sur ce téléphone : il n’y en a aucune copie à afficher.</p>
<p>Les écrans déjà ouverts au moins une fois — le garde-manger, la semaine, la liste — restent lisibles.</p>
<button onclick="location.reload()">Réessayer</button>
</main></body></html>`
  return new Response(html, {
    status: 503,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-myko-hors-reseau': '1' },
  })
}

/** Cache d'abord pour les seules ressources énumérées par `RESSOURCES_IMMUABLES`. */
async function immuable(requete, prolonger) {
  const gardee = await depuisLeCache(requete)
  if (gardee) return gardee
  const reponse = await fetch(requete)
  const copie = gardable(reponse) ? reponse.clone() : null
  if (copie) prolonger(mettreEnCache(requete, copie).catch(() => {}))
  return reponse
}

/**
 * Réseau d'abord. Le cache n'est lu que quand le réseau a échoué ou expiré, et
 * ce qu'il rend est marqué `x-myko-hors-reseau`.
 */
async function reseauDAbord(requete, estNavigation, prolonger) {
  try {
    const reponse = await reseauBorne(requete)
    // La copie est prise MAINTENANT, avant tout `await` : voir `mettreEnCache`.
    // On ne garde que ce qui est gardable ; l'échec de mise en cache ne doit
    // jamais empêcher la réponse réseau d'arriver à l'écran.
    //
    // L'écriture est confiée à `prolonger` (`event.waitUntil`) et non lâchée
    // dans le vide : un service worker est arrêté dès que l'événement est
    // réputé fini, et une promesse que personne ne retient peut être coupée en
    // chemin. C'est le PREMIER affichage d'un écran qui en paierait le prix —
    // celui dont on a le plus besoin, puisque c'est lui qui garnit le cache.
    const copie = gardable(reponse) ? reponse.clone() : null
    if (copie) prolonger(mettreEnCache(requete, copie).catch(() => {}))
    return reponse
  } catch {
    const gardee = await depuisLeCache(requete)
    if (gardee) return gardee
    if (estNavigation) return pageHorsReseau()
    return new Response(JSON.stringify({ error: 'hors_reseau' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-myko-hors-reseau': '1' },
    })
  }
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  let url
  try { url = new URL(requete.url) } catch { return }
  if (url.origin !== self.location.origin) return

  const chemin = url.pathname
  const estNavigation = requete.mode === 'navigate'
  // Le service worker reste vivant tant que les promesses confiées ici ne sont
  // pas tenues : c'est ainsi qu'une écriture de cache ne se fait pas couper.
  const prolonger = (promesse) => evenement.waitUntil(promesse)

  if (commencePar(chemin, RESSOURCES_IMMUABLES)) {
    evenement.respondWith(immuable(requete, prolonger))
    return
  }

  if (estNavigation && commencePar(chemin, PAGES_HORS_RESEAU)) {
    evenement.respondWith(reseauDAbord(requete, true, prolonger))
    return
  }

  if (commencePar(chemin, LECTURES_HORS_RESEAU)) {
    evenement.respondWith(reseauDAbord(requete, false, prolonger))
  }

  // Tout le reste passe au réseau sans que le service worker s'en mêle.
})
