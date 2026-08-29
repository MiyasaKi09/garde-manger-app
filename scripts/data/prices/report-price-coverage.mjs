/**
 * Mesure ce que le référentiel de prix couvre RÉELLEMENT du corpus servi.
 *
 * C'est le chiffre qui décide si ce chantier sert à quelque chose, et il doit
 * être mesuré honnêtement plutôt qu'annoncé. Un référentiel qui chiffre le sel et
 * le laurier mais pas la viande couvre beaucoup de LIGNES et presque rien de
 * l'assiette : d'où deux mesures et non une.
 *
 * PIÈGE DE NORMALISATION, consigné parce qu'il a déjà produit un faux chiffre.
 * Une première mesure écrite à la va-vite annonçait « Œuf cru » comme la forme
 * non chiffrée la plus fréquente du corpus — alors qu'elle EST au référentiel.
 * La cause : NFD ne décompose pas la ligature « œ ». Il faut la remplacer AVANT
 * de normaliser, ce que font `normalizeName` ici et `normalizeFoodForm` côté
 * application. Ce script emploie donc le normaliseur du dépôt, jamais le sien.
 *
 *   node scripts/data/prices/report-price-coverage.mjs
 *   node scripts/data/prices/report-price-coverage.mjs --json rapport.json
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const TRANCHES = ['assaisonnement', 'epicerie', 'frais-animal', 'frais-vegetal']

const argument = (nom, defaut) => {
  const index = process.argv.indexOf(nom)
  return index > -1 ? process.argv[index + 1] : defaut
}

const lire = (...morceaux) => JSON.parse(readFileSync(join(ROOT, ...morceaux), 'utf8'))

const corpus = lire('data', 'recipes', 'corpus-v3.json')
const catalogue = lire('scripts', 'data', 'out', 'recipe-food-catalog.json').forms
const rapport = lire('scripts', 'data', 'out', 'recipe-food-match-report.json')

const parForme = new Map(catalogue.map((forme) => [forme.canonical_name_normalized, forme]))
const eligibilite = new Map(rapport.recipe_eligibility.map((recette) => [recette.code, recette]))
const publiables = corpus.recipes.filter((recette) => eligibilite.get(recette.code)?.eligible_for_publication)

/** Le référentiel, recollé comme la couche de calcul le recolle au build. */
const prix = new Map()
const doublons = []
for (const nom of TRANCHES) {
  for (const entree of lire('data', 'prices', 'tranches', `${nom}.json`).entries || []) {
    const cle = entree.form_normalized || normalizeName(entree.form)
    if (prix.has(cle)) doublons.push(`${entree.form} — ${prix.get(cle).tranche} et ${nom}`)
    else prix.set(cle, { ...entree, tranche: nom })
  }
}

/**
 * Les calories servent de proxy au poids de l'ingrédient dans l'assiette.
 *
 * On ne peut PAS pondérer par la valeur, qui serait la mesure idéale : ce serait
 * circulaire, puisqu'on pondérerait par le coût des lignes dont on ignore
 * justement le coût. Les calories sont disponibles pour tout le corpus et
 * séparent correctement le laurier de la viande, ce qui est ce qu'on demande ici.
 */
const kcalDe = (ingredient) => {
  const forme = parForme.get(normalizeName(ingredient.form))
  if (!forme?.per100g?.kcal || ingredient.unit !== 'g') return null
  return (Number(ingredient.quantity) / 100) * forme.per100g.kcal
}

let lignes = 0
let lignesChiffrees = 0
let kcalTotal = 0
let kcalChiffrees = 0
const manquantes = new Map()
const parConfiance = {}
const recettes = []

