import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { coutDeCarte } from '@/lib/domain/recipes/coutDeCarte'
import { coutDeCarte as coutDeCarteReexportee } from '@/lib/domain/recipes/canonicalCatalog'

/**
 * JALON J1 DE LA PHASE 5 — LE CORPUS SORT DU BUNDLE, ET IL N'Y REVIENT PAS.
 *
 * CE QUE LE PLAN DEMANDE. « Le corpus doit sortir du bundle avant le millième.
 * Il pèse 6,7 Mio pour 754 recettes ; à 3 000 il pèserait ≈ 27 Mio par
 * déploiement. » (§5, phase 5). La phase 0b a rendu la sortie possible en
 * retirant les deux raccords JSON d'`operationalCatalog.js` ; il restait une
 * seconde arête, et c'est elle que ce fichier garde.
 *
 * CE QU'ELLE ÉTAIT, MESURÉE. `app/_pricing/estimations.js` — la passerelle
 * serveur du coût, importée par quatre routes — importait `coutDeCarte` depuis
 * `lib/domain/recipes/canonicalCatalog.js`. Un `import` ES ne prend pas une
 * fonction : il prend le module, et tout ce que le module importe. Or
 * `canonicalCatalog.js` importe `data/recipes/corpus-v3.json` (7 022 882
 * octets) et `scripts/data/out/recipe-food-catalog.json` (629 094 octets) au
 * build, quand `coutDeCarte` ne lit ni l'un ni l'autre — elle ne travaille que
 * sur la recette et l'index qu'on lui passe. Mesuré sur `npm run build` en
 * production avant le déplacement : `.next/server/chunks/7127.js` pesait
 * 5 629 329 octets et était chargé par `app/api/pantry/route.js`,
 * `app/api/recipes/catalog/route.js`,
 * `app/api/planning/imports/[importId]/route.js` et
 * `app/recipes/canonical/[code]/page.js` — les quatre importateurs
 * d'`estimations.js`, et aucun autre.
 *
 * CE QUI GARDE LA SORTIE. Pas une relecture, pas une convention de nommage : le
 * GRAPHE D'IMPORTS STATIQUES, parcouru ici depuis les entrées que Next.js
 * compile (`page`, `route`, `layout` et leurs voisins de convention, plus le
 * middleware), avec les mêmes règles de résolution que le bundler — alias `@/`
 * de `jsconfig.json`, extensions implicites, `index`. Un fichier atteint par ce
 * parcours est un fichier que le bundler embarque ; un fichier hors du parcours
 * est un fichier qui ne part pas en déploiement.
 *
 * POURQUOI CE TEST PEUT ÉCHOUER — et c'est la moitié qui compte. Un parcours de
 * graphe qui ne résoudrait rien déclarerait le corpus « absent » avec le même
 * aplomb, et serait vert pour toujours. Le premier bloc ci-dessous est donc un
 * TÉMOIN POSITIF : les douze tranches de prix de `data/prices/tranches/` sont
 * importées par `lib/domain/pricing/tranches.js` — un import JSON statique
 * EXACTEMENT du genre interdit plus bas, volontairement conservé (le
 * référentiel est une donnée du dépôt, lue à chaque requête, et
 * `estimations.js` documente pourquoi il reste au serveur). Si le parcours les
 * trouve, il sait trouver ce qu'il cherche. Vérifié aussi à l'envers : en
 * remettant l'`import` de `coutDeCarte` sur `canonicalCatalog`, ce fichier
 * rougit sur trois assertions.
 *
 * CE QU'IL NE DIT PAS. Il ne dit rien du chemin TEST : `canonicalCatalog.js`
 * importe toujours le corpus, et les 30 fichiers de tests qui le lisent
 * continuent de mesurer le corpus versionné, sans rien changer à ce qu'ils
 * garantissaient. C'est délibéré, et c'est la ligne à ne pas franchir : un test
 * qui lirait la base là où il lisait le dépôt ne mesurerait plus la même chose.
 * Il ne dit rien non plus des scripts de `scripts/`, qui doivent lire le corpus
 * — ils ne sont pas compilés dans l'application.
 */

const RACINE = process.cwd()

const CORPUS = join(RACINE, 'data', 'recipes', 'corpus-v3.json')
const CATALOGUE_DE_FORMES = join(RACINE, 'scripts', 'data', 'out', 'recipe-food-catalog.json')
const CATALOGUE_CANONIQUE = join(RACINE, 'lib', 'domain', 'recipes', 'canonicalCatalog.js')
const TEMOIN_TRANCHE = join(RACINE, 'data', 'prices', 'tranches', 'epicerie.json')

