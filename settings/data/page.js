// app/settings/data/page.js
'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DataAdmin(){
  const [q,setQ]=useState('');
  const [products,setProducts]=useState([]);
  const [aliases,setAliases]=useState([]);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function load(){
    setBusy(true); setMsg('');
    const { data: prods } = await supabase
      .from('products_catalog')
      .select('id,name,default_unit,density_g_per_ml,grams_per_unit')
      .order('name');
    setProducts(prods||[]);
    const { data: als } = await supabase
      .from('product_aliases')
      .select('id,product_id,alias,product:products_catalog(name)')
      .order('alias');
    setAliases(als||[]);
    setBusy(false);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(()=>{
    const s = (q||'').toLowerCase();
    if(!s) return products;
    return products.filter(p => p.name.toLowerCase().includes(s));
  },[q,products]);

  async function countRefs(pid){
    const { count: cLots } = await supabase
      .from('inventory_lots')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', pid);
    const { count: cIng } = await supabase
      .from('recipe_ingredients')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', pid);
    return { lots: cLots||0, ings: cIng||0 };
  }

  async function deleteProduct(p){
    setMsg('');
    const { lots, ings } = await countRefs(p.id);
    if (lots>0 || ings>0) {
      alert(`Impossible de supprimer: ${lots} lot(s) et ${ings} ingrédient(s) référencent ce produit.`);
      return;
    }
    if (!confirm(`Supprimer définitivement le produit « ${p.name} » et tous ses alias ?`)) return;
    setBusy(true);
    await supabase.from('product_aliases').delete().eq('product_id', p.id);
    const { error } = await supabase.from('products_catalog').delete().eq('id', p.id);
    setBusy(false);
    if (error) alert(error.message); else { setMsg('Produit supprimé.'); load(); }
  }

  async function deleteAlias(a){
    if (!confirm(`Supprimer l’alias « ${a.alias} » pour ${a.product?.name} ?`)) return;
    setBusy(true);
    const { error } = await supabase.from('product_aliases').delete().eq('id', a.id);
    setBusy(false);
    if (error) alert(error.message); else { setMsg('Alias supprimé.'); load(); }
  }

  async function deleteOrphanAliases(){
    setBusy(true);
    const { data: als } = await supabase.from('product_aliases').select('id,product_id');
    const pids = new Set((products||[]).map(p=>p.id));
    const toDel = (als||[]).filter(a=>!pids.has(a.product_id)).map(a=>a.id);
    if (toDel.length) {
      await supabase.from('product_aliases').delete().in('id', toDel);
      setMsg(`${toDel.length} alias orphelin(s) supprimé(s).`);
    } else {
      setMsg('Aucun alias orphelin.');
    }
    setBusy(false);
    load();
  }

  return (
    <div className="container">
      <h1>Paramètres → Données</h1>

      <div className="card" style={{display:'flex',gap:8,alignItems:'center'}}>
        <input className="input" placeholder="Rechercher un produit…" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:360}}/>
        <button className="btn" onClick={load} disabled={busy}>Rafraîchir</button>
        <button className="btn" onClick={deleteOrphanAliases} disabled={busy}>Supprimer alias orphelins</button>
        {msg && <span style={{marginLeft:8,opacity:.8}}>{msg}</span>}
      </div>

      <h2>Produits</h2>
      <div className="grid" style={{gap:10}}>
        {filtered.map(p=>(
          <div key={p.id} className="card" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,alignItems:'center'}}>
            <div>
              <div><strong>{p.name}</strong></div>
              <div style={{opacity:.7,fontSize:12}}>
                Défaut: {p.default_unit || 'g'} • Densité: {p.density_g_per_ml ?? '—'} • g/u: {p.grams_per_unit ?? '—'}
              </div>
            </div>
            <button className="btn" onClick={()=>deleteProduct(p)} disabled={busy}>Supprimer</button>
          </div>
        ))}
        {filtered.length===0 && <p style={{opacity:.7}}>Aucun résultat.</p>}
      </div>

      <h2 style={{marginTop:20}}>Alias</h2>
      <div className="grid" style={{gap:8}}>
        {(aliases||[]).map(a=>(
          <div key={a.id} className="card" style={{display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center'}}>
            <div>{a.alias} <span style={{opacity:.6}}>(→ {a.product?.name || '—'})</span></div>
            <button className="btn" onClick={()=>deleteAlias(a)} disabled={busy}>Supprimer</button>
          </div>
        ))}
        {(aliases||[]).length===0 && <p style={{opacity:.7}}>Aucun alias.</p>}
      </div>
    </div>
  );
}
