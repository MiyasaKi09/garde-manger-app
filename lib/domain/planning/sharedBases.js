import { COOKED_DISH_SHELF_LIFE } from '../../shelfLifeRules'

/**
 * BATCH COOKING PAR BASE PARTAGÉE.
 *
 * La demande, dans les mots de l'utilisateur : « préparer vite et simplement
 * plus de plats dans la semaine SANS POUR AUTANT ÊTRE DANS LES MÊMES PLATS ».
 *
 * Le batch que le moteur savait déjà faire (closedLoopPlanner →
 * `selectProductionConsumers`) mutualise des PORTIONS : on cuisine six parts de
 * bourguignon lundi, on en remange mercredi. Le travail est mutualisé, mais
 * l'assiette se répète — c'est exactement ce que l'utilisateur ne veut pas.
 *
 * Ce module mutualise autre chose : la BASE. On cuit une fois une sauce tomate,
 * des pois chiches, des légumes rôtis, un bouillon ; trois plats DIFFÉRENTS s'en
 * servent dans la semaine. Le travail est mutualisé, l'assiette ne se répète
 * pas. Les deux mécanismes coexistent et ne se gênent pas : l'un partage un
 * plat fini, l'autre partage un ingrédient de travail.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. COMMENT UN PLAT DÉCLARE QU'IL EMPLOIE UNE BASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Par un INGRÉDIENT qui porte `component.code` — le code de la recette de la
 * base. Rien de nouveau n'est inventé : ce chemin existe déjà de bout en bout.
 *
 *   culinary.recipe_components.sub_recipe_version_id
 *     (supabase/migrations/20260714200004_v2_0004_culinary_model.sql)
 *   → get_editorial_recipe_catalog_v3 publie `ingredient.component`
 *     (20260715214547_complete_recipe_catalog_v3.sql : code, name,
 *      requiredQuantity, requiredUnit, yieldQuantity, yieldUnit)
 *   → materializeOperationalRecipe le met à l'échelle des portions
 *     (lib/domain/recipes/operationalCatalog.js)
 *   → getEditorialRecipe sait déjà remonter la sous-recette entière
 *     (lib/db/operationalRecipeCatalog.js, `subRecipes`)
 *
 * Le mécanisme était là ; il n'avait jamais servi au PLANNING. Côté corpus
 * d'écriture, la chaîne de validation
 * (scripts/data/recipes/validate-recipe-batch.mjs) lit d'un ingrédient son
 * `form`, son `unit`, son `role` et son `optional` — une clé `component`
 * supplémentaire la traverse sans rien changer, et la recette de la base est une
 * recette ordinaire du corpus, validée comme les autres.
 *
 * POURQUOI CETTE REPRÉSENTATION, ET CE QU'ON A ÉCARTÉ. La tentation était un
 * champ de recette dédié — `recipe.bases: ['SRC-101']`. On l'a écarté pour une
 * raison de fond : une base N'EST PAS un lien entre deux recettes, c'est un
 * INGRÉDIENT d'un genre particulier. Ses 400 g de sauce tomate pèsent dans
 * l'assiette, comptent dans les macros CIQUAL, se réservent sur des lots du
 * garde-manger. Une base sortie de la liste d'ingrédients pour vivre dans un
 * champ à part rendrait la nutrition du plat FAUSSE — précisément le genre de
 * chiffre plausible et invérifiable que ce dépôt s'interdit. La déclarer comme
 * ingrédient garde une seule liste, une seule pesée, un seul calcul ; le
 * `component` ne fait qu'ajouter : « cet ingrédient-là, on peut le cuisiner
 * soi-même, et voici sa recette ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. CE QUE COÛTE ET CE QUE RAPPORTE UNE BASE, EN MINUTES ACTIVES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le modèle reprend trait pour trait celui des productions (cookingSessions.js) :
 *
 * - la CUIRE coûte ses propres minutes actives (`prepMinutes` de sa recette),
 *   ajoutées à la session du créneau qui l'ouvre ;
 * - la REPRENDRE coûte `BASE_REUSE_ACTIVE_MINUTES` — sortir, peser, remettre en
 *   température — soit la même nature de coût que le réchauffage d'une portion ;
 * - l'économie nette d'un plat qui reprend une base est donc
 *   `minutes de la base − BASE_REUSE_ACTIVE_MINUTES`. Nulle ou négative, la base
 *   n'est pas mutualisable et le module l'ignore : ni bonus, ni comptabilité.
 *
 * ON NE MULTIPLIE PAS LES MINUTES PAR LE NOMBRE DE PLATS SERVIS. Doubler la
 * quantité d'une sauce tomate ne double pas le temps de la faire — c'est
 * l'avertissement n° 6 de CLAUDE.md (« les temps de cuisson ne scalent pas
 * linéairement »), et c'est aussi toute la raison d'être du procédé. Le modèle
 * des productions fait le même choix (préparation à taux plein + 5 min de
 * portionnage par repas couvert) ; on s'aligne dessus.
 *
 * LA FENÊTRE DE CONSERVATION D'UNE BASE se lit, dans l'ordre : une durée
 * DÉCLARÉE (`shelfLifeDays`), sinon la règle réfrigérateur commune
 * (COOKED_DISH_SHELF_LIFE.fridge), la même que celle des productions et que la
 * DLC réellement posée par /api/meals/cook. Jamais une durée lue dans un texte,
 * jamais une durée devinée d'après le nom de la base.
 *
 * UNE BASE DONT LA RECETTE EST INCONNUE N'EXISTE PAS pour ce module. On ne
 * connaît alors ni ses minutes ni sa conservation, et la règle du dépôt est sans
 * appel : un chiffre qu'on n'a pas su sourcer est ABSENT, jamais estimé. Le plat
 * reste parfaitement planifiable — il est simplement cuisiné comme avant, sa
 * base comprise dans son temps.
 *
 * CE QU'ON A ÉCARTÉ : congeler une base pour rallonger sa fenêtre. Le procédé
 * marcherait (le garde-manger sait congeler, les sessions savent congeler), mais
 * il ajoute un aller-retour congélation/décongélation à un modèle qui doit
 * d'abord faire ses preuves sur le réfrigérateur. Le jour venu, le coût existe
 * déjà, nommé, dans cookingSessions.js (FREEZE_TASK_MINUTES, DEFROST_TASK_MINUTES).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. LA TENSION : « LE MÊME PLAT » CONTRE « LA MÊME BASE »
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Partager une base rend les plats plus semblables en ingrédients. Or les règles
 * de répétition et le score de diversité (repetitionRules.js) existent
 * précisément pour empêcher la ressemblance. Sans décision explicite, encourager
 * le partage et interdire la répétition se combattent, et le résultat est pire
 * que chacun des deux. Trois décisions, dans cet ordre :
 *
 * (a) LA BASE N'ENTRE PAS DANS LA LIGNÉE. La lignée (`derived_from`) dit « c'est
 *     le même plat » : deux recettes de même lignée déclenchent
 *     `recipe_lineage_repeat`, une violation du SOCLE, celle qui reste dure même
 *     en mode dégradé. Faire de la base une lignée — la solution qui vient
 *     naturellement, puisque les deux « relient deux recettes » — rendrait trois
 *     plats partageant une sauce tomate aussi interdits que trois blanquettes de
 *     dinde. Le modèle serait mort-né. Une lignée relie un plat à SA VARIANTE ;
 *     une base relie deux plats DIFFÉRENTS à un travail commun. Les confondre
 *     est l'erreur exacte que ce module doit empêcher, et le test
 *     `tests/planning/sharedBases.test.js` la verrouille.
 *
 * (b) LA BASE N'ENTRE PAS DANS LES DIMENSIONS COMPOSITIONNELLES. Le score de
 *     diversité y compte `valeurs distinctes / repas documentés` : une base
 *     portée par trois plats y vaudrait 1/3 et TIRERAIT LE SCORE VERS LE BAS. Le
 *     moteur se mettrait alors à fuir la mutualisation qu'on lui demande. On ne
 *     peut pas à la fois dire « cuisine une fois pour trois plats » et noter la
 *     semaine sur « autant de bases que de plats » : ce serait demander une
 *     chose et récompenser son contraire.
 *
 * (c) ELLE ENTRE AVEC UN POIDS PROPRE — UN PLAFOND, PAS UN RATIO. Ce que la base
 *     menace n'est pas la variété de l'assiette : celle-ci reste mesurée par
 *     `family`, `protein`, `starch`, `technique`, `sensoryProfile`, qui voient
 *     déjà ce que la base y met. Des pois chiches partagés restent trois fois
 *     « légumineuses », le délai de retour protéine continue de les compter, et
 *     c'est très bien ainsi : ces dimensions-là n'ont pas à être désarmées.
 *     Ce que la base menace et que ces dimensions ne peuvent PAS voir — parce
 *     qu'une base est un ingrédient et non un titre —, c'est un fond de goût et
 *     de travail commun à toute la semaine. On le mesure donc à part, et par un
 *     plafond : jusqu'à `maxMealsPerSharedBase` repas sur une même base, le
 *     partage est GRATUIT, c'est le but recherché ; au-delà, il cesse de
 *     rapporter, coûte, et la semaine le signale.
 *
 * LE PLAFOND N'ENTRE PAS DANS LA CASCADE strict → core → off. Il suit la
 * doctrine que le lot budget a fixée : un axe qui échoue ne relâche pas les
 * autres. Un plafond de base dépassé ne déclenche donc AUCUN relâchement des
 * règles de répétition, et aucun relâchement de celles-ci ne le desserre. Il se
 * signale seul, par `shared_base_over_used`, à côté de
 * `repetition_rules_softened` et `budget_envelope_exceeded`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Le module est PUR : aucune dépendance vers le solveur, aucune lecture de base,
 * aucune inférence sur le NOM d'un plat (F13). Mêmes entrées, mêmes sorties.
 */

