/**
 * Confrontation d'une estimation à l'enveloppe budgétaire du foyer.
 *
 * L'enveloppe vit dans `user_profiles.food_budget_*` — une GAMME (`low`/`high`)
 * et non un plafond sec. La migration qui la pose écrit pourquoi, et cette
 * fonction n'est que l'application de sa doctrine :
 *
 *     haut_panier < budget_low       → en dessous de l'enveloppe
 *     les intervalles se chevauchent → dans l'enveloppe
 *     bas_panier   > budget_high     → au-dessus de l'enveloppe
 *
 * Comparer un intervalle à un nombre unique forcerait un arbitrage impossible :
 * comparer la borne haute au plafond alerterait dès qu'un dépassement est
 * seulement possible — donc presque toujours, donc plus personne ne regarderait.
 * Le dépassement n'est affirmé que lorsque même la borne la plus favorable
 * dépasse, c'est-à-dire quand il est vrai.
 *
 * LA RÈGLE QUE LA MIGRATION NE POUVAIT PAS PORTER, ET QUI EST ICI.
 * Une estimation partiellement couverte est un MINORANT (contrat §7.3) : les
 * lignes non chiffrées ne peuvent qu'ajouter. Un minorant permet d'affirmer un
 * dépassement — si le plancher dépasse déjà le plafond, ajouter n'y changera
 * rien — mais il ne permet JAMAIS d'affirmer qu'on est en dessous : le vrai
 * panier est quelque part au-dessus, et personne ne sait de combien. Le verdict
 * `dessous` est donc réservé aux couvertures complètes. Le dire à moitié
 * couvert serait la façon la plus polie de mentir.
 */

/**
 * Une année de 52 semaines pour 12 mois : un mois vaut 52/12 ≈ 4,33 semaines.
 *
 * Le raccourci « 4 semaines par mois » circule partout et se trompe dans le sens
 * le plus difficile à repérer : celui de la bonne nouvelle. Une enveloppe de
 * 400 €/mois deviendrait 100 €/semaine au lieu de 92,31 €, et un foyer qui
 * tiendrait exactement ces 100 € toutes les semaines dépenserait 433 € par mois
 * en s'entendant dire chaque semaine qu'il est dans son enveloppe. Une erreur
 * qui alarme finit par se faire remarquer ; une erreur qui rassure, jamais.
 */
export const SEMAINES_PAR_MOIS = 52 / 12

const nombre = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)

/**
 * Normalise l'enveloppe telle qu'elle sort de `user_profiles`.
 * Rend `null` dès qu'il n'y a rien à comparer — une enveloppe sans montant ni
 * périodicité n'est pas une enveloppe vide, c'est une absence d'enveloppe, et
 * les deux se disent différemment à l'écran.
 */
export function lireEnveloppe(profil) {
  if (!profil) return null
  const bas = nombre(profil.food_budget_low ?? profil.low)
  const haut = nombre(profil.food_budget_high ?? profil.high)
  const periode = profil.food_budget_period ?? profil.period ?? null
  if (bas == null && haut == null) return null
  if (periode !== 'week' && periode !== 'month') return null
  return {
    bas,
    haut,
    periode,
    devise: profil.food_budget_currency ?? profil.currency ?? 'EUR',
    fixeeLe: profil.food_budget_set_on ?? profil.setOn ?? null,
  }
}

/**
 * Valide et met en forme ce que l'utilisateur a saisi, AVANT d'écrire en base.
 *
 * Les mêmes règles que la contrainte `user_profiles_food_budget_check`, et
 * volontairement les mêmes : la base est l'autorité, mais un refus de contrainte
 * remonte en erreur Postgres illisible. On refuse donc d'abord ici, avec un code
 * que l'écran peut traduire — et si un cas passe entre les mailles, la
 * contrainte reste là pour l'attraper. Deux filets, pas deux vérités : le jour
 * où ils divergeraient, c'est la base qui gagne, en refusant l'écriture.
 *
 * Zéro n'est pas une enveloppe : c'est soit une absence (on efface), soit une
 * déclaration qu'on ne mange pas. Il est refusé, pas transformé en NULL en
 * silence — l'utilisateur qui tape 0 veut dire quelque chose, et il vaut mieux
 * lui demander quoi.
 *
 * @returns {{low:number|null, high:number|null, period:string, currency:string}}
 * @throws {Error & {code:'validation'}} avec un `message` court et stable
 */
export function normaliserEnveloppe(saisie = {}) {
  const refus = (message) => {
    const erreur = new Error(message)
    erreur.code = 'validation'
    throw erreur
  }
  const bas = saisie.low === '' || saisie.low == null ? null : nombre(saisie.low)
  const haut = saisie.high === '' || saisie.high == null ? null : nombre(saisie.high)
  if (saisie.low != null && saisie.low !== '' && bas == null) refus('borne_basse_invalide')
  if (saisie.high != null && saisie.high !== '' && haut == null) refus('borne_haute_invalide')
  if (bas == null && haut == null) refus('enveloppe_vide')
  if (bas != null && bas <= 0) refus('borne_basse_non_positive')
  if (haut != null && haut <= 0) refus('borne_haute_non_positive')
  if (bas != null && haut != null && bas > haut) refus('bornes_inversees')

  const periode = saisie.period ?? saisie.periode ?? null
  if (periode !== 'week' && periode !== 'month') refus('periode_invalide')

  const devise = String(saisie.currency ?? saisie.devise ?? 'EUR').toUpperCase()
  if (!/^[A-Z]{3}$/.test(devise)) refus('devise_invalide')

  // Deux décimales : une enveloppe se pose en euros et en centimes, pas en
  // fractions de centime — et la colonne est en numeric(10,2).
  const arrondi = (v) => (v == null ? null : Math.round(v * 100) / 100)
  return { low: arrondi(bas), high: arrondi(haut), period: periode, currency: devise }
}

