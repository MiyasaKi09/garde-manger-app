/**
 * Le budget comme DIMENSION du solveur — pas comme filtre appliqué après coup.
 *
 * Un filtre posé en aval (« régénère tant que le total dépasse ») a trois
 * défauts qu'on ne rattrape pas ensuite : il ne sait pas QUEL repas a coûté
 * cher, il rejette des semaines par ailleurs excellentes, et il ne converge
 * pas — le corpus n'a aucune raison de contenir une semaine qui tombe sous
 * l'enveloppe par hasard. La contrainte doit donc entrer dans la fonction de
 * notation, au même endroit que les autres arbitrages, pour que le faisceau la
 * porte à chaque créneau au lieu de la découvrir à la fin.
 *
 * Ce module ne contient AUCUNE arithmétique de fourchette : elle vit dans
 * lib/domain/pricing/priceMath.js et le contrat (data/prices/CONTRAT.md §3.2)
 * interdit d'en écrire une seconde. On y compose, on n'additionne jamais de
 * bornes.
 *
 * Il ne lit pas non plus le référentiel : l'index de prix est INJECTÉ, comme
 * `buildPriceIndex` l'est aux tests de la couche prix. La couche de
 * planification n'a pas à savoir qu'il existe des fichiers JSON quelque part —
 * et un test de budget ne doit pas dépendre de l'avancement du référentiel.
 */

import { computeRecipeCost } from '@/lib/domain/pricing/recipeCost'
import {
  composerFourchettes,
  diviserFourchette,
  formaterEuros,
  moisFrancais,
} from '@/lib/domain/pricing/priceMath'

const nombre = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)

/**
 * POIDS DE LA DIMENSION « EUROS » dans le vecteur de pénalité du créneau.
 *
 * Le vecteur nutritionnel pèse 1,00 au total (kcal 0,40 · protéines 0,34 ·
 * fibres 0,14 · glucides 0,06 · lipides 0,06) et sa pénalité est bornée à
 * 2 × 35 = 70 points. Avec un poids de 0,30 et le même plafond relatif de 2,
 * l'euro plafonne à 2 × 0,30 × 35 = **21 points**.
 *
 * Pourquoi 21, et pas 5 ni 60 — les repères sont les autres termes du score :
 *
 *   seasonalBonus              4     un légume de saison
 *   quotaScore (légumineuses) 10     un repère hebdomadaire modeste
 *   quotaScore (poisson)      18     un repère hebdomadaire fort
 *   wasteReward (max)         20     un lot qui périme
 *   → dimension euros         21
 *   stockReward (max)         28     une recette entièrement en stock
 *   shoppingPenalty (max)     32     une recette entièrement à acheter
 *   recipeRepeatPenalty       36+    une répétition de plat
 *   pénalité nutritionnelle   70     un plat totalement hors cible
 *
 * À 21, l'enveloppe peut renverser un bonus de saison, un repère hebdomadaire,
 * une urgence anti-gaspillage — c'est-à-dire mordre pour de bon. Elle ne peut
 * pas renverser à elle seule une couverture de stock complète, ni une
 * répétition, ni un écart nutritionnel sérieux : un plat trois fois trop cher
 * mais parfaitement calibré (pénalité nutritionnelle nulle) reste devant un
 * plat bon marché qui rate sa cible de 60 %.
 *
 * Le garde-fou décisif n'est pas le poids, c'est la FORME : la dimension est
 * strictement à une face (voir `COUT_EXCES` / l'absence de coût de déficit).
 * Un plat sous son allocation marque 0, jamais un bonus. Le solveur ne cherche
 * donc jamais le moins cher — il évite le trop cher. Les « semaines de pâtes »
 * naissent d'un score qui RÉCOMPENSE la modicité ; cette forme-là ne le peut
 * pas. Il reste vrai qu'à 21 points près, écarter le coûteux revient de fait à
 * préférer le sobre entre deux plats équivalents — c'est exactement ce qu'on
 * demande à un plafond, et c'est borné.
 */
export const POIDS_EUROS = 0.30

