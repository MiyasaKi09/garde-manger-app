'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PartySizeControl from '@/components/PartySizeControl';

// ---------- Helpers ----------
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function fmt(n) {
  if (n == null) return '';
  const v = Number(n);
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

export default function CookPage() {
  const { id } = useParams();
  const router = useRouter();

  // ---------- State ----------
  const [loading, setLoading] = useState(true);

  const [recipe, setRecipe] = useState(null);        // { id, title/name, servings, prep_min, cook_min, ... }
  const [ingredients, setIngredients] = useState([]); // [{id, qty, unit, note, product:{id,name,default_unit}}]
  const [lots, setLots] = useState([]);               // [{id, product_id, qty, unit, dlc, location_id}]

  const [people, setPeople] = useState(2);
  const [neverExceed, setNeverExceed] = useState(true);

  // Plan = résultat du dry-run
  // { lines:[{ingredientId, productId, productName, neededBaseQty, neededBaseUnit, neededScaledQty, allocations:[{lotId, lotUnit, takeQty}]}],
  //   missing:[{label, reason}] }
  const [plan, setPlan] = useState(null);

  // ---------- Prefs locales ----------
  useEffect(() => {
    const savedP = parseInt(localStorage.getItem('myko.partySize') || '2', 10);
    if (!Number.isNaN(savedP) && savedP > 0) setPeople(savedP);
    const savedN = localStorage.getItem('myko.neverExceed');
    if (savedN != null) setNeverExceed(savedN === '1');
  }, []);

  // ---------- Load data ----------
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) Recette
        const { data: r, error: er } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', id)
          .single();
        if (er) throw er;
        setRecipe(r);

        // 2) Ingrédients (avec produit)
        const { data: ri, error: ei } = await supabase
          .from('recipe_ingredients')
          .select('id, qty, unit, note, product:products_catalog(id,name,default_unit)')
          .eq('recipe_id', id)
          .order('id');
        if (ei) throw ei;
        setIngredients(ri || []);

        // 3) Lots pour les produits concernés, tri FEFO (DLC croissante)
        const productIds = (ri || []).map(x => x.product?.id).filter(Boolean);
        if (productIds.length) {
          const { data: pl, error: el } = await supabase
            .from('pantry_lots')
            .select('id, product_id, qty, unit, dlc, location_id')
            .in('product_id', Array.from(new Set(productIds)))
            .order('dlc', { ascending: true, nullsFirst: false });
          if (el) throw el;
          setLots(pl || []);
        } else {
          setLots([]);
        }
      } catch (e) {
        console.error(e);
        alert('Erreur chargement: ' + (e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ---------- Scaling factor ----------
  const factor = useMemo(() => {
    const base = Number(recipe?.servings || 2);
    const p = Number(people || 2);
    if (!base || base <= 0) return 1;
    return clamp(p / base, 0.05, 50);
  }, [recipe, people]);

  // ---------- Dry-run: construit un plan de déduction ----------
  async function buildPlan() {
    const lines = [];
    const missing = [];

    for (const ing of (ingredients || [])) {
      const productId = ing.product?.id;
      const productName = ing.product?.name || '??';
      const baseQty = Number(ing.qty || 0);
      const baseUnit = (ing.unit || '').trim();
      const needed = baseQty * factor;

      const lotsForProduct = (lots || []).filter(l => l.product_id === productId); // FEFO déjà trié

      if (!productId) {
        missing.push({ label: productName, reason: 'Produit inconnu (pas de product_id)' });
        lines.push({
          ingredientId: ing.id,
          productId,
          productName,
          neededBaseQty: baseQty,
          neededBaseUnit: baseUnit,
          neededScaledQty: needed,
          allocations: []
        });
        continue;
      }

      let remainingInRecipeUnit = needed;
      const allocations = [];

      for (const lot of lotsForProduct) {
        if (remainingInRecipeUnit <= 0) break;

        // Convertir "quantité restante de recette" -> "unité du lot"
        const { data: convLotQty, error } = await supabase.rpc('convert_qty', {
          p_product_id: productId,
          p_from_unit: baseUnit || ing.product?.default_unit || null,
          p_to_unit: lot.unit,
          p_qty: remainingInRecipeUnit
        });
        if (error) {
          console.error('convert_qty error', error);
        }
        if (convLotQty == null) {
          // Pas de conversion vers l’unité de ce lot : on ignore ce lot
          continue;
        }

        const canTakeLotUnit = Math.min(Number(lot.qty || 0), Number(convLotQty));
        if (canTakeLotUnit > 0) {
          allocations.push({
            lotId: lot.id,
            lotUnit: lot.unit,
            takeQty: canTakeLotUnit
          });

          // Back-convert ce qu'on vient d'allouer en "unité recette" pour diminuer le reste
          const { data: backToRecipeUnit } = await supabase.rpc('convert_qty', {
            p_product_id: productId,
            p_from_unit: lot.unit,
            p_to_unit: baseUnit || ing.product?.default_unit || null,
            p_qty: canTakeLotUnit
          });
          if (backToRecipeUnit != null) {
            remainingInRecipeUnit = Math.max(0, remainingInRecipeUnit - Number(backToRecipeUnit));
          }
        }
      }

      if (remainingInRecipeUnit > 0) {
        missing.push({
          label: productName,
          reason: `${fmt(remainingInRecipeUnit)} ${baseUnit || ''} manquants`
        });
      }

      lines.push({
        ingredientId: ing.id,
        productId,
        productName,
        neededBaseQty: baseQty,
        neededBaseUnit: baseUnit,
        neededScaledQty: needed,
        allocations
      });
    }

    return { lines, missing };
  }

  // ---------- Actions ----------
  async function onPrepare() {
    const p = await buildPlan();
    setPlan(p);
    if (neverExceed && p.missing.length) {
      alert(
        `Ingrédients manquants (ne jamais dépasser activé) :\n- ` +
        p.missing.map(m => `${m.label}: ${m.reason}`).join('\n- ')
      );
    }
  }

  async function onCook() {
    const p = plan || await buildPlan();
    setPlan(p);

    if (neverExceed && p.missing.length) {
      alert(
        `Impossible de cuisiner car il manque :\n- ` +
        p.missing.map(m => `${m.label}: ${m.reason}`).join('\n- ')
      );
      return;
    }

    // Appliquer le plan : décrémenter les lots
    // (Pour un "tout ou rien" strict, je peux te faire une RPC transactionnelle côté SQL.)
    try {
      for (const line of p.lines) {
        for (const al of line.allocations) {
          if (al.takeQty > 0) {
            // re-lire qty courante par sécurité
            const { data: lotRow, error: er } = await supabase
              .from('pantry_lots')
              .select('qty')
              .eq('id', al.lotId)
              .single();
            if (er) throw er;

            const newQty = Math.max(0, Number(lotRow?.qty || 0) - Number(al.takeQty));
            const { error: eu } = await supabase
              .from('pantry_lots')
              .update({ qty: newQty })
              .eq('id', al.lotId);
            if (eu) throw eu;
          }
        }
      }

      alert('✅ Déduction effectuée !');
      router.push('/pantry'); // redirige où tu préfères
    } catch (e) {
      console.error(e);
      alert('Erreur pendant la déduction: ' + (e?.message || e));
    }
  }

  // ---------- UI ----------
  const scaledIngredients = useMemo(() =>
    (ingredients || []).map(i => ({
      ...i,
      scaledQty: (Number(i.qty || 0) * factor) || 0
    }))
    , [ingredients, factor]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '6px 0' }}>{recipe?.title || recipe?.name || 'Cuisiner'}</h1>
          <div style={{ opacity: .7, fontSize: 13 }}>
            Base: {recipe?.servings ?? 2} pers • prep {recipe?.prep_min || 0}′ • cuisson {recipe?.cook_min || 0}′
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <PartySizeControl
            value={people}
            onChange={(n) => { setPeople(n); localStorage.setItem('myko.partySize', String(n)); }}
          />
          <label className="input" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={neverExceed}
              onChange={e => { setNeverExceed(e.target.checked); localStorage.setItem('myko.neverExceed', e.target.checked ? '1' : '0'); }}
            />
            Ne jamais dépasser
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onPrepare} disabled={loading}>Préparer (dry-run)</button>
            <button className="btn primary" onClick={onCook} disabled={loading}>Cuisiner</button>
          </div>
        </div>
      </div>

      {/* Ingrédients scalés */}
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Ingrédients (pour {people} pers)</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {scaledIngredients.map(i => (
            <li key={i.id}>
              {fmt(i.scaledQty)} {i.unit} — <b>{i.product?.name || '??'}</b> {i.note ? <em style={{ opacity: .7 }}>({i.note})</em> : null}
            </li>
          ))}
          {!scaledIngredients.length && <em style={{ opacity: .7 }}>Aucun ingrédient.</em>}
        </ul>
      </div>

      {/* Plan de déduction */}
      {plan && (
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Plan de déduction</h3>
          {plan.lines.map(line => (
            <div key={line.ingredientId} style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
              <div><b>{line.productName}</b> — besoin: {fmt(line.neededScaledQty)} {line.neededBaseUnit || ''}</div>
              {line.allocations.length ? (
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {line.allocations.map(a => (
                    <li key={a.lotId}>Lot {a.lotId.slice(0, 8)} : −{fmt(a.takeQty)} {a.lotUnit}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ opacity: .7, fontSize: 13 }}>Aucune allocation possible (conversion inconnue ou pas de lot).</div>
              )}
            </div>
          ))}
          {plan.missing?.length ? (
            <div style={{ color: '#b91c1c' }}>
              <b>Manquants :</b>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {plan.missing.map((m, idx) => (<li key={idx}>{m.label} — {m.reason}</li>))}
              </ul>
            </div>
          ) : (
            <div style={{ color: '#15803d' }}>Tous les ingrédients sont couverts ✅</div>
          )}
        </div>
      )}
    </div>
  );
}
