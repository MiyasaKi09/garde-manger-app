// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Package, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { 
  similarity, 
  confidenceFromSimilarity, 
  defaultUnitForName,
  estimateExpiryFromShelfLife
} from './pantryUtils';

export default function SmartAddForm({ 
  open, 
  onClose, 
  productsCatalog = [], 
  categories = [],
  onCreate 
}) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confidence, setConfidence] = useState({ percent: 0, label: 'Faible', tone: 'warning' });
  const [loading, setLoading] = useState(false);

  const [lotData, setLotData] = useState({
    qty: '',
    unit: 'g',
    storage_method: 'pantry',
    storage_place: '',
    expiration_date: '',
    notes: ''
  });

  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setConfidence({ percent: 0, label: 'Faible', tone: 'warning' });
      setLotData({
        qty: '',
        unit: 'g',
        storage_method: 'pantry',
        storage_place: '',
        expiration_date: '',
        notes: ''
      });
      
      // Focus sur le champ de recherche
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  // Focus sur quantité à l'étape 2
  useEffect(() => {
    if (step === 2 && qtyInputRef.current) {
      setTimeout(() => qtyInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Recherche avec debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = useCallback((query) => {
    if (!query.trim()) return;

    setSearchLoading(true);
    
    try {
      // Recherche dans le catalogue existant
      const matches = productsCatalog
        .map(product => ({
          ...product,
          score: similarity(query, product.name),
          source: 'catalog'
        }))
        .filter(p => p.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Ajouter une option "créer nouveau produit" si pas de résultats parfaits
      const hasExactMatch = matches.some(m => m.score > 0.8);
      if (!hasExactMatch) {
        matches.push({
          id: 'new-product',
          name: query,
          display_name: query,
          category: 'À définir',
          primary_unit: defaultUnitForName(query),
          score: 0,
          source: 'new',
          icon: '📦'
        });
      }

      setSearchResults(matches);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [productsCatalog]);

  const calculateExpirationDate = useCallback((product, storageMethod) => {
    if (!product?.shelf_life_days) return '';
    
    const days = product.shelf_life_days[storageMethod] || 
                 product.shelf_life_days.pantry || 
                 7; // Fallback
    
    return estimateExpiryFromShelfLife(days) || '';
  }, []);

  const chooseDefaultUnit = useCallback((product) => {
    return product?.primary_unit || defaultUnitForName(product?.name || '');
  }, []);

  const chooseDefaultQty = useCallback((unit) => {
    const qtyMap = {
      'pièce': 1,
      'g': 250,
      'ml': 250,
      'kg': 1,
      'l': 1
    };
    return qtyMap[unit] || '';
  }, []);

  // Sélection d'un produit
  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);

    // Calcul de la confiance basé sur la similarité
    const sim = similarity(searchQuery || '', product.name || '');
    const conf = confidenceFromSimilarity(sim);
    setConfidence(conf);

    const autoUnit = chooseDefaultUnit(product);
    const autoExpiry = calculateExpirationDate(product, 'pantry');
    const autoQty = chooseDefaultQty(autoUnit);

    setLotData(prev => ({
      ...prev,
      unit: autoUnit,
      qty: prev.qty || autoQty,
      expiration_date: autoExpiry,
      notes: prev.notes || `Confiance: ${conf.percent}% — auto`
    }));

    setStep(2);
  }, [searchQuery, chooseDefaultUnit, calculateExpirationDate, chooseDefaultQty]);

  // Mise à jour de la date d'expiration si la méthode de stockage change
  const handleStorageMethodChange = useCallback((method) => {
    setLotData(prev => ({
      ...prev,
      storage_method: method,
      expiration_date: selectedProduct ? 
        calculateExpirationDate(selectedProduct, method) : 
        prev.expiration_date
    }));
  }, [selectedProduct, calculateExpirationDate]);

  // Création rapide d'un produit
  const handleCreateQuickProduct = useCallback(() => {
    const newProduct = {
      id: 'quick-' + Date.now(),
      name: searchQuery.trim(),
      display_name: searchQuery.trim(),
      category: 'Autre',
      primary_unit: defaultUnitForName(searchQuery),
      source: 'quick',
      icon: '📦',
      shelf_life_days: {
        pantry: 30,
        fridge: 7,
        freezer: 90
      }
    };
    
    handleSelectProduct(newProduct);
  }, [searchQuery, handleSelectProduct]);

  // Création du lot
  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct || !lotData.qty) return;

    setLoading(true);
    
    try {
      const payload = {
        canonical_food_id: selectedProduct.id === 'new-product' || selectedProduct.source === 'quick' ? 
          null : selectedProduct.id,
        display_name: selectedProduct.display_name || selectedProduct.name,
        qty_remaining: parseFloat(lotData.qty),
        unit: lotData.unit,
        effective_expiration: lotData.expiration_date || null,
        location_name: lotData.storage_place || null,
        notes: lotData.notes || null,
        storage_method: lotData.storage_method,
        category_name: selectedProduct.category
      };

      if (onCreate && typeof onCreate === 'function') {
        await onCreate(payload);
      }
    } catch (error) {
      console.error('Erreur lors de la création du lot:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, lotData, onCreate]);

  const handleClose = useCallback(() => {
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <div className="smart-add-overlay" onClick={handleClose}>
        <div className="smart-add-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <div className="header-title">
              <Plus size={20} />
              <span>Ajouter un produit</span>
            </div>
            <button onClick={handleClose} className="close-button">
              <X size={20} />
            </button>
          </div>

          {/* Progress */}
          <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
              1. Produit
            </div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
              2. Quantité
            </div>
          </div>

          {/* Content */}
          <div className="modal-content">
            {/* Étape 1: Recherche de produit */}
            {step === 1 && (
              <div className="search-step">
                <div className="search-input-wrapper">
                  <Search size={20} className="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher ou saisir un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                {searchLoading && (
                  <div className="search-loading">
                    Recherche en cours...
                  </div>
                )}

                {/* Résultats de recherche */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((product) => (
                      <div
                        key={`${product.source}-${product.id}`}
                        className={`search-result ${product.source === 'new' ? 'create-new' : ''}`}
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="result-icon">
                          {product.icon || '📦'}
                        </div>
                        <div className="result-info">
                          <div className="result-name">
                            {product.display_name || product.name}
                            {product.source === 'new' && (
                              <span className="new-badge">Nouveau</span>
                            )}
                          </div>
                          <div className="result-meta">
                            {product.category} • {product.primary_unit || 'unité'}
                            {product.score > 0 && (
                              <span className="confidence">
                                {Math.round(product.score * 100)}% similaire
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && !searchLoading && searchResults.length === 0 && (
                  <div className="no-results">
                    <p>Aucun produit trouvé pour "{searchQuery}"</p>
                    <button 
                      onClick={handleCreateQuickProduct} 
                      className="btn-create-quick"
                      disabled={loading}
                    >
                      <Plus size={16} /> Créer "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Étape 2: Détails du lot */}
            {step === 2 && selectedProduct && (
              <div className="lot-details-step">
                {/* Récap produit sélectionné */}
                <div className="selected-product-summary">
                  <div className="product-icon">{selectedProduct.icon || '📦'}</div>
                  <div className="product-info">
                    <div className="product-name">{selectedProduct.display_name}</div>
                    <div className="product-source">
                      {selectedProduct.source === 'catalog' ? 'Produit existant' : 
                       selectedProduct.source === 'new' ? 'Nouveau produit' :
                       selectedProduct.source === 'quick' ? 'Création rapide' : ''}
                    </div>
                  </div>

                  <div className={`confidence-badge tone-${confidence.tone}`}>
                    <ShieldCheck size={14} />
                    <span>{confidence.label} ({confidence.percent}%)</span>
                  </div>

                  <button onClick={() => setStep(1)} className="btn-change">
                    Changer
                  </button>
                </div>

                {/* Formulaire du lot */}
                <div className="lot-form">
                  <div className="form-row">
                    <div className="form-group flex-2">
                      <label htmlFor="qty">Quantité *</label>
                      <input
                        ref={qtyInputRef}
                        id="qty"
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={lotData.qty}
                        onChange={(e) => setLotData(prev => ({ 
                          ...prev, 
                          qty: e.target.value 
                        }))}
                        placeholder="0"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label htmlFor="unit">Unité</label>
                      <select
                        id="unit"
                        value={lotData.unit}
                        onChange={(e) => setLotData(prev => ({ 
                          ...prev, 
                          unit: e.target.value 
                        }))}
                        className="form-select"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="pièce">pièce</option>
                        <option value="barquette">barquette</option>
                        <option value="pot">pot</option>
                        <option value="sachet">sachet</option>
                      </select>
                    </div>
                  </div>

                  {/* Méthode de stockage */}
                  <div className="form-group">
                    <label>Méthode de stockage</label>
                    <div className="storage-methods">
                      {[
                        { value: 'fridge', label: 'Frigo', icon: '❄️' },
                        { value: 'pantry', label: 'Placard', icon: '🏠' },
                        { value: 'freezer', label: 'Congélateur', icon: '🧊' },
                        { value: 'counter', label: 'Plan travail', icon: '🏪' }
                      ].map(method => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => handleStorageMethodChange(method.value)}
                          className={`storage-method ${
                            lotData.storage_method === method.value ? 'active' : ''
                          }`}
                        >
                          <span className="method-icon">{method.icon}</span>
                          <span className="method-label">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lieu spécifique */}
                  <div className="form-group">
                    <label htmlFor="storage_place">
                      <MapPin size={16} />Lieu spécifique (optionnel)
                    </label>
                    <input
                      id="storage_place"
                      type="text"
                      value={lotData.storage_place}
                      onChange={(e) => setLotData(prev => ({ 
                        ...prev, 
                        storage_place: e.target.value 
                      }))}
                      placeholder="ex: étagère du haut, tiroir à légumes..."
                      className="form-input"
                    />
                  </div>

                  {/* Date d'expiration */}
                  <div className="form-group">
                    <label htmlFor="expiration_date">
                      <Calendar size={16} />Date d'expiration
                    </label>
                    <input
                      id="expiration_date"
                      type="date"
                      value={lotData.expiration_date}
                      onChange={(e) => setLotData(prev => ({ 
                        ...prev, 
                        expiration_date: e.target.value 
                      }))}
                      className="form-input"
                    />
                    <div className="expiration-hint">
                      Suggestion basée sur la conservation en {
                        lotData.storage_method === 'fridge' ? 'frigo' :
                        lotData.storage_method === 'pantry' ? 'placard' :
                        lotData.storage_method === 'freezer' ? 'congélateur' : 
                        'plan de travail'
                      }
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="form-group">
                    <label htmlFor="notes">Notes (optionnel)</label>
                    <textarea
                      id="notes"
                      value={lotData.notes}
                      onChange={(e) => setLotData(prev => ({ 
                        ...prev, 
                        notes: e.target.value 
                      }))}
                      placeholder="Marque, origine, particularités..."
                      className="form-textarea"
                      rows="2"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <button 
                    onClick={() => setStep(1)} 
                    className="btn-secondary" 
                    disabled={loading}
                  >
                    Retour
                  </button>
                  <button 
                    onClick={handleCreateLot} 
                    className="btn-primary" 
                    disabled={loading || !lotData.qty}
                  >
                    {loading ? 'Création...' : 'Créer le lot'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .smart-add-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .smart-add-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: var(--forest-50, #f8fdf8);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--forest-800, #1a3a1a);
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .progress-bar {
          display: flex;
          padding: 1rem 1.5rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .progress-step {
          flex: 1;
          text-align: center;
          padding: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #9ca3af;
          position: relative;
        }

        .progress-step.active {
          color: var(--forest-600, #6b9d6b);
        }

        .progress-step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -50%;
          transform: translateY(-50%);
          width: 100%;
          height: 1px;
          background: #e5e7eb;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .search-input-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--forest-400, #a8c5a8);
          box-shadow: 0 0 0 3px rgba(168, 197, 168, 0.1);
        }

        .search-loading {
          text-align: center;
          color: #6b7280;
          padding: 1rem;
          font-style: italic;
        }

        .search-results {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .search-result {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-result:hover {
          border-color: var(--forest-300, #c8d8c8);
          background: var(--forest-50, #f8fdf8);
        }

        .search-result.create-new {
          border-style: dashed;
          border-color: var(--forest-400, #a8c5a8);
        }

        .result-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .result-info {
          flex: 1;
        }

        .result-name {
          font-weight: 600;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .new-badge {
          background: var(--forest-100, #f0f9f0);
          color: var(--forest-600, #6b9d6b);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .result-meta {
          font-size: 0.875rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .confidence {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .no-results {
          text-align: center;
          padding: 2rem 1rem;
          color: #6b7280;
        }

        .btn-create-quick {
          background: var(--forest-500, #8bb58b);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          transition: background-color 0.2s;
        }

        .btn-create-quick:hover {
          background: var(--forest-600, #6b9d6b);
        }

        .selected-product-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--forest-50, #f8fdf8);
          border: 1px solid var(--forest-200, #dcf4dc);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .product-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 8px;
        }

        .product-info {
          flex: 1;
        }

        .product-name {
          font-weight: 600;
          color: var(--forest-800, #1a3a1a);
          margin-bottom: 0.25rem;
        }

        .product-source {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .confidence-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 999px;
        }

        .tone-good {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .tone-neutral {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .tone-warning {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
        }

        .btn-change {
          background: none;
          border: 1px solid #d1d5db;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .btn-change:hover {
          background: #f9fafb;
        }

        .lot-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.flex-1 {
          flex: 1;
        }

        .form-group.flex-2 {
          flex: 2;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 14px;
        }

        .form-input, .form-select, .form-textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--forest-400, #a8c5a8);
          box-shadow: 0 0 0 3px rgba(168, 197, 168, 0.1);
        }

        .storage-methods {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .storage-method {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .storage-method:hover {
          border-color: var(--forest-300, #c8d8c8);
        }

        .storage-method.active {
          border-color: var(--forest-500, #8bb58b);
          background: var(--forest-50, #f8fdf8);
        }

        .method-icon {
          font-size: 1.25rem;
        }

        .method-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .expiration-hint {
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-secondary, .btn-primary {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-secondary {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .btn-primary {
          background: var(--forest-500, #8bb58b);
          border: 1px solid var(--forest-500, #8bb58b);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--forest-600, #6b9d6b);
        }

        .btn-primary:disabled, .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .smart-add-modal {
            margin: 0;
            max-height: 100vh;
            border-radius: 0;
          }

          .modal-content {
            padding: 1rem;
          }

          .form-row {
            flex-direction: column;
            gap: 0.75rem;
          }

          .storage-methods {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .storage-method {
            flex-direction: row;
            padding: 0.75rem;
          }

          .selected-product-summary {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
