import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { classifyRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { buildFinalDemandModel } from '@/lib/domain/planning/finalDemands'
import {
  ABSENCE,
  COUVERTURE_MINIMALE_PCT,
  MACROS,
  REFUS_MACROS,
  arrondirMacro,
  blocNutritionPubliee,
  macrosParPortion,
  macrosParPortionDeLAssiette,
  phraseMacros,
  verdictMacros,
} from '@/lib/domain/recipes/macrosParPortion'
import {
  MOTIFS_RETRAIT_OPTION,
  decisionOptionCarnee,
  declareMoinsDeViande,
  ingredientsApresDecision,
  optionsCarnees,
  phraseOptionCarnee,
} from '@/lib/domain/recipes/optionCarnee'

/**
 * LE CONTRAT DES CHIFFRES, ÉPROUVÉ SUR LE CORPUS — livrable 3.6, critère P18.
 *
 * CE QUE P18 DEMANDE, EN DEUX CLAUSES :
 *   1. « une recette rend les MÊMES macros par portion sur les trois écrans qui
 *      l'affichent » ;
 *   2. « aucun chiffre non calculable n'est rendu sous forme de nombre — même
 *      verdict explicite que `couverture_masse_insuffisante` ».
 *
 * PLUS DEUX RÉSERVES MESURÉES, que le plan range dans le même livrable :
 *   (a) les DOUZE recettes publiables classées végétariennes qui portent un
 *       ingrédient carné FACULTATIF affichent cette option et l'excluent de la
 *       fiche et de la liste de courses dès qu'un mangeur du créneau a déclaré
 *       manger moins de viande ;
 *   (b) `npm run prices:check` contrôle le référentiel réellement employé —
 *       éprouvé par `tests/pricing/controleDesPrixServis.test.js`, pas ici.
 *
 * POURQUOI CE FICHIER EST PUR ET RAPIDE. Il ne planifie aucune semaine : les
 * trois chemins d'affichage se comparent sur la recette elle-même, et la
 * division par les portions se vérifie sur une assiette construite ici. La CI
 * accorde vingt secondes par test et une génération de semaine en coûte cinq à
 * neuf ; les payer pour une égalité arithmétique serait les payer pour rien.
 * La seule exception est le dernier `describe`, qui construit un modèle de
 * demandes minimal — deux recettes, un créneau — pour vérifier qu'une option
 * carnée n'entre jamais dans la liste de courses.
 */

const RACINE = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..')
const lire = (relatif) => readFileSync(join(RACINE, relatif), 'utf8')

const PUBLIABLES = getCanonicalRecipes({ servings: 2 })
const CORPUS_ENTIER = getCanonicalRecipes({ eligibleOnly: false })

/**
 * Le TROISIÈME chemin : l'assiette servie.
 *
 * La grille de la semaine et le mode cuisine n'affichent pas la recette, ils
 * affichent l'assiette — un total et un nombre de portions. La macro par
 * portion en est le quotient, et c'est le seul des trois chemins où une
 * division peut faire diverger les chiffres. On fabrique donc ici l'assiette
 * telle que `personalizedMeals` la publie : `nutritionPerServing × portions`.
 *
 * `|| 0` EST BANNI ICI AUSSI, y compris dans un gabarit de test. Une fixture qui
 * coerce une macro absente en zéro fabriquerait exactement le chiffre que ce
 * fichier interdit ailleurs, et le test qui s'appuie dessus passerait au vert sur
 * une donnée inventée. La multiplication rend donc `null` sur une macro absente,
 * et c'est le module qui décide quoi en faire.
 */
const foisPortions = (valeur, portions) => (typeof valeur === 'number' && Number.isFinite(valeur)
  ? valeur * portions
  : null)

const assietteDe = (recipe, portions) => {
  const nutrition = recipe.nutritionPerServing || {}
  return {
    planned_servings: portions,
    kcal: foisPortions(nutrition.kcal, portions),
    protein_g: foisPortions(nutrition.proteinG, portions),
    carbs_g: foisPortions(nutrition.carbsG, portions),
    fat_g: foisPortions(nutrition.fatG, portions),
    fiber_g: foisPortions(nutrition.fiberG, portions),
  }
}

describe('P18, première clause — les trois écrans rendent les mêmes macros par portion', () => {
  it('la fiche recette et la route de fiche de cuisine ne peuvent pas diverger', () => {
    // Écrans 1 et 2. Le second passe par `blocNutritionPubliee`, qui traduit en
    // snake_case ce que le premier lit en camelCase : si l'un des deux
    // recalculait au lieu de lire, un arrondi suffirait à les séparer.
    const divergents = []
    for (const recipe of PUBLIABLES) {
      const verdict = macrosParPortion(recipe)
      const publie = blocNutritionPubliee(recipe)
      if (!verdict.affichable) {
        if (publie.nutrition_per_serving !== null) divergents.push(`${recipe.code} : publié alors que refusé`)
        continue
      }
      const attendu = {
        kcal: verdict.macros.kcal,
        protein_g: verdict.macros.proteinG,
        carbs_g: verdict.macros.carbsG,
        fat_g: verdict.macros.fatG,
        fiber_g: verdict.macros.fiberG,
      }
      if (JSON.stringify(publie.nutrition_per_serving) !== JSON.stringify(attendu)) {
        divergents.push(`${recipe.code} : ${JSON.stringify(publie.nutrition_per_serving)} ≠ ${JSON.stringify(attendu)}`)
      }
    }
    expect(divergents).toEqual([])
  })

  it('l’assiette servie, ramenée à la portion, rend les mêmes nombres', () => {
    // Écran 3. Trois tailles de portion, dont une non entière : c'est la
    // division qui est éprouvée, pas la multiplication.
    const divergents = []
    for (const recipe of PUBLIABLES) {
      const verdict = macrosParPortion(recipe)
      if (!verdict.affichable) continue
      for (const portions of [1, 1.6, 4]) {
        const assiette = macrosParPortionDeLAssiette(assietteDe(recipe, portions))
        expect(assiette.affichable, `${recipe.code} × ${portions}`).toBe(true)
        for (const cle of MACROS) {
          // Tolérance d'un pas d'arrondi : les macros sont publiées à la
          // décimale, les kcal à l'unité, et multiplier puis diviser ne rend pas
          // toujours le même dernier chiffre. Au-delà de ce pas, ce ne serait
          // plus un arrondi mais deux calculs différents.
          const pas = cle === 'kcal' ? 1 : 0.1
          const ecart = Math.abs(assiette.macros[cle] - verdict.macros[cle])
          if (ecart > pas + 1e-9) divergents.push(`${recipe.code} × ${portions} ${cle} : ${assiette.macros[cle]} ≠ ${verdict.macros[cle]}`)
        }
      }
    }
    expect(divergents).toEqual([])
  })

  it('l’arrondi est fait une seule fois, et il est celui de CLAUDE.md', () => {
    // « 1 décimale pour les macros, 2 pour les micros » — et l'entier pour les
    // kilocalories, que `computeNutrition` rend déjà ainsi.
    expect(arrondirMacro('kcal', 412.4)).toBe(412)
    expect(arrondirMacro('kcal', 412.6)).toBe(413)
    expect(arrondirMacro('proteinG', 41.44)).toBe(41.4)
    expect(arrondirMacro('proteinG', 41.46)).toBe(41.5)
    // Une valeur non calculable n'est pas arrondie à zéro : elle reste absente.
    expect(arrondirMacro('kcal', null)).toBeNull()
    expect(arrondirMacro('kcal', undefined)).toBeNull()
    expect(arrondirMacro('kcal', 'beaucoup')).toBeNull()
  })
})

describe('P18, seconde clause — un chiffre non calculable n’est jamais rendu comme un nombre', () => {
  it('rend un code de refus, comme la couche prix rend couverture_masse_insuffisante', () => {
    expect(verdictMacros(null)).toMatchObject({ affichable: false, refus: REFUS_MACROS.NUTRITION_ABSENTE, macros: null })
    expect(verdictMacros({ kcal: 400, proteinG: 20, carbsG: 50, fatG: 10 }))
      .toMatchObject({ affichable: false, refus: REFUS_MACROS.MACRO_NON_CALCULABLE, manquants: ['fiberG'], macros: null })
    // Le zéro fabriqué, le cas nommé par le plan : `Number(undefined) || 0`.
    expect(verdictMacros({ kcal: undefined, proteinG: 20, carbsG: 50, fatG: 10, fiberG: 5 }).macros).toBeNull()
    // Une couverture partielle refuse, et le seuil est l'exhaustivité.
    expect(COUVERTURE_MINIMALE_PCT).toBe(100)
    expect(verdictMacros({ kcal: 400, proteinG: 20, carbsG: 50, fatG: 10, fiberG: 5 }, { pct: 90 }))
      .toMatchObject({ affichable: false, refus: REFUS_MACROS.COUVERTURE_NUTRITIONNELLE_INSUFFISANTE })
    // Une couverture NON déclarée n'est pas une couverture défavorable : une
    // assiette personnalisée n'en publie pas, et la refuser pour cela
    // reviendrait à traiter l'absence de mesure comme une mesure.
    expect(verdictMacros({ kcal: 400, proteinG: 20, carbsG: 50, fatG: 10, fiberG: 5 }, null).affichable).toBe(true)
  })

  it('refuse une portion inconnue plutôt que de présenter un total pour une portion', () => {
    // Diviser par un est le réflexe naturel ; ce serait afficher l'assiette
    // entière sous l'étiquette « par portion ».
    for (const portions of [0, null, undefined, -2, 'deux']) {
      expect(macrosParPortionDeLAssiette({ planned_servings: portions, kcal: 800, protein_g: 40, carbs_g: 90, fat_g: 20, fiber_g: 10 }))
        .toMatchObject({ affichable: false, refus: REFUS_MACROS.PORTIONS_INCONNUES, macros: null })
    }
  })

  it('chaque refus porte une phrase, et elle nomme les macros manquantes', () => {
    for (const refus of Object.values(REFUS_MACROS)) {
      expect(phraseMacros({ affichable: false, refus, manquants: [] }), refus).toBeTruthy()
    }
    // Les manquantes sont nommées EN CLAIR : « fiberG » est le vocabulaire du
    // module, pas celui de la personne qui lit l'écran.
    expect(phraseMacros({ affichable: false, refus: REFUS_MACROS.MACRO_NON_CALCULABLE, manquants: ['fiberG'] }))
      .toContain('fibres')
    // Rien à dire quand les nombres sont là : l'écran affiche les nombres.
    expect(phraseMacros({ affichable: true, manquants: [] })).toBeNull()
  })

  it('une colonne absente n’efface pas les quatre colonnes mesurées', () => {
    // LE CAS QUE LA PREMIÈRE RÉDACTION DE CE LIVRABLE PERDAIT. Le refus du
    // chemin RECETTE est global parce qu'il vient de la COUVERTURE : un
    // ingrédient sans table nutritionnelle rend les cinq valeurs douteuses. Une
    // ASSIETTE ne porte aucune couverture — chacune de ses cinq colonnes est
    // déclarée ou ne l'est pas, indépendamment des autres —, et refuser les cinq
    // parce que l'une manque effacerait quatre mesures. Ce serait le §0 du
    // contrat retourné contre lui-même.
    //
    // Le cas est réel : `lib/xlsxParser.js` écrit `fiber_g: null` à côté de
    // quatre macros chiffrées, sur le créneau du petit-déjeuner — exactement
    // celui dont `WeekGrid` ouvre le détail.
    const partielle = macrosParPortionDeLAssiette({
      planned_servings: 1, kcal: 420, protein_g: 18, carbs_g: 52, fat_g: 14, fiber_g: null,
    })
    expect(partielle.affichable).toBe(true)
    expect(partielle.macros.kcal).toBe(420)
    expect(partielle.macros.fiberG).toBeNull()
    expect(partielle.manquants).toEqual(['fiberG'])
    // Et l'absence se DIT, sans prétendre que rien n'est disponible.
    expect(phraseMacros(partielle)).toContain('fibres')
    expect(phraseMacros(partielle)).not.toContain('indisponibles')

    // Rien du tout n'est pas « une valeur manquante » : c'est une assiette sans
    // nutrition, et le bloc entier disparaît derrière son motif. C'est le
    // petit-déjeuner conservé sans détail (`variant_kind: 'fixed_breakfast'`).
    const vide = macrosParPortionDeLAssiette({ planned_servings: 1 })
    expect(vide).toMatchObject({ affichable: false, refus: REFUS_MACROS.MACRO_NON_CALCULABLE, macros: null })
    expect(vide.manquants).toEqual([...MACROS])

    // Le zéro fabriqué reste interdit : une macro absente ne devient jamais 0,
    // et une macro qui VAUT zéro reste zéro.
    expect(partielle.macros.fiberG).not.toBe(0)
    expect(macrosParPortionDeLAssiette({
      planned_servings: 2, kcal: 400, protein_g: 20, carbs_g: 50, fat_g: 10, fiber_g: 0,
    }).macros.fiberG).toBe(0)
  })

  it('les deux écrans d’assiette lisent la même fonction, avec la même échelle', () => {
    // LA GRILLE DE LA SEMAINE ET LE MODE CUISINE montrent l'ASSIETTE SERVIE —
    // `planned_servings: 1` dans les deux fichiers —, pas la portion de la
    // recette : `canonicalMeal` écrit `kcal = nutritionPerServing × multiplier`
    // PLUS la nutrition des accompagnements, qui n'appartiennent pas à la
    // recette. Rediviser par le multiplicateur ne rendrait donc PAS la portion,
    // et présenter le total sous l'étiquette « par portion » serait le mensonge
    // que ce contrat interdit. Les deux écrans se lisent donc à la source : ils
    // passent par le module, et avec la même échelle.
    for (const chemin of ['app/planning/components/WeekGrid.jsx', 'components/CookMode.jsx']) {
      const source = lire(chemin)
      expect(source, chemin).toContain('macrosParPortionDeLAssiette')
      expect(source, chemin).toContain('planned_servings: 1')
    }
  })

  it('aucun écran ne fabrique un zéro à la place d’une macro absente', () => {
    // LE CONTRÔLE DE SOURCE, et il est là parce que la faute est une habitude de
    // frappe, pas une décision : `Number(x) || 0` et `Math.round(x || 0)` sur
    // une macro rendent un zéro qui a la même tête qu'une mesure. Les trois
    // écrans et la route de fiche sont relus ligne à ligne.
    const ECRANS = [
      'app/api/recipes/canonical/[code]/route.js',
      'app/recipes/canonical/[code]/page.js',
      'components/CookMode.jsx',
      'app/planning/components/WeekGrid.jsx',
    ]
    const MACRO = '(kcal|protein_g|proteinG|carbs_g|carbsG|fat_g|fatG|fiber_g|fiberG)'
    const motifs = [
      new RegExp(`Number\\([^)]*${MACRO}[^)]*\\)\\s*\\|\\|\\s*0`),
      new RegExp(`\\b${MACRO}\\s*\\|\\|\\s*0`),
    ]
    // Les lignes de COMMENTAIRE sont écartées : ce fichier-ci comme les écrans
    // citent la faute pour dire qu'elle a été corrigée, et interdire de la citer
    // reviendrait à effacer la correction avec la faute.
    const estCommentaire = (ligne) => /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(ligne)
    const fautes = []
    for (const chemin of ECRANS) {
      for (const [index, ligne] of lire(chemin).split('\n').entries()) {
        if (estCommentaire(ligne)) continue
        for (const motif of motifs) {
          const trouve = ligne.match(motif)
          if (trouve) fautes.push(`${chemin}:${index + 1} : ${trouve[0]}`)
        }
      }
    }
    expect(fautes).toEqual([])
  })

  it('le tiret d’absence est le même partout, et il vient du domaine', () => {
    // Trois écrans qui choisissent chacun leur tiret finissent par en avoir
    // trois différents, et l'un d'eux finit par choisir « 0 ». Les TROIS écrans
    // et la route qui les sert sont relus : aucun n'a le droit de recomposer une
    // macro ni de rédiger sa propre absence.
    expect(ABSENCE).toBe('—')
    const LECTEURS = [
      'app/recipes/canonical/[code]/page.js',
      'components/CookMode.jsx',
      'app/planning/components/WeekGrid.jsx',
      'app/api/recipes/canonical/[code]/route.js',
    ]
    for (const chemin of LECTEURS) {
      const source = lire(chemin)
      expect(source, chemin).toContain('@/lib/domain/recipes/macrosParPortion')
      expect(source, chemin).toContain('macrosParPortion')
    }
    // Et aucun des trois ÉCRANS n'arrondit une macro lui-même : `arrondirMacro`
    // est appliqué une seule fois, dans le module. Deux arrondis écrits
    // séparément produisent tôt ou tard 41 g d'un côté et 41,4 g de l'autre.
    const MACRO = '(kcal|protein_g|proteinG|carbs_g|carbsG|fat_g|fatG|fiber_g|fiberG)'
    const arrondiLocal = new RegExp(`(Math\\.round|toFixed)\\([^)]*${MACRO}`)
    const estCommentaire = (ligne) => /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(ligne)
    const fautes = []
    for (const chemin of LECTEURS) {
      for (const [index, ligne] of lire(chemin).split('\n').entries()) {
        if (estCommentaire(ligne)) continue
        const trouve = ligne.match(arrondiLocal)
        if (trouve) fautes.push(`${chemin}:${index + 1} : ${trouve[0]}`)
      }
    }
    expect(fautes).toEqual([])
  })

  it('sur le corpus d’aujourd’hui, aucune recette n’active un refus — et il faut le dire', () => {
    // CE QUE CE LIVRABLE NE PEUT PAS PROUVER SUR LE CORPUS, et qui doit être
    // écrit plutôt que passé sous silence : les 754 recettes du corpus portent
    // toutes leurs cinq macros et une couverture de 100 %. Les quatre codes de
    // refus ne sont donc exercés que par les gabarits de ce fichier, jamais par
    // une recette réelle. Le garde-fou est posé AVANT la donnée qui le
    // déclenchera — c'est le bon ordre —, mais annoncer « les refus sont
    // éprouvés sur le corpus » serait faux.
    //
    // Ce test échouera le jour où une recette sans nutrition entrera au corpus.
    // Ce jour-là, le chiffre attendu se met à jour : ce n'est pas une
    // régression, c'est la mesure qui change.
    const compter = (liste) => liste.reduce((tableau, recipe) => {
      const verdict = macrosParPortion(recipe)
      const cle = verdict.affichable ? 'affichables' : verdict.refus
      return { ...tableau, [cle]: (tableau[cle] || 0) + 1 }
    }, {})
    expect(compter(PUBLIABLES)).toEqual({ affichables: 568 })
    expect(compter(CORPUS_ENTIER)).toEqual({ affichables: 754 })
  })

  it('le contrat est écrit, et il nomme les quatre familles de chiffres', () => {
    const contrat = lire('docs/CONTRAT_CHIFFRES.md')
    expect(contrat).toContain("Un chiffre qu'on n'a pas su calculer est ABSENT.")
    for (const famille of ['Macros par portion', 'Temps de cuisine', 'Quantités', 'Prix, coûts, budget']) {
      expect(contrat, famille).toContain(famille)
    }
    // La règle dont il dérive est citée, avec son fichier : un contrat qui
    // étend une règle sans la nommer laisse croire qu'il l'invente.
    expect(contrat).toContain('data/prices/CONTRAT.md:15')
    expect(contrat).toContain('couverture_masse_insuffisante')
  })
})

describe('réserve (a) — les douze recettes végétariennes à option carnée facultative', () => {
  const vegetariennesAvecOption = (liste) => liste.filter((recipe) => {
    const classification = classifyRecipe(recipe)
    return classification.vegetarian && classification.optionalNonVegetarian.length > 0
  })

  it('elles sont douze au corpus publiable, treize au corpus entier', () => {
    // LE CHIFFRE DU PLAN, RECOMPTÉ. Le §2.4 écrit « douze recettes » ; la
    // mesure du 17 septembre 2026 le confirme sur les 568 publiables, et
    // trouve une treizième au corpus entier — REAL-196, Yu xiang qie zi, non
    // publiable. Les deux nombres sont écrits : n'en donner qu'un laisserait
    // choisir le plus flatteur.
    expect(PUBLIABLES).toHaveLength(568)
    expect(CORPUS_ENTIER).toHaveLength(754)
    const publiables = vegetariennesAvecOption(PUBLIABLES)
    expect(publiables).toHaveLength(12)
    expect(vegetariennesAvecOption(CORPUS_ENTIER)).toHaveLength(13)
    // LE TROISIÈME NOMBRE, recompté parce qu'il était faux. L'en-tête de
    // `optionCarnee.js` annonçait « treize recettes NON végétariennes »
    // porteuses d'une option facultative carnée ; il y en a DIX-HUIT. Elles ne
    // passent jamais par ce module — un plat carné reste un plat carné —, mais
    // un chiffre écrit dans le dépôt est un chiffre que quelqu'un relira.
    const nonVegetariennesAvecOption = CORPUS_ENTIER.filter((recipe) => {
      const classification = classifyRecipe(recipe)
      return !classification.vegetarian && classification.optionalNonVegetarian.length > 0
    })
    expect(nonVegetariennesAvecOption).toHaveLength(18)
    // LE QUATRIÈME NOMBRE, celui dont un CHEMIN DE CODE dépend, et qui manquait.
    // `app/api/recipes/canonical/[code]/route.js` ne charge les membres du foyer
    // que si la recette porte une option carnée : ce sont ces 25 publiables-là
    // (12 végétariennes + 13 déjà carnées), et pas les 333 qui portent un
    // ingrédient facultatif quelconque — une herbe, un zeste. La garde a été
    // écrite sur `ingredient.optional` seul alors que son commentaire annonçait
    // douze recettes : l'écart valait 308 requêtes Supabase de trop. Les deux
    // nombres sont comptés ici pour qu'ils ne puissent plus diverger en silence.
    const avecOptionCarnee = PUBLIABLES.filter((recipe) => optionsCarnees(recipe).length > 0)
    expect(avecOptionCarnee).toHaveLength(25)
    const avecUnFacultatifQuelconque = PUBLIABLES
      .filter((recipe) => (recipe.exactIngredients || []).some((ingredient) => ingredient?.optional))
    expect(avecUnFacultatifQuelconque).toHaveLength(333)
    // Et la garde de la route est bien la première, pas la seconde.
    const routeCanonique = lire('app/api/recipes/canonical/[code]/route.js')
    expect(routeCanonique).toContain('const porteUneOption = optionsCarnees(recipe).length > 0')
    // Les trois exemples que le plan cite nommément se retrouvent.
    const options = publiables.flatMap((recipe) => classifyRecipe(recipe).optionalNonVegetarian)
    expect(options.some((nom) => /lardon/i.test(nom))).toBe(true)
    expect(options.some((nom) => /jambon/i.test(nom))).toBe(true)
    expect(options.some((nom) => /thon/i.test(nom))).toBe(true)
  })

  it('optionsCarnees dit exactement ce que optionalNonVegetarian disait', () => {
    // Les deux règles sont écrites séparément — `classifyRecipe` vit dans le
    // planificateur, `optionsCarnees` dans la couche recettes, qui ne peut pas
    // l'importer sans charger le solveur entier. Elles sont donc comparées
    // recette par recette sur les 754 : si elles divergeaient, ce test
    // échouerait d'un coup, au lieu de laisser un écran retirer un ingrédient
    // que le moteur compte encore.
    const divergents = []
    for (const recipe of CORPUS_ENTIER) {
      const parLeMoteur = [...classifyRecipe(recipe).optionalNonVegetarian].sort()
      const parLaFiche = optionsCarnees(recipe).map((ingredient) => ingredient.name).sort()
      if (JSON.stringify(parLeMoteur) !== JSON.stringify(parLaFiche)) {
        divergents.push(`${recipe.code} : ${JSON.stringify(parLaFiche)} ≠ ${JSON.stringify(parLeMoteur)}`)
      }
    }
    expect(divergents).toEqual([])
  })

  it('« a déclaré manger moins de viande » ne se devine pas : trois déclarations, pas une de plus', () => {
    const membre = (planning = {}, reste = {}) => ({ name: 'X', preferences: { planning, ...reste } })
    expect(declareMoinsDeViande(membre({ meat_meals_per_week: 2 })))
      .toEqual({ refuse: true, motif: MOTIFS_RETRAIT_OPTION.QUOTA_CARNE_DECLARE })
    expect(declareMoinsDeViande(membre({ vegetarian_meat_swaps_per_week: 3 })))
      .toEqual({ refuse: true, motif: MOTIFS_RETRAIT_OPTION.SWAPS_VEGETARIENS_DECLARES })
    expect(declareMoinsDeViande(membre({}, { diets: ['vegetarien'] })))
      .toEqual({ refuse: true, motif: MOTIFS_RETRAIT_OPTION.REGIME_DECLARE })
    // Un quota à quatorze n'est PAS une restriction : la personne mange de la
    // viande à chaque repas, et lui retirer des lardons serait décider à sa
    // place.
    expect(declareMoinsDeViande(membre({ meat_meals_per_week: 14 })).refuse).toBe(false)
    // Un profil vide n'est pas une déclaration. `Number('')` vaut 0, et lire
    // ainsi ferait de tout le monde un mangeur restreint — le piège du
    // livrable 1.1, et la même parade.
    expect(declareMoinsDeViande(membre({})).refuse).toBe(false)
    expect(declareMoinsDeViande(membre({ meat_meals_per_week: '' })).refuse).toBe(false)
    expect(declareMoinsDeViande(membre({ meat_meals_per_week: null })).refuse).toBe(false)
    expect(declareMoinsDeViande({}).refuse).toBe(false)
    // Un quota déclaré à zéro EST une déclaration : « je ne mange pas de viande ».
    expect(declareMoinsDeViande(membre({ meat_meals_per_week: 0 })).refuse).toBe(true)
  })

  it('un seul mangeur suffit à retirer l’option, et elle reste AFFICHÉE', () => {
    const recette = vegetariennesAvecOption(PUBLIABLES)[0]
    const sansDeclaration = [{ name: 'A', preferences: { planning: {} } }]
    const avecDeclaration = [
      { name: 'A', preferences: { planning: {} } },
      { name: 'B', preferences: { planning: { meat_meals_per_week: 2 } } },
    ]

    const servie = decisionOptionCarnee({ recipe: recette, mangeurs: sansDeclaration })
    expect(servie.options.length).toBeGreaterThan(0)
    expect(servie.retiree).toBe(false)
    expect(ingredientsApresDecision(recette, servie)).toHaveLength(recette.exactIngredients.length)
    expect(phraseOptionCarnee(servie)).toContain('servie')

    const retiree = decisionOptionCarnee({ recipe: recette, mangeurs: avecDeclaration })
    expect(retiree.retiree).toBe(true)
    expect(retiree.motif).toBe(MOTIFS_RETRAIT_OPTION.QUOTA_CARNE_DECLARE)
    expect(retiree.declarePar).toEqual([{ person_name: 'B', motif: MOTIFS_RETRAIT_OPTION.QUOTA_CARNE_DECLARE }])
    // RETIRÉE DE LA FICHE : l'ingrédient n'est plus dans la liste servie…
    const servis = ingredientsApresDecision(recette, retiree)
    expect(servis).toHaveLength(recette.exactIngredients.length - retiree.options.length)
    for (const option of retiree.options) {
      expect(servis.some((ingredient) => ingredient.formNormalized === option.formNormalized)).toBe(false)
    }
    // … mais elle est NOMMÉE, avec qui l'a déclaré et pourquoi. Un ingrédient
    // qui disparaît sans un mot est une quantité modifiée en silence.
    const phrase = phraseOptionCarnee(retiree)
    expect(phrase).toContain('RETIRÉE')
    expect(phrase).toContain('B')
    expect(phrase).toContain(retiree.options[0].name)
  })

  it('ne retire jamais un ingrédient requis, ni une option qui n’est pas carnée', () => {
    // La décision ne porte QUE sur les options non végétariennes. Un plat carné
    // reste un plat carné — c'est le rôle des jumeaux de lignée de servir autre
    // chose — et une herbe facultative reste facultative.
    const carne = PUBLIABLES.find((recipe) => !classifyRecipe(recipe).vegetarian
      && classifyRecipe(recipe).optionalNonVegetarian.length === 0
      && (recipe.exactIngredients || []).some((ingredient) => ingredient.optional))
    expect(carne, 'aucune recette carnée à option non carnée au corpus').toBeTruthy()
    const decision = decisionOptionCarnee({
      recipe: carne,
      mangeurs: [{ name: 'B', preferences: { planning: { meat_meals_per_week: 0 } } }],
    })
    expect(decision.options).toEqual([])
    expect(decision.retiree).toBe(false)
    expect(ingredientsApresDecision(carne, decision)).toHaveLength(carne.exactIngredients.length)
    expect(phraseOptionCarnee(decision)).toBeNull()
  })

  it('les douze recettes sont toutes servables sans leur option', () => {
    // Retirer l'option ne doit jamais vider une recette de sa substance : si
    // l'un de ces douze plats perdait son ingrédient principal, ce ne serait
    // plus une option, ce serait une autre recette.
    for (const recipe of vegetariennesAvecOption(PUBLIABLES)) {
      const decision = decisionOptionCarnee({
        recipe,
        mangeurs: [{ name: 'B', preferences: { planning: { meat_meals_per_week: 1 } } }],
      })
      const servis = ingredientsApresDecision(recipe, decision)
      expect(servis.length, recipe.code).toBeGreaterThanOrEqual(3)
      expect(servis.some((ingredient) => !ingredient.optional), recipe.code).toBe(true)
    }
  })
})

describe('réserve (a), second volet — l’option n’entre pas dans la liste de courses', () => {
  /**
   * LA LISTE DE COURSES N'ACHÈTE AUCUN INGRÉDIENT FACULTATIF, option carnée
   * comprise (`finalDemands.js`, « if (ingredient.optional) continue »). Ce
   * test le VÉRIFIE au lieu de le supposer : la règle tient en une ligne, et
   * une ligne se supprime.
   *
   * Le modèle est minimal — un créneau, une recette, deux ingrédients — parce
   * que c'est une règle de filtrage, pas une propriété de la semaine.
   */
  const LARDON = 'lardon fume cru'
  const recette = {
    code: 'TEST-OPTION',
    family: 'Salade de chèvre chaud (fixture)',
    servings: 2,
    prepMinutes: 15,
    identityLevel: 'named_traditional_dish',
    techniques: [],
    allergens: [],
    exactIngredients: [
      {
        name: 'Salade verte', formNormalized: 'salade verte', quantity: 200, grams: 200,
        unit: 'g', category: 'legumes', optional: false, origin: 'vegetal',
      },
      {
        name: 'Lardon fumé cru', formNormalized: LARDON, quantity: 80, grams: 80,
        unit: 'g', category: 'viandes', optional: true, origin: 'animal:viande',
      },
    ],
    exactSteps: [{ n: 1, instruction: 'Assembler.' }],
    nutritionPerServing: { kcal: 300, proteinG: 12, carbsG: 8, fatG: 24, fiberG: 3 },
  }

  it('aucune forme facultative ne devient une ligne de courses', () => {
    const slot = { key: '2026-09-21-dejeuner', date: '2026-09-21', mealType: 'dejeuner', recipeCode: 'TEST-OPTION' }
    const model = buildFinalDemandModel({
      plan: { slots: [slot] },
      recipes: [recette],
      personalized: {
        meals: [{
          slot_key: slot.key, household_member_id: 'a', person_name: 'A', meal_date: slot.date,
          meal_type: 'dejeuner', canonical_recipe_code: 'TEST-OPTION', planned_servings: 1,
          kcal: 300, protein_g: 12, carbs_g: 8, fat_g: 24, fiber_g: 3,
          micronutrients: {}, portion_details: {}, target_snapshot: {}, variant_kind: 'household_base',
        }],
      },
    })
    // La ligne de courses porte le NOM DE PRODUIT, pas la forme normalisée :
    // c'est ce que la liste affiche, et c'est donc ce qu'on relit.
    const produits = model.shoppingItems.map((item) => item.product_name)
    expect(produits).toContain('Salade verte')
    expect(produits).not.toContain('Lardon fumé cru')
    // Et elle n'est pas non plus dans les MANQUES de l'exécution — c'est eux qui
    // décident ce qu'on achète, et une ligne filtrée à l'affichage mais présente
    // dans les manques reviendrait par le chemin legacy.
    const manques = model.recipeExecutions.flatMap((execution) => execution.shortages || [])
    expect(manques.map((manque) => manque.form_normalized)).not.toContain(LARDON)
    // L'INSTANTANÉ DE LA RECETTE, LUI, GARDE L'OPTION, et c'est voulu : il décrit
    // la recette telle qu'elle est écrite, pas l'assiette servie. C'est la fiche
    // (`ingredientsApresDecision`) qui retire l'option, et la liste de courses
    // qui ne l'achète jamais. Confondre les deux effacerait du corpus servi un
    // ingrédient que le rédacteur a écrit.
    const instantane = model.recipeExecutions[0].exact_ingredients_snapshot
    expect(instantane.map((ingredient) => ingredient.formNormalized)).toContain(LARDON)
  })

  it('la règle est bien celle de finalDemands, et elle est écrite à un seul endroit', () => {
    // Si cette ligne disparaissait, le test ci-dessus resterait vert tant que la
    // fixture ne porte pas d'option — c'est-à-dire qu'il cesserait de dire
    // quelque chose sans rougir. On relit donc la règle elle-même.
    expect(lire('lib/domain/planning/finalDemands.js')).toContain('if (ingredient.optional) continue')
  })
})
