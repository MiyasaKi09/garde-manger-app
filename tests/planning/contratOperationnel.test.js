import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * LA PORTE DE TEST DU CONTRAT OPÉRATIONNEL — livrable 0b.3.
 *
 * ELLE PRÉCÈDE LE RETRAIT, ET C'EST TOUT SON SUJET. `docs/PLAN_FINIR_MYKO.md`
 * (§5, phase 0b, risque *a*) dit que retirer une rustine avant que l'émission
 * soit complète casse le végétarien en production, et
 * `lib/domain/recipes/operationalCatalog.js` le dit dans son en-tête : sans le
 * raccord d'origine, chaque ingrédient servi par l'API serait « inconnu » et
 * plus aucun plat ne serait végétarien. Ce fichier est la parade. Il doit
 * passer AVANT que le livrable 0b.4 ne retire les deux raccords ; s'il ne
 * passe pas, les raccords restent et on le dit.
 *
 * CE QU'ELLE MESURE, ET SUR QUOI. Les quatre critères de 0b.3, sur le CHEMIN
 * BASE et lui seul :
 *   1. 0 origine « inconnu » parmi les formes servies ;
 *   2. un profil de conservation résolu pour CHAQUE recette servie ;
 *   3. une lignée distincte du code pour les 48 jumeaux ;
 *   4. un `component` non nul pour toute recette qui en déclare un.
 *
 * D'OÙ VIENT LE CHEMIN BASE ICI, PUISQUE VITEST N'A PAS DE POSTGRES. Le job
 * `test` de `.github/workflows/ci.yml` tourne sur des valeurs Supabase
 * factices (`https://example.supabase.co`, lignes 18-19) : il n'a aucune base à
 * lire. Un test qui se donnerait un catalogue en important
 * `data/recipes/corpus-v3.json` mesurerait exactement le défaut que la phase 0b
 * corrige — le dépôt au lieu de la base. Ce fichier ne l'importe donc jamais.
 * Il rejoue deux MATÉRIALISATIONS : la sortie de
 * `public.get_operational_recipe_catalog_v3`, lue page par page sur deux vraies
 * bases, écrite par `scripts/db/capture-catalogue-servi.mjs` dans
 * `tests/planning/fixtures/`. Les deux bases sont celles que le job `db-tests`
 * sait construire, et elles ne prouvent pas la même chose :
 *   — [A] migrations + chargeurs régénérés : la CHAÎNE DE PUBLICATION (0b.2) ;
 *   — [B] migrations seules, aucun chargeur : la RÉPARATION par
 *     `20260917111000` (0b.1), c'est-à-dire le chemin du pipeline de
 *     production, qui n'exécute aucun chargeur.
 *
 * LES RACCORDS JSON SONT NEUTRALISÉS POUR TOUT CE FICHIER (les deux `vi.mock`
 * ci-dessous). Ce n'est pas une commodité de test : c'est la répétition
 * littérale du livrable 0b.4, qui supprimera ces deux imports. Ce qui passe
 * ici passe sans eux. Le premier test du fichier VÉRIFIE que la neutralisation
 * a bien pris — un `vi.mock` qui échouerait silencieusement rendrait tout le
 * reste faux en le laissant vert.
 *
 * CE QU'ELLE NE COUVRE PAS, et qui doit être lu avec elle :
 *   — une capture est une PHOTO. Elle prouve ce que ces deux bases servaient
 *     le jour de la prise, pas ce que sert la base d'aujourd'hui. La parade est
 *     double : l'empreinte des trois migrations qui décident de la projection
 *     est inscrite dans la capture et comparée aux fichiers du dépôt (une
 *     projection modifiée rend la capture périmée, donc la porte rouge), et la
 *     même porte se rejoue SUR BASE VIVE quand `MYKO_CONTRAT_DB_URL` est
 *     fournie — ce que fait le job `db-tests`, qui a un Postgres ;
 *   — la capture garde les clés que ces quatre critères mesurent et jette le
 *     reste (`exactSteps`, `sensory`, `per100g`, `description`, `category`,
 *     `cuisineOrigin`…). `classifyRecipe` n'est donc lu ici que pour ses
 *     dimensions qui ne dépendent que des origines — `vegetarian`, `meat`,
 *     `fish`, `unknownOrigins`. Ses dimensions `cuisine`, `legumes`,
 *     `temperature` et `rich` seraient fausses sur une capture : elles ne sont
 *     pas assertées, et aucune conclusion n'en est tirée ;
 *   — le critère 4 est VRAI À VIDE aujourd'hui : zéro recette du corpus ne
 *     déclare de base partagée, donc « 0 publié pour 0 porté » ne prouve rien
 *     de la projection. Ce que la projection fait vraiment est prouvé par la
 *     sonde de `supabase/tests/contrat_operationnel.sql` (§4), qui relie un
 *     ingrédient à un composant le temps d'une transaction annulée. Ici, on
 *     compare le publié au PORTÉ EN BASE (chiffre lu, pas supposé), on vérifie
 *     la forme de tout component publié, et on éprouve la lecture JS de bout en
 *     bout — `materializeOperationalCatalog` puis `recipeBaseRefs` — sur un
 *     component posé dans la charge utile.
 */

