'use client';

import { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, X, PackageOpen } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { toast } from '@/components/Toast';
import { getPossibleUnitsForProduct } from '@/lib/possibleUnits';
import { normalizeProductUnit } from '@/lib/productUnitPolicy';
import './EditLotForm.css';

const STORAGE_LOCATIONS = [
  { value: 'garde-manger', label: 'Garde-manger', icon: '🏠', factor: 1.0 },
  { value: 'réfrigérateur', label: 'Réfrigérateur', icon: '❄️', factor: 2.0 },
  { value: 'congélateur', label: 'Congélateur', icon: '🧊', factor: 10.0 },
  { value: 'cave', label: 'Cave', icon: '🏛️', factor: 1.5 },
  { value: 'placard', label: 'Placard', icon: '🚪', factor: 1.0 }
];

export default function EditLotForm({
  item,
  onUpdate,
  onCancel,
  onReload,
  onConsume,
  onContainerAction,
}) {
  const [quantity, setQuantity] = useState(item.qty_remaining);
  const [isOpened, setIsOpened] = useState(!!item.is_opened);
  const [adjustedDate, setAdjustedDate] = useState(item.adjusted_expiration_date || null);
  const [toggling, setToggling] = useState(false);

  // Marquer le lot ouvert/refermé : la DLC est recalculée côté serveur
  // (durées après ouverture de l'archétype, plafonnées à la DLC d'origine).
  const handleToggleOpened = async () => {
    setToggling(true);
    try {
      const res = await authFetch('/api/lots/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isOpened ? 'close' : 'open', lotId: item.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error || data.success === false) {
        toast.error(data.error || 'Impossible de changer l\'état du produit');
        return;
      }
      const nowOpened = !isOpened;
      setIsOpened(nowOpened);
      setAdjustedDate(nowOpened ? (data.lot?.adjusted_expiration_date || null) : null);
      toast.success(data.messageShort || data.message || (nowOpened ? 'Produit marqué ouvert' : 'Produit refermé'));
      onReload?.();
    } catch {
      toast.error('Erreur réseau — état du produit inchangé');
    } finally {
      setToggling(false);
    }
  };
  const [unit, setUnit] = useState(normalizeProductUnit(item.unit) || 'g');
  const [location, setLocation] = useState(item.storage_place || 'garde-manger');
  
  // Garder la date d'origine et celle de création pour les calculs
  const originalExpirationDate = item.expiration_date ? item.expiration_date.split('T')[0] : '';
  const originalLocation = item.storage_place || 'garde-manger';
  const createdAt = new Date(item.created_at || Date.now());
  
  const [expirationDate, setExpirationDate] = useState(originalExpirationDate);
  const [justConverted, setJustConverted] = useState(false);
  const [dateAdjusted, setDateAdjusted] = useState(false);

  // Métadonnées du produit pour les conversions
  const density = item.density_g_per_ml || 0;
  const gramsPerUnit = item.grams_per_unit || item.unit_weight_grams || 0;
  const possibleUnits = getPossibleUnitsForProduct({ ...item, primary_unit: item.primary_unit || item.unit });

  // Métadonnées de durée de conservation selon l'emplacement (depuis la base de données)
  const getShelfLifeDays = (location) => {
    // Récupérer les métadonnées selon le type de produit et l'emplacement
    if (item.canonical_foods) {
      const shelfLife = item.canonical_foods;
      switch(location) {
        case 'réfrigérateur': return shelfLife.shelf_life_days_fridge || shelfLife.shelf_life_days_pantry * 2;
        case 'congélateur': return shelfLife.shelf_life_days_freezer || shelfLife.shelf_life_days_pantry * 30;
        case 'garde-manger': return shelfLife.shelf_life_days_pantry || 7;
        case 'cave': return shelfLife.shelf_life_days_pantry * 1.5 || 10;
        case 'placard': return shelfLife.shelf_life_days_pantry || 7;
        default: return 7;
      }
    } else if (item.cultivars) {
      const shelfLife = item.cultivars;
      switch(location) {
        case 'réfrigérateur': return shelfLife.shelf_life_days_fridge || shelfLife.shelf_life_days_pantry * 2;
        case 'congélateur': return shelfLife.shelf_life_days_freezer || shelfLife.shelf_life_days_pantry * 30;
        case 'garde-manger': return shelfLife.shelf_life_days_pantry || 7;
        case 'cave': return shelfLife.shelf_life_days_pantry * 1.5 || 10;
        case 'placard': return shelfLife.shelf_life_days_pantry || 7;
        default: return 7;
      }
    } else if (item.archetypes) {
      const shelfLife = item.archetypes;
      switch(location) {
        case 'réfrigérateur': return shelfLife.shelf_life_days_fridge || shelfLife.shelf_life_days_pantry * 2;
        case 'congélateur': return shelfLife.shelf_life_days_freezer || shelfLife.shelf_life_days_pantry * 30;
        case 'garde-manger': return shelfLife.shelf_life_days_pantry || 7;
        case 'cave': return shelfLife.shelf_life_days_pantry * 1.5 || 10;
        case 'placard': return shelfLife.shelf_life_days_pantry || 7;
        default: return 7;
      }
    }
    
    // Valeurs par défaut si pas de métadonnées
    switch(location) {
      case 'réfrigérateur': return 14;
      case 'congélateur': return 365;
      case 'garde-manger': return 7;
      case 'cave': return 30;
      case 'placard': return 7;
      default: return 7;
    }
  };

  // Fonction pour calculer la nouvelle date d'expiration basée sur les métadonnées réelles
  const calculateExpirationDate = (targetLocation) => {
    const today = new Date();
    const daysSinceCreation = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
    
    // Obtenir la durée de conservation pour l'emplacement original et le nouveau
    const originalShelfLife = getShelfLifeDays(originalLocation);
    const targetShelfLife = getShelfLifeDays(targetLocation);
    
    // Calculer le pourcentage de durée de vie déjà écoulé dans l'emplacement original
    const percentageUsed = Math.min(daysSinceCreation / originalShelfLife, 1);
    
    // Calculer les jours restants dans le nouvel emplacement
    const remainingDays = Math.max(0, Math.round(targetShelfLife * (1 - percentageUsed)));
    
    // Calculer la nouvelle date d'expiration
    const newExpirationDate = new Date(today);
    newExpirationDate.setDate(today.getDate() + remainingDays);
    
    return newExpirationDate.toISOString().split('T')[0];
  };

    const handleLocationChange = (newLocation) => {
    const willAdjustDate = newLocation !== originalLocation;
    
    setLocation(newLocation);
    
    // Recalculer la date basée sur les métadonnées réelles
    if (willAdjustDate) {
      const newDate = calculateExpirationDate(newLocation);
      setExpirationDate(newDate);
      
      // Effet visuel pour indiquer l'ajustement
      setDateAdjusted(true);
      setTimeout(() => setDateAdjusted(false), 1500);
    } else {
      // Revenir à la date d'origine si on remet l'emplacement original
      setExpirationDate(originalExpirationDate);
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
  const handleUnitChange = (requestedUnit) => {
    const newUnit = normalizeProductUnit(requestedUnit) || requestedUnit;
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
    <div className="edit-lot-overlay" onClick={onCancel}>
      <div className="edit-lot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-lot-header">
          <div className="header-title">
            <Package size={16} />
            Modifier {item.product_name}
          </div>
          <button className="close-btn" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>

        <div className="edit-lot-content">
          {/* Un produit conditionné suit chaque paquet physiquement. */}
          {item.is_containerized ? (
          <div className="form-section container-ledger-section">
            <div className="section-header">
              <PackageOpen size={16} />
              <span>Contenants suivis</span>
            </div>
            <div className="container-ledger-summary">
              <div><strong>{item.container_summary?.sealed_count || 0}</strong><span>fermés</span></div>
              <div><strong>{item.container_summary?.open_count || 0}</strong><span>ouverts</span></div>
              <div><strong>{item.qty_remaining}</strong><span>{item.unit} restants</span></div>
            </div>
            <div className="container-ledger-list">
              {(item.containers || []).filter(c => c.status === 'sealed' || c.status === 'open').map(container => (
                <div key={container.id} className={`container-ledger-row ${container.status}`}>
                  <span>#{container.ordinal}</span>
                  <strong>{container.status === 'open' ? 'Ouvert' : 'Fermé'}</strong>
                  <span>{Number(container.remaining_quantity)} {container.unit}</span>
                  <small>
                    {container.status === 'open' && container.adjusted_expiration_date
                      ? `à utiliser avant le ${new Date(container.adjusted_expiration_date).toLocaleDateString('fr-FR')}`
                      : container.expiration_date
                        ? `date ${new Date(container.expiration_date).toLocaleDateString('fr-FR')}`
                        : 'sans date'}
                  </small>
                </div>
              ))}
            </div>
            <div className="container-ledger-actions">
              <button
                type="button"
                className="action-btn secondary"
                onClick={() => onContainerAction?.(item, 'open')}
                disabled={(item.container_summary?.open_count || 0) > 0 || (item.container_summary?.sealed_count || 0) === 0}
              >
                Ouvrir le prochain
              </button>
              <button type="button" className="action-btn primary" onClick={() => onConsume?.(item)}>
                Consommer
              </button>
              <button
                type="button"
                className="action-btn danger"
                onClick={() => onContainerAction?.(item, 'discard_open')}
                disabled={(item.container_summary?.open_count || 0) === 0}
              >
                Jeter l’ouvert
              </button>
            </div>
            {(item.container_summary?.empty_count || item.container_summary?.discarded_count) ? (
              <p className="container-ledger-history">
                Historique : {item.container_summary.empty_count || 0} vide(s), {item.container_summary.discarded_count || 0} jeté(s).
              </p>
            ) : null}
          </div>
          ) : (
          /* Section État (ouvert / fermé) — la DLC se réduit après ouverture */
          <div className="form-section">
            <div className="section-header">
              <PackageOpen size={16} />
              <span>État du produit</span>
            </div>
            <div className="opened-row">
              <div className="opened-info">
                <span className={`opened-badge ${isOpened ? 'is-open' : ''}`}>
                  {isOpened ? 'Ouvert / entamé' : 'Non ouvert'}
                </span>
                {isOpened && adjustedDate && (
                  <span className="opened-dlc">
                    DLC réduite au {new Date(adjustedDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="action-btn secondary opened-toggle"
                onClick={handleToggleOpened}
                disabled={toggling}
              >
                {toggling ? '…' : isOpened ? 'Refermer (DLC d\'origine)' : 'Marquer comme ouvert'}
              </button>
            </div>
          </div>
          )}

          {/* Section Quantité */}
          {!item.is_containerized && <div className="form-section">
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
                {possibleUnits.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`unit-btn ${unit === value ? 'active' : ''}`}
                    onClick={() => handleUnitChange(value)}
                    title={label}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>}

          {/* Section Emplacement */}
          <div className="form-section">
            <div className="section-header">
              <MapPin size={16} />
              <span>Emplacement</span>
            </div>
            
                        <div className="location-grid">
              {STORAGE_LOCATIONS.map(loc => {
                const originalShelfLife = getShelfLifeDays(originalLocation);
                const targetShelfLife = getShelfLifeDays(loc.value);
                const willExtend = targetShelfLife > originalShelfLife;
                const willShorten = targetShelfLife < originalShelfLife;
                const isOriginal = loc.value === originalLocation;
                
                return (
                  <button
                    key={loc.value}
                    type="button"
                    className={`location-btn ${location === loc.value ? 'selected' : ''} ${willExtend && !isOriginal ? 'extends-life' : ''} ${willShorten && !isOriginal ? 'shortens-life' : ''}`}
                    onClick={() => handleLocationChange(loc.value)}
                    title={
                      isOriginal ? 'Emplacement d\'origine' :
                      willExtend ? `Conservation plus longue (${Math.round(targetShelfLife)} jours)` :
                      willShorten ? `Conservation plus courte (${Math.round(targetShelfLife)} jours)` :
                      `Même durée de conservation (${Math.round(targetShelfLife)} jours)`
                    }
                  >
                    <span className="location-icon">{loc.icon}</span>
                    <span className="location-label">{loc.label}</span>
                    <div className="shelf-life-info">{Math.round(targetShelfLife)}j</div>
                    {willExtend && !isOriginal && <span className="duration-indicator">+</span>}
                    {willShorten && !isOriginal && <span className="duration-indicator">-</span>}
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
