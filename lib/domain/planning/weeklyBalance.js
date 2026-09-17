/**
 * Équilibre hebdomadaire du foyer : combien de poisson, de viande, de repas
 * végétariens, et combien de fois la même famille de protéine peut revenir.
 *
 * Ces bornes étaient écrites en dur — au plus 2 poissons, au plus 4 viandes,
 * au moins 8 repas végétariens sur quatorze, et jamais plus de 2 repas par
 * famille de protéine. Ce sont des choix de santé et d'empreinte parfaitement
 * défendables, mais ce sont des CHOIX, et ils entrent en conflit direct avec
 * une cible protéique élevée : mesuré sur le corpus réel, un foyer visant 216 g
 * de protéines par jour plafonne à 62 % parce que huit de ses quatorze repas
 * doivent être végétariens et qu'aucune famille animale ne peut servir plus de
 * deux fois.
 *
 * Le plafond ne venait donc ni du corpus ni de la notation, mais de ces bornes.
 * Un foyer doit pouvoir les assumer autrement : manger plus de poisson en
 * échange de sa cible est un arbitrage qui lui appartient, pas au moteur.
 *
 * Les valeurs par défaut sont EXACTEMENT celles d'avant : sans réglage
 * explicite, le comportement ne change pas d'un repas.
 *
 * Module PUR.
 */

import { getMemberPlanningRules } from './memberPlanningRules'

/**
 * Bornes par défaut, exprimées pour une semaine de quatorze repas principaux.
 * Elles sont ramenées au nombre réel de créneaux par `weeklyBalanceFor`.
 */
export const DEFAULT_WEEKLY_BALANCE = Object.freeze({
  fishMeals: 2,
  meatMax: 4,
  vegetarianMin: 8,
  redMeatMin: 1,
  fattyFishMin: 1,
  legumesMin: 2,
  cuisinesMin: 3,
  proteinsMin: 4,
  // Le verrou le plus contraignant, et le moins visible : au-delà de ce nombre,
  // une famille de protéine (bœuf, poulet, poisson…) est refusée pour le reste
  // de la semaine. Les familles ci-dessous y échappent — non par préférence,
  // mais parce qu'elles ne désignent pas un animal en particulier.
  maxMealsPerProteinFamily: 2,
})

/**
 * Familles exemptées du plafond PAR FAMILLE (`maxMealsPerProteinFamily`) : ce
 * ne sont pas des espèces. 'inconnu' — la protéine principale d'un plat dont
 * l'origine n'est pas déclarée — n'en est pas une non plus : la plafonner
 * cacherait une donnée manquante derrière une semaine infaisable, alors que
 * l'absence est déjà exposée par `unknownOrigins` et rend le plat non
 * végétarien.
 *
 * CETTE LISTE N'A PAS CHANGÉ AU LIVRABLE 3.1, ET C'EST UNE DÉCISION.
 * Le §5 du plan désigne cette ligne comme le point de départ de P3 : « laitiers
 * et œufs sont aujourd'hui exemptés ». En retirer les deux familles était la
 * correction la plus directe ; elle a été ÉCARTÉE, et pour une raison qui se
 * chiffre. Le plafond par famille vaut 2 : laitiers et œufs plafonnés
 * séparément autoriseraient 2 + 2 = 4 repas sur 14, soit 28,6 %, quand P3
 * demande 20 %. La correction directe ne tient donc pas le critère qu'elle
 * prétend corriger. Elle interdirait par ailleurs un troisième plat au fromage
 * dans une semaine sans un seul œuf, c'est-à-dire une semaine où P3 est
 * largement tenu.
 *
 * Le critère P3 porte sur la SOMME des deux familles — « part des repas dont la
 * protéine principale est un laitier OU un œuf ». C'est donc un plafond
 * d'agrégat qui le tient : `dairyEggProteinMaxShare` ci-dessous. Les deux
 * règles coexistent sans se recouvrir : celle-ci borne la répétition d'une
 * espèce, celle-là borne une part de la semaine.
 */
export const UNCAPPED_PROTEIN_FAMILIES = Object.freeze(['vegetal', 'laitiers', 'oeufs', 'inconnu'])