// Les deux raccords de lib/domain/recipes/operationalCatalog.js, retirés du
// chemin pour tout ce fichier. Les usines rendent la forme exacte de l'import
// par défaut d'un JSON, vide : c'est l'état d'après 0b.4.
vi.mock('@/data/recipes/corpus-v3.json', () => ({ default: { recipes: [] } }))
vi.mock('@/scripts/data/out/recipe-food-catalog.json', () => ({ default: { forms: [] } }))

import corpusRaccorde from '@/data/recipes/corpus-v3.json'
import catalogueRaccorde from '@/scripts/data/out/recipe-food-catalog.json'
import { ORIGINS } from '@/lib/domain/foods/origins'
import { conservationProfileFromContract } from '@/lib/domain/recipes/conservationProfile'
import { materializeOperationalCatalog } from '@/lib/domain/recipes/operationalCatalog'
import { classifyRecipe, recipeLineage } from '@/lib/domain/planning/closedLoopPlanner'
import { recipeBaseRefs } from '@/lib/domain/planning/sharedBases'
import {
  MIGRATIONS_DU_CONTRAT,
  empreintesDuContrat,
  lireCatalogueServi,
  compterComponentsPortes,
  ouvrirLectureAuthentifiee,
  fermerLecture,
} from '@/scripts/db/capture-catalogue-servi.mjs'

const RACINE = process.cwd()
const CONTRAT_ATTENDU = 'v3-operational-2'
/** Les six clés que lit lib/domain/recipes/conservationProfile.js, et rien d'autre. */
const CLES_PROFIL = ['fridgeHours', 'eatImmediately', 'freezable', 'freezerMonths', 'serveCold', 'source']
/** Les six clés que lit lib/domain/planning/sharedBases.js (recipeBaseRefs). */
const CLES_COMPONENT = ['code', 'name', 'requiredQuantity', 'requiredUnit', 'yieldQuantity', 'yieldUnit']

const lireCapture = (scenario) => JSON.parse(
  readFileSync(join(RACINE, 'tests', 'planning', 'fixtures', `catalogue-servi-base-${scenario}.json`), 'utf8'),
)

const CAPTURES = {
  A: lireCapture('A'),
  B: lireCapture('B'),
}

/**
 * Ce que le moteur voit vraiment : la charge utile de la RPC passée par
 * `materializeOperationalCatalog`, la fonction que `listOperationalRecipes`
 * appelle en production — raccords neutralisés. On mesure sur CE résultat, et
 * pas sur la charge brute, parce que c'est lui que le planificateur consomme.
 */
const materialiser = (capture) => materializeOperationalCatalog({
  contractVersion: capture.provenance.contractVersion,
  metadata: { source: 'capture', scenario: capture.provenance.scenario },
  recipes: capture.recipes,
}).recipes

const MOTEUR = {
  A: materialiser(CAPTURES.A),
  B: materialiser(CAPTURES.B),
}

const ingredientsDe = (recettes) => recettes.flatMap((recette) => recette.exactIngredients)

