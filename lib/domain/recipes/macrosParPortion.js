/**
 * LES MACROS PAR PORTION, CALCULÉES UNE FOIS POUR TOUS LES ÉCRANS — livrable 3.6,
 * critère P18 de `docs/PLAN_FINIR_MYKO.md`.
 *
 * CE QUE P18 DEMANDE, EN DEUX CLAUSES :
 *   1. « une recette rend les MÊMES macros par portion sur les trois écrans qui
 *      l'affichent » ;
 *   2. « aucun chiffre non calculable n'est rendu sous forme de nombre — même
 *      verdict explicite que `couverture_masse_insuffisante` ».
 *
 * CE QUI SE PASSAIT AVANT, ET QUI EST LA RAISON D'ÊTRE DE CE MODULE. Trois
 * écrans lisaient la même nutrition et la rendaient de trois manières :
 *   — `app/api/recipes/canonical/[code]/route.js` écrivait
 *     `Number(nutrition.kcal) || 0`. Une valeur absente devenait **0 kcal**,
 *     c'est-à-dire un nombre, affiché avec le même aplomb qu'une mesure. C'est
 *     exactement ce que le contrat des prix interdit depuis le §0 de
 *     `data/prices/CONTRAT.md` ;
 *   — `components/CookMode.jsx` écrivait `Math.round(p.kcal || 0)` sur la
 *     colonne « par personne » — même faute — et `nps.kcal ?? '—'` sur la
 *     colonne « par portion » — la bonne règle, appliquée à un endroit sur
 *     deux ;
 *   — `app/recipes/canonical/[code]/page.js` masquait le bloc entier quand la
 *     couverture n'était pas de 100 %. Ce n'est pas un faux chiffre, mais ce
 *     n'est pas non plus un verdict : l'utilisateur ne peut pas distinguer
 *     « cette recette n'a pas de repères nutritionnels » de « cet écran a
 *     oublié de les afficher ».
 *
 * LA RÈGLE, RECOPIÉE DE `data/prices/CONTRAT.md:15` ET ÉTENDUE AUX MACROS :
 * un chiffre qu'on n'a pas su calculer est ABSENT. Il n'est ni arrondi à zéro,
 * ni complété par vraisemblance, ni tu. Il porte un CODE DE REFUS, et ce code
 * voyage jusqu'à l'écran — de la même façon que `verdictAffichage`
 * (`lib/domain/pricing/priceMath.js`) rend `couverture_masse_insuffisante`
 * plutôt qu'un booléen nu.
 *
 * MODULE PUR. Il ne lit ni base ni horloge, et il ne met rien en forme : il rend
 * des NOMBRES et un VERDICT. La mise en mots appartient aux écrans, comme pour
 * les prix ; la seule chose que ce module leur impose est de ne pas pouvoir
 * afficher un nombre là où il n'y en a pas.
 */

/** Les cinq macros que le foyer lit. L'ordre est celui de l'affichage. */
export const MACROS = Object.freeze(['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG'])

/**
 * Motifs de refus, du plus général au plus précis.
 *
 * Ils sont rendus tels quels, comme les refus du contrat des prix : « repères
 * indisponibles » sans motif ressemble à une panne, alors que c'est un choix.
 */
export const REFUS_MACROS = Object.freeze({
  NUTRITION_ABSENTE: 'nutrition_absente',
  MACRO_NON_CALCULABLE: 'macro_non_calculable',
  COUVERTURE_NUTRITIONNELLE_INSUFFISANTE: 'couverture_nutritionnelle_insuffisante',
  PORTIONS_INCONNUES: 'portions_inconnues',
})

/**
 * Ce qu'un écran écrit à la place d'un nombre absent.
 *
 * Exporté plutôt que recopié dans chaque composant : trois écrans qui
 * choisissent chacun leur tiret finissent par en avoir trois différents, et
 * l'un d'eux finit par choisir « 0 ».
 */
export const ABSENCE = '—'

