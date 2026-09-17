/**
 * LE TEMPS DIT VRAI — livrable 2.4 de `docs/PLAN_FINIR_MYKO.md` (§5, phase 2).
 *
 * LA PLAINTE À LAQUELLE CE FICHIER RÉPOND est citée dans le plan et vient d'un
 * utilisateur d'une application concurrente : « 2 h annoncées, j'ai chronométré,
 * 5 h 36 » (avis Basta Batchcooking, §10 du plan). Un temps annoncé qu'on ne
 * peut pas relier à un calcul est la plus rapide des désinstallations : il se
 * démentit tout seul, une fois, dans la cuisine, un dimanche.
 *
 * DEUX RÈGLES, ET ELLES SONT LE LIVRABLE
 *
 * 1. UN TEMPS AFFICHÉ EST UNE SOMME DE TEMPS MESURÉS, jamais une estimation
 *    ronde. Ici « mesuré » veut dire DÉCLARÉ par la recette (`prepMinutes`,
 *    `cookMinutes`) ou par le modèle de session (les cinq minutes de
 *    portionnage par repas couvert, la tâche de congélation) — pas une valeur
 *    dérivée d'un nom de plat ni arrondie à la demi-heure. Quand une seule
 *    déclaration manque, la somme vaut `null` et les manquants sont NOMMÉS :
 *    c'est la règle du §9.3 du plan (« zéro chiffre affiché non calculé »), et
 *    c'est ce qui distingue « on ne sait pas » de « zéro ».
 *
 * 2. TROIS DÉFINITIONS, CHACUNE AVEC SON NOM. Le §8 du plan tranche : le
 *    critère P10 est la **préparation active engagée**, cible ≤ 300 minutes, et
 *    les trois chiffres s'affichent avec leur définition. « Un seul chiffre
 *    affiché sans sa définition est un chiffre faux » — parce que 330, 420 et
 *    1 295 décrivent la même semaine et que celui qui lit ne peut pas deviner
 *    lequel on lui montre.
 *
 * D'OÙ VIENNENT CES TROIS DÉFINITIONS, MOT POUR MOT. Elles ne sont pas
 * inventées ici : elles sont celles que `tests/planning/rapportQualiteSemaine.test.js`
 * calcule pour la ligne P10 du rapport de qualité (livrable 0a.5), sous les
 * mêmes noms (`engagee`, `toutFrais`, `avecCuisson`) et avec le même décompte
 * des réchauffages à part. Ce module ne redéfinit rien : il rend disponible à
 * L'ÉCRAN le calcul que le rapport fait déjà en CI, pour que le chiffre affiché
 * au foyer et le chiffre consigné au rapport soient le même chiffre. S'ils
 * divergeaient, l'un des deux serait faux et personne ne saurait lequel.
 * `tests/planning/tempsSession.test.js` relit le fichier du rapport et échoue
 * si ses quatre lignes de calcul changent de forme.
 *
 * CE QUE CE MODULE N'EST PAS. Ce n'est pas un chronomètre : le temps CONSTATÉ
 * ne se calcule pas, il se déclare (table `public.cooking_session_times`,
 * migration 20260918120000). Ce module sait seulement dire ce qui a été
 * annoncé, et faire la soustraction — la seule opération qui rende l'annonce
 * vérifiable.
 */

import { BATCH_PORTIONING_ACTIVE_MINUTES } from './cookingSessions'
import { declaredNumber } from './memberPlanningRules'
import { MEAL_SOURCES } from './repetitionRules'

/**
 * Minutes actives d'un réchauffage. RECOPIÉ de `REHEAT_TASK_MINUTES` du
 * payload canonique et de `MINUTES_RECHAUFFAGE` du rapport de qualité, où il
 * vaut 10 depuis le lot P2. Le test de ce livrable relit les deux fichiers et
 * échoue si l'une des valeurs y change : une recopie non vérifiée dérive.
 */
export const MINUTES_RECHAUFFAGE = 10

