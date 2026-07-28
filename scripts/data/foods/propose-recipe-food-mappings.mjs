/**
 * Prépare l'arbitrage canonique des formes d'aliments qui bloquent les recettes.
 *
 * La Bible pose la règle : « un concept culinaire = un seul ingrédient
 * canonique ». Concrètement, plusieurs libellés de recette — « Huile végétale »,
 * « Huile de friture », « Huile végétale raffinée » — doivent se réduire au même
 * ingrédient. Ce script ne décide rien : il rassemble, pour chaque forme non
 * résolue, ce qu'il faut pour trancher.
 *
 * Il n'écrit AUCUN mapping. Il produit un dossier d'arbitrage, trié par le
 * nombre de recettes que chaque décision débloque, afin que les lots soient
 * choisis par leur effet et non par ordre alphabétique.
 *
 *   node scripts/data/foods/propose-recipe-food-mappings.mjs --limit 50
 *   node scripts/data/foods/propose-recipe-food-mappings.mjs --json > lot.json
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseCiqualWorkbook } from '../parse/ciqual.mjs'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS_PATH = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const CIQUAL_PATH = join(ROOT, 'data', 'sources', 'raw', 'ciqual_2020_FR_2020-07-07.xls.gz')
const MAPPINGS_PATH = join(ROOT, 'data', 'foods', 'recipe-food-mappings-v3.json')
const CATALOG_PATH = join(ROOT, 'scripts', 'data', 'out', 'recipe-food-catalog.json')
const NUTRITION_PATH = join(ROOT, 'data', 'ciqual_nutrition_import.csv')

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const limitFlag = args.indexOf('--limit')
const limit = limitFlag >= 0 ? Number(args[limitFlag + 1]) : 40

const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'))
const curated = existsSync(MAPPINGS_PATH)
  ? JSON.parse(readFileSync(MAPPINGS_PATH, 'utf8')).mappings || {}
  : {}
const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'))
const resolues = new Set(catalog.forms.map((form) => form.canonical_name_normalized))
const { records } = parseCiqualWorkbook(CIQUAL_PATH)

const mots = (value) => normalizeName(value).split(' ').filter((mot) => mot.length >= 4)

/** Index inversé mot → références Ciqual, pour proposer sans deviner. */
const parMot = new Map()
for (const record of records) {
  for (const mot of mots(record.alim_nom_fr)) {
    if (!parMot.has(mot)) parMot.set(mot, new Set())
    parMot.get(mot).add(record)
  }
}

// L'énergie ne figure PAS dans le classeur : elle vient du même CSV que celui
// qu'utilise build-recipe-food-corpus. S'en écarter donnerait un dossier
// d'arbitrage incohérent avec ce que le générateur sait réellement calculer.
const energieParCode = new Map()
for (const ligne of readFileSync(NUTRITION_PATH, 'utf8').split(/\r?\n/).slice(1)) {
  if (!ligne.trim()) continue
  const colonnes = ligne.split(',')
  if (colonnes[1] !== '') energieParCode.set(colonnes[0], Number(colonnes[1]))
}
const kcalDe = (record) => energieParCode.get(String(record.alim_code))
const macrosCompletes = (record) => Number.isFinite(kcalDe(record))
  && ['protein_g', 'carbohydrate_g', 'fat_g'].every((cle) => Number.isFinite(Number(record.values?.[cle])))

/**
 * Formes réellement utilisées par le corpus, avec le nombre de recettes qui en
 * dépendent. Une forme déjà résolue ou déjà arbitrée est écartée.
 */
const formes = new Map()
for (const recipe of corpus.recipes) {
  for (const ingredient of recipe.ingredients || []) {
    if (ingredient.optional) continue
    const cle = normalizeName(ingredient.form)
    if (resolues.has(cle) || curated[cle]) continue
    const entree = formes.get(cle) || { libelle: ingredient.form, cle, recettes: new Set(), unites: new Set() }
    entree.recettes.add(recipe.code)
    entree.unites.add(ingredient.unit)
    formes.set(cle, entree)
  }
}

const propositions = [...formes.values()]
  .map((forme) => {
    const termes = mots(forme.libelle)
    const scores = new Map()
    for (const terme of termes) {
      for (const record of parMot.get(terme) || []) {
        scores.set(record, (scores.get(record) || 0) + 1)
      }
    }
    const candidats = [...scores.entries()]
      .map(([record, communs]) => ({
        record,
        // Score simple et lisible : part des mots de la forme retrouvés dans le
        // libellé Ciqual, pénalisée par la longueur du libellé Ciqual pour
        // préférer « Ciboulette, fraîche » à « Salade composée à la ciboulette ».
        score: communs / Math.max(termes.length, 1) - mots(record.alim_nom_fr).length * 0.02,
        communs,
      }))
      .filter((candidat) => candidat.communs > 0 && macrosCompletes(candidat.record))
      .sort((gauche, droite) => droite.score - gauche.score)
      .slice(0, 5)
    return {
      forme: forme.libelle,
      cle: forme.cle,
      recettes_bloquees: forme.recettes.size,
      unites: [...forme.unites].sort(),
      candidats: candidats.map((candidat) => ({
        alim_code: String(candidat.record.alim_code),
        nom: candidat.record.alim_nom_fr,
        groupe: candidat.record.grp_nom || null,
        score: Number(candidat.score.toFixed(3)),
        kcal: kcalDe(candidat.record),
        proteines: Number(candidat.record.values.protein_g),
      })),
    }
  })
  .sort((gauche, droite) => droite.recettes_bloquees - gauche.recettes_bloquees
    || gauche.cle.localeCompare(droite.cle, 'fr'))

if (asJson) {
  process.stdout.write(`${JSON.stringify({ generated_from: 'ciqual_2020', total: propositions.length, propositions }, null, 2)}\n`)
} else {
  const sansCandidat = propositions.filter((item) => !item.candidats.length)
  console.log(`Formes non résolues encore utilisées par le corpus : ${propositions.length}`)
  console.log(`  dont sans aucun candidat Ciqual 2020 : ${sansCandidat.length}`)
  console.log(`  recettes concernées au total : ${new Set(corpus.recipes.map((r) => r.code)).size}\n`)
  for (const item of propositions.slice(0, limit)) {
    console.log(`${String(item.recettes_bloquees).padStart(3)} recettes │ ${item.forme}  (unités : ${item.unites.join(', ')})`)
    if (!item.candidats.length) {
      console.log('              └─ AUCUN candidat Ciqual — source externe nécessaire')
      continue
    }
    for (const candidat of item.candidats.slice(0, 3)) {
      console.log(`              ├─ ${candidat.alim_code}  ${candidat.nom}  (${candidat.kcal} kcal, ${candidat.proteines} g prot)`)
    }
  }
}
