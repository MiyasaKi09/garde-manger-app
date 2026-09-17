import { describe, expect, it } from 'vitest'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import {
  BASES_PAR_SESSION_DECLAREE,
  CONSOMMATEURS_PAR_PRODUCTION_SANS_CAPACITE,
  PRODUCTIONS_PAR_PLAN_SANS_CAPACITE,
  PRODUCTIONS_PAR_SESSION_DECLAREE,
  buildHouseholdCookingCapacity,
  isoWeekday,
  resolveCookingCapacity,
} from '@/lib/domain/planning/cookingCapacity'

/**
 * LA CAPACITÉ DE CUISINE LUE — livrable 2.2 de `docs/PLAN_FINIR_MYKO.md`
 * (§5, phase 2 ; C4.2 du plan de septembre).
 *
 * CE QUE CE FICHIER EXIGE, mot pour mot du critère d'acceptation : « un soir
 * déclaré "rapide" ne porte AUCUNE production ; une session déclarée porte 2-3
 * productions + 2 bases ». Et une exigence de plus, qui n'est pas dans le
 * critère mais sans laquelle le livrable serait un risque : un foyer qui n'a
 * RIEN déclaré obtient exactement le plan d'avant.
 *
 * DEUX MESURES QU'IL FAUT LIRE AVANT LES ASSERTIONS, parce qu'elles bornent ce
 * qu'on peut exiger et qu'aucune des deux n'est un choix de ce livrable :
 *
 *   — LA GRILLE COMPTE DEUX REPAS PAR JOUR (`buildWeekSlots` : déjeuner et
 *     dîner, quatorze créneaux). Une production naît sur un créneau
 *     PRODUCTEUR ; un jour n'a donc que deux créneaux capables d'en porter
 *     une. Le plafond déclaré vaut trois — c'est ce que dit le critère — mais
 *     une journée réelle en porte au plus DEUX, et ce test ne fabrique pas un
 *     troisième créneau pour faire joli. Le plafond est vérifié sur la borne
 *     (`maxProductionsPerSession`), le comptage sur ce que la grille permet.
 *
 *   — « SESSION » VEUT DIRE JOUR DE CUISINE DÉCLARÉ, pas la session horaire du
 *     moteur. `cookingSessions.js` groupe les tâches par (jour, fenêtre) —
 *     matin, après-midi, soir — pour son plafond de MINUTES ; le questionnaire,
 *     lui, demande des JOURS (« quels jours avez-vous le temps de cuisiner ? »).
 *     Les deux notions coexistent sans se contredire : la capacité borne le
 *     jour, le budget de minutes borne la fenêtre.
 *
 * LE PROTOCOLE. Les cinq plans du second bloc sont calculés UNE fois au
 * niveau du `describe` (modèle `tests/planning/varieteSemaine.test.js`, imposé
 * par les vingt secondes par test de la CI). Le corpus est SYNTHÉTIQUE et
 * volontairement minimal : on mesure ce que la capacité déclarée change, pas ce
 * que le corpus du dépôt propose. Les cinq plans partagent la même grille et
 * le même corpus ; le seul écart entre eux est la déclaration.
 */

// ─── Corpus synthétique ─────────────────────────────────────────────────────
// Même forme que `tests/planning/plannedProductions.test.js` : une recette qui
// se garde 72 h, mijotée, préparée en trente minutes — donc candidate à la
// production (`isBatchCandidate`) et gagnante à la mutualisation (30 min de
// préparation contre 10 de réchauffage).
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

const FORMES = [
  'courgette cuite', 'aubergine cuite', 'poireau cuit', 'carotte cuite',
  'brocoli cuit', 'epinard cuit', 'haricot vert cuit', 'chou fleur cuit',
  'potiron cuit', 'fenouil cuit', 'celeri cuit', 'panais cuit',
  'navet cuit', 'betterave cuite', 'poivron cuit', 'tomate cuite',
  'artichaut cuit', 'endive cuite', 'salsifis cuit', 'topinambour cuit',
]
const CORPUS = FORMES.map((forme, index) => plat(`FR-${String(index + 1).padStart(3, '0')}`, `Gratin de ${forme}`, forme))

