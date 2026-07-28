import { normalizeFoodForm } from '../recipes/materializeRecipe'

/**
 * Ce qu'une recette EST dans l'assiette, et non ce que ses grammes laissent
 * deviner.
 *
 * Le moteur composait l'assiette par inférence pure : moins de 25 g de glucides
 * structurels par part, il ajoutait un féculent ; moins de 100 g d'équivalents
 * légumes, il ajoutait des haricots verts. Mesuré sur les 118 recettes
 * publiables, cela donnait 97 recettes accompagnées, dont 32 de DEUX
 * accompagnements — un tiramisu servi avec du riz blanc et des haricots verts,
 * une mousse au chocolat de même, une béchamel de même, du houmous de même.
 * Des haricots verts persillés recevaient du riz, et une purée de pommes de
 * terre recevait des haricots verts : un accompagnement accompagné.
 *
 * La cause n'est pas un seuil mal réglé. C'est que la recette n'avait aucun
 * moyen de dire ce qu'elle est. Les lasagnes se suffisent ; une quiche
 * lorraine se suffit ou s'accompagne d'une salade ; un pavé de saumon poêlé
 * appelle un féculent. Cette connaissance est éditoriale — elle appartient à la
 * recette, pas à un calcul sur ses grammes.
 *
 * Une recette peut donc déclarer `plate: { role, accepts, reason }`. À défaut,
 * on dérive un rôle par des règles explicites et conservatrices. Dans tous les
 * cas, une règle absolue : JAMAIS plus d'un accompagnement.
 */

const fold = (value) => normalizeFoodForm(value)

export const PLATE_ROLES = Object.freeze({
  /** Se suffit. N'accepte aucun accompagnement. */
  COMPLETE: 'complete',
  /** Plat principal auquel il manque une composante. En accepte UNE. */
  MAIN: 'main',
  /** Est lui-même un accompagnement. N'en reçoit jamais. */
  SIDE: 'side',
  /** Se sert en fin de repas. N'en reçoit jamais. */
  DESSERT: 'dessert',
  /** Préparation de base — béchamel, pâte, sauce. Ne se sert pas seule. */
  COMPONENT: 'component',
})

const ROLES_VALIDES = new Set(Object.values(PLATE_ROLES))

/** Ce qu'on sait adjoindre. On n'ajoute jamais de protéine : ce serait cuisiner. */
export const COMPOSANTES_ADJOIGNABLES = Object.freeze(['starch', 'vegetables'])

// Le nom d'un plat n'est pas sa nature : « Boulettes de bœuf sauce tomate » ne
// devient pas une sauce parce que le mot y figure, et « Salade de lentilles,
// œuf mollet » est un repas complet et non une garniture. Les motifs sont donc
// ANCRÉS — la catégorie, ou le début du nom — et jamais cherchés au milieu.
const DESSERT_CATEGORIE = /^(dessert|gateau|tarte sucree|patisserie|glace|sorbet|entremets|viennoiserie|biscuit)/
const DESSERT_NOM = /^(tiramisu|panna cotta|riz au lait|semoule au lait|mousse au chocolat|creme brulee|creme dessert|clafoutis|crumble|far breton|kouign|banana bread|fondant au chocolat|moelleux au chocolat|gateau |tarte aux |crepes?|pancakes?|gaufres?|compote|flan |sable|cookie|madeleine|brioche|chausson aux pommes|confiture)/

const COMPOSANT_CATEGORIE = /^(sauce|base|preparation de base|condiment|pate a|boisson|pate feuilletee|pate brisee|pate sablee)/
const COMPOSANT_NOM = /^(sauce |bechamel|fond de |fumet |marinade|pesto|vinaigrette|mayonnaise|aioli|beurre compose|pate a |pate brisee|pate feuilletee|pate sablee|chutney|pickles|sirop )/

const ACCOMPAGNEMENT_CATEGORIE = /^(accompagnement|garniture|feculent|legume d accompagnement)/
const ACCOMPAGNEMENT_NOM = /^(puree de |riz pilaf|semoule |frites|poelee de |legumes rotis|salade verte|crudites|gratin de legumes|pommes de terre sautees|haricots verts|ratatouille|pain |focaccia|naan)/

const SOUPE_CATEGORIE = /^(soupe|veloute|potage|bouillon)/
const SOUPE_NOM = /^(soupe |veloute |potage |minestrone|gaspacho|bouillon )/

const identite = (recipe) => ({
  nom: fold(recipe?.family || recipe?.title || ''),
  categorie: fold(recipe?.category || recipe?.editorial?.category || ''),
})

/**
 * Le rôle déclaré par la recette, s'il est valide. C'est la source qui prime :
 * un rédacteur qui écrit « ce plat se suffit » en sait plus que n'importe quel
 * seuil sur les grammes.
 */
