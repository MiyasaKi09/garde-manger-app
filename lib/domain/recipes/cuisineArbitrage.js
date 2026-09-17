import arbitrage from '@/data/recipes/arbitrations/cuisines.json'

/**
 * NORMALISATION DES LIBELLÉS DE CUISINE — livrable 3.1 de docs/PLAN_FINIR_MYKO.md.
 *
 * CE QU'ELLE RÉSOUT. P13 demande « au moins 8 cuisines distinctes, aucune
 * au-dessus de 40 % ». Le corpus écrit 103 libellés `cuisine_origin` distincts
 * pour 754 recettes — 101 une fois repliés —, dont DIX-NEUF commencent par
 * « France » : « France », « France / cuisine domestique internationale »,
 * « France (Bourgogne) », « France — Bourgogne »… Comptés bruts, ces dix-neuf
 * libellés font dix-sept cuisines, et le critère n'est pas vérifiable
 * mécaniquement — c'est le mot du plan. Comptés une fois, ils font la France
 * (434 recettes sur 754), et le chiffre devient contestable, donc utile.
 *
 * CE QUE CE MODULE NE FAIT PAS, ET C'EST L'ESSENTIEL. Il ne devine aucune
 * normalisation. Il lit `data/recipes/arbitrations/cuisines.json`, relu ligne à
 * ligne, où chacun des 101 libellés porte sa cuisine, sa règle et son motif. Un
 * libellé absent de l'arbitrage n'est PAS normalisé : il ressort tel qu'il est
 * entré, `arbitre` vaut `false`, et `libellesNonArbitres` le nomme. Le test de
 * corpus `tests/data/cuisinesArbitrage.test.js` échoue dès qu'une recette du
 * corpus en porte un.
 *
 * POURQUOI PAS UNE RÈGLE PLUTÔT QU'UN FICHIER. Quatre libellés suffisent à
 * répondre : « Côte d'Ivoire », « Afrique du Sud », « Royaume-Uni » et
 * « Porto Rico » sont des États dont le nom contient un espace ou un trait
 * d'union — un découpage au premier mot en ferait « Côte », « Afrique »,
 * « Royaume » et « Porto ». « Inde du Sud » est une moitié de pays,
 * « Mali/Sénégal » deux États, « Cachemire » une région que deux États
 * revendiquent. Aucune règle de préfixe, de séparateur ou de longueur ne les
 * traite correctement, et une règle qui se trompe une fois sur cent produit un
 * libellé faux qui a exactement la même tête qu'un libellé vrai.
 *
 * LE REPLI EST LA CLÉ DE LECTURE. L'arbitrage est indexé sur le libellé
 * REPLIÉ — accents, ponctuation et casse retirés — parce que le corpus écrit la
 * même cuisine de deux manières (« France / cuisine domestique » et
 * « France — cuisine domestique »). Le repli réunit ces deux écritures ; c'est
 * une normalisation typographique, pas une décision de cuisine, et les deux
 * écritures brutes restent inscrites dans l'arbitrage pour qu'on puisse les
 * relire.
 *
 * Module PUR : une donnée versionnée importée au build, aucune horloge, aucune
 * lecture de base. Le planificateur, le rapport de qualité et les scripts
 * lisent donc exactement la même table.
 */

/**
 * Repli typographique. Il fait le même travail que `fold` dans
 * `closedLoopPlanner.js`, SANS ÊTRE LA MÊME FONCTION — et la nuance est écrite
 * ici parce qu'une première rédaction les disait « identiques », ce qu'elles ne
 * sont pas : `fold` remplace en plus la ligature « œ » par « oe ». Sur les
 * libellés de cuisine du corpus, l'écart est nul (aucun des 103 n'en porte une)
 * et `tests/data/cuisinesArbitrage.test.js` le VÉRIFIE libellé par libellé au
 * lieu de le supposer. Le jour où une « Cuisine des Œufs » entrerait au corpus,
 * ce test tomberait avant que les deux comptes ne divergent en silence.
 *
 * RECOPIÉ PLUTÔT QU'IMPORTÉ, et c'est délibéré : `closedLoopPlanner` importe ce
 * module (la classification lit la cuisine normalisée), l'importer en retour
 * ferait un cycle. La fonction est de six lignes et sans état.
 */
