'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// 🔧 Si ton nom de table des lieux diffère, adapte P_LOC_TABLE ci-dessous.
const P_LOC_TABLE = 'pantry_locations'; // ex: 'pantry_locations' ou 'locations'

function fmtDate(d){
  if(!d) return '—';
  try{
    const x = new Date(d);
    return x.toLocaleDateString('fr-FR');
  }catch{ return d; }
}
function daysUntil(d){
  if(!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const x = new Date(d); x.setHours(0,0,0,0);
  return Math.round((x - today) / 86400000);
}
function badgeForBestBefore(d){
  const n = daysUntil(d);
  if(n === null) return null;
  const style = {
    fontSize:12, padding:'2px 6px', borderRadius:12
  };
  if(n < 0) return <span style={{...style, background:'#fee2e2', color:'#991b1b'}}>périmé</span>;
  if(n <= 2) return <span style={{...style, background:'#ffedd5', color:'#9a3412'}}>⚠︎ {n} j</span>;
  if(n <= 7) return <span style={{...style, background:'#fef9c3', color:'#854d0e'}}>{n} j</span>;
  return <span style={{...style, background:'#e2fbe2', color:'#166534'}}>ok</span>;
}

export default function PantryPage(){
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [locations, setLocations] = useState([]); // [{id,name}]
  const [lots, setLots] = useState([]);           // joint avec produits & lieux
  const [q, setQ] = useState('');
  const [locFilter, setLocFilter] = useState('Tous');

  // Charger l'utilisateur (nécessaire pour certaines UIs)
  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    })();
  },[]);

  const load = useCallback(async ()=>{
    setLoading(true); setErr('');
    try{
      // 1) Lieux
      const { data: locs, error: e1 } = await supabase
        .from(P_LOC_TABLE)
        .select('id, name')
        .order('name',{ascending:true});
      if(e1) throw e1;
      setLocations(locs || []);

      // 2) Lots du garde-manger (jointures lisibles)
      const { data: ls, error: e2 } = await supabase
        .from('pantry_lots')
        .select(`
          id, product_id, location_id, qty, unit, best_before, note, created_at,
          product:products_catalog ( id, name ),
          location:${P_LOC_TABLE} ( id, name )
        `)
        .order('best_before', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false });
      if(e2) throw e2;

      setLots(ls || []);
    }catch(e){
      console.error(e);
      setErr(e.message || 'Erreur de chargement');
    }finally{
      setLoading(false);
    }
  },[]);

  useEffect(()=>{ load(); },[load]);

  // 🔍 filtrage
  const filtered = useMemo(()=>{
    const s = (q || '').toLowerCase().trim();
    return (lots || []).filter(l=>{
      const okLoc = locFilter === 'Tous' || l.location?.name === locFilter;
      const okQ = !s || (l.product?.name?.toLowerCase().includes(s) || l.note?.toLowerCase().includes(s));
      return okLoc && okQ;
    });
  },[lots,q,locFilter]);

  // Regroupement par lieu
  const grouped = useMemo(()=>{
    const m = new Map();
    for(const lot of filtered){
      const key = lot.location?.name || 'Sans lieu';
      if(!m.has(key)) m.set(key, []);
      m.get(key).push(lot);
    }
    // tri interne par urgence périm
    for(const [k, arr] of m){
      arr.sort((a,b)=>{
        const da = daysUntil(a.best_before);
        const db = daysUntil(b.best_before);
        // nulls en dernier
        if(da === null && db === null) return 0;
        if(da === null) return 1;
        if(db === null) return -1;
        return da - db;
      });
    }
    return m;
  },[filtered]);

  // Actions rapides
  async function deleteLot(lot){
    if(!confirm(`Supprimer le lot de "${lot.product?.name}" ?`)) return;
    const { error } = await supabase.from('pantry_lots').delete().eq('id', lot.id);
    if(error) return alert(error.message);
    setLots(prev=>prev.filter(x=>x.id!==lot.id));
  }
  async function incQty(lot, delta){
    const newQty = Math.max(0, Number(lot.qty||0) + delta);
    const { data, error } = await supabase
      .from('pantry_lots')
      .update({ qty: newQty })
      .eq('id', lot.id)
      .select('id, qty')
      .single();
    if(error) return alert(error.message);
    setLots(prev=>prev.map(x=>x.id===lot.id? {...x, qty: data.qty}: x));
  }

  // Petit formulaire d’ajout rapide (manuel) — utile aussi pour tester
  const [addOpen, setAddOpen] = useState(false);
  const [addProductName, setAddProductName] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addUnit, setAddUnit] = useState('pièce');
  const [addBestBefore, setAddBestBefore] = useState('');
  const [addLocation, setAddLocation] = useState('');

  async function addManual(e){
    e.preventDefault();
    if(!addProductName.trim()) return;

    // 1) Retrouver/Créer le produit dans products_catalog par name (case-insensitive)
    const name = addProductName.trim();
    let productId = null;

    // cherche exact ci
    const { data: found, error: e1 } = await supabase
      .from('products_catalog')
      .select('id,name')
      .ilike('name', name)
      .limit(1)
      .maybeSingle();
    if(e1 && e1.code !== 'PGRST116') return alert(e1.message);
    if(found?.id){
      productId = found.id;
    } else {
      // crée
      const { data: created, error: e2 } = await supabase
        .from('products_catalog')
        .insert({ name })
        .select('id')
        .single();
      if(e2) return alert(e2.message);
      productId = created.id;
    }

    // 2) Lieu choisi
    const loc = locations.find(l=>l.name === addLocation) || null;
    const locationId = loc?.id ?? null;

    // 3) Insert lot
    const payload = {
      product_id: productId,
      location_id: locationId,
      qty: Number(addQty)||0,
      unit: addUnit || null,
      best_before: addBestBefore || null,
      note: 'ajout manuel'
    };
    const { data: lot, error: e3 } = await supabase
      .from('pantry_lots')
      .insert(payload)
      .select(`
        id, product_id, location_id, qty, unit, best_before, note, created_at,
        product:products_catalog ( id, name ),
        location:${P_LOC_TABLE} ( id, name )
      `)
      .single();
    if(e3) return alert(e3.message);

    setLots(prev=>[lot, ...prev]);
    setAddProductName(''); setAddQty(1); setAddUnit('pièce'); setAddBestBefore('');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🏺 Garde-Manger</h1>
      <div className="card" style={{display:'grid',gap:8, marginTop:10}}>
        <div style={{display:'flex',gap:10, flexWrap:'wrap', alignItems:'center'}}>
          <input className="input" placeholder="Rechercher un produit…" value={q} onChange={e=>setQ(e.target.value)} style={{minWidth:220}}/>
          <select className="input" value={locFilter} onChange={e=>setLocFilter(e.target.value)}>
            <option value="Tous">Tous les lieux</option>
            {locations.map(l=><option key={l.id} value={l.name}>{l.name}</option>)}
            {locations.length===0 && <option disabled>(Aucun lieu)</option>}
          </select>
          <button className="btn" onClick={load}>↻ Rafraîchir</button>
          <button className="btn" onClick={()=>setAddOpen(v=>!v)}>
            {addOpen ? 'Fermer ajout' : 'Ajouter un lot'}
          </button>
        </div>

        {addOpen && (
          <form onSubmit={addManual} style={{display:'grid', gap:8, background:'#fafafa', padding:12, borderRadius:8}}>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:8}}>
              <input className="input" placeholder="Produit…" value={addProductName} onChange={e=>setAddProductName(e.target.value)} required/>
              <input className="input" type="number" min="0" step="0.01" value={addQty} onChange={e=>setAddQty(e.target.value)} title="Quantité"/>
              <input className="input" placeholder="Unité (g, kg, pièce…)" value={addUnit} onChange={e=>setAddUnit(e.target.value)}/>
              <input className="input" type="date" value={addBestBefore} onChange={e=>setAddBestBefore(e.target.value)} title="DLUO / DLC"/>
              <select className="input" value={addLocation} onChange={e=>setAddLocation(e.target.value)}>
                <option value="">Lieu…</option>
                {locations.map(l=><option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <button className="btn primary" type="submit">Ajouter</button>
            </div>
          </form>
        )}
      </div>

      {err && <div style={{color:'#b91c1c', marginTop:8}}>{err}</div>}
      {loading && <p style={{marginTop:8}}>Chargement…</p>}

      {/* Groupes par lieu */}
      <div style={{display:'grid', gap:14, marginTop:14}}>
        {[...grouped.keys()].map(groupName=>{
          const arr = grouped.get(groupName) || [];
          return (
            <section key={groupName} className="card" style={{display:'grid', gap:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{margin:0}}>{groupName}</h3>
                <small style={{opacity:.7}}>{arr.length} lot(s)</small>
              </div>
              <div className="grid" style={{gap:10, gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))'}}>
                {arr.map(lot=>{
                  return (
                    <div key={lot.id} className="card" style={{border:'1px solid #eee', display:'grid', gap:6}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8}}>
                        <strong className="line-clamp-2">{lot.product?.name || '??'}</strong>
                        {badgeForBestBefore(lot.best_before)}
                      </div>
                      <div style={{fontSize:13, opacity:.8}}>
                        {Number(lot.qty)||0} {lot.unit || ''} {lot.best_before ? `• ${fmtDate(lot.best_before)}` : ''}
                      </div>
                      {lot.note && <div style={{fontSize:12, opacity:.65}}>{lot.note}</div>}
                      <div style={{display:'flex', gap:6, marginTop:6}}>
                        <button className="btn" onClick={()=>incQty(lot, +1)}>+1</button>
                        <button className="btn" onClick={()=>incQty(lot, -1)} disabled={(Number(lot.qty)||0)<=0}>-1</button>
                        <button className="btn" onClick={()=>deleteLot(lot)} title="Supprimer">Supprimer</button>
                      </div>
                    </div>
                  );
                })}
                {arr.length===0 && <em style={{opacity:.6}}>Aucun lot dans ce lieu.</em>}
              </div>
            </section>
          );
        })}
        {grouped.size===0 && !loading && <p style={{opacity:.7}}>Aucun lot ne correspond au filtre.</p>}
      </div>
    </div>
  );
}
