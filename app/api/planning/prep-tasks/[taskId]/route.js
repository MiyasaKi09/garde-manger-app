import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

/**
 * PATCH /api/planning/prep-tasks/[taskId]
 * Coche / décoche une tâche du « jour de cuisine ». Persistant (colonne done).
 * Body: { done: boolean }. La RLS (policy ALL « users_own_prep ») garantit que
 * seul le propriétaire de l'import peut modifier sa tâche.
 */
export async function PATCH(request, { params }) {
  try {
    const { supabase, error: authError } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status: 401 })

    const taskId = params.taskId
    let body = {}
    try { body = await request.json() } catch { /* body optionnel */ }
    const done = !!body.done

    const { data, error } = await supabase
      .from('nutrition_plan_prep_tasks')
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq('id', taskId)
      .select('id, done, done_at')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    return NextResponse.json({ task: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
