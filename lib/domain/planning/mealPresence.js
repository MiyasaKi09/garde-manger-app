/**
 * LA PRÉSENCE PAR PERSONNE ET PAR CRÉNEAU — livrable 1.5 de
 * `docs/PLAN_FINIR_MYKO.md` (§5, phase 1 ; pari 3 du §4).
 *
 * Une semaine réelle a des absences. Une application qui compte quatorze
 * assiettes pour quelqu'un qui dîne dehors deux fois se trompe trois fois : sur
 * les courses, sur les quantités et sur la nutrition. Ce module est la seule
 * source de vérité de ce que « présent » veut dire dans le moteur ; il est PUR
 * (aucun accès base, aucune date « maintenant »), et il se contente de lire des
 * déclarations.
 *
 * TROIS RÈGLES, ET ELLES SONT LE LIVRABLE
 *
 * 1. UNE DÉCLARATION, PAS UNE PRÉVISION. La table `public.meal_presence`
 *    (migration 20260917130000) porte une ligne par (personne, jour, prise).
 *    Rien n'y est déduit d'un historique, aucune règle récurrente n'y est
 *    stockée. « Tous les mardis midi au bureau » n'est pas un fait : le jour où
 *    c'est faux, plus personne ne distingue le déclaré du deviné.
 *
 * 2. AUCUNE LIGNE NE VEUT PAS DIRE « PRÉSENT ». Cela veut dire « rien n'est
 *    déclaré », et la grille reste alors celle d'avant ce livrable. Le moteur
 *    n'agit donc QUE sur `present === false` : il retire une assiette déclarée
 *    absente, il n'en ajoute jamais une que personne n'a demandée. C'est ce qui
 *    garantit qu'un foyer qui ne déclare rien obtient exactement le plan
 *    d'avant — vérifié par `tests/planning/presenceParPersonne.test.js`.
 *
 * 3. UNE PRISE RETIRÉE EMPORTE SA PART DE LA JOURNÉE. Sans cela, le solveur
 *    chercherait à tenir la cible calorique complète sur les prises restantes
 *    et servirait un déjeuner double pour compenser un dîner pris dehors : les
 *    quantités de courses MONTERAIENT au lieu de baisser. La part de chaque
 *    prise est donc déclarée ci-dessous, et le seul nombre que ce livrable
 *    ajoute y est signalé comme tel.
 */

import { expectedMealTypesForMember } from './memberPlanningRules'

/** Les quatre prises de la grille, dans l'ordre de la journée. */
export const PRISES = Object.freeze(['pdj', 'dejeuner', 'collation', 'diner'])

/**
 * Part de l'énergie d'une journée que porte chaque prise.
 *
 * D'OÙ VIENNENT CES QUATRE NOMBRES.
 *   — `pdj` 0,25 et `collation` 0,12 sont RECOPIÉS de `SUPPORT_ENERGY_SHARE`
 *     (`lib/domain/planning/supportLeftovers.js`), où ils sont déclarés depuis
 *     le lot « reste compatible » et servent déjà à juger si une portion a la
 *     bonne taille pour une prise support. La recopie évite de faire tirer
 *     `closedLoopPlanner.js` à une page de réglages ; elle est VÉRIFIÉE par
 *     `tests/planning/presenceParPersonne.test.js`, qui relit le fichier source
 *     et échoue si l'une des deux valeurs y change.
 *   — `dejeuner` et `diner` se partagent le reste (1 − 0,25 − 0,12 = 0,63) à
 *     PARTS ÉGALES. C'est le seul nombre que ce livrable ajoute, et c'est un
 *     défaut documenté, pas une mesure : rien dans ce dépôt ne déclare qu'un
 *     déjeuner pèse plus qu'un dîner, et le solveur lui-même les traite
 *     symétriquement (mêmes bornes d'échelle, mêmes pénalités, aucune asymétrie
 *     dans `optimizeDailyPortions`). Le jour où le foyer mesure une répartition
 *     réelle, elle se déclare ici et la cible se recalcule avec elle.
 *
 * CE QUE CES PARTS NE SONT PAS : une consigne de portion. Le solveur continue
 * de fixer les portions sur la nutrition réelle des plats ; ces parts ne
 * servent qu'à savoir COMBIEN de la journée sort de la semaine quand une prise
 * n'est pas prise à la maison.
 */
