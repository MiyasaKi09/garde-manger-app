import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * serviceWorker.test.js — la stratégie de `public/sw.js`, mise à l'épreuve.
 *
 * POURQUOI CE TEST EXISTE, ET CE QU'IL NE PEUT PAS DIRE
 *
 * Le plan n'autorise à livrer moins qu'à un seul endroit, et c'est celui-ci :
 * « un service worker qui sert une semaine périmée est pire que pas de service
 * worker ». Une affirmation pareille ne se tient pas par un commentaire ni par
 * une lecture attentive du fichier : elle se tient par des cas d'exécution. Le
 * fichier est donc chargé tel quel — le MÊME que celui servi au téléphone, à
 * l'octet près — dans une portée qui lui fournit un `self`, un `caches` et un
 * `fetch` que le test pilote. On lui envoie ensuite de vrais événements.
 *
 * Ce qu'il établit : réseau d'abord, repli daté, péremption par identifiant de
 * plan, survie du plan à l'extinction du service worker, et refus de mettre en
 * cache ce qui ne doit pas l'être.
 *
 * Ce qu'il n'établit PAS, et que seul un téléphone dirait : que le navigateur
 * accepte d'enregistrer le fichier, que le mode avion se comporte comme un
 * `fetch` qui rejette, et que la page reste lisible une fois l'application
 * détachée de son onglet. Aucune de ces trois choses n'est simulable ici, et
 * aucune n'est affirmée ailleurs.
 */

const SOURCE = readFileSync(fileURLToPath(new URL('../../public/sw.js', import.meta.url)), 'utf8')
const ORIGINE = 'https://myko.example'

// ── Le double de `CacheStorage` ──────────────────────────────────────────────
// Écrit à la main plutôt qu'emprunté : ce qui compte est qu'il SURVIVE à
// l'instance de service worker, comme le vrai, pour que le redémarrage se teste.

class FausseCache {
  constructor() { this.entrees = new Map() }
  async put(requete, reponse) { this.entrees.set(requete.url, reponse) }
  // Le vrai rend une réponse neuve à chaque appel : le corps d'une réponse ne
  // se lit qu'une fois, et on lit la même entrée dans plusieurs tests.
  async match(requete) {
    const gardee = this.entrees.get(requete.url)
    return gardee ? gardee.clone() : undefined
  }
  async keys() { return [...this.entrees.keys()].map((url) => ({ url, method: 'GET' })) }
}

class FausseCacheStorage {
  constructor() { this.ouverts = new Map() }
  async open(nom) {
    if (!this.ouverts.has(nom)) this.ouverts.set(nom, new FausseCache())
    return this.ouverts.get(nom)
  }
  async keys() { return [...this.ouverts.keys()] }
  async delete(nom) { return this.ouverts.delete(nom) }
  /** Ce que le disque contient réellement, pour les assertions. */
  inventaire() {
    return Object.fromEntries([...this.ouverts].map(([nom, cache]) => [nom, [...cache.entrees.keys()]]))
  }
}

/**
 * Charge `public/sw.js` dans une portée de fonction.
 *
 * `self`, `caches` et `fetch` sont des paramètres : ils masquent les globales de
 * Node à l'intérieur du fichier, sans que celui-ci ait à être modifié pour être
 * testable. Les `const` de haut niveau du fichier deviennent locales à cette
 * portée — c'est précisément ce qu'on veut, puisque deux instances doivent être
 * indépendantes l'une de l'autre tout en partageant le même `caches`.
 */