/**
 * Coûts de la dimension, dans la grammaire du vecteur : [clé, poids, coût d'un
 * déficit, coût d'un excès]. Le déficit vaut **0** — dépenser moins que son
 * allocation ne coûte rien, ne rapporte rien. C'est la forme d'un PLAFOND, et
 * c'est pourquoi elle s'intègre sans réécrire le moteur : la même boucle, le
 * même plafonnement, la même échelle.
 */
export const COUT_DEFICIT = 0
export const COUT_EXCES = 1

/** Même plafond relatif que les dimensions nutritionnelles (`Math.min(cost, 2)`). */
export const PLAFOND_RELATIF = 2

/**
 * LA BORNE SUR LAQUELLE LE SOLVEUR ARBITRE : la borne HAUTE.
 *
 * Les prix sont des fourchettes (contrat §3.1 : les 1ᵉʳ et 9ᵉ déciles des
 * observations retenues). Trois arbitrages étaient possibles :
 *
 * - la borne BASSE — écartée sans hésiter : un plafond arbitré sur le décile le
 *   moins cher est un plafond qui sera franchi en magasin neuf fois sur dix.
 *   C'est la façon la plus sûre de rendre la fonctionnalité mensongère.
 * - la valeur CENTRALE — écartée aussi, pour une raison plus fine : `central`
 *   est la médiane, donc par construction la moitié des paniers réels la
 *   dépassent. Un plafond franchi une fois sur deux n'est pas un plafond, c'est
 *   une moyenne. L'utilisateur qui règle 60 € ne demande pas « 60 € en
 *   moyenne », il demande « pas plus de 60 € ».
 * - la borne HAUTE — retenue. Elle décrit le haut de la dispersion observée,
 *   c'est-à-dire le cas où l'on tombe sur les enseignes chères. Un plafond doit
 *   tenir dans ce cas-là ; sinon il ne sert à rien le jour où il servirait.
 *
 * Ce que ce choix coûte, et qu'il faut dire : la semaine sera un peu plus sobre
 * que nécessaire. C'est le sens d'erreur acceptable — se tromper vers la
 * prudence sur un plafond est réparable (l'utilisateur relève l'enveloppe),
 * l'inverse ne l'est pas (il découvre le dépassement en caisse).
 *
 * Attention à ce que cela ne veut PAS dire : le montant ANNONCÉ reste la
 * fourchette composée en quadrature (§3.2), avec sa valeur centrale. On arbitre
 * sur `high`, on affiche la fourchette entière. Confondre les deux ferait
 * afficher un total systématiquement gonflé.
 */
export const BORNE_ARBITRAGE = 'high'

/** Origine d'un dépassement — la distinction qui gouverne ce qu'on autorise. */
export const BUDGET_ORIGINS = Object.freeze({
  /** Le solveur a composé la semaine tout seul. Le dépassement est INTERDIT. */
  GENERATION: 'generation',
  /** L'utilisateur échange un plat en connaissance de cause. AUTORISÉ ET CHIFFRÉ. */
  USER: 'user_choice',
})

export const BUDGET_ISSUE_CODES = Object.freeze({
  /** L'enveloppe n'a pas pu être tenue par la génération automatique. */
  EXCEEDED: 'budget_envelope_exceeded',
  /** L'utilisateur a choisi un plat qui fait franchir l'enveloppe. */
  OVERRUN_ACCEPTED: 'budget_overrun_accepted',
})

/** Raisons d'inertie de la dimension — un budget demandé mais inarbitrable se DIT. */
export const BUDGET_INACTIVE_REASONS = Object.freeze({
  NO_INDEX: 'referentiel_absent',
  EMPTY_INDEX: 'referentiel_vide',
  STALE_INDEX: 'referentiel_perime',
  NO_ENVELOPE: 'enveloppe_absente',
})