/**
 * Plafond du JSON embarqué, en octets. Mesuré à 1 830 926 le jour du jalon.
 * Il est posé à 3 Mio — donc avec de la marge, parce qu'une tranche de prix de
 * plus est un ajout légitime qui ne doit pas faire rougir ce fichier. Ce qu'il
 * interdit est d'un autre ordre de grandeur : le corpus seul portait le total à
 * 9 482 902 octets, et à 3 000 recettes il le porterait au-delà de 28 Mio.
 */
const PLAFOND_JSON_EMBARQUE = 3 * 1024 * 1024

/** Les noms de fichiers que Next.js compile comme points d'entrée. */
const ENTREES_DE_CONVENTION = [
  'page', 'route', 'layout', 'template', 'default',
  'loading', 'error', 'global-error', 'not-found',
]

const EXTENSIONS = ['', '.js', '.jsx', '.mjs', '.json', '/index.js', '/index.jsx']

/**
 * Résolution d'un spécificateur, calquée sur ce que fait le bundler. Un
 * spécificateur nu (`react`, `next/server`) rend `null` : les dépendances
 * externes ne sont pas le sujet, et les suivre ferait entrer `node_modules`
 * entier dans le parcours.
 */
function resoudre(spec, depuis) {
  let base
  if (spec.startsWith('@/')) base = join(RACINE, spec.slice(2))
  else if (spec.startsWith('.')) base = resolve(dirname(depuis), spec)
  else return null
  for (const extension of EXTENSIONS) {
    const candidat = base + extension
    if (existsSync(candidat) && statSync(candidat).isFile()) return candidat
  }
  return null
}

/**
 * Les trois formes d'import statique du dépôt : `import ... from '…'` (et
 * `export ... from '…'`), `import('…')`, et l'import de pur effet
 * `import '…'`. Les commentaires ne sont pas retirés : une mention en
 * commentaire ne peut pas produire un faux VERT, seulement un faux rouge, et
 * les deux fichiers qui nomment le corpus dans leur en-tête le nomment en
 * prose, jamais dans la forme `from '…'`.
 */
const IMPORTS = /(?:^|\n)\s*(?:import|export)[\s\S]{0,400}?from\s*['"]([^'"]+)['"]|(?:^|[^\w.$])import\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g

const NOMS_DENTREE = new Set(ENTREES_DE_CONVENTION.flatMap((nom) => [`${nom}.js`, `${nom}.jsx`]))

function entreesNext() {
  const entrees = []
  const explorer = (dossier) => {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, entree.name)
      if (entree.isDirectory()) explorer(chemin)
      else if (NOMS_DENTREE.has(entree.name)) entrees.push(chemin)
    }
  }
  explorer(join(RACINE, 'app'))
  for (const nomDeMiddleware of ['middleware.js', 'middleware.jsx']) {
    const candidat = join(RACINE, nomDeMiddleware)
    if (existsSync(candidat)) entrees.push(candidat)
  }
  return entrees
}

/** Parcours en largeur du graphe d'imports, en retenant par quel arc on arrive. */
function parcourir(entrees) {
  const atteints = new Set(entrees)
  const parent = new Map(entrees.map((entree) => [entree, null]))
  const pile = [...entrees]
  while (pile.length > 0) {
    const fichier = pile.pop()
    if (fichier.endsWith('.json')) continue
    const source = readFileSync(fichier, 'utf8')
    IMPORTS.lastIndex = 0
    let trouve
    while ((trouve = IMPORTS.exec(source)) !== null) {
      const spec = trouve[1] || trouve[2] || trouve[3]
      if (!spec) continue
      const cible = resoudre(spec, fichier)
      if (!cible || atteints.has(cible)) continue
      atteints.add(cible)
      parent.set(cible, fichier)
      pile.push(cible)
    }
  }
  return { atteints, parent }
}

/** Le chemin d'imports qui mène à un fichier, pour que l'échec nomme le coupable. */
function cheminVers(parent, fichier) {
  const arcs = []
  let courant = fichier
  while (courant) {
    arcs.unshift(relative(RACINE, courant))
    courant = parent.get(courant)
  }
  return arcs.join('\n  -> ')
}

const ENTREES = entreesNext()
const { atteints, parent } = parcourir(ENTREES)
const jsonAtteints = [...atteints].filter((fichier) => fichier.endsWith('.json'))

