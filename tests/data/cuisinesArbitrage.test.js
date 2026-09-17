import { describe, expect, it } from 'vitest'
import corpusV3 from '@/data/recipes/corpus-v3.json'
import arbitrage from '@/data/recipes/arbitrations/cuisines.json'
import {
  CUISINE_NON_RENSEIGNEE,
  cleCuisine,
  cuisineArbitree,
  decisionsCuisine,
  libellesNonArbitres,
  repartitionCuisines,
  replierCuisine,
} from '@/lib/domain/recipes/cuisineArbitrage'

/**
 * L'ARBITRAGE DES CUISINES, ÉPROUVÉ CONTRE LE CORPUS — livrable 3.1.
 *
 * CE QUE CE FICHIER TIENT. `data/recipes/arbitrations/cuisines.json` décide, un
 * libellé à la fois, quelle cuisine compte pour chaque valeur de
 * `cuisine_origin`. Sans lui, P13 — « au moins 8 cuisines distinctes, aucune
 * au-dessus de 40 % » — n'est pas vérifiable mécaniquement : « France »,
 * « France / cuisine domestique internationale » et « France (Bourgogne) »
 * comptent pour trois cuisines. Un fichier d'arbitrage a un défaut que le code
 * n'a pas : il vieillit en silence. Une recette entre au corpus avec un libellé
 * neuf, personne ne le voit, et la part de la France devient fausse sans qu'un
 * seul test rougisse. C'est la règle R5 du fichier, et c'est ce test qui
 * l'applique.
 *
 * CE QU'IL VÉRIFIE, ET DANS CET ORDRE :
 *   1. la COUVERTURE — chaque libellé du corpus porte une décision relue, et
 *      chaque décision sert à un libellé du corpus ;
 *   2. les RÈGLES nommées — R2, R3 et R4 sur des cas cités par le fichier,
 *      parce qu'une règle qu'on énonce sans l'éprouver n'est qu'une intention ;
 *   3. les CHIFFRES de l'en-tête — recomptés ici, à chaque exécution. Deux
 *      d'entre eux étaient faux à la première rédaction (« 101 libellés bruts »
 *      quand il y en a 103, « treize autres libellés commencent par France »
 *      quand il y en a dix-huit) et rien ne les contredisait. Ils sont
 *      désormais tenus par des assertions : un chiffre d'en-tête qui se démode
 *      fait échouer la CI au lieu de se transmettre.
 *
 * Tout ici est PUR et instantané : deux JSON versionnés et un module sans état.
 * Aucune semaine n'est planifiée — les effets de l'arbitrage sur la semaine
 * servie sont mesurés par `tests/planning/plafondsSemaine.test.js` et rapportés
 * par `tests/planning/rapportQualiteSemaine.test.js`.
 */

const RECETTES = corpusV3.recipes
const LIBELLES_BRUTS = RECETTES.map((recette) => recette.cuisine_origin)

/**
 * Le repli du PLANIFICATEUR, recopié de `closedLoopPlanner.js` (`fold`).
 *
 * Il est ici pour être COMPARÉ à `replierCuisine`, pas pour être employé.
 * `cuisineArbitrage.js` recopie ce repli — il ne peut pas l'importer sans créer
 * un cycle — et les deux ont une différence réelle : celui-ci remplace en plus
 * la ligature « œ » par « oe ». Sur les libellés de cuisine du corpus l'écart
 * est nul, et c'est une MESURE, pas une hypothèse : le test ci-dessous la
 * refait libellé par libellé.
 */
const foldDuPlanificateur = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const comptesBruts = (() => {
  const comptes = new Map()
  for (const libelle of LIBELLES_BRUTS) comptes.set(libelle, (comptes.get(libelle) || 0) + 1)
  return comptes
})()

