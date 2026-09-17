/**
 * LA CAPACITÉ DE CUISINE DÉCLARÉE, ENFIN LUE — livrable 2.2 de
 * `docs/PLAN_FINIR_MYKO.md` (§5, phase 2 ; C4.2 du plan de septembre).
 *
 * CE QUI EXISTAIT AVANT CE FICHIER. Le questionnaire de goûts demande depuis
 * des mois « quels jours avez-vous le temps de cuisiner ? » et « quels jours
 * faut-il un repas rapide ? » (`app/settings/tastes/questionnaire.js`, clés
 * `cooking_days` et `quick_days`). Les réponses sont stockées au profil et
 * relues par `memberPlanningRules.js:95-96` sous les noms `cookingDays` et
 * `quickDays` — et là s'arrêtait leur vie : `grep -rn "cookingDays"` ne
 * renvoyait, avant ce livrable, que leur construction et les tests qui la
 * vérifient. Pendant ce temps, le nombre de productions d'un plan valait 2 et
 * le nombre de créneaux qu'une production peut nourrir valait 3, écrits en dur
 * dans `closedLoopPlanner.js`. Demander une information et ne pas s'en servir
 * est pire que ne pas la demander : cela donne à l'utilisateur la certitude
 * fausse d'avoir été entendu.
 *
 * CE QUE CE MODULE FAIT. Il transforme ces déclarations en BORNES, et les
 * bornes deviennent une conséquence de ce que le foyer a dit. Il est PUR :
 * aucun accès base, aucune date « maintenant », aucune lecture de fichier. Il
 * ne connaît aucun prénom.
 *
 * LES QUATRE RÈGLES, ET ELLES SONT LE LIVRABLE
 *
 * R0. RIEN DE DÉCLARÉ = RIEN DE CHANGÉ. Une liste vide n'est pas « aucun
 *     jour », c'est « aucune contrainte » — `memberPlanningRules.js` le dit
 *     déjà de ses deux listes, et l'inverser ferait dire à un foyer silencieux
 *     qu'il ne cuisine jamais. Tant qu'aucun membre présent n'a déclaré un
 *     seul jour, les bornes restent EXACTEMENT celles d'avant ce livrable
 *     (2 productions par plan, 3 consommateurs par production) et le plan
 *     produit est identique, octet pour octet.
 *
 * R1. UN SOIR DÉCLARÉ « RAPIDE » NE PORTE AUCUNE PRODUCTION. C'est le critère
 *     d'acceptation du livrable, mot pour mot. Il ne porte pas non plus la
 *     cuisson d'une base partagée : cuire une sauce tomate de vingt minutes un
 *     soir où l'on a déclaré n'avoir pas le temps est la même contradiction.
 *     En revanche, ce soir-là REÇOIT sans réserve des portions produites
 *     ailleurs et REPREND une base déjà cuite : réchauffer n'est pas cuisiner,
 *     et c'est même à cela que sert un batch.
 *
 * R2. UNE SESSION DÉCLARÉE PORTE 2 À 3 PRODUCTIONS ET 2 BASES. Quand au moins
 *     un jour de cuisine est déclaré, les productions ne démarrent QUE ces
 *     jours-là, au plus trois par session, et le plan en porte au plus trois
 *     fois le nombre de sessions de la fenêtre. Le « 2 à 3 » du critère est
 *     une fourchette d'usage, pas deux bornes : trois est le plafond, deux est
 *     ce qu'une session ordinaire atteint. On ne plancherise pas à deux — un
 *     plancher forcerait une deuxième production même quand le stock, la
 *     conservation ou la variété n'en veulent pas, et fabriquerait un chiffre
 *     pour tenir un critère.
 *
 *     CE QUE « ET 2 BASES » VEUT DIRE ICI, ET CE QU'IL NE VEUT PAS DIRE. Le
 *     plafond de deux bases est un plafond PAR JOUR, pas une réserve de la
 *     session : `maxBasesPerSession` borne ce qu'un même jour peut cuire, et
 *     `allowsCookingBaseOn` ne refuse une cuisson de base QUE les soirs
 *     rapides. Une base peut donc se cuire un jour qui n'est pas déclaré jour
 *     de cuisine, et c'est délibéré : cuire la sauce d'un gratin le soir où
 *     l'on mange ce gratin fait partie de la préparation du plat. L'interdire
 *     hors session ne bornerait pas un batch — cela retirerait le plat du
 *     créneau, ce que le critère ne demande nulle part. MESURÉ sur le corpus
 *     synthétique de `tests/planning/capaciteCuisine.test.js`, une semaine dont
 *     le lundi seul est déclaré jour de cuisine cuit ses deux bases le mercredi
 *     et le jeudi, un jour chacune : ce n'est pas un contournement de la
 *     déclaration, c'est la préparation de ces deux plats-là.
 *
 * R3. UNE PRODUCTION NOURRIT JUSQU'À LA PROCHAINE SESSION, PAS AU-DELÀ.
 *     C'est la borne qui remplace `MAX_PRODUCTION_CONSUMERS = 3`. Trois
 *     n'était pas une décision : c'était une prudence posée quand personne ne
 *     savait de combien de temps le foyer disposait. Une fois les sessions
 *     déclarées, la vraie borne se lit : on cuisine à la session suivante, il
 *     n'y a donc aucune raison de faire durer les portions au-delà. Les autres
 *     bornes — conservation déclarée, minutes de la session, règles de
 *     répétition — continuent de s'appliquer par-dessus, et ce sont elles qui
 *     mordent le plus souvent (`maxConsumptionsPerRecipe` vaut 2 en mode
 *     strict : une production ne couvre déjà pas plus d'un consommateur sans
 *     franchir une règle de variété).
 *
 * L'UNION, ET LE CONFLIT
 *
 * « La capacité du foyer est l'union de celles de ses membres présents »
 * (C4.2). Une disponibilité s'additionne : si l'un des deux a le temps samedi,
 * le foyer a une session samedi. Un « rapide », lui, est un REFUS, et un refus
 * ne s'additionne pas de la même façon — il retire. La capacité du foyer est
 * donc l'union des jours de cuisine MOINS l'union des soirs rapides, et un
 * jour déclaré des deux côtés par deux personnes est un CONFLIT : il est
 * tranché en faveur du refus (le critère du livrable est littéral) et il est
 * LISTÉ dans `conflicts`, jamais absorbé en silence. Un conflit qu'on ne voit
 * pas est une déclaration perdue.
 *
 * QUI COMPTE CE JOUR-LÀ. Seulement les membres PRÉSENTS, au sens du livrable
 * 1.5 : quelqu'un qui ne prend aucune de ses prises à la maison ce jour-là
 * n'est pas là pour cuisiner, et sa disponibilité déclarée ne vaut pas pour ce
 * jour. Une personne absente à une seule de ses prises reste, elle, comptée :
 * un déjeuner au bureau n'empêche pas de cuisiner le soir.
 */

