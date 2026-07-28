/**
 * Applique des décisions d'arbitrage au registre des mappings curés.
 *
 * Le registre `data/foods/recipe-food-mappings-v3.json` est la mémoire des
 * décisions canoniques : forme employée par une recette → référence Ciqual.
 * Ce script y verse un lot arbitré, en refusant tout ce qui ne se vérifie pas.
 *
 * Il ne décide rien non plus. Il contrôle :
 *   - que le code Ciqual existe réellement dans le classeur ;
 *   - que ses macronutriments sont complets, énergie comprise ;
 *   - qu'un proxy assumé (confiance C) porte bien sa note ;
 *   - qu'une décision ne réécrit pas silencieusement un mapping existant.
 *
 *   node scripts/data/foods/apply-recipe-food-mappings.mjs decisions.json
 *   node scripts/data/foods/apply-recipe-food-mappings.mjs decisions.json --dry-run
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseCiqualWorkbook } from '../parse/ciqual.mjs'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CIQUAL_PATH = join(ROOT, 'data', 'sources', 'raw', 'ciqual_2020_FR_2020-07-07.xls.gz')
const MAPPINGS_PATH = join(ROOT, 'data', 'foods', 'recipe-food-mappings-v3.json')
const NUTRITION_PATH = join(ROOT, 'data', 'ciqual_nutrition_import.csv')

const [source, ...flags] = process.argv.slice(2)
if (!source) {
  console.error('Usage : apply-recipe-food-mappings.mjs <decisions.json> [--dry-run]')
  process.exit(2)
}
const dryRun = flags.includes('--dry-run')

const decisions = JSON.parse(readFileSync(source, 'utf8'))
const lot = Array.isArray(decisions) ? decisions : (decisions.confirmees || decisions.decisions || [])

const { records } = parseCiqualWorkbook(CIQUAL_PATH)
const parCode = new Map(records.map((record) => [String(record.alim_code), record]))

const energieParCode = new Map()
for (const ligne of readFileSync(NUTRITION_PATH, 'utf8').split(/\r?\n/).slice(1)) {
  if (!ligne.trim()) continue
  const colonnes = ligne.split(',')
  if (colonnes[1] !== '') energieParCode.set(colonnes[0], Number(colonnes[1]))
}

const registre = JSON.parse(readFileSync(MAPPINGS_PATH, 'utf8'))
const mappings = registre.mappings || {}

const retenus = []
const refuses = []

for (const decision of lot) {
  const cle = normalizeName(decision.cle || decision.forme || '')
  const rejeter = (motif) => refuses.push({ cle, forme: decision.forme, motif })

  if (!cle) { rejeter('clé vide'); continue }
  if (decision.verdict === 'ecarter') { rejeter(`écartée à l'arbitrage : ${decision.motif || 'sans motif'}`); continue }

  const code = String(decision.alim_code || '').trim()
  const record = parCode.get(code)
  if (!record) { rejeter(`code Ciqual inexistant : ${code || '(vide)'}`); continue }

  // Une macro manquante rend l'ingrédient impropre à tout calcul déterministe :
  // le matérialiseur l'abandonnerait, et la recette resterait bloquée sans que
  // le mapping le signale.
  const kcal = energieParCode.get(code)
  const macros = ['protein_g', 'carbohydrate_g', 'fat_g'].map((champ) => Number(record.values?.[champ]))
  if (!Number.isFinite(kcal) || !macros.every(Number.isFinite)) {
    rejeter(`macronutriments incomplets pour ${code} « ${record.alim_nom_fr} »`)
    continue
  }

  const confiance = ['A', 'B', 'C'].includes(decision.confidence) ? decision.confidence : null
  if (!confiance) { rejeter('niveau de confiance absent ou invalide'); continue }
  if (confiance === 'C' && !String(decision.note || '').trim()) {
    rejeter('proxy nutritionnel (confiance C) sans note explicative')
    continue
  }

  const existant = mappings[cle]
  if (existant && String(existant.ciqual_alim_code) !== code) {
    rejeter(`écrase un mapping existant (${existant.ciqual_alim_code}) — arbitrage explicite requis`)
    continue
  }

  retenus.push({
    cle,
    forme: decision.forme,
    entree: {
      ciqual_alim_code: code,
      ...(confiance === 'A' ? {} : { confidence: confiance }),
      ...(decision.note ? { note: decision.note } : {}),
    },
    nom_ciqual: record.alim_nom_fr,
    kcal,
  })
}

for (const item of retenus) mappings[item.cle] = item.entree

const trie = Object.fromEntries(Object.entries(mappings).sort(([gauche], [droite]) => gauche.localeCompare(droite, 'fr')))
registre.mappings = trie

if (!dryRun) {
  writeFileSync(MAPPINGS_PATH, `${JSON.stringify(registre, null, 2)}\n`)
}

console.log(`Décisions reçues : ${lot.length}`)
console.log(`  retenues : ${retenus.length}`)
console.log(`  refusées : ${refuses.length}`)
for (const refus of refuses) console.log(`    ✗ ${refus.forme || refus.cle} — ${refus.motif}`)
console.log(`Registre : ${Object.keys(trie).length} mappings${dryRun ? ' (simulation, rien écrit)' : ''}`)
