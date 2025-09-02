'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function groupBy(arr, keyFn){
  return arr.reduce((acc,it)=>{ const k=keyFn(it); (acc[k]=acc[k]||[]).push(it); return acc; },{});
}

export default function LocationDetail(){
  const { locationId } = useParams();
  const [locName,setLocName]=useState('…');
  const [lots,setLots]=useState([]);

  useEffect(()=>{ (async()=>{
    const { data:loc } = await supabase.from('locations').select('name').eq('id', locationId).single();
    if(loc) setLocName(loc.name);
    const { data } = await supabase
      .from('inventory_lots')
      .select('id,qty,unit,dlc,product:products_catalog(name)')
      .eq('location_id', locationId).order('dlc', { ascending:true });
    setLots(data||[]);
  })() },[locationId]);

  const groups = groupBy(lots, l => l.product?.name ?? '—');

  return (
    <div>
      <h1>{locName}</h1>
      {Object.entries(groups).map(([name,items])=>(
        <div key={name} className="card">
          <strong>{name}</strong>
          <div style={{marginTop:6}}>
            {items.map(i=> <div key={i.id}>• {i.qty} {i.unit} — DLC {i.dlc||'—'}</div>)}
          </div>
        </div>
      ))}
      {lots.length===0 && <p>Aucun produit ici.</p>}
    </div>
  );
}
