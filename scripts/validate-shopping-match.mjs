// Valide le matching plat→recette (logique de lib/shoppingListBuilder.js)
// contre les exports CSV réels. node scripts/validate-shopping-match.mjs
import { readFileSync } from 'node:fs'
const CSV = 'supabase/exports/latest/csv'

function parseCsv(text) {
  const rows = []; let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false } else field += ch }
    else if (ch === '"') inQ = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (ch !== '\r') field += ch
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}
function loadTable(name) {
  const rows = parseCsv(readFileSync(`${CSV}/${name}.csv`, 'utf8'))
  const h = rows[0]
  return rows.slice(1).filter(r => r.length === h.length).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])))
}

// --- copies des fonctions à valider ---
function normalizeRecipeName(name) {
  if (!name) return ''
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}
function dishNameFromDesc(desc) {
  if (!desc) return null
  const c = desc.indexOf(':')
  const base = c > 0 && c < 60 ? desc.substring(0, c) : desc
  const name = (base.split(/\s+\d/)[0] || base).trim()
  return name.length > 3 ? name : null
}
const coreTokens = norm => new Set((norm || '').split('-').filter(t => t.length >= 3))
function matchRecipe(norm, recipes) {
  let exact = recipes.find(r => r.name_normalized === norm); if (exact) return { r: exact, how: 'exact' }
  const prefix = recipes.find(r => r.name_normalized?.startsWith(norm + '-') || norm.startsWith(r.name_normalized + '-'))
  if (prefix) return { r: prefix, how: 'prefix' }
  const want = coreTokens(norm); if (!want.size) return null
  let best = null, bestScore = 0
  for (const r of recipes) {
    const have = coreTokens(r.name_normalized); if (!have.size) continue
    let s = 0; for (const t of want) if (have.has(t)) s++
    const score = s / Math.max(want.size, have.size)
    if (score > bestScore) { bestScore = score; best = r }
  }
  return bestScore >= 0.6 ? { r: best, how: `overlap ${bestScore.toFixed(2)}` } : null
}

const recipes = loadTable('generated_recipes').map(r => ({ id: r.id, name_normalized: r.name_normalized }))
const meals = loadTable('nutrition_plan_meals').filter(m => ['dejeuner', 'diner'].includes(m.meal_type))

const dishes = new Map()
for (const m of meals) {
  const name = dishNameFromDesc(m.description); if (!name) continue
  const norm = normalizeRecipeName(name); if (!norm) continue
  if (!dishes.has(norm)) dishes.set(norm, name)
}

let matched = 0; const miss = []; const ex = []
for (const [norm, name] of dishes) {
  const m = matchRecipe(norm, recipes)
  if (m) { matched++; if (ex.length < 20) ex.push(`  ✓ ${name.slice(0, 36).padEnd(38)} → ${m.r.name_normalized.slice(0, 40)} [${m.how}]`) }
  else miss.push(name)
}
console.log(`\nRecettes en base: ${recipes.length}  |  Plats uniques (dej+dîner): ${dishes.size}`)
console.log(`Matchés: ${matched} (${Math.round(matched / dishes.size * 100)}%)  —  Non matchés: ${miss.length}\n`)
console.log(ex.join('\n'))
console.log(`\nNon matchés (${miss.length}):\n  ` + miss.slice(0, 50).join(' · '))
