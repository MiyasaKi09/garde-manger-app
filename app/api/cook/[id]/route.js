// app/api/cook/[id]/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sortLotsFIFO, todayISO } from '@/lib/utils';
import { convertWithMeta, sumAvailableInUnitWithMeta } from '@/lib/units';
import { estimateProductMeta } from '@/lib/meta';

function supabaseServer() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}

/**
 * Body optionnel:
 * {
 *   "plan": [
 *     // Plan manuel pour forcer la prise sur certains lots (sinon FIFO)
 *     // qty est exprimée dans l'unité du lot (unit)
 *     { "product_id": "...", "lot_id": "...", "qty": 2, "unit": "u" }
 *   ]
 * }
 */
export async function POST(req, { params }) {
  const recipeId = params.id;
  const supabase = supabaseServer();

  // Lire éventuel plan manuel
  let plan = null;
  try {
    const body = await req.json().catch(() => null);
    plan = body?.plan && Array.isArray(body.plan) ? body.plan : null;
  } catch {
    plan = null;
  }

  // Ingrédients + métadonnées produit
  const { data: ingredients, error: ingErr } = await supabase
    .from('recipe_ingredients')
    .select(`
      product_id, qty, unit, optional,
      product:products_catalog(id, name, category, default_unit, density_g_per_ml, grams_per_unit)
    `)
    .eq('recipe_id', recipeId);

  if (ingErr)
    return NextResponse.json({ error: ingErr.message }, { status: 500 });
  if (!ingredients?.length)
    return NextResponse.json(
      { error: 'Aucun ingrédient.' },
      { status: 400 }
    );

  const writes = []; // {type:'update'|'delete', id, values?, before}
  const delta = []; // pour undo
  const missing = [];

  // Collecte d'apprentissage (par produit)
  // structure: product_id -> { gramsTaken, unitsTaken, lastMeta, productRow }
  const learnByProduct = new Map();

  // Utilitaires plan manuel
  const planByProduct = new Map();
  if (plan) {
    for (const p of plan) {
      if (!p?.product_id || !p?.lot_id || !(p?.qty > 0)) continue;
      const bucket = planByProduct.get(p.product_id) || [];
      bucket.push({
        lot_id: p.lot_id,
        qty: Number(p.qty),
        unit: (p.unit || 'u').toLowerCase(),
      });
      planByProduct.set(p.product_id, bucket);
    }
  }

  // --------- DRY-RUN : préparer tout sans écrire ---------
  for (const ing of ingredients) {
    // 1) métadonnées → connues ? sinon estimer & mémoriser si confiance ok
    let density = ing.product?.density_g_per_ml;
    let gPerUnit = ing.product?.grams_per_unit;
    if (density == null || gPerUnit == null) {
      const est = estimateProductMeta({
        name: ing.product?.name,
        category: ing.product?.category,
      });
      density = density ?? est.density_g_per_ml;
      gPerUnit = gPerUnit ?? est.grams_per_unit;
      const patch = {};
      if (
        ing.product?.density_g_per_ml == null &&
        est.confidence_density >= 0.6
      )
        patch.density_g_per_ml = est.density_g_per_ml;
      if (
        ing.product?.grams_per_unit == null &&
        est.grams_per_unit &&
        est.confidence_unit >= 0.6
      )
        patch.grams_per_unit = est.grams_per_unit;
      if (Object.keys(patch).length) {
        await supabase
          .from('products_catalog')
          .update(patch)
          .eq('id', ing.product.id);
        // note: pas besoin de recharger; meta local suffit pour ce run
      }
    }
    const meta = {
      density_g_per_ml: Number(density ?? 1.0),
      grams_per_unit: Number(gPerUnit ?? 0),
    };

    if (!learnByProduct.has(ing.product_id)) {
      learnByProduct.set(ing.product_id, {
        gramsTaken: 0,
        unitsTaken: 0,
        lastMeta: meta,
        productRow: ing.product,
      });
    }

    const needQty = Number(ing.qty || 0);
    const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();

    // 2) lots du produit
    const { data: lots, error: lotErr } = await supabase
      .from('inventory_lots')
      .select(
        'id, product_id, location_id, qty, unit, dlc, entered_at, opened_at, note, source'
      )
      .eq('product_id', ing.product_id)
      .order('dlc', { ascending: true, nullsFirst: false })
      .order('entered_at', { ascending: true });
    if (lotErr)
      return NextResponse.json({ error: lotErr.message }, { status: 500 });

    // 3) dispo globale (en needUnit)
    const available = sumAvailableInUnitWithMeta(lots, needUnit, meta);

    // Si plan manuel fourni pour ce produit : on vérifiera la couverture par le plan
    const planForProduct = planByProduct.get(ing.product_id) || null;
    if (planForProduct && planForProduct.length) {
      // Vérifier que le plan couvre la demande
      let plannedTotalInNeed = 0;
      for (const step of planForProduct) {
        const lot = (lots || []).find((l) => l.id === step.lot_id);
        if (!lot)
          return NextResponse.json(
            { error: `Lot ${step.lot_id} introuvable pour plan manuel.` },
            { status: 400 }
          );
        // convertir la quantité demandée par le plan (dans l'unité du step) -> needUnit
        const inNeed = convertWithMeta(
          Number(step.qty),
          step.unit || lot.unit,
          needUnit,
          meta
        ).qty;
        plannedTotalInNeed += inNeed;
      }
      if (plannedTotalInNeed + 1e-9 < needQty && !ing.optional) {
        missing.push({
          product_id: ing.product_id,
          name: ing.product?.name || 'Ingrédient',
          missingQty: +(needQty - plannedTotalInNeed).toFixed(2),
          unit: needUnit,
          available: +plannedTotalInNeed.toFixed(2),
          via: 'plan',
        });
        continue;
      }
    } else {
      // Pas de plan manuel → vérifier la dispo globale
      if (available + 1e-9 < needQty && !ing.optional) {
        missing.push({
          product_id: ing.product_id,
          name: ing.product?.name || 'Ingrédient',
          missingQty: +(needQty - available).toFixed(2),
          unit: needUnit,
          available: +available.toFixed(2),
        });
        continue;
      }
    }

    // 4) Préparer le plan d'écriture
    if (planForProduct && planForProduct.length) {
      // Utiliser exactement les steps fournis (dans l'ordre du plan)
      let coveredInNeed = 0;
      for (const step of planForProduct) {
        const lot = (lots || []).find((l) => l.id === step.lot_id);
        if (!lot) continue;
        const takeInLot = Number(step.qty);
        if (!(takeInLot > 0)) continue;

        // Contrôle: ne pas dépasser le lot
        if (takeInLot - Number(lot.qty) > 1e-9) {
          return NextResponse.json(
            {
              error: `Plan manuel dépasse le stock du lot ${lot.id} (${takeInLot} ${step.unit || lot.unit} > ${lot.qty} ${lot.unit}).`,
            },
            { status: 400 }
          );
        }

        // Impact en unité de besoin (pour couvrir le besoin total)
        const takeInNeed = convertWithMeta(
          takeInLot,
          step.unit || lot.unit,
          needUnit,
          meta
        ).qty;
        coveredInNeed += takeInNeed;

        // Calcul du nouveau stock
        const newQtyLot = Number(lot.qty) - takeInLot;
        if (newQtyLot <= 1e-9) {
          writes.push({
            type: 'delete',
            id: lot.id,
            before: { ...lot },
            took: takeInLot,
            unit: step.unit || lot.unit,
          });
          delta.push({
            action: 'delete',
            took: takeInLot,
            unit: step.unit || lot.unit,
            lot_before: { ...lot },
          });
        } else {
          const newOpened = lot.opened_at || todayISO();
          writes.push({
            type: 'update',
            id: lot.id,
            values: { qty: newQtyLot, opened_at: newOpened },
            before: { ...lot },
          });
          delta.push({
            action: 'update',
            took: takeInLot,
            unit: step.unit || lot.unit,
            lot_before: { ...lot },
            lot_after: { id: lot.id, qty: newQtyLot, opened_at: newOpened },
          });
        }

        // Apprentissage (g et u réellement retirés)
        const gDelta = convertWithMeta(
          takeInLot,
          step.unit || lot.unit,
          'g',
          meta
        ).qty;
        const uDelta = convertWithMeta(
          takeInLot,
          step.unit || lot.unit,
          'u',
          meta
        ).qty;
        const learn = learnByProduct.get(ing.product_id);
        learn.gramsTaken += Number(gDelta) || 0;
        learn.unitsTaken += Number(uDelta) || 0;
      }

      // Si le plan ne couvre pas tout et que l'ingrédient n'est pas optionnel → on bloque
      if (coveredInNeed + 1e-9 < needQty && !ing.optional) {
        missing.push({
          product_id: ing.product_id,
          name: ing.product?.name || 'Ingrédient',
          missingQty: +(needQty - coveredInNeed).toFixed(2),
          unit: needUnit,
          available: +coveredInNeed.toFixed(2),
          via: 'plan',
        });
        continue;
      }
    } else {
      // Pas de plan → FIFO automatique avec conversions
      let remainingNeed = needQty; // exprimé en needUnit
      for (const lot of sortLotsFIFO(lots || [])) {
        if (remainingNeed <= 1e-9) break;

        const lotInNeed = convertWithMeta(
          Number(lot.qty),
          lot.unit,
          needUnit,
          meta
        ).qty;
        const takeInNeed = Math.min(lotInNeed, remainingNeed);
        if (takeInNeed <= 0) continue;

        // re-convertir vers l’unité native du lot pour l’écriture
        const takeInLot = convertWithMeta(
          takeInNeed,
          needUnit,
          lot.unit,
          meta
        ).qty;
        const newQtyLot = Number(lot.qty) - takeInLot;

        if (newQtyLot <= 1e-9) {
          writes.push({
            type: 'delete',
            id: lot.id,
            before: { ...lot },
            took: takeInLot,
            unit: lot.unit,
          });
          delta.push({
            action: 'delete',
            took: takeInLot,
            unit: lot.unit,
            lot_before: { ...lot },
          });
        } else {
          const newOpened = lot.opened_at || todayISO();
          writes.push({
            type: 'update',
            id: lot.id,
            values: { qty: newQtyLot, opened_at: newOpened },
            before: { ...lot },
          });
          delta.push({
            action: 'update',
            took: takeInLot,
            unit: lot.unit,
            lot_before: { ...lot },
            lot_after: { id: lot.id, qty: newQtyLot, opened_at: newOpened },
          });
        }

        // Apprentissage (g et u réellement retirés)
        const gDelta = convertWithMeta(takeInLot, lot.unit, 'g', meta).qty;
        const uDelta = convertWithMeta(takeInLot, lot.unit, 'u', meta).qty;
        const learn = learnByProduct.get(ing.product_id);
        learn.gramsTaken += Number(gDelta) || 0;
        learn.unitsTaken += Number(uDelta) || 0;

        remainingNeed -= takeInNeed;
      }
    }
  }

  // Si manquants → on ne fait AUCUNE écriture
  if (missing.length) {
    return NextResponse.json(
      { error: 'Stock insuffisant', missing },
      { status: 400 }
    );
  }

  // --------- APPLICATION DES ÉCRITURES ---------
  for (const w of writes) {
    if (w.type === 'delete') {
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', w.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from('inventory_lots')
        .update(w.values)
        .eq('id', w.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // --------- LOG + UNDO ---------
  const { data: logRows, error: logErr } = await supabase
    .from('cook_logs')
    .insert({ recipe_id: recipeId, portions: 1, delta })
    .select('id')
    .limit(1);
  if (logErr)
    return NextResponse.json({ error: logErr.message }, { status: 500 });

  // --------- APPRENTISSAGE (g/u) APRÈS CUISSON ---------
  for (const [productId, rec] of learnByProduct.entries()) {
    if (rec.unitsTaken > 0 && rec.gramsTaken > 0) {
      const obs = rec.gramsTaken / rec.unitsTaken; // g/u observé
      // 1) journalise l'observation
      await supabase.from('product_meta_observations').insert({
        product_id: productId,
        grams_per_unit_obs: obs,
        density_g_per_ml_obs: rec.lastMeta?.density_g_per_ml ?? null,
        source: 'cook',
      });

      // 2) pose ou affine grams_per_unit
      const prod = rec.productRow;
      const hasGPU =
        prod?.grams_per_unit != null && Number(prod.grams_per_unit) > 0;
      if (!hasGPU) {
        const gpu = Math.max(1, Math.round(obs));
        await supabase
          .from('products_catalog')
          .update({ grams_per_unit: gpu })
          .eq('id', productId);
      } else {
        // moyenne glissante douce si l'écart est significatif
        const prev = Number(prod.grams_per_unit) || 0;
        const alpha = 0.7; // inertie
        const updated = Math.round(prev * alpha + obs * (1 - alpha));
        if (prev > 0 && Math.abs(updated - prev) / prev > 0.1) {
          await supabase
            .from('products_catalog')
            .update({ grams_per_unit: updated })
            .eq('id', productId);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, undoToken: logRows?.[0]?.id || null });
}
