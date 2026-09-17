import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { ORIGINS, isVegetarianCompatibleOrigin } from '@/lib/domain/foods/origins'
import { materializeOperationalCatalog } from '@/lib/domain/recipes/operationalCatalog'
import { classifyRecipe } from '@/lib/domain/planning/closedLoopPlanner'

/**
 * LE RETRAIT DES DEUX RACCORDS JSON — livrable 0b.4, et sa mesure.
 *
 * CE QUE 0b.4 A FAIT. `lib/domain/recipes/operationalCatalog.js` importait
 * `scripts/data/out/recipe-food-catalog.json` (l'origine des formes) et
 * `data/recipes/corpus-v3.json` (le profil de conservation), et complétait avec
 * eux ce que la RPC opérationnelle ne publiait pas. Les deux imports sont
 * partis. Ce fichier-ci est ce qui empêche leur retour, et ce qui mesure ce que
 * leur départ a coûté.
 *
 * POURQUOI UN FICHIER SÉPARÉ DE LA PORTE 0b.3. La porte
 * (`tests/planning/contratOperationnel.test.js`) neutralisait les deux imports
 * par `vi.mock` pour répéter, à l'avance, l'état d'après le retrait : elle
 * répondait à « le retrait est-il sûr ? ». Ici les imports n'existent plus, il
 * n'y a donc rien à neutraliser, et la question est l'autre : « qu'est-ce que le
 * retrait a changé, et qu'est-ce qui interdit son retour ? ». Les deux fichiers
 * restent utiles séparément — le jour où quelqu'un réintroduirait un raccord, la
 * porte 0b.3 continuerait de passer (ses `vi.mock` le masqueraient), et c'est ce
 * fichier-ci qui rougirait.
 *
 * CE QU'IL MESURE, ET SUR QUOI. Le CHEMIN BASE, par les deux captures de
 * `tests/planning/fixtures/` — la sortie de
 * `public.get_operational_recipe_catalog_v3` lue page par page sur deux vraies
 * bases ([A] chargeurs rejoués, [B] migrations seules), écrite par
 * `scripts/db/capture-catalogue-servi.mjs`. Aucun `corpus-v3.json` n'est lu ici,
 * et c'est le sujet : un test qui se donnerait un catalogue depuis le dépôt
 * mesurerait exactement le défaut que la phase 0b corrige.
 *
 * P8 SUR LE CHEMIN BASE, et ce que « faux végétarien » veut dire ici. Le
 * critère d'acceptation de 0b.4 est « le test P8 rejoué sur le chemin base rend
 * 0 faux végétarien ». `tests/planning/rapportQualiteSemaine.test.js` mesure P8
 * sur trois semaines générées à partir du corpus du dépôt : il compte les repas
 * servis comme substitution végétarienne dont un ingrédient REQUIS porte une
 * origine non compatible, plus les recettes à origine non tranchée. Ce protocole
 * ne se transporte pas tel quel sur une capture : elle ne porte ni `per100g`, ni
 * `category`, ni `cuisineOrigin`, ni les étapes — le solveur n'aurait pas de
 * quoi composer une semaine, et lui en fabriquer une serait inventer les données
 * que ce fichier prétend lire en base. Ce qui est donc mesuré est la moitié qui
 * se transporte, et c'est la moitié qui décide : sur TOUT ce que la base sert,
 * aucune recette que le planificateur classerait végétarienne ne porte
 * d'ingrédient requis d'origine non compatible, et aucune origine n'est
 * « inconnu ». Une substitution végétarienne ne peut être choisie que parmi ces
 * plats-là (`classifyRecipe(...).vegetarian`) : zéro faute sur le vivier entier
 * est une borne plus large que zéro faute sur les onze substitutions d'une
 * semaine, pas plus étroite.
 *
 * ET LA MOITIÉ QUI COMPTE AUTANT : ZÉRO N'EST PAS UNE RÉUSSITE EN SOI. Un
 * catalogue où plus rien n'est végétarien rendrait lui aussi « 0 faux
 * végétarien ». C'est même exactement ce que le retrait aurait produit avant le
 * contrat opérationnel — mesuré : sur la même capture, origines et profils
 * retirés de la charge utile, on obtient 5 297 ingrédients « inconnu » sur 346
 * formes distinctes, 509 recettes sans profil, et ZÉRO plat végétarien sur 509.
 * Le nombre de plats végétariens servis est donc asserté non nul, et comparé à
 * ce que les origines BRUTES de la charge utile donnent : la matérialisation ne
 * doit rien ajouter ni retirer.
 *
 * CE QU'IL NE COUVRE PAS. Une capture est une photo : c'est la porte 0b.3 qui
 * tient la garde de péremption (empreinte des trois migrations du contrat) et
 * qui rejoue les mêmes critères SUR BASE VIVE dans le job `db-tests`, sur les
 * deux bases qu'il construit. Comme les deux raccords n'existent plus dans le
 * module, cette exécution-là porte désormais, sans rien changer d'autre, sur le
 * code d'après le retrait.
 */

