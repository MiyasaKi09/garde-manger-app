import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

/**
 * « REMPLACER CE REPAS » BRANCHÉ SUR LE MOTEUR — livrable 3.2.
 *
 * CE QUI ÉTAIT EN PLACE, ET CE QUI MANQUAIT. `/api/planning/alternatives`
 * (185 lignes, déterministe, sous les mêmes règles que la génération) existait
 * depuis des mois sans AUCUN appelant : le seul « appel » qu'on trouvait dans le
 * dépôt était son propre commentaire. Le bouton « Changer ce plat » de
 * `app/planning/components/TodayMeals.jsx` partait, lui, vers
 * `/api/routine/modify-meal` — un modèle de langage qui écrit la semaine en base
 * hors moteur, hors règles de répétition, hors invariants, en trente à soixante
 * secondes.
 *
 * DEUX MAILLONS, PAS UN. Proposer ne suffisait pas : le choix devait pouvoir
 * ATTEINDRE le plan. `generate-v3` accepte donc `chosen_recipes`, qui fige le
 * créneau sur le plat retenu et republie par la transaction atomique. Sans ce
 * second maillon, l'écran aurait montré cinq plats sans pouvoir en servir aucun.
 *
 * CE QUE CE FICHIER NE FAIT PAS. Il ne mesure pas la latence : c'est
 * `tests/planning/alternativesLatence.test.js`, sur le vivier entier.
 */

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/aiContextBuilder', () => ({
  fetchDietaryConstraints: vi.fn(async () => ({ allergies: [], bans: [], dislikes: [], diets: [] })),
}))
vi.mock('@/lib/db/operationalRecipeCatalog', () => ({ listOperationalRecipes: vi.fn() }))

import { POST as ALTERNATIVES } from '@/app/api/planning/alternatives/route'
import { POST as GENERER } from '@/app/api/planning/generate-v3/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { listOperationalRecipes } from '@/lib/db/operationalRecipeCatalog'

const RACINE = path.resolve(__dirname, '..', '..')
const requete = (corps) => ({ json: async () => corps })

const DEBUT = '2026-09-21'
const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']

const recette = (code, famille, forme) => ({
  code,
  family: famille,
  category: 'plat principal',
  eligible: true,
  servings: 2,
  prepMinutes: 15,
  cookMinutes: 20,
  cuisineOrigin: 'France',
  allergens: [],
  identityLevel: 'named_traditional_dish',
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', scores: { richness: 2, acidic: 1, freshness: 1 }, target_textures: ['fondant'] },
  exactIngredients: [{ name: forme, formNormalized: forme, quantity: 100, unit: 'g', grams: 100, optional: false, category: 'legumes' }],
  exactSteps: [{ n: 1, instruction: 'Préparer.' }],
  nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: 55, fatG: 18, fiberG: 8 },
  nutritionCoverage: { pct: 100 },
})

const CATALOGUE = [
  recette('FR-001', 'Hachis parmentier', 'carotte crue'),
  recette('FR-002', 'Salade de courgettes', 'courgette cuite'),
  recette('FR-003', 'Gratin de blettes', 'blette crue'),
  recette('FR-004', 'Soupe de potiron', 'potiron cru'),
  recette('FR-005', 'Poêlée de haricots', 'haricot vert cru'),
  recette('FR-006', 'Tian de légumes', 'aubergine crue'),
  recette('FR-007', 'Curry de chou-fleur', 'chou fleur cru'),
  recette('FR-008', 'Risotto de poireaux', 'poireau cru'),
]

const creneaux = () => DATES.flatMap((date, jour) => ['dejeuner', 'diner'].map((prise, index) => ({
  id: `slot-${jour}-${index}`,
  user_id: 'u1',
  plan_version_id: 'v-0',
  slot_key: `${date}-${prise}`,
  meal_date: date,
  meal_type: prise,
  title: 'Plat initial',
  preparation: { recipe_code: CATALOGUE[(jour + index) % 2].code },
  status: 'planned',
  locked: false,
  source: 'canonical_v3',
})))

