#!/usr/bin/env node
/**
 * Import / complétion des micronutriments CIQUAL dans nutritional_data.
 *
 * Lit data/ciqual_nutrition_import.csv (export CIQUAL ANSES, clé = source_id =
 * alim_code) et remplit les colonnes nutritionnelles MANQUANTES (NULL) de
 * nutritional_data, sans écraser les valeurs déjà présentes (curées « vraiment
 * vrai »). Comble notamment le sélénium et le cholestérol, totalement absents.
 *
 * Idempotent (NULL-fill via COALESCE). À relancer après toute mise à jour CIQUAL.
 *
 * Pré-requis (env ou .env) : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Usage : node scripts/import-ciqual-micros.mjs
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// .env minimal
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* env direct */ }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.')
  process.exit(1)
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

// Colonnes nutritionnelles à compléter (toutes sauf la clé source_id).
const NUTRIENT_COLS = [
  'calories_kcal', 'proteines_g', 'glucides_g', 'lipides_g', 'fibres_g', 'sucres_g',
  'ag_satures_g', 'ag_monoinsatures_g', 'ag_polyinsatures_g', 'cholesterol_mg',
  'calcium_mg', 'fer_mg', 'magnesium_mg', 'phosphore_mg', 'potassium_mg', 'sodium_mg',
  'zinc_mg', 'cuivre_mg', 'selenium_ug', 'iode_ug',
  'vitamine_a_ug', 'beta_carotene_ug', 'vitamine_d_ug', 'vitamine_e_mg', 'vitamine_k_ug',
  'vitamine_c_mg', 'vitamine_b1_mg', 'vitamine_b2_mg', 'vitamine_b3_mg', 'vitamine_b5_mg',
  'vitamine_b6_mg', 'vitamine_b9_ug', 'vitamine_b12_ug',
]

function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = '' }
      if (c === '\r' && text[i + 1] === '\n') i++
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

async function main() {
  const rows = parseCSV(readFileSync(new URL('../data/ciqual_nutrition_import.csv', import.meta.url), 'utf8'))
  const header = rows[0]
  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  if (idx.source_id == null) throw new Error('Colonne source_id absente du CSV')

  const num = (s) => {
    if (s == null || s === '') return null
    const n = Number(String(s).replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }

  let updated = 0, skipped = 0
  for (const r of rows.slice(1)) {
    const sourceId = r[idx.source_id]
    if (!sourceId) { skipped++; continue }

    // Valeurs CIQUAL non nulles uniquement (NULL-fill côté DB).
    const patch = {}
    for (const col of NUTRIENT_COLS) {
      if (idx[col] == null) continue
      const v = num(r[idx[col]])
      if (v != null) patch[col] = v
    }
    if (!Object.keys(patch).length) { skipped++; continue }

    // Ligne DB existante (NULL-fill : ne pas écraser une valeur déjà présente).
    const { data: existing } = await supabase
      .from('nutritional_data')
      .select(['id', ...Object.keys(patch)].join(','))
      .eq('source_id', sourceId)
      .maybeSingle()
    if (!existing) { skipped++; continue }

    const finalPatch = {}
    for (const [col, v] of Object.entries(patch)) {
      if (existing[col] == null) finalPatch[col] = v
    }
    if (!Object.keys(finalPatch).length) { skipped++; continue }

    const { error } = await supabase
      .from('nutritional_data')
      .update(finalPatch)
      .eq('id', existing.id)
    if (error) { console.error(`  ✗ ${sourceId}: ${error.message}`); continue }
    updated++
    if (updated % 200 === 0) console.log(`  … ${updated} lignes complétées`)
  }

  console.log(`✓ Import CIQUAL terminé : ${updated} lignes complétées, ${skipped} ignorées.`)
}

main().catch(e => { console.error('✗ Échec import:', e.message); process.exit(1) })