/**
 * Familles de protéine principale que P3 compte ensemble. Deux valeurs, pas un
 * calcul : ce sont les deux familles nommées par le critère.
 */
export const DAIRY_EGG_PROTEIN_FAMILIES = Object.freeze(['laitiers', 'oeufs'])

/** La famille de féculent que P2 nomme, et la seule qui porte un plafond propre. */
export const PASTA_STARCH_FAMILY = 'pates'

/**
 * LES PLAFONDS DE PART — livrable 3.1, P2, P3 et P13.
 *
 * EXPRIMÉS EN PART ET NON EN NOMBRE DE CRÉNEAUX, parce que c'est ainsi que les
 * critères sont écrits (« ≤ 15 % », « aucun féculent > 25 % », « ≤ 20 % »,
 * « aucune cuisine > 40 % ») et parce qu'une semaine partielle — une
 * régénération de trois jours, une semaine où deux créneaux sont épinglés —
 * doit obéir à la même règle qu'une semaine de quatorze repas. `weeklyBalanceFor`
 * les ramène au nombre réel de créneaux.
 *
 * L'ARRONDI VA VERS LE BAS, et il n'est pas neutre : `Math.floor(0,15 × 14)`
 * vaut 2, pas 3. Un plafond « ≤ 15 % » autorise 2,1 créneaux sur quatorze ;
 * arrondir au supérieur en autoriserait 3, soit 21,4 %, c'est-à-dire tenir le
 * critère à l'écran en le dépassant dans l'assiette. Conséquence directe et
 * assumée : sur une semaine de quatorze repas, pâtes ≤ 2, tout autre féculent
 * ≤ 3, laitiers + œufs ≤ 2, et une même cuisine ≤ 5.
 *
 * RÉGLABLES, comme toutes les bornes de ce fichier : `buildWeeklyBalance`
 * accepte un remplacement par clé. Ce sont des défauts documentés, pas des
 * valeurs en dur.
 */
export const DEFAULT_WEEKLY_CAPS = Object.freeze({
  // P2, premier volet : « part des créneaux sur pâtes ≤ 15 % ».
  pastaMaxShare: 0.15,
  // P2, second volet : « aucun féculent au-dessus de 25 % ». Les pâtes sont un
  // féculent comme un autre pour cette borne-ci ; c'est la borne précédente,
  // plus serrée, qui les distingue.
  starchMaxShare: 0.25,
  // P3 : « part des repas dont la protéine principale est un laitier ou un
  // œuf ≤ 20 % », les deux familles comptées ENSEMBLE.
  dairyEggProteinMaxShare: 0.2,
  // P13, second volet : « aucune cuisine au-dessus de 40 % », sur les libellés
  // normalisés par data/recipes/arbitrations/cuisines.json. Sans cette
  // normalisation la borne serait invérifiable : la France se présente sous
  // DIX-NEUF écritures brutes distinctes dans le corpus — dix-sept clés une
  // fois repliées —, et un plafond de part comptant dix-sept cuisines là où il
  // y en a une ne mordrait jamais.
  //
  // ERRATUM DE RELECTURE, laissé visible : cette ligne annonçait « quatorze
  // libellés distincts ». Recomptage sur data/recipes/corpus-v3.json — les
  // libellés dont la cuisine arbitrée est « France » — : dix-neuf bruts,
  // dix-sept repliés. Le chiffre ne commande rien ici, mais il était faux, et
  // tests/data/cuisinesArbitrage.test.js recompte désormais les deux.
  cuisineMaxShare: 0.4,
})

/**
 * LE JALON DE LA BASCULE — la parade que le §5 du plan impose au livrable 3.1.
 *
 * « Les plafonds P2/P3 sur un vivier à 71,5 % France peuvent rendre la semaine
 * infaisable. Parade : ils n'entrent en vigueur COMME REFUS qu'au jalon C6 où
 * la France passe sous 50 % du vivier ; d'ici là ce sont des avertissements
 * mesurés, affichés, jamais des blocages silencieux. »
 *
 * Ce nombre est donc ce seuil, et le pivot est la France — écrite telle quelle
 * par le plan. Ce n'est pas « la cuisine dominante » : si un jour l'Italie
 * dominait un vivier où la France serait à 45 %, la règle du plan armerait les
 * plafonds et une règle écrite sur la dominante ne le ferait pas. Les deux
 * grandeurs sont mesurées et rendues par `resolveRegimeDesPlafonds` ; c'est la
 * première qui décide, parce que c'est elle que le plan a écrite.
 */
