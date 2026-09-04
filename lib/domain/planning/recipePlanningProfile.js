/**
 * Profil de planification d'une recette (plan de refonte §14).
 *
 * Le moteur a besoin de bien plus que le nom d'un plat pour décider où le
 * placer : sa complétude, ses familles, sa tenue au réchauffage, sa
 * congélabilité, son intérêt en production, son effort. Ce module assemble ce
 * profil à partir de deux sources, dans cet ordre :
 *
 * 1. les champs DÉCLARÉS par le corpus (`recipe.reheatQuality`,
 *    `recipe.batchable`, `recipe.freezable`, et surtout
 *    `recipe.conservationProfile` — durée réfrigérateur, consommation
 *    immédiate, congélation, service froid) — la vérité éditoriale prime
 *    toujours ;
 * 2. à défaut, pour la SEULE tenue au réchauffage, une dérivation
 *    DÉTERMINISTE de la composition réelle (ingrédients, techniques,
 *    textures). Jamais une inférence sur le nom du plat : « gratin de
 *    macaronis » et « salade de macaronis » ne se distinguent pas par leur
 *    titre mais par leurs ingrédients et leur technique.
 *
 * Ce qui a été RETIRÉ, et pourquoi (docs/PLAN_PLANNING_PARFAIT.md §2.5) : le
 * service froid était deviné par une regex sur le nom et la catégorie
 * (`salade|carpaccio|…`) — le pan bagnat, catégorie « sandwich », n'y était
 * pas et se retrouvait produit en batch puis « réchauffé » ; la congélabilité
 * et la conservation étaient lues dans la prose. Désormais `servedCold`,
 * `eatImmediately`, `fridgeHours` et `freezable` viennent du profil déclaré,
 * et une recette SANS profil n'est pas documentée : on ne sait pas juger sa
 * tenue, donc on ne la produit pas d'avance.
 *
 * Une recette dont la composition n'est pas documentée reçoit un profil
 * `documented: false`. Le plan demande que ces recettes restent « exclues du
 * moteur avancé jusqu'à validation » : concrètement, elles ne sont jamais
 * choisies pour une production multi-portions — elles restent parfaitement
 * utilisables en cuisson fraîche.
 */

import { analyzeMealCompleteness } from './mealComposition'
import { isRecipeFreezable, freezerShelfLifeDays } from './cookingSessions'

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

/** Qualité de tenue d'un plat au réchauffage, de la meilleure à la pire. */
export const REHEAT_QUALITY = { GOOD: 'good', FAIR: 'fair', POOR: 'poor' }
const REHEAT_RANK = { good: 2, fair: 1, poor: 0 }

/** Intérêt d'un plat en production multi-portions. */
export const BATCHABILITY = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }

// Techniques qui GAGNENT au réchauffage : les plats en sauce, longuement
// cuits, se bonifient. Techniques qui le SUPPORTENT mal : tout ce dont la
// qualité tient à une texture obtenue au dernier moment.
const REHEAT_FRIENDLY_TECHNIQUES = /mijotage|braisage|ragout|compotage|confisage|gratin|four|rotissage|etuvee|pochage/
const REHEAT_HOSTILE_TECHNIQUES = /friture|saisie minute|snacking|plancha|grillade|wok|tempura|panure/
// Textures perdues au réchauffage.
const FRAGILE_TEXTURES = /croustillant|croquant|craquant|fondant glace|mousseux|aerien/
// Plus de liste de mots pour le service froid : il est DÉCLARÉ
// (`conservationProfile.serveCold`), ou inconnu.

/** Un plat mutualisable doit se garder au moins jusqu'au surlendemain. */
export const MIN_BATCH_FRIDGE_HOURS = 48

const PASTA_FORMS = /\b(pate|pates|spaghetti|tagliatelle|penne|macaroni|linguine|fusilli|nouille|vermicelle|tagliatelles)\b/
const SAUCE_ROLE = /sauce|coulis|creme|bechamel|jus|bouillon/

