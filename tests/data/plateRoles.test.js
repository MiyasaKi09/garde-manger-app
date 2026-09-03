import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DECISIONS, FAUX_AMIS } from '../../scripts/data/recipes/assign-plate-roles.mjs'

/**
 * L'utilisateur a ouvert son planning et y a trouvé « Far breton aux pruneaux »
 * servi au DÎNER de dimanche. Le moteur n'y était pour rien : sa règle refuse
 * qu'un dessert occupe un créneau de repas, mais elle ne se fie qu'au rôle
 * DÉCLARÉ, et REAL-091 n'en déclarait aucun.
 *
 * Ces tests verrouillent la donnée. La règle du moteur est vérifiée ailleurs
 * (tests/planning/plateRole.test.js et tests/planning/dessertRole.test.js) ;
 * ici on garantit qu'elle a de quoi mordre — et surtout qu'elle ne mord pas sur
 * les cinq TARTES SALÉES qui portent, elles aussi, un mot de dessert au libellé.
 */
const corpus = JSON.parse(readFileSync(join(process.cwd(), 'data', 'recipes', 'corpus-v3.json'), 'utf8'))
const rapportAliments = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts', 'data', 'out', 'recipe-food-match-report.json'), 'utf8'),
)
const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))

const ROLES = new Set(['complete', 'main', 'side', 'component', 'dessert'])
const COMPOSANTES = new Set(['starch', 'vegetables'])
/** Les cinq salées que le libellé rapproche du sucré. C'est le cas qui a rendu le défaut visible. */
const TARTES_SALEES = ['FR-005', 'FR-029', 'FR-036', 'REAL-088', 'REAL-300']

describe('rôles d’assiette au corpus', () => {
  it('chaque décision du lot est posée au corpus, avec son motif', () => {
    for (const decision of DECISIONS) {
      const recette = parCode.get(decision.code)
      expect(recette, `${decision.code} absent du corpus`).toBeTruthy()
      // Vérifie du même coup qu'aucun rôle préexistant n'a été écrasé : le
      // script refuse d'écrire par-dessus une déclaration différente, donc un
      // rôle qui ne correspond pas signifie que la décision n'a pas pris.
      expect(recette.plate?.role, `${decision.code} ${recette.family}`).toBe(decision.role)
      expect(recette.plate.accepts, `${decision.code} ${recette.family}`).toEqual(decision.accepts)
      expect(String(recette.plate.reason || '').length, `motif de ${decision.code}`).toBeGreaterThan(40)
    }
  })

  it('le far breton, qui a rendu le défaut visible, est un dessert sans accompagnement', () => {
    const far = parCode.get('REAL-091')
    expect(far.family).toBe('Far breton aux pruneaux')
    expect(far.plate.role).toBe('dessert')
    // Un dessert ne se complète pas, il complète.
    expect(far.plate.accepts).toEqual([])
  })

  /**
   * LE test de ce lot, dans l'autre sens. Sur les 94 fiches, six seulement
   * portaient au libellé un mot évoquant le sucré et CINQ SONT SALÉES : quatre
   * « tarte salée » au corpus, et un beef stroganoff dont la catégorie parle de
   * « crème » — de la crème aigre. Un motif sur « tarte aux » avait déjà sorti
   * « Tarte aux poireaux et lardons » des repas ; il ne doit plus jamais le
   * faire.
   */
  it('les cinq tartes salées ne sont pas des desserts', () => {
    for (const code of TARTES_SALEES) {
      const recette = parCode.get(code)
      expect(recette, `${code} absent du corpus`).toBeTruthy()
      expect(recette.plate?.role, `${code} ${recette.family} n’est pas un dessert`).not.toBe('dessert')
      // Elles restent servables en repas : c'est tout l'enjeu.
      expect(['complete', 'main']).toContain(recette.plate.role)
    }
  })

  it('les faux amis consignés restent des plats salés', () => {
    for (const faux of FAUX_AMIS) {
      const recette = parCode.get(faux.code)
      expect(recette, `${faux.code} absent du corpus`).toBeTruthy()
      expect(recette.plate?.role, `${faux.code} ${recette.family} n’est pas un dessert`).not.toBe('dessert')
      expect(String(faux.pourquoi || '').length, `motif d’écart de ${faux.code}`).toBeGreaterThan(40)
    }
  })

  it('aucun dessert ne déclare accepter un accompagnement', () => {
    for (const recette of corpus.recipes.filter((item) => item.plate?.role === 'dessert')) {
      expect(recette.plate.accepts, `${recette.code} ${recette.family}`).toEqual([])
    }
  })

  it('le vocabulaire des rôles reste fermé sur tout le corpus', () => {
    for (const recette of corpus.recipes) {
      if (!recette.plate) continue
      expect(ROLES, `${recette.code} ${recette.family}`).toContain(recette.plate.role)
      // Un accompagnement, une base ou un dessert n'en reçoit jamais.
      if (['side', 'component', 'dessert'].includes(recette.plate.role)) {
        expect(recette.plate.accepts, `${recette.code} ${recette.family}`).toEqual([])
      }
    }
  })

  /**
   * L'assertion est bornée aux 94 fiches de ce lot, et pas au corpus entier,
   * parce que six déclarations antérieures écrivent « vegetable » au singulier
   * (DEN-001 et cinq autres). `declaredPlateRole` filtre silencieusement toute
   * composante hors de COMPOSANTES_ADJOIGNABLES : ces six-là perdent donc leur
   * offre de légume sans que rien ne le signale. Ce défaut est réel mais il
   * n'appartient pas à ce lot — une déclaration existante ne se réécrit pas.
   */
  it('les accompagnements du lot restent dans le vocabulaire du moteur', () => {
    for (const decision of DECISIONS) {
      const recette = parCode.get(decision.code)
      for (const composante of recette.plate.accepts || []) {
        expect(COMPOSANTES, `${decision.code} ${recette.family} accepte « ${composante} »`).toContain(composante)
      }
    }
  })

  /**
   * L'invariant du lot : le rôle déclaré est la seule chose sur laquelle la
   * règle dure s'appuie, donc une recette publiable qui n'en porte pas est une
   * recette que rien n'empêche d'atterrir au dîner. Ce test échoue au prochain
   * lot de recettes tant que leurs rôles ne sont pas arbitrés — c'est voulu.
   */
  it('aucune recette publiable ne part sans rôle d’assiette', () => {
    const publiables = new Set(
      rapportAliments.recipe_eligibility.filter((item) => item.eligible_for_publication).map((item) => item.code),
    )
    const orphelines = corpus.recipes
      .filter((recette) => publiables.has(recette.code) && !recette.plate?.role)
      .map((recette) => `${recette.code} ${recette.family}`)
    expect(orphelines, 'à arbitrer avant publication, comme le far breton').toEqual([])
  })
})