export const SEUIL_BASCULE_PLAFONDS = 0.5

/** La cuisine pivot du jalon, sous sa forme repliée — celle qui sert à compter. */
export const CUISINE_PIVOT_BASCULE = 'france'

/** Motifs de régime, rendus tels quels pour être affichés et contestés. */
export const RAISONS_REGIME_PLAFONDS = Object.freeze({
  VIVIER_VIDE: 'vivier_vide',
  PIVOT_AU_DESSUS_DU_SEUIL: 'pivot_au_dessus_du_seuil',
  PIVOT_SOUS_LE_SEUIL: 'pivot_sous_le_seuil',
  VIVIER_TROP_ETROIT: 'vivier_trop_etroit',
  DECLARE_PAR_LE_FOYER: 'declare_par_le_foyer',
})

const positiveInt = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback
}

/**
 * UNE PART DÉCLARÉE, OU LE DÉFAUT — et jamais une part fabriquée par coercition.
 *
 * `Number(true)` vaut **1**, c'est-à-dire, pour un plafond de part, « tous les
 * créneaux » : un `pastaMaxShare: true` arrivé d'un corps de requête ou d'un
 * profil malformé désarmait silencieusement la borne, et le plafond publié
 * dans `objectiveScores.weeklyCaps` annonçait alors 100 % sans que personne
 * l'ait demandé. C'est le piège de `Number()` relevé au livrable 1.1
 * (`declaredNumber`, `memberPlanningRules.js`) : mêmes valeurs, même parade.
 *
 * Seuls un `number` fini et une chaîne entièrement numérique sont donc des
 * déclarations ; tout le reste retombe sur le défaut documenté. Une part hors
 * de ]0, 1] y retombe aussi plutôt que d'être ramenée à la borne — un plafond
 * réglé à 1,5 est une erreur de saisie, et la corriger en 1 cacherait la faute.
 */
const partValide = (value, fallback) => {
  const parsed = typeof value === 'number' ? value
    : (typeof value === 'string' && value.trim() ? Number(value.trim()) : NaN)
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : fallback
}

/**
 * Le plafond qui s'applique à une famille de féculent, en créneaux.
 *
 * Une seule fonction pour les deux bornes, parce que l'écart entre elles est
 * exactement une ligne de critère : les pâtes portent la borne serrée de P2,
 * tout le reste porte celle des féculents. Deux fonctions séparées auraient fini
 * par diverger, et un plafond de pâtes appliqué au riz est indétectable une fois
 * le chiffre affiché.
 */
export function plafondDuFeculent(famille, targets = {}) {
  return famille === PASTA_STARCH_FAMILY
    ? targets.pastaMax ?? targets.starchMax
    : targets.starchMax
}

/**
 * LE RÉGIME DES PLAFONDS, RÉSOLU UNE FOIS POUR LA SEMAINE.
 *
 * Il répond à une seule question — les plafonds écartent-ils un plat, ou se
 * contentent-ils de le rapporter ? — et il rend, à côté de sa réponse, les
 * chiffres qui l'ont produite. C'est la condition du « jamais de blocage
 * silencieux » : un plat écarté par un plafond doit pouvoir être rattaché à la
 * mesure qui a armé ce plafond.
 *
 * CE QU'IL NE DEVINE PAS. Sans vivier — aucun libellé à compter — la part de la
 * France n'est pas 0, elle est INCALCULABLE. Le régime reste alors désarmé et
 * `partPivot` vaut `null`, jamais un nombre : armer des refus sur une mesure
 * absente reviendrait à décider sur du vide, et rendre 0 ferait croire que la
 * France a disparu du vivier.
 *
 * LE FOYER PEUT TRANCHER LUI-MÊME. `declare` — `constraints.weeklyCaps.enforce`
 * — l'emporte sur la mesure, dans les deux sens. C'est la sortie de secours du
 * jour où le foyer veut éprouver les plafonds avant le jalon, ou les désarmer
 * après ; elle est rendue dans `raison`, donc visible.
 *
 * @param {Array<string>} cuisineLabels libellés BRUTS du vivier (`cuisineOrigin`)
 * @param {(libelles: Array<string>) => object} repartition le compteur arbitré
 * @param {boolean|null} declare décision explicite du foyer, `null` sinon
 */
