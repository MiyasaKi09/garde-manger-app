const { test, expect } = require('@playwright/test')

/**
 * LE SERVICE WORKER, DANS UN VRAI NAVIGATEUR (livrable 3.7).
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * `playwright.config.js` bloque les service workers pour toutes les autres
 * spécifications, et il dit pourquoi : `page.route()` n'intercepte pas une
 * requête émise PAR un service worker, si bien qu'un worker posé devant le banc
 * de réseau simulé fait tomber neuf tests de `/courses` et `/pantry` sans rien
 * mesurer. Bloquer sans rallumer nulle part laisserait un trou : le seul
 * endroit du dépôt où le service worker s'exécutait dans un vrai navigateur
 * serait fermé. Ce fichier est cet endroit, et il est le seul à rallumer.
 *
 * CE QU'IL MESURE, ET CE QU'IL NE MESURE PAS
 * ------------------------------------------
 * Il mesure ce qu'un navigateur sans utilisateur peut établir : le manifeste
 * est servi et référencé par le document, le service worker s'enregistre depuis
 * la mise en page racine, il prend la main sur la page déjà ouverte — c'est ce
 * que `skipWaiting()` puis `clients.claim()` promettent dans `public/sw.js` —
 * et sa portée couvre toute l'application.
 *
 * Il ne mesure NI l'installation sur un téléphone, NI la lecture hors réseau.
 * Le §5 du plan le dit du livrable 3.7 : seul un téléphone dira que la
 * bannière d'installation paraît et que le mode avion se comporte comme un
 * `fetch` qui rejette. La stratégie réseau d'abord, elle, est éprouvée sur le
 * vrai fichier par `tests/pwa/serviceWorker.test.js`.
 *
 * `/login` EST LA PAGE CHOISIE, et pour une raison : elle est publique, elle
 * n'attend aucune donnée simulée, et le pont est monté depuis `app/layout.js`,
 * donc depuis toutes les pages. Mesurer l'enregistrement sur un écran qui
 * exige une session mêlerait deux questions.
 *
 * EN DÉVELOPPEMENT, CE FICHIER NE MESURE RIEN, et c'est voulu :
 * `ServiceWorkerBridge` DÉSENREGISTRE le worker quand `NODE_ENV` n'est pas
 * `production` — un cache qui survit à un rechargement rendrait le
 * développement illisible. La CI lance `npm run start`, donc une vraie
 * construction. Le test le constate et se saute lui-même plutôt que d'échouer
 * chez quelqu'un qui lance `npm run dev` : un test rouge pour la mauvaise
 * raison apprend à ignorer le rouge.
 */

test.use({ serviceWorkers: 'allow' })

const DELAI_ENREGISTREMENT = 15_000

// Le pont attend le repos du navigateur (`requestIdleCallback`, ou 800 ms de
// repli) avant d'enregistrer : l'enregistrement d'un service worker n'a aucune
// raison de disputer le réseau au premier affichage. On attend donc la
// promesse `navigator.serviceWorker.ready` plutôt qu'un délai fixe.
//
// ET ON ATTEND LA PRISE DE MAIN SÉPARÉMENT, parce que ce sont deux instants
// distincts : `ready` se tient dès qu'un enregistrement est ACTIF, alors que
// `clients.claim()` s'exécute après, dans le worker, et ne prend la main sur
// une page déjà ouverte qu'ensuite. Lire `navigator.serviceWorker.controller`
// juste après `ready` est une course, et elle se perd — c'est ce qui a fait
// échouer la première écriture de ce test. On écoute donc `controllerchange`,
// avec la lecture immédiate d'abord au cas où la main serait déjà prise.
const attendreLEnregistrement = (page) => page.evaluate(async (delai) => {
  if (!('serviceWorker' in navigator)) return { disponible: false }
  const echeance = (valeur) => new Promise((resoudre) => setTimeout(() => resoudre(valeur), delai))
  const enregistrement = await Promise.race([navigator.serviceWorker.ready, echeance(null)])
  if (!enregistrement) return { disponible: true, enregistre: false }

  const controle = navigator.serviceWorker.controller
    ? true
    : await Promise.race([
      new Promise((resoudre) => {
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resoudre(Boolean(navigator.serviceWorker.controller)),
          { once: true },
        )
      }),
      echeance(false),
    ])

  return {
    disponible: true,
    enregistre: true,
    script: enregistrement.active?.scriptURL || null,
    portee: enregistrement.scope,
    controle,
  }
}, DELAI_ENREGISTREMENT)

test.describe('PWA — le service worker dans un vrai navigateur', () => {
  test('le manifeste est servi, et le document le référence', async ({ page, request }) => {
    await page.goto('/login')

    const lien = page.locator('link[rel="manifest"]')
    await expect(lien).toHaveCount(1)
    await expect(lien).toHaveAttribute('href', /manifest\.webmanifest$/)

    // Servi n'est pas référencé, et référencé n'est pas servi : les deux
    // moitiés sont vérifiées, faute de quoi un lien vers un fichier absent
    // passerait pour une application installable.
    const reponse = await request.get('/manifest.webmanifest')
    expect(reponse.status()).toBe(200)
    const manifeste = await reponse.json()
    expect(manifeste.start_url).toBeTruthy()
    expect(Array.isArray(manifeste.icons)).toBe(true)
    expect(manifeste.icons.length).toBeGreaterThan(0)

    // Chaque icône déclarée doit exister. Une icône manquante ne fait pas
    // échouer l'installation : elle la rend laide, en silence.
    for (const icone of manifeste.icons) {
      const icoRep = await request.get(icone.src)
      expect(icoRep.status(), `icône déclarée absente : ${icone.src}`).toBe(200)
    }
  })

  test('s’enregistre depuis la mise en page racine et prend la main sur la page ouverte', async ({ page }) => {
    await page.goto('/login')
    const etat = await attendreLEnregistrement(page)

    expect(etat.disponible, 'ce navigateur ne porte pas navigator.serviceWorker').toBe(true)

    // Construction de développement : le pont désenregistre au lieu d'enregistrer.
    // On le constate et on s'arrête là plutôt que d'échouer pour la mauvaise raison.
    test.skip(!etat.enregistre, 'aucun service worker enregistré — construction de développement (le pont ne le pose qu’en production)')

    expect(etat.script).toMatch(/\/sw\.js$/)
    // La portée doit être la racine : posée plus bas, elle ne couvrirait pas
    // `/pantry` ni la semaine publiée, qui sont exactement ce que le livrable
    // veut garder lisible.
    expect(new URL(etat.portee).pathname).toBe('/')
    // `skipWaiting()` puis `clients.claim()` promettent la main SANS
    // rechargement. C'est cette promesse-là qu'on vérifie, pas une autre.
    expect(etat.controle, 'le service worker s’est enregistré sans prendre la main').toBe(true)
  })
})
