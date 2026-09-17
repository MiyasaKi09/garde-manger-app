import { describe, expect, it } from 'vitest'
import {
  PROTEIN_DENSE_SLOT_SHARE_DEFAULT,
  buildProteinDensityRequirement,
  countDenseCandidates,
  isProteinDense,
  memberProteinDensityFloor,
  recipeProteinDensity,
  resolveProteinDensityRequirement,
} from '@/lib/domain/planning/proteinDensity'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'

/**
 * PLANCHER DE DENSITÉ PROTÉIQUE COMME CONTRAINTE DE SÉLECTION — livrable 1.4.
 *
 * Ce fichier vérifie la MÉCANIQUE sur un corpus artificiel : ce qui est dense,
 * ce que le foyer exige, et le fait que la porte dure oriente la sélection sans
 * jamais rendre une semaine infaisable. Les chiffres du foyer réel — P4, P5,
 * `protein_gate_relaxed` — sont mesurés ailleurs, sur le corpus du dépôt, par
 * `tests/planning/rapportQualiteSemaine.test.js`.
 *
 * ─── CE QUE LE PLANCHER A DÉPLACÉ, MESURÉ ───
 *
 * Protocole du §2.3, et fixture EXACTE du rapport de qualité après les
 * livrables 1.1 et 1.3 : trois semaines consécutives (21 et 28 septembre,
 * 5 octobre 2026), historique cumulé, sans stock, faisceau 48, corpus du dépôt
 * (568 publiables), quotas carnés déclarés (Julien 4, Zoé 2 — plafond du foyer
 * 6), cible protéique de Julien calculée depuis son poids cible : 160 g. Le
 * plancher dérivé vaut 160 / 2357 = 0,0679 g de protéines par kcal.
 *
 * | créneaux exigés | P4 | protein_gate_relaxed | protéines servies | distincts /42 | repris d'une semaine à l'autre | libellés de cuisine | pâtes /42 | P16 |
 * |---|---|---|---|---|---|---|---|---|
 * | aucun plancher | 2, 3, 2 /7 | 5, 4, 5 /7 | 158, 138, 130 g | 35 | 1 | 17 | 8 | 8,1 à 10,5 s |
 * |  8 / 14        | 6, 4, 3 /7 | 1, 4, 5 /7 | 156, 153, 142 g | 36 | 0 | 17 | 6 | 5,9 à 7,5 s |
 * | 10 / 14        | 6, 5, 4 /7 | 1, 2, 3 /7 | 157, 156, 154 g | 36 | 0 | 17 | 4 | 5,7 à 6,2 s |
 * | 11 / 14        | 6, 6, 4 /7 | 2, 2, 4 /7 | 159, 154, 148 g | 34 | 2 | 16 | 3 | 4,7 à 5,9 s |
 * | 12 / 14        | 6, 5, 4 /7 | 1, 2, 4 /7 | 159, 158, 145 g | 32 | 4 | 16 | 2 | 4,0 à 5,7 s |
 * | 13 / 14        | 6, 5, 6 /7 | 1, 2, 3 /7 | 159, 159, 145 g | 29 | 7 | 16 | 1 | 3,7 à 4,5 s |
 * | 14 / 14        | 6, 7, 6 /7 | 3, 3, 3 /7 | 154, 161, 162 g | 27 | 7 | 15 | 1 | 1,7 à 2,0 s |
 *
 * CE QUE LA TABLE DIT.
 * — Le plancher fait ce qu'on lui demande, et l'essentiel du gain vient de son
 *   EXISTENCE, pas de son dosage : P4 passe de 2, 3, 2 jours à 6, 4, 3 dès huit
 *   créneaux exigés, et les protéines servies gagnent 15 à 25 g par jour.
 *   C'est la SÉLECTION qui déplace le chiffre — le ratio de portion, lui, ne
 *   bouge à aucune ligne (voir la note P5 ci-dessous).
 * — P4 ne départage PAS les valeurs : 6,4,3 · 6,5,4 · 6,6,4 · 6,5,4 · 6,5,6 ·
 *   6,7,6 varient d'autant qu'en changeant de date de départ. La table de
 *   `recipeCandidatePolicy.js` documente le même piège sur la même mesure. On
 *   ne calibre pas sur du bruit.
 * — Ce qui varie monotoniquement, c'est la VARIÉTÉ, et c'est donc elle qui
 *   décide : 36 → 27 plats distincts sur 42 créneaux, 0 → 7 plats repris d'une
 *   semaine à l'autre, 17 → 15 libellés de cuisine.
 * — P2 s'améliore partout (8 créneaux sur pâtes → 1 à 6) et P3 ne se dégrade
 *   nulle part.
 * — LA COLONNE P16 NE SE REJOUE PAS D'UNE MACHINE À L'AUTRE, et il faut le dire
 *   plutôt que de la lire comme un gain (relecture du 17 septembre 2026). Les
 *   secondes ci-dessus ont été relevées sur la machine qui a produit la table ;
 *   au réglage retenu (10/14), le rapport de qualité mesure aujourd'hui 7,1 à
 *   9,4 s là où cette colonne annonce 5,7 à 6,2 s, et 7,7 à 9,6 s avant la
 *   phase 1 là où elle annonce 8,1 à 10,5 s. L'ORDRE des lignes tient — plus
 *   le plancher est exigeant, plus le faisceau est élagué, et la dernière ligne
 *   est quatre fois plus rapide que la première —, les valeurs absolues non.
 *
 * LE DÉFAUT RETENU : 10 sur 14, le plus grand nombre qui ne coûte RIEN à la
 * variété (36 distincts et 0 reprise inter-semaines, contre 35 et 1 sans
 * plancher). Écarté : 8, qui gagne moins sans rien économiser ; 14, le seul qui
 * tienne P4 ≥ 6/7 sur trois semaines (6, 7, 6) mais au prix de 7 reprises d'une
 * semaine à l'autre là où le §9.1 du plan en exige 0 — gagner P4 en cassant
 * P1bis n'est pas gagner. Le réglage reste ouvert au foyer
 * (`protein_dense_meals_per_week` dans le profil du membre).
 *
 * CE QUE LE PLANCHER NE DOIT PAS ÊTRE : majoré. Mesuré à cible 152 g, en
 * relevant le plancher dérivé au lieu du nombre de créneaux — 0,0742 g/kcal
 * fait tomber P1 à 7-8 plats distincts par semaine, 0,0838 à 6, et les trois
 * semaines partent en `review_required`. Le plancher reste donc la densité
 * dérivée de la journée du membre, sans facteur de confort.
 *
 * ─── CE QUE CE LIVRABLE N'ATTEINT PAS, ET POURQUOI ───
 *
 * P5 ≤ 1,3 n'est pas atteint, et aucune contrainte de SÉLECTION ne peut
 * l'atteindre. Démonstration, puis mesure.
 *
 * Sur un plat partagé, si Julien prend jL portions au déjeuner et jD au dîner
 * et Zoé zL et zD, alors l'énergie que ses repas principaux doivent porter vaut
 * J = jL·L + jD·D et Z = zL·L + zD·D. Le rapport R = J / Z est la moyenne des
 * deux ratios rL = jL/zL et rD = jD/zD pondérée par (zL·L, zD·D) ; or un
 * maximum est toujours ≥ une moyenne pondérée. Donc max(rL, rD) ≥ R, quel que
 * soit le choix des plats.
 *
 * Or R ne dépend que des cibles et des prises support, qui sont des rotations
 * fixes que le §8 du plan demande de garder : R = (kcal de Julien − ses
 * supports) / (kcal de Zoé − ses supports). En s'autorisant tout l'écart
 * énergétique toléré (Julien à −5 %, Zoé à +5 %), R descend à 1,12-1,22 —
 * mais le solveur paie cet écart très cher (`energyDeviation² × 12`) et ne le
 * prend pas.
 *
 * LA VALEUR DE R QUI SE REJOUE EST CELLE DU RAPPORT, PAS CELLE QUI ÉTAIT
 * ÉCRITE ICI — corrigé à la relecture du 17 septembre 2026. Ce paragraphe
 * annonçait « 1,29 à 1,40 (moyenne 1,35), dépasse 1,3 sur 19 jours sur 21 »,
 * relevé sur une fixture antérieure. `tests/planning/rapportQualiteSemaine.test.js`
 * calcule cette même borne sur la fixture PUBLIÉE — celle des dix-huit lignes —
 * et l'imprime à chaque exécution : **1,30 à 1,44 (moyenne 1,38), dépassant
 * 1,3 sur 20 jours sur 21**. Deux chiffres pour une même grandeur, c'est un de
 * trop ; celui qui se rejoue est dans le rapport, et c'est lui qu'il faut lire.
 * La démonstration ci-dessus, elle, ne dépend d'aucun des deux.
 *
 * Autrement dit : Julien a besoin de 35 à 40 % d'énergie de plus que Zoé sur
 * les repas partagés, et P5 ≤ 1,3 demande que leurs portions n'écartent que de
 * 30 %. Ce qui déplacerait ce chiffre n'est pas le choix des plats : ce sont
 * les prises support qui s'ajustent (elles sont figées à une part, §8), la
 * présence par personne (livrable 1.5), ou l'acceptation d'un écart
 * énergétique. Aucune de ces trois décisions n'appartient à ce livrable.
 */
