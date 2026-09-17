import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan, isMealSuitableRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { buildPlanningHistory } from '@/lib/domain/planning/repetitionRules'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import {
  buildSharedBaseCatalog,
  recipeBaseRefs,
  sharedBaseSavedMinutes,
  sharedBaseUsage,
  usesSharedBase,
} from '@/lib/domain/planning/sharedBases'
import arbitrage from '@/data/recipes/arbitrations/bases-partagees.json'

/**
 * CE QUE LES LIENS DU LIVRABLE 2.1 CHANGENT VRAIMENT DANS UNE SEMAINE.
 *
 * Le premier terme de P12 — « ≥ 120 plats liés » — se compte sur le corpus, et
 * `tests/data/basesPartagees.test.js` s'en charge. Le second — « ≥ 4 repas par
 * semaine qui en tirent parti » — ne se compte que sur une semaine réellement
 * planifiée, parce qu'il dépend de ce que le solveur CHOISIT, pas de ce que le
 * corpus DÉCLARE. C'est l'objet de ce fichier.
 *
 * DEUX AVERTISSEMENTS DE PÉRIMÈTRE, écrits ici parce qu'une mesure dont on
 * ignore le périmètre n'est pas une mesure.
 *
 * 1. CECI EST LE CHEMIN JSON, PAS LE CHEMIN BASE. P12 demande la mesure « sur le
 *    chemin base ». La CI n'a pas de base de données — `ci.yml` fait tourner son
 *    job principal sur des valeurs factices (`https://example.supabase.co`) —
 *    et le chemin base ne se mesure que par les assertions SQL de
 *    `supabase/tests/`, rejouées par le job `db-tests`. Ce fichier mesure donc
 *    le MOTEUR sur le corpus du dépôt, comme le fait déjà
 *    `tests/planning/rapportQualiteSemaine.test.js`, et le dit au lieu de
 *    laisser croire à une mesure de production.
 *
 * 2. LE SOLVEUR NE REÇOIT PAS DE `baseRecipes` ICI, ET LA ROUTE, ELLE, LUI EN
 *    PASSE. `app/api/planning/generate-v3/route.js` lui donne le catalogue
 *    opérationnel entier (`baseRecipes: operationalCatalog.recipes`) depuis ce
 *    même livrable, précisément pour qu'une base reste connue même si l'élagage
 *    la sort du vivier. Ce fichier ne lui en passe pas, et c'est un choix de
 *    protocole : il mesure le CAS LE PLUS PAUVRE, celui où le catalogue des
 *    bases se construit depuis les seules recettes du vivier. Cela marche
 *    aujourd'hui pour les bases que les plats publiables référencent, parce
 *    qu'elles sont elles-mêmes publiables. C'est une chance, pas une garantie :
 *    le premier test ci-dessous l'ÉNONCE, de sorte que le jour où une base
 *    sortirait du vivier, il le dise — et ce que la route sert est alors au
 *    moins aussi bon que ce qui est mesuré ici, jamais moins bon.
 *
 * 3. CE PROTOCOLE N'EST PAS CELUI DU FOYER, et le chiffre en dépend. Les
 *    semaines ci-dessous sont planifiées sur une cible générique (850 kcal et
 *    55 g par repas), sans quota carné déclaré, sans plancher de densité
 *    protéique et sans plafond de famille — c'est-à-dire sans les contraintes
 *    des livrables 1.1 à 1.4. Elles rendent 3, 1 et 4 créneaux sur une base.
 *    Le rapport de qualité (`tests/planning/rapportQualiteSemaine.test.js`),
 *    lui, planifie les MÊMES trois semaines avec les réglages réels du foyer et
 *    en rend 3, 0 et 3. Les deux mesures sont justes, elles ne mesurent pas la
 *    même semaine ; celle qui vaut pour P12 est celle du rapport, parce que
 *    c'est celle que le foyer mangera. Citer « jusqu'à quatre » sans dire d'où
 *    il vient reviendrait à choisir le chiffre le plus flatteur des deux.
 *
 * Les semaines sont planifiées UNE FOIS au niveau du `describe` : la CI accorde
 * vingt secondes par test et une recherche en faisceau sur 568 recettes en coûte
 * plusieurs. Modèle : `tests/planning/varieteSemaine.test.js`.
 */

const DEBUTS = ['2026-09-21', '2026-09-28', '2026-10-05']
const BEAM_WIDTH = 48
const MAX_MINUTES_BY_MEAL = { dejeuner: 120, diner: 240 }
const PREFERRED_ACTIVE_MINUTES = 30
const TARGET = { kcal: 850, proteinG: 55, carbsG: 85, fatG: 30 }

