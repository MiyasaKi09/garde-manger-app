'use client';

import { useState, useEffect } from 'react';
import './InlineEditQuantity.css';

export default function InlineEditQuantity({ 
  item, 
  onUpdate, 
  onCancel 
}) {
  const [quantity, setQuantity] = useState(item.qty_remaining);
  const [unit, setUnit] = useState(item.unit);
  const [justConverted, setJustConverted] = useState(false);

  // Métadonnées du produit pour les conversions
  const density = item.density_g_per_ml || 0;
  const gramsPerUnit = item.grams_per_unit || 0;

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

  // Conversion automatique quand l'unité change
  const handleUnitChange = (newUnit) => {
    const currentQty = quantity;
    const currentUnitLower = unit.toLowerCase();
    const newUnitLower = newUnit.toLowerCase();
    
    let convertedQty = currentQty;

    // Conversions entre unités pour produits comptables
    if (gramsPerUnit > 0) {
      if (currentUnitLower === 'u' && newUnitLower === 'g') {
        convertedQty = Math.round(currentQty * gramsPerUnit);
      } else if (currentUnitLower === 'g' && newUnitLower === 'u') {
        convertedQty = Math.round(currentQty / gramsPerUnit * 10) / 10;
      } else if (currentUnitLower === 'u' && newUnitLower === 'kg') {
        convertedQty = Math.round(currentQty * gramsPerUnit / 1000 * 100) / 100;
      } else if (currentUnitLower === 'kg' && newUnitLower === 'u') {
        convertedQty = Math.round(currentQty * 1000 / gramsPerUnit * 10) / 10;
      } else if (currentUnitLower === 'g' && newUnitLower === 'kg') {
        convertedQty = Math.round(currentQty / 1000 * 100) / 100;
      } else if (currentUnitLower === 'kg' && newUnitLower === 'g') {
        convertedQty = Math.round(currentQty * 1000);
      }
    }

    // Conversions entre unités pour liquides/granulés
    if (density > 0) {
      // Volume vers masse
      if (['ml', 'cl', 'l'].includes(currentUnitLower) && ['g', 'kg'].includes(newUnitLower)) {
        let ml = currentQty;
        if (currentUnitLower === 'cl') ml *= 10;
        if (currentUnitLower === 'l') ml *= 1000;
        
        const grams = ml * density;
        convertedQty = newUnitLower === 'kg' ? Math.round(grams / 1000 * 100) / 100 : Math.round(grams);
      }
      // Masse vers volume
      else if (['g', 'kg'].includes(currentUnitLower) && ['ml', 'cl', 'l'].includes(newUnitLower)) {
        let grams = currentQty;
        if (currentUnitLower === 'kg') grams *= 1000;
        
        const ml = grams / density;
        if (newUnitLower === 'l') convertedQty = Math.round(ml / 1000 * 100) / 100;
        else if (newUnitLower === 'cl') convertedQty = Math.round(ml / 10);
        else convertedQty = Math.round(ml);
      }
      // Entre unités de volume
      else if (['ml', 'cl', 'l'].includes(currentUnitLower) && ['ml', 'cl', 'l'].includes(newUnitLower)) {
        let ml = currentQty;
        if (currentUnitLower === 'cl') ml *= 10;
        if (currentUnitLower === 'l') ml *= 1000;
        
        if (newUnitLower === 'l') convertedQty = Math.round(ml / 1000 * 100) / 100;
        else if (newUnitLower === 'cl') convertedQty = Math.round(ml / 10);
        else convertedQty = Math.round(ml);
      }
      // Entre unités de masse
      else if (['g', 'kg'].includes(currentUnitLower) && ['g', 'kg'].includes(newUnitLower)) {
        if (currentUnitLower === 'g' && newUnitLower === 'kg') {
          convertedQty = Math.round(currentQty / 1000 * 100) / 100;
        } else if (currentUnitLower === 'kg' && newUnitLower === 'g') {
          convertedQty = Math.round(currentQty * 1000);
        }
      }
    }

    setUnit(newUnit);
    setQuantity(convertedQty);
    
    // Effet visuel pour indiquer la conversion
    if (convertedQty !== currentQty) {
      setJustConverted(true);
      setTimeout(() => setJustConverted(false), 1000);
    }
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
              className={`quantity-input ${justConverted ? 'converted' : ''}`}
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
            onChange={(e) => handleUnitChange(e.target.value)}
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