describe('couverture — règle R5, aucun libellé du corpus n’échappe à l’arbitrage', () => {
  it('chaque recette du corpus porte un libellé arbitré', () => {
    // LE TEST QUE LE FICHIER PROMET DANS SA RÈGLE R5. Il échoue en nommant les
    // libellés manquants, pas en rendant un compte : celui qui le répare doit
    // savoir quoi arbitrer sans relancer une mesure.
    expect(libellesNonArbitres(LIBELLES_BRUTS)).toEqual([])
    for (const recette of RECETTES) {
      expect(cuisineArbitree(recette.cuisine_origin).arbitre, `${recette.code} — ${recette.cuisine_origin}`)
        .toBe(true)
    }
  })

  it('decisionsCuisine() couvre le corpus entier, et rien de plus', () => {
    // LES DEUX SENS, parce qu'ils disent deux choses différentes. Un libellé du
    // corpus sans décision est une cuisine non relue qui ressort telle quelle.
    // Une décision sans libellé au corpus est une décision morte : elle n'a
    // aucun effet, et elle donne à relire un fichier plus gros qu'il n'est.
    const clesDuCorpus = new Set(LIBELLES_BRUTS.map(replierCuisine))
    const clesArbitrees = new Set(decisionsCuisine().map((decision) => replierCuisine(decision.libelle)))
    const absentesDeLArbitrage = [...clesDuCorpus].filter((cle) => !clesArbitrees.has(cle)).sort()
    const decisionsSansEmploi = [...clesArbitrees].filter((cle) => !clesDuCorpus.has(cle)).sort()
    expect(absentesDeLArbitrage).toEqual([])
    expect(decisionsSansEmploi).toEqual([])
  })

  it('aucune clé repliée n’est décidée deux fois', () => {
    // Deux décisions sur la même clé : la seconde écrase la première en silence
    // (`new Map` garde la dernière), et le relecteur lit une règle que le code
    // n'applique pas.
    const cles = decisionsCuisine().map((decision) => replierCuisine(decision.libelle))
    expect(cles).toHaveLength(new Set(cles).size)
  })

  it('chaque décision est complète, et ses écritures brutes existent au corpus', () => {
    const regles = new Set(['R0', 'R1', 'R2', 'R3', 'R4'])
    for (const decision of decisionsCuisine()) {
      expect(decision.libelle, 'libellé').toBeTruthy()
      expect(decision.cuisine, `${decision.libelle} — cuisine`).toBeTruthy()
      expect(regles.has(decision.regle), `${decision.libelle} — règle ${decision.regle}`).toBe(true)
      expect(String(decision.motif || '').length, `${decision.libelle} — motif`).toBeGreaterThan(20)
      expect(Array.isArray(decision.brut) && decision.brut.length, `${decision.libelle} — brut`).toBeTruthy()
      for (const brut of decision.brut) {
        // Une écriture brute inventée ferait croire à une relecture qui n'a pas
        // eu lieu ; une écriture brute mal repliée rattacherait la décision à
        // une autre clé que celle qu'elle déclare.
        expect(comptesBruts.has(brut), `${decision.libelle} — écriture « ${brut} » absente du corpus`).toBe(true)
        expect(replierCuisine(brut), `${decision.libelle} — « ${brut} » ne replie pas sur sa clé`)
          .toBe(replierCuisine(decision.libelle))
      }
      // Le compte de recettes est INDICATIF — le fichier le dit —, mais il date
      // la relecture. S'il ment, la relecture ne vaut rien.
      const somme = decision.brut.reduce((total, brut) => total + (comptesBruts.get(brut) || 0), 0)
      expect(somme, `${decision.libelle} — recettes déclarées`).toBe(decision.recettes)
    }
  })

  it('la cuisine retenue est elle-même un point fixe de l’arbitrage', () => {
    // « France (Bourgogne) » donne « France », et « France » doit donner
    // « France ». Sans cette propriété, appliquer l'arbitrage deux fois ne
    // rendrait pas le même résultat qu'une fois, et deux appelants qui ne le
    // font pas au même moment compteraient deux choses différentes.
    for (const decision of decisionsCuisine()) {
      expect(cleCuisine(decision.cuisine), `${decision.libelle} → ${decision.cuisine}`)
        .toBe(replierCuisine(decision.cuisine))
      expect(cuisineArbitree(decision.cuisine).cuisine, `${decision.cuisine} n’est pas stable`)
        .toBe(decision.cuisine)
    }
  })

  it('les deux replis — celui de l’arbitrage et celui du planificateur — coïncident sur le corpus', () => {
    // Ils ne sont PAS la même fonction (`fold` traite en plus la ligature
    // « œ »). Ce test mesure l'écart au lieu de le supposer : nul aujourd'hui,
    // il deviendrait visible le jour où un libellé en porterait une.
    for (const libelle of new Set(LIBELLES_BRUTS)) {
      expect(replierCuisine(libelle), libelle).toBe(foldDuPlanificateur(libelle))
    }
  })
})