const recette = (code, kcal, proteinG, extra = {}) => ({
  code,
  family: `Plat ${code}`,
  title: `Plat ${code}`,
  eligible: true,
  servings: 2,
  prepMinutes: 20,
  cookMinutes: 20,
  cuisineOrigin: extra.cuisine || 'France',
  category: extra.category || 'plat mijote',
  nutritionPerServing: { kcal, proteinG, carbsG: 40, fatG: 15, fiberG: 6 },
  exactIngredients: [
    {
      // Tofu et non lentilles : `mainProteinOf` nomme la famille
      // « lentilles », qui est plafonnée à deux repas par semaine — vingt
      // recettes de la même famille rendraient la semaine infaisable dès le
      // troisième créneau, pour une raison qui n'a rien à voir avec ce
      // livrable. `vegetal` est exempté de ce plafond (`weeklyBalance.js`).
      name: extra.nom || 'Tofu',
      formNormalized: extra.forme || 'tofu ferme',
      category: extra.categorieIngredient || 'legumineuses',
      role: 'protéine',
      grams: 200,
      origin: extra.origine || 'vegetal',
      per100g: { kcal: 120, proteinG: 9, carbsG: 20, fatG: 0.5, fiberG: 8 },
    },
  ],
  sensory: { profile: extra.profil || 'warm_aromatic', scores: { richness: 3 } },
})

