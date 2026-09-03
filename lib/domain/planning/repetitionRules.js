/**
 * Règles de répétition et de diversité d'une semaine de planning.
 *
 * Source unique de vérité pour les deux familles de règles du plan de refonte :
 *
 * 1. Les RÈGLES ABSOLUES (§3) — contraintes dures. Un candidat qui en viole une
 *    est écarté du faisceau en mode strict ; si le corpus ne permet aucune
 *    semaine strictement conforme, le mode dégradé les transforme en
 *    violations explicites qui placent la semaine en `review_required` au lieu
 *    de la publier silencieusement (§4, lot 0).
 * 2. Les DÉLAIS DE RETOUR recommandés (§3, tableau) — pénalités souples et
 *    configurables, calculées sur l'historique des 4 à 8 semaines précédentes
 *    (§9, lot 1). Elles orientent le score sans jamais rendre une semaine
 *    infaisable.
 *
 * Le module est volontairement PUR : aucune dépendance vers le solveur, aucune
 * lecture de base. Le solveur lui fournit les créneaux déjà décidés et le
 * profil de diversité de chaque recette ; l'audit hebdomadaire rejoue
 * exactement les mêmes prédicats sur le plan final — une règle ne peut donc pas
 * diverger entre le filtrage et la vérification avant publication (§17).
 */

const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/gi, 'oe')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const daysBetween = (left, right) => {
  if (!left || !right) return null
  return Math.round((new Date(`${left}T00:00:00Z`) - new Date(`${right}T00:00:00Z`)) / 86400000)
}

/**
 * Rang d'un repas principal dans sa journée. Les créneaux planifiés du moteur
 * sont le déjeuner et le dîner ; tout autre libellé prend le rang du déjeuner.
 */
const MEAL_RANK = { pdj: 0, dejeuner: 0, collation: 1, diner: 1 }
const MEALS_PER_DAY = 2

/**
 * Position ABSOLUE d'un repas sur l'axe du temps, comptée en repas principaux.
 * C'est elle — et non l'index dans le tableau des créneaux déjà décidés — qui
 * mesure « deux repas d'écart » : un plan partiel (régénération de deux
 * créneaux isolés) doit appliquer la même règle qu'une semaine complète, sans
 * quoi deux repas distants de trois jours passeraient pour consécutifs.
 * `null` quand le créneau n'a pas de date : l'appelant retombe alors sur la
 * position dans la séquence.
 */
export function mealOrdinal(slot) {
  const date = slot?.date ? String(slot.date).slice(0, 10) : null
  if (!date) return null
  const days = Math.round(new Date(`${date}T00:00:00Z`).getTime() / 86400000)
  if (!Number.isFinite(days)) return null
  return days * MEALS_PER_DAY + (MEAL_RANK[slot.mealType ?? slot.meal_type] ?? 0)
}

/**
 * Statut d'un repas (§4). Une répétition n'est pas une faute en soi : elle doit
 * être JUSTIFIÉE. Le statut porte cette justification jusqu'à l'affichage.
 */
export const MEAL_STATUS = {
  NEW: 'new_meal',
  FAVORITE: 'favorite_rotation',
  LEFTOVER: 'planned_leftover',
  BACKUP: 'backup_meal',
}

/**
 * Provenance d'un repas dans le plan. `fresh` = cuisson du jour, les deux
 * autres sont des consommations de portions déjà produites : elles ne comptent
 * jamais comme une nouvelle cuisson.
 */
export const MEAL_SOURCES = {
  FRESH: 'fresh',
  COOKED_DISH: 'cooked_dish',
  PLANNED_PRODUCTION: 'planned_production',
}

const isReuseSource = (source) => source === MEAL_SOURCES.COOKED_DISH || source === MEAL_SOURCES.PLANNED_PRODUCTION

/**
 * Réglages par défaut. Toutes les valeurs sont configurables (§3 : « Ces délais
 * doivent être configurables ») — le solveur reçoit l'objet complet, jamais des
 * constantes codées en dur au point d'usage.
 */
