import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { buildStorageDecision } from '@/lib/storageDecisionServer'

const MAX_ITEMS = 100

/**
 * POST /api/courses/storage-plan
 * Prévisualise les mêmes décisions que l'endpoint de rangement.
 * Body: { items: [{ id, productName, category?, canonicalFoodId?, archetypeId?,
 *                   purchaseState?, foodState?, storageMethod?, useByDate?,
 *                   bestBeforeDate?, acquiredOn? }] }
 */
export async function POST(request) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : []
    if (items.length === 0 || items.length > MAX_ITEMS) {
      return NextResponse.json({ error: `Entre 1 et ${MAX_ITEMS} articles requis` }, { status: 400 })
    }

    const decisions = await Promise.all(items.map(async item => {
      if (!item?.productName) {
        return { id: item?.id ?? null, error: 'productName requis' }
      }
      try {
        const decision = await buildStorageDecision(supabase, item)
        return { id: item.id ?? null, decision }
      } catch (error) {
        return { id: item.id ?? null, error: error.message }
      }
    }))

    return NextResponse.json({ decisions })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

