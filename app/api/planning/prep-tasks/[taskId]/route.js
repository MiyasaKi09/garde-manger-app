import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

const CONFLICT_MARKERS = [
  'dependencies_pending',
  'completed_dependant',
  'materialized_production_cannot_reopen',
  'partial_materialization_requires_review',
  'producer_slot_missing',
  'unreserved_ingredients_replan_required',
  'expected_inventory_reservations_missing',
  'stock_changed',
  'missing_density',
  'missing_unit_weight',
  'unsupported_lot_unit',
  'reservation_unit_mismatch',
]

function statusForDatabaseError(message = '') {
  if (message.includes('task_not_found_or_forbidden')) return 404
  if (CONFLICT_MARKERS.some((marker) => message.includes(marker))) return 409
  return 500
}

function userMessage(message = '') {
  if (message.includes('dependencies_pending')) {
    return 'Termine d’abord les préparations dont dépend cette tâche.'
  }
  if (message.includes('completed_dependant')) {
    return 'Une préparation dépendante est déjà terminée : cette tâche ne peut plus être décochée.'
  }
  if (message.includes('materialized_production_cannot_reopen')) {
    return 'Cette tâche a créé un plat réel. Elle ne peut pas être décochée sans traiter ce plat et son stock.'
  }
  if (message.includes('unreserved_ingredients_replan_required')) {
    return 'Certains ingrédients ne sont pas encore réservés. Range les courses dans le stock puis recalcule la semaine avant de valider cette préparation.'
  }
  if (message.includes('expected_inventory_reservations_missing')) {
    return 'Les réservations de stock attendues ont disparu. Recalcule le planning avant de cuisiner.'
  }
  if (message.includes('stock_changed')) {
    return 'Le stock a changé depuis la création du planning. Recalcule la semaine avant de valider cette préparation.'
  }
  if (message.includes('missing_density') || message.includes('missing_unit_weight') || message.includes('unsupported_lot_unit') || message.includes('reservation_unit_mismatch')) {
    return 'Une quantité réservée ne peut pas être reconvertie dans l’unité réelle du lot. Corrige le produit ou recalcule le planning.'
  }
  if (message.includes('partial_materialization_requires_review')) {
    return 'Cette tâche possède déjà une matérialisation partielle. Une vérification du stock est nécessaire avant de continuer.'
  }
  if (message.includes('task_not_found_or_forbidden')) return 'Tâche introuvable'
  return message || 'La mise à jour de la tâche a échoué.'
}

/**
 * PATCH /api/planning/prep-tasks/[taskId]
 *
 * Toute la transition est désormais portée par une seule RPC PostgreSQL :
 * dépendances, déduction des lots dans leur unité native, mouvements de stock,
 * matérialisation des plats, consommation des réservations et clôture de tâche.
 * Aucune compensation PostgREST partielle n’est nécessaire.
 */
export async function PATCH(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: authError || 'Non authentifié' }, { status: 401 })
  }

  const taskId = Number(params?.taskId)
  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: 'Identifiant de tâche invalide' }, { status: 400 })
  }

  let body = {}
  try { body = await request.json() } catch { /* corps invalide traité ci-dessous */ }
  if (typeof body.done !== 'boolean') {
    return NextResponse.json({ error: 'Le champ done doit être un booléen' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('set_planned_task_done', {
    p_task_id: taskId,
    p_done: body.done,
  })

  if (error) {
    const message = error.message || String(error)
    return NextResponse.json(
      { error: userMessage(message), technical_code: message.split(':')[0] },
      { status: statusForDatabaseError(message) },
    )
  }

  return NextResponse.json(data || {
    task: { id: taskId, done: body.done },
    materialized: [],
    movements: 0,
  })
}