export const DEFAULT_REPETITION_RULES = Object.freeze({
  // ————— Règles absolues (§3) —————
  // Jamais la même recette au déjeuner et au dîner le même jour.
  allowSameDayRepeat: false,
  // Nombre de repas qui doivent SÉPARER deux consommations d'un même plat :
  // 2 repas d'écart = au moins deux créneaux intercalés (lundi soir → mercredi
  // midi au plus tôt). Couvre aussi « jamais deux repas identiques
  // consécutifs » et « aucune consommation deux repas de suite » (§12).
  //
  // Essayé à 3 et REVENU à 2 : la mesure ne montrait aucun gain — douze plats
  // distincts dans les deux cas — alors que sept tests décrivent l'écart de deux
  // comme un comportement voulu. Une règle que des tests documentent ne se
  // durcit pas pour rien.
  minSeparatingMeals: 2,
  // Une recette principale n'est CUISINÉE qu'une fois par semaine ; toute
  // consommation supplémentaire doit être un reste ou une production.
  maxFreshCookingsPerRecipe: 1,
  // DEUX consommations, pas trois, et ce réglage vient d'être corrigé.
  //
  // Il valait 3, ce qui autorisait littéralement le même plat trois fois dans la
  // semaine — un plat cuisiné une fois puis remangé deux, ce qui est le contrat
  // du batch cooking et l'inverse de ce qu'on demande à un planificateur. Un
  // utilisateur a ouvert sa semaine et y a trouvé six pizzas sur quatorze repas.
  // Le moteur ne fautait pas : il appliquait ce nombre.
  //
  // Cette valeur avait été calibrée sur un corpus pauvre, où interdire la
  // troisième consommation laissait des créneaux vides. Le corpus en compte
  // aujourd'hui 520 publiables, et la mesure a été refaite avant de trancher —
  // semaine du 31 août, foyer de deux personnes, faisceau 48 :
  //
  //   3 consommations : 11 plats distincts,  850 min de cuisine, 7 cuisines
  //   2 consommations : 12 plats distincts,  915 min de cuisine, 7 cuisines
  //   1 consommation  : 14 plats distincts, 1355 min de cuisine, 8 cuisines
  //
  // Le premier pas coûte 65 minutes par semaine et rend un plat de plus : il se
  // prend. Le second en coûte 440 de plus — sept heures — pour deux plats, et
  // supprime tout reste, donc tout le mécanisme anti-gaspillage. Il ne se prend
  // pas par défaut ; l'utilisateur qui veut quatorze plats différents peut
  // toujours poser maxConsumptionsPerRecipe: 1 dans ses réglages, que
  // `buildRepetitionRules` honore.
  maxConsumptionsPerRecipe: 2,
  // Ce qu'on écoule d'un plat DÉJÀ cuisiné, qui est un autre sujet : le limiter
  // revient à jeter des portions réelles. Reste à 3, comme avant.
  maxReuseConsumptionsPerRecipe: 3,
  maxConsumptionsPerWindow: 2,
  consumptionWindowMeals: 4,

  // ————— Délais de retour recommandés (§3, tableau) —————
  // Exprimés en jours pleins avant qu'un élément puisse revenir sans pénalité.
  returnDelays: Object.freeze({
    exactRecipeDays: 21,
    recipeFamilyDays: 10,
    proteinDays: 2,
    starchDays: 2,
    cuisineDays: 3,
    breakfastDays: 3,
    snackDays: 3,
  }),
  // « Cuisine ou profil aromatique : maximum 2 occurrences rapprochées ».
  maxRecentCuisineOccurrences: 2,
  cuisineProximityMeals: 4,

  // ————— Diversité minimale d'une semaine publiable (§17) —————
  // Part minimale de recettes distinctes parmi les repas principaux. En deçà,
  // la semaine part en revue même si aucune règle absolue n'est franchie :
  // c'est le garde-fou qui attrape une semaine « quatre plats répétés trois
  // fois chacun », techniquement conforme repas par repas mais pauvre à
  // l'échelle de la semaine.
  minDistinctRecipeRatio: 0.6,
  // Ce plancher n'a de sens que sur une VRAIE semaine. Une régénération
  // partielle de deux ou trois créneaux ne peut pas, par construction,
  // atteindre une part de recettes distinctes comparable ; elle reste protégée
  // par les règles absolues, qui, elles, s'appliquent toujours.
  diversityFloorMinSlots: 7,

  // ————— Plafond de mutualisation par base partagée (sharedBases.js) —————
  // Nombre maximal de repas de la semaine qui peuvent s'appuyer sur une MÊME
  // base (sauce tomate, pois chiches cuits, légumes rôtis…). C'est le seul
  // endroit où le partage de base rencontre les règles de répétition, et le
  // réglage porte toute la décision :
  //
  //   trois plats DIFFÉRENTS sur une même base ne sont PAS une répétition —
  //   c'est le procédé demandé — mais quinze le seraient.
  //
  // Trois, parce que c'est la borne que le moteur se donne déjà partout
  // ailleurs pour la mutualisation (MAX_PRODUCTION_CONSUMERS = 3 consommateurs
  // par production) et parce qu'au-delà, sur quatorze repas, une base commence
  // à teindre la semaine entière. En deçà, le partage est GRATUIT : il ne coûte
  // aucun point et ne déclenche aucun avertissement.
  //
  // Règle SOUPLE : elle n'écarte jamais un candidat et n'entre pas dans la
  // cascade strict → core → off (voir sharedBases.js). Dépassée, elle se signale
  // seule par `shared_base_over_used`.
  maxMealsPerSharedBase: 3,
})