/**
 * Reprendre une base déjà produite : la sortir du réfrigérateur, la peser, la
 * remettre en température. Volontairement plus court que le réchauffage d'une
 * portion entière (REHEAT_ACTIVE_MINUTES = 10 dans closedLoopPlanner) — on ne
 * remet pas un plat à température, on incorpore un ingrédient — et volontairement
 * du même ordre que la tâche de décongélation (DEFROST_TASK_MINUTES = 2) et le
 * portionnage (BATCH_PORTIONING_ACTIVE_MINUTES = 5) : ce sont les trois gestes
 * de manutention que le modèle des sessions chiffre déjà.
 */
export const BASE_REUSE_ACTIVE_MINUTES = 4

/**
 * Barème du bonus de mutualisation d'une base : le MÊME que celui des portions
 * (MUTUALISATION_WEIGHT = 0.8 dans closedLoopPlanner). Une minute économisée
 * doit valoir la même chose qu'elle soit gagnée sur une portion ou sur une base,
 * sinon le moteur préférerait arbitrairement l'une des deux formes de batch —
 * et l'utilisateur, lui, n'a demandé que du temps en moins.
 */
export const SHARED_BASE_MINUTE_WEIGHT = 0.8

/**
 * Ce que coûte, en points de score, un repas qui pousse une base au-delà de son
 * plafond. Calibré au double d'un avertissement de proximité
 * (`proximityPenalty` = 12 par regroupement) : assez pour que le solveur préfère
 * changer de base, pas assez pour renverser un stock urgent ou un goût marqué.
 * Il s'ajoute à la perte du bonus, qui est la vraie sanction : au-delà du
 * plafond, le partage ne rapporte plus rien du tout.
 */
