import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Ce fichier tient la moitié « installable » du livrable 3.7.
 *
 * CE QU'IL VÉRIFIE, ET POURQUOI IL LE VÉRIFIE AINSI
 *
 * Une application installable ne se teste pas en unité : c'est le navigateur du
 * téléphone qui décide, sur des règles qu'aucun test Node ne rejoue. Ce que l'on
 * PEUT tenir ici, ce sont les conditions nécessaires — et c'est justement ce qui
 * manquait : le manifeste et les icônes existaient, et `app/layout.js` ne les
 * référençait nulle part. Un manifeste que le document ne référence pas ne rend
 * l'application installable sur aucun téléphone ; ces tests échouent si ce
 * câblage disparaît à nouveau.
 *
 * Ce qu'ils ne disent PAS, et que seul un téléphone dirait : que la bannière
 * d'installation apparaît, que l'icône n'est pas rognée sur l'écran d'accueil,
 * et que la barre système prend bien la couleur déclarée.
 */

const chemin = (relatif) => fileURLToPath(new URL(relatif, import.meta.url))
const RACINE = chemin('../../')

const manifeste = JSON.parse(readFileSync(chemin('../../public/manifest.webmanifest'), 'utf8'))
const layout = readFileSync(chemin('../../app/layout.js'), 'utf8')
const pont = readFileSync(chemin('../../components/ServiceWorkerBridge.jsx'), 'utf8')

/** Largeur et hauteur déclarées par l'en-tête IHDR d'un PNG. Rien n'est cru sur parole. */
function dimensionsPng(cheminFichier) {
  const octets = readFileSync(cheminFichier)
  const signature = octets.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') throw new Error(`${cheminFichier} n’est pas un PNG`)
  return { largeur: octets.readUInt32BE(16), hauteur: octets.readUInt32BE(20), octets: octets.length }
}

