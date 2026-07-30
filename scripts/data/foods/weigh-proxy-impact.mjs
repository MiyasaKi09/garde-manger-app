/**
 * Pèse ce qu'un PROXY coûte réellement à l'assiette.
 *
 * Une forme d'aliment sans entrée Ciqual exacte est rattachée à une entrée
 * approchante, marquée en confiance « C », et cette marque interdit la
 * publication de toute recette qui l'emploie. La règle est sévère à dessein :
 * remplacer un ingrédient par un approchant fausse la nutrition en silence, et
 * c'est le genre de faute qu'on ne voit jamais.
 *
 * Mais elle est sévère UNIFORMÉMENT, et c'est son défaut. Soixante-huit recettes
 * sont retenues par ce seul motif, et elles ne se ressemblent pas : un garam
 * masala approximé par du curry en poudre pèse quatre grammes sur une assiette
 * qui en fait six cents, quand un agneau haché approximé par du gigot en pèse le
 * quart. Le premier écart est un bruit de mesure, le second déplace vraiment ce
 * qu'on annonce à qui mange.
 *
 * Ce script ne décide rien. Il MESURE, pour que la décision se prenne sur des
 * chiffres : pour chaque proxy et chaque recette qu'il bloque, quelle part de la
 * masse et surtout des CALORIES de l'assiette il représente. La part calorique
 * est la bonne mesure, pas la masse : cent grammes de bouillon et cent grammes
 * de beurre ne pèsent pas la même chose dans ce qu'on affiche.
 *
 * L'écart annoncé est un MAJORANT prudent. On ne connaît pas la vraie valeur de
 * l'ingrédient absent — s'il on la connaissait, il ne serait pas un proxy. On
 * suppose donc que le proxy peut se tromper d'un facteur donné (par défaut 30 %
 * de la valeur du proxy), et on regarde ce que cette erreur ferait au total de
 * l'assiette. Une recette dont le pire cas reste sous 2 % n'a rien à gagner à
 * attendre une fiche qui n'existe pas.
 *
 *   node scripts/data/foods/weigh-proxy-impact.mjs
 *   node scripts/data/foods/weigh-proxy-impact.mjs --seuil 5 --json rapport.json
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const CATALOGUE = join(ROOT, 'scripts', 'data', 'out', 'recipe-food-catalog.json')
const RAPPORT = join(ROOT, 'scripts', 'data', 'out', 'recipe-food-match-report.json')

const argument = (nom, defaut) => {
  const index = process.argv.indexOf(nom)
  return index > -1 ? process.argv[index + 1] : defaut
}

/**
 * Marge d'erreur supposée du proxy, en part de sa propre valeur.
 *
 * Trente pour cent n'est pas mesuré — il ne peut pas l'être, puisque la vraie
 * valeur est justement ce qui manque. C'est un majorant délibérément large :
 * l'écart entre un gigot d'agneau et de l'agneau haché, ou entre deux poudres
 * d'épices, reste très en deçà. Le prendre large fait que les recettes qui
 * passent le seuil le passent VRAIMENT.
 */
const MARGE = Number(argument('--marge', '0.30'))
/** Part des calories de l'assiette au-delà de laquelle le proxy doit être tranché. */
const SEUIL = Number(argument('--seuil', '2'))

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const catalogue = JSON.parse(readFileSync(CATALOGUE, 'utf8')).forms
const rapport = JSON.parse(readFileSync(RAPPORT, 'utf8'))

const parForme = new Map(catalogue.map((forme) => [forme.canonical_name_normalized, forme]))
const eligibilite = new Map(rapport.recipe_eligibility.map((recette) => [recette.code, recette]))

/** Calories d'un ingrédient, ou null si sa forme n'a pas de densité connue. */
const kcalDe = (ingredient) => {
  const forme = parForme.get(normalizeName(ingredient.form))
  if (!forme?.per100g?.kcal) return null
  // Seules les lignes pesées en grammes se totalisent : une gousse ou une pièce
  // n'a pas de masse tant que la conversion n'est pas faite, et l'inventer ici
  // reviendrait à fabriquer le chiffre qu'on prétend mesurer.
  if (ingredient.unit !== 'g') return null
  return { kcal: (Number(ingredient.quantity) / 100) * forme.per100g.kcal, forme }
}