const positiveInt = (value, fallback) => {
  const number = Math.floor(Number(value))
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

/**
 * Gradation des règles absolues (§3, lot 0 — correctif de découplage). Les
 * règles ne se valent pas toutes : perdre l'écart de retour est acceptable
 * quand le corpus ou les objectifs nutritionnels forcent la main, doubler un
 * plat le même jour ou l'enchaîner ne l'est jamais. Le mode `core` du solveur
 * laisse les secondes bloquantes en toutes circonstances, et ne cède les
 * premières que dans une dernière passe explicite.
 *
 * Retour : `true` si la violation appartient au SOCLE dur — celle-ci filtre
 * même en mode dégradé partiel. Les autres restent visibles sur le créneau
 * comme motif de `backup_meal`, sans écarter le candidat.
 *
 * Le socle couvre trois familles :
 * - même plat servi deux fois le même jour (`same_day_recipe_repeat`) ;
 * - même plat servi sur deux repas contigus — même jour ou d'un jour à
 *   l'autre — quand la distance en repas n'atteint pas encore un intervalle
 *   d'une journée (`recipe_repeat_too_close` avec `mealsBetween ≤ 1`) ;
 * - deux variantes d'une même lignée (`recipe_lineage_repeat`) : « Blanquette
 *   de dinde » et « Blanquette de dinde aux poireaux » restent le même plat ;
 * - une seconde CUISSON de la même recette dans la semaine
 *   (`recipe_recooked_within_week`) — c'est cette règle qui empêche la
 *   « pizza margherita cuisinée trois fois » de revenir en mode dégradé.
 */
export function isCoreRepetitionViolation(violation) {
  if (!violation) return false
  switch (violation.code) {
    case 'same_day_recipe_repeat':
      return true
    case 'recipe_lineage_repeat':
      return true
    case 'recipe_recooked_within_week':
      return true
    case 'recipe_repeat_too_close':
      return Number(violation.mealsBetween) <= 1
    default:
      return false
  }
}

/**
 * Sous-ensemble des violations qui doivent bloquer un candidat en mode
 * dégradé partiel (`repetitionMode: 'core'`). Retourne un TABLEAU (potentiellement
 * vide) pour rester composable avec les autres filtres du solveur.
 */
export function filterCoreRepetitionViolations(violations = []) {
  return violations.filter(isCoreRepetitionViolation)
}

/**
 * Fusionne des réglages utilisateur avec les valeurs par défaut, en bornant
 * chaque champ. Un réglage absent ou aberrant retombe sur la valeur par défaut
 * plutôt que de désactiver silencieusement une règle absolue.
 */
export function buildRepetitionRules(overrides = {}) {
  const source = overrides && typeof overrides === 'object' ? overrides : {}
  const delays = source.returnDelays && typeof source.returnDelays === 'object' ? source.returnDelays : {}
  return {
    allowSameDayRepeat: source.allowSameDayRepeat === true,
    minSeparatingMeals: positiveInt(source.minSeparatingMeals, DEFAULT_REPETITION_RULES.minSeparatingMeals),
    maxFreshCookingsPerRecipe: Math.max(1, positiveInt(source.maxFreshCookingsPerRecipe, DEFAULT_REPETITION_RULES.maxFreshCookingsPerRecipe)),
    maxConsumptionsPerRecipe: Math.max(1, positiveInt(source.maxConsumptionsPerRecipe, DEFAULT_REPETITION_RULES.maxConsumptionsPerRecipe)),
    maxReuseConsumptionsPerRecipe: Math.max(1, positiveInt(source.maxReuseConsumptionsPerRecipe, DEFAULT_REPETITION_RULES.maxReuseConsumptionsPerRecipe)),
    maxConsumptionsPerWindow: Math.max(1, positiveInt(source.maxConsumptionsPerWindow, DEFAULT_REPETITION_RULES.maxConsumptionsPerWindow)),
    consumptionWindowMeals: Math.max(1, positiveInt(source.consumptionWindowMeals, DEFAULT_REPETITION_RULES.consumptionWindowMeals)),
    returnDelays: Object.fromEntries(Object.entries(DEFAULT_REPETITION_RULES.returnDelays)
      .map(([key, fallback]) => [key, positiveInt(delays[key], fallback)])),
    maxRecentCuisineOccurrences: Math.max(1, positiveInt(source.maxRecentCuisineOccurrences, DEFAULT_REPETITION_RULES.maxRecentCuisineOccurrences)),
    cuisineProximityMeals: Math.max(1, positiveInt(source.cuisineProximityMeals, DEFAULT_REPETITION_RULES.cuisineProximityMeals)),
    minDistinctRecipeRatio: Number.isFinite(Number(source.minDistinctRecipeRatio))
      && Number(source.minDistinctRecipeRatio) >= 0 && Number(source.minDistinctRecipeRatio) <= 1
      ? Number(source.minDistinctRecipeRatio)
      : DEFAULT_REPETITION_RULES.minDistinctRecipeRatio,
    diversityFloorMinSlots: Math.max(1, positiveInt(source.diversityFloorMinSlots, DEFAULT_REPETITION_RULES.diversityFloorMinSlots)),
    maxMealsPerSharedBase: Math.max(1, positiveInt(source.maxMealsPerSharedBase, DEFAULT_REPETITION_RULES.maxMealsPerSharedBase)),
  }
}

/**
 * Profil de diversité d'une recette (§11 : « Changer le nom des recettes ne
 * suffit pas »). Chaque dimension est une chaîne normalisée, ou null quand le
 * corpus ne documente pas l'information — une dimension absente ne compte
 * jamais comme une répétition, elle est simplement ignorée.
 */
export function buildDiversityProfile({
  recipeCode = null,
  lineage = null,
  family = null,
  cuisine = null,
  protein = null,
  starch = null,
  technique = null,
  sensoryProfile = null,
  texture = null,
  richness = null,
  temperature = null,
  vegetarian = null,
} = {}) {
  const clean = (value) => {
    const folded = fold(value)
    return folded && folded !== 'non renseignee' ? folded : null
  }
  return {
    recipe: recipeCode ? String(recipeCode) : null,
    // LIGNÉE : une recette dérivée et sa base sont le même plat en deux tenues.
    // « Blanquette de dinde » et « Blanquette de dinde aux poireaux » portent
    // deux codes distincts, et les servir à trois jours d'écart serait servir
    // deux fois la même chose. La lignée d'une recette non dérivée est
    // elle-même : la règle ne change donc rien pour le reste du corpus.
    //
    // UNE BASE PARTAGÉE N'EST PAS UNE LIGNÉE, et ne doit jamais le devenir. Une
    // lignée relie un plat à SA VARIANTE ; une base (sharedBases.js) relie deux
    // plats DIFFÉRENTS à un travail commun. Verser la base ici ferait de trois
    // plats sur une même sauce tomate une violation du socle
    // (`recipe_lineage_repeat`) — la mutualisation deviendrait mécaniquement
    // interdite au moment même où on la construit.
    lineage: lineage ? String(lineage) : (recipeCode ? String(recipeCode) : null),
    family: clean(family),
    cuisine: clean(cuisine),
    protein: clean(protein),
    starch: clean(starch),
    technique: clean(technique),
    sensoryProfile: clean(sensoryProfile),
    texture: clean(texture),
    richness: clean(richness),
    temperature: clean(temperature),
    vegetarian: vegetarian == null ? null : (vegetarian ? 'vegetarien' : 'carne'),
  }
}

/**
 * Dimensions COMPOSITIONNELLES : leur cardinalité naturelle est grande, la part
 * de valeurs distinctes y mesure honnêtement la variété. Ce sont elles qui
 * forment le score de diversité.
 *
 * LA BASE PARTAGÉE N'EN FAIT PAS PARTIE, et c'est délibéré. Le score y compte
 * `valeurs distinctes / repas` : une base portée par trois plats y vaudrait 1/3
 * et ferait CHUTER le score de la semaine. Le moteur se mettrait alors à fuir la
 * mutualisation qu'on lui demande — on ne peut pas réclamer « cuisine une fois
 * pour trois plats » et noter la semaine sur « autant de bases que de plats ».
 *
 * Ce que la base met dans l'assiette reste vu, et doit l'être, par les
 * dimensions ci-dessous : des pois chiches partagés restent trois fois
 * `protein: legumineuses`, et le délai de retour protéine continue de les
 * compter. Ce que ces dimensions ne peuvent PAS voir — le fond de goût et de
 * travail commun, parce qu'une base est un ingrédient et non un titre — est
 * mesuré à part, par un PLAFOND et non par un ratio :
 * `maxMealsPerSharedBase` ci-dessus, `auditSharedBases` dans sharedBases.js.
 */
export const COMPOSITIONAL_DIMENSIONS = Object.freeze([
  'recipe', 'family', 'cuisine', 'protein', 'starch', 'technique', 'sensoryProfile', 'texture',
])

/**
 * Dimensions BINAIRES : deux valeurs possibles au plus. Compter les valeurs
 * distinctes n'y veut rien dire (2/14 n'est pas « peu varié ») — on y mesure
 * l'ÉQUILIBRE, pas la distinction. Une semaine 50/50 vaut 1, une semaine
 * monolithique vaut 0.
 */
export const BALANCE_DIMENSIONS = Object.freeze(['richness', 'temperature', 'vegetarian'])

export const DIVERSITY_DIMENSIONS = Object.freeze([...COMPOSITIONAL_DIMENSIONS, ...BALANCE_DIMENSIONS])

/**
 * Violations des RÈGLES ABSOLUES qu'entraînerait l'ajout de `recipeCode` sur un
 * créneau, compte tenu des créneaux déjà décidés.
 *
 * Les distances se mesurent en repas, sur une base UNIQUE : la position absolue
 * sur l'axe du temps quand tous les créneaux concernés portent une date, sinon
 * la position dans la séquence. Ne jamais mélanger les deux — un ordinal absolu
 * se compte en dizaines de milliers de repas depuis 1970 et écraserait tout
 * index de tableau qu'on lui comparerait.
 *
 * Retourne un tableau (vide = candidat conforme). Le solveur écarte le candidat
 * en mode strict ; l'audit final rejoue le même prédicat pour produire les
 * issues bloquantes.
 */
export function repetitionViolations({
  plannedSlots = [],
  date = null,
  mealType = null,
  recipeCode = null,
  lineage = null,
  source = MEAL_SOURCES.FRESH,
  rules = DEFAULT_REPETITION_RULES,
} = {}) {
  if (!recipeCode) return []
  const violations = []
  const matches = []
  plannedSlots.forEach((planned, index) => {
    if (planned && planned.recipeCode === recipeCode) matches.push({ planned, index })
  })

  // Même lignée, code différent : une variante dérivée face à sa base, ou deux
  // variantes d'un même plat. Les compteurs ci-dessous raisonnent par code et
  // ne les verraient pas — la semaine porterait deux blanquettes de dinde sans
  // qu'aucune règle ne s'en émeuve.
  const candidateLineage = lineage ? String(lineage) : String(recipeCode)
  const sibling = plannedSlots.find((planned) => {
    if (!planned || planned.recipeCode === recipeCode) return false
    const plannedLineage = planned.diversity?.lineage || planned.lineage || planned.recipeCode
    return plannedLineage && String(plannedLineage) === candidateLineage
  })
  if (sibling) {
    violations.push({
      code: 'recipe_lineage_repeat',
      recipeCode,
      lineage: candidateLineage,
      conflictsWith: sibling.recipeCode,
    })
  }
  const candidateOrdinal = mealOrdinal({ date, mealType })
  // Base commune : dès qu'un seul créneau concerné n'a pas de date, tout le
  // calcul retombe sur les positions dans la séquence.
  const datedThroughout = candidateOrdinal != null
    && matches.every((match) => mealOrdinal(match.planned) != null)
  const candidatePosition = datedThroughout ? candidateOrdinal : plannedSlots.length
  const occurrences = matches.map(({ planned, index }) => ({
    position: datedThroughout ? mealOrdinal(planned) : index,
    date: planned.date || null,
    source: planned.source || MEAL_SOURCES.FRESH,
  }))

  if (!rules.allowSameDayRepeat && date && occurrences.some((entry) => entry.date === date)) {
    violations.push({ code: 'same_day_recipe_repeat', recipeCode, date })
  }

  const previous = occurrences.at(-1)
  const requiredGap = Math.max(1, rules.minSeparatingMeals) + 1
  if (previous && candidatePosition - previous.position < requiredGap) {
    violations.push({
      code: 'recipe_repeat_too_close',
      recipeCode,
      mealsBetween: Math.max(0, candidatePosition - previous.position - 1),
      required: rules.minSeparatingMeals,
    })
  }

  // Une seconde consommation n'est légitime que comme reste ou production :
  // une deuxième CUISSON de la même recette dans la semaine ne l'est jamais.
  if (!isReuseSource(source)) {
    const freshCount = occurrences.filter((entry) => !isReuseSource(entry.source)).length
    if (freshCount >= rules.maxFreshCookingsPerRecipe) {
      violations.push({ code: 'recipe_recooked_within_week', recipeCode, cookings: freshCount + 1 })
    }
  }

  // Le plafond de consommations distingue ce qui EXISTE DÉJÀ de ce qu'on
  // PLANIFIE, et cette distinction est le cœur du réglage.
  //
  // Un plat déjà cuisiné et au frigo doit être mangé : le limiter, c'est jeter
  // des portions réelles, ce qui est l'inverse de la mission de cette
  // application. Un plat de six portions couvrant trois créneaux est le bon
  // comportement, et un test le décrit ainsi.
  //
  // Décider de manger trois fois le même plat est autre chose : c'est un choix
  // de planification, et l'utilisateur n'en veut pas. Il a ouvert sa semaine et
  // y a trouvé six pizzas sur quatorze repas ; du point de vue de celui qui
  // mange, un reste et un plat frais sont le même plat.
  //
  // D'où deux plafonds : `maxConsumptionsPerRecipe` borne ce qu'on planifie,
  // `maxReuseConsumptionsPerRecipe` borne ce qu'on écoule. Le second est plus
  // large parce que la nourriture, elle, est déjà là.
  // Le DÉCOMPTE reste entier — toutes les fois où ce plat arrive dans une
  // assiette, quelle que soit leur provenance. Une première version ne comptait
  // que les consommations planifiées quand le candidat était frais : elle
  // laissait passer une troisième assiette du même plat dès que les deux
  // premières venaient d'un reste, ce qui est exactement ce qu'on veut empêcher.
  // Seul le PLAFOND dépend de la source.
  const compte = occurrences.length + 1
  // Seul COOKED_DISH élargit le plafond, PAS `isReuseSource`. La nuance est
  // celle qui décide de tout : un `cooked_dish` est un plat qui EXISTE au frigo
  // et qu'il faut écouler, une `planned_production` est le planificateur qui
  // DÉCIDE d'en cuire davantage pour remplir des créneaux. Les ranger ensemble
  // — première version de ce correctif — le laissait produire trois portions du
  // même plat et n'a rien changé à la monotonie mesurée : toujours onze plats
  // distincts sur quatorze créneaux, toujours trois assiettes identiques.
  const plafond = source === MEAL_SOURCES.COOKED_DISH
    ? rules.maxReuseConsumptionsPerRecipe
    : rules.maxConsumptionsPerRecipe
  if (compte > plafond) {
    violations.push({
      code: 'recipe_over_consumed',
      recipeCode,
      consumptions: compte,
      max: plafond,
      source,
    })
  }

  const windowFloor = candidatePosition - rules.consumptionWindowMeals
  const inWindow = occurrences.filter((entry) => entry.position >= windowFloor).length + 1
  if (inWindow > rules.maxConsumptionsPerWindow) {
    violations.push({
      code: 'recipe_repeat_burst',
      recipeCode,
      consumptions: inWindow,
      windowMeals: rules.consumptionWindowMeals,
      max: rules.maxConsumptionsPerWindow,
    })
  }

  return violations
}

/**
 * Occurrences rapprochées d'une même cuisine ou d'un même profil aromatique
 * (§3 : « maximum 2 occurrences rapprochées »). Règle SOUPLE : elle alimente la
 * pénalité de score et les avertissements, jamais l'invalidation d'une semaine.
 */
export function proximityWarnings({
  plannedSlots = [],
  diversity = null,
  rules = DEFAULT_REPETITION_RULES,
} = {}) {
  if (!diversity) return []
  const warnings = []
  const recent = plannedSlots.slice(-rules.cuisineProximityMeals)
  for (const dimension of ['cuisine', 'sensoryProfile']) {
    const value = diversity[dimension]
    if (!value) continue
    const count = recent.filter((planned) => planned?.diversity?.[dimension] === value).length + 1
    if (count > rules.maxRecentCuisineOccurrences) {
      warnings.push({ code: `${dimension === 'cuisine' ? 'cuisine' : 'sensory_profile'}_cluster`, value, count, windowMeals: rules.cuisineProximityMeals })
    }
  }
  return warnings
}

/**
 * Historique de planification exploitable par le solveur (§9 : fenêtre
 * glissante sur les 4 à 8 semaines précédentes). Construit à partir de repas
 * déjà planifiés/consommés, chacun rapproché du corpus courant pour en déduire
 * ses dimensions de diversité. Les dates sont des ISO `YYYY-MM-DD`.
 */
export function buildPlanningHistory({ entries = [], referenceDate = null } = {}) {
  const lastUsed = { recipe: new Map(), lineage: new Map(), family: new Map(), cuisine: new Map(), protein: new Map(), starch: new Map() }
  const counts = new Map()
  const titles = new Set()

  for (const entry of entries) {
    const date = entry?.date ? String(entry.date).slice(0, 10) : null
    if (!date) continue
    const profile = entry.diversity || {}
    const code = entry.recipeCode || profile.recipe || null
    if (code) {
      counts.set(code, (counts.get(code) || 0) + 1)
      const current = lastUsed.recipe.get(code)
      if (!current || date > current) lastUsed.recipe.set(code, date)
    }
    const lineage = profile.lineage || code
    if (lineage) {
      const current = lastUsed.lineage.get(lineage)
      if (!current || date > current) lastUsed.lineage.set(lineage, date)
    }
    for (const dimension of ['family', 'cuisine', 'protein', 'starch']) {
      const value = profile[dimension]
      if (!value) continue
      const current = lastUsed[dimension].get(value)
      if (!current || date > current) lastUsed[dimension].set(value, date)
    }
    for (const title of [entry.title, entry.description]) {
      const folded = fold(title)
      if (folded) titles.add(folded)
    }
  }

  return {
    referenceDate: referenceDate ? String(referenceDate).slice(0, 10) : null,
    lastUsedByRecipe: Object.fromEntries(lastUsed.recipe),
    lastUsedByLineage: Object.fromEntries(lastUsed.lineage),
    lastUsedByFamily: Object.fromEntries(lastUsed.family),
    lastUsedByCuisine: Object.fromEntries(lastUsed.cuisine),
    lastUsedByProtein: Object.fromEntries(lastUsed.protein),
    lastUsedByStarch: Object.fromEntries(lastUsed.starch),
    usageCountByRecipe: Object.fromEntries(counts),
    recentTitles: [...titles].sort(),
  }
}

export const EMPTY_PLANNING_HISTORY = Object.freeze(buildPlanningHistory({}))

const DELAY_DIMENSIONS = [
  // Le délai de retour d'un plat se compte sur sa LIGNÉE, pas sur son code : une
  // variante dérivée qui revient dix jours après sa base est le même plat qui
  // revient. Pour une recette non dérivée, lignée et code sont confondus — la
  // dimension généralise l'ancienne sans rien changer au corpus existant.
  ['lineage', 'lastUsedByLineage', 'exactRecipeDays', 34, 'recipe_returned_too_soon'],
  ['family', 'lastUsedByFamily', 'recipeFamilyDays', 20, 'recipe_family_returned_too_soon'],
  ['protein', 'lastUsedByProtein', 'proteinDays', 12, 'protein_returned_too_soon'],
  ['starch', 'lastUsedByStarch', 'starchDays', 10, 'starch_returned_too_soon'],
  ['cuisine', 'lastUsedByCuisine', 'cuisineDays', 8, 'cuisine_returned_too_soon'],
]

/**
 * Pénalité souple due aux délais de retour non respectés (§3). Le coût croît
 * linéairement avec la « fraîcheur » du souvenir : revenir la veille coûte le
 * plein tarif, revenir la veille du délai ne coûte presque rien. Aucune
 * dimension absente de l'historique n'est pénalisée.
 */
export function historyReturnPenalty({
  history = EMPTY_PLANNING_HISTORY,
  diversity = null,
  date = null,
  rules = DEFAULT_REPETITION_RULES,
} = {}) {
  if (!diversity || !date) return { total: 0, reasons: [] }
  let total = 0
  const reasons = []
  for (const [dimension, field, delayKey, weight, code] of DELAY_DIMENSIONS) {
    const value = dimension === 'recipe' ? diversity.recipe : diversity[dimension]
    if (!value) continue
    const lastDate = history?.[field]?.[value]
    if (!lastDate) continue
    const elapsed = daysBetween(date, lastDate)
    const delay = rules.returnDelays[delayKey]
    if (elapsed == null || !delay || elapsed >= delay) continue
    const freshness = (delay - Math.max(elapsed, 0)) / delay
    total += freshness * weight
    reasons.push({ code, dimension, value, daysSinceLastUse: Math.max(elapsed, 0), requiredDelayDays: delay })
  }
  return { total, reasons }
}

/**
 * Statut d'un repas (§4). Une consommation de reste ou de production est un
 * `planned_leftover` ; une cuisson fraîche est une découverte (`new_meal`) ou
 * un favori en rotation (`favorite_rotation`) selon l'historique ; un repas
 * retenu alors qu'il viole une règle absolue est un `backup_meal` — c'est lui
 * qui déclenche la revue.
 */
export function classifyMealStatus({ source = MEAL_SOURCES.FRESH, recipeCode = null, history = EMPTY_PLANNING_HISTORY, degraded = false } = {}) {
  if (degraded) return MEAL_STATUS.BACKUP
  if (isReuseSource(source)) return MEAL_STATUS.LEFTOVER
  if (recipeCode && history?.lastUsedByRecipe?.[recipeCode]) return MEAL_STATUS.FAVORITE
  return MEAL_STATUS.NEW
}

const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null)

