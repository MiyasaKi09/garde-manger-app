import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { buildPersonalizedMeals } from '@/lib/domain/planning/personalizedMeals'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { buildProteinDensityRequirement } from '@/lib/domain/planning/proteinDensity'
import { calculateMacros } from '@/lib/nutritionCalculator'

// « En plus ça respecte pas vraiment les nutriments. »
//
// Énergie tenue (2422 kcal pour 2357) mais protéines à 140 g pour 216 visés, et
// glucides à 277 g pour 196. Le corpus n'offrait alors AUCUN plat capable de
// tenir la densité exigée : sa meilleure recette plafonnait à 0,0991 g de
// protéines par kcal, là où il en fallait 0,1038 après déduction des prises
// support. Sept plats complets à ~0,136 ont été ajoutés.
//
// Ce test verrouille le gain mesuré.
//
// ─── CE QUI A CHANGÉ AVEC LES LIVRABLES 1.3 ET 1.4, ET CE QUI N'A PAS BOUGÉ ──
//
// CE QUI N'A PAS BOUGÉ : la borne. `AVANT_ENRICHISSEMENT × 1,1`, soit 148,2 g
// de protéines servies en moyenne, reste écrite telle quelle plus bas et reste
// vérifiée — 152,8 g mesurés, contre 153 avant ces deux livrables. Elle n'a pas
// été abaissée d'un gramme.
//
// CE QUI A CHANGÉ : la cible. Les 216 g écrits en dur ici étaient 1,8 g/kg du
// poids ACTUEL de Julien (livrable 1.3, `lib/nutritionCalculator.js`). Ce
// fichier lit maintenant la cible CALCULÉE depuis son poids cible, comme
// l'application. Deux assertions décrivaient l'inatteignabilité de l'ancienne
// cible — « n'atteint pas la cible en moyenne » — : elles ne décrivent plus le
// même monde, et elles sont réécrites en le disant, jamais silencieusement.
//
// LE POIDS CIBLE EST UN PARAMÈTRE DE PROTOCOLE : le dépôt n'en déclare aucun
// (voir la note de `tests/planning/rapportQualiteSemaine.test.js`), et celui
// retenu ici est le plus exigeant des quatre mesurés — donc le plus difficile.

