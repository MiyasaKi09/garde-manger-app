// Valide l'extraction recette + dédup (lib/recipeImporter.js) sur les CSV réels.
// node scripts/validate-recipe-import.mjs
import { readFileSync } from 'node:fs'
import { parseIngredient } from '../lib/ingredientResolver.js'
const CSV = 'supabase/exports/latest/csv'

function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = '' }
    else if (c !== '\r') f += c
  }
  if (f.length || row.length) { row.push(f); rows.push(row) }
  return rows
}
const load = n => { const r = parseCsv(readFileSync(`${CSV}/${n}.csv`, 'utf8')); const h = r[0]; return r.slice(1).filter(x => x.length === h.length).map(x => Object.fromEntries(h.map((k, i) => [k, x[i]]))) }

// --- copies ---
const normalizeRecipeName = n => !n ? '' : n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
const cleanRecipeName = n => !n ? '' : n.replace(/\(.*?\)/g, '').replace(/\d+[.,]?\d*\s*(g|kg|ml|mL|cl|L)\b/g, '').replace(/\s+/g, ' ').trim()
function parsePlanMeal(desc) {
  if (!desc) return null
  let name, body
  const colon = desc.indexOf(':')
  if (colon > 0 && colon < 60) { name = desc.slice(0, colon).trim(); body = desc.slice(colon + 1) }
  else { const m = desc.match(/\s\d/); name = (m ? desc.slice(0, m.index) : desc).trim(); const p = desc.split('+'); body = p.length > 1 ? p.slice(1).join('+') : '' }
  name = name.replace(/[\s+\-–]+$/, '').trim()
  if (!name || name.length < 3) return null
  const ingredients = []
  for (const part of body.split('+').map(s => s.trim()).filter(Boolean)) {
    const pi = parseIngredient(part); const nm = (pi.raw_name || '').trim()
    if (nm.length > 1 && !/^\d+$/.test(nm)) ingredients.push({ name: nm, quantity: pi.quantity, unit: pi.unit })
  }
  return { name, ingredients }
}
const coreTokens = norm => new Set((norm || '').split('-').filter(t => t.length >= 3))
function matchRecipe(norm, recipes) {
  const e = recipes.find(r => r.name_normalized === norm); if (e) return e
  const p = recipes.find(r => r.name_normalized?.startsWith(norm + '-') || norm.startsWith(r.name_normalized + '-')); if (p) return p
  const want = coreTokens(norm); if (!want.size) return null
  let best = null, bs = 0
  for (const r of recipes) { const have = coreTokens(r.name_normalized); if (!have.size) continue; let s = 0; for (const t of want) if (have.has(t)) s++; const cont = s === want.size || s === have.size; const sc = s / Math.max(want.size, have.size); const eff = cont ? Math.max(sc, 0.75) : sc; if (eff > bs) { bs = eff; best = r } }
  return bs >= 0.6 ? best : null
}

const meals = load('nutrition_plan_meals').filter(m => ['dejeuner', 'diner'].includes(m.meal_type))
const recipes = load('generated_recipes').map(r => ({ id: r.id, name_normalized: r.name_normalized, ingredients: r.ingredients }))

const dishes = new Map()
for (const m of meals) {
  const parsed = parsePlanMeal(m.description); if (!parsed) continue
  const norm = normalizeRecipeName(cleanRecipeName(parsed.name) || parsed.name); if (!norm) continue
  const prev = dishes.get(norm)
  if (!prev || parsed.ingredients.length > prev.ingredients.length) dishes.set(norm, { name: parsed.name, ingredients: parsed.ingredients })
}

let created = 0, matched = 0, emptyCreate = 0
const samples = []
const pool = [...recipes]
for (const [norm, dish] of dishes) {
  const hit = matchRecipe(norm, pool)
  if (hit) { matched++; continue }
  if (!dish.ingredients.length) { emptyCreate++; continue }
  created++; pool.push({ id: 'new', name_normalized: norm, ingredients: dish.ingredients })
  if (samples.length < 14) samples.push(`  + ${dish.name.slice(0, 34).padEnd(36)} [${dish.ingredients.length} ing] ${dish.ingredients.slice(0, 4).map(i => i.name).join(', ')}`)
}
console.log(`\nPlats uniques: ${dishes.size}  |  Recettes existantes: ${recipes.length}`)
console.log(`Dédupliqués (déjà en base): ${matched}`)
console.log(`Créés (nouveaux, avec ingrédients): ${created}`)
console.log(`Ignorés (aucun ingrédient extractible): ${emptyCreate}`)
const totalIng = [...dishes.values()].reduce((s, d) => s + d.ingredients.length, 0)
console.log(`Couverture ingrédients: ${Math.round(totalIng / dishes.size * 10) / 10} ing/plat en moyenne\n`)
console.log('Exemples de recettes créées (nom + ingrédients extraits):')
console.log(samples.join('\n'))
