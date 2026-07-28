/**
 * Valide le corpus matérialisé Ciqual 2025, ses candidats canoniques et le
 * journal de réconciliation 2020→2025.
 *
 * Usage :
 *   node scripts/data/foods/validate-ciqual-reference-corpus.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS_DIR = join(ROOT, 'data', 'foods', 'ciqual-reference')
const CORE_NUTRIENTS = ['energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g']
const MEASUREMENT_STATUSES = new Set(['measured', 'less_than', 'trace', 'not_available'])
const QUALITY_STATUSES = new Set(['accepted', 'review', 'quarantined'])
const IDENTITY_CHANGES = new Set([
  'unchanged',
  'renamed',
  'taxonomy_changed',
  'renamed_and_taxonomy_changed',
  'added',
  'removed',
])
const NUTRITION_CHANGES = new Set(['unchanged', 'changed', 'not_comparable'])

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const countBy = (items, getter) => {
  const counts = {}
  for (const item of items) {
    const key = getter(item)
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

const ordered = (value) => Object.fromEntries(
  Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
)

const sameCounts = (left, right) =>
  JSON.stringify(ordered(left)) === JSON.stringify(ordered(right))

const fail = (errors, condition, message) => {
  if (!condition) errors.push(message)
}

const isBlockingIssue = (issue) =>
  /^(invalid_number|negative|over_100g):/.test(issue)
  || issue === 'energy_out_of_range'
  || issue === 'macro_sum_impossible'

export function validateCiqualReferenceCorpus() {
  const errors = []
  const manifest = readJson(join(CORPUS_DIR, 'manifest.json'))
  const candidateIndex = readJson(join(CORPUS_DIR, manifest.canonical_candidates_path))
  const constituentRegistry = readJson(join(CORPUS_DIR, manifest.constituent_registry_path))
  const reconciliationIndex = readJson(join(CORPUS_DIR, manifest.reconciliation_path))
  const entries = []
  const candidates = []
  const reconciliationRows = []

  fail(errors, manifest.schema === 'myko://food-reference-corpus/v2', 'Schéma de manifeste inconnu.')
  fail(errors, manifest.schema_version === 2, 'Version de manifeste incorrecte.')
  fail(errors, manifest.source?.code === 'ciqual_2025', 'Source Ciqual 2025 absente du manifeste.')
  fail(errors, manifest.source?.version === '1.0', 'Version officielle Ciqual incorrecte.')
  fail(errors, manifest.source?.dataset_doi === '10.57745/RDMHWY', 'DOI du jeu de données incorrect.')
  fail(errors, manifest.source?.file_doi === '10.57745/RPWYZD', 'DOI du fichier incorrect.')
  fail(errors, manifest.source?.license_code === 'etalab-2.0', 'Licence source absente ou incorrecte.')
  fail(
    errors,
    manifest.source?.sha256 === '5555c572fa3735991298d832d0427788fa69a11b4fd20a5d580d58942369fbb0',
    'Empreinte SHA-256 officielle incorrecte.',
  )
  fail(errors, manifest.previous_source?.code === 'ciqual_2020', 'Source historique Ciqual 2020 absente.')
  fail(
    errors,
    manifest.previous_source?.reconciliation_status === 'completed',
    'Réconciliation 2020→2025 non terminée.',
  )

  fail(
    errors,
    constituentRegistry.schema === 'myko://ciqual-constituent-registry/v1',
    'Registre de constituants inconnu.',
  )
  fail(errors, constituentRegistry.constituent_count === 74, '74 constituants sont requis.')
  fail(
    errors,
    constituentRegistry.constituent_count === constituentRegistry.constituents.length,
    'Comptage du registre de constituants incorrect.',
  )

  const constituentIds = new Set()
  const sourceConstituentCodes = new Set()
  const mykoNutrientCodes = new Set()
  const sourceColumns = new Set()
  const constituentByMykoCode = new Map()
  const constituentById = new Map()
  for (const constituent of constituentRegistry.constituents) {
    fail(errors, /^CIQ-CONST-\d{5}$/.test(constituent.constituent_id), `Identifiant constituant invalide : ${constituent.constituent_id}`)
    fail(errors, !constituentIds.has(constituent.constituent_id), `Constituant dupliqué : ${constituent.constituent_id}`)
    fail(errors, !sourceConstituentCodes.has(constituent.source_code), `Code constituant source dupliqué : ${constituent.source_code}`)
    fail(errors, !mykoNutrientCodes.has(constituent.myko_code), `Code nutriment Myko dupliqué : ${constituent.myko_code}`)
    fail(errors, !sourceColumns.has(constituent.source_column), `Colonne source dupliquée : ${constituent.source_column}`)
    fail(errors, Boolean(constituent.name_fr && constituent.unit), `Métadonnées constituant absentes : ${constituent.constituent_id}`)
    fail(
      errors,
      constituent.basis_quantity === 100 && constituent.basis_unit === 'g',
      `Base constituant invalide : ${constituent.constituent_id}`,
    )
    constituentIds.add(constituent.constituent_id)
    sourceConstituentCodes.add(constituent.source_code)
    mykoNutrientCodes.add(constituent.myko_code)
    sourceColumns.add(constituent.source_column)
    constituentByMykoCode.set(constituent.myko_code, constituent)
    constituentById.set(constituent.constituent_id, constituent)
  }
  for (const nutrient of CORE_NUTRIENTS) {
    fail(errors, constituentByMykoCode.has(nutrient), `Macro absente du registre : ${nutrient}`)
  }

  for (const shardMeta of manifest.shards) {
    const shard = readJson(join(CORPUS_DIR, shardMeta.path))
    fail(errors, shard.shard === shardMeta.path.split('/').at(-1).replace('.json', ''), `Identité de shard incohérente : ${shardMeta.path}`)
    fail(errors, shard.entry_count === shard.entries.length, `Comptage interne incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.entry_count === shard.entries.length, `Comptage manifeste incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.first_entry_id === shard.entries[0]?.entry_id, `Première entrée incorrecte : ${shardMeta.path}`)
    fail(errors, shardMeta.last_entry_id === shard.entries.at(-1)?.entry_id, `Dernière entrée incorrecte : ${shardMeta.path}`)
    entries.push(...shard.entries)
  }

  for (const shardMeta of candidateIndex.shards) {
    const shard = readJson(join(CORPUS_DIR, shardMeta.path))
    fail(errors, shard.shard === shardMeta.path.split('/').at(-1).replace('.json', ''), `Identité de shard candidat incohérente : ${shardMeta.path}`)
    fail(errors, shard.candidate_count === shard.candidates.length, `Comptage interne candidat incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.candidate_count === shard.candidates.length, `Comptage manifeste candidat incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.first_candidate_id === shard.candidates[0]?.candidate_id, `Premier candidat incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.last_candidate_id === shard.candidates.at(-1)?.candidate_id, `Dernier candidat incorrect : ${shardMeta.path}`)
    candidates.push(...shard.candidates)
  }

  for (const shardMeta of reconciliationIndex.shards) {
    const shard = readJson(join(CORPUS_DIR, shardMeta.path))
    fail(errors, shard.shard === shardMeta.path.split('/').at(-1).replace('.json', ''), `Identité de shard de réconciliation incohérente : ${shardMeta.path}`)
    fail(errors, shard.change_count === shard.changes.length, `Comptage interne de réconciliation incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.change_count === shard.changes.length, `Comptage manifeste de réconciliation incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.first_source_record_key === shard.changes[0]?.source_record_key, `Première réconciliation incorrecte : ${shardMeta.path}`)
    fail(errors, shardMeta.last_source_record_key === shard.changes.at(-1)?.source_record_key, `Dernière réconciliation incorrecte : ${shardMeta.path}`)
    reconciliationRows.push(...shard.changes)
  }

  const ids = new Set()
  const sourceKeys = new Set()
  const normalizedNames = new Set()
  const entryById = new Map()
  const measurementCounts = {
    measured: 0,
    less_than: 0,
    trace: 0,
    not_available: 0,
  }

  for (const entry of entries) {
    fail(errors, /^CIQ-\d{5}$/.test(entry.entry_id), `Identifiant invalide : ${entry.entry_id}`)
    fail(errors, !ids.has(entry.entry_id), `Identifiant dupliqué : ${entry.entry_id}`)
    fail(errors, !sourceKeys.has(entry.source_record_key), `Code source dupliqué : ${entry.source_record_key}`)
    fail(errors, Boolean(entry.name_fr && entry.normalized_name), `Nom absent : ${entry.entry_id}`)
    fail(errors, !normalizedNames.has(entry.normalized_name), `Nom normalisé dupliqué : ${entry.normalized_name}`)
    fail(errors, entry.record_type === 'food_form_reference', `Grain incorrect : ${entry.entry_id}`)
    fail(errors, entry.canonicalization_status === 'pending', `Canonisation prématurée : ${entry.entry_id}`)
    fail(errors, QUALITY_STATUSES.has(entry.quality?.quality_status), `État qualité invalide : ${entry.entry_id}`)
    fail(
      errors,
      entry.nutrition?.basis_quantity === 100 && entry.nutrition?.basis_unit === 'g',
      `Base nutritionnelle invalide : ${entry.entry_id}`,
    )

    const representedConstituents = new Set()
    const values = entry.nutrition?.values || {}
    const upperBounds = entry.nutrition?.upper_bounds || {}
    const traces = entry.nutrition?.traces || []
    for (const [constituentId, value] of Object.entries(values)) {
      fail(errors, constituentIds.has(constituentId), `Constituant mesuré inconnu : ${entry.entry_id}/${constituentId}`)
      fail(errors, typeof value === 'number' && Number.isFinite(value) && value >= 0, `Valeur nutritionnelle invalide : ${entry.entry_id}/${constituentId}`)
      fail(errors, !representedConstituents.has(constituentId), `Mesure dupliquée : ${entry.entry_id}/${constituentId}`)
      representedConstituents.add(constituentId)
      measurementCounts.measured++
    }
    for (const [constituentId, upperBound] of Object.entries(upperBounds)) {
      fail(errors, constituentIds.has(constituentId), `Constituant borné inconnu : ${entry.entry_id}/${constituentId}`)
      fail(errors, typeof upperBound === 'number' && Number.isFinite(upperBound) && upperBound >= 0, `Borne supérieure invalide : ${entry.entry_id}/${constituentId}`)
      if (upperBound === 0) {
        const issue = `nonpositive_upper_bound:${constituentById.get(constituentId)?.myko_code}`
        fail(errors, entry.quality?.issues?.includes(issue), `Borne nulle non signalée : ${entry.entry_id}/${constituentId}`)
      }
      fail(errors, !representedConstituents.has(constituentId), `Borne utilisée comme mesure : ${entry.entry_id}/${constituentId}`)
      representedConstituents.add(constituentId)
      measurementCounts.less_than++
    }
    for (const constituentId of traces) {
      fail(errors, constituentIds.has(constituentId), `Constituant trace inconnu : ${entry.entry_id}/${constituentId}`)
      fail(errors, !representedConstituents.has(constituentId), `Trace utilisée comme mesure : ${entry.entry_id}/${constituentId}`)
      representedConstituents.add(constituentId)
      measurementCounts.trace++
    }
    fail(
      errors,
      representedConstituents.size <= constituentRegistry.constituent_count,
      `Trop de mesures : ${entry.entry_id}`,
    )
    measurementCounts.not_available += constituentRegistry.constituent_count - representedConstituents.size

    for (const nutrient of CORE_NUTRIENTS) {
      const constituent = constituentByMykoCode.get(nutrient)
      const status = entry.nutrition?.core_statuses?.[nutrient]
      const constituentId = constituent.constituent_id
      fail(errors, MEASUREMENT_STATUSES.has(status), `État macro invalide : ${entry.entry_id}/${nutrient}`)
      if (status === 'measured') {
        fail(errors, Object.hasOwn(values, constituentId), `Macro mesurée absente : ${entry.entry_id}/${nutrient}`)
        fail(errors, entry.nutrition.core_values?.[nutrient] === values[constituentId], `Projection macro incorrecte : ${entry.entry_id}/${nutrient}`)
      } else if (status === 'less_than') {
        fail(errors, Object.hasOwn(upperBounds, constituentId), `Borne macro absente : ${entry.entry_id}/${nutrient}`)
        fail(errors, !Object.hasOwn(entry.nutrition.core_values || {}, nutrient), `Borne macro convertie en valeur : ${entry.entry_id}/${nutrient}`)
      } else if (status === 'trace') {
        fail(errors, traces.includes(constituentId), `Trace macro absente : ${entry.entry_id}/${nutrient}`)
        fail(errors, !Object.hasOwn(entry.nutrition.core_values || {}, nutrient), `Trace macro convertie en valeur : ${entry.entry_id}/${nutrient}`)
      } else {
        fail(errors, !representedConstituents.has(constituentId), `Valeur absente matérialisée : ${entry.entry_id}/${nutrient}`)
        fail(errors, !Object.hasOwn(entry.nutrition.core_values || {}, nutrient), `Valeur absente convertie en zéro : ${entry.entry_id}/${nutrient}`)
      }
    }

    const issues = entry.quality?.issues || []
    const expectedStatus = issues.some(isBlockingIssue)
      ? 'quarantined'
      : issues.length
        ? 'review'
        : 'accepted'
    fail(errors, entry.quality?.quality_status === expectedStatus, `État qualité incohérent : ${entry.entry_id}`)
    if (!entry.source_taxonomy?.group || !entry.source_taxonomy?.subgroup) {
      fail(errors, issues.includes('missing_taxonomy'), `Taxonomie manquante non signalée : ${entry.entry_id}`)
    }
    if (entry.quality?.quality_status === 'accepted') {
      fail(errors, issues.length === 0, `Entrée acceptée avec anomalie : ${entry.entry_id}`)
      for (const nutrient of CORE_NUTRIENTS) {
        fail(errors, entry.nutrition.core_statuses[nutrient] === 'measured', `Macro non mesurée sur entrée acceptée : ${entry.entry_id}/${nutrient}`)
      }
    }

    ids.add(entry.entry_id)
    sourceKeys.add(entry.source_record_key)
    normalizedNames.add(entry.normalized_name)
    entryById.set(entry.entry_id, entry)
  }

  const actualStatusCounts = {
    accepted: 0,
    review: 0,
    quarantined: 0,
    ...countBy(entries, (entry) => entry.quality.quality_status),
  }
  const actualIssueCounts = {}
  for (const entry of entries) {
    for (const issue of entry.quality.issues) {
      actualIssueCounts[issue] = (actualIssueCounts[issue] || 0) + 1
    }
  }

  fail(errors, entries.length === manifest.counts.source_entries, 'Nombre total d’entrées incorrect.')
  fail(errors, manifest.counts.constituents === constituentRegistry.constituent_count, 'Nombre de constituants incohérent.')
  fail(errors, measurementCounts.measured === manifest.counts.measured_values, 'Nombre de valeurs mesurées incorrect.')
  fail(errors, measurementCounts.less_than === manifest.counts.upper_bound_values, 'Nombre de bornes supérieures incorrect.')
  fail(errors, measurementCounts.trace === manifest.counts.trace_values, 'Nombre de traces incorrect.')
  fail(errors, measurementCounts.not_available === manifest.counts.missing_values, 'Nombre de valeurs absentes incorrect.')
  fail(
    errors,
    Object.values(measurementCounts).reduce((sum, count) => sum + count, 0)
      === entries.length * constituentRegistry.constituent_count,
    'La partition des mesures ne couvre pas toutes les cellules source.',
  )
  fail(errors, sameCounts(actualStatusCounts, {
    accepted: manifest.counts.accepted,
    review: manifest.counts.review,
    quarantined: manifest.counts.quarantined,
  }), 'Répartition qualité incohérente.')
  fail(errors, sameCounts(actualIssueCounts, manifest.issue_counts), 'Comptage des anomalies incohérent.')

  const assignedEntries = new Set()
  const candidateIds = new Set()
  const candidateKeys = new Set()
  for (const candidate of candidates) {
    fail(errors, /^CAND-CIQ-\d{5}$/.test(candidate.candidate_id), `Identifiant candidat invalide : ${candidate.candidate_id}`)
    fail(errors, !candidateIds.has(candidate.candidate_id), `Identifiant candidat dupliqué : ${candidate.candidate_id}`)
    fail(errors, Boolean(candidate.normalized_key), `Clé candidat absente : ${candidate.candidate_id}`)
    fail(errors, !candidateKeys.has(candidate.normalized_key), `Clé candidat dupliquée : ${candidate.normalized_key}`)
    fail(errors, candidate.source_entry_count === candidate.source_entry_ids.length, `Comptage candidat incorrect : ${candidate.candidate_id}`)
    fail(errors, candidate.status === 'pending_review', `Candidat publié prématurément : ${candidate.candidate_id}`)
    for (const entryId of candidate.source_entry_ids) {
      const entry = entryById.get(entryId)
      fail(errors, Boolean(entry), `Référence candidate inconnue : ${candidate.candidate_id}/${entryId}`)
      fail(errors, entry?.canonical_candidate_key === candidate.normalized_key, `Frontière candidate incohérente : ${candidate.candidate_id}/${entryId}`)
      fail(errors, !assignedEntries.has(entryId), `Référence assignée à plusieurs candidats : ${entryId}`)
      assignedEntries.add(entryId)
    }
    candidateIds.add(candidate.candidate_id)
    candidateKeys.add(candidate.normalized_key)
  }

  fail(errors, candidateIndex.schema === 'myko://food-canonical-candidates/v2', 'Index candidat inconnu.')
  fail(errors, candidateIndex.candidate_count === candidates.length, 'Nombre de candidats incorrect.')
  fail(errors, candidateIndex.source_entry_count === entries.length, 'Couverture source des candidats incorrecte.')
  fail(errors, candidateIndex.candidate_count === manifest.counts.canonical_candidates, 'Nombre de candidats incompatible avec le manifeste.')
  fail(errors, assignedEntries.size === entries.length, 'Certaines références ne sont rattachées à aucun candidat.')
  fail(
    errors,
    candidates.filter((candidate) => candidate.source_entry_count > 1).length
      === manifest.counts.multi_form_candidate_groups,
    'Nombre de groupes multi-formes incorrect.',
  )

  fail(errors, reconciliationIndex.schema === 'myko://ciqual-reconciliation/v1', 'Index de réconciliation inconnu.')
  fail(errors, reconciliationIndex.from === 'ciqual_2020@2020-07-07', 'Version de départ incorrecte.')
  fail(errors, reconciliationIndex.to === 'ciqual_2025@1.0', 'Version d’arrivée incorrecte.')
  const reconciliationKeys = new Set()
  const currentEntriesCovered = new Set()
  for (const change of reconciliationRows) {
    fail(errors, !reconciliationKeys.has(change.source_record_key), `Code réconcilié deux fois : ${change.source_record_key}`)
    fail(errors, IDENTITY_CHANGES.has(change.identity_change), `Changement d’identité invalide : ${change.source_record_key}`)
    fail(errors, NUTRITION_CHANGES.has(change.nutrition_change), `Changement nutritionnel invalide : ${change.source_record_key}`)
    if (change.identity_change === 'added') {
      fail(errors, change.previous_entry_id == null && Boolean(change.current_entry_id), `Ajout mal formé : ${change.source_record_key}`)
      fail(errors, change.migration_action === 'add_source_reference', `Action d’ajout incorrecte : ${change.source_record_key}`)
      fail(errors, change.nutrition_change === 'not_comparable', `Nutrition d’un ajout déclarée comparable : ${change.source_record_key}`)
    } else if (change.identity_change === 'removed') {
      fail(errors, Boolean(change.previous_entry_id) && change.current_entry_id == null, `Retrait mal formé : ${change.source_record_key}`)
      fail(errors, change.migration_action === 'retire_source_reference', `Action de retrait incorrecte : ${change.source_record_key}`)
      fail(errors, change.nutrition_change === 'not_comparable', `Nutrition d’un retrait déclarée comparable : ${change.source_record_key}`)
    } else {
      fail(errors, Boolean(change.previous_entry_id && change.current_entry_id), `Rapprochement mal formé : ${change.source_record_key}`)
      fail(errors, change.migration_action === 'carry_source_code_forward', `Action de rapprochement incorrecte : ${change.source_record_key}`)
    }
    if (change.current_entry_id) {
      fail(errors, ids.has(change.current_entry_id), `Entrée actuelle inconnue : ${change.source_record_key}`)
      fail(errors, !currentEntriesCovered.has(change.current_entry_id), `Entrée actuelle réconciliée deux fois : ${change.current_entry_id}`)
      currentEntriesCovered.add(change.current_entry_id)
    }
    if (change.changed_core_nutrients) {
      fail(
        errors,
        change.nutrition_change === 'changed'
          && change.changed_core_nutrients.every((nutrient) => CORE_NUTRIENTS.includes(nutrient)),
        `Liste de macros modifiées invalide : ${change.source_record_key}`,
      )
    }
    reconciliationKeys.add(change.source_record_key)
  }

  const actualIdentityChanges = countBy(reconciliationRows, (change) => change.identity_change)
  const actualNutritionChanges = countBy(reconciliationRows, (change) => change.nutrition_change)
  fail(errors, sameCounts(actualIdentityChanges, reconciliationIndex.identity_change_counts), 'Comptage des changements d’identité incorrect.')
  fail(errors, sameCounts(actualNutritionChanges, reconciliationIndex.core_nutrition_change_counts), 'Comptage des changements nutritionnels incorrect.')
  fail(errors, currentEntriesCovered.size === entries.length, 'Certaines références 2025 ne sont pas réconciliées.')
  fail(
    errors,
    reconciliationRows.length === entries.length + (actualIdentityChanges.removed || 0),
    'Couverture du journal de réconciliation incorrecte.',
  )
  fail(
    errors,
    actualNutritionChanges.not_comparable
      === (actualIdentityChanges.added || 0) + (actualIdentityChanges.removed || 0),
    'Les ajouts et retraits ne correspondent pas aux mesures non comparables.',
  )

  if (errors.length) {
    throw new Error(`Corpus Ciqual invalide :\n- ${errors.join('\n- ')}`)
  }

  return {
    corpus_code: manifest.corpus_code,
    source_entries: entries.length,
    constituents: constituentRegistry.constituent_count,
    accepted: actualStatusCounts.accepted || 0,
    review: actualStatusCounts.review || 0,
    quarantined: actualStatusCounts.quarantined || 0,
    canonical_candidates: candidateIndex.candidate_count,
    entry_shards: manifest.shards.length,
    reconciliation_rows: reconciliationRows.length,
    added_since_2020: actualIdentityChanges.added || 0,
    removed_since_2020: actualIdentityChanges.removed || 0,
  }
}

const isMain = process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (isMain) {
  console.log(JSON.stringify(validateCiqualReferenceCorpus(), null, 2))
}
