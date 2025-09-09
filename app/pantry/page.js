// app/pantry/page.jsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { glassBase } from '@/components/ui/glass';
import { daysUntil } from '@/lib/dates';
import LotCard from '@/components/pantry/LotCard';
import ProductCard from '@/components/pantry/ProductCard';

export default function PantryPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [lots, setLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [q, setQ] = useState('');
  const [locFilter, setLocFilter] = useState('Tous');
  const [view, setView] = useState('products'); // 'products' | 'locations'
  const [showAddForm, setShowAddForm] = useState(false); // branche sur ton form existant si besoin

  const load = useCallback(async ()=>{
    setLoading(true); setErr('');
    try {
      const { data: ls, error: e2 } = await supabase
        .from('inventory_lots')
        .select(`
          id, qty, unit, best_before:dlc, note, created_at,
          product:products_catalog ( id, name, category ),
          location:locations ( id, name )
        `)
        .order('dlc', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false });
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setLocations(locs||[]);
      setLots(ls||[]);
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

      {/* (optionnel) ton AddLotForm existant ici */}
      {showAddForm && (
        <div className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'1rem', marginBottom:'1rem' }}>
          {/* Monte ton AddLotForm ici, branché sur inventory_lots/locations/products_catalog */}
          <em>Formulaire d’ajout — à brancher (on peut le recoder si tu veux).</em>
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

/* ——— Petits sous-composants ——— */
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
