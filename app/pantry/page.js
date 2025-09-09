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

function ProductCard({ productId, name, category, unit, lots=[] }) {
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

  return (
    <div className="product-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'14px', display:'grid', gap:8 }}>
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

      <div style={{display:'flex', justifyContent:'flex-end'}}>
        <Link className="btn small secondary" href={`/produits/${productId}`}>Détails →</Link>
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

  const load = useCallback(async ()=>{
    setLoading(true); setErr('');
    try {
      const [{ data: locs, error: e1 }, { data: ls, error: e2 }] = await Promise.all([
        supabase.from('locations').select('id, name').order('name',{ascending:true}),
        supabase
          .from('inventory_lots')
          .select(
            `
              id, qty, unit, best_before:dlc, note, entered_at,
              product:products_catalog ( id, name, category ),
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
    // tri du plus urgent au moins urgent
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

  // actions
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
    </div>
  );
}