export function replierCuisine(valeur) {
  return String(valeur || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const PAR_LIBELLE = new Map((arbitrage.decisions || [])
  .map((decision) => [replierCuisine(decision.libelle), decision]))

/** Libellé rendu quand la recette ne déclare aucune cuisine. */
export const CUISINE_NON_RENSEIGNEE = 'non renseignee'

/**
 * La cuisine arbitrée d'un libellé brut.
 *
 * @param {string} libelleBrut la valeur de `cuisine_origin` / `cuisineOrigin`
 * @returns {{ cuisine: string, cle: string, arbitre: boolean, regle: string|null }}
 *   `cuisine` est le libellé d'affichage retenu, `cle` sa forme repliée — celle
 *   sur laquelle on compte —, `arbitre` dit si une décision relue existe.
 */
export function cuisineArbitree(libelleBrut) {
  const cle = replierCuisine(libelleBrut)
  if (!cle) {
    return { cuisine: CUISINE_NON_RENSEIGNEE, cle: CUISINE_NON_RENSEIGNEE, arbitre: false, regle: null }
  }
  const decision = PAR_LIBELLE.get(cle)
  // Sans décision, le libellé ressort tel qu'il est entré. On ne le rattache
  // pas « au plus proche » : un libellé rattaché par ressemblance compterait
  // comme un libellé relu, et personne ne pourrait plus les distinguer.
  if (!decision) return { cuisine: libelleBrut ? String(libelleBrut) : cle, cle, arbitre: false, regle: null }
  return {
    cuisine: decision.cuisine,
    cle: replierCuisine(decision.cuisine),
    arbitre: true,
    regle: decision.regle || null,
  }
}

/**
 * La clé de comptage d'un libellé — ce que le moteur range dans ses ensembles.
 *
 * C'est la seule fonction que le planificateur appelle. Elle rend une chaîne
 * repliée, jamais `null` : un plat sans cuisine déclarée compte pour
 * « non renseignee », qui est une valeur comme une autre et se voit dans le
 * rapport, plutôt que de disparaître du décompte.
 */
export function cleCuisine(libelleBrut) {
  return cuisineArbitree(libelleBrut).cle
}

/** Toutes les décisions relues, dans l'ordre du fichier. */
export function decisionsCuisine() {
  return (arbitrage.decisions || []).map((decision) => ({ ...decision }))
}

/**
 * Les libellés d'un corpus que l'arbitrage ne couvre pas, dédoublonnés et
 * triés. Liste vide = tout est relu. C'est ce que le test de corpus exige, et
 * ce que le rapport de qualité imprime quand il ne l'est pas.
 *
 * @param {Array<string>} libelles libellés bruts, tels que le corpus les écrit
 */
export function libellesNonArbitres(libelles = []) {
  const manquants = new Set()
  for (const libelle of libelles || []) {
    const cle = replierCuisine(libelle)
    if (!cle || PAR_LIBELLE.has(cle)) continue
    manquants.add(String(libelle))
  }
  return [...manquants].sort()
}

/**
 * Répartition des cuisines d'un vivier, arbitrage appliqué.
 *
 * Rendue ici plutôt que recomposée par chaque appelant, pour que le plafond du
 * livrable 3.1, la bascule qui l'arme et la ligne P13 du rapport de qualité
 * comptent tous les trois de la même manière. Deux comptages d'une même part
 * peuvent diverger ; un seul ne le peut pas.
 *
 * @param {Array<string>} libelles libellés bruts
 * @returns {{ total: number, parCuisine: Map<string, number>, dominante: string|null,
 *   partDominante: number|null, nonArbitres: Array<string> }}
 */
export function repartitionCuisines(libelles = []) {
  const parCuisine = new Map()
  let total = 0
  for (const libelle of libelles || []) {
    const { cle } = cuisineArbitree(libelle)
    parCuisine.set(cle, (parCuisine.get(cle) || 0) + 1)
    total += 1
  }
  const tete = [...parCuisine.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null
  return {
    total,
    parCuisine,
    dominante: tete ? tete[0] : null,
    // `null` et non 0 quand le vivier est vide : une part qu'on ne peut pas
    // calculer n'est pas une part nulle, et le plan interdit de rendre un
    // chiffre non calculable sous forme de nombre (P18).
    partDominante: tete && total > 0 ? tete[1] / total : null,
    nonArbitres: libellesNonArbitres(libelles),
  }
}
