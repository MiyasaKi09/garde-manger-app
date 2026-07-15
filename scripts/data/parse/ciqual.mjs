/**
 * Fabrique V2 — parseur Ciqual (XLS → enregistrements bruts homogènes).
 * Réf. MYKO_DATA_FOUNDATION_V2 §5.4 (Parse). Étape idempotente.
 */
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import XLSX from 'xlsx'
import { COL, mapNutrientColumns } from '../lib/ciqual-nutrients.mjs'
import { parseCiqualValue } from '../lib/normalize.mjs'

/**
 * @param {string} filePath chemin du .xls Ciqual
 * @returns {{ header:string[], nutrientMap:object, records:object[] }}
 *   record = { alim_code, alim_nom_fr, alim_nom_sci, grp_nom, ssgrp_nom, ssssgrp_nom,
 *              values:{code:amount}, statuses:{code:status} }
 */
export function parseCiqualWorkbook(filePath) {
  // The source archive is committed as `.xls.gz` so the complete official
  // workbook stays reproducible without an extra network download.
  const source = readFileSync(filePath)
  const workbookBuffer = filePath.toLowerCase().endsWith('.gz') ? gunzipSync(source) : source
  const wb = XLSX.read(workbookBuffer, { type: 'buffer' })
  const ws = wb.Sheets['compo'] || wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })
  const header = rows[0].map((h) => (h == null ? '' : String(h)))
  const nutrientMap = mapNutrientColumns(header)

  const records = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r[COL.alim_code] == null) continue
    const values = {}
    const statuses = {}
    for (const [code, { index }] of Object.entries(nutrientMap)) {
      const { amount, status } = parseCiqualValue(r[index])
      statuses[code] = status
      if (amount != null) values[code] = amount
    }
    records.push({
      alim_code: String(r[COL.alim_code]),
      alim_nom_fr: r[COL.alim_nom_fr] != null ? String(r[COL.alim_nom_fr]).trim() : '',
      alim_nom_sci: r[COL.alim_nom_sci] != null ? String(r[COL.alim_nom_sci]).trim() : null,
      grp_nom: r[COL.grp_nom] != null ? String(r[COL.grp_nom]) : '',
      ssgrp_nom: r[COL.ssgrp_nom] != null ? String(r[COL.ssgrp_nom]) : '',
      ssssgrp_nom: r[COL.ssssgrp_nom] != null ? String(r[COL.ssssgrp_nom]) : '',
      values,
      statuses,
    })
  }
  return { header, nutrientMap, records }
}
