import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  OPERATIONAL_CATALOG_MAX_OFFSET,
  OPERATIONAL_CATALOG_PAGE_SIZE,
  getOperationalRecipe,
  listOperationalRecipes,
} from '@/lib/db/operationalRecipeCatalog'
import { PLANNING_POOL_MAX_CANDIDATES } from '@/lib/domain/planning/recipeCandidatePolicy'

/**
 * Ce fichier existe parce que, mesuré en base le 17 septembre 2026, le
 * planificateur de production choisissait parmi CENT plats alors que 324
 * qualifiaient. Pas par erreur de code : par un plafond de la RPC
 * (`LIMIT greatest(1, least(coalesce(p_limit, 100), 100))`, ligne 108 de
 * `supabase/migrations/20260715190000_v3_operational_recipe_api.sql`) qui
 * raccourcit sans rien dire, combiné à deux sites d'appel qui ne paginaient
 * pas. Les 224 recettes invisibles étaient 214 codes `SRC-`, 6 `VEG-` et
 * 4 `REAL-` — le tri `ORDER BY code` coupait toujours au même endroit.
 *
 * Ce qui est verrouillé ici tient en deux temps :
 *   1. la fonction rend TOUT ce que la base déclare qualifier, et dit quand
 *      elle n'a pas pu ;
 *   2. aucun appelant du chemin de planning ne peut redemander une borne —
 *      ce serait revenir à cent en silence, et c'est exactement le défaut
 *      qu'on vient de retirer.
 */

const RACINE = path.resolve(__dirname, '..', '..')

/**
 * Faux Supabase qui rejoue le contrat EXACT de la RPC : plafond de page à 100
 * quoi qu'on demande, plafond d'OFFSET à 10 000, tri par code, et le
 * `eligibleCount` que la vraie fonction publie (ligne 250 de la migration).
 */
function baseSimulee(codes, {
  plafondPage = OPERATIONAL_CATALOG_PAGE_SIZE,
  plafondOffset = OPERATIONAL_CATALOG_MAX_OFFSET,
} = {}) {
  const tries = [...codes].sort((gauche, droite) => gauche.localeCompare(droite))
  const appels = []
  const supabase = {
    appels,
    rpc: async (nom, args) => {
      appels.push({ nom, ...args })
      const filtres = args.p_code
        ? tries.filter((code) => code.toUpperCase() === String(args.p_code).toUpperCase())
        : tries
      const limite = Math.max(1, Math.min(Number(args.p_limit ?? 100), plafondPage))
      const decalage = Math.max(0, Math.min(Number(args.p_offset ?? 0), plafondOffset))
      return {
        data: {
          contractVersion: 'v3-operational-1',
          metadata: {
            source: 'supabase',
            corpusVersion: 'test-corpus',
            eligibleCount: filtres.length,
            returnedCount: Math.min(limite, Math.max(0, filtres.length - decalage)),
            limit: limite,
            offset: decalage,
          },
          recipes: filtres.slice(decalage, decalage + limite).map((code) => ({
            code,
            servings: 2,
            exactIngredients: [],
            exactSteps: [],
            catalogStatus: 'operational_candidate',
          })),
        },
        error: null,
      }
    },
  }
  return supabase
}

const codesFactices = (prefixe, nombre, depart = 1) => Array.from(
  { length: nombre },
  (valeur, index) => `${prefixe}-${String(index + depart).padStart(4, '0')}`,
)

