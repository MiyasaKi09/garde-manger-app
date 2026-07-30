import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DESSERTS, FAUX_AMIS } from '../../scripts/data/recipes/assign-dessert-roles.mjs'

/**
 * Le planificateur a servi un kouign-amann comme repas du soir, trois fois dans
 * la même semaine. Le moteur n'y était pour rien : aucune recette sucrée ne
 * déclarait de rôle d'assiette, et rien ne pouvait donc savoir que ce n'était
 * pas un dîner.
 *
 * Ces tests verrouillent la donnée. La règle du moteur est vérifiée ailleurs
 * (tests/planning/dessertRole.test.js) ; ici on garantit qu'elle a de quoi
 * mordre, et surtout qu'elle ne mord pas sur les mauvais plats.
 */
const corpus = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'corpus-v3.json'), 'utf8'))
const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))

describe('rôle dessert au corpus', () => {
  it('chaque dessert déclaré porte le rôle et son motif', () => {
    for (const decision of DESSERTS) {
      const recette = parCode.get(decision.code)
      expect(recette, `${decision.code} absent du corpus`).toBeTruthy()
      expect(recette.plate?.role, `${decision.code} ${recette.family}`).toBe('dessert')
      // Un dessert ne se complète pas, il complète.
      expect(recette.plate.accepts).toEqual([])
      expect(String(recette.plate.reason || '').length).toBeGreaterThan(20)
    }
  })

  it('le kouign-amann, qui a rendu le défaut visible, est un dessert', () => {
    expect(parCode.get('REAL-089').plate.role).toBe('dessert')
  })

  /**
   * LE test de ce lot. La catégorie du corpus ment : « Idli » y est rangé en
   * « gâteau vapeur fermenté » et « Tteokbokki » en « gâteaux de riz pimentés ».
   * Le premier est une galette de riz salée mangée avec un sambar, le second un
   * plat de rue coréen au gochujang. Une règle sur le libellé les aurait classés
   * desserts et sortis des repas — la faute qu'on répare, mais dans l'autre sens.
   *
   * Le même piège avait déjà pris le moteur, qui captait « Tarte aux poireaux et
   * lardons » par un motif sur « tarte aux ».
   */
  it('les faux amis de la catégorie restent des plats salés', () => {
    for (const faux of FAUX_AMIS) {
      const recette = parCode.get(faux.code)
      expect(recette, `${faux.code} absent du corpus`).toBeTruthy()
      expect(recette.plate?.role, `${faux.code} ${recette.family} n’est pas un dessert`).not.toBe('dessert')
    }
  })

  it('aucun dessert ne déclare accepter un accompagnement', () => {
    const desserts = corpus.recipes.filter((recette) => recette.plate?.role === 'dessert')
    expect(desserts.length).toBeGreaterThanOrEqual(DESSERTS.length)
    for (const recette of desserts) {
      expect(recette.plate.accepts, `${recette.code} ${recette.family}`).toEqual([])
    }
  })
})