describe('densité protéique d’une recette', () => {
  it('se lit en g de protéines par kcal, et vaut null quand elle n’est pas calculable', () => {
    expect(recipeProteinDensity(recette('A', 500, 50))).toBeCloseTo(0.1, 6)
    expect(recipeProteinDensity({ nutritionPerServing: { kcal: 0, proteinG: 10 } })).toBeNull()
    expect(recipeProteinDensity(null)).toBeNull()
  })

  it('ne déclare dense que ce qui atteint le plancher, et jamais sans plancher', () => {
    const plat = recette('A', 500, 50)
    expect(isProteinDense(plat, 0.1)).toBe(true)
    expect(isProteinDense(plat, 0.11)).toBe(false)
    expect(isProteinDense(plat, null)).toBe(false)
    expect(isProteinDense(plat, 0)).toBe(false)
  })
})

describe('plancher d’un membre, puis du foyer', () => {
  it('dérive le plancher de la densité de la journée déclarée', () => {
    expect(memberProteinDensityFloor({ targetProteinG: 152, targetKcal: 2357 }))
      .toMatchObject({ source: 'daily_target' })
    expect(memberProteinDensityFloor({ targetProteinG: 152, targetKcal: 2357 }).floor)
      .toBeCloseTo(152 / 2357, 9)
  })

  it('laisse le réglage de la personne l’emporter sur la dérivation', () => {
    expect(memberProteinDensityFloor({ targetProteinG: 152, targetKcal: 2357, declaredFloor: 0.1 }))
      .toEqual({ floor: 0.1, source: 'member' })
  })

  it('n’invente rien quand une cible manque', () => {
    expect(memberProteinDensityFloor({ targetKcal: 2357 })).toBeNull()
    expect(memberProteinDensityFloor({ targetProteinG: 152 })).toBeNull()
    expect(memberProteinDensityFloor({})).toBeNull()
  })

  it('retient le membre le plus exigeant : le plat est partagé', () => {
    const exigence = buildProteinDensityRequirement({
      members: [
        { id: 'j', name: 'Julien', preferences: { planning: { breakfast: true, snack: true } } },
        { id: 'z', name: 'Zoé', preferences: { planning: { snack: true } } },
      ],
      goals: [
        { person_name: 'Julien', target_calories: 2357, target_protein_g: 152 },
        { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75 },
      ],
      totalSlots: 14,
    })
    expect(exigence.floor).toBeCloseTo(152 / 2357, 9)   // 0,0645 > 0,0492
    expect(exigence.byMember).toHaveLength(2)
    expect(exigence.minSlots).toBe(Math.round(14 * PROTEIN_DENSE_SLOT_SHARE_DEFAULT))
  })

  it('rend null quand aucun membre n’a de cible : le moteur redevient celui d’avant', () => {
    expect(buildProteinDensityRequirement({
      members: [{ id: 'x', name: 'Sans objectif' }],
      goals: [],
      totalSlots: 14,
    })).toBeNull()
    expect(resolveProteinDensityRequirement(null, 14)).toEqual({ floor: null, minSlots: 0 })
  })

  it('ramène le nombre de créneaux exigés à la taille réelle de la fenêtre', () => {
    expect(resolveProteinDensityRequirement({ floor: 0.06, minSlots: 12 }, 4).minSlots).toBe(4)
  })
})

