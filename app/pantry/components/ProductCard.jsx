// app/pantry/components/ProductCard.js - Version mise à jour pour la nouvelle structure

'use client';

import { useState, useMemo } from 'react';
import { daysUntil } from '@/lib/dates';
import { PantryStyles } from './pantryUtils';

export function ProductCard({ product, onUpdate, onDelete, onDetail }) {
  const [expanded, setExpanded] = useState(false);
  const [editingLot, setEditingLot] = useState(null);

  // Calculs des statistiques du produit
  const stats = useMemo(() => {
    const lots = product.lots || [];
    
    const totalQty = lots.reduce((sum, lot) => {
      // Conversion basique pour additionner les quantités
      const qty = Number(lot.qty || 0);
      if (lot.unit === 'kg' && product.unit === 'g') return sum + (qty * 1000);
      if (lot.unit === 'g' && product.unit === 'kg') return sum + (qty / 1000);
      if (lot.unit === 'l' && product.unit === 'ml') return sum + (qty * 1000);
      if (lot.unit === 'ml' && product.unit === 'l') return sum + (qty / 1000);
      return sum + qty;
    }, 0);

    const daysToExpire = lots.map(lot => daysUntil(lot.best_before)).filter(d => d !== null);
    const minDays = daysToExpire.length > 0 ? Math.min(...daysToExpire) : null;
    
    const urgencyLevel = minDays === null ? 'none'
                      : minDays < 0 ? 'expired'
                      : minDays <= 2 ? 'critical' 
                      : minDays <= 7 ? 'warning'
                      : 'ok';

    const expiringCount = daysToExpire.filter(d => d >= 0 && d <= 7).length;
    const expiredCount = daysToExpire.filter(d => d < 0).length;

    return {
      totalQty,
      totalLots: lots.length,
      minDays,
      urgencyLevel,
      expiringCount,
      expiredCount,
      hasMultipleLocations: new Set(lots.map(l => l.location?.name)).size > 1
    };
  }, [product.lots, product.unit]);

  // Style de la carte selon l'urgence
  const cardStyle = useMemo(() => {
    const base = {
      ...PantryStyles.glassBase,
      padding: '1.25rem',
      borderRadius: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden'
    };

    const urgencyColors = {
      expired: { border: '2px solid #e74c3c', background: 'rgba(231, 76, 60, 0.1)' },
      critical: { border: '2px solid #f39c12', background: 'rgba(243, 156, 18, 0.1)' },
      warning: { border: '2px solid #f1c40f', background: 'rgba(241, 196, 15, 0.1)' },
      ok: { border: '2px solid var(--forest-300)', background: base.background },
      none: { border: '2px solid var(--earth-300)', background: base.background }
    };

    return { ...base, ...urgencyColors[stats.urgencyLevel] };
  }, [stats.urgencyLevel]);

  // Emoji d'urgence
  const urgencyEmoji = {
    expired: '🚨',
    critical: '⚠️',
    warning: '📅',
    ok: '✅',
    none: '📦'
  };

  // Formatage de la quantité totale
  const formatTotalQty = (qty, unit) => {
    if (qty === 0) return '0';
    if (qty >= 1000 && unit === 'g') return `${(qty / 1000).toFixed(1)}kg`;
    if (qty >= 1000 && unit === 'ml') return `${(qty / 1000).toFixed(1)}L`;
    return `${qty.toFixed(qty % 1 === 0 ? 0 : 1)}${unit}`;
  };

  // Gestion de l'édition rapide d'un lot
  const handleQuickEdit = (lot, field, value) => {
    const updates = { [field]: value };
    onUpdate(lot.id, updates);
  };

  // Composant d'édition inline
  const EditableField = ({ lot, field, value, type = 'text', options = [] }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');

    const handleSave = () => {
      if (editValue !== value) {
        handleQuickEdit(lot, field, editValue);
      }
      setIsEditing(false);
    };

    if (isEditing) {
      return type === 'select' ? (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
          style={{
            background: 'white',
            border: '1px solid var(--forest-400)',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '0.85rem',
            width: '100%'
          }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
          style={{
            background: 'white',
            border: '1px solid var(--forest-400)',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '0.85rem',
            width: '100%'
          }}
        />
      );
    }

    return (
      <span
        onClick={() => setIsEditing(true)}
        style={{ 
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '4px',
          border: '1px solid transparent'
        }}
        title="Cliquer pour modifier"
      >
        {type === 'date' && value ? new Date(value).toLocaleDateString('fr-FR') : value || '-'}
      </span>
    );
  };

  return (
    <div
      style={cardStyle}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Badge de catégorie avec couleur */}
      {product.category_color && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60px',
            height: '60px',
            background: `linear-gradient(135deg, ${product.category_color}33, ${product.category_color}11)`,
            borderRadius: '0 1rem 0 100%'
          }}
        />
      )}

      {/* En-tête */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        marginBottom: expanded ? '1rem' : '0'
      }}>
        <div style={{
          fontSize: '2rem',
          background: product.category_color ? `${product.category_color}22` : 'var(--earth-100)',
          borderRadius: '50%',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '60px',
          height: '60px'
        }}>
          {product.category_icon || '📦'}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: 'var(--forest-700)',
            lineHeight: '1.3',
            wordBreak: 'break-word'
          }}>
            {product.name}
          </h3>
          
          <p style={{
            margin: '0.25rem 0 0',
            fontSize: '0.85rem',
            color: 'var(--medium-gray)'
          }}>
            {product.category} • {stats.totalLots} lot{stats.totalLots > 1 ? 's' : ''}
          </p>
          
          {/* Badges d'état */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {stats.expiredCount > 0 && (
              <span style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                background: '#e74c3c',
                color: 'white'
              }}>
                {stats.expiredCount} expiré{stats.expiredCount > 1 ? 's' : ''}
              </span>
            )}
            
            {stats.expiringCount > 0 && (
              <span style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                background: '#f39c12',
                color: 'white'
              }}>
                {stats.expiringCount} à consommer
              </span>
            )}
            
            {stats.hasMultipleLocations && (
              <span style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                background: 'var(--earth-400)',
                color: 'white'
              }}>
                📍 Multi-lieux
              </span>
            )}
          </div>
        </div>

        <div style={{
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.25rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>
            {urgencyEmoji[stats.urgencyLevel]}
          </span>
          
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: 'var(--forest-600)'
          }}>
            {formatTotalQty(stats.totalQty, product.unit)}
          </div>
          
          {stats.minDays !== null && (
            <div style={{
              fontSize: '0.8rem',
              color: stats.urgencyLevel === 'expired' ? '#e74c3c'
                   : stats.urgencyLevel === 'critical' ? '#f39c12'
                   : stats.urgencyLevel === 'warning' ? '#f1c40f'
                   : 'var(--medium-gray)'
            }}>
              {stats.minDays < 0 
                ? `Expiré il y a ${Math.abs(stats.minDays)} jour${Math.abs(stats.minDays) > 1 ? 's' : ''}`
                : stats.minDays === 0
                ? 'Expire aujourd\'hui'
                : stats.minDays === 1
                ? 'Expire demain'
                : `Dans ${stats.minDays} jours`
              }
            </div>
          )}
        </div>
      </div>

      {/* Détails des lots (si développé) */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()}>
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid var(--earth-200)'
          }}>
            {product.lots.map(lot => (
              <div
                key={lot.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  gap: '0.75rem',
                  alignItems: 'center',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--earth-200)',
                  fontSize: '0.9rem'
                }}
              >
                {/* Informations du lot */}
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    <EditableField 
                      lot={lot} 
                      field="qty" 
                      value={lot.qty} 
                      type="number" 
                    />
                    {' '}{lot.unit}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--medium-gray)',
                    marginTop: '0.25rem'
                  }}>
                    📍 {lot.location?.name}
                    {lot.storage_place && ` • ${lot.storage_place}`}
                  </div>
                  {lot.note && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--medium-gray)',
                      fontStyle: 'italic',
                      marginTop: '0.25rem'
                    }}>
                      💬 <EditableField 
                        lot={lot} 
                        field="note" 
                        value={lot.note} 
                      />
                    </div>
                  )}
                </div>

                {/* DLC */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--medium-gray)' }}>
                    DLC
                  </div>
                  <EditableField 
                    lot={lot} 
                    field="dlc" 
                    value={lot.best_before} 
                    type="date" 
                  />
                </div>

                {/* Urgence */}
                <div style={{ textAlign: 'center', fontSize: '1.2rem' }}>
                  {(() => {
                    const days = daysUntil(lot.best_before);
                    return days === null ? '❓'
                         : days < 0 ? '🚨'
                         : days <= 7 ? '📅'
                         : '✅';
                  })()}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => onDetail && onDetail(product)}
                    className="btn secondary small"
                    style={{ 
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem'
                    }}
                    title="Voir détails"
                  >
                    👁️
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer ce lot de ${lot.qty}${lot.unit} ?`)) {
                        onDelete(lot.id);
                      }
                    }}
                    className="btn danger small"
                    style={{ 
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem'
                    }}
                    title="Supprimer le lot"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions globales */}
          <div style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: '1px solid var(--earth-200)'
          }}>
            <button
              onClick={() => onDetail && onDetail(product)}
              className="btn secondary small"
            >
              📊 Historique
            </button>
            
            <button
              onClick={() => {
                // TODO: Implémenter l'ajout d'un nouveau lot du même produit
                console.log('Ajouter nouveau lot pour', product.name);
              }}
              className="btn primary small"
            >
              ➕ Nouveau lot
            </button>
          </div>
        </div>
      )}

      {/* Indicateur d'expansion */}
      <div style={{
        position: 'absolute',
        bottom: '0.5rem',
        right: '0.5rem',
        fontSize: '0.8rem',
        color: 'var(--medium-gray)',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease'
      }}>
        ⌄
      </div>
    </div>
  );
} 2 ? '⚠️'
                         : days <=
