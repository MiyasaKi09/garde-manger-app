import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sortLotsFIFO, todayISO } from '@/lib/utils';
import { convertWithMeta, sumAvailableInUnitWithMeta } from '@/lib/units';
import { estimateProductMeta } from '@/lib/meta';

function supabaseServer() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
}

export async function POST(_req, { params }) {
  const recipeId = params.id;
  const supabase = supabaseServer();

  const { data: ingredients, error: ingErr } = await supabase
    .from('recipe_ingredients')
    .select(`
      product_id, qty, unit, optional,
      product:products_catalog(id, name, category, default_unit, density_g_per_ml, grams_per_unit)
    `)
    .eq('recipe_id', recipeId);

  if (ingErr) return NextResponse.json({ error: ingErr.message }, { status: 500 });
  if (!ingredients?.length) return NextResponse.json({ error: 'Aucun ingrédient.' }, { status: 400 });

  const writes = [];
  const delta = [];
  const missing = [];

  for (const ing of ingredients) {
    // 1) métadonnées → connues ? sinon on estime + on mémorise
    let density = ing.product?.density_g_per_ml;
    let gPerUnit = ing.product?.grams_per_unit;
    if (density == null || gPerUnit == null) {
      const est = estimateProductMeta({ name: ing.product?.name, category: ing.product?.category });
      density  = density  ?? est.density_g_per_ml;
      gPerUnit = gPerUnit ?? est.grams_per_unit;
      // Mémorise prudemment si estimation pas trop faible
      const patch = {};
      if (ing.product?.density_g_per_ml == null && est.confidence_density >= 0.6) patch.density_g_per_ml = est.density_g_per_ml;
      if (ing.product?.grams_per_unit == null && est.grams_per_unit && est.confidence_unit >= 0.6) patch.grams_per_unit = est.grams_per_unit;
      if (Object.keys(patch).length) await supabase.from('products_catalog').update(patch).eq('id', ing.product.id);
    }
    const meta = { density_g_per_ml: density ?? 1.0, grams_per_unit: gPerUnit ?? 0 };

    const needQty  = Number(ing.qty||0);
    const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();

    // 2) lots
    const { data: lots, error: lotErr } = await supabase
      .from('inventory_lots')
      .select('id, product_id, location_id, qty, unit, dlc, entered_at, opened_at, note, source')
      .eq('product_id', ing.product_id)
      .order('dlc', { ascending: true, nullsFirst: false })
      .order('entered_at', { ascending: true });
    if (lotErr) return NextResponse.json({ error: lotErr.message }, { status: 500 });

    // 3) dry-run dispo (en needUnit)
    const available = sumAvailableInUnitWithMeta(lots, needUnit, meta);
    if (available + 1e-9 < needQty && !ing.optional) {
      missing.push({
        product_id: ing.product_id,
        name: ing.product?.name || 'Ingrédient',
        missingQty: +(needQty - available).toFixed(2),
        unit: needUnit,
        available: +available.toFixed(2)
      });
      continue;
    }

    // 4) plan FIFO (toujours en dry-run)
    let remainingNeed = needQty;
    for (const lot of sortLotsFIFO(lots || [])) {
      if (remainingNeed <= 1e-9) break;
      const lotInNeed = convertWithMeta(Number(lot.qty), lot.unit, needUnit, meta).qty;
      const takeInNeed = Math.min(lotInNeed, remainingNeed);
      const takeInLot  = convertWithMeta(takeInNeed, needUnit, lot.unit, meta).qty;
      const newQtyLot  = Number(lot.qty) - takeInLot;

      if (newQtyLot <= 1e-9) {
        writes.push({ type:'delete', id: lot.id, before:{...lot}, took:takeInLot, unit: lot.unit });
        delta.push({ action:'delete', took:takeInLot, unit: lot.unit, lot_before:{...lot} });
      } else {
        const newOpened = lot.opened_at || todayISO();
        writes.push({ type:'update', id:lot.id, values:{ qty:newQtyLot, opened_at:newOpened }, before:{...lot} });
        delta.push({ action:'update', took:takeInLot, unit: lot.unit, lot_before:{...lot}, lot_after:{ id:lot.id, qty:newQtyLot, opened_at:newOpened } });
      }
      remainingNeed -= takeInNeed;
    }
  }

  if (missing.length) return NextResponse.json({ error:'Stock insuffisant', missing }, { status:400 });

  // 5) appliquer
  for (const w of writes) {
    if (w.type==='delete') {
      const { error } = await supabase.from('inventory_lots').delete().eq('id', w.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from('inventory_lots').update(w.values).eq('id', w.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: logRows, error: logErr } = await supabase
    .from('cook_logs').insert({ recipe_id: recipeId, portions: 1, delta }).select('id').limit(1);
  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

  return NextResponse.json({ ok:true, undoToken: logRows?.[0]?.id || null });
}
