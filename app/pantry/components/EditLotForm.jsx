'use client';

import { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, X } from 'lucide-react';
import './EditLotForm.css';

const STORAGE_LOCATIONS = [
  { value: 'garde-manger', label: 'Garde-manger', icon: '🏠', factor: 1.0 },
  { value: 'réfrigérateur', label: 'Réfrigérateur', icon: '❄️', factor: 2.0 },
  { value: 'congélateur', label: 'Congélateur', icon: '🧊', factor: 10.0 },
  { value: 'cave', label: 'Cave', icon: '🏛️', factor: 1.5 },
  { value: 'placard', label: 'Placard', icon: '🚪', factor: 1.0 }
];

const POSSIBLE_UNITS = ['u', 'g', 'kg', 'mL', 'cL', 'L'];

export default function EditLotForm({ 
  item, 
  onUpdate, 
  onCancel 
}) {
  const [quantity, setQuantity] = useState(item.qty_remaining);
  const [unit, setUnit] = useState(item.unit);
  const [location, setLocation] = useState(item.storage_place || 'garde-manger');
  const [expirationDate, setExpirationDate] = useState(
    item.expiration_date ? item.expiration_date.split('T')[0] : ''
  );
  const [justConverted, setJustConverted] = useState(false);
  const [dateAdjusted, setDateAdjusted] = useState(false);

  // Métadonnées du produit pour les conversions
  const density = item.density_g_per_ml || 0;
  const gramsPerUnit = item.grams_per_unit || 0;

  // Fonction pour ajuster la date d'expiration selon l'emplacement
  const adjustExpirationDateForLocation = (newLocation, currentDate) => {
    if (!currentDate) return '';
    
    const currentDateObj = new Date(currentDate);
    const today = new Date();
    const daysFromToday = Math.ceil((currentDateObj - today) / (1000 * 60 * 60 * 24));
    
    // Facteurs d'ajustement selon l'emplacement
    const locationFactors = {
      'garde-manger': 1.0,      // Durée normale
      'réfrigérateur': 2.0,     // Double la durée
      'congélateur': 10.0,      // 10x plus long
      'cave': 1.5,              // 50% plus long
      'placard': 1.0            // Durée normale
    };
    
    const currentLocationFactor = locationFactors[item.storage_place] || 1.0;
    const newLocationFactor = locationFactors[newLocation] || 1.0;
    
    // Calculer la nouvelle durée ajustée
    const adjustmentRatio = newLocationFactor / currentLocationFactor;
    const newDaysFromToday = Math.round(daysFromToday * adjustmentRatio);
    
    // Calculer la nouvelle date
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + newDaysFromToday);
    
    return newDate.toISOString().split('T')[0];
  };

  const handleLocationChange = (newLocation) => {
    const willAdjustDate = expirationDate && newLocation !== item.storage_place;
    
    setLocation(newLocation);
    
    // Ajuster automatiquement la date si elle existe
    if (willAdjustDate) {
      const newDate = adjustExpirationDateForLocation(newLocation, expirationDate);
      setExpirationDate(newDate);
      
      // Effet visuel pour indiquer l'ajustement
      setDateAdjusted(true);
      setTimeout(() => setDateAdjusted(false), 1500);
    }
  };

  const handleSave = () => {
    if (quantity > 0) {
      onUpdate(item.id, {
        qty_remaining: quantity,
        unit: unit,
        storage_place: location,
        expiration_date: expirationDate || null
      });
    }
  };

  const handleIncrement = () => {
    const step = unit === 'u' ? 1 : 0.1;
    setQuantity(prev => Math.round((prev + step) * 10) / 10);
  };

  const handleDecrement = () => {
    const step = unit === 'u' ? 1 : 0.1;
    setQuantity(prev => Math.max(0, Math.round((prev - step) * 10) / 10));
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

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Package size={16} />
            Modifier {item.product_name}
          </div>
          <button className="close-btn" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-content">
          {/* Section Quantité */}
          <div className="form-section">
            <div className="section-header">
              <Package size={16} />
              <span>Quantité</span>
            </div>
            
            <div className="quantity-controls">
              <div className="quantity-input-wrapper">
                <button 
                  type="button"
                  className="qty-btn minus"
                  onClick={handleDecrement}
                  disabled={quantity <= 0}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className={`qty-input ${justConverted ? 'converted' : ''}`}
                  step="0.1"
                  min="0"
                />
                <button 
                  type="button"
                  className="qty-btn plus"
                  onClick={handleIncrement}
                >
                  +
                </button>
              </div>
              
              <div className="unit-selector">
                {POSSIBLE_UNITS.map(u => (
                  <button
                    key={u}
                    type="button"
                    className={`unit-btn ${unit === u ? 'active' : ''}`}
                    onClick={() => handleUnitChange(u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Emplacement */}
          <div className="form-section">
            <div className="section-header">
              <MapPin size={16} />
              <span>Emplacement</span>
            </div>
            
            <div className="location-grid">
              {STORAGE_LOCATIONS.map(loc => {
                const currentFactor = STORAGE_LOCATIONS.find(l => l.value === item.storage_place)?.factor || 1.0;
                const willExtend = expirationDate && loc.factor > currentFactor;
                const willShorten = expirationDate && loc.factor < currentFactor;
                
                return (
                  <button
                    key={loc.value}
                    type="button"
                    className={`location-btn ${location === loc.value ? 'selected' : ''} ${willExtend ? 'extends-life' : ''} ${willShorten ? 'shortens-life' : ''}`}
                    onClick={() => handleLocationChange(loc.value)}
                    title={
                      loc.value === item.storage_place ? 'Emplacement actuel' :
                      willExtend ? `Prolongera la conservation` :
                      willShorten ? `Réduira la conservation` :
                      'Même durée de conservation'
                    }
                  >
                    <span className="location-icon">{loc.icon}</span>
                    <span className="location-label">{loc.label}</span>
                    {willExtend && <span className="duration-indicator">+</span>}
                    {willShorten && <span className="duration-indicator">-</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Date d'expiration */}
          <div className="form-section">
            <div className="section-header">
              <Calendar size={16} />
              <span>Date d'expiration (optionnelle)</span>
            </div>
            
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className={`date-input ${dateAdjusted ? 'date-adjusted' : ''}`}
              min={new Date().toISOString().split('T')[0]}
            />
            {dateAdjusted && (
              <div className="date-adjustment-notice">
                📅 Date ajustée automatiquement pour {STORAGE_LOCATIONS.find(l => l.value === location)?.label}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="action-btn secondary" 
              onClick={onCancel}
            >
              Annuler
            </button>
            <button 
              type="button" 
              className="action-btn primary" 
              onClick={handleSave}
              disabled={quantity <= 0}
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}