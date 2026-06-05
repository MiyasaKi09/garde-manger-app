// Validation hors-ligne du résolveur contre les exports CSV réels.
// node scripts/validate-resolver.mjs
import { readFileSync } from 'node:fs'
import {
  buildCatalogIndex, resolveIngredient,
} from '../lib/ingredientResolver.js'

const CSV = 'supabase/exports/latest/csv'

// --- mini parseur CSV (quote-aware) ---
function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += ch
    } else {
      if (ch === '"') inQ = true
      else if (ch === ',') { row.push(field); field = '' }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (ch === '\r') { /* skip */ }
      else field += ch
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}
function loadTable(name) {
  const rows = parseCsv(readFileSync(`${CSV}/${name}.csv`, 'utf8'))
  const header = rows[0]
  return rows.slice(1).filter(r => r.length === header.length).map(r =>
    Object.fromEntries(header.map((h, i) => [h, r[i]])))
}

const canonicalFoods = loadTable('canonical_foods').map(r => ({
  id: Number(r.id), canonical_name: r.canonical_name, keywords: null,
}))
const archetypes = loadTable('archetypes').map(r => ({
  id: Number(r.id), name: r.name,
  canonical_food_id: r.canonical_food_id ? Number(r.canonical_food_id) : null,
  is_default: r.is_default === 't',
}))

const candidates = buildCatalogIndex({ canonicalFoods, archetypes })
const byCanon = new Map(canonicalFoods.map(c => [c.id, c.canonical_name]))
const byArch = new Map(archetypes.map(a => [a.id, a.name]))

// --- ingrédients réels : extraits des recettes générées ("name": "...") ---
const grText = readFileSync(`${CSV}/generated_recipes.csv`, 'utf8')
// Dans le CSV, les guillemets JSON sont doublés : ""name"": ""Blanc de poulet""
const names = [...grText.matchAll(/""name""\s*:\s*""(.*?)""\s*[,}]/g)]
  .map(m => m[1].replace(/""/g, '"').trim())
  .filter(Boolean)
const unique = [...new Set(names)]

// Sans stock (pire cas catalogue pur)
const noStock = { canonicalIds: new Set(), archetypeIds: new Set() }
let matched = 0
const unmatched = []
const samples = []
for (const n of unique) {
  const r = resolveIngredient(n, { candidates, stock: noStock })
  if (r.match_status !== 'unmatched') {
    matched++
    if (samples.length < 25) {
      const target = r.archetype_id ? `arch:${byArch.get(r.archetype_id)}` : `canon:${byCanon.get(r.canonical_food_id)}`
      samples.push(`  ✓ ${n.padEnd(34)} → ${target}  [${r.match_status} ${r.confidence}]`)
    }
  } else {
    unmatched.push(n)
  }
}

console.log(`\nCatalogue: ${canonicalFoods.length} canoniques, ${archetypes.length} archétypes, ${candidates.length} candidats`)
console.log(`Ingrédients uniques testés: ${unique.length}`)
console.log(`Matchés: ${matched}  (${Math.round(matched / unique.length * 100)}%)  — Non matchés: ${unmatched.length}\n`)
console.log('Échantillon de résolutions:')
console.log(samples.join('\n'))
console.log(`\nNon matchés (${unmatched.length}):`)
console.log('  ' + unmatched.slice(0, 60).join(' · '))

// --- gain attendu APRÈS migration 024 (canoniques manquants + keywords) ---
const EXTRA = [
  ['pâtes', ['penne', 'penne rigate', 'orecchiette', 'spaghetti', 'fusilli', 'macaroni', 'coquillette', 'tagliatelle', 'lasagne', 'lasagnes', 'feuilles de lasagnes', 'rigatoni', 'nouilles']],
  ['boulgour', ['boulghour', 'bulgur']],
  ['semoule', ['couscous']],
  ['naan', ['pain naan', 'naan nature']],
  ['nachos', ['tortilla chips']],
  ['tofu', ['tofu ferme', 'tofu fumé', 'tofu soyeux']],
  ['halloumi', ['fromage à griller']],
  ['chorizo', ['chorizo doux', 'chorizo fort']],
  ['guanciale', ['joue de porc']],
  ['lieu jaune', ['lieu', 'dos de lieu']],
  ['sésame', ['huile de sésame', 'graines de sésame']],
  ['tahini', ['tahin', 'purée de sésame']],
  ['saindoux', ['graisse de porc']],
  ['mayonnaise', ['mayo']],
  ['ketchup', []],
  ['pesto', ['pesto rosso', 'pesto verde']],
  ['câpres', ['capre']],
  ['gochujang', ['pâte de piment coréenne']],
  ['mirin', ['vin de riz']],
  ['nuoc-mâm', ['nuoc mam', 'sauce poisson']],
  ['kimchi', []],
  ['harissa', ['pâte de piment']],
  ['ras el-hanout', ['ras-el-hanout', 'ras el hanout']],
  ['herbes de Provence', ['mélange provençal']],
  ['galanga', []],
  ['combava', ['kaffir', 'feuilles de kaffir', 'feuilles de combava']],
].map(([canonical_name, keywords], i) => ({ id: 90000 + i, canonical_name, keywords }))

const candidates2 = buildCatalogIndex({ canonicalFoods: [...canonicalFoods, ...EXTRA], archetypes })
let matched2 = 0
const stillUnmatched = []
for (const n of unique) {
  const r = resolveIngredient(n, { candidates: candidates2, stock: noStock })
  if (r.match_status !== 'unmatched') matched2++
  else stillUnmatched.push(n)
}
console.log(`\nAvec migration 024 : ${matched2}/${unique.length} (${Math.round(matched2 / unique.length * 100)}%)  — restants: ${stillUnmatched.length}`)
console.log('  ' + stillUnmatched.slice(0, 40).join(' · '))

// --- démonstration du biais stock (promotion du statut + confiance) ---
console.log('\n— Biais stock (ex: "Oignons émincés") —')
const oignon = canonicalFoods.find(c => c.canonical_name === 'oignon')
const demo = (label, stock) => {
  const r = resolveIngredient('Oignons émincés', { candidates, stock })
  const t = r.archetype_id ? byArch.get(r.archetype_id) : byCanon.get(r.canonical_food_id)
  console.log(`  ${label.padEnd(26)} → ${t}  [${r.match_status} ${r.confidence}]`)
}
demo('sans oignon en stock', noStock)
if (oignon) demo('oignon en stock', { canonicalIds: new Set([oignon.id]), archetypeIds: new Set() })