const repas = (liste) => liste.map((creneau) => ({
  id: `meal-${creneau.slot_key}`,
  import_id: 42,
  user_id: 'u1',
  person_name: 'Membre',
  household_member_id: 'm1',
  meal_date: creneau.meal_date,
  meal_type: creneau.meal_type,
  day_type: 'standard',
  short_label: 'Plat initial',
  description: 'Plat initial · 1 portion',
  kcal: 500, protein_g: 30, carbs_g: 55, fat_g: 18, fiber_g: 8,
  micronutrients: {},
  meal_plan_slot_id: creneau.id,
  planned_servings: 1,
  locked: false,
  canonical_recipe_code: creneau.preparation.recipe_code,
  variant_kind: null,
  portion_details: {},
  target_snapshot: {},
  constraints_snapshot: {},
  planning_status: 'planned',
  demand_key: null,
  execution_key: null,
}))

function baseSimulee({ liste = creneaux() } = {}) {
  return createSupabaseMock({
    nutrition_plan_imports: [{
      id: 42, user_id: 'u1', date_range_start: DEBUT, date_range_end: DATES[6],
      active_plan_version_id: 'v-0',
    }],
    meal_plan_slots: liste,
    nutrition_plan_meals: repas(liste),
    nutrition_plan_prep_tasks: [],
    member_food_preferences: [],
    household_members: [{
      id: 'm1', user_id: 'u1', name: 'Membre', portion_multiplier: 1, active: true,
      preferences: { planning: { breakfast: false, snack: false } }, created_at: '2026-01-01',
    }],
    user_health_goals: [{
      user_id: 'u1', person_name: 'Membre', target_calories: 2000,
      target_protein_g: 120, target_carbs_g: 220, target_fat_g: 72, target_fiber_g: 32,
    }],
    inventory_lots: [],
    inventory_reservations: [],
    cooked_dishes: [],
  })
}

/** Publication rejouée sur ce qui compte ici : la recette servie au créneau. */
function brancherPublication(mock) {
  let version = 0
  mock.rpc = vi.fn(async (nom, args) => {
    if (nom === 'planning_schema_compatibility') {
      return { data: { compatible: true, contract_version: 5 }, error: null }
    }
    if (nom !== 'publish_canonical_final_demand_plan') {
      return { data: { import_id: 42, plan_version_id: `v-${version}`, status: 'published' }, error: null }
    }
    const payload = args?.p_payload || {}
    version += 1
    const idVersion = `v-${version}`
    for (const creneau of payload.slots || []) {
      await mock.from('meal_plan_slots').insert({
        id: `slot-${version}-${creneau.slot_key}`,
        user_id: 'u1',
        plan_version_id: idVersion,
        slot_key: creneau.slot_key,
        meal_date: creneau.meal_date,
        meal_type: creneau.meal_type,
        title: creneau.title || null,
        preparation: creneau.preparation || {},
        status: creneau.status || 'planned',
        locked: creneau.locked === true,
        source: creneau.source || 'plan',
      })
    }
    await mock.from('nutrition_plan_imports').update({ active_plan_version_id: idVersion }).eq('id', 42)
    return { data: { import_id: 42, plan_version_id: idVersion, status: 'published' }, error: null }
  })
}

const codesServis = (mock) => {
  const idVersion = mock.rows('nutrition_plan_imports')[0].active_plan_version_id
  return Object.fromEntries(mock.rows('meal_plan_slots')
    .filter((creneau) => creneau.plan_version_id === idVersion)
    .map((creneau) => [creneau.slot_key, creneau.preparation?.recipe_code || null]))
}

beforeEach(() => {
  vi.clearAllMocks()
  listOperationalRecipes.mockResolvedValue({ recipes: CATALOGUE, metadata: { corpusVersion: 'test-corpus' } })
})
afterEach(() => { vi.restoreAllMocks() })