describe('la sélection, sur un corpus artificiel', () => {
  // Quatorze créneaux, un vivier moitié dense / moitié pauvre, et de quoi tenir
  // la diversité : le solveur a le choix, c'est le plancher qui doit trancher.
  const denses = Array.from({ length: 18 }, (_, index) => recette(`DENSE-${index}`, 600, 60, {
    cuisine: ['France', 'Italie', 'Grece', 'Maroc', 'Japon'][index % 5],
    profil: ['warm_aromatic', 'fresh_herbal', 'smoky', 'sweet_sour', 'creamy'][index % 5],
  }))
  const pauvres = Array.from({ length: 10 }, (_, index) => recette(`PAUVRE-${index}`, 600, 18, {
    cuisine: ['France', 'Italie', 'Grece', 'Maroc', 'Japon'][index % 5],
    profil: ['warm_aromatic', 'fresh_herbal', 'smoky', 'sweet_sour', 'creamy'][index % 5],
  }))
  const slots = buildWeekSlots('2026-09-21')
  const TARGET = { kcal: 600, proteinG: 40, carbsG: 60, fatG: 20, fiberG: 8 }
  const planifier = (recipes, proteinDensity) => generateClosedLoopPlan({
    slots,
    recipes,
    inventoryLots: [],
    constraints: {
      allowShopping: true,
      targetByMeal: { dejeuner: TARGET, diner: TARGET },
      maxMinutesByMeal: { dejeuner: 120, diner: 240 },
      preferredActiveMinutes: 30,
      ...(proteinDensity ? { proteinDensity } : {}),
    },
    beamWidth: 12,
  })
  const parCode = new Map([...denses, ...pauvres].map((recipe) => [recipe.code, recipe]))
  const compterDenses = (plan, floor) => plan.slots
    .filter((slot) => isProteinDense(parCode.get(slot.recipeCode), floor)).length

  it('tient le compte exigé quand le vivier le permet', () => {
    const floor = 0.08   // 60/600 = 0,1 pour les denses ; 0,03 pour les pauvres
    const plan = planifier([...denses, ...pauvres], { floor, minSlots: 12 })
    expect(plan.slots).toHaveLength(slots.length)
    expect(compterDenses(plan, floor)).toBeGreaterThanOrEqual(12)
    expect(plan.objectiveScores.weeklyActual.proteinDensityGate).toBe(true)
    expect(plan.issues.some((issue) => issue.code === 'protein_density_min')).toBe(false)
  })

  it('n’écarte rien tant que les créneaux restants suffisent', () => {
    // Le plancher n'est pas un refus permanent : avec 8 créneaux exigés sur 14
    // et seulement 8 plats denses au vivier — que les règles de répétition
    // interdisent de resservir — les six créneaux restants sont forcément
    // occupés par des plats sous le plancher. La semaine sort entière.
    const floor = 0.08
    const huitDenses = denses.slice(0, 8)
    const plan = planifier([...huitDenses, ...pauvres], { floor, minSlots: 8 })
    expect(plan.slots).toHaveLength(slots.length)
    expect(compterDenses(plan, floor)).toBeGreaterThanOrEqual(8)
    expect(plan.slots.filter((slot) => !isProteinDense(parCode.get(slot.recipeCode), floor)).length)
      .toBeGreaterThan(0)
  })

  it('rend une semaine COMPLÈTE quand le vivier ne peut pas tenir le plancher, et le dit', () => {
    // La parade du §5 : une contrainte de sélection ne doit jamais produire
    // `no_feasible_plan`. Sans plat dense, la porte n'est pas armée, la semaine
    // sort entière, et le manque devient un avertissement chiffré.
    const floor = 0.08
    const plan = planifier(pauvres, { floor, minSlots: 12 })
    expect(plan.slots).toHaveLength(slots.length)
    expect(plan.objectiveScores.weeklyActual.proteinDensityGate).toBe(false)
    const manque = plan.issues.find((issue) => issue.code === 'protein_density_min')
    expect(manque).toMatchObject({ severity: 'warning', missing: 12 })
  })

  it('cède le plancher plutôt que la semaine, et NOMME le renoncement', () => {
    // Le vivier compte assez de plats denses pour armer la porte (huit pour
    // huit créneaux exigés), mais ils portent tous la même famille de protéine,
    // plafonnée à deux repas par semaine (`weeklyBalance.js`). Aucune semaine
    // complète ne peut donc tenir le compte. Le solveur rejoue alors sans la
    // porte : la semaine sort ENTIÈRE, en revue, avec le motif écrit.
    const floor = 0.08
    const densesCarnes = Array.from({ length: 8 }, (_, index) => recette(`BOEUF-${index}`, 600, 60, {
      nom: 'Bœuf', forme: 'boeuf', categorieIngredient: 'viandes', origine: 'animal:viande',
      cuisine: ['France', 'Italie', 'Grece', 'Maroc'][index % 4],
      profil: ['warm_aromatic', 'fresh_herbal', 'smoky', 'sweet_sour'][index % 4],
    }))
    const plan = planifier([...densesCarnes, ...pauvres], { floor, minSlots: 8 })
    expect(plan.slots).toHaveLength(slots.length)
    expect(plan.status).toBe('review_required')
    const renoncement = plan.issues.find((issue) => issue.code === 'protein_density_floor_relaxed')
    expect(renoncement).toMatchObject({ severity: 'blocker' })
    expect(renoncement.details).toMatchObject({ minSlots: 8, denseCandidates: 8 })
  })

  it('reste strictement inerte sans exigence déclarée', () => {
    const avec = planifier([...denses, ...pauvres], null)
    expect(avec.slots).toHaveLength(slots.length)
    expect(avec.objectiveScores.weeklyActual.proteinDense).toBe(0)
    expect(avec.objectiveScores.weeklyActual.proteinDensityGate).toBe(false)
    expect(avec.issues.some((issue) => issue.code === 'protein_density_min')).toBe(false)
  })

  it('compte les candidats denses du vivier, ce qui décide l’armement de la porte', () => {
    expect(countDenseCandidates([...denses, ...pauvres], 0.08)).toBe(18)
    expect(countDenseCandidates(pauvres, 0.08)).toBe(0)
    expect(countDenseCandidates([...denses, ...pauvres], null)).toBe(0)
  })
})
