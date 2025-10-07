// app/pantry/components/ProductCard.jsx
'use client';

import { useState } from 'react';
import { ChevronDown, Package2 } from 'lucide-react';
import { daysUntil, getExpirationStatus, formatQuantity, capitalizeProduct } from './pantryUtils';

export default function ProductCard({ product, onOpen }) {
  // Protection contre product undefined
  if (!product) {
    return (
      <div className="product-card error">
        <p>Erreur: Produit non défini</p>
      </div>
    );
  }

  const [isExpanded, setIsExpanded] = useState(false);
  
  // Données sécurisées du produit
  const productName = capitalizeProduct(product.productName || 'Produit sans nom');
  const productId = product.productId || 'unknown';
  const category = product.category || 'Sans catégorie';
  const lots = product.lots || [];
  const totalQuantity = product.totalQuantity || 0;
  const primaryUnit = product.primaryUnit || 'unité';
  const nextExpiry = product.nextExpiry;

  // Calcul du statut d'expiration
  const daysLeft = daysUntil(nextExpiry);
  const expirationStatus = getExpirationStatus(daysLeft);

  // Formatage de la quantité
  const quantityDisplay = formatQuantity(totalQuantity, primaryUnit, 1);
  
  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = () => {
    if (onOpen && typeof onOpen === 'function') {
      onOpen(product);
    }
  };

  return (
    <div className="product-card">
      <div className="product-header" onClick={handleCardClick}>
        <div className="product-main-info">
          <div className="product-icon">
            📦
          </div>
          <div className="product-details">
            <h3 className="product-name">{productName}</h3>
            <div className="product-meta">
              <span className="product-category">{category}</span>
              <span className="product-quantity">
                {quantityDisplay}
                <span className="lots-count">({lots.length} lot{lots.length > 1 ? 's' : ''})</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Statut d'expiration */}
        {nextExpiry && (
          <div 
            className="expiration-badge"
            style={{ 
              backgroundColor: expirationStatus.bgColor,
              color: expirationStatus.color,
              border: `1px solid ${expirationStatus.color}20`
            }}
          >
            {expirationStatus.label}
          </div>
        )}
        
        {/* Indicateur d'expansion */}
        <button 
          onClick={handleToggleExpand}
          className={`expand-indicator ${isExpanded ? 'expanded' : ''}`}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Section étendue */}
      {isExpanded && (
        <div className="product-expanded">
          <div className="lots-title">Détail des lots:</div>
          
          {lots.length === 0 ? (
            <div className="no-lots">
              <Package2 size={24} />
              <span>Aucun lot disponible</span>
            </div>
          ) : (
            <div className="lots-list">
              {lots.slice(0, 3).map((lot, index) => {
                const lotDays = daysUntil(lot.effective_expiration);
                const lotStatus = getExpirationStatus(lotDays);
                
                return (
                  <div key={lot.id || index} className="lot-item">
                    <div className="lot-info">
                      <span className="lot-quantity">
                        {formatQuantity(lot.qty_remaining, lot.unit, 1)}
                      </span>
                      {lot.location_name && (
                        <span className="lot-location">📍 {lot.location_name}</span>
                      )}
                    </div>
                    {lot.effective_expiration && (
                      <div 
                        className="lot-expiry"
                        style={{ 
                          color: lotStatus.color,
                          fontWeight: '600'
                        }}
                      >
                        {lotStatus.label}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {lots.length > 3 && (
                <div className="more-lots">
                  +{lots.length - 3} autres lots
                </div>
              )}
            </div>
          )}
          
          <div className="product-actions">
            <button 
              onClick={handleCardClick}
              className="btn-manage"
            >
              Gérer les lots
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .product-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: var(--forest-300, #c8d8c8);
        }

        .product-card.error {
          background: #fef2f2;
          border-color: #fecaca;
          padding: 1rem;
          color: #dc2626;
        }

        .product-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .product-header:hover {
          background: rgba(248, 250, 252, 0.8);
        }

        .product-main-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .product-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--forest-100, #f0f9f0);
          border-radius: 8px;
          border: 1px solid var(--forest-200, #dcf4dc);
        }

        .product-details {
          flex: 1;
        }

        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--forest-800, #1a3a1a);
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .product-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .product-category {
          background: var(--forest-100, #f0f9f0);
          color: var(--forest-700, #2d5a2d);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid var(--forest-200, #dcf4dc);
        }

        .product-quantity {
          font-size: 14px;
          color: var(--earth-600, #8b7a5d);
          font-weight: 500;
        }

        .lots-count {
          color: #9ca3af;
          font-weight: normal;
          margin-left: 4px;
        }

        .expiration-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .expand-indicator {
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
          padding: 4px;
          border-radius: 4px;
        }

        .expand-indicator:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .expand-indicator.expanded {
          transform: rotate(180deg);
        }

        .product-expanded {
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          padding: 16px;
          background: rgba(248, 250, 252, 0.5);
        }

        .no-lots {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          color: #9ca3af;
          text-align: center;
        }

        .lots-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--forest-700, #2d5a2d);
          margin: 0 0 12px 0;
        }

        .lots-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .lot-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .lot-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lot-quantity {
          font-size: 14px;
          font-weight: 500;
          color: var(--forest-700, #2d5a2d);
        }

        .lot-location {
          font-size: 12px;
          color: #6b7280;
        }

        .lot-expiry {
          font-size: 12px;
        }

        .more-lots {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          padding: 8px;
          font-style: italic;
        }

        .product-actions {
          display: flex;
          gap: 8px;
        }

        .btn-manage {
          background: var(--forest-500, #8bb58b);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          flex: 1;
        }

        .btn-manage:hover {
          background: var(--forest-600, #6b9d6b);
        }

        @media (max-width: 768px) {
          .product-header {
            padding: 12px;
          }

          .product-expanded {
            padding: 12px;
          }

          .product-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}
