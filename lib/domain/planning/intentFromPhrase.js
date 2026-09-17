/**
 * LE TRADUCTEUR DE PHRASE — livrable 4.1.
 *
 * CE QU'IL FAIT, ET CE QU'IL NE FAIT PAS. Il traduit une phrase du foyer en
 * CONTRAINTES que le moteur déterministe sait déjà lire. Il ne choisit aucun
 * plat, ne note aucune recette, n'ouvre aucune semaine. Le §7.9 du plan écrit
 * qu'on ne réécrit pas le solveur : « il lui manque des yeux, pas un cerveau ».
 * Ce module est une paire d'yeux, et rien d'autre. Un traducteur qui rendrait
 * un plat, ou un sixième champ, serait le contraire du livrable.
 *
 * LES CINQ CHAMPS, ET OÙ LE MOTEUR LES LIT RÉELLEMENT. Le critère du plan les
 * nomme ; chacun est rattaché ici à la ligne de code qui s'en sert, parce qu'un
 * champ traduit vers une contrainte qui n'existe pas est un champ décoratif.
 *
 *   presence   → `normalizePresenceRows` / `buildPresenceIndex`
 *                (`mealPresence.js`). Relu par `finalDemands.js:868`,
 *                `personalizedMeals.js:1197` et `cookingCapacity.js:157` :
 *                une absence déclarée retire l'assiette et rétrécit la cible.
 *   starchCap  → `weekly_balance.starchMaxShare` →`buildWeeklyBalance`
 *                (`weeklyBalance.js:370`) → `targets.starchMax` →
 *                `plafondDuFeculent` → refus du candidat
 *                (`closedLoopPlanner.js:1190`).
 *   meatQuota  → `weekly_balance.meatMax`. `resolveHouseholdWeeklyBalance`
 *                (`weeklyBalance.js:402`) donne le premier rang à un `meatMax`
 *                ÉCRIT par la requête, devant la somme des quotas déclarés.
 *   maxMinutes → `constraints.maxTotalMinutes`, lu par
 *                `closedLoopPlanner.js:936` : au-delà, le candidat est refusé
 *                avec le motif `time_limit`.
 *   intent     → `constraints.intent`, lu par `matchesIntent`
 *                (`closedLoopPlanner.js:946`) et par la notation
 *                (`:1231`, `:1253`, `:1272`).
 *
 * UNE RÉSERVE MESURÉE, ÉCRITE ICI PLUTÔT QUE DÉCOUVERTE À L'USAGE — ET C'EST
 * LA SEULE DES CINQ QUI EN PORTE UNE.
 * `maxMinutes` est la seule des cinq grandeurs que la ROUTE de génération ne
 * laisse pas encore entrer, et elle porte en plus un PIÈGE D'OMBRE.
 *   1. `app/api/planning/generate-v3/route.js:674` écrit
 *      `maxMinutesByMeal: { dejeuner: 120, diner: 240 }` en dur et ne lit aucun
 *      `maxTotalMinutes` du corps de requête.
 *   2. `closedLoopPlanner.js:936` lit
 *      `maxMinutesByMeal?.[currentMealType] ?? maxTotalMinutes` : tant que la
 *      première clé est posée pour la prise en cours, la seconde est IGNORÉE.
 *      Un raccord qui se contenterait d'ajouter `maxTotalMinutes` aux
 *      contraintes n'aurait donc AUCUN effet sur les déjeuners et les dîners —
 *      sans erreur, sans trace. Le livrable qui branchera ce champ devra vider
 *      ou remplacer `maxMinutesByMeal`, pas seulement ajouter une clé.
 * Le moteur lit bel et bien la contrainte : `tests/planning/intentDepuisPhrase.test.js`
 * l'éprouve sur `violatesHardConstraints` lui-même, dans les deux sens. La
 * contrainte existe donc, ce module la produit, et le raccord appartient aux
 * livrables 4.2 et 4.3. Dire « champ décoratif » serait faux ; dire « déjà
 * branché » le serait aussi.
 *
 * ET UNE RAISON DE PLUS DE REFUSER PLUTÔT QUE DE COERCER : la ligne 936 fait
 * `Number(...)`. Un `maxMinutes: true` laissé passer y vaudrait 1, c'est-à-dire
 * « aucun plat de plus d'une minute », c'est-à-dire une semaine vide. La garde
 * de type de ce module est ce qui empêche cette valeur d'atteindre le moteur.
 *
 * AUCUNE ÉCRITURE, ET C'EST UNE PROPRIÉTÉ DU MODULE, PAS UNE INTENTION.
 * Ce fichier n'importe ni `supabaseClient`, ni `supabaseServer`, ni `fetch` :
 * il est pur. `tests/planning/intentDepuisPhrase.test.js` le vérifie sur le
 * texte du fichier ET sur celui de la route, et le §9.3 du plan en fait un
 * interdit — « zéro écriture dans les tables de planning hors publication
 * atomique ».
 *
 * Module PUR.
 */

