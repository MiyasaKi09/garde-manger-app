/**
 * sourceDeVerite.js — qui détient la liste de courses (livrable 4.5).
 *
 * LE PROBLÈME, MESURÉ PLUTÔT QUE DÉCRIT
 *
 * Deux chemins écrivaient `nutrition_plan_shopping_items` pour le même import :
 *
 *   — la DEMANDE CANONIQUE : `finalDemands.js` agrège les besoins des demandes
 *     personnelles retenues, `canonicalPlanPayload.js` les publie, et la RPC
 *     `publish_canonical_final_demand_plan` écrit les lignes avec leur
 *     `plan_version_id`, leur `purchase_qty`, leur conditionnement et leur
 *     `planning_source` ;
 *   — le CHEMIN HÉRITÉ : `/api/courses/rebuild` → `shoppingListBuilder.js`,
 *     qui relit les DESCRIPTIONS des repas, les reparse, puis SUPPRIME toutes
 *     les lignes non cochées de l'import et réinsère les siennes.
 *
 * Ce que le second fait au premier, mesuré le 17 septembre 2026 sur la semaine
 * du 21 septembre 2026 réellement planifiée par le solveur et publiée par
 * `buildCanonicalPlanPayload`. Le banc est `tests/courses/sourceDeVeriteListe.test.js`
 * et il rejoue la mesure à chaque exécution ; ses paramètres sont ceux de
 * `tests/courses/exportListe.test.js` — deux membres sans quota carné déclaré,
 * garde-manger vide, faisceau 48 — et le nombre d'articles en dépend : le
 * rapport de qualité, qui planifie trois semaines avec quotas et historique
 * cumulé, en publie 110 pour la même date. Les deux sont justes ; ce sont deux
 * semaines différentes.
 *
 *   — 100 articles canoniques entrent, 11 lignes sortent ;
 *   — 97 articles disparaissent, 8 apparaissent qui n'y étaient pas, 3 seulement
 *     sont communs ;
 *   — les 8 apparus portent des noms cassés — « pomm e », « kiw i », « poir e » —
 *     parce que `parseIngredient` (`lib/ingredientResolver.js:132`) laisse son
 *     groupe d'unité mordre sur le nom : « 1 pomme » y devient unité « pomm »,
 *     nom « e » ;
 *   — aucune des lignes réinsérées ne porte `plan_version_id`. Le filtre de
 *     version de `lib/nutritionPlanService.js:290` ne retient que les lignes de
 *     la version active ou déjà cochées : sur cette semaine, 0 des 11 lignes
 *     reste visible. L'écran affiche une liste VIDE, et ne dit rien.
 *
 * CE QUE CE MODULE FAIT, ET CE QU'IL NE FAIT PAS
 *
 * Il ne supprime pas la route : un plan ancien, importé avant la chaîne
 * canonique, n'a pas d'autre moyen d'obtenir une liste reliée au stock, et une
 * route supprimée lui rendrait une liste vide sans rien dire. Il TRANCHE, à la
 * lecture des lignes de l'import : quand la demande canonique tient déjà la
 * liste, le chemin hérité s'efface et le dit ; quand elle ne la tient pas, il
 * reste le seul chemin et il travaille.
 *
 * Module pur : aucun accès réseau, aucun client Supabase. Il reçoit les lignes,
 * il rend une décision. La route l'appelle, la page l'appelle, et les deux
 * lisent donc la même règle.
 */

/** Les trois états possibles d'une liste, nommés. */
export const SOURCES = Object.freeze({
  CANONIQUE: 'demande_canonique',
  HERITE: 'chemin_herite',
  VIDE: 'liste_vide',
})

/**
 * Les valeurs de `planning_source` que la chaîne de publication canonique écrit.
 *
 * `'closed_loop'` est posé par l'INSERT de `publish_canonical_closed_loop_plan`
 * (`20260717000002_p2_planned_productions.sql:766`), puis remplacé par
 * `'final_demands'` par l'UPDATE de `publish_canonical_final_demand_plan`
 * (`20260721195504_planning_final_demand_truth.sql:307`). Les deux comptent :
 * un plan publié par la RPC P2 seule est canonique lui aussi.
 */
export const SOURCES_DE_PUBLICATION_CANONIQUE = Object.freeze(['final_demands', 'closed_loop'])

/**
 * Les colonnes que la publication canonique pose et que la reconstruction
 * héritée ne pose pas — donc ce que la liste perd à repasser par elle.
 *
 * Chacune est LUE en aval, et c'est ce qui fait qu'elle compte :
 *   — `plan_version_id` par le filtre de version (`nutritionPlanService.js:290`) ;
 *   — `purchase_qty` et `purchase_unit` par `quantiteLisible`
 *     (`lib/domain/courses/exportListe.js`), donc par les TROIS sorties ;
 *   — `container_qty`, `container_size`, `container_unit` par
 *     `conditionnementLisible`, donc par les trois sorties également ;
 *   — `aisle_order`, `shopping_status`, `planning_source`, `exact_required_qty`
 *     par la chaîne de publication et l'audit de cohérence des ressources.
 *
 * Mesuré sur la semaine du 21 septembre 2026 : `purchase_qty` est posée sur
 * 100 des 100 lignes canoniques et sur 0 des 11 lignes reconstruites.
 */
