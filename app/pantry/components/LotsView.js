// app/pantry/components/LotsView.js - Adapté au style Myko
import { useMemo } from 'react';

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
    <div className="grid cols-3">
      {sortedLots.map(lot => {
        const days = DateHelpers.daysUntil(lot.best_before);
        const isUrgent = days !== null && days <= 3;
        
        return (
          <div key={lot.id} className={`card ${isUrgent ? 'urgent' : ''}`}>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'start', 
              marginBottom: '0.5rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: 'var(--forest-700)' }}>
                  {lot.product?.name || 'Produit inconnu'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--forest-500)' }}>
                  📍 {lot.location?.name || 'Sans lieu'}
                </div>
              </div>
              <LifespanBadge date={lot.best_before} />
            </div>

            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '0.5rem'
            }}>
              <span style={{ 
                fontSize: '1.3rem', 
                fontWeight: '700',
                color: 'var(--earth-600)'
              }}>
                {Number(lot.qty || 0)}
              </span>
              <span style={{ opacity: 0.7, color: 'var(--forest-500)' }}>
                {lot.unit}
              </span>
            </div>

            {lot.note && (
              <div style={{
                fontSize: '0.8rem', 
                opacity: 0.6, 
                marginBottom: '0.5rem',
                color: 'var(--medium-gray)'
              }}>
                💬 {lot.note}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              <button
                className="btn primary small"
                onClick={() => quickUpdateQty(lot, 1)}
              >
                +1
              </button>
              
              <button
                className="btn danger small"
                onClick={() => quickUpdateQty(lot, -1)}
                disabled={Number(lot.qty || 0) <= 0}
                style={{ opacity: Number(lot.qty || 0) <= 0 ? 0.5 : 1 }}
              >
                -1
              </button>

              <button
                className="btn danger small"
                onClick={() => {
                  if (confirm(`Supprimer le lot de "${lot.product?.name}" ?`)) {
                    onDeleteLot(lot.id);
                  }
                }}
              >
                🗑️
              </button>
            </div>

            <div style={{
              fontSize: '0.75rem', 
              opacity: 0.5, 
              marginTop: '0.5rem',
              color: 'var(--medium-gray)'
            }}>
              Ajouté le {DateHelpers.fmtDate(lot.entered_at)}
            </div>
          </div>
        );
      })}
      
      {sortedLots.length === 0 && (
        <div className="card" style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--forest-600)',
          border: '2px dashed var(--soft-gray)'
        }}>
          📦 Aucun lot ne correspond aux filtres.
        </div>
      )}
    </div>
  );
}