/**
 * Ramène l'enveloppe à la période comparée.
 *
 * Le prorata ne va que dans un sens ici : on ramène l'enveloppe à la période de
 * l'estimation, jamais l'inverse. Étendre une semaine de courses en mois
 * supposerait que les trois autres semaines lui ressemblent — c'est une
 * projection, pas une mesure, et le §0 interdit de la faire passer pour un
 * constat.
 */
export function proraterEnveloppe(enveloppe, periodeComparee) {
  if (!enveloppe) return null
  if (enveloppe.periode === periodeComparee) return { ...enveloppe, proratee: false }
  const facteur = enveloppe.periode === 'month' && periodeComparee === 'week'
    ? 1 / SEMAINES_PAR_MOIS
    : enveloppe.periode === 'week' && periodeComparee === 'month'
      ? SEMAINES_PAR_MOIS
      : null
  if (facteur == null) return null
  return {
    ...enveloppe,
    bas: enveloppe.bas == null ? null : enveloppe.bas * facteur,
    haut: enveloppe.haut == null ? null : enveloppe.haut * facteur,
    periode: periodeComparee,
    proratee: true,
  }
}

/**
 * Le verdict, en quatre états.
 *
 *   `dessous`     — le panier tient sous l'enveloppe. Exige une couverture
 *                   complète (cf. l'en-tête).
 *   `dedans`      — les intervalles se chevauchent.
 *   `dessus`      — même la borne basse dépasse le plafond. Le seul état qui
 *                   affirme quelque chose de désagréable, et il l'affirme quand
 *                   c'est vrai, minorant compris.
 *   `indeterminé` — il y a une enveloppe et une estimation, mais l'estimation
 *                   est un minorant qui ne tranche pas. On l'affiche quand même :
 *                   « au moins X € sur une enveloppe de Y € » informe, alors que
 *                   ne rien dire laisserait croire qu'il n'y a pas d'enveloppe.
 *
 * @param {{low:number,central:number,high:number}|null} fourchette
 * @param {Object|null} enveloppe — déjà proratée à la période comparée
 * @param {{minorant?: boolean}} options
 */
export function comparerEnveloppe(fourchette, enveloppe, { minorant = false } = {}) {
  if (!fourchette || !enveloppe) return null
  const { bas, haut } = enveloppe

  if (haut != null && fourchette.low > haut) {
    return { etat: 'dessus', enveloppe, sur: true }
  }
  if (bas != null && fourchette.high < bas) {
    // Sous la borne BASSE : ce n'est pas une bonne nouvelle en soi. Un panier
    // nettement sous l'enveloppe signale plus souvent un plan sous-approvisionné
    // ou une couverture de prix trop partielle qu'une semaine économe — raison
    // de plus pour ne pas l'affirmer sur un minorant.
    return minorant ? { etat: 'indetermine', enveloppe, sur: false } : { etat: 'dessous', enveloppe, sur: true }
  }
  if (minorant) return { etat: 'indetermine', enveloppe, sur: false }
  return { etat: 'dedans', enveloppe, sur: true }
}

const LIBELLES = Object.freeze({
  dessus: 'au-dessus de votre enveloppe',
  dedans: 'dans votre enveloppe',
  dessous: 'en dessous de votre enveloppe',
  indetermine: 'enveloppe non tranchée : l’estimation est un minorant',
})

/**
 * Écriture d'un montant d'ENVELOPPE, et non d'estimation.
 *
 * Elle n'emprunte volontairement pas `formaterEuros` du domaine. Les pas
 * d'arrondi du §7.2 (0,50 € entre 10 et 100 €, 1 € au-delà) existent pour qu'une
 * estimation n'affiche pas une précision qu'elle n'a pas. Une enveloppe n'est
 * pas une estimation : c'est un chiffre que le foyer a énoncé. L'arrondir
 * reviendrait à lui relire sa propre décision de travers — « vous aviez dit
 * 120,50 € » deviendrait « 120 € », et la comparaison porterait sur autre chose
 * que ce qui a été posé.
 */
export function formaterMontantExact(valeur) {
  const v = nombre(valeur)
  if (v == null) return null
  return `${v.toFixed(2).replace('.', ',')} €`
}

/** Le verdict en français, avec l'enveloppe écrite à côté pour qu'il soit vérifiable. */
export function texteEnveloppe(verdict, formater = formaterMontantExact) {
  if (!verdict) return null
  const { bas, haut, periode, proratee } = verdict.enveloppe
  const bornes = bas != null && haut != null
    ? `${formater(bas)} – ${formater(haut)}`
    : haut != null
      ? `plafond ${formater(haut)}`
      : `plancher ${formater(bas)}`
  const par = periode === 'week' ? 'par semaine' : 'par mois'
  return `${LIBELLES[verdict.etat]} · ${bornes} ${par}${proratee ? ' (au prorata)' : ''}`
}
