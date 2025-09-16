// app/pantry/components/LotsView.js
'use client';

import { useMemo } from 'react';
import {
  daysUntil,
  formatDate,
  getExpirationStatus,
} from './pantryUtils';
import { LifespanBadge } from './LifespanBadge';

// Helper: résout la date d'expiration d'un lot (tous alias pris en charge)
const getLotExpiry = (lot) =>
  lot?.effective_expiration ||
  lot?.expiration_date ||
  lot?.best_before ||
  lot?.dlc ||
  null;

// Helper: résout le nom produit à partir des différents types
const getLotProductName = (lot) =>
  lot?.display_name ||
  lot?.product?.name ||
  lot?.canonical_food?.canonical_name ||
  lot?.cultivar?.cultivar_name ||
  lot?.generic_product?.name ||
  lot?.derived_product?.derived_name ||
  'Produit inconnu';

// Helper: résout la catégorie (string lisible)
const getLotCategoryName = (lot) =>
  lot?.product?.category?.name ||
  lot?.canonical_food?.category?.name ||
  lot?.canonical_food?.category ||
  lot?.cultivar?.canonical_food?.category?.name ||
  lot?.generic_product?.category?.name ||
  lot?.category_name ||
  null;

// Helper: quantité actuelle
const getLotQty = (lot) =>
  Number(lot?.qty ?? lot?.qty_remaining ?? 0);

// Helper: unité
const getLotUnit = (lot) =>
  lot?.unit || 'unité(s)';

// Helper: lieu
const getLotPlace = (lot) =>
  lot?.storage_place || lot?.location?.name || null;

export function LotsView({ lots, onDeleteLot, onUpdateLot }) {
  // Tri FEFO par urgence (date d’exp + nulls à la fin)
  const sortedLots = useMemo(() => {
    if (!Array.isArray(lots)) return [];
    return lots
      .filter(l => l && l.id)
      .sort((a, b) => {
        const da = getLotExpiry(a);
        const db = getLotExpiry(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return new Date(da) - new Date(db);
      });
  }, [lots]);

  // Mise à jour rapide quantité (+/- 1)
  const quickUpdateQty = (lot, delta) => {
    const current = getLotQty(lot);
    const newQty = Math.max(0, current + delta);
    // Pour couvrir tous les modèles, on envoie les deux clés
    onUpdateLot?.(lot.id, { qty: newQty, qty_remaining: newQty });
  };

  if (!sortedLots.length) {
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
        <h2 style={{ margin: 0, color: 'var(--forest-700)', fontSize: '1.5rem' }}>
          📋 Tous les lots ({sortedLots.length})
        </h2>
      </div>

      <div className="lots-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1rem'
      }}>
        {sortedLots.map((lot) => {
          const qty = getLotQty(lot);
          const unit = getLotUnit(lot);
          const expiry = getLotExpiry(lot);
          const d = daysUntil(expiry);
          const isUrgent = d !== null && d <= 3;
          const status = getExpirationStatus(d);

          return (
            <div
              key={lot.id}
              className={`card lot-card ${isUrgent ? 'urgent' : ''}`}
              style={{
                transition: 'all var(--transition-base)',
                position: 'relative',
                overflow: 'hidden',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}
            >
              {/* En-tête: nom + badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '0.75rem',
                gap: '0.75rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--forest-800)',
                    lineHeight: 1.25
                  }}>
                    {getLotProductName(lot)}
                  </h3>

                  {getLotCategoryName(lot) && (
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--forest-600)',
                      marginTop: '0.25rem',
                      opacity: 0.85
                    }}>
                      📂 {getLotCategoryName(lot)}
                    </div>
                  )}
                </div>

                <LifespanBadge
                  date={expiry}
                  toneColor={status.color}
                  bgColor={status.bgColor}
                  label={status.label}
                />
              </div>

              {/* Lieu */}
              {getLotPlace(lot) && (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--earth-600)',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>📍</span>
                  <span>{getLotPlace(lot)}</span>
                </div>
              )}

              {/* Date lisible */}
              {expiry && (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--medium-gray)',
                  marginBottom: '0.75rem'
                }}>
                  📅 Expire le {formatDate(expiry)}
                </div>
              )}

              {/* Quantité */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.05)'
              }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--earth-600)' }}>
                  {qty}
                </span>
                <span style={{ opacity: 0.85, color: 'var(--forest-600)', fontWeight: 600 }}>
                  {unit}
                </span>
              </div>

              {/* Notes */}
              {(lot?.notes || lot?.note) && (
                <div style={{
                  fontSize: '0.85rem',
                  opacity: 0.85,
                  marginBottom: '0.75rem',
                  color: 'var(--medium-gray)',
                  fontStyle: 'italic',
                  padding: '0.5rem',
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: '6px',
                  borderLeft: '3px solid var(--forest-300)'
                }}>
                  💬 {lot?.notes || lot?.note}
                </div>
              )}

              {/* Actions */}
              <div className="lot-actions" style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn primary small"
                  onClick={() => quickUpdateQty(lot, +1)}
                  title="Augmenter la quantité"
                  style={btnPrimary}
                >
                  +1
                </button>

                <button
                  className="btn secondary small"
                  onClick={() => quickUpdateQty(lot, -1)}
                  disabled={qty <= 0}
                  title="Diminuer la quantité"
                  style={{
                    ...btnSecondary,
                    opacity: qty <= 0 ? 0.5 : 1,
                    cursor: qty <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  -1
                </button>

                <button
                  className="btn secondary small"
                  onClick={() => {
                    const newQty = prompt('Nouvelle quantité :', String(qty));
                    if (newQty !== null && !isNaN(Number(newQty))) {
                      const v = Math.max(0, Number(newQty));
                      onUpdateLot?.(lot.id, { qty: v, qty_remaining: v });
                    }
                  }}
                  title="Modifier la quantité"
                  style={btnSecondary}
                >
                  ✏️
                </button>

                <button
                  className="btn danger small"
                  onClick={() => {
                    if (confirm(`Supprimer définitivement le lot "${getLotProductName(lot)}" ?`)) {
                      onDeleteLot?.(lot.id);
                    }
                  }}
                  title="Supprimer ce lot"
                  style={btnDanger}
                >
                  🗑️
                </button>
              </div>

              {/* Coin urgent */}
              {isUrgent && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 0,
                  height: 0,
                  borderLeft: '20px solid transparent',
                  borderTop: `20px solid ${status.color}`,
                  opacity: 0.9
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Petits styles boutons inline (sobre)
const btnBase = {
  padding: '6px 10px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid transparent',
};

const btnPrimary = {
  ...btnBase,
  background: '#059669',
  color: 'white',
  borderColor: '#059669'
};

const btnSecondary = {
  ...btnBase,
  background: '#eef2ff',
  color: '#1d4ed8',
  borderColor: '#c7d2fe'
};

const btnDanger = {
  ...btnBase,
  background: '#fef2f2',
  color: '#dc2626',
  borderColor: '#fecaca'
};

export default LotsView;