// Du stock pour tout le monde : sans lui, la couverture stock vaut zéro
// partout et la comparaison entre plans porterait sur le bruit des achats.
const LOTS = FORMES.map((forme, index) => ({
  id: `lot-${index}`, formNormalized: forme, gramsAvailable: 1200, expiresOn: '2026-10-15',
}))

// Lundi 21 septembre 2026 → dimanche 27. Même fenêtre que le rapport de
// qualité (`rapportQualiteSemaine.test.js`), pour que les dates se comparent.
const DEBUT = '2026-09-21'
const LUNDI = '2026-09-21'
const MARDI = '2026-09-22'
const SLOTS = buildWeekSlots(DEBUT)
const CONTRAINTES = { allowShopping: true }

const membre = (id, name, planning) => ({ id, name, active: true, preferences: { planning } })
const datesFenetre = [...new Set(SLOTS.map((slot) => slot.date))]
const capaciteDe = (members, presence = []) => buildHouseholdCookingCapacity({ members, presence, dates: datesFenetre })

const planifier = (cookingCapacity) => generateClosedLoopPlan({
  slots: SLOTS,
  recipes: CORPUS,
  inventoryLots: LOTS,
  constraints: { ...CONTRAINTES, ...(cookingCapacity ? { cookingCapacity } : {}) },
})

const productionsParDate = (plan) => {
  const compte = new Map()
  for (const slot of plan.slots) {
    if (!slot.production) continue
    compte.set(slot.date, (compte.get(slot.date) || 0) + 1)
  }
  return compte
}

