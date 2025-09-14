// app/pantry/components/EnhancedLotCard.js
import { useState } from 'react';
import { daysUntil, formatDate } from '@/lib/dates'; // ✅ Import unifié
import { LifespanBadge } from './LifespanBadge'; // ✅ Import du composant unifié

export function EnhancedLotCard({ lot, onDelete, onUpdate, locations = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    qty: lot.qty || 0,
    dlc: lot.dlc || lot.best_before || '',
    note: lot.note || '',
    location_id: lot.location_id || ''
  });

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      qty: lot.qty || 0,
      dlc: lot.dlc || lot.best_before || '',
      note: lot.note || '',
      location_id: lot.location_id || ''
    });
    setIsEditing(false);
  };

  const isUrgent = daysUntil(lot.best_before || lot.dlc) <= 3;

  if (isEditing) {
    return (
      <div className={`card ${isUrgent ? 'urgent' : ''}`}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--forest-800)' }}>
          ✏️ Modifier le lot
        </h4>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Quantité */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Quantité
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={editData.qty}
              onChange={(e) => setEditData(prev => ({ ...prev, qty: e.target.value }))}
              className="input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Date de péremption */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Date de péremption
            </label>
            <input
              type="date"
              value={editData.dlc}
              onChange={(e) => setEditData(prev => ({ ...prev, dlc: e.target.value }))}
              className="input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Lieu */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Lieu
            </label>
            <select
              value={editData.location_id}
              onChange={(e) => setEditData(prev => ({ ...prev, location_id: e.target.value }))}
              className="input"
              style={{ width: '100%' }}
            >
              <option value="">Choisir un lieu...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Note
            </label>
            <textarea
              value={editData.note}
              onChange={(e) => setEditData(prev => ({ ...prev, note: e.target.value }))}
              className="input"
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
              placeholder="Note optionnelle..."
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSave} className="btn primary small" style={{ flex: 1 }}>
              ✅ Sauvegarder
            </button>
            <button onClick={handleCancel} className="btn secondary small" style={{ flex: 1 }}>
              ❌ Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${isUrgent ? 'urgent' : ''}`}>
      {/* En-tête */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '1rem'
      }}>
        <div>
          <h4 style={{ 
            margin: 0, 
            color: 'var(--forest-800)',
            fontFamily: "'Crimson Text', Georgia, serif"
          }}>
            {lot.product?.name || 'Produit'}
          </h4>
          
          {lot.product?.category && (
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--forest-600)',
              marginTop: '0.25rem'
            }}>
              📂 {lot.product.category}
            </div>
          )}
        </div>
        
        <LifespanBadge date={lot.best_before || lot.dlc} />
      </div>

      {/* Infos principales */}
      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
        {/* Quantité */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          background: 'var(--earth-50)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--earth-600)' }}>
            {Number(lot.qty) || 0}
          </span>
          <span style={{ opacity: 0.8, color: 'var(--forest-500)' }}>
            {lot.unit || 'unité(s)'}
          </span>
        </div>

        {/* Lieu */}
        {lot.location?.name && (
          <div style={{ fontSize: '0.9rem', color: 'var(--earth-600)' }}>
            📍 {lot.location.name}
          </div>
        )}

        {/* Date */}
        {(lot.best_before || lot.dlc) && (
          <div style={{ fontSize: '0.9rem', color: 'var(--medium-gray)' }}>
            📅 {formatDate(lot.best_before || lot.dlc)}
          </div>
        )}

        {/* Note */}
        {lot.note && (
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--medium-gray)',
            fontStyle: 'italic',
            padding: '0.5rem',
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 'var(--radius-sm)'
          }}>
            💬 {lot.note}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setIsEditing(true)}
          className="btn secondary small"
          style={{ flex: 1 }}
        >
          ✏️ Modifier
        </button>
        
        <button
          onClick={() => {
            if (confirm(`Supprimer définitivement ce lot de "${lot.product?.name || 'produit'}" ?`)) {
              onDelete && onDelete();
            }
          }}
          className="btn danger small"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
