import { describe, expect, it } from 'vitest'
import { getMemberPlanningRules } from '@/lib/domain/planning/memberPlanningRules'
import { buildPersonalizedMeals, vegetarianLineageTwins } from '@/lib/domain/planning/personalizedMeals'
import { meatMaxFromDeclaredQuotas } from '@/lib/domain/planning/weeklyBalance'

/**
 * CÂBLAGE DU QUOTA CARNÉ ET DU REFUS HORS LIGNÉE — livrables 1.1 et 1.2.
 *
 * CE FICHIER NE PLANIFIE AUCUNE SEMAINE, ET C'EST VOULU. Les critères P6 et P7
 * se mesurent sur trois semaines réelles, et c'est le travail de
 * `tests/planning/quotaViandeParMembre.test.js` — une minute de recherche en
 * faisceau. Mais les cas qui décident du comportement — l'absence de quota,
 * le quota à zéro, le créneau qu'on cède en premier, l'absence d'alternative —
 * n'ont pas besoin de 568 recettes : ils ont besoin d'un corpus où l'on VOIT
 * quelle recette a un jumeau et laquelle n'en a pas. Un corpus de cinq plats
 * les rend lisibles et les rejoue en quelques millisecondes.
 *
 * LE CORPUS : deux plats carnés, dont UN SEUL porte un jumeau végétarien de sa
 * lignée. C'est toute la question du livrable 1.2 — à quoi renonce-t-on quand
 * le corpus ne fournit pas de jumeau ? —, et la semaine est construite pour que
 * le plat SANS jumeau vienne EN PREMIER dans l'ordre des jours : c'était l'ordre
 * que suivait le code précédent, et c'est ce qui produisait une substitution
 * hors lignée évitable.
 */

const per100g = { kcal: 165, proteinG: 20, carbsG: 5, fatG: 6, fiberG: 1 }

const plat = ({ code, family, derivedFrom = null, origin }) => ({
  code,
  family,
  category: 'plat mijoté',
  cuisineOrigin: 'France',
  eligible: true,
  servings: 4,
  prepMinutes: 20,
  cookMinutes: 25,
  allergens: [],
  techniques: ['mijotage'],
  sensory: { profile: 'warm_aromatic' },
  ...(derivedFrom ? { derivedFrom } : {}),
  exactIngredients: [
    { name: 'protéine', formNormalized: `proteine ${code}`, origin, grams: 500, optional: false, per100g },
    { name: 'riz basmati cru', formNormalized: 'riz basmati cru', origin: 'vegetal', grams: 280, optional: false, per100g: { kcal: 352, proteinG: 7.4, carbsG: 78, fatG: 0.9, fiberG: 1 } },
    { name: 'carotte crue', formNormalized: 'carotte crue', origin: 'vegetal', grams: 400, optional: false, per100g: { kcal: 36, proteinG: 0.8, carbsG: 6, fatG: 0.2, fiberG: 2.6 } },
  ],
  nutritionPerServing: { kcal: 520, proteinG: 35, carbsG: 60, fatG: 12, fiberG: 5 },
})

// SANS jumeau, et servi le premier jour : c'est le piège que le livrable 1.2
// désamorce.
const SANS_JUMEAU = plat({ code: 'MEAT-SOLO', family: 'Bœuf sans version végé', origin: 'animal:viande' })
// AVEC jumeau, servi le second jour.
const AVEC_JUMEAU = plat({ code: 'MEAT-PAIR', family: 'Chili con carne', origin: 'animal:viande' })
const JUMEAU = plat({ code: 'JUM-PAIR', family: 'Chili sin carne', derivedFrom: 'MEAT-PAIR', origin: 'vegetal' })
// Végétariens sans rapport : les seuls replis possibles hors lignée.
const VEGE_A = plat({ code: 'VEG-A', family: 'Gratin de courge', origin: 'vegetal' })
const VEGE_B = plat({ code: 'VEG-B', family: 'Dahl de lentilles', origin: 'vegetal' })

const CORPUS = [SANS_JUMEAU, AVEC_JUMEAU, JUMEAU, VEGE_A, VEGE_B]

// Deux jours, quatre créneaux : deux carnés (jour 1 midi, jour 2 midi) et deux
// végétariens, pour que la semaine reste servable quoi qu'il arrive.
const PLAN = {
  slots: [
    { key: '2026-09-21-dejeuner', date: '2026-09-21', mealType: 'dejeuner', recipeCode: 'MEAT-SOLO' },
    { key: '2026-09-21-diner', date: '2026-09-21', mealType: 'diner', recipeCode: 'VEG-A' },
    { key: '2026-09-22-dejeuner', date: '2026-09-22', mealType: 'dejeuner', recipeCode: 'MEAT-PAIR' },
    { key: '2026-09-22-diner', date: '2026-09-22', mealType: 'diner', recipeCode: 'VEG-B' },
  ],
}

const GOAL = (nom) => ({
  person_name: nom, target_calories: 2000, target_protein_g: 100,
  target_carbs_g: 240, target_fat_g: 67, target_fiber_g: 25,
})