import { expectedMealTypesForMember, getMemberPlanningRules } from './memberPlanningRules'
import { buildPresenceIndex } from './mealPresence'

/**
 * Les deux bornes d'avant ce livrable, reprises à l'identique de
 * `closedLoopPlanner.js` (« Bornes conservatrices (audit P2, pas de
 * sur-ingénierie) »). Elles ne sont pas mortes : elles restent la réponse
 * quand rien n'est déclaré, et c'est ce qui rend ce livrable sans effet sur un
 * foyer qui n'a pas répondu au questionnaire.
 */
export const PRODUCTIONS_PAR_PLAN_SANS_CAPACITE = 2
export const CONSOMMATEURS_PAR_PRODUCTION_SANS_CAPACITE = 3

/**
 * Ce qu'une session DÉCLARÉE porte, du critère d'acceptation du livrable 2.2 :
 * « une session déclarée porte 2-3 productions + 2 bases ».
 *
 * Ces deux nombres sont des DÉFAUTS documentés, pas des lois de la nature :
 * ils décrivent ce qu'une session du foyer porte aujourd'hui. Le jour où une
 * personne veut en déclarer d'autres, ils se règlent au profil comme le quota
 * carné du livrable 1.1 — le moteur lira le réglage, et cette constante
 * redeviendra ce qu'elle doit être : la valeur employée quand rien n'est dit.
 */
