/**
 * Vocabulaire des ORIGINES d'une forme alimentaire — ce que le catalogue
 * déclare et ce que le planificateur lit pour trancher carné / végétarien.
 *
 * Pourquoi un vocabulaire fermé, et pourquoi ici. Avant ce chantier, la
 * classification lisait une regex de treize mots sur les noms d'ingrédients et
 * trois catégories de rangement (`viandes`, `volailles`,
 * `poissons_fruits_de_mer`). Or la catégorie sert au rangement, pas à la
 * vérité culinaire : « Tofu ferme » est rangé en viandes (Ciqual le met dans
 * les substituts de produits carnés), le boudin noir en produits transformés,
 * le bouillon de volaille en préparations culinaires. Résultat mesuré : 22
 * plats classés végétariens contenaient du bouillon de volaille ou du boudin.
 *
 * L'origine est un attribut à part, DÉCLARÉ par le catalogue (voir
 * scripts/data/lib/origins.mjs pour la résolution par la taxonomie Ciqual, et
 * data/foods/arbitrations/lot21-origine-des-formes.json pour les décisions
 * explicites), et une seule valeur par forme. Une forme composite (pâtes aux
 * œufs, pâte brisée pur beurre, pain d'épices) porte l'origine la plus
 * contraignante de ses composants déclarés : une origine déclarée ne doit
 * jamais cacher un composant animal.
 *
 * Poisson contre fruits de mer : c'est L'ANIMAL qui décide, pas l'usage. Le
 * nuoc-mâm, le dashi, le fumet, la sauce Worcestershire sont faits de
 * poissons ; la sauce huître et le bouillon de crevette de mollusques et de
 * crustacés. Le planificateur lit les deux valeurs ensemble (FISH_ORIGINS),
 * si bien que la distinction ne change aucune décision carné / végétarien —
 * elle reste littérale pour qu'une règle future (allergie aux crustacés) la
 * lise sans table d'exceptions.
 *
 * 'inconnu' est une valeur à part entière : elle dit que personne n'a tranché.
 * Elle n'est PAS compatible végétarien — on ne devine pas dans le sens
 * favorable — et le planificateur l'expose (`unknownOrigins`) pour qu'elle
 * soit visible au lieu d'être absorbée.
 */

export const ORIGINS = Object.freeze([
  'vegetal',              // végétaux, champignons, algues, levures
  'mineral',              // sel, eau, bicarbonate, poudre à lever
  'animal:viande',        // bœuf, veau, porc, agneau, gibier, abats, charcuterie, saindoux, gélatine, fonds de viande
  'animal:volaille',      // poulet, dinde, canard, oie, poule, confit, graisse d'oie, bouillon de volaille
  'animal:poisson',       // poissons, et ce qui en est tiré (fumet, sauce poisson, dashi à la bonite, Worcestershire)
  'animal:fruits_de_mer', // crustacés, mollusques, sauce huître, bouillon de crevette
  'animal:oeuf',
  'animal:lait',
  'animal:miel',
  'animal:autre',         // animal sans précision (gélatine d'origine non dite, escargot, grenouille)
  'inconnu',              // non déclaré — ni compatible ni carné : à trancher
])

const ORIGIN_SET = new Set(ORIGINS)

/** Les seules origines qu'un plat végétarien peut contenir. Rien d'autre. */
export const VEGETARIAN_COMPATIBLE_ORIGINS = Object.freeze([
  'vegetal', 'mineral', 'animal:oeuf', 'animal:lait', 'animal:miel',
])
const VEGETARIAN_SET = new Set(VEGETARIAN_COMPATIBLE_ORIGINS)

/** Origines qui font d'un plat un plat de VIANDE au sens du planificateur. */
export const MEAT_ORIGINS = Object.freeze(['animal:viande', 'animal:volaille'])
const MEAT_SET = new Set(MEAT_ORIGINS)

/** Origines qui font d'un plat un plat de POISSON (mer au sens large). */
export const FISH_ORIGINS = Object.freeze(['animal:poisson', 'animal:fruits_de_mer'])
const FISH_SET = new Set(FISH_ORIGINS)

/**
 * Origines animales que le végétarien accepte mais que le végétalien refuse.
 * Le miel en fait partie : c'est un produit animal, même s'il ne coûte la vie à
 * personne — le végétalisme l'exclut, et ce n'est pas à nous d'en décider.
 */
export const VEGAN_EXCLUDED_COMPATIBLE_ORIGINS = Object.freeze(['animal:oeuf', 'animal:lait', 'animal:miel'])
const VEGAN_EXCLUDED_SET = new Set(VEGAN_EXCLUDED_COMPATIBLE_ORIGINS)

export function isKnownOrigin(value) {
  return ORIGIN_SET.has(value)
}

/**
 * Lit l'origine portée par un ingrédient matérialisé. Une origine absente ou
 * hors vocabulaire vaut 'inconnu' : c'est le seul cas où l'on « complète », et
 * c'est vers la valeur qui dit précisément qu'on ne sait pas.
 */
export function ingredientOrigin(ingredient) {
  const value = ingredient?.origin
  return ORIGIN_SET.has(value) ? value : 'inconnu'
}

export const isVegetarianCompatibleOrigin = (origin) => VEGETARIAN_SET.has(origin)
export const isMeatOrigin = (origin) => MEAT_SET.has(origin)
export const isFishOrigin = (origin) => FISH_SET.has(origin)
export const isVeganExcludedOrigin = (origin) => VEGAN_EXCLUDED_SET.has(origin)
