// app/api/cook/undo/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseServer() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  const supabase = supabaseServer();
  const { undoToken } = await req.json();

  if (!undoToken) return NextResponse.json({ error: 'undoToken manquant' }, { status: 400 });

  // 1) Récupérer le log et son delta
  const { data: log, error: logErr } = await supabase
    .from('cook_logs')
    .select('id, delta')
    .eq('id', undoToken)
    .single();

  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });
  const delta = Array.isArray(log?.delta) ? log.delta : [];

  // 2) Appliquer l'inverse de chaque action (dans l’ordre inverse)
  for (const change of [...delta].reverse()) {
    if (change.action === 'update') {
      // remettre la quantité précédente
      const before = change.lot_before;
      const { error: updErr } = await supabase
        .from('inventory_lots')
        .update({ qty: before.qty, opened_at: before.opened_at })
        .eq('id', before.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    } else if (change.action === 'delete') {
      // recréer le lot supprimé
      const b = change.lot_before;
      const insertRow = {
        id: b.id, // on réutilise l'id pour simplicité
        product_id: b.product_id,
        location_id: b.location_id,
        qty: b.qty,
        unit: b.unit,
        dlc: b.dlc,
        entered_at: b.entered_at,
        opened_at: b.opened_at,
        note: b.note,
        source: b.source
      };
      const { error: insErr } = await supabase.from('inventory_lots').insert(insertRow);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
