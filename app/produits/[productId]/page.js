'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ProduitDetail(){
  const { productId } = useParams();
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('…');

  useEffect(()=>{ (async()=>{
    const { data: p } = await supabase.from('products_catalog').select('name').eq('id', productId).single();
    if (p) setName(p.name);
    const { data } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, entered_at, location:locations(name)')
      .eq('product_id', productId)
      .order('dlc', { ascending:true });
    setRows(data||[]);
  })() }, [productId]);

  return (
    <div>
      <h1>{name}</h1>
      {rows.length===0 ? <p>Aucun lot.</p> :
        rows.map(r=>(
          <div key={r.id} className="card">
            <div><strong>{r.qty} {r.unit}</strong> — {r.location?.name||'—'}</div>
            <div style={{opacity:.7}}>DLC {r.dlc||'—'} • Entré le {r.entered_at||'—'}</div>
          </div>
        ))
      }
    </div>
  );
}
