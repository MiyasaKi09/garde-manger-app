'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

function badge(dlc){
  if(!dlc) return <span className="badge">—</span>;
  const days = Math.ceil((new Date(dlc) - new Date())/86400000);
  if(days<=0) return <span className="badge urgent">Périmé</span>;
  if(days<=3) return <span className="badge urgent">Urgent • {days} j</span>;
  if(days<=7) return <span className="badge">Bientôt • {days} j</span>;
  return <span className="badge">OK • {days} j</span>;
}

export default function Dashboard(){
  const [lots,setLots]=useState([]);

  useEffect(()=>{ (async ()=>{
    const limitDate = new Date(Date.now()+3*86400000).toISOString().slice(0,10);
    const { data } = await supabase
      .from('inventory_lots')
      .select('id,qty,unit,dlc,product:products_catalog(name),location:locations(name)')
      .lte('dlc', limitDate).order('dlc', { ascending:true });
    setLots(data||[]);
  })() },[]);

  return (
    <div>
      <h1>Tableau de bord</h1>
      <section>
        <h2>⚠️ Urgents (≤ 3 jours)</h2>
        {lots.length===0 ? <p>Rien d’urgent 🎉</p> :
          lots.map(l=>(
            <div className="card" key={l.id} style={{borderWidth:2}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                <div><strong>{l.product?.name}</strong> — {l.qty} {l.unit} • <em>{l.location?.name||'?'}</em></div>
                <div>{badge(l.dlc)}</div>
              </div>
            </div>
          ))
        }
        <p><Link href="/pantry">→ Voir le garde-manger</Link></p>
      </section>
    </div>
  );
}
