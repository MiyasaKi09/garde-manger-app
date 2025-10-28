'use client';

import { useState, useEffect } from 'react';

export default function ConsumeModal({ item, isOpen, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(item?.unit || '');

  useEffect(() => {
    if (item) {
      setUnit(item.unit || '');
      // Suggérer une quantité par défaut intelligente
      if (item.is_containerized && item.container_size) {
        setQuantity((item.container_size * 0.3).toString());
      } else {
        setQuantity('');
      }
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Veuillez entrer une quantité valide');
      return;
    }
    if (qty > item.qty_remaining) {
      const confirm = window.confirm(
        `Vous voulez consommer ${qty} ${unit} mais il ne reste que ${item.qty_remaining} ${item.unit}. Continuer ?`
      );
      if (!confirm) return;
    }
    onConfirm(qty, unit);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Suggestions intelligentes de quantité
  const getSuggestions = () => {
    const suggestions = [];
    const remaining = item.qty_remaining;

    if (item.is_containerized && item.container_size) {
      // Pour les contenants
      const containerSize = item.container_size;
      suggestions.push(
        { label: `1/4 contenant (${(containerSize * 0.25).toFixed(1)} ${item.container_unit})`, value: containerSize * 0.25 },
        { label: `1/2 contenant (${(containerSize * 0.5).toFixed(1)} ${item.container_unit})`, value: containerSize * 0.5 },
        { label: `1 contenant (${containerSize} ${item.container_unit})`, value: containerSize }
      );
    } else {
      // Pour les produits normaux
      const unitLower = (unit || '').toLowerCase();
      if (unitLower === 'unités' || unitLower === 'u') {
        suggestions.push(
          { label: '1 unité', value: 1 },
          { label: '2 unités', value: 2 }
        );
      } else if (unitLower === 'g') {
        suggestions.push(
          { label: '50g', value: 50 },
          { label: '100g', value: 100 },
          { label: '250g', value: 250 }
        );
      } else if (unitLower === 'kg') {
        suggestions.push(
          { label: '0.1kg (100g)', value: 0.1 },
          { label: '0.5kg (500g)', value: 0.5 },
          { label: '1kg', value: 1 }
        );
      } else if (unitLower === 'ml') {
        suggestions.push(
          { label: '50mL', value: 50 },
          { label: '100mL', value: 100 },
          { label: '250mL', value: 250 }
        );
      } else if (unitLower === 'cl') {
        suggestions.push(
          { label: '5cL', value: 5 },
          { label: '10cL', value: 10 },
          { label: '25cL', value: 25 }
        );
      } else if (unitLower === 'l') {
        suggestions.push(
          { label: '0.1L (100mL)', value: 0.1 },
          { label: '0.5L (500mL)', value: 0.5 },
          { label: '1L', value: 1 }
        );
      }
    }

    // Ajouter "Tout consommer"
    if (remaining > 0) {
      suggestions.push({ label: `Tout (${remaining} ${item.unit})`, value: remaining });
    }

    return suggestions.filter(s => s.value <= remaining * 2); // Permettre un peu de dépassement
  };

  const suggestions = getSuggestions();

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Consommer : {item.product_name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="product-info">
            <p>
              <strong>Quantité restante :</strong> {item.qty_remaining} {item.unit}
            </p>
            {item.is_containerized && item.container_size && (
              <p className="container-info">
                📦 Produit en contenants de {item.container_size} {item.container_unit}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="quantity">Quantité à consommer :</label>
              <div className="input-group">
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex: 100"
                  step="0.01"
                  min="0"
                  required
                  autoFocus
                />
                <span className="input-unit">{unit}</span>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="suggestions">
                <label>Suggestions rapides :</label>
                <div className="suggestion-buttons">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="suggestion-btn"
                      onClick={() => setQuantity(suggestion.value.toString())}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn-confirm">
                Confirmer
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            animation: modalSlideIn 0.3s ease-out;
          }

          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          }

          .modal-header h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--forest-800, #1a3a1a);
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 32px;
            color: #9ca3af;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s;
          }

          .modal-close:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #6b7280;
          }

          .modal-body {
            padding: 24px;
          }

          .product-info {
            background: rgba(248, 250, 252, 0.8);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .product-info p {
            margin: 0 0 8px 0;
            color: var(--forest-700, #2d5a2d);
            font-size: 14px;
          }

          .product-info p:last-child {
            margin-bottom: 0;
          }

          .container-info {
            color: var(--earth-600, #8b7a5d);
            font-style: italic;
          }

          .form-group {
            margin-bottom: 24px;
          }

          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--forest-700, #2d5a2d);
            font-size: 14px;
          }

          .input-group {
            display: flex;
            align-items: center;
            gap: 8px;
            background: white;
            border: 2px solid var(--forest-200, #dcf4dc);
            border-radius: 12px;
            padding: 4px 4px 4px 16px;
            transition: border-color 0.2s;
          }

          .input-group:focus-within {
            border-color: var(--forest-500, #8bb58b);
          }

          .input-group input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 16px;
            padding: 12px 0;
            color: var(--forest-800, #1a3a1a);
          }

          .input-unit {
            background: var(--forest-100, #f0f9f0);
            color: var(--forest-700, #2d5a2d);
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
          }

          .suggestions {
            margin-bottom: 24px;
          }

          .suggestions label {
            display: block;
            margin-bottom: 12px;
            font-weight: 500;
            color: var(--forest-700, #2d5a2d);
            font-size: 14px;
          }

          .suggestion-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .suggestion-btn {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--forest-300, #c8d8c8);
            color: var(--forest-700, #2d5a2d);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .suggestion-btn:hover {
            background: var(--forest-100, #f0f9f0);
            border-color: var(--forest-500, #8bb58b);
          }

          .modal-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
          }

          .btn-cancel,
          .btn-confirm {
            flex: 1;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }

          .btn-cancel {
            background: rgba(0, 0, 0, 0.05);
            color: #6b7280;
          }

          .btn-cancel:hover {
            background: rgba(0, 0, 0, 0.1);
          }

          .btn-confirm {
            background: var(--forest-500, #8bb58b);
            color: white;
          }

          .btn-confirm:hover {
            background: var(--forest-600, #6b9d6b);
          }

          @media (max-width: 640px) {
            .modal-content {
              border-radius: 16px;
              margin: 0 10px;
            }

            .modal-header {
              padding: 20px;
            }

            .modal-body {
              padding: 20px;
            }

            .suggestion-buttons {
              flex-direction: column;
            }

            .suggestion-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