import { PRISES } from './mealPresence'
import { MAX_MEAT_MEALS_PER_WEEK } from './memberPlanningRules'

/**
 * LES CINQ CHAMPS, ET RIEN D'AUTRE. L'ordre est celui du plan ; la liste sert
 * à la fois au schéma envoyé au modèle et au refus d'un champ inconnu.
 */
export const CHAMPS_TRADUITS = Object.freeze(['presence', 'starchCap', 'meatQuota', 'maxMinutes', 'intent'])

/** Les intentions que `matchesIntent` sait lire, à la lettre près. */
export const INTENTS_MOTEUR = Object.freeze(['balanced', 'stock', 'quick', 'light', 'vegetarian'])

/**
 * Bornes de `maxMinutes`, en minutes de préparation + cuisson pour UN plat —
 * c'est la grandeur que `closedLoopPlanner.js:936` compare
 * (`recipe.prepMinutes + recipe.cookMinutes`). Le plafond haut vaut la borne du
 * dîner déjà écrite dans la route de génération (240) ; le plancher vaut 5,
 * au-dessous duquel aucun plat du corpus n'existe et la semaine serait vide
 * sans qu'on sache pourquoi.
 */
export const MAX_MINUTES_BORNES = Object.freeze({ min: 5, max: 240 })

/** Longueur maximale d'une phrase acceptée. Un champ, pas un dialogue. */
export const PHRASE_MAX = 400

/** Nombre maximal de déclarations de présence qu'une phrase peut produire. */
export const PRESENCE_MAX = 28

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const CODES_REFUS = Object.freeze({
  RACINE: 'racine_invalide',
  INCONNU: 'champ_inconnu',
  MANQUANT: 'champ_manquant',
  TYPE: 'type_invalide',
  BORNES: 'hors_bornes',
  VALEUR: 'valeur_inconnue',
  TROP_LONG: 'liste_trop_longue',
})

const refus = (champ, code, message) => ({ champ, code, message })

/**
 * UN NOMBRE, OU UN REFUS — jamais une coercition.
 *
 * `Number(true)` vaut 1, `Number('')` et `Number([])` valent 0. Deux fautes de
 * cette famille ont déjà été corrigées dans ce dépôt : un quota carné où `[]`
 * signifiait « cette personne ne mange pas de viande »
 * (`weeklyBalance.js:meatMaxFromDeclaredQuotas`) et un plafond de part où
 * `true` signifiait « 100 % de la semaine » (`weeklyBalance.js:partValide`).
 *
 * LA DIFFÉRENCE AVEC CES DEUX PARADES, ET ELLE EST VOULUE : là-bas, une valeur
 * malformée retombe en silence sur le défaut documenté — c'est ce qu'il faut
 * pour un réglage enregistré, qui ne doit pas casser une génération. Ici, elle
 * REFUSE et se nomme. Un modèle de langage est une source qui se trompe
 * autrement qu'un formulaire : corriger sa sortie en silence rendrait
 * indistinguable « le foyer n'a rien demandé » de « le modèle a mal traduit »,
 * et c'est exactement ce que le livrable 4.2 doit pouvoir montrer à l'écran.
 *
 * Seuls un `number` fini et une chaîne entièrement numérique passent.
 */
