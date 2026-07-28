import { describe, expect, it } from 'vitest'
import manifest from '@/data/foods/ciqual-reference/manifest.json'
import candidateIndex from '@/data/foods/ciqual-reference/canonical-candidates.json'
import { validateCiqualReferenceCorpus } from '@/scripts/data/foods/validate-ciqual-reference-corpus.mjs'

describe('Corpus industriel des ingrédients CIQUAL', () => {
  it('matérialise plus de 3 000 références alimentaires réelles et sourcées', () => {
    expect(manifest.counts).toMatchObject({
      source_entries: 3185,
      nutrition_profiles_present: 3178,
      accepted: 2701,
      review: 483,
      quarantined: 1,
      canonical_candidates: 2081,
      multi_form_candidate_groups: 453,
    })
    expect(manifest.source).toMatchObject({
      code: 'ciqual_2020',
      publisher: 'ANSES',
      license_code: 'etalab-2.0',
      version: '2020-07-07',
    })
    expect(manifest.migration_target).toMatchObject({
      code: 'ciqual_2025',
      status: 'required_before_final_validation',
    })
  })

  it('sépare les formes sources des frontières canoniques à valider', () => {
    expect(candidateIndex.source_entry_count).toBe(3185)
    expect(candidateIndex.candidate_count).toBe(2081)
    expect(candidateIndex.status).toBe('pending_review')
    expect(candidateIndex.shards).toHaveLength(6)
    expect(candidateIndex.shards.reduce(
      (count, shard) => count + shard.candidate_count,
      0,
    )).toBe(2081)
  })

  it('valide unicité, grain, nutrition, qualité et rattachement de chaque entrée', () => {
    expect(validateCiqualReferenceCorpus()).toEqual({
      corpus_code: 'MYKO-CIQUAL-REF-2020-1',
      source_entries: 3185,
      accepted: 2701,
      review: 483,
      quarantined: 1,
      canonical_candidates: 2081,
      shards: 8,
    })
  })
})
