/**
 * LA DATE DE VERSEMENT, ET CE QU'UN ÉCRAN « NOUVEAUTÉS » PEUT EN DIRE.
 *
 * CE QUI A ÉTÉ MESURÉ AVANT D'ÉCRIRE CE FICHIER, et qui décide de tout.
 * Le plan (§5, phase 5) demande un écran « Nouveautés de la semaine » filtré
 * « sur la date de versement ». Cette date n'existait nulle part :
 *
 *   — le corpus (`data/recipes/corpus-v3.json`, 754 recettes) ne porte aucun
 *     champ de date : les 21 clés présentes sur les 754 recettes sont `code`,
 *     `family`, `cuisine_origin`, `identity_level`, `category`, `status`,
 *     `confidence`, `servings`, `prep_minutes`, `cook_minutes`, `difficulty`,
 *     `sources`, `canonical_arbitration`, `ingredients`, `steps`, `techniques`,
 *     `variants`, `sensory`, `conservation`, `allergens`,
 *     `conservation_profile` — et aucune des 6 clés facultatives (`plate`,
 *     `description_courte`, `derived_from`, `derivation`, `formes_manquantes`)
 *     n'est une date ;
 *   — les fichiers de lot (`data/recipes/batches/*.json`) portent `lot`,
 *     `intention`, `refuses`, `recipes` : pas de date non plus ;
 *   — en base, `culinary.recipe_versions.created_at` vaut la date du
 *     CHARGEMENT, pas celle du versement : les 754 lignes portent la même,
 *     celle des dix tranches de migration du livrable 0a.2 ; et
 *     `published_at` est NULL sur les 754 ;
 *   — `ops.source_datasets.current_version` vaut `v3-300-real-dishes` pour le
 *     corpus éditorial : une étiquette, pas une date, et une seule pour tout le
 *     catalogue.
 *
 * Filtrer sur ce qui existait aurait donc rendu 754 recettes « nouvelles cette
 * semaine » (par `created_at`) ou 0 (par `published_at`). Dans les deux cas
 * l'écran ne dit rien. La date de versement a donc été POSÉE — registre
 * `data/recipes/versements.json`, colonne `culinary.recipe_versions.corpus_poured_on`
 * — et elle n'est écrite que là où elle est CONNUE ET VÉRIFIABLE. Elle ne l'est
 * aujourd'hui que pour un lot : les 48 jumeaux végétariens du commit 65d5c05,
 * versés le 4 septembre 2026. Les 706 autres recettes n'ont pas de date, et
 * elles n'en recevront pas rétroactivement : personne ne sait quel jour elles
 * sont entrées, et l'inventer ferait exactement ce que le plan interdit.
 *
 * CE FICHIER NE FAIT QUE DE L'ARITHMÉTIQUE. Il ne lit ni base ni fichier : on
 * lui donne des cartes et un instant, il rend ce que l'écran doit montrer. Les
 * dates sont des journées civiles (`YYYY-MM-DD`), comparées comme des chaînes
 * en UTC — piège n°4 du CLAUDE.md : une comparaison passant par l'heure locale
 * décale d'un jour selon le fuseau, et « versé lundi » deviendrait « versé
 * dimanche » pour qui vit à l'ouest de Greenwich.
 *
 * LE PIÈGE DE `Number()` EST ÉVITÉ PAR CONSTRUCTION : aucune date n'est
 * convertie en nombre. `dateDeVersement` n'accepte qu'une chaîne de la forme
 * `YYYY-MM-DD` dont les trois nombres désignent un vrai jour du calendrier —
 * `true`, `''`, `[]`, `0` et `'2026-02-30'` rendent tous `null`, c'est-à-dire
 * « cette recette n'a pas de date », et jamais une date de repli.
 */

const MOTIF_JOUR = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PAR_JOUR = 86400000

/**
 * La date de versement d'une carte, ou `null` si elle n'en a pas.
 *
 * STRICTE PAR CHOIX. Une valeur qui n'est pas une journée civile bien formée
 * est une ABSENCE, pas une approximation : un écran qui montre « nouveautés »
 * doit pouvoir répondre « aucune » plutôt que de montrer une recette dont il ne
 * sait rien. Le premier segment d'un horodatage est accepté (`2026-09-04T12:56:56Z`
 * → `2026-09-04`) parce que c'est ce que rendrait une colonne `timestamptz` si
 * la base venait à en porter une ; tout le reste est refusé.
 */
