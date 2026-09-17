import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildCanonicalPlanPayload, buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import {
  PART_ENERGIE_PRISE,
  buildPresenceIndex,
  expectedTakesForMember,
  shareOfDayAtHome,
} from '@/lib/domain/planning/mealPresence'

/**
 * LA PRÉSENCE PAR PERSONNE ET PAR CRÉNEAU — livrable 1.5 de
 * `docs/PLAN_FINIR_MYKO.md` (§5 phase 1 ; pari 3 du §4).
 *
 * CE QUE CE FICHIER EXIGE. Le critère d'acceptation du livrable, en entier et
 * d'un bloc, parce qu'il ne se tient qu'en entier : deux dîners hors domicile
 * déclarés pour une personne donnent **douze assiettes au lieu de quatorze pour
 * elle**, **les quantités de courses baissent d'autant**, **et le total
 * nutritionnel de la semaine n'inclut pas les repas absents**. Une seule des
 * trois qui manque et le livrable n'est pas tenu.
 *
 * OÙ IL LE VÉRIFIE. Sur la TRANSACTION DE PUBLICATION, comme le plan l'exige :
 * `buildCanonicalPlanPayload` est ce que la route `generate-v3` passe à
 * `publish_canonical_final_demand_plan`, et c'est ce payload — ses
 * `legacy_meals`, ses `planned_demands`, ses `recipe_executions` et ses
 * `shopping_items` — qui est relu ici. Rien n'est recalculé par le test : il
 * compare deux publications de la MÊME semaine, l'une sans aucune déclaration,
 * l'autre avec deux absences, et il ne lit que ce que la transaction publie.
 *
 * LE PROTOCOLE. Une semaine planifiée UNE FOIS au niveau du `describe` (le
 * modèle de `tests/planning/varieteSemaine.test.js`, imposé par les vingt
 * secondes par test de la CI), puis deux payloads construits sur ce MÊME plan.
 * Le plan du foyer est donc rigoureusement identique dans les deux cas : le
 * seul écart mesuré est celui que la présence produit, jamais celui d'une
 * autre semaine choisie par le solveur.
 *
 * CE QU'IL NE PROUVE PAS. Il ne prouve rien de la base : la table
 * `public.meal_presence` est écrite par la migration 20260917130000, qui est
 * appliquée par le pipeline et non par ce test. Les déclarations employées ici
 * sont des FIXTURES, à la forme exacte des lignes de cette table.
 */

const chemin = (relatif) => fileURLToPath(new URL(relatif, import.meta.url))

// ─── Protocole, recopié de tests/planning/rapportQualiteSemaine.test.js ─────
const DEBUT = '2026-09-21'
const CIBLE_PAR_REPAS = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
const BEAM_WIDTH = 48
const MAX_MINUTES_BY_MEAL = { dejeuner: 120, diner: 240 }
const PREFERRED_ACTIVE_MINUTES = 30

