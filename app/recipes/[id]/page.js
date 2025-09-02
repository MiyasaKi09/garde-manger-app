// app/recipes/[id]/page.js
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { convertWithMeta } from '@/lib/units';

function Section({ title, children, right }) {
  return (
    <section style={{margin:'16px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12}}>
        <h2 style={{margin:'8px 0'}}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function roundForUnit(q, unit) {
  const u = (unit||'').toLowerCase();
  // On autorise 2 décimales partout (même 'u' au cas où tu stockes des demi-pièces).
  return Math.round(Number(q) * 100) / 100;
}

// Ligne d’un lot sélectionnable pour un ingrédient
function LotRow({ lot, ing, meta, onChange }) {
  const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();
  const lotInNeed = convertWithMeta(Number(lot.qty), lot.unit, needUnit, meta).qty;

  const [checked, setChecked] = useState(false);
  const [qty, setQty] = useState('');

  useEffect(()=>{ onChange({ id: lot.id, checked, qty, unit: lot.unit }); }, [checked, qty]); // eslint-disable-line

  return (
    <div className="card" style={{display:'grid',gridTemplateColumns:'auto 1fr 240px 180px',gap:8,alignItems:'center'}}>
      <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} />
      <div>
        <div style={{fontWeight:600}}>{lot.product_name || ing.product?.name || 'Produit'}</div>
        <div style={{opacity:.7,fontSize:12}}>
          Lot {String(lot.id).slice(0,8)} • DLC {lot.dlc || '—'} • Entré le {lot.entered_at?.slice(0,10) || '—'}
        </div>
      </div>
      <div style={{opacity:.9}}>
        Stock: <strong>{Number(lot.qty).toFixed(2)} {lot.unit}</strong>
        <div style={{fontSize:12,opacity:.7}}>≈ {lotInNeed.toFixed(2)} {needUnit}</div>
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <span style={{opacity:.7,fontSize:12}}>Prendre</span>
        <input
          className="input"
          type="number" step="0.01" min="0"
          value={qty}
          onChange={e=>setQty(e.target.value)}
          style={{width:110}}
        />
        <span style={{opacity:.9}}>{lot.unit}</span>
      </div>
    </div>
  );
}

export default function RecipeDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [recipe, setRecipe] = useState(null);
  const [ings, setIngs] = useState([]);
  const [lotsByProduct, setLotsByProduct] = useState({});   // product_id -> lots[]
  const [metaByProduct, setMetaByProduct] = useState({});   // product_id -> meta
  const [plan, setPlan] = useState({});                     // product_id -> { lot_id -> {checked, qty, unit} }
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Préférence: ne jamais dépasser (cap l'auto-remplissage)
  const [noOverfill, setNoOverfill] = useState(true);

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    // 1) recette + ingrédients + meta produit
    const { data: r, error: errR } = await supabase
      .from('recipes')
      .select(`id, title, time_min, steps, ingredients:recipe_ingredients(
        product_id, qty, unit, optional,
        product:products_catalog(id,name,default_unit,density_g_per_ml,grams_per_unit)
      )`)
      .eq('id', id).single();
    if (errR) { setError(errR.message); setLoading(false); return; }

    setRecipe({ id: r?.id, title: r?.title, time_min: r?.time_min, steps: r?.steps });
    const ingList = (r?.ingredients || []).map(x => ({ ...x, product: x.product }));
    setIngs(ingList);

    // 2) charger lots par produit
    const mapLots = {};
    const mapMeta = {};
    for (const ing of ingList) {
      const pid = ing.product_id;
      const { data: lots, error: errL } = await supabase
        .from('inventory_lots')
        .select('id, product_id, qty, unit, dlc, entered_at')
        .eq('product_id', pid)
        .order('dlc', { ascending: true, nullsFirst: false })
        .order('entered_at', { ascending: true });
      if (errL) { setError(errL.message); continue; }
      (lots||[]).forEach(l => l.product_name = ing.product?.name);
      mapLots[pid] = lots || [];
      mapMeta[pid] = {
        density_g_per_ml: Number(ing.product?.density_g_per_ml ?? 1.0),
        grams_per_unit: Number(ing.product?.grams_per_unit ?? 0),
        default_unit: ing.product?.default_unit || 'g'
      };
    }
    setLotsByProduct(mapLots);
    setMetaByProduct(mapMeta);
    setLoading(false);
  })(); }, [id]);

  function setLotSelection(product_id, lot_id, patch) {
    setPlan(prev => {
      const forProd = { ...(prev[product_id] || {}) };
      const prevLot = forProd[lot_id] || { checked:false, qty:'', unit: lotsByProduct[product_id]?.find(l=>l.id===lot_id)?.unit || 'g' };
      forProd[lot_id] = { ...prevLot, ...patch };
      return { ...prev, [product_id]: forProd };
    });
  }

  // Couverture par rapport au besoin (en unité de l’ingrédient)
  const coverage = useMemo(() => {
    const out = {};
    for (const ing of ings) {
      const pid = ing.product_id;
      const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();
      const needQty = Number(ing.qty || 0);
      const meta = metaByProduct[pid] || {};
      let covered = 0;
      const picks = plan[pid] || {};
      for (const lot of (lotsByProduct[pid] || [])) {
        const pick = picks[lot.id];
        if (!pick?.checked) continue;
        const take = Number(pick.qty || 0);
        if (!(take > 0)) continue;
        const inNeed = convertWithMeta(take, pick.unit || lot.unit, needUnit, meta).qty;
        covered += inNeed;
      }
      out[pid] = { needQty, needUnit, covered, ok: covered + 1e-9 >= needQty || ing.optional };
    }
    return out;
  }, [ings, plan, lotsByProduct, metaByProduct]);

  // Auto-remplit pour UN ingrédient (respecte la préférence noOverfill)
  function autoFillForProduct(pid) {
    const ing = (ings || []).find(x => x.product_id === pid);
    if (!ing) return;

    const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();
    const target = Number(ing.qty || 0);
    let remaining = target;
    const meta = metaByProduct[pid] || {};
    const lots = (lotsByProduct[pid] || []).slice(); // déjà FIFO par tri

    // on réinitialise la sélection courante de ce produit
    setPlan(prev => ({ ...prev, [pid]: {} }));

    for (const lot of lots) {
      if (remaining <= 1e-9) break;

      // quantité dispo convertie dans l’unité demandée
      const lotInNeed = convertWithMeta(Number(lot.qty), lot.unit, needUnit, meta).qty;
      if (lotInNeed <= 0) continue;

      // quantité à prendre dans l’unité demandée
      let takeInNeed = Math.min(lotInNeed, remaining);
      if (takeInNeed <= 0) continue;

      // reconvertir vers l'unité du lot pour saisie UI
      let takeInLot = convertWithMeta(takeInNeed, needUnit, lot.unit, meta).qty;
      // arrondi propre
      takeInLot = roundForUnit(takeInLot, lot.unit);
      // ne pas dépasser le lot
      takeInLot = Math.min(takeInLot, Number(lot.qty));

      // si préférence "ne jamais dépasser", on recalcule la prise en needUnit après arrondi
      if (noOverfill) {
        const backInNeed = convertWithMeta(takeInLot, lot.unit, needUnit, meta).qty;
        // Si l'arrondi provoque un dépassement, on réduit un poil
        if (backInNeed > remaining + 1e-9) {
          // réduisons dans l'unité du lot
          const step = (lot.unit.toLowerCase() === 'u') ? 0.01 : 0.01; // pas minimal
          while (takeInLot > 0) {
            takeInLot = Math.max(0, roundForUnit(takeInLot - step, lot.unit));
            const chk = convertWithMeta(takeInLot, lot.unit, needUnit, meta).qty;
            if (chk <= remaining + 1e-9) break;
          }
        }
      }

      if (takeInLot <= 0) continue;

      // met à jour sélection UI
      setLotSelection(pid, lot.id, { checked: true, qty: takeInLot, unit: lot.unit });

      // décrémente remaining sur la base de la quantité réellement prise (après arrondi)
      const takenInNeed = convertWithMeta(takeInLot, lot.unit, needUnit, meta).qty;
      remaining -= takenInNeed;
    }
  }

  // Auto-remplit tous les ingrédients
  function autoFillAll() {
    for (const ing of (ings || [])) autoFillForProduct(ing.product_id);
  }

  async function cook() {
    setError('');
    setSending(true);
    try {
      // Construire un plan à partir de la sélection (si présent)
      const flatPlan = [];
      let hasAny = false;

      for (const ing of ings) {
        const pid = ing.product_id;
        const picks = plan[pid] || {};
        for (const lot of (lotsByProduct[pid] || [])) {
          const p = picks[lot.id];
          if (p?.checked && Number(p.qty) > 0) {
            hasAny = true;
            flatPlan.push({
              product_id: pid,
              lot_id: lot.id,
              qty: Number(p.qty),
              unit: (p.unit || lot.unit)
            });
          }
        }
      }

      // Si plan présent, vérifier couverture (sauf ingrédients optionnels)
      if (hasAny) {
        const notOk = Object.values(coverage).find(c => !c.ok);
        if (notOk) {
          throw new Error("Le plan ne couvre pas les besoins d’au moins un ingrédient (ou quantité = 0).");
        }
      }

      const res = await fetch(`/api/cook/${id}`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: hasAny ? JSON.stringify({ plan: flatPlan }) : '{}'
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.missing?.length) {
          const first = json.missing[0];
          throw new Error(`Stock insuffisant pour ${first.name}: il manque ${first.missingQty} ${first.unit} (dispo ${first.available}).`);
        }
        throw new Error(json?.error || 'Erreur inconnue');
      }
      router.push('/recipes'); // ou afficher un toast de succès
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="container"><p>Chargement…</p></div>;
  if (!recipe) return <div className="container"><p>Recette introuvable.</p></div>;

  return (
    <div className="container">
      <h1>{recipe.title}</h1>

      <Section
        title="Préférences"
        right={null}
      >
        <div className="card" style={{display:'flex',alignItems:'center',gap:12}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input
              type="checkbox"
              checked={noOverfill}
              onChange={(e)=>setNoOverfill(e.target.checked)}
            />
            <span>Ne jamais dépasser la quantité demandée lors de l’auto-remplissage</span>
          </label>
        </div>
      </Section>

      <Section title="Ingrédients">
        {(ings||[]).map(ing => {
          const pid = ing.product_id;
          const meta = metaByProduct[pid] || {};
          const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();
          const needQty = Number(ing.qty || 0);

          return (
            <div key={pid} className="card" style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                <div>
                  <strong>{ing.product?.name || 'Ingrédient'}</strong>
                  <div style={{opacity:.8}}>
                    Besoin: {needQty} {needUnit}
                    {ing.optional ? <span className="badge" style={{marginLeft:8}}>optionnel</span> : null}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{opacity:.8}}>
                    Couvert : <strong>{(coverage[pid]?.covered ?? 0).toFixed(2)} {needUnit}</strong>
                    {!coverage[pid]?.ok && !ing.optional ? <span className="badge" style={{marginLeft:8, borderColor:'#e67', color:'#e67'}}>insuffisant</span> : null}
                  </div>
                  <button className="btn" onClick={()=>autoFillForProduct(pid)}>Auto-remplir</button>
                </div>
              </div>

              <div className="grid" style={{marginTop:10, gap:10}}>
                {(lotsByProduct[pid] || []).length === 0 ? (
                  <div style={{opacity:.7}}>Aucun lot en stock.</div>
                ) : (
                  (lotsByProduct[pid] || []).map(lot => (
                    <LotRow
                      key={lot.id}
                      lot={lot}
                      ing={ing}
                      meta={meta}
                      onChange={(p)=> setLotSelection(pid, lot.id, p)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </Section>

      {error && <p style={{color:'#c00'}}>{error}</p>}

      <div className="toolbar" style={{justifyContent:'flex-end',gap:8}}>
        <button className="btn" onClick={() => autoFillAll()}>Auto-remplir tout</button>
      </div>

      <div className="toolbar">
        <button className="btn" onClick={()=>router.back()}>Retour</button>
        <button className="btn primary" onClick={cook} disabled={sending}>
          {sending ? 'Cuisiner…' : 'Cuisiner'}
        </button>
      </div>
    </div>
  );
}
