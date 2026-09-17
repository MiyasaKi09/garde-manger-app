import { describe, expect, it } from 'vitest'
import { getCanonicalRecipe, getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import {
  RAISONS,
  coupleFusionnable,
  ficheFusionnee,
  preparationsDistinctes,
} from '@/lib/domain/recipes/ficheFusionnee'

/**
 * LA FICHE FUSIONNÉE, À L'EXÉCUTION — livrable 2.3.
 *
 * `tests/data/fichesFusionnees.test.js` relit l'arbitrage contre le corpus.
 * Celui-ci vérifie ce que le moteur en FAIT : qu'il refuse ce qui n'est pas
 * déclaré et le dit, qu'il ne réécrit aucune instruction, que la casserole
 * commune reçoit la SOMME des deux assiettes et non le maximum, et que P9
 * compte un couple fusionné pour une préparation — pas pour zéro, pas pour
 * deux.
 */

/** La même recette, mise à l'échelle du nombre de parts réellement servies. */
const recetteAEchelle = (code, parts) => getCanonicalRecipes({ eligibleOnly: false, servings: parts })
  .find((recette) => recette.code === code)

const carne = () => getCanonicalRecipe('FR-008')
const vege = () => getCanonicalRecipe('JUM-081')

describe('fiche fusionnée — ce qu’elle refuse', () => {
  it('refuse un couple non déclaré, et nomme les deux codes', () => {
    const fiche = ficheFusionnee({ carne: getCanonicalRecipe('IT-004'), vege: getCanonicalRecipe('JUM-081') })
    expect(fiche.fusionnee).toBe(false)
    expect(fiche.raison.code).toBe(RAISONS.NON_DECLARE)
    expect(fiche.raison.message).toContain('IT-004')
    expect(fiche.raison.message).toContain('JUM-081')
  })

  it('refuse un couple relu ET refusé, en rendant le motif de la relecture', () => {
    const fiche = ficheFusionnee({ carne: getCanonicalRecipe('SRC-008'), vege: getCanonicalRecipe('JUM-002') })
    expect(fiche.fusionnee).toBe(false)
    expect(fiche.raison.code).toBe(RAISONS.DECLARE_NON_FUSIONNABLE)
    // Le motif est celui de l'arbitrage, pas une phrase fabriquée ici.
    expect(fiche.raison.message).toContain('Deux méthodes, pas deux finitions')
  })

  it('refuse plutôt que de servir une fiche à trous quand une étape déclarée a disparu', () => {
    const ampute = { ...carne(), exactSteps: carne().exactSteps.slice(0, 2) }
    const fiche = ficheFusionnee({ carne: ampute, vege: vege() })
    expect(fiche.fusionnee).toBe(false)
    expect(fiche.raison.code).toBe(RAISONS.DECLARATION_PERIMEE)
  })

  it('refuse sans les deux recettes', () => {
    expect(ficheFusionnee({ carne: carne(), vege: null }).raison.code).toBe(RAISONS.RECETTE_MANQUANTE)
  })
})

describe('fiche fusionnée — ce qu’elle rend', () => {
  const fiche = ficheFusionnee({
    carne: carne(),
    vege: vege(),
    mangeursCarne: ['Julien'],
    mangeursVege: ['Zoé'],
  })

  it('fusionne le couple déclaré et garde chaque branche à sa place', () => {
    expect(fiche.fusionnee).toBe(true)
    expect(fiche.carne.code).toBe('FR-008')
    expect(fiche.vege.code).toBe('JUM-081')
    expect(fiche.carne.mangeurs).toEqual(['Julien'])
    expect(fiche.vege.mangeurs).toEqual(['Zoé'])
  })

  it('rend la même fiche quel que soit l’ordre des deux recettes', () => {
    const inverse = ficheFusionnee({
      carne: vege(),
      vege: carne(),
      mangeursCarne: ['Zoé'],
      mangeursVege: ['Julien'],
    })
    expect(inverse.fusionnee).toBe(true)
    expect(inverse.carne.code).toBe('FR-008')
    expect(inverse.carne.mangeurs).toEqual(['Julien'])
    expect(inverse.vege.mangeurs).toEqual(['Zoé'])
  })

  it('n’affiche que des instructions du corpus, mot pour mot', () => {
    const parCode = { carne: carne(), vege: vege() }
    for (const bloc of fiche.blocs) {
      const etapes = bloc.role === 'divergente' ? [...bloc.carne, ...bloc.vege] : bloc.etapes
      for (const etape of etapes) {
        const source = bloc.role === 'divergente'
          ? [...parCode.carne.exactSteps, ...parCode.vege.exactSteps]
          : parCode[bloc.texte].exactSteps
        expect(source.some((reference) => reference.instruction === etape.instruction)).toBe(true)
      }
    }
  })

  it('place le point de divergence au premier bloc divergent qui suit un bloc commun', () => {
    // FR-008 / JUM-081 : le poulet doré est un bloc divergent AVANT toute mise
    // en commun — ce n'est pas le point de divergence, rien n'a encore été mis
    // en commun. Le point de divergence est la séparation de la piperade.
    expect(fiche.blocs[0].role).toBe('divergente')
    expect(fiche.blocs[1].role).toBe('commune')
    expect(fiche.pointDeDivergence).toBe(2)
    expect(fiche.blocs[2].role).toBe('divergente')
  })

  it('met dans la casserole commune la SOMME des deux assiettes, jamais le maximum', () => {
    const tomate = fiche.ingredients.communs.find((ingredient) => ingredient.name === 'Tomate concassée en conserve')
    const tomateCarne = carne().exactIngredients.find((ingredient) => ingredient.name === 'Tomate concassée en conserve')
    const tomateVege = vege().exactIngredients.find((ingredient) => ingredient.name === 'Tomate concassée en conserve')
    expect(tomate.quantity).toBe(tomateCarne.quantity + tomateVege.quantity)
    expect(tomate.part_carnee).toBe(tomateCarne.quantity)
    expect(tomate.part_vegetarienne).toBe(tomateVege.quantity)
  })

  it('range la protéine de chacun dans sa branche, et le jambon facultatif hors de la base commune', () => {
    const communs = fiche.ingredients.communs.map((ingredient) => ingredient.name)
    expect(communs).not.toContain('Cuisse de poulet crue, avec os, avec peau')
    expect(communs).not.toContain('Œuf cru')
    expect(communs).not.toContain('Jambon de Bayonne')
    expect(fiche.ingredients.brancheCarnee.map((ingredient) => ingredient.name))
      .toContain('Cuisse de poulet crue, avec os, avec peau')
    expect(fiche.ingredients.brancheVegetarienne.map((ingredient) => ingredient.name)).toContain('Œuf cru')
    expect(fiche.exclusions.map((exclusion) => exclusion.forme)).toContain('Jambon de Bayonne')
  })

  it('ne laisse aucune forme d’origine animale non végétarienne dans la casserole commune', () => {
    const interdites = fiche.ingredients.communs
      .filter((ingredient) => !['vegetal', 'mineral', 'animal:oeuf', 'animal:lait', 'animal:miel'].includes(ingredient.origin))
    expect(interdites.map((ingredient) => ingredient.name)).toEqual([])
  })

  it('compte ce qu’elle mutualise, sans confondre commun et parallèle', () => {
    expect(fiche.compte.blocsCommuns).toBe(1)
    expect(fiche.compte.blocsParalleles).toBe(0)
    expect(fiche.compte.blocsDivergents).toBe(2)
    expect(fiche.compte.etapesCarne).toBe(carne().exactSteps.length)
  })
})

describe('fiche fusionnée — le suivi des portions, échelle par échelle', () => {
  it('suit la mise à l’échelle de chaque branche : deux assiettes de Julien, une de Zoé', () => {
    // Le foyer ne mange pas six parts de basquaise et quatre d'œufs : chaque
    // branche est mise à l'échelle de ses mangeurs AVANT d'arriver ici, et la
    // casserole commune doit suivre. FR-008 est écrite pour 6, JUM-081 pour 4 :
    // à deux parts et une part, l'oignon commun vaut 250/6 × 2 + 150/4 × 1.
    const pourJulien = recetteAEchelle('FR-008', 2)
    const pourZoe = recetteAEchelle('JUM-081', 1)
    const oignonJulien = pourJulien.exactIngredients.find((ingredient) => ingredient.name === 'Oignon jaune cru')
    const oignonZoe = pourZoe.exactIngredients.find((ingredient) => ingredient.name === 'Oignon jaune cru')
    expect(Math.round(oignonJulien.quantity)).toBe(Math.round(250 / 6 * 2))
    expect(Math.round(oignonZoe.quantity)).toBe(Math.round(150 / 4))

    const fiche = ficheFusionnee({ carne: pourJulien, vege: pourZoe })
    const oignon = fiche.ingredients.communs.find((ingredient) => ingredient.name === 'Oignon jaune cru')
    expect(oignon.quantity).toBeCloseTo(oignonJulien.quantity + oignonZoe.quantity, 2)
    expect(oignon.part_carnee).toBeCloseTo(oignonJulien.quantity, 2)
    expect(oignon.part_vegetarienne).toBeCloseTo(oignonZoe.quantity, 2)
  })
})

describe('P9 — ce que la fusion change au compte des plats à cuisiner', () => {
  const creneau = (date, type, codes) => codes.map((code) => ({
    meal_date: date, meal_type: type, canonical_recipe_code: code,
  }))

  it('compte un couple déclaré fusionnable pour une seule préparation', () => {
    const repas = [
      ...creneau('2026-09-25', 'dejeuner', ['FR-008', 'JUM-081']),
      ...creneau('2026-09-25', 'diner', ['PROT-002']),
    ]
    const mesure = preparationsDistinctes(repas)
    expect(mesure.platsServis).toBe(3)
    expect(mesure.preparations).toBe(2)
    expect(mesure.fusions).toHaveLength(1)
    expect(mesure.fusions[0]).toMatchObject({ carne: 'FR-008', vege: 'JUM-081' })
  })

  it('ne fusionne pas un couple relu et refusé : deux casseroles, deux préparations', () => {
    const mesure = preparationsDistinctes(creneau('2026-09-30', 'diner', ['PROT-008', 'JUM-123']))
    expect(coupleFusionnable('PROT-008', 'JUM-123')).toBe(false)
    expect(mesure.preparations).toBe(2)
    expect(mesure.fusions).toEqual([])
  })

  it('ne fusionne pas deux plats servis à des créneaux différents', () => {
    const repas = [
      ...creneau('2026-09-25', 'dejeuner', ['FR-008']),
      ...creneau('2026-09-26', 'diner', ['JUM-081']),
    ]
    expect(preparationsDistinctes(repas).preparations).toBe(2)
  })

  it('ne compte qu’une fois un plat servi fusionné un jour et seul un autre', () => {
    const repas = [
      ...creneau('2026-09-25', 'dejeuner', ['FR-008', 'JUM-081']),
      ...creneau('2026-09-27', 'diner', ['FR-008']),
    ]
    const mesure = preparationsDistinctes(repas)
    expect(mesure.preparations).toBe(1)
    expect(mesure.classes).toEqual([['FR-008', 'JUM-081']])
  })
})