export const PRODUCTIONS_PAR_SESSION_DECLAREE = 3
export const BASES_PAR_SESSION_DECLAREE = 2

/** Jour ISO (1 = lundi … 7 = dimanche) d'une date, lue en UTC. */
export function isoWeekday(date) {
  const valeur = new Date(`${String(date).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(valeur.getTime())) return null
  const jour = valeur.getUTCDay()
  return jour === 0 ? 7 : jour
}

const dateIso = (value) => {
  const texte = String(value ?? '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(texte) ? texte : null
}

/**
 * Le membre prend-il au moins une de ses prises à la maison ce jour-là ?
 *
 * C'est la définition de « présent » retenue pour la capacité, et elle est
 * plus large que celle d'un créneau : on ne cuisine pas seulement pour le
 * repas qu'on mange. Sans aucune déclaration de présence, tout le monde est
 * présent tous les jours — la règle R0 vaut aussi ici.
 */
function presentCeJour(member, index, date) {
  const prises = expectedMealTypesForMember(member)
  if (!prises.length) return true
  return prises.some((prise) => !index.absent(member, date, prise))
}

/**
 * Capacité de cuisine du foyer sur une fenêtre de dates.
 *
 * @param {object[]} members  membres actifs, avec leurs `preferences.planning`
 * @param {object[]} presence lignes de `public.meal_presence` (livrable 1.5)
 * @param {string[]} dates    dates ISO de la fenêtre (une par jour, ordre libre)
 */
export function buildHouseholdCookingCapacity({ members = [], presence = [], dates = [] } = {}) {
  const index = buildPresenceIndex(presence)
  const jours = [...new Set((Array.isArray(dates) ? dates : []).map(dateIso).filter(Boolean))].sort()
  const actifs = (Array.isArray(members) ? members : []).filter((member) => member?.active !== false)

  const parMembre = actifs.map((member) => {
    const rules = getMemberPlanningRules(member)
    return {
      id: member?.id ?? null,
      name: member?.name ?? null,
      cookingDays: rules.cookingDays,
      quickDays: rules.quickDays,
    }
  })

  const sessionDates = []
  const quickDates = []
  const conflicts = []

  for (const date of jours) {
    const jourIso = isoWeekday(date)
    if (jourIso == null) continue
    // Seuls les membres présents ce jour-là parlent pour ce jour-là.
    const presents = actifs.filter((member) => presentCeJour(member, index, date))
    const noms = (liste) => liste.map((member) => member?.name ?? null).filter(Boolean)
    const cuisiniers = presents.filter((member) => getMemberPlanningRules(member).cookingDays.includes(jourIso))
    const presses = presents.filter((member) => getMemberPlanningRules(member).quickDays.includes(jourIso))
    if (presses.length) {
      quickDates.push(date)
      // Déclaré des deux côtés : on tranche pour le refus, et on le DIT.
      if (cuisiniers.length) {
        conflicts.push({
          date,
          sessionMembers: noms(cuisiniers),
          quickMembers: noms(presses),
          resolution: 'rapide_prime',
        })
      }
      continue
    }
    if (cuisiniers.length) sessionDates.push(date)
  }

  // Une déclaration existe-t-elle seulement ? On distingue les deux axes : un
  // foyer peut n'avoir déclaré que des soirs rapides sans avoir dit un mot de
  // ses jours de cuisine, et conclure alors « aucune session » reviendrait à
  // fabriquer une capacité de zéro à partir d'un silence.
  const sessionsDeclarees = parMembre.some((membre) => membre.cookingDays.length > 0) && sessionDates.length > 0
  const rapidesDeclares = quickDates.length > 0

  return Object.freeze({
    declared: sessionsDeclarees || rapidesDeclares,
    sessionsDeclared: sessionsDeclarees,
    quickDeclared: rapidesDeclares,
    sessionDates: Object.freeze(sessionDates),
    quickDates: Object.freeze(quickDates),
    conflicts: Object.freeze(conflicts),
    byMember: Object.freeze(parMembre),
    // Les bornes, telles qu'elles seront lues par le solveur. Calculées ici
    // pour qu'elles soient VISIBLES : la route les publie dans l'explication
    // du plan, et personne n'a à rouvrir le moteur pour savoir d'où vient un 6.
    maxProductionsPerSession: sessionsDeclarees ? PRODUCTIONS_PAR_SESSION_DECLAREE : PRODUCTIONS_PAR_PLAN_SANS_CAPACITE,
    maxPlanProductions: sessionsDeclarees
      ? PRODUCTIONS_PAR_SESSION_DECLAREE * sessionDates.length
      : PRODUCTIONS_PAR_PLAN_SANS_CAPACITE,
    maxBasesPerSession: sessionsDeclarees ? BASES_PAR_SESSION_DECLAREE : null,
  })
}

/** Capacité non déclarée : les bornes d'avant le livrable, et rien d'autre. */
export const CAPACITE_NON_DECLAREE = Object.freeze({
  declared: false,
  sessionsDeclared: false,
  quickDeclared: false,
  sessionDates: new Set(),
  quickDates: new Set(),
  conflicts: Object.freeze([]),
  maxPlanProductions: PRODUCTIONS_PAR_PLAN_SANS_CAPACITE,
  maxProductionsPerSession: PRODUCTIONS_PAR_PLAN_SANS_CAPACITE,
  maxProductionConsumers: CONSOMMATEURS_PAR_PRODUCTION_SANS_CAPACITE,
  maxBasesPerSession: null,
  sessionsWithoutLaterSlot: Object.freeze([]),
  allowsProductionOn: () => true,
  allowsCookingBaseOn: () => true,
  productionHorizon: () => null,
})

/**
 * Forme consultable par le solveur. Elle accepte aussi bien l'objet rendu par
 * `buildHouseholdCookingCapacity` (ce que la route passe) qu'une capacité déjà
 * résolue, et rend TOUJOURS un objet complet : le moteur n'a jamais à tester
 * l'existence d'un champ, et une capacité absente se comporte comme le
 * comportement d'avant ce livrable.
 *
 * `slots.length` borne le nombre de consommateurs quand les sessions sont
 * déclarées : la vraie borne est alors la prochaine session
 * (`productionHorizon`), et non un compte — mais un compte reste nécessaire
 * pour les quotas hebdomadaires du solveur, et la fenêtre elle-même est la
 * seule borne honnête qu'on puisse lui donner.
 */
export function resolveCookingCapacity(capacity, slots = []) {
  if (!capacity || capacity.declared !== true) return CAPACITE_NON_DECLAREE
  const sessions = new Set([...(capacity.sessionDates || [])].map(dateIso).filter(Boolean))
  const rapides = new Set([...(capacity.quickDates || [])].map(dateIso).filter(Boolean))
  const sessionsTriees = [...sessions].sort()
  const sessionsDeclarees = capacity.sessionsDeclared === true && sessionsTriees.length > 0
  const creneaux = Array.isArray(slots) ? slots.length : 0
  /**
   * SESSIONS QUI NE PEUVENT RIEN PRODUIRE, ET IL FAUT LE DIRE.
   *
   * Une production nourrit des créneaux ULTÉRIEURS — le moteur ne regarde que
   * vers l'avant (`selectProductionConsumers`, boucle `slotIndex + 1`). Une
   * session déclarée le DERNIER jour de la fenêtre n'a donc aucun repas à
   * nourrir, et une session déclarée l'avant-dernier jour ne peut nourrir que
   * le même jour ou le lendemain, ce que les règles de répétition écartent le
   * plus souvent.
   *
   * MESURÉ le 17 septembre 2026 sur le corpus du dépôt (568 publiables), trois
   * semaines, fenêtre lundi → dimanche : avec `cooking_days: [7]` — le rythme
   * que le §8 du plan décrit pour ce foyer, « session de cuisine le dimanche »
   * — la semaine publie **zéro production** au lieu de deux. Ce n'est pas une
   * dégradation (0 créneau en revue sur 42, aucune règle relâchée) : c'est la
   * conséquence exacte de la déclaration, et de la fenêtre qui commence le
   * lundi. Cuisiner le dimanche POUR LA SEMAINE SUIVANTE demande une fenêtre
   * qui commence le jour de la session, ou le volet congélation « semaine
   * suivante » — ni l'un ni l'autre n'est dans ce livrable.
   *
   * Ce champ existe pour que ce zéro se LISE. Une capacité déclarée qui ne
   * produit rien sans que personne ne dise pourquoi serait une déclaration
   * perdue de plus.
   */
  const derniereDate = (Array.isArray(slots) ? slots : [])
    .map((slot) => dateIso(slot?.date))
    .filter(Boolean)
    .sort()
    .at(-1) || null
  const sessionsSansCreneauUlterieur = derniereDate
    ? sessionsTriees.filter((session) => session >= derniereDate)
    : []

  return Object.freeze({
    declared: true,
    sessionsDeclared: sessionsDeclarees,
    quickDeclared: rapides.size > 0,
    sessionDates: sessions,
    quickDates: rapides,
    conflicts: Object.freeze([...(capacity.conflicts || [])]),
    sessionsWithoutLaterSlot: Object.freeze(sessionsSansCreneauUlterieur),
    maxProductionsPerSession: sessionsDeclarees
      ? PRODUCTIONS_PAR_SESSION_DECLAREE
      : PRODUCTIONS_PAR_PLAN_SANS_CAPACITE,
    maxPlanProductions: sessionsDeclarees
      ? PRODUCTIONS_PAR_SESSION_DECLAREE * sessionsTriees.length
      : PRODUCTIONS_PAR_PLAN_SANS_CAPACITE,
    // R3 : la borne de consommateurs n'est plus une prudence quand les
    // sessions sont déclarées — c'est l'horizon qui décide, et la fenêtre
    // borne le compte.
    maxProductionConsumers: sessionsDeclarees
      ? Math.max(1, creneaux)
      : CONSOMMATEURS_PAR_PRODUCTION_SANS_CAPACITE,
    maxBasesPerSession: sessionsDeclarees ? BASES_PAR_SESSION_DECLAREE : null,
    /** R1 + R2 : où une production peut être CUITE. */
    allowsProductionOn: (date) => {
      const jour = dateIso(date)
      if (jour && rapides.has(jour)) return false
      if (!sessionsDeclarees) return true
      return Boolean(jour && sessions.has(jour))
    },
    /** R1 : un soir rapide reprend une base, il n'en cuit pas. */
    allowsCookingBaseOn: (date) => {
      const jour = dateIso(date)
      return !(jour && rapides.has(jour))
    },
    /**
     * R3 : date de la prochaine session déclarée APRÈS `date`, ou `null`
     * quand il n'y en a pas — les portions peuvent alors courir jusqu'au bout
     * de la fenêtre, sous les autres bornes.
     */
    productionHorizon: (date) => {
      if (!sessionsDeclarees) return null
      const jour = dateIso(date)
      if (!jour) return null
      return sessionsTriees.find((session) => session > jour) || null
    },
  })
}
