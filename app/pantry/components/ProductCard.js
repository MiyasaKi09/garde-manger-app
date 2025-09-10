// app/pantry/components/ProductCard.js - Version complète
import { useMemo } from 'react';

// Composants utilitaires simples intégrés
const LifespanBadge = ({ date }) => {
  if (!date) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / (1000 * 60 * 60 * 24));
  
  let style = {
    padding: '4px 8px',
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 600
  };
  
  if (days < 0) {
    style = { ...style, background: '#fee2e2', color: '#dc2626' };
  } else if (days <= 3) {
    style = { ...style, background: '#fef3c7', color: '#d97706' };
  } else if (days <= 7) {
    style = { ...style, background: '#dbeafe', color: '#2563eb' };
  } else {
    style = { ...style, background: '#dcfce7', color: '#16a34a' };
  }
  
  const text = days < 0 ? `Périmé ${Math.abs(days)}j` : 
               days === 0 ? 'Aujourd\'hui' :
               days === 1 ? 'Demain' :
               `${days}j`;
  
  return <span style={style}>{text}</span>;
};

const DateHelpers = {
  daysUntil(dateStr) {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      return Math.round((target - today) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }
};

const PantryStyles = {
  glassBase: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px) saturate(130%)',
    WebkitBackdropFilter: 'blur(12px) saturate(130%)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  }
};

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
      onClick={() => onOpen && onOpen({ productId, name })}
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#059669'
          }}>
            {total}
          </div>
          <div style={{
            fontSize: '1rem',
            color: '#6b7280',
            fontWeight: 600
          }}>
            {unit || 'unités'}
          </div>
        </div>
        
        {urgentCount > 0 && (
          <div style={{
            position: 'absolute',
            top: -8,
            right: -8,
            background: '#dc2626',
            color: 'white',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            animation: 'pulse 2s infinite'
          }}>
            {urgentCount}
          </div>
        )}
      </div>

      {/* Informations détaillées des lots */}
      <div style={{fontSize: '0.85rem', color: '#6b7280'}}>
        <div style={{marginBottom: 6}}>
          📦 {lots.length} lot{lots.length > 1 ? 's' : ''}
          {urgentCount > 0 && (
            <span style={{color: '#dc2626', marginLeft: 8, fontWeight: 600}}>
              • {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {locations.length > 0 && (
          <div style={{marginBottom: 6}}>
            📍 {locations.join(', ')}
            {locations.length === 3 && '...'}
          </div>
        )}
      </div>

      {/* Répartition par lieu (si plusieurs) */}
      {lotDetails.length > 1 && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.05)',
          padding: 12,
          borderRadius: 10,
          border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
          <div style={{fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 600}}>
            Répartition par lieu:
          </div>
          {lotDetails.slice(0, 3).map(detail => (
            <div key={detail.location} style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#374151',
              marginBottom: 4
            }}>
              <span>{detail.location}</span>
              <span style={{fontWeight: 600}}>
                {detail.qty} {unit} ({detail.count} lot{detail.count > 1 ? 's' : ''})
              </span>
            </div>
          ))}
          {lotDetails.length > 3 && (
            <div style={{fontSize: '0.7rem', color: '#9ca3af', textAlign: 'center'}}>
              +{lotDetails.length - 3} autre{lotDetails.length - 3 > 1 ? 's' : ''} lieu{lotDetails.length - 3 > 1 ? 'x' : ''}
            </div>
          )}
        </div>
      )}

      {/* Actions rapides */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 8
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen && onOpen({ productId, name });
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          👁️ Détails
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction && onQuickAction('add', { productId, name });
          }}
          style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          ➕ Ajouter
        </button>
      </div>

      {/* Styles CSS pour les animations */}
      <style jsx>{`
        @keyframes gradientWave {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
