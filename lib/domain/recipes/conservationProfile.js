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
