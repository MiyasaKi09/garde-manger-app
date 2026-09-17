import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  classifyRecipe,
  generateClosedLoopPlan,
  isMealSuitableRecipe,
  productionShelfLifeDays,
} from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { buildPersonalizedMeals } from '@/lib/domain/planning/personalizedMeals'
import { buildPlanningHistory } from '@/lib/domain/planning/repetitionRules'
import { usesSharedBase } from '@/lib/domain/planning/sharedBases'
import { freezerShelfLifeDays, isRecipeFreezable } from '@/lib/domain/planning/cookingSessions'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { ingredientOrigin, isVegetarianCompatibleOrigin } from '@/lib/domain/foods/origins'

/**
 * LE RAPPORT DE QUALITÉ — dix-huit chiffres, trois semaines consécutives.
 *
 * POURQUOI CE FICHIER EXISTE. Les dix-huit chiffres du §2.3 de
 * `docs/PLAN_FINIR_MYKO.md` ont été produits par un harnais JETABLE, créé puis
 * supprimé — c'est d'ailleurs la méthode que l'annexe de
 * `docs/PLAN_PLANNING_PARFAIT.md` recommandait. Le défaut se voit à l'usage :
 * on ne peut ni les rejouer, ni en contester un, ni savoir le jour où l'un
 * d'eux régresse. Or c'est l'instrument de mesure de tout le plan. Il doit
 * donc vivre dans le dépôt et tourner en intégration continue.
 *
 * CE QUE CE FICHIER FAIT, ET CE QU'IL NE FAIT PAS. Il RAPPORTE les dix-huit
 * critères ; il n'en EXIGE que deux — P8 (faux végétariens) et P11
 * (productions contredites par leur conservation) —, les deux seuls que le
 * plan déclare déjà tenus, donc les deux seules régressions qu'on puisse
 * interdire aujourd'hui. Transformer les seize autres en assertions ferait
 * échouer la suite sur un état de fait connu et documenté : un test rouge en
 * permanence ne dit plus rien à personne, et la tentation suivante serait d'en
 * abaisser la borne. On mesure, on imprime, on laisse le plan décider quand
 * chaque ligne devient exigible.
 *
 * CE QU'IL NE DEVINE PAS. P17 et P18 n'ont pas de mesure : leurs livrables
 * n'existent pas. Ils portent « sans objet » avec le constat mécanique qui
 * l'établit (aucun module d'export, aucun contrat des chiffres), jamais un
 * chiffre de complaisance. Même règle pour ce qui ne se mesure que sur le
 * chemin base : la CI n'a pas de base, elle le dit au lieu de l'estimer.
 *
 * LE PROTOCOLE. Trois semaines CONSÉCUTIVES avec historique cumulé, aux
 * paramètres exacts de `app/api/planning/generate-v3/route.js` — faisceau 48,
 * `maxMinutesByMeal { dejeuner: 120, diner: 240 }`, `preferredActiveMinutes`
 * 30, cible par repas identique — et le foyer réel via
 * `buildPersonalizedMeals`. Les trois semaines sont planifiées UNE FOIS au
 * niveau du `describe` : la CI accorde vingt secondes par test et une
 * recherche en faisceau de largeur 48 sur 568 recettes en coûte cinq à neuf à
 * elle seule. C'est le modèle de `tests/planning/varieteSemaine.test.js`.
 *
 * DEUX ÉCARTS AVEC LE CHEMIN DE PRODUCTION, et ils sont écrits ici parce
 * qu'une mesure dont on ignore le périmètre n'est pas une mesure. Ce rapport
 * planifie sur les 568 publiables du dépôt, c'est-à-dire :
 *   — SANS le filtre `isMealSuitableRecipe` que la route applique
 *     (`generate-v3/route.js`, `allRecipes`). Relevé sur ces trois semaines :
 *     aucun des 35 codes servis n'est écarté par ce filtre, l'écart ne change
 *     donc rien ici — mais rien ne garantit qu'il en aille de même demain ;
 *   — SANS l'élagage `selectPlanningRecipePool({ maxCandidates: 400 })` que la
 *     même route applique depuis le livrable 0a.4. Celui-là, lui, change le
 *     vivier présenté au faisceau : 460 candidats au lieu des 568 recettes
 *     passées ici. La table de `recipeCandidatePolicy.js` montre que P2 et P3
 *     bougent d'une valeur d'élagage à l'autre — les chiffres de ce rapport ne
 *     s'y comparent donc pas terme à terme, les deux protocoles ne portant ni
 *     le même vivier ni le même nombre de semaines.
 * Le protocole du §2.3 du plan est conservé tel quel — sans quoi les dix-huit
 * lignes ne seraient plus comparables à celles qu'il consigne — mais il mesure
 * LE MOTEUR SUR LE CORPUS DU DÉPÔT, pas le vivier que la route lui présente.
 * Le jour où la phase 0b rend le chemin base complet, c'est ce protocole-là
 * qu'il faudra aligner, et le §9.1 le demande explicitement (« sur le chemin de
 * production »).
 *
 * Rien ici ne lit l'horloge : les trois dates de départ sont écrites, le
 * planificateur et `personalizedMeals` n'appellent ni `Date.now()` ni
 * `new Date()`. Deux exécutions rendent les mêmes chiffres, à l'exception de
 * P16 qui mesure une durée et dépend donc de la machine.
 */

