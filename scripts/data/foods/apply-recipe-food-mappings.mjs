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
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseCiqualWorkbook } from '../parse/ciqual.mjs'
import { normalizeName } from '../lib/normalize.mjs'
import { comblerParAtwater } from '../lib/atwater.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CIQUAL_PATH = join(ROOT, 'data', 'sources', 'raw', 'ciqual_2020_FR_2020-07-07.xls.gz')
const MAPPINGS_PATH = join(ROOT, 'data', 'foods', 'recipe-food-mappings-v3.json')
const NUTRITION_PATH = join(ROOT, 'data', 'ciqual_nutrition_import.csv')
const USDA_PATH = join(ROOT, 'data', 'foods', 'usda-reference', 'sr-legacy-macros.json.gz')

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

// Certains aliments n'existent tout simplement pas dans le classeur français :
// ghee, paneer, masa harina, riz rond. Le protocole prévoit alors USDA, à
// condition que l'identifiant soit vérifié — trois transcriptions sur dix se
// sont déjà trompées d'aliment sans que les chiffres le montrent.
const usdaParId = new Map()
if (existsSync(USDA_PATH)) {
  const usda = JSON.parse(gunzipSync(readFileSync(USDA_PATH)).toString('utf8'))
  for (const entree of usda.entries || []) usdaParId.set(String(entree.fdc_id), entree)
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
  const fdcId = String(decision.usda_fdc_id || '').trim()
  if (!code && !fdcId) { rejeter('ni code Ciqual ni identifiant USDA'); continue }

  const record = code ? parCode.get(code) : null
  if (code && !record) { rejeter(`code Ciqual inexistant : ${code}`); continue }

  const usda = fdcId ? usdaParId.get(fdcId) : null
  if (fdcId && !usda) { rejeter(`identifiant USDA introuvable : ${fdcId}`); continue }
  // Le libellé attendu est obligatoire dès qu'on cite USDA : c'est lui qui
  // rend une erreur de transcription visible.
  if (usda && String(decision.usda_name || '').trim() !== usda.description) {
    rejeter(`USDA ${fdcId} est « ${usda.description} », la décision annonce « ${decision.usda_name || '(rien)'} »`)
    continue
  }

  // Une macro manquante rend l'ingrédient impropre à tout calcul déterministe :
  // le matérialiseur l'abandonnerait, et la recette resterait bloquée sans que
  // le mapping le signale. USDA peut combler, jamais remplacer.
  const kcal = code ? energieParCode.get(code) : usda?.per100g.kcal
  // Même lecture du classeur que le générateur : valeur mesurée, puis borne
  // supérieure d'un statut « inférieur à » — l'ANSES s'en sert elle-même pour
  // calculer l'énergie de ces aliments. Une lecture plus stricte ici ferait
  // refuser des décisions que le générateur, lui, accepterait.
  const lireCiqual = (champ) => {
    if (!record) return NaN
    if (Number.isFinite(record.values?.[champ])) return Number(record.values[champ])
    const borne = Number(record.upper_bounds?.[champ])
    return Number.isFinite(borne) ? borne : NaN
  }
  const macros = ['protein_g', 'carbohydrate_g', 'fat_g'].map((champ, index) => {
    const ciqual = lireCiqual(champ)
    if (Number.isFinite(ciqual)) return ciqual
    return Number(usda?.per100g[['proteinG', 'carbsG', 'fatG'][index]])
  })
  const energie = Number.isFinite(kcal) ? kcal : Number(usda?.per100g.kcal)
  // Une macro encore manquante après Ciqual et USDA n'est pas rédhibitoire si
  // la fermeture d'Atwater peut la clore — c'est ce que fait le générateur, et
  // refuser ici alors qu'il accepterait rejetterait des décisions valables.
  const fibres = record ? lireCiqual('fiber_g') : Number(usda?.per100g.fiberG)
  const cloture = macros.every(Number.isFinite) ? null : comblerParAtwater({
    energy_kcal: energie,
    protein_g: macros[0],
    carbohydrate_g: macros[1],
    fat_g: macros[2],
    fiber_g: fibres,
  })
  if (!Number.isFinite(energie) || (!macros.every(Number.isFinite) && !cloture)) {
    rejeter(`macronutriments incomplets pour ${code ? `${code} « ${record.alim_nom_fr} »` : `USDA ${fdcId}`}`)
    continue
  }

  const confiance = ['A', 'B', 'C'].includes(decision.confidence) ? decision.confidence : null
  if (!confiance) { rejeter('niveau de confiance absent ou invalide'); continue }
  if (confiance === 'C' && !String(decision.note || '').trim()) {
    rejeter('proxy nutritionnel (confiance C) sans note explicative')
    continue
  }
  // Un recours à USDA est toujours un choix qui se justifie : soit l'aliment
  // manque à Ciqual, soit l'ANSES ne mesure pas tout. Dans les deux cas la
  // raison doit être écrite, quelle que soit la confiance.
  if (usda && !String(decision.note || '').trim()) {
    rejeter('recours à USDA sans note expliquant pourquoi Ciqual ne suffit pas')
    continue
  }

  const existant = mappings[cle]
  const memeCible = existant
    && String(existant.ciqual_alim_code || '') === code
    && String(existant.usda_fdc_id || '') === fdcId
  if (existant && !memeCible) {
    rejeter(`écrase un mapping existant (${existant.ciqual_alim_code || existant.usda_fdc_id}) — arbitrage explicite requis`)
    continue
  }

  retenus.push({
    cle,
    forme: decision.forme,
    entree: {
      ...(code ? { ciqual_alim_code: code } : {}),
      ...(fdcId ? { usda_fdc_id: fdcId, usda_name: usda.description } : {}),
      ...(Number.isFinite(decision.grams_per_unit) ? { grams_per_unit: decision.grams_per_unit } : {}),
      ...(Number.isFinite(decision.density_g_per_ml) ? { density_g_per_ml: decision.density_g_per_ml } : {}),
      ...(confiance === 'A' ? {} : { confidence: confiance }),
      ...(decision.note ? { note: decision.note } : {}),
    },
    nom_ciqual: record?.alim_nom_fr || usda.description,
    kcal: energie,
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
