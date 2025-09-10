// app/pantry/components/EnhancedLotCard.js
import { useState } from 'react';
import { DateHelpers } from './pantryUtils';

export function EnhancedLotCard({ lot, index, onUpdate, onDelete, locations = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQty, setEditQty] = useState(lot.qty);
  const [editDlc, setEditDlc] = useState(lot.dlc || '');
  const [editLocationId, setEditLocationId] = useState(lot.location_id || '');
  const [customIncrement, setCustomIncrement] = useState(1);
  
  const days = DateHelpers.daysUntil(lot.best_before);
  const isUrgent = days !== null && days <= 3;
  
  function handleQuickUpdate(delta) {
    const increment = lot.unit === 'u' ? customIncrement : (lot.unit === 'g' ? 10 : 1);
    const newQty = Math.max(0, Number(lot.qty || 0) + (delta * increment));
    onUpdate({ qty: newQty });
  }
  
  function handleSaveEdit() {
    const updates = {
      qty: Number(editQty),
      dlc: editDlc || null,
      location_id: editLocationId || null
    };
    onUpdate(updates);
    setIsEditing(false);
  }
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(15px)',
      border: `2px solid ${isUrgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.3)'}`,
      borderRadius: 20,
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-5px) scale(1.02)';
      e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0px) scale(1)';
      e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
    }}
    >
      {/* Barre d'urgence animée */}
      {isUrgent && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
          backgroundSize: '200% 100%'
        }} />
      )}
      
      {/* Header du lot */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: 20
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#065f46',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {lot.qty} {lot.unit}
            {isUrgent && <span>⚠️</span>}
          </div>
          
          <div style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: 4
          }}>
            📍 {lot.location?.name || 'Sans lieu'}
          </div>
          
          <div style={{
            fontSize: '0.95rem',
            color: isUrgent ? '#dc2626' : '#6b7280'
          }}>
            📅 DLC: {lot.dlc ? new Date(lot.dlc).toLocaleDateString('fr-FR') : 'Non définie'}
            {days !== null && (
              <span style={{ 
                marginLeft: 8,
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.8rem',
                fontWeight: 600,
                background: isUrgent ? '#fee2e2' : '#f3f4f6',
                color: isUrgent ? '#dc2626' : '#6b7280'
              }}>
                {days >= 0 ? `J+${days}` : `Périmé depuis ${Math.abs(days)}j`}
              </span>
            )}
          </div>
          
          {lot.note && (
            <div style={{
              fontSize: '0.85rem',
              color: '#9ca3af',
              fontStyle: 'italic',
              marginTop: 8
            }}>
              💬 {lot.note}
            </div>
          )}
        </div>
      </div>
      
      {/* Contrôles de quantité avancés */}
      {!isEditing ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: lot.unit === 'u' ? 'auto 1fr auto' : '1fr 1fr 1fr',
          gap: 12,
          marginBottom: 16
        }}>
          {lot.unit === 'u' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 600 }}>×</span>
              <input
                type="number"
                min="1"
                value={customIncrement}
                onChange={(e) => setCustomIncrement(Number(e.target.value) || 1)}
                style={{
                  width: 50,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              />
            </div>
          )}
          
          <button
            onClick={() => handleQuickUpdate(-1)}
            disabled={Number(lot.qty) <= 0}
            style={{
              padding: '12px',
              background: Number(lot.qty) <= 0 ? 'rgba(156, 163, 175, 0.3)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
              color: Number(lot.qty) <= 0 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: 12,
              cursor: Number(lot.qty) <= 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 700,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: Number(lot.qty) <= 0 ? 'none' : '0 4px 15px rgba(239, 68, 68, 0.3)'
            }}
          >
            -{lot.unit === 'u' ? customIncrement : (lot.unit === 'g' ? '10g' : '1')}
          </button>
          
          <button
            onClick={() => handleQuickUpdate(1)}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
            }}
          >
            +{lot.unit === 'u' ? customIncrement : (lot.unit === 'g' ? '10g' : '1')}
          </button>
        </div>
      ) : (
        // Mode édition
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: 16,
          borderRadius: 16,
          border: '2px solid rgba(59, 130, 246, 0.3)',
          marginBottom: 16
        }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>
                Quantité
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>
                Date limite
              </label>
              <input
                type="date"
                value={editDlc}
                onChange={(e) => setEditDlc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>
                Lieu
              </label>
              <select
                value={editLocationId}
                onChange={(e) => setEditLocationId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem'
                }}
              >
                <option value="">Sans lieu</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end'
      }}>
        {!isEditing ? (
          <>
            <button
              onClick={() => {
                setEditQty(lot.qty);
                setEditDlc(lot.dlc || '');
                setEditLocationId(lot.location_id || '');
                setIsEditing(true);
              }}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              ✏️ Modifier
            </button>
            
            <button
              onClick={onDelete}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              🗑️ Supprimer
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: '10px 16px',
                background: 'rgba(156, 163, 175, 0.3)',
                color: '#6b7280',
                border: '2px solid rgba(156, 163, 175, 0.3)',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Annuler
            </button>
            
            <button
              onClick={handleSaveEdit}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }}
            >
              ✅ Sauvegarder
            </button>
          </>
        )}
      </div>
    </div>
  );
}
