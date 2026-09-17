/**
 * L'ÉCRAN DE CONFIRMATION DES CONTRAINTES DÉDUITES — livrable 4.2.
 *
 * POURQUOI IL EXISTE, ET CE N'EST PAS UNE CONSIGNE D'ERGONOMIE. Les conditions
 * d'utilisation de Jowzi concèdent la « mauvaise interprétation d'un Prompt ».
 * C'est un aveu de structure : un agent qui décide sans montrer ne peut rien
 * offrir de mieux qu'une excuse écrite d'avance. Montrer ce qu'on a compris, et
 * le laisser corriger AVANT que quoi que ce soit ne parte, est la réponse — et
 * c'est une réponse qui se teste, contrairement à une clause.
 *
 * CE QUE CE MODULE PORTE, ET POURQUOI IL EST PUR.
 *   — Le rendu FRANÇAIS de chacune des cinq contraintes. Un libellé vit ici et
 *     pas dans le JSX parce qu'il se vérifie : « 15 % des créneaux » ne doit
 *     jamais s'afficher pour `starchCap: 15`, qui vaudrait quinze fois la
 *     semaine.
 *   — La CORRECTION à la main, qui repasse par la porte du livrable 4.1
 *     (`validerIntention`). Une valeur tapée par le foyer et une valeur rendue
 *     par le modèle franchissent EXACTEMENT la même serrure : sans quoi le
 *     formulaire serait le trou par lequel `true` ou `''` atteindrait enfin le
 *     moteur, après qu'on a passé le livrable 4.1 à l'en empêcher.
 *   — Le CORPS de génération, c'est-à-dire la preuve que les contraintes
 *     confirmées voyagent. Un écran qui montre cinq contraintes et n'en envoie
 *     aucune serait un décor, et le pire des décors : celui qui fait croire
 *     qu'on a été entendu.
 *
 * CE QUE CE MODULE NE FAIT PAS. Il n'appelle ni Supabase, ni le modèle, ni
 * `/api/planning/presence`. Il RÉSOUT les déclarations de présence en lignes
 * écrivables (`declarationsAEcrire`) et laisse la page les envoyer à la route
 * qui écrit — parce qu'une mutation passe par `app/api/`, jamais par un
 * composant client, et parce qu'une résolution de prénom se teste sans base.
 *
 * Module PUR.
 */

import { PRISES } from './mealPresence'
import { MAX_MEAT_MEALS_PER_WEEK } from './memberPlanningRules'
import {
  CHAMPS_TRADUITS,
  CODES_REFUS,
  INTENTS_MOTEUR,
  MAX_MINUTES_BORNES,
  nombreDeclare,
  validerIntention,
} from './intentFromPhrase'

/**
 * L'ordre d'AFFICHAGE, qui n'est pas celui du schéma. L'intention d'abord —
 * c'est la seule des cinq qui a un chemin rapide par bouton (§4.3) —, la
 * présence en dernier parce que c'est la seule qui tient sur plusieurs lignes.
 */
export const CHAMPS_CONFIRMES = Object.freeze(['intent', 'maxMinutes', 'starchCap', 'meatQuota', 'presence'])

export const LIBELLES_CONFIRMATION = Object.freeze({
  intent: 'Intention de la semaine',
  maxMinutes: 'Temps par plat',
  starchCap: 'Part d\'un même féculent',
  meatQuota: 'Repas carnés',
  presence: 'Absences déclarées',
})

export const INTENT_LIBELLE = Object.freeze({
  balanced: 'Équilibré',
  stock: 'Priorité stock',
  quick: 'Rapide',
  light: 'Plus léger',
  vegetarian: 'Végétarien',
})

export const PRISE_LIBELLE = Object.freeze({
  pdj: 'petit-déjeuner',
  dejeuner: 'déjeuner',
  collation: 'collation',
  diner: 'dîner',
})

/** La cible d'une absence qui vaut pour tout le monde. */
export const CIBLE_FOYER = '__foyer__'

/** Bornes de la saisie en POUR CENT, l'unité que l'écran montre et lit. */
export const STARCH_POURCENT_BORNES = Object.freeze({ min: 1, max: 100 })

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/**
 * Une date ISO en français, SANS `toLocaleDateString`. Deux raisons, et la
 * seconde est celle qui compte : la sortie d'`Intl` dépend de la version d'ICU
 * embarquée dans le moteur — un test vert en local peut rougir en CI —, et le
 * fuseau. `new Date('2026-09-22')` est minuit UTC : lu en heure locale à l'ouest
 * de Greenwich, c'est le 21. On lit donc les trois nombres du texte, et on ne
 * construit la date qu'en UTC (piège n°4 du CLAUDE.md).
 */