/**
 * Diversité multidimensionnelle d'une semaine (§11). Pour chaque dimension :
 * le nombre de valeurs distinctes, la valeur dominante et sa part.
 *
 * - `score` : moyenne des ratios `distinctes / repas documentés` sur les
 *   dimensions compositionnelles. Une semaine « pizza, pâtes au pesto, gnocchis
 *   tomate-mozzarella, lasagnes » affiche quatre recettes distinctes mais une
 *   seule cuisine, un seul féculent et une seule protéine dominante : son score
 *   s'effondre là où le simple comptage de recettes la déclarait variée.
 * - `balance` : moyenne des équilibres sur les dimensions binaires
 *   (`1` = réparti à parts égales, `0` = une seule valeur sur la semaine).
 */
export function weekDiversity(slots = []) {
  const dimensions = {}
  for (const dimension of DIVERSITY_DIMENSIONS) {
    const values = slots.map((slot) => slot?.diversity?.[dimension]).filter(Boolean)
    const binary = BALANCE_DIMENSIONS.includes(dimension)
    if (!values.length) {
      dimensions[dimension] = { documented: 0, distinct: 0, ratio: null, balance: null, dominant: null, dominantShare: null }
      continue
    }
    const counts = new Map()
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1)
    const [dominant, dominantCount] = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]
    const dominantShare = dominantCount / values.length
    dimensions[dimension] = {
      documented: values.length,
      distinct: counts.size,
      ratio: binary ? null : counts.size / values.length,
      balance: binary ? Math.max(0, Math.min(1, 2 * (1 - dominantShare))) : null,
      dominant,
      dominantShare,
    }
  }
  return {
    dimensions,
    score: mean(COMPOSITIONAL_DIMENSIONS.map((key) => dimensions[key].ratio).filter((ratio) => ratio != null)),
    balance: mean(BALANCE_DIMENSIONS.map((key) => dimensions[key].balance).filter((value) => value != null)),
  }
}