describe('porte 0b.3 — les raccords JSON sont hors du chemin', () => {
  it('ne laisse ni le corpus ni le catalogue embarqués répondre à la place de la base', () => {
    // Ce test garde tous les autres. Si un jour ces deux usines cessaient de
    // s'appliquer — chemin d'alias modifié, import déplacé —, les quatre
    // critères ci-dessous passeraient grâce au JSON et la porte dirait le
    // contraire de ce qu'elle prétend mesurer.
    expect(corpusRaccorde.recipes).toEqual([])
    expect(catalogueRaccorde.forms).toEqual([])

    // Et la preuve par l'usage : une recette dont la base ne déclare NI origine
    // NI profil doit ressortir « inconnu » et sans profil. Avec les raccords en
    // place, la même entrée ressortirait « vegetal » et avec un profil, parce
    // que « lentille verte seche crue » porte `origin: vegetal` dans
    // scripts/data/out/recipe-food-catalog.json et FR-001 un
    // `conservation_profile` dans data/recipes/corpus-v3.json (vérifié). Cette
    // démonstration-ci dépend donc de deux valeurs des fichiers embarqués ; ce
    // sont les deux égalités ci-dessus, et non elle, qui garantissent la
    // neutralisation.
    const [temoin] = materializeOperationalCatalog({
      recipes: [{
        code: 'FR-001',
        servings: 2,
        exactIngredients: [{ formNormalized: 'lentille verte seche crue', quantity: 200, unit: 'g', grams: 200 }],
      }],
    }).recipes
    expect(temoin.exactIngredients[0].origin).toBe('inconnu')
    expect(temoin.conservationProfile).toBeNull()
  })
})