describe('POST /api/planning/alternatives — désigner le créneau comme l’écran le connaît', () => {
  it('exige une authentification', async () => {
    authenticateRequest.mockResolvedValue({ supabase: null, user: null, error: 'Non authentifié' })
    expect((await ALTERNATIVES(requete({ import_id: 42 }))).status).toBe(401)
  })

  it('accepte meal_date + meal_type, et rend la clé de créneau résolue', async () => {
    // Les repas servis aux écrans viennent de `nutrition_plan_meals`, qui porte
    // la date et la prise mais pas `slot_key`. Exiger la clé obligeait chaque
    // écran à recomposer `${date}-${prise}` à la main — un format défini
    // ailleurs, donc deux sources de vérité pour la même désignation.
    const mock = baseSimulee()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const reponse = await ALTERNATIVES(requete({ import_id: 42, meal_date: '2026-09-24', meal_type: 'diner' }))
    expect(reponse.status).toBe(200)
    const corps = await reponse.json()
    expect(corps.slotKey).toBe('2026-09-24-diner')
    expect(corps.meal_date).toBe('2026-09-24')
    expect(corps.meal_type).toBe('diner')
    expect(corps.alternatives.length).toBeGreaterThan(0)
    // Chaque proposition dit ce qu'elle coûte : c'est l'exigence du §16 et ce
    // que la Routine ne pouvait pas offrir.
    for (const alternative of corps.alternatives) {
      expect(alternative).toHaveProperty('compatible')
      expect(alternative).toHaveProperty('consequences')
      expect(alternative).toHaveProperty('stockCoverage')
      expect(alternative.recipeCode).not.toBe(corps.current?.recipeCode)
      // Une conséquence rendue sous forme de code (`recipe_repeat_too_close`)
      // ne dit rien à personne : l'exigence du §16 ne serait tenue qu'en
      // apparence. Chacune porte donc sa phrase française.
      for (const consequence of alternative.consequences) {
        expect(consequence.message, consequence.code).toBeTruthy()
        expect(consequence.message).not.toBe(consequence.code)
      }
    }
  })

  it('traduit les conséquences en français, phrase par phrase', async () => {
    // Semaine saturée : chacun des sept autres plats y figure DEUX fois, si
    // bien qu'une troisième assiette franchirait le plafond de consommation.
    // Toute alternative proposée porte donc une conséquence — c'est le cas qui
    // met la traduction à l'épreuve, et il ne se produit pas sur une semaine
    // ordinaire.
    const liste = creneaux()
    for (const [index, creneau] of liste.entries()) {
      creneau.preparation = { recipe_code: CATALOGUE[1 + (index % 7)].code }
    }
    const cible = liste.find((creneau) => creneau.slot_key === '2026-09-22-dejeuner')
    cible.preparation = { recipe_code: CATALOGUE[0].code }

    const mock = baseSimulee({ liste })
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    const reponse = await ALTERNATIVES(requete({ import_id: 42, meal_date: '2026-09-22', meal_type: 'dejeuner' }))
    const corps = await reponse.json()
    const avecConsequence = corps.alternatives.filter((item) => item.consequences.length > 0)
    expect(avecConsequence.length, 'aucune conséquence à traduire : le cas n’est pas couvert').toBeGreaterThan(0)
    for (const alternative of avecConsequence) {
      for (const consequence of alternative.consequences) {
        // Une phrase, pas un identifiant : au moins deux mots français.
        expect(consequence.message, consequence.code).toMatch(/\p{L}{3,}\s+\p{L}{2,}/u)
        expect(consequence.message).not.toBe(consequence.code)
      }
    }
  })

  it('accepte encore slot_key — l’ancien contrat n’est pas retiré', async () => {
    const mock = baseSimulee()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    const reponse = await ALTERNATIVES(requete({ import_id: 42, slot_key: '2026-09-24-diner' }))
    expect(reponse.status).toBe(200)
    expect((await reponse.json()).slotKey).toBe('2026-09-24-diner')
  })

  it('refuse une désignation incomplète plutôt que d’en deviner une', async () => {
    const mock = baseSimulee()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    expect((await ALTERNATIVES(requete({ import_id: 42, meal_date: '2026-09-24' }))).status).toBe(400)
    expect((await ALTERNATIVES(requete({ import_id: 42, meal_type: 'diner' }))).status).toBe(400)
    expect((await ALTERNATIVES(requete({ meal_date: '2026-09-24', meal_type: 'diner' }))).status).toBe(400)
  })

  it('ne trouve pas un créneau hors de la semaine publiée', async () => {
    const mock = baseSimulee()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    const reponse = await ALTERNATIVES(requete({ import_id: 42, meal_date: '2026-10-19', meal_type: 'diner' }))
    expect(reponse.status).toBe(404)
  })
})