const asBoolean = (value) => (typeof value === 'boolean' ? value : null)

/**
 * Les pâtes DÉJÀ MÉLANGÉES à leur sauce se dégradent : elles continuent
 * d'absorber le liquide au repos puis se défont au réchauffage. Le plan les
 * cite nommément comme contre-exemple du batch. C'est une propriété de
 * COMPOSITION — pâtes structurelles + sauce dans le même plat — et non du nom
 * du plat. Un gratin, dont la tenue vient de la cuisson au four, y échappe.
 */
function isLooseMixedPasta(recipe, techniques) {
  const ingredients = (recipe?.exactIngredients || []).filter((ingredient) => !ingredient?.optional)
  const hasPasta = ingredients.some((ingredient) => PASTA_FORMS.test(fold(ingredient.formNormalized || ingredient.name)))
  if (!hasPasta) return false
  const hasSauce = ingredients.some((ingredient) => SAUCE_ROLE.test(fold(ingredient.role))
    || SAUCE_ROLE.test(fold(ingredient.category)))
  if (!hasSauce) return false
  // Un plat passé au four (gratin, lasagnes) tient au réchauffage.
  return !/gratin|four|lasagne/.test(fold(`${techniques.join(' ')} ${recipe?.category}`))
}

function deriveReheatQuality(recipe, { techniques, textures, servedCold }) {
  if (servedCold) return REHEAT_QUALITY.POOR
  if (isLooseMixedPasta(recipe, techniques)) return REHEAT_QUALITY.POOR
  const techniqueText = fold(techniques.join(' '))
  const friendly = REHEAT_FRIENDLY_TECHNIQUES.test(techniqueText)
  const hostile = REHEAT_HOSTILE_TECHNIQUES.test(techniqueText)
  // Une technique fragile n'est disqualifiante que si RIEN dans la recette ne
  // la rattrape. Une parmigiana fait frire ses aubergines avant de les cuire
  // au four : c'est la cuisson au four qui décide de sa tenue, pas la friture
  // intermédiaire. Ne regarder que la technique la plus fragile classait ces
  // plats « se dégrade au réchauffage » à tort.
  if (hostile && !friendly) return REHEAT_QUALITY.POOR
  if (textures.some((texture) => FRAGILE_TEXTURES.test(fold(texture))) && !friendly) return REHEAT_QUALITY.POOR
  if (friendly) return hostile ? REHEAT_QUALITY.FAIR : REHEAT_QUALITY.GOOD
  return REHEAT_QUALITY.FAIR
}

/**
 * Un plat que le profil de conservation interdit de garder ne se mutualise
 * pas, quoi que dise le reste : servi froid (réchauffer n'a pas de sens), à
 * consommer immédiatement, ou qui se garde moins de 48 heures — deux repas
 * d'écart minimum entre la cuisson et la reprise, c'est déjà le lendemain
 * soir. Sans durée déclarée, on ne sait pas jusqu'à quand il se mange : LOW.
 */
function conservationForbidsBatch(conservation, servedCold) {
  if (servedCold) return true
  if (!conservation || conservation.eatImmediately) return true
  return !(Number(conservation.fridgeHours) >= MIN_BATCH_FRIDGE_HOURS)
}

function deriveBatchability(recipe, { reheatQuality, servedCold, conservation }) {
  if (conservationForbidsBatch(conservation, servedCold)) return BATCHABILITY.LOW
  if (reheatQuality === REHEAT_QUALITY.POOR) return BATCHABILITY.LOW
  // Produire en quantité n'a d'intérêt que si la préparation coûte du temps :
  // un plat prêt en dix minutes ne gagne rien à être mutualisé.
  const prepMinutes = Number(recipe?.prepMinutes) || 0
  if (prepMinutes < 15) return BATCHABILITY.LOW
  if (reheatQuality === REHEAT_QUALITY.GOOD && prepMinutes >= 25) return BATCHABILITY.HIGH
  return BATCHABILITY.MEDIUM
}