/**
 * Contexte de budget d'une génération. Rend `null` quand aucune enveloppe n'est
 * demandée — c'est le cas normal, et il doit laisser le moteur strictement
 * inchangé, pas seulement « à peu près ».
 *
 * Quand une enveloppe est demandée mais inarbitrable (référentiel absent, vide,
 * ou périmé au sens du §5.4), on rend un contexte INACTIF motivé plutôt que
 * `null` : l'utilisateur a réglé un budget, se taire serait lui laisser croire
 * qu'il a été respecté.
 *
 * @param {Object} budget
 * @param {number} budget.weeklyEnvelopeEur — le plafond de la semaine, en euros
 * @param {Object} budget.priceIndex — index rendu par `buildPriceIndex`
 */
export function buildBudgetContext(budget) {
  if (!budget) return null
  const envelope = nombre(budget.weeklyEnvelopeEur ?? budget.envelopeEur ?? budget.envelope)
  if (envelope == null || !(envelope > 0)) {
    return budget.priceIndex
      ? { active: false, reason: BUDGET_INACTIVE_REASONS.NO_ENVELOPE, envelope: null }
      : null
  }
  const priceIndex = budget.priceIndex || null
  if (!priceIndex) return { active: false, reason: BUDGET_INACTIVE_REASONS.NO_INDEX, envelope }
  // §5.4 : passé 24 mois, la fonctionnalité s'éteint ENTIÈREMENT. Un référentiel
  // abandonné ne doit pas continuer à arbitrer une semaine avec assurance.
  if (priceIndex.stale) return { active: false, reason: BUDGET_INACTIVE_REASONS.STALE_INDEX, envelope }
  if (priceIndex.empty) return { active: false, reason: BUDGET_INACTIVE_REASONS.EMPTY_INDEX, envelope }

  return {
    active: true,
    reason: null,
    envelope,
    priceIndex,
    currency: priceIndex.currency ?? null,
    referenceDate: priceIndex.referenceDate ?? null,
    // Mémo par recette, porté par le contexte donc par la génération : les trois
    // passes de la cascade (strict / core / off) évaluent le même corpus, et
    // chiffrer une recette coûte une boucle sur ses ingrédients.
    cache: new Map(),
  }
}

/**
 * Coût estimé d'une recette entière (toutes ses portions), mémoïsé.
 *
 * Une recette est considérée CHIFFRÉE quand la couche prix accepte de
 * l'afficher (`displayable`), c'est-à-dire quand elle franchit les deux seuils
 * du §8.1 : au moins 70 % des lignes et 90 % de la masse. En deçà, le contrat
 * refuse d'annoncer un montant, et le solveur n'a aucune raison d'être moins
 * exigeant que l'interface — arbitrer sur un total dont la viande manque
 * reviendrait à croire qu'un bœuf bourguignon coûte le prix de ses carottes.
 *
 * Le résultat porte toujours son MOTIF quand il n'est pas chiffré : c'est lui
 * qui remonte jusqu'à l'explication, pour qu'une recette non chiffrée soit une
 * information et pas un silence.
 *
 * LES LIGNES FACULTATIVES SONT ÉCARTÉES, et c'est une décision, pas un oubli.
 * `allocateRecipe` les ignore déjà (`if (ingredient.optional) continue`) : elles
 * ne sont ni réservées sur le stock, ni portées à la liste de courses. Les
 * chiffrer ici ferait dire au budget qu'on achète une truffe que le plan
 * n'achète pas — deux vérités sur le même plat, exactement ce que le contrat
 * refuse au §2.4 en imposant un helper unique aux deux chemins. La couche prix,
 * elle, a raison de les garder : une fiche recette montre le plat entier.
 */
export function coutRecette(budget, recipe) {
  if (!budget?.active || !recipe) return { priced: false, range: null, reason: 'budget_inactif', coverage: null }
  const memo = budget.cache.get(recipe)
  if (memo) return memo

  const lignesRetenues = (recipe.exactIngredients || []).filter((ingredient) => !ingredient?.optional)
  const estimation = computeRecipeCost(lignesRetenues, budget.priceIndex)
  const total = estimation.coutConsomme?.total || null
  const resultat = estimation.displayable && total
    ? {
      priced: true,
      range: total,
      reason: null,
      coverage: estimation.coverage,
      // Le montant reste un MINORANT dès qu'une ligne manque ou qu'un rendement
      // de parage n'est pas sourcé (§2.3, §7.3). On le transporte : le plafond
      // est donc lui-même comparé à un minorant, ce que le rapport doit dire.
      minorant: Boolean(estimation.minorant),
    }
    : {
      priced: false,
      range: null,
      reason: estimation.displayRefusal || 'cout_inconnu',
      coverage: estimation.coverage,
      minorant: true,
    }
  budget.cache.set(recipe, resultat)
  return resultat
}