export function dateEnFrancais(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return String(iso ?? '')
  const [annee, mois, jour] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(annee, mois - 1, jour))
  if (Number.isNaN(date.getTime())) return iso
  return `${JOURS[date.getUTCDay()]} ${date.getUTCDate()} ${MOIS[date.getUTCMonth()]}`
}

/** Une intention sans aucune contrainte : les cinq champs à `null`. */
export function intentionNeutre() {
  return { presence: null, starchCap: null, meatQuota: null, maxMinutes: null, intent: null }
}

/** Vrai quand la phrase n'a rien contraint du tout. */
export function estSansContrainte(intention = {}) {
  return CHAMPS_TRADUITS.every((champ) => {
    const valeur = intention?.[champ]
    return valeur == null || (Array.isArray(valeur) && valeur.length === 0)
  })
}

/**
 * Le rendu français d'UNE contrainte, ou `null` quand la phrase n'en parle pas.
 *
 * `starchCap` est le libellé qui mérite un test à lui seul : la valeur du
 * domaine est une PART (0,15) et l'écran montre un POURCENTAGE (15 %). Les
 * confondre dans un sens donne « 0 % », dans l'autre « 1 500 % ».
 */
export function enFrancais(champ, valeur, { membres = [] } = {}) {
  if (valeur == null) return null
  if (champ === 'intent') return INTENT_LIBELLE[valeur] || String(valeur)
  if (champ === 'maxMinutes') return `${valeur} minutes par plat au plus`
  if (champ === 'starchCap') return `${partEnPourcent(valeur)} % des créneaux au plus`
  if (champ === 'meatQuota') return `${valeur} repas carné${valeur > 1 ? 's' : ''} dans la semaine au plus`
  if (champ === 'presence') {
    if (!Array.isArray(valeur) || !valeur.length) return null
    return valeur.map((ligne) => presenceEnFrancais(ligne, membres)).join(' · ')
  }
  return String(valeur)
}

/** Une ligne d'absence en français. */
export function presenceEnFrancais(ligne = {}, membres = []) {
  const nom = nomDeLaCible(ligne.cible ?? ligne.person, membres)
  const prise = PRISE_LIBELLE[ligne.mealType] || ligne.mealType
  const verbe = ligne.present === true ? 'mange à la maison' : 'ne mange pas à la maison'
  return `${nom} ${verbe} — ${dateEnFrancais(ligne.date)}, ${prise}`
}

function nomDeLaCible(cible, membres = []) {
  if (!cible || cible === CIBLE_FOYER) return 'Tout le foyer'
  const membre = (membres || []).find((item) => String(item?.id) === String(cible))
  if (membre?.name) return membre.name
  return String(cible)
}

/** La part du domaine (0,15) en pourcentage affichable (15). */
export function partEnPourcent(part) {
  const nombre = nombreDeclare(part)
  if (nombre == null) return null
  return Math.round(nombre * 1000) / 10
}

const refus = (champ, code, message) => ({ champ, code, message })

/**
 * LA SAISIE DE L'ÉCRAN → LA VALEUR DU DOMAINE, ou un refus nommé.
 *
 * Tout ce qui sort d'un champ de formulaire est une CHAÎNE, y compris le vide.
 * `''` signifie ici « le foyer retire cette contrainte » et vaut `null` — c'est
 * la seule coercition du module, elle est explicite, et elle n'invente aucune
 * valeur. Tout le reste passe par `nombreDeclare` : `true`, `[]`, `{}`, `'30 '`
 * suivi de lettres sont refusés, pas convertis. `Number('')` vaut 0, et un
 * `maxMinutes` à 0 est une semaine vide ; c'est exactement la faute que le
 * dépôt a déjà payée deux fois.
 */