const MEMBRES = [
  { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
  { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } },
]
const GOALS = [
  { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
  { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
]

/** Les deux dîners hors domicile du critère, à la forme des lignes de la table. */
const MARDI = '2026-09-22'
const JEUDI = '2026-09-24'
const DEUX_DINERS_DEHORS = [
  { household_member_id: 'z', person_name: 'Zoé', meal_date: MARDI, meal_type: 'diner', present: false, note: null },
  { household_member_id: 'z', person_name: 'Zoé', meal_date: JEUDI, meal_type: 'diner', present: false, note: null },
]

const ABSENTE = 'Zoé'
const PRESENT = 'Julien'
const PRISES_PRINCIPALES = ['dejeuner', 'diner']

const assiettesDe = (payload, personne) => payload.legacy_meals
  .filter((repas) => repas.person_name === personne && PRISES_PRINCIPALES.includes(repas.meal_type))
const ligneDePresence = (payload, personne) => payload.validation_summary.presence
  .find((ligne) => ligne.person_name === personne)
const journee = (payload, personne, date) => payload.validation_summary.daily_nutrition
  .find((jour) => jour.person_name === personne && jour.meal_date === date)
const bloquantes = (payload) => (payload.issues || [])
  .filter((issue) => ['blocker', 'error'].includes(issue.severity))
  .map((issue) => issue.code)
  .sort()

/** Masse totale réellement à acheter, tous rayons confondus. */
const masseDesCourses = (payload) => payload.shopping_items
  .reduce((somme, article) => somme + (Number(article.exact_required_qty) || 0), 0)

describe('la part d’énergie d’une prise est déclarée, pas devinée', () => {
  it('reprend exactement les deux parts déjà déclarées dans supportLeftovers.js', () => {
    // `PART_ENERGIE_PRISE` recopie `SUPPORT_ENERGY_SHARE` pour ne pas faire
    // tirer `closedLoopPlanner.js` à une page de réglages. Une recopie qui
    // n'est pas vérifiée dérive : on relit le fichier source, et ce test
    // échoue si l'une des deux valeurs y change.
    const source = readFileSync(chemin('../../lib/domain/planning/supportLeftovers.js'), 'utf8')
    const bloc = source.match(/SUPPORT_ENERGY_SHARE = Object\.freeze\(\{([^}]*)\}\)/)
    expect(bloc, 'SUPPORT_ENERGY_SHARE introuvable dans supportLeftovers.js').toBeTruthy()
    const declarees = Object.fromEntries([...bloc[1].matchAll(/(\w+):\s*([\d.]+)/g)]
      .map(([, prise, valeur]) => [prise, Number(valeur)]))
    expect(declarees).toEqual({ pdj: PART_ENERGIE_PRISE.pdj, collation: PART_ENERGIE_PRISE.collation })
  })

  it('partage le reste de la journée entre les deux prises principales', () => {
    // Le seul nombre que ce livrable ajoute. On vérifie qu'il est bien le
    // RESTE, et non une valeur posée à côté : la somme des quatre parts fait
    // exactement une journée.
    const somme = Object.values(PART_ENERGIE_PRISE).reduce((total, part) => total + part, 0)
    expect(somme).toBeCloseTo(1, 10)
    expect(PART_ENERGIE_PRISE.dejeuner).toBe(PART_ENERGIE_PRISE.diner)
  })

  it('rend une part de 1 quand rien n’est déclaré, et la part du dîner en moins sinon', () => {
    const sansPdj = expectedTakesForMember({ breakfast: false, snack: true })
    expect(sansPdj).toEqual(['dejeuner', 'collation', 'diner'])
    expect(shareOfDayAtHome({ expectedTakes: sansPdj, absentTakes: [] })).toBe(1)
    // 0,315 + 0,12 = 0,435 sur 0,75 : la personne prend 58 % de sa journée
    // à la maison, et sa cible du jour est réduite d'autant.
    expect(shareOfDayAtHome({ expectedTakes: sansPdj, absentTakes: ['diner'] })).toBeCloseTo(0.58, 6)
  })
})

describe('une déclaration d’absence, et rien d’autre, agit sur le plan', () => {
  const index = buildPresenceIndex(DEUX_DINERS_DEHORS)

  it('ne retient une absence que sur present === false', () => {
    expect(index.absent({ id: 'z', name: 'Zoé' }, MARDI, 'diner')).toBe(true)
    // Rien de déclaré n'est PAS une absence : c'est la grille d'avant.
    expect(index.absent({ id: 'z', name: 'Zoé' }, MARDI, 'dejeuner')).toBe(false)
    expect(index.absent({ id: 'j', name: 'Julien' }, MARDI, 'diner')).toBe(false)
    // Une présence explicitement confirmée ne retire rien non plus.
    const confirme = buildPresenceIndex([{ household_member_id: 'z', meal_date: MARDI, meal_type: 'diner', present: true }])
    expect(confirme.absent({ id: 'z' }, MARDI, 'diner')).toBe(false)
  })

  it('écarte une ligne inexploitable au lieu de la compléter', () => {
    const bancales = buildPresenceIndex([
      { household_member_id: 'z', meal_date: '22/09/2026', meal_type: 'diner', present: false },
      { household_member_id: 'z', meal_date: MARDI, meal_type: 'souper', present: false },
      { household_member_id: 'z', meal_date: MARDI, meal_type: 'diner', present: 'non' },
    ])
    expect(bancales.size).toBe(0)
  })

  it('laisse le créneau du foyer quand une seule personne est absente', () => {
    const grille = buildWeekSlots(DEBUT, { presence: DEUX_DINERS_DEHORS, members: MEMBRES })
    expect(grille).toHaveLength(14)
    const mardiSoir = grille.find((creneau) => creneau.key === `${MARDI}-diner`)
    expect(mardiSoir.absentMembers).toEqual([{ household_member_id: 'z', person_name: 'Zoé' }])
  })

  it('retire le créneau quand TOUT le foyer est absent — on ne cuisine pour personne', () => {
    const toutLeFoyer = [
      ...DEUX_DINERS_DEHORS,
      { household_member_id: 'j', person_name: 'Julien', meal_date: MARDI, meal_type: 'diner', present: false },
    ]
    const grille = buildWeekSlots(DEBUT, { presence: toutLeFoyer, members: MEMBRES })
    expect(grille).toHaveLength(13)
    expect(grille.some((creneau) => creneau.key === `${MARDI}-diner`)).toBe(false)
    // Le déjeuner du même jour, lui, reste : personne n'a déclaré y être absent.
    expect(grille.some((creneau) => creneau.key === `${MARDI}-dejeuner`)).toBe(true)
  })

  it('ne conclut jamais « tout le monde est absent » sur une liste de membres qu’il n’a pas', () => {
    const grille = buildWeekSlots(DEBUT, { presence: DEUX_DINERS_DEHORS })
    expect(grille).toHaveLength(14)
  })
})

describe('publication d’une semaine, avec et sans deux dîners hors domicile', () => {
  // La semaine est planifiée UNE FOIS, et les deux payloads sont construits sur
  // CE plan : le foyer mange exactement les mêmes plats dans les deux cas, et
  // le seul écart mesuré plus bas est celui de la présence.
  const recipes = getCanonicalRecipes({ servings: 2 })
  const plan = generateClosedLoopPlan({
    slots: buildWeekSlots(DEBUT),
    recipes,
    inventoryLots: [],
    constraints: {
      allowShopping: true,
      targetByMeal: { dejeuner: CIBLE_PAR_REPAS, diner: CIBLE_PAR_REPAS },
      maxMinutesByMeal: MAX_MINUTES_BY_MEAL,
      preferredActiveMinutes: PREFERRED_ACTIVE_MINUTES,
    },
    beamWidth: BEAM_WIDTH,
  })
  const commun = {
    plan, recipes, windowStart: DEBUT, members: MEMBRES, goals: GOALS, constraints: {}, inventoryLots: [],
  }
  const sans = buildCanonicalPlanPayload({ ...commun })
  const avec = buildCanonicalPlanPayload({ ...commun, presence: DEUX_DINERS_DEHORS })

  // Troisième publication : une journée entière hors domicile pour les deux
  // prises principales. Elle demande sa propre grille (deux créneaux en moins)
  // donc son propre plan — planifié ICI, au niveau du `describe`, parce que la
  // CI coupe à vingt secondes par test.
  const SAMEDI = '2026-09-26'
  const JOURNEE_DEHORS = MEMBRES.flatMap((membre) => PRISES_PRINCIPALES.map((prise) => ({
    household_member_id: membre.id, person_name: membre.name, meal_date: SAMEDI, meal_type: prise, present: false,
  })))
  const grilleCourte = buildWeekSlots(DEBUT, { presence: JOURNEE_DEHORS, members: MEMBRES })
  const publieSansSamedi = buildCanonicalPlanPayload({
    ...commun,
    plan: generateClosedLoopPlan({
      slots: grilleCourte,
      recipes,
      inventoryLots: [],
      constraints: {
        allowShopping: true,
        targetByMeal: { dejeuner: CIBLE_PAR_REPAS, diner: CIBLE_PAR_REPAS },
        maxMinutesByMeal: MAX_MINUTES_BY_MEAL,
        preferredActiveMinutes: PREFERRED_ACTIVE_MINUTES,
      },
      beamWidth: BEAM_WIDTH,
    }),
    presence: JOURNEE_DEHORS,
  })

  it('publie une semaine complète à comparer', () => {
    // Un payload vide passerait toutes les comparaisons qui suivent.
    // `payload.slots` porte AUSSI les prises support : on compte les créneaux
    // principaux, les seuls que la grille de la semaine décide.
    expect(sans.slots.filter((creneau) => PRISES_PRINCIPALES.includes(creneau.meal_type))).toHaveLength(14)
    expect(assiettesDe(sans, ABSENTE)).toHaveLength(14)
    expect(assiettesDe(sans, PRESENT)).toHaveLength(14)
    expect(sans.shopping_items.length).toBeGreaterThan(20)
  })

  // ── CRITÈRE, PREMIER TIERS : douze assiettes au lieu de quatorze ──────────
  it('sert douze assiettes à la personne absente, et quatorze à l’autre', () => {
    expect(assiettesDe(avec, ABSENTE)).toHaveLength(12)
    expect(assiettesDe(avec, PRESENT)).toHaveLength(14)
    // Le moteur publie lui-même le chiffre, relu sur les repas émis : un écart
    // doit se lire au même endroit que la décision qui l'a produit.
    expect(ligneDePresence(avec, ABSENTE)).toMatchObject({
      week_main_slots: 14,
      grid_main_slots: 14,
      main_meals: 12,
    })
    expect(ligneDePresence(avec, PRESENT)).toMatchObject({ main_meals: 14 })
    expect(ligneDePresence(avec, ABSENTE).declared_absences).toEqual([
      { meal_date: MARDI, meal_type: 'diner', note: null },
      { meal_date: JEUDI, meal_type: 'diner', note: null },
    ])
    // Les deux assiettes manquantes sont EXACTEMENT les deux déclarées.
    const creneauxServis = new Set(assiettesDe(avec, ABSENTE).map((repas) => repas.slot_key))
    expect(creneauxServis.has(`${MARDI}-diner`)).toBe(false)
    expect(creneauxServis.has(`${JEUDI}-diner`)).toBe(false)
    for (const repas of assiettesDe(sans, ABSENTE)) {
      if ([`${MARDI}-diner`, `${JEUDI}-diner`].includes(repas.slot_key)) continue
      expect(creneauxServis.has(repas.slot_key), repas.slot_key).toBe(true)
    }
  })

  it('ne laisse aucune trace de l’assiette retirée dans la transaction', () => {
    // Ni demande publiée, ni repas, ni réservation : l'assiette n'existe pas,
    // elle n'est pas « à zéro ». Un zéro se réserve, se facture et se compte.
    for (const creneau of [`${MARDI}-diner`, `${JEUDI}-diner`]) {
      expect(avec.planned_demands.filter((demande) => demande.slot_key === creneau
        && demande.person_name === ABSENTE)).toEqual([])
      expect(avec.legacy_meals.filter((repas) => repas.slot_key === creneau
        && repas.person_name === ABSENTE)).toEqual([])
      // Le créneau reste servi à l'autre personne : le plat est toujours cuisiné.
      expect(avec.legacy_meals.some((repas) => repas.slot_key === creneau
        && repas.person_name === PRESENT)).toBe(true)
    }
  })

  // ── CRITÈRE, DEUXIÈME TIERS : les quantités de courses baissent d’autant ──
  it('retire des deux dîners EXACTEMENT les portions de la personne absente', () => {
    // C'est la forme exacte de « les quantités baissent d'autant ». Les grammes
    // d'une exécution sont strictement proportionnels à ses portions
    // (`finalDemands.js` : `scale = group.servings / recipe.servings`) : montrer
    // que les portions du créneau tombent de la portion retirée, et d'elle
    // seule, c'est montrer que les grammes tombent dans la même proportion.
    let creneauxMesures = 0
    for (const creneau of [`${MARDI}-diner`, `${JEUDI}-diner`]) {
      const portionsDuCreneau = (payload) => payload.planned_demands
        .filter((demande) => demande.slot_key === creneau)
        .reduce((somme, demande) => somme + (Number(demande.requested_servings) || 0), 0)
      const saPortion = sans.planned_demands
        .filter((demande) => demande.slot_key === creneau && demande.person_name === ABSENTE)
        .reduce((somme, demande) => somme + (Number(demande.requested_servings) || 0), 0)
      expect(saPortion, creneau).toBeGreaterThan(0)
      expect(portionsDuCreneau(avec), creneau).toBeCloseTo(portionsDuCreneau(sans) - saPortion, 3)
      creneauxMesures += 1
    }
    expect(creneauxMesures).toBe(2)
  })

  it('baisse la masse des courses de la semaine, sans ajouter un seul article', () => {
    const masseSans = masseDesCourses(sans)
    const masseAvec = masseDesCourses(avec)
    expect(masseAvec).toBeLessThan(masseSans)

    const parProduit = (payload) => new Map(payload.shopping_items
      .map((article) => [article.product_name, Number(article.exact_required_qty) || 0]))
    const quantitesSans = parProduit(sans)
    const quantitesAvec = parProduit(avec)
    let hausses = 0
    let baisses = 0
    for (const [produit, quantite] of quantitesAvec) {
      // Aucun article n'APPARAÎT : une absence n'invente pas un besoin.
      expect(quantitesSans.has(produit), `article ajouté : ${produit}`).toBe(true)
      const reference = quantitesSans.get(produit)
      if (quantite > reference + 0.001) hausses += quantite - reference
      if (quantite < reference - 0.001) baisses += reference - quantite
    }
    // CE QUI MONTE, ET POURQUOI ON NE LE CACHE PAS. Quelques articles montent —
    // mesuré sur cette semaine : +34,7 g de hausses contre 900,3 g de baisses,
    // soit −865,5 g net sur 21 218 g. Ce n'est pas une compensation du dîner
    // manquant : la cible de la journée a bien été réduite de la part du dîner.
    // C'est que le moteur vise un total de JOURNÉE et non une cible par prise
    // (`optimizeDailyPortions`) : le déjeuner du jeudi passe de 0,7 à 0,9
    // portion parce qu'il porte désormais, avec la collation, toute la part que
    // la personne prend à la maison ce jour-là. Un déjeuner plus consistant le
    // jour où l'on dîne dehors est une décision du moteur, pas un défaut —
    // et elle doit se voir plutôt que se lisser.
    expect(baisses).toBeGreaterThan(hausses * 10)
    expect(masseSans - masseAvec).toBeCloseTo(baisses - hausses, 1)
  })

  // ── CRITÈRE, TROISIÈME TIERS : le total nutritionnel exclut les absents ───
  it('n’inclut pas les repas absents dans le total nutritionnel de la semaine', () => {
    const totalAvec = ligneDePresence(avec, ABSENTE).weekly_nutrition
    const totalSans = ligneDePresence(sans, ABSENTE).weekly_nutrition
    expect(totalAvec.kcal).toBeLessThan(totalSans.kcal)
    // Le total publié est EXACTEMENT la somme des demandes publiées de la
    // personne — donc des mêmes lignes qui composent la liste de courses. Les
    // deux chiffres ne peuvent pas diverger, puisqu'ils ont la même source.
    const sommeDesDemandes = avec.planned_demands
      .filter((demande) => demande.person_name === ABSENTE)
      .reduce((somme, demande) => somme + (Number(demande.nutrition?.kcal) || 0), 0)
    expect(totalAvec.kcal).toBeCloseTo(sommeDesDemandes, 1)
    // Et la personne présente, elle, ne bouge pas d'une calorie.
    expect(ligneDePresence(avec, PRESENT).weekly_nutrition)
      .toEqual(ligneDePresence(sans, PRESENT).weekly_nutrition)
  })

  it('réduit la cible du jour de la part de la prise absente, et le dit', () => {
    for (const date of [MARDI, JEUDI]) {
      const jour = journee(avec, ABSENTE, date)
      expect(jour.presence).toEqual({
        share_of_day_at_home: 0.58,
        expected_takes: ['dejeuner', 'collation', 'diner'],
        absent_takes: ['diner'],
      })
      // La cible réduite ne voyage jamais seule : la cible déclarée et la part
      // qui les relie l'accompagnent (P18 — un chiffre affiché est calculé).
      expect(jour.target_declared.kcal).toBe(1525)
      expect(jour.target.kcal).toBeCloseTo(1525 * 0.58, 2)
      // La journée reste jugée sur ce qu'elle sert, pas sur un repas qui n'a
      // pas lieu : sans cette réduction, le déjeuner serait doublé pour
      // rattraper le dîner pris dehors, et les courses monteraient.
      expect(jour.total.kcal).toBeLessThan(journee(sans, ABSENTE, date).total.kcal)
    }
    // Un jour sans absence garde sa cible déclarée, et aucune clé en plus.
    const mercredi = journee(avec, ABSENTE, '2026-09-23')
    expect(mercredi.presence).toBeUndefined()
    expect(mercredi.target.kcal).toBe(1525)
  })

  it('n’ajoute aucune règle franchie : une absence déclarée n’est pas une semaine dégradée', () => {
    // Les deux semaines partent du même plan : la présence ne doit pas créer de
    // blocage. Si un jour elle en crée un, ce test le nomme au lieu de le taire.
    expect(bloquantes(avec)).toEqual(bloquantes(sans))
  })

  it('ne change RIEN quand aucune absence n’est déclarée', () => {
    // La garantie la plus importante du livrable : un foyer qui ne déclare rien
    // obtient exactement le plan d'avant, empreinte d'entrée comprise.
    const vide = buildCanonicalPlanPayload({ ...commun, presence: [] })
    expect(vide.input_hash).toBe(sans.input_hash)
    expect(vide).toEqual(sans)
    expect(buildWeekSlots(DEBUT, { presence: [], members: MEMBRES })).toEqual(buildWeekSlots(DEBUT))
  })

  it('garde le petit-déjeuner et la collation d’un jour où personne ne déjeune ni ne dîne à la maison', () => {
    // Un jour entier hors domicile pour les deux prises principales retire les
    // deux créneaux de la grille. Il ne retire PAS le petit-déjeuner ni la
    // collation : personne ne les a déclarés absents, et les perdre serait un
    // repas retiré que le foyer n'a pas demandé.
    expect(grilleCourte).toHaveLength(12)
    const publie = publieSansSamedi
    const duSamedi = publie.legacy_meals.filter((repas) => repas.meal_date === SAMEDI)
    expect(duSamedi.filter((repas) => PRISES_PRINCIPALES.includes(repas.meal_type))).toEqual([])
    // Julien prend un petit-déjeuner, les deux prennent une collation.
    expect(duSamedi.filter((repas) => repas.meal_type === 'pdj').map((repas) => repas.person_name)).toEqual([PRESENT])
    expect(duSamedi.filter((repas) => repas.meal_type === 'collation').map((repas) => repas.person_name).sort())
      .toEqual([PRESENT, ABSENTE].sort())
    // Et douze assiettes principales pour chacun, pas quatorze.
    expect(ligneDePresence(publie, PRESENT)).toMatchObject({ grid_main_slots: 12, main_meals: 12 })
    expect(ligneDePresence(publie, ABSENTE)).toMatchObject({ grid_main_slots: 12, main_meals: 12 })
  })

  it('distingue deux semaines qui ne diffèrent que par une absence', () => {
    // Deux semaines qui ne servent pas les mêmes assiettes ne sont pas la même
    // semaine : `input_hash` doit le dire, sans quoi une régénération pourrait
    // se croire identique et resservir l'ancienne grille.
    expect(avec.input_hash).not.toBe(sans.input_hash)
  })
})
