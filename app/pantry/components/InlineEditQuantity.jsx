'use client';

import { useState } from 'react';
import './InlineEditQuantity.css';

export default function InlineEditQuantity({ 
  item, 
  onUpdate, 
  onCancel 
}) {
  const [quantity, setQuantity] = useState(item.qty_remaining);
  const [unit, setUnit] = useState(item.unit);

  const handleSave = () => {
    if (quantity > 0) {
      onUpdate(item.id, quantity, unit);
    }
  };

  const handleIncrement = () => {
    setQuantity(prev => Math.round((prev + 0.1) * 10) / 10);
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(0, Math.round((prev - 0.1) * 10) / 10));
  };

  const possibleUnits = ['u', 'g', 'kg', 'mL', 'cL', 'L'];

  return (
    <div className="inline-edit-overlay" onClick={onCancel}>
      <div className="inline-edit-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="inline-edit-title">
          Modifier {item.product_name}
        </h3>
        
        <div className="quantity-controls">
          <label className="quantity-label">Quantité</label>
          <div className="quantity-input-group">
            <button 
              type="button"
              className="quantity-btn minus"
              onClick={handleDecrement}
              disabled={quantity <= 0}
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="quantity-input"
              step="0.1"
              min="0"
            />
            <button 
              type="button"
              className="quantity-btn plus"
              onClick={handleIncrement}
            >
              +
            </button>
          </div>
        </div>

        <div className="unit-controls">
          <label className="unit-label">Unité</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="unit-select"
          >
            {possibleUnits.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div className="inline-edit-actions">
          <button 
            className="inline-edit-btn cancel-btn" 
            onClick={onCancel}
          >
            Annuler
          </button>
          <button 
            className="inline-edit-btn save-btn" 
            onClick={handleSave}
            disabled={quantity <= 0}
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}