describe('les règles nommées, sur les cas que le fichier cite', () => {
  const cuisineDe = (brut) => cuisineArbitree(brut).cuisine
  const regleDe = (brut) => cuisineArbitree(brut).regle

  it('R1 — le qualificatif de registre tombe, dans les deux sens', () => {
    // La règle joue même quand elle GROSSIT la part de la France : c'est ce que
    // le fichier écrit, et c'est ce qui la rend honnête.
    expect(cuisineDe('France / cuisine domestique internationale')).toBe('France')
    expect(cuisineDe("France / cuisine domestique d'inspiration italienne")).toBe('France')
    expect(regleDe('France / cuisine domestique internationale')).toBe('R1')
  })

  it('R2 — une région se ramène à son État, sauf l’exception déclarée', () => {
    expect(cuisineDe('France (Bourgogne)')).toBe('France')
    expect(cuisineDe('France — Bourgogne')).toBe('France')
    expect(cuisineDe('Chine Sichuan')).toBe('Chine')
    expect(cuisineDe('Italie (Campanie)')).toBe('Italie')
    expect(cuisineDe('Louisiane')).toBe('États-Unis')
    expect(cuisineDe('Inde du Sud')).toBe('Inde')
    expect(cuisineDe('Thaïlande du Nord')).toBe('Thaïlande')
    // L'exception, et elle est écrite dans sa décision : deux États
    // revendiquent le Cachemire, le corpus ne l'attribue à aucun, l'arbitrage
    // ne tranche donc pas à leur place.
    expect(cuisineDe('Cachemire')).toBe('Cachemire')
    expect(regleDe('Cachemire')).toBe('R2')
  })

  it('R3 — deux États nommés : le premier, et c’est une convention de comptage', () => {
    // L'asymétrie est la preuve que la règle est mécanique et non un jugement
    // sur l'origine du plat : les deux mêmes États donnent deux cuisines
    // différentes selon l'ordre où le corpus les a écrits.
    expect(cuisineDe('Inde/Pakistan')).toBe('Inde')
    expect(cuisineDe('Pakistan/Inde')).toBe('Pakistan')
    expect(cuisineDe('Mali/Sénégal')).toBe('Mali')
    expect(cuisineDe('Laos/Thaïlande')).toBe('Laos')
    expect(cuisineDe('États-Unis / Mexique')).toBe('États-Unis')
    expect(cuisineDe('Belgique et Flandre française')).toBe('Belgique')
    expect(regleDe('Nigeria/Ghana')).toBe('R3')
  })

  it('R4 — les quatre noms d’État à espace ou à trait d’union restent entiers', () => {
    // LE TEST QUI JUSTIFIE L'EXISTENCE DU FICHIER. Une règle de préfixe en
    // ferait « Côte », « Afrique », « Royaume » et « Porto » ; une règle de
    // séparateur y verrait deux aires. Aucun des quatre ne doit être coupé, et
    // chacun reste sa propre cuisine.
    for (const nom of ['Côte d’Ivoire', 'Royaume-Uni', 'Afrique du Sud', 'Porto Rico']) {
      const decision = cuisineArbitree(nom)
      expect(decision.arbitre, nom).toBe(true)
      expect(decision.regle, nom).toBe('R4')
      expect(replierCuisine(decision.cuisine), nom).toBe(replierCuisine(nom))
      // Le mot coupé que produirait une règle de préfixe : il ne doit être la
      // cuisine de personne.
      expect(decision.cuisine, nom).not.toBe(nom.split(/[ -]/)[0])
    }
    expect(cuisineDe("Côte d'Ivoire")).toBe("Côte d'Ivoire")
    // « Inde/Royaume-Uni » croise R3 et R4 : c'est R3 qui tranche, et le second
    // État garde son nom entier là où il apparaît seul.
    expect(cuisineDe('Inde/Royaume-Uni')).toBe('Inde')
  })

  it('un libellé absent n’est pas normalisé, et une cuisine absente n’est pas inventée', () => {
    // R5 vue de l'autre côté : le module ne rattache jamais « au plus proche ».
    const inconnu = cuisineArbitree('Atlantide (cuisine domestique)')
    expect(inconnu).toMatchObject({ cuisine: 'Atlantide (cuisine domestique)', arbitre: false, regle: null })
    expect(inconnu.cle).toBe('atlantide cuisine domestique')
    expect(libellesNonArbitres(['France', 'Atlantide (cuisine domestique)'])).toEqual(['Atlantide (cuisine domestique)'])
    // Une recette sans cuisine déclarée compte pour « non renseignee », qui se
    // voit dans le rapport, plutôt que de disparaître du décompte.
    expect(cleCuisine(null)).toBe(CUISINE_NON_RENSEIGNEE)
    expect(cleCuisine('')).toBe(CUISINE_NON_RENSEIGNEE)
  })
})