export function resolveRegimeDesPlafonds({ cuisineLabels = [], repartition = null, declare = null } = {}) {
  const compte = typeof repartition === 'function' ? repartition(cuisineLabels) : null
  const total = compte?.total ?? 0
  const pivot = total > 0 ? (compte.parCuisine.get(CUISINE_PIVOT_BASCULE) || 0) : 0
  const partPivot = total > 0 ? pivot / total : null
  const mesure = {
    pivot: CUISINE_PIVOT_BASCULE,
    recettesPivot: total > 0 ? pivot : null,
    partPivot,
    seuil: SEUIL_BASCULE_PLAFONDS,
    dominante: compte?.dominante ?? null,
    partDominante: compte?.partDominante ?? null,
    cuisines: compte?.parCuisine?.size ?? 0,
    vivier: total,
    libellesNonArbitres: compte?.nonArbitres ?? [],
  }
  if (declare === true || declare === false) {
    return { ...mesure, actif: declare, raison: RAISONS_REGIME_PLAFONDS.DECLARE_PAR_LE_FOYER }
  }
  if (partPivot == null) {
    return { ...mesure, actif: false, raison: RAISONS_REGIME_PLAFONDS.VIVIER_VIDE }
  }
  return partPivot < SEUIL_BASCULE_PLAFONDS
    ? { ...mesure, actif: true, raison: RAISONS_REGIME_PLAFONDS.PIVOT_SOUS_LE_SEUIL }
    : { ...mesure, actif: false, raison: RAISONS_REGIME_PLAFONDS.PIVOT_AU_DESSUS_DU_SEUIL }
}

/**
 * COMBIEN DE CRÉNEAUX LE VIVIER PEUT SERVIR SOUS CHACUN DES TROIS PLAFONDS.
 *
 * POURQUOI CE SECOND VERROU EXISTE, alors que le plan n'en demande qu'un.
 * Le jalon écrit par le §5 — « la France sous 50 % du vivier » — décrit un
 * corpus qui s'est diversifié. Il décrit aussi, sans le vouloir, tout vivier
 * minuscule ou sans cuisine déclarée : trois recettes sans `cuisine_origin`
 * donnent 0 % de France, donc un jalon franchi, donc des refus armés sur un
 * vivier qui ne peut rien proposer d'autre. Mesuré : le test de régression
 * `tests/planning/foodBanMatch.test.js` passe de `published` à
 * `review_required` avec le seul jalon, faute de pouvoir remplir son second
 * créneau. Un plafond qui arme là où il n'a rien à départager ne protège rien :
 * il supprime la semaine.
 *
 * C'EST LA DOCTRINE DÉJÀ ÉCRITE POUR LE PLANCHER DE DENSITÉ PROTÉIQUE
 * (`closedLoopPlanner.js`, `context.proteinDensity.gate`) : « la porte n'est
 * armée que si le vivier compte assez de plats denses pour la franchir ». Elle
 * est reprise mot pour mot ici, sur trois dimensions au lieu d'une.
 *
 * CE QUE CE COMPTE EST, ET CE QU'IL N'EST PAS. Pour chaque dimension, il somme
 * ce que le plafond laisse passer : au plus `cuisineMax` créneaux par cuisine,
 * au plus `plafondDuFeculent` par famille de féculent (les plats sans féculent
 * ne sont bornés par rien), au plus `dairyEggProteinMax` créneaux laitiers ou
 * œufs plus tous les autres. C'est un MAJORANT : si l'un des trois tombe sous
 * le nombre de créneaux, aucune semaine complète n'existe et les plafonds ne
 * s'arment pas. L'inverse ne vaut pas — trois majorants suffisants ne font pas
 * une semaine faisable, parce que les règles de répétition, les quotas carnés
 * et les contraintes du foyer s'ajoutent. C'est pourquoi le planificateur garde
 * en plus un repli nommé (`weekly_caps_relaxed`) : le majorant évite le cas
 * évident, le repli rattrape le reste et le DIT.
 *
 * @param {Array<{cuisine: string, mainStarch: string|null, dairyEgg: boolean}>} profils
 * @param {object} targets bornes déjà ramenées à la semaine
 * @param {number} slotCount créneaux à pourvoir
 */
