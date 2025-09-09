// components/pantry/LotCard.jsx
'use client';
import { glassBase } from '@/components/ui/glass';
import LifespanBadge from './LifespanBadge';
import { fmtDate } from '@/lib/dates';

export default function LotCard({ lot, onIncQty, onDelete }) {
  const hoverStyle = { transform:'translateY(-2px)', boxShadow:'0 12px 34px rgba(0,0,0,0.12)' };

  return (
    <div
      className="card lot-card"
      style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'12px', transition:'all .2s' }}
      onMouseEnter={e=>Object.assign(e.currentTarget.style, hoverStyle)}
      onMouseLeave={e=>Object.assign(e.currentTarget.style, { transform:'none', boxShadow:glassBase.boxShadow })}
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:8, marginBottom:8}}>
        <div style={{fontWeight:600, color:'var(--forest-700)'}}>
          {lot.product?.name || 'Produit'}
        </div>
        <LifespanBadge date={lot.best_before || lot.dlc} />
      </div>

      <div style={{display:'flex',gap:8,alignItems:'baseline', marginBottom:6}}>
        <span style={{fontSize:'1.25rem', fontWeight:700, color:'var(--forest-700)'}}>{Number(lot.qty)||0}</span>
        <span style={{opacity:.75}}>{lot.unit || 'u'}</span>
      </div>

      {(lot.best_before || lot.dlc) && (
        <div style={{fontSize:'.9rem', color:'var(--earth-600)', marginBottom:8}}>
          📅 {fmtDate(lot.best_before || lot.dlc)}
        </div>
      )}

      {lot.note && (
        <div style={{fontSize:'.85rem', color:'var(--earth-700)', background:'rgba(0,0,0,0.04)', padding:'6px 8px', borderRadius:10, marginBottom:8}}>
          💬 {lot.note}
        </div>
      )}

      <div style={{display:'flex', gap:8}}>
        <button className="btn small" onClick={()=>onIncQty?.(lot, +1)} style={{flex:1}}>➕</button>
        <button className="btn small secondary" onClick={()=>onIncQty?.(lot, -1)} disabled={(Number(lot.qty)||0)<=0} style={{flex:1}}>➖</button>
        <button className="btn small danger" onClick={()=>onDelete?.(lot)} title="Supprimer">🗑️</button>
      </div>
    </div>
  );
}