const constats = []
for (const recette of corpus.recipes) {
  const etat = eligibilite.get(recette.code)
  if (!etat || etat.eligible_for_publication) continue
  // On ne pèse que les recettes retenues par le SEUL motif du proxy : celles
  // dont un ingrédient reste inconnu attendent une recherche, pas une décision.
  if (!etat.low_confidence_required_forms.length) continue
  if (etat.unresolved_required_forms.length
    || etat.incomplete_nutrition_required_forms.length
    || etat.unresolved_conversion_required_forms.length) continue

  let total = 0
  const pesables = []
  for (const ingredient of recette.ingredients) {
    const pese = kcalDe(ingredient)
    if (!pese) continue
    total += pese.kcal
    pesables.push({ ingredient, ...pese })
  }
  if (!total) continue

  const proxys = pesables.filter((ligne) => ligne.forme.confidence === 'C')
  if (!proxys.length) continue

  const kcalProxy = proxys.reduce((somme, ligne) => somme + ligne.kcal, 0)
  // Le pire cas : toutes les erreurs de proxy dans le même sens.
  const pireCas = (kcalProxy * MARGE) / total * 100

  constats.push({
    code: recette.code,
    family: recette.family,
    kcal_assiette: Math.round(total),
    proxys: proxys.map((ligne) => ({
      forme: ligne.ingredient.form,
      quantite: `${ligne.ingredient.quantity} ${ligne.ingredient.unit}`,
      proxy: ligne.forme.source_name,
      part_kcal: Number((ligne.kcal / total * 100).toFixed(1)),
    })).sort((gauche, droite) => droite.part_kcal - gauche.part_kcal),
    pire_cas_pct: Number(pireCas.toFixed(2)),
    verdict: pireCas <= SEUIL ? 'négligeable' : 'à trancher',
  })
}

constats.sort((gauche, droite) => gauche.pire_cas_pct - droite.pire_cas_pct)
const negligeables = constats.filter((constat) => constat.verdict === 'négligeable')

console.log(`${constats.length} recettes retenues par le seul motif du proxy et pesables en grammes.`)
console.log(`Marge d'erreur supposée du proxy : ${(MARGE * 100).toFixed(0)} % de sa propre valeur.`)
console.log(`Seuil : ${SEUIL} % des calories de l'assiette.\n`)

console.log(`── ${negligeables.length} recettes dont le PIRE CAS reste sous le seuil ──`)
for (const constat of negligeables) {
  const tete = constat.proxys[0]
  console.log(
    `  ${String(constat.pire_cas_pct).padStart(5)} %  ${constat.code.padEnd(10)} ${constat.family.slice(0, 34).padEnd(34)}`
    + ` ${tete.forme.slice(0, 26).padEnd(26)} ${String(tete.part_kcal).padStart(5)} % des kcal`,
  )
}

const aTrancher = constats.filter((constat) => constat.verdict === 'à trancher')
console.log(`\n── ${aTrancher.length} recettes où le proxy pèse trop pour être ignoré ──`)
for (const constat of aTrancher) {
  const tete = constat.proxys[0]
  console.log(
    `  ${String(constat.pire_cas_pct).padStart(5)} %  ${constat.code.padEnd(10)} ${constat.family.slice(0, 34).padEnd(34)}`
    + ` ${tete.forme.slice(0, 26).padEnd(26)} ${String(tete.part_kcal).padStart(5)} % des kcal`
    + `  ← ${tete.proxy}`,
  )
}

const sortie = argument('--json', null)
if (sortie) {
  writeFileSync(sortie, `${JSON.stringify({ marge: MARGE, seuil: SEUIL, constats }, null, 2)}\n`)
  console.log(`\nRapport écrit : ${sortie}`)
}
