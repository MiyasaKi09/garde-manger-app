import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))
vi.mock('@/lib/db/operationalRecipeCatalog', () => ({ getEditorialRecipe: vi.fn() }))

import { GET } from '@/app/api/planning/fiche-fusionnee/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { getEditorialRecipe } from '@/lib/db/operationalRecipeCatalog'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

/**
 * LA ROUTE DE LA FICHE FUSIONNÉE — livrable 2.3.
 *
 * Ce qu'elle doit tenir, et qui ne se voit pas dans le domaine : qu'elle
 * demande une authentification, qu'elle NE LISE PAS LA BASE quand le couple
 * n'est pas déclaré (deux recettes chargées pour rien à chaque ouverture de
 * feuille), et qu'elle remette les portions sur la bonne branche même quand
 * l'écran passe les deux codes dans l'autre sens — l'écran a deux assiettes, il
 * ne sait pas laquelle est la carnée.
 *
 * Le catalogue de base est remplacé par le corpus du dépôt : la CI n'a pas de
 * base, et ce qui est vérifié ici est la route, pas Supabase.
 */

const recette = (code, parts) => getCanonicalRecipes({ eligibleOnly: false, servings: parts })
  .find((item) => item.code === code)

const requete = (query) => ({ url: `https://myko.test/api/planning/fiche-fusionnee?${query}` })

describe('GET /api/planning/fiche-fusionnee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticateRequest.mockResolvedValue({ supabase: {}, user: { id: 'u1' }, error: null })
    getEditorialRecipe.mockImplementation(async (_supabase, code, options) => recette(code, options?.servings ?? null) || null)
  })

  it('exige une authentification', async () => {
    authenticateRequest.mockResolvedValue({ supabase: null, user: null, error: 'Non authentifié' })
    const reponse = await GET(requete('a=FR-008&b=JUM-081'))
    expect(reponse.status).toBe(401)
    expect(getEditorialRecipe).not.toHaveBeenCalled()
  })

  it('refuse deux codes mal formés sans rien charger', async () => {
    const reponse = await GET(requete('a=FR-008&b='))
    expect(reponse.status).toBe(400)
    expect(getEditorialRecipe).not.toHaveBeenCalled()
  })

  it('ne charge aucune recette quand le couple n’est pas déclaré', async () => {
    const reponse = await GET(requete('a=IT-004&b=JUM-081'))
    expect(reponse.status).toBe(200)
    expect(await reponse.json()).toMatchObject({ fusionnee: false, raison: { code: 'non_declare' } })
    expect(getEditorialRecipe).not.toHaveBeenCalled()
  })

  it('rend le motif de la relecture pour un couple déclaré non fusionnable', async () => {
    const reponse = await GET(requete('a=SRC-008&b=JUM-002'))
    const corps = await reponse.json()
    expect(corps.fusionnee).toBe(false)
    expect(corps.raison.code).toBe('declare_non_fusionnable')
    expect(corps.raison.message).toContain('Deux méthodes, pas deux finitions')
  })

  it('sert la fiche d’un couple déclaré, portions et mangeurs sur la bonne branche', async () => {
    const reponse = await GET(requete('a=FR-008&b=JUM-081&portionsA=2&portionsB=1&mangeursA=Julien&mangeursB=Zo%C3%A9'))
    const corps = await reponse.json()
    expect(corps.fusionnee).toBe(true)
    expect(corps.carne).toMatchObject({ code: 'FR-008', servings: 2, mangeurs: ['Julien'] })
    expect(corps.vege).toMatchObject({ code: 'JUM-081', servings: 1, mangeurs: ['Zoé'] })
    expect(getEditorialRecipe).toHaveBeenCalledWith({}, 'FR-008', { servings: 2, includeComponents: false })
    expect(getEditorialRecipe).toHaveBeenCalledWith({}, 'JUM-081', { servings: 1, includeComponents: false })
  })

  it('remet les portions sur la bonne branche quand l’écran passe les codes à l’envers', async () => {
    const reponse = await GET(requete('a=JUM-081&b=FR-008&portionsA=1&portionsB=2&mangeursA=Zo%C3%A9&mangeursB=Julien'))
    const corps = await reponse.json()
    expect(corps.carne).toMatchObject({ code: 'FR-008', servings: 2, mangeurs: ['Julien'] })
    expect(corps.vege).toMatchObject({ code: 'JUM-081', servings: 1, mangeurs: ['Zoé'] })
  })

  it('dit quand le catalogue ne sert pas l’une des deux recettes, au lieu de fusionner à moitié', async () => {
    getEditorialRecipe.mockImplementation(async (_supabase, code) => (code === 'FR-008' ? recette('FR-008', null) : null))
    const corps = await (await GET(requete('a=FR-008&b=JUM-081'))).json()
    expect(corps).toMatchObject({ fusionnee: false, raison: { code: 'recette_manquante' } })
    expect(corps.raison.message).toContain('JUM-081')
  })
})
