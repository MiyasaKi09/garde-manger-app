import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Livrable 4.5 — la porte de `/api/courses/rebuild`, éprouvée en l'ouvrant.
 *
 * POURQUOI CE FICHIER EST SÉPARÉ de `sourceDeVeriteListe.test.js` : pour savoir
 * si la route reconstruit ou non, il faut remplacer ses trois ouvriers par des
 * doublures et compter leurs appels. `vi.mock` porte sur tout le fichier, et le
 * banc de mesure de l'autre fichier a besoin du VRAI `shoppingListBuilder` pour
 * mesurer ce qu'il ferait. Les deux ne peuvent donc pas cohabiter.
 *
 * CE QUE CE FICHIER VÉRIFIE, ET QUI NE SE VÉRIFIE PAS EN LISANT LE FICHIER
 * SOURCE : qu'aucun des trois ouvriers n'est appelé quand la demande canonique
 * tient la liste. Un test qui se contenterait de chercher `sourceDeVeriteDeLaListe`
 * dans le texte de la route resterait vert si la porte était court-circuitée.
 */

const ouvriers = vi.hoisted(() => ({
  reconstruire: vi.fn(async () => ({ items: 11, mode: 'rebuilt' })),
  assurerRecettes: vi.fn(async () => ({ created: 0, matched: 0 })),
  relierRecettes: vi.fn(async () => ({})),
  authentifier: vi.fn(),
}))

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: ouvriers.authentifier }))
vi.mock('@/lib/shoppingListBuilder', () => ({ rebuildShoppingListFromImport: ouvriers.reconstruire }))
vi.mock('@/lib/recipeImporter', () => ({ ensureRecipesForImport: ouvriers.assurerRecettes }))
vi.mock('@/lib/ingredientResolver', () => ({ linkRecipesForUser: ouvriers.relierRecettes }))

const { POST } = await import('@/app/api/courses/rebuild/route')

/** Un client Supabase de banc qui sert `lignes` et note toute écriture. */
function clientDeBanc(lignes, ecritures, { erreurDeLecture = null } = {}) {
  const construire = (nom) => {
    const api = {
      select: () => api,
      eq: () => api,
      order: () => api,
      limit: () => api,
      insert: () => { ecritures.push(`insert:${nom}`); return Promise.resolve({ data: null, error: null }) },
      update: () => { ecritures.push(`update:${nom}`); return { eq: () => Promise.resolve({ data: null, error: null }) } },
      delete: () => { ecritures.push(`delete:${nom}`); return { eq: () => Promise.resolve({ data: null, error: null }) } },
      then: (ok, ko) => Promise.resolve(
        nom === 'nutrition_plan_shopping_items'
          ? { data: erreurDeLecture ? null : lignes, error: erreurDeLecture }
          : { data: [], error: null },
      ).then(ok, ko),
    }
    return api
  }
  return { from: construire }
}

function requete(corps) {
  return { json: async () => corps }
}

const LIGNE_CANONIQUE = {
  plan_version_id: '7f0b2a10-0000-4000-8000-00000000d1ff',
  planning_source: 'final_demands',
  purchase_qty: 420, purchase_unit: 'g',
  container_qty: null, container_size: null, container_unit: null,
  aisle_order: 1, shopping_status: 'needed', exact_required_qty: 418.5,
}
const LIGNE_HERITEE = {
  plan_version_id: null, planning_source: null,
  purchase_qty: null, purchase_unit: null,
  container_qty: null, container_size: null, container_unit: null,
  aisle_order: null, shopping_status: null, exact_required_qty: null,
}