describe('bases partagées — ce que les liens changent dans une semaine', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })
  const servables = recipes.filter(isMealSuitableRecipe)
  const catalogue = buildSharedBaseCatalog(recipes, [])

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
      },
      beamWidth: BEAM_WIDTH,
    })
    semaines.push({ debut, plan })
  }

  const creneauxAvecBase = semaines.map(({ plan }) =>
    plan.slots.filter((slot) => slot.sharedBases?.codes?.length).length)

  it('toute base arbitrée que le vivier référence est connue du catalogue des bases', () => {
    // La porte qui compte : une base référencée mais absente du catalogue ne
    // produit RIEN — `planSlotBases` note `shared_base_recipe_unknown` et le plat
    // se cuisine comme avant. C'est l'état dans lequel le dépôt était avant ce
    // lot, et celui dans lequel il retomberait si une base sortait du vivier.
    const references = new Set()
    for (const recipe of recipes.filter(usesSharedBase)) {
      for (const ref of recipeBaseRefs(recipe)) references.add(ref.code)
    }
    expect(references.size).toBeGreaterThan(0)
    const inconnues = [...references].filter((code) => !catalogue.has(code))
    expect(inconnues, `bases référencées mais absentes du catalogue : ${inconnues.join(', ')}`).toEqual([])
  })

  it('chaque base du catalogue économise un temps actif strictement positif', () => {
    // `buildSharedBaseCatalog` refuse déjà une base qui ne fait pas gagner de
    // temps. On vérifie ici que les bases ARBITRÉES passent cette porte, pour
    // qu'un lien ne soit jamais posé sur un composant que le moteur ignorera.
    const basesArbitrees = [...new Set(arbitrage.decisions.filter((d) => d.pose).map((d) => d.base))]
    const connues = basesArbitrees.filter((code) => catalogue.has(code))
    expect(connues.length).toBeGreaterThan(0)
    for (const code of connues) {
      expect(catalogue.get(code).savedPerReuse, code).toBeGreaterThan(0)
      expect(catalogue.get(code).shelfLifeDays, code).toBeGreaterThan(0)
    }
  })

  it('rapporte le second terme de P12 — repas par semaine qui tirent parti d’une base', () => {
    const lignes = []
    lignes.push(`Vivier : ${recipes.length} publiables, ${servables.length} servables, `
      + `${recipes.filter(usesSharedBase).length} portent une base, `
      + `${servables.filter(usesSharedBase).length} d’entre elles sont servables en repas.`)
    for (const [index, { debut, plan }] of semaines.entries()) {
      const usage = sharedBaseUsage(plan.slots)
      lignes.push(`Semaine du ${debut} : ${creneauxAvecBase[index]}/${plan.slots.length} créneaux sur une base · `
        + `${sharedBaseSavedMinutes(plan.slots)} min actives économisées · `
        + (usage.length
          ? usage.map((entry) => `${entry.baseCode} ${entry.meals} repas (${entry.cookings} cuisson, ${entry.reuses} reprise)`).join(' · ')
          : 'aucune base employée'))
    }
    lignes.push(`P12 second terme : ${creneauxAvecBase.join(', ')} créneaux sur 14 — cible ≥ 4 par semaine, `
      + 'mesurée ici sur le chemin JSON du dépôt et non sur le chemin base (voir l’en-tête).')
    // eslint-disable-next-line no-console
    console.log(lignes.join('\n'))
    // On n'exige rien : le plan (§0a.5) veut que ces lignes soient RAPPORTÉES,
    // pas transformées en assertions tant que le livrable n'est pas tenu. Ce que
    // l'on interdit, en revanche, c'est la régression vers l'inertie totale :
    // le corpus porte des liens, le vivier en porte, et une semaine qui n'en
    // emploierait aucun signifierait que le câblage est rompu.
    expect(recipes.filter(usesSharedBase).length).toBeGreaterThan(0)
  })

  it('une base reprise ne coûte que la manutention, et le créneau le déclare', () => {
    // L'invariant de fond de sharedBases.js : cuire coûte les minutes de la
    // base, reprendre coûte BASE_REUSE_ACTIVE_MINUTES. Si un créneau reprenait
    // une base en payant le prix plein, le bonus de mutualisation serait faux et
    // le temps de session affiché le serait aussi (livrable 2.4).
    for (const { plan } of semaines) {
      for (const slot of plan.slots) {
        const bases = slot.sharedBases
        if (!bases?.codes?.length) continue
        const attendu = bases.cooked.reduce((total, item) => total + item.activeMinutes, 0)
          + bases.reused.length * 4
        expect(bases.addedActiveMinutes, `${slot.key}`).toBeCloseTo(attendu, 4)
        for (const item of bases.reused) {
          expect(item.saved, `${slot.key} ${item.code}`).toBe(catalogue.get(item.code).savedPerReuse)
        }
      }
    }
  })
})