export const SHARED_BASE_CEILING_PENALTY = 24

/** Motif de repli, dans l'esprit des codes existants du moteur. */
export const SHARED_BASE_ISSUE_CODES = Object.freeze({
  OVER_USED: 'shared_base_over_used',
})

/** Notes portées par un créneau, pour l'explication des décisions. */
export const SHARED_BASE_NOTES = Object.freeze({
  COOKED: 'shared_base_cooked',
  REUSED: 'shared_base_reused',
  RECOOKED: 'shared_base_recooked',
  UNKNOWN: 'shared_base_recipe_unknown',
})

/**
 * État « aucune base produite ». PARTAGÉ par tous les états du faisceau qui
 * n'ont encore rien cuit — d'où la discipline du module : personne ne mute un
 * stock de bases, `applySharedBaseStock` en rend toujours une copie. Une seule
 * mutation en place ferait fuir une base d'une branche de la recherche à l'autre.
 */
export const EMPTY_BASE_STOCK = new Map()

const positiveNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

const addDaysIso = (isoDate, count) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

const round = (value, digits = 4) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

const refsCache = new WeakMap()

/**
 * Bases DÉCLARÉES par une recette : les ingrédients qui portent
 * `component.code`. Les ingrédients OPTIONNELS sont écartés — le reste du
 * moteur les écarte partout ailleurs (composition, congélabilité, pesée), et une
 * base facultative ne peut pas justifier d'ouvrir une session de cuisine.
 *
 * Un même code n'est retenu qu'une fois : une recette qui emploierait deux fois
 * la même base ne la cuisine pas deux fois.
 */
