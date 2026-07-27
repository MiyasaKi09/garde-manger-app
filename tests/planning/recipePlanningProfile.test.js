import { describe, expect, it } from 'vitest'
import {
  BATCHABILITY,
  REHEAT_QUALITY,
  batchRejectionReason,
  isBatchCandidate,
  recipePlanningProfile,
} from '@/lib/domain/planning/recipePlanningProfile'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

// Lot 3 du plan de refonte — profil de planification (§14) — et première
// moitié du lot 6 : « le plat supporte-t-il réellement le réchauffage ou la
// congélation ? », « éviter de batcher des plats qui se dégradent, comme
// certaines pâtes déjà mélangées ».

const ingredient = (name, category, overrides = {}) => ({
  name,
  formNormalized: name,
  category,
  grams: 150,
  optional: false,
  per100g: { kcal: 100, proteinG: 5, carbsG: 15, fatG: 2, fiberG: 2 },
  ...overrides,
})

const makeRecipe = (overrides = {}) => ({
  code: 'FR-000',
  family: 'Plat test',
  category: 'plat principal',
  servings: 2,
  prepMinutes: 30,
  cookMinutes: 40,
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic', target_textures: ['fondant'] },
  exactIngredients: [
    ingredient('boeuf braise', 'viandes', { grams: 300 }),
    ingredient('carotte cuite', 'legumes', { grams: 200 }),
  ],
  nutritionPerServing: { kcal: 550, proteinG: 35, carbsG: 40, fatG: 20, fiberG: 6 },
  ...overrides,
})

describe('recipePlanningProfile — tenue au réchauffage', () => {
  it('classe un mijoté comme se réchauffant bien et très batchable', () => {
    const profile = recipePlanningProfile(makeRecipe())
    expect(profile.reheatQuality).toBe(REHEAT_QUALITY.GOOD)
    expect(profile.batchability).toBe(BATCHABILITY.HIGH)
    expect(profile.documented).toBe(true)
    expect(isBatchCandidate(makeRecipe())).toBe(true)
  })

  it('écarte les pâtes déjà mélangées à leur sauce — l’exemple du plan', () => {
    const pesto = makeRecipe({
      code: 'IT-PESTO',
      family: 'Pâtes au pesto',
      techniques: ['emulsion', 'cuisson al dente'],
      exactIngredients: [
        ingredient('pates seches', 'cereales_feculents', { grams: 200 }),
        ingredient('pesto', 'sauces', { grams: 80, role: 'sauce' }),
      ],
    })
    expect(recipePlanningProfile(pesto).reheatQuality).toBe(REHEAT_QUALITY.POOR)
    expect(isBatchCandidate(pesto)).toBe(false)
    expect(batchRejectionReason(pesto)).toBe('se_degrade_au_rechauffage')
  })

  it('ne confond pas un gratin de pâtes avec des pâtes en sauce', () => {
    const lasagnes = makeRecipe({
      code: 'IT-LAS',
      family: 'Lasagnes',
      techniques: ['four'],
      exactIngredients: [
        ingredient('lasagne', 'cereales_feculents', { grams: 200 }),
        ingredient('sauce bolognaise', 'sauces', { grams: 300, role: 'sauce' }),
      ],
    })
    // Les mêmes pâtes, la même sauce : c'est la cuisson au four qui change la
    // tenue du plat, pas son nom.
    expect(recipePlanningProfile(lasagnes).reheatQuality).toBe(REHEAT_QUALITY.GOOD)
    expect(isBatchCandidate(lasagnes)).toBe(true)
  })

  it('ne disqualifie pas un plat dont une étape fragile est rattrapée par une cuisson lente', () => {
    const parmigiana = makeRecipe({ techniques: ['friture', 'four'] })
    // Frire puis enfourner : c'est le four qui décide.
    expect(recipePlanningProfile(parmigiana).reheatQuality).toBe(REHEAT_QUALITY.FAIR)
    expect(isBatchCandidate(parmigiana)).toBe(true)
    const friture = makeRecipe({ techniques: ['friture'] })
    expect(recipePlanningProfile(friture).reheatQuality).toBe(REHEAT_QUALITY.POOR)
  })

  it('écarte les plats servis froids', () => {
    const salade = makeRecipe({ family: 'Salade de lentilles', techniques: ['emulsion'] })
    expect(recipePlanningProfile(salade).servedCold).toBe(true)
    expect(batchRejectionReason(salade)).toBe('plat_servi_froid')
  })

  it('écarte les préparations trop courtes pour valoir une mutualisation', () => {
    const express = makeRecipe({ prepMinutes: 8 })
    expect(recipePlanningProfile(express).batchability).toBe(BATCHABILITY.LOW)
    expect(batchRejectionReason(express)).toBe('preparation_trop_courte_pour_mutualiser')
  })

  it('fait primer la donnée déclarée par le corpus sur la dérivation', () => {
    const declared = makeRecipe({ reheatQuality: 'poor' })
    expect(recipePlanningProfile(declared).reheatQuality).toBe(REHEAT_QUALITY.POOR)
    expect(recipePlanningProfile(declared).sources.reheatQuality).toBe('declared')
    const refused = makeRecipe({ batchable: false })
    expect(recipePlanningProfile(refused).batchability).toBe(BATCHABILITY.LOW)
    expect(recipePlanningProfile(refused).sources.batchability).toBe('declared')
  })
})

