import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

async function loadTasksByIds(supabase, ids) {
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('nutrition_plan_prep_tasks')
    .select('id, done')
    .in('id', ids)
  if (error) throw new Error(error.message)
  return data || []
}

async function assertDependenciesCompleted(supabase, taskId) {
  const { data: links, error } = await supabase
    .from('prep_task_dependencies')
    .select('depends_on_task_id')
    .eq('task_id', taskId)
  if (error) throw new Error(error.message)

  const parentIds = [...new Set((links || []).map((link) => link.depends_on_task_id).filter(Boolean))]
  const parents = await loadTasksByIds(supabase, parentIds)
  if (parents.length !== parentIds.length || parents.some((task) => !task.done)) {
    const conflict = new Error('Termine d’abord les préparations dont dépend cette tâche.')
    conflict.code = 'DEPENDENCIES_PENDING'
    throw conflict
  }
}

async function assertNoCompletedDependants(supabase, taskId) {
  const { data: links, error } = await supabase
    .from('prep_task_dependencies')
    .select('task_id')
    .eq('depends_on_task_id', taskId)
  if (error) throw new Error(error.message)

  const childIds = [...new Set((links || []).map((link) => link.task_id).filter(Boolean))]
  const children = await loadTasksByIds(supabase, childIds)
  if (children.some((task) => task.done)) {
    const conflict = new Error('Une préparation dépendante est déjà terminée : cette tâche ne peut plus être décochée.')
    conflict.code = 'COMPLETED_DEPENDANT'
    throw conflict
  }
}

async function rollbackMaterialization(supabase, userId, created) {
  for (const item of [...created].reverse()) {
    await supabase
      .from('planned_productions')
      .update({ status: 'planned', materialized_cooked_dish_id: null })
      .eq('id', item.productionId)
      .eq('user_id', userId)
    await supabase.from('cooked_dishes').delete().eq('id', item.dishId).eq('user_id', userId)
  }
}

/**
 * PATCH /api/planning/prep-tasks/[taskId]
 *
 * La tâche n’est clôturée qu’après la création de toutes ses productions. Une
 * erreur normale est compensée (plats supprimés et productions remises à
 * `planned`) afin de ne jamais afficher « fait » sans nourriture produite.
 *
 * Les dépendances sont bloquantes. Une tâche qui a matérialisé un plat physique
 * n’est pas simplement décochable : il faut traiter le plat réel et son stock.
 */
export async function PATCH(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) return NextResponse.json({ error: authError || 'Non authentifié' }, { status: 401 })

    const taskId = params.taskId
    let body = {}
    try { body = await request.json() } catch { /* body optionnel */ }
    const done = Boolean(body.done)

    const { data: currentTask, error: taskReadError } = await supabase
      .from('nutrition_plan_prep_tasks')
      .select('id, done, done_at')
      .eq('id', taskId)
      .maybeSingle()

    if (taskReadError) return NextResponse.json({ error: taskReadError.message }, { status: 400 })
    if (!currentTask) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })

    if (!done) {
      await assertNoCompletedDependants(supabase, taskId)
      const { data: materializedProductions, error: prodError } = await supabase
        .from('planned_productions')
        .select('id')
        .eq('source_task_id', taskId)
        .eq('user_id', user.id)
        .eq('status', 'materialized')
      if (prodError) return NextResponse.json({ error: prodError.message }, { status: 400 })
      if ((materializedProductions || []).length) {
        return NextResponse.json({
          error: 'Cette tâche a créé un plat réel. Elle ne peut pas être décochée sans traiter ce plat et son stock.',
        }, { status: 409 })
      }

      const { data, error } = await supabase
        .from('nutrition_plan_prep_tasks')
        .update({ done: false, done_at: null, workflow_status: 'pending' })
        .eq('id', taskId)
        .select('id, done, done_at')
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ task: data, materialized: [] })
    }

    await assertDependenciesCompleted(supabase, taskId)

    const { data: productions, error: prodError } = await supabase
      .from('planned_productions')
      .select('id, output_name, planned_portions, storage_method, use_by')
      .eq('source_task_id', taskId)
      .eq('user_id', user.id)
      .eq('status', 'planned')
    if (prodError) return NextResponse.json({ error: prodError.message }, { status: 400 })

    const created = []
    const materialized = []
    for (const production of productions || []) {
      const { data: dish, error: dishError } = await supabase
        .from('cooked_dishes')
        .insert({
          user_id: user.id,
          name: production.output_name || 'Plat planifié',
          portions_cooked: production.planned_portions,
          portions_remaining: production.planned_portions,
          storage_method: production.storage_method === 'freezer' ? 'freezer' : 'fridge',
          cooked_at: new Date().toISOString(),
          expiration_date: production.use_by || null,
          notes: `[production:${production.id}] matérialisé depuis planned_productions`,
          source_meal_type: null,
        })
        .select('id, name, portions_remaining, expiration_date')
        .single()

      if (dishError) {
        await rollbackMaterialization(supabase, user.id, created)
        return NextResponse.json({ error: `Production non matérialisée : ${dishError.message}` }, { status: 500 })
      }
      created.push({ productionId: production.id, dishId: dish.id })

      const { error: updateError } = await supabase
        .from('planned_productions')
        .update({ status: 'materialized', materialized_cooked_dish_id: dish.id })
        .eq('id', production.id)
        .eq('user_id', user.id)
      if (updateError) {
        await rollbackMaterialization(supabase, user.id, created)
        return NextResponse.json({ error: `Production non reliée : ${updateError.message}` }, { status: 500 })
      }

      materialized.push({
        production_id: production.id,
        cooked_dish_id: dish.id,
        name: dish.name,
        portions: dish.portions_remaining,
        expiration_date: dish.expiration_date,
      })
    }

    const { data, error } = await supabase
      .from('nutrition_plan_prep_tasks')
      .update({ done: true, done_at: new Date().toISOString(), workflow_status: 'done' })
      .eq('id', taskId)
      .select('id, done, done_at')
      .maybeSingle()

    if (error || !data) {
      await rollbackMaterialization(supabase, user.id, created)
      return NextResponse.json({ error: error?.message || 'Tâche introuvable' }, { status: error ? 400 : 404 })
    }

    return NextResponse.json({ task: data, materialized })
  } catch (error) {
    const status = ['DEPENDENCIES_PENDING', 'COMPLETED_DEPENDANT'].includes(error.code) ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}
