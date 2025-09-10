// app/pantry/components/ProductCard.js - Version améliorée
import { useMemo } from 'react';
import { LifespanBadge } from './UI/LifespanBadge';
import { DateHelpers, PantryStyles } from './pantryUtils';

export function ProductCard({ productId, name, category, unit, lots=[], onOpen, onQuickAction }) {
  const { total, nextDate, locations, urgentCount, lotDetails } = useMemo(()=>{
    let total = 0;
    let nextDate = null;
    const locSet = new Set();
    let urgentCount = 0;
    const lotsByLocation = new Map();
    
    for (const lot of lots) {
      total += Number(lot.qty || 0);
      if (lot.location?.name) {
        locSet.add(lot.location.name);
        
        // Grouper par lieu pour affichage détaillé
        const locName = lot.location.name;
        if (!lotsByLocation.has(locName)) {
          lotsByLocation.set(locName, { qty: 0, count: 0 });
        }
        const locData = lotsByLocation.get(locName);
        locData.qty += Number(lot.qty || 0);
        locData.count += 1;
      }
      
      const d = lot.dlc || lot.best_before;
      if (d && (nextDate === null || new Date(d) < new Date(nextDate))) nextDate = d;
      
      const days = DateHelpers.daysUntil(d);
      if (days !== null && days <= 3) urgentCount++;
    }
    
    return { 
      total: Math.round(total * 100) / 100, 
      nextDate, 
      locations: [...locSet].slice(0, 3),
      urgentCount,
      lotDetails: Array.from(lotsByLocation.entries()).map(([loc, data]) => ({
        location: loc,
        qty: Math.round(data.qty * 100) / 100,
        count: data.count
      }))
    };
  }, [lots]);

  const soon = nextDate ? DateHelpers.daysUntil(nextDate) : null;
  const isUrgent = soon !== null && soon <= 3;

  return (
    <div
      style={{
        ...PantryStyles.glassBase,
        borderRadius: 16,
        padding: 18,
        display: 'grid',
        gap: 12,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        borderLeft: isUrgent ? '4px solid #dc2626' : '2px solid rgba(34, 197, 94, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px) saturate(130%)',
        WebkitBackdropFilter: 'blur(12px) saturate(130%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-8px) scale(1.02)';
        e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        e.target.style.borderLeft = isUrgent ? '4px solid #dc2626' : '4px solid rgba(34, 197, 94, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0px) scale(1)';
        e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
        e.target.style.borderLeft = isUrgent ? '4px solid #dc2626' : '2px solid rgba(34, 197, 94, 0.3)';
      }}
    >
      {/* Effet de vague pour les produits urgents */}
      {isUrgent && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #dc2626, #f97316, #dc2626)',
          backgroundSize: '200% 100%',
          animation: 'gradientWave 2s ease-in-out infinite'
        }} />
      )}
      
      {/* Header avec nom et badge */}
      <div style={{display:'flex', justifyContent:'space-between', gap:12}}>
        <div style={{flex:1}}>
          <div style={{
            fontWeight: 800, 
            color: '#059669', 
            fontSize: '1.2rem',
            marginBottom: 4,
            lineHeight: 1.3
          }}>
            {name}
          </div>
          <div style={{
            fontSize: '.9rem', 
            color: '#6b7280',
            fontWeight: 500
          }}>
            📂 {category ? category[0].toUpperCase() + category.slice(1) : 'Sans catégorie'}
          </div>
        </div>
        <LifespanBadge date={nextDate} />
      </div>

      {/* Quantité totale avec style amélioré */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))',
        padding: 16,
        borderRadius: 14,
        border: '2px solid rgba(34, 197, 94, 0.2)',
        position: 'relative'
      }}>