for (const recette of publiables) {
  let lignesRecette = 0
  let chiffreesRecette = 0
  let kcalRecette = 0
  let kcalChiffreeRecette = 0

  for (const ingredient of recette.ingredients) {
    const cle = normalizeName(ingredient.form)
    const entree = prix.get(cle)
    const kcal = kcalDe(ingredient)

    lignes += 1
    lignesRecette += 1
    if (kcal != null) { kcalTotal += kcal; kcalRecette += kcal }

    if (entree) {
      lignesChiffrees += 1
      chiffreesRecette += 1
      if (kcal != null) { kcalChiffrees += kcal; kcalChiffreeRecette += kcal }
      parConfiance[entree.confidence] = (parConfiance[entree.confidence] || 0) + 1
    } else {
      const vu = manquantes.get(ingredient.form) || { lignes: 0, kcal: 0 }
      vu.lignes += 1
      vu.kcal += kcal || 0
      manquantes.set(ingredient.form, vu)
    }
  }

  recettes.push({
    code: recette.code,
    family: recette.family,
    pct: lignesRecette ? chiffreesRecette / lignesRecette * 100 : 0,
    pctByMass: kcalRecette ? kcalChiffreeRecette / kcalRecette * 100 : 0,
  })
}

// Le contrat (§8) refuse d'afficher un montant sous 70 % des lignes OU sous 90 %
// des calories. Le second seuil est celui qui attrape la viande manquante ; le
// premier attrape le total bâti sur trois ingrédients. On compte donc les
// recettes réellement AFFICHABLES, pas celles « plutôt bien couvertes ».
const affichables = recettes.filter((r) => r.pct >= 70 && r.pctByMass >= 90)
const paliers = (seuil) => recettes.filter((r) => r.pct >= seuil).length

const pct = (part, tout) => tout ? Number((part / tout * 100).toFixed(1)) : 0

console.log(`Référentiel : ${prix.size} formes chiffrées sur ${TRANCHES.length} tranches.`)
if (doublons.length) {
  console.log(`\n⚠ ${doublons.length} forme(s) présente(s) dans deux tranches :`)
  for (const ligne of doublons) console.log(`   ${ligne}`)
}

console.log(`\nCorpus servi : ${publiables.length} recettes publiables, ${lignes} lignes d'ingrédients.`)
console.log(`  lignes chiffrées   : ${lignesChiffrees} / ${lignes} = ${pct(lignesChiffrees, lignes)} %`)
console.log(`  calories chiffrées : ${pct(kcalChiffrees, kcalTotal)} %   ← la mesure qui compte`)
console.log(`\nConfiance des lignes chiffrées : ${JSON.stringify(parConfiance)}`)

console.log(`\nRecettes par couverture de lignes :`)
console.log(`  ≥ 90 % : ${paliers(90)}`)
console.log(`  ≥ 70 % : ${paliers(70)}`)
console.log(`  < 70 % : ${recettes.length - paliers(70)}`)
console.log(`\nRecettes AFFICHABLES au sens du contrat §8 (≥ 70 % des lignes ET ≥ 90 % des calories) :`)
console.log(`  ${affichables.length} / ${recettes.length} = ${pct(affichables.length, recettes.length)} %`)

const restant = [...manquantes.entries()]
  .map(([forme, vu]) => ({ forme, ...vu }))
  .sort((gauche, droite) => droite.kcal - gauche.kcal)

console.log(`\n── ${manquantes.size} formes sans prix. Les 25 qui pèsent le plus de CALORIES ──`)
console.log('   (c\'est la liste de travail : les chiffrer débloque le plus d\'assiettes)')
for (const forme of restant.slice(0, 25)) {
  console.log(`  ${String(Math.round(forme.kcal)).padStart(7)} kcal  ${String(forme.lignes).padStart(3)} lignes  ${forme.forme}`)
}

const sortie = argument('--json', null)
if (sortie) {
  writeFileSync(sortie, `${JSON.stringify({
    formes_chiffrees: prix.size,
    doublons,
    lignes, lignesChiffrees,
    pct_lignes: pct(lignesChiffrees, lignes),
    pct_calories: pct(kcalChiffrees, kcalTotal),
    par_confiance: parConfiance,
    affichables: affichables.length,
    recettes: recettes.length,
    manquantes: restant,
  }, null, 2)}\n`)
  console.log(`\nRapport écrit : ${sortie}`)
}