const membre = (nom, planning) => ({ id: nom, name: nom, portion_multiplier: 1, preferences: { planning } })

function construire(planning, { recipes = CORPUS } = {}) {
  const personne = membre('P', { breakfast: false, snack: false, ...planning })
  const resultat = buildPersonalizedMeals({
    plan: PLAN, recipes, members: [personne], goals: [GOAL('P')],
  })
  return {
    ...resultat,
    quota: resultat.meatQuotas[0],
    principaux: resultat.meals.filter((meal) => ['dejeuner', 'diner'].includes(meal.meal_type)),
  }
}

describe('le corpus de ce fichier dit bien ce qu’il prétend dire', () => {
  it('un seul des deux plats carnés porte un jumeau végétarien de sa lignée', () => {
    // Sans cette garde, tous les tests qui suivent pourraient passer pour de
    // mauvaises raisons — un corpus où chaque plat aurait un jumeau ne dirait
    // rien du repli, et un corpus où aucun n'en aurait ne dirait rien du refus.
    expect(vegetarianLineageTwins(AVEC_JUMEAU, CORPUS, {}).map((recipe) => recipe.code)).toEqual(['JUM-PAIR'])
    expect(vegetarianLineageTwins(SANS_JUMEAU, CORPUS, {})).toEqual([])
    // Et le plat sans jumeau est bien servi EN PREMIER.
    expect(PLAN.slots[0].recipeCode).toBe('MEAT-SOLO')
  })
})

describe('1.1 — le quota carné décide du nombre de substitutions', () => {
  it('aucun quota déclaré : la personne reçoit le plat du foyer, comme avant', () => {
    const { quota, principaux } = construire({})
    expect(quota.declared_quota).toBeNull()
    expect(quota.quota_source).toBe('legacy_vegetarian_meat_swaps')
    expect(quota.requested_swaps).toBe(0)
    expect(quota.meat_meals).toBe(2)
    // L'écart ne se mesure pas contre une cible qui n'existe pas.
    expect(quota.quota_gap).toBeNull()
    expect(principaux.every((meal) => meal.variant_kind === 'household_base')).toBe(true)
  })

  it('aucun quota mais un ancien réglage de swaps : l’héritage reste en vigueur', () => {
    // Un profil enregistré avant ce livrable ne doit pas voir sa semaine
    // changer au déploiement.
    const { quota } = construire({ vegetarian_meat_swaps_per_week: 1 })
    expect(quota.quota_source).toBe('legacy_vegetarian_meat_swaps')
    expect(quota.requested_swaps).toBe(1)
    expect(quota.meat_meals).toBe(1)
  })

  it('un quota déclaré l’emporte sur l’ancien réglage au lieu de s’y ajouter', () => {
    const { quota } = construire({ vegetarian_meat_swaps_per_week: 4, meat_meals_per_week: 1 })
    expect(quota.quota_source).toBe('meat_meals_per_week')
    // Deux créneaux carnés au foyer, quota de 1 → une seule substitution, et
    // non quatre.
    expect(quota.requested_swaps).toBe(1)
    expect(quota.meat_meals).toBe(1)
    expect(quota.quota_gap).toBe(0)
  })

  it('un quota de zéro retire toute la viande, un quota au-dessus de l’offre n’en ajoute pas', () => {
    expect(construire({ meat_meals_per_week: 0 }).quota.meat_meals).toBe(0)
    // Le quota ne crée pas de créneau carné : le foyer n'en propose que deux,
    // et l'écart négatif est RENDU plutôt que masqué.
    const genereux = construire({ meat_meals_per_week: 5 }).quota
    expect(genereux.requested_swaps).toBe(0)
    expect(genereux.meat_meals).toBe(2)
    expect(genereux.quota_gap).toBe(-3)
  })
})