export function capaciteDuVivier(profils = [], targets = {}, slotCount = 0) {
  const parCuisine = new Map()
  const parFeculent = new Map()
  let sansFeculent = 0
  let laitiersOeufs = 0
  let autresProteines = 0
  for (const profil of profils || []) {
    const cuisine = profil?.cuisine ?? null
    if (cuisine != null) parCuisine.set(cuisine, (parCuisine.get(cuisine) || 0) + 1)
    if (profil?.mainStarch) parFeculent.set(profil.mainStarch, (parFeculent.get(profil.mainStarch) || 0) + 1)
    else sansFeculent += 1
    if (profil?.dairyEgg) laitiersOeufs += 1
    else autresProteines += 1
  }
  const creneauxCuisine = [...parCuisine.values()]
    .reduce((total, compte) => total + Math.min(compte, targets.cuisineMax ?? compte), 0)
  const creneauxFeculent = sansFeculent + [...parFeculent.entries()]
    .reduce((total, [famille, compte]) => total + Math.min(compte, plafondDuFeculent(famille, targets) ?? compte), 0)
  const creneauxProteine = autresProteines + Math.min(laitiersOeufs, targets.dairyEggProteinMax ?? laitiersOeufs)
  return {
    creneauxCuisine,
    creneauxFeculent,
    creneauxProteine,
    suffisante: [creneauxCuisine, creneauxFeculent, creneauxProteine].every((compte) => compte >= slotCount),
  }
}

/**
 * LE PLAFOND CARNÉ DU FOYER, DÉDUIT DES QUOTAS DÉCLARÉS — livrable 1.1.
 *
 * CE QU'IL REMPLACE, ET POURQUOI. `meatMax` valait 4 en dur. Ce 4 était un
 * plafond de FOYER, et il produisait un effet que personne n'avait demandé :
 * mesuré au §2.3 de `docs/PLAN_FINIR_MYKO.md`, Zoé mangeait 0 repas carné sur
 * 14 les trois semaines, parce que ses quatre « swaps végétariens »
 * absorbaient exactement les quatre créneaux carnés que le plafond autorisait.
 * Elle a déclaré vouloir manger MOINS de viande que Julien, pas ne plus en
 * manger. Le plafond du foyer devient donc la SOMME des quotas déclarés
 * (§5, livrable 1.1 du plan), et le quota devient la grandeur réglée par
 * chaque personne.
 *
 * CE QUE « DÉCLARÉ » VEUT DIRE ICI, ET CE QUE LA FONCTION REFUSE DE DEVINER.
 * Un membre qui n'a pas réglé son quota n'en a pas : sa valeur est `null`, pas
 * un nombre plausible. Si PERSONNE n'a déclaré de quota, cette fonction rend
 * `null` — et l'appelant garde alors le défaut du foyer. Rendre 0 ferait
 * disparaître la viande d'un foyer qui n'a rien demandé ; rendre 4 par tête
 * fabriquerait un quota que personne n'a écrit. Les deux sont des inventions,
 * et un attribut deviné ne se distingue plus d'un attribut vrai.
 *
 * LA SOMME PLUTÔT QUE LE MAXIMUM. C'est la règle que le plan pose, et elle se
 * lit ainsi : les créneaux carnés de la semaine sont un stock que les membres
 * se partagent, chacun renonçant aux créneaux qui dépassent son quota. Le
 * maximum (4 pour « Julien 4, Zoé 2 ») suffirait à ce que chacun tienne son
 * quota et coûterait moins de jumeaux à cuisiner ; la somme (6) laisse au
 * solveur plus de créneaux carnés, donc plus de substitutions et plus de plats
 * distincts à préparer. L'écart mesuré entre les deux réglages est consigné
 * dans `tests/planning/quotaViandeParMembre.test.js`, qui les rejoue tous les
 * deux sur trois semaines — on applique la règle écrite, on ne la corrige pas
 * en silence.
 *
 * @param {Array<number|null|undefined>} quotas quotas déclarés, `null` quand absent
 * @returns {number|null} la somme, ou `null` si aucun quota n'est déclaré
 */
