import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload } from '@/lib/domain/planning/canonicalPlanPayload'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { BATCH_PORTIONING_ACTIVE_MINUTES, buildCookingSessions } from '@/lib/domain/planning/cookingSessions'
import {
  CIBLE_PREPARATION_ACTIVE_ENGAGEE_MINUTES,
  DEFINITIONS_TEMPS,
  MINUTES_PORTIONNAGE_PAR_REPAS,
  MINUTES_RECHAUFFAGE,
  TYPES_TACHES_DE_CUISINE,
  blocTempsPublie,
  ecartAnnonceConstate,
  formatMinutes,
  minutesDeSession,
  tempsDeLaSemaine,
} from '@/lib/domain/planning/cookingTime'

/**
 * LE TEMPS DIT VRAI — livrable 2.4 de `docs/PLAN_FINIR_MYKO.md` (§5, phase 2).
 *
 * CE QUE CE FICHIER EXIGE, du critère d'acceptation : « le chiffre affiché est
 * la somme ; l'écart entre annoncé et constaté est consigné après chaque
 * session réelle » — et, décision du foyer au §8 : « on affiche LES TROIS
 * définitions du temps avec leur nom. Un seul chiffre affiché sans sa
 * définition est un chiffre faux. »
 *
 * QUATRE CHOSES S'Y VÉRIFIENT, et la troisième est celle qui compte :
 *   1. les trois définitions existent, portent un nom et une phrase, et une
 *      seule porte la cible du critère (≤ 300 min) ;
 *   2. une durée non déclarée rend la somme NULLE et nomme ce qui manque —
 *      jamais un total amputé présenté comme un total (§9.3 du plan) ;
 *   3. le chiffre d'une session est LA SOMME, au sens du moteur : les durées de
 *      ses tâches de cuisine PLUS le portionnage des repas couverts. C'est
 *      exactement `active_minutes_total` de `buildCookingSessions`, et ce test
 *      compare les deux — un écart entre l'écran et le moteur est le défaut
 *      même que ce livrable corrige ;
 *   4. l'écart annoncé/constaté se calcule et ne s'invente pas : sans
 *      chronomètre, il n'existe pas.
 *
 * CE QU'IL NE PROUVE PAS. Rien de la base : `public.cooking_session_times`
 * (migration 20260918120000) est appliquée par le pipeline, pas par ce test.
 * La route `app/api/planning/session-time/route.js` écrit dans cette table et
 * calcule l'écart avec la même fonction que celle vérifiée ici.
 */

const chemin = (relatif) => fileURLToPath(new URL(relatif, import.meta.url))

const plat = (code, family, form, overrides = {}) => ({
  code,
  family,
  category: 'plat principal',
  eligible: true,
  servings: 2,
  prepMinutes: 30,
  cookMinutes: 20,
  cuisineOrigin: 'France',
  allergens: [],
  identityLevel: 'named_traditional_dish',
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', scores: { richness: 2, acidic: 1, freshness: 1 }, target_textures: ['fondant'] },
  exactIngredients: [{ name: form, formNormalized: form, quantity: 100, unit: 'g', grams: 100, optional: false, category: 'legumes' }],
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 },
  nutritionCoverage: { pct: 100 },
  conservationProfile: { fridgeHours: 72, eatImmediately: false, freezable: null, freezerMonths: null, serveCold: null, source: 'parsed' },
  ...overrides,
})