describe('la capacité déclarée, avant tout moteur', () => {
  it('lit les jours ISO en UTC, comme toute date du dépôt', () => {
    // Piège n°4 du CLAUDE.md : une date lue dans le fuseau du serveur décale
    // d'un jour et déplacerait une session entière.
    expect(isoWeekday('2026-09-21')).toBe(1)
    expect(isoWeekday('2026-09-27')).toBe(7)
    expect(isoWeekday('pas une date')).toBeNull()
  })

  it('ne déclare RIEN quand personne n’a répondu — et rend les bornes d’avant', () => {
    const capacite = capaciteDe([membre('j', 'Julien', {}), membre('z', 'Zoé', { breakfast: true })])
    expect(capacite.declared).toBe(false)
    expect(capacite.sessionDates).toEqual([])
    expect(capacite.quickDates).toEqual([])
    expect(capacite.maxPlanProductions).toBe(PRODUCTIONS_PAR_PLAN_SANS_CAPACITE)

    const resolue = resolveCookingCapacity(capacite, SLOTS)
    expect(resolue.maxPlanProductions).toBe(PRODUCTIONS_PAR_PLAN_SANS_CAPACITE)
    expect(resolue.maxProductionConsumers).toBe(CONSOMMATEURS_PAR_PRODUCTION_SANS_CAPACITE)
    expect(resolue.allowsProductionOn(LUNDI)).toBe(true)
    expect(resolue.allowsCookingBaseOn(LUNDI)).toBe(true)
    expect(resolue.productionHorizon(LUNDI)).toBeNull()
  })

  it('une liste vide n’est pas « aucun jour » : elle est « aucune contrainte »', () => {
    // `memberPlanningRules.js` le dit de ses deux listes. L'inverser ferait
    // dire à un foyer silencieux qu'il ne cuisine jamais.
    const capacite = capaciteDe([membre('j', 'Julien', { cooking_days: [], quick_days: [] })])
    expect(capacite.declared).toBe(false)
    expect(resolveCookingCapacity(capacite, SLOTS).maxPlanProductions).toBe(PRODUCTIONS_PAR_PLAN_SANS_CAPACITE)
  })

  it('additionne les disponibilités : la capacité du foyer est l’union de celles de ses membres présents', () => {
    const capacite = capaciteDe([
      membre('j', 'Julien', { cooking_days: [1] }),
      membre('z', 'Zoé', { cooking_days: [6] }),
    ])
    expect(capacite.sessionDates).toEqual([LUNDI, '2026-09-26'])
    expect(capacite.sessionsDeclared).toBe(true)
    // Deux sessions × trois productions : la borne du plan est une conséquence,
    // plus une constante.
    expect(capacite.maxPlanProductions).toBe(2 * PRODUCTIONS_PAR_SESSION_DECLAREE)
    expect(capacite.maxBasesPerSession).toBe(BASES_PAR_SESSION_DECLAREE)
  })

  it('ne compte pas la disponibilité de quelqu’un qui n’est pas là ce jour-là', () => {
    // Livrable 1.5 : Zoé ne prend aucune de ses prises à la maison le lundi.
    // Sa disponibilité déclarée ce jour-là ne vaut donc pas pour le foyer.
    // Les TROIS prises sont déclarées, parce que ce sont les trois que ses
    // réglages lui donnent (`expectedMealTypesForMember` : déjeuner, dîner et
    // collation, le petit-déjeuner étant à activer). En oublier une reviendrait
    // à la dire présente — c'est exactement la règle qu'on veut : une personne
    // qui passe à la maison pour une seule prise est là, et peut cuisiner.
    const absenteLundi = [
      { household_member_id: 'z', meal_date: LUNDI, meal_type: 'dejeuner', present: false },
      { household_member_id: 'z', meal_date: LUNDI, meal_type: 'collation', present: false },
      { household_member_id: 'z', meal_date: LUNDI, meal_type: 'diner', present: false },
    ]
    const membres = [membre('j', 'Julien', {}), membre('z', 'Zoé', { cooking_days: [1] })]
    expect(capaciteDe(membres).sessionDates).toEqual([LUNDI])
    expect(capaciteDe(membres, absenteLundi).sessionDates).toEqual([])

    // Absente au seul déjeuner : elle est là le soir, elle compte.
    const absenteAMidi = [{ household_member_id: 'z', meal_date: LUNDI, meal_type: 'dejeuner', present: false }]
    expect(capaciteDe(membres, absenteAMidi).sessionDates).toEqual([LUNDI])
  })

  it('tranche un jour déclaré des deux côtés pour le refus, et LE DIT', () => {
    const capacite = capaciteDe([
      membre('j', 'Julien', { cooking_days: [1] }),
      membre('z', 'Zoé', { quick_days: [1] }),
    ])
    expect(capacite.sessionDates).toEqual([])
    expect(capacite.quickDates).toEqual([LUNDI])
    expect(capacite.conflicts).toEqual([{
      date: LUNDI, sessionMembers: ['Julien'], quickMembers: ['Zoé'], resolution: 'rapide_prime',
    }])
  })

  it('dit quelles sessions déclarées ne peuvent RIEN produire, au lieu de rendre zéro en silence', () => {
    // MESURE du 17 septembre 2026, corpus du dépôt, trois semaines : avec
    // `cooking_days: [7]` — « session de cuisine le dimanche », le rythme que
    // le §8 du plan décrit pour ce foyer — la semaine publie ZÉRO production au
    // lieu de deux. Cause : une production nourrit des créneaux ULTÉRIEURS, et
    // le dimanche est le dernier jour de la fenêtre lundi → dimanche. Ce n'est
    // pas une dégradation (0 créneau en revue sur 42) ; c'est la conséquence
    // exacte de la déclaration. Elle doit se LIRE : une capacité déclarée qui
    // ne produit rien sans qu'on dise pourquoi est une déclaration perdue.
    const dimanche = resolveCookingCapacity(capaciteDe([membre('j', 'Julien', { cooking_days: [7] })]), SLOTS)
    expect(dimanche.sessionsWithoutLaterSlot).toEqual(['2026-09-27'])
    const lundi = resolveCookingCapacity(capaciteDe([membre('j', 'Julien', { cooking_days: [1] })]), SLOTS)
    expect(lundi.sessionsWithoutLaterSlot).toEqual([])
  })

  it('borne les consommateurs par la PROCHAINE session, pas par une constante', () => {
    const capacite = capaciteDe([membre('j', 'Julien', { cooking_days: [1, 4] })])
    const resolue = resolveCookingCapacity(capacite, SLOTS)
    // Une production du lundi nourrit jusqu'au jeudi exclu : on recuisine ce
    // jour-là, il n'y a aucune raison de faire durer les portions au-delà.
    expect(resolue.productionHorizon(LUNDI)).toBe('2026-09-24')
    expect(resolue.productionHorizon('2026-09-24')).toBeNull()
    expect(resolue.allowsProductionOn(LUNDI)).toBe(true)
    expect(resolue.allowsProductionOn(MARDI)).toBe(false)
  })
})