export const PART_ENERGIE_PRISE = Object.freeze({
  pdj: 0.25,
  dejeuner: 0.315,
  collation: 0.12,
  diner: 0.315,
})

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const round = (value, digits = 6) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Normalise des lignes de `meal_presence` (base ou fixture de test) vers le
 * vocabulaire du moteur. Une ligne dont le jour, la prise ou l'état ne sont pas
 * exploitables est ÉCARTÉE — jamais complétée : une déclaration à moitié lue
 * n'est pas une déclaration.
 */
export function normalizePresenceRows(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const date = String(row?.meal_date ?? row?.date ?? '').slice(0, 10)
      const mealType = String(row?.meal_type ?? row?.mealType ?? '')
      const presentRaw = row?.present ?? row?.presente
      if (!ISO_DATE.test(date) || !PRISES.includes(mealType) || typeof presentRaw !== 'boolean') return null
      return {
        householdMemberId: row?.household_member_id ?? row?.householdMemberId ?? null,
        personName: row?.person_name ?? row?.personName ?? null,
        date,
        mealType,
        present: presentRaw,
        note: row?.note ?? null,
      }
    })
    .filter(Boolean)
}

const cleKeyId = (id) => (id == null || id === '' ? null : `id:${String(id)}`)
const cleKeyNom = (nom) => (fold(nom) ? `nom:${fold(nom)}` : null)

/**
 * Index de consultation : `{ absent(member, date, mealType) }`.
 *
 * Deux clés par déclaration — l'identifiant du membre ET son prénom plié —
 * parce que les deux chemins existent réellement dans ce dépôt : la base
 * référence `household_member_id`, tandis que plusieurs surfaces du moteur
 * n'ont qu'un `person_name` (c'est déjà la convention de `preservedFor` dans
 * `personalizedMeals.js`). Une déclaration reste attachée au MEMBRE : le
 * prénom n'est qu'un second chemin d'accès vers la même ligne.
 */
export function buildPresenceIndex(rows = []) {
  const declarations = normalizePresenceRows(rows)
  const parCle = new Map()
  for (const declaration of declarations) {
    for (const cle of [cleKeyId(declaration.householdMemberId), cleKeyNom(declaration.personName)]) {
      if (!cle) continue
      parCle.set(`${cle}|${declaration.date}|${declaration.mealType}`, declaration)
    }
  }
  const lookup = (member, date, mealType) => {
    for (const cle of [cleKeyId(member?.id ?? member?.household_member_id), cleKeyNom(member?.name ?? member?.person_name)]) {
      if (!cle) continue
      const found = parCle.get(`${cle}|${date}|${mealType}`)
      if (found) return found
    }
    return null
  }
  return {
    declarations,
    /** Le membre est-il DÉCLARÉ absent à cette prise ? `false` si rien n'est déclaré. */
    absent: (member, date, mealType) => lookup(member, date, mealType)?.present === false,
    /** La déclaration elle-même, ou `null` — pour afficher ce qui a été dit. */
    declaration: lookup,
    get size() { return declarations.length },
  }
}

/**
 * Les prises qu'un membre prend NORMALEMENT à la maison, absences mises à part.
 *
 * C'est le dénominateur de la part de journée : on y met ce que le moteur ÉMET
 * réellement aujourd'hui, pas ce que les réglages décrivent. `rules.lunch` et
 * `rules.dinner` existent dans `memberPlanningRules.js` mais
 * `buildPersonalizedMeals` émet les deux prises principales quoi qu'il arrive :
 * les lire ici changerait le comportement d'un foyer qui n'a rien déclaré, ce
 * que ce livrable s'interdit. Le petit-déjeuner et la collation, eux, sont bien
 * conditionnés par les réglages dans l'émission — on les lit donc.
 */