describe.each(['A', 'B'])('porte 0b.3 — chemin base, scénario %s', (scenario) => {
  const capture = CAPTURES[scenario]
  const servies = MOTEUR[scenario]
  const ingredients = ingredientsDe(servies)

  it('rejoue une capture prise sous la projection en vigueur', () => {
    // La capture est une photo : sans cette garde, une modification de la RPC
    // ou de la migration de valeurs laisserait la porte verte sur un état
    // révolu. Les tranches de corpus ne sont volontairement PAS dans cette
    // liste : elles changent le nombre de recettes, pas le contrat, et les y
    // mettre ferait rougir la porte à chaque lot hebdomadaire de la phase 5
    // sans qu'aucune projection n'ait bougé.
    for (const chemin of MIGRATIONS_DU_CONTRAT) {
      const attendu = createHash('sha256').update(readFileSync(join(RACINE, chemin))).digest('hex')
      expect(
        capture.provenance.empreintesDuContrat[chemin],
        `${chemin} a changé depuis la capture ${scenario} — rejouer : ${capture.provenance.regenerer}`,
      ).toBe(attendu)
    }
    expect(capture.provenance.empreintesDuContrat).toEqual(empreintesDuContrat(RACINE))
    // Le numéro de contrat distingue une base migrée d'une base qui ne l'est
    // pas, sans avoir à sonder une recette.
    expect(capture.provenance.contractVersion).toBe(CONTRAT_ATTENDU)
    // Une lecture interrompue servirait un catalogue tronqué et toutes les
    // mesures qui suivent porteraient sur un échantillon sans le dire.
    expect(capture.provenance.arretDeLecture).toBe('catalogue_epuise')
    expect(servies.length).toBe(capture.provenance.comptes.eligibleCountDeclareParLaRpc)
    expect(servies.length).toBeGreaterThan(0)
  })

  it('critère 1 — 0 origine « inconnu » parmi les formes servies', () => {
    expect(ingredients.length).toBeGreaterThan(0)
    const horsVocabulaire = ingredients.filter((ingredient) => !ORIGINS.includes(ingredient.origin))
    expect(horsVocabulaire.map((ingredient) => ingredient.formNormalized)).toEqual([])

    const inconnues = ingredients.filter((ingredient) => ingredient.origin === 'inconnu')
    expect(
      [...new Set(inconnues.map((ingredient) => ingredient.formNormalized))],
      'une seule origine « inconnu » suffit à faire disparaître un plat végétarien',
    ).toEqual([])

    // Le même zéro, mesuré par le classifieur du planificateur lui-même :
    // c'est lui qui décide `vegetarian`, et il n'a pas d'autre source que ces
    // origines (la RPC opérationnelle ne publie aucun `blockedIngredients`).
    const avecInconnu = servies.filter((recette) => classifyRecipe(recette).unknownOrigins.length > 0)
    expect(avecInconnu.map((recette) => recette.code)).toEqual([])
  })

  it('critère 2 — un profil de conservation résolu pour chaque recette servie', () => {
    const sansProfil = servies.filter((recette) => recette.conservationProfile === null)
    expect(
      sansProfil.map((recette) => recette.code),
      'une recette servie sans profil ne peut pas être produite d’avance, et rien ne le dirait',
    ).toEqual([])

    for (const recette of servies) {
      // Le profil doit être dans le VOCABULAIRE DU MOTEUR : un profil resté en
      // snake_case passerait « non nul » et rendrait des durées indéfinies.
      expect(Object.keys(recette.conservationProfile).sort(), recette.code).toEqual([...CLES_PROFIL].sort())
    }
    // Et il doit venir de la base : la porte de lecture appliquée à ce que la
    // capture porte rend exactement ce que le moteur a reçu. Si le raccord
    // corpus avait fourni quoi que ce soit, cette égalité tomberait.
    const parCode = new Map(capture.recipes.map((recette) => [recette.code, recette.conservationProfile]))
    for (const recette of servies) {
      expect(recette.conservationProfile, recette.code)
        .toEqual(conservationProfileFromContract(parCode.get(recette.code)))
    }
  })

  it('critère 3 — une lignée distincte du code pour les 48 jumeaux', () => {
    // Les jumeaux PORTÉS EN BASE, servis ou non : c'est le compte du plan.
    const jumeaux = capture.jumeauxEnBase
    expect(jumeaux.length).toBeGreaterThanOrEqual(48)
    const sansLignee = jumeaux.filter((jumeau) => !jumeau.derivedFrom || jumeau.derivedFrom === jumeau.code)
    expect(
      sansLignee.map((jumeau) => jumeau.code),
      'sans lignée, recipeLineage() rend le code et toute recette est sa propre lignée',
    ).toEqual([])

    // Les jumeaux SERVIS, lus par la fonction que le planificateur appelle.
    // Le compte servi est plus petit que 48 : les autres ne passent pas les
    // portes opérationnelles de la RPC (conversion en grammes et macros
    // complètes pour chaque ingrédient requis). C'est écrit ici plutôt que
    // masqué — P7 ne peut agir que sur ce qui est servi.
    const jumeauxServis = servies.filter((recette) => recette.code.startsWith('JUM-'))
    expect(jumeauxServis.length).toBeGreaterThan(0)
    expect(jumeauxServis.length).toBeLessThanOrEqual(jumeaux.length)
    const codesServis = new Set(jumeauxServis.map((recette) => recette.code))
    const attendus = jumeaux.filter((jumeau) => codesServis.has(jumeau.code))
    expect(jumeauxServis.length).toBe(attendus.length)
    for (const recette of jumeauxServis) {
      expect(recipeLineage(recette), recette.code).not.toBe(recette.code)
      expect(recipeLineage(recette), recette.code)
        .toBe(attendus.find((jumeau) => jumeau.code === recette.code).derivedFrom)
    }

    // Aucune recette servie ne doit porter une lignée égale à son propre code :
    // ce serait une lignée qui ne distingue rien.
    const ligneeEgaleAuCode = servies.filter((recette) => recette.derivedFrom && recette.derivedFrom === recette.code)
    expect(ligneeEgaleAuCode.map((recette) => recette.code)).toEqual([])
  })

  it('critère 4 — un component non nul pour toute recette qui en déclare un', () => {
    const publies = ingredients.filter((ingredient) => ingredient.component)
    // Le compte porté en base est LU à la capture, pas supposé : sans lui,
    // « 0 publié » passerait pour une réussite alors qu'il peut vouloir dire
    // que la projection est cassée.
    expect(publies.length).toBe(capture.componentsPortesEnBase)
    for (const ingredient of publies) {
      expect(Object.keys(ingredient.component).sort()).toEqual([...CLES_COMPONENT].sort())
      expect(ingredient.component.code).toBeTruthy()
    }
    // Aujourd'hui ce compte vaut zéro des deux côtés : aucune recette du corpus
    // ne déclare encore de base partagée (livrable 2.1). L'égalité ne prouve
    // donc rien de la projection SQL — c'est la sonde de
    // supabase/tests/contrat_operationnel.sql (§4) qui s'en charge. Ce qui est
    // prouvé ici est la moitié JS de la chaîne : un component publié par la
    // RPC arrive intact jusqu'à recipeBaseRefs(), raccords retirés.
    const porteuse = servies.find((recette) => recette.exactIngredients.length > 0)
    expect(porteuse, 'aucune recette servie ne porte d’ingrédient').toBeTruthy()
    const [premier] = porteuse.exactIngredients
    const [avecComponent] = materializeOperationalCatalog({
      recipes: [{
        code: porteuse.code,
        servings: 4,
        exactIngredients: [{
          formNormalized: premier.formNormalized,
          quantity: premier.quantity,
          unit: premier.unit,
          grams: premier.grams,
          origin: premier.origin,
          component: {
            code: 'FR-024', name: 'Béchamel maison',
            requiredQuantity: 240, requiredUnit: 'g', yieldQuantity: 870, yieldUnit: 'g',
          },
        }],
      }],
    }, { servings: 2 }).recipes
    const refs = recipeBaseRefs(avecComponent)
    expect(refs).toHaveLength(1)
    expect(refs[0].code).toBe('FR-024')
    // Mise à l'échelle des portions : 4 → 2, la quantité requise suit, le
    // rendement de la base ne suit pas (c'est une propriété de la base).
    expect(refs[0].requiredQuantity).toBe(120)
    expect(refs[0].yieldQuantity).toBe(870)
  })

  it('ne doit rien aux raccords : ce que le moteur lit est ce que la base a publié', () => {
    // La démonstration du livrable 0b.4, faite à l'envers : les raccords sont
    // déjà retirés ici, et la matérialisation rend exactement les valeurs de la
    // charge utile. Aucune n'a été complétée par un fichier embarqué.
    const parCode = new Map(capture.recipes.map((recette) => [recette.code, recette]))
    let compares = 0
    for (const recette of servies) {
      const brute = parCode.get(recette.code)
      expect(brute, recette.code).toBeTruthy()
      expect(recette.exactIngredients.length).toBe(brute.exactIngredients.length)
      for (const [index, ingredient] of recette.exactIngredients.entries()) {
        expect(ingredient.origin, `${recette.code}#${index}`).toBe(brute.exactIngredients[index].origin)
        compares += 1
      }
    }
    expect(compares).toBe(ingredients.length)
  })
})