function instancier(stockage, reseau) {
  const ecouteurs = new Map()
  const self = {
    addEventListener(type, fonction) {
      if (!ecouteurs.has(type)) ecouteurs.set(type, [])
      ecouteurs.get(type).push(fonction)
    },
    location: { origin: ORIGINE },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  }
  // eslint-disable-next-line no-new-func
  new Function('self', 'caches', 'fetch', SOURCE)(self, stockage, reseau)

  /**
   * Joue un événement et attend tout ce qu'il a prolongé.
   *
   * `attendreDabord` est rendu à l'appelant plutôt qu'attendu ici : dans un vrai
   * navigateur, `waitUntil` prolonge la vie de l'événement APRÈS que
   * `respondWith` a rendu sa réponse. Attendre les deux dans le mauvais ordre
   * aurait laissé croire qu'une écriture de cache confiée à `waitUntil` n'avait
   * pas lieu.
   */
  const declencher = (type, evenement) => {
    const attentes = []
    evenement.waitUntil = (promesse) => attentes.push(promesse)
    for (const ecouteur of ecouteurs.get(type) || []) ecouteur(evenement)
    return attentes
  }

  return {
    /** Rend la réponse, ou `null` quand le service worker ne s'en est pas mêlé. */
    async requete(requete) {
      let servie = null
      const evenement = { request: requete, respondWith: (promesse) => { servie = promesse } }
      const attentes = declencher('fetch', evenement)
      const reponse = servie ? await servie : null
      await Promise.all(attentes)
      return reponse
    },
    async message(charge) {
      let reponse
      const port = { postMessage: (valeur) => { reponse = valeur } }
      await Promise.all(declencher('message', { data: charge, ports: [port] }))
      return reponse
    },
    activer: () => Promise.all(declencher('activate', {})),
    installer: () => Promise.all(declencher('install', {})),
  }
}

/** Une requête : un objet nu, parce que `new Request(url, { mode: 'navigate' })` lève. */
const navigation = (chemin) => ({ url: `${ORIGINE}${chemin}`, method: 'GET', mode: 'navigate' })
const lecture = (chemin) => ({ url: `${ORIGINE}${chemin}`, method: 'GET', mode: 'cors' })

const html = (corps, entetes = {}) => new Response(corps, {
  status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...entetes },
})