describe('J1 — le parcours d’imports sait trouver ce qu’il cherche', () => {
  it('part d’un nombre d’entrées Next crédible', () => {
    // Sans cette garde, un `find` qui ne rendrait rien ferait passer tout le
    // reste : zéro entrée, zéro module atteint, zéro corpus embarqué.
    expect(ENTREES.length).toBeGreaterThan(80)
    expect(ENTREES.some((entree) => entree.endsWith(join('app', 'api', 'pantry', 'route.js')))).toBe(true)
    expect(ENTREES.some((entree) => entree.endsWith(join('app', 'layout.js')))).toBe(true)
  })

  it('traverse vraiment le dépôt, et pas seulement ses entrées', () => {
    expect(atteints.size).toBeGreaterThan(250)
    expect(atteints.has(join(RACINE, 'app', '_pricing', 'estimations.js'))).toBe(true)
  })

  it('TÉMOIN POSITIF — il atteint un JSON embarqué qui, lui, doit rester', () => {
    // `data/prices/tranches/epicerie.json` est importé statiquement par
    // `lib/domain/pricing/tranches.js`, à quatre arcs d'une route. C'est la
    // MÊME forme d'arête que celle interdite plus bas. Qu'elle soit trouvée est
    // ce qui donne son sens à une absence.
    expect(atteints.has(TEMOIN_TRANCHE)).toBe(true)
    expect(cheminVers(parent, TEMOIN_TRANCHE)).toContain('lib/domain/pricing/tranches.js')
    expect(jsonAtteints.length).toBeGreaterThan(5)
  })
})

describe('J1 — le corpus ne part plus en déploiement', () => {
  it('data/recipes/corpus-v3.json n’est atteint par aucune entrée Next', () => {
    const arrivee = atteints.has(CORPUS) ? `\n  ${cheminVers(parent, CORPUS)}` : ''
    expect(atteints.has(CORPUS), `le corpus est réembarqué :${arrivee}`).toBe(false)
  })

  it('scripts/data/out/recipe-food-catalog.json non plus', () => {
    // Il voyageait par la même arête, et il repart avec elle. Le nommer
    // séparément évite qu'un jour on le réintroduise seul en croyant que seul
    // le corpus était le sujet.
    const arrivee = atteints.has(CATALOGUE_DE_FORMES) ? `\n  ${cheminVers(parent, CATALOGUE_DE_FORMES)}` : ''
    expect(atteints.has(CATALOGUE_DE_FORMES), `le catalogue de formes est réembarqué :${arrivee}`).toBe(false)
  })

  it('canonicalCatalog.js lui-même est hors du graphe de production', () => {
    // La formulation durable : tant que le module qui importe le corpus n'est
    // atteint par aucune entrée, aucun JSON qu'il ajouterait demain ne pourra
    // entrer sans faire rougir ce test. C'est aussi ce qui rougit en premier si
    // quelqu'un réimporte `coutDeCarte` depuis l'ancien chemin.
    const arrivee = atteints.has(CATALOGUE_CANONIQUE) ? `\n  ${cheminVers(parent, CATALOGUE_CANONIQUE)}` : ''
    expect(atteints.has(CATALOGUE_CANONIQUE), `le catalogue canonique est de retour :${arrivee}`).toBe(false)
  })

  it('le JSON embarqué tient sous son plafond', () => {
    const poids = jsonAtteints.reduce((somme, fichier) => somme + statSync(fichier).size, 0)
    const detail = jsonAtteints
      .map((fichier) => `${statSync(fichier).size}\t${relative(RACINE, fichier)}`)
      .sort()
      .join('\n')
    expect(poids, `JSON embarqué :\n${detail}`).toBeLessThan(PLAFOND_JSON_EMBARQUE)
  })
})

describe('J1 — la sortie n’a pas dédoublé le calcul', () => {
  it('les deux chemins d’import rendent LA MÊME fonction', () => {
    // La raison d'être de `coutDeCarte` est qu'une même recette porte la même
    // carte, qu'elle vienne du corpus versionné ou de la base. Deux copies de
    // la fonction, même identiques aujourd'hui, feraient diverger les deux
    // chemins au premier changement — c'est le risque exact qu'un déplacement
    // de fonction introduit, et l'identité référentielle est ce qui l'écarte.
    expect(coutDeCarteReexportee).toBe(coutDeCarte)
  })

  it('le nouveau module n’importe aucun JSON', () => {
    const source = readFileSync(join(RACINE, 'lib', 'domain', 'recipes', 'coutDeCarte.js'), 'utf8')
    const lignesDImport = source.split('\n').filter((ligne) => /^\s*(?:import|export)\s[\s\S]*from\s/.test(ligne))
    expect(lignesDImport.length).toBeGreaterThan(0)
    expect(lignesDImport.filter((ligne) => ligne.includes('.json'))).toEqual([])
  })
})