/**
 * Couverture nutritionnelle en deçà de laquelle on refuse d'afficher.
 *
 * CENT POUR CENT, et c'est plus sévère que le seuil des prix (§8 du contrat des
 * prix : 60 % de la masse). La différence est assumée et elle tient à la nature
 * des deux grandeurs : un prix partiel reste un MINORANT utile — « au moins
 * 4,30 € » est vrai —, tandis qu'une macro partielle n'est pas un minorant de
 * quoi que ce soit d'utilisable. Un plat dont un ingrédient sur dix n'a pas de
 * table nutritionnelle peut manquer de dix calories comme de six cents, et
 * personne ne peut le dire depuis l'écran. Le seuil est donc l'exhaustivité.
 *
 * C'est d'ailleurs déjà la règle que `materializeRecipe` applique pour
 * l'éligibilité — `nutrition_coverage_incomplete` est un bloqueur : ce module
 * ne durcit rien, il rend visible sur l'écran une décision que le moteur prenait
 * déjà en silence.
 */
export const COUVERTURE_MINIMALE_PCT = 100

/**
 * UN NOMBRE DÉCLARÉ, OU RIEN — et jamais un nombre fabriqué par coercition.
 *
 * `Number(null)`, `Number('')`, `Number([])` et `Number(false)` valent tous
 * **zéro**, et `Number(true)` vaut 1. Une macro absente lue par `Number` devient
 * donc « zéro gramme de protéines » — c'est-à-dire exactement le chiffre
 * fabriqué que ce module existe pour interdire, et il serait entré ici par la
 * porte de derrière.
 *
 * Relevé à la première exécution de `tests/data/contratChiffres.test.js`, qui
 * l'a attrapé sur `arrondirMacro('kcal', null)` : la fonction rendait 0. Même
 * piège, même parade et même rédaction que `declaredNumber`
 * (`lib/domain/planning/memberPlanningRules.js`), écrit pour le quota carné du
 * livrable 1.1.
 */
const nombreFini = (valeur) => {
  if (typeof valeur === 'number') return Number.isFinite(valeur) ? valeur : null
  if (typeof valeur !== 'string') return null
  const texte = valeur.trim()
  if (!texte) return null
  const nombre = Number(texte)
  return Number.isFinite(nombre) ? nombre : null
}

/**
 * Arrondi d'affichage, aligné sur `CLAUDE.md` (« 1 décimale pour les macros »)
 * et sur `computeNutrition`, qui rend déjà les kcal en entier.
 *
 * Il est appliqué ICI et non dans les écrans : trois arrondis écrits séparément
 * produisent tôt ou tard 41 g sur un écran et 41,4 g sur un autre, et P18 se
 * casse sur une décimale aussi sûrement que sur un zéro fabriqué.
 */
export function arrondirMacro(cle, valeur) {
  const nombre = nombreFini(valeur)
  if (nombre == null) return null
  return cle === 'kcal' ? Math.round(nombre) : Math.round(nombre * 10) / 10
}

/**
 * Le verdict de macros d'un jeu de valeurs et d'une couverture.
 *
 * Séparé de `macrosParPortion` pour que le chemin « assiette » (une nutrition
 * déjà mise à l'échelle, sans objet recette) et le chemin « recette » passent
 * par la MÊME règle. Deux règles écrites séparément divergent ; celle-ci ne le
 * peut pas.
 *
 * @param {object|null} nutrition valeurs, dans le vocabulaire de MACROS
 * @param {{pct: number|null}|null} couverture couverture nutritionnelle déclarée
 * @returns {{affichable: boolean, refus: string|null, manquants: string[],
 *   macros: object|null, couverture: object|null}}
 */
export function verdictMacros(nutrition, couverture = null) {
  const vide = { affichable: false, macros: null, couverture: couverture || null }
  if (!nutrition || typeof nutrition !== 'object') {
    return { ...vide, refus: REFUS_MACROS.NUTRITION_ABSENTE, manquants: [...MACROS] }
  }
  // Les manquants sont NOMMÉS, pas comptés : « il manque une macro » n'aide
  // personne à savoir laquelle ni à la corriger. Même doctrine que
  // `couverture.unresolved` du côté des prix, qui liste les ingrédients.
  const manquants = MACROS.filter((cle) => nombreFini(nutrition[cle]) == null)
  if (manquants.length) return { ...vide, refus: REFUS_MACROS.MACRO_NON_CALCULABLE, manquants }

  // La couverture n'est contrôlée QUE si elle est déclarée. `null` veut dire
  // « cette source ne publie pas de couverture » — une assiette personnalisée,
  // par exemple —, et refuser sur une couverture absente reviendrait à traiter
  // l'absence de mesure comme une mesure défavorable.
  const pct = couverture ? nombreFini(couverture.pct) : null
  if (couverture && pct !== null && pct < COUVERTURE_MINIMALE_PCT) {
    return { ...vide, refus: REFUS_MACROS.COUVERTURE_NUTRITIONNELLE_INSUFFISANTE, manquants: [] }
  }

  return {
    affichable: true,
    refus: null,
    manquants: [],
    macros: Object.fromEntries(MACROS.map((cle) => [cle, arrondirMacro(cle, nutrition[cle])])),
    couverture: couverture || null,
  }
}

