'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Restes(){
  const [rows,setRows]=useState([]);
  useEffect(()=>{ (async()=>{
    const soon = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    const { data } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, opened_at, product:products_catalog(name), location:locations(name)')
      .or(`opened_at.is.not.null,dlc.lte.${soon}`)
      .order('dlc',{ascending:true});
    setRows(data||[]);
  })() },[]);
  return (
    <div>
      <h1>Restes & bientôt</h1>
      {rows.length===0 ? <p>Rien de particulier 🎉</p> :
        rows.map(r=>(
          <div key={r.id} className="card" style={{borderWidth: r.opened_at ? 2 : 1}}>
            <strong>{r.product?.name}</strong> — {r.qty} {r.unit} • <em>{r.location?.name}</em>
            <div style={{opacity:.7}}>Ouvert: {r.opened_at||'non'} — DLC {r.dlc||'—'}</div>
          </div>
        ))
      }
    </div>
  );
}
