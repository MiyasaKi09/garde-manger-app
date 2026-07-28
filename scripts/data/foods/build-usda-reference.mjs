/**
 * Distille la référence USDA SR Legacy en un extrait compact et versionné.
 *
 * Ciqual couvre la cuisine française générique, mais pas tout : ghee, paneer,
 * sumac, doubanjiang, vin de Shaoxing n'y figurent pas, et pour une douzaine
 * d'aliments — cabillaud, comté, parmesan, vinaigre — le classeur laisse une
 * ou plusieurs macros non mesurées. Le protocole du corpus prévoit ce cas :
 * USDA FoodData Central en complément, après enregistrement de la source.
 *
 * Le fichier brut fait 210 Mo décompressés : on n'en garde que ce dont le
 * corpus a besoin — identifiant, description, catégorie et les cinq macros —
 * dans un extrait gzippé du même ordre de grandeur que la référence Ciqual.
 *
 * La provenance reste explicite : chaque entrée porte `source: usda_fdc` et son
 * `fdc_id`, pour qu'aucune valeur américaine ne puisse être prise pour une
 * mesure de l'ANSES.
 *
 *   node scripts/data/foods/build-usda-reference.mjs
 *   node scripts/data/foods/build-usda-reference.mjs --check
 */
import { createReadStream, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const RAW = join(ROOT, 'data', 'sources', 'raw', 'sr_legacy.zip')
const OUT_DIR = join(ROOT, 'data', 'foods', 'usda-reference')
const OUT = join(OUT_DIR, 'sr-legacy-macros.json.gz')
const MANIFEST = join(OUT_DIR, 'manifest.json')

const checkOnly = process.argv.includes('--check')

// Identifiants de nutriments SR Legacy. L'énergie existe en deux variantes :
// Atwater générale (1008) et Atwater spécifique (2047/2048). On retient la
// première disponible, dans cet ordre, et on trace laquelle a servi.
const NUTRIMENTS = {
  1008: 'kcal',
  2047: 'kcal_atwater_general',
  2048: 'kcal_atwater_specific',
  1003: 'proteinG',
  1005: 'carbsG',
  1004: 'fatG',
  1079: 'fiberG',
}

if (!existsSync(RAW)) {
  console.error(`Source brute absente : ${RAW}`)
  console.error('Téléchargez-la depuis https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2021-10-28.zip')
  process.exit(2)
}

const empreinteBrute = createHash('sha256').update(readFileSync(RAW)).digest('hex')

/**
 * Le JSON pèse 210 Mo : on le lit en flux et on découpe sur les objets de
 * premier niveau plutôt que de le charger en mémoire.
 */
const lireAliments = () => {
  const brut = execFileSync('unzip', ['-p', RAW], { maxBuffer: 512 * 1024 * 1024 })
  const texte = brut.toString('utf8')
  const debut = texte.indexOf('[')
  const aliments = []
  let profondeur = 0
  let depart = -1
  for (let i = debut; i < texte.length; i += 1) {
    const c = texte[i]
    if (c === '{') { if (profondeur === 0) depart = i; profondeur += 1 }
    else if (c === '}') {
      profondeur -= 1
      if (profondeur === 0 && depart >= 0) {
        aliments.push(texte.slice(depart, i + 1))
        depart = -1
      }
    }
  }
  return aliments
}

const entrees = []
for (const bloc of lireAliments()) {
  let aliment
  try { aliment = JSON.parse(bloc) } catch { continue }
  if (!aliment.fdcId || !aliment.description) continue
  const valeurs = {}
  for (const nutriment of aliment.foodNutrients || []) {
    const cle = NUTRIMENTS[nutriment.nutrient?.id]
    if (!cle) continue
    const montant = Number(nutriment.amount)
    if (Number.isFinite(montant)) valeurs[cle] = montant
  }
  const kcal = valeurs.kcal ?? valeurs.kcal_atwater_general ?? valeurs.kcal_atwater_specific
  entrees.push({
    fdc_id: String(aliment.fdcId),
    description: aliment.description,
    category: aliment.foodCategory?.description || null,
    per100g: {
      kcal: Number.isFinite(kcal) ? kcal : null,
      proteinG: valeurs.proteinG ?? null,
      carbsG: valeurs.carbsG ?? null,
      fatG: valeurs.fatG ?? null,
      fiberG: valeurs.fiberG ?? null,
    },
  })
}

entrees.sort((gauche, droite) => gauche.fdc_id.localeCompare(droite.fdc_id, 'en', { numeric: true }))

const charge = { schema: 'myko://usda-reference/v1', source: 'usda_fdc', dataset: 'sr_legacy', entries: entrees }
const compresse = gzipSync(Buffer.from(`${JSON.stringify(charge)}\n`), { level: 9 })

const complets = entrees.filter((entree) => ['kcal', 'proteinG', 'carbsG', 'fatG']
  .every((cle) => Number.isFinite(entree.per100g[cle])))

const manifeste = {
  schema: 'myko://usda-reference-manifest/v1',
  source_code: 'usda_fdc',
  dataset: 'sr_legacy',
  dataset_version: '2021-10-28',
  license_code: 'cc0-1.0',
  raw_file: 'data/sources/raw/sr_legacy.zip',
  raw_sha256: empreinteBrute,
  extract_path: 'sr-legacy-macros.json.gz',
  extract_sha256: createHash('sha256').update(compresse).digest('hex'),
  entry_count: entrees.length,
  entries_with_complete_macros: complets.length,
  grain: "Une entrée correspond à un aliment SR Legacy, pas à un ingrédient canonique validé.",
  role: "Complément de Ciqual : aliments absents du classeur français, et macronutriments non mesurés par l'ANSES.",
}

if (checkOnly) {
  if (!existsSync(OUT) || !existsSync(MANIFEST)) {
    console.error('Référence USDA absente — lancez la génération.')
    process.exit(1)
  }
  const attendu = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  const reel = createHash('sha256').update(readFileSync(OUT)).digest('hex')
  const ecarts = []
  if (attendu.extract_sha256 !== reel) ecarts.push('empreinte de l’extrait')
  if (attendu.raw_sha256 !== empreinteBrute) ecarts.push('empreinte de la source brute')
  if (attendu.entry_count !== entrees.length) ecarts.push('nombre d’entrées')
  if (ecarts.length) {
    console.error(`Référence USDA périmée : ${ecarts.join(', ')}.`)
    process.exit(1)
  }
  console.log(`Référence USDA valide : ${entrees.length} aliments, ${complets.length} aux macros complètes.`)
} else {
  writeFileSync(OUT, compresse)
  writeFileSync(MANIFEST, `${JSON.stringify(manifeste, null, 2)}\n`)
  console.log(`Référence USDA générée : ${entrees.length} aliments, ${complets.length} aux macros complètes.`)
  console.log(`  extrait : ${(compresse.length / 1024).toFixed(0)} Ko`)
}

export { gunzipSync }