function nombreDeclare(valeur) {
  if (typeof valeur === 'number') return Number.isFinite(valeur) ? valeur : null
  if (typeof valeur !== 'string') return null
  const texte = valeur.trim()
  if (!texte) return null
  const nombre = Number(texte)
  return Number.isFinite(nombre) ? nombre : null
}

/**
 * LE SCHÉMA ENVOYÉ AU MODÈLE (`output_config.format.schema`).
 *
 * `additionalProperties: false` et les cinq `required` disent au modèle ce que
 * la validation exigera de toute façon. Les deux couches ne font pas double
 * emploi : le schéma est une CONSIGNE — il peut être ignoré, mal appliqué, ou
 * ne pas être honoré par une future version de l'API —, la validation est une
 * PORTE. Le test `tests/planning/intentDepuisPhrase.test.js` éprouve la porte
 * en lui présentant des sorties que le schéma aurait dû interdire.
 *
 * `null` est autorisé partout, et c'est le cas le plus fréquent : une phrase
 * qui parle de temps ne dit rien du féculent. `null` = « la phrase ne le dit
 * pas », et le moteur garde alors son réglage. C'est aussi ce qui rend les cinq
 * champs OBLIGATOIRES tenable : le modèle doit se prononcer sur chacun, quitte
 * à dire qu'il n'en sait rien.
 */
export function schemaDeSortie() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [...CHAMPS_TRADUITS],
    properties: {
      presence: {
        type: ['array', 'null'],
        maxItems: PRESENCE_MAX,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['person', 'date', 'mealType', 'present'],
          properties: {
            person: { type: 'string', description: "Prénom tel que la phrase le nomme, ou '' pour tout le foyer" },
            date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            mealType: { type: 'string', enum: [...PRISES] },
            present: { type: 'boolean', description: 'false = cette personne ne mange pas à la maison à cette prise' },
          },
        },
      },
      starchCap: {
        type: ['number', 'null'],
        exclusiveMinimum: 0,
        maximum: 1,
        description: "Part maximale des créneaux servis avec un même féculent, entre 0 exclu et 1. 'moins de pâtes' ≈ 0.15",
      },
      meatQuota: {
        type: ['integer', 'null'],
        minimum: 0,
        maximum: MAX_MEAT_MEALS_PER_WEEK,
        description: 'Nombre maximal de repas carnés de la semaine pour le foyer',
      },
      maxMinutes: {
        type: ['integer', 'null'],
        minimum: MAX_MINUTES_BORNES.min,
        maximum: MAX_MINUTES_BORNES.max,
        description: "Préparation + cuisson maximale d'un plat, en minutes",
      },
      intent: { type: ['string', 'null'], enum: [...INTENTS_MOTEUR, null] },
    },
  }
}

/**
 * LE SYSTEM PROMPT. Long et STABLE : c'est ce qui le rend cachable
 * (`cache_control: ephemeral`, piège n°5 du CLAUDE.md). Aucune date, aucun
 * identifiant, aucun prénom du foyer n'y entre — ils invalideraient le préfixe
 * à chaque appel et le cache ne servirait jamais.
 *
 * Les prénoms et les dates de la semaine voyagent donc dans le MESSAGE, après
 * le dernier point de cache.
 */
