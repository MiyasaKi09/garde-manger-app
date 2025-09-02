'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function Pantry(){
  const [locations,setLocations]=useState([]);
  useEffect(()=>{ (async()=>{
    const { data } = await supabase.from('locations').select('*').order('sort_order');
    setLocations(data||[]);
  })() },[]);
  return (
    <div>
      <h1>Garde-manger</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        {locations.map(loc=>(
          <Link key={loc.id} href={`/pantry/${loc.id}`} className="card" style={{textDecoration:'none'}}>
            <div style={{fontSize:26}}>{loc.icon || '📦'}</div>
            <strong>{loc.name}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