export function declaredPlateRole(recipe) {
  const declaration = recipe?.plate || recipe?.editorial?.plate
  const role = String(declaration?.role || '').trim()
  if (!ROLES_VALIDES.has(role)) return null
  const accepts = Array.isArray(declaration.accepts)
    ? declaration.accepts.filter((item) => COMPOSANTES_ADJOIGNABLES.includes(item))
    : []
  return { role, accepts, reason: declaration.reason || null, source: 'declared' }
}

/**
 * À défaut de déclaration, on déduit — mais par ce que le plat EST, pas par ce
 * qui lui manque. L'ordre compte : un dessert reste un dessert même s'il est
 * pauvre en légumes, et c'était précisément le trou par lequel le riz blanc
 * arrivait dans le tiramisu.
 */
export function derivePlateRole(recipe, analysis = {}) {
  const { nom, categorie } = identite(recipe)

  if (DESSERT_CATEGORIE.test(categorie) || DESSERT_NOM.test(nom)) {
    return { role: PLATE_ROLES.DESSERT, accepts: [], reason: 'reconnu comme dessert', source: 'derived' }
  }
  if (COMPOSANT_CATEGORIE.test(categorie) || COMPOSANT_NOM.test(nom)) {
    return { role: PLATE_ROLES.COMPONENT, accepts: [], reason: 'préparation de base, ne se sert pas seule', source: 'derived' }
  }
  if (ACCOMPAGNEMENT_CATEGORIE.test(categorie) || ACCOMPAGNEMENT_NOM.test(nom)) {
    return { role: PLATE_ROLES.SIDE, accepts: [], reason: 'est lui-même un accompagnement', source: 'derived' }
  }

  // Une soupe-repas se suffit ; une soupe d'entrée n'appelle pas du riz.
  if (SOUPE_CATEGORIE.test(categorie) || SOUPE_NOM.test(nom)) {
    return { role: PLATE_ROLES.COMPLETE, accepts: [], reason: 'préparation liquide, servie telle quelle', source: 'derived' }
  }

  if (!analysis.compositionKnown) {
    return { role: PLATE_ROLES.COMPLETE, accepts: [], reason: 'composition inconnue — on n’invente rien', source: 'derived' }
  }

  if (analysis.hasStarch && analysis.hasVegetables && analysis.hasProtein) {
    return { role: PLATE_ROLES.COMPLETE, accepts: [], reason: 'protéine, féculent et légumes réunis', source: 'derived' }
  }

  // Sans protéine ET sans féculent, ce n'est pas un plat principal amputé :
  // c'est une garniture. Lui adjoindre du riz en ferait un plat qu'il n'est pas.
  if (!analysis.hasProtein && !analysis.hasStarch) {
    return { role: PLATE_ROLES.SIDE, accepts: [], reason: 'ni protéine ni féculent — sert de garniture', source: 'derived' }
  }

  // Une protéine ET un féculent font un plat. L'absence de légumes n'est pas un
  // manque structurel : personne ne sert de haricots verts avec une carbonara,
  // une pizza ou un cacio e pepe, et c'est pourtant ce que faisait le moteur.
  // Les légumes restent OFFERTS — une quiche lorraine se suffit ou s'accompagne
  // d'une salade — mais jamais ajoutés d'office.
  if (analysis.hasProtein && analysis.hasStarch) {
    return {
      role: PLATE_ROLES.COMPLETE,
      accepts: analysis.hasVegetables ? [] : ['vegetables'],
      reason: analysis.hasVegetables
        ? 'protéine, féculent et légumes réunis'
        : 'protéine et féculent réunis ; une salade peut compléter, sans être nécessaire',
      source: 'derived',
    }
  }

  return {
    role: PLATE_ROLES.MAIN,
    accepts: ['starch', ...(!analysis.hasVegetables ? ['vegetables'] : [])],
    reason: 'plat protéiné sans féculent',
    source: 'derived',
  }
}

export function plateRoleOf(recipe, analysis = {}) {
  return declaredPlateRole(recipe) || derivePlateRole(recipe, analysis)
}

/**
 * La composante à adjoindre, s'il y en a une. Au plus UNE, toujours.
 *
 * Quand il manque à la fois un féculent et des légumes, on ajoute le féculent :
 * il structure l'assiette et pèse davantage dans l'équilibre. L'autre manque
 * n'est pas comblé en douce, il est rapporté — c'est à l'utilisateur de décider
 * s'il ouvre une boîte de haricots, pas au moteur d'empiler.
 */
export function componentToAdd(role) {
  if (role.role !== PLATE_ROLES.MAIN) return null
  if (role.accepts.includes('starch')) return 'starch'
  if (role.accepts.includes('vegetables')) return 'vegetables'
  return null
}
