// app/api/cook/[id]/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sortLotsFIFO, todayISO } from '@/lib/utils';

// Client serveur (utilise la service role si dispo, sinon anon)
function supabaseServer() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
}

export async function POST(_req, { params }) {
  const recipeId = params.id;
  const supabase = supabaseServer();

  // 1) Récupérer ingrédients
  const { data: ingredients, error: ingErr } = await supabase
    .from('recipe_ingredients')
    .select('product_id, qty, unit, optional, product:products_catalog(name)')
    .eq('recipe_id', recipeId);

  if (ingErr) return NextResponse.json({ error: ingErr.message }, { status: 500 });
  if (!ingredients || ingredients.length === 0)
    return NextResponse.json({ error: 'Aucun ingrédient pour cette recette.' }, { status: 400 });

  // 2) Pour UNDO: on journalise l'état AVANT et APRES de chaque lot touché
  const delta = []; // {action:'update'|'delete', took, unit, lot_before:{...}, lot_after?:{...}}

  // 3) Consommer FIFO pour chaque ingrédient
  for (const ing of ingredients) {
    let remaining = Number(ing.qty || 0);
    if (!remaining || remaining <= 0) continue;

    // Lots FIFO
    const { data: lots, error: lotErr } = await supabase
      .from('inventory_lots')
      .select('id, product_id, location_id, qty, unit, dlc, entered_at, opened_at, note, source')
      .eq('product_id', ing.product_id)
      .order('dlc', { ascending: true, nullsFirst: false })
      .order('entered_at', { ascending: true });

    if (lotErr) return NextResponse.json({ error: lotErr.message }, { status: 500 });

    const fifo = sortLotsFIFO(lots || []);

    for (const lot of fifo) {
      if (remaining <= 0) break;
      const take = Math.min(Number(lot.qty), remaining);
      if (take <= 0) continue;

      const before = { ...lot }; // snapshot complet

      const newQty = Number(lot.qty) - take;
      if (newQty <= 0) {
        // supprimer le lot épuisé
        const { error: delErr } = await supabase.from('inventory_lots').delete().eq('id', lot.id);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

        delta.push({
          action: 'delete',
          took: take,
          unit: lot.unit,
          lot_before: before
        });
      } else {
        const after = { ...before, qty: newQty, opened_at: before.opened_at || todayISO() };
        const { error: updErr } = await supabase
          .from('inventory_lots')
          .update({ qty: newQty, opened_at: after.opened_at })
          .eq('id', lot.id);
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

        delta.push({
          action: 'update',
          took: take,
          unit: lot.unit,
          lot_before: before,
          lot_after: { id: lot.id, qty: newQty, opened_at: after.opened_at }
        });
      }

      remaining -= take;
    }

    if (remaining > 0 && !ing.optional) {
      // rollback naïf: on ne remet pas en place ici (usage perso mono-user → rare).
      // On indique le manque.
      return NextResponse.json({
        error: `Stock insuffisant: ${ing.product?.name || 'ingrédient'} (manque ${remaining} ${ing.unit}).`
      }, { status: 400 });
    }
  }

  // 4) Log + token d'undo = l'id du log
  const { data: logRows, error: logErr } = await supabase
    .from('cook_logs')
    .insert({ recipe_id: recipeId, portions: 1, delta })
    .select('id')
    .limit(1);

  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

  const undoToken = logRows?.[0]?.id;
  return NextResponse.json({ ok: true, undoToken });
}
