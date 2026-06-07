'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import './add.css';

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
    <div className="v21-page narrow">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Garde-manger</span>
          <h1 className="v21-title">Ajouter un lot</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Enregistrez un produit, son lieu de stockage et sa quantité.</p>
        </div>
      </header>

      <section className="v21-section flush">
        <form onSubmit={submit} className="v21-form">
          <label className="v21-field">
            <span className="v21-field-l">Produit</span>
            <select className="v21-input" value={form.product_id} onChange={e=>{
              const id=e.target.value;
              const p=products.find(x=>x.id===id);
              setForm(f=>({...f, product_id:id, unit:p?.default_unit||f.unit}));
            }}>
              <option value="">— choisir —</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>

          <label className="v21-field">
            <span className="v21-field-l">Lieu</span>
            <select className="v21-input" value={form.location_id} onChange={e=>setForm(f=>({...f,location_id:e.target.value}))}>
              <option value="">— choisir —</option>
              {locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>

          <div className="v21-field-row">
            <label className="v21-field">
              <span className="v21-field-l">Quantité</span>
              <input className="v21-input" type="number" step="0.01" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))}/>
            </label>
            <label className="v21-field">
              <span className="v21-field-l">Unité</span>
              <input className="v21-input" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}/>
            </label>
          </div>

          <label className="v21-field">
            <span className="v21-field-l">DLC (optionnel)</span>
            <input className="v21-input" type="date" value={form.dlc} onChange={e=>setForm(f=>({...f,dlc:e.target.value}))}/>
          </label>

          <div className="v21-form-actions">
            <button type="submit" className="v21-btn">Ajouter</button>
          </div>
        </form>
        <p className="v21-next">Astuce : ajoutez d&apos;abord 2-3 produits &amp; lieux dans Supabase si les listes sont vides.</p>
      </section>
    </div>
  );
}
