'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import IconButton from '@/components/ui/IconButton';

function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});
}

export default function LocationDetail() {
  const { locationId } = useParams();
  const [locName, setLocName] = useState('…');
  const [lots, setLots] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id:'', qty:'', unit:'g', dlc:'' });

  async function refresh() {
    const { data: loc } = await supabase.from('locations').select('name').eq('id', locationId).single();
    if (loc) setLocName(loc.name);
    const { data } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, entered_at, product:products_catalog(id,name,default_unit)')
      .eq('location_id', locationId)
      .order('dlc', { ascending: true });
    setLots(data || []);
    const { data: prods } = await supabase.from('products_catalog').select('id,name,default_unit').order('name');
    setProducts(prods || []);
  }

  useEffect(() => { refresh(); }, [locationId]);

  async function addLot(e) {
    e.preventDefault();
    if (!form.product_id || !form.qty) return alert('Produit et quantité requis.');
    const { error } = await supabase.from('inventory_lots').insert({
      product_id: form.product_id,
      location_id: locationId,
      qty: Number(form.qty),
      unit: form.unit,
      dlc: form.dlc || null,
      source: 'achat'
    });
    if (error) return alert(error.message);
    setForm({ product_id:'', qty:'', unit:'g', dlc:'' });
    await refresh();
  }

  async function removeLot(id) {
    if (!confirm('Retirer ce lot ?')) return;
    const { error } = await supabase.from('inventory_lots').delete().eq('id', id);
    if (error) return alert(error.message);
    await refresh();
  }

  const groups = groupBy(lots, l => l.product?.name ?? '—');

  return (
    <div>
      <h1>{locName}</h1>

      {/* mini formulaire ajouter un lot ici */}
      <form onSubmit={addLot} className="card" style={{display:'grid',gap:8,maxWidth:520}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <label>Produit
            <select
              value={form.product_id}
              onChange={e=>{
                const id = e.target.value;
                const p = products.find(x=>x.id===id);
                setForm(f=>({...f, product_id:id, unit: p?.default_unit || f.unit }));
              }}>
              <option value="">— choisir —</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Quantité
            <input type="number" step="0.01" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))}/>
          </label>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <label>Unité
            <input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}/>
          </label>
          <label>DLC
            <input type="date" value={form.dlc} onChange={e=>setForm(f=>({...f,dlc:e.target.value}))}/>
          </label>
        </div>
        <div><button type="submit">Ajouter ici</button></div>
      </form>

      {/* lots groupés par produit */}
      {Object.entries(groups).map(([name, items]) => (
        <div key={name} className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
            <strong>{name}</strong>
            <span style={{opacity:.6,fontSize:12}}>{items.length} lot(s)</span>
          </div>
          <div style={{marginTop:6}}>
            {items.map(i => (
              <div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,padding:'4px 0'}}>
                <div>• {i.qty} {i.unit} — DLC {i.dlc || '—'}</div>
                <IconButton title="Retirer" onClick={()=>removeLot(i.id)}>✖️</IconButton>
              </div>
            ))}
          </div>
        </div>
      ))}
      {lots.length===0 && <p>Aucun produit ici.</p>}
    </div>
  );
}