describe('le service worker sert le réseau d’abord, et ne garde que ce qu’il peut dater', () => {
  let stockage
  let servi        // ce que le réseau rend, réglable test par test
  let panne        // quand vrai, le réseau rejette
  let appels

  const reseau = async (requete) => {
    appels.push(requete.url)
    if (panne) throw new TypeError('Failed to fetch')
    return servi(requete)
  }

  beforeEach(() => {
    stockage = new FausseCacheStorage()
    panne = false
    appels = []
    servi = () => html('<h1>garde-manger — version fraîche</h1>')
  })

  async function pretAvecPlan(plan = 'plan-A') {
    const sw = instancier(stockage, reseau)
    await sw.installer()
    await sw.activer()
    await sw.message({ type: 'myko/plan', planId: plan })
    return sw
  }

  it('rend la réponse du réseau, et non la copie gardée, quand le réseau répond', async () => {
    const sw = await pretAvecPlan()

    servi = () => html('<h1>semaine du 21</h1>')
    await sw.requete(navigation('/pantry'))

    // Le réseau change d'avis : c'est LUI qu'on doit lire, pas ce qui a été gardé.
    servi = () => html('<h1>semaine du 28</h1>')
    const reponse = await sw.requete(navigation('/pantry'))

    expect(await reponse.text()).toContain('semaine du 28')
    expect(reponse.headers.get('x-myko-hors-reseau')).toBeNull()
    expect(appels.filter((url) => url.endsWith('/pantry'))).toHaveLength(2)
  })

  it('rend la copie gardée quand le réseau échoue, et le dit dans l’en-tête', async () => {
    const sw = await pretAvecPlan()
    servi = () => html('<h1>semaine du 21</h1>')
    await sw.requete(navigation('/pantry'))

    panne = true
    const reponse = await sw.requete(navigation('/pantry'))

    expect(await reponse.text()).toContain('semaine du 21')
    // C'est la règle 3 du fichier : ce qui sort du cache le dit, et la page peut
    // annoncer de quand ça date au lieu de laisser croire à une donnée fraîche.
    expect(reponse.headers.get('x-myko-hors-reseau')).toBe('1')
    expect(reponse.headers.get('x-myko-cache')).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('garde aussi les lectures d’API qui nourrissent ces écrans', async () => {
    const sw = await pretAvecPlan()
    servi = () => new Response(JSON.stringify({ lots: 12 }), {
      status: 200, headers: { 'content-type': 'application/json' },
    })
    await sw.requete(lecture('/api/pantry/lots'))

    panne = true
    const reponse = await sw.requete(lecture('/api/pantry/lots'))
    expect(await reponse.json()).toEqual({ lots: 12 })
    expect(reponse.headers.get('x-myko-hors-reseau')).toBe('1')
  })

  it('n’invente pas d’écran quand il n’a ni réseau ni copie', async () => {
    const sw = await pretAvecPlan()
    panne = true
    const reponse = await sw.requete(navigation('/pantry'))

    expect(reponse.status).toBe(503)
    const texte = await reponse.text()
    expect(texte).toContain('Hors réseau')
    // Une coquille vide ressemblant à l'application ferait croire à un
    // garde-manger vide. La page dit qu'elle n'a rien, elle ne montre rien.
    expect(texte).not.toMatch(/0\s*(lot|article)/i)
  })

  it('cesse d’attendre un réseau qui pend, et lit alors la copie gardée', async () => {
    // Le cas qui compte le plus : un téléphone accroché à un réseau qui ne
    // transporte rien. La requête n'échoue pas, elle pend — sans borne de temps,
    // « réseau d'abord » laisserait l'écran blanc au lieu de rendre la liste.
    const sw = await pretAvecPlan()
    servi = () => html('<h1>liste du 21</h1>')
    await sw.requete(navigation('/courses'))

    vi.useFakeTimers()
    try {
      servi = () => new Promise(() => {})   // ne se résout jamais
      const enCours = sw.requete(navigation('/courses'))
      await vi.advanceTimersByTimeAsync(4000)
      const reponse = await enCours
      expect(await reponse.text()).toContain('liste du 21')
      expect(reponse.headers.get('x-myko-hors-reseau')).toBe('1')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('une semaine périmée ne survit pas à sa remplaçante', () => {
  let stockage
  let panne
  let servi

  const reseau = async (requete) => {
    if (panne) throw new TypeError('Failed to fetch')
    return servi(requete)
  }

  beforeEach(() => {
    stockage = new FausseCacheStorage()
    panne = false
    servi = () => html('<h1>semaine du 21</h1>')
  })

  async function pret(plan) {
    const sw = instancier(stockage, reseau)
    await sw.installer()
    await sw.activer()
    await sw.message({ type: 'myko/plan', planId: plan })
    return sw
  }

  it('range sous un nom de cache qui porte l’identifiant du plan', async () => {
    await pret('plan-A')
    expect(Object.keys(stockage.inventaire()).some((nom) => nom.includes('plan-A'))).toBe(true)
  })

  it('efface tout ce qui appartenait au plan précédent, y compris hors réseau', async () => {
    const sw = await pret('plan-A')
    await sw.requete(navigation('/planning'))
    expect(JSON.stringify(stockage.inventaire())).toContain('/planning')

    // Une semaine est republiée : l'application déclare le nouvel identifiant.
    await sw.message({ type: 'myko/plan', planId: 'plan-B' })

    // Ce qui était gardé pour plan-A n'existe plus nulle part.
    const inventaire = stockage.inventaire()
    expect(Object.keys(inventaire).filter((nom) => nom.includes('plan-A'))).toEqual([])
    expect(JSON.stringify(inventaire)).not.toContain('/planning')

    // Et hors réseau, on obtient l'aveu, pas l'ancienne semaine.
    panne = true
    const reponse = await sw.requete(navigation('/planning'))
    expect(reponse.status).toBe(503)
    expect(await reponse.text()).toContain('Hors réseau')
  })

  it('garde la copie quand le plan déclaré est le même : pas de purge gratuite', async () => {
    const sw = await pret('plan-A')
    await sw.requete(navigation('/pantry'))
    await sw.message({ type: 'myko/plan', planId: 'plan-A' })

    panne = true
    const reponse = await sw.requete(navigation('/pantry'))
    expect(reponse.headers.get('x-myko-hors-reseau')).toBe('1')
  })

  it('retrouve son plan après une extinction, sans quoi rien ne serait lisible hors réseau', async () => {
    // LE CAS QUI DÉCIDE DU LIVRABLE. Un service worker est arrêté dès qu'il est
    // au repos et relancé à la requête suivante, variables remises à zéro. Or la
    // NAVIGATION arrive avant que la page n'ait pu déclarer son plan : si
    // l'identifiant n'était pas retrouvé tout seul, on chercherait la copie dans
    // un cache vide et l'écran « hors réseau » sortirait à chaque réouverture.
    // Le critère aurait été tenu par le code et faux sur le téléphone.
    const premier = await pret('plan-A')
    await premier.requete(navigation('/pantry'))

    // Le navigateur éteint le service worker : nouvelle instance, même disque.
    const second = instancier(stockage, reseau)
    panne = true
    const reponse = await second.requete(navigation('/pantry'))

    expect(await reponse.text()).toContain('semaine du 21')
    expect(reponse.headers.get('x-myko-hors-reseau')).toBe('1')
  })

  it('jette ce qu’il ne sait pas attribuer plutôt que de le servir', async () => {
    // Deux caches de la même version : un état qu'on ne sait pas rattacher à une
    // semaine. Une copie dont on ignore de quand elle date est exactement ce que
    // ce fichier s'interdit de servir.
    const cacheA = await stockage.open('myko-v1-plan-A')
    await cacheA.put({ url: `${ORIGINE}/pantry` }, html('<h1>vieille semaine</h1>'))
    const cacheB = await stockage.open('myko-v1-plan-B')
    await cacheB.put({ url: `${ORIGINE}/pantry` }, html('<h1>autre vieille semaine</h1>'))

    const sw = instancier(stockage, reseau)
    panne = true
    const reponse = await sw.requete(navigation('/pantry'))

    expect(reponse.status).toBe(503)
    expect(Object.keys(stockage.inventaire()).filter((nom) => nom.startsWith('myko-v1-plan'))).toEqual([])
  })

  it('vide tout à la demande : un téléphone se prête', async () => {
    const sw = await pret('plan-A')
    await sw.requete(navigation('/pantry'))
    await sw.message({ type: 'myko/purger' })

    expect(Object.keys(stockage.inventaire()).filter((nom) => nom.startsWith('myko-'))).toEqual([])
    panne = true
    expect((await sw.requete(navigation('/pantry'))).status).toBe(503)
  })

  it('dit ce qu’il garde et de quand cela date', async () => {
    const sw = await pret('plan-A')
    await sw.requete(navigation('/pantry'))
    const etat = await sw.message({ type: 'myko/etat' })

    expect(etat.planId).toBe('plan-A')
    expect(etat.entrees).toBe(1)
    expect(etat.enregistreLe).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('ce qu’il refuse de garder, et ce dont il ne se mêle pas', () => {
  let stockage
  let servi

  const reseau = async (requete) => servi(requete)

  beforeEach(async () => {
    stockage = new FausseCacheStorage()
    servi = () => html('<h1>ok</h1>')
  })

  async function pret() {
    const sw = instancier(stockage, reseau)
    await sw.installer()
    await sw.activer()
    await sw.message({ type: 'myko/plan', planId: 'plan-A' })
    return sw
  }

  const gardees = () => JSON.stringify(stockage.inventaire())

  it('ne se mêle pas des écritures', async () => {
    const sw = await pret()
    const reponse = await sw.requete({ url: `${ORIGINE}/api/pantry/lots`, method: 'POST', mode: 'cors' })
    // `null` : aucun `respondWith`, la requête part au réseau sans lui.
    expect(reponse).toBeNull()
  })

  it('ne se mêle pas d’une autre origine', async () => {
    const sw = await pret()
    expect(await sw.requete({ url: 'https://ailleurs.example/api/pantry', method: 'GET', mode: 'cors' })).toBeNull()
  })

  it('ne se mêle ni de l’authentification ni des écrans qu’il ne garde pas', async () => {
    const sw = await pret()
    for (const chemin of ['/api/auth/session', '/settings/security', '/api/routine/redaction']) {
      expect(await sw.requete(lecture(chemin)), chemin).toBeNull()
    }
  })

  it('ne confond pas un préfixe avec un chemin qui commence pareil', async () => {
    // `/api/courses` ne doit pas couvrir une future `/api/coursesRapides`, ni
    // `/pantry` couvrir `/pantry-archive` : un `startsWith` nu l'aurait fait, et
    // on aurait gardé hors réseau des réponses qu'on n'a jamais décidé de garder.
    const sw = await pret()
    expect(await sw.requete(lecture('/api/coursesRapides')), '/api/coursesRapides').toBeNull()
    expect(await sw.requete(navigation('/pantry-archive')), '/pantry-archive').toBeNull()
    // Et le descendant légitime, lui, est bien pris.
    expect(await sw.requete(lecture('/api/courses/estimation'))).not.toBeNull()
  })

  it('ne garde pas la charge RSC d’une navigation interne — la limite est réelle', async () => {
    // Une navigation interne de l'App Router ne redemande pas le document : elle
    // demande `?_rsc=…`, qui n'est ni une navigation ni une lecture énumérée. Ce
    // test ne répare pas la limite, il l'ÉTABLIT, pour qu'elle ne soit pas
    // racontée autrement : passer d'un écran à l'autre sans réseau ne marche pas ;
    // ouvrir ou recharger directement `/pantry` marche.
    const sw = await pret()
    expect(await sw.requete({ url: `${ORIGINE}/pantry?_rsc=1a2b3c`, method: 'GET', mode: 'cors' })).toBeNull()
    expect(await sw.requete(navigation('/pantry'))).not.toBeNull()
  })

  it('ne garde ni redirection, ni erreur, ni réponse marquée `no-store`', async () => {
    const sw = await pret()

    servi = () => new Response('<h1>connexion</h1>', { status: 200, headers: { 'content-type': 'text/html' } })
    // Une redirection vers /login mise en cache enfermerait l'application hors
    // ligne sur sa page de connexion.
    const redirigee = servi()
    Object.defineProperty(redirigee, 'redirected', { value: true })
    servi = () => redirigee
    await sw.requete(navigation('/pantry'))
    expect(gardees()).not.toContain('/pantry')

    servi = () => new Response('boum', { status: 500 })
    await sw.requete(navigation('/planning'))
    expect(gardees()).not.toContain('/planning')

    servi = () => html('<h1>éphémère</h1>', { 'cache-control': 'private, no-store' })
    await sw.requete(navigation('/courses'))
    expect(gardees()).not.toContain('/courses')
  })

  it('sert les ressources à empreinte depuis le cache, et elles seules', async () => {
    const sw = await pret()
    let coups = 0
    servi = () => { coups += 1; return new Response('/* js */', { status: 200, headers: { 'content-type': 'text/javascript' } }) }

    await sw.requete(lecture('/_next/static/chunks/abc123.js'))
    await sw.requete(lecture('/_next/static/chunks/abc123.js'))
    // Le deuxième appel n'a pas touché le réseau : l'URL porte l'empreinte du
    // contenu, une autre version aurait une autre URL.
    expect(coups).toBe(1)

    // Une page, elle, repasse par le réseau à chaque fois.
    servi = () => { coups += 1; return html('<h1>ok</h1>') }
    await sw.requete(navigation('/pantry'))
    await sw.requete(navigation('/pantry'))
    expect(coups).toBe(3)
  })
})

describe('le côté page ne fait rien là où il n’y a pas de service worker', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('se déclare indisponible hors contexte sécurisé, et hors navigateur', async () => {
    const module = await import('@/lib/pwa/serviceWorkerClient')

    // Hors navigateur (rendu serveur) : `window` n'existe pas.
    expect(module.serviceWorkerDisponible()).toBe(false)
    expect(await module.enregistrerServiceWorker()).toBeNull()
    // Et les trois messages se taisent au lieu de lever.
    expect(await module.declarerPlanCourant('plan-A')).toBeNull()
    expect(await module.etatDuCache()).toBeNull()
    expect(await module.purgerLeCache()).toBeNull()

    // Navigateur, mais page servie en clair (téléphone qui ouvre l'application
    // par son adresse IP) : pas de service worker non plus, et sans erreur.
    vi.stubGlobal('window', { isSecureContext: false })
    vi.stubGlobal('navigator', { serviceWorker: {} })
    expect(module.serviceWorkerDisponible()).toBe(false)
    expect(await module.enregistrerServiceWorker()).toBeNull()
  })
})