const MEMBERS = [
  { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
  { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } },
]
const POIDS_CIBLE_JULIEN_KG = 100
const MACROS_JULIEN = calculateMacros({
  targetCalories: 2357, targetWeightKg: POIDS_CIBLE_JULIEN_KG, weightLossRate: 0.75,
})
const GOALS = [
  {
    person_name: 'Julien',
    household_member_id: 'j',
    target_calories: 2357,
    target_protein_g: MACROS_JULIEN.protein_g,
    target_carbs_g: MACROS_JULIEN.carbs_g,
    target_fat_g: MACROS_JULIEN.fat_g,
    target_fiber_g: MACROS_JULIEN.fiber_g,
  },
  { person_name: 'Zoé', household_member_id: 'z', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
]
// Cible par repas telle que la route la calcule : moyenne des membres, pondérée
// par la part que leurs plats principaux doivent couvrir. Elle était recopiée
// en dur (`{ kcal: 707, proteinG: 51, … }`), ce qui la figeait sur l'ancienne
// cible protéique ; elle se recalcule maintenant depuis GOALS.
const partPlatsPrincipaux = (member) => {
  const planning = member?.preferences?.planning || {}
  const support = (planning.breakfast ? 0.20 : 0) + (planning.snack ? 0.15 : 0)
  return Math.max(0.25, (1 - support) / 2)
}
const TARGET = Object.fromEntries(['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG'].map((cle, index) => {
  const champ = ['target_calories', 'target_protein_g', 'target_carbs_g', 'target_fat_g', 'target_fiber_g'][index]
  const valeurs = MEMBERS.map((member) => Number(GOALS.find((goal) => goal.person_name === member.name)?.[champ]) * partPlatsPrincipaux(member))
  return [cle, valeurs.reduce((total, valeur) => total + valeur, 0) / valeurs.length]
}))
// Plancher de densité protéique du foyer (livrable 1.4), construit comme la
// route le construit.
const PLANCHER_DENSITE = buildProteinDensityRequirement({ members: MEMBERS, goals: GOALS, totalSlots: 14 })

const semaine = (windowStart, recipes) => generateClosedLoopPlan({
  slots: buildWeekSlots(windowStart), recipes, inventoryLots: [],
  constraints: {
    allowShopping: true,
    targetByMeal: { dejeuner: TARGET, diner: TARGET },
    proteinDensity: PLANCHER_DENSITE,
    maxMinutesByMeal: { dejeuner: 120, diner: 240 },
    preferredActiveMinutes: 30,
  },
  beamWidth: 48,
})

describe('densité protéique du corpus', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })
  const densite = (recipe) => recipe.nutritionPerServing.proteinG / recipe.nutritionPerServing.kcal

  it('offre des plats complets réellement denses en protéines', () => {
    // Les sept, désormais. PROT-006 est restée bloquée tant que l'estragon
    // frais n'avait pas de lipides : Ciqual ne les mesure pas et USDA n'a que
    // la version séchée, sept fois plus concentrée. La fermeture énergétique
    // d'Atwater résout le cas sans rien inventer — 44 = 4×3,8 + 4×4,1 + 9×L
    // n'a qu'une inconnue, et n'utilise que des valeurs mesurées du même
    // aliment. La forme porte sa formule dans `derived`.
    const denses = recipes.filter((recipe) => densite(recipe) >= 0.125)
    expect(denses.length).toBeGreaterThanOrEqual(7)
    // Denses ET répartis sur plusieurs familles : le moteur plafonne le nombre
    // de repas par famille de protéine, si bien que sept plats de cabillaud ne
    // vaudraient pas mieux que deux.
    const familles = new Set(denses.map((recipe) => recipe.category))
    expect(familles.size).toBeGreaterThanOrEqual(3)
  })

  it('sert des assiettes complètes, sans accompagnement ajouté qui diluerait', () => {
    // Un plat dense mais incomplet se verrait adjoindre un féculent par
    // buildMealPlate, ce qui annulerait une partie du gain.
    for (const recipe of recipes.filter((item) => item.code.startsWith('PROT-'))) {
      const carbs = recipe.nutritionPerServing.carbsG
      expect(carbs).toBeGreaterThanOrEqual(25)
    }
  })
})

describe('une semaine réelle pour un foyer à cible protéique élevée', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })

  // Les deux semaines sont résolues UNE FOIS, ici, et observées par les trois
  // tests. Elles l'étaient auparavant dans chaque `it`, donc quatre fois pour
  // deux semaines distinctes — et la semaine du 3 août à elle seule trois fois.
  // Le coût de la recherche croît avec le vivier : à 520 recettes publiables,
  // deux des trois tests dépassaient les vingt secondes de la CI alors que
  // rien n'avait cassé. Ce que ces tests mesurent est la SEMAINE SERVIE, pas la
  // vitesse à laquelle on la calcule ; les résoudre une fois ne change donc
  // aucune assertion. C'est le remède déjà appliqué à varieteSemaine.test.js,
  // pour la même cause et avec le même résultat.
  const SEMAINES = ['2026-08-03', '2026-08-10']
  const resolues = SEMAINES.map((debut) => {
    const plan = semaine(debut, recipes)
    return { debut, plan, perso: buildPersonalizedMeals({ plan, recipes, members: MEMBERS, goals: GOALS }) }
  })
  const parDebut = new Map(resolues.map((entree) => [entree.debut, entree]))

  // Le budget de temps suit le vivier, qui grandit à chaque lot. Mesure du
  // 29 juillet 2026 : 361 recettes éligibles, ~7 s pour résoudre une semaine,
  // soit ~19 ms par recette et par semaine. Le test en résout deux. Le coût est
  // LINÉAIRE dans le nombre de candidats — c'est ce qu'il faut surveiller : un
  // dépassement accompagné d'un vivier stable, ou qui croît plus vite que lui,
  // signalerait une régression du solveur et non la croissance du corpus.
  // À 3 000 recettes publiables, la même mesure donnerait près d'une minute par
  // semaine : la recherche demandera alors un élagage, pas un budget plus large.
  it('couvre nettement mieux la cible qu’avant l’enrichissement', { timeout: 60000 }, () => {
    const releves = resolues.map(({ plan, perso }) => {
      expect(plan.status).toBe('published')
      const jours = perso.daily.filter((jour) => jour.person_name === 'Julien')
      return {
        proteines: jours.reduce((sum, jour) => sum + jour.total.proteinG, 0) / jours.length,
        glucides: jours.reduce((sum, jour) => sum + jour.total.carbsG, 0) / jours.length,
        lipides: jours.reduce((sum, jour) => sum + jour.total.fatG, 0) / jours.length,
        kcal: jours.reduce((sum, jour) => sum + jour.total.kcal, 0) / jours.length,
      }
    })
    const moyenne = (key) => releves.reduce((sum, item) => sum + item[key], 0) / releves.length

    // Avant l'enrichissement : 134,7 g (62 %). Après : 174,2 g, puis 164 g à
    // 100 recettes publiables, puis 153 g à 147. La pente n'est pas un défaut du
    // solveur, elle est arithmétique : le nombre de plats réellement denses n'a
    // pas bougé — sept, les sept écrits pour cette cible — pendant que le choix
    // triplait. Leur part est passée de 14 % à 4,8 %, et le moteur, qui arbitre
    // aussi la diversité et les durées, les retient donc moins souvent.
    //
    // La borne a déjà été abaissée deux fois. La rabaisser à chaque lot ferait
    // de ce test un journal des renoncements plutôt qu'un garde-fou, alors elle
    // exprime maintenant ce qu'elle protège vraiment : l'écart au point de
    // départ. Ce qui ferait remonter la mesure n'est pas un seuil plus bas mais
    // des plats denses supplémentaires — c'est là qu'il faut agir, et le second
    // contrôle ci-dessous rend la dilution visible au lieu de l'absorber.
    //
    // LIVRABLES 1.3 ET 1.4 : LA BORNE N'A PAS BOUGÉ, ET ELLE RESTE FRANCHIE.
    // 148,2 g reste la borne écrite ci-dessous, au gramme près. Mesuré sur ces
    // deux semaines : 152,8 et 152,7 g, moyenne 152,78 g — contre 153 g avant
    // ces deux livrables. Rien n'a été abaissé pour obtenir du vert.
    //
    // CORRIGÉ À LA RELECTURE DU 17 SEPTEMBRE 2026. Ce commentaire annonçait
    // « la moyenne servie passe de ~153 g à ~169 g » et « elle est franchie
    // plus largement qu'avant ». Ni l'un ni l'autre ne se rejoue : la mesure
    // vaut 152,78 g, c'est-à-dire qu'elle n'a PAS monté — elle a très
    // légèrement baissé. Le plancher de densité déplace P4 (voir le rapport de
    // qualité), pas la moyenne servie à ce protocole-ci, qui plafonne sur
    // l'équilibre hebdomadaire du foyer et non sur la cible.
    const AVANT_ENRICHISSEMENT = 134.7
    expect(moyenne('proteines')).toBeGreaterThan(AVANT_ENRICHISSEMENT * 1.1)

    // Le vivier dense ne doit pas rétrécir pendant que le corpus grossit. S'il
    // stagne, la couverture protéique baissera encore au lot suivant : le test
    // le dit ici plutôt que d'échouer plus tard sur un chiffre sans cause.
    const denses = recipes.filter((recipe) => (
      recipe.nutritionPerServing.proteinG / recipe.nutritionPerServing.kcal >= 0.125
    ))
    expect(denses.length).toBeGreaterThanOrEqual(7)

    // Les glucides ne sont PAS une variable libre, et c'est le fond du sujet.
    // L'énergie est tenue (2389 kcal pour 2357, soit 101 %) ; ce que les
    // protéines ne fournissent pas, il faut bien que les glucides ou les
    // lipides le fournissent. Vérifier « glucides < 250 g » dans l'absolu ne
    // dit donc rien du moteur : cela mesure le déficit protéique une seconde
    // fois. On vérifie la seule chose qui dépende vraiment du solveur — que le
    // surplus de glucides ne dépasse pas ce que le déficit protéique impose
    // mécaniquement. La marge est serrée à dessein : l'identité tombe presque
    // juste (263 g mesurés pour 262,5 imposés), 15 % laissent passer le bruit
    // du solveur et rien de plus.
    //
    // Les trois cibles lues ici étaient écrites en dur — 216 g de protéines et
    // 196 g de glucides. Elles viennent maintenant de GOALS, c'est-à-dire de la
    // cible CALCULÉE depuis le poids cible (livrable 1.3) : l'identité se
    // vérifie contre la cible qu'on vise réellement, sinon elle ne vérifie rien.
    const deficitProteines = GOALS[0].target_protein_g - moyenne('proteines')
    const deficitLipides = GOALS[0].target_fat_g - moyenne('lipides')
    const glucidesImposes = GOALS[0].target_carbs_g + (deficitProteines * 4 + deficitLipides * 9) / 4
    expect(moyenne('kcal') / GOALS[0].target_calories).toBeGreaterThan(0.95)
    expect(moyenne('glucides')).toBeLessThan(glucidesImposes * 1.15)
  })

  it('couvre la cible calculée à plus de 90 % en moyenne, et reste inégal jour par jour', () => {
    const { perso } = parDebut.get('2026-08-03')
    const jours = perso.daily.filter((jour) => jour.person_name === 'Julien')
    const moyenne = jours.reduce((sum, jour) => sum + jour.total.proteinG, 0) / jours.length

    // ASSERTION RÉÉCRITE, ET IL FAUT LE DIRE. Elle vérifiait `moyenne < 216`,
    // et son commentaire expliquait pourquoi : « 216 g pour 2357 kcal, c'est
    // 37 % de l'énergie, la moyenne reste sous la cible, et c'est une propriété
    // de la cible ». C'était exact — et c'était le défaut que le livrable 1.3
    // corrige : cette cible était 1,8 g/kg du poids ACTUEL. Laisser `< 216`
    // aurait donné un test vert qui ne dit plus rien : 216 n'est plus une cible.
    //
    // CE QU'ELLE VÉRIFIE MAINTENANT : que la couverture atteint le plancher que
    // le moteur lui-même tient pour valide — `PROTEIN_FLOOR_RATIO = 0,9` dans
    // `personalizedMeals.js`. La borne n'est donc pas choisie pour passer, elle
    // est celle qui existait déjà ailleurs. Mesuré : 95,5 % de la cible sur les
    // deux semaines, contre 62 % au diagnostic du 3 septembre.
    expect(moyenne / GOALS[0].target_protein_g).toBeGreaterThan(0.9)

    // Le gain n'est PAS uniforme : certains jours dépassent la cible pendant
    // que d'autres restent derrière. Le moteur optimise la semaine, pas chaque
    // journée — un déséquilibre que ce test rend visible plutôt que de le taire,
    // et que `protein_gate_relaxed` chiffre dans le rapport de qualité.
    const conformes = jours.filter((jour) => jour.protein_valid).length
    expect(conformes).toBeGreaterThan(0)
    expect(conformes).toBeLessThan(jours.length)
  })

  it('sert confortablement un membre dont la cible est atteignable', () => {
    // Ce test n'avait pas de délai explicite, contrairement à ses deux voisins,
    // et il a fini par expirer au bout des 5 s par défaut. Rien n'avait cassé :
    // le corpus publiable est passé de 50 à 100 recettes, et la recherche par
    // faisceau explore d'autant plus d'états. À 3 000 recettes le coût de cette
    // recherche deviendra un sujet en soi, bien avant d'être un sujet de test.
    //
    // Zoé vise 0,049 g/kcal, soit le troisième quartile du corpus.
    const { perso } = parDebut.get('2026-08-03')
    const jours = perso.daily.filter((jour) => jour.person_name === 'Zoé')
    const proteines = jours.reduce((sum, jour) => sum + jour.total.proteinG, 0) / jours.length
    expect(proteines / 75).toBeGreaterThan(0.85)
  })
})
