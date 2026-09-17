import { ingredientOrigin, isVegetarianCompatibleOrigin } from '../foods/origins'
import { MAX_MEAT_MEALS_PER_WEEK, declaredNumber } from '../planning/memberPlanningRules'

/**
 * L'OPTION CARNÉE D'UN PLAT VÉGÉTARIEN — livrable 3.6, réserve (a).
 *
 * CE QUE LE PLAN CONSTATE (§2.4 de `docs/PLAN_FINIR_MYKO.md`). P8 vaut zéro :
 * aucun faux végétarien n'est servi. Mais ce zéro porte sur les ingrédients
 * REQUIS. `classifyRecipe` range à part les ingrédients FACULTATIFS d'origine
 * non végétarienne et les expose sous `optionalNonVegetarian` — « les lardons
 * de la salade de chèvre chaud, le jambon de Bayonne de la piperade, le thon
 * des œufs mimosa ». Mesuré le 17 septembre 2026 sur `data/recipes/corpus-v3.json` :
 * DOUZE recettes publiables classées végétariennes en portent un (treize sur le
 * corpus entier, la treizième — REAL-196, Yu xiang qie zi — n'étant pas
 * publiable), et DIX-HUIT recettes NON végétariennes en portent un aussi. Et le
 * plan ajoute la phrase qui fait de ce constat un livrable : « aucun écran ne
 * lit ce champ ».
 *
 * ERRATUM, laissé visible parce qu'effacer une correction coûte plus cher que la
 * faute : la première rédaction de cet en-tête annonçait « treize recettes NON
 * végétariennes ». Le recomptage en trouve dix-huit. Le chiffre ne commande
 * rien ici — ces recettes-là ne passent jamais par ce module, un plat carné
 * restant un plat carné —, mais il était faux, et rien dans le dépôt ne le
 * contredisait. `tests/data/contratChiffres.test.js` recompte désormais les
 * trois nombres à chaque exécution.
 *
 * CE QUE CE MODULE DÉCIDE, ET CE QU'IL NE DÉCIDE PAS. Il répond à une seule
 * question : pour ce plat et ces mangeurs, l'option carnée est-elle servie ou
 * retirée ? Il ne retire jamais un ingrédient REQUIS — un plat carné reste un
 * plat carné, et c'est le rôle des jumeaux de lignée (livrable 1.2) de servir
 * autre chose. Il ne devine pas non plus une préférence : un foyer où personne
 * n'a rien déclaré garde l'option, exactement comme avant ce livrable.
 *
 * CE QUE « A DÉCLARÉ MANGER MOINS DE VIANDE » VEUT DIRE ICI, ET POURQUOI C'EST
 * ÉCRIT PLUTÔT QU'INTERPRÉTÉ. Trois déclarations, et trois seulement :
 *   1. un RÉGIME végétarien ou végétalien (`preferences.diets`) — le cas le
 *      plus fort : servir des lardons à un végétarien n'est pas une option,
 *      c'est une erreur ;
 *   2. un QUOTA carné déclaré et inférieur aux quatorze repas principaux de la
 *      semaine (`meat_meals_per_week`, livrable 1.1). Un quota à 14 n'est pas
 *      une restriction — la personne mange de la viande à chaque repas — et le
 *      traiter comme telle retirerait des lardons à quelqu'un qui n'a rien
 *      demandé ;
 *   3. des SWAPS végétariens déclarés (`vegetarian_meat_swaps_per_week`), le
 *      réglage d'avant le livrable 1.1, lu ici pour la même raison qu'ailleurs :
 *      un profil enregistré avant ce livrable ne doit pas changer de
 *      comportement au déploiement.
 * Tout le reste — un prénom, un objectif nutritionnel, une habitude observée —
 * n'est pas une déclaration et ne compte pas.
 *
 * UN SEUL MANGEUR SUFFIT. Le créneau est partagé : la casserole est commune. Si
 * l'un des deux a déclaré manger moins de viande, les lardons ne sont pas
 * ajoutés — on ne peut pas les retirer d'une seule assiette une fois qu'ils ont
 * cuit dedans. C'est la règle du plan, mot pour mot : « dès qu'un mangeur du
 * créneau a déclaré manger moins de viande ».
 *
 * Module PUR. Il ne lit ni base, ni horloge, ni corpus : on lui passe une
 * recette matérialisée et des membres.
 */

/** Motifs de retrait, rendus tels quels pour être affichés et contestés. */
export const MOTIFS_RETRAIT_OPTION = Object.freeze({
  REGIME_DECLARE: 'regime_declare',
  QUOTA_CARNE_DECLARE: 'quota_carne_declare',
  SWAPS_VEGETARIENS_DECLARES: 'swaps_vegetariens_declares',
})

const REGIME_SANS_VIANDE = /vegetar|vegan|vegetalien/

