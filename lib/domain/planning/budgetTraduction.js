/**
 * LE BUDGET DE LATENCE DE LA TRADUCTION — livrable 4.3.
 *
 * LA RÈGLE, MOT POUR MOT : « aucune génération n'attend plus de 5 s sur la
 * traduction ; au-delà, l'appel retombe sur `intent: 'balanced'` ET LE DIT À
 * L'ÉCRAN. Le repli est visible, jamais silencieux. »
 *
 * POURQUOI UN MODULE PLUTÔT QU'UN `setTimeout` DANS LA ROUTE. Trois choses
 * doivent s'accorder sur le même chiffre — la route qui coupe, le navigateur
 * qui abandonne, et la phrase française qui l'annonce. Écrites à trois endroits,
 * elles divergent au premier réglage ; écrites ici, elles s'éprouvent sans
 * réseau et sans modèle.
 *
 * CE QUI TOMBE SOUS LE REPLI, ET CE QUI N'Y TOMBE PAS — la distinction est
 * volontaire et vaut d'être écrite.
 *   — Le DÉLAI dépassé donne un repli : on SUBSTITUE une valeur (`balanced`) à
 *     une traduction qu'on n'a pas obtenue. Il faut donc le dire, sinon le foyer
 *     croirait que sa phrase a été lue.
 *   — Un REFUS de la porte de validation (livrable 4.1) n'est pas un repli :
 *     rien n'est substitué, les motifs sont nommés, et l'écran les montre déjà.
 *     Les confondre effacerait la différence entre « le modèle a mal traduit »
 *     et « le modèle n'a pas répondu à temps », qui n'appellent pas la même
 *     correction de la part du foyer.
 *
 * Module PUR : aucun import, aucune horloge propre, aucun réseau. Les
 * millisecondes lui sont DONNÉES par qui a mesuré.
 */

/**
 * Le budget, en millisecondes. C'est le chiffre du plan, et il n'est pas
 * négociable à la baisse par un réglage : `budgetTraduction` borne toute
 * surcharge à ce plafond (voir plus bas).
 */
export const BUDGET_TRADUCTION_MS = 5000

/**
 * La marge que le navigateur s'accorde au-delà du budget serveur. Le serveur
 * coupe à 5 s ; le client attend 5 s + cette marge avant d'abandonner de son
 * côté, le temps que la réponse de repli — déjà formée — traverse le réseau.
 * Sans elle, le client couperait AVANT le serveur et le repli déclaré par la
 * route ne serait jamais lu : on aurait un repli silencieux, exactement ce que
 * le critère interdit.
 */
export const MARGE_CLIENT_MS = 1500

/** Le seul motif de repli aujourd'hui. Nommé, pour que l'écran le distingue. */
export const RAISONS_REPLI = Object.freeze({ DELAI: 'delai_depasse' })

/** L'intention sur laquelle on retombe. Le critère la nomme : `balanced`. */
export const INTENT_DE_REPLI = 'balanced'

/**
 * Le budget effectif.
 *
 * LE PIÈGE DE `Number()`, ENCORE. La surcharge vient d'une variable
 * d'environnement, c'est-à-dire d'une chaîne quelconque. `Number('')` vaut 0 —
 * un budget de zéro milliseconde ferait retomber TOUTE traduction sur
 * `balanced`, et le traducteur ne servirait plus jamais, sans une ligne de
 * journal pour le dire. `Number(true)` vaut 1, même conséquence. Seul un nombre
 * fini, strictement positif et au plus égal au budget du plan est retenu :
 * une surcharge peut RACCOURCIR le budget (utile en test), jamais l'allonger
 * au-delà des 5 s que le critère fixe.
 *
 * @param {object} source normalement `process.env`
 */
export function budgetTraduction(source = undefined) {
  const brut = source?.MYKO_BUDGET_TRADUCTION_MS
  if (typeof brut !== 'number' && typeof brut !== 'string') return BUDGET_TRADUCTION_MS
  const texte = typeof brut === 'string' ? brut.trim() : brut
  if (texte === '') return BUDGET_TRADUCTION_MS
  const nombre = Number(texte)
  if (!Number.isFinite(nombre) || nombre <= 0) return BUDGET_TRADUCTION_MS
  return Math.min(nombre, BUDGET_TRADUCTION_MS)
}

/** Le budget que le navigateur s'accorde, marge de transport comprise. */
export function budgetClient(budgetMs = BUDGET_TRADUCTION_MS) {
  const budget = Number.isFinite(budgetMs) && budgetMs > 0 ? budgetMs : BUDGET_TRADUCTION_MS
  return budget + MARGE_CLIENT_MS
}

/**
 * L'intention de repli : aucune contrainte déduite, et `balanced` en intention.
 *
 * UN OBJET NEUF À CHAQUE APPEL, et les cinq champs présents. Elle doit passer
 * `validerIntention` comme n'importe quelle sortie de modèle — c'est ce que
 * vérifie le test, et c'est ce qui empêche le repli d'être une porte dérobée
 * par laquelle une forme non validée atteindrait le moteur.
 */
export function intentionDeRepli() {
  return { presence: null, starchCap: null, meatQuota: null, maxMinutes: null, intent: INTENT_DE_REPLI }
}

/**
 * Le repli DÉCLARÉ : ce que la route renvoie et ce que l'écran affiche.
 *
 * `ms` est la durée RÉELLEMENT attendue, mesurée par l'appelant. Elle n'est pas
 * décorative : c'est elle qui permet de dire « 5 243 ms » plutôt que « plus de
 * 5 s », et de distinguer un modèle lent d'un modèle muet.
 */
export function repliDeclare({ raison = RAISONS_REPLI.DELAI, ms = null, budgetMs = BUDGET_TRADUCTION_MS } = {}) {
  const attendu = Number.isFinite(ms) && ms >= 0 ? Math.round(ms) : null
  const budget = Number.isFinite(budgetMs) && budgetMs > 0 ? Math.round(budgetMs) : BUDGET_TRADUCTION_MS
  return {
    applique: true,
    raison,
    ms: attendu,
    budget_ms: budget,
    intent: INTENT_DE_REPLI,
    message: messageDeRepli({ raison, ms: attendu, budgetMs: budget }),
  }
}

/**
 * La phrase affichée. Elle dit TROIS choses, parce qu'en omettre une rendrait
 * le repli trompeur : que la phrase n'a pas été lue, combien de temps on a
 * attendu, et sur quoi la semaine va partir.
 */
export function messageDeRepli({ raison = RAISONS_REPLI.DELAI, ms = null, budgetMs = BUDGET_TRADUCTION_MS } = {}) {
  if (raison !== RAISONS_REPLI.DELAI) return 'Ta phrase n\'a pas été lue. La semaine partira sur « Équilibré ».'
  const secondes = (Math.round(budgetMs) / 1000).toString().replace('.', ',')
  const attendu = Number.isFinite(ms) ? ` (${Math.round(ms)} ms attendus)` : ''
  return `Ta phrase n'a pas été lue : la traduction a dépassé le budget de ${secondes} s${attendu}. `
    + 'Aucune contrainte n\'en a été déduite, et la semaine partira sur « Équilibré » — corrige les contraintes à la main si besoin.'
}