function deriveEffortLevel(recipe) {
  const active = Number(recipe?.prepMinutes) || 0
  const total = active + (Number(recipe?.cookMinutes) || 0)
  if (active <= 15 && total <= 35) return 'faible'
  if (active <= 35 && total <= 90) return 'moyen'
  return 'eleve'
}

/**
 * Profil complet. Toutes les clés sont toujours présentes ; `documented`
 * indique si la composition permet de s'y fier.
 */
export function buildRecipePlanningProfile(recipe) {
  const techniques = (recipe?.techniques || []).filter(Boolean)
  const textures = recipe?.sensory?.target_textures || recipe?.sensory?.targetTextures || []
  const completeness = analyzeMealCompleteness(recipe)
  const conservation = recipe?.conservationProfile && typeof recipe.conservationProfile === 'object'
    ? recipe.conservationProfile
    : null
  // Servi froid : déclaré vrai, ou pas servi froid. Un null (« non déclaré »)
  // ne fait pas d'un plat un plat froid — mais un plat sans profil n'est de
  // toute façon pas documenté, donc jamais produit d'avance.
  const servedCold = conservation?.serveCold === true

  const declaredReheat = [REHEAT_QUALITY.GOOD, REHEAT_QUALITY.FAIR, REHEAT_QUALITY.POOR]
    .includes(recipe?.reheatQuality) ? recipe.reheatQuality : null
  const reheatQuality = declaredReheat || deriveReheatQuality(recipe, { techniques, textures, servedCold })

  const declaredBatchable = asBoolean(recipe?.batchable)
  const derivedBatchability = deriveBatchability(recipe, { reheatQuality, servedCold, conservation })
  // Un `batchable: true` déclaré relève une batchabilité basse pour cause de
  // préparation courte ou de tenue moyenne — pas pour cause de conservation :
  // aucune déclaration d'intérêt ne fait tenir un plat à 24 h jusqu'au
  // surlendemain.
  const batchability = declaredBatchable === null || conservationForbidsBatch(conservation, servedCold)
    ? derivedBatchability
    : (declaredBatchable ? (derivedBatchability === BATCHABILITY.LOW ? BATCHABILITY.MEDIUM : derivedBatchability) : BATCHABILITY.LOW)

  // Assez d'information pour juger la tenue du plat : au moins un ingrédient
  // catégorisé, un profil de conservation DÉCLARÉ, et au moins un signal de
  // méthode (technique, ou tenue/batchabilité/congélabilité déclarées). La
  // prose de conservation ne compte plus comme signal : elle n'est plus lue.
  const hasCategorizedIngredient = (recipe?.exactIngredients || [])
    .some((ingredient) => !ingredient?.optional && fold(ingredient?.category))
  const judgeable = hasCategorizedIngredient && conservation !== null && (
    techniques.length > 0
    || declaredReheat != null
    || asBoolean(recipe?.batchable) != null
    || typeof recipe?.freezable === 'boolean'
  )

  const componentsPresent = [
    ...(completeness.hasProtein ? ['protein'] : []),
    ...(completeness.hasStarch ? ['starch'] : []),
    ...(completeness.hasVegetables ? ['vegetables'] : []),
  ]

  return {
    // §14 — complétude et composants
    mealCompleteness: completeness.complete ? 'complete' : (componentsPresent.length ? 'partial' : 'element'),
    componentsPresent,
    componentsMissing: completeness.missing,
    // §14 — conservation et mutualisation, depuis le profil déclaré
    conservationProfile: conservation,
    fridgeHours: conservation?.fridgeHours ?? null,
    eatImmediately: conservation?.eatImmediately === true,
    reheatQuality,
    freezable: isRecipeFreezable(recipe),
    freezerShelfLifeDays: isRecipeFreezable(recipe) ? freezerShelfLifeDays(recipe) : null,
    batchability,
    // §14 — effort et service
    effortLevel: deriveEffortLevel(recipe),
    servedCold,
    idealMealTypes: servedCold ? ['dejeuner'] : ['dejeuner', 'diner'],
    // Deux questions distinctes, longtemps confondues :
    // - `compositionDocumented` répond à « en sais-je assez pour COMPLÉTER
    //   l'assiette ? ». Il faut alors des ingrédients pesés ET leur table
    //   nutritionnelle, sans quoi Myko inventerait un accompagnement.
    // - `documented` répond à « en sais-je assez pour JUGER SA TENUE au
    //   réchauffage ? ». Une technique déclarée et des ingrédients catégorisés
    //   suffisent : c'est ce qui distingue un mijoté d'une friture. C'est ce
    //   critère-là qui ouvre le moteur avancé (§14).
    compositionDocumented: completeness.compositionKnown,
    documented: judgeable,
    // Traçabilité de la source, pour l'explication et le débogage.
    sources: {
      reheatQuality: declaredReheat ? 'declared' : 'derived',
      batchability: declaredBatchable === null ? 'derived' : 'declared',
      freezable: typeof recipe?.freezable === 'boolean'
        ? 'declared'
        : (typeof conservation?.freezable === 'boolean' ? 'conservation_profile' : 'default'),
      servedCold: typeof conservation?.serveCold === 'boolean' ? 'conservation_profile' : 'default',
    },
  }
}

