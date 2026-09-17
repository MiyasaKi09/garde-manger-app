import { describe, expect, it } from 'vitest'
import { mergeIngredientLists, platsDuCreneau } from '@/app/planning/components/CookSession'

/**
 * LA FEUILLE DE CUISSON DU PLANNING, CÔTÉ FICHE FUSIONNÉE — livrable 2.3.
 *
 * Deux fonctions pures, et deux fautes qu'elles évitent.
 *
 * `platsDuCreneau` décide s'il y a un couple à fusionner. Elle doit voir DEUX
 * codes distincts là où deux personnes mangent deux plats, et UN SEUL là où
 * elles mangent le même — sans quoi la feuille appellerait l'API à chaque
 * ouverture pour un couple qui n'existe pas.
 *
 * `mergeIngredientLists` décide ce qu'on déduit du stock. Sa règle historique
 * est le MAXIMUM : deux entrées du même plat ne vident pas deux fois le
 * placard. Cette règle devient fausse le jour où les deux entrées sont deux
 * recettes différentes cuisinées ensemble — c'est exactement la fiche
 * fusionnée — et c'est le seul cas où `sommer` est passé.
 */

const repas = (entries) => ({ entries })

describe('feuille de cuisson — repérer le couple du créneau', () => {
  it('rend deux plats quand deux personnes mangent deux recettes différentes', () => {
    const plats = platsDuCreneau(repas([
      { person_name: 'Julien', canonical_recipe_code: 'FR-008', planned_servings: 1.4 },
      { person_name: 'Zoé', canonical_recipe_code: 'JUM-081', planned_servings: 0.9 },
    ]))
    expect(plats).toEqual([
      { code: 'FR-008', portions: 1.4, mangeurs: ['Julien'] },
      { code: 'JUM-081', portions: 0.9, mangeurs: ['Zoé'] },
    ])
  })

  it('n’en rend qu’un — et additionne les parts — quand les deux mangent le même plat', () => {
    const plats = platsDuCreneau(repas([
      { person_name: 'Julien', canonical_recipe_code: 'JUM-004', planned_servings: 1.5 },
      { person_name: 'Zoé', canonical_recipe_code: 'JUM-004', planned_servings: 1 },
    ]))
    expect(plats).toHaveLength(1)
    expect(plats[0]).toMatchObject({ code: 'JUM-004', portions: 2.5, mangeurs: ['Julien', 'Zoé'] })
  })

  it('ignore les repas sans code canonique — rien à fusionner sans lignée', () => {
    expect(platsDuCreneau(repas([{ person_name: 'Julien', description: 'Restes' }]))).toEqual([])
    expect(platsDuCreneau(null)).toEqual([])
  })

  it('compte une part quand la portion n’est pas déclarée, sans inventer de fraction', () => {
    const plats = platsDuCreneau(repas([{ person_name: 'Zoé', canonical_recipe_code: 'JUM-081' }]))
    expect(plats[0].portions).toBe(1)
  })
})

describe('feuille de cuisson — ce qu’on déduit du stock', () => {
  const oignonA = { key: 'c12', canonical_food_id: 12, name: 'Oignon jaune cru', qty: 200, unit: 'g' }
  const oignonB = { key: 'c12', canonical_food_id: 12, name: 'Oignon jaune cru', qty: 150, unit: 'g' }
  const poulet = { key: 'c33', canonical_food_id: 33, name: 'Cuisse de poulet crue', qty: 500, unit: 'g' }
  const oeuf = { key: 'c44', canonical_food_id: 44, name: 'Œuf cru', qty: 8, unit: 'u' }

  it('garde le maximum par défaut : deux parts du même plat ne vident pas deux fois le placard', () => {
    const fusion = mergeIngredientLists([oignonA], [oignonB])
    expect(fusion).toHaveLength(1)
    expect(fusion[0].qty).toBe(200)
  })

  it('additionne quand la fiche est fusionnée : la casserole nourrit les deux assiettes', () => {
    const fusion = mergeIngredientLists([oignonA, poulet], [oignonB, oeuf], { sommer: true })
    const parNom = Object.fromEntries(fusion.map((ing) => [ing.name, ing.qty]))
    expect(parNom['Oignon jaune cru']).toBe(350)
    // Ce qui n'appartient qu'à une branche traverse intact, dans les deux règles.
    expect(parNom['Cuisse de poulet crue']).toBe(500)
    expect(parNom['Œuf cru']).toBe(8)
  })
})