export function meatMaxFromDeclaredQuotas(quotas = []) {
  const declares = (Array.isArray(quotas) ? quotas : [])
    // L'absence est écartée AVANT la conversion, et c'est tout sauf un détail :
    // `Number(null)` vaut 0, si bien qu'un filtre posé après la conversion
    // aurait compté chaque membre sans quota pour « zéro repas carné ». Un
    // foyer qui n'a rien déclaré serait alors passé à meatMax = 0, c'est-à-dire
    // à aucune viande du tout, sans que personne n'ait touché à un réglage.
    // Le cas est éprouvé par `tests/planning/quotaViandeParMembre.test.js`.
    .filter((quota) => quota != null && quota !== '')
    .map((quota) => Number(quota))
    .filter((quota) => Number.isFinite(quota) && quota >= 0)
  if (!declares.length) return null
  return declares.reduce((total, quota) => total + Math.round(quota), 0)
}

/**
 * Bornes du foyer, valeurs par défaut comprises. Ne dépend pas de la semaine.
 *
 * Les bornes en NOMBRE de créneaux et les plafonds en PART cohabitent dans le
 * même objet, chacun avec sa validation : un nombre est un entier positif, une
 * part est un réel de ]0, 1]. Une part hors de cet intervalle retombe sur le
 * défaut plutôt que d'être ramenée à la borne — un plafond réglé à 1,5 est une
 * erreur de saisie, et la corriger en 1 (« tous les repas ») cacherait la faute.
 */
export function buildWeeklyBalance(overrides = {}) {
  const source = overrides && typeof overrides === 'object' ? overrides : {}
  return {
    ...Object.fromEntries(Object.entries(DEFAULT_WEEKLY_BALANCE)
      .map(([key, fallback]) => [key, key === 'maxMealsPerProteinFamily'
        ? Math.max(1, positiveInt(source[key], fallback))
        : positiveInt(source[key], fallback)])),
    ...Object.fromEntries(Object.entries(DEFAULT_WEEKLY_CAPS)
      .map(([key, fallback]) => [key, partValide(source[key], fallback)])),
  }
}

/**
 * Bornes du foyer telles que la route de génération les résout — livrable 1.1.
 *
 * ELLE VIT ICI ET PLUS DANS LA ROUTE. Elle y était, et elle n'y était donc
 * testable qu'en simulant Supabase : c'est une règle de domaine — trois
 * sources, un ordre de précédence, une déduction — et pas un morceau de
 * transport HTTP. La déplacer, c'est pouvoir l'éprouver sans base.
 *
 * ORDRE DE PRÉCÉDENCE, DU PLUS EXPLICITE AU PLUS GÉNÉRAL :
 *   1. un `meatMax` ÉCRIT — par la requête, puis par les réglages du foyer.
 *      C'est une consigne directe ; la réinterpréter serait décider à la place
 *      de qui l'a écrite ;
 *   2. la SOMME des quotas carnés déclarés par les membres actifs ;
 *   3. le défaut du domaine (4), quand personne n'a rien déclaré.
 * Les autres bornes — poisson, plancher végétarien, répétition par famille —
 * ne changent pas : elles se lisent comme avant.
 *
 * Un membre inactif ne compte pas : il ne mange pas cette semaine, et son quota
 * gonflerait le plafond du foyer sans qu'aucune assiette n'y corresponde.
 */
export function resolveHouseholdWeeklyBalance({ members = [], requestBalance = null } = {}) {
  const memberBalance = (members || [])
    .map((member) => member?.preferences?.planning?.weekly_balance)
    .find((balance) => balance && typeof balance === 'object') || {}
  const request = requestBalance && typeof requestBalance === 'object' ? requestBalance : {}
  const declare = { ...memberBalance, ...request }
  if (declare.meatMax != null) return buildWeeklyBalance(declare)
  const deduit = meatMaxFromDeclaredQuotas((members || [])
    .filter((member) => member?.active !== false)
    .map((member) => getMemberPlanningRules(member).meatMealsPerWeek))
  return buildWeeklyBalance(deduit == null ? declare : { ...declare, meatMax: deduit })
}

