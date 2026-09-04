import { appendFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import corpus from '@/data/recipes/corpus-v3.json'
import foodCatalog from '@/scripts/data/out/recipe-food-catalog.json'
import { classifyRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { materializeRecipe } from '@/lib/domain/recipes/materializeRecipe'

const OUT = '/tmp/claude-0/-home-user-garde-manger-app/4641d636-b9e8-51d6-bd3f-504fefba62b7/scratchpad/mutation.txt'
writeFileSync(OUT, '')
const log = (...a) => appendFileSync(OUT, a.join(' ') + '\n')

const MOT = /(?<![\p{L}\p{N}_])(?:volaille|anchois|boudin)(?![\p{L}\p{N}_])/iu

describe('mutation : le contre-témoin sait-il tomber ?', () => {
  it('une origine falsifiée fait crier le contrôle par les noms', () => {
    // catalogue muté : le bouillon de volaille devient « vegetal »
    const mute = foodCatalog.forms.map((f) => (
      ['bouillon de volaille', 'bouillon d anchois', 'boudin noir a cuire'].includes(f.canonical_name_normalized)
        ? { ...f, origin: 'vegetal' } : f
    ))
    const recettes = corpus.recipes.map((e) => materializeRecipe(e, mute)).filter((r) => r.eligible)
    const fautives = recettes
      .filter((r) => classifyRecipe(r).vegetarian)
      .map((r) => [r.code, [...(r.exactIngredients || []).filter((i) => !i.optional), ...(r.blockedIngredients || [])].map((i) => i.name).filter((n) => MOT.test(n))])
      .filter(([, m]) => m.length)
    log('faux vegetariens apres mutation =', fautives.length)
    log(fautives.slice(0, 10).map((f) => f.join(' :: ')).join('\n'))
    expect(fautives.length).toBeGreaterThan(0)
  })
})
