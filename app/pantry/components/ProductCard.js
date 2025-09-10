// app/pantry/components/ProductCard.js
import { useMemo } from 'react';
import { LifespanBadge } from './UI/LifespanBadge';
import { DateHelpers, PantryStyles } from './pantryUtils';

export function ProductCard({ productId, name, category, unit, lots=[], onOpen, onQuickAction }) {
  const { total, nextDate, locations, urgentCount } = useMemo(()=>{
    let total = 0;
    let nextDate = null;
    const locSet = new Set();
    let urgentCount = 0;
    
    for (const lot of lots) {
      total += Number(lot.qty || 0);
      if (lot.location?.name) locSet.add(lot.location.name);
      
      const d = lot.dlc || lot.best_before;
      if (d && (nextDate === null || new Date(d) < new Date(nextDate))) nextDate = d;
      
      const days = DateHelpers.daysUntil(d);
      if (days !== null && days <= 3) urgentCount++;
    }
    
    return { 
      total: Math.round(total * 100) / 100, 
      nextDate, 
      locations: [...locSet].slice(0, 3),
      urgentCount
    };
  }, [lots]);

  const soon = nextDate ? DateHelpers.daysUntil(nextDate) : null;
  const isUrgent = soon !== null && soon <= 3;

  return (
    <div
      style={{
        ...PantryStyles.glassBase,
        borderRadius:12,
        padding:14,
        display:'grid',
        gap:8,
        cursor:'pointer',
        transition: 'all 0.2s ease',
        borderLeft: isUrgent ? '4px solid #dc2626' : '1px solid rgba(0,0,0,0.06)'
      }}
      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.target.style.transform = 'none'}
    >
      <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700, color:'#15803d', fontSize:'1.1rem'}}>{name}</div>
          <div style={{fontSize:'.85rem', color:'#78716c'}}>
            {category ? category[0].toUpperCase() + category.slice(1) : '—'}
          </div>
        </div>
        <LifespanBadge date={nextDate} />
      </div>

      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'baseline', gap:6}}>
          <span style={{fontSize:'1.6rem', fontWeight:800, color:'#15803d'}}>
            {total}
          </span>
          <span style={{opacity:.7}}>{lots[0]?.unit || unit || 'u'}</span>
        </div>
        
        {urgentCount > 0 && (
          <span style={{
            fontSize:'0.8rem', padding:'2px 6px', borderRadius:12,
            background:'#fee2e2', color:'#991b1b', fontWeight:600
          }}>
            {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!!locations.length && (
        <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
          {locations.map(loc => (
            <span key={loc} style={{ 
              fontSize:'.75rem', padding:'2px 6px', borderRadius:999, 
              background:'rgba(0,0,0,0.04)' 
            }}>
              📍 {loc}
            </span>
          ))}
          {lots.length > locations.length && (
            <span style={{fontSize:'.75rem', opacity:0.6}}>
              +{lots.length - locations.length} autre{lots.length - locations.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
        <span style={{fontSize:'.8rem', color:'#78716c'}}>
          {lots.length} lot{lots.length > 1 ? 's' : ''}
        </span>
        
        <div style={{display:'flex', gap:4}}>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onQuickAction?.('add', { productId, name }); 
            }}
            style={{
              padding:'4px 8px', fontSize:'0.8rem', 
              background:'#16a34a', color:'white',
              border:'none', borderRadius:4, cursor:'pointer'
            }}
            title="Ajouter un lot"
          >
            +
          </button>
          
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onOpen?.({ productId, name }); 
            }}
            style={{
              padding:'4px 8px', fontSize:'0.8rem', 
              background:'#2563eb', color:'white',
              border:'none', borderRadius:4, cursor:'pointer'
            }}
          >
            Gérer →
          </button>
        </div>
      </div>
    </div>
  );
}