describe('ce que le moteur fait de la capacité déclarée', () => {
  // Quatre plans, calculés UNE fois. Même grille, même corpus, même stock : le
  // seul écart est la déclaration passée en contrainte.
  const sansRien = planifier(null)
  const sansDeclaration = planifier(capaciteDe([membre('j', 'Julien', {}), membre('z', 'Zoé', {})]))
  const lundiRapide = planifier(capaciteDe([membre('j', 'Julien', { quick_days: [1] })]))
  const lundiSession = planifier(capaciteDe([membre('j', 'Julien', { cooking_days: [1] })]))
  const deuxSessions = planifier(capaciteDe([
    membre('j', 'Julien', { cooking_days: [1] }),
    membre('z', 'Zoé', { cooking_days: [4] }),
  ]))

  it('rend une semaine complète dans les cinq cas, et aucune n’est dégradée', () => {
    for (const plan of [sansRien, sansDeclaration, lundiRapide, lundiSession, deuxSessions]) {
      expect(plan.slots).toHaveLength(SLOTS.length)
      // Aucune des déclarations ne doit forcer la cascade de répétition à
      // céder : une capacité déclarée borne le batch, elle ne rend pas la
      // semaine infaisable. C'est la parade au risque nommé au §5 du plan.
      const cascade = (plan.issues || []).map((issue) => issue.code)
      expect(cascade).not.toContain('repetition_rules_softened')
      expect(cascade).not.toContain('repetition_rules_relaxed')
    }
  })

  it('RIEN DE DÉCLARÉ = RIEN DE CHANGÉ : le plan est identique, octet pour octet', () => {
    // La garde de ce livrable. Un foyer qui n'a pas répondu au questionnaire
    // ne doit pas voir sa semaine bouger d'un caractère.
    expect(JSON.stringify(sansDeclaration)).toBe(JSON.stringify(sansRien))
    expect(sansRien.capacity).toBeUndefined()
    expect(sansDeclaration.capacity).toBeUndefined()
  })

  it('le plan sans déclaration porte bien des productions — sans quoi les deux mesures suivantes ne diraient rien', () => {
    // Témoin. Si ce corpus ne produisait rien, « aucune production le lundi »
    // serait vrai pour une raison qui n'a rien à voir avec la déclaration.
    const total = sansRien.slots.filter((slot) => slot.production).length
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThanOrEqual(PRODUCTIONS_PAR_PLAN_SANS_CAPACITE)
    expect(productionsParDate(sansRien).get(LUNDI)).toBeGreaterThan(0)
  })

  it('UN SOIR DÉCLARÉ RAPIDE NE PORTE AUCUNE PRODUCTION', () => {
    // Le critère d'acceptation, mesuré sur la date déclarée et sur elle seule.
    expect(productionsParDate(lundiRapide).get(LUNDI)).toBeUndefined()
    expect(lundiRapide.capacity.quickDates).toEqual([LUNDI])
    // Et il n'a pas non plus perdu son repas : le créneau existe, il est
    // simplement cuisiné frais ou servi depuis une production d'un autre jour.
    const creneauxDuLundi = lundiRapide.slots.filter((slot) => slot.date === LUNDI)
    expect(creneauxDuLundi).toHaveLength(2)
    for (const creneau of creneauxDuLundi) expect(creneau.recipeCode).toBeTruthy()
  })

  it('UNE SESSION DÉCLARÉE PORTE LES PRODUCTIONS DE LA SEMAINE, et rien ne se produit ailleurs', () => {
    const parDate = productionsParDate(lundiSession)
    const total = [...parDate.values()].reduce((somme, compte) => somme + compte, 0)
    expect(total).toBeGreaterThanOrEqual(2)
    expect(parDate.get(LUNDI)).toBe(total)
    // Le plafond DÉCLARÉ est de trois par session ; la grille n'offre que deux
    // créneaux producteurs par jour, et ce test ne fabrique pas le troisième.
    expect(lundiSession.capacity.maxProductionsPerSession).toBe(PRODUCTIONS_PAR_SESSION_DECLAREE)
    expect(lundiSession.capacity.maxPlanProductions).toBe(PRODUCTIONS_PAR_SESSION_DECLAREE)
    expect(total).toBeLessThanOrEqual(lundiSession.capacity.maxProductionsPerSession)
    expect(lundiSession.capacity.productionsPlanned).toBe(total)
    // La borne d'avant en portait deux pour TOUTE la semaine, réparties au
    // hasard des créneaux. C'est bien la déclaration qui a déplacé la semaine.
    expect(total).toBeGreaterThan(sansRien.slots.filter((slot) => slot.production).length - 1)
  })

  it('DEUX sessions déclarées portent deux fois plus de productions que la constante d’avant', () => {
    // C'est ici que « borne = conséquence » se voit le mieux : la constante
    // valait 2 pour la semaine entière, quoi que le foyer ait déclaré. Deux
    // jours de cuisine déclarés en autorisent 6 (2 × 3), et la grille en place
    // 4 — deux par jour de session, ses deux créneaux producteurs.
    const parDate = productionsParDate(deuxSessions)
    const total = [...parDate.values()].reduce((somme, compte) => somme + compte, 0)
    expect(deuxSessions.capacity.sessionDates).toEqual([LUNDI, '2026-09-24'])
    expect(deuxSessions.capacity.maxPlanProductions).toBe(2 * PRODUCTIONS_PAR_SESSION_DECLAREE)
    expect(total).toBeGreaterThan(PRODUCTIONS_PAR_PLAN_SANS_CAPACITE)
    expect([...parDate.keys()].sort()).toEqual([LUNDI, '2026-09-24'])
    for (const compte of parDate.values()) expect(compte).toBeLessThanOrEqual(PRODUCTIONS_PAR_SESSION_DECLAREE)
  })
})

