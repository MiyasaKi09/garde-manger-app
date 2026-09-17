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
  it('retire des deux dîners la portion de l’absente, et n’ajoute que ce que le déplafonnement rend au présent', () => {
    // C'est la forme exacte de « les quantités baissent d'autant ». Les grammes
    // d'une exécution sont strictement proportionnels à ses portions
    // (`finalDemands.js` : `scale = group.servings / recipe.servings`) : montrer
    // que les portions du créneau tombent de la portion retirée, c'est montrer
    // que les grammes tombent dans la même proportion.
    //
    // CE QUE CE TEST EXIGEAIT AVANT, ET POURQUOI IL A CHANGÉ — la définition
    // bouge ici, on l'écrit, et la cible se refixe avec elle.
    //
    // Il exigeait l'ÉGALITÉ STRICTE : portions(avec) = portions(sans) − portion
    // de l'absente. Cette égalité n'est pas une propriété du moteur, c'est une
    // propriété de la semaine sur laquelle il avait été écrit. Le solveur de
    // portions est JOINT (`optimizeCoupledDailyPortions`) : sur un plat
    // partagé, les deux assiettes sont choisies ensemble et leur rapport est
    // borné par `MAX_MEMBER_PORTION_RATIO`. Quand ce plafond est SATURÉ, le
    // membre qui mange le plus est tenu en dessous de son optimum par celui qui
    // mange le moins. Retirer l'assiette du second lève la borne, et le premier
    // remonte à son optimum. MESURÉ sur la semaine servie par le corpus après
    // le livrable 2.1 : au dîner du 22 septembre (SRC-038-D3, portions
    // reprises d'une production), Zoé est à 0,6 et Julien à 1,2 — rapport 2,00,
    // exactement le plafond ; Zoé absente, Julien passe à 1,3. Le créneau perd
    // 0,5 portion au lieu de 0,6.
    //
    // La cible refixée est donc : le créneau BAISSE, il ne monte jamais ; la
    // baisse vaut la portion de l'absente moins ce que le présent reprend ; et
    // ce que le présent reprend n'est JAMAIS gratuit — il faut que la borne de
    // couplage ait été saturée sans elle. Sans cette dernière clause, le test
    // accepterait n'importe quelle hausse : c'est elle qui fait qu'il ne peut
    // passer que pour la bonne raison.
    let creneauxMesures = 0
    let creneauxDeplafonnes = 0
    for (const creneau of [`${MARDI}-diner`, `${JEUDI}-diner`]) {
      const date = creneau.slice(0, 10)
      const portions = (payload, personne = null) => payload.planned_demands
        .filter((demande) => demande.slot_key === creneau
          && (personne == null || demande.person_name === personne))
        .reduce((somme, demande) => somme + (Number(demande.requested_servings) || 0), 0)

      const saPortion = portions(sans, ABSENTE)
      expect(saPortion, creneau).toBeGreaterThan(0)
      // L'assiette retirée l'est vraiment : zéro demande, pas une demande à zéro.
      expect(portions(avec, ABSENTE), creneau).toBe(0)

      // Le présent ne perd rien, et ce qu'il gagne est mesuré.
      const sienAvant = portions(sans, PRESENT)
      const sienApres = portions(avec, PRESENT)
      expect(sienApres, `${creneau} : l’absence de l’autre ne réduit pas l’assiette du présent`)
        .toBeGreaterThanOrEqual(sienAvant - 1e-9)
      const repris = sienApres - sienAvant

      // Le compte du créneau se ferme exactement, sans terme inexpliqué.
      expect(portions(avec), creneau).toBeCloseTo(portions(sans) - saPortion + repris, 3)
      expect(portions(avec), `${creneau} : le créneau doit baisser`).toBeLessThan(portions(sans))

      // Et toute reprise est JUSTIFIÉE : sans l'absence, le rapport entre les
      // deux assiettes de ce créneau touchait le plafond de couplage. Un moteur
      // qui remonterait la portion du présent sans cette saturation servirait
      // plus de nourriture qu'il n'en faut à qui est là, et ce test doit le
      // refuser.
      if (repris > 1e-9) {
        creneauxDeplafonnes += 1
        const jour = journee(sans, PRESENT, date)
        expect(jour.portion_ratio_dinner, `${creneau} : hausse sans couplage saturé`)
          .toBeCloseTo(jour.portion_ratio_cap, 6)
      }
      creneauxMesures += 1
    }
    expect(creneauxMesures).toBe(2)
    // Témoin : sur la semaine mesurée, exactement un des deux dîners est
    // déplafonné. Si ce compte tombait à zéro, la clause de justification
    // ci-dessus ne serait plus exercée par aucun cas et passerait à vide.
    expect(creneauxDeplafonnes).toBe(1)
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
    // ET LA PERSONNE PRÉSENTE. Ce test exigeait qu'elle « ne bouge pas d'une
    // calorie » sur la semaine entière. Pour la même raison que le test des
    // portions ci-dessus — le solveur est JOINT, et lever l'assiette de l'autre
    // lève la borne de couplage qui tenait la sienne —, cette égalité n'est pas
    // une propriété du moteur : elle ne vaut que les jours où la borne n'était
    // pas saturée. La définition change donc, et la cible se refixe avec elle,
    // en deux clauses qui disent chacune quelque chose de vérifiable :
    //   — AUCUN jour sans absence déclarée ne change, au macro près. C'est la
    //     vraie garantie de la présence : elle n'agit que là où elle est
    //     déclarée. Cette clause-là n'est pas affaiblie, elle est isolée.
    //   — Les jours AVEC absence peuvent bouger, mais la journée du présent
    //     reste VALIDE et sa cible ne change pas.
    //
    // SECONDE CORRECTION DE CETTE CLAUSE, AU LIVRABLE 3.1, ET IL FAUT LA LIRE.
    // Elle exigeait de surcroît que l'écart d'énergie du présent « ne puisse que
    // diminuer » — « le moteur a le droit de mieux servir quelqu'un dont le
    // voisin est sorti ; il n'a pas le droit de le servir plus mal ». La phrase
    // est juste ; la grandeur était fausse. Le solveur ne minimise PAS l'écart
    // d'énergie : `optimizeDailyPortions` minimise un score composite —
    // `macroScore` plus l'écart d'énergie au carré, plus les pénalités de
    // portion — et n'admet un candidat que si son écart d'énergie tient déjà
    // dans la tolérance de ±5 % (c'est exactement ce que `valid` rapporte).
    // Entre deux candidats tolérés, il choisit donc le mieux équilibré, pas le
    // plus proche en calories.
    //
    // MESURÉ sur la semaine servie après le livrable 3.1, mardi, pour Julien
    // (cible 2 357 kcal, 216 g de protéines) :
    //   — sans absence : déjeuner VAR-029 × 1,4 + dîner SRC-038-D3 × 1,2
    //     → 2 299,2 kcal (écart 2,45 %), 145,90 g de protéines ;
    //   — avec l'absence de Zoé au dîner : × 1,2 et × 1,4
    //     → 2 287,4 kcal (écart 2,95 %), 148,84 g de protéines.
    // Le solveur a déplacé une portion du déjeuner vers le dîner : il perd
    // 11,8 kcal de précision énergétique et gagne 2,94 g de protéines, sur la
    // journée d'un membre dont le plancher protéique est justement relâché
    // (`protein_gate_relaxed` vrai des deux côtés). C'est un meilleur service,
    // pas un moins bon — et l'ancienne clause l'aurait refusé. Jeudi, rien ne
    // bouge.
    //
    // CE QUI N'EST PAS AFFAIBLI. Aucun critère P1–P18 ne passe par cette clause.
    // Les trois garanties de la présence — douze assiettes au lieu de quatorze,
    // des quantités de courses qui baissent d'autant, un total nutritionnel qui
    // exclut les repas absents — sont éprouvées ailleurs dans ce fichier et
    // n'ont pas changé. Ce qui est retiré ici est une monotonie qu'aucune ligne
    // du moteur n'implémente et que la semaine d'alors vérifiait par hasard.
    //
    // CE QU'ON A ÉCARTÉ : asserter le score composite lui-même, qui lui est bien
    // monotone. Il n'est publié nulle part, et le publier pour un test
    // reviendrait à exposer une grandeur interne dont aucun écran n'a l'usage.
    const joursPresent = sans.validation_summary.daily_nutrition
      .filter((jour) => jour.person_name === PRESENT)
    expect(joursPresent.length).toBeGreaterThan(0)
    let joursDeplaces = 0
    for (const jourSans of joursPresent) {
      const jourAvec = journee(avec, PRESENT, jourSans.meal_date)
      if ([MARDI, JEUDI].includes(jourSans.meal_date)) {
        expect(jourAvec.target, `${jourSans.meal_date} : la cible du présent a bougé`).toEqual(jourSans.target)
        // `valid` EST la borne : il vaut `energy_deviation <= 5 %`
        // (`personalizedMeals.js`). L'exiger vrai, c'est exiger que la journée du
        // présent reste dans la tolérance du solveur, des deux côtés.
        expect(jourSans.valid, `${jourSans.meal_date} : journée invalide sans absence`).toBe(true)
        expect(jourAvec.valid, `${jourSans.meal_date} : journée du présent sortie de la tolérance`).toBe(true)
        if (Math.abs(jourAvec.total.kcal - jourSans.total.kcal) > 1e-6) joursDeplaces += 1
        continue
      }
      // Un jour où personne n'a rien déclaré est intouchable : si l'un d'eux
      // bougeait, la présence agirait au-delà de ce qu'elle déclare.
      expect(jourAvec.total, `${jourSans.meal_date} : jour sans déclaration modifié`)
        .toEqual(jourSans.total)
    }
    // Sur la semaine mesurée, un seul des deux dîners déclarés déplace le
    // présent — le même que celui du test des portions.
    expect(joursDeplaces).toBe(1)
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
