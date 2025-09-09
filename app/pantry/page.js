// app/pantry/page.js
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

/* ----------------- Helpers dates & style ----------------- */
function daysUntil(date) {
  if (!date) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}
function fmtDate(d) {
  if (!d) return '—';
  try {
    const x = new Date(d);
    return x.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return d; }
}
const glassBase = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(10px) saturate(120%)',
  WebkitBackdropFilter: 'blur(10px) saturate(120%)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
  color: 'var(--ink, #1f281f)',
};

/* ----------------- Helpers conversion d'unités ----------------- */
const MASS = ['g','kg'];
const VOL  = ['ml','cl','l'];
const UNIT = ['u','pièce','piece','pcs'];

function normUnit(u='') {
  const x = (u||'').toLowerCase();
  if (x === 'piece' || x === 'pcs' || x === 'pièce') return 'u';
  return x;
}
function unitFamily(u) {
  u = normUnit(u);
  if (MASS.includes(u)) return 'mass';
  if (VOL.includes(u))  return 'vol';
  if (UNIT.includes(u)) return 'unit';
  return 'other';
}
function factorWithinFamily(from, to) {
  from = normUnit(from); to = normUnit(to);
  if (from===to) return 1;

  // masse
  if (MASS.includes(from) && MASS.includes(to)) {
    // base g
    const toG = from === 'kg' ? 1000 : 1;
    return to === 'kg' ? toG/1000 : toG; // g->kg: /1000, kg->g: *1000
  }
  // volume
  if (VOL.includes(from) && VOL.includes(to)) {
    // base ml
    const toMl = from === 'l' ? 1000 : from === 'cl' ? 10 : 1;
    return to === 'l' ? toMl/1000 : to === 'cl' ? toMl/10 : toMl;
  }
  return null;
}
function toBaseMass(qty, u) { // -> grammes
  u = normUnit(u);
  if (u==='kg') return Number(qty)*1000;
  return Number(qty);
}
function fromBaseMass(qtyG, toUnit) { // g -> g|kg
  toUnit = normUnit(toUnit);
  if (toUnit==='kg') return { qty: qtyG/1000, unit: 'kg' };
  return { qty: qtyG, unit: 'g' };
}
function toBaseVol(qty, u) { // -> ml
  u = normUnit(u);
  if (u==='l') return Number(qty)*1000;
  if (u==='cl') return Number(qty)*10;
  return Number(qty); // ml
}
function fromBaseVol(qtyMl, toUnit) { // ml -> ml|cl|l
  toUnit = normUnit(toUnit);
  if (toUnit==='l')  return { qty: qtyMl/1000, unit:'l' };
  if (toUnit==='cl') return { qty: qtyMl/10,   unit:'cl' };
  return { qty: qtyMl, unit:'ml' };
}

/**
 * Convertit qty depuis fromUnit vers toUnit en utilisant les infos produit.
 * Retourne { qty, unit } ou null si conversion impossible.
 * - Même famille (masse/volume) => facteurs connus
 * - Masse <-> Volume => nécessite product.density_g_per_ml
 * - Unit <-> Masse => nécessite product.grams_per_unit
 * - Unit <-> Volume => nécessite grams_per_unit + density_g_per_ml (via masse)
 */
function convertQty(qty, fromUnit, toUnit, product) {
  fromUnit = normUnit(fromUnit);
  toUnit   = normUnit(toUnit);
  if (!qty && qty !== 0) return null;
  if (fromUnit === toUnit) return { qty, unit: toUnit };

  const famFrom = unitFamily(fromUnit);
  const famTo   = unitFamily(toUnit);

  // 1) même famille
  const f = factorWithinFamily(fromUnit, toUnit);
  if (f != null) return { qty: Number(qty) * f, unit: toUnit };

  // Helpers data produit
  const density = Number(product?.density_g_per_ml || 0) || null;   // g / ml
  const gPerU   = Number(product?.grams_per_unit || 0) || null;     // g / u

  // 2) Mass <-> Volume via density
  if (famFrom==='mass' && famTo==='vol') {
    if (!density) return null;
    const qtyMl = (toBaseMass(qty, fromUnit) / density); // ml
    return fromBaseVol(qtyMl, toUnit);
  }
  if (famFrom==='vol' && famTo==='mass') {
    if (!density) return null;
    const qtyG = toBaseVol(qty, fromUnit) * density; // g
    return fromBaseMass(qtyG, toUnit);
  }

  // 3) Unit <-> Mass via grams_per_unit
  if (famFrom==='unit' && famTo==='mass') {
    if (!gPerU) return null;
    const qtyG = Number(qty) * gPerU;
    return fromBaseMass(qtyG, toUnit);
  }
  if (famFrom==='mass' && famTo==='unit') {
    if (!gPerU) return null;
    const qtyU = toBaseMass(qty, fromUnit) / gPerU;
    return { qty: qtyU, unit: toUnit };
  }

  // 4) Unit <-> Volume via grams_per_unit + density
  if (famFrom==='unit' && famTo==='vol') {
    if (!gPerU || !density) return null;
    const g = Number(qty) * gPerU;
    const ml = g / density;
    return fromBaseVol(ml, toUnit);
  }
  if (famFrom==='vol' && famTo==='unit') {
    if (!gPerU || !density) return null;
    const g = toBaseVol(qty, fromUnit) * density;
    const u = g / gPerU;
    return { qty: u, unit: toUnit };
  }

  return null;
}

