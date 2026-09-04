import { appendFileSync, writeFileSync } from 'node:fs'
const OUT='/tmp/claude-0/-home-user-garde-manger-app/4641d636-b9e8-51d6-bd3f-504fefba62b7/scratchpad/controle.txt'
writeFileSync(OUT,'')
const require0=(...a)=>appendFileSync(OUT,a.join(' ')+'\n')
import { describe, expect, it } from 'vitest'
import corpus from '@/data/recipes/corpus-v3.json'
import foodCatalog from '@/scripts/data/out/recipe-food-catalog.json'
import { classifyRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

const MOTS = 'boudin|lardons?|jambon|jambonneau|saucisses?|saucisson|chorizo|chourico|linguica|bacon|poulet|volaille|b(?:œ|oe)uf|veau|porc|agneau|mouton|canard|dinde|oie|pintade|caille|merguez|anchois|thon|saumon|crevettes?|cabillaud|lard|viande|steak|foie|g(?:é|e)sier|magret|confit|morue|sardine|maquereau|moule|calamar|poulpe|colin|truite|hareng|nuoc|fumet|g(?:é|e)latine|poisson|hu(?:î|i)tre|dashi|bonite|worcestershire|saindoux|lapin|gibier|abats|tripes|andouille|rillettes|terrine|charcuterie|surimi|escargot|grenouille|caviar|poule|seiche|encornet|bulot|bigorneau|homard|langoustine|crabe|saint-jacques|tarama|katsuobushi|niboshi|guanciale|pancetta|chashu|morcilla|chicharr(?:ó|o)n|eomuk|coque|bar|congre|merlu|lieu|rouget|brochet'
const W = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + MOTS + ')(?![\\p{L}\\p{N}_])', 'iu')

describe('contrôle jetable', () => {
  it('aucun faux végétarien par les mots', () => {
    const fautives = []
    for (const r of getCanonicalRecipes()) {
      if (!classifyRecipe(r).vegetarian) continue
      const noms = (r.exactIngredients || []).filter((i) => !i.optional).map((i) => i.name)
      const suspects = noms.filter((n) => W.test(n))
      if (suspects.length) fautives.push(`${r.code} ${r.family} :: ${suspects.join(', ')}`)
    }
    require0('FAUX VEGETARIENS =', fautives.length, '\n' + fautives.join('\n'))
    expect(fautives).toEqual([])
  })

  it('inventaire', () => {
    const recettes = getCanonicalRecipes()
    const veg = recettes.filter((r) => classifyRecipe(r).vegetarian)
    require0('publiables', recettes.length, 'vegetariennes', veg.length)
    const opt = recettes.filter((r) => classifyRecipe(r).optionalNonVegetarian.length)
    require0('avec optionnel non vege', opt.length, opt.map((r) => r.code + ':' + classifyRecipe(r).optionalNonVegetarian.join('/')).join(' | '))
    const inc = recettes.filter((r) => classifyRecipe(r).unknownOrigins.length)
    require0('avec origine inconnue', inc.length, inc.map((r) => r.code).join(','))
  })
})