export function systemPrompt() {
  return [
    "Tu traduis une phrase en contraintes de planification. Tu ne choisis aucun plat, tu ne proposes aucune recette, tu ne rédiges aucun texte.",
    '',
    'Tu rends un objet JSON avec EXACTEMENT ces cinq champs, aucun de plus :',
    '  presence   — liste de déclarations { person, date, mealType, present }, ou null.',
    "               present vaut false quand la personne ne mange PAS à la maison à cette prise.",
    "               mealType vaut l'une de : " + PRISES.join(', ') + '.',
    "               person est le prénom tel que la phrase le nomme ; chaîne vide si la phrase parle du foyer entier.",
    '  starchCap  — part maximale des créneaux portant un même féculent, réel de ]0, 1], ou null.',
    '  meatQuota  — nombre entier de repas carnés au plus dans la semaine, de 0 à ' + MAX_MEAT_MEALS_PER_WEEK + ', ou null.',
    "  maxMinutes — préparation + cuisson d'un plat au plus, entier de " + MAX_MINUTES_BORNES.min + ' à ' + MAX_MINUTES_BORNES.max + ', ou null.',
    '  intent     — une de : ' + INTENTS_MOTEUR.join(', ') + ', ou null.',
    '',
    "RÈGLE LA PLUS IMPORTANTE : null n'est pas un échec. Un champ dont la phrase ne parle pas vaut null.",
    "Ne devine jamais une valeur pour combler un champ : une valeur inventée ne se distingue plus d'une valeur demandée.",
    '',
    "Une date se déduit de la semaine donnée dans le message, et d'elle seule. Si la phrase nomme un jour",
    "qui n'est pas dans cette semaine, ne rends aucune déclaration de présence pour ce jour.",
    '',
    "Tu ne rends ni explication, ni commentaire, ni texte autour du JSON.",
  ].join('\n')
}

/**
 * Le message utilisateur : la phrase, et le contexte minimal pour dater une
 * absence. Rien d'autre — pas de stock, pas de recettes : ce module ne décide
 * pas, et lui donner de quoi décider serait l'inviter à le faire.
 */
export function messageUtilisateur({ phrase = '', dates = [], membres = [] } = {}) {
  const lignes = [`Semaine : ${(dates || []).join(', ') || 'non précisée'}`]
  const noms = (membres || []).map((membre) => (typeof membre === 'string' ? membre : membre?.name)).filter(Boolean)
  if (noms.length) lignes.push(`Personnes du foyer : ${noms.join(', ')}`)
  lignes.push('', 'Phrase :', String(phrase || ''))
  return lignes.join('\n')
}

/**
 * La phrase elle-même est validée AVANT l'appel : une phrase vide ou démesurée
 * ne vaut pas un aller-retour au modèle.
 */
export function validerPhrase(phrase) {
  if (typeof phrase !== 'string') return refus('phrase', CODES_REFUS.TYPE, 'La phrase doit être du texte.')
  const texte = phrase.trim()
  if (!texte) return refus('phrase', CODES_REFUS.MANQUANT, 'Écris une phrase.')
  if (texte.length > PHRASE_MAX) {
    return refus('phrase', CODES_REFUS.TROP_LONG, `${PHRASE_MAX} caractères au maximum (reçu ${texte.length}).`)
  }
  return null
}

function validerPresence(valeur, { dates = [] } = {}) {
  if (valeur == null) return { valeur: null, refus: [] }
  if (!Array.isArray(valeur)) {
    return { valeur: null, refus: [refus('presence', CODES_REFUS.TYPE, 'presence doit être une liste ou null.')] }
  }
  if (valeur.length > PRESENCE_MAX) {
    return {
      valeur: null,
      refus: [refus('presence', CODES_REFUS.TROP_LONG, `${PRESENCE_MAX} déclarations au maximum (reçu ${valeur.length}).`)],
    }
  }
  const attendues = new Set(dates || [])
  const motifs = []
  const lignes = []
  valeur.forEach((ligne, rang) => {
    const ou = `presence[${rang}]`
    if (!ligne || typeof ligne !== 'object' || Array.isArray(ligne)) {
      motifs.push(refus(ou, CODES_REFUS.TYPE, 'Chaque déclaration doit être un objet.'))
      return
    }
    const inconnus = Object.keys(ligne).filter((cle) => !['person', 'date', 'mealType', 'present'].includes(cle))
    if (inconnus.length) {
      motifs.push(refus(ou, CODES_REFUS.INCONNU, `Champ inconnu : ${inconnus.join(', ')}.`))
      return
    }
    if (typeof ligne.person !== 'string') {
      motifs.push(refus(`${ou}.person`, CODES_REFUS.TYPE, 'person doit être du texte.'))
      return
    }
    if (typeof ligne.date !== 'string' || !ISO_DATE.test(ligne.date)) {
      motifs.push(refus(`${ou}.date`, CODES_REFUS.TYPE, 'date doit être au format AAAA-MM-JJ.'))
      return
    }
    // Une absence datée HORS de la semaine demandée n'est pas une absence de
    // cette semaine : la retenir écrirait une déclaration que personne ne
    // reverra, sur une fenêtre que l'écran ne montre pas.
    if (attendues.size && !attendues.has(ligne.date)) {
      motifs.push(refus(`${ou}.date`, CODES_REFUS.BORNES, `${ligne.date} n'est pas un jour de la semaine demandée.`))
      return
    }
    if (!PRISES.includes(ligne.mealType)) {
      motifs.push(refus(`${ou}.mealType`, CODES_REFUS.VALEUR, `mealType doit valoir ${PRISES.join(', ')}.`))
      return
    }
    // `present` est un BOOLÉEN STRICT. `0`, `'false'` et `''` sont refusés :
    // le piège de Number() a déjà coûté deux régressions dans ce dépôt, et
    // `Boolean('false')` vaut true, ce qui retournerait le sens de la phrase.
    if (typeof ligne.present !== 'boolean') {
      motifs.push(refus(`${ou}.present`, CODES_REFUS.TYPE, 'present doit valoir true ou false.'))
      return
    }
    lignes.push({ person: ligne.person.trim(), date: ligne.date, mealType: ligne.mealType, present: ligne.present })
  })
  return { valeur: lignes.length ? lignes : null, refus: motifs }
}