/* ----------------- UI mini-composants ----------------- */
function LifespanBadge({ date }) {
  const d = daysUntil(date);
  if (d === null) return null;

  let status='ok', icon='🌿', label=`${d} j`, color='var(--success)';
  if (d < 0)      { status='expired'; icon='🍂'; label=`Périmé ${Math.abs(d)}j`; color='var(--danger)'; }
  else if (d===0) { status='today';   icon='⚡'; label="Aujourd'hui";           color='var(--autumn-orange)'; }
  else if (d<=3)  { status='urgent';  icon='⏰'; label=`${d}j`;                  color='var(--autumn-yellow)'; }
  else if (d<=7)  { status='soon';    icon='📅'; label=`${d}j`;                  color='var(--forest-500)'; }

  return (
    <span
      className={`lifespan-badge ${status}`}
      style={{
        display:'inline-flex',alignItems:'center',gap:6,
        padding:'4px 10px', borderRadius:999,
        background:`linear-gradient(135deg, ${color}15, ${color}08)`,
        border:`1px solid ${color}40`, color
      }}
      title={date || ''}
    >
      <span>{icon}</span><span>{label}</span>
    </span>
  );
}

function Stat({ value, label, tone }) {
  const color = tone==='danger' ? 'var(--danger)' :
                tone==='warning' ? 'var(--autumn-orange)' :
                tone==='muted' ? 'var(--earth-700)' : 'var(--forest-600)';
  return (
    <div className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'12px', textAlign:'center' }}>
      <div style={{ fontSize:'1.6rem', fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:'.9rem', color:'var(--earth-700)' }}>{label}</div>
    </div>
  );
}
function Badge({ children, tone='muted' }) {
  const color = tone==='danger' ? 'var(--danger)' :
                tone==='warning' ? 'var(--autumn-orange)' : 'var(--earth-700)';
  return (
    <span style={{ fontSize:'.85rem', padding:'4px 10px', borderRadius:999, border:`1px solid ${color}40`, color, background:`${color}10` }}>
      {children}
    </span>
  );
}
function EmptyBox() {
  return (
    <div className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'2rem', textAlign:'center' }}>
      <div style={{fontSize:'2rem'}}>🌾</div>
      <div style={{color:'var(--earth-700)'}}>Aucun résultat</div>
    </div>
  );
}

/* ----------------- Cartes ----------------- */
function LotCard({ lot, onIncQty, onDelete }) {
  return (
    <div
      className="card lot-card"
      style={{
        ...glassBase, borderRadius:'var(--radius-lg)', padding:'12px',
        transition:'all .2s'
      }}
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:8, marginBottom:8}}>
        <div style={{fontWeight:600, color:'var(--forest-700)'}}>
          {lot.product?.name || 'Produit'}
        </div>
        <LifespanBadge date={lot.best_before} />
      </div>

      <div style={{display:'flex',gap:8,alignItems:'baseline', marginBottom:6}}>
        <span style={{fontSize:'1.25rem', fontWeight:700, color:'var(--forest-700)'}}>{Number(lot.qty)||0}</span>
        <span style={{opacity:.75}}>{lot.unit || 'u'}</span>
      </div>

      {lot.best_before && (
        <div style={{fontSize:'.9rem', color:'var(--earth-600)', marginBottom:8}}>
          📅 {fmtDate(lot.best_before)}
        </div>
      )}

      {lot.note && (
        <div style={{fontSize:'.85rem', color:'var(--earth-700)', background:'rgba(0,0,0,0.04)', padding:'6px 8px', borderRadius:10, marginBottom:8}}>
          💬 {lot.note}
        </div>
      )}

      <div style={{display:'flex', gap:8}}>
        <button className="btn small" onClick={()=>onIncQty?.(lot, +1)} style={{flex:1}}>➕</button>
        <button className="btn small secondary" onClick={()=>onIncQty?.(lot, -1)} disabled={(Number(lot.qty)||0)<=0} style={{flex:1}}>➖</button>
        <button className="btn small danger" onClick={()=>onDelete?.(lot)} title="Supprimer">🗑️</button>
      </div>
    </div>
  );
}

