import { describe, expect, it } from 'vitest'
import manifest from '@/data/foods/ciqual-reference/manifest.json'
import candidateIndex from '@/data/foods/ciqual-reference/canonical-candidates.json'
import { validateCiqualReferenceCorpus } from '@/scripts/data/foods/validate-ciqual-reference-corpus.mjs'

describe('Corpus industriel des ingrédients CIQUAL', () => {
  it('matérialise plus de 3 000 références alimentaires réelles et sourcées', () => {
    expect(manifest.counts).toMatchObject({
      source_entries: 3484,
      constituents: 74,
      measured_values: 151981,
      upper_bound_values: 20075,
      trace_values: 2514,
      missing_values: 83246,
      accepted: 2991,
      review: 493,
      quarantined: 0,
      canonical_candidates: 2212,
      multi_form_candidate_groups: 527,
    })
    expect(manifest.source).toMatchObject({
      code: 'ciqual_2025',
      publisher: 'ANSES',
      license_code: 'etalab-2.0',
      version: '1.0',
      dataset_doi: '10.57745/RDMHWY',
      file_doi: '10.57745/RPWYZD',
    })
    expect(
      manifest.counts.measured_values
        + manifest.counts.upper_bound_values
        + manifest.counts.trace_values
        + manifest.counts.missing_values,
    ).toBe(3484 * 74)
  })

  it('sépare les formes sources des frontières canoniques à valider', () => {
    expect(candidateIndex.source_entry_count).toBe(3484)
    expect(candidateIndex.candidate_count).toBe(2212)
    expect(candidateIndex.status).toBe('pending_review')
    expect(candidateIndex.shards).toHaveLength(6)
    expect(candidateIndex.shards.reduce(
      (count, shard) => count + shard.candidate_count,
      0,
    )).toBe(2212)
  })

  it('valide unicité, grain, nutrition, qualité, rattachements et migration', () => {
    expect(validateCiqualReferenceCorpus()).toEqual({
      corpus_code: 'MYKO-CIQUAL-REF-2025-1',
      source_entries: 3484,
      constituents: 74,
      accepted: 2991,
      review: 493,
      quarantined: 0,
      canonical_candidates: 2212,
      entry_shards: 9,
      reconciliation_rows: 3666,
      added_since_2020: 481,
      removed_since_2020: 182,
    })
  })
})