describe('1.2 — on cède d’abord les créneaux qui ont un jumeau', () => {
  it('un seul créneau à céder : c’est celui dont la lignée porte un jumeau', () => {
    // LE CŒUR DU LIVRABLE. Le code précédent prenait le premier créneau carné
    // dans l'ordre des jours — MEAT-SOLO — et produisait une substitution hors
    // lignée alors qu'une substitution DANS la lignée était disponible sur
    // l'autre créneau. Même nombre de repas carnés, une lignée respectée.
    const { quota, principaux } = construire({ meat_meals_per_week: 1 })
    expect(quota.applied_swaps).toBe(1)
    expect(quota.out_of_lineage_swaps).toBe(0)
    const substitue = principaux.find((meal) => meal.variant_kind !== 'household_base')
    expect(substitue.meal_date).toBe('2026-09-22')
    expect(substitue.canonical_recipe_code).toBe('JUM-PAIR')
    expect(substitue.variant_kind).toBe('vegetarian_swap_lineage')
    expect(substitue.portion_details.same_lineage).toBe(true)
    // Le plat sans jumeau reste servi tel quel.
    const garde = principaux.find((meal) => meal.meal_date === '2026-09-21' && meal.meal_type === 'dejeuner')
    expect(garde.canonical_recipe_code).toBe('MEAT-SOLO')
  })

  it('les deux créneaux cédés : le repli hors lignée est signalé et motivé', () => {
    const { quota, principaux } = construire({ meat_meals_per_week: 0 })
    expect(quota.applied_swaps).toBe(2)
    expect(quota.out_of_lineage_swaps).toBe(1)
    const repli = principaux.find((meal) => meal.meal_date === '2026-09-21' && meal.meal_type === 'dejeuner')
    expect(repli.portion_details.same_lineage).toBe(false)
    expect(repli.variant_kind).toBe('vegetarian_swap')
    // Le POURQUOI du repli, et c'est lui que P7 relit : on n'est pas sorti de
    // la lignée par préférence, on en est sorti faute de jumeau.
    expect(repli.portion_details.substitution_fallback).toMatchObject({
      reason: 'vegetarian_swap',
      baseCode: 'MEAT-SOLO',
      lineageTwinAvailable: false,
    })
    // Et le créneau qui avait un jumeau l'a bien reçu.
    const dansLaLignee = principaux.find((meal) => meal.meal_date === '2026-09-22' && meal.meal_type === 'dejeuner')
    expect(dansLaLignee.canonical_recipe_code).toBe('JUM-PAIR')
  })

  it('un jumeau disponible n’est jamais dépassé par un plat d’une autre lignée', () => {
    // Le refus est une RÈGLE, pas un classement : même si le jumeau est le
    // candidat le plus éloigné en nutrition, il sort le premier. Ici le jumeau
    // est rendu volontairement très éloigné de sa base.
    const jumeauEloigne = { ...JUMEAU, nutritionPerServing: { kcal: 90, proteinG: 2, carbsG: 8, fatG: 1, fiberG: 1 } }
    const corpus = [SANS_JUMEAU, AVEC_JUMEAU, jumeauEloigne, VEGE_A, VEGE_B]
    const { principaux } = construire({ meat_meals_per_week: 1 }, { recipes: corpus })
    const substitue = principaux.find((meal) => meal.variant_kind !== 'household_base')
    expect(substitue.canonical_recipe_code).toBe('JUM-PAIR')
    expect(substitue.portion_details.same_lineage).toBe(true)
  })

  it('aucune alternative végétarienne : la substitution est refusée, et le refus est rendu', () => {
    // Un quota qu'on ne peut pas tenir est un fait à publier. Le contraire
    // serait de servir quand même un plat carné en laissant croire que le
    // quota est tenu — ou pire, de rendre un chiffre qui l'affirme.
    const sansVege = [SANS_JUMEAU, AVEC_JUMEAU]
    const planCarne = {
      slots: [
        { key: '2026-09-21-dejeuner', date: '2026-09-21', mealType: 'dejeuner', recipeCode: 'MEAT-SOLO' },
        { key: '2026-09-21-diner', date: '2026-09-21', mealType: 'diner', recipeCode: 'MEAT-PAIR' },
      ],
    }
    const resultat = buildPersonalizedMeals({
      plan: planCarne,
      recipes: sansVege,
      members: [membre('P', { breakfast: false, snack: false, meat_meals_per_week: 0 })],
      goals: [GOAL('P')],
    })
    const quota = resultat.meatQuotas[0]
    expect(quota.requested_swaps).toBe(2)
    expect(quota.applied_swaps).toBe(0)
    expect(quota.refused_swaps.map((refus) => refus.reason)).toEqual([
      'aucune_alternative_vegetarienne', 'aucune_alternative_vegetarienne',
    ])
    // Le chiffre rendu est celui des assiettes réelles, pas celui du quota.
    expect(quota.meat_meals).toBe(2)
    expect(quota.quota_gap).toBe(2)
  })
})

describe('1.1 — arithmétique du plafond du foyer, sans planifier de semaine', () => {
  it('la somme ne s’invente pas quand personne n’a déclaré de quota', () => {
    expect(meatMaxFromDeclaredQuotas([])).toBeNull()
    expect(meatMaxFromDeclaredQuotas([null, undefined])).toBeNull()
    // Un seul déclarant suffit à faire la règle ; les autres ne comptent pas
    // pour zéro, ils ne comptent pas du tout.
    expect(meatMaxFromDeclaredQuotas([3, null])).toBe(3)
    // Zéro EST une déclaration : « je ne mange pas de viande » se règle.
    expect(meatMaxFromDeclaredQuotas([0, 0])).toBe(0)
    expect(meatMaxFromDeclaredQuotas(['deux', 4])).toBe(4)
  })

  it('un profil sans quota garde son ancien réglage de swaps', () => {
    const heritage = { name: 'X', preferences: { planning: { vegetarian_meat_swaps_per_week: 4 } } }
    expect(getMemberPlanningRules(heritage).meatMealsPerWeek).toBeNull()
    expect(getMemberPlanningRules(heritage).vegetarianMeatSwaps).toBe(4)
  })
})