export function recipeBaseRefs(recipe) {
  if (!recipe || typeof recipe !== 'object') return []
  const cached = refsCache.get(recipe)
  if (cached) return cached
  const refs = []
  const seen = new Set()
  for (const ingredient of recipe.exactIngredients || []) {
    if (!ingredient || ingredient.optional) continue
    const code = ingredient.component?.code
    if (!code) continue
    const key = String(code)
    if (seen.has(key)) continue
    seen.add(key)
    refs.push(Object.freeze({
      code: key,
      name: ingredient.component.name || ingredient.name || null,
      requiredQuantity: positiveNumber(ingredient.component.requiredQuantity),
      requiredUnit: ingredient.component.requiredUnit || null,
      yieldQuantity: positiveNumber(ingredient.component.yieldQuantity),
      yieldUnit: ingredient.component.yieldUnit || null,
    }))
  }
  const frozen = Object.freeze(refs)
  refsCache.set(recipe, frozen)
  return frozen
}

/** Une recette emploie-t-elle au moins une base ? Question posée très souvent. */
export function usesSharedBase(recipe) {
  return recipeBaseRefs(recipe).length > 0
}

/**
 * Minutes ACTIVES d'une base : sa préparation. La cuisson non surveillée d'un
 * bouillon n'occupe pas le cuisinier — c'est déjà la convention de
 * `selectProductionConsumers`, qui ne compare que des `prepMinutes`.
 */
export function baseActiveMinutes(baseRecipe) {
  const minutes = Number(baseRecipe?.prepMinutes)
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0
}

/**
 * Fenêtre de conservation d'une base au réfrigérateur, en jours. Durée déclarée
 * si la recette en porte une, sinon la règle commune des plats cuisinés
 * (lib/shelfLifeRules.js) — la même que `productionShelfLifeDays` du solveur et
 * que la DLC réellement posée à la validation d'une cuisson.
 */
export function baseShelfLifeDays(baseRecipe) {
  const declared = Number(baseRecipe?.shelfLifeDays)
  return Number.isFinite(declared) && declared > 0 ? Math.floor(declared) : COOKED_DISH_SHELF_LIFE.fridge
}

/**
 * Catalogue des bases exploitables, indexé par code. Construit une fois par
 * recherche, à partir des recettes de bases fournies par l'appelant ET des
 * recettes du corpus courant (une base peut être un plat à part entière).
 *
 * Une base n'y entre QUE si sa recette est connue et si la reprendre économise
 * réellement du temps (`activeMinutes > BASE_REUSE_ACTIVE_MINUTES`). Le seuil
 * reprend celui des productions : « aucune stratégie si la mutualisation
 * n'économise pas de temps actif ». Mutualiser une base prête en trois minutes
 * n'apporte rien et compliquerait la semaine pour rien.
 */
export function buildSharedBaseCatalog(recipes = [], baseRecipes = []) {
  const catalog = new Map()
  for (const recipe of [...(baseRecipes || []), ...(recipes || [])]) {
    const code = recipe?.code ? String(recipe.code) : null
    if (!code || catalog.has(code)) continue
    const activeMinutes = baseActiveMinutes(recipe)
    if (activeMinutes <= BASE_REUSE_ACTIVE_MINUTES) continue
    catalog.set(code, Object.freeze({
      code,
      name: recipe.family || code,
      activeMinutes,
      shelfLifeDays: baseShelfLifeDays(recipe),
      savedPerReuse: round(activeMinutes - BASE_REUSE_ACTIVE_MINUTES),
    }))
  }
  return catalog
}

/**
 * Décision de base pour UN créneau : ce que le plat doit cuire, ce qu'il peut
 * reprendre, ce que cela coûte et ce que cela rapporte.
 *
 * `baseStock` est l'état des bases déjà produites par le plan partiel :
 * `Map<code, { cookedOn, useBy, meals, producerSlotKey }>`. Il n'est jamais muté
 * — `applySharedBaseStock` en rend une copie, comme le reste du faisceau.
 *
 * Trois issues par base, et une seule règle de décision : la base est reprise si
 * elle existe encore à la date du créneau (`date <= useBy`), sinon elle est
 * cuite. Aucune heuristique, aucun arbitrage caché.
 */
