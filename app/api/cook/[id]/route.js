// Décrémentation FIFO simple (sans transactions complexes).
// Hypothèse: les unités concordent (g avec g, etc.). On améliore plus tard si besoin.

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(_req, { params }) {
  const recipeId = params.id;
  const supabase = supabaseServer();

  // 1) Récupère ingrédients de la recette
  const { data: ingredients, error: ingErr } = await supabase
    .from('recipe_ingredients')
    .select('product_id, qty, unit, optional, product:products_catalog(name)')
    .eq('recipe_id', recipeId);

  if (ingErr) return NextResponse.json({ error: ingErr.message }, { status: 500 });
  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ error: 'Aucun ingrédient pour cette recette.' }, { status: 400 });
  }

  const delta = []; // journal de ce qu’on consomme, par lot
  // 2) Pour chaque ingrédient, décrémente par lots (FIFO: DLC asc puis entered_at asc)
  for (const ing of ingredients) {
    let toTake = Number(ing.qty || 0);
    if (!toTake || toTake <= 0) continue;

    // On va chercher les lots du produit, triés FIFO
    const { data: lots, error: lotErr } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, entered_at, location_id')
      .eq('product_id', ing.product_id)
      .order('dlc', { ascending: true, nullsFirst: false })
      .order('entered_at', { ascending: true });

    if (lotErr) return NextResponse.json({ error: lotErr.message }, { status: 500 });

    let remaining = toTake;

    for (const lot of (lots || [])) {
      if (remaining <= 0) break;
      const take = Math.min(Number(lot.qty), remaining);

      if (take <= 0) continue;

      const newQty = Number(lot.qty) - take;

      if (newQty <= 0) {
        // on supprime le lot épuisé
        const { error: delErr } = await supabase.from('inventory_lots').delete().eq('id', lot.id);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
      } else {
        // on met à jour la quantité restante
        const { error: updErr } = await supabase
          .from('inventory_lots')
          .update({ qty: newQty, opened_at: lot.opened_at || new Date().toISOString().slice(0,10) })
          .eq('id', lot.id);
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      delta.push({
        product_id: ing.product_id,
        lot_id: lot.id,
        took: take,
        unit: lot.unit
      });

      remaining -= take;
    }

    if (remaining > 0 && !ing.optional) {
      return NextResponse.json({
        error: `Stock insuffisant pour: ${ing.product?.name || 'ingrédient'} (manque ${remaining} ${ing.unit}).`
      }, { status: 400 });
    }
  }

  // 3) Log cuisine
  const { error: logErr } = await supabase
    .from('cook_logs')
    .insert({ recipe_id: recipeId, portions: 1, delta });

  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