export function dateDeVersement(valeur) {
  if (typeof valeur !== 'string') return null
  const jour = valeur.trim().split('T')[0]
  const trouve = MOTIF_JOUR.exec(jour)
  if (!trouve) return null
  const [, annee, mois, jourDuMois] = trouve
  const instant = Date.UTC(Number(annee), Number(mois) - 1, Number(jourDuMois))
  if (!Number.isFinite(instant)) return null
  // Le contrôle qui refuse le 30 février : `Date.UTC` le décale au 2 mars sans
  // se plaindre. On exige que la date RECONSTRUITE redise la chaîne reçue —
  // une seule comparaison, parce que trois contrôles séparés (année, mois,
  // jour) se recouvraient : mesuré, retirer celui du jour ne faisait rougir
  // aucun cas, tout débordement de jour changeant déjà le mois.
  const rendu = new Date(instant).toISOString().slice(0, 10)
  if (rendu !== jour) return null
  return jour
}

/** L'instant UTC de minuit d'une journée civile, ou `null` si elle est mal formée. */
function instantDe(jour) {
  const valide = dateDeVersement(jour)
  if (valide === null) return null
  const [annee, mois, jourDuMois] = valide.split('-')
  return Date.UTC(Number(annee), Number(mois) - 1, Number(jourDuMois))
}

/** Une journée civile depuis un instant UTC. */
function jourDe(instant) {
  return new Date(instant).toISOString().slice(0, 10)
}

/**
 * Le lundi de la semaine qui contient `jour`, en UTC.
 *
 * LUNDI, PAS DIMANCHE : c'est la semaine ISO, celle du calendrier français, et
 * celle du rythme que le §8 du plan retient (génération le samedi, courses le
 * samedi, cuisine le dimanche). Un lot versé le dimanche appartient donc à la
 * semaine qui se termine, pas à celle qui commence.
 */
export function debutDeSemaine(jour) {
  const instant = instantDe(jour)
  if (instant === null) return null
  const jourDeSemaine = new Date(instant).getUTCDay() // 0 = dimanche
  const reculJours = jourDeSemaine === 0 ? 6 : jourDeSemaine - 1
  return jourDe(instant - reculJours * MS_PAR_JOUR)
}

/**
 * Le nombre de jours civils entre deux journées, en UTC. `null` si l'une des
 * deux est mal formée — on ne rend pas 0, qui se confondrait avec « le même
 * jour ».
 */
export function joursEntre(depuis, jusqua) {
  const a = instantDe(depuis)
  const b = instantDe(jusqua)
  if (a === null || b === null) return null
  return Math.round((b - a) / MS_PAR_JOUR)
}

/**
 * L'instant de référence, en journée civile UTC.
 *
 * Il REFUSE ce qu'il ne sait pas lire au lieu de retomber sur « maintenant » :
 * un appelant qui passe une date illisible obtiendrait sinon un écran qui a
 * l'air juste et qui répond à une autre question que la sienne.
 */
function jourCourant(maintenant) {
  if (typeof maintenant === 'string') {
    const jour = dateDeVersement(maintenant)
    if (jour === null) throw new TypeError(`Date de référence illisible: ${maintenant}`)
    return jour
  }
  const instant = maintenant instanceof Date ? maintenant.getTime() : NaN
  if (!Number.isFinite(instant)) throw new TypeError('Date de référence illisible')
  return jourDe(instant)
}

/**
 * Ce que l'écran « Nouveautés » doit montrer, à partir des cartes du catalogue.
 *
 * `cartes` : des objets portant `poured_on` (la carte du catalogue) ou
 * `pouredOn` (le contrat de lecture de la RPC). Les deux sont acceptés parce
 * que les deux existent dans le dépôt, et qu'une carte qui n'a ni l'un ni
 * l'autre est simplement sans date.
 *
 * LE VERDICT EST EXPLICITE, et c'est le cœur de ce module : `affichage` dit
 * laquelle des trois situations on est en train de montrer.
 *
 *   `semaine`      — au moins une recette a été versée depuis lundi ; c'est
 *                    elles qu'on montre, et le titre de l'écran est vrai.
 *   `dernier_lot`  — aucune cette semaine ; on montre le dernier lot connu avec
 *                    sa date et son âge, et l'écran DIT que la semaine est
 *                    vide. Montrer le dernier lot sans le dater serait laisser
 *                    croire à une nouveauté qui n'en est pas une.
 *   `aucune_date`  — aucune recette du catalogue ne porte de date.
 *
 * `catalogue.nonDatees` n'est pas un détail : tant qu'il vaut 706, l'écran ne
 * parle que d'une petite part du catalogue, et le cacher donnerait à un lot
 * l'air d'être tout ce qui existe.
 */
