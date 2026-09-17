import { describe, expect, it } from 'vitest'
import {
  CUISINE_PIVOT_BASCULE,
  DAIRY_EGG_PROTEIN_FAMILIES,
  DEFAULT_WEEKLY_CAPS,
  PASTA_STARCH_FAMILY,
  RAISONS_REGIME_PLAFONDS,
  SEUIL_BASCULE_PLAFONDS,
  capaciteDuVivier,
  plafondDuFeculent,
  resolveRegimeDesPlafonds,
  weeklyBalanceFor,
} from '@/lib/domain/planning/weeklyBalance'
import { classifyRecipe, generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { repartitionCuisines } from '@/lib/domain/recipes/cuisineArbitrage'

/**
 * LES PLAFONDS DE FÉCULENT, DE PROTÉINE LAITIÈRE OU D'ŒUF ET DE CUISINE —
 * livrable 3.1, et surtout LA BASCULE QUI LES ARME.
 *
 * CE QUE LE PLAN DEMANDE, MOT POUR MOT (§5, phase 3, note de risque (a)) :
 * « Les plafonds P2/P3 sur un vivier à 71,5 % France peuvent rendre la semaine
 * infaisable. Parade : ils n'entrent en vigueur COMME REFUS qu'au jalon C6 où
 * la France passe sous 50 % du vivier ; d'ici là ce sont des avertissements
 * mesurés, affichés, jamais des blocages silencieux. »
 *
 * IL Y A DONC DEUX COMPORTEMENTS À TENIR, ET LE PIÈGE EST DE N'EN TESTER QU'UN.
 * Un plafond qui refuserait aujourd'hui rendrait la semaine infaisable — cinq
 * créneaux français au plus sur quatorze, sur un vivier où la France pèse
 * 72,4 % (411 des 568 publiables ; 57,6 % sur le corpus entier, dont les 186
 * non publiables sont nettement moins françaises — c'est le vivier REÇU qui
 * décide) : le solveur ne trouverait rien à mettre dans les neuf autres et
 * rendrait `no_feasible_plan`, c'est-à-dire aucune semaine du tout. Un plafond
 * qui ne refuserait JAMAIS, à l'inverse, serait un commentaire. Ce fichier
 * éprouve les deux sens sur le même vivier artificiel, en ne changeant qu'une
 * chose : la part de la France.
 *
 * ET UN TROISIÈME COMPORTEMENT, LE PLUS FACILE À RATER : désarmé, le plafond ne
 * doit RIEN déplacer. Pas seulement « ne rien refuser » — ne pas peser non plus
 * sur le choix de la semaine. `deficitWeight` est la deuxième clé de tri des
 * semaines finalistes, avant le score ; y verser les dépassements en aurait
 * fait une pénalité que personne ne voit. Le dernier test de ce fichier compare
 * la semaine servie avec et sans plafonds déclarés, créneau par créneau.
 *
 * Le vivier est ARTIFICIEL, comme dans `plancherDensiteProteique.test.js` : ce
 * qu'on éprouve ici est la mécanique. Les chiffres du corpus réel — P2, P3, P13
 * sur trois semaines — sont mesurés par `tests/planning/rapportQualiteSemaine.test.js`.
 */

// ─── Le vivier artificiel ──────────────────────────────────────────────────
// Un plat par (cuisine, féculent, protéine), assez varié pour que le solveur
// ait le choix : c'est le plafond qui doit trancher, pas la pénurie.
const FECULENTS = {
  pates: { nom: 'Tagliatelle', forme: 'tagliatelle seches' },
  riz: { nom: 'Riz', forme: 'riz basmati' },
  pomme_de_terre: { nom: 'Pomme de terre', forme: 'pommes de terre' },
  semoule: { nom: 'Semoule', forme: 'semoule fine' },
  quinoa: { nom: 'Quinoa', forme: 'quinoa blanc' },
}
const PROFILS = ['warm_aromatic', 'fresh_herbal', 'smoky', 'sweet_sour', 'creamy']

const recette = (code, { cuisine, feculent, proteine, profil }) => ({
  code,
  family: `Plat ${code}`,
  title: `Plat ${code}`,
  eligible: true,
  servings: 2,
  prepMinutes: 20,
  cookMinutes: 20,
  cuisineOrigin: cuisine,
  category: 'plat mijote',
  nutritionPerServing: { kcal: 600, proteinG: 40, carbsG: 60, fatG: 18, fiberG: 7 },
  exactIngredients: [
    {
      name: proteine.nom,
      formNormalized: proteine.forme,
      category: proteine.categorie,
      role: 'protéine',
      grams: 180,
      origin: proteine.origine,
      per100g: { kcal: 150, proteinG: 18, carbsG: 2, fatG: 8, fiberG: 0 },
    },
    {
      name: FECULENTS[feculent].nom,
      formNormalized: FECULENTS[feculent].forme,
      category: 'feculents',
      role: 'féculent',
      grams: 120,
      origin: 'vegetal',
      per100g: { kcal: 350, proteinG: 12, carbsG: 70, fatG: 1.5, fiberG: 3 },
    },
  ],
  sensory: { profile: profil, scores: { richness: 3 } },
})

// `vegetal` et `laitiers` sont exemptés du plafond PAR FAMILLE
// (`UNCAPPED_PROTEIN_FAMILIES`) : sans cela, deux plats de la même protéine
// suffiraient à saturer la semaine pour une raison étrangère à ce livrable.
const TOFU = { nom: 'Tofu', forme: 'tofu ferme', categorie: 'legumineuses', origine: 'vegetal' }
const FROMAGE = { nom: 'Comté', forme: 'comte', categorie: 'produits laitiers', origine: 'animal:lait' }
const OEUF = { nom: 'Oeuf', forme: 'oeuf entier', categorie: 'oeufs', origine: 'animal:oeuf' }

/**
 * Construit un vivier où la France occupe exactement `partFrance` des plats.
 *
 * C'est le SEUL paramètre qui change d'un scénario à l'autre : la bascule du
 * plan porte sur la part de la France dans le VIVIER, pas dans la semaine.
 */
const vivier = ({ platsFrance, autresCuisines, platsParAutreCuisine, proteine = TOFU }) => {
  const feculents = Object.keys(FECULENTS)
  const plats = []
  for (let index = 0; index < platsFrance; index += 1) {
    plats.push(recette(`FR-${index}`, {
      // Quatre écritures différentes de la même cuisine : l'arbitrage les
      // compte une fois, et c'est précisément ce que P13 exige.
      cuisine: ['France', 'France / cuisine domestique internationale', 'France (Bourgogne)', 'France (Lyon)'][index % 4],
      feculent: feculents[index % feculents.length],
      proteine,
      profil: PROFILS[index % PROFILS.length],
    }))
  }
  for (const [rang, cuisine] of autresCuisines.entries()) {
    for (let index = 0; index < platsParAutreCuisine; index += 1) {
      plats.push(recette(`${cuisine.slice(0, 3).toUpperCase()}-${index}`, {
        cuisine,
        feculent: feculents[(rang + index) % feculents.length],
        proteine,
        profil: PROFILS[(rang + index) % PROFILS.length],
      }))
    }
  }
  return plats
}

const CUISINES_ETRANGERES = ['Italie', 'Japon', 'Mexique', 'Grèce', 'Inde', 'Maroc', 'Chine', 'Espagne', 'Portugal', 'Thaïlande']
const SLOTS = buildWeekSlots('2026-09-21')
const CIBLE = { kcal: 600, proteinG: 40, carbsG: 60, fatG: 20, fiberG: 8 }

/**
 * DEUX RÉGLAGES DISTINCTS, ET IL FAUT LES DISTINGUER POUR LIRE CE FICHIER.
 *
 * — `constraints.weeklyBalance` porte les BORNES, plafonds de part compris
 *   (`pastaMaxShare`, `starchMaxShare`, `dairyEggProteinMaxShare`,
 *   `cuisineMaxShare`) : elles rejoignent les neuf bornes historiques du foyer
 *   dans le même objet, parce que ce sont des bornes comme les autres ;
 * — `constraints.weeklyCaps.enforce` porte le RÉGIME : les plafonds
 *   refusent-ils, ou se contentent-ils d'avertir ? C'est une décision sur la
 *   bascule, pas une borne, et la mêler aux autres aurait laissé croire qu'on
 *   peut « régler » un refus comme on règle un nombre de repas.
 */
const planifier = (recipes, constraintsEnPlus = {}) => generateClosedLoopPlan({
  slots: SLOTS,
  recipes,
  inventoryLots: [],
  constraints: {
    allowShopping: true,
    targetByMeal: { dejeuner: CIBLE, diner: CIBLE },
    maxMinutesByMeal: { dejeuner: 120, diner: 240 },
    preferredActiveMinutes: 30,
    ...constraintsEnPlus,
  },
  beamWidth: 12,
})

const cuisinesServies = (plan) => plan.objectiveScores.weeklyActual.cuisinesBySlot
const feculentsServis = (plan) => plan.objectiveScores.weeklyActual.starchesBySlot

describe('les bornes elles-mêmes, avant toute semaine', () => {
  it('traduit une part en créneaux par le bas, jamais par le haut', () => {
    // `floor(0,15 × 14)` vaut 2, pas 3. Arrondir au supérieur autoriserait
    // 3/14 = 21,4 % sous une borne écrite « ≤ 15 % » : le critère serait tenu à
    // l'écran et dépassé dans l'assiette.
    const cibles = weeklyBalanceFor({ totalSlots: 14 })
    expect(cibles).toMatchObject({ pastaMax: 2, starchMax: 3, dairyEggProteinMax: 2, cuisineMax: 5 })
    expect(cibles).toMatchObject({
      pastaMaxShare: 0.15, starchMaxShare: 0.25, dairyEggProteinMaxShare: 0.2, cuisineMaxShare: 0.4,
    })
    expect(DEFAULT_WEEKLY_CAPS.pastaMaxShare * 14).toBeGreaterThan(cibles.pastaMax)
  })

  it('ne descend jamais à zéro créneau sur une fenêtre courte', () => {
    // Une régénération de trois créneaux donnerait `floor(0,15 × 3) = 0`,
    // c'est-à-dire « aucune assiette de pâtes autorisée ». Une part ne peut pas
    // se traduire en interdiction pure sans cesser d'être une part.
    expect(weeklyBalanceFor({ totalSlots: 3 })).toMatchObject({
      pastaMax: 1, starchMax: 1, dairyEggProteinMax: 1, cuisineMax: 1,
    })
  })

  it('applique la borne serrée aux seules pâtes', () => {
    const cibles = weeklyBalanceFor({ totalSlots: 14 })
    expect(plafondDuFeculent(PASTA_STARCH_FAMILY, cibles)).toBe(2)
    expect(plafondDuFeculent('riz', cibles)).toBe(3)
    expect(plafondDuFeculent('pomme_de_terre', cibles)).toBe(3)
  })

  it('vaut aussi pour un foyer végétarien', () => {
    // Le régime tranche la protéine, pas le féculent ni la cuisine. Exempter un
    // foyer végétarien en ferait le seul à qui l'on servirait cinq assiettes de
    // pâtes sans le lui dire.
    expect(weeklyBalanceFor({ totalSlots: 14, vegetarianDiet: true })).toMatchObject({
      pastaMax: 2, starchMax: 3, dairyEggProteinMax: 2, cuisineMax: 5, meatMax: 0,
    })
  })

  it('P3 porte sur la SOMME des deux familles, et le plafond par famille ne la tient pas', () => {
    // La correction la plus directe — retirer 'laitiers' et 'oeufs' de
    // UNCAPPED_PROTEIN_FAMILIES — autoriserait 2 + 2 = 4 repas sur 14, soit
    // 28,6 %, quand P3 demande 20 %. Elle ne tient donc pas le critère qu'elle
    // prétend corriger ; c'est pourquoi le plafond est un agrégat.
    expect(DAIRY_EGG_PROTEIN_FAMILIES).toEqual(['laitiers', 'oeufs'])
    const cibles = weeklyBalanceFor({ totalSlots: 14 })
    expect(DAIRY_EGG_PROTEIN_FAMILIES.length * cibles.maxMealsPerProteinFamily).toBeGreaterThan(cibles.dairyEggProteinMax)
  })
})

describe('la bascule — ce qui décide qu’un plafond refuse au lieu d’avertir', () => {
  const compter = (recipes) => resolveRegimeDesPlafonds({
    cuisineLabels: recipes.map((recipe) => recipe.cuisineOrigin),
    repartition: repartitionCuisines,
  })

  it('le pivot est la France, écrite telle quelle par le plan — pas « la cuisine dominante »', () => {
    expect(CUISINE_PIVOT_BASCULE).toBe('france')
    expect(SEUIL_BASCULE_PLAFONDS).toBe(0.5)
    // Le cas qui sépare les deux lectures : l'Italie domine, mais la France est
    // sous le seuil. La règle du plan arme ; une règle écrite sur la dominante
    // n'aurait pas armé. Les deux grandeurs sont rendues, c'est la première qui
    // décide.
    const regime = compter(vivier({ platsFrance: 8, autresCuisines: ['Italie'], platsParAutreCuisine: 22 }))
    expect(regime.dominante).toBe('italie')
    expect(regime.actif).toBe(true)
    expect(regime.partPivot).toBeCloseTo(8 / 30, 6)
  })

  it('désarme tant que la France tient plus de la moitié du vivier, et le dit', () => {
    const regime = compter(vivier({ platsFrance: 20, autresCuisines: CUISINES_ETRANGERES, platsParAutreCuisine: 1 }))
    expect(regime.actif).toBe(false)
    expect(regime.raison).toBe(RAISONS_REGIME_PLAFONDS.PIVOT_AU_DESSUS_DU_SEUIL)
    expect(regime.partPivot).toBeCloseTo(20 / 30, 6)
    expect(regime.cuisines).toBe(11)
  })

  it('ne décide pas sur du vide : sans vivier, la part n’est pas nulle, elle est incalculable', () => {
    const regime = compter([])
    expect(regime.actif).toBe(false)
    expect(regime.raison).toBe(RAISONS_REGIME_PLAFONDS.VIVIER_VIDE)
    // `null` et non 0 : rendre 0 ferait croire que la France a disparu du
    // vivier, et armer des refus sur une mesure absente serait décider sur du
    // vide (P18).
    expect(regime.partPivot).toBeNull()
    expect(regime.recettesPivot).toBeNull()
  })

  it('laisse le foyer trancher lui-même, dans les deux sens, et le rend visible', () => {
    const franceHaute = vivier({ platsFrance: 20, autresCuisines: CUISINES_ETRANGERES, platsParAutreCuisine: 1 })
    const force = resolveRegimeDesPlafonds({
      cuisineLabels: franceHaute.map((recipe) => recipe.cuisineOrigin),
      repartition: repartitionCuisines,
      declare: true,
    })
    expect(force).toMatchObject({ actif: true, raison: RAISONS_REGIME_PLAFONDS.DECLARE_PAR_LE_FOYER })
    // La mesure reste rendue à côté de la décision : on doit pouvoir lire que
    // le foyer a armé les plafonds CONTRE ce que la mesure conseillait.
    expect(force.partPivot).toBeCloseTo(20 / 30, 6)
    const desarme = resolveRegimeDesPlafonds({
      cuisineLabels: vivier({ platsFrance: 4, autresCuisines: CUISINES_ETRANGERES, platsParAutreCuisine: 3 })
        .map((recipe) => recipe.cuisineOrigin),
      repartition: repartitionCuisines,
      declare: false,
    })
    expect(desarme).toMatchObject({ actif: false, raison: RAISONS_REGIME_PLAFONDS.DECLARE_PAR_LE_FOYER })
  })

  it('compte les libellés composites UNE fois, et signale ceux qu’aucune décision ne couvre', () => {
    const regime = resolveRegimeDesPlafonds({
      cuisineLabels: ['France', 'France (Bourgogne)', 'France / cuisine domestique internationale', 'Atlantide'],
      repartition: repartitionCuisines,
    })
    expect(regime.partPivot).toBeCloseTo(3 / 4, 6)
    expect(regime.cuisines).toBe(2)
    // Un libellé non arbitré fausse la part d'autant : il faut que cela se voie
    // plutôt que de se deviner.
    expect(regime.libellesNonArbitres).toEqual(['Atlantide'])
  })
})

describe('régime DÉSARMÉ — la semaine d’aujourd’hui : on avertit, on n’écarte rien', () => {
  // Vingt plats français et quatre plats étrangers : 83 % de France, très
  // au-dessus du seuil, et surtout un vivier où le moteur ne PEUT PAS tenir le
  // plafond de cuisine même s'il le voulait. C'est délibéré : sur un vivier
  // largement diversifié, la diversité déjà recherchée par `cuisinesMin` et le
  // malus de cuisine répétée suffisent à rester sous la borne, et le test ne
  // dirait plus rien sur le dépassement. Mesuré ici : dix créneaux français
  // sur quatorze, pour un plafond de cinq.
  const RECETTES = vivier({ platsFrance: 20, autresCuisines: ['Italie', 'Japon'], platsParAutreCuisine: 2 })
  const plan = planifier(RECETTES)

  it('rend une semaine COMPLÈTE, et publie le régime avec la mesure qui l’a décidé', () => {
    expect(plan.slots).toHaveLength(14)
    expect(plan.issues.some((issue) => issue.code === 'no_feasible_plan')).toBe(false)
    expect(plan.objectiveScores.weeklyCaps).toMatchObject({
      enforced: false,
      reason: RAISONS_REGIME_PLAFONDS.PIVOT_AU_DESSUS_DU_SEUIL,
      pivot: 'france',
      threshold: 0.5,
      poolSize: 24,
      unarbitratedLabels: [],
    })
    expect(plan.objectiveScores.weeklyCaps.pivotShare).toBeCloseTo(20 / 24, 3)
  })

  it('sert plus de créneaux français que le plafond, et l’ÉCRIT au lieu de le taire', () => {
    // LE CŒUR DU LIVRABLE. Le plafond de cuisine vaut 5 créneaux sur 14 ; le
    // vivier étant aux deux tiers français, la semaine le dépasse. Elle sort
    // quand même — aucun plat n'est écarté — et le dépassement est nommé,
    // chiffré, publié. C'est ce que le plan appelle un avertissement mesuré.
    expect(cuisinesServies(plan).france).toBeGreaterThan(plan.objectiveScores.weeklyTargets.cuisineMax)
    const avertissement = plan.issues.find((issue) => issue.code === 'cuisine_cap_france')
    expect(avertissement).toMatchObject({ severity: 'warning' })
    expect(avertissement.missing)
      .toBe(cuisinesServies(plan).france - plan.objectiveScores.weeklyTargets.cuisineMax)
    // Et il se relit aussi là où on va le chercher : à côté du régime.
    expect(plan.objectiveScores.weeklyCaps.overruns.map((depassement) => depassement.code))
      .toContain('cuisine_cap_france')
    expect(plan.objectiveScores.weeklyCapOverruns).toBe(plan.objectiveScores.weeklyCaps.overruns.length)
  })

  it('publie le détail créneau par créneau, pas un verdict', () => {
    // Un plafond qui ne publie que « tenu » ou « dépassé » ne se conteste pas.
    const cuisines = cuisinesServies(plan)
    const feculents = feculentsServis(plan)
    expect(Object.values(cuisines).reduce((total, compte) => total + compte, 0)).toBe(14)
    expect(Object.values(feculents).reduce((total, compte) => total + compte, 0)).toBeLessThanOrEqual(14)
    expect(plan.objectiveScores.weeklyActual.cuisines).toBe(Object.keys(cuisines).length)
    // ZÉRO PARCE QUE CE VIVIER EST ENTIÈREMENT AU TOFU, et il faut le dire :
    // aucune assertion de ce `describe` ni du suivant n'éprouve donc le
    // quatrième plafond, celui de P3. Un `toBeLessThanOrEqual` sur une valeur
    // toujours nulle ne peut pas échouer. Le plafond laitiers/œufs a son propre
    // vivier plus bas — « le quatrième plafond » —, où il est armé, désarmé, et
    // les deux semaines comparées.
    expect(plan.objectiveScores.weeklyActual.dairyEggProtein).toBe(0)
    // Les deux volets de P2 se relisent sur cette ligne, sans recalcul : la
    // semaine sert quatre assiettes de pâtes sur quatorze (28,6 %) pour un
    // plafond de deux, et le dépassement est écrit.
    expect(feculents.pates).toBeGreaterThan(plan.objectiveScores.weeklyTargets.pastaMax)
    expect(plan.objectiveScores.weeklyCaps.overruns.map((depassement) => depassement.code))
      .toContain('starch_cap_pates')
  })

  it('ne pèse RIEN sur le choix de la semaine tant qu’il est désarmé', () => {
    // LE TEST LE PLUS IMPORTANT DE CE FICHIER, et celui qu'on rate en premier.
    // « N'écarte aucun plat » ne suffit pas : `deficitWeight` est la deuxième
    // clé de tri des semaines finalistes, avant le score. Un dépassement versé
    // dans les déficits aurait déplacé la semaine servie sans rien refuser et
    // sans que personne le voie. On compare donc la semaine désarmée à une
    // semaine où les plafonds sont réglés si bas qu'ils sont tous dépassés : si
    // elle bougeait d'un créneau, c'est qu'ils pèsent.
    const plafondsAbsurdes = planifier(RECETTES, {
      weeklyBalance: { pastaMaxShare: 0.05, starchMaxShare: 0.05, cuisineMaxShare: 0.05 },
    })
    expect(plafondsAbsurdes.objectiveScores.weeklyCaps.enforced).toBe(false)
    expect(plafondsAbsurdes.slots.map((slot) => slot.recipeCode))
      .toEqual(plan.slots.map((slot) => slot.recipeCode))
    // Les bornes, elles, ont bien changé — le test compare deux semaines
    // réglées différemment, pas deux fois la même.
    expect(plafondsAbsurdes.objectiveScores.weeklyTargets.cuisineMax).toBe(1)
    expect(plafondsAbsurdes.objectiveScores.weeklyCapOverruns)
      .toBeGreaterThan(plan.objectiveScores.weeklyCapOverruns)
  })
})

describe('régime ARMÉ — le jalon C6 : le plafond refuse, et la semaine tient encore', () => {
  // Huit plats français sur trente-huit : 21 %, sous le seuil. C'est le vivier
  // que la phase 5 doit produire, simulé ici.
  const RECETTES = vivier({ platsFrance: 8, autresCuisines: CUISINES_ETRANGERES, platsParAutreCuisine: 3 })
  const plan = planifier(RECETTES)

  it('s’arme sur la mesure, et le dit', () => {
    expect(plan.objectiveScores.weeklyCaps).toMatchObject({
      enforced: true,
      reason: RAISONS_REGIME_PLAFONDS.PIVOT_SOUS_LE_SEUIL,
      pivot: 'france',
    })
    expect(plan.objectiveScores.weeklyCaps.pivotShare).toBeCloseTo(8 / 38, 3)
  })

  it('tient TROIS des quatre plafonds sur la semaine servie, sans la rendre infaisable', () => {
    // TROIS ET PAS QUATRE, sur CE vivier : il est entièrement au tofu, donc la
    // ligne `dairyEggProtein` ci-dessous vaut zéro quoi qu'il arrive. Elle est
    // gardée — une régression qui ferait entrer un laitier ici doit se voir —
    // mais elle ne PROUVE rien du quatrième plafond. C'est le dernier
    // `describe` de ce fichier qui l'éprouve, sur un vivier qui en porte.
    expect(plan.slots).toHaveLength(14)
    const cibles = plan.objectiveScores.weeklyTargets
    for (const [cuisine, compte] of Object.entries(cuisinesServies(plan))) {
      expect(compte, `cuisine ${cuisine}`).toBeLessThanOrEqual(cibles.cuisineMax)
    }
    for (const [feculent, compte] of Object.entries(feculentsServis(plan))) {
      expect(compte, `féculent ${feculent}`).toBeLessThanOrEqual(plafondDuFeculent(feculent, cibles))
    }
    expect(plan.objectiveScores.weeklyActual.dairyEggProtein).toBeLessThanOrEqual(cibles.dairyEggProteinMax)
    expect(plan.objectiveScores.weeklyCaps.overruns).toEqual([])
    expect(plan.issues.some((issue) => String(issue.code).endsWith('_cap')
      || String(issue.code).startsWith('cuisine_cap_') || String(issue.code).startsWith('starch_cap_'))).toBe(false)
  })

  it('P2, P3 et P13 sont tenus sur cette semaine — les trois cibles du plan', () => {
    const creneaux = plan.slots.length
    const feculents = feculentsServis(plan)
    expect((feculents[PASTA_STARCH_FAMILY] || 0) / creneaux).toBeLessThanOrEqual(DEFAULT_WEEKLY_CAPS.pastaMaxShare)
    for (const compte of Object.values(feculents)) {
      expect(compte / creneaux).toBeLessThanOrEqual(DEFAULT_WEEKLY_CAPS.starchMaxShare)
    }
    expect(plan.objectiveScores.weeklyActual.dairyEggProtein / creneaux)
      .toBeLessThanOrEqual(DEFAULT_WEEKLY_CAPS.dairyEggProteinMaxShare)
    for (const compte of Object.values(cuisinesServies(plan))) {
      expect(compte / creneaux).toBeLessThanOrEqual(DEFAULT_WEEKLY_CAPS.cuisineMaxShare)
    }
    // LE SECOND VOLET DE P13 — « au moins 8 cuisines distinctes » — N'EST PAS
    // TENU ICI, ET IL NE DOIT PAS L'ÊTRE. Il se mesure sur TROIS semaines
    // (42 créneaux), c'est le protocole du §9.1, et c'est
    // `tests/planning/rapportQualiteSemaine.test.js` qui le rapporte. Sur une
    // semaine de quatorze créneaux, un plafond de cinq n'oblige qu'à trois
    // cuisines ; en exiger huit ici reviendrait à inventer un critère que le
    // plan n'écrit pas. Mesuré sur ce vivier : 5 cuisines distinctes.
    expect(plan.objectiveScores.weeklyActual.cuisines)
      .toBeGreaterThanOrEqual(Math.ceil(creneaux / plan.objectiveScores.weeklyTargets.cuisineMax))
  })

  it('un foyer peut armer les plafonds avant le jalon, et la semaine les tient', () => {
    // La sortie de secours : `weeklyCaps.enforce` l'emporte sur la MESURE du
    // jalon. Sur un vivier aux deux tiers français mais largement diversifié —
    // dix cuisines étrangères —, les plafonds armés à la main écartent pour de
    // bon, et la semaine sort entière sous la borne.
    const franceHaute = vivier({ platsFrance: 20, autresCuisines: CUISINES_ETRANGERES, platsParAutreCuisine: 1 })
    const force = planifier(franceHaute, { weeklyCaps: { enforce: true } })
    expect(force.objectiveScores.weeklyCaps).toMatchObject({
      enforced: true, reason: RAISONS_REGIME_PLAFONDS.DECLARE_PAR_LE_FOYER,
    })
    expect(force.slots).toHaveLength(14)
    for (const [cuisine, compte] of Object.entries(cuisinesServies(force))) {
      expect(compte, `cuisine ${cuisine}`).toBeLessThanOrEqual(force.objectiveScores.weeklyTargets.cuisineMax)
    }
  })

  it('mais la déclaration du foyer ne force pas un vivier qui ne peut pas suivre', () => {
    // LE GARDE-FOU QUI ÉVITE LA SEMAINE VIDE, et il l'emporte même sur une
    // demande explicite. Vingt plats français et quatre étrangers : au plus
    // 5 + 5 + 5 = 15 créneaux tenables sous le plafond de cuisine, mais un seul
    // féculent ne peut porter que trois créneaux et le vivier n'en propose pas
    // assez d'autres — le majorant tombe sous quatorze. Armer ici ne
    // produirait pas une semaine plus variée : il produirait une semaine
    // incomplète. Le régime se désarme donc, et il NOMME la raison au lieu de
    // rendre silencieusement une demande non exaucée.
    const vivierEtroit = vivier({ platsFrance: 20, autresCuisines: ['Italie', 'Japon'], platsParAutreCuisine: 2 })
    const force = planifier(vivierEtroit, { weeklyCaps: { enforce: true } })
    expect(force.objectiveScores.weeklyCaps).toMatchObject({
      enforced: false, reason: RAISONS_REGIME_PLAFONDS.VIVIER_TROP_ETROIT,
    })
    expect(force.slots).toHaveLength(14)
    // Et le dépassement reste rapporté : désarmé n'est pas muet.
    expect(force.objectiveScores.weeklyCaps.overruns.map((depassement) => depassement.code))
      .toContain('cuisine_cap_france')
  })
})

describe('ce que la classification rend, une fois l’arbitrage branché', () => {
  it('range quatre écritures de la France sous une seule cuisine', () => {
    // Le moteur voyait quatre cuisines là où il y en a une : `cuisinesMin`, le
    // bonus de cuisine nouvelle et le regroupement sensoriel comptaient tous
    // une diversité qui n'existait pas.
    const cuisines = ['France', 'France / cuisine domestique internationale', 'France (Bourgogne)', 'France (Lyon)']
      .map((cuisine, index) => classifyRecipe(recette(`X-${index}`, {
        cuisine, feculent: 'riz', proteine: TOFU, profil: 'warm_aromatic',
      })).cuisine)
    expect(new Set(cuisines)).toEqual(new Set(['france']))
  })

  it('compte les laitiers en protéine principale, ce que P3 mesure', () => {
    const classification = classifyRecipe(recette('FROM-0', {
      cuisine: 'France', feculent: 'pates', proteine: FROMAGE, profil: 'creamy',
    }))
    expect(classification.mainProtein).toBe('laitiers')
    expect(DAIRY_EGG_PROTEIN_FAMILIES).toContain(classification.mainProtein)
    expect(classification.mainStarch).toBe(PASTA_STARCH_FAMILY)
  })
})

/**
 * LE QUATRIÈME PLAFOND — celui de P3, et le seul qu'aucun vivier de ce fichier
 * n'éprouvait.
 *
 * CE QUE LA RELECTURE A TROUVÉ. Les cinq scénarios de planification ci-dessus
 * emploient tous la protéine par défaut de `vivier`, le tofu. Leur
 * `weeklyActual.dairyEggProtein` vaut donc zéro dans tous les cas, et les trois
 * assertions qui le bornent — `toBeLessThanOrEqual(2)`, `toBeLessThanOrEqual(0,2)`
 * — ne peuvent pas échouer. Le livrable annonçait pourtant « armée, elle tient
 * les QUATRE plafonds » : trois l'étaient, le quatrième passait à vide.
 *
 * CE QUE CE VIVIER CHANGE. Même forme que les autres — huit plats français sur
 * trente-huit, donc le jalon franchi —, mais un plat sur trois porte un laitier
 * ou un œuf pour protéine principale, et les vingt autres du tofu. Le majorant
 * de `capaciteDuVivier` passe (20 + 2 = 22 créneaux tenables pour 14), donc le
 * régime s'arme pour de bon au lieu de se désarmer sur un vivier trop étroit.
 *
 * ET SURTOUT : LA MÊME SEMAINE EST REJOUÉE DÉSARMÉE. Sans ce témoin, « 2 sur 14 »
 * pourrait n'être que le goût du solveur pour le tofu. Désarmé, il en sert 6 et
 * publie le dépassement ; armé, il s'arrête à 2 et ne publie rien. C'est cet
 * écart-là qui prouve que le plafond refuse, et lui seul.
 */
describe('le quatrième plafond — laitiers et œufs, armé puis désarmé sur le même vivier', () => {
  const feculents = Object.keys(FECULENTS)
  const RECETTES = []
  for (let index = 0; index < 8; index += 1) {
    RECETTES.push(recette(`FR-${index}`, {
      cuisine: ['France', 'France / cuisine domestique internationale', 'France (Bourgogne)', 'France (Lyon)'][index % 4],
      feculent: feculents[index % feculents.length],
      // Les huit plats français portent le laitier ou l'œuf : c'est le cas le
      // plus défavorable, puisque ce sont eux que le plafond de cuisine écarte
      // en premier. Le plafond de P3 doit mordre pour son propre compte.
      proteine: index % 2 ? FROMAGE : OEUF,
      profil: PROFILS[index % PROFILS.length],
    }))
  }
  for (const [rang, cuisine] of CUISINES_ETRANGERES.entries()) {
    for (let index = 0; index < 3; index += 1) {
      RECETTES.push(recette(`${cuisine.slice(0, 3).toUpperCase()}-${index}`, {
        cuisine,
        feculent: feculents[(rang + index) % feculents.length],
        // Deux tiers de tofu : de quoi remplir les quatorze créneaux sans
        // laitier ni œuf, sans quoi le majorant désarmerait le régime et le
        // test ne dirait plus rien.
        proteine: index < 2 ? TOFU : (rang % 2 ? FROMAGE : OEUF),
        profil: PROFILS[(rang + index) % PROFILS.length],
      }))
    }
  }

  const laitOeufAuVivier = RECETTES
    .filter((plat) => DAIRY_EGG_PROTEIN_FAMILIES.includes(classifyRecipe(plat).mainProtein)).length
  const arme = planifier(RECETTES)
  const desarme = planifier(RECETTES, { weeklyCaps: { enforce: false } })

  it('présente un vivier où le plafond a de quoi mordre, et où la semaine reste faisable', () => {
    // Sans ces deux lignes, un vivier qui aurait cessé de porter des laitiers
    // rendrait les deux tests suivants vrais par vacuité.
    expect(laitOeufAuVivier).toBeGreaterThan(10)
    const capacite = capaciteDuVivier(RECETTES.map((plat) => {
      const classification = classifyRecipe(plat)
      return {
        cuisine: classification.cuisine,
        mainStarch: classification.mainStarch,
        dairyEgg: DAIRY_EGG_PROTEIN_FAMILIES.includes(classification.mainProtein),
      }
    }), weeklyBalanceFor({ totalSlots: 14 }), 14)
    expect(capacite.suffisante, JSON.stringify(capacite)).toBe(true)
    expect(arme.objectiveScores.weeklyCaps).toMatchObject({
      enforced: true, reason: RAISONS_REGIME_PLAFONDS.PIVOT_SOUS_LE_SEUIL,
    })
  })

  it('ARMÉ : la semaine sort entière et s’arrête au plafond de P3', () => {
    expect(arme.slots).toHaveLength(14)
    const plafond = arme.objectiveScores.weeklyTargets.dairyEggProteinMax
    expect(plafond).toBe(2)
    expect(arme.objectiveScores.weeklyActual.dairyEggProtein).toBeLessThanOrEqual(plafond)
    expect(arme.objectiveScores.weeklyCaps.overruns.map((depassement) => depassement.code))
      .not.toContain('dairy_egg_protein_cap')
    // Et P3 lui-même, écrit comme le §9.1 l'écrit : une part de la semaine.
    expect(arme.objectiveScores.weeklyActual.dairyEggProtein / arme.slots.length)
      .toBeLessThanOrEqual(DEFAULT_WEEKLY_CAPS.dairyEggProteinMaxShare)
  })

  it('DÉSARMÉ sur le même vivier : il en sert davantage, et le dépassement est publié', () => {
    // LE TÉMOIN. C'est lui qui distingue « le plafond refuse » de « le solveur
    // n'en voulait pas ». Les deux semaines partent du même vivier, de la même
    // date et des mêmes bornes : seule la bascule change.
    expect(desarme.slots).toHaveLength(14)
    expect(desarme.objectiveScores.weeklyCaps.enforced).toBe(false)
    expect(desarme.objectiveScores.weeklyActual.dairyEggProtein)
      .toBeGreaterThan(arme.objectiveScores.weeklyActual.dairyEggProtein)
    const depassement = desarme.objectiveScores.weeklyCaps.overruns
      .find((item) => item.code === 'dairy_egg_protein_cap')
    expect(depassement, 'le dépassement de P3 n’est pas publié').toBeTruthy()
    expect(depassement.missing).toBe(
      desarme.objectiveScores.weeklyActual.dairyEggProtein
      - desarme.objectiveScores.weeklyTargets.dairyEggProteinMax,
    )
    // Et il est aussi dans les issues, en AVERTISSEMENT : désarmé n'est pas muet.
    expect(desarme.issues.find((issue) => issue.code === 'dairy_egg_protein_cap'))
      .toMatchObject({ severity: 'warning' })
  })
})
