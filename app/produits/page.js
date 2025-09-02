'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ProduitsPage(){
  const [lots, setLots] = useState([]);

  useEffect(()=>{ (async()=>{
    // On agrège par produit pour afficher une carte par produit
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, product:products_catalog(id,name,category), location:locations(id,name,icon)')
      .order('dlc', { ascending: true });
    if(!error) setLots(data||[]);
  })() },[]);

  // Regroupe par produit
  const products = useMemo(()=>{
    const map = new Map();
    for(const l of lots){
      const pid = l.product?.id;
      if(!pid) continue;
      if(!map.has(pid)){
        map.set(pid, { id: pid, name: l.product.name, category: l.product.category, total: 0, unit: l.unit, samples: [] });
      }
      const rec = map.get(pid);
      rec.total += Number(l.qty||0);
      rec.unit = rec.unit || l.unit;
      rec.samples.push(l);
    }
    return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name));
  },[lots]);

  return (
    <div>
      <h1>Produits</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        {products.map(p=>(
          <Link key={p.id} href={`/produits/${p.id}`} className="card" style={{textDecoration:'none',color:'inherit'}}>
            <strong>{p.name}</strong>
            <div style={{opacity:.7,marginTop:4}}>{p.total} {p.unit}</div>
            <div style={{marginTop:6,fontSize:12,opacity:.7}}>{p.category||'—'}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