export function nouveautes(cartes = [], { maintenant = new Date() } = {}) {
  const aujourdHui = jourCourant(maintenant)
  const debut = debutDeSemaine(aujourdHui)

  const liste = Array.isArray(cartes) ? cartes : []
  const datees = []
  let nonDatees = 0
  for (const carte of liste) {
    const date = dateDeVersement(carte?.poured_on ?? carte?.pouredOn)
    if (date === null) { nonDatees += 1; continue }
    datees.push({ ...carte, verseLe: date })
  }

  // Tri : le plus récent d'abord, puis par titre pour que deux recettes du même
  // lot gardent un ordre stable d'un chargement à l'autre.
  datees.sort((a, b) => (a.verseLe === b.verseLe
    ? String(a.title || a.id || '').localeCompare(String(b.title || b.id || ''), 'fr')
    : (a.verseLe < b.verseLe ? 1 : -1)))

  const catalogue = { total: liste.length, datees: datees.length, nonDatees }
  if (datees.length === 0) {
    return {
      aujourdHui,
      debutSemaine: debut,
      catalogue,
      dernierVersement: null,
      recettes: [],
      compte: 0,
      affichage: 'aucune_date',
    }
  }

  const dateDuDernier = datees[0].verseLe
  const dernierLot = datees.filter((carte) => carte.verseLe === dateDuDernier)
  const dernierVersement = {
    date: dateDuDernier,
    compte: dernierLot.length,
    joursDepuis: joursEntre(dateDuDernier, aujourdHui),
  }

  const deLaSemaine = datees.filter((carte) => carte.verseLe >= debut)
  if (deLaSemaine.length > 0) {
    return {
      aujourdHui,
      debutSemaine: debut,
      catalogue,
      dernierVersement,
      recettes: deLaSemaine,
      compte: deLaSemaine.length,
      affichage: 'semaine',
    }
  }

  return {
    aujourdHui,
    debutSemaine: debut,
    catalogue,
    dernierVersement,
    recettes: dernierLot,
    compte: dernierLot.length,
    affichage: 'dernier_lot',
  }
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/**
 * Une journée civile en français, sans passer par `toLocaleDateString` : celui-ci
 * lit la date dans le fuseau du navigateur et rendrait « 3 septembre » à
 * l'ouest de Greenwich pour un lot versé le 4.
 */
export function jourEnFrancais(jour) {
  const valide = dateDeVersement(jour)
  if (valide === null) return null
  const [annee, mois, jourDuMois] = valide.split('-')
  return `${Number(jourDuMois)} ${MOIS[Number(mois) - 1]} ${annee}`
}

/**
 * La phrase que l'écran pose sous son titre. Elle dit TOUJOURS la date et
 * l'âge : c'est ce qui distingue « un lot de la semaine » de « le dernier lot,
 * qui date ».
 */
export function phraseDeVersement(resume) {
  // La garde porte sur le CONTENU, pas sur le verdict : cette phrase est aussi
  // appelée sur un résumé qui a voyagé par une route HTTP, et une charge utile
  // tronquée ou remplacée par un `{ ok: true }` ne doit pas casser l'écran qui
  // l'affiche. Mesuré : sans cette garde, la doublure d'API des tests e2e
  // faisait planter l'accueil.
  const dernier = resume?.dernierVersement
  if (!resume || resume.affichage === 'aucune_date' || !dateDeVersement(dernier?.date)) {
    return 'Aucune recette du catalogue ne porte de date de versement.'
  }
  const { compte } = resume
  const quand = jourEnFrancais(dernier.date)
  const plat = `recette${compte > 1 ? 's' : ''}`
  if (resume.affichage === 'semaine') {
    // Une semaine peut porter DEUX lots. Dire « 2 recettes versées cette
    // semaine, le mercredi » quand l'une est arrivée lundi serait faux d'un
    // jour sur la moitié du lot — la faute exacte que ce fichier existe pour
    // éviter. On compte les journées distinctes et on le dit.
    const journees = new Set((resume.recettes || []).map((carte) => carte?.verseLe).filter(Boolean))
    if (journees.size > 1) {
      return `${compte} ${plat} versée${compte > 1 ? 's' : ''} cette semaine, en ${journees.size} lots — le dernier le ${quand}.`
    }
    return `${compte} ${plat} versée${compte > 1 ? 's' : ''} cette semaine, le ${quand}.`
  }
  const jours = dernier.joursDepuis
  const age = jours === 0 ? "aujourd'hui" : jours === 1 ? 'hier' : `il y a ${jours} jours`
  return `Aucun lot versé cette semaine. Dernier lot : ${compte} ${plat} le ${quand}, ${age}.`
}
