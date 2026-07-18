import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import {
  POST as legacyPost,
  DELETE as legacyDelete,
} from '@/lib/server/legacyMealCookRoute'

export const dynamic = 'force-dynamic'

async function resolvePublishedSlot(supabase, userId, mealDate, mealType) {
  const { data: slots, error } = await supabase
    .from('meal_plan_slots')
    .select('id, cooked_dish_id, plan_version_id')
    .eq('user_id', userId)
    .eq('meal_date', mealDate)
    .eq('meal_type', mealType)
    .limit(10)
  if (error || !slots?.length) return null

  const versionIds = [...new Set(slots.map((slot) => slot.plan_version_id).filter(Boolean))]
  if (!versionIds.length) return null
  const { data: versions, error: versionError } = await supabase
    .from('meal_plan_versions')
    .select('id')
    .in('id', versionIds)
    .eq('status', 'published')
    .limit(1)
  if (versionError || !versions?.length) return null
  return slots.find((slot) => String(slot.plan_version_id) === String(versions[0].id)) || null
}

async function productionSourceState(supabase, userId, slotId) {
  if (!slotId) return { kind: 'none' }
  const { data: consumptions, error } = await supabase
    .from('planned_consumptions')
    .select('planned_production_id, cooked_dish_id')
    .eq('user_id', userId)
    .eq('slot_id', slotId)
    .limit(20)

  // Déploiement croisé avant P2 : l'ancienne route reste fonctionnelle.
  if (error?.code === '42P01' || error?.code === '42703') return { kind: 'none' }
  if (error) throw new Error(`Lecture de la source du repas impossible : ${error.message}`)

  if ((consumptions || []).some((item) => item.cooked_dish_id != null)) {
    return { kind: 'prepared' }
  }

  const productionIds = [...new Set((consumptions || [])
    .map((item) => item.planned_production_id)
    .filter(Boolean))]
  if (!productionIds.length) return { kind: 'none' }

  const { data: productions, error: productionError } = await supabase
    .from('planned_productions')
    .select('status, materialized_cooked_dish_id')
    .eq('user_id', userId)
    .in('id', productionIds)
  if (productionError) throw new Error(`Lecture de la production impossible : ${productionError.message}`)

  if ((productions || []).some((item) => item.status === 'materialized' && item.materialized_cooked_dish_id != null)) {
    return { kind: 'prepared' }
  }
  if ((productions || []).some((item) => ['planned', 'in_progress'].includes(item.status))) {
    return { kind: 'pending' }
  }
  return { kind: 'missing' }
}

async function activeBatchDishExists(supabase, userId, batchRecipeId) {
  if (!batchRecipeId) return false
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('cooked_dishes')
    .select('id')
    .eq('user_id', userId)
    .eq('batch_recipe_id', batchRecipeId)
    .gt('portions_remaining', 0)
    .or(`expiration_date.is.null,expiration_date.gte.${today}`)
    .limit(1)
  if (error) throw new Error(`Lecture du plat batch impossible : ${error.message}`)
  return Boolean(data?.length)
}

function sanitizedRequest(request, body) {
  const headers = new Headers(request.headers)
  headers.delete('content-length')
  headers.set('content-type', 'application/json')
  return new Request(request.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...body, needs: [], deductions: [] }),
  })
}

/**
 * Façade de sécurité devant l'implémentation historique :
 * - un repas dépendant d'une production encore virtuelle ne peut pas être validé ;
 * - un plat déjà cuisiné (reste, batch, slot P1 ou production P2) ne redéduit
 *   jamais ses ingrédients bruts lors de sa consommation.
 */
export async function POST(request) {
  const inspectionRequest = request.clone()
  let body = {}
  try { body = await inspectionRequest.json() } catch { return legacyPost(request) }

  const { supabase, user, error: authError } = await authenticateRequest(request.clone())
  if (authError || !user) {
    return NextResponse.json({ error: authError || 'Non authentifié' }, { status: 401 })
  }

  try {
    let preparedSource = body.eaten_dish_id != null

    if (body.batch_recipe_id != null) {
      const batchReady = await activeBatchDishExists(supabase, user.id, body.batch_recipe_id)
      if (!batchReady) {
        return NextResponse.json({
          error: 'Cette préparation batch n’a pas encore produit de plat disponible. Termine d’abord la session de cuisine.',
        }, { status: 409 })
      }
      preparedSource = true
    }

    if (body.meal_date && body.meal_type) {
      const slot = await resolvePublishedSlot(supabase, user.id, body.meal_date, body.meal_type)
      if (slot?.cooked_dish_id != null) preparedSource = true

      const source = await productionSourceState(supabase, user.id, slot?.id)
      if (source.kind === 'pending') {
        return NextResponse.json({
          error: 'Ce repas dépend d’une préparation qui n’est pas encore terminée.',
        }, { status: 409 })
      }
      if (source.kind === 'missing') {
        return NextResponse.json({
          error: 'La production prévue pour ce repas n’est plus disponible. Recalcule le planning.',
        }, { status: 409 })
      }
      if (source.kind === 'prepared') preparedSource = true
    }

    return legacyPost(preparedSource ? sanitizedRequest(request, body) : request)
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Vérification de la source du repas impossible' }, { status: 500 })
  }
}

export const DELETE = legacyDelete
