import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { classifyRecipe, recipeLineage } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

/**
 * Jumeaux végétariens rattachés à leur lignée (plan « planning parfait », C2).
 *
 * Zoé veut manger moins de viande que Julien, dans le MÊME plat. Le moteur de
 * repas personnalisés (chooseVegetarianAlternative) cherche d'abord une recette
 * végétarienne de la même lignée que le plat carné du foyer ; faute d'en
 * trouver, il sert un autre plat — et il a servi deux fois du boudin noir comme
 * « variante végétarienne » d'un pastitsio. Un jumeau est une recette autonome,
 * sourcée, qui est le même plat que sa base (même structure, même féculent,
 * même technique) sans la protéine animale : poser `derived_from` sur elle en
 * fait, aux yeux du planificateur, la version végé de sa base.
 *
 * Ce test verrouille chaque rattachement décidé, et mesure sur le corpus réel
 * combien de lignées carnées ont désormais un jumeau. La borne basse est le
 * chiffre obtenu au moment du lot : elle monte avec les lots suivants, elle ne
 * redescend pas — un rattachement qui disparaît est une régression du planning
 * de Zoé, pas un détail du corpus.
 */
const corpus = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'corpus-v3.json'), 'utf8'))
const parCode = new Map(corpus.recipes.map((recipe) => [recipe.code, recipe]))

// Les rattachements de ce lot. Chacun a été vérifié fiche contre fiche : même
// plat, même féculent, même technique, protéine animale absente.
const RATTACHEMENTS = [
  { jumeau: 'VAR-042', base: 'MX-001', plat: 'chili' },       // sin carne ← con carne
  { jumeau: 'VAR-045', base: 'FR-004', plat: 'hachis parmentier' },
  { jumeau: 'RAP-032', base: 'RAP-033', plat: 'curry' },      // de légumes ← poulet au curry
  { jumeau: 'VAR-015', base: 'GR-001', plat: 'moussaka' },
  { jumeau: 'VAR-025', base: 'MAG-001', plat: 'couscous' },
  { jumeau: 'VAR-043', base: 'IT-001', plat: 'lasagnes' },    // aux côtés d'IT-001-D3 (lentilles)
]

// La classification carné / végé lit les ingrédients matérialisés (catégorie du
// catalogue, forme normalisée), pas la fiche brute : on passe par le catalogue
// canonique, comme le planificateur. `eligibleOnly: false` pour voir les bases
// qui ne sont pas encore servables (GR-001, MAG-001 sans rôle d'assiette) :
// le rattachement est juste en lignée même quand la base attend son rôle.
const toutes = getCanonicalRecipes({ eligibleOnly: false })
const materialisee = new Map(toutes.map((recipe) => [recipe.code, recipe]))
const VIANDE = /agneau|b(oe|œ)uf|porc|poulet|merguez|veau|canard|volaille/i

describe('jumeaux végétariens rattachés à leur lignée', () => {
  it.each(RATTACHEMENTS)('$jumeau est le jumeau végétarien de $base ($plat)', ({ jumeau, base }) => {
    const fiche = parCode.get(jumeau)
    const ficheBase = parCode.get(base)
    expect(fiche, jumeau).toBeTruthy()
    expect(ficheBase, base).toBeTruthy()

    // La lignée est celle de la base, et la base n'est pas elle-même une
    // dérivée : jamais de cascade, sinon « même plat ? » n'a plus de réponse
    // locale.
    expect(fiche.derived_from).toBe(base)
    expect(ficheBase.derived_from).toBeFalsy()
    expect(recipeLineage(materialisee.get(jumeau))).toBe(base)
    expect(recipeLineage(materialisee.get(base))).toBe(base)

    // Le sens du rattachement : le jumeau est végétarien, la base est carnée.
    // Un jumeau qui cesserait de l'être (un bouillon de volaille glissé dans
    // une reprise) ne servirait plus Zoé ; une base qui cesserait d'être carnée
    // n'aurait plus besoin de jumeau.
    expect(classifyRecipe(materialisee.get(jumeau)).vegetarian, `${jumeau} végétarien`).toBe(true)
    // La base est carnée sur sa FICHE : une forme de viande parmi ses
    // ingrédients (les fiches historiques ne portent pas de rôle par ligne).
    // On ne le demande à classifyRecipe que si la base est servable. GR-001
    // (moussaka) ne l'est pas : son « Agneau haché cru » n'a qu'une forme à
    // confiance C au catalogue, la matérialisation l'écarte, et la
    // classification voit une moussaka sans agneau — un faux végétarien qui
    // deviendra un vrai défaut le jour où la base sera servable, pas une
    // raison de nier que la moussaka est un plat de viande.
    const ficheCarnee = ficheBase.ingredients.some((ingredient) => VIANDE.test(ingredient.form))
    expect(ficheCarnee, `${base} carné sur sa fiche`).toBe(true)
    if (materialisee.get(base).eligible) {
      expect(classifyRecipe(materialisee.get(base)).vegetarian, `${base} carné`).toBe(false)
    }

    // Un jumeau rattaché reste une recette autonome : ses propres sources, pas
    // de delta calculé depuis la base.
    expect(fiche.sources.length).toBeGreaterThanOrEqual(2)
    expect(fiche.derivation).toBeUndefined()
  })

  it('le lot d’origine porte le même rattachement que le corpus', () => {
    // Sans quoi un re-versement du lot déferait le rattachement en silence.
    const lots = [
      'lot-variete-06-vegetarien.json', 'lot-rapide.json',
      'lot-variete-02-mediterranee.json', 'lot-variete-03-maghreb.json',
    ].flatMap((nom) => JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'batches', nom), 'utf8')).recipes)
    const enLot = new Map(lots.map((recipe) => [recipe.code, recipe]))
    for (const { jumeau, base } of RATTACHEMENTS) {
      expect(enLot.get(jumeau)?.derived_from, jumeau).toBe(base)
    }
  })

  // La mesure du plan (§2.2) : 181 lignées carnées, 11 avec jumeau. On la
  // refait sur les recettes servables, comme le planificateur les voit. Une
  // lignée est carnée si l'une de ses recettes servables l'est ; elle a un
  // jumeau si une autre de ses recettes servables est végétarienne.
  it('compte les lignées carnées servables qui ont un jumeau végétarien', () => {
    const servables = getCanonicalRecipes({ eligibleOnly: true })
    const lignees = new Map()
    for (const recipe of servables) {
      const lignee = recipeLineage(recipe)
      const entree = lignees.get(lignee) || { carnee: false, jumeau: false }
      if (classifyRecipe(recipe).vegetarian) entree.jumeau = true
      else entree.carnee = true
      lignees.set(lignee, entree)
    }
    const carnees = [...lignees.values()].filter((entree) => entree.carnee)
    const avecJumeau = carnees.filter((entree) => entree.jumeau)
    // Mesure au moment de ce lot : 520 servables, 170 lignées carnées, 18 avec
    // jumeau (dont FR-004, MX-001 et RAP-033 rattachés ici ; GR-001 et MAG-001
    // ne comptent pas tant qu'ils ne sont pas servables). La borne basse est
    // ce chiffre ; elle monte avec les lots suivants.
    expect(carnees.length).toBeGreaterThan(avecJumeau.length)
    expect(avecJumeau.length).toBeGreaterThanOrEqual(18)
  })
})