export function valeurDepuisSaisie(champ, saisie) {
  if (champ === 'intent') {
    if (saisie == null || saisie === '') return { valeur: null, refus: null }
    if (typeof saisie !== 'string' || !INTENTS_MOTEUR.includes(saisie)) {
      return { valeur: null, refus: refus('intent', CODES_REFUS.VALEUR, `intent doit valoir ${INTENTS_MOTEUR.join(', ')}.`) }
    }
    return { valeur: saisie, refus: null }
  }

  if (saisie == null || (typeof saisie === 'string' && saisie.trim() === '')) {
    return { valeur: null, refus: null }
  }

  const nombre = nombreDeclare(saisie)
  if (nombre == null) {
    return { valeur: null, refus: refus(champ, CODES_REFUS.TYPE, `${LIBELLES_CONFIRMATION[champ] || champ} : écris un nombre.`) }
  }

  if (champ === 'starchCap') {
    if (!Number.isFinite(nombre) || nombre < STARCH_POURCENT_BORNES.min || nombre > STARCH_POURCENT_BORNES.max) {
      return {
        valeur: null,
        refus: refus('starchCap', CODES_REFUS.BORNES,
          `La part d'un même féculent se donne en pour cent, entre ${STARCH_POURCENT_BORNES.min} et ${STARCH_POURCENT_BORNES.max} (reçu ${nombre}).`),
      }
    }
    // Arrondi au dix-millième : 15 % vaut 0,15 et pas 0,15000000000000002.
    return { valeur: Math.round((nombre / 100) * 10000) / 10000, refus: null }
  }

  if (champ === 'meatQuota') {
    if (!Number.isInteger(nombre) || nombre < 0 || nombre > MAX_MEAT_MEALS_PER_WEEK) {
      return {
        valeur: null,
        refus: refus('meatQuota', CODES_REFUS.BORNES, `Les repas carnés se comptent en entier, de 0 à ${MAX_MEAT_MEALS_PER_WEEK} (reçu ${nombre}).`),
      }
    }
    return { valeur: nombre, refus: null }
  }

  if (champ === 'maxMinutes') {
    if (!Number.isInteger(nombre) || nombre < MAX_MINUTES_BORNES.min || nombre > MAX_MINUTES_BORNES.max) {
      return {
        valeur: null,
        refus: refus('maxMinutes', CODES_REFUS.BORNES, `Les minutes par plat se comptent en entier, de ${MAX_MINUTES_BORNES.min} à ${MAX_MINUTES_BORNES.max} (reçu ${nombre}).`),
      }
    }
    return { valeur: nombre, refus: null }
  }

  return { valeur: null, refus: refus(champ, CODES_REFUS.INCONNU, `Champ inconnu : ${champ}.`) }
}

/**
 * CORRIGER UNE CONTRAINTE À LA MAIN — sans retaper la phrase.
 *
 * C'est le critère du livrable, et c'est la fonction qui le tient. Elle
 * reconstruit l'intention entière et la REPASSE par `validerIntention`, la porte
 * du livrable 4.1 : la correction du foyer n'a aucun privilège sur la traduction
 * du modèle. Le seul champ qui ne passe pas par ici est `presence`, qui se
 * corrige ligne par ligne (`retirerPresence`, `viserPresence`) parce qu'une
 * absence ne se règle pas avec un curseur.
 *
 * @returns {{ok: true, intention: object} | {ok: false, refus: Array}}
 */
export function corrigerChamp(intention, champ, saisie, { dates = [] } = {}) {
  if (!CHAMPS_TRADUITS.includes(champ) || champ === 'presence') {
    return { ok: false, refus: [refus(champ, CODES_REFUS.INCONNU, `Champ non corrigeable ici : ${champ}.`)] }
  }
  const { valeur, refus: motif } = valeurDepuisSaisie(champ, saisie)
  if (motif) return { ok: false, refus: [motif] }
  const candidate = { ...intentionNeutre(), ...(intention || {}), [champ]: valeur }
  return validerIntention(candidate, { dates })
}

/**
 * Retire UNE absence mal déduite. Les autres ne bougent pas — Y COMPRIS leur
 * personne corrigée à la main.
 *
 * ELLE OPÈRE SUR LES LIGNES DE L'ÉCRAN, PAS SUR L'INTENTION, et c'est une
 * correction de dérive : reconstruire les lignes depuis `intention.presence`
 * après chaque retrait effacerait les `viserPresence` déjà posés — le foyer
 * aurait dit « c'est Zoé » sur une ligne, retiré une AUTRE ligne, et vu la
 * première redevenir « qui ? ». Les rangs viennent de l'ordre d'origine et ne
 * sont jamais renumérotés : ils servent de clé, pas d'index.
 */
export function retirerLigne(lignes, rang) {
  return (lignes || []).filter((ligne) => ligne?.rang !== rang)
}

