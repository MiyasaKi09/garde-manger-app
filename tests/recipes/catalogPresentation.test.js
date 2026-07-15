import { describe, expect, it } from 'vitest'
import { limitRecipePreview, selectDiverseAntiWaste } from '@/lib/domain/recipes/catalogPresentation'

const item = (key, expiringName, score) => ({ r: { key }, s: { expiringName, mykoScore: score } })

describe('recipe catalog presentation', () => {
  it('prevents one expiring ingredient from monopolising recommendations', () => {
    const source = [
      item('o1', 'Oignon', 100), item('o2', 'Oignon', 99), item('o3', 'Oignon', 98),
      item('o4', 'Oignon', 97), item('o5', 'Oignon', 96), item('t1', 'Tomate', 95),
    ]
    expect(selectDiverseAntiWaste(source, { limit: 9, maxPerSignal: 3 }).map((x) => x.r.key))
      .toEqual(['o1', 'o2', 'o3', 't1'])
  })

  it('limits dense sections without changing their source list', () => {
    const source = Array.from({ length: 12 }, (_, index) => item(String(index), 'signal', 12 - index))
    expect(limitRecipePreview(source, 6)).toHaveLength(6)
    expect(source).toHaveLength(12)
  })
})
