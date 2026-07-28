/**
 * Valide le corpus de références alimentaires CIQUAL matérialisé.
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

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const countBy = (items, getter) => {
  const counts = {}
  for (const item of items) {
    const key = getter(item)
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

const fail = (errors, condition, message) => {
  if (!condition) errors.push(message)
}

export function validateCiqualReferenceCorpus() {
  const errors = []
  const manifest = readJson(join(CORPUS_DIR, 'manifest.json'))
  const candidateIndex = readJson(join(CORPUS_DIR, manifest.canonical_candidates_path))
  const entries = []
  const candidates = []

  fail(errors, manifest.schema === 'myko://food-reference-corpus/v1', 'Schéma de manifeste inconnu.')
  fail(errors, manifest.source?.code === 'ciqual_2020', 'Source CIQUAL absente du manifeste.')
  fail(errors, manifest.source?.license_code === 'etalab-2.0', 'Licence source absente ou incorrecte.')
  fail(errors, manifest.migration_target?.code === 'ciqual_2025', 'Cible de migration Ciqual 2025 absente.')

  for (const shardMeta of manifest.shards) {
    const shard = readJson(join(CORPUS_DIR, shardMeta.path))
    fail(errors, shard.shard === shardMeta.path.split('/').at(-1).replace('.json', ''), `Identité de shard incohérente : ${shardMeta.path}`)
    fail(errors, shard.entry_count === shard.entries.length, `Comptage interne incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.entry_count === shard.entries.length, `Comptage manifeste incorrect : ${shardMeta.path}`)
    fail(errors, shard.first_entry_id === shard.entries[0]?.entry_id, `Première entrée incorrecte : ${shardMeta.path}`)
    fail(errors, shard.last_entry_id === shard.entries.at(-1)?.entry_id, `Dernière entrée incorrecte : ${shardMeta.path}`)
    entries.push(...shard.entries)
  }

  for (const shardMeta of candidateIndex.shards) {
    const shard = readJson(join(CORPUS_DIR, shardMeta.path))
    fail(errors, shard.shard === shardMeta.path.split('/').at(-1).replace('.json', ''), `Identité de shard candidat incohérente : ${shardMeta.path}`)
    fail(errors, shard.candidate_count === shard.candidates.length, `Comptage interne candidat incorrect : ${shardMeta.path}`)
    fail(errors, shardMeta.candidate_count === shard.candidates.length, `Comptage manifeste candidat incorrect : ${shardMeta.path}`)
    fail(errors, shard.first_candidate_id === shard.candidates[0]?.candidate_id, `Premier candidat incorrect : ${shardMeta.path}`)
    fail(errors, shard.last_candidate_id === shard.candidates.at(-1)?.candidate_id, `Dernier candidat incorrect : ${shardMeta.path}`)
    candidates.push(...shard.candidates)
  }

  const ids = new Set()
  const sourceKeys = new Set()
  const normalizedNames = new Set()
  const qualityStatuses = new Set(['accepted', 'review', 'quarantined'])
  const coreNutrients = ['energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g']

  for (const entry of entries) {
    fail(errors, /^CIQ-\d{5}$/.test(entry.entry_id), `Identifiant invalide : ${entry.entry_id}`)
    fail(errors, !ids.has(entry.entry_id), `Identifiant dupliqué : ${entry.entry_id}`)
    fail(errors, !sourceKeys.has(entry.source_record_key), `Code source dupliqué : ${entry.source_record_key}`)
    fail(errors, Boolean(entry.name_fr && entry.normalized_name), `Nom absent : ${entry.entry_id}`)
    fail(errors, !normalizedNames.has(entry.normalized_name), `Nom normalisé dupliqué : ${entry.normalized_name}`)
    fail(errors, entry.record_type === 'food_form_reference', `Grain incorrect : ${entry.entry_id}`)
    fail(errors, entry.canonicalization_status === 'pending', `Canonisation prématurée : ${entry.entry_id}`)
    fail(errors, qualityStatuses.has(entry.quality?.quality_status), `État qualité invalide : ${entry.entry_id}`)
    fail(errors, entry.nutrition?.basis_quantity === 100 && entry.nutrition?.basis_unit === 'g', `Base nutritionnelle invalide : ${entry.entry_id}`)

    for (const [nutrient, value] of Object.entries(entry.nutrition?.values || {})) {
      fail(errors, typeof value === 'number' && Number.isFinite(value), `Valeur nutritionnelle invalide : ${entry.entry_id}/${nutrient}`)
    }

    if (entry.quality?.quality_status === 'accepted') {
      fail(errors, entry.quality.issues.length === 0, `Entrée acceptée avec anomalie : ${entry.entry_id}`)
      fail(errors, Boolean(entry.source_taxonomy?.group && entry.source_taxonomy?.subgroup), `Taxonomie absente sur entrée acceptée : ${entry.entry_id}`)
      for (const nutrient of coreNutrients) {
        fail(errors, entry.nutrition.values[nutrient] != null, `Macro absente sur entrée acceptée : ${entry.entry_id}/${nutrient}`)
      }
    }

    if (entry.quality?.quality_status === 'quarantined') {
      fail(errors, entry.quality.issues.some((issue) => issue.endsWith('_out_of_range')), `Quarantaine sans anomalie physique : ${entry.entry_id}`)
    }

    ids.add(entry.entry_id)
    sourceKeys.add(entry.source_record_key)
    normalizedNames.add(entry.normalized_name)
  }

  const actualStatusCounts = countBy(entries, (entry) => entry.quality.quality_status)
  const actualIssueCounts = {}
  for (const entry of entries) {
    for (const issue of entry.quality.issues) actualIssueCounts[issue] = (actualIssueCounts[issue] || 0) + 1
  }

  fail(errors, entries.length === manifest.counts.source_entries, 'Nombre total d’entrées incorrect.')
  fail(errors, JSON.stringify(actualStatusCounts) === JSON.stringify({
    accepted: manifest.counts.accepted,
    review: manifest.counts.review,
    quarantined: manifest.counts.quarantined,
  }), 'Répartition qualité incohérente.')
  fail(errors, JSON.stringify(actualIssueCounts) === JSON.stringify(manifest.issue_counts), 'Comptage des anomalies incohérent.')

  const assignedEntries = new Set()
  const candidateKeys = new Set()
  for (const candidate of candidates) {
    fail(errors, /^CAND-CIQ-\d{5}$/.test(candidate.candidate_id), `Identifiant candidat invalide : ${candidate.candidate_id}`)
    fail(errors, Boolean(candidate.normalized_key), `Clé candidat absente : ${candidate.candidate_id}`)
    fail(errors, !candidateKeys.has(candidate.normalized_key), `Clé candidat dupliquée : ${candidate.normalized_key}`)
    fail(errors, candidate.source_entry_count === candidate.source_entry_ids.length, `Comptage candidat incorrect : ${candidate.candidate_id}`)
    fail(errors, candidate.status === 'pending_review', `Candidat publié prématurément : ${candidate.candidate_id}`)
    for (const entryId of candidate.source_entry_ids) {
      fail(errors, ids.has(entryId), `Référence candidate inconnue : ${candidate.candidate_id}/${entryId}`)
      fail(errors, !assignedEntries.has(entryId), `Référence assignée à plusieurs candidats : ${entryId}`)
      assignedEntries.add(entryId)
    }
    candidateKeys.add(candidate.normalized_key)
  }

  fail(errors, candidateIndex.candidate_count === candidates.length, 'Nombre de candidats incorrect.')
  fail(errors, candidateIndex.candidate_count === manifest.counts.canonical_candidates, 'Nombre de candidats incompatible avec le manifeste.')
  fail(errors, assignedEntries.size === entries.length, 'Certaines références ne sont rattachées à aucun candidat.')
  fail(errors, manifest.counts.quarantined === 1, 'La quarantaine attend exactement une anomalie connue.')
  fail(errors, entries.find((entry) => entry.entry_id === 'CIQ-42501')?.quality.quality_status === 'quarantined', 'L’anomalie CIQ-42501 doit rester en quarantaine.')

  if (errors.length) {
    throw new Error(`Corpus CIQUAL invalide :\n- ${errors.join('\n- ')}`)
  }

  return {
    corpus_code: manifest.corpus_code,
    source_entries: entries.length,
    accepted: actualStatusCounts.accepted,
    review: actualStatusCounts.review,
    quarantined: actualStatusCounts.quarantined,
    canonical_candidates: candidateIndex.candidate_count,
    shards: manifest.shards.length,
  }
}

const isMain = process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (isMain) {
  console.log(JSON.stringify(validateCiqualReferenceCorpus(), null, 2))
}