/**
 * Bornes ramenées à la taille réelle de la semaine. Un régime végétarien déclaré
 * l'emporte sur tout réglage : c'est une contrainte alimentaire, pas un dosage.
 */
export function weeklyBalanceFor({ balance = DEFAULT_WEEKLY_BALANCE, totalSlots = 14, vegetarianDiet = false } = {}) {
  /**
   * Un plafond de part ramené à un nombre de créneaux — livrable 3.1.
   *
   * Plancher à 1 : sur une régénération de trois créneaux, `floor(0,15 × 3)`
   * vaut 0, c'est-à-dire « aucune assiette de pâtes autorisée ». Une part ne
   * peut pas se traduire par une interdiction pure sans cesser d'être une part,
   * et une semaine de trois repas ne se juge pas à 15 % près. Le plancher est
   * donc 1, et il est écrit ici plutôt que découvert à l'usage.
   */
  const partEnCreneaux = (share, fallback) => {
    const valeur = partValide(share, fallback)
    return Math.max(1, Math.min(totalSlots, Math.floor(valeur * totalSlots)))
  }
  const plafonds = {
    pastaMax: partEnCreneaux(balance.pastaMaxShare, DEFAULT_WEEKLY_CAPS.pastaMaxShare),
    starchMax: partEnCreneaux(balance.starchMaxShare, DEFAULT_WEEKLY_CAPS.starchMaxShare),
    dairyEggProteinMax: partEnCreneaux(balance.dairyEggProteinMaxShare, DEFAULT_WEEKLY_CAPS.dairyEggProteinMaxShare),
    cuisineMax: partEnCreneaux(balance.cuisineMaxShare, DEFAULT_WEEKLY_CAPS.cuisineMaxShare),
    // Les parts elles-mêmes voyagent avec leurs nombres : l'écran doit pouvoir
    // dire « 3 créneaux sur 14, soit le plafond de 25 % » plutôt qu'un nombre
    // nu dont personne ne retrouve la règle.
    pastaMaxShare: partValide(balance.pastaMaxShare, DEFAULT_WEEKLY_CAPS.pastaMaxShare),
    starchMaxShare: partValide(balance.starchMaxShare, DEFAULT_WEEKLY_CAPS.starchMaxShare),
    dairyEggProteinMaxShare: partValide(balance.dairyEggProteinMaxShare, DEFAULT_WEEKLY_CAPS.dairyEggProteinMaxShare),
    cuisineMaxShare: partValide(balance.cuisineMaxShare, DEFAULT_WEEKLY_CAPS.cuisineMaxShare),
  }
  if (vegetarianDiet) {
    return {
      fish: 0,
      meatMax: 0,
      vegetarianMin: totalSlots,
      redMeatMin: 0,
      fattyFishMin: 0,
      legumesMin: 2,
      cuisinesMin: 3,
      proteinsMin: 4,
      maxMealsPerProteinFamily: Math.max(1, balance.maxMealsPerProteinFamily ?? DEFAULT_WEEKLY_BALANCE.maxMealsPerProteinFamily),
      // Les plafonds du livrable 3.1 valent aussi pour un foyer végétarien :
      // ils portent sur le féculent, sur la part des laitiers et des œufs et
      // sur la cuisine, c'est-à-dire sur des dimensions que le régime ne
      // tranche pas. Les exempter ferait d'un foyer végétarien le seul à qui
      // l'on servirait cinq assiettes de pâtes sans le lui dire.
      ...plafonds,
    }
  }
  const cap = (value) => Math.min(value, totalSlots)
  return {
    fish: cap(balance.fishMeals),
    meatMax: cap(balance.meatMax),
    vegetarianMin: cap(balance.vegetarianMin),
    // Les minimums « au moins un » n'ont de sens que sur une semaine complète.
    redMeatMin: totalSlots >= 7 ? balance.redMeatMin : 0,
    fattyFishMin: totalSlots >= 7 ? balance.fattyFishMin : 0,
    legumesMin: cap(balance.legumesMin),
    cuisinesMin: cap(balance.cuisinesMin),
    proteinsMin: cap(balance.proteinsMin),
    maxMealsPerProteinFamily: Math.max(1, balance.maxMealsPerProteinFamily),
    ...plafonds,
  }
}
