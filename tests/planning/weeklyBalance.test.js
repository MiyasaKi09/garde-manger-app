import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WEEKLY_BALANCE, DEFAULT_WEEKLY_CAPS, UNCAPPED_PROTEIN_FAMILIES, buildWeeklyBalance,
  resolveHouseholdWeeklyBalance, weeklyBalanceFor,
} from '@/lib/domain/planning/weeklyBalance'

// L'équilibre hebdomadaire (poisson, viande, plancher végétarien, répétition par
// famille de protéine) était écrit en dur. Ce sont des choix légitimes, mais des
// CHOIX : un foyer doit pouvoir les assumer autrement.

describe('buildWeeklyBalance — réglages du foyer', () => {
  it('reproduit exactement l’ancien comportement sans réglage', () => {
    // Depuis le livrable 3.1, `buildWeeklyBalance` rend aussi les quatre
    // plafonds de part (P2, P3, P13). Les bornes en nombre de créneaux, elles,
    // n'ont pas bougé d'une unité : c'est ce que les deux lignes ci-dessous
    // vérifient, chacune sur son groupe.
    expect(buildWeeklyBalance()).toEqual({ ...DEFAULT_WEEKLY_BALANCE, ...DEFAULT_WEEKLY_CAPS })
    expect(buildWeeklyBalance(null)).toEqual({ ...DEFAULT_WEEKLY_BALANCE, ...DEFAULT_WEEKLY_CAPS })
    expect(DEFAULT_WEEKLY_BALANCE).toMatchObject({
      fishMeals: 2, meatMax: 4, vegetarianMin: 8, maxMealsPerProteinFamily: 2,
    })
  })

  it('accepte un réglage partiel sans perdre les autres bornes', () => {
    expect(buildWeeklyBalance({ fishMeals: 5 })).toMatchObject({
      fishMeals: 5, meatMax: 4, vegetarianMin: 8,
    })
  })

  it('ignore une valeur inexploitable au lieu de casser la génération', () => {
    expect(buildWeeklyBalance({ fishMeals: 'beaucoup', meatMax: -3 })).toMatchObject({
      fishMeals: 2, meatMax: 4,
    })
  })

  it('n’autorise jamais zéro repas par famille de protéine', () => {
    // Zéro rendrait toute viande et tout poisson impossibles, sans le dire.
    expect(buildWeeklyBalance({ maxMealsPerProteinFamily: 0 }).maxMealsPerProteinFamily).toBe(1)
  })
})

describe('weeklyBalanceFor — bornes ramenées à la semaine', () => {
  it('reproduit les valeurs historiques sur quatorze créneaux', () => {
    // `toMatchObject` et non `toEqual` : le livrable 3.1 ajoute quatre plafonds
    // à cet objet, et les éprouver ici ferait de ce test deux tests. Ce qu'il
    // doit dire est intact — aucune des neuf bornes historiques n'a bougé —, et
    // les plafonds ont leur propre fichier, `tests/planning/plafondsSemaine.test.js`,
    // où ils sont éprouvés avec la bascule qui les arme.
    expect(weeklyBalanceFor({ totalSlots: 14 })).toMatchObject({
      fish: 2, meatMax: 4, vegetarianMin: 8, redMeatMin: 1, fattyFishMin: 1,
      legumesMin: 2, cuisinesMin: 3, proteinsMin: 4, maxMealsPerProteinFamily: 2,
    })
    expect(Object.keys(weeklyBalanceFor({ totalSlots: 14 })).sort()).toEqual([
      'cuisineMax', 'cuisineMaxShare', 'cuisinesMin', 'dairyEggProteinMax', 'dairyEggProteinMaxShare',
      'fattyFishMin', 'fish', 'legumesMin', 'maxMealsPerProteinFamily', 'meatMax', 'pastaMax',
      'pastaMaxShare', 'proteinsMin', 'redMeatMin', 'starchMax', 'starchMaxShare', 'vegetarianMin',
    ])
  })

  it('ne réclame pas plus de repas qu’il n’y a de créneaux', () => {
    const small = weeklyBalanceFor({ totalSlots: 3 })
    expect(small.vegetarianMin).toBe(3)
    expect(small.fish).toBe(2)
    // Les minimums « au moins un » ne valent que sur une semaine complète.
    expect(small.redMeatMin).toBe(0)
    expect(small.fattyFishMin).toBe(0)
  })

  it('laisse un régime végétarien déclaré primer sur tout réglage', () => {
    const balance = buildWeeklyBalance({ fishMeals: 6, meatMax: 8 })
    expect(weeklyBalanceFor({ balance, totalSlots: 14, vegetarianDiet: true })).toMatchObject({
      fish: 0, meatMax: 0, vegetarianMin: 14,
    })
  })

  it('transmet un plafond par famille desserré', () => {
    const balance = buildWeeklyBalance({ maxMealsPerProteinFamily: 4 })
    expect(weeklyBalanceFor({ balance, totalSlots: 14 }).maxMealsPerProteinFamily).toBe(4)
  })

  it('exempte les familles qui ne désignent pas une espèce', () => {
    // 'inconnu' en fait partie : la protéine principale d'un plat dont
    // l'origine n'est pas déclarée n'est pas une espèce, et la plafonner
    // cacherait une donnée manquante derrière une semaine infaisable.
    expect(UNCAPPED_PROTEIN_FAMILIES).toEqual(['vegetal', 'laitiers', 'oeufs', 'inconnu'])
  })
})

