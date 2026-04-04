'use client'

import { Archive, Home, Snowflake, Calendar } from 'lucide-react'
import { getPossibleUnitsForProduct } from '@/lib/possibleUnits'

/**
 * Step 2 form extracted from SmartAddForm.
 * Handles quantity, unit, containerization, storage method, and expiration date.
 */
export default function LotDetailsForm({
  selectedProduct,
  lotData,
  setLotData,
  onBack,
  getCategoryIcon,
  formatProductName,
}) {
  const possibleUnits = getPossibleUnitsForProduct(selectedProduct)

  const getIncrementValue = (unit) => {
    switch (unit) {
      case 'kg': return 0.1
      case 'g': return 100
      case 'ml':
      case 'cl': return 100
      case 'L': return 0.5
      case 'unités':
      default: return 0.5
    }
  }

  const adjustQuantity = (direction) => {
    const increment = getIncrementValue(lotData.unit)
    const currentQty = parseFloat(lotData.qty_remaining) || 0
    let newQty

    if (direction === 'up') {
      newQty = currentQty + increment
    } else {
      newQty = Math.max(increment, currentQty - increment)
    }

    if (lotData.unit === 'kg') {
      newQty = Math.round(newQty * 10) / 10
    } else if (lotData.unit === 'unités') {
      newQty = Math.round(newQty * 2) / 2
    }

    setLotData(prev => ({ ...prev, qty_remaining: newQty }))
  }

  const handleStorageMethodChange = (method) => {
    let place = 'Garde-manger'
    if (method === 'fridge') place = 'Réfrigérateur'
    if (method === 'freezer') place = 'Congélateur'

    // Recalculate default expiration based on storage method
    const shelfLifeDays = method === 'fridge'
      ? selectedProduct.shelf_life_days_fridge
      : method === 'freezer'
        ? selectedProduct.shelf_life_days_freezer
        : selectedProduct.shelf_life_days_pantry

    let newExpiration = ''
    if (shelfLifeDays) {
      const d = new Date()
      d.setDate(d.getDate() + shelfLifeDays)
      newExpiration = d.toISOString().split('T')[0]
    }

    setLotData(prev => ({
      ...prev,
      storage_method: method,
      storage_place: place,
      expiration_date: newExpiration,
    }))
  }

  return (
    <>
      <div className="selected-product-card">
        <span className="product-icon-large">
          {getCategoryIcon(selectedProduct.category_id, selectedProduct.name)}
        </span>
        <div className="product-details">
          <div className="product-name">{formatProductName(selectedProduct.name)}</div>
          <div className="product-category">
            {selectedProduct.subcategory || 'Général'}
          </div>
        </div>
        <button onClick={onBack} className="change-btn">
          Changer
        </button>
      </div>

      <div className="form-section">
        {/* Quantity */}
        <div className="quantity-section">
          <label>Quantité</label>
          <div className="quantity-controls">
            <button onClick={() => adjustQuantity('down')} className="qty-btn">-</button>
            <input
              type="number"
              value={lotData.qty_remaining}
              onChange={e => setLotData(prev => ({ ...prev, qty_remaining: parseFloat(e.target.value) || 0 }))}
              className="qty-input"
              step={getIncrementValue(lotData.unit)}
              min="0"
            />
            <button onClick={() => adjustQuantity('up')} className="qty-btn">+</button>
          </div>
        </div>

        {/* Unit */}
        <div className="unit-section">
          <label>Unité</label>
          <select
            value={lotData.unit}
            onChange={e => setLotData(prev => ({ ...prev, unit: e.target.value }))}
            className="unit-select"
          >
            {possibleUnits.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>

        {/* Container management */}
        <div className="container-management-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lotData.is_containerized}
              onChange={e => setLotData(prev => ({
                ...prev,
                is_containerized: e.target.checked,
                container_size: e.target.checked ? prev.container_size : '',
                container_unit: e.target.checked ? prev.container_unit : '',
              }))}
              className="container-checkbox"
            />
            <span>Produit en contenants unitaires</span>
          </label>

          {lotData.is_containerized && (
            <div className="container-fields">
              <div className="container-field">
                <label>Taille du contenant</label>
                <input
                  type="number"
                  value={lotData.container_size}
                  onChange={e => setLotData(prev => ({ ...prev, container_size: e.target.value }))}
                  placeholder="Ex: 25, 500..."
                  className="container-size-input"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="container-field">
                <label>Unité</label>
                <select
                  value={lotData.container_unit}
                  onChange={e => setLotData(prev => ({ ...prev, container_unit: e.target.value }))}
                  className="container-unit-select"
                >
                  <option value="">Sélectionner...</option>
                  <option value="mL">mL (millilitres)</option>
                  <option value="cL">cL (centilitres)</option>
                  <option value="L">L (litres)</option>
                  <option value="g">g (grammes)</option>
                  <option value="kg">kg (kilogrammes)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Storage */}
        <div className="storage-section">
          <label>Stockage</label>
          <div className="storage-methods">
            <button
              onClick={() => handleStorageMethodChange('pantry')}
              className={`storage-btn ${lotData.storage_method === 'pantry' ? 'active' : ''}`}
            >
              <Archive size={16} />
              Garde-manger
            </button>
            <button
              onClick={() => handleStorageMethodChange('fridge')}
              className={`storage-btn ${lotData.storage_method === 'fridge' ? 'active' : ''}`}
            >
              <Home size={16} />
              Frigo
            </button>
            <button
              onClick={() => handleStorageMethodChange('freezer')}
              className={`storage-btn ${lotData.storage_method === 'freezer' ? 'active' : ''}`}
            >
              <Snowflake size={16} />
              Congélateur
            </button>
          </div>
        </div>

        {/* Expiration */}
        <div className="expiration-section">
          <label>Date d'expiration</label>
          <div className="expiration-input">
            <Calendar size={16} className="calendar-icon" />
            <input
              type="date"
              value={lotData.expiration_date}
              onChange={e => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
              className="date-input"
            />
          </div>
        </div>
      </div>
    </>
  )
}
