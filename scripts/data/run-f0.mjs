/**
 * Fabrique V2 — orchestrateur Release F0 (300 formes) depuis Ciqual.
 * Réf. MYKO_DATA_FOUNDATION_V2 §5.4, §5.6, §5.7, §5.9 (F0).
 *
 * Pipeline : parse → normalise → résout (concept/forme/catégorie) → détecte
 * anomalies → sélectionne 300 formes génériques équilibrées → écrit un ARTEFACT
 * candidat déterministe (aucune écriture DB ici : la publication est faite par
 * l'étape publish avec des droits élevés).
 *
 * Usage : node scripts/data/run-f0.mjs [chemin_xls]
 * Sorties : scripts/data/out/f0-release.json, scripts/data/out/f0-report.json
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseCiqualWorkbook } from './parse/ciqual.mjs'
import { normalizeName, parseFoodName } from './lib/normalize.mjs'
import { resolveCategory } from './lib/categories.mjs'
import { detectAnomalies } from './lib/anomalies.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const XLS = process.argv[2] || join(__dirname, '..', '..', '.data-cache', 'ciqual_2020.xls')
const OUT = join(__dirname, 'out')

// Quotas par catégorie (somme = 300) — F0 : aliments courants du foyer.
const QUOTAS = {
  legumes: 45, fruits: 35, viandes: 30, poissons_fruits_de_mer: 25, produits_laitiers: 30,
  cereales_feculents: 30, volailles: 20, legumineuses: 15, condiments_sauces: 15,
  matieres_grasses: 12, herbes_aromates: 8, epices: 8, produits_sucres: 8, oeufs: 6,
  boissons: 6, produits_transformes: 5, preparations_culinaires: 2,
}
const TARGET = 300

/** Score de "généricité" ménagère : plus haut = plus prioritaire pour F0. */
function genericScore(name, rec) {
  const n = name.toLowerCase()
  let s = 100
  const commas = (name.match(/,/g) || []).length
  s -= commas * 12
  if (/\bcrue?s?\b/.test(n)) s += 15
  if (commas <= 1) s += 12
  if (/pr..?emball|reconstitu|aromatis|assaisonn|plat|fa..?on|recette|sauce\b.*plat/.test(n)) s -= 30
  if (/rillettes|confit|terrine|mousse de|p.t.|quenelle|brochette|hach.|nugget|cordon bleu|pan.|farci|pizza|lasagne|gratin|tarte|quiche/.test(n)) s -= 35
  if (/appertis/.test(n)) s -= 8
  if (/aliment moyen/.test(n)) s += 5 // générique moyen : utile
  if (/b..?b..?|infantile/.test(n)) s -= 100
  return s
}

function main() {
  if (!existsSync(XLS)) {
    console.error(`Fichier Ciqual introuvable : ${XLS}\nLancez d'abord scripts/data/download/ciqual.mjs`)
    process.exit(1)
  }
  const { nutrientMap, records } = parseCiqualWorkbook(XLS)

  const candidates = []
  const rejected = { no_category: 0, no_energy: 0, blocking_anomaly: 0 }
  let warnCount = 0

  for (const rec of records) {
    const category = resolveCategory(rec.grp_nom, rec.ssgrp_nom, rec.alim_nom_fr)
    if (!category) { rejected.no_category++; continue }
    if (rec.values.energy_kcal == null) { rejected.no_energy++; continue }

    const { blocking, warnings } = detectAnomalies(rec.values)
    if (blocking.length) { rejected.blocking_anomaly++; continue }
    if (warnings.length) warnCount++

    const parsed = parseFoodName(rec.alim_nom_fr)
    candidates.push({
      alim_code: rec.alim_code,
      category,
      concept_name: parsed.concept,
      concept_normalized: normalizeName(parsed.concept),
      form_name: rec.alim_nom_fr,
      form_normalized: normalizeName(rec.alim_nom_fr),
      scientific_name: rec.alim_nom_sci || null,
      attributes: {
        cooking_state: parsed.cooking_state,
        preservation_state: parsed.preservation_state,
        physical_state: parsed.physical_state,
        bone_state: parsed.bone_state,
        skin_state: parsed.skin_state,
      },
      values: rec.values,
      statuses: rec.statuses,
      warnings,
      score: genericScore(rec.alim_nom_fr, rec),
    })
  }

  // Sélection équilibrée par quotas, tri déterministe (score desc, alim_code asc).
  const byCat = {}
  for (const c of candidates) (byCat[c.category] ||= []).push(c)
  for (const list of Object.values(byCat)) {
    list.sort((a, b) => b.score - a.score || a.alim_code.localeCompare(b.alim_code))
  }

  const selected = []
  const seenForm = new Set()
  const pick = (c) => {
    if (seenForm.has(c.form_normalized)) return false
    seenForm.add(c.form_normalized)
    selected.push(c)
    return true
  }
  // 1er passage : quotas par catégorie.
  for (const [cat, quota] of Object.entries(QUOTAS)) {
    let n = 0
    for (const c of byCat[cat] || []) {
      if (n >= quota) break
      if (pick(c)) n++
    }
  }
  // 2e passage : compléter jusqu'à 300 avec les meilleurs restants (toutes catégories).
  if (selected.length < TARGET) {
    const rest = candidates
      .filter((c) => !seenForm.has(c.form_normalized))
      .sort((a, b) => b.score - a.score || a.alim_code.localeCompare(b.alim_code))
    for (const c of rest) {
      if (selected.length >= TARGET) break
      pick(c)
    }
  }
  selected.length = Math.min(selected.length, TARGET)

  // Regroupe en concepts (partagés) + formes.
  const concepts = new Map()
  for (const c of selected) {
    if (!concepts.has(c.concept_normalized)) {
      concepts.set(c.concept_normalized, {
        canonical_name: c.concept_name,
        canonical_name_normalized: c.concept_normalized,
        category: c.category,
        scientific_name: c.scientific_name,
      })
    }
  }

  const release = {
    source: { code: 'ciqual_2020', version: '2020-07-07', license: 'etalab-2.0' },
    confidence_level: 'B', // source vérifiée (Ciqual)
    nutrient_units: Object.fromEntries(Object.entries(nutrientMap).map(([k, v]) => [k, v.unit])),
    concepts: [...concepts.values()],
    forms: selected.map((c) => ({
      alim_code: c.alim_code,
      concept_normalized: c.concept_normalized,
      category: c.category,
      canonical_name: c.form_name,
      canonical_name_normalized: c.form_normalized,
      attributes: c.attributes,
      warnings: c.warnings,
      nutrition: { basis_quantity: 100, basis_unit: 'g', values: c.values, statuses: c.statuses },
    })),
  }

  const perCat = {}
  for (const c of selected) perCat[c.category] = (perCat[c.category] || 0) + 1
  const report = {
    parsed_records: records.length,
    candidates: candidates.length,
    rejected,
    selected: selected.length,
    concepts: concepts.size,
    with_warnings: selected.filter((c) => c.warnings.length).length,
    per_category: perCat,
    nutrients_mapped: Object.keys(nutrientMap).length,
  }

  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, 'f0-release.json'), JSON.stringify(release, null, 2))
  writeFileSync(join(OUT, 'f0-report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}

main()
