import { describe, expect, it } from 'vitest'
import { generateClosedLoopPlan, productionRefusalReason, productionShelfLifeDays } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { isRecipeFreezable, refrigeratorShelfLifeDays } from '@/lib/domain/planning/cookingSessions'

/**
 * Chantier C1 (docs/PLAN_PLANNING_PARFAIT.md §4) : « 0 production dont
 * `useBy` dépasse la durée déclarée ». La mesure d'origine avait trouvé un
 * pan bagnat de 24 heures produit en batch ×3 pour trois jours et
 * « réchauffé », parce que la DLC de toute production était une constante et
 * que le service froid était deviné sur le nom.
 *
 * On rejoue une semaine RÉELLE : recettes réelles, sans stock, mêmes
 * paramètres que app/api/planning/generate-v3/route.js (largeur de faisceau
 * 48, 120/240 minutes par repas, 30 minutes actives préférées, une cible par
 * repas). Planifiée UNE fois pour tout le describe : la recherche en faisceau
 * sur cinq cents recettes coûte plusieurs secondes.
 */

const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
const hoursBetween = (from, to) => (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 3_600_000

describe('productions planifiées — la fenêtre est la durée DÉCLARÉE', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })
  const byCode = new Map(recipes.map((recipe) => [recipe.code, recipe]))
  const plan = generateClosedLoopPlan({
    slots: buildWeekSlots('2026-09-07'),
    recipes,
    inventoryLots: [],
    constraints: {
      allowShopping: true,
      targetByMeal: { dejeuner: TARGET, diner: TARGET },
      maxMinutesByMeal: { dejeuner: 120, diner: 240 },
      preferredActiveMinutes: 30,
    },
    beamWidth: 48,
  })
  const producers = plan.slots.filter((slot) => slot.production)

  it('publie la semaine, et le batch y existe toujours', () => {
    expect(plan.status).toBe('published')
    expect(plan.slots).toHaveLength(14)
    // Le garde-fou du garde-fou : refuser de deviner ne doit pas avoir tué la
    // mutualisation — trois cents recettes restent candidates.
    expect(producers.length).toBeGreaterThan(0)
  })

  it('chaque production expire dans la durée déclarée de sa recette', () => {
    for (const slot of producers) {
      const recipe = byCode.get(slot.recipeCode)
      const profile = recipe.conservationProfile
      expect(profile, `${recipe.code} produit sans profil de conservation`).toBeTruthy()
      expect(profile.fridgeHours, `${recipe.code} produit sans durée déclarée`).toBeGreaterThan(0)
      expect(hoursBetween(slot.production.availableFrom, slot.production.useBy), `${recipe.code} : useBy dépasse ${profile.fridgeHours} h`)
        .toBeLessThanOrEqual(profile.fridgeHours)
      // Et chaque consommateur mange avant la fin de la fenêtre.
      for (const consumerKey of slot.production.consumerSlotKeys) {
        const consumer = plan.slots.find((candidate) => candidate.key === consumerKey)
        expect(consumer, consumerKey).toBeTruthy()
        if (consumer.storageMethod !== 'freezer') expect(consumer.date <= slot.production.useBy, `${recipe.code} → ${consumerKey}`).toBe(true)
      }
    }
  })

  it('ne produit jamais un plat servi froid ni un plat à consommer immédiatement', () => {
    for (const slot of producers) {
      const profile = byCode.get(slot.recipeCode).conservationProfile
      expect(profile.serveCold, `${slot.recipeCode} servi froid produit d'avance`).not.toBe(true)
      expect(profile.eatImmediately, `${slot.recipeCode} à consommer immédiatement produit d'avance`).toBe(false)
    }
  })

  it('ne congèle que ce que le profil déclare congelable', () => {
    for (const slot of producers) {
      const recipe = byCode.get(slot.recipeCode)
      const frozen = plan.slots.filter((candidate) => candidate.productionKey === slot.production.productionKey && candidate.storageMethod === 'freezer')
      if (frozen.length || slot.production.nextWeekPortions) expect(isRecipeFreezable(recipe), recipe.code).toBe(true)
    }
  })
})

describe('productionShelfLifeDays — déclaré, ou rien', () => {
  const base = { code: 'X', conservationProfile: { fridgeHours: 72, eatImmediately: false, freezable: null, freezerMonths: null, serveCold: null } }

  it('lit shelfLifeDays déclaré, sinon les heures du profil (plancher un jour, arrondi vers le bas)', () => {
    expect(productionShelfLifeDays({ ...base, shelfLifeDays: 5 })).toBe(5)
    expect(productionShelfLifeDays(base)).toBe(3)
    expect(productionShelfLifeDays({ ...base, conservationProfile: { ...base.conservationProfile, fridgeHours: 36 } })).toBe(1)
    expect(productionShelfLifeDays({ ...base, conservationProfile: { ...base.conservationProfile, fridgeHours: 12 } })).toBe(1)
    expect(refrigeratorShelfLifeDays(base)).toBe(3)
  })

  it('rend null — aucune production — sans profil, sans durée, ou à consommer immédiatement', () => {
    expect(productionShelfLifeDays({ code: 'X' })).toBeNull()
    expect(productionShelfLifeDays({ ...base, conservationProfile: { ...base.conservationProfile, fridgeHours: null } })).toBeNull()
    expect(productionShelfLifeDays({ ...base, conservationProfile: { ...base.conservationProfile, eatImmediately: true } })).toBeNull()
  })

  it('dit pourquoi il refuse', () => {
    const documented = {
      ...base,
      prepMinutes: 30,
      techniques: ['mijotage'],
      exactIngredients: [{ name: 'carotte cuite', formNormalized: 'carotte cuite', grams: 200, optional: false, category: 'legumes' }],
    }
    expect(productionRefusalReason(documented)).toBeNull()
    expect(productionRefusalReason({ ...documented, conservationProfile: null })).toBe('conservation_non_declaree')
    expect(productionRefusalReason({ ...documented, conservationProfile: { ...base.conservationProfile, eatImmediately: true } })).toBe('a_consommer_immediatement')
    expect(productionRefusalReason({ ...documented, conservationProfile: { ...base.conservationProfile, serveCold: true } })).toBe('servi_froid')
    expect(productionRefusalReason({ ...documented, conservationProfile: { ...base.conservationProfile, fridgeHours: 24 } })).toBe('se_garde_moins_de_48h')
    expect(productionRefusalReason({ ...documented, conservationProfile: { ...base.conservationProfile, fridgeHours: null } })).toBe('conservation_non_declaree')
  })
})