const plier = (valeur) => String(valeur || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

/**
 * LE PRÉNOM DE LA PHRASE → UN MEMBRE DU FOYER, ou `null`.
 *
 * Le modèle rend le prénom TEL QUE LA PHRASE LE NOMME : « zoe », « Zoé »,
 * « ZOÉ ». Le pliage retire accents et casse. Un prénom vide vaut le foyer
 * entier — « on dîne dehors mardi » concerne tout le monde.
 *
 * ET UN REFUS PLUTÔT QU'UNE DEVINETTE : un prénom qui ne désigne personne rend
 * `null`, et l'écran demande alors DE QUI il s'agit. Écrire une absence sur le
 * mauvais membre retirerait l'assiette de quelqu'un qui dîne à la maison, et
 * cette erreur-là ne se voit qu'au moment de passer à table.
 */
export function apparierMembre(nom, membres = []) {
  const plie = plier(nom)
  if (!plie) return CIBLE_FOYER
  const liste = (membres || []).filter((membre) => membre && membre.id != null)
  const exact = liste.find((membre) => plier(membre.name) === plie)
  if (exact) return String(exact.id)
  const commence = liste.filter((membre) => plier(membre.name).startsWith(plie))
  // Un préfixe ambigu (« Jul » pour Julien ET Juliette) n'appareille personne :
  // deux réponses valent zéro réponse.
  if (commence.length === 1) return String(commence[0].id)
  return null
}

/**
 * Les lignes d'absence PRÊTES POUR L'ÉCRAN : la cible pré-appariée, et le
 * prénom d'origine gardé pour que l'écran puisse dire « Zoé » quand
 * l'appariement a échoué.
 */
export function lignesDePresence(intention, membres = []) {
  const lignes = Array.isArray(intention?.presence) ? intention.presence : []
  return lignes.map((ligne, rang) => ({
    rang,
    nomLu: ligne.person || '',
    cible: apparierMembre(ligne.person, membres),
    date: ligne.date,
    mealType: ligne.mealType,
    present: ligne.present,
  }))
}

/** Change la personne visée par une ligne d'absence (corps du `<select>`). */
export function viserPresence(lignes, rang, cible) {
  return (lignes || []).map((ligne) => (ligne.rang === rang ? { ...ligne, cible: cible || null } : ligne))
}

/**
 * LES LIGNES DE L'ÉCRAN → LE CORPS DE `POST /api/planning/presence`.
 *
 * `CIBLE_FOYER` se DÉPLIE en une déclaration par membre : la table
 * `meal_presence` est indexée par membre, et « tout le foyer dîne dehors » n'y
 * a pas de ligne unique. Une cible non résolue ne produit RIEN et remonte dans
 * `incompletes` — l'écran bloque la confirmation tant qu'il en reste, plutôt que
 * d'écrire une absence sur quelqu'un au hasard ou de la perdre en silence.
 *
 * @returns {{declarations: Array, incompletes: Array}}
 */
export function declarationsAEcrire(lignes = [], membres = []) {
  const connus = new Set((membres || []).filter((membre) => membre?.id != null).map((membre) => String(membre.id)))
  const declarations = []
  const incompletes = []
  const vues = new Set()

  for (const ligne of lignes || []) {
    const cibles = ligne?.cible === CIBLE_FOYER ? [...connus] : [String(ligne?.cible ?? '')]
    if (!cibles.length || cibles.some((cible) => !connus.has(cible))) {
      incompletes.push({ rang: ligne?.rang ?? null, nomLu: ligne?.nomLu || '' })
      continue
    }
    if (!PRISES.includes(ligne.mealType) || typeof ligne.present !== 'boolean' || !/^\d{4}-\d{2}-\d{2}$/.test(String(ligne.date || ''))) {
      incompletes.push({ rang: ligne?.rang ?? null, nomLu: ligne?.nomLu || '' })
      continue
    }
    for (const cible of cibles) {
      const cle = `${cible}|${ligne.date}|${ligne.mealType}`
      if (vues.has(cle)) continue
      vues.add(cle)
      declarations.push({
        household_member_id: cible,
        meal_date: ligne.date,
        meal_type: ligne.mealType,
        present: ligne.present,
      })
    }
  }
  return { declarations, incompletes }
}

/**
 * LE CORPS ENVOYÉ À `POST /api/planning/generate-v3` — la preuve que les
 * contraintes confirmées voyagent.
 *
 * Chaque clé est une clé que la route LIT réellement, et le test le vérifie sur
 * le texte de la route plutôt que sur cette liste :
 *   intent            → `resolveIntent(body)`
 *   weekly_balance    → `resolveWeeklyBalance(members, body)` →
 *                       `resolveHouseholdWeeklyBalance({ requestBalance })`,
 *                       qui donne le premier rang à un `meatMax` écrit
 *   max_total_minutes → `plafondsParPrise`, qui ABAISSE `maxMinutesByMeal`
 *                       (c'est le raccord qui lève l'éclipse du livrable 4.1)
 * `presence` n'y figure PAS, et c'est voulu : la génération relit les
 * déclarations en base (`loadPresenceDeclarations`), pas dans son corps. Les
 * faire voyager ici créerait une seconde source de vérité pour la même semaine.
 *
 * Un champ à `null` ne produit AUCUNE clé : une contrainte absente n'est pas une
 * contrainte à zéro, et la génération garde alors le réglage du foyer.
 */
export function corpsDeGeneration(intention = {}, { windowStart = null } = {}) {
  const corps = {}
  if (windowStart) corps.window_start = windowStart
  if (intention.intent) corps.intent = intention.intent

  const balance = {}
  if (intention.starchCap != null) balance.starchMaxShare = intention.starchCap
  if (intention.meatQuota != null) balance.meatMax = intention.meatQuota
  if (Object.keys(balance).length) corps.weekly_balance = balance

  if (intention.maxMinutes != null) corps.max_total_minutes = intention.maxMinutes
  return corps
}

/**
 * L'ÉTAT DE L'ÉCRAN APRÈS UNE TRADUCTION.
 *
 * Extrait du composant pour une raison précise : ce dépôt n'a ni
 * `@testing-library`, ni jsdom (vérifié dans `package.json`). Une règle laissée
 * dans le JSX ne s'éprouve alors que par une recherche de texte dans le
 * fichier, c'est-à-dire pas du tout. Les trois décisions qui font le livrable —
 * ce qui a été DÉDUIT, s'il faut CONFIRMER, ce qu'on peut GÉNÉRER — vivent donc
 * ici, où elles se rejouent.
 *
 * `deduits` est vide quand le repli s'est appliqué, et c'est le point d'honnêteté
 * du livrable 4.3 : le repli POSE `intent: 'balanced'`, mais il ne l'a pas lu
 * dans la phrase. Le marquer « déduit de ta phrase » serait un mensonge de
 * quatre mots.
 */
export function etatApresTraduction(reponse = {}, { membres = [] } = {}) {
  const repli = reponse?.repli?.applique ? reponse.repli : null
  const intention = { ...intentionNeutre(), ...(reponse?.intention || {}) }
  const deduits = repli
    ? []
    : CHAMPS_TRADUITS.filter((champ) => {
      const valeur = intention[champ]
      return valeur != null && !(Array.isArray(valeur) && valeur.length === 0)
    })
  return {
    intention,
    deduits,
    repli,
    // Même sans aucune contrainte déduite, l'écran attend une confirmation :
    // le foyer doit voir CE QUI A ÉTÉ COMPRIS — fût-ce « rien » — avant que la
    // semaine parte. C'est le critère du livrable 4.2, pris à la lettre.
    attenteConfirmation: true,
    lignes: lignesDePresence(intention, membres),
  }
}

/**
 * LA PORTE DE GÉNÉRATION — « la génération ne part qu'après confirmation ».
 *
 * Deux états seulement séparent le bouton de la semaine :
 *   — une traduction attend d'être confirmée, et une absence n'est appariée à
 *     personne : la génération est BLOQUÉE. Écrire cette absence au hasard
 *     retirerait l'assiette de quelqu'un qui dîne à la maison ; la laisser
 *     tomber ferait croire qu'elle a été prise en compte. On demande de qui il
 *     s'agit ;
 *   — tout le reste : la génération part, avec le libellé qui dit ce qu'on
 *     est en train de faire.
 */
export function etatDeGeneration({ attenteConfirmation = false, lignes = [], membres = [] } = {}) {
  const { incompletes } = declarationsAEcrire(lignes, membres)
  if (attenteConfirmation && incompletes.length) {
    return {
      pret: false,
      motif: 'presence_non_resolue',
      incompletes,
      libelle: 'Confirmer et générer',
      message: incompletes.length === 1
        ? `Dis de qui il s'agit pour l'absence lue « ${incompletes[0].nomLu || 'sans prénom'} », ou retire-la.`
        : `Dis de qui il s'agit pour les ${incompletes.length} absences non reconnues, ou retire-les.`,
    }
  }
  return {
    pret: true,
    motif: null,
    incompletes: [],
    libelle: attenteConfirmation ? 'Confirmer et générer' : 'Générer avec Myko',
    message: null,
  }
}
