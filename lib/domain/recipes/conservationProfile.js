/**
 * Profil de conservation DÉCLARÉ d'une recette, tel que le moteur le lit.
 *
 * Le corpus porte `conservation_profile` (snake_case, écrit par
 * scripts/data/recipes/derive-conservation-profiles.mjs depuis la prose et
 * les arbitrages manuels). Le moteur lit sa forme camelCase, et rien d'autre :
 * plus de regex sur la prose, le nom ou la catégorie du plat. Ce module est la
 * seule traduction entre les deux, partagée par le catalogue versionné
 * (materializeRecipe) et le catalogue servi par l'API (operationalCatalog),
 * pour qu'une même recette ait le même profil quel que soit le chemin.
 *
 * Absence = absence. Un profil manquant rend null, un champ manquant rend
 * null (ou false pour `eatImmediately`, qui est une affirmation : ne pas
 * l'avoir déclarée n'est pas déclarer qu'on doit manger tout de suite).
 * Aucune valeur par défaut n'est posée ici : c'est au lecteur de décider quoi
 * faire d'un null, et le planificateur choisit de ne rien produire.
 */

const asBoolean = (value) => (typeof value === 'boolean' ? value : null)
const asPositiveNumber = (value) => {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

export function conservationProfileFromCorpus(profile) {
  if (!profile || typeof profile !== 'object') return null
  return {
    fridgeHours: asPositiveNumber(profile.fridge_hours),
    eatImmediately: profile.eat_immediately === true,
    freezable: asBoolean(profile.freezable),
    freezerMonths: asPositiveNumber(profile.freezer_months),
    serveCold: asBoolean(profile.serve_cold),
    source: profile.source || null,
  }
}

/**
 * Même profil, mais tel que la BASE le publie depuis le contrat opérationnel
 * (migration 20260917110000) : la RPC traduit la colonne `conservation_profile`
 * vers le vocabulaire du moteur, et cette fonction est la porte par laquelle il
 * entre.
 *
 * POURQUOI RENORMALISER CE QUE LA BASE A DÉJÀ TRADUIT. Parce qu'un profil venu
 * du réseau n'est pas une valeur du programme : une RPC d'une version
 * antérieure, un déploiement à moitié migré ou une colonne remplie à la main
 * peuvent rendre autre chose que ce que le contrat promet. Un profil resté en
 * snake_case passerait alors le test « c'est bien un objet » et donnerait un
 * `fridgeHours` indéfini ; un `freezable` valant 'oui' se lirait comme vrai
 * dans un `if`. Les deux décideraient de vraies productions sans bruit, et
 * c'est le genre de valeur plausible et fausse que ce dépôt refuse.
 *
 * La règle est donc la même que côté corpus, champ par champ : une durée qui
 * n'est pas un nombre fini strictement positif vaut null (une chaîne « 12 »
 * reste le nombre 12 — c'est la même valeur, pas une valeur inventée) ; un
 * booléen qui n'en est pas un vaut null ; `eatImmediately` ne vaut vrai que
 * s'il a été déclaré vrai. Ce qui ne ressemble pas au contrat retombe sur
 * l'ABSENCE, que le planificateur sait traiter — il ne produit rien — et jamais
 * sur une durée de repli.
 */
export function conservationProfileFromContract(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return null
  return {
    fridgeHours: asPositiveNumber(profile.fridgeHours),
    eatImmediately: profile.eatImmediately === true,
    freezable: asBoolean(profile.freezable),
    freezerMonths: asPositiveNumber(profile.freezerMonths),
    serveCold: asBoolean(profile.serveCold),
    source: typeof profile.source === 'string' && profile.source ? profile.source : null,
  }
}
