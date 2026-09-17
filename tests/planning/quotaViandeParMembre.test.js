import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { classifyRecipe, generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildCanonicalPlanPayload, buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import {
  buildPersonalizedMeals,
  chooseVegetarianAlternative,
  vegetarianLineageTwins,
} from '@/lib/domain/planning/personalizedMeals'
import { buildPlanningHistory } from '@/lib/domain/planning/repetitionRules'
import { buildWeeklyBalance, meatMaxFromDeclaredQuotas } from '@/lib/domain/planning/weeklyBalance'
import { getMemberPlanningRules } from '@/lib/domain/planning/memberPlanningRules'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { materializeOperationalCatalog } from '@/lib/domain/recipes/operationalCatalog'

/**
 * P6 ET P7 — LE QUOTA DE VIANDE PAR PERSONNE, ET LA LIGNÉE RESPECTÉE.
 * Livrables 1.1 et 1.2 de `docs/PLAN_FINIR_MYKO.md` (§5, phase 1).
 *
 * CE QUE CE FICHIER EXIGE, ET CE QU'IL SE CONTENTE D'IMPRIMER. Il EXIGE les
 * deux critères d'acceptation des deux livrables — P6 « les repas carnés de
 * chacun égalent son quota déclaré ± 1 sur trois semaines » et P7 « 0 hors
 * lignée quand un jumeau existe » — plus la parade de risque que le plan écrit
 * lui-même : au-delà de 2 créneaux sur 42 en `review_required`, on revient au
 * réglage précédent. Il IMPRIME le reste : le nombre de plats à cuisiner, le
 * détail des substitutions, et la comparaison entre les deux lectures
 * possibles du plafond du foyer. La règle est celle du rapport de qualité
 * (0a.5) : on n'exige que ce qui est tenu et qu'on refuse de voir régresser.
 *
 * LES DEUX CHEMINS, ET POURQUOI LES DEUX.
 *   — P6 se mesure sur des SEMAINES, donc sur le chemin JSON du dépôt : la CI
 *     n'a pas de Postgres, et le solveur a besoin des minutes, des macros et
 *     des profils sensoriels que la capture du catalogue servi ne garde pas
 *     (cf. `clesJetees` de la capture). Le protocole est celui du §2.3 du plan
 *     — mêmes dates, même faisceau, même cible par repas — pour que les
 *     chiffres restent comparables à ceux qu'il consigne.
 *   — P7 se mesure sur le CHEMIN BASE, comme la mission de ce livrable
 *     l'impose, en rejouant la capture de `get_operational_recipe_catalog_v3`
 *     produite par la phase 0b (`tests/planning/fixtures/`). Le refus hors
 *     lignée est une décision par recette, pas par semaine : appelé
 *     directement, il se rejoue sur les deux cent et quelques recettes carnées
 *     que la base sert vraiment, au lieu de la douzaine de substitutions
 *     qu'une semaine produit. La garde de péremption de cette capture —
 *     empreinte des trois migrations du contrat — appartient à
 *     `tests/planning/contratOperationnel.test.js`, qui la possède ; elle
 *     n'est pas redite ici pour ne pas avoir deux vérités sur le même fichier.
 *
 * CE QU'IL NE PROUVE PAS. Il ne prouve rien de la base de production : une
 * capture est une photo, et le §2.1 du plan rappelle que l'écart base/dépôt
 * est un fait mesuré, pas une hypothèse. Il ne prouve rien non plus des
 * réglages RÉELS de Julien et Zoé : le quota est une donnée du foyer, réglée
 * sur l'écran Paramètres → Planning, et les valeurs employées ici sont celles
 * que le §8 du plan retient (4 et 2), déclarées comme des fixtures.
 *
 * LE COÛT EN INTÉGRATION CONTINUE, ASSUMÉ. Deux configurations × trois
 * semaines, planifiées UNE FOIS au niveau du `describe` — le modèle de
 * `tests/planning/varieteSemaine.test.js`, imposé par les vingt secondes par
 * test de la CI —, puis six payloads de publication construits sur ces mêmes
 * plans, au même niveau et sans replanifier. La seconde configuration (plafond
 * = maximum des quotas) ne sert qu'à consigner un écart ; l'ensemble coûte une
 * soixantaine de secondes, et c'est le prix pour qu'un arbitrage écrit dans un
 * commentaire puisse être rejoué plutôt que cru sur parole — et pour que la
 * parade du §5 se mesure sur le statut réellement PUBLIÉ (voir le dernier test
 * du fichier) et non sur celui du solveur, qui n'est pas le même.
 */

// ─── Protocole, recopié de tests/planning/rapportQualiteSemaine.test.js ─────
const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
const BEAM_WIDTH = 48
const MAX_MINUTES_BY_MEAL = { dejeuner: 120, diner: 240 }
const PREFERRED_ACTIVE_MINUTES = 30
const DEBUTS = ['2026-09-21', '2026-09-28', '2026-10-05']
const GOALS = [
  { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
  { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
]

// Les quotas retenus au §8 du plan. Ce sont des FIXTURES : le moteur ne connaît
// aucun prénom, et ces deux nombres vivent dans le profil de chaque membre.
const QUOTA_JULIEN = 4
const QUOTA_ZOE = 2

// Le foyer avec ses quotas déclarés. Zoé garde son ancien réglage de swaps dans
// son profil : c'est l'état réel d'un profil enregistré avant ce livrable, et
// on vérifie ainsi que le quota le remplace bien au lieu de s'y ajouter.
const MEMBRES_AVEC_QUOTA = [
  { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true, meat_meals_per_week: QUOTA_JULIEN } } },
  { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true, vegetarian_meat_swaps_per_week: 4, meat_meals_per_week: QUOTA_ZOE } } },
]