function validerPart(valeur) {
  if (valeur == null) return { valeur: null, refus: [] }
  // Le refus porte sur le TYPE avant les bornes : `true` n'est pas une part
  // hors bornes, c'est une valeur qui n'est pas un nombre.
  if (typeof valeur !== 'number' && typeof valeur !== 'string') {
    return { valeur: null, refus: [refus('starchCap', CODES_REFUS.TYPE, 'starchCap doit être un nombre ou null.')] }
  }
  const part = nombreDeclare(valeur)
  if (part == null) {
    return { valeur: null, refus: [refus('starchCap', CODES_REFUS.TYPE, 'starchCap doit être un nombre ou null.')] }
  }
  if (!(part > 0 && part <= 1)) {
    return {
      valeur: null,
      refus: [refus('starchCap', CODES_REFUS.BORNES, `starchCap doit être dans ]0, 1] (reçu ${part}).`)],
    }
  }
  return { valeur: part, refus: [] }
}

function validerEntier(champ, valeur, { min, max }) {
  if (valeur == null) return { valeur: null, refus: [] }
  if (typeof valeur !== 'number' && typeof valeur !== 'string') {
    return { valeur: null, refus: [refus(champ, CODES_REFUS.TYPE, `${champ} doit être un nombre entier ou null.`)] }
  }
  const nombre = nombreDeclare(valeur)
  if (nombre == null || !Number.isInteger(nombre)) {
    return { valeur: null, refus: [refus(champ, CODES_REFUS.TYPE, `${champ} doit être un nombre entier ou null.`)] }
  }
  if (nombre < min || nombre > max) {
    return {
      valeur: null,
      refus: [refus(champ, CODES_REFUS.BORNES, `${champ} doit être entre ${min} et ${max} (reçu ${nombre}).`)],
    }
  }
  return { valeur: nombre, refus: [] }
}

function validerIntent(valeur) {
  if (valeur == null) return { valeur: null, refus: [] }
  if (typeof valeur !== 'string') {
    return { valeur: null, refus: [refus('intent', CODES_REFUS.TYPE, 'intent doit être du texte ou null.')] }
  }
  if (!INTENTS_MOTEUR.includes(valeur)) {
    return {
      valeur: null,
      refus: [refus('intent', CODES_REFUS.VALEUR, `intent doit valoir ${INTENTS_MOTEUR.join(', ')}.`)],
    }
  }
  return { valeur, refus: [] }
}