const replier = (valeur) => String(valeur || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

/**
 * Les ingrédients FACULTATIFS d'une recette dont l'origine n'est pas compatible
 * avec un régime végétarien.
 *
 * Même règle que `classifyRecipe.optionalNonVegetarian`, appliquée sur la même
 * donnée — l'origine DÉCLARÉE au catalogue, jamais le nom. Elle est recopiée
 * ici plutôt qu'importée parce que `classifyRecipe` vit dans le planificateur
 * (1 900 lignes, qui chargent le solveur entier) et que ce module doit pouvoir
 * être appelé par une route d'affichage. `tests/data/contratChiffres.test.js`
 * compare les deux recette par recette sur les 754 du corpus : si les deux
 * règles divergeaient, il échouerait d'un coup. Mesuré le 17 septembre 2026 :
 * zéro divergence sur 754.
 *
 * Rend les ingrédients eux-mêmes, et non leurs noms : l'appelant a besoin de la
 * forme normalisée pour les retirer d'une liste, et de la quantité pour les
 * afficher.
 */
export function optionsCarnees(recipe) {
  return (recipe?.exactIngredients || [])
    .filter((ingredient) => ingredient?.optional && !isVegetarianCompatibleOrigin(ingredientOrigin(ingredient)))
}

/**
 * Un membre a-t-il déclaré manger moins de viande ? `motif` dit laquelle des
 * trois déclarations l'établit ; `null` quand aucune.
 *
 * @returns {{refuse: boolean, motif: string|null}}
 */
export function declareMoinsDeViande(member) {
  const planning = member?.preferences?.planning || {}
  const diets = member?.preferences?.diets || member?.diets || []
  if ((Array.isArray(diets) ? diets : [diets]).some((diet) => REGIME_SANS_VIANDE.test(replier(diet)))) {
    return { refuse: true, motif: MOTIFS_RETRAIT_OPTION.REGIME_DECLARE }
  }
  // `declaredNumber` et non `Number` : `Number('')` vaut 0, et un profil vide
  // serait lu comme « zéro repas carné », c'est-à-dire une déclaration que
  // personne n'a faite. Même piège que le livrable 1.1, même parade.
  const quota = declaredNumber(planning.meat_meals_per_week)
  if (quota != null && quota >= 0 && quota < MAX_MEAT_MEALS_PER_WEEK) {
    return { refuse: true, motif: MOTIFS_RETRAIT_OPTION.QUOTA_CARNE_DECLARE }
  }
  const swaps = declaredNumber(planning.vegetarian_meat_swaps_per_week)
  if (swaps != null && swaps > 0) {
    return { refuse: true, motif: MOTIFS_RETRAIT_OPTION.SWAPS_VEGETARIENS_DECLARES }
  }
  return { refuse: false, motif: null }
}

/**
 * La décision, pour un plat et les mangeurs d'un créneau.
 *
 * @param {object} options
 * @param {object} options.recipe recette matérialisée
 * @param {Array<object>} options.mangeurs membres du foyer qui mangent ce créneau
 * @returns {{options: Array<object>, retiree: boolean, motif: string|null,
 *   declarePar: Array<{person_name: string, motif: string}>}}
 *   `options` est TOUJOURS rendu, retiré ou non : le plan demande que l'option
 *   soit AFFICHÉE, et une option retirée sans être nommée serait un ingrédient
 *   disparu. `retiree` est faux quand il n'y a pas d'option du tout — on ne
 *   retire pas ce qui n'existe pas.
 */
export function decisionOptionCarnee({ recipe, mangeurs = [] } = {}) {
  const options = optionsCarnees(recipe)
  const declarePar = (mangeurs || [])
    .map((membre) => ({ membre, ...declareMoinsDeViande(membre) }))
    .filter((entree) => entree.refuse)
    .map((entree) => ({
      person_name: entree.membre?.name || entree.membre?.person_name || null,
      motif: entree.motif,
    }))
  const retiree = options.length > 0 && declarePar.length > 0
  return {
    options: options.map((ingredient) => ({
      name: ingredient.name,
      formNormalized: ingredient.formNormalized,
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      grams: ingredient.grams ?? null,
      origin: ingredientOrigin(ingredient),
    })),
    retiree,
    // Le motif du créneau est celui de la déclaration la plus forte rencontrée,
    // dans l'ordre où elles sont écrites ci-dessus. Il est rendu à côté des
    // noms, pas à leur place : « retirée » sans savoir pour qui ni pourquoi ne
    // se conteste pas.
    motif: retiree ? declarePar[0].motif : null,
    declarePar,
  }
}

/**
 * Les ingrédients réellement servis, une fois la décision appliquée.
 *
 * Ne retire QUE les options carnées, et seulement quand elles sont retirées :
 * les autres ingrédients facultatifs (une herbe, un zeste) restent, parce que
 * rien ne les concerne.
 */
export function ingredientsApresDecision(recipe, decision) {
  const ingredients = recipe?.exactIngredients || []
  if (!decision?.retiree) return ingredients
  const retirees = new Set(decision.options.map((option) => option.formNormalized))
  return ingredients.filter((ingredient) => !retirees.has(ingredient.formNormalized))
}

/**
 * La phrase de l'écran, ou `null` quand la recette ne porte aucune option.
 *
 * Elle vit ici pour la même raison que `phraseEstimation` vit dans la couche
 * prix : trois écrans qui rédigent séparément finissent par dire trois choses
 * différentes d'une même décision, et le quatrième oublie de la dire.
 */
export function phraseOptionCarnee(decision) {
  if (!decision?.options?.length) return null
  const noms = decision.options.map((option) => option.name).join(', ')
  if (!decision.retiree) return `Option carnée : ${noms} — servie, personne n’a déclaré en manger moins.`
  const qui = decision.declarePar.map((entree) => entree.person_name).filter(Boolean)
  const motif = {
    [MOTIFS_RETRAIT_OPTION.REGIME_DECLARE]: 'régime déclaré',
    [MOTIFS_RETRAIT_OPTION.QUOTA_CARNE_DECLARE]: 'quota carné déclaré',
    [MOTIFS_RETRAIT_OPTION.SWAPS_VEGETARIENS_DECLARES]: 'repas végétariens déclarés',
  }[decision.motif] || decision.motif
  return qui.length
    ? `Option carnée : ${noms} — RETIRÉE (${qui.join(', ')} : ${motif}).`
    : `Option carnée : ${noms} — RETIRÉE (${motif}).`
}