// Parade de risque du plan (§5, phase 1) : « au-delà de 2 créneaux sur 42, on
// revient au réglage précédent et on consigne pourquoi ».
const CRENEAUX_REVIEW_MAX = 2

const CAPTURE_BASE = 'tests/planning/fixtures/catalogue-servi-base-A.json'

/** Trois semaines consécutives, historique cumulé, à un plafond carné donné. */
function planifierTroisSemaines({ recipes, membres, meatMax }) {
  const semaines = []
  for (const debut of DEBUTS) {
    const history = buildPlanningHistory({
      entries: semaines.flatMap(({ plan }) => plan.slots.map((slot) => ({
        date: slot.date, recipeCode: slot.recipeCode, diversity: slot.diversity, title: slot.title,
      }))),
      referenceDate: debut,
    })
    const plan = generateClosedLoopPlan({
      slots: buildWeekSlots(debut),
      recipes,
      inventoryLots: [],
      history,
      constraints: {
        allowShopping: true,
        targetByMeal: { dejeuner: TARGET, diner: TARGET },
        maxMinutesByMeal: MAX_MINUTES_BY_MEAL,
        preferredActiveMinutes: PREFERRED_ACTIVE_MINUTES,
        weeklyBalance: buildWeeklyBalance({ meatMax }),
      },
      beamWidth: BEAM_WIDTH,
    })
    semaines.push({ debut, plan, perso: buildPersonalizedMeals({ plan, recipes, members: membres, goals: GOALS }) })
  }
  return semaines
}