function ProductCard({ productId, name, category, unit, lots=[], onOpen }) {
  const { total, nextDate, locations } = useMemo(()=>{
    let total=0, nextDate=null;
    const locSet = new Set();
    for (const l of lots) {
      total += Number(l.qty||0);
      if (l.location?.name) locSet.add(l.location.name);
      const d = l.best_before;
      if (d && (nextDate===null || new Date(d) < new Date(nextDate))) nextDate = d;
    }
    return { total, nextDate, locations:[...locSet].slice(0,6) };
  },[lots]);

  const soon = nextDate ? daysUntil(nextDate) : null;
  const cap = (s)=>s ? s[0].toUpperCase()+s.slice(1) : '—';
  const [pressed, setPressed] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={()=>onOpen?.({ productId, name })}
      onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') onOpen?.({ productId, name }); }}
      onMouseDown={()=>setPressed(true)}
      onMouseUp={()=>setPressed(false)}
      onMouseLeave={()=>setPressed(false)}
      className="product-card"
      style={{
        ...glassBase,
        borderRadius:'var(--radius-lg)',
        padding:'14px',
        display:'grid',
        gap:8,
        cursor:'pointer',
        transform: pressed ? 'scale(1.02)' : 'none',
        transition: 'transform var(--transition-base, .18s ease)'
      }}
    >
      <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
        <div>
          <div style={{fontWeight:700, color:'var(--forest-700)'}}>{name}</div>
          <div style={{fontSize:'.85rem', color:'var(--earth-600)'}}>{cap(category)}</div>
        </div>
        <LifespanBadge date={nextDate} />
      </div>

      <div style={{display:'flex', alignItems:'baseline', gap:6}}>
        <span style={{fontSize:'1.6rem', fontWeight:800, color:'var(--forest-700)'}}>{total}</span>
        <span style={{opacity:.7}}>{unit || lots[0]?.unit || 'u'}</span>
        {soon!=null && <span style={{marginLeft:8, fontSize:'.9rem', color:'var(--earth-700)'}}>• plus proche : J+{Math.max(soon,0)}</span>}
      </div>

      {!!locations.length && (
        <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
          {locations.map(loc => (
            <span key={loc} style={{ fontSize:'.8rem', padding:'4px 8px', borderRadius:999, background:'rgba(0,0,0,0.04)' }}>📍 {loc}</span>
          ))}
        </div>
      )}

      <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
        <Link className="btn small secondary" href={`/produits/${productId}`} onClick={(e)=>e.stopPropagation()}>Détails →</Link>
        <button className="btn small" onClick={(e)=>{ e.stopPropagation(); onOpen?.({ productId, name }); }}>
          Gérer
        </button>
      </div>
    </div>
  );
}