/** Décision vide : aucune base, aucun coût, aucun gain. Partagée et gelée. */
export const EMPTY_SLOT_BASES = Object.freeze({
  codes: Object.freeze([]),
  reused: Object.freeze([]),
  cooked: Object.freeze([]),
  notes: Object.freeze([]),
  overCeiling: Object.freeze([]),
  addedActiveMinutes: 0,
  savedActiveMinutes: 0,
  bonusMinutes: 0,
  ceilingPenalty: 0,
})

export function planSlotBases({
  recipe = null,
  baseStock = EMPTY_BASE_STOCK,
  date = null,
  catalog = null,
  maxMealsPerSharedBase = Infinity,
} = {}) {
  const refs = recipeBaseRefs(recipe)
  if (!refs.length || !catalog || !catalog.size) return EMPTY_SLOT_BASES
  const reused = []
  const cooked = []
  const notes = []
  const codes = []
  const overCeiling = []
  let addedActiveMinutes = 0
  let savedActiveMinutes = 0
  let bonusMinutes = 0

  for (const ref of refs) {
    const entry = catalog.get(ref.code)
    if (!entry) {
      // Base non sourcée : ni minutes, ni conservation, donc rien à décider. Le
      // plat se cuisine comme avant. On le note, sans jamais l'estimer.
      notes.push({ code: SHARED_BASE_NOTES.UNKNOWN, baseCode: ref.code })
      continue
    }
    codes.push(ref.code)
    const stocked = baseStock.get(ref.code) || null
    const usable = Boolean(stocked && date && stocked.useBy && date <= stocked.useBy)
    // Le plafond se compte en REPAS appuyés sur la base, celui-ci compris.
    const mealsWithThisOne = (stocked?.meals || 0) + 1
    const exceeds = mealsWithThisOne > maxMealsPerSharedBase
    if (exceeds) overCeiling.push(ref.code)

    if (usable) {
      addedActiveMinutes += BASE_REUSE_ACTIVE_MINUTES
      savedActiveMinutes += entry.savedPerReuse
      // Au-delà du plafond, l'économie reste PHYSIQUEMENT vraie — la session
      // dure bien moins longtemps — mais elle ne rapporte plus un point. C'est
      // la décision (c) : le partage cesse d'être encouragé, il n'est pas nié.
      if (!exceeds) bonusMinutes += entry.savedPerReuse
      reused.push({ code: ref.code, name: entry.name, cookedOn: stocked.cookedOn, useBy: stocked.useBy, meal: mealsWithThisOne, saved: entry.savedPerReuse })
      notes.push({ code: SHARED_BASE_NOTES.REUSED, baseCode: ref.code })
      continue
    }

    addedActiveMinutes += entry.activeMinutes
    const useBy = date ? addDaysIso(date, entry.shelfLifeDays) : null
    cooked.push({ code: ref.code, name: entry.name, activeMinutes: entry.activeMinutes, useBy, meal: mealsWithThisOne })
    // Une base recuite parce que la précédente était périmée n'est pas une
    // faute : c'est la conservation qui parle. On la distingue quand même d'une
    // première cuisson — c'est ce que l'utilisateur voudra comprendre.
    notes.push({ code: stocked ? SHARED_BASE_NOTES.RECOOKED : SHARED_BASE_NOTES.COOKED, baseCode: ref.code })
  }

  if (!codes.length && !notes.length) return EMPTY_SLOT_BASES
  return {
    codes,
    reused,
    cooked,
    notes,
    overCeiling,
    addedActiveMinutes: round(addedActiveMinutes),
    savedActiveMinutes: round(savedActiveMinutes),
    bonusMinutes: round(bonusMinutes),
    ceilingPenalty: overCeiling.length * SHARED_BASE_CEILING_PENALTY,
  }
}

/**
 * État des bases après un créneau. Copie — jamais de mutation d'un état du
 * faisceau, sans quoi deux branches de la recherche se contamineraient.
 * Rend la Map d'origine à l'identique quand rien n'a changé : les semaines sans
 * base partagée ne paient pas une allocation par créneau.
 */