describe('P6 et P7 — quota carné par personne et refus hors lignée', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })
  const parCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))

  // Le plafond du foyer tel que le livrable 1.1 le déduit : la SOMME des quotas.
  const meatMaxSomme = meatMaxFromDeclaredQuotas([QUOTA_JULIEN, QUOTA_ZOE])
  const retenu = planifierTroisSemaines({ recipes, membres: MEMBRES_AVEC_QUOTA, meatMax: meatMaxSomme })
  // La lecture concurrente, mesurée pour être consignée : le MAXIMUM des
  // quotas suffit à ce que chacun tienne le sien, et laisse moins de créneaux
  // carnés à substituer. On applique la règle du plan (la somme) ; on ne cache
  // pas ce que l'autre lecture donne.
  const compare = planifierTroisSemaines({ recipes, membres: MEMBRES_AVEC_QUOTA, meatMax: Math.max(QUOTA_JULIEN, QUOTA_ZOE) })


  const principaux = (perso) => perso.meals
    .filter((meal) => meal.canonical_recipe_code && ['dejeuner', 'diner'].includes(meal.meal_type))
  const aCuisiner = (semaines) => semaines
    .map(({ perso }) => new Set(principaux(perso).map((meal) => meal.canonical_recipe_code)).size)
  const substitutions = (semaines) => semaines
    .flatMap(({ perso }) => principaux(perso).filter((meal) => meal.variant_kind && meal.variant_kind !== 'household_base'))
  const horsLignee = (semaines) => substitutions(semaines)
    .filter((meal) => meal.portion_details?.same_lineage === false)
  // Le statut rendu par le SOLVEUR : « a-t-il trouvé une semaine complète sans
  // relâcher les règles de répétition ni le plancher de densité ? »
  const creneauxEnRevueSolveur = (semaines) => semaines
    .filter(({ plan }) => plan.status !== 'published')
    .reduce((total, { plan }) => total + plan.slots.length, 0)
  // Le statut réellement PUBLIÉ, qui n'est pas le même et qui est celui que le
  // foyer voit. `buildCanonicalPlanPayload` ajoute au statut du solveur les
  // contrôles nutritionnels de la semaine : un `error` ou un `blocker` y bascule
  // la version en `review_required` (`canonicalPlanPayload.js`). Les payloads
  // sont construits sur les plans DÉJÀ calculés — aucune semaine n'est
  // replanifiée pour cette mesure.
  const publier = (semaines) => semaines.map(({ debut, plan }) => {
    const payload = buildCanonicalPlanPayload({
      plan, recipes, windowStart: debut, members: MEMBRES_AVEC_QUOTA, goals: GOALS, constraints: {}, inventoryLots: [],
    })
    return {
      debut,
      statut: payload.validation_summary.status,
      slots: plan.slots.length,
      causes: [...new Set((payload.issues || [])
        .filter((issue) => ['blocker', 'error'].includes(issue.severity))
        .map((issue) => issue.code))].sort(),
    }
  })
  const creneauxEnRevuePublies = (statuts) => statuts
    .filter((ligne) => ligne.statut !== 'published')
    .reduce((total, ligne) => total + ligne.slots, 0)
  // Les deux configurations PUBLIÉES, construites UNE fois au niveau du
  // `describe` sur les plans DÉJÀ calculés — aucune semaine n'est replanifiée :
  // la CI coupe à vingt secondes par test, et six payloads en coûtent une
  // vingtaine.
  const statutsPublies = [publier(retenu), publier(compare)]

  it('1.1 — le quota déclaré remplace le nombre de swaps, et la somme borne le foyer', () => {
    // Le quota se lit par membre, et il l'emporte sur l'ancien réglage : Zoé
    // porte encore `vegetarian_meat_swaps_per_week: 4` dans son profil.
    expect(getMemberPlanningRules(MEMBRES_AVEC_QUOTA[0]).meatMealsPerWeek).toBe(QUOTA_JULIEN)
    expect(getMemberPlanningRules(MEMBRES_AVEC_QUOTA[1]).meatMealsPerWeek).toBe(QUOTA_ZOE)
    expect(meatMaxSomme).toBe(QUOTA_JULIEN + QUOTA_ZOE)
    // La constante à 4 ne décide plus : le plafond passé au solveur est la somme.
    expect(buildWeeklyBalance({ meatMax: meatMaxSomme }).meatMax).toBe(6)
    // Et chaque semaine rend la ligne de mesure, par membre.
    for (const { perso } of retenu) {
      expect(perso.meatQuotas.map((ligne) => ligne.person_name)).toEqual(['Julien', 'Zoé'])
      for (const ligne of perso.meatQuotas) expect(ligne.quota_source).toBe('meat_meals_per_week')
    }
  })

  it('P6 — sur trois semaines, les repas carnés de chacun égalent son quota déclaré ± 1', () => {
    // LE CRITÈRE D'ACCEPTATION DU LIVRABLE 1.1. Avant lui, Zoé était à 0/14
    // les trois semaines (§2.3 du plan) : ses quatre swaps absorbaient les
    // quatre créneaux que le plafond du foyer autorisait. L'écart n'est PAS
    // borné à 0 : le foyer peut servir moins de créneaux carnés que le plus
    // gros quota, et la personne mange alors un repas carné de moins. C'est
    // la tolérance que le plan écrit, et elle ne s'élargit pas.
    const ecarts = retenu.flatMap(({ debut, perso }) => perso.meatQuotas
      .filter((ligne) => ligne.declared_quota != null)
      .filter((ligne) => Math.abs(ligne.quota_gap) > 1)
      .map((ligne) => `${debut} ${ligne.person_name} : ${ligne.meat_meals} repas carnés pour un quota de ${ligne.declared_quota}`
        + ` (créneaux carnés du foyer : ${ligne.household_meat_slots}, swaps demandés ${ligne.requested_swaps},`
        + ` réalisés ${ligne.applied_swaps}, refusés ${ligne.refused_swaps.length})`))
    expect(ecarts).toEqual([])
  })

  it('P7 — aucune substitution hors lignée quand un jumeau de même lignée existe (trois semaines)', () => {
    // Deux lectures du même critère, et il faut les deux. La première relit ce
    // que le moteur a ÉCRIT dans le repas ; la seconde REDEMANDE au corpus s'il
    // portait un jumeau, sans croire le moteur sur parole — sans quoi on
    // vérifierait seulement que le moteur est d'accord avec lui-même.
    const fautes = retenu.flatMap(({ debut, plan, perso }) => horsLignee([{ debut, plan, perso }])
      .flatMap((meal) => {
        const creneau = plan.slots.find((slot) => slot.date === meal.meal_date && slot.mealType === meal.meal_type)
        const base = parCode.get(creneau?.recipeCode)
        const jumeaux = base ? vegetarianLineageTwins(base, recipes, {}) : []
        const declare = meal.portion_details?.substitution_fallback?.lineageTwinAvailable
        const fautesDuRepas = []
        if (jumeaux.length) {
          fautesDuRepas.push(`${debut} ${meal.meal_date} ${meal.meal_type} ${meal.person_name} : `
            + `${base.code} remplacé par ${meal.canonical_recipe_code} hors lignée alors que le corpus porte `
            + `${jumeaux.map((recipe) => recipe.code).join(', ')}`)
        }
        if (declare !== false) {
          fautesDuRepas.push(`${debut} ${meal.meal_date} ${meal.meal_type} ${meal.person_name} : `
            + `repli hors lignée sans lineageTwinAvailable=false (valeur lue : ${String(declare)})`)
        }
        return fautesDuRepas
      }))
    expect(fautes).toEqual([])
  })

  it('P7 — chemin base : 0 hors lignée quand un jumeau existe, sur tout le catalogue servi', () => {
    // LA MESURE QUE LA MISSION DU LIVRABLE 1.2 DEMANDE. Elle porte sur la
    // capture de la RPC opérationnelle, c'est-à-dire sur ce que la base sert au
    // planificateur — `derivedFrom` compris, publié par la phase 0b. Avant
    // elle, `recipeLineage` retombait sur le code et toute recette était sa
    // propre lignée : ce test-ci n'aurait rien pu mesurer.
    const capture = JSON.parse(readFileSync(join(process.cwd(), CAPTURE_BASE), 'utf8'))
    const servies = materializeOperationalCatalog({
      contractVersion: capture.provenance.contractVersion,
      recipes: capture.recipes,
    }).recipes
    expect(servies.length).toBeGreaterThan(0)
    // Sans lignée publiée, le reste du test serait vrai à vide.
    expect(servies.filter((recipe) => recipe.derivedFrom).length).toBeGreaterThan(0)

    const carnees = servies.filter((recipe) => classifyRecipe(recipe).meat)
    expect(carnees.length).toBeGreaterThan(0)
    const avecJumeau = carnees.filter((base) => vegetarianLineageTwins(base, servies, {}).length > 0)
    expect(avecJumeau.length, 'aucune lignée carnée servie ne porte de jumeau végétarien : le critère serait vrai à vide').toBeGreaterThan(0)

    const fautes = avecJumeau.flatMap((base) => {
      const choix = chooseVegetarianAlternative(base, servies, new Set(), {})
      if (choix && choix.sameLineage) return []
      return [`${base.code} : jumeaux de même lignée disponibles `
        + `(${vegetarianLineageTwins(base, servies, {}).map((recipe) => recipe.code).join(', ')}), `
        + `retenu ${choix ? choix.recipe.code : 'aucun'}`]
    })
    expect(fautes).toEqual([])

    // Le dénominateur est imprimé, pas seulement asserté : « 0 faute » ne dit
    // rien sans le nombre de cas éprouvés, et c'est ce chiffre-là que le §2.3
    // du plan devra consigner à la place du « 6 sur 11 » du chemin JSON.
    const sansJumeau = carnees.length - avecJumeau.length
    // eslint-disable-next-line no-console
    console.log(`P7 chemin base (capture ${capture.provenance.scenario}, contrat ${capture.provenance.contractVersion}) · `
      + `${servies.length} recettes servies, ${servies.filter((recipe) => recipe.derivedFrom).length} avec une lignée publiée, `
      + `${carnees.length} carnées dont ${avecJumeau.length} portant un jumeau végétarien de même lignée · `
      + `0 hors lignée sur ces ${avecJumeau.length} cas · `
      + `${sansJumeau} lignées carnées sans jumeau au corpus : c'est un manque de corpus (lot d'usine, phase 5), pas une faute du moteur`)
  })

  it('risque du §5 — le durcissement de P6 ne met pas la semaine en revue', () => {
    // La parade que le plan écrit pour ce livrable : « on mesure le taux de
    // review_required sur trois semaines ; au-delà de 2 créneaux sur 42, on
    // revient au réglage précédent et on consigne pourquoi ». Ce seuil est
    // celui du plan ; il ne s'élargit pas pour faire passer un réglage.
    const total = retenu.reduce((somme, { plan }) => somme + plan.slots.length, 0)
    expect(total).toBe(42)
    const statuts = retenu.map(({ debut, plan }) => `${debut} ${plan.status}`).join(' ; ')
    expect(creneauxEnRevueSolveur(retenu), `créneaux en revue au plafond ${meatMaxSomme} — ${statuts}`)
      .toBeLessThanOrEqual(CRENEAUX_REVIEW_MAX)
  })

  it('… et la parade se mesure sur le statut PUBLIÉ, pas sur celui du solveur', () => {
    /**
     * TROUVÉ EN RELECTURE, LE 17 SEPTEMBRE 2026, ET IL FAUT LE LIRE.
     *
     * Le contrôle ci-dessus lit `plan.status`, le statut du SOLVEUR. Ce n'est
     * pas le statut que le foyer voit : `buildCanonicalPlanPayload` ajoute les
     * contrôles nutritionnels de la semaine et bascule la version publiée en
     * `review_required` dès qu'une dimension passe sous son seuil. Mesuré :
     * les trois semaines sortent `published` du solveur et `review_required`
     * une fois publiées, par `nutrition_week_review_required`. La parade lue
     * sur le seul statut du solveur annonçait donc 0 créneau en revue sur 42
     * là où la semaine publiée en compte 42.
     *
     * CE QUE CE N'EST PAS : une régression de la phase 1. La même mesure au
     * réglage PRÉCÉDENT — plafond carné 4, cible protéique de 216 g, aucun
     * plancher de densité — rend exactement le même statut sur les trois mêmes
     * semaines, pour la même cause. La parade du plan dit « au-delà de 2
     * créneaux sur 42, on revient au réglage précédent » : y revenir ne
     * changerait rien ici, parce que la cause est antérieure — c'est P4, la
     * couverture protéique, que `tests/planning/rapportQualiteSemaine.test.js`
     * mesure à 6/7, 5/7 et 4/7 pour une cible de 6/7.
     *
     * CE QUE CE TEST EXIGE, DONC : que la phase 1 n'AJOUTE aucun créneau en
     * revue par rapport à l'autre lecture du plafond, qu'il planifie déjà. Une
     * borne absolue à 2 serait rouge avant comme après ; l'abaisser pour la
     * rendre verte serait gagner un critère en changeant sa définition, et
     * l'écrire ≤ 42 serait ne rien exiger du tout.
     */
    const [somme, maximum] = statutsPublies
    // eslint-disable-next-line no-console
    console.log(`statut PUBLIÉ · plafond = somme (${meatMaxSomme}) : `
      + somme.map((ligne) => `${ligne.debut} ${ligne.statut}${ligne.causes.length ? ` (${ligne.causes.join(', ')})` : ''}`).join(' | ')
      + ` · créneaux en revue ${creneauxEnRevuePublies(somme)}/42`
      + ` — pour mémoire, statut du SOLVEUR ${creneauxEnRevueSolveur(retenu)}/42`)
    expect(creneauxEnRevuePublies(somme), 'la somme des quotas met plus de créneaux en revue que le maximum')
      .toBeLessThanOrEqual(creneauxEnRevuePublies(maximum))
    // Et la cause est NOMMÉE, pas devinée : toute semaine en revue doit porter
    // la cause antérieure à cette phase. Si elle disparaissait — ou si une
    // semaine passait en revue pour un motif que ce test ne connaît pas — la
    // ligne ci-dessous le dirait au lieu de rester verte sur un autre motif.
    //
    // À CE PROTOCOLE-CI, et il faut le dire parce que c'est une mesure et non
    // une prédiction : la troisième semaine porte EN PLUS
    // `daily_portion_coupling_relaxed`, le plafond de rapport de portions
    // atteint. Ce protocole emploie la cible protéique de 216 g d'avant le
    // livrable 1.3 et aucun plancher de densité ; à la fixture du rapport de
    // qualité — cible calculée, plancher armé — ce blocage-là n'apparaît plus
    // sur aucune des trois semaines.
    for (const ligne of [...somme, ...maximum]) {
      if (ligne.statut === 'published') continue
      expect(ligne.causes, `${ligne.debut} : causes du review_required`)
        .toContain('nutrition_week_review_required')
      expect(ligne.causes.filter((code) => ![
        'nutrition_week_review_required', 'daily_portion_coupling_relaxed',
      ].includes(code)), `${ligne.debut} : cause inattendue`).toEqual([])
    }
  })

  it('imprime ce qui se mesure sans s\'exiger : plats à cuisiner, substitutions, somme contre maximum', () => {
    const ligne = (nom, semaines) => `${nom} · repas carnés `
      + semaines.map(({ debut, perso }) => `${debut} ${perso.meatQuotas.map((quota) => `${quota.person_name} ${quota.meat_meals}/${quota.main_meals}`).join(' ')}`).join(' | ')
      + ` · plats à cuisiner ${aCuisiner(semaines).join(', ')} (total ${aCuisiner(semaines).reduce((somme, valeur) => somme + valeur, 0)})`
      + ` · substitutions ${substitutions(semaines).length} dont ${horsLignee(semaines).length} hors lignée faute de jumeau`
      + ` · créneaux en revue (statut du solveur) ${creneauxEnRevueSolveur(semaines)}/42`
    // eslint-disable-next-line no-console
    console.log(ligne(`plafond = somme des quotas (${meatMaxSomme})`, retenu))
    // eslint-disable-next-line no-console
    console.log(ligne(`plafond = maximum des quotas (${Math.max(QUOTA_JULIEN, QUOTA_ZOE)})`, compare))

    // L'invariant vaut pour les DEUX lectures du plafond, pas seulement pour
    // celle qu'on applique : un repli hors lignée déclare toujours qu'aucun
    // jumeau n'était disponible.
    const mal = [...horsLignee(retenu), ...horsLignee(compare)]
      .filter((meal) => meal.portion_details?.substitution_fallback?.lineageTwinAvailable !== false)
      .map((meal) => `${meal.meal_date} ${meal.meal_type} ${meal.person_name} → ${meal.canonical_recipe_code}`)
    expect(mal).toEqual([])
  })
})

// Les cas limites du quota — absence, zéro, héritage, refus de substitution —
// se lisent sur un corpus de cinq plats, sans recherche en faisceau :
// `tests/planning/quotaViandeCablage.test.js`. Les faire passer ici coûterait
// trente secondes pour prouver une addition.