/**
 * Coût d'un créneau qui cuisine `scale` fois la recette (production batch).
 * L'homothétie passe par `diviserFourchette` — la seule mise à l'échelle de
 * fourchette du dépôt — plutôt que par une multiplication écrite ici : deux
 * façons de redimensionner une fourchette finiraient par ne plus donner le même
 * nombre.
 */
export function coutCreneau(budget, recipe, scale = 1) {
  const base = coutRecette(budget, recipe)
  const facteur = nombre(scale)
  if (!base.priced || facteur == null || facteur === 1) return base
  if (!(facteur > 0)) return base
  return { ...base, range: diviserFourchette(base.range, 1 / facteur) }
}

/**
 * L'allocation d'un créneau : la part d'enveloppe qui lui revient.
 *
 *     allocation = (enveloppe − engagé_haut) / créneaux_restants
 *
 * `engagé_haut` est la borne haute de la fourchette composée EN QUADRATURE des
 * créneaux déjà décidés (§3.2) — jamais la somme de leurs bornes hautes, qui
 * décrirait une semaine où tous les aliments seraient simultanément dans leur
 * décile le plus cher.
 *
 * Deux propriétés que cette forme donne gratuitement, et qui sont la raison de
 * la préférer à un simple prorata fixe (enveloppe / nombre de repas) :
 *
 * 1. ELLE SE CORRIGE. Un créneau sobre laisse son reliquat aux suivants, dont
 *    l'allocation monte ; un créneau dispendieux rétrécit celle des suivants,
 *    et la pression monte d'elle-même. Le dépassement se paie donc de plus en
 *    plus cher à mesure qu'on avance, sans qu'aucun seuil ait à être inventé.
 * 2. ELLE REND SES PARTS. Un créneau nourri par un reste ou par une production
 *    déjà cuisinée ne consomme rien (voir `estGratuit`) : son allocation
 *    revient aux créneaux suivants. L'anti-gaspillage finance littéralement le
 *    reste de la semaine, ce qui est le comportement qu'on veut voir.
 */
export function evaluerCreneauBudget(budget, { engage = null, slotIndex = 0, slotCount = 1, cout = null } = {}) {
  if (!budget?.active) return null
  if (!cout || !cout.priced || !cout.range) {
    // TRAITEMENT EXPLICITE DU COÛT INCONNU (et c'est le point délicat).
    //
    // La dimension est INERTE : ni pénalité, ni bonus, exactement comme une
    // dimension nutritionnelle dont la cible n'est pas renseignée est sautée
    // plutôt que notée 0/0. La recette n'est pas jugée sur l'axe des euros.
    //
    // Ce qu'on refuse de faire, et pourquoi :
    // - l'ÉCARTER (« je ne peux pas garantir l'enveloppe, donc je ne la prends
    //   pas ») biaiserait la sélection vers les seules recettes chiffrées. Avec
    //   un référentiel partiel — l'état normal, et durable —, la semaine se
    //   réduirait au sous-corpus coté. Défaut grave, et invisible : rien dans
    //   le plan ne dirait que quatre-vingts recettes ont disparu.
    // - lui IMPUTER un coût moyen serait le nombre plausible et invérifiable
    //   que le §0 du contrat proscrit nommément.
    //
    // Le résidu assumé : face à un plat chiffré NOTABLEMENT trop cher, le plat
    // non chiffré l'emporte de 21 points au plus. On ne peut pas l'éliminer
    // sans commettre l'une des deux fautes ci-dessus ; on le borne, on ne
    // l'écarte jamais, et le rapport de fin dit sur combien de repas le verdict
    // budgétaire a réellement porté.
    return {
      chargeable: true,
      applicable: false,
      priced: false,
      reason: cout?.reason || 'cout_inconnu',
      range: null,
      allowanceEur: null,
      relative: 0,
    }
  }

  const engageHaut = engage ? engage[BORNE_ARBITRAGE] : 0
  const restants = Math.max(1, slotCount - slotIndex)
  const allocation = (budget.envelope - engageHaut) / restants
  const depense = cout.range[BORNE_ARBITRAGE]

  if (!(allocation > 0)) {
    // Enveloppe déjà épuisée par les créneaux précédents. Le rapport n'a plus
    // de dénominateur, et laisser la division rendre `Infinity` ou `NaN`
    // sauterait la dimension — c'est-à-dire rendrait le dépassement GRATUIT
    // exactement au moment où il coûte le plus cher. On sature au plafond.
    return {
      chargeable: true,
      applicable: true,
      priced: true,
      reason: null,
      range: cout.range,
      allowanceEur: 0,
      relative: PLAFOND_RELATIF,
      saturee: true,
      minorant: Boolean(cout.minorant),
    }
  }

  return {
    chargeable: true,
    applicable: true,
    priced: true,
    reason: null,
    range: cout.range,
    allowanceEur: allocation,
    relative: (depense - allocation) / allocation,
    saturee: false,
    minorant: Boolean(cout.minorant),
  }
}