/** Cinq minutes de portionnage par repas couvert (`cookingSessions.js`). */
export const MINUTES_PORTIONNAGE_PAR_REPAS = BATCH_PORTIONING_ACTIVE_MINUTES

/**
 * Cible du critère P10, sous la définition retenue au §8 du plan.
 *
 * Elle a été REFIXÉE avec la définition, et le plan le dit explicitement :
 * « la cible ≤ 600 a été fixée le 3 septembre contre la définition "tout
 * frais" […] si la préparation active engagée est retenue, la cible se refixe
 * avec elle — ≤ 300 minutes est la proposition ». Changer de définition sans
 * refixer la cible aurait fait gagner P10 par un changement de règle.
 *
 * Ce que le plan ajoute et qu'on n'efface pas : « elle est tenue dès
 * aujourd'hui, ce qui doit être dit plutôt que masqué ». La mesure du rapport
 * de qualité dit autre chose — 330, 305 et 325 minutes sur trois semaines,
 * donc 0/3 sous la cible. C'est la MESURE qui fait foi ici, pas la phrase ;
 * l'écran affiche le dépassement quand il existe.
 */
export const CIBLE_PREPARATION_ACTIVE_ENGAGEE_MINUTES = 300

/**
 * Types de tâches qui appartiennent à une SESSION DE CUISINE.
 *
 * Même liste que `cookingSessions.js` (`COOKING_TASK_TYPES`), augmentée des
 * deux variantes de préparation que la chaîne de publication émet
 * (`prepare_recipe_variant`, `prepare_support`) et que le compteur de la page
 * « jour de cuisine » retient déjà. Réchauffer et décongeler n'en font pas
 * partie : ces minutes-là se dépensent le jour où l'on mange, pas le jour où
 * l'on cuisine.
 */
export const TYPES_TACHES_DE_CUISINE = Object.freeze([
  'prepare_recipe', 'prepare_recipe_variant', 'prepare_support', 'freeze_dish',
])

/**
 * LES TROIS DÉFINITIONS, avec leur nom et leur phrase. Elles vivent dans le
 * CODE et non dans le plan publié : le payload ne porte que des nombres, si
 * bien qu'une formulation peut être reprise sans republier une semaine, et
 * qu'un nombre ne peut jamais être servi sans le texte qui dit ce qu'il compte.
 */
export const DEFINITIONS_TEMPS = Object.freeze([
  Object.freeze({
    id: 'preparation_active_engagee',
    nom: 'Préparation active engagée',
    definition: 'Les minutes de préparation des plats réellement cuisinés cette semaine. '
      + 'Un repas réchauffé n’y compte pas : il n’est pas recuisiné.',
    critere: true,
    cibleMax: CIBLE_PREPARATION_ACTIVE_ENGAGEE_MINUTES,
  }),
  Object.freeze({
    id: 'preparation_active_tout_frais',
    nom: 'Préparation active si tout est frais',
    definition: 'La même somme sur les quatorze créneaux, comme si aucune portion n’était mutualisée. '
      + 'C’est le comparable du « tout frais » mesuré le 3 septembre 2026.',
    critere: false,
    cibleMax: null,
  }),
  Object.freeze({
    id: 'preparation_plus_cuisson',
    nom: 'Préparation + cuisson, tout frais',
    definition: 'La précédente augmentée des minutes de cuisson, y compris celles qui ne demandent aucune surveillance. '
      + 'C’est le chiffre le plus gros, et le moins représentatif du temps passé debout.',
    critere: false,
    cibleMax: null,
  }),
])

/**
 * Minutes DÉCLARÉES, ou `null`. Jamais `Number(valeur)` : `Number(null)`,
 * `Number('')`, `Number([])` et `Number(false)` valent tous **zéro**, et une
 * durée manquante lue ainsi devient « ce plat se prépare en zéro minute » —
 * un attribut fabriqué qui a exactement la tête d'un attribut vrai. Le dépôt a
 * déjà écrit cette garde pour le quota carné (`declaredNumber`,
 * `memberPlanningRules.js`) : on la réemploie plutôt que d'en poser une
 * seconde. Le premier jet de ce fichier utilisait `Number` et
 * `tests/planning/tempsSession.test.js` l'a attrapé.
 */
