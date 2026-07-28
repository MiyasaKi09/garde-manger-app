/**
 * Construit le corpus de référence Ciqual 2025 à partir des sources officielles
 * versionnées dans data/sources/raw.
 *
 * Le corpus reste au grain « forme alimentaire source ». Les regroupements en
 * concepts sont des propositions de frontières, jamais des publications.
 *
 * Usage :
 *   node scripts/data/foods/build-ciqual-reference-corpus.mjs
 *   node scripts/data/foods/build-ciqual-reference-corpus.mjs --check
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'
import { normalizeName, parseCiqualValue, parseFoodName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS_DIR = join(ROOT, 'data', 'foods', 'ciqual-reference')
const SOURCE_2020 = join(ROOT, 'data', 'sources', 'raw', 'ciqual_2020_FR_2020-07-07.xls.gz')
const SOURCE_2025 = join(ROOT, 'data', 'sources', 'raw', 'ciqual_2025_FR_v1.0.xlsx.gz')
const CHECK_MODE = process.argv.includes('--check')
const GENERATED_ON = '2026-07-28'
const SOURCE_2025_SHA256 = '5555c572fa3735991298d832d0427788fa69a11b4fd20a5d580d58942369fbb0'
const SOURCE_2025_MD5 = '0d9758ce23f3f13dd63a005bc1bb4f2c'
const ENTRY_SHARD_SIZE = 400
const CANDIDATE_SHARD_SIZE = 400
const RECONCILIATION_SHARD_SIZE = 500

const MYKO_CODE_BY_SOURCE_CODE = {
  327: 'energy_kj',
  328: 'energy_kcal',
  332: 'energy_jones_kj',
  333: 'energy_jones_kcal',
  400: 'water_g',
  10000: 'ash_g',
  10004: 'salt_g',
  10110: 'sodium_mg',
  10120: 'magnesium_mg',
  10150: 'phosphorus_mg',
  10170: 'chloride_mg',
  10190: 'potassium_mg',
  10200: 'calcium_mg',
  10251: 'manganese_mg',
  10260: 'iron_mg',
  10290: 'copper_mg',
  10300: 'zinc_mg',
  10340: 'selenium_ug',
  10530: 'iodine_ug',
  25000: 'protein_jones_g',
  25003: 'protein_g',
  31000: 'carbohydrate_g',
  32000: 'sugars_g',
  32210: 'fructose_g',
  32220: 'galactose_g',
  32250: 'glucose_g',
  32410: 'lactose_g',
  32430: 'maltose_g',
  32480: 'sucrose_g',
  33110: 'starch_g',
  34000: 'polyols_g',
  34100: 'fiber_g',
  40000: 'fat_g',
  40302: 'saturated_fat_g',
  40303: 'monounsaturated_fat_g',
  40304: 'polyunsaturated_fat_g',
  40400: 'butyric_acid_g',
  40600: 'caproic_acid_g',
  40800: 'caprylic_acid_g',
  41000: 'capric_acid_g',
  41200: 'lauric_acid_g',
  41400: 'myristic_acid_g',
  41600: 'palmitic_acid_g',
  41800: 'stearic_acid_g',
  41819: 'oleic_acid_g',
  41826: 'linoleic_acid_g',
  41833: 'alpha_linolenic_acid_g',
  42046: 'arachidonic_acid_g',
  42053: 'epa_g',
  42263: 'dha_g',
  51104: 'vitamin_a_rae_ug',
  51200: 'retinol_ug',
  51330: 'beta_carotene_ug',
  52100: 'vitamin_d_ug',
  52200: 'vitamin_d2_ug',
  52300: 'vitamin_d3_ug',
  53100: 'vitamin_e_mg',
  54101: 'vitamin_k1_ug',
  54104: 'vitamin_k2_ug',
  55100: 'vitamin_c_mg',
  56100: 'vitamin_b1_mg',
  56200: 'vitamin_b2_mg',
  56310: 'vitamin_b3_mg',
  56400: 'vitamin_b5_mg',
  56500: 'vitamin_b6_mg',
  56600: 'vitamin_b12_ug',
  56700: 'folates_total_ug',
  56702: 'folates_dfe_ug',
  56704: 'folates_intrinsic_ug',
  56708: 'folic_acid_added_ug',
  60000: 'alcohol_g',
  65000: 'organic_acids_g',
  71010: 'alpha_tocopherol_mg',
  75100: 'cholesterol_mg',
}

const CORE_NUTRIENTS = ['energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g']
const GRAM_NUTRIENTS = new Set(
  Object.values(MYKO_CODE_BY_SOURCE_CODE).filter((code) => code.endsWith('_g')),
)

const cleanText = (value) => {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

const sourceBuffer = (path) => {
  const raw = readFileSync(path)
  return path.endsWith('.gz') ? gunzipSync(raw) : raw
}

const checksum = (algorithm, value) => createHash(algorithm).update(value).digest('hex')

const readWorkbook = (path) => {
  const buffer = sourceBuffer(path)
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const compositionSheetName = workbook.SheetNames.find((name) =>
    ['compo', 'composition nutritionnelle'].includes(name.toLowerCase()),
  )
  if (!compositionSheetName) throw new Error(`Feuille de composition introuvable : ${path}`)
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[compositionSheetName], {
    header: 1,
    raw: true,
    defval: null,
  })
  return { buffer, workbook, rows }
}

const columnIndex = (header, name) => {
  const index = header.findIndex((entry) => cleanText(entry) === name)
  if (index < 0) throw new Error(`Colonne Ciqual absente : ${name}`)
  return index
}

const unitFromLabel = (label) => {
  const match = cleanText(label).match(/\((kJ|kcal|g|mg|µg)\/100 g\)$/i)
  if (!match) throw new Error(`Unité de constituant illisible : ${label}`)
  return match[1] === 'µg' ? 'ug' : match[1]
}

const buildConstituentRegistry = (workbook, header) => {
  const sheet = workbook.Sheets['codes INFOODS']
  if (!sheet) throw new Error('Feuille « codes INFOODS » absente de Ciqual 2025.')
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null })
  const sourceByName = new Map()
  for (const row of rows.slice(1)) {
    const name = cleanText(row[2])
    if (!name) continue
    sourceByName.set(normalizeName(name), {
      infoods_code: cleanText(row[0]) || null,
      source_code: String(row[1]),
      name_fr: name,
    })
  }

  const registry = []
  for (let index = 9; index <= 82; index++) {
    const headerLabel = cleanText(header[index])
    const source = sourceByName.get(normalizeName(headerLabel))
    if (!source) throw new Error(`Code constituant absent pour : ${headerLabel}`)
    const sourceCodeNumber = Number(source.source_code)
    const mykoCode = MYKO_CODE_BY_SOURCE_CODE[sourceCodeNumber]
    if (!mykoCode) throw new Error(`Code Myko absent pour le constituant ${source.source_code}.`)
    registry.push({
      constituent_id: `CIQ-CONST-${String(source.source_code).padStart(5, '0')}`,
      source_code: source.source_code,
      infoods_code: source.infoods_code,
      myko_code: mykoCode,
      name_fr: source.name_fr,
      unit: unitFromLabel(source.name_fr),
      basis_quantity: 100,
      basis_unit: 'g',
      source_column: index + 1,
    })
  }
  if (registry.length !== 74) throw new Error(`74 constituants attendus, ${registry.length} trouvés.`)
  return registry
}

const parseIdentityRows = (rows) => {
  const header = rows[0]
  const index = {
    groupCode: columnIndex(header, 'alim_grp_code'),
    subgroupCode: columnIndex(header, 'alim_ssgrp_code'),
    subsubgroupCode: columnIndex(header, 'alim_ssssgrp_code'),
    group: columnIndex(header, 'alim_grp_nom_fr'),
    subgroup: columnIndex(header, 'alim_ssgrp_nom_fr'),
    subsubgroup: columnIndex(header, 'alim_ssssgrp_nom_fr'),
    code: columnIndex(header, 'alim_code'),
    name: columnIndex(header, 'alim_nom_fr'),
    scientificName: columnIndex(header, 'alim_nom_sci'),
  }
  const identities = []
  for (const row of rows.slice(1)) {
    const sourceRecordKey = cleanText(row[index.code])
    if (!sourceRecordKey) continue
    identities.push({
      source_record_key: sourceRecordKey,
      name_fr: cleanText(row[index.name]),
      scientific_name: cleanText(row[index.scientificName]) || null,
      source_taxonomy: {
        group_code: cleanText(row[index.groupCode]),
        subgroup_code: cleanText(row[index.subgroupCode]),
        subsubgroup_code: cleanText(row[index.subsubgroupCode]),
        group: cleanText(row[index.group]) || null,
        subgroup: cleanText(row[index.subgroup]) || null,
        subsubgroup: cleanText(row[index.subsubgroup]) || null,
      },
      row,
    })
  }
  return identities
}

const physicalIssues = (values) => {
  const issues = []
  for (const [code, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) issues.push(`invalid_number:${code}`)
    else if (value < 0) issues.push(`negative:${code}`)
    else if (GRAM_NUTRIENTS.has(code) && value > 100.5) issues.push(`over_100g:${code}`)
  }
  if (values.energy_kcal != null && values.energy_kcal > 950) {
    issues.push('energy_out_of_range')
  }
  const macroValues = ['protein_g', 'carbohydrate_g', 'fat_g']
    .map((code) => values[code])
    .filter((value) => value != null)
  if (macroValues.length === 3 && macroValues.reduce((sum, value) => sum + value, 0) > 100.5) {
    issues.push('macro_sum_impossible')
  }
  return issues
}

const buildEntries = (identities, registry) => {
  const entries = []
  const measurementCounts = {
    measured: 0,
    less_than: 0,
    trace: 0,
    not_available: 0,
  }
  const issueCounts = {}

  for (const identity of identities) {
    const values = {}
    const upperBounds = {}
    const traces = []
    const mykoValues = {}
    const mykoStatuses = {}
    const sourceIssues = []

    for (const constituent of registry) {
      const raw = identity.row[constituent.source_column - 1]
      const parsed = parseCiqualValue(raw)
      measurementCounts[parsed.status]++
      mykoStatuses[constituent.myko_code] = parsed.status
      if (parsed.status === 'measured') {
        values[constituent.constituent_id] = parsed.amount
        mykoValues[constituent.myko_code] = parsed.amount
      } else if (parsed.status === 'less_than') {
        upperBounds[constituent.constituent_id] = parsed.upper_bound
        if (parsed.upper_bound <= 0) {
          sourceIssues.push(`nonpositive_upper_bound:${constituent.myko_code}`)
        }
      } else if (parsed.status === 'trace') {
        traces.push(constituent.constituent_id)
      }
    }

    const parsedName = parseFoodName(identity.name_fr)
    const canonicalNameCandidate = cleanText(parsedName.concept)
    const canonicalCandidateKey = normalizeName(canonicalNameCandidate).replace(/\s+/g, '-')
    const qualityIssues = [...sourceIssues]
    if (!identity.source_taxonomy.group || !identity.source_taxonomy.subgroup) {
      qualityIssues.push('missing_taxonomy')
    }
    for (const code of CORE_NUTRIENTS) {
      const status = mykoStatuses[code] || 'not_available'
      if (status !== 'measured') qualityIssues.push(`${status}:${code}`)
    }
    const blockingIssues = physicalIssues(mykoValues)
    qualityIssues.push(...blockingIssues)
    for (const issue of qualityIssues) issueCounts[issue] = (issueCounts[issue] || 0) + 1

    const form = Object.fromEntries(
      Object.entries({
        cooking_state: parsedName.cooking_state,
        preservation_state: parsedName.preservation_state,
        physical_state: parsedName.physical_state,
        bone_state: parsedName.bone_state,
        skin_state: parsedName.skin_state,
      }).filter(([, value]) => value != null),
    )
    const qualityStatus = blockingIssues.length
      ? 'quarantined'
      : qualityIssues.length
        ? 'review'
        : 'accepted'

    entries.push({
      entry_id: `CIQ-${identity.source_record_key.padStart(5, '0')}`,
      record_type: 'food_form_reference',
      source_record_key: identity.source_record_key,
      name_fr: identity.name_fr,
      scientific_name: identity.scientific_name,
      normalized_name: normalizeName(identity.name_fr),
      canonical_name_candidate: canonicalNameCandidate,
      canonical_candidate_key: canonicalCandidateKey,
      source_taxonomy: identity.source_taxonomy,
      form,
      nutrition: {
        basis_quantity: 100,
        basis_unit: 'g',
        values,
        ...(Object.keys(upperBounds).length ? { upper_bounds: upperBounds } : {}),
        ...(traces.length ? { traces } : {}),
        core_values: Object.fromEntries(
          CORE_NUTRIENTS
            .filter((code) => mykoValues[code] != null)
            .map((code) => [code, mykoValues[code]]),
        ),
        core_statuses: Object.fromEntries(
          CORE_NUTRIENTS.map((code) => [code, mykoStatuses[code] || 'not_available']),
        ),
      },
      canonicalization_status: 'pending',
      quality: {
        issues: qualityIssues,
        quality_status: qualityStatus,
      },
    })
  }

  entries.sort((left, right) =>
    Number(left.source_record_key) - Number(right.source_record_key)
      || left.source_record_key.localeCompare(right.source_record_key),
  )
  return { entries, measurementCounts, issueCounts }
}

const buildCandidates = (entries) => {
  const grouped = new Map()
  for (const entry of entries) {
    const key = entry.canonical_candidate_key || entry.normalized_name.replace(/\s+/g, '-')
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(entry)
  }
  return [...grouped.entries()]
    .map(([key, members]) => {
      members.sort((left, right) =>
        Number(left.source_record_key) - Number(right.source_record_key),
      )
      return {
        candidate_id: `CAND-CIQ-${members[0].source_record_key.padStart(5, '0')}`,
        canonical_name_candidate: members[0].canonical_name_candidate,
        normalized_key: key,
        source_entry_ids: members.map((entry) => entry.entry_id),
        source_entry_count: members.length,
        source_groups: [...new Set(members.map((entry) => entry.source_taxonomy.group).filter(Boolean))].sort(),
        source_subgroups: [...new Set(members.map((entry) => entry.source_taxonomy.subgroup).filter(Boolean))].sort(),
        status: 'pending_review',
        review_reason: 'canonical_boundary_to_validate',
      }
    })
    .sort((left, right) =>
      left.normalized_key.localeCompare(right.normalized_key, 'fr')
        || left.candidate_id.localeCompare(right.candidate_id),
    )
}

const parseLegacyCore = (rows) => {
  const header = rows[0].map(cleanText)
  const columnByCode = {
    energy_kcal: header.findIndex((label) => /Energie, R.glement UE.*kcal/i.test(label)),
    protein_g: header.findIndex((label) => /Prot.ines, N x 6\.25/i.test(label)),
    carbohydrate_g: header.findIndex((label) => /^Glucides\b/i.test(label)),
    fat_g: header.findIndex((label) => /^Lipides\b/i.test(label)),
  }
  const identities = parseIdentityRows(rows)
  return new Map(identities.map((identity) => {
    const core = {}
    for (const [code, index] of Object.entries(columnByCode)) {
      if (index < 0) throw new Error(`Colonne historique absente : ${code}`)
      core[code] = parseCiqualValue(identity.row[index])
    }
    return [identity.source_record_key, { ...identity, core }]
  }))
}

const sameTaxonomy = (left, right) =>
  ['group', 'subgroup', 'subsubgroup'].every((field) =>
    normalizeName(left?.[field]) === normalizeName(right?.[field]),
  )

const sameMeasurement = (left, right) =>
  left?.status === right?.status
    && left?.amount === right?.amount
    && left?.upper_bound === right?.upper_bound

const buildReconciliation = (legacyByCode, entries, registry) => {
  const currentByCode = new Map(entries.map((entry) => [entry.source_record_key, entry]))
  const constituentByMykoCode = new Map(registry.map((entry) => [entry.myko_code, entry]))
  const rows = []
  const identityCounts = {
    unchanged: 0,
    renamed: 0,
    taxonomy_changed: 0,
    renamed_and_taxonomy_changed: 0,
    added: 0,
    removed: 0,
  }
  const nutritionCounts = {
    unchanged: 0,
    changed: 0,
    not_comparable: 0,
  }

  const currentMeasurement = (entry, code) => {
    const constituent = constituentByMykoCode.get(code)
    if (!constituent) return null
    if (entry.nutrition.values[constituent.constituent_id] != null) {
      return {
        amount: entry.nutrition.values[constituent.constituent_id],
        status: 'measured',
      }
    }
    if (entry.nutrition.upper_bounds?.[constituent.constituent_id] != null) {
      return {
        amount: null,
        status: 'less_than',
        upper_bound: entry.nutrition.upper_bounds[constituent.constituent_id],
      }
    }
    if (entry.nutrition.traces?.includes(constituent.constituent_id)) {
      return { amount: null, status: 'trace' }
    }
    return { amount: null, status: 'not_available' }
  }

  for (const entry of entries) {
    const legacy = legacyByCode.get(entry.source_record_key)
    if (!legacy) {
      identityCounts.added++
      nutritionCounts.not_comparable++
      rows.push({
        source_record_key: entry.source_record_key,
        previous_entry_id: null,
        current_entry_id: entry.entry_id,
        identity_change: 'added',
        nutrition_change: 'not_comparable',
        migration_action: 'add_source_reference',
      })
      continue
    }
    const renamed = normalizeName(legacy.name_fr) !== entry.normalized_name
    const taxonomyChanged = !sameTaxonomy(legacy.source_taxonomy, entry.source_taxonomy)
    const identityChange = renamed && taxonomyChanged
      ? 'renamed_and_taxonomy_changed'
      : renamed
        ? 'renamed'
        : taxonomyChanged
          ? 'taxonomy_changed'
          : 'unchanged'
    identityCounts[identityChange]++

    const changedCoreNutrients = CORE_NUTRIENTS.filter((code) =>
      !sameMeasurement(legacy.core[code], currentMeasurement(entry, code)),
    )
    const nutritionChange = changedCoreNutrients.length ? 'changed' : 'unchanged'
    nutritionCounts[nutritionChange]++
    rows.push({
      source_record_key: entry.source_record_key,
      previous_entry_id: `CIQ-${entry.source_record_key.padStart(5, '0')}`,
      current_entry_id: entry.entry_id,
      identity_change: identityChange,
      nutrition_change: nutritionChange,
      ...(changedCoreNutrients.length ? { changed_core_nutrients: changedCoreNutrients } : {}),
      migration_action: 'carry_source_code_forward',
    })
  }

  for (const legacy of legacyByCode.values()) {
    if (currentByCode.has(legacy.source_record_key)) continue
    identityCounts.removed++
    nutritionCounts.not_comparable++
    rows.push({
      source_record_key: legacy.source_record_key,
      previous_entry_id: `CIQ-${legacy.source_record_key.padStart(5, '0')}`,
      current_entry_id: null,
      identity_change: 'removed',
      nutrition_change: 'not_comparable',
      migration_action: 'retire_source_reference',
    })
  }
  rows.sort((left, right) =>
    Number(left.source_record_key) - Number(right.source_record_key)
      || left.source_record_key.localeCompare(right.source_record_key),
  )
  return { rows, identityCounts, nutritionCounts }
}

const countBy = (items, getter) => {
  const counts = {}
  for (const item of items) {
    const key = getter(item)
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`

const shardOutputs = (items, size, directory, itemKey, prefix) => {
  const outputs = new Map()
  const metadata = []
  const singular = {
    entries: 'entry',
    candidates: 'candidate',
    changes: 'change',
  }[itemKey]
  if (!singular) throw new Error(`Type de shard inconnu : ${itemKey}`)
  for (let offset = 0; offset < items.length; offset += size) {
    const position = Math.floor(offset / size) + 1
    const shardItems = items.slice(offset, offset + size)
    const filename = `part-${String(position).padStart(4, '0')}.json`
    const path = `${directory}/${filename}`
    const identityKey = itemKey === 'entries'
      ? 'entry_id'
      : itemKey === 'candidates'
        ? 'candidate_id'
        : 'source_record_key'
    outputs.set(join(CORPUS_DIR, path), json({
      schema: `myko://${prefix}-shard/v1`,
      shard: filename.replace('.json', ''),
      [`${singular}_count`]: shardItems.length,
      [itemKey]: shardItems,
    }))
    metadata.push({
      path,
      position,
      [`${singular}_count`]: shardItems.length,
      [`first_${identityKey}`]: shardItems[0]?.[identityKey] || null,
      [`last_${identityKey}`]: shardItems.at(-1)?.[identityKey] || null,
    })
  }
  return { outputs, metadata }
}

function build() {
  for (const path of [SOURCE_2020, SOURCE_2025]) {
    if (!existsSync(path)) throw new Error(`Source Ciqual absente : ${path}`)
  }
  const current = readWorkbook(SOURCE_2025)
  if (checksum('sha256', current.buffer) !== SOURCE_2025_SHA256) {
    throw new Error('Empreinte SHA-256 de la source Ciqual 2025 incorrecte.')
  }
  if (checksum('md5', current.buffer) !== SOURCE_2025_MD5) {
    throw new Error('Empreinte MD5 officielle de la source Ciqual 2025 incorrecte.')
  }
  const legacy = readWorkbook(SOURCE_2020)
  const header = current.rows[0]
  const registry = buildConstituentRegistry(current.workbook, header)
  const identities = parseIdentityRows(current.rows)
  const { entries, measurementCounts, issueCounts } = buildEntries(identities, registry)
  const candidates = buildCandidates(entries)
  const reconciliation = buildReconciliation(parseLegacyCore(legacy.rows), entries, registry)
  const qualityCounts = countBy(entries, (entry) => entry.quality.quality_status)

  const entryShards = shardOutputs(
    entries,
    ENTRY_SHARD_SIZE,
    'shards',
    'entries',
    'food-reference',
  )
  const candidateShards = shardOutputs(
    candidates,
    CANDIDATE_SHARD_SIZE,
    'candidates',
    'candidates',
    'food-canonical-candidate',
  )
  const reconciliationShards = shardOutputs(
    reconciliation.rows,
    RECONCILIATION_SHARD_SIZE,
    'reconciliation',
    'changes',
    'ciqual-reconciliation',
  )

  const outputs = new Map([
    ...entryShards.outputs,
    ...candidateShards.outputs,
    ...reconciliationShards.outputs,
  ])
  const manifest = {
    schema: 'myko://food-reference-corpus/v2',
    schema_version: 2,
    corpus_code: 'MYKO-CIQUAL-REF-2025-1',
    status: 'candidate',
    generated_on: GENERATED_ON,
    locale: 'fr-FR',
    grain: 'Une entrée correspond à une référence de forme alimentaire Ciqual 2025, pas à un ingrédient canonique validé.',
    source: {
      code: 'ciqual_2025',
      name: 'Table de composition nutritionnelle des aliments Ciqual 2025',
      publisher: 'ANSES',
      dataset_doi: '10.57745/RDMHWY',
      file_doi: '10.57745/RPWYZD',
      source_url: 'https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/RDMHWY',
      download_url: 'https://entrepot.recherche.data.gouv.fr/api/access/datafile/:persistentId?persistentId=doi:10.57745/RPWYZD',
      license_code: 'etalab-2.0',
      license_url: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence',
      version: '1.0',
      published_on: '2025-11-19',
      raw_path: relative(ROOT, SOURCE_2025),
      official_md5: SOURCE_2025_MD5,
      sha256: SOURCE_2025_SHA256,
      attribution: 'Anses. 2025. Table de composition nutritionnelle des aliments Ciqual 2025. https://doi.org/10.57745/RDMHWY',
    },
    previous_source: {
      code: 'ciqual_2020',
      version: '2020-07-07',
      raw_path: relative(ROOT, SOURCE_2020),
      reconciliation_status: 'completed',
    },
    counts: {
      source_entries: entries.length,
      constituents: registry.length,
      measured_values: measurementCounts.measured,
      upper_bound_values: measurementCounts.less_than,
      trace_values: measurementCounts.trace,
      missing_values: measurementCounts.not_available,
      accepted: qualityCounts.accepted || 0,
      review: qualityCounts.review || 0,
      quarantined: qualityCounts.quarantined || 0,
      canonical_candidates: candidates.length,
      multi_form_candidate_groups: candidates.filter((candidate) => candidate.source_entry_count > 1).length,
    },
    issue_counts: Object.fromEntries(
      Object.entries(issueCounts).sort(([left], [right]) => left.localeCompare(right)),
    ),
    quality_policy: {
      accepted: 'Taxonomie présente, quatre macronutriments de base mesurés, valeurs dans les bornes physiques et aucune borne source non positive.',
      review: 'Une macro est absente, à l’état de trace ou seulement bornée, ou une borne source est non positive ; la référence reste consultable mais non publiable pour un calcul déterministe.',
      quarantined: 'Une valeur mesurée sort des bornes physiques ; la référence est exclue de toute publication jusqu’à correction.',
    },
    publication_rules: [
      'Les références ne deviennent jamais automatiquement des concepts canoniques.',
      'Une valeur manquante, une trace ou une borne supérieure ne devient jamais zéro.',
      'Une entrée en review ou quarantined ne peut pas alimenter un calcul publié.',
      'Aucun champ de conservation, allergène, saisonnalité ou substitution n’est inféré depuis Ciqual.',
      'La publication des concepts exige une validation explicite de leurs frontières.',
    ],
    constituent_registry_path: 'constituent-registry.json',
    canonical_candidates_path: 'canonical-candidates.json',
    reconciliation_path: 'reconciliation-2020.json',
    shards: entryShards.metadata,
  }
  const candidateIndex = {
    schema: 'myko://food-canonical-candidates/v2',
    schema_version: 2,
    source_corpus: manifest.corpus_code,
    generated_on: GENERATED_ON,
    candidate_count: candidates.length,
    source_entry_count: entries.length,
    grouping_rule: 'Premier segment du libellé Ciqual avant la première virgule, normalisé uniquement pour créer une proposition de frontière.',
    status: 'pending_review',
    shards: candidateShards.metadata,
  }
  const reconciliationIndex = {
    schema: 'myko://ciqual-reconciliation/v1',
    schema_version: 1,
    from: 'ciqual_2020@2020-07-07',
    to: 'ciqual_2025@1.0',
    generated_on: GENERATED_ON,
    identity_change_counts: reconciliation.identityCounts,
    core_nutrition_change_counts: reconciliation.nutritionCounts,
    compared_core_nutrients: CORE_NUTRIENTS,
    rules: [
      'Le code aliment source est la clé de rapprochement prioritaire.',
      'Une disparition retire une référence source sans supprimer automatiquement un concept canonique.',
      'Un ajout reste une référence source candidate.',
      'Toute modification de nom, taxonomie ou macro exige une nouvelle sélection de provenance avant publication.',
    ],
    shards: reconciliationShards.metadata,
  }
  const registryIndex = {
    schema: 'myko://ciqual-constituent-registry/v1',
    schema_version: 1,
    source_corpus: manifest.corpus_code,
    constituent_count: registry.length,
    basis_quantity: 100,
    basis_unit: 'g',
    constituents: registry,
  }

  outputs.set(join(CORPUS_DIR, 'manifest.json'), json(manifest))
  outputs.set(join(CORPUS_DIR, 'canonical-candidates.json'), json(candidateIndex))
  outputs.set(join(CORPUS_DIR, 'reconciliation-2020.json'), json(reconciliationIndex))
  outputs.set(join(CORPUS_DIR, 'constituent-registry.json'), json(registryIndex))
  return {
    outputs,
    summary: {
      corpus_code: manifest.corpus_code,
      source_entries: entries.length,
      constituents: registry.length,
      accepted: manifest.counts.accepted,
      review: manifest.counts.review,
      quarantined: manifest.counts.quarantined,
      canonical_candidates: candidates.length,
      reconciliation: reconciliation.identityCounts,
    },
  }
}

const managedJsonFiles = (directory) => {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return managedJsonFiles(path)
    return entry.isFile() && entry.name.endsWith('.json') ? [path] : []
  })
}

const { outputs, summary } = build()
if (CHECK_MODE) {
  const errors = []
  for (const [path, expected] of outputs) {
    if (!existsSync(path)) errors.push(`Artefact absent : ${relative(ROOT, path)}`)
    else if (readFileSync(path, 'utf8') !== expected) {
      errors.push(`Artefact périmé : ${relative(ROOT, path)}`)
    }
  }
  for (const path of managedJsonFiles(CORPUS_DIR)) {
    if (!outputs.has(path)) errors.push(`Artefact obsolète : ${relative(ROOT, path)}`)
  }
  if (errors.length) throw new Error(`Corpus Ciqual 2025 non synchronisé :\n- ${errors.join('\n- ')}`)
} else {
  for (const path of managedJsonFiles(CORPUS_DIR)) {
    if (!outputs.has(path)) unlinkSync(path)
  }
  for (const [path, contents] of outputs) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, contents)
  }
}

console.log(JSON.stringify(summary, null, 2))