/**
 * Le terme « euros » du vecteur de pénalité, déjà pondéré et plafonné, dans
 * l'échelle des autres dimensions (il ne reste plus qu'à le multiplier par 35).
 *
 * Asymétrie complète : `relative < 0` (sous l'allocation) rend exactement 0.
 */
export function termeEuros(evaluation) {
  if (!evaluation?.applicable) return 0
  const relative = Number(evaluation.relative)
  if (!Number.isFinite(relative)) return 0
  // Ligne à ligne identique à la boucle nutritionnelle de `slotPenalty` — c'est
  // le même vecteur. Toute l'asymétrie tient dans `COUT_DEFICIT = 0`, écrit
  // comme une valeur du tableau et non caché dans une condition : la forme de
  // plafond se lit dans les nombres.
  const cost = relative < 0 ? -relative * COUT_DEFICIT : relative * COUT_EXCES
  if (cost <= 0) return 0
  return Math.min(cost, PLAFOND_RELATIF) * POIDS_EUROS
}

/**
 * Un créneau nourri autrement qu'en cuisinant : reste du garde-manger, portion
 * d'une production déjà réservée par son créneau producteur.
 *
 * Il ne consomme AUCUNE enveloppe, et ce n'est pas une facilité : la nourriture
 * a déjà été payée — par la semaine précédente pour un reste, par le créneau
 * producteur pour une production. La compter ici la ferait payer deux fois, et
 * l'enveloppe hebdomadaire perdrait son sens dès la deuxième semaine.
 *
 * Conséquence à assumer et à écrire : l'enveloppe porte sur le coût de ce que
 * la semaine CUISINE, pas sur le ticket de caisse. Voir `rapportBudget`.
 */
export function creneauGratuit(reason = 'deja_paye') {
  return { chargeable: false, applicable: false, priced: false, reason, range: null, allowanceEur: null, relative: 0 }
}

/**
 * LE PRÉDICAT DE DÉPASSEMENT — un seul, deux origines.
 *
 * C'est la distinction qui a déjà fait ses preuves sur les créneaux figés du
 * planificateur : « un créneau FIGÉ sur un code dessert est respecté : c'est le
 * libre arbitre de l'utilisateur — le plan de `fixed_recipe_code` est un
 * pacte. » Ce que le moteur s'interdit de faire tout seul, il l'accepte quand
 * un humain le demande — mais il le CHIFFRE, il ne le passe pas sous silence.
 *
 * - `GENERATION` : le solveur a composé la semaine. Un dépassement n'est pas
 *   autorisé ; il devient une issue bloquante et la semaine part en revue.
 * - `USER` : l'utilisateur échange un plat. Le dépassement est autorisé, et
 *   rendu avec son montant pour qu'il décide en connaissance de cause. Cacher
 *   l'alternative coûteuse déciderait à sa place.
 */
