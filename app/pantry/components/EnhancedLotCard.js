// app/pantry/components/EnhancedLotCard.js - Adapté au style Myko
import { useState } from 'react';

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
    <div className={`card ${isUrgent ? 'urgent' : ''}`}>
      {/* Header du lot */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '1rem'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            color: 'var(--forest-700)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {lot.qty} {lot.unit}
            {isUrgent && <span>⚠️</span>}
          </div>
          
          <div style={{
            fontSize: '1rem',
            color: 'var(--forest-600)',
            marginBottom: '0.25rem'
          }}>
            📍 {lot.location?.name || 'Sans lieu'}
          </div>
          
          <div style={{
            fontSize: '0.95rem',
            color: isUrgent ? 'var(--danger)' : 'var(--forest-500)'
          }}>
            📅 DLC: {lot.dlc ? DateHelpers.fmtDate(lot.dlc) : 'Non définie'}
            {days !== null && (
              <span className={`badge ${isUrgent ? 'danger' : 'info'}`} style={{ marginLeft: '0.5rem' }}>
                {days >= 0 ? `J+${days}` : `Périmé depuis ${Math.abs(days)}j`}
              </span>
            )}
          </div>
          
          {lot.note && (
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--medium-gray)',
              fontStyle: 'italic',
              marginTop: '0.5rem'
            }}>
              💬 {lot.note}
            </div>
          )}
        </div>
      </div>
      
      {/* Contrôles de quantité */}
      {!isEditing ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: lot.unit === 'u' ? 'auto 1fr auto' : '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          {lot.unit === 'u' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--forest-50)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--forest-200)'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--forest-600)', fontWeight: '600' }}>×</span>
              <input
                className="input"
                type="number"
                min="1"
                value={customIncrement}
                onChange={(e) => setCustomIncrement(Number(e.target.value) || 1)}
                style={{
                  width: '50px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              />
            </div>
          )}
          
          <button
            className="btn danger small"
            onClick={() => handleQuickUpdate(-1)}
            disabled={Number(lot.qty) <= 0}
            style={{ opacity: Number(lot.qty) <= 0 ? 0.5 : 1 }}
          >
            -{lot.unit === 'u' ? customIncrement : (lot.unit === 'g' ? '10g' : '1')}
          </button>
          
          <button
            className="btn primary small"
            onClick={() => handleQuickUpdate(1)}
          >
            +{lot.unit === 'u' ? customIncrement : (lot.unit === 'g' ? '10g' : '1')}
          </button>
        </div>
      ) : (
        // Mode édition
        <div style={{
          background: 'var(--forest-50)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '2px solid var(--forest-300)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: 'var(--forest-700)', 
                marginBottom: '0.25rem', 
                display: 'block' 
              }}>
                Quantité
              </label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
              />
            </div>
            
            <div>
              <label style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: 'var(--forest-700)', 
                marginBottom: '0.25rem', 
                display: 'block' 
              }}>
                Date limite
              </label>
              <input
                className="input"
                type="date"
                value={editDlc}
                onChange={(e) => setEditDlc(e.target.value)}
              />
            </div>
            
            <div>
              <label style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: 'var(--forest-700)', 
                marginBottom: '0.25rem', 
                display: 'block' 
              }}>
                Lieu
              </label>
              <select
                className="input"
                value={editLocationId}
                onChange={(e) => setEditLocationId(e.target.value)}
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
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        {!isEditing ? (
          <>
            <button
              className="btn secondary small"
              onClick={() => {
                setEditQty(lot.qty);
                setEditDlc(lot.dlc || '');
                setEditLocationId(lot.location_id || '');
                setIsEditing(true);
              }}
            >
              ✏️ Modifier
            </button>
            
            <button
              className="btn danger small"
              onClick={onDelete}
            >
              🗑️ Supprimer
            </button>
          </>
        ) : (
          <>
            <button
              className="btn secondary small"
              onClick={() => setIsEditing(false)}
            >
              Annuler
            </button>
            
            <button
              className="btn primary small"
              onClick={handleSaveEdit}
            >
              ✅ Sauvegarder
            </button>
          </>
        )}
      </div>
    </div>
  );
}
