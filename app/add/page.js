'use client';
import { useEffect,useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Add(){
  const [locations,setLocations]=useState([]);
  const [products,setProducts]=useState([]);
  const [form,setForm]=useState({ product_id:'', location_id:'', qty:'', unit:'g', dlc:'' });

  useEffect(()=>{ (async()=>{
    const { data:locs } = await supabase.from('locations').select('*').order('sort_order');
    setLocations(locs||[]);
    const { data:prods } = await supabase.from('products_catalog').select('id,name,default_unit').order('name');
    setProducts(prods||[]);
  })() },[]);

  const submit = async (e)=>{
    e.preventDefault();
    if(!form.product_id || !form.location_id || !form.qty) return alert('Remplis produit, lieu, quantité.');
    const { error } = await supabase.from('inventory_lots').insert({
      product_id: form.product_id,
      location_id: form.location_id,
      qty: Number(form.qty),
      unit: form.unit,
      dlc: form.dlc || null,
      source: 'achat'
    });
    if(error) alert(error.message); else { alert('Ajouté ✅'); setForm(f=>({...f, qty:'', dlc:'' })); }
  };

  return (
    <div>
      <h1>Ajouter un lot</h1>
      <form onSubmit={submit} className="card" style={{display:'grid',gap:8,maxWidth:460}}>
        <label>Produit
          <select value={form.product_id} onChange={e=>{
            const id=e.target.value;
            const p=products.find(x=>x.id===id);
            setForm(f=>({...f, product_id:id, unit:p?.default_unit||f.unit}));
          }}>
            <option value="">— choisir —</option>
            {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label>Lieu
          <select value={form.location_id} onChange={e=>setForm(f=>({...f,location_id:e.target.value}))}>
            <option value="">— choisir —</option>
            {locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        <label>Quantité
          <input type="number" step="0.01" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))}/>
        </label>
        <label>Unité
          <input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}/>
        </label>
        <label>DLC (optionnel)
          <input type="date" value={form.dlc} onChange={e=>setForm(f=>({...f,dlc:e.target.value}))}/>
        </label>
        <button type="submit">Ajouter</button>
      </form>
      <p style={{marginTop:8,color:'#555'}}>Astuce : ajoute d’abord 2-3 produits & lieux dans Supabase si les listes sont vides.</p>
    </div>
  );
}
