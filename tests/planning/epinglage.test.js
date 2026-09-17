import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../helpers/supabaseMock'

/**
 * ÉPINGLER UN REPAS — livrable 3.4.
 *
 * CE QUE CE FICHIER MET À L'ÉPREUVE, ET POURQUOI IL LE FAIT BOUT EN BOUT.
 * L'épingle n'était pas une fonction manquante : c'était une chaîne à quatre
 * maillons dont le PREMIER manquait. `slotProtection.js:39` lit `slot.locked`,
 * `generate-v3/route.js` donne `fixedRecipeCode` aux créneaux protégés, et la
 * transaction de publication reporte `locked` d'une version de plan à la
 * suivante. Tester la seule route d'écriture ne dirait rien de ce qui compte —
 * qu'une épingle TIENNE. On rejoue donc la chaîne entière : la route écrit, la
 * génération relit, la publication reporte, trois fois de suite.
 *
 * CE QUI EST SIMULÉ, ET CE QUI NE L'EST PAS. La CI n'a pas de base. La fonction
 * `publish_canonical_final_demand_plan` est donc rejouée en JavaScript, mais
 * SEULEMENT sur ce qu'elle fait de `locked` — le report mot pour mot de
 * `supabase/migrations/20260717000002_p2_planned_productions.sql:336`
 * (`coalesce((v_slot->>'locked')::boolean, false)` à l'insertion des créneaux de
 * la nouvelle version) et le rattachement des repas par `slot_key`. Tout le
 * reste — le solveur, le payload canonique, la protection des créneaux — est le
 * code réel. Ce que ce test NE prouve pas : que la base applique bien ce
 * `coalesce`. Cela se lit dans la migration, cela ne se mesure pas ici.
 */

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/aiContextBuilder', () => ({
  fetchDietaryConstraints: vi.fn(async () => ({ allergies: [], bans: [], dislikes: [], diets: [] })),
}))
vi.mock('@/lib/db/operationalRecipeCatalog', () => ({ listOperationalRecipes: vi.fn() }))

import { POST as EPINGLER } from '@/app/api/planning/epinglage/route'
import { POST as GENERER } from '@/app/api/planning/generate-v3/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { listOperationalRecipes } from '@/lib/db/operationalRecipeCatalog'
import { slotProtectionState } from '@/lib/domain/planning/slotProtection'
import { getImport } from '@/lib/nutritionPlanService'

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

// Huit plats : assez pour que le solveur ait de quoi remplacer les treize
// créneaux non épinglés à chaque tour. Avec deux, « le créneau n'a pas changé »
// ne prouverait rien.
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

