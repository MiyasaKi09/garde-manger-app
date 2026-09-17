import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { nouveautes } from '@/lib/domain/recipes/versement'

/**
 * LES NOUVEAUTÉS DU CATALOGUE, POUR L'ACCUEIL.
 *
 * POURQUOI CETTE ROUTE EXISTE À CÔTÉ DE `/api/recipes/catalog`. La page des
 * recettes reçoit déjà toutes les cartes et calcule ses nouveautés elle-même.
 * L'accueil, lui, n'a besoin que d'un compte et d'une date : lui faire charger
 * le catalogue éditorial coûterait l'assemblage JSON des ingrédients et des
 * étapes de 500 recettes pour afficher une tuile. La RPC
 * `get_recipe_pour_summary_v3` (20260919140000) ne rend que code, titre,
 * origine et date.
 *
 * ELLE NE FABRIQUE AUCUN CHIFFRE. Les comptes viennent des métadonnées de la
 * RPC ; le verdict d'affichage (`semaine` / `dernier_lot` / `aucune_date`) vient
 * de `lib/domain/recipes/versement.js`, la même arithmétique que la page des
 * recettes emploie. Deux écrans qui compteraient chacun à leur façon finiraient
 * par afficher deux nombres différents pour la même semaine.
 */

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' }

function jsonNoStore(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...(init.headers || {}) },
  })
}

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return jsonNoStore({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('get_recipe_pour_summary_v3', { p_since: null })
  if (error) {
    console.error('[recipes/nouveautes] résumé des versements indisponible', error)
    return jsonNoStore({ error: 'Les nouveautés sont momentanément indisponibles.' }, { status: 503 })
  }

  const recettes = Array.isArray(data?.recipes) ? data.recipes : []
  const resume = nouveautes(recettes)

  // `catalogue` est REMPLACÉ par ce que la base déclare : la RPC ne renvoie que
  // les recettes datées, si bien que le compte des non datées calculé sur cette
  // liste vaudrait toujours 0. Le chiffre qui compte — 706 recettes sans date —
  // vient des métadonnées, et il est affiché parce qu'un lot de 48 ne doit pas
  // avoir l'air d'être tout le catalogue.
  const metadata = data?.metadata || {}
  return jsonNoStore({
    ...resume,
    catalogue: {
      total: metadata.catalogCount ?? null,
      datees: metadata.pouredCount ?? null,
      nonDatees: metadata.undatedCount ?? null,
    },
    tronque: (metadata.matchingCount ?? 0) > (metadata.returnedCount ?? 0),
    metadata,
  })
}