describe('les trois définitions du temps, et leur nom', () => {
  it('sont trois, chacune avec son nom et sa phrase — une seule porte le critère', () => {
    expect(DEFINITIONS_TEMPS).toHaveLength(3)
    for (const definition of DEFINITIONS_TEMPS) {
      expect(definition.nom.length).toBeGreaterThan(3)
      expect(definition.definition.length).toBeGreaterThan(40)
    }
    const criteres = DEFINITIONS_TEMPS.filter((definition) => definition.critere)
    expect(criteres.map((definition) => definition.id)).toEqual(['preparation_active_engagee'])
    expect(criteres[0].cibleMax).toBe(CIBLE_PREPARATION_ACTIVE_ENGAGEE_MINUTES)
    expect(CIBLE_PREPARATION_ACTIVE_ENGAGEE_MINUTES).toBe(300)
  })

  it('reprend les minutes de réchauffage et de portionnage déclarées ailleurs, sans les redéfinir', () => {
    // Deux recopies, donc deux vérifications : une recopie non vérifiée dérive,
    // et le jour où elle dérive l'écran et le rapport ne parlent plus de la
    // même semaine. Même protocole que `presenceParPersonne.test.js`, qui relit
    // `supportLeftovers.js` pour ses parts d'énergie.
    expect(MINUTES_PORTIONNAGE_PAR_REPAS).toBe(BATCH_PORTIONING_ACTIVE_MINUTES)

    const payload = readFileSync(chemin('../../lib/domain/planning/canonicalPlanPayload.js'), 'utf8')
    const rechauffage = payload.match(/REHEAT_TASK_MINUTES\s*=\s*(\d+)/)
    expect(rechauffage, 'REHEAT_TASK_MINUTES introuvable dans canonicalPlanPayload.js').toBeTruthy()
    expect(Number(rechauffage[1])).toBe(MINUTES_RECHAUFFAGE)

    const rapport = readFileSync(chemin('./rapportQualiteSemaine.test.js'), 'utf8')
    const rapportRechauffage = rapport.match(/MINUTES_RECHAUFFAGE\s*=\s*(\d+)/)
    expect(rapportRechauffage, 'MINUTES_RECHAUFFAGE introuvable dans le rapport de qualité').toBeTruthy()
    expect(Number(rapportRechauffage[1])).toBe(MINUTES_RECHAUFFAGE)
  })

  it('calcule les mêmes quatre quantités que la ligne P10 du rapport de qualité', () => {
    // Le rapport (livrable 0a.5) mesure P10 avec quatre grandeurs : engagée,
    // tout frais, avec cuisson, et les réchauffages comptés À PART. Ce module
    // ne redéfinit rien — il rend ce calcul disponible à l'écran. Si le rapport
    // change de définition, ce test échoue et l'écran doit suivre : deux
    // chiffres pour la même semaine en font un faux.
    const rapport = readFileSync(chemin('./rapportQualiteSemaine.test.js'), 'utf8')
    for (const cle of ['engagee:', 'toutFrais:', 'avecCuisson:', 'rechauffages:']) {
      expect(rapport, `la ligne P10 du rapport ne calcule plus ${cle}`).toContain(cle)
    }
    // Et la définition retenue y est bien la préparation active ENGAGÉE.
    expect(rapport).toContain('CIBLE_P10_MINUTES = 300')
  })
})

describe('un temps affiché est une somme de temps déclarés, ou il est absent', () => {
  const recipeByCode = new Map([
    ['A', plat('A', 'Gratin', 'courgette cuite')],                                   // 30 prep, 20 cuisson
    ['B', plat('B', 'Tian', 'tomate cuite', { prepMinutes: 15, cookMinutes: 45 })],
    ['C', plat('C', 'Salade', 'lentilles cuites', { prepMinutes: 10, cookMinutes: 0 })],
  ])
  const slots = [
    { key: 's1', recipeCode: 'A', source: 'fresh' },
    { key: 's2', recipeCode: 'A', source: 'planned_production' },
    { key: 's3', recipeCode: 'B', source: 'fresh' },
    { key: 's4', recipeCode: 'C', source: 'cooked_dish' },
  ]

  it('additionne ce qui est cuisiné pour la définition retenue, et tout pour les deux autres', () => {
    const temps = tempsDeLaSemaine({ slots, recipeByCode })
    // Engagée : A (30) + B (15). Le créneau servi depuis une production et
    // celui servi depuis un reste ne sont pas recuisinés.
    expect(temps.minutes.preparation_active_engagee).toBe(45)
    // Tout frais : les quatre créneaux, 30 + 30 + 15 + 10.
    expect(temps.minutes.preparation_active_tout_frais).toBe(85)
    // Avec cuisson : 85 + (20 + 20 + 45 + 0).
    expect(temps.minutes.preparation_plus_cuisson).toBe(170)
    // Les réchauffages sont comptés À PART, jamais versés dans « engagée » :
    // les y ajouter changerait le critère sans le dire.
    expect(temps.rechauffages).toEqual({ creneaux: 2, minutes: 2 * MINUTES_RECHAUFFAGE })
    expect(temps.complet).toBe(true)
  })

  it('rend NULL et nomme ce qui manque dès qu’une durée n’est pas déclarée', () => {
    const incomplet = new Map(recipeByCode)
    incomplet.set('B', { ...recipeByCode.get('B'), prepMinutes: null })
    const temps = tempsDeLaSemaine({ slots, recipeByCode: incomplet })
    expect(temps.minutes.preparation_active_engagee).toBeNull()
    expect(temps.minutes.preparation_active_tout_frais).toBeNull()
    expect(temps.minutes.preparation_plus_cuisson).toBeNull()
    expect(temps.manquants).toEqual([{ slot_key: 's3', recipe_code: 'B', champ: 'prepMinutes' }])
    expect(temps.complet).toBe(false)
  })

  it('distingue une recette inconnue d’une durée nulle', () => {
    const temps = tempsDeLaSemaine({
      slots: [{ key: 's9', recipeCode: 'INCONNU', source: 'fresh' }],
      recipeByCode,
    })
    expect(temps.minutes.preparation_active_engagee).toBeNull()
    expect(temps.manquants).toEqual([{ slot_key: 's9', recipe_code: 'INCONNU', champ: 'recette' }])
  })

  it('une préparation de zéro minute est une déclaration, pas une absence', () => {
    const zero = new Map([['Z', plat('Z', 'Tartare', 'tomate crue', { prepMinutes: 0, cookMinutes: 0 })]])
    const temps = tempsDeLaSemaine({ slots: [{ key: 's1', recipeCode: 'Z', source: 'fresh' }], recipeByCode: zero })
    expect(temps.minutes.preparation_active_engagee).toBe(0)
    expect(temps.complet).toBe(true)
  })
})