describe('porte 0b.3 — les deux bases publient la même chose', () => {
  it('rend les mêmes origines et les mêmes profils sur les recettes communes', () => {
    // [A] passe par les chargeurs régénérés, [B] par les seules migrations —
    // dont 20260917111000, qui répare une base déjà chargée. Si les deux
    // divergeaient, le pipeline de production (qui n'exécute aucun chargeur)
    // servirait autre chose que ce que le dépôt émet, et l'écart §2.1 serait
    // revenu par une autre porte.
    const parCodeA = new Map(MOTEUR.A.map((recette) => [recette.code, recette]))
    const communes = MOTEUR.B.filter((recette) => parCodeA.has(recette.code))
    expect(communes.length).toBe(MOTEUR.B.length)

    const ecarts = []
    for (const recetteB of communes) {
      const recetteA = parCodeA.get(recetteB.code)
      if (JSON.stringify(recetteA.conservationProfile) !== JSON.stringify(recetteB.conservationProfile)) {
        ecarts.push(`${recetteB.code}: profil`)
      }
      if ((recetteA.derivedFrom || null) !== (recetteB.derivedFrom || null)) ecarts.push(`${recetteB.code}: lignée`)
      if (recetteA.exactIngredients.length !== recetteB.exactIngredients.length) {
        ecarts.push(`${recetteB.code}: nombre d’ingrédients`)
        continue
      }
      for (const [index, ingredient] of recetteB.exactIngredients.entries()) {
        if (recetteA.exactIngredients[index].origin !== ingredient.origin) {
          ecarts.push(`${recetteB.code}#${index}: origine`)
        }
      }
    }
    expect(ecarts).toEqual([])
  })

  it('sert le même catalogue par les deux chemins, et nomme l’écart s’il revient', () => {
    // Il a existé, et il valait onze recettes : la base des seules migrations
    // portait encore, pour « pate brisee crue » et « pate sablee crue », le
    // profil nutritionnel `23481` en confiance C, que le gardien opérationnel
    // de la RPC refuse. `20260917112000_pate_a_foncer_profil_exact.sql` l'a
    // réparé et les deux chemins servent aujourd'hui les mêmes 509 recettes.
    //
    // Ce qui est asserté reste le SENS de l'écart, pas son chiffre : [B] doit
    // être un sous-ensemble de [A] — une base sans chargeur ne peut rien servir
    // que la chaîne de publication ne servirait pas — et tout écart est nommé
    // recette par recette. Figer « zéro » ferait rougir la porte au premier lot
    // de la phase 5 chargé d'un côté seulement.
    const codesA = new Set(MOTEUR.A.map((recette) => recette.code))
    const codesB = new Set(MOTEUR.B.map((recette) => recette.code))
    const seulementEnA = MOTEUR.A.filter((recette) => !codesB.has(recette.code)).map((recette) => recette.code)
    const seulementEnB = MOTEUR.B.filter((recette) => !codesA.has(recette.code)).map((recette) => recette.code)
    expect(seulementEnB).toEqual([])
    expect(MOTEUR.B.length + seulementEnA.length).toBe(MOTEUR.A.length)
  })
})

