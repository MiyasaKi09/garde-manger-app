/**
 * Verse un lot de recettes validées dans le corpus, et reconstruit ce qui en dépend.
 *
 * Le corpus ne porte pas que des recettes : il porte aussi trois graphes —
 * formes d'aliments, techniques, arômes — et un classement des formes par
 * fréquence. Le planificateur s'en sert pour la diversité. Ajouter des recettes
 * sans les reconstruire laisserait des graphes qui décrivent un corpus qui
 * n'existe plus.
 *
 * Le lot doit avoir passé validate-recipe-batch.mjs. Ce script le revérifie
 * quand même sur le point qui ne pardonne pas — l'unicité des codes et des
 * familles — parce qu'un doublon versé est bien plus coûteux à retirer qu'à
 * refuser.
 *
 *   node scripts/data/recipes/merge-recipe-batch.mjs lot.json
 *   node scripts/data/recipes/merge-recipe-batch.mjs lot.json --dry-run
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')

const [source, ...flags] = process.argv.slice(2)
if (!source) {
  console.error('Usage : merge-recipe-batch.mjs <lot.json> [--dry-run]')
  process.exit(2)
}
const simulation = flags.includes('--dry-run')

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const lot = JSON.parse(readFileSync(source, 'utf8'))
const nouvelles = Array.isArray(lot) ? lot : (lot.recipes || lot.recettes || [])

const codes = new Set(corpus.recipes.map((recette) => recette.code))
const familles = new Set(corpus.recipes.map((recette) => normalizeName(recette.family)))
const collisions = []
for (const recette of nouvelles) {
  if (codes.has(recette.code)) collisions.push(`code déjà pris : ${recette.code}`)
  if (familles.has(normalizeName(recette.family))) collisions.push(`famille déjà présente : ${recette.family}`)
  codes.add(recette.code)
  familles.add(normalizeName(recette.family))
}
if (collisions.length) {
  console.error('Fusion refusée :')
  for (const collision of collisions) console.error(`  - ${collision}`)
  process.exit(1)
}

const recettes = [...corpus.recipes, ...nouvelles]

/** Reconstruit un graphe « valeur → recettes qui l'emploient », trié par fréquence. */
const construireGraphe = (extraire, cleValeur) => {
  const parValeur = new Map()
  for (const recette of recettes) {
    for (const valeur of new Set(extraire(recette))) {
      if (!valeur) continue
      if (!parValeur.has(valeur)) parValeur.set(valeur, [])
      parValeur.get(valeur).push(recette.code)
    }
  }
  return [...parValeur.entries()]
    .map(([valeur, listeRecettes]) => ({ [cleValeur]: valeur, recipe_count: listeRecettes.length, recipes: listeRecettes }))
    .sort((gauche, droite) => droite.recipe_count - gauche.recipe_count
      || String(gauche[cleValeur]).localeCompare(String(droite[cleValeur]), 'fr'))
}

const grapheFormes = (() => {
  const parNormalise = new Map()
  for (const recette of recettes) {
    for (const ingredient of recette.ingredients || []) {
      const normalise = normalizeName(ingredient.form)
      if (!normalise) continue
      if (!parNormalise.has(normalise)) parNormalise.set(normalise, { name: ingredient.form, normalized: normalise, recipes: [] })
      const entree = parNormalise.get(normalise)
      if (!entree.recipes.includes(recette.code)) entree.recipes.push(recette.code)
    }
  }
  return [...parNormalise.values()]
    .map((entree) => ({ name: entree.name, normalized: entree.normalized, recipe_count: entree.recipes.length, recipes: entree.recipes }))
    .sort((gauche, droite) => droite.recipe_count - gauche.recipe_count
      || gauche.name.localeCompare(droite.name, 'fr'))
})()

const fusionne = {
  ...corpus,
  recipes: recettes,
  food_form_graph: grapheFormes,
  technique_graph: construireGraphe((recette) => recette.techniques || [], 'technique'),
  aroma_graph: construireGraphe((recette) => recette.sensory?.aroma_families || [], 'aroma'),
  forms_order: grapheFormes.map((forme, rang) => ({ rank: rang + 1, name: forme.name, recipe_count: forme.recipe_count })),
}

console.log(`Recettes : ${corpus.recipes.length} → ${recettes.length} (+${nouvelles.length})`)
console.log(`  formes d'aliments : ${corpus.food_form_graph.length} → ${fusionne.food_form_graph.length}`)
console.log(`  techniques        : ${corpus.technique_graph.length} → ${fusionne.technique_graph.length}`)
console.log(`  arômes            : ${corpus.aroma_graph.length} → ${fusionne.aroma_graph.length}`)

// Une forme inédite est le signal qui compte : elle veut dire que le lot est
// sorti du vocabulaire fermé, et qu'il faudra arbitrer avant de publier.
const formesAvant = new Set(corpus.food_form_graph.map((forme) => forme.normalized))
const inedites = fusionne.food_form_graph.filter((forme) => !formesAvant.has(forme.normalized))
if (inedites.length) {
  console.log(`\n⚠ ${inedites.length} forme(s) inédite(s) — hors vocabulaire fermé, à arbitrer :`)
  for (const forme of inedites) console.log(`    ${forme.name} (${forme.recipe_count} recette·s)`)
}

if (simulation) {
  console.log('\nSimulation : rien écrit.')
} else {
  writeFileSync(CORPUS, `${JSON.stringify(fusionne, null, 2)}\n`)
  console.log('\nCorpus écrit. Enchaînez :')
  console.log('  node scripts/data/foods/build-recipe-food-corpus.mjs')
  console.log('  node scripts/data/recipes/export-authoring-vocabulary.mjs')
  console.log('  npm run encyclopedia:build')
}