describe('les chiffres de l’en-tête, recomptés à chaque exécution', () => {
  // MESURÉS ICI, JAMAIS RECOPIÉS. L'en-tête du fichier d'arbitrage annonce six
  // nombres ; ce sont eux qui décident si les plafonds du livrable 3.1 s'arment
  // (la France sous 50 % du vivier) et ce sont eux qu'un relecteur lira en
  // premier. Chacun est recalculé ci-dessous depuis le corpus.
  const repartition = repartitionCuisines(LIBELLES_BRUTS)

  it('754 recettes, 103 libellés bruts, 101 après repli', () => {
    expect(RECETTES).toHaveLength(754)
    expect(comptesBruts.size).toBe(103)
    expect(new Set(LIBELLES_BRUTS.map(replierCuisine)).size).toBe(101)
    expect(decisionsCuisine()).toHaveLength(101)
    // Les deux écritures doubles que le fichier nomme, et la raison de l'écart
    // entre 103 et 101.
    const doubles = decisionsCuisine().filter((decision) => decision.brut.length > 1)
      .map((decision) => decision.libelle).sort()
    expect(doubles).toEqual(['france bourgogne', 'france cuisine domestique'])
  })

  it('« France » porte 320 recettes, et dix-huit AUTRES libellés bruts commencent par France', () => {
    expect(comptesBruts.get('France')).toBe(320)
    const prefixeFrance = [...comptesBruts.keys()].filter((libelle) => /^France/.test(libelle))
    expect(prefixeFrance).toHaveLength(19)
    expect(new Set(prefixeFrance.map(replierCuisine)).size).toBe(17)
    // LA MÊME MESURE PAR L'AUTRE DÉFINITION — celle que cite le commentaire de
    // `DEFAULT_WEEKLY_CAPS` dans `weeklyBalance.js` : non pas « le libellé
    // commence par France », mais « l'arbitrage en fait la France ». Les deux
    // coïncident aujourd'hui ; les compter séparément est ce qui permettra de
    // le savoir le jour où ce ne sera plus vrai — une « Bourgogne » écrite sans
    // son pays entrerait dans la seconde et pas dans la première.
    const arbitreesFrance = [...comptesBruts.keys()].filter((libelle) => cuisineArbitree(libelle).cuisine === 'France')
    expect(arbitreesFrance).toHaveLength(19)
    expect(new Set(arbitreesFrance.map(replierCuisine)).size).toBe(17)
  })

  it('53 cuisines après arbitrage, la France à 434 sur 754 soit 57,6 %', () => {
    expect(repartition.total).toBe(754)
    expect(repartition.parCuisine.size).toBe(53)
    expect(new Set(decisionsCuisine().map((decision) => replierCuisine(decision.cuisine))).size).toBe(53)
    expect(repartition.dominante).toBe('france')
    expect(repartition.parCuisine.get('france')).toBe(434)
    expect(repartition.partDominante).toBeCloseTo(434 / 754, 6)
    expect((repartition.partDominante * 100).toFixed(1)).toBe('57.6')
    expect(repartition.nonArbitres).toEqual([])
  })

  it('l’en-tête du fichier cite ces mêmes nombres, et pas d’autres', () => {
    // LE CONTRÔLE QUI MANQUAIT. Les chiffres de la prose sont relus contre les
    // chiffres mesurés ci-dessus : une phrase d'en-tête qui se démode fait
    // rougir la CI, au lieu d'être recopiée de bonne foi par le livrable
    // suivant.
    const entete = String(arbitrage.contexte)
    for (const attendu of ['103 libellés bruts', '754 recettes', '320 recettes', '53 cuisines', '434 sur 754', '57,6 %']) {
      expect(entete, attendu).toContain(attendu)
    }
    // L'AFFIRMATION fausse de la première rédaction ne doit pas revenir — mais
    // son ERRATUM, lui, doit rester lisible : « 101 libellés bruts » apparaît
    // encore dans l'en-tête, entre guillemets, comme la citation du chiffre
    // corrigé. Effacer la correction serait aussi commode qu'effacer la faute.
    expect(entete).not.toContain('corpus porte 101 libellés bruts')
    expect(entete).toContain('les deux étaient faux')
    expect(arbitrage.regles).toHaveLength(6)
  })

  it('la part de la France reste au-dessus de 50 % : les plafonds ne sont PAS armés', () => {
    // La conséquence directe, et la seule qui pilote du code : tant que ce
    // nombre est au-dessus de 0,5, les plafonds du livrable 3.1 restent des
    // avertissements et n'écartent aucun plat (§5, note de risque (a) du plan).
    // Le jour où il passe dessous, ce test échoue — et c'est exactement ce
    // qu'on veut : le jalon C6 doit se voir.
    expect(repartition.partDominante).toBeGreaterThan(0.5)
  })
})