describe('les bases partagées obéissent à la même capacité', () => {
  // Une base de vingt minutes qui se garde quatre jours, employée par trois
  // plats : sans capacité déclarée, rien n'empêche d'en cuire une deuxième et
  // une troisième le même jour.
  const BASE = {
    ...plat('BASE-TOM', 'Sauce tomate', 'tomate pelee'),
    prepMinutes: 20,
    conservationProfile: { fridgeHours: 96, eatImmediately: false, freezable: null, freezerMonths: null, serveCold: null, source: 'manuel' },
  }
  const BASE2 = { ...BASE, code: 'BASE-LEG', family: 'Bouillon de légumes' }
  const BASE3 = { ...BASE, code: 'BASE-POI', family: 'Pois chiches cuits' }
  const surBase = (recette, baseCode) => ({
    ...recette,
    exactIngredients: recette.exactIngredients.map((ingredient, index) => (index === 0
      ? { ...ingredient, component: { code: baseCode, name: baseCode } }
      : ingredient)),
  })

  const corpus = [
    surBase(CORPUS[0], 'BASE-TOM'),
    surBase(CORPUS[1], 'BASE-LEG'),
    surBase(CORPUS[2], 'BASE-POI'),
    ...CORPUS.slice(3),
  ]
  const planifierAvecBases = (cookingCapacity) => generateClosedLoopPlan({
    slots: SLOTS,
    recipes: corpus,
    inventoryLots: LOTS,
    baseRecipes: [BASE, BASE2, BASE3],
    constraints: { ...CONTRAINTES, ...(cookingCapacity ? { cookingCapacity } : {}) },
  })

  const sansRien = planifierAvecBases(null)
  const lundiRapide = planifierAvecBases(capaciteDe([membre('j', 'Julien', { quick_days: [1] })]))
  const lundiSession = planifierAvecBases(capaciteDe([membre('j', 'Julien', { cooking_days: [1] })]))

  const basesCuitesLe = (plan, date) => plan.slots
    .filter((slot) => slot.date === date)
    .flatMap((slot) => slot.sharedBases?.cooked || [])

  it('le corpus de ce bloc cuit bien des bases — sinon les mesures suivantes ne diraient rien', () => {
    const cuites = sansRien.slots.flatMap((slot) => slot.sharedBases?.cooked || [])
    expect(cuites.length).toBeGreaterThan(0)
  })

  it('un soir rapide ne CUIT aucune base', () => {
    expect(basesCuitesLe(lundiRapide, LUNDI)).toEqual([])
  })

  it('un jour ne cuit pas plus de bases que la capacité déclarée n’en porte', () => {
    expect(lundiSession.capacity.maxBasesPerSession).toBe(BASES_PAR_SESSION_DECLAREE)
    // TÉMOIN D'ABORD. Un plan qui ne cuirait aucune base satisferait le plafond
    // sans que le plafond ait servi à rien : l'assertion passerait à vide.
    const cuites = datesFenetre.flatMap((date) => basesCuitesLe(lundiSession, date))
    expect(cuites.length, 'aucune base cuite : le plafond ne serait vérifié sur rien').toBeGreaterThan(0)
    for (const date of datesFenetre) {
      expect(basesCuitesLe(lundiSession, date).length, date).toBeLessThanOrEqual(BASES_PAR_SESSION_DECLAREE)
    }
  })

  it('cuit une base le jour du plat qui l’emploie, y compris hors session — et ce n’est pas un contournement', () => {
    // LE PLAFOND DES BASES EST PAR JOUR, PAS PAR SESSION, et il vaut mieux
    // qu'un test le dise que de le laisser déduire du code. `allowsCookingBaseOn`
    // ne refuse une cuisson de base QUE les soirs rapides : cuire la sauce d'un
    // gratin le soir où l'on mange ce gratin est la préparation de ce plat, pas
    // un batch avancé. L'interdire hors des jours déclarés retirerait le plat du
    // créneau — ce que le critère du livrable ne demande nulle part.
    // MESURE de ce corpus : lundi seul déclaré, les deux bases sont cuites le
    // mercredi et le jeudi, une par jour.
    const joursDeCuissonDeBase = datesFenetre.filter((date) => basesCuitesLe(lundiSession, date).length > 0)
    expect(joursDeCuissonDeBase.length).toBeGreaterThan(0)
    expect(joursDeCuissonDeBase.some((date) => !lundiSession.capacity.sessionDates.includes(date))).toBe(true)
    // Et l'interdit, lui, tient : jamais un soir déclaré rapide.
    for (const date of lundiRapide.capacity.quickDates) {
      expect(basesCuitesLe(lundiRapide, date), date).toEqual([])
    }
  })
})