const minutesDeclarees = (valeur) => {
  const nombre = declaredNumber(valeur)
  return nombre != null && nombre >= 0 ? nombre : null
}

const arrondi = (valeur) => Math.round((Number(valeur) || 0) * 100) / 100

/**
 * Les trois temps d'une semaine, à partir des créneaux du plan et des recettes.
 *
 * @param {object[]} slots      créneaux du plan (`plan.slots`), avec `source` et `recipeCode`
 * @param {Map}      recipeByCode recettes indexées par code
 * @returns {{ minutes: object, rechauffages: object, manquants: object[], complet: boolean }}
 *   `minutes` porte une clé par définition ; une valeur `null` veut dire
 *   « non calculable », jamais zéro.
 */
export function tempsDeLaSemaine({ slots = [], recipeByCode = new Map() } = {}) {
  const manquants = []
  let engagee = 0
  let toutFrais = 0
  let cuisson = 0
  let creneauxRechauffes = 0
  let prepManquante = false
  let cuissonManquante = false

  for (const slot of slots || []) {
    const code = slot?.recipeCode ?? slot?.recipe_code ?? null
    const recipe = code ? recipeByCode.get(code) : null
    const cuisine = (slot?.source ?? MEAL_SOURCES.FRESH) === MEAL_SOURCES.FRESH
    if (!cuisine) creneauxRechauffes += 1
    if (!recipe) {
      manquants.push({ slot_key: slot?.key ?? slot?.slot_key ?? null, recipe_code: code, champ: 'recette' })
      prepManquante = true
      cuissonManquante = true
      continue
    }
    const prep = minutesDeclarees(recipe.prepMinutes)
    const cuire = minutesDeclarees(recipe.cookMinutes)
    if (prep == null) {
      manquants.push({ slot_key: slot?.key ?? slot?.slot_key ?? null, recipe_code: code, champ: 'prepMinutes' })
      prepManquante = true
    } else {
      toutFrais += prep
      if (cuisine) engagee += prep
    }
    if (cuire == null) {
      manquants.push({ slot_key: slot?.key ?? slot?.slot_key ?? null, recipe_code: code, champ: 'cookMinutes' })
      cuissonManquante = true
    } else {
      cuisson += cuire
    }
  }

  return {
    minutes: {
      // Une seule déclaration manquante et la somme n'est plus une somme :
      // elle devient un minorant, et un minorant affiché comme un total est
      // exactement le chiffre faux que ce livrable interdit.
      preparation_active_engagee: prepManquante ? null : arrondi(engagee),
      preparation_active_tout_frais: prepManquante ? null : arrondi(toutFrais),
      preparation_plus_cuisson: prepManquante || cuissonManquante ? null : arrondi(toutFrais + cuisson),
    },
    // Rapportés à part, exactement comme le fait le rapport de qualité : ils ne
    // sont PAS dans la définition retenue, et les ajouter en douce à
    // « engagée » changerait le critère sans le dire.
    rechauffages: { creneaux: creneauxRechauffes, minutes: creneauxRechauffes * MINUTES_RECHAUFFAGE },
    manquants,
    complet: manquants.length === 0,
  }
}

/**
 * Minutes ANNONCÉES d'une session de cuisine : la somme des durées de ses
 * tâches de cuisine, plus le portionnage des repas qu'elle couvre.
 *
 * C'est le même calcul que `active_minutes_total` de `buildCookingSessions`,
 * refait ici sur les lignes de `nutrition_plan_prep_tasks` telles que l'écran
 * les reçoit — la publication ne stocke pas les sessions, seulement les tâches.
 * Ce que la page « jour de cuisine » affichait avant ce livrable ne comptait
 * QUE les tâches « Préparer » : ni le portionnage, ni la tâche de congélation.
 * Le chiffre était donc, structurellement, plus petit que la réalité modélisée.
 *
 * @param {object[]} tasks            tâches du jour (`task_type`, `duration_min`)
 * @param {number}   repasCouverts    repas couverts par les productions cuites ce jour-là
 */