const profileCache = new WeakMap()

/** Profil mémorisé par recette (même contrat que les autres caches du moteur). */
export function recipePlanningProfile(recipe) {
  if (!recipe || typeof recipe !== 'object') return buildRecipePlanningProfile(recipe)
  const cached = profileCache.get(recipe)
  if (cached) return cached
  const profile = buildRecipePlanningProfile(recipe)
  profileCache.set(recipe, profile)
  return profile
}

/**
 * Une recette est-elle éligible à une PRODUCTION multi-portions (§12) ?
 * Trois questions du plan, dans l'ordre :
 * 1. le plat est-il intéressant à préparer en quantité ? (batchability)
 * 2. supporte-t-il le réchauffage ou la congélation ? (reheatQuality)
 * 3. sa composition est-elle assez documentée pour qu'on s'y fie ?
 * Le placement des portions — la troisième question du plan — relève des
 * règles de répétition, pas du profil.
 */
export function isBatchCandidate(recipe) {
  const profile = recipePlanningProfile(recipe)
  if (!profile.documented) return false
  if (profile.batchability === BATCHABILITY.LOW) return false
  return REHEAT_RANK[profile.reheatQuality] >= REHEAT_RANK[REHEAT_QUALITY.FAIR]
}

/**
 * Raison lisible d'un refus de production, pour l'explication des décisions
 * (§10). `null` quand la recette est éligible. Les raisons de conservation
 * passent avant celles de tenue : elles sont déclarées, pas dérivées.
 */
export function batchRejectionReason(recipe) {
  const profile = recipePlanningProfile(recipe)
  if (!profile.conservationProfile) return 'conservation_non_declaree'
  if (!profile.documented) return 'composition_insuffisamment_documentee'
  if (profile.eatImmediately) return 'a_consommer_immediatement'
  if (profile.servedCold) return 'servi_froid'
  if (profile.fridgeHours == null) return 'conservation_non_declaree'
  if (profile.fridgeHours < MIN_BATCH_FRIDGE_HOURS) return 'se_garde_moins_de_48h'
  if (profile.reheatQuality === REHEAT_QUALITY.POOR) return 'se_degrade_au_rechauffage'
  if (profile.batchability === BATCHABILITY.LOW) return 'preparation_trop_courte_pour_mutualiser'
  return null
}
