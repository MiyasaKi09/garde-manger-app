import { appendFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classifyRecipe, violatesHardConstraints } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

const OUT = '/tmp/claude-0/-home-user-garde-manger-app/4641d636-b9e8-51d6-bd3f-504fefba62b7/scratchpad/controle3.txt'
writeFileSync(OUT, '')
const log = (...a) => appendFileSync(OUT, a.join(' ') + '\n')

const MOTS = 'boudin|lardons?|jambon|jambonneau|saucisses?|saucisson|chorizo|chourico|linguica|bacon|poulet|volaille|b(?:œ|oe)uf|veau|porc|agneau|mouton|canard|dinde|oie|pintade|caille|merguez|anchois|thon|saumon|crevettes?|cabillaud|lard|viande|steak|foie|g(?:é|e)sier|magret|confit|morue|sardine|maquereau|moule|calamar|poulpe|colin|truite|hareng|nuoc|fumet|g(?:é|e)latine|poisson|hu(?:î|i)tre|dashi|bonite|worcestershire|saindoux|lapin|gibier|abats|tripes|andouille|rillettes|terrine|charcuterie|surimi|escargot|grenouille|caviar|poule|seiche|encornet|bulot|bigorneau|homard|langoustine|crabe|guanciale|pancetta|chashu|morcilla|eomuk|coquille|jacques|os '
const W = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + MOTS + ')(?![\\p{L}\\p{N}_])', 'iu')

describe('contrôle corpus entier', () => {
  it('faux végétariens sur les 706', () => {
    const tous = getCanonicalRecipes({ eligibleOnly: false })
    log('corpus', tous.length)
    const fautives = []
    for (const r of tous) {
      if (!classifyRecipe(r).vegetarian) continue
      const noms = [...(r.exactIngredients || []).filter((i) => !i.optional), ...(r.blockedIngredients || [])].map((i) => i.name)
      const s = noms.filter((n) => W.test(n))
      if (s.length) fautives.push(`${r.code} ${r.family} [${r.eligible ? 'publiable' : 'non publiable'}] :: ${s.join(', ')}`)
    }
    log('FAUX =', fautives.length, '\n' + fautives.join('\n'))

    // contrainte dure « végétarien » vs classification
    const divergents = tous.filter((r) => r.eligible).filter((r) => {
      const c = classifyRecipe(r)
      const dur = violatesHardConstraints(r, { diets: ['végétarien'] })
      return (dur === null) !== c.vegetarian
    })
    log('divergence violatesHardConstraints/vegetarian :', divergents.length, divergents.map((r) => r.code).join(','))
    expect(true).toBe(true)
  })
})