export function minutesDeSession({ tasks = [], repasCouverts = 0 } = {}) {
  const lignes = []
  const manquants = []
  let total = 0
  for (const task of tasks || []) {
    if (!TYPES_TACHES_DE_CUISINE.includes(task?.task_type)) continue
    const minutes = minutesDeclarees(task?.duration_min)
    if (minutes == null) {
      manquants.push({ task_key: task?.stable_key ?? task?.task_key ?? null, champ: 'duration_min' })
      continue
    }
    total += minutes
    lignes.push({ libelle: task?.task || task?.title || 'Préparation', minutes })
  }
  const portionnage = Math.max(0, Math.trunc(Number(repasCouverts) || 0)) * MINUTES_PORTIONNAGE_PAR_REPAS
  if (portionnage > 0) {
    lignes.push({ libelle: `Portionner et ranger (${repasCouverts} repas)`, minutes: portionnage })
    total += portionnage
  }
  return {
    // `null` dès qu'une durée manque : la page affichera « non calculé », pas
    // un total amputé.
    minutes: manquants.length ? null : arrondi(total),
    lignes,
    manquants,
  }
}

/**
 * L'ÉCART ENTRE L'ANNONCÉ ET LE CONSTATÉ, consigné après chaque session réelle.
 *
 * Il est CALCULÉ, jamais stocké : deux nombres et une soustraction. Stocker
 * l'écart à côté de ses opérandes ouvrirait la possibilité qu'il ne corresponde
 * plus à aucun des deux — c'est déjà la doctrine du dépôt pour les fourchettes
 * de prix. `null` tant que l'un des deux manque : un écart contre rien n'est
 * pas un écart de zéro.
 */
export function ecartAnnonceConstate({ annonce = null, constate = null } = {}) {
  const a = minutesDeclarees(annonce)
  const c = minutesDeclarees(constate)
  if (a == null || c == null) return null
  const minutes = arrondi(c - a)
  return {
    annonce: a,
    constate: c,
    minutes,
    // Rapport constaté/annoncé, pour que « 2 h annoncées, 5 h 36 constatées »
    // se lise aussi comme « 2,8 fois ». Indéfini quand l'annonce vaut zéro :
    // on ne divise pas pour faire joli.
    facteur: a > 0 ? arrondi(c / a) : null,
  }
}

/**
 * Minutes en heures et minutes, à la française — « 5 h 36 », « 45 min ».
 * Aucun arrondi : c'est une écriture, pas un calcul. `null` reste `null`.
 */
export function formatMinutes(minutes) {
  const valeur = minutesDeclarees(minutes)
  if (valeur == null) return null
  const entier = Math.round(valeur)
  if (entier < 60) return `${entier} min`
  const heures = Math.floor(entier / 60)
  const reste = entier % 60
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`
}

/**
 * Bloc publié dans `validation_summary.cooking_time` : des NOMBRES et des
 * identifiants, aucune prose. Le texte des définitions vit dans
 * `DEFINITIONS_TEMPS` et l'écran l'y lit par identifiant — une formulation peut
 * ainsi être reprise sans republier une semaine, et aucun nombre ne peut être
 * servi sans le texte qui dit ce qu'il compte.
 */
export function blocTempsPublie({ slots = [], recipeByCode = new Map() } = {}) {
  const temps = tempsDeLaSemaine({ slots, recipeByCode })
  return {
    ...temps.minutes,
    rechauffages_minutes: temps.rechauffages.minutes,
    rechauffages_creneaux: temps.rechauffages.creneaux,
    cible_preparation_active_engagee: CIBLE_PREPARATION_ACTIVE_ENGAGEE_MINUTES,
    manquants: temps.manquants,
  }
}
