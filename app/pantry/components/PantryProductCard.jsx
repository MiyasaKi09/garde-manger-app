'use client';

import { useState } from 'react';
import { getQuickConversions } from '../../../lib/quickConversions';
import { capitalizeProduct } from './pantryUtils';

export default function PantryProductCard({ item, onConsume, onEdit, onDelete, onUpdateQuantity, onOpen }) {
  const [showActions, setShowActions] = useState(false);
  const [opening, setOpening] = useState(false);
  
  // Calculer les conversions rapides possibles selon le type de produit
  const productMeta = { 
    productName: item.product_name,
    // Utiliser directement les données transformées du parent
    grams_per_unit: item.grams_per_unit,
    density_g_per_ml: item.density_g_per_ml,
    primary_unit: item.primary_unit
  };

  const quickConversions = getQuickConversions(item.qty_remaining, item.unit, productMeta);
  
  // Debug conversions
  if (showActions) {
    console.log(`--- CARD DEBUG pour "${item.product_name}" ---`);
    console.log('Données item brutes:', {
      unit_weight_grams: item.unit_weight_grams,
      grams_per_unit: item.grams_per_unit,
      density_g_per_ml: item.density_g_per_ml,
      qty_remaining: item.qty_remaining,
      unit: item.unit
    });
    console.log('ProductMeta calculé:', productMeta);
    console.log('Conversions trouvées:', quickConversions);
    console.log('--- FIN DEBUG ---');
  }

  const getStatusClass = (status) => {
    switch(status) {
      case 'expired': return 'status-expired';
      case 'expiring_soon': return 'status-expiring';
      default: return 'status-good';
    }
  };

  const getStatusText = (status, days) => {
    if (!status || status === 'no_date') return '📅 Pas de date';
    if (status === 'expired') return `Expiré depuis ${Math.abs(days)}j`;
    if (status === 'expiring_soon') return `Expire dans ${days}j`;
    return `${days}j restants`;
  };

  const handleOpen = async (e) => {
    if (!onOpen || opening) return;
    e.stopPropagation();
    setOpening(true);
    try {
      await onOpen(item.id);
    } finally {
      setOpening(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleCardClick = () => {
    setShowActions(!showActions);
  };

  const handleAction = (action, e) => {
    e.stopPropagation();
    action();
    setShowActions(false);
  };

  return (
    <div className="product-card" onClick={handleCardClick} style={{cursor: 'pointer'}}>
      <div className="card-header">
        <h3>{capitalizeProduct(item.product_name) || 'Sans nom'}</h3>
        {item.category_name && (
          <span className="category-badge">{item.category_name}</span>
        )}
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="info-icon">📦</span>
          <div className="quantity-section">
            <span className="info-value">{item.qty_remaining || 0} {item.unit || 'unité'}</span>
            {showActions && quickConversions.length > 0 && (
              <div className="quick-conversions">
                {quickConversions.map((conversion, index) => (
                  <button
                    key={index}
                    className="conversion-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUpdateQuantity && typeof onUpdateQuantity === 'function') {
                        onUpdateQuantity(item.id, conversion.qty, conversion.unit);
                      }
                    }}
                    title={`Convertir en ${conversion.label}`}
                  >
                    ↔ {conversion.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="info-row">
          <span className="info-icon">📍</span>
          <span className="info-value">{item.storage_place || 'Non spécifié'}</span>
        </div>
        <div className="info-row">
          <span className={`status-badge ${getStatusClass(item.expiration_status)}`}>
            {getStatusText(item.expiration_status, item.days_until_expiration)}
          </span>
        </div>
        {item.expiration_date && (
          <div className="info-row">
            <span className="info-icon">🗓️</span>
            <span className="info-value">{formatDate(item.expiration_date)}</span>
            {item.is_opened && item.adjusted_expiration_date && (
              <span className="dlc-adjusted" title="DLC ajustée après ouverture">
                → {formatDate(item.adjusted_expiration_date)}
              </span>
            )}
          </div>
        )}
        {item.is_opened && (
          <div className="info-row">
            <span className="opened-badge">
              ✅ Ouvert le {formatDate(item.opened_at)}
            </span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="card-actions">
          {!item.is_opened && onOpen && (
            <button 
              className="action-btn open"
              onClick={handleOpen}
              disabled={opening}
              title="Marquer comme ouvert (ajuste la date de péremption)"
            >
              {opening ? '⏳' : '📦'} {opening ? 'Ouverture...' : 'Ouvrir'}
            </button>
          )}
          <button 
            className="action-btn consume"
            onClick={(e) => handleAction(onConsume, e)}
          >
            ✓ Consommer
          </button>
          <button 
            className="action-btn edit"
            onClick={(e) => handleAction(onEdit, e)}
          >
            ✏️ Modifier
          </button>
          <button 
            className="action-btn delete"
            onClick={(e) => handleAction(onDelete, e)}
          >
            🗑️ Supprimer
          </button>
        </div>
      )}
    </div>
  );
}