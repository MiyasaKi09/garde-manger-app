import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { buildPersonalizedMeals } from '@/lib/domain/planning/personalizedMeals'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

// « En plus ça respecte pas vraiment les nutriments. »
//
// Énergie tenue (2422 kcal pour 2357) mais protéines à 140 g pour 216 visés, et
// glucides à 277 g pour 196. Le corpus n'offrait alors AUCUN plat capable de
// tenir la densité exigée : sa meilleure recette plafonnait à 0,0991 g de
// protéines par kcal, là où il en fallait 0,1038 après déduction des prises
// support. Sept plats complets à ~0,136 ont été ajoutés.
//
// Ce test verrouille le gain mesuré. Il ne prétend PAS que la cible est
// atteinte — elle reste hors d'atteinte, et c'est une propriété du foyer, pas
// un défaut du moteur.

const MEMBERS = [
  { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
  { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true } } },
]
const GOALS = [
  { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
  { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
]
// Cible par repas telle que la route la calcule : moyenne des membres, pondérée
// par la part que leurs plats principaux doivent couvrir.
const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }

const semaine = (windowStart, recipes) => generateClosedLoopPlan({
  slots: buildWeekSlots(windowStart), recipes, inventoryLots: [],
  constraints: {
    allowShopping: true,
    targetByMeal: { dejeuner: TARGET, diner: TARGET },
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

  it('couvre nettement mieux la cible qu’avant l’enrichissement', { timeout: 20000 }, () => {
    const releves = ['2026-08-03', '2026-08-10'].map((start) => {
      const plan = semaine(start, recipes)
      expect(plan.status).toBe('published')
      const perso = buildPersonalizedMeals({ plan, recipes, members: MEMBERS, goals: GOALS })
      const jours = perso.daily.filter((jour) => jour.person_name === 'Julien')
      return {
        proteines: jours.reduce((sum, jour) => sum + jour.total.proteinG, 0) / jours.length,
        glucides: jours.reduce((sum, jour) => sum + jour.total.carbsG, 0) / jours.length,
        lipides: jours.reduce((sum, jour) => sum + jour.total.fatG, 0) / jours.length,
        kcal: jours.reduce((sum, jour) => sum + jour.total.kcal, 0) / jours.length,
      }
    })
    const moyenne = (key) => releves.reduce((sum, item) => sum + item[key], 0) / releves.length

    // Avant l'enrichissement : 134,7 g (62 %). Après : 174,2 g (81 %), puis
    // 164 g une fois le corpus élargi de 50 à 100 recettes publiables — les
    // plats ajoutés sont en moyenne moins denses en protéines que les sept
    // écrits exprès pour cette cible, et ils diluent le résultat en même temps
    // qu'ils élargissent le choix. La borne reste sous le mesuré : elle protège
    // le gain sans casser au premier réglage du solveur.
    expect(moyenne('proteines')).toBeGreaterThan(155)

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
    const deficitProteines = 216 - moyenne('proteines')
    const deficitLipides = 79 - moyenne('lipides')
    const glucidesImposes = 196 + (deficitProteines * 4 + deficitLipides * 9) / 4
    expect(moyenne('kcal') / 2357).toBeGreaterThan(0.95)
    expect(moyenne('glucides')).toBeLessThan(glucidesImposes * 1.15)
  })

  it('n’atteint pas la cible en moyenne, et le dit jour par jour', { timeout: 20000 }, () => {
    const plan = semaine('2026-08-03', recipes)
    const perso = buildPersonalizedMeals({ plan, recipes, members: MEMBERS, goals: GOALS })
    const jours = perso.daily.filter((jour) => jour.person_name === 'Julien')
    const moyenne = jours.reduce((sum, jour) => sum + jour.total.proteinG, 0) / jours.length

    // 216 g pour 2357 kcal, c'est 37 % de l'énergie : la moyenne reste sous la
    // cible même avec un corpus enrichi, et c'est une propriété de la cible.
    expect(moyenne).toBeLessThan(216)

    // Le gain n'est PAS uniforme : certains jours dépassent maintenant la cible
    // pendant que d'autres restent loin derrière (187, 146, 214, 211, 263, 107,
    // 103 g sur la semaine mesurée). Le moteur optimise la semaine, pas chaque
    // journée — un déséquilibre que ce test rend visible plutôt que de le taire.
    const conformes = jours.filter((jour) => jour.protein_valid).length
    expect(conformes).toBeGreaterThan(0)
    expect(conformes).toBeLessThan(jours.length)
  })

  it('sert confortablement un membre dont la cible est atteignable', { timeout: 20000 }, () => {
    // Ce test n'avait pas de délai explicite, contrairement à ses deux voisins,
    // et il a fini par expirer au bout des 5 s par défaut. Rien n'avait cassé :
    // le corpus publiable est passé de 50 à 100 recettes, et la recherche par
    // faisceau explore d'autant plus d'états. À 3 000 recettes le coût de cette
    // recherche deviendra un sujet en soi, bien avant d'être un sujet de test.
    //
    // Zoé vise 0,049 g/kcal, soit le troisième quartile du corpus.
    const plan = semaine('2026-08-03', recipes)
    const perso = buildPersonalizedMeals({ plan, recipes, members: MEMBERS, goals: GOALS })
    const jours = perso.daily.filter((jour) => jour.person_name === 'Zoé')
    const proteines = jours.reduce((sum, jour) => sum + jour.total.proteinG, 0) / jours.length
    expect(proteines / 75).toBeGreaterThan(0.85)
  })
})