describe('recipePlanningProfile — documentation et complétude', () => {
  it('exclut du moteur avancé une recette dont on ne sait rien juger', () => {
    const opaque = makeRecipe({ techniques: [], conservation: null, exactIngredients: [{ name: 'x', formNormalized: 'x', grams: 100, optional: false }] })
    expect(recipePlanningProfile(opaque).documented).toBe(false)
    expect(isBatchCandidate(opaque)).toBe(false)
    expect(batchRejectionReason(opaque)).toBe('composition_insuffisamment_documentee')
  })

  it('distingue « assez documenté pour juger » de « assez documenté pour compléter l’assiette »', () => {
    // Une technique déclarée suffit à juger la tenue du plat ; compléter une
    // assiette demande en plus les tables nutritionnelles des ingrédients.
    const sansNutrition = makeRecipe({
      exactIngredients: [{ name: 'boeuf', formNormalized: 'boeuf', category: 'viandes', grams: 300, optional: false }],
    })
    const profile = recipePlanningProfile(sansNutrition)
    expect(profile.documented).toBe(true)
    expect(profile.compositionDocumented).toBe(false)
  })

  it('publie les composants présents et manquants', () => {
    const profile = recipePlanningProfile(makeRecipe())
    expect(profile.componentsPresent).toContain('protein')
    expect(profile.componentsMissing).toContain('starch')
    expect(profile.mealCompleteness).toBe('partial')
  })
})

describe('recipePlanningProfile — sur le corpus réel du dépôt', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })
  const profiles = recipes.map((recipe) => ({ recipe, profile: recipePlanningProfile(recipe) }))

  it('documente tout le corpus publiable', () => {
    expect(profiles.every((entry) => entry.profile.documented)).toBe(true)
  })

  it('laisse une large majorité de recettes mutualisables, sans tout accepter', () => {
    const batchable = recipes.filter(isBatchCandidate)
    expect(batchable.length).toBeGreaterThan(recipes.length * 0.6)
    expect(batchable.length).toBeLessThan(recipes.length)
  })

  it('refuse les pâtes en sauce et les plats froids du corpus, garde les mijotés', () => {
    const byFamily = (needle) => recipes.find((recipe) => recipe.family.toLowerCase().includes(needle))
    expect(isBatchCandidate(byFamily('pâtes au pesto'))).toBe(false)
    expect(isBatchCandidate(byFamily('carbonade'))).toBe(true)
    expect(isBatchCandidate(byFamily('lasagnes'))).toBe(true)
  })
})