/* ----------------- Modal Gestion Produit ----------------- */
function ProductDetailModal({ product, lots, locations, onClose, onIncQty, onUpdateLot, onDeleteLot }) {
  if (!product) return null;
  const productLots = (lots||[]).filter(l => l.product?.id === product.productId);

  function availableUnitsForProduct() {
    // On expose un set raisonnable; la logique désactive les options impossibles (voir renderUnitOptions)
    return ['g','kg','ml','cl','l','u'];
  }
  function renderUnitOptions(prod, currentUnit) {
    const density = Number(prod?.density_g_per_ml || 0) || null;
    const gPerU   = Number(prod?.grams_per_unit || 0) || null;

    return availableUnitsForProduct().map(u=>{
      const fromFam = unitFamily(currentUnit||'u');
      const toFam   = unitFamily(u);
      let disabled = false;

      if (fromFam!==toFam) {
        if ((fromFam==='mass' && toFam==='vol') || (fromFam==='vol' && toFam==='mass')) {
          if (!density) disabled = true;
        }
        if ((fromFam==='unit' && toFam==='mass') || (fromFam==='mass' && toFam==='unit')) {
          if (!gPerU) disabled = true;
        }
        if ((fromFam==='unit' && toFam==='vol') || (fromFam==='vol' && toFam==='unit')) {
          if (!(gPerU && density)) disabled = true;
        }
      }
      return <option key={u} value={u} disabled={disabled}>{u}</option>;
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(0,0,0,.28)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem'
      }}
    >
      <div
        onClick={(e)=>e.stopPropagation()}
        className="glass-card"
        style={{ ...glassBase, width:'min(900px, 96vw)', maxHeight:'85vh', overflow:'auto', borderRadius:'24px', padding:'1.2rem' }}
      >
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:12}}>
          <h2 style={{margin:0}}>🍄 {product.name}</h2>
          <button className="btn icon" onClick={onClose} title="Fermer">✕</button>
        </div>

        {productLots.length === 0 ? (
          <div style={{ padding:'2rem', textAlign:'center', color:'var(--earth-700)' }}>
            Aucun lot pour ce produit.
          </div>
        ) : (
          <div style={{ display:'grid', gap:10 }}>
            {productLots.map(lot => (
              <div key={lot.id} className="card" style={{ ...glassBase, borderRadius:16, padding:'10px 12px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1.35fr 1.1fr .9fr 1.1fr auto', gap:10, alignItems:'center' }}>
                  {/* Quantité + Unité (avec conversion) */}
                  <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 0.9fr', gap:6, alignItems:'center' }}>
                    <button className="btn small" onClick={()=>onIncQty(lot,-1)} disabled={(Number(lot.qty)||0)<=0}>−</button>

                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      defaultValue={Number(lot.qty)||0}
                      onBlur={(e)=>{
                        const v = Number(e.target.value||0);
                        if (Number.isNaN(v)) return;
                        onUpdateLot(lot.id, { qty: v });
                      }}
                    />

                    <select
                      className="input"
                      defaultValue={lot.unit || 'u'}
                      onChange={(e)=>{
                        const nextU = e.target.value;
                        const res = convertQty(Number(lot.qty||0), lot.unit||'u', nextU, lot.product);
                        if (!res) {
                          e.target.value = lot.unit || 'u';
                          alert("Conversion d'unité impossible pour ce produit (il manque density_g_per_ml ou grams_per_unit).");
                          return;
                        }
                        onUpdateLot(lot.id, { qty: Number(res.qty.toFixed(2)), unit: res.unit });
                      }}
                    >
                      {renderUnitOptions(lot.product, lot.unit)}
                    </select>
                  </div>

                  {/* DLC */}
                  <div>
                    <label style={{ fontSize:12, opacity:.7 }}>DLC</label>
                    <input
                      className="input"
                      type="date"
                      defaultValue={lot.best_before || ''}
                      onChange={(e)=>onUpdateLot(lot.id, { dlc: e.target.value || null })}
                    />
                  </div>

                  {/* Lieu */}
                  <div>
                    <label style={{ fontSize:12, opacity:.7 }}>Lieu</label>
                    <select
                      className="input"
                      defaultValue={lot.location?.id || lot.location_id || ''}
                      onChange={e=>onUpdateLot(lot.id, { location_id: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>

                  {/* Badge & date jolie */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <LifespanBadge date={lot.best_before} />
                    <span style={{ fontSize:'.9rem', color:'var(--earth-700)' }}>{lot.best_before ? fmtDate(lot.best_before) : '—'}</span>
                  </div>

                  {/* Supprimer */}
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button className="btn small danger" onClick={()=>onDeleteLot(lot)} title="Supprimer ce lot">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------- Page ----------------- */
export default function PantryPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [lots, setLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [q, setQ] = useState('');
  const [locFilter, setLocFilter] = useState('Tous');
  const [view, setView] = useState('products'); // 'products' | 'locations'
  const [showAddForm, setShowAddForm] = useState(false);
  const [openProduct, setOpenProduct] = useState(null); // { productId, name }

  const load = useCallback(async ()=>{
    setLoading(true); setErr('');
    try {
      const [{ data: locs, error: e1 }, { data: ls, error: e2 }] = await Promise.all([
        supabase.from('locations').select('id, name').order('name',{ascending:true}),
        supabase
          .from('inventory_lots')
          .select(
            `
              id, qty, unit, best_before:dlc, note, entered_at, location_id,
              product:products_catalog ( id, name, category, default_unit, density_g_per_ml, grams_per_unit ),
              location:locations ( id, name )
            `
          )
          .order('dlc', { ascending:true, nullsFirst:true })
          .order('entered_at', { ascending:false })
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setLocations(locs||[]);
      setLots((ls||[]));
    } catch (e) {
      console.error(e); setErr(e.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  // filtre texte + lieu
  const filtered = useMemo(()=>{
    const s = (q||'').toLowerCase().trim();
    return (lots||[]).filter(l=>{
      const okLoc = locFilter==='Tous' || l.location?.name===locFilter;
      const okQ = !s || l.product?.name?.toLowerCase().includes(s) || l.note?.toLowerCase().includes(s);
      return okLoc && okQ;
    });
  }, [lots, q, locFilter]);

  // agrégations
  const byLocation = useMemo(()=>{
    const m = new Map();
    for (const lot of filtered) {
      const key = lot.location?.name || 'Sans lieu';
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(lot);
    }
    for (const [k, arr] of m) {
      arr.sort((a,b)=>{
        const da = daysUntil(a.best_before);
        const db = daysUntil(b.best_before);
        if (da===null && db===null) return 0;
        if (da===null) return 1;
        if (db===null) return -1;
        return da - db;
      });
    }
    return m;
  }, [filtered]);

  const byProduct = useMemo(()=>{
    const m = new Map();
    for (const lot of filtered) {
      const pid = lot.product?.id; if (!pid) continue;
      if (!m.has(pid)) m.set(pid, { productId: pid, name: lot.product.name, category: lot.product.category, unit: lot.unit, lots: [] });
      m.get(pid).lots.push(lot);
    }
    return Array.from(m.values()).sort((a,b)=>a.name.localeCompare(b.name));
  }, [filtered]);

  // stats
  const stats = useMemo(()=>{
    const total = filtered.length;
    const expired = filtered.filter(l => daysUntil(l.best_before) < 0).length;
    const urgent = filtered.filter(l => {
      const d = daysUntil(l.best_before);
      return d!==null && d>=0 && d<=3;
    }).length;
    const soon = filtered.filter(l => {
      const d = daysUntil(l.best_before);
      return d!==null && d>3 && d<=7;
    }).length;
    return { total, expired, urgent, soon };
  }, [filtered]);

  /* --------- actions lots (mutations Supabase) --------- */
  async function incQty(lot, delta) {
    const newQty = Math.max(0, Number(lot.qty||0) + delta);
    const { data, error } = await supabase
      .from('inventory_lots')
      .update({ qty: newQty })
      .eq('id', lot.id)
      .select('id, qty')
      .single();
    if (error) return alert(error.message);
    setLots(prev => prev.map(x => x.id===lot.id ? { ...x, qty: data.qty } : x));
  }

  async function updateLot(lotId, patch) {
    // patch peut contenir { dlc, location_id, unit, note, qty }
    const dbPatch = { ...patch };
    const { data, error } = await supabase
      .from('inventory_lots')
      .update(dbPatch)
      .eq('id', lotId)
      .select(
        `
          id, qty, unit, dlc, location_id
        `
      )
      .single();
    if (error) return alert(error.message);

    setLots(prev => prev.map(x => {
      if (x.id !== lotId) return x;
      const next = { ...x };
      if ('dlc' in dbPatch) next.best_before = data.dlc || null;
      if ('qty' in dbPatch) next.qty = data.qty;
      if ('unit' in dbPatch) next.unit = data.unit;
      if ('location_id' in dbPatch) {
        next.location_id = data.location_id;
        const loc = locations.find(l=>String(l.id) === String(data.location_id)) || null;
        next.location = loc ? { id: loc.id, name: loc.name } : null;
      }
      return next;
    }));
  }

  async function deleteLot(lot) {
    if (!confirm(`Supprimer le lot de "${lot.product?.name}" ?`)) return;
    const { error } = await supabase.from('inventory_lots').delete().eq('id', lot.id);
    if (error) return alert(error.message);
    setLots(prev => prev.filter(x => x.id !== lot.id));
  }

  return (
    <div className="container">
      {/* Header glass */}
      <section className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-xl)', padding:'1.2rem', marginBottom:'1rem' }}>
        <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <h1 style={{margin:0}}>🏺 Garde-manger</h1>
          <div style={{display:'flex',gap:8}}>
            <button className={`btn small ${view==='products'?'primary':''}`} onClick={()=>setView('products')}>Par produits</button>
            <button className={`btn small ${view==='locations'?'primary':''}`} onClick={()=>setView('locations')}>Par lieux</button>
          </div>
        </div>

        {/* Stats + toolbar */}
        <div className="grid cols-4" style={{marginTop:12}}>
          <Stat value={stats.total} label="Lots totaux" />
          <Stat value={stats.expired} label="Périmés" tone="danger" />
          <Stat value={stats.urgent} label="Urgent (≤3j)" tone="warning" />
          <Stat value={stats.soon} label="À surveiller (≤7j)" tone="muted" />
        </div>

        <div style={{display:'flex',gap:8,alignItems:'center',marginTop:12,flexWrap:'wrap'}}>
          <input className="input" placeholder="🔍 Rechercher un produit…" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:320}}/>
          <select className="input" value={locFilter} onChange={e=>setLocFilter(e.target.value)} style={{maxWidth:220}}>
            <option value="Tous">📍 Tous les lieux</option>
            {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
          <button className="btn" onClick={load}><span style={{display:'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none'}}>↻</span> Rafraîchir</button>
          <button className="btn primary" onClick={()=>setShowAddForm(s=>!s)}>{showAddForm ? '✕ Fermer' : '➕ Ajouter un lot'}</button>
        </div>
      </section>

      {/* (optionnel) bloc pour ton AddLotForm existant */}
      {showAddForm && (
        <div className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'1rem', marginBottom:'1rem' }}>
          <em>Formulaire d’ajout — branche ton composant ici.</em>
        </div>
      )}

      {err && (
        <div className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'1rem', borderColor:'var(--danger)', color:'var(--danger)', marginBottom:'1rem' }}>
          ⚠️ {err}
        </div>
      )}

      {loading && (
        <div className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'1rem' }}>
          Chargement…
        </div>
      )}

      {!loading && (
        <>
          {view==='products' ? (
            <section className="grid cols-4" style={{gap:12}}>
              {byProduct.map(p => (
                <ProductCard
                  key={p.productId}
                  productId={p.productId}
                  name={p.name}
                  category={p.category}
                  unit={p.unit}
                  lots={p.lots}
                  onOpen={setOpenProduct}
                />
              ))}
              {byProduct.length===0 && <EmptyBox />}
            </section>
          ) : (
            <section>
              {[...byLocation.keys()].map(locName => {
                const arr = byLocation.get(locName) || [];
                const statsLoc = {
                  expired: arr.filter(l=>daysUntil(l.best_before)<0).length,
                  urgent: arr.filter(l=>{ const d=daysUntil(l.best_before); return d!==null && d>=0 && d<=3; }).length,
                  total: arr.length
                };
                return (
                  <div key={locName} className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-xl)', padding:'1rem', marginBottom:'1rem' }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <h3 style={{margin:0}}>📍 {locName}</h3>
                      <div style={{display:'flex',gap:6}}>
                        {statsLoc.expired>0 && <Badge tone="danger">{statsLoc.expired} périmé{statsLoc.expired>1?'s':''}</Badge>}
                        {statsLoc.urgent>0 && <Badge tone="warning">{statsLoc.urgent} urgent{statsLoc.urgent>1?'s':''}</Badge>}
                        <Badge tone="muted">{statsLoc.total} total</Badge>
                      </div>
                    </div>
                    <div className="grid cols-3" style={{gap:12}}>
                      {arr.map(lot => (
                        <LotCard key={lot.id} lot={lot} onIncQty={incQty} onDelete={deleteLot} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {byLocation.size===0 && <EmptyBox />}
            </section>
          )}
        </>
      )}

      {/* MODAL produit */}
      <ProductDetailModal
        product={openProduct}
        lots={lots}
        locations={locations}
        onClose={()=>setOpenProduct(null)}
        onIncQty={incQty}
        onUpdateLot={updateLot}
        onDeleteLot={deleteLot}
      />
    </div>
  );
}
