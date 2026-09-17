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
  // Lot « jumeaux 13 », 17 septembre 2026. Cinq fiches écrites sur dossier de
  // sources, trois RATTACHEMENTS de recettes qui existaient déjà au corpus et
  // vivaient hors lignée — pour celles-là, rien d'autre n'a changé que
  // `derived_from`, et le versement est passé par « remplace ».
  { jumeau: 'JUM-124', base: 'SRC-009', plat: 'bouchées à la reine' },
  { jumeau: 'JUM-125', base: 'VAR-001', plat: 'risotto au safran' },
  { jumeau: 'JUM-126', base: 'RAP-042', plat: 'nouilles sautées' },
  { jumeau: 'JUM-127', base: 'DEN-017', plat: 'mijoté de pois chiches' },
  { jumeau: 'JUM-128', base: 'SRC-021', plat: 'poivrons farcis' },
  { jumeau: 'VAR-035', base: 'FR-036', plat: 'tarte aux poireaux' },      // rattachement
  { jumeau: 'RAP-023', base: 'DEN-021', plat: 'omelette garnie' },        // rattachement
  { jumeau: 'FR-027', base: 'SRC-049', plat: 'pommes de terre poêlées' }, // rattachement
]

// La classification carné / végé lit les ingrédients matérialisés (catégorie du
// catalogue, forme normalisée), pas la fiche brute : on passe par le catalogue
// canonique, comme le planificateur. `eligibleOnly: false` pour voir les bases
// qui ne sont pas encore servables (GR-001, MAG-001 sans rôle d'assiette) :
// le rattachement est juste en lignée même quand la base attend son rôle.
const toutes = getCanonicalRecipes({ eligibleOnly: false })
const materialisee = new Map(toutes.map((recipe) => [recipe.code, recipe]))
// Les mots de viande, cherchés dans les formes de la fiche. Deux choses valent
// d'être dites. D'abord les BORNES : le `\b` de JavaScript est ASCII, il coupe
// devant un « é » et laisserait passer des faux positifs sur des mots
// accentués ; on emploie donc les gardes Unicode et le drapeau `u`. Ensuite le
// CONTENU : la première version ne portait que des noms d'animaux, et elle
// déclarait non carnées la Tarte aux poireaux et LARDONS et l'Omelette au
// JAMBON — deux bases de ce lot. Une charcuterie est de la viande ; l'oublier
// faisait passer le contrôle pour vert là où il ne regardait rien.
const VIANDE = /(?<![\p{L}\p{N}_])(?:agneau|b(?:oe|œ)uf|porc|poulet|poule|merguez|veau|canard|volaille|lardons?|jambon|chorizo|saucisses?)(?![\p{L}\p{N}_])/iu

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

  /**
   * TOUT lot qui porte un jumeau doit porter son rattachement — pas « un »
   * lot, TOUS. Sans quoi un re-versement déferait le rattachement en silence.
   *
   * CE CONTRÔLE A ÉTÉ ÉCRIT DEUX FOIS, et la première ne pouvait pas échouer.
   * Elle fondait tous les lots dans une seule Map par code : un jumeau présent
   * dans deux lots — son lot d'origine et le lot de reprise qui le rattache —
   * n'y laissait que la dernière lecture, celle qui porte `derived_from`. On a
   * retiré le rattachement de `lot-rapide.json` pour voir : le test est resté
   * vert. Il lit désormais FICHIER PAR FICHIER, et la même mutation le fait
   * rougir.
   */
  it('chaque lot qui porte un jumeau porte aussi son rattachement', () => {
    const LOTS = [
      'lot-variete-06-vegetarien.json', 'lot-rapide.json',
      'lot-variete-02-mediterranee.json', 'lot-variete-03-maghreb.json',
      // Lot « jumeaux 13 » : les cinq fiches neuves, et les trois reprises qui
      // ne font que poser `derived_from`.
      'lot-jumeaux-13.json',
      // Et les lots D'ORIGINE des trois rattachements : sans eux, un
      // re-versement de l'ancien lot rendrait ces recettes à leur solitude.
      'lot-variete-05-familles-francaises.json', 'batch3-03.json',
    ]
    const attendu = new Map(RATTACHEMENTS.map(({ jumeau, base }) => [jumeau, base]))
    let vus = 0
    for (const nom of LOTS) {
      const contenu = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'batches', nom), 'utf8'))
      for (const recette of (Array.isArray(contenu) ? contenu : contenu.recipes)) {
        if (!attendu.has(recette.code)) continue
        vus += 1
        expect(recette.derived_from, `${recette.code} dans ${nom}`).toBe(attendu.get(recette.code))
      }
    }
    // Onze rattachements, dont trois présents dans deux lots chacun : quatorze
    // lectures. Le compte est vérifié pour que la boucle ne puisse pas passer
    // à vide — c'est la seconde moitié de la leçon ci-dessus.
    expect(vus).toBe(RATTACHEMENTS.length + 3)
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
    // Mesure au moment du premier lot : 520 servables, 170 lignées carnées, 18
    // avec jumeau (dont FR-004, MX-001 et RAP-033 rattachés ici ; GR-001 et
    // MAG-001 ne comptent pas tant qu'ils ne sont pas servables). La borne
    // basse est ce chiffre ; elle monte avec les lots suivants.
    //
    // Relevé le 17 septembre 2026, après le lot « jumeaux 13 » : 573 servables,
    // 170 lignées non végétariennes, 74 avec jumeau (66 avant le lot).
    expect(carnees.length).toBeGreaterThan(avecJumeau.length)
    expect(avecJumeau.length).toBeGreaterThanOrEqual(74)
  })

  /**
   * LA MESURE QUE LE PLAN CITE, et qui n'est PAS celle du test ci-dessus.
   *
   * Le §2.4 du plan écrit « 125 lignées carnées (viande), 65 ont un jumeau » ;
   * le test précédent en compte 170 et 66. Les deux sont justes et ne portent
   * pas sur le même ensemble : celui du dessus appelle « carnée » toute lignée
   * NON végétarienne — le poisson et les fruits de mer y entrent —, celui-ci
   * ne retient que `classifyRecipe(...).meat`. Les avoir laissées se confondre
   * a déjà coûté une comparaison fausse entre deux relevés ; la seconde vit
   * donc ici, sous son propre nom.
   *
   * Mesuré le 17 septembre 2026 : 125 lignées de VIANDE servables, 65 avec
   * jumeau avant le lot « jumeaux 13 », 73 après — huit de plus, une par
   * rattachement de ce lot.
   */
  it('compte les lignées de VIANDE servables qui ont un jumeau végétarien', () => {
    const servables = getCanonicalRecipes({ eligibleOnly: true })
    const lignees = new Map()
    for (const recipe of servables) {
      const lignee = recipeLineage(recipe)
      const classification = classifyRecipe(recipe)
      const entree = lignees.get(lignee) || { viande: false, jumeau: false }
      if (classification.meat) entree.viande = true
      if (classification.vegetarian) entree.jumeau = true
      lignees.set(lignee, entree)
    }
    const viande = [...lignees.values()].filter((entree) => entree.viande)
    const avecJumeau = viande.filter((entree) => entree.jumeau)
    expect(viande.length).toBeGreaterThanOrEqual(125)
    expect(avecJumeau.length).toBeGreaterThanOrEqual(73)
  })
})