export function applySharedBaseStock(baseStock = EMPTY_BASE_STOCK, plan = EMPTY_SLOT_BASES, { date = null, slotKey = null } = {}) {
  if (!plan || (!plan.cooked.length && !plan.reused.length)) return baseStock
  const next = new Map(baseStock)
  for (const item of plan.cooked) {
    // `meals` ne repart pas de zéro quand une base est RECUITE après péremption :
    // le plafond compte les repas qui s'appuient sur une base, pas les fois où
    // on l'a faite. La monotonie est dans l'assiette, pas dans la casserole.
    next.set(item.code, { cookedOn: date, useBy: item.useBy, meals: item.meal, producerSlotKey: slotKey })
  }
  for (const item of plan.reused) {
    const current = next.get(item.code)
    if (!current) continue
    next.set(item.code, { ...current, meals: current.meals + 1 })
  }
  return next
}

/**
 * Usage des bases sur une semaine décidée, par base : combien de repas s'y
 * appuient, lesquels, et combien de fois elle a dû être cuite.
 *
 * C'est LA mesure de la décision (c) — celle qui vit à côté du score de
 * diversité sans y entrer. Elle se lit sur les créneaux publiés, donc l'audit
 * hebdomadaire et le solveur voient exactement la même chose (§17).
 */
export function sharedBaseUsage(slots = []) {
  const byCode = new Map()
  for (const slot of slots) {
    const plan = slot?.sharedBases
    if (!plan) continue
    for (const code of plan.codes || []) {
      if (!byCode.has(code)) byCode.set(code, { baseCode: code, name: null, meals: 0, cookings: 0, reuses: 0, slotKeys: [], savedActiveMinutes: 0 })
      const entry = byCode.get(code)
      entry.meals += 1
      entry.slotKeys.push(slot.key ?? slot.slot_key ?? null)
    }
    for (const item of plan.cooked || []) {
      const entry = byCode.get(item.code)
      if (!entry) continue
      entry.cookings += 1
      entry.name = entry.name || item.name || null
    }
    for (const item of plan.reused || []) {
      const entry = byCode.get(item.code)
      if (!entry) continue
      entry.name = entry.name || item.name || null
      entry.reuses += 1
      entry.savedActiveMinutes = round(entry.savedActiveMinutes + (Number(item.saved) || 0))
    }
  }
  return [...byCode.values()].sort((a, b) => b.meals - a.meals || String(a.baseCode).localeCompare(String(b.baseCode)))
}

/** Minutes actives réellement économisées sur la semaine par le partage de bases. */
export function sharedBaseSavedMinutes(slots = []) {
  return round(slots.reduce((sum, slot) => sum + (Number(slot?.sharedBases?.savedActiveMinutes) || 0), 0))
}

/**
 * LE REPLI. Le plafond de repas par base est une contrainte SOUPLE : si le
 * corpus, les stocks ou les quotas ne laissent pas d'autre semaine possible, on
 * rend la meilleure semaine possible — mais on nomme ce qui a cédé, plutôt que
 * de publier une monotonie en silence. Même forme que
 * `budget_envelope_exceeded` : une issue bloquante qui envoie la semaine en
 * revue, sans jamais refuser de rendre un plan.
 *
 * Il ne déclenche rien et n'est relâché par rien : voir la note sur la cascade
 * en tête de module.
 */
export function auditSharedBases({ slots = [], maxMealsPerSharedBase = Infinity } = {}) {
  const usage = sharedBaseUsage(slots)
  const savedActiveMinutes = sharedBaseSavedMinutes(slots)
  const issues = []
  if (Number.isFinite(maxMealsPerSharedBase)) {
    for (const entry of usage) {
      if (entry.meals <= maxMealsPerSharedBase) continue
      issues.push({
        severity: 'blocker',
        code: SHARED_BASE_ISSUE_CODES.OVER_USED,
        baseCode: entry.baseCode,
        meals: entry.meals,
        max: maxMealsPerSharedBase,
        slotKeys: [...entry.slotKeys],
        details: {
          reason: `La base « ${entry.name || entry.baseCode} » porte ${entry.meals} repas de la semaine pour un plafond de ${maxMealsPerSharedBase} : mutualiser le travail a fini par uniformiser le fond de la semaine.`,
        },
      })
    }
  }
  return { usage, savedActiveMinutes, issues, compliant: issues.length === 0 }
}