/**
 * Les macros PAR PORTION d'une recette matérialisée.
 *
 * C'est la fonction que les trois écrans appellent. Elle lit
 * `nutritionPerServing` et `nutritionCoverage` — les deux champs que
 * `materializeRecipe` et `materializeOperationalRecipe` posent sur les deux
 * chemins (JSON du dépôt et base), de sorte que la même recette rend les mêmes
 * nombres d'où qu'elle vienne.
 */
export function macrosParPortion(recipe) {
  return verdictMacros(recipe?.nutritionPerServing || null, recipe?.nutritionCoverage || null)
}

/**
 * Les macros PAR PORTION d'une assiette servie.
 *
 * L'assiette porte un total (`kcal`, `protein_g`…) et un nombre de portions ;
 * la macro par portion est leur quotient. C'est le troisième écran de P18 — la
 * grille de la semaine et le mode cuisine affichent l'assiette, pas la recette —
 * et c'est le seul endroit où une division peut faire diverger les chiffres.
 *
 * `portions` NULLE OU NULLE-ÉQUIVALENTE REND UN REFUS, jamais un total présenté
 * comme une portion. Diviser par un est le réflexe naturel ; ce serait afficher
 * l'assiette entière sous l'étiquette « par portion ».
 *
 * ICI LE REFUS EST PAR MACRO, ET PAS POUR TOUT LE BLOC — c'est la différence
 * avec `verdictMacros`, et elle se justifie par la donnée, pas par le confort.
 * Le refus global du chemin RECETTE tient à la COUVERTURE : quand un ingrédient
 * sur dix n'a pas de table nutritionnelle, aucune des cinq valeurs n'est fiable,
 * donc aucune ne s'affiche. Une assiette ne porte aucune couverture : chacune de
 * ses cinq colonnes est déclarée ou ne l'est pas, indépendamment des quatre
 * autres. Refuser les cinq parce que l'une manque effacerait quatre chiffres
 * mesurés — c'est le §0 à l'envers, et c'était la rédaction de ce module à la
 * première écriture du livrable.
 *
 * LE CAS EST RÉEL, PAS THÉORIQUE. Deux des quatre écritures de `legacy_meals`
 * posent les cinq macros ensemble (`canonicalMeal` et `supportMeal`,
 * `lib/domain/planning/personalizedMeals.js`) et la troisième n'en pose aucune
 * (le petit-déjeuner conservé sans détail). Mais `lib/xlsxParser.js` écrit
 * `fiber_g: null` à côté de quatre macros chiffrées, sur le petit-déjeuner —
 * exactement le créneau dont la grille de la semaine ouvre le détail.
 *
 * `manquants` est donc rendu MÊME quand le bloc est affichable, et c'est lui qui
 * porte la phrase de refus des colonnes vides.
 *
 * @param {object} assiette repas publié (`legacy_meals`), vocabulaire snake_case
 */
export function macrosParPortionDeLAssiette(assiette) {
  const portions = nombreFini(assiette?.planned_servings)
  if (portions == null || portions <= 0) {
    return {
      affichable: false,
      refus: REFUS_MACROS.PORTIONS_INCONNUES,
      manquants: [],
      macros: null,
      couverture: null,
    }
  }
  const totaux = {
    kcal: nombreFini(assiette?.kcal),
    proteinG: nombreFini(assiette?.protein_g),
    carbsG: nombreFini(assiette?.carbs_g),
    fatG: nombreFini(assiette?.fat_g),
    fiberG: nombreFini(assiette?.fiber_g),
  }
  const manquants = MACROS.filter((cle) => totaux[cle] == null)
  // RIEN DU TOUT n'est pas « une valeur manquante » : c'est une assiette sans
  // nutrition, et le bloc entier disparaît derrière son motif.
  if (manquants.length === MACROS.length) {
    return { affichable: false, refus: REFUS_MACROS.MACRO_NON_CALCULABLE, manquants, macros: null, couverture: null }
  }
  return {
    affichable: true,
    refus: manquants.length ? REFUS_MACROS.MACRO_NON_CALCULABLE : null,
    manquants,
    // `null` par colonne, jamais zéro : l'écran écrit le tiret là où il lit
    // `null`, et il ne peut pas écrire un nombre qu'il n'a pas reçu.
    macros: Object.fromEntries(MACROS.map((cle) => [
      cle,
      totaux[cle] == null ? null : arrondirMacro(cle, totaux[cle] / portions),
    ])),
    couverture: null,
  }
}

