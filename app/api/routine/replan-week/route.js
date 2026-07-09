import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { buildAiContext, formatContextForPrompt } from '@/lib/aiContextBuilder'
import { PLANNING_OUTPUT_REQUIREMENTS } from '@/lib/aiSystemPrompts'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TRIGGER_TIMEOUT_MS = 20_000

const todayISO = () => new Date().toISOString().split('T')[0]

/**
 * POST /api/routine/replan-week — re-planning DYNAMIQUE de la fin de semaine.
 *
 * Déclenché quand le réel diverge du plan : des restes ont été créés, le stock
 * a changé, ou l'utilisateur impose un repas (« ce soir je fais des
 * bolognaises »). Compose automatiquement une requête de régénération
 * (plan_regen_requests) pour la Routine claude.ai « Génération de plan » —
 * AUCUN appel API LLM côté app, tout passe par la Routine (forfait).
 *
 * Body : {
 *   import_id,                      — planning concerné
 *   pinned?: { meal_date, meal_type, description },  — repas imposé par l'utilisateur
 *   reason?: 'leftovers' | 'envie' | 'stock'
 * }
 *
 * La requête générée :
 *   - cible AUJOURD'HUI → fin du plan ;
 *   - liste les créneaux déjà validés (meal_log) comme INTOUCHABLES ;
 *   - fixe le repas épinglé (la routine calcule ses macros, ne le remplace pas) ;
 *   - recalcule le budget nutritionnel restant par personne à partir du réel
 *     déjà mangé cette semaine (meal_log vs user_health_goals) ;
 *   - rappelle restes (FIFO avant DLC) et stock urgent via le contexte enrichi.
 *
 * Réponse 202 { triggered: true, request: {...} } — le suivi se fait par
 * polling de plan_regen_requests (pattern existant de la page planning).
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }
  const { import_id, pinned, reason } = body || {}
  if (!import_id) {
    return NextResponse.json({ error: 'import_id requis' }, { status: 400 })
  }

  // Propriété du planning
  const { data: imp, error: ownErr } = await supabase
    .from('nutrition_plan_imports')
    .select('id')
    .eq('id', import_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (ownErr) return NextResponse.json({ error: 'Erreur vérification planning' }, { status: 500 })
  if (!imp) return NextResponse.json({ error: 'Planning introuvable' }, { status: 404 })

  const url = process.env.CLAUDE_ROUTINE_GENERATE_PLAN_URL
  const token = process.env.CLAUDE_ROUTINE_GENERATE_PLAN_TOKEN
  if (!url || !token) {
    return NextResponse.json(
      { error: 'Routine non configurée', hint: 'CLAUDE_ROUTINE_GENERATE_PLAN_URL / _TOKEN manquants.' },
      { status: 503 },
    )
  }

  const today = todayISO()

  // Fenêtre à réorganiser : aujourd'hui → dernier jour du plan
  const { data: lastMeal } = await supabase
    .from('nutrition_plan_meals')
    .select('meal_date')
    .eq('import_id', import_id)
    .order('meal_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  const targetEnd = lastMeal?.meal_date || today
  if (targetEnd < today) {
    return NextResponse.json({ error: 'Le plan est déjà terminé — générer la semaine suivante plutôt.' }, { status: 400 })
  }

  const instructions = await buildReplanInstructions(supabase, user.id, {
    today, targetEnd, pinned, reason,
  })

  // Créneaux à régénérer : déjeuners/dîners restants de la fenêtre, MOINS les
  // créneaux déjà validés (meal_log). Le créneau épinglé reste DANS la liste :
  // la routine le réécrit avec le plat imposé (user_instructions) et ses macros.
  // → mode target_meals du CP1-REGEN : chirurgical, ne touche à rien d'autre.
  const { data: planSlots } = await supabase
    .from('nutrition_plan_meals')
    .select('meal_date, meal_type')
    .eq('import_id', import_id)
    .gte('meal_date', today)
    .lte('meal_date', targetEnd)
    .in('meal_type', ['dejeuner', 'diner'])
  const { data: validated } = await supabase
    .from('meal_log')
    .select('meal_date, meal_type')
    .eq('user_id', user.id)
    .gte('meal_date', today)
    .lte('meal_date', targetEnd)
  const validatedSet = new Set((validated || []).map(v => `${v.meal_date}|${v.meal_type}`))
  const targetMeals = [...new Set((planSlots || [])
    .filter(s => !validatedSet.has(`${s.meal_date}|${s.meal_type}`))
    .map(s => `${s.meal_date}|${s.meal_type}`))]
    .map(k => { const [date, type] = k.split('|'); return { date, type } })

  if (!targetMeals.length) {
    return NextResponse.json({ error: 'Aucun créneau restant à réorganiser sur cette fenêtre.' }, { status: 400 })
  }

  // Requête de régénération lue par la Routine au CP0
  const { data: req, error: insertErr } = await supabase
    .from('plan_regen_requests')
    .insert({
      user_id: user.id,
      import_id,
      target_meals: targetMeals,
      target_start: today,
      target_end: targetEnd,
      user_instructions: instructions,
      status: 'pending',
    })
    .select('id, target_start, target_end, status')
    .single()
  if (insertErr) {
    return NextResponse.json({ error: `Erreur création requête : ${insertErr.message}` }, { status: 500 })
  }

  // Contexte enrichi (restes, contraintes, goûts, écarts, micros) — best-effort.
  // request_id = id de la requête plan_regen_requests insérée ci-dessus : la
  // Routine traite CETTE requête précise (plus de LIMIT 1 sur les pending).
  let triggerPayload = { user_id: user.id, request_id: req.id }
  try {
    const ctx = await buildAiContext(supabase, user.id)
    triggerPayload = {
      user_id: user.id,
      request_id: req.id,
      context: formatContextForPrompt(ctx),
      output_requirements: PLANNING_OUTPUT_REQUIREMENTS,
    }
  } catch (ctxErr) {
    console.error('[Routine Replan Week] Contexte IA indisponible:', ctxErr.message)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TRIGGER_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(triggerPayload),
      signal: controller.signal,
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `Routine Claude erreur (${response.status})`, detail: detail.slice(0, 500) },
        { status: 502 },
      )
    }
    return NextResponse.json({ triggered: true, request: req }, { status: 202 })
  } catch (e) {
    if (e.name === 'AbortError') {
      return NextResponse.json({ triggered: true, pending: true, request: req }, { status: 202 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Compose les instructions de re-planning : créneaux validés intouchables,
 * repas épinglé, budget nutritionnel restant calculé depuis le réel mangé.
 */
