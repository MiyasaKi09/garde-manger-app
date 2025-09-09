// components/pantry/ProductCard.jsx
'use client';
import { useMemo } from 'react';
import { glassBase } from '@/components/ui/glass';
import LifespanBadge from './LifespanBadge';
import { daysUntil } from '@/lib/dates';
import Link from 'next/link';

export default function ProductCard({ productId, name, category, unit, lots=[] }) {
  const { total, nextDate, locations } = useMemo(()=>{
    let total=0, nextDate=null;
    const locSet = new Set();
    for (const l of lots) {
      total += Number(l.qty||0);
      if (l.location?.name) locSet.add(l.location.name);
      const d = l.best_before || l.dlc;
      if (d && (nextDate===null || new Date(d) < new Date(nextDate))) nextDate = d;
    }
    return { total, nextDate, locations:[...locSet].slice(0,6) };
  },[lots]);

  const soon = nextDate ? daysUntil(nextDate) : null;
  const cap = (s)=>s ? s[0].toUpperCase()+s.slice(1) : '—';

  return (
    <div className="product-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'14px', display:'grid', gap:8 }}>
      <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
        <div>
          <div style={{fontWeight:700, color:'var(--forest-700)'}}>{name}</div>
          <div style={{fontSize:'.85rem', color:'var(--earth-600)'}}>{cap(category)}</div>
        </div>
        <LifespanBadge date={nextDate} />
      </div>

      <div style={{display:'flex', alignItems:'baseline', gap:6}}>
        <span style={{fontSize:'1.6rem', fontWeight:800, color:'var(--forest-700)'}}>{total}</span>
        <span style={{opacity:.7}}>{unit || lots[0]?.unit || 'u'}</span>
        {soon!=null && <span style={{marginLeft:8, fontSize:'.9rem', color:'var(--earth-700)'}}>• plus proche : J+{Math.max(soon,0)}</span>}
      </div>

      {!!locations.length && (
        <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
          {locations.map(loc => (
            <span key={loc} style={{ fontSize:'.8rem', padding:'4px 8px', borderRadius:999, background:'rgba(0,0,0,0.04)' }}>📍 {loc}</span>
          ))}
        </div>
      )}

      <div style={{display:'flex', justifyContent:'flex-end'}}>
        <Link className="btn small secondary" href={`/produits/${productId}`}>Détails →</Link>
      </div>
    </div>
  );
}