describe('resolveHouseholdWeeklyBalance — le plafond carné vient des quotas déclarés', () => {
  // Livrable 1.1 : `meatMax` valait 4 en dur, et ce 4 mettait Zoé à 0 repas
  // carné sur 14 sans qu'elle l'ait demandé (§2.3 du plan, P6). Cette
  // résolution vivait dans `app/api/planning/generate-v3/route.js`, où elle ne
  // s'éprouvait qu'en simulant Supabase.
  const membre = (nom, planning = {}, reste = {}) => ({ name: nom, preferences: { planning }, ...reste })

  it('somme les quotas déclarés des membres actifs', () => {
    const balance = resolveHouseholdWeeklyBalance({
      members: [
        membre('A', { meat_meals_per_week: 4 }),
        membre('B', { meat_meals_per_week: 2 }),
      ],
    })
    expect(balance.meatMax).toBe(6)
    // Les autres bornes ne bougent pas : le livrable ne touche qu'au carné.
    expect(balance).toMatchObject({ fishMeals: 2, vegetarianMin: 8, maxMealsPerProteinFamily: 2 })
  })

  it('garde le défaut du moteur quand personne n’a déclaré de quota', () => {
    // LE CAS QUI COMPTE LE PLUS : un foyer qui n'a rien réglé ne doit pas
    // passer à zéro viande. `Number(null)` vaut 0, et une somme naïve aurait
    // produit meatMax = 0 sans que personne n'ait touché à un réglage.
    expect(resolveHouseholdWeeklyBalance({ members: [membre('A'), membre('B')] }).meatMax).toBe(4)
    expect(resolveHouseholdWeeklyBalance({ members: [] }).meatMax).toBe(4)
    expect(resolveHouseholdWeeklyBalance().meatMax).toBe(4)
  })

  it('ne compte pas le quota d’un membre inactif', () => {
    // Il ne mange pas cette semaine : son quota gonflerait le plafond sans
    // qu'aucune assiette n'y corresponde.
    expect(resolveHouseholdWeeklyBalance({
      members: [
        membre('A', { meat_meals_per_week: 4 }),
        membre('B', { meat_meals_per_week: 2 }, { active: false }),
      ],
    }).meatMax).toBe(4)
  })

  it('laisse un meatMax écrit l’emporter sur la somme déduite', () => {
    const members = [membre('A', { meat_meals_per_week: 4 }), membre('B', { meat_meals_per_week: 2 })]
    // Consigne directe de la requête.
    expect(resolveHouseholdWeeklyBalance({ members, requestBalance: { meatMax: 3 } }).meatMax).toBe(3)
    // Consigne portée par les réglages du foyer.
    expect(resolveHouseholdWeeklyBalance({
      members: [membre('A', { meat_meals_per_week: 4, weekly_balance: { meatMax: 1 } }), members[1]],
    }).meatMax).toBe(1)
  })

  it('un quota de zéro est une déclaration, pas une absence', () => {
    // « Je ne mange pas de viande » se règle, et le foyer passe alors à zéro
    // créneau carné — ce qui est demandé, pas subi.
    expect(resolveHouseholdWeeklyBalance({
      members: [membre('A', { meat_meals_per_week: 0 }), membre('B', { meat_meals_per_week: 0 })],
    }).meatMax).toBe(0)
  })
})