export function verdictDepassement({ budget, projected = null, origin = BUDGET_ORIGINS.GENERATION } = {}) {
  // Même forme dans les trois branches : un appelant ne doit pas avoir à
  // deviner quelles clés existent selon le cas. `applicable: false` dit qu'il
  // n'y a PAS de verdict — ce qui n'est pas la même chose qu'un verdict
  // favorable, et `exceeds: false` seul se lirait comme tel.
  const sansVerdict = (envelopeEur) => ({
    origin,
    applicable: false,
    envelopeEur,
    projected: null,
    exceeds: false,
    allowed: true,
    code: null,
    overrunEur: null,
    overrunCentralEur: null,
    remainingEur: null,
  })
  if (!budget?.active) return sansVerdict(null)
  // Rien de chiffré : aucun verdict. Prétendre que l'enveloppe est tenue parce
  // qu'on n'a rien su compter serait la pire des réponses.
  if (!projected) return sansVerdict(budget.envelope)
  const borne = projected[BORNE_ARBITRAGE]
  const exceeds = borne > budget.envelope
  return {
    origin,
    applicable: true,
    envelopeEur: budget.envelope,
    projected,
    // L'écart est rendu sur la borne d'arbitrage ET sur la valeur centrale :
    // la première dit « ce plafond ne tient pas », la seconde est le seul point
    // qui se compose exactement (§3.2, raison 1) et donc le seul qu'on puisse
    // annoncer comme un montant.
    overrunEur: exceeds ? borne - budget.envelope : 0,
    overrunCentralEur: Math.max(0, projected.central - budget.envelope),
    remainingEur: budget.envelope - borne,
    exceeds,
    allowed: origin === BUDGET_ORIGINS.USER ? true : !exceeds,
    code: exceeds
      ? (origin === BUDGET_ORIGINS.USER ? BUDGET_ISSUE_CODES.OVERRUN_ACCEPTED : BUDGET_ISSUE_CODES.EXCEEDED)
      : null,
  }
}

/**
 * Montant réglé par l'utilisateur, écrit tel quel.
 *
 * La grille d'arrondi du §7.2 s'applique aux ESTIMATIONS — elle empêche
 * d'annoncer « 43,27 € » pour un panier connu à ±15 %. Une enveloppe n'est pas
 * une estimation : c'est un nombre que l'utilisateur a tapé. L'arrondir à
 * 0,50 € afficherait 60 € pour un réglage à 59,90 € et donnerait l'impression
 * que Myko a corrigé la consigne.
 */
function montantRegle(valeur) {
  const v = nombre(valeur)
  if (v == null) return null
  return `${(Math.round(v * 100) / 100).toFixed(2).replace('.', ',').replace(/,00$/, '')} €`
}

/**
 * Rapport de fin de semaine : ce que l'enveloppe a donné.
 *
 * DEUX MESURES DE COUVERTURE, pour la même raison qu'au §6 du contrat : le
 * nombre de repas chiffrés dit de combien de plats on connaît le coût, et il
 * ment dès qu'un seul plat cher manque. On rend donc aussi la liste des repas
 * non chiffrés, nommément — c'est elle que l'utilisateur peut relire.
 *
 * Le montant est un MINORANT dès qu'un repas manque à l'appel (§3.3, §7.3) :
 * les repas non chiffrés ne peuvent qu'ajouter. D'où « au moins », qui n'est
 * pas une précaution de style mais un constat arithmétique — et d'où le fait
 * qu'un dépassement constaté sur un minorant est un dépassement CERTAIN, alors
 * qu'une enveloppe apparemment tenue sur un minorant ne prouve rien.
 */