describe('le chiffre d’une session est la somme du moteur, pas une part de la somme', () => {
  // Deux jours, une production du lundi midi qui nourrit le mardi soir : le
  // plan a donc une tâche « Préparer », une tâche « Réchauffer » et un repas
  // couvert à portionner. Le plan est calculé UNE fois.
  const corpus = [
    plat('FR-GRA', 'Gratin de courgettes', 'courgette cuite'),
    plat('FR-SAL', 'Salade de lentilles', 'lentilles cuites'),
    plat('FR-TOM', 'Tian de tomates', 'tomate cuite'),
  ]
  const slots = [
    { key: '2026-07-20-dejeuner', date: '2026-07-20', mealType: 'dejeuner' },
    { key: '2026-07-20-diner', date: '2026-07-20', mealType: 'diner' },
    { key: '2026-07-21-dejeuner', date: '2026-07-21', mealType: 'dejeuner' },
    { key: '2026-07-21-diner', date: '2026-07-21', mealType: 'diner' },
  ]
  const members = [{ name: 'A', portion_multiplier: 1 }, { name: 'B', portion_multiplier: 1 }]
  const plan = generateClosedLoopPlan({ slots, recipes: corpus, constraints: { allowShopping: true } })
  const payload = buildCanonicalPlanPayload({
    plan, recipes: corpus, windowStart: '2026-07-20', members, constraints: {}, inventoryLots: [],
  })
  const sessionsDuMoteur = buildCookingSessions({
    slots: payload.slots, tasks: payload.tasks, productions: payload.productions || [],
  })

  it('ce plan contient bien une production et une session — sinon la mesure suivante ne dirait rien', () => {
    expect((payload.productions || []).length).toBeGreaterThan(0)
    expect(sessionsDuMoteur.length).toBeGreaterThan(0)
  })

  it('la somme de l’écran est celle du moteur, portionnage compris', () => {
    for (const session of sessionsDuMoteur) {
      const taches = payload.tasks.filter((task) => session.task_keys.includes(task.task_key))
      // Repas couverts par les productions cuites dans cette session : une
      // portion à mettre en barquette, étiqueter et ranger par repas — c'est
      // la définition de `consumerMeals` dans cookingSessions.js.
      const repasCouverts = (payload.productions || [])
        .filter((production) => session.task_keys.includes(production.task_key))
        .reduce((somme, production) => {
          const couverts = payload.slots.filter((slot) => slot.production_key === production.production_key).length
          return somme + Math.max(0, couverts - (production.storage_method === 'refrigerator' ? 1 : 0))
        }, 0)
      const ecran = minutesDeSession({ tasks: taches, repasCouverts })
      expect(ecran.minutes, session.session_key).toBe(session.active_minutes_total)
      // Et la somme est DÉCOMPOSABLE : un total qu'on ne peut pas décomposer
      // est un total qu'on ne peut pas contester.
      expect(ecran.lignes.reduce((somme, ligne) => somme + ligne.minutes, 0)).toBe(ecran.minutes)
    }
  })

  it('compte le portionnage, que l’ancien affichage oubliait', () => {
    // La page « jour de cuisine » n'additionnait que les tâches « Préparer » :
    // son chiffre était donc, structurellement, plus petit que le temps
    // modélisé par le moteur. On vérifie ici que l'écart existait bien et qu'il
    // est comblé — sans quoi ce livrable n'aurait corrigé qu'une intention.
    const session = sessionsDuMoteur[0]
    const taches = payload.tasks.filter((task) => session.task_keys.includes(task.task_key))
    const sommeDesTachesSeules = taches
      .filter((task) => TYPES_TACHES_DE_CUISINE.includes(task.task_type))
      .reduce((somme, task) => somme + Number(task.duration_min || 0), 0)
    const avecPortionnage = minutesDeSession({ tasks: taches, repasCouverts: 1 })
    expect(avecPortionnage.minutes).toBe(sommeDesTachesSeules + MINUTES_PORTIONNAGE_PAR_REPAS)
  })

  it('refuse un total quand une tâche n’a pas de durée', () => {
    const taches = [
      { task_type: 'prepare_recipe', duration_min: 30, task: 'Préparer' },
      { task_type: 'prepare_recipe', duration_min: null, task: 'Préparer', stable_key: 'sans-duree' },
    ]
    const ecran = minutesDeSession({ tasks: taches, repasCouverts: 0 })
    expect(ecran.minutes).toBeNull()
    expect(ecran.manquants).toEqual([{ task_key: 'sans-duree', champ: 'duration_min' }])
  })

  it('publie les trois temps avec le plan, en nombres et sans prose', () => {
    const publie = payload.validation_summary.cooking_time
    const attendu = blocTempsPublie({ slots: plan.slots, recipeByCode: new Map(corpus.map((r) => [r.code, r])) })
    expect(publie).toEqual(attendu)
    expect(publie.cible_preparation_active_engagee).toBe(CIBLE_PREPARATION_ACTIVE_ENGAGEE_MINUTES)
    expect(publie.manquants).toEqual([])
    // Le texte des définitions n'est PAS publié : il vit dans le code et
    // l'écran l'y lit par identifiant. Une formulation peut ainsi être reprise
    // sans republier une semaine.
    expect(JSON.stringify(publie)).not.toContain('définition')
    for (const definition of DEFINITIONS_TEMPS) {
      expect(publie).toHaveProperty(definition.id)
    }
  })
})

