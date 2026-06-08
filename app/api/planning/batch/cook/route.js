import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/planning/batch/cook  { batchRecipeId }
 * Marque une préparation batch comme cuisinée → crée un « plat cuisiné »
 * (cooked_dishes) dans le stock : N portions + DLC (today + keeps_days).
 * Le plat est ensuite décompté quand les déjeuners reliés sont mangés.
 * Idempotent : si un plat actif existe déjà pour cette préparation, on le renvoie.
 *
 * DELETE /api/planning/batch/cook  { batchRecipeId } — annule (retire du stock).
 */
const addDaysISO = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch { /* body optionnel */ }
  const batchRecipeId = body?.batchRecipeId
  if (!batchRecipeId) return NextResponse.json({ error: 'batchRecipeId requis' }, { status: 400 })

  // La préparation (RLS = propriété via import → user).
  const { data: br, error: brErr } = await supabase
    .from('nutrition_plan_batch_recipes')
    .select('id, name, portions_total, keeps_days, freezable, reheat, conservation')
    .eq('id', batchRecipeId)
    .maybeSingle()
  if (brErr) return NextResponse.json({ error: brErr.message }, { status: 500 })
  if (!br) return NextResponse.json({ error: 'Préparation introuvable' }, { status: 404 })

  // Déjà cuisiné (plat actif lié) → on renvoie l'existant.
  const { data: existing } = await supabase
    .from('cooked_dishes')
    .select('*')
    .eq('user_id', user.id)
    .eq('batch_recipe_id', batchRecipeId)
    .gt('portions_remaining', 0)
    .maybeSingle()
  if (existing) return NextResponse.json({ dish: existing, already: true })

  const portions = Number(br.portions_total) || 1
  const keeps = Number.isFinite(br.keeps_days) && br.keeps_days > 0 ? br.keeps_days : 4
  const expiration = addDaysISO(keeps)

  const { data: dish, error: insErr } = await supabase
    .from('cooked_dishes')
    .insert({
      user_id: user.id,
      name: br.name,
      portions_cooked: portions,
      portions_remaining: portions,
      storage_method: 'fridge',
      cooked_at: new Date().toISOString(),
      expiration_date: expiration,
      batch_recipe_id: batchRecipeId,
      notes: br.reheat || br.conservation || null,
    })
    .select()
    .single()
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ dish, expiration, portions })
}

export async function DELETE(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch { /* body optionnel */ }
  const batchRecipeId = body?.batchRecipeId
  if (!batchRecipeId) return NextResponse.json({ error: 'batchRecipeId requis' }, { status: 400 })

  const { error } = await supabase
    .from('cooked_dishes')
    .delete()
    .eq('user_id', user.id)
    .eq('batch_recipe_id', batchRecipeId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