/**
 * LA MÊME PORTE, SUR BASE VIVE. Déclarée seulement quand une base est fournie
 * par `MYKO_CONTRAT_DB_URL` — c'est le job `db-tests` de la CI qui la fournit,
 * juste après les assertions SQL, sur les deux bases qu'il vient de construire.
 * La variable est propre à cette porte et n'est PAS `DATABASE_URL` : une
 * variable d'environnement traînante ne doit pas pouvoir faire tourner un test
 * sur une base qu'on n'a pas choisie.
 *
 * Elle lit avec le MÊME code que la capture (`lireCatalogueServi`), pour qu'il
 * n'y ait pas deux lectures susceptibles de diverger, et sa transaction est
 * annulée : elle ne peut rien écrire.
 */
const BASE_VIVE = process.env.MYKO_CONTRAT_DB_URL

if (BASE_VIVE) {
  describe('porte 0b.3 — sur base vive (MYKO_CONTRAT_DB_URL)', () => {
    let servies = []
    let lecture = null
    let componentsPortesEnBase = null

    // Une seule lecture pour tout le bloc : la RPC rejoue sa CTE de
    // qualification à chaque page, et la CI accorde vingt secondes par test.
    // C'est le modèle de tests/planning/varieteSemaine.test.js.
    beforeAll(async () => {
      const client = await ouvrirLectureAuthentifiee(BASE_VIVE)
      try {
        lecture = await lireCatalogueServi(client)
        componentsPortesEnBase = await compterComponentsPortes(
          client,
          lecture.recettes.map((recette) => recette.code),
        )
        servies = materializeOperationalCatalog({ recipes: lecture.recettes }).recipes
      } finally {
        await fermerLecture(client)
      }
    }, 120000)

    it('sert un catalogue non vide, lu en entier, sous la projection du contrat', () => {
      expect(lecture.contractVersion).toBe(CONTRAT_ATTENDU)
      expect(lecture.arret).toBe('catalogue_epuise')
      expect(servies.length).toBeGreaterThan(0)
      expect(servies.length).toBe(lecture.eligibleCount)
    })

    it('critère 1 — 0 origine « inconnu » parmi les formes servies', () => {
      const ingredients = ingredientsDe(servies)
      expect(ingredients.length).toBeGreaterThan(0)
      expect(ingredients.filter((ingredient) => !ORIGINS.includes(ingredient.origin))).toEqual([])
      const inconnues = [...new Set(ingredients
        .filter((ingredient) => ingredient.origin === 'inconnu')
        .map((ingredient) => ingredient.formNormalized))]
      expect(inconnues).toEqual([])
    })

    it('critère 2 — un profil de conservation résolu pour chaque recette servie', () => {
      const sansProfil = servies.filter((recette) => recette.conservationProfile === null)
      expect(sansProfil.map((recette) => recette.code)).toEqual([])
      for (const recette of servies) {
        expect(Object.keys(recette.conservationProfile).sort(), recette.code).toEqual([...CLES_PROFIL].sort())
      }
    })

    it('critère 3 — une lignée distincte du code pour les jumeaux servis', () => {
      const jumeaux = servies.filter((recette) => recette.code.startsWith('JUM-'))
      expect(jumeaux.length).toBeGreaterThan(0)
      const sansLignee = jumeaux.filter((recette) => recipeLineage(recette) === recette.code)
      expect(sansLignee.map((recette) => recette.code)).toEqual([])
    })

    it('critère 4 — un component non nul pour toute recette qui en déclare un', () => {
      const publies = ingredientsDe(servies).filter((ingredient) => ingredient.component)
      // Le compte porté en base est lu sur la MÊME base, dans la MÊME
      // transaction : publier moins que ce que la base porte serait une
      // projection qui perd des liens sans le dire.
      expect(publies.length).toBe(componentsPortesEnBase)
      for (const ingredient of publies) {
        expect(Object.keys(ingredient.component).sort()).toEqual([...CLES_COMPONENT].sort())
        expect(ingredient.component.code).toBeTruthy()
      }
    })
  })
}