describe('le choix de l’utilisateur atteint le plan, et lui seul', () => {
  it('sert le plat retenu au créneau visé sans toucher aux treize autres', async () => {
    const mock = baseSimulee()
    brancherPublication(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    await GENERER(requete({ import_id: 42, scope: 'week' }))
    const avant = codesServis(mock)
    const CLE = '2026-09-24-diner'
    const choisi = CATALOGUE.map((item) => item.code).find((code) => code !== avant[CLE])

    const reponse = await GENERER(requete({
      import_id: 42,
      scope: 'meals',
      meals: [{ date: '2026-09-24', type: 'diner' }],
      chosen_recipes: [{ meal_date: '2026-09-24', meal_type: 'diner', recipe_code: choisi }],
    }))
    expect(reponse.status).toBe(200)

    const apres = codesServis(mock)
    expect(apres[CLE]).toBe(choisi)
    const bouges = Object.keys(avant).filter((cle) => cle !== CLE && avant[cle] !== apres[cle])
    expect(bouges, `créneaux modifiés sans qu'on le demande : ${bouges.join(', ')}`).toEqual([])
  }, 120000)

  it('refuse un code que le catalogue servi ne contient pas, au lieu de l’ignorer', async () => {
    // Un choix silencieusement écarté ressemblerait, à l'écran, à un moteur qui
    // a préféré autre chose. On rend le motif.
    const mock = baseSimulee()
    brancherPublication(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const reponse = await GENERER(requete({
      import_id: 42,
      scope: 'meals',
      meals: [{ date: '2026-09-24', type: 'diner' }],
      chosen_recipes: [{ meal_date: '2026-09-24', meal_type: 'diner', recipe_code: 'FR-999' }],
    }))
    expect(reponse.status).toBe(400)
    const corps = await reponse.json()
    expect(corps.code).toBe('chosen_recipe_invalid')
    expect(corps.details[0].reason).toBe('recette_absente_du_catalogue_servi')
  }, 120000)

  it('refuse deux choix pour le même créneau plutôt que d’en garder un', async () => {
    const mock = baseSimulee()
    brancherPublication(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const reponse = await GENERER(requete({
      import_id: 42,
      scope: 'meals',
      meals: [{ date: '2026-09-24', type: 'diner' }],
      chosen_recipes: [
        { meal_date: '2026-09-24', meal_type: 'diner', recipe_code: 'FR-005' },
        { meal_date: '2026-09-24', meal_type: 'diner', recipe_code: 'FR-006' },
      ],
    }))
    expect(reponse.status).toBe(400)
    expect((await reponse.json()).details[0].reason).toBe('deux_choix_pour_le_meme_creneau')
  }, 120000)

  it('refuse un choix dont le créneau n’est pas dans la semaine construite', async () => {
    // Date hors fenêtre, ou créneau retiré parce que tout le monde est absent
    // (livrable 1.5) : le choix serait perdu en silence, et l'écran lirait ce
    // silence comme un moteur qui a préféré autre chose.
    const mock = baseSimulee()
    brancherPublication(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const reponse = await GENERER(requete({
      import_id: 42,
      scope: 'meals',
      meals: [{ date: '2026-09-24', type: 'diner' }],
      chosen_recipes: [{ meal_date: '2026-10-19', meal_type: 'diner', recipe_code: 'FR-005' }],
    }))
    expect(reponse.status).toBe(400)
    const corps = await reponse.json()
    expect(corps.code).toBe('chosen_recipe_invalid')
    expect(corps.details[0].reason).toBe('creneau_absent_de_la_semaine')
  }, 120000)

  it('refuse un choix sur un créneau épinglé, et dit quoi faire', async () => {
    // Sans ce refus, l'épingle du livrable 3.4 ne vaudrait plus rien : un clic
    // sur une alternative la franchirait en silence.
    const mock = baseSimulee()
    brancherPublication(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    await GENERER(requete({ import_id: 42, scope: 'week' }))
    // L'ÉPINGLE EST POSÉE EN BASE, PAS PAR LA ROUTE VOISINE. Ce qui est éprouvé
    // ici est le refus de `generate-v3` devant un créneau protégé — le seul
    // morceau qui appartient à ce livrable. Passer par la route d'épinglage
    // (livrable 3.4) ferait tomber ce test au moindre changement de SON contrat,
    // pour un défaut qui ne serait pas le nôtre. `locked` sur le créneau est ce
    // que `slotProtection.js` lit, quel que soit ce qui l'a écrit.
    const idVersion = mock.rows('nutrition_plan_imports')[0].active_plan_version_id
    await mock.from('meal_plan_slots').update({ locked: true })
      .eq('plan_version_id', idVersion).eq('slot_key', '2026-09-24-diner')
    const avant = codesServis(mock)
    const choisi = CATALOGUE.map((item) => item.code).find((code) => code !== avant['2026-09-24-diner'])

    const reponse = await GENERER(requete({
      import_id: 42,
      scope: 'meals',
      meals: [{ date: '2026-09-24', type: 'diner' }],
      chosen_recipes: [{ meal_date: '2026-09-24', meal_type: 'diner', recipe_code: choisi }],
    }))
    expect(reponse.status).toBe(409)
    const corps = await reponse.json()
    expect(corps.code).toBe('protected_meal_not_replaceable')
    expect(corps.error).toContain('épinglé')
  }, 120000)

  it('refuse un choix sur un repas déjà cuisiné', async () => {
    const liste = creneaux()
    liste.find((creneau) => creneau.slot_key === '2026-09-24-diner').status = 'consumed'
    const mock = baseSimulee({ liste })
    brancherPublication(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const reponse = await GENERER(requete({
      import_id: 42,
      scope: 'meals',
      meals: [{ date: '2026-09-24', type: 'diner' }],
      chosen_recipes: [{ meal_date: '2026-09-24', meal_type: 'diner', recipe_code: 'FR-005' }],
    }))
    expect(reponse.status).toBe(409)
    expect((await reponse.json()).error).toContain('cuisiné')
  }, 120000)
})

describe('le bouton est réellement branché', () => {
  /**
   * Garde de SOURCE, même raison que `tests/db/paginationCatalogueOperationnel.test.js`.
   * Le défaut d'origine n'était pas dans la route d'alternatives : c'était son
   * absence d'appelant. Un test qui ne vérifierait que la route laisserait
   * entièrement ouverte la porte par laquelle le défaut est entré — et P14 comme
   * ce livrable se mesurent précisément par un `grep` d'appelants.
   */
  const ECRAN = 'app/planning/components/TodayMeals.jsx'
  const source = readFileSync(path.join(RACINE, ECRAN), 'utf8')

  it('TodayMeals.jsx appelle /api/planning/alternatives', () => {
    expect(source).toContain('/api/planning/alternatives')
  })

  it('TodayMeals.jsx applique le choix par la génération, pas par une écriture directe', () => {
    expect(source).toContain('chosen_recipes')
    expect(source).toContain('/api/planning/generate-v3')
  })

  it('TodayMeals.jsx appelle /api/meals/feedback — le retour de goût du livrable 3.3', () => {
    expect(source).toContain('/api/meals/feedback')
  })

  it('la Routine reste, mais n’est plus le premier chemin de « Changer ce plat »', () => {
    // Son retrait est le livrable 4.4 : « les alternatives déterministes doivent
    // exister avant qu'on débranche la Routine, sinon on retire une fonction
    // sans rien rendre ». Ce qui est vérifié ici, c'est l'ORDRE — le moteur est
    // proposé avant elle dans la modale.
    expect(source).toContain('/api/routine/modify-meal')
    expect(source.indexOf('tm-alt-section')).toBeGreaterThan(-1)
    expect(source.indexOf('tm-alt-section')).toBeLessThan(source.indexOf('tm-swap-section'))
  })
})