describe('POST /api/courses/rebuild — la convergence, éprouvée', () => {
  let ecritures

  beforeEach(() => {
    ecritures = []
    ouvriers.reconstruire.mockClear()
    ouvriers.assurerRecettes.mockClear()
    ouvriers.relierRecettes.mockClear()
  })

  const brancher = (lignes, options) => {
    const client = clientDeBanc(lignes, ecritures, options)
    ouvriers.authentifier.mockResolvedValue({ supabase: client, user: { id: 'u-1' }, error: null })
    return client
  }

  it('sur une liste tenue par la demande canonique : aucune écriture, aucun ouvrier appelé', async () => {
    brancher([LIGNE_CANONIQUE, LIGNE_CANONIQUE, LIGNE_CANONIQUE])
    const reponse = await POST(requete({ importId: 42 }))
    const corps = await reponse.json()

    expect(reponse.status).toBe(200)
    expect(corps.converged).toBe(true)
    expect(corps.mode).toBe('demande_canonique')
    expect(corps.items).toBe(3)
    expect(corps.canoniques).toBe(3)

    // C'est ici que la porte se prouve : les trois ouvriers n'ont pas travaillé.
    expect(ouvriers.reconstruire).not.toHaveBeenCalled()
    expect(ouvriers.assurerRecettes).not.toHaveBeenCalled()
    expect(ouvriers.relierRecettes).not.toHaveBeenCalled()
    expect(ecritures).toEqual([])
  })

  it('une seule ligne canonique dans un mélange suffit à fermer la porte', async () => {
    brancher([LIGNE_HERITEE, LIGNE_HERITEE, LIGNE_CANONIQUE])
    const corps = await (await POST(requete({ importId: 42 }))).json()

    expect(corps.converged).toBe(true)
    expect(corps.canoniques).toBe(1)
    expect(corps.heritees).toBe(2)
    expect(ouvriers.reconstruire).not.toHaveBeenCalled()
  })

  it('sur un plan ancien, la route reconstruit comme avant — elle n’est pas supprimée', async () => {
    brancher([LIGNE_HERITEE, LIGNE_HERITEE])
    const corps = await (await POST(requete({ importId: 7 }))).json()

    expect(corps.converged).toBe(false)
    expect(corps.mode).toBe('rebuilt')
    expect(corps.items).toBe(11)
    expect(ouvriers.reconstruire).toHaveBeenCalledTimes(1)
    expect(ouvriers.assurerRecettes).toHaveBeenCalledTimes(1)
  })

  it('sur un import sans aucune ligne, la route reconstruit : c’est le cas d’usage du bouton', async () => {
    brancher([])
    await POST(requete({ importId: 7 }))
    expect(ouvriers.reconstruire).toHaveBeenCalledTimes(1)
  })

  it('une lecture en échec ne vaut pas « liste héritée » : la route refuse et ne reconstruit pas', async () => {
    brancher([LIGNE_CANONIQUE], { erreurDeLecture: { message: 'connexion perdue' } })
    const reponse = await POST(requete({ importId: 42 }))
    const corps = await reponse.json()

    expect(reponse.status).toBe(503)
    expect(corps.error).toMatch(/indéterminée/)
    expect(ouvriers.reconstruire).not.toHaveBeenCalled()
  })

  /**
   * La décision est prise CÔTÉ SERVEUR, à la lecture des lignes. Un appelant qui
   * se déclarerait hérité dans son corps de requête ne doit rien pouvoir
   * écraser — c'est la raison pour laquelle la route relit plutôt que de croire.
   */
  it('le corps de la requête ne peut pas ouvrir la porte', async () => {
    brancher([LIGNE_CANONIQUE])
    const corps = await (await POST(requete({
      importId: 42, converged: false, source: 'chemin_herite', force: true, planning_source: null,
    }))).json()

    expect(corps.converged).toBe(true)
    expect(ouvriers.reconstruire).not.toHaveBeenCalled()
  })

  it('sans authentification, rien ne se lit et rien ne s’écrit', async () => {
    ouvriers.authentifier.mockResolvedValue({ supabase: null, user: null, error: new Error('non') })
    const reponse = await POST(requete({ importId: 42 }))
    expect(reponse.status).toBe(401)
    expect(ouvriers.reconstruire).not.toHaveBeenCalled()
  })
})
