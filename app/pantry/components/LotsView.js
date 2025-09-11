// app/pantry/components/LotsView.js - Version corrigée
import { useMemo } from 'react';

// Helper pour les dates (à définir si pas déjà fait)
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
  },

  fmtDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  }
};

// Composant pour le badge de durée de vie
function LifespanBadge({ date }) {
  const days = DateHelpers.daysUntil(date);
  
  if (days === null) {
    return (
      <span className="lifespan-badge" style={{
        background: 'rgba(108, 117, 125, 0.1)',
        color: '#6c757d',
        border: '1px solid rgba(108, 117, 125, 0.3)'
      }}>
        Sans date
      </span>
    );
  }
  
  if (days < 0) {
    return (
      <span className="lifespan-badge urgent">
        Expiré (-{Math.abs(days)}j)
      </span>
    );
  }
  
  if (days === 0) {
    return <span className="lifespan-badge urgent">Aujourd'hui</span>;
  }
  
  if (days <= 3) {
    return <span className="lifespan-badge urgent">{days}j</span>;
  }
  
  if (days <= 7) {
    return <span className="lifespan-badge warning">{days}j</span>;
  }
  
  return <span className="lifespan-badge good">{days}j</span>;
}

export function LotsView({ lots, onDeleteLot, onUpdateLot }) {
  console.log('LotsView reçoit:', lots?.length, 'lots'); // Debug

  const sortedLots = useMemo(() => {
    if (!lots || !Array.isArray(lots)) {
      console.warn('LotsView: lots n\'est pas un tableau valide', lots);
      return [];
    }
    
    return [...lots].sort((a, b) => {
      const da = DateHelpers.daysUntil(a.best_before || a.dlc);
      const db = DateHelpers.daysUntil(b.best_before || b.dlc);
      
      // Les lots sans date vont à la fin
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      
      // Tri par urgence (dates les plus proches en premier)
      return da - db;
    });
  }, [lots]);

  async function quickUpdateQty(lot, delta) {
    try {
      const newQty = Math.max(0, Number(lot.qty || 0) + delta);
      await onUpdateLot(lot.id, { qty: newQty });
    } catch (error) {
      console.error('Erreur mise à jour quantité:', error);
      alert('Erreur lors de la mise à jour: ' + error.message);
    }
  }

  // Si pas de lots du tout
  if (!sortedLots || sortedLots.length === 0) {
    return (
      <div className="lots-grid">
        <div className="empty-state">
          📦 Aucun lot ne correspond aux filtres.
          <div style={{ 
            fontSize: '0.9rem', 
            marginTop: '0.5rem', 
            opacity: 0.7 
          }}>
            Essayez de modifier vos critères de recherche ou d'ajouter de nouveaux produits.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lots-grid">
      {sortedLots.map(lot => {
        const days = DateHelpers.daysUntil(lot.best_before || lot.dlc);
        const isUrgent = days !== null && days <= 3;
        const currentQty = Number(lot.qty || 0);
        
        return (
          <div 
            key={lot.id} 
            className={`card ${isUrgent ? 'urgent' : ''}`}
            style={{
              // Bordure rouge pour les lots urgents
              borderColor: isUrgent ? 'rgba(231, 76, 60, 0.3)' : undefined,
              borderWidth: isUrgent ? '2px' : '1px'
            }}
          >
            {/* En-tête avec nom du produit et badge de durée */}
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: 'var(--forest-700)',
                  fontSize: '1.1rem',
                  lineHeight: '1.3'
                }}>
                  {lot.product?.name || 'Produit inconnu'}
                </div>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--forest-500)',
                  marginTop: '0.25rem'
                }}>
                  📍 {lot.location?.name || 'Sans lieu'}
                </div>
              </div>
              <LifespanBadge date={lot.best_before || lot.dlc} />
            </div>

            {/* Quantité */}
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '1rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                color: 'var(--earth-600)'
              }}>
                {currentQty}
              </span>
              <span style={{ 
                opacity: 0.8, 
                color: 'var(--forest-500)',
                fontWeight: '500'
              }}>
                {lot.unit || 'unité(s)'}
              </span>
            </div>

            {/* Note si présente */}
            {lot.note && (
              <div style={{
                fontSize: '0.85rem', 
                opacity: 0.7, 
                marginBottom: '1rem',
                color: 'var(--medium-gray)',
                fontStyle: 'italic',
                padding: '0.5rem',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--forest-300)'
              }}>
                💬 {lot.note}
              </div>
            )}

            {/* Actions */}
            <div className="lot-actions">
              <button
                className="btn primary small"
                onClick={() => quickUpdateQty(lot, 1)}
                title="Augmenter la quantité"
              >
                +1
              </button>
              
              <button
                className="btn secondary small"
                onClick={() => quickUpdateQty(lot, -1)}
                disabled={currentQty <= 0}
                title="Diminuer la quantité"
                style={{ 
                  opacity: currentQty <= 0 ? 0.3 : 1
                }}
              >
                -1
              </button>

              <button
                className="btn danger small"
                onClick={() => {
                  if (confirm(`Supprimer définitivement le lot de "${lot.product?.name}" (${currentQty} ${lot.unit}) ?`)) {
                    onDeleteLot(lot.id);
                  }
                }}
                title="Supprimer le lot"
              >
                🗑️
              </button>
            </div>

            {/* Date d'ajout */}
            <div style={{
              fontSize: '0.75rem', 
              opacity: 0.5, 
              marginTop: '1rem',
              color: 'var(--medium-gray)',
              textAlign: 'center',
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              paddingTop: '0.5rem'
            }}>
              Ajouté le {DateHelpers.fmtDate(lot.entered_at)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