describe('le catalogue opérationnel est lu en entier, page après page', () => {
  it('rend les 324 recettes qui qualifient en base aujourd’hui, pas les cent premières', async () => {
    // Les 324 d'aujourd'hui, avec la répartition réelle relevée en base : les
    // 214 `SRC-` sont précisément celles que le tri par code écartait.
    const codes = [
      ...codesFactices('FR', 25), ...codesFactices('IT', 14), ...codesFactices('REAL', 42),
      ...codesFactices('DESS', 8), ...codesFactices('EGG', 1), ...codesFactices('IND', 1),
      ...codesFactices('LEV', 2), ...codesFactices('MED', 1), ...codesFactices('MX', 3),
      ...codesFactices('PROT', 7), ...codesFactices('SRC', 214), ...codesFactices('VEG', 6),
    ]
    expect(codes.length).toBe(324)

    const supabase = baseSimulee(codes)
    const catalogue = await listOperationalRecipes(supabase, { servings: 2 })

    expect(catalogue.recipes.length).toBe(324)
    expect(catalogue.metadata.receivedCount).toBe(324)
    expect(catalogue.metadata.eligibleCount).toBe(324)
    expect(catalogue.metadata.complete).toBe(true)
    expect(catalogue.metadata.pageCount).toBe(4)
    // Les préfixes que la production ne voyait pas.
    const prefixes = new Set(catalogue.recipes.map((recipe) => recipe.code.split('-')[0]))
    expect(prefixes.has('SRC')).toBe(true)
    expect(prefixes.has('VEG')).toBe(true)
    // Aucune recette servie deux fois : les pages ne se chevauchent pas.
    expect(new Set(catalogue.recipes.map((recipe) => recipe.code)).size).toBe(324)
  })

  it('ne demande jamais plus de cent par page — le plafond de la RPC est respecté, pas contourné', async () => {
    const supabase = baseSimulee(codesFactices('SRC', 754))
    const catalogue = await listOperationalRecipes(supabase, { servings: 2, pageSize: 5000 })

    expect(catalogue.recipes.length).toBe(754)
    expect(supabase.appels.every((appel) => appel.p_limit <= OPERATIONAL_CATALOG_PAGE_SIZE)).toBe(true)
    // Les offsets avancent d'une page pleine, dans l'ordre, sans trou.
    expect(supabase.appels.map((appel) => appel.p_offset)).toEqual([0, 100, 200, 300, 400, 500, 600, 700])
  })

  it('ne réclame pas une page vide quand le catalogue tombe juste sur une centaine', async () => {
    // 700 recettes = sept pages pleines. Sans le compte déclaré par la RPC, il
    // faudrait un huitième appel pour découvrir que la suite est vide — et cet
    // appel rejouerait la qualification complète pour rien.
    const supabase = baseSimulee(codesFactices('SRC', 700))
    const catalogue = await listOperationalRecipes(supabase, { servings: 2 })

    expect(catalogue.recipes.length).toBe(700)
    expect(catalogue.metadata.complete).toBe(true)
    expect(catalogue.metadata.pageCount).toBe(7)
    expect(supabase.appels.length).toBe(7)
  })

  it('remonte les 754 recettes attendues après la migration de corpus 0a.2', async () => {
    const supabase = baseSimulee([...codesFactices('SRC', 706), ...codesFactices('JUM', 48)])
    const catalogue = await listOperationalRecipes(supabase, { servings: 2 })

    expect(catalogue.metadata.receivedCount).toBe(754)
    expect(catalogue.metadata.complete).toBe(true)
    expect(catalogue.recipes.filter((recipe) => recipe.code.startsWith('JUM-')).length).toBe(48)
  })

  it('DÉCLARE la troncature au plafond d’OFFSET au lieu de boucler ou de tronquer en silence', async () => {
    // Au-delà de 10 000, la base rabote l'OFFSET et reservirait la même page.
    const supabase = baseSimulee(codesFactices('SRC', 10250))
    const catalogue = await listOperationalRecipes(supabase, { servings: 2 })

    expect(catalogue.metadata.complete).toBe(false)
    expect(catalogue.metadata.stoppedBy).toBe('offset_max_atteint')
    expect(catalogue.metadata.eligibleCount).toBe(10250)
    expect(catalogue.metadata.receivedCount).toBeLessThan(10250)
    // Et surtout : aucune recette servie deux fois malgré le rabotage.
    expect(new Set(catalogue.recipes.map((recipe) => recipe.code)).size).toBe(catalogue.recipes.length)
  })

  it('s’arrête si la base se met à reservir la même page, au lieu de boucler sans fin', async () => {
    // Le plafond d'OFFSET est une valeur de la base, pas une constante de ce
    // dépôt : le jour où elle baisse, la RPC rabote l'OFFSET et reservirait la
    // même page indéfiniment. La garde par codes déjà vus est ce qui empêche la
    // boucle infinie ET le doublon dans le vivier du solveur. On la met
    // réellement à l'épreuve plutôt que de la décrire.
    const supabase = baseSimulee(codesFactices('SRC', 500), { plafondOffset: 200 })
    const catalogue = await listOperationalRecipes(supabase, { servings: 2 })

    expect(catalogue.metadata.stoppedBy).toBe('page_deja_servie')
    expect(catalogue.metadata.complete).toBe(false)
    expect(catalogue.recipes.length).toBe(300)
    expect(new Set(catalogue.recipes.map((recipe) => recipe.code)).size).toBe(300)
  })

  it('s’arrête où on le lui demande, et le dit', async () => {
    const supabase = baseSimulee(codesFactices('SRC', 500))
    const catalogue = await listOperationalRecipes(supabase, { servings: 2, maxRecipes: 150 })

    expect(catalogue.recipes.length).toBe(150)
    expect(catalogue.metadata.receivedCount).toBe(150)
    expect(catalogue.metadata.maxRecipes).toBe(150)
    expect(catalogue.metadata.eligibleCount).toBe(500)
    // Une lecture volontairement partielle n'est jamais présentée comme complète.
    expect(catalogue.metadata.complete).toBe(false)
    expect(catalogue.metadata.stoppedBy).toBe('max_recettes_atteint')
  })

  it('ne fait qu’un aller-retour pour une recette désignée par son code', async () => {
    const supabase = baseSimulee(codesFactices('SRC', 500))
    const recette = await getOperationalRecipe(supabase, 'SRC-0042', { servings: 2 })

    expect(recette?.code).toBe('SRC-0042')
    expect(supabase.appels.length).toBe(1)
  })
})

describe('aucun appelant ne peut revenir à cent en silence', () => {
  /**
   * Garde de SOURCE, et elle est volontaire.
   *
   * Le défaut d'origine n'était pas dans `listOperationalRecipes` : il était
   * chez ses appelants, qui se contentaient du défaut. Un test qui ne
   * vérifierait que la fonction laisserait entièrement ouverte la porte par
   * laquelle le plafond est entré. On relit donc les deux sites d'appel du
   * chemin de planning et on refuse toute borne de lecture.
   *
   * Ce qui est interdit : `limit`, `pageSize`, `maxRecipes` sur ces deux
   * appels. Ce qui reste permis partout ailleurs : `getOperationalRecipe`, qui
   * borne à une recette parce qu'un code en désigne une.
   */
  const SITES = [
    'app/api/planning/generate-v3/route.js',
    'app/api/planning/alternatives/route.js',
  ]

  it.each(SITES)('%s lit le catalogue sans borne', (chemin) => {
    const source = readFileSync(path.join(RACINE, chemin), 'utf8')
    const appels = [...source.matchAll(/listOperationalRecipes\(\s*supabase\s*,\s*\{([^}]*)\}/g)]
    expect(appels.length, `${chemin} : aucun appel à listOperationalRecipes trouvé`).toBeGreaterThan(0)
    for (const [, arguments_] of appels) {
      expect(arguments_, `${chemin} : une borne de lecture est repassée à listOperationalRecipes`)
        .not.toMatch(/\b(limit|pageSize|maxRecipes)\s*:/)
    }
  })

  it('les deux appels d’élagage portent le plafond calibré, explicitement (0a.4)', () => {
    // Pendant du test ci-dessus, pour l'autre bout du tuyau : lever le plafond
    // de lecture sans dire quel élagage s'applique ensuite ne ferait que
    // déplacer le nombre magique d'une couche à l'autre. Les deux appels de
    // `selectPlanningRecipePool` — la génération et son repli — doivent
    // nommer la constante mesurée, et la même.
    const source = readFileSync(path.join(RACINE, 'app/api/planning/generate-v3/route.js'), 'utf8')
    const appels = [...source.matchAll(/selectPlanningRecipePool\(\s*\{([^}]*)\}/g)]
    expect(appels.length, 'les deux appels de selectPlanningRecipePool doivent être là').toBe(2)
    for (const [, arguments_] of appels) {
      expect(arguments_).toMatch(/maxCandidates:\s*PLANNING_POOL_MAX_CANDIDATES/)
    }
    // Et la valeur elle-même ne redescend pas à l'ancien reste de 96 sans que
    // la table de mesures de `recipeCandidatePolicy.js` soit refaite.
    expect(PLANNING_POOL_MAX_CANDIDATES).toBe(400)
  })

  it('le plafond dur de la RPC est celui de la migration, et il n’est pas recopié ailleurs', () => {
    const migration = readFileSync(
      path.join(RACINE, 'supabase/migrations/20260715190000_v3_operational_recipe_api.sql'),
      'utf8',
    )
    // Si un jour la migration lève son plafond, ce test le signale : la
    // constante du module doit alors être relue, pas laissée à 100 par habitude.
    expect(migration).toContain('LIMIT greatest(1, least(coalesce(p_limit, 100), 100))')
    expect(migration).toContain('OFFSET greatest(0, least(coalesce(p_offset, 0), 10000))')
    expect(OPERATIONAL_CATALOG_PAGE_SIZE).toBe(100)
    expect(OPERATIONAL_CATALOG_MAX_OFFSET).toBe(10000)
  })
})