async function buildReplanInstructions(supabase, userId, { today, targetEnd, pinned, reason }) {
  const parts = []

  parts.push(
    `RE-PLANNING DYNAMIQUE (${today} → ${targetEnd})` +
    (reason === 'leftovers' ? ' — déclenché par la création de RESTES.'
      : reason === 'envie' ? ' — déclenché par une envie de l\'utilisateur.'
      : reason === 'stock' ? ' — déclenché par un changement de stock.'
      : '.')
  )
  parts.push('Réorganise UNIQUEMENT les repas de cette fenêtre. Objectif : coller au stock réel (restes d\'abord, produits à DLC courte ensuite) tout en gardant chaque journée équilibrée par personne.')

  // Repas imposé par l'utilisateur — intouchable, macros à calculer
  if (pinned?.meal_date && pinned?.meal_type && pinned?.description) {
    parts.push(
      `REPAS FIXÉ PAR L'UTILISATEUR (ne pas remplacer, calculer ses macros réelles) : ` +
      `${pinned.meal_date} ${pinned.meal_type} = « ${String(pinned.description).slice(0, 200)} ». ` +
      `Adapte les AUTRES repas de la journée et de la fenêtre pour que chaque jour reste dans la cible ±5 %.`
    )
  }

  // Créneaux déjà validés (mangés) — intouchables, et leur nutrition est consommée
  const { data: logs } = await supabase
    .from('meal_log')
    .select('meal_date, meal_type, person_name, kcal, protein_g')
    .eq('user_id', userId)
    .gte('meal_date', today)
    .lte('meal_date', targetEnd)
  if (logs?.length) {
    const slots = [...new Set(logs.map(l => `${l.meal_date} ${l.meal_type}`))]
    parts.push(`CRÉNEAUX DÉJÀ MANGÉS — NE PAS MODIFIER : ${slots.join(', ')}.`)
  }

  // Budget restant du jour par personne (réel déjà mangé aujourd'hui vs cible)
  const { data: goals } = await supabase
    .from('user_health_goals')
    .select('person_name, target_calories, target_protein_g')
    .eq('user_id', userId)
  const { data: todayLogs } = await supabase
    .from('meal_log')
    .select('person_name, kcal, protein_g')
    .eq('user_id', userId)
    .eq('meal_date', today)
  if (goals?.length) {
    const eatenBy = {}
    for (const l of (todayLogs || [])) {
      eatenBy[l.person_name] = eatenBy[l.person_name] || { kcal: 0, prot: 0 }
      eatenBy[l.person_name].kcal += l.kcal || 0
      eatenBy[l.person_name].prot += l.protein_g || 0
    }
    const lines = goals.map(g => {
      const eaten = eatenBy[g.person_name] || { kcal: 0, prot: 0 }
      const restK = Math.max(0, (g.target_calories || 0) - eaten.kcal)
      const restP = Math.max(0, (g.target_protein_g || 0) - eaten.prot)
      return `- ${g.person_name} : déjà mangé aujourd'hui ${Math.round(eaten.kcal)} kcal / ${Math.round(eaten.prot)} g prot → budget restant du jour ≈ ${Math.round(restK)} kcal / ${Math.round(restP)} g prot`
    })
    parts.push(`BUDGET RESTANT AUJOURD'HUI (les repas restants du jour doivent s'y tenir) :\n${lines.join('\n')}`)
  }

  parts.push('Mets à jour la liste de courses en conséquence (retire ce que les restes couvrent, ajoute ce que les nouveaux repas exigent).')

  return parts.join('\n\n')
}
