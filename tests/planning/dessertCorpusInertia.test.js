import { describe, expect, it } from 'vitest'
import { isMealSuitableRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { PLATE_ROLES, declaredPlateRole, isDessertRecipe } from '@/lib/domain/planning/plateRole'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

// Contrôle d'INERTIE sur le corpus réel. Le lot dessert introduit une règle
// dure : une recette dont l'éditeur a DÉCLARÉ `plate.role='dessert'` ne peut
// plus occuper un créneau de repas comme plat principal. Le corpus V3 sera
// mis à jour EN PARALLÈLE par l'agent des rôles sur les 20 recettes sucrées.
//
// Tant qu'aucune déclaration n'est posée, la règle est INERTE : aucune
// exclusion nouvelle par rapport à l'existant. Ce test constate cette
// inertie et prépare le terrain — une fois le corpus mis à jour, il
// mesurera le nombre de recettes réellement exclues.

describe('inertie du filtre dessert sur le corpus V3', () => {
  const recipes = getCanonicalRecipes({ eligibleOnly: true })

  it('toute recette rejetée COMME DESSERT porte bien la déclaration `plate.role=dessert`', () => {
    // Symétrie du contrat : l'exclusion par la nouvelle règle est
    // strictement conditionnée à la déclaration. Une régression future qui
    // convoquerait la dérivation ferait tomber ce test.
    const rejected = recipes.filter((recipe) => !isMealSuitableRecipe(recipe))
    for (const recipe of rejected) {
      const isDessert = isDessertRecipe(recipe)
      if (isDessert) {
        expect(declaredPlateRole(recipe)?.role, `${recipe.code} — ${recipe.family}`).toBe(PLATE_ROLES.DESSERT)
      }
    }
  })

  it('n’exclut aucune recette dont le rôle DÉCLARÉ n’est pas `dessert`', () => {
    // La règle dure est inerte pour toutes les autres recettes — c'est le
    // contrat avec le tech-lead : « inerte tant qu'aucune recette ne porte
    // ce rôle, prend effet dès qu'elles le portent ».
    for (const recipe of recipes) {
      if (isDessertRecipe(recipe)) continue
      // Une non-dessert peut être exclue par l'ANCIEN filtre par catégorie ;
      // c'est indépendant de mon changement. Ce que je vérifie : la nouvelle
      // règle (`isDessertRecipe`) ne rejette PAS ces recettes.
      const declared = declaredPlateRole(recipe)
      expect(declared?.role !== PLATE_ROLES.DESSERT, `${recipe.code} — ${recipe.family}`).toBe(true)
    }
  })

  it('laisse passer une tarte salée comme « Tarte aux poireaux et lardons »', () => {
    // Faux positif de la dérivation par nom (`^tarte aux `) qu'il fallait
    // éviter. Ce test acte : la règle dure ne mord PAS sur elle tant que
    // l'éditeur ne l'a pas déclarée dessert (ce qu'il ne fera pas).
    const tarteSalee = recipes.find((recipe) => /tarte aux poireaux/i.test(recipe.family))
    if (tarteSalee) {
      expect(isDessertRecipe(tarteSalee)).toBe(false)
      // Isolée du regex de catégorie historique : la nouvelle règle ne
      // participe pas à son exclusion. (Si la catégorie du corpus la range
      // dans `tarte salee`, elle passe ; si elle passe aujourd'hui, mon lot
      // ne change rien.)
      const isSuitableToday = isMealSuitableRecipe(tarteSalee)
      expect(isSuitableToday, `${tarteSalee.code} — ${tarteSalee.family}`).toBe(true)
    }
  })

  it('reconnaît un plat salé sans jamais le glisser vers dessert', () => {
    const suspects = recipes.filter((recipe) => /tajine|carbonara|blanquette|risotto|lasagne|paella|couscous|cassoulet/i.test(recipe.family))
    for (const recipe of suspects) {
      expect(isDessertRecipe(recipe), `${recipe.code} — ${recipe.family}`).toBe(false)
      expect(isMealSuitableRecipe(recipe), `${recipe.code} — ${recipe.family}`).toBe(true)
    }
  })
})