const RACINE = process.cwd()
const SOURCE_OPERATIONAL_CATALOG = readFileSync(
  join(RACINE, 'lib', 'domain', 'recipes', 'operationalCatalog.js'),
  'utf8',
)

const lireCapture = (scenario) => JSON.parse(readFileSync(
  join(RACINE, 'tests', 'planning', 'fixtures', `catalogue-servi-base-${scenario}.json`),
  'utf8',
))

const CAPTURES = { A: lireCapture('A'), B: lireCapture('B') }

/** Ce que le planificateur consomme : la charge utile passée par le matérialiseur. */
const materialiser = (capture) => materializeOperationalCatalog({ recipes: capture.recipes }).recipes

const MOTEUR = { A: materialiser(CAPTURES.A), B: materialiser(CAPTURES.B) }

const requis = (ingredients) => (ingredients || []).filter((ingredient) => !ingredient?.optional)

describe('0b.4 — les deux raccords JSON ont quitté le chemin opérationnel', () => {
  it('n’importe plus ni le corpus ni le catalogue de formes', () => {
    // Le critère du plan est littéral : « le fichier n'importe plus
    // corpus-v3.json ni recipe-food-catalog.json ». On le lit donc dans le
    // texte du module, sur les lignes d'`import` et elles seules — le fichier
    // NOMME ces deux chemins dans son commentaire d'en-tête, pour dire ce qui a
    // été retiré et pourquoi, et une recherche sur le fichier entier
    // interdirait de l'écrire.
    const imports = SOURCE_OPERATIONAL_CATALOG
      .split('\n')
      .filter((ligne) => /^\s*import\s/.test(ligne))
    expect(imports.length).toBeGreaterThan(0)
    expect(imports.filter((ligne) => ligne.includes('corpus-v3.json'))).toEqual([])
    expect(imports.filter((ligne) => ligne.includes('recipe-food-catalog.json'))).toEqual([])
  })

  it('ne garde aucun repli sur un fichier embarqué : une charge utile muette reste muette', () => {
    // La preuve par l'usage, et elle ne dépend d'aucun `vi.mock` : ces deux
    // valeurs-là EXISTENT dans les fichiers naguère raccordés — « lentille verte
    // seche crue » y porte `origin: vegetal`, et FR-001 y porte un
    // `conservation_profile` (vérifié dans les deux fichiers). Avec les raccords,
    // cette entrée ressortait « vegetal » et avec un profil. Sans eux, une base
    // qui ne déclare rien doit rendre « inconnu » et `null` — c'est-à-dire dire
    // qu'elle ne sait pas, au lieu de servir une valeur plausible.
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

describe.each(['A', 'B'])('0b.4 — P8 sur le chemin base, scénario %s', (scenario) => {
  const capture = CAPTURES[scenario]
  const servies = MOTEUR[scenario]
  const ingredients = servies.flatMap((recette) => recette.exactIngredients)

  it('sert un catalogue entier et non tronqué', () => {
    // Sans cette garde, tout ce qui suit pourrait porter sur un échantillon
    // sans le dire, et « 0 faute » ne voudrait plus rien dire.
    expect(capture.provenance.arretDeLecture).toBe('catalogue_epuise')
    expect(servies.length).toBe(capture.provenance.comptes.eligibleCountDeclareParLaRpc)
    expect(ingredients.length).toBe(capture.provenance.comptes.ingredientsServis)
  })

  it('P8 — 0 faux végétarien : aucune origine servie ne contredit celle que le dépôt déclare', () => {
    // POURQUOI CE TEST NE COMPARE PAS LE MOTEUR À LUI-MÊME. On aurait pu
    // chercher un plat que `classifyRecipe` dit végétarien et qui porterait un
    // ingrédient requis carné. Ce test-là ne peut PAS rougir, et il faut le
    // dire plutôt que de l'écrire : `classifyRecipe` pose exactement
    // `vegetarian = origins.every(isVegetarianCompatibleOrigin)` sur ces mêmes
    // ingrédients requis (`closedLoopPlanner.js`), si bien que la faute
    // cherchée est éliminée par la définition. Un test toujours vert ressemble
    // à un test qui passe.
    //
    // La faute possible est ailleurs, et c'est celle que les raccords
    // masquaient : la base peut publier pour une forme une origine qui n'est
    // pas celle que le dépôt a arbitrée. Le moteur classerait alors
    // « végétarien » un plat qui ne l'est pas, sans qu'aucun de ses drapeaux ne
    // se contredise. On confronte donc DEUX sources déclarées — l'origine servie
    // par la RPC et celle de `scripts/data/out/recipe-food-catalog.json`, écrite
    // par les arbitrages relus.
    //
    // Lire ce fichier ICI n'est pas se donner un catalogue depuis le dépôt : le
    // catalogue mesuré reste celui de la base, le dépôt ne sert que de témoin.
    // C'est la différence avec le défaut que la phase 0b corrige.
    const catalogueDuDepot = JSON.parse(readFileSync(
      join(RACINE, 'scripts', 'data', 'out', 'recipe-food-catalog.json'),
      'utf8',
    ))
    const origineDeclaree = new Map(catalogueDuDepot.forms.map((forme) => [
      forme.canonical_name_normalized, forme.origin,
    ]))

    // Une origine par forme servie : la RPC doit publier la même valeur partout.
    const origineServie = new Map()
    const incoherencesInternes = []
    for (const ingredient of ingredients) {
      const vue = origineServie.get(ingredient.formNormalized)
      if (vue === undefined) origineServie.set(ingredient.formNormalized, ingredient.origin)
      else if (vue !== ingredient.origin) {
        incoherencesInternes.push(`${ingredient.formNormalized} : ${vue} puis ${ingredient.origin}`)
      }
    }
    expect([...new Set(incoherencesInternes)]).toEqual([])

    // Une forme servie que le dépôt ne déclare pas ne PEUT PAS être contrôlée.
    // C'est un refus, pas une dispense : la base tient ses formes du catalogue
    // du dépôt (`scripts/data/foods/build-recipe-food-sql.mjs`), donc une forme
    // servie qu'il ignore est une dérive, et la taire reviendrait à faire de la
    // base sa propre référence.
    const nonControlables = [...origineServie.keys()].filter((forme) => !origineDeclaree.has(forme))
    expect(nonControlables, 'formes servies que le catalogue du dépôt ne déclare pas').toEqual([])

    const contradictions = [...origineServie.entries()]
      .filter(([forme, servie]) => origineDeclaree.get(forme) !== servie)
      .map(([forme, servie]) => `${forme} : la base sert « ${servie} », le dépôt déclare « ${origineDeclaree.get(forme)} »`)
    expect(contradictions).toEqual([])

    // Et le sous-ensemble qui EST le faux végétarien, nommé à part parce qu'il
    // ne se répare pas comme les autres : une forme que le dépôt tient pour non
    // compatible et que la base sert comme compatible fait entrer de la viande
    // dans une assiette qui l'a refusée.
    const fauxVegetariens = servies.flatMap((recette) => requis(recette.exactIngredients)
      .filter((ingredient) => isVegetarianCompatibleOrigin(ingredient.origin)
        && origineDeclaree.has(ingredient.formNormalized)
        && !isVegetarianCompatibleOrigin(origineDeclaree.get(ingredient.formNormalized)))
      .map((ingredient) => `${recette.code} : ${ingredient.formNormalized} servie « ${ingredient.origin} », déclarée « ${origineDeclaree.get(ingredient.formNormalized)} »`))
    expect(fauxVegetariens, 'un plat carné servi à qui demandait moins de viande').toEqual([])
  })

  it('P8 — 0 origine non tranchée parmi les formes servies', () => {
    // La seconde moitié de P8, et la voie par laquelle la viande passait avant
    // C1.1 : 'inconnu' n'est pas compatible végétarien, mais il n'est pas non
    // plus carné — une forme non tranchée fait disparaître le plat des deux
    // côtés au lieu de le signaler.
    const horsVocabulaire = [...new Set(ingredients
      .filter((ingredient) => !ORIGINS.includes(ingredient.origin))
      .map((ingredient) => ingredient.formNormalized))]
    expect(horsVocabulaire).toEqual([])
    const inconnues = [...new Set(ingredients
      .filter((ingredient) => ingredient.origin === 'inconnu')
      .map((ingredient) => ingredient.formNormalized))]
    expect(inconnues).toEqual([])
    const avecOrigineInconnue = servies
      .filter((recette) => classifyRecipe(recette).unknownOrigins.length > 0)
      .map((recette) => recette.code)
    expect(avecOrigineInconnue).toEqual([])
  })

  it('le végétarien n’a pas été cassé par le retrait : le compte vient des origines de la base', () => {
    // Le garde-fou contre un zéro obtenu par le vide. Le compte lu par le
    // planificateur (`classifyRecipe`, sur l'objet matérialisé) doit égaler
    // celui que donnent les origines BRUTES de la charge utile : si la
    // matérialisation complétait encore quoi que ce soit — ou si elle perdait
    // une origine —, les deux nombres s'écarteraient.
    const parLeMoteur = servies.filter((recette) => classifyRecipe(recette).vegetarian).map((r) => r.code)
    const parLaChargeUtile = capture.recipes
      .filter((recette) => requis(recette.exactIngredients)
        .every((ingredient) => isVegetarianCompatibleOrigin(ingredient.origin)))
      .map((recette) => recette.code)
    expect(parLeMoteur).toEqual(parLaChargeUtile)
    // Et il faut qu'il en reste. Mesuré au retrait : 227 plats végétariens sur
    // les 509 servis, en [A] comme en [B] — les mêmes chiffres AVEC les
    // raccords et SANS eux. La borne est volontairement basse et non le chiffre
    // du jour : un lot de recettes carnées de la phase 5 ferait baisser la part
    // végétarienne sans rien casser, alors que passer sous quelques dizaines
    // voudrait dire que les origines ont disparu.
    expect(parLeMoteur.length).toBeGreaterThan(50)
  })

  it('chaque recette servie garde un profil de conservation, et il vient de la base', () => {
    // Le second raccord protégeait celui-ci. Sans profil, le planificateur ne
    // produit aucune portion d'avance — une perte silencieuse, puisque rien
    // n'échoue : la semaine se génère, elle ne mutualise simplement plus rien.
    const sansProfil = servies.filter((recette) => recette.conservationProfile === null)
    expect(sansProfil.map((recette) => recette.code)).toEqual([])
    const parCode = new Map(capture.recipes.map((recette) => [recette.code, recette.conservationProfile]))
    const sansDeclarationEnBase = servies
      .filter((recette) => !parCode.get(recette.code))
      .map((recette) => recette.code)
    expect(sansDeclarationEnBase, 'un profil servi que la base ne déclare pas viendrait d’un repli').toEqual([])
  })
})
