// app/pantry/components/LotsView.js
import { useMemo } from 'react';
import { LifespanBadge } from './UI/LifespanBadge';
import { DateHelpers, PantryStyles } from './pantryUtils';

export function LotsView({ lots, onDeleteLot, onUpdateLot }) {
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      const da = DateHelpers.daysUntil(a.best_before);
      const db = DateHelpers.daysUntil(b.best_before);
      
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [lots]);

  async function quickUpdateQty(lot, delta) {
    const newQty = Math.max(0, Number(lot.qty || 0) + delta);
    await onUpdateLot(lot.id, { qty: newQty });
  }

  return (
    <div style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))'}}>
      {sortedLots.map(lot => {
        const days = DateHelpers.daysUntil(lot.best_before);
        const isUrgent = days !== null && days <= 3;
        
        return (
          <div
            key={lot.id}
            style={{
              ...PantryStyles.glassBase,
              borderRadius:10,
              padding:12,
              borderLeft: isUrgent ? '4px solid #dc2626' : '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600, color:'#15803d'}}>
                  {lot.product?.name || 'Produit inconnu'}
                </div>
                <div style={{fontSize:'0.85rem', color:'#78716c'}}>
                  {lot.location?.name || 'Sans lieu'}
                </div>
              </div>
              <LifespanBadge date={lot.best_before} />
            </div>

            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
              <span style={{fontSize:'1.3rem', fontWeight:700}}>
                {Number(lot.qty || 0)}
              </span>
              <span style={{opacity:0.7}}>{lot.unit}</span>
            </div>

            {lot.note && (
              <div style={{fontSize:'0.8rem', opacity:0.6, marginBottom:8}}>
                💬 {lot.note}
              </div>
            )}

            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              <button
                onClick={() => quickUpdateQty(lot, 1)}
                style={{
                  padding:'4px 8px', fontSize:'0.8rem',
                  background:'#16a34a', color:'white',
                  border:'none', borderRadius:4, cursor:'pointer'
                }}
              >
                +1
              </button>
              
              <button
                onClick={() => quickUpdateQty(lot, -1)}
                disabled={Number(lot.qty || 0) <= 0}
                style={{
                  padding:'4px 8px', fontSize:'0.8rem',
                  background: Number(lot.qty || 0) <= 0 ? '#ccc' : '#ea580c', 
                  color:'white',
                  border:'none', borderRadius:4, 
                  cursor: Number(lot.qty || 0) <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                -1
              </button>

              <button
                onClick={() => {
                  if (confirm(`Supprimer le lot de "${lot.product?.name}" ?`)) {
                    onDeleteLot(lot.id);
                  }
                }}
                style={{
                  padding:'4px 8px', fontSize:'0.8rem',
                  background:'#dc2626', color:'white',
                  border:'none', borderRadius:4, cursor:'pointer'
                }}
              >
                🗑️
              </button>
            </div>

            <div style={{fontSize:'0.75rem', opacity:0.5, marginTop:8}}>
              Ajouté le {DateHelpers.fmtDate(lot.entered_at)}
            </div>
          </div>
        );
      })}
      
      {sortedLots.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          color: '#6b7280',
          gridColumn: '1 / -1'
        }}>
          📦 Aucun lot ne correspond aux filtres.
        </div>
      )}
    </div>
  );
}