export const COLONNES_DE_LA_DEMANDE_CANONIQUE = Object.freeze([
  'plan_version_id',
  'planning_source',
  'purchase_qty',
  'purchase_unit',
  'container_qty',
  'container_size',
  'container_unit',
  'aisle_order',
  'shopping_status',
  'exact_required_qty',
])

/**
 * Un identifiant de version de plan DÉCLARÉ.
 *
 * La garde est écrite parce que la famille de fautes qu'elle ferme a déjà
 * frappé deux fois ici : `Number(true)` vaut 1, `Number([])` vaut 0. Ici la
 * valeur vient d'un corps de requête ou d'une ligne de base, et « vrai » ou
 * « tableau vide » ne sont pas des identifiants. Seule une chaîne non vide
 * compte ; un booléen, un tableau, un nombre, `null` ne comptent pas.
 */
function versionDeclaree(valeur) {
  return typeof valeur === 'string' && valeur.trim() !== ''
}

/** Une valeur de `planning_source` que la publication canonique a écrite. */
function publicationCanonique(valeur) {
  return typeof valeur === 'string'
    && SOURCES_DE_PUBLICATION_CANONIQUE.includes(valeur.trim())
}

/**
 * Une ligne tenue par la demande canonique.
 *
 * Deux marques, et il suffit d'une : la version de plan, et la source de
 * publication. La première seule laisserait passer une ligne d'un import
 * hérité rattachée après coup ; la seconde seule manquerait les lignes
 * publiées avant que `planning_source` ne soit renseignée. Aucune des deux
 * n'est devinée depuis le contenu de la ligne.
 */
export function ligneTenueParLaDemandeCanonique(ligne) {
  if (!ligne || typeof ligne !== 'object') return false
  return versionDeclaree(ligne.plan_version_id) || publicationCanonique(ligne.planning_source)
}

/**
 * Les colonnes de la demande canonique qu'une ligne ne porte pas.
 * Sert à dire ce qu'une reconstruction ferait perdre, colonne par colonne,
 * plutôt qu'à l'affirmer.
 */
export function colonnesAbsentes(ligne) {
  if (!ligne || typeof ligne !== 'object') return [...COLONNES_DE_LA_DEMANDE_CANONIQUE]
  return COLONNES_DE_LA_DEMANDE_CANONIQUE.filter((colonne) => {
    const valeur = ligne[colonne]
    return valeur === null || valeur === undefined || valeur === ''
  })
}

/**
 * Qui détient cette liste.
 *
 * @param {Array<object>} lignes  lignes de `nutrition_plan_shopping_items`
 * @returns {{
 *   source: string,
 *   total: number,
 *   canoniques: number,
 *   heritees: number,
 *   couverte: boolean,
 *   colonnesPerdues: string[]
 * }}
 */
export function sourceDeVeriteDeLaListe(lignes) {
  const source = Array.isArray(lignes) ? lignes.filter((ligne) => ligne && typeof ligne === 'object') : []
  const canoniques = source.filter(ligneTenueParLaDemandeCanonique)
  const heritees = source.length - canoniques.length

  if (source.length === 0) {
    return {
      source: SOURCES.VIDE,
      total: 0,
      canoniques: 0,
      heritees: 0,
      couverte: false,
      colonnesPerdues: [],
    }
  }

  // Une SEULE ligne canonique suffit à donner la liste à la demande canonique.
  // Le mélange existe : la RPC ne supprime que les lignes NON cochées avant de
  // réinsérer, donc une ligne cochée d'une version antérieure survit à la
  // publication suivante. Laisser la reconstruction héritée passer sur un tel
  // mélange détruirait les lignes canoniques pour garder l'ancienne.
  const tenue = canoniques.length > 0

  return {
    source: tenue ? SOURCES.CANONIQUE : SOURCES.HERITE,
    total: source.length,
    canoniques: canoniques.length,
    heritees,
    couverte: tenue,
    // Ce que la reconstruction ferait perdre : les colonnes que les lignes
    // canoniques portent aujourd'hui et qu'elle ne réécrit pas.
    colonnesPerdues: tenue
      ? COLONNES_DE_LA_DEMANDE_CANONIQUE.filter((colonne) => (
        canoniques.some((ligne) => {
          const valeur = ligne[colonne]
          return valeur !== null && valeur !== undefined && valeur !== ''
        })
      ))
      : [],
  }
}

/**
 * La question que la route et la page posent toutes les deux : la demande
 * canonique couvre-t-elle déjà cette liste ?
 *
 * Quand la réponse est oui, la reconstruction héritée n'a plus rien à rendre —
 * la mesure dit qu'elle n'y RETIRE que — et le bouton n'a plus rien à proposer.
 * Quand elle est non, le chemin hérité reste le seul, et le bouton reste.
 */
export function laDemandeCanoniqueCouvreLaListe(lignes) {
  return sourceDeVeriteDeLaListe(lignes).couverte
}