// ─── Paramètres, recopiés de app/api/planning/generate-v3/route.js ──────────
// Cible par repas : celle de l'annexe A1 de docs/PLAN_PLANNING_PARFAIT.md,
// c'est-à-dire le foyer réel rapporté à un créneau.
const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
const BEAM_WIDTH = 48
const MAX_MINUTES_BY_MEAL = { dejeuner: 120, diner: 240 }
const PREFERRED_ACTIVE_MINUTES = 30

const GOALS = [
  { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
  { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
]
const MEMBERS = [
  { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
  // Quatre swaps par semaine : c'est le réglage qui existe aujourd'hui.
  // `meat_meals_per_week` — le quota par personne décidé au §8 du plan — n'est
  // pas encore un réglage du dépôt (livrable 1.1) ; on ne l'invente pas ici.
  { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true, vegetarian_meat_swaps_per_week: 4 } } },
]

// Les trois semaines du §2.3, pour que les chiffres rendus soient comparables
// à ceux qui y sont consignés.
const DEBUTS = ['2026-09-21', '2026-09-28', '2026-10-05']

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const FICHIER_RAPPORT = join(RACINE, 'scripts', 'data', 'out', 'rapport-qualite-semaine.txt')

// Minutes actives d'un réchauffage, recopiées du solveur (REHEAT_ACTIVE_MINUTES
// y est privé). Elles ne servent qu'à la définition « préparation + cuisson »,
// jamais à un refus.
const MINUTES_RECHAUFFAGE = 10

// Décimales à la française : le dépôt écrit en français, et un rapport qu'on
// compare d'une semaine à l'autre se lit mieux dans une seule convention.
const fr = (value, decimales = 1) => value.toFixed(decimales).replace('.', ',')
const pct = (part, total) => (total ? `${fr(100 * part / total)} %` : 'sans objet')
const somme = (values) => values.reduce((total, value) => total + value, 0)
const moyenne = (values) => (values.length ? somme(values) / values.length : null)

/**
 * Origines non végétariennes des ingrédients REQUIS d'une recette, relues
 * depuis le catalogue plutôt que depuis le drapeau `vegetarian` de
 * `classifyRecipe`. La distinction fait tout l'intérêt du contrôle : vérifier
 * `classification.vegetarian` reviendrait à vérifier que le moteur est
 * d'accord avec lui-même. Ici on redemande aux ingrédients.
 *
 * Les ingrédients BLOQUÉS comptent : ils n'ont ni grammes ni nutrition, mais
 * ils ont une origine, et une recette dont l'agneau a été écarté n'est pas
 * devenue végétarienne pour autant.
 */
function originesNonVegetariennes(recipe) {
  const requis = [
    ...(recipe?.exactIngredients || []).filter((ingredient) => !ingredient?.optional),
    ...(recipe?.blockedIngredients || []),
  ]
  return requis
    .map((ingredient) => ({ nom: ingredient?.name || null, origine: ingredientOrigin(ingredient) }))
    .filter(({ origine }) => !isVegetarianCompatibleOrigin(origine))
}

/** Fichiers de `app/` et `components/` citant une chaîne donnée. Sert à P14. */
function fichiersCitant(motif, dossiers, exclusions = []) {
  const trouves = []
  const parcourir = (chemin) => {
    let entrees = []
    try { entrees = readdirSync(chemin, { withFileTypes: true }) } catch { return }
    for (const entree of entrees) {
      const complet = join(chemin, entree.name)
      if (entree.isDirectory()) { parcourir(complet); continue }
      if (!/\.(js|jsx|mjs)$/.test(entree.name)) continue
      const relatif = complet.slice(RACINE.length + 1)
      if (exclusions.some((exclusion) => relatif.endsWith(exclusion))) continue
      let contenu = ''
      try { contenu = readFileSync(complet, 'utf8') } catch { continue }
      if (contenu.includes(motif)) trouves.push(relatif)
    }
  }
  for (const dossier of dossiers) parcourir(join(RACINE, dossier))
  return trouves.sort()
}

/** Un fichier du dépôt existe-t-il ? Sert à établir « sans objet » de P17/P18. */
function fichierPresent(relatif) {
  try { readFileSync(join(RACINE, relatif), 'utf8'); return true } catch { return false }
}

const addDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

describe('rapport de qualité — P1 à P18 sur trois semaines consécutives', () => {
  // ─── Corpus ──────────────────────────────────────────────────────────────
  const recipes = getCanonicalRecipes({ servings: 2 })
  const corpusEntier = getCanonicalRecipes({ eligibleOnly: false })
  const servables = recipes.filter(isMealSuitableRecipe)
  const parCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))

  // ─── Les trois semaines, planifiées UNE FOIS ─────────────────────────────
  // L'historique se cumule d'une semaine à l'autre : sans lui, les trois
  // semaines seraient trois tirages indépendants et P1bis ne voudrait rien
  // dire. Les entrées reprennent la forme attendue par `buildPlanningHistory`
  // — date, code et profil de diversité, que le créneau porte déjà.
  const semaines = []
  for (const debut of DEBUTS) {
    const history = buildPlanningHistory({
      entries: semaines.flatMap(({ plan }) => plan.slots.map((slot) => ({
        date: slot.date,
        recipeCode: slot.recipeCode,
        diversity: slot.diversity,
        title: slot.title,
      }))),
      referenceDate: debut,
    })
    const depart = Date.now()
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
      },
      beamWidth: BEAM_WIDTH,
    })
    const millisecondes = Date.now() - depart
    const perso = buildPersonalizedMeals({ plan, recipes, members: MEMBERS, goals: GOALS })
    semaines.push({ debut, plan, perso, millisecondes })
  }

  const tousCreneaux = semaines.flatMap(({ plan }) => plan.slots)
  const classifications = new Map(tousCreneaux.map((slot) => [slot, classifyRecipe(parCode.get(slot.recipeCode))]))
  const platsPrincipaux = (perso) => perso.meals
    .filter((meal) => meal.canonical_recipe_code && ['dejeuner', 'diner'].includes(meal.meal_type))

  // ─── P1 — plats distincts, et reprises sur trois semaines ────────────────
  const p1ParSemaine = semaines.map(({ plan }) => new Set(plan.slots.map((slot) => slot.recipeCode)).size)
  const codesParSemaine = semaines.map(({ plan }) => new Set(plan.slots.map((slot) => slot.recipeCode)))
  const distinctsSurTrois = new Set(tousCreneaux.map((slot) => slot.recipeCode))
  // Une « reprise » au sens de P1bis est un plat servi dans PLUSIEURS semaines.
  // Un plat servi deux fois dans la même semaine relève de P1, pas de P1bis.
  const reprisesInterSemaines = [...distinctsSurTrois]
    .filter((code) => codesParSemaine.filter((codes) => codes.has(code)).length > 1)
  const reprisesTousCreneaux = [...distinctsSurTrois]
    .filter((code) => tousCreneaux.filter((slot) => slot.recipeCode === code).length > 1)

  // ─── P2 — pâtes, et féculent dominant ────────────────────────────────────
  const feculentDe = (slot) => classifications.get(slot).mainStarch
  const patesParSemaine = semaines.map(({ plan }) => plan.slots.filter((slot) => feculentDe(slot) === 'pates').length)
  const patesTotal = somme(patesParSemaine)
  const feculentDominantParSemaine = semaines.map(({ plan }) => {
    const comptes = new Map()
    for (const slot of plan.slots) {
      const feculent = feculentDe(slot)
      if (!feculent) continue
      comptes.set(feculent, (comptes.get(feculent) || 0) + 1)
    }
    const tete = [...comptes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
    return tete ? { feculent: tete[0], compte: tete[1], creneaux: plan.slots.length } : null
  })

  // ─── P3 — laitiers et œufs en protéine principale ────────────────────────
  const laitiersOeufsParSemaine = semaines.map(({ plan }) => plan.slots
    .filter((slot) => ['laitiers', 'oeufs'].includes(classifications.get(slot).mainProtein)).length)

  // ─── P4 — jours de Julien à ≥ 85 % de sa cible protéique ─────────────────
  const SEUIL_P4 = 0.85
  const julienParSemaine = semaines.map(({ perso }) => perso.daily.filter((jour) => jour.person_name === 'Julien'))
  const p4ParSemaine = julienParSemaine.map((jours) => jours
    .filter((jour) => Number(jour.target.proteinG) > 0
      && Number(jour.total.proteinG) >= SEUIL_P4 * Number(jour.target.proteinG)).length)
  const relachesParSemaine = julienParSemaine.map((jours) => jours.filter((jour) => jour.protein_gate_relaxed).length)

  // ─── P5 — ratio de portion entre les deux assiettes d'un même plat ───────
  // `portion_ratio_lunch/dinner` est un ratio de FOYER (max / min entre
  // membres) : les deux lignes quotidiennes portent la même valeur. On ne lit
  // que celles de Julien, sans quoi chaque ratio serait compté deux fois.
  const ratiosParSemaine = julienParSemaine.map((jours) => jours
    .flatMap((jour) => [jour.portion_ratio_lunch, jour.portion_ratio_dinner])
    .filter((ratio) => Number.isFinite(ratio)))

  // ─── P6 — repas carnés de chacun ─────────────────────────────────────────
  const carnesParMembre = semaines.map(({ perso }) => MEMBERS.map((member) => ({
    nom: member.name,
    carnes: platsPrincipaux(perso)
      .filter((meal) => meal.person_name === member.name)
      .filter((meal) => classifyRecipe(parCode.get(meal.canonical_recipe_code)).meat).length,
    total: platsPrincipaux(perso).filter((meal) => meal.person_name === member.name).length,
  })))

  // ─── P7 — substitutions hors lignée ──────────────────────────────────────
  // Dénominateur : les repas RÉELLEMENT substitués (`variant_kind` autre que
  // `household_base`). Un membre qui reçoit le plat du foyer n'a rien
  // substitué et n'entre pas au dénominateur.
  const substitutionsParSemaine = semaines.map(({ perso }) => platsPrincipaux(perso)
    .filter((meal) => meal.variant_kind && meal.variant_kind !== 'household_base'))
  const horsLigneeParSemaine = substitutionsParSemaine.map((subs) => subs
    .filter((meal) => meal.portion_details?.same_lineage === false))

  // ─── P8 — faux végétariens ───────────────────────────────────────────────
  // (a) Servis : un repas donné comme substitution végétarienne dont un
  //     ingrédient REQUIS porte une origine non compatible. Relu depuis le
  //     catalogue des origines, pas depuis le drapeau du moteur.
  const swapsVegetariens = semaines.flatMap(({ perso }) => platsPrincipaux(perso)
    .filter((meal) => String(meal.variant_kind || '').startsWith('vegetarian_swap')))
  const fauxVegetariensServis = semaines.flatMap(({ debut, perso }) => platsPrincipaux(perso)
    .filter((meal) => String(meal.variant_kind || '').startsWith('vegetarian_swap'))
    .map((meal) => ({
      debut,
      personne: meal.person_name,
      date: meal.meal_date,
      repas: meal.meal_type,
      code: meal.canonical_recipe_code,
      fautes: originesNonVegetariennes(parCode.get(meal.canonical_recipe_code)),
    }))
    .filter(({ fautes }) => fautes.length > 0))
  // (b) Origines non tranchées au corpus : 'inconnu' n'est pas compatible
  //     végétarien, et c'est par elle que la viande passait avant C1.1.
  const corpusOrigineInconnue = recipes
    .filter((recipe) => classifyRecipe(recipe).unknownOrigins.length > 0)
    .map((recipe) => recipe.code)
  const p8 = fauxVegetariensServis.length + corpusOrigineInconnue.length
  // Réserve documentée au §2.4 du plan, RAPPORTÉE et non exigée : les recettes
  // végétariennes portant un ingrédient carné FACULTATIF. Le livrable 3.6 doit
  // les faire disparaître de la fiche et de la liste ; tant qu'il n'existe pas,
  // les compter comme une faute ferait échouer la suite sur un fait connu.
  const optionnelsNonVegetariens = recipes
    .filter((recipe) => classifyRecipe(recipe).vegetarian && classifyRecipe(recipe).optionalNonVegetarian.length > 0)
    .map((recipe) => recipe.code)

  // ─── P9 — plats distincts à cuisiner ─────────────────────────────────────
  // Ce que le foyer doit RÉELLEMENT préparer : le plat du foyer plus chaque
  // substitution. Deux assiettes du même plat ne comptent qu'une fois ; un
  // jumeau végétarien est un plat de plus à cuire tant que la fiche fusionnée
  // (livrable 2.3) n'existe pas.
  const aCuisinerParSemaine = semaines.map(({ perso }) => new Set(platsPrincipaux(perso)
    .map((meal) => meal.canonical_recipe_code)))

  // ─── P10 — minutes de cuisine, sous ses trois définitions ────────────────
  // Le §8 du plan tranche : le critère est la PRÉPARATION ACTIVE ENGAGÉE,
  // cible ≤ 300, et les trois chiffres s'affichent avec leur définition.
  //
  // 1. Préparation active engagée : la somme des minutes de préparation des
  //    créneaux réellement cuisinés. Un créneau servi depuis une production
  //    planifiée n'est pas recuisiné : il ne coûte rien à cette définition.
  // 2. Préparation active si tout est frais : la même somme sur les quatorze
  //    créneaux, comme si aucune portion n'était mutualisée. C'est le
  //    comparable du « tout frais » de 1 065 minutes du 3 septembre.
  // 3. Préparation + cuisson, tout frais : on y ajoute les minutes de cuisson,
  //    y compris non surveillées. C'est le chiffre le plus gros et le moins
  //    représentatif du temps passé debout.
  const minutesParSemaine = semaines.map(({ plan }) => {
    const minutes = plan.slots.map((slot) => {
      const recipe = parCode.get(slot.recipeCode)
      return {
        cuisine: slot.source === 'fresh',
        prep: Number(recipe.prepMinutes) || 0,
        cuisson: Number(recipe.cookMinutes) || 0,
      }
    })
    return {
      engagee: somme(minutes.filter((item) => item.cuisine).map((item) => item.prep)),
      toutFrais: somme(minutes.map((item) => item.prep)),
      avecCuisson: somme(minutes.map((item) => item.prep + item.cuisson)),
      rechauffages: minutes.filter((item) => !item.cuisine).length * MINUTES_RECHAUFFAGE,
    }
  })

  // Cible de P10 sous la définition retenue au §8 du plan : préparation active
  // ENGAGÉE, ≤ 300 minutes. Le dépassement est calculé, pas commenté.
  const CIBLE_P10_MINUTES = 300
  const semainesSousCible = minutesParSemaine.filter((m) => m.engagee <= CIBLE_P10_MINUTES).length
  const depassementsP10 = minutesParSemaine
    .filter((m) => m.engagee > CIBLE_P10_MINUTES)
    .map((m) => m.engagee - CIBLE_P10_MINUTES)

  // ─── P11 — productions contredites par leur conservation ─────────────────
  // Quatre contradictions possibles, toutes lues sur du DÉCLARÉ :
  //   - produire un plat dont aucune durée de conservation n'est déclarée ;
  //   - poser une date de consommation au-delà de cette durée ;
  //   - donner une portion à un créneau postérieur à cette date ;
  //   - ouvrir un volet congélation sur un plat qui refuse la congélation,
  //     ou au-delà de sa durée congelée déclarée.
  const contradictionsConservation = semaines.flatMap(({ debut, plan }) => plan.slots
    .filter((slot) => slot.production)
    .flatMap((slot) => {
      const recipe = parCode.get(slot.recipeCode)
      const jours = productionShelfLifeDays(recipe)
      const production = slot.production
      const fautes = []
      if (jours == null) {
        fautes.push(`aucune durée de conservation déclarée pour ${slot.recipeCode}`)
      } else {
        const limite = addDays(production.availableFrom, jours)
        if (production.useBy > limite) {
          fautes.push(`useBy ${production.useBy} au-delà de la durée déclarée (${jours} j → ${limite})`)
        }
        for (const cle of production.consumerSlotKeys || []) {
          const date = String(cle).slice(0, 10)
          if (date > production.useBy) fautes.push(`portion réfrigérée servie le ${date}, après useBy ${production.useBy}`)
        }
      }
      const congelation = production.freezer
      if (congelation) {
        if (!isRecipeFreezable(recipe)) {
          fautes.push(`volet congélation sur ${slot.recipeCode}, qui ne déclare pas la congélation`)
        } else {
          const limite = addDays(production.availableFrom, freezerShelfLifeDays(recipe))
          if (congelation.useBy > limite) fautes.push(`useBy congélateur ${congelation.useBy} au-delà de ${limite}`)
          for (const cle of congelation.consumerSlotKeys || []) {
            const date = String(cle).slice(0, 10)
            if (date > congelation.useBy) fautes.push(`portion congelée servie le ${date}, après useBy ${congelation.useBy}`)
          }
        }
      }
      return fautes.map((faute) => ({ debut, creneau: slot.key, code: slot.recipeCode, faute }))
    }))

  // ─── P12 — bases partagées ───────────────────────────────────────────────
  const corpusAvecBase = recipes.filter(usesSharedBase).length
  const creneauxAvecBase = tousCreneaux.filter((slot) => slot.sharedBases?.codes?.length).length

  // ─── P13 — cuisines ──────────────────────────────────────────────────────
  const comptesCuisine = new Map()
  for (const slot of tousCreneaux) {
    const cuisine = classifications.get(slot).cuisine
    comptesCuisine.set(cuisine, (comptesCuisine.get(cuisine) || 0) + 1)
  }
  const cuisinesTriees = [...comptesCuisine.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  // Regroupement PROVISOIRE des libellés composites par préfixe. Ce n'est pas
  // une normalisation arbitrée : `data/recipes/arbitrations/cuisines.json`
  // (livrable 3.1) n'existe pas, et tant qu'il n'existe pas ce regroupement
  // reste une lecture mécanique du préfixe, signalée comme telle — « italie
  // cuisine domestique francaise » reste comptée en Italie.
  const ARBITRAGE_CUISINES = 'data/recipes/arbitrations/cuisines.json'
  const franceComposite = cuisinesTriees
    .filter(([libelle]) => libelle === 'france' || libelle.startsWith('france '))
    .reduce((total, [, compte]) => total + compte, 0)

  // ─── P14 — retour de goût ────────────────────────────────────────────────
  const appelantsFeedback = fichiersCitant('api/meals/feedback', ['app', 'components', 'lib'],
    ['app/api/meals/feedback/route.js'])

  // ─── P16 — temps de résolution ───────────────────────────────────────────
  const dureesMs = semaines.map(({ millisecondes }) => millisecondes)

  // ─── P17 / P18 — les deux critères ajoutés par le plan ───────────────────
  const MODULE_EXPORT = 'lib/domain/courses/exportListe.js'
  const sortiesExport = fichiersCitant('navigator.clipboard', ['app', 'components', 'lib'])
    .concat(fichiersCitant('navigator.share', ['app', 'components', 'lib']))
  const exportPresent = fichierPresent(MODULE_EXPORT) || sortiesExport.length > 0
  const CONTRAT_CHIFFRES = 'docs/CONTRAT_CHIFFRES.md'
  const contratPresent = fichierPresent(CONTRAT_CHIFFRES)

  // ─── Les dix-huit lignes ─────────────────────────────────────────────────
  const parSemaine = (values) => values.join(', ')
  // Une seule mise en forme, pour que la console de la CI et le fichier versionné
  // ne puissent pas diverger : c'est la même ligne, écrite deux fois.
  const rendre = (ligne) => `${ligne.id.padEnd(4)}· ${ligne.libelle} · mesuré : ${ligne.mesure} · cible : ${ligne.cible}`
  const lignes = [
    {
      id: 'P1',
      libelle: 'Plats distincts sur 14 créneaux, et reprises sur trois semaines',
      mesure: `${parSemaine(p1ParSemaine)} distincts par semaine ; ${distinctsSurTrois.size} distincts sur ${tousCreneaux.length} créneaux, `
        + `${reprisesTousCreneaux.length} plat(s) servi(s) plus d'une fois, dont ${reprisesInterSemaines.length} d'une semaine à l'autre`,
      cible: '≥ 12 par semaine, et 0 reprise sur trois semaines',
    },
    {
      id: 'P2',
      libelle: 'Part des créneaux sur pâtes, et féculent dominant',
      mesure: `pâtes ${patesTotal}/${tousCreneaux.length} = ${pct(patesTotal, tousCreneaux.length)} `
        + `(${parSemaine(semaines.map((s, i) => pct(patesParSemaine[i], s.plan.slots.length)))}) ; `
        + `féculent dominant par semaine : ${parSemaine(feculentDominantParSemaine
          .map((tete) => (tete ? `${tete.feculent} ${tete.compte}/${tete.creneaux} = ${pct(tete.compte, tete.creneaux)}` : 'aucun')))}`,
      cible: '≤ 15 % de pâtes, aucun féculent au-dessus de 25 %',
    },
    {
      id: 'P3',
      libelle: 'Part des repas dont la protéine principale est un laitier ou un œuf',
      mesure: `${somme(laitiersOeufsParSemaine)}/${tousCreneaux.length} = ${pct(somme(laitiersOeufsParSemaine), tousCreneaux.length)} `
        + `(${parSemaine(laitiersOeufsParSemaine.map((n, i) => `${n}/${semaines[i].plan.slots.length}`))})`,
      cible: '≤ 20 % — et ces deux familles sont aujourd\'hui exemptées du plafond de weeklyBalance.js',
    },
    {
      id: 'P4',
      libelle: 'Julien — jours à ≥ 85 % de sa cible protéique',
      mesure: `${parSemaine(p4ParSemaine.map((n, i) => `${n}/${julienParSemaine[i].length}`))} ; `
        + `protein_gate_relaxed ${parSemaine(relachesParSemaine.map((n, i) => `${n}/${julienParSemaine[i].length}`))} ; `
        + `cible lue : ${GOALS[0].target_protein_g} g déclarés — le calcul depuis le poids CIBLE est le livrable 1.3, il n'existe pas`,
      cible: '≥ 6 jours sur 7, contre une cible calculée depuis le poids cible',
    },
    {
      id: 'P5',
      libelle: 'Ratio de portion entre les deux assiettes d\'un même plat',
      mesure: `maxima ${parSemaine(ratiosParSemaine.map((ratios) => (ratios.length ? fr(Math.max(...ratios), 2) : 'aucun plat partagé')))} ; `
        + `moyennes ${parSemaine(ratiosParSemaine.map((ratios) => (ratios.length ? fr(moyenne(ratios), 2) : 'sans objet')))} `
        + `sur ${parSemaine(ratiosParSemaine.map((ratios) => String(ratios.length)))} plats partagés`,
      cible: '≤ 1,3',
    },
    {
      id: 'P6',
      libelle: 'Repas carnés de chacun sur la semaine',
      mesure: MEMBERS.map((member, rang) => `${member.name} `
        + parSemaine(carnesParMembre.map((membres) => `${membres[rang].carnes}/${membres[rang].total}`))).join(' ; ')
        + ' ; quota par personne (meat_meals_per_week) non déclaré dans le dépôt — livrable 1.1',
      cible: 'le quota déclaré de chacun ± 1 (§8 : Julien 4, Zoé 2 par défaut)',
    },
    {
      id: 'P7',
      libelle: 'Substitutions hors lignée quand un jumeau de même lignée existe',
      mesure: `${somme(horsLigneeParSemaine.map((liste) => liste.length))}/${somme(substitutionsParSemaine.map((liste) => liste.length))} `
        + `(${parSemaine(horsLigneeParSemaine.map((liste, index) => `${liste.length}/${substitutionsParSemaine[index].length}`))}) ; `
        + 'mesuré sur le chemin JSON du dépôt — la RPC opérationnelle ne publie pas derivedFrom, donc 0 lignée en production (§0.3)',
      cible: '0 hors lignée quand un jumeau existe',
    },
    {
      id: 'P8',
      libelle: 'Faux végétariens — servis, et origines non tranchées au corpus',
      mesure: `${p8} au total : ${fauxVegetariensServis.length} faux végétarien(s) parmi les ${swapsVegetariens.length} substitutions `
        + `végétariennes servies sur trois semaines (relues ingrédient requis par ingrédient requis, origines du catalogue), `
        + `${corpusOrigineInconnue.length} recette(s) du corpus portant une origine « inconnu » sur ${recipes.length} publiables ; `
        + `réserve rapportée, non exigée : ${optionnelsNonVegetariens.length} recette(s) végétarienne(s) à ingrédient carné FACULTATIF (livrable 3.6)`,
      cible: '0 — critère EXIGÉ par ce fichier',
    },
    {
      id: 'P9',
      libelle: 'Plats distincts à cuisiner pour le foyer',
      mesure: parSemaine(aCuisinerParSemaine.map((codes) => String(codes.size))),
      cible: '≤ 12',
    },
    {
      id: 'P10',
      libelle: 'Minutes de cuisine par semaine — préparation active engagée (définition retenue au §8)',
      mesure: `engagée ${parSemaine(minutesParSemaine.map((m) => String(m.engagee)))} ; `
        + `préparation active si tout est frais ${parSemaine(minutesParSemaine.map((m) => String(m.toutFrais)))} ; `
        + `préparation + cuisson, tout frais ${parSemaine(minutesParSemaine.map((m) => String(m.avecCuisson)))} ; `
        + `réchauffages non comptés dans la définition retenue ${parSemaine(minutesParSemaine.map((m) => String(m.rechauffages)))} ; `
        // Le verdict est CALCULÉ, jamais écrit en prose : le §8 du plan pose la
        // cible à 300 minutes en ajoutant « elle est tenue dès aujourd'hui »,
        // et le §2.3 du même plan mesure 325/340/320 — deux affirmations du
        // même document qui ne peuvent pas être vraies ensemble. Ce rapport
        // tranche par la mesure, refaite à chaque exécution, plutôt que de
        // recopier la phrase.
        + `verdict : ${semainesSousCible}/${minutesParSemaine.length} semaine(s) sous la cible de ${CIBLE_P10_MINUTES} min`
        + (semainesSousCible === minutesParSemaine.length
          ? ''
          : `, dépassement de ${Math.min(...depassementsP10)} à ${Math.max(...depassementsP10)} min`),
      cible: `≤ ${CIBLE_P10_MINUTES} minutes de préparation active engagée — cible refixée avec la définition (§8)`,
    },
    {
      id: 'P11',
      libelle: 'Productions dont la conservation déclarée contredit le plan',
      mesure: `${contradictionsConservation.length} sur ${tousCreneaux.filter((slot) => slot.production).length} production(s) planifiée(s)`,
      cible: '0 — critère EXIGÉ par ce fichier',
    },
    {
      id: 'P12',
      libelle: 'Plats liés à une base partagée',
      mesure: `${corpusAvecBase}/${recipes.length} recettes du corpus portent un ingredient.component ; `
        + `${creneauxAvecBase}/${tousCreneaux.length} créneaux en tirent parti`,
      cible: '≥ 120 plats liés, et ≥ 4 repas par semaine qui en profitent, mesurés sur le chemin base',
    },
    {
      id: 'P13',
      libelle: 'Cuisines distinctes sur trois semaines',
      mesure: `${cuisinesTriees.length} libellés bruts ; libellé le plus servi ${cuisinesTriees[0]?.[0] ?? 'aucun'} `
        + `${cuisinesTriees[0]?.[1] ?? 0}/${tousCreneaux.length} = ${pct(cuisinesTriees[0]?.[1] ?? 0, tousCreneaux.length)} ; `
        + `France en regroupant les libellés composites par préfixe ${franceComposite}/${tousCreneaux.length} = ${pct(franceComposite, tousCreneaux.length)} `
        + `— regroupement mécanique, ${ARBITRAGE_CUISINES} absent (livrable 3.1)`,
      cible: '≥ 8 cuisines, aucune au-dessus de 40 %, libellés composites normalisés par arbitrage relu',
    },
    {
      id: 'P14',
      libelle: 'Retour de goût atteignable depuis le planning',
      mesure: appelantsFeedback.length
        ? `oui — ${appelantsFeedback.length} appelant(s) de /api/meals/feedback : ${appelantsFeedback.join(', ')}`
        : 'non — 0 appelant de /api/meals/feedback dans app/, components/ et lib/ ; le comptage des lignes de meal_taste_feedback demande la base, hors de portée de la CI',
      cible: 'oui, et lu par la génération suivante',
    },
    {
      id: 'P15',
      libelle: 'Recettes servables ayant passé toutes les portes',
      mesure: `${servables.length} servables sur ${recipes.length} publiables et ${corpusEntier.length} recettes au corpus — chemin JSON du dépôt ; `
        + 'ce que la base qualifie et ce que la RPC rend ne se mesurent pas depuis la CI (§2.1)',
      cible: '3 000, sans qu\'aucune porte soit assouplie',
    },
    {
      id: 'P16',
      libelle: 'Temps de résolution d\'une semaine',
      mesure: `${parSemaine(dureesMs.map((ms) => `${fr(ms / 1000)} s`))} pour ${recipes.length} recettes `
        + `(≈ ${fr(moyenne(dureesMs) / recipes.length)} ms par recette) — dépend de la machine, un écart sur cette seule ligne n'est pas une régression`,
      cible: '≤ 10 s à 3 000 recettes',
    },
    {
      id: 'P17',
      libelle: 'La liste de courses sort de l\'application',
      mesure: exportPresent
        ? `à mesurer : ${MODULE_EXPORT} ou une sortie navigateur existe désormais (${sortiesExport.join(', ') || MODULE_EXPORT}) — ce rapport ne sait pas encore la vérifier`
        : `sans objet — ${MODULE_EXPORT} absent, et 0 occurrence de navigator.clipboard ou navigator.share dans app/, components/, lib/ (livrable 0a bis puis 3.5)`,
      cible: 'trois sorties testées contre nutrition_plan_shopping_items',
    },
    {
      id: 'P18',
      libelle: 'Un chiffre affiché est calculé ou absent',
      mesure: contratPresent
        ? `à mesurer : ${CONTRAT_CHIFFRES} existe désormais — ce rapport ne sait pas encore le vérifier`
        : `sans objet — ${CONTRAT_CHIFFRES} absent, aucun test de corpus ne porte le contrat des chiffres (livrable 3.6)`,
      cible: 'les mêmes macros par portion sur les trois écrans, aucun chiffre non calculable rendu comme un nombre',
    },
  ]

  // ─── Rapport écrit ───────────────────────────────────────────────────────
  // La sortie console de vitest se perd dans le reste de la suite. Le fichier,
  // lui, se relit et se compare d'une semaine à l'autre : c'est tout l'objet du
  // livrable. Aucune horodate n'y figure volontairement — un rapport daté
  // produirait un écart à chaque exécution et noierait les écarts réels.
  //
  // Une réserve, parce qu'elle est vérifiable : le fichier n'est PAS stable
  // d'une exécution à l'autre pour autant. La ligne P16 porte une durée
  // machine, donc `git diff` la signale à chaque passage de la suite. C'est
  // assumé — la même fonction `rendre` produit la console et le fichier, et les
  // faire diverger pour gagner un diff propre coûterait plus que le diff. Un
  // écart sur cette SEULE ligne n'est pas une régression ; un écart sur une
  // autre en est une.
  const texte = [
    'RAPPORT DE QUALITÉ — dix-huit chiffres, trois semaines consécutives',
    '',
    'Produit par tests/planning/rapportQualiteSemaine.test.js, régénéré à chaque exécution de la suite.',
    'Ce fichier RAPPORTE les dix-huit critères du §9.1 de docs/PLAN_FINIR_MYKO.md ; le test n\'en EXIGE que deux,',
    'P8 et P11, les seuls que le plan déclare déjà tenus. Les seize autres sont des mesures, pas des portes.',
    '',
    `Protocole : trois semaines consécutives (${DEBUTS.join(', ')}), historique cumulé, sans stock.`,
    `Paramètres de app/api/planning/generate-v3/route.js : faisceau ${BEAM_WIDTH}, `
      + `maxMinutesByMeal ${JSON.stringify(MAX_MINUTES_BY_MEAL)}, preferredActiveMinutes ${PREFERRED_ACTIVE_MINUTES},`,
    `cible par repas ${JSON.stringify(TARGET)}.`,
    `Foyer : ${GOALS.map((goal) => `${goal.person_name} ${goal.target_calories} kcal / ${goal.target_protein_g} g`).join(' ; ')}.`,
    `Corpus : ${corpusEntier.length} recettes, ${recipes.length} publiables, ${servables.length} servables (chemin JSON du dépôt).`,
    'Périmètre — ce que ce rapport NE fait PAS comme la route de production : il planifie sur les '
      + `${recipes.length} publiables, sans le filtre isMealSuitableRecipe (aucun des codes servis ici n'en serait écarté)`,
    'et sans l\'élagage selectPlanningRecipePool(maxCandidates: 400) du livrable 0a.4, qui ne présente au faisceau que 460 candidats.',
    'C\'est le protocole du §2.3 du plan, conservé pour que les dix-huit lignes restent comparables aux siennes :',
    'il mesure le moteur sur le corpus du dépôt, pas le vivier que la route lui présente.',
    '',
    '─── LES DIX-HUIT LIGNES ───',
    '',
    ...lignes.map(rendre),
    '',
    '─── ANNEXE : ce qui permet de contester un chiffre ───',
    ...semaines.flatMap(({ debut, plan, perso }) => [
      '',
      `Semaine du ${debut} — statut ${plan.status}`
        + `${(plan.issues || []).length ? ` — issues : ${(plan.issues || []).map((issue) => issue.code).join(', ')}` : ''}`,
      ...plan.slots.map((slot) => {
        const classification = classifications.get(slot)
        return `  ${slot.date} ${slot.mealType.padEnd(8)} ${String(slot.recipeCode).padEnd(12)} ${slot.source.padEnd(19)} `
          + `féculent ${String(classification.mainStarch ?? 'aucun').padEnd(14)} protéine ${String(classification.mainProtein).padEnd(14)} `
          + `cuisine ${classification.cuisine}${slot.production ? ` · production useBy ${slot.production.useBy} → ${(slot.production.consumerSlotKeys || []).join(', ') || 'aucun consommateur'}` : ''}`
      }),
      ...(platsPrincipaux(perso).filter((meal) => meal.variant_kind && meal.variant_kind !== 'household_base').length
        ? ['  substitutions :', ...platsPrincipaux(perso)
          .filter((meal) => meal.variant_kind && meal.variant_kind !== 'household_base')
          .map((meal) => `    ${meal.meal_date} ${meal.meal_type} ${meal.person_name} → ${meal.canonical_recipe_code} `
            + `(${meal.variant_kind}, ${meal.portion_details?.same_lineage === false ? 'HORS LIGNÉE' : 'même lignée'})`)]
        : ['  substitutions : aucune']),
      ...(contradictionsConservation.filter((faute) => faute.debut === debut).length
        ? ['  contradictions de conservation :', ...contradictionsConservation
          .filter((faute) => faute.debut === debut)
          .map((faute) => `    ${faute.creneau} ${faute.code} : ${faute.faute}`)]
        : []),
    ]),
    '',
  ].join('\n')

  mkdirSync(dirname(FICHIER_RAPPORT), { recursive: true })
  writeFileSync(FICHIER_RAPPORT, `${texte}`, 'utf8')

  it('imprime les dix-huit lignes P1 à P18, avec libellé, mesure et cible', () => {
    for (const ligne of lignes) {
      // eslint-disable-next-line no-console
      console.log(rendre(ligne))
    }
    expect(lignes.map((ligne) => ligne.id)).toEqual(
      Array.from({ length: 18 }, (_, index) => `P${index + 1}`),
    )
    for (const ligne of lignes) {
      expect(ligne.libelle, ligne.id).toBeTruthy()
      expect(ligne.mesure, ligne.id).toBeTruthy()
      expect(ligne.cible, ligne.id).toBeTruthy()
    }
  })

  it('écrit le rapport sous scripts/data/out/, régénéré à chaque exécution', () => {
    const relu = readFileSync(FICHIER_RAPPORT, 'utf8')
    for (const ligne of lignes) expect(relu, ligne.id).toContain(rendre(ligne))
  })

  it('P8 — aucun faux végétarien servi, aucune origine non tranchée au corpus', () => {
    // La première des deux régressions qu'on peut interdire aujourd'hui : C1.1
    // est fait, P8 vaut 0 sur les trois semaines ET sur tout le corpus. Un
    // retour au-dessus de zéro veut dire qu'un plat carné a été servi à qui
    // demandait moins de viande, ou qu'une forme est entrée au corpus sans
    // origine tranchée — les deux se corrigent, ni l'un ni l'autre ne se tolère.
    expect(fauxVegetariensServis.map((faute) => (
      `${faute.debut} ${faute.date} ${faute.repas} ${faute.personne} ${faute.code} : `
      + faute.fautes.map(({ nom, origine }) => `${nom} (${origine})`).join(', ')
    ))).toEqual([])
    expect(corpusOrigineInconnue).toEqual([])
    expect(p8).toBe(0)
  })

  it('P11 — aucune production contredite par sa conservation déclarée', () => {
    // La seconde : C1.2 est fait. Le pan bagnat de 24 h planifié sur trois
    // jours ne doit pas pouvoir revenir, et une production sans durée déclarée
    // ne doit pas pouvoir naître.
    expect(contradictionsConservation.map((faute) => `${faute.debut} ${faute.creneau} ${faute.code} : ${faute.faute}`))
      .toEqual([])
  })
})
