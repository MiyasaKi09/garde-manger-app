import { describe, expect, it } from 'vitest'
import { buildMealPlate } from '@/lib/domain/planning/mealComposition'
import { PLATE_ROLES, derivePlateRole, plateRoleOf } from '@/lib/domain/planning/plateRole'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

// « Actuellement c'est absolument n'importe quoi, y a des accompagnements
// partout qui n'ont aucun sens, parfois même plusieurs. »
//
// Mesuré avant correction sur les 118 recettes publiables : 97 accompagnées,
// dont 32 de DEUX accompagnements. Un tiramisu servi avec du riz blanc et des
// haricots verts. Une béchamel de même. Des haricots verts persillés recevant
// du riz, et une purée de pommes de terre recevant des haricots verts.

const recette = (family, category, { starch = 0, vegetables = 0, protein = 0, servings = 4 } = {}) => ({
  family,
  category,
  servings,
  nutritionPerServing: { proteinG: protein },
  exactIngredients: [
    { name: 'féculent', category: 'cereales_feculents', role: 'féculent', grams: starch * servings, per100g: { carbsG: 100 } },
    { name: 'légume', category: 'legumes', role: 'légume', grams: vegetables * servings, per100g: { carbsG: 5 } },
    { name: 'protéine', category: 'viandes', role: 'protéine', grams: 100 * servings, per100g: { proteinG: protein } },
  ],
})

describe('rôle d’assiette', () => {
  it('n’ajoute JAMAIS plus d’un accompagnement', () => {
    const recipes = getCanonicalRecipes({ servings: 4 })
    for (const recipe of recipes) {
      expect(buildMealPlate(recipe, {}).components.length, recipe.family).toBeLessThanOrEqual(1)
    }
  })

  it('n’accompagne ni les desserts, ni les accompagnements, ni les préparations de base', () => {
    const recipes = getCanonicalRecipes({ servings: 4 })
    const interdits = [PLATE_ROLES.DESSERT, PLATE_ROLES.SIDE, PLATE_ROLES.COMPONENT, PLATE_ROLES.COMPLETE]
    for (const recipe of recipes) {
      const plate = buildMealPlate(recipe, {})
      if (interdits.includes(plate.plateRole.role)) {
        expect(plate.components, `${recipe.family} (${plate.plateRole.role})`).toEqual([])
      }
    }
  })

  it('reconnaît les desserts sans se fier à leur composition', () => {
    // C'est par là que le riz blanc arrivait dans le tiramisu : un dessert est
    // pauvre en féculent structurel et en légumes, donc « incomplet » au sens
    // des grammes. Il reste un dessert.
    for (const nom of ['Tiramisu classique', 'Mousse au chocolat', 'Crumble aux pommes', 'Riz au lait', 'Pancakes moelleux']) {
      expect(derivePlateRole(recette(nom, 'dessert'), { compositionKnown: true }).role, nom).toBe(PLATE_ROLES.DESSERT)
    }
  })

  it('ne prend pas un plat pour une sauce parce que son nom contient le mot', () => {
    // « Boulettes de bœuf sauce tomate » est un plat, pas une sauce. Les motifs
    // sont ancrés sur la catégorie ou le début du nom, jamais cherchés au milieu.
    const boulettes = recette('Boulettes de bœuf sauce tomate', 'boulettes', { starch: 5, vegetables: 180, protein: 33 })
    expect(derivePlateRole(boulettes, { compositionKnown: true, hasStarch: false, hasVegetables: true, hasProtein: true }).role)
      .toBe(PLATE_ROLES.MAIN)
    const sauce = recette('Sauce tomate maison', 'sauce')
    expect(derivePlateRole(sauce, { compositionKnown: true }).role).toBe(PLATE_ROLES.COMPONENT)
  })

  it('tient une protéine et un féculent pour un plat complet, la salade restant offerte', () => {
    // Personne ne sert de haricots verts avec une carbonara. Les légumes sont
    // proposés — « une quiche lorraine, ça peut être complet ou bien complété
    // avec une salade » — jamais ajoutés d'office.
    const role = derivePlateRole(recette('Spaghetti carbonara', 'pâtes'), {
      compositionKnown: true, hasStarch: true, hasVegetables: false, hasProtein: true,
    })
    expect(role.role).toBe(PLATE_ROLES.COMPLETE)
    expect(role.accepts).toEqual(['vegetables'])
    expect(buildMealPlate({ ...recette('Spaghetti carbonara', 'pâtes', { starch: 60, protein: 25 }) }, {}).components).toEqual([])
  })

  it('n’accompagne pas ce qui n’a ni protéine ni féculent : c’est déjà une garniture', () => {
    const role = derivePlateRole(recette('Poêlée de champignons', 'poêlée'), {
      compositionKnown: true, hasStarch: false, hasVegetables: true, hasProtein: false,
    })
    expect(role.role).toBe(PLATE_ROLES.SIDE)
  })

  it('laisse la recette déclarer son rôle, et cette déclaration prime', () => {
    const lasagnes = recette('Lasagnes à la bolognaise', 'pâtes au four', { starch: 5, protein: 5 })
    // Sans déclaration, la composition en ferait un plat principal amputé.
    expect(derivePlateRole(lasagnes, { compositionKnown: true, hasStarch: false, hasVegetables: false, hasProtein: true }).role)
      .toBe(PLATE_ROLES.MAIN)
    // Avec déclaration, elle fait foi.
    const declaree = { ...lasagnes, plate: { role: 'complete', accepts: [], reason: 'plat unique' } }
    const role = plateRoleOf(declaree, { compositionKnown: true, hasStarch: false, hasVegetables: false, hasProtein: true })
    expect(role.role).toBe(PLATE_ROLES.COMPLETE)
    expect(role.source).toBe('declared')
    expect(buildMealPlate(declaree, {}).components).toEqual([])
  })

  it('rapporte ce qui manque encore au lieu de l’empiler dans l’assiette', () => {
    // Un peu de citron et d'aneth : la composition est connue, mais ni le
    // féculent ni la portion de légumes n'y sont.
    const plat = recette('Pavé de saumon poêlé', 'poisson', { starch: 2, vegetables: 20, protein: 30 })
    const plate = buildMealPlate(plat, {})
    expect(plate.components).toHaveLength(1)
    expect(plate.components[0].role).toBe('starch')
    // Les légumes manquants sont DITS, pas ajoutés.
    expect(plate.missingUnresolved).toContain('vegetables')
    expect(plate.completeAfter).toBe(false)
  })

  it('ramène l’accompagnement à une proportion défendable du corpus', () => {
    const recipes = getCanonicalRecipes({ servings: 4 })
    const accompagnees = recipes.filter((recipe) => buildMealPlate(recipe, {}).components.length).length
    // Avant : 97 sur 118, soit 82 % du corpus. La borne protège le gain sans
    // figer le chiffre exact, qui bougera à mesure que les recettes déclareront
    // elles-mêmes leur rôle.
    expect(accompagnees / recipes.length).toBeLessThan(0.45)
  })
})
