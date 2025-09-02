// app/api/cook/[id]/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sortLotsFIFO, todayISO } from '@/lib/utils';

function supabaseServer() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
}

export async function POST(_req, { params }) {
  const recipeId = params.id;
  const supabase = supabaseServer();

  // 1) Lire tous les ingrédients
  const { data: ingredients, error: ingErr } = await supabase
    .from('recipe_ingredients')
    .select('product_id, qty, unit, optional, product:products_catalog(name)')
    .eq('recipe_id', recipeId);

  if (ingErr) return NextResponse.json({ error: ingErr.message }, { status: 500 });
  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ error: 'Aucun ingrédient pour cette recette.' }, { status: 400 });
  }

  // 2) DRY-RUN : on prépare les opérations SANS rien écrire
  const writes = [];     // opérations à appliquer si tout est OK
  const delta = [];      // journal pour l'undo
  const missing = [];    // liste complète des manquants

  for (const ing of ingredients) {
    let need = Number(ing.qty || 0);
    if (!need || need <= 0) continue;

    // lots du produit triés FIFO
    const { data: lots, error: lotErr } = await supabase
      .from('inventory_lots')
      .select('id, product_id, location_id, qty, unit, dlc, entered_at, opened_at, note, source')
      .eq('product_id', ing.product_id)
      .order('dlc', { ascending: true, nullsFirst: false })
      .order('entered_at', { ascending: true });

    if (lotErr) return NextResponse.json({ error: lotErr.message }, { status: 500 });

    const fifo = sortLotsFIFO(lots || []);
    const available = fifo.reduce((s, l) => s + Number(l.qty || 0), 0);

    // si pas assez et non optionnel → on note le manque mais on NE TOUCHE A RIEN
    if (available < need && !ing.optional) {
      missing.push({
        product_id: ing.product_id,
        name: ing.product?.name || 'Ingrédient',
        missingQty: need - available,
        unit: ing.unit,
        available
      });
      continue; // on ne prépare pas d'écritures pour cet ingrédient
    }

    // sinon on prépare les écritures (plan FIFO), mais on n'écrit pas encore
    let remaining = need;
    for (const lot of fifo) {
      if (remaining <= 0) break;
      const take = Math.min(Number(lot.qty), remaining);
      if (take <= 0) continue;

      const newQty = Number(lot.qty) - take;
      if (newQty <= 0) {
        writes.push({ type: 'delete', id: lot.id, before: { ...lot }, unit: lot.unit, took: take });
        delta.push({ action: 'delete', took: take, unit: lot.unit, lot_before: { ...lot } });
      } else {
        const after = { ...lot, qty: newQty, opened_at: lot.opened_at || todayISO() };
        writes.push({ type: 'update', id: lot.id, values: { qty: newQty, opened_at: after.opened_at }, before: { ...lot }, after: { id: lot.id, qty: newQty, opened_at: after.opened_at }, unit: lot.unit, took: take });
        delta.push({ action: 'update', took: take, unit: lot.unit, lot_before: { ...lot }, lot_after: { id: lot.id, qty: newQty, opened_at: after.opened_at } });
      }
      remaining -= take;
    }
    // Si l'ingrédient était optionnel et pas assez de stock, on aura préparé partiellement. OK.
  }

  // 3) Si des manquants → on NE FAIT AUCUNE ECRITURE et on renvoie la liste complète
  if (missing.length > 0) {
    return NextResponse.json({ error: 'Stock insuffisant', missing }, { status: 400 });
  }

  // 4) On applique les écritures (tout va bien)
  for (const w of writes) {
    if (w.type === 'delete') {
      const { error } = await supabase.from('inventory_lots').delete().eq('id', w.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (w.type === 'update') {
      const { error } = await supabase.from('inventory_lots').update(w.values).eq('id', w.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // 5) Log + undoToken
  const { data: logRows, error: logErr } = await supabase
    .from('cook_logs')
    .insert({ recipe_id: recipeId, portions: 1, delta })
    .select('id')
    .limit(1);

  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, undoToken: logRows?.[0]?.id || null });
}