/**
 * LA PORTE — elle refuse, elle ne corrige pas.
 *
 * Trois familles de refus, toutes nommées : un champ inconnu (le sixième champ
 * que le critère interdit), un type faux (le piège de `Number()`), une valeur
 * hors bornes. Rien n'est complété : un objet qui ne porte pas les cinq champs
 * est refusé plutôt que rempli de `null`, parce qu'un champ absent et un champ
 * à `null` ne veulent pas dire la même chose — l'un est un modèle qui ne s'est
 * pas prononcé, l'autre un modèle qui dit que la phrase n'en parle pas.
 *
 * @param {object} brut la sortie du modèle, déjà décodée du JSON
 * @param {{dates?: string[]}} contexte les jours de la semaine demandée
 * @returns {{ok: true, intention: object} | {ok: false, refus: Array}}
 */
export function validerIntention(brut, { dates = [] } = {}) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) {
    return { ok: false, refus: [refus(null, CODES_REFUS.RACINE, 'La réponse doit être un objet JSON.')] }
  }
  const motifs = []

  const inconnus = Object.keys(brut).filter((cle) => !CHAMPS_TRADUITS.includes(cle))
  for (const cle of inconnus) {
    motifs.push(refus(cle, CODES_REFUS.INCONNU, `Champ inconnu : ${cle}. Les seuls champs attendus sont ${CHAMPS_TRADUITS.join(', ')}.`))
  }
  const manquants = CHAMPS_TRADUITS.filter((cle) => !(cle in brut))
  for (const cle of manquants) {
    motifs.push(refus(cle, CODES_REFUS.MANQUANT, `Champ manquant : ${cle}.`))
  }
  if (motifs.length) return { ok: false, refus: motifs }

  const presence = validerPresence(brut.presence, { dates })
  const starchCap = validerPart(brut.starchCap)
  const meatQuota = validerEntier('meatQuota', brut.meatQuota, { min: 0, max: MAX_MEAT_MEALS_PER_WEEK })
  const maxMinutes = validerEntier('maxMinutes', brut.maxMinutes, MAX_MINUTES_BORNES)
  const intent = validerIntent(brut.intent)

  const tous = [presence, starchCap, meatQuota, maxMinutes, intent]
  const refuses = tous.flatMap((resultat) => resultat.refus)
  if (refuses.length) return { ok: false, refus: refuses }

  return {
    ok: true,
    intention: {
      presence: presence.valeur,
      starchCap: starchCap.valeur,
      meatQuota: meatQuota.valeur,
      maxMinutes: maxMinutes.valeur,
      intent: intent.valeur,
    },
  }
}

/**
 * LES CONTRAINTES, DANS LE VOCABULAIRE QUE LE MOTEUR LIT DÉJÀ.
 *
 * C'est la fonction qui empêche les cinq champs d'être décoratifs : elle les
 * rend sous les clés EXACTES que `resolveHouseholdWeeklyBalance`,
 * `buildWeeklyBalance`, `matchesIntent`, `normalizePresenceRows` et le contrôle
 * de durée de `closedLoopPlanner` consomment. Un champ à `null` ne produit
 * AUCUNE clé : le moteur garde alors son réglage, et une contrainte absente ne
 * se confond pas avec une contrainte à zéro.
 *
 * `presence` sort au vocabulaire de la table (`person_name`, `meal_date`,
 * `meal_type`) : c'est celui que `normalizePresenceRows` accepte et celui que
 * `POST /api/planning/presence` attend. CE MODULE N'APPELLE PAS CETTE ROUTE —
 * il rend de quoi le faire, quand le foyer aura confirmé (livrable 4.2).
 */
export function contraintesDuMoteur(intention = {}) {
  const contraintes = {}
  if (intention.intent) contraintes.intent = intention.intent

  const balance = {}
  if (intention.starchCap != null) balance.starchMaxShare = intention.starchCap
  if (intention.meatQuota != null) balance.meatMax = intention.meatQuota
  if (Object.keys(balance).length) contraintes.weekly_balance = balance

  if (intention.maxMinutes != null) contraintes.maxTotalMinutes = intention.maxMinutes

  if (intention.presence?.length) {
    contraintes.presence = intention.presence.map((ligne) => ({
      person_name: ligne.person || null,
      meal_date: ligne.date,
      meal_type: ligne.mealType,
      present: ligne.present,
    }))
  }
  return contraintes
}