/**
 * Le vocabulaire des refus, en clair.
 *
 * Il vit ici et non dans un composant, pour la même raison que
 * `phraseEstimation` vit dans la couche prix : laisser chaque écran composer sa
 * phrase, c'est accepter que le troisième écrive « 0 kcal ».
 */
export const PHRASE_REFUS_MACROS = Object.freeze({
  [REFUS_MACROS.NUTRITION_ABSENTE]: 'Repères nutritionnels indisponibles : cette recette ne porte aucune nutrition calculée.',
  [REFUS_MACROS.MACRO_NON_CALCULABLE]: 'Repères nutritionnels indisponibles : une valeur au moins n’a pas pu être calculée.',
  [REFUS_MACROS.COUVERTURE_NUTRITIONNELLE_INSUFFISANTE]: 'Repères nutritionnels indisponibles : tous les ingrédients n’ont pas de table nutritionnelle.',
  [REFUS_MACROS.PORTIONS_INCONNUES]: 'Repères par portion indisponibles : le nombre de portions servies n’est pas connu.',
})

/** Le nom de chaque macro en clair, pour que la phrase ne parle pas en code. */
export const LIBELLE_MACRO = Object.freeze({
  kcal: 'énergie',
  proteinG: 'protéines',
  carbsG: 'glucides',
  fatG: 'lipides',
  fiberG: 'fibres',
})

/**
 * La phrase à afficher pour un verdict, refus compris.
 *
 * Rend `null` quand les cinq macros sont là : l'écran affiche alors les nombres,
 * et rien d'autre.
 *
 * DEUX CAS, ET ILS NE SE DISENT PAS PAREIL. Le bloc entier refusé — pas de
 * nutrition, couverture incomplète, portions inconnues — porte le motif du
 * refus. Un bloc affiché à qui il manque une colonne porte, lui, le nom de la
 * colonne vide : dire « repères indisponibles » au-dessus de quatre chiffres
 * affichés serait se contredire à l'écran.
 */
export function phraseMacros(verdict) {
  if (!verdict) return null
  const manquants = verdict.manquants || []
  const nommer = (liste) => liste.map((cle) => LIBELLE_MACRO[cle] || cle).join(', ')
  if (verdict.affichable) {
    // Les colonnes vides sont nommées : c'est ce qui permet de corriger la
    // donnée plutôt que de constater le trou.
    return manquants.length
      ? `Non calculé pour cette assiette : ${nommer(manquants)}.`
      : null
  }
  const base = PHRASE_REFUS_MACROS[verdict.refus]
    || `Repères nutritionnels indisponibles (${verdict.refus || 'motif non précisé'}).`
  return manquants.length && verdict.refus === REFUS_MACROS.MACRO_NON_CALCULABLE
    ? `${base} Manquantes : ${nommer(manquants)}.`
    : base
}

/**
 * Le bloc que les API publient, dans le vocabulaire snake_case des écrans.
 *
 * `nutrition_per_serving` vaut `null` — et non un objet de zéros — quand le
 * verdict refuse. Un objet de zéros traverserait tous les contrôles de forme et
 * s'afficherait comme une mesure ; `null` ne s'affiche pas par accident.
 */
export function blocNutritionPubliee(recipe) {
  const verdict = macrosParPortion(recipe)
  return {
    nutrition_per_serving: verdict.affichable
      ? {
        kcal: verdict.macros.kcal,
        protein_g: verdict.macros.proteinG,
        carbs_g: verdict.macros.carbsG,
        fat_g: verdict.macros.fatG,
        fiber_g: verdict.macros.fiberG,
      }
      : null,
    nutrition_refusal: verdict.refus,
    nutrition_missing: verdict.manquants,
  }
}