export function expectedTakesForMember(rules = {}) {
  return [
    ...(rules?.breakfast ? ['pdj'] : []),
    'dejeuner',
    ...(rules?.snack ? ['collation'] : []),
    'diner',
  ]
}

const sommeDesParts = (prises) => (prises || [])
  .reduce((somme, prise) => somme + (PART_ENERGIE_PRISE[prise] || 0), 0)

/**
 * Part de la journée d'un membre qui reste à la maison, entre 0 et 1.
 *
 * Renormalisée sur SES prises : un membre qui ne prend pas de petit-déjeuner
 * répartit déjà sa journée sur trois prises, et son dîner pèse donc plus lourd
 * que celui d'un membre qui en prend quatre. Conséquence directe et voulue :
 * sans aucune absence, la part vaut exactement 1 et la cible ne bouge pas —
 * c'est ce qui rend ce livrable sans effet sur un foyer qui ne déclare rien.
 */
export function shareOfDayAtHome({ expectedTakes = [], absentTakes = [] } = {}) {
  const total = sommeDesParts(expectedTakes)
  if (!(total > 0)) return 1
  const absentes = (absentTakes || []).filter((prise) => expectedTakes.includes(prise))
  return round(Math.max(0, total - sommeDesParts(absentes)) / total)
}

/** Applique la part de journée à une cible nutritionnelle (kcal et macros). */
export function scaleTargetToShare(target, share) {
  const facteur = Number.isFinite(Number(share)) ? Number(share) : 1
  if (facteur === 1) return target
  return Object.fromEntries(Object.entries(target || {})
    .map(([cle, valeur]) => [cle, Number.isFinite(Number(valeur)) ? round(Number(valeur) * facteur, 3) : valeur]))
}

/**
 * Nombre de prises que la fenêtre ne servira PAS, toutes personnes confondues.
 *
 * Sert à une seule chose, et il faut la dire : la page du planning compare le
 * nombre de prises publiées au nombre attendu (`expectedMealCountForWindow`)
 * pour annoncer la semaine « complète ». Sans cette soustraction, deux dîners
 * déclarés hors domicile feraient afficher « semaine incomplète — 2 prises
 * manquantes » à un foyer qui a lui-même demandé leur retrait.
 *
 * On compte avec `expectedMealTypesForMember`, la MÊME fonction que le compte
 * attendu : une absence déclarée sur une prise que la personne ne prend de
 * toute façon pas (une collation pour qui n'en prend pas) ne retire rien, sans
 * quoi le compte attendu passerait sous le nombre réellement servi.
 */
export function declaredAbsentTakeCount({ presence = [], members = [], dates = [] }) {
  const index = buildPresenceIndex(presence)
  if (!index.size) return 0
  let total = 0
  for (const member of members || []) {
    if (member?.active === false) continue
    const prises = expectedMealTypesForMember(member)
    for (const date of dates || []) {
      for (const prise of prises) {
        if (index.absent(member, date, prise)) total += 1
      }
    }
  }
  return total
}

/**
 * Membres déclarés absents à un créneau (jour + prise), et membres restants.
 *
 * `members` est la liste connue du foyer. Quand elle est vide, on ne peut pas
 * dire « tout le monde est absent » : le module rend alors `everyoneAway:
 * false` plutôt que de conclure sur une liste qu'il n'a pas.
 */
export function slotAbsence({ index, members = [], date, mealType }) {
  const connus = Array.isArray(members) ? members : []
  const absents = connus.filter((member) => index.absent(member, date, mealType))
  return {
    absentMembers: absents.map((member) => ({
      household_member_id: member?.id ?? member?.household_member_id ?? null,
      person_name: member?.name ?? member?.person_name ?? null,
    })),
    everyoneAway: connus.length > 0 && absents.length === connus.length,
  }
}
