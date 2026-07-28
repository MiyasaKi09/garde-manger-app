/**
 * Signale les ingrédients que TOUTES les sources d'un plat citent et que la
 * recette écrite n'a pas retenus.
 *
 * Le contrôle par le nom du plat, dans le validateur, attrape les cas grossiers :
 * des moules marinières sans moules, un gratin de brocolis sans brocoli. Il ne
 * voit rien quand l'ingrédient manquant n'est pas dans le titre.
 *
 * « Salade de riz niçoise » l'a montré : le nom annonce du riz, le riz était
 * bien là, et le validateur a laissé passer une salade sans thon — alors que les
 * deux sources en mettaient, à 52 g par personne. Ce qui l'a trahie, c'est la
 * nutrition : 3,4 g de protéines pour une salade composée. Un chiffre plutôt
 * qu'un contrôle.
 *
 * L'unanimité des sources est un signal plus sûr que le titre. Quand toutes les
 * pages lues portent un ingrédient et que la recette ne l'a pas, ce n'est
 * presque jamais un choix : c'est un oubli, ou une lecture qui a échoué en
 * amont — le thon de la salade avait justement été mal rattaché.
 *
 * Un écart reste possible et légitime : une source peut être unanime sur un
 * ingrédient qu'on écarte sciemment. Le script le dit alors au lieu de
 * l'imposer, et c'est à `canonical_arbitration` de porter la raison.
 *
 *   node scripts/data/recipes/check-unanimous-ingredients.mjs <synthese.json>
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')

const [synthese] = process.argv.slice(2)
if (!synthese) {
  console.error('Usage : check-unanimous-ingredients.mjs <synthese.json>')
  console.error('La synthèse est produite par synthesize-source-quantities.mjs --tous --json')
  process.exit(2)
}

/**
 * Le sel, le poivre et l'eau sont cités partout et se fondent dans les étapes
 * plutôt que dans la liste : les réclamer n'apprendrait rien.
 */
const TOUJOURS_LA = /^(Sel |Poivre|Eau$)/

const parSlug = new Map()
for (const plat of JSON.parse(readFileSync(synthese, 'utf8'))) parSlug.set(plat.slug, plat)

const recettes = JSON.parse(readFileSync(CORPUS, 'utf8')).recipes
let controlees = 0
let oublis = 0

for (const recette of recettes) {
  const dossier = (recette.sources || []).find((s) => String(s).startsWith('dossier:'))
  if (!dossier) continue
  const plat = parSlug.get(String(dossier).slice(8))
  if (!plat) continue

  controlees += 1
  const presents = new Set(recette.ingredients.map((i) => i.form))
  const manquants = plat.formes
    .filter((forme) => forme.citations === plat.sources)
    .filter((forme) => !presents.has(forme.forme))
    .filter((forme) => !TOUJOURS_LA.test(forme.forme))

  if (!manquants.length) continue
  oublis += manquants.length
  console.log(`✗ ${recette.code}  ${recette.family}`)
  for (const forme of manquants) {
    const quantite = forme.g_par_portion === null ? 'au jugé' : `${forme.g_par_portion} g/pers`
    console.log(`      ${forme.forme.padEnd(38)} ${quantite}  — cité par ${forme.presence} sources`)
  }
}

console.log(`\n${controlees} recette(s) confrontées à leurs sources, ${oublis} omission(s) unanime(s).`)
if (oublis) process.exit(1)