export function rapportBudget(budget, slots = []) {
  if (!budget) return null
  if (!budget.active) {
    return {
      active: false,
      reason: budget.reason,
      envelopeEur: budget.envelope ?? null,
      estimate: null,
      exceeds: false,
      sentence: `Enveloppe non arbitrée (${budget.reason}) : aucune estimation ne peut être annoncée.`,
    }
  }

  const chargeables = slots.filter((slot) => slot.budget?.chargeable !== false)
  const chiffres = chargeables.filter((slot) => slot.budget?.priced && slot.budget.range)
  const nonChiffres = chargeables.filter((slot) => !slot.budget?.priced)
  const dejaPayes = slots.length - chargeables.length

  const estimate = composerFourchettes(chiffres.map((slot) => slot.budget.range))
  const verdict = verdictDepassement({ budget, projected: estimate, origin: BUDGET_ORIGINS.GENERATION })
  const couverturePct = chargeables.length ? Math.round((chiffres.length / chargeables.length) * 100) : null
  const complete = couverturePct === 100
  const parageInconnu = chiffres.some((slot) => slot.budget.minorant)
  const renoncements = slots
    .filter((slot) => slot.budgetForgone)
    .map((slot) => ({ slotKey: slot.key, ...slot.budgetForgone }))

  return {
    active: true,
    reason: null,
    envelopeEur: budget.envelope,
    currency: budget.currency,
    referenceDate: budget.referenceDate,
    /** La borne sur laquelle le plafond a été arbitré — jamais implicite. */
    arbitrationBound: BORNE_ARBITRAGE,
    estimate,
    exceeds: verdict.exceeds,
    overrunEur: verdict.overrunEur,
    remainingEur: verdict.remainingEur,
    meals: { total: slots.length, chargeable: chargeables.length, priced: chiffres.length, alreadyPaid: dejaPayes },
    coveragePct: couverturePct,
    unpricedMeals: nonChiffres.map((slot) => ({ slotKey: slot.key, title: slot.title ?? null, reason: slot.budget?.reason ?? 'cout_inconnu' })),
    /** Vrai dès qu'un repas manque ou qu'un parage n'est pas sourcé : le total ne peut que monter. */
    minorant: !complete || parageInconnu,
    forgone: renoncements,
    sentence: phraseBudget({ budget, estimate, verdict, chargeables: chargeables.length, chiffres: chiffres.length, complete, parageInconnu, nonChiffres }),
  }
}

/**
 * La phrase, sous le vocabulaire imposé par le §7.1 du contrat : « estimation »
 * et jamais « prix », « au moins » dès que la couverture est partielle, et la
 * date du référentiel TOUJOURS à côté du montant — un montant sans date est une
 * affirmation intemporelle, et un prix n'en est jamais une.
 */
function phraseBudget({ budget, estimate, verdict, chargeables, chiffres, complete, parageInconnu, nonChiffres }) {
  const enveloppe = montantRegle(budget.envelope)
  if (!estimate) {
    return `Estimation indisponible — aucun des ${chargeables} repas à cuisiner n'a de coût sourcé · enveloppe ${enveloppe}`
  }
  const montant = formaterEuros(estimate.central)
  const bas = formaterEuros(estimate.low)
  const haut = formaterEuros(estimate.high)
  const morceaux = [complete
    ? `Estimation ≈ ${montant} (${bas} – ${haut}) sur une enveloppe de ${enveloppe}`
    : `Au moins ${montant} (${bas} – ${haut}) sur une enveloppe de ${enveloppe}`]

  if (verdict.exceeds) {
    morceaux.push(complete
      ? `enveloppe dépassée de ${formaterEuros(verdict.overrunEur)}`
      : `enveloppe dépassée d'au moins ${formaterEuros(verdict.overrunEur)}`)
  }
  morceaux.push(complete
    ? `${chiffres} repas sur ${chargeables} chiffrés`
    : `estimation portant sur ${chiffres} des ${chargeables} repas à cuisiner`)
  if (nonChiffres.length) {
    morceaux.push(`non chiffrés : ${nonChiffres.map((slot) => slot.title).filter(Boolean).slice(0, 4).join(', ')}`)
  }
  if (parageInconnu) morceaux.push('hors pertes de parage')
  const mois = moisFrancais(budget.referenceDate)
  if (mois) morceaux.push(`référentiel ${mois}`)
  return morceaux.join(' · ')
}
