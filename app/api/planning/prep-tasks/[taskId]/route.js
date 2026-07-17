import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

/**
 * PATCH /api/planning/prep-tasks/[taskId]
 * Coche / décoche une tâche du « jour de cuisine ». Persistant (colonne done).
 * Body: { done: boolean }. La RLS (policy ALL « users_own_prep ») garantit que
 * seul le propriétaire de l'import peut modifier sa tâche.
 *
 * P2 — Matérialisation (test F) :
 *   Quand done=true, toutes les planned_productions dont source_task_id = taskId
 *   et status = 'planned' sont matérialisées :
 *     • Insertion d'un cooked_dishes réel (depuis les données de la production).
 *     • Mise à jour de planned_productions :
 *         status = 'materialized'
 *         materialized_cooked_dish_id = id du cooked_dishes créé.
 *   La dé-validation (done=false) ne supprime PAS le plat déjà matérialisé :
 *   choix intentionnel — le plat existe physiquement dans le garde-manger.
 *   En cas d'erreur de matérialisation, la tâche est quand même marquée done=true
 *   et la réponse contient materialization_error (fail-soft).
 */
export async function PATCH(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) return NextResponse.json({ error: authError || 'Non authentifié' }, { status: 401 })

    const taskId = params.taskId
    let body = {}
    try { body = await request.json() } catch { /* body optionnel */ }
    const done = !!body.done

    // ── 1. Mise à jour de la tâche ──────────────────────────────────────────
    const { data, error } = await supabase
      .from('nutrition_plan_prep_tasks')
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq('id', taskId)
      .select('id, done, done_at')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })

    // ── 2. P2 — Matérialisation des productions planifiées (done=true) ──────
    //    Fail-soft : une erreur de matérialisation n'annule pas le done=true.
    let materialized = []
    let materializationError = null

    if (done) {
      const { data: productions, error: prodErr } = await supabase
        .from('planned_productions')
        .select('id, output_name, planned_portions, storage_method, use_by')
        .eq('source_task_id', taskId)
        .eq('user_id', user.id)
        .eq('status', 'planned')

      if (prodErr) {
        materializationError = prodErr.message
      } else if (productions && productions.length > 0) {
        for (const prod of productions) {
          const now = new Date()
          const { data: dish, error: dishErr } = await supabase
            .from('cooked_dishes')
            .insert({
              user_id: user.id,
              name: prod.output_name || 'Plat planifié',
              portions_cooked: prod.planned_portions,
              portions_remaining: prod.planned_portions,
              storage_method: prod.storage_method === 'freezer' ? 'freezer' : 'fridge',
              cooked_at: now.toISOString(),
              expiration_date: prod.use_by || null,
              notes: `[production:${prod.id}] matérialisé depuis planned_productions`,
              source_meal_type: null,
            })
            .select('id, name, portions_remaining, expiration_date')
            .single()

          if (dishErr) {
            materializationError = dishErr.message
            continue
          }

          const { error: updateErr } = await supabase
            .from('planned_productions')
            .update({
              status: 'materialized',
              materialized_cooked_dish_id: dish.id,
            })
            .eq('id', prod.id)
            .eq('user_id', user.id)

          if (updateErr) {
            materializationError = updateErr.message
          } else {
            materialized.push({
              production_id: prod.id,
              cooked_dish_id: dish.id,
              name: dish.name,
              portions: dish.portions_remaining,
              expiration_date: dish.expiration_date,
            })
          }
        }
      }
    }

    const responseBody = { task: data, materialized }
    if (materializationError) responseBody.materialization_error = materializationError
    return NextResponse.json(responseBody)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