describe('le manifeste déclare une application que le téléphone peut installer', () => {
  it('porte les champs sans lesquels aucun navigateur ne propose l’installation', () => {
    expect(manifeste.name).toBeTruthy()
    expect(manifeste.short_name).toBeTruthy()
    // 12 caractères : au-delà, l'écran d'accueil tronque le nom.
    expect(manifeste.short_name.length).toBeLessThanOrEqual(12)
    expect(manifeste.start_url).toBeTruthy()
    expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(manifeste.display)
    expect(manifeste.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(manifeste.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('ouvre sur le garde-manger, et cette page existe', () => {
    // Le plan justifie l'application installable en une phrase : « c'est debout
    // devant le frigo qu'on tient un garde-manger, pas au bureau ». L'écran
    // d'ouverture est donc celui-là, pas l'accueil.
    expect(manifeste.start_url).toBe('/pantry')
    expect(manifeste.start_url.startsWith(manifeste.scope)).toBe(true)
    expect(() => readFileSync(chemin('../../app/pantry/page.js'), 'utf8')).not.toThrow()
  })

  it('ne renvoie vers aucun raccourci qui n’aurait pas d’écran', () => {
    const pages = ['/pantry', '/planning', '/courses']
    for (const raccourci of manifeste.shortcuts || []) {
      expect(pages, raccourci.url).toContain(raccourci.url)
    }
  })

  it('déclare des icônes qui existent, aux tailles annoncées', () => {
    expect(manifeste.icons.length).toBeGreaterThan(0)
    for (const icone of manifeste.icons) {
      expect(icone.src.startsWith('/'), icone.src).toBe(true)
      const { largeur, hauteur } = dimensionsPng(`${RACINE}public${icone.src}`)
      // La taille annoncée est celle du fichier : une icône annoncée 512 et
      // livrée en 192 est refusée par Chrome, sans un mot à l'écran.
      expect(`${largeur}x${hauteur}`, icone.src).toBe(icone.sizes)
      expect(icone.type, icone.src).toBe('image/png')
    }
  })

  it('porte une icône « maskable » de 512, sans quoi Android rogne le dessin', () => {
    const masquables = manifeste.icons.filter((icone) => String(icone.purpose || '').includes('maskable'))
    expect(masquables.map((icone) => icone.sizes)).toContain('512x512')
    // « any » et « maskable » ne sont pas le même dessin : le second doit tenir
    // dans le cercle de sécurité. Deux fichiers distincts, donc.
    const quelconques = manifeste.icons.filter((icone) => String(icone.purpose || 'any') === 'any')
    expect(quelconques.length).toBeGreaterThan(0)
    for (const masquable of masquables) {
      expect(quelconques.map((icone) => icone.src)).not.toContain(masquable.src)
    }
  })

  it('rend les mêmes icônes que le script qui les dessine', () => {
    // Les binaires ne se relisent pas ; le script, si. `--check` échoue si un
    // fichier du dépôt s'écarte du dessin décrit par `scripts/pwa/build-icons.mjs`.
    expect(() => execFileSync(process.execPath, ['scripts/pwa/build-icons.mjs', '--check'], {
      cwd: RACINE, encoding: 'utf8',
    })).not.toThrow()
  })
})

describe('le document référence le manifeste — sans quoi rien de tout cela ne sert', () => {
  it('déclare le manifeste dans les métadonnées de la racine', () => {
    // C'est la ligne qui manquait : le manifeste existait, et `app/layout.js`
    // ne le citait pas. `metadata.manifest` écrit le `<link rel="manifest">`.
    expect(layout).toMatch(/manifest:\s*["']\/manifest\.webmanifest["']/)
  })

  it('déclare la couleur de thème dans l’export `viewport`, pas dans `metadata`', () => {
    // Depuis Next 14, `themeColor` posé dans `metadata` est ignoré avec un
    // avertissement au build : la barre système resterait blanche.
    const bloc = layout.match(/export const viewport = \{[\s\S]*?\n\};/)
    expect(bloc, 'export const viewport').not.toBeNull()
    expect(bloc[0]).toMatch(/themeColor:/)
    // Et surtout pas dans `metadata`, où Next l'ignorerait en silence à
    // l'exécution. On regarde le bloc, pas le fichier : un commentaire qui
    // EXPLIQUE la règle n'est pas une infraction à cette règle.
    const metadonnees = layout.match(/export const metadata = \{[\s\S]*?\n\};/)
    expect(metadonnees, 'export const metadata').not.toBeNull()
    expect(metadonnees[0]).not.toMatch(/themeColor:/)
  })

  it('annonce la même couleur de thème que le manifeste', () => {
    // Deux valeurs différentes se départagent selon le navigateur : la balise
    // l'emporte ici, le manifeste là. Une seule couleur, donc.
    const bloc = layout.match(/export const viewport = \{[\s\S]*?\n\};/)[0]
    const couleurs = [...bloc.matchAll(/#[0-9A-Fa-f]{6}/g)].map(([valeur]) => valeur.toUpperCase())
    expect(new Set(couleurs).size, bloc).toBe(1)
    expect(couleurs[0]).toBe(manifeste.theme_color.toUpperCase())
  })

  it('déclare ce qu’iOS lit, puisque Safari n’installe pas depuis le manifeste', () => {
    expect(layout).toMatch(/appleWebApp:\s*\{/)
    expect(layout).toMatch(/capable:\s*true/)
    expect(layout).toMatch(/apple-touch-icon-180\.png/)
    const { largeur, hauteur } = dimensionsPng(`${RACINE}public/icons/apple-touch-icon-180.png`)
    expect(`${largeur}x${hauteur}`).toBe('180x180')
  })

  it('enregistre le service worker depuis le document, et depuis là seulement', () => {
    // Un service worker que personne n'enregistre n'intercepte rien. Le pont est
    // monté par la racine : sans cette ligne, `public/sw.js` est un fichier
    // servi que rien n'exécute.
    expect(layout).toMatch(/<ServiceWorkerBridge\s*\/>/)
    expect(layout).toMatch(/import ServiceWorkerBridge from ["']@\/components\/ServiceWorkerBridge["']/)
    expect(pont).toMatch(/^'use client'/)
    expect(pont).toContain('enregistrerServiceWorker')
  })

  it('n’enregistre rien en développement, et désenregistre ce qui traîne', () => {
    // `next dev` sert `/_next/static/` sous des URL qui ne portent pas
    // l'empreinte du contenu, et le service worker les sert d'abord depuis le
    // cache : le rechargement à chaud remonterait l'ancien module.
    expect(pont).toMatch(/process\.env\.NODE_ENV !== 'production'/)
    expect(pont).toContain('unregister()')
  })

  it('déclare la version de plan active, qui est ce qui versionne le cache', () => {
    // Sans cette déclaration, le service worker ne saurait pas de quelle semaine
    // date ce qu'il garde — et une semaine périmée survivrait à sa remplaçante.
    expect(pont).toContain('declarerPlanCourant')
    expect(pont).toContain('active_plan_version_id')
  })

  it('vide le cache quand la session change de personne', () => {
    // Les réponses d'API sont gardées par URL, pas par compte : un téléphone se
    // prête. On écoute l'événement plutôt que de brancher chaque bouton de
    // déconnexion — il y en a deux, et le troisième oublierait.
    expect(pont).toContain('onAuthStateChange')
    expect(pont).toContain('purgerLeCache')
    expect(pont).toContain('SIGNED_OUT')
  })
})
