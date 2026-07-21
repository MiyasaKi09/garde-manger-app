import { describe, expect, it } from 'vitest'
import { coverageFromSnapshot } from '@/app/api/planning/[importId]/stock-coverage/route'

describe('published stock coverage snapshot', () => {
  it('reports the allocation promise stored with the plan', () => {
    expect(coverageFromSnapshot({
      coverage: 0.75,
      allocations: [
        { form_normalized: 'carotte', ingredient_name: 'Carotte', grams: 100 },
        { form_normalized: 'riz', ingredient_name: 'Riz', grams: 50 },
      ],
      shortages: [{ form_normalized: 'riz', ingredient_name: 'Riz', grams: 50 }],
    })).toMatchObject({ status: 'partial', have: 1, need: 2, missing: ['Riz'], coverage: 0.75 })
  })

  it('treats a reserved cooked dish as fully covered without re-reading stock', () => {
    expect(coverageFromSnapshot({ coverage: 1, cooked_dish: { id: 42, portions: 2 } }))
      .toMatchObject({ status: 'full', reason: 'reserved_cooked_dish' })
  })

  it('stays unknown when no published snapshot exists', () => {
    expect(coverageFromSnapshot(null)).toMatchObject({ status: 'unknown', reason: 'no_published_snapshot' })
  })
})
