'use client';

import { useState } from 'react';
import { getQuickConversions } from '../../../lib/quickConversions';
import { capitalizeProduct, getEffectiveExpiration, daysUntil } from './pantryUtils';

export default function PantryProductCard({ item, onConsume, onEdit, onDelete, onUpdateQuantity }) {
  const [showActions, setShowActions] = useState(false);
  
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


  // Calcul de la date d'expiration effective et des jours restants
  const effectiveExpiration = getEffectiveExpiration(item);
  const daysLeft = daysUntil(effectiveExpiration);
  const getStatusClass = (days) => {
    if (days === null) return 'status-good';
    if (days < 0) return 'status-expired';
    if (days <= 3) return 'status-expiring';
    return 'status-good';
  };
  const getStatusText = (days) => {
    if (days === null) return '📅 Pas de date';
    if (days < 0) return `Expiré depuis ${Math.abs(days)}j`;
    if (days === 0) return `Expire aujourd'hui`;
    if (days === 1) return `Expire demain`;
    if (days <= 3) return `Expire dans ${days}j`;
    return `${days}j restants`;
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
          <span className={`status-badge ${getStatusClass(daysLeft)}`}> 
            {getStatusText(daysLeft)}
          </span>
        </div>
        {effectiveExpiration && (
          <div className="info-row">
            <span className="info-icon">🗓️</span>
            <span className="info-value">{formatDate(effectiveExpiration)}</span>
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