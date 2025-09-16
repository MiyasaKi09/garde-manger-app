// app/pantry/components/LotsView.js
'use client';

import { useMemo } from 'react';
import { daysUntil, formatDate } from './pantryUtils';
import LifespanBadge from './LifespanBadge';

// Composant principal LotsView
export function LotsView({ lots, onDeleteLot, onUpdateLot }) {
  // Debug pour identifier les problèmes
  console.log('LotsView reçoit:', lots?.length, 'lots');

  // Tri des lots par urgence
  const sortedLots = useMemo(() => {
    if (!lots || !Array.isArray(lots)) {
      console.warn("LotsView: lots n'est pas un tableau valide", lots);
      return [];
    }
    
    return lots
      .filter(lot => lot && lot.id) // Filtrer les lots valides
      .sort((a, b) => {
        const daysA = daysUntil(a.best_before || a.dlc);
        const daysB = daysUntil(b.best_before || b.dlc);
        
        // Lots expirés ou urgents en premier
        if (daysA !== null && daysB !== null) {
          return daysA - daysB;
        }
        
        // Lots sans date à la fin
        if (daysA === null) return 1;
        if (daysB === null) return -1;
        
        return 0;
      });
  }, [lots]);

  // Fonction pour mettre à jour rapidement la quantité
  const quickUpdateQty = (lot, delta) => {
    const newQty = Math.max(0, (Number(lot.qty) || 0) + delta);
    onUpdateLot && onUpdateLot(lot.id, { qty: newQty });
  };

  if (!lots || lots.length === 0) {
    return (
      <div className="empty-state" style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'var(--forest-600)',
        border: '2px dashed var(--soft-gray)',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255, 255, 255, 0.5)'
      }}>
        📦 Aucun lot dans cette sélection.
      </div>
    );
  }

  return (
    <div className="lots-view">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '0.75rem 0',
        borderBottom: '2px solid var(--soft-gray)'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: 'var(--forest-700)',
          fontSize: '1.5rem'
        }}>
          📋 Tous les lots ({sortedLots.length})
        </h2>
      </div>

      <div className="lots-grid">
        {sortedLots.map((lot) => {
          const currentQty = Number(lot.qty) || 0;
          const isUrgent = daysUntil(lot.best_before || lot.dlc) <= 3;
          
          return (
            <div 
              key={lot.id}
              className={`card lot-card ${isUrgent ? 'urgent' : ''}`}
              style={{
                transition: 'all var(--transition-base)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* En-tête avec nom du produit et badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '1rem',
                gap: '0.75rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: 'var(--forest-800)',
                    fontFamily: "'Crimson Text', Georgia, serif",
                    lineHeight: 1.3
                  }}>
                    {lot.product?.name || 'Produit inconnu'}
                  </h3>
                  
                  {lot.product?.category && (
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--forest-600)',
                      marginTop: '0.25rem',
                      opacity: 0.8
                    }}>
                      📂 {lot.product.category}
                    </div>
                  )}
                </div>
                
                <LifespanBadge date={lot.best_before || lot.dlc} />
              </div>

              {/* Informations sur le lieu */}
              {lot.location?.name && (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--earth-600)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>📍</span>
                  <span>{lot.location.name}</span>
                </div>
              )}

              {/* Date de péremption formatée */}
              {(lot.best_before || lot.dlc) && (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--medium-gray)',
                  marginBottom: '1rem'
                }}>
                  📅 Expire le {formatDate(lot.best_before || lot.dlc)}
                </div>
              )}

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

              {/* Actions sur le lot */}
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
                    opacity: currentQty <= 0 ? 0.5 : 1,
                    cursor: currentQty <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  -1
                </button>
                
                <button
                  className="btn secondary small"
                  onClick={() => {
                    const newQty = prompt('Nouvelle quantité:', currentQty);
                    if (newQty !== null && !isNaN(Number(newQty))) {
                      onUpdateLot && onUpdateLot(lot.id, { qty: Math.max(0, Number(newQty)) });
                    }
                  }}
                  title="Modifier la quantité"
                >
                  ✏️
                </button>
                
                <button
                  className="btn danger small"
                  onClick={() => {
                    if (confirm(`Supprimer définitivement le lot "${lot.product?.name || 'ce produit'}" ?`)) {
                      onDeleteLot && onDeleteLot(lot.id);
                    }
                  }}
                  title="Supprimer ce lot"
                >
                  🗑️
                </button>
              </div>

              {/* Indicateur visuel pour les lots urgents */}
              {isUrgent && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  width: '0',
                  height: '0',
                  borderLeft: '20px solid transparent',
                  borderTop: '20px solid var(--autumn-orange)',
                  opacity: 0.8
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