describe('l’écart entre annoncé et constaté', () => {
  it('n’existe pas tant que personne n’a chronométré', () => {
    expect(ecartAnnonceConstate({ annonce: 120, constate: null })).toBeNull()
    expect(ecartAnnonceConstate({ annonce: null, constate: 336 })).toBeNull()
    expect(ecartAnnonceConstate({})).toBeNull()
  })

  it('mesure la plainte nº 1 du marché : « 2 h annoncées, j’ai chronométré, 5 h 36 »', () => {
    const ecart = ecartAnnonceConstate({ annonce: 120, constate: 336 })
    expect(ecart).toEqual({ annonce: 120, constate: 336, minutes: 216, facteur: 2.8 })
    expect(formatMinutes(336)).toBe('5 h 36')
    expect(formatMinutes(120)).toBe('2 h')
    expect(formatMinutes(45)).toBe('45 min')
    expect(formatMinutes(null)).toBeNull()
  })

  it('ne divise pas par une annonce nulle pour faire joli', () => {
    expect(ecartAnnonceConstate({ annonce: 0, constate: 25 })).toEqual({
      annonce: 0, constate: 25, minutes: 25, facteur: null,
    })
  })
})

describe('ce que l’écran « jour de cuisine » affiche', () => {
  // Lecture de source, même protocole que `presenceParPersonne.test.js` avec
  // `supportLeftovers.js` : on ne rend pas de composant React dans cette suite,
  // mais on peut vérifier qu'une règle d'affichage n'a pas été défaite.
  const page = readFileSync(chemin('../../app/planning/[importId]/batch/page.js'), 'utf8')

  it('n’affiche plus un temps sans sa définition', () => {
    // « 75 min actives » ne disait pas si la cuisson était comptée, ni si le
    // portionnage l'était. Le libellé porte maintenant le nom de la définition.
    expect(page).not.toContain('min actives')
    expect(page).toContain('min de préparation active engagée')
    expect(page).toContain('DEFINITIONS_TEMPS')
  })

  it('n’affiche plus un temps précédé d’un « ≈ »', () => {
    // Le chemin legacy affichait « ≈ 45 min » : le signe était l'aveu qu'on
    // montrait une estimation. La somme est désormais exacte ou absente. On
    // vise la forme AFFICHÉE (un « ≈ » collé à une interpolation JSX) et non le
    // caractère lui-même, qu'un commentaire a le droit de citer.
    expect(page).not.toMatch(/≈\s*\{/)
  })

  it('affiche les trois définitions, et la cible de celle qui porte le critère', () => {
    expect(page).toContain('Le temps de cette semaine')
    expect(page).toContain('definition.nom')
    expect(page).toContain('definition.definition')
    expect(page).toContain('Cible du foyer')
    // Un temps non calculable se dit, il ne s'affiche pas en zéro.
    expect(page).toContain('non calculé')
  })

  it('propose de consigner le temps réel, et montre l’écart une fois consigné', () => {
    expect(page).toContain('Combien de temps cela a-t-il pris ?')
    expect(page).toContain('/api/planning/session-time')
    expect(page).toContain('ecartAnnonceConstate')
  })
})
