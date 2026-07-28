/**
 * Vérifie qu'aucune recette du corpus ne recopie la prose de ses sources.
 *
 * Le dépôt est public. Relever des ingrédients et des quantités est licite — ce
 * sont des faits. Reprendre le texte d'une méthode ne l'est pas : c'est une
 * œuvre, et la republier serait un emprunt, quelle que soit l'intention.
 *
 * La règle est facile à énoncer et facile à enfreindre sans le vouloir, surtout
 * quand on vient de lire la source. Ce script la mesure au lieu de la supposer :
 * il compare les suites de mots des étapes publiées à celles du texte source
 * gardé hors dépôt, et signale toute séquence assez longue pour ne pas être une
 * coïncidence.
 *
 * Une langue technique produit forcément des collisions courtes : « faire
 * revenir les oignons », « saler et poivrer », « porter à ébullition » sont des
 * tournures obligées que personne ne possède. Le seuil est donc placé au-dessus
 * de ces formules — huit mots consécutifs identiques ne s'expliquent plus par le
 * vocabulaire commun.
 *
 *   node scripts/data/recipes/check-no-copied-prose.mjs <dossier-des-sources-integrales> [lot.json]
 *
 * Le dossier attendu est celui produit par --travail : il porte le texte des
 * étapes, qui n'est jamais versionné. Sans second argument, ce sont les recettes
 * du corpus qui sont contrôlées ; avec, celles d'un lot pas encore versé — c'est
 * là qu'il faut regarder, avant la fusion et non après.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')

const [dossierSources, lot] = process.argv.slice(2)
if (!dossierSources || !existsSync(dossierSources)) {
  console.error('Usage : check-no-copied-prose.mjs <dossier des sources intégrales>')
  console.error('Ce dossier contient le texte des étapes, qui reste hors dépôt.')
  process.exit(2)
}

/** Huit mots : au-delà des tournures obligées de la langue de cuisine. */
const LONGUEUR_SUSPECTE = 8

const mots = (texte) => String(texte || '')
  .toLowerCase()
  .replace(/&#?\w+;/g, ' ')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .split(' ')
  .filter(Boolean)

const sequences = (liste, taille) => {
  const vues = new Set()
  for (let i = 0; i + taille <= liste.length; i += 1) {
    vues.add(liste.slice(i, i + taille).join(' '))
  }
  return vues
}

const corpus = JSON.parse(readFileSync(lot || CORPUS, 'utf8')).recipes
const parSlug = new Map()
for (const recette of corpus) {
  for (const source of recette.sources || []) {
    if (String(source).startsWith('dossier:')) parSlug.set(String(source).slice(8), recette)
  }
}

let controlees = 0
let suspectes = 0

for (const fichier of readdirSync(dossierSources).filter((f) => f.endsWith('.json')).sort()) {
  const slug = basename(fichier, '.json')
  const recette = parSlug.get(slug)
  if (!recette) continue

  const dossier = JSON.parse(readFileSync(join(dossierSources, fichier), 'utf8'))
  const motsSource = new Set()
  for (const source of dossier.sources || []) {
    for (const sequence of sequences(mots((source.etapes_source || []).join(' ')), LONGUEUR_SUSPECTE)) {
      motsSource.add(sequence)
    }
  }
  if (!motsSource.size) continue

  controlees += 1
  const collisions = []
  for (const etape of recette.steps || []) {
    for (const sequence of sequences(mots(etape.instruction), LONGUEUR_SUSPECTE)) {
      if (motsSource.has(sequence)) collisions.push({ n: etape.n, sequence })
    }
  }

  if (collisions.length) {
    suspectes += 1
    console.log(`✗ ${recette.family}`)
    for (const collision of collisions.slice(0, 5)) {
      console.log(`    étape ${collision.n} : « …${collision.sequence}… »`)
    }
  } else {
    console.log(`✓ ${recette.family.padEnd(38)} ${recette.steps.length} étapes, aucune séquence de ${LONGUEUR_SUSPECTE} mots partagée`)
  }
}

console.log(`\n${controlees} recette(s) confrontées à leurs sources, ${suspectes} à réécrire.`)
if (suspectes) process.exit(1)