const creneauxInitiaux = () => DATES.flatMap((date, jour) => ['dejeuner', 'diner'].map((prise, index) => ({
  id: `slot-0-${jour}-${index}`,
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

const repasInitiaux = (creneaux) => creneaux.map((creneau) => ({
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

function baseSimulee({ creneaux = creneauxInitiaux() } = {}) {
  const mock = createSupabaseMock({
    nutrition_plan_imports: [{
      id: 42, user_id: 'u1', date_range_start: DEBUT, date_range_end: DATES[6],
      active_plan_version_id: 'v-0',
    }],
    meal_plan_slots: creneaux,
    nutrition_plan_meals: repasInitiaux(creneaux),
    nutrition_plan_prep_tasks: [],
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
  return mock
}

/**
 * Rejoue la publication sur ce que ce test doit observer : une NOUVELLE version
 * de plan dont les créneaux reprennent `locked` du payload, et des repas
 * rattachés par `slot_key`. L'ancienne version reste en base, comme en
 * production — on ne la supprime pas, on change l'import de version active.
 */
function brancherPublication(mock) {
  let version = 0
  const payloads = []
  mock.rpc = vi.fn(async (nom, args) => {
    if (nom === 'planning_schema_compatibility') {
      return { data: { compatible: true, contract_version: 5 }, error: null }
    }
    if (nom !== 'publish_canonical_final_demand_plan') {
      return { data: { import_id: 42, plan_version_id: `v-${version}`, status: 'published' }, error: null }
    }
    const payload = args?.p_payload || {}
    payloads.push(payload)
    version += 1
    const idVersion = `v-${version}`
    const parCle = new Map()
    for (const creneau of payload.slots || []) {
      const ligne = {
        id: `slot-${version}-${creneau.slot_key}`,
        user_id: 'u1',
        plan_version_id: idVersion,
        slot_key: creneau.slot_key,
        meal_date: creneau.meal_date,
        meal_type: creneau.meal_type,
        title: creneau.title || null,
        preparation: creneau.preparation || {},
        status: creneau.status || 'planned',
        // Le report de l'épingle, mot pour mot comme la migration.
        locked: creneau.locked === true,
        source: creneau.source || 'plan',
      }
      parCle.set(creneau.slot_key, ligne)
      await mock.from('meal_plan_slots').insert(ligne)
    }
    await mock.from('nutrition_plan_meals').delete().eq('import_id', 42)
    for (const repas of payload.legacy_meals || []) {
      const creneau = parCle.get(repas.slot_key)
      await mock.from('nutrition_plan_meals').insert({
        ...repas,
        id: `meal-${version}-${repas.slot_key}-${repas.person_name}`,
        import_id: 42,
        user_id: 'u1',
        meal_plan_slot_id: creneau?.id ?? null,
        locked: repas.locked === true,
      })
    }
    await mock.from('nutrition_plan_imports').update({ active_plan_version_id: idVersion }).eq('id', 42)
    return { data: { import_id: 42, plan_version_id: idVersion, status: 'published' }, error: null }
  })
  return { payloads, version: () => version }
}

/** Capture les patchs envoyés en `update` : sert à la garde du §9.3. */
function espionnerLesEcritures(mock) {
  const patchs = []
  const source = mock.from.bind(mock)
  mock.from = (nom) => {
    const api = source(nom)
    const update = api.update.bind(api)
    api.update = (payload) => { patchs.push({ table: nom, payload }); return update(payload) }
    return api
  }
  return patchs
}

const codesParCreneau = (mock) => {
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

describe('POST /api/planning/epinglage — la route qui écrivait rien', () => {
  it('exige une authentification', async () => {
    authenticateRequest.mockResolvedValue({ supabase: null, user: null, error: 'Non authentifié' })
    const reponse = await EPINGLER(requete({ import_id: 42, meal_date: DEBUT, meal_type: 'diner', locked: true }))
    expect(reponse.status).toBe(401)
  })

  it('refuse ce qui n’est pas déclaré, sans rien écrire', async () => {
    const mock = baseSimulee()
    const patchs = espionnerLesEcritures(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const cas = [
      [{ meal_date: DEBUT, meal_type: 'diner', locked: true }, 'import_id requis'],
      [{ import_id: 42, meal_type: 'diner', locked: true }, 'meal_date'],
      [{ import_id: 42, meal_date: DEBUT, meal_type: 'gouter', locked: true }, 'meal_type'],
      // Ne pas s'être prononcé n'est pas « dépingler » : sans booléen, on refuse.
      [{ import_id: 42, meal_date: DEBUT, meal_type: 'diner' }, 'locked'],
    ]
    for (const [corps, attendu] of cas) {
      const reponse = await EPINGLER(requete(corps))
      expect(reponse.status, JSON.stringify(corps)).toBe(400)
      expect((await reponse.json()).error).toContain(attendu)
    }
    expect(patchs).toHaveLength(0)
  })

  it('n’écrit QUE `locked` — la garde du §9.3 du plan', async () => {
    const mock = baseSimulee()
    const patchs = espionnerLesEcritures(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const reponse = await EPINGLER(requete({ import_id: 42, meal_date: '2026-09-23', meal_type: 'diner', locked: true }))
    expect(reponse.status).toBe(200)
    expect(await reponse.json()).toMatchObject({ slot_key: '2026-09-23-diner', locked: true, protects_next_generation: true })

    // Une seule écriture, une seule colonne. Pas de recette, pas de portion, pas
    // de repas : épingler ne DÉCIDE rien, et c'est ce qui rend cette écriture
    // compatible avec « zéro écriture dans les tables de planning hors
    // publication atomique ».
    expect(patchs).toHaveLength(1)
    expect(patchs[0].table).toBe('meal_plan_slots')
    expect(Object.keys(patchs[0].payload)).toEqual(['locked'])

    const creneau = mock.rows('meal_plan_slots').find((row) => row.slot_key === '2026-09-23-diner')
    expect(creneau.locked).toBe(true)
    expect(slotProtectionState(creneau, [], [])).toMatchObject({ protected: true, protection_reason: 'locked' })
  })

  it('dépingle, et le créneau redevient remplaçable', async () => {
    const mock = baseSimulee()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    await EPINGLER(requete({ import_id: 42, meal_date: '2026-09-23', meal_type: 'diner', locked: true }))
    const reponse = await EPINGLER(requete({ import_id: 42, meal_date: '2026-09-23', meal_type: 'diner', locked: false }))

    expect(reponse.status).toBe(200)
    expect(await reponse.json()).toMatchObject({ locked: false, protects_next_generation: false })
    const creneau = mock.rows('meal_plan_slots').find((row) => row.slot_key === '2026-09-23-diner')
    expect(slotProtectionState(creneau, [], []).protected).toBe(false)
  })

  it('refuse d’épingler un repas déjà mangé, plutôt que de doubler sa protection', async () => {
    const creneaux = creneauxInitiaux()
    creneaux[0].status = 'consumed'
    const mock = baseSimulee({ creneaux })
    const patchs = espionnerLesEcritures(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    const reponse = await EPINGLER(requete({ import_id: 42, meal_date: DEBUT, meal_type: 'dejeuner', locked: true }))
    expect(reponse.status).toBe(409)
    expect((await reponse.json()).code).toBe('deja_protege_par_le_statut')
    expect(patchs).toHaveLength(0)
  })

  it('ne trouve pas un créneau qui n’est pas dans le planning', async () => {
    const mock = baseSimulee()
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    const reponse = await EPINGLER(requete({ import_id: 42, meal_date: '2026-10-19', meal_type: 'diner', locked: true }))
    expect(reponse.status).toBe(404)
  })
})

/**
 * LE CRITÈRE DU LIVRABLE : trois régénérations consécutives.
 *
 * Les quatre générations de semaine — la publication initiale, puis les trois
 * régénérations — sont jouées UNE FOIS dans `beforeAll` et observées par
 * quatre assertions. Les refaire dans chaque `it` multiplierait par quatre un
 * coût mesuré à 2,4 s en local : sur un runner partagé, trois à quatre fois
 * plus lent, on frôlerait les 20 s de la CI pour ne rien mesurer de plus.
 * C'est le modèle de `tests/planning/varieteSemaine.test.js`, et la raison
 * pour laquelle aucun `it` de ce fichier ne rallonge son propre délai : une
 * borne qu'on relève pour faire passer un test ne mesure plus rien.
 */
describe('un créneau épinglé survit à trois régénérations consécutives', () => {
  const CLE = '2026-09-24-diner'
  const vu = { codeEpingle: null, suivis: [], payloads: null, mock: null, statutEpinglage: null }

  beforeAll(async () => {
    listOperationalRecipes.mockResolvedValue({ recipes: CATALOGUE, metadata: { corpusVersion: 'test-corpus' } })
    const mock = baseSimulee()
    const { payloads } = brancherPublication(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })
    vu.mock = mock
    vu.payloads = payloads

    // Tour 0 : la semaine est publiée une première fois. C'est elle qu'on
    // épingle — on ne peut pas épingler un repas qui n'existe pas encore.
    const premiere = await GENERER(requete({ import_id: 42, scope: 'week' }))
    if (premiere.status !== 200) throw new Error(`publication initiale: ${premiere.status}`)
    vu.codeEpingle = codesParCreneau(mock)[CLE]

    const epingle = await EPINGLER(requete({ import_id: 42, meal_date: '2026-09-24', meal_type: 'diner', locked: true }))
    vu.statutEpinglage = epingle.status

    // Trois régénérations de la semaine entière, l'une après l'autre.
    for (let tour = 1; tour <= 3; tour += 1) {
      const reponse = await GENERER(requete({ import_id: 42, scope: 'week' }))
      if (reponse.status !== 200) throw new Error(`régénération ${tour}: ${reponse.status}`)
      vu.suivis.push(codesParCreneau(mock))
    }
  }, 20000)

  it('publie une semaine, puis épingle un de ses dîners', () => {
    expect(vu.codeEpingle).toBeTruthy()
    expect(vu.statutEpinglage).toBe(200)
    expect(vu.suivis).toHaveLength(3)
  })

  it('garde le même plat au même créneau, trois fois de suite', () => {
    for (const [index, codes] of vu.suivis.entries()) {
      expect(codes[CLE], `régénération ${index + 1} : le créneau épinglé a changé de plat`).toBe(vu.codeEpingle)
    }
  })

  it('reporte l’épingle elle-même d’une version de plan à la suivante', () => {
    // Sans ce report, le test ci-dessus n'aurait tenu que par chance : la
    // quatrième régénération effacerait le repas.
    const idVersion = vu.mock.rows('nutrition_plan_imports')[0].active_plan_version_id
    const creneau = vu.mock.rows('meal_plan_slots')
      .find((row) => row.plan_version_id === idVersion && row.slot_key === CLE)
    expect(creneau.locked).toBe(true)
    expect(vu.payloads.at(-1).slots.find((item) => item.slot_key === CLE).locked).toBe(true)
  })

  it('laisse changer les créneaux non épinglés — sans quoi il ne prouverait rien', () => {
    const changes = Object.keys(vu.suivis[0]).filter((cle) => cle !== CLE && vu.suivis[0][cle] !== vu.suivis[2][cle])
    expect(changes.length, 'aucun créneau non épinglé n’a changé : le test ne prouve rien').toBeGreaterThan(0)
  })
})

describe('le témoin : sans épingle, le même créneau change bien de plat', () => {
  // Sans ce témoin, « le créneau épinglé n'a pas changé » pourrait n'être que
  // le solveur qui resert la même chose. Même semaine, même créneau, mêmes
  // trois régénérations — la seule différence est l'épingle.
  const CLE = '2026-09-24-diner'
  const vus = new Set()

  beforeAll(async () => {
    listOperationalRecipes.mockResolvedValue({ recipes: CATALOGUE, metadata: { corpusVersion: 'test-corpus' } })
    const mock = baseSimulee()
    brancherPublication(mock)
    authenticateRequest.mockResolvedValue({ supabase: mock, user: { id: 'u1' }, error: null })

    await GENERER(requete({ import_id: 42, scope: 'week' }))
    vus.add(codesParCreneau(mock)[CLE])
    for (let tour = 1; tour <= 3; tour += 1) {
      await GENERER(requete({ import_id: 42, scope: 'week' }))
      vus.add(codesParCreneau(mock)[CLE])
    }
  }, 20000)

  it('sert au moins deux plats différents sur le créneau laissé libre', () => {
    expect(vus.size).toBeGreaterThan(1)
  })
})

/**
 * LE TUYAU — ce que la phase 0b a appris à ce dépôt.
 *
 * Une épingle écrite en base et jamais renvoyée à l'écran est une épingle
 * invisible : le bouton afficherait « Épingler » sur un créneau déjà épinglé,
 * et l'utilisateur la reposerait indéfiniment. `WeekGrid.jsx` lit
 * `meal.slot_locked` ; ce test vérifie que quelqu'un l'écrit.
 */
describe('l’épingle arrive jusqu’à la grille', () => {
  const chargerLaSemaine = async (creneaux) => {
    const mock = baseSimulee({ creneaux })
    const data = await getImport(mock, 42)
    return Object.fromEntries(data.meals.map((repas) => [`${repas.meal_date}-${repas.meal_type}`, repas]))
  }

  it('rend `slot_locked` vrai sur le créneau épinglé, faux sur les autres', async () => {
    const creneaux = creneauxInitiaux()
    const cible = creneaux.find((creneau) => creneau.slot_key === '2026-09-24-diner')
    cible.locked = true
    const parCreneau = await chargerLaSemaine(creneaux)

    expect(parCreneau['2026-09-24-diner'].slot_locked).toBe(true)
    expect(parCreneau['2026-09-24-diner'].slot_key).toBe('2026-09-24-diner')
    const autres = Object.entries(parCreneau).filter(([cle]) => cle !== '2026-09-24-diner')
    expect(autres.length).toBeGreaterThan(0)
    for (const [cle, repas] of autres) expect(repas.slot_locked, cle).toBe(false)
  })

  it('distingue « pas épinglé » de « on ne sait pas »', async () => {
    // Un repas sans créneau rattaché — les plans antérieurs au socle V2 en
    // portent — ne doit pas afficher une épingle ouverte : `null`, pas `false`.
    const creneaux = creneauxInitiaux()
    const mock = baseSimulee({ creneaux })
    const orphelin = mock.rows('nutrition_plan_meals')[0]
    await mock.from('nutrition_plan_meals').update({ meal_plan_slot_id: null }).eq('id', orphelin.id)

    const data = await getImport(mock, 42)
    const repas = data.meals.find((ligne) => ligne.id === orphelin.id)
    expect(repas.slot_locked).toBe(null)
  })
})