/**
 * Répartition repères / rotation / découvertes (§6). `favorite_rotation` et
 * `planned_leftover` sont des repères, `new_meal` une découverte. Le solveur
 * n'impose pas encore de quota (lot 2, profil de goûts) : la mesure est
 * publiée pour l'aperçu avant génération et le suivi de l'équilibre.
 */
export function familiarityBalance(slots = []) {
  const total = slots.length
  const count = (status) => slots.filter((slot) => slot?.mealStatus === status).length
  if (!total) return { total: 0, discovery: 0, familiar: 0, leftover: 0, backup: 0, discoveryRatio: null }
  const discovery = count(MEAL_STATUS.NEW)
  return {
    total,
    discovery,
    familiar: count(MEAL_STATUS.FAVORITE),
    leftover: count(MEAL_STATUS.LEFTOVER),
    backup: count(MEAL_STATUS.BACKUP),
    discoveryRatio: discovery / total,
  }
}

/**
 * Contrôle avant publication (§17). Rejoue les règles absolues sur le plan
 * final, créneau par créneau, dans l'ordre des repas, puis vérifie la
 * diversité minimale. Toute violation absolue est BLOQUANTE : la semaine part
 * en revue au lieu d'être publiée (§4, lot 0).
 */
export function auditWeekRepetition({ slots = [], rules = DEFAULT_REPETITION_RULES, history = EMPTY_PLANNING_HISTORY } = {}) {
  const blockers = []
  const warnings = []
  const decided = []

  for (const slot of slots) {
    const violations = repetitionViolations({
      plannedSlots: decided,
      date: slot.date,
      mealType: slot.mealType ?? slot.meal_type,
      recipeCode: slot.recipeCode,
      lineage: slot.diversity?.lineage || slot.lineage || slot.recipeCode,
      source: slot.source || MEAL_SOURCES.FRESH,
      rules,
    })
    for (const violation of violations) {
      blockers.push({ severity: 'blocker', slotKey: slot.key, ...violation })
    }
    for (const warning of proximityWarnings({ plannedSlots: decided, diversity: slot.diversity, rules })) {
      warnings.push({ severity: 'warning', slotKey: slot.key, ...warning })
    }
    for (const reason of historyReturnPenalty({ history, diversity: slot.diversity, date: slot.date, rules }).reasons) {
      warnings.push({ severity: 'warning', slotKey: slot.key, ...reason })
    }
    decided.push(slot)
  }

  const diversity = weekDiversity(slots)
  const recipeRatio = diversity.dimensions.recipe?.ratio
  if (slots.length >= rules.diversityFloorMinSlots && recipeRatio != null && recipeRatio < rules.minDistinctRecipeRatio) {
    blockers.push({
      severity: 'blocker',
      code: 'week_diversity_below_minimum',
      distinctRatio: Number(recipeRatio.toFixed(3)),
      minimum: rules.minDistinctRecipeRatio,
    })
  }

  return {
    blockers,
    warnings,
    diversity,
    familiarity: familiarityBalance(slots),
    compliant: blockers.length === 0,
  }
}
