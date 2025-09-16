// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Package, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  similarity, 
  confidenceFromSimilarity, 
  defaultUnitForName,
  estimateExpiryFromShelfLife
} from './pantryUtils';

export default function SmartAddForm({ 
  open, 
  onClose, 
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
  const supabase = createClientComponentClient();

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

  // RECHERCHE AMÉLIORÉE avec plus de debug et de fallbacks
  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    console.log('🔍 Recherche pour:', query);
    
    try {
      const searchTerm = query.trim().toLowerCase();
      const results = [];

      // ===== MÉTHODE 1: Recherche standard =====
      try {
        console.log('📊 Test 1: Recherche standard...');
        const { data: canonicalResults, error: canonicalError } = await supabase
          .from('canonical_foods')
          .select(`
            id,
            canonical_name,
            category_id,
            subcategory,
            keywords,
            primary_unit,
            shelf_life_days_pantry,
            shelf_life_days_fridge,
            shelf_life_days_freezer
          `)
          .or(`canonical_name.ilike.%${query}%,keywords.cs.{${query}}`)
          .limit(10);

        if (canonicalError) {
          console.error('❌ Erreur recherche standard:', canonicalError);
        } else {
          console.log('✅ Résultats recherche standard:', canonicalResults?.length || 0);
          console.log('📋 Exemples:', canonicalResults?.slice(0, 3));
        }

        // Traiter les résultats
        (canonicalResults || []).forEach(item => {
          const score = scoreResult(item.canonical_name, searchTerm);
          results.push({
            id: item.id,
            type: 'canonical',
            name: item.canonical_name,
            display_name: item.canonical_name,
            subcategory: item.subcategory,
            category: { name: item.subcategory || 'Aliment', icon: '🥬' },
            primary_unit: item.primary_unit || 'g',
            shelf_life_days: {
              fridge: item.shelf_life_days_fridge,
              pantry: item.shelf_life_days_pantry,
              freezer: item.shelf_life_days_freezer
            },
            source: 'Base de données',
            icon: '🥬',
            score
          });
        });
      } catch (error) {
        console.error('❌ Erreur dans recherche standard:', error);
      }

      // ===== MÉTHODE 2: Recherche simple (fallback) =====
      if (results.length === 0) {
        try {
          console.log('📊 Test 2: Recherche simple...');
          const { data: simpleResults, error: simpleError } = await supabase
            .from('canonical_foods')
            .select('id, canonical_name, primary_unit')
            .ilike('canonical_name', `%${query}%`)
            .limit(10);

          if (simpleError) {
            console.error('❌ Erreur recherche simple:', simpleError);
          } else {
            console.log('✅ Résultats recherche simple:', simpleResults?.length || 0);
          }

          (simpleResults || []).forEach(item => {
            const score = scoreResult(item.canonical_name, searchTerm);
            results.push({
              id: item.id,
              type: 'canonical',
              name: item.canonical_name,
              display_name: item.canonical_name,
              category: { name: 'Aliment', icon: '🥬' },
              primary_unit: item.primary_unit || 'g',
              source: 'Base simple',
              icon: '🥬',
              score
            });
          });
        } catch (error) {
          console.error('❌ Erreur dans recherche simple:', error);
        }
      }

      // ===== MÉTHODE 3: Quelques suggestions par défaut =====
      if (results.length === 0) {
        console.log('📊 Test 3: Ajout de suggestions par défaut...');
        const defaultSuggestions = [
          { name: 'Tomate', icon: '🍅', category: 'Légumes' },
          { name: 'Pomme', icon: '🍎', category: 'Fruits' },
          { name: 'Riz', icon: '🍚', category: 'Céréales' },
          { name: 'Lait', icon: '🥛', category: 'Produits laitiers' },
          { name: 'Pain', icon: '🍞', category: 'Boulangerie' }
        ];

        defaultSuggestions.forEach((item, index) => {
          if (item.name.toLowerCase().includes(searchTerm)) {
            results.push({
              id: `default-${index}`,
              type: 'default',
              name: item.name,
              display_name: item.name,
              category: { name: item.category, icon: '📦' },
              primary_unit: 'g',
              source: 'Suggestion',
              icon: item.icon,
              score: scoreResult(item.name, searchTerm)
            });
          }
        });
      }

      // ===== TOUJOURS ajouter quelques suggestions génériques =====
      const genericSuggestions = [
        { name: searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1), icon: '🥬' },
        { name: `${searchTerm} bio`, icon: '🌱' },
        { name: `${searchTerm} frais`, icon: '✨' }
      ].slice(0, Math.max(0, 5 - results.length)); // Compléter jusqu'à 5

      genericSuggestions.forEach((item, index) => {
        results.push({
          id: `generic-${index}`,
          type: 'generic',
          name: item.name,
          display_name: item.name,
          category: { name: 'À définir', icon: '📦' },
          primary_unit: defaultUnitForName(item.name),
          source: 'Suggestion générique',
          icon: item.icon,
          score: 5 + index
        });
      });

      // ===== Toujours proposer "Nouveau produit" =====
      results.push({
        id: 'new-product',
        type: 'new',
        name: query.trim(),
        display_name: query.trim(),
        category: { name: 'À définir', icon: '📦' },
        primary_unit: defaultUnitForName(query),
        source: 'Nouveau produit',
        icon: '➕',
        score: 10
      });

      // Score de pertinence
      function scoreResult(name, searchTerm) {
        const n = name.toLowerCase();
        if (n === searchTerm) return 0;
        if (n.startsWith(searchTerm)) return 1;
        if (n.includes(' ' + searchTerm)) return 2;
        if (n.includes(searchTerm)) return 3;
        return 5;
      }

      // Trier par score et prendre les 8 meilleurs
      results.sort((a, b) => a.score - b.score);
      const finalResults = results.slice(0, 8);

      console.log('🎯 Résultats finaux:', finalResults.length);
      console.log('📝 Détail:', finalResults.map(r => ({ name: r.display_name, source: r.source, score: r.score })));

      setSearchResults(finalResults);

    } catch (error) {
      console.error('❌ Erreur globale recherche:', error);
      
      // En cas d'erreur, au moins proposer quelque chose
      setSearchResults([{
        id: 'fallback',
        type: 'new',
        name: query.trim(),
        display_name: `${query.trim()} (création)`,
        category: { name: 'À définir', icon: '📦' },
        primary_unit: defaultUnitForName(query),
        source: 'Création manuelle',
        icon: '➕',
        score: 0
      }]);
    } finally {
      setSearchLoading(false);
    }
  }, [supabase]);

  // Debounce de la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  const calculateExpirationDate = useCallback((product, storageMethod) => {
    if (!product?.shelf_life_days) return '';
    
    const days = product.shelf_life_days[storageMethod] || 
                 product.shelf_life_days.pantry || 
                 7;
    
    return estimateExpiryFromShelfLife(days) || '';
  }, []);

  const chooseDefaultUnit = useCallback((product) => {
    return product?.primary_unit || defaultUnitForName(product?.name || '');
  }, []);

  const chooseDefaultQty = useCallback((unit) => {
    const qtyMap = {
      'pièce': 1,
      'u': 1,
      'g': 250,
      'ml': 250,
      'kg': 1,
      'l': 1
    };
    return qtyMap[unit] || '';
  }, []);

  // Sélection d'un produit
  const handleSelectProduct = useCallback((product) => {
    console.log('✅ Produit sélectionné:', product);
    setSelectedProduct(product);

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
      notes: prev.notes || 'Ajouté automatiquement'
    }));

    setStep(2);
  }, [searchQuery, chooseDefaultUnit, calculateExpirationDate, chooseDefaultQty]);

  // Mise à jour de la date d'expiration
  const handleStorageMethodChange = useCallback((method) => {
    setLotData(prev => ({
      ...prev,
      storage_method: method,
      expiration_date: selectedProduct ? 
        calculateExpirationDate(selectedProduct, method) : 
        prev.expiration_date
    }));
  }, [selectedProduct, calculateExpirationDate]);

  // Création du lot
  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct || !lotData.qty) return;

    setLoading(true);
    console.log('💾 Création lot:', { selectedProduct, lotData });
    
    try {
      const payload = {
        canonical_food_id: selectedProduct.type === 'canonical' ? selectedProduct.id : null,
        display_name: selectedProduct.display_name || selectedProduct.name,
        qty_remaining: parseFloat(lotData.qty),
        unit: lotData.unit,
        effective_expiration: lotData.expiration_date || null,
        location_name: lotData.storage_place || null,
        notes: lotData.notes || null,
        storage_method: lotData.storage_method,
        category_name: selectedProduct.category?.name
      };

      console.log('📤 Payload envoyé:', payload);

      if (onCreate && typeof onCreate === 'function') {
        await onCreate(payload);
        console.log('✅ Lot créé avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du lot:', error);
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
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} />
            <span>Ajouter un produit</span>
          </div>
          <button onClick={handleClose} className="close-btn">
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
              <div className="search-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un produit (ex: tomate, yaourt, riz...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchLoading && <div className="loading">🔄</div>}
              </div>

              {/* Debug info */}
              {searchQuery && (
                <div className="debug-info">
                  <small>🔍 Recherche: "{searchQuery}" • {searchResults.length} résultats • Ouvrez la console F12 pour plus de détails</small>
                </div>
              )}

              {/* Résultats de recherche */}
              {searchResults.length > 0 && (
                <div className="results-list">
                  {searchResults.map((product) => (
                    <div
                      key={`${product.type}-${product.id}`}
                      className={`result-item ${product.type === 'new' ? 'new-item' : ''}`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="result-icon">{product.icon}</div>
                      <div className="result-content">
                        <div className="result-name">
                          {product.display_name}
                          {product.type === 'new' && <span className="new-badge">Nouveau</span>}
                        </div>
                        <div className="result-meta">
                          <span className="source">{product.source}</span>
                          {product.category?.name && (
                            <span className="category">{product.category.name}</span>
                          )}
                          {product.subcategory && (
                            <span className="subcategory">{product.subcategory}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="no-results">
                  <p>Recherche en cours...</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Détails du lot */}
          {step === 2 && selectedProduct && (
            <div className="form-step">
              {/* Récap produit */}
              <div className="product-summary">
                <div className="product-icon">{selectedProduct.icon}</div>
                <div className="product-info">
                  <div className="product-name">{selectedProduct.display_name}</div>
                  <div className="product-source">{selectedProduct.source}</div>
                </div>
                <div className={`confidence-badge ${confidence.tone}`}>
                  <ShieldCheck size={14} />
                  <span>{confidence.label} ({confidence.percent}%)</span>
                </div>
                <button onClick={() => setStep(1)} className="change-btn">
                  Changer
                </button>
              </div>

              {/* Formulaire */}
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
                      <option value="u">pièce</option>
                      <option value="pièce">pièce</option>
                    </select>
                  </div>
                </div>

                {/* Méthode de stockage */}
                <div className="form-group">
                  <label>Méthode de stockage</label>
                  <div className="storage-grid">
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
                        className={`storage-btn ${
                          lotData.storage_method === method.value ? 'active' : ''
                        }`}
                      >
                        <span className="method-icon">{method.icon}</span>
                        <span className="method-label">{method.label}</span>
                      </button>
                    ))}
                  </div>
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
                </div>

                {/* Lieu spécifique */}
                <div className="form-group">
                  <label htmlFor="storage_place">
                    <MapPin size={16} />Lieu (optionnel)
                  </label>
                  <input
                    id="storage_place"
                    type="text"
                    value={lotData.storage_place}
                    onChange={(e) => setLotData(prev => ({ 
                      ...prev, 
                      storage_place: e.target.value 
                    }))}
                    placeholder="ex: étagère du haut, tiroir légumes..."
                    className="form-input"
                  />
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

      <style jsx>{`
        .modal-overlay {
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

        .modal-container {
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
          background: #f8fdf8;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a3a1a;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .close-btn:hover {
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
        }

        .progress-step.active {
          color: #6b9d6b;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .search-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
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
          border-color: #a8c5a8;
          box-shadow: 0 0 0 3px rgba(168, 197, 168, 0.1);
        }

        .loading {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }

        .debug-info {
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: #f0f9ff;
          border-radius: 6px;
          color: #1d4ed8;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .result-item:hover {
          border-color: #c8d8c8;
          background: #f8fdf8;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .result-item.new-item {
          border-style: dashed;
          border-color: #a8c5a8;
          background: rgba(139, 181, 139, 0.05);
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
          flex-shrink: 0;
        }

        .result-content {
          flex: 1;
          min-width: 0;
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
          background: #f0f9f0;
          color: #6b9d6b;
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

        .source, .category, .subcategory {
          background: #f3f4f6;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .category {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .subcategory {
          background: #f0fdf4;
          color: #047857;
        }

        .no-results {
          text-align: center;
          padding: 2rem 1rem;
          color: #6b7280;
        }

        .product-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fdf8;
          border: 1px solid #dcf4dc;
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
          color: #1a3a1a;
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

        .confidence-badge.good {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .confidence-badge.neutral {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .confidence-badge.warning {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
        }

        .change-btn {
          background: none;
          border: 1px solid #d1d5db;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: #6b7280;
        }

        .change-btn:hover {
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
          transition: all 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #a8c5a8;
          box-shadow: 0 0 0 3px rgba(168, 197, 168, 0.1);
        }

        .storage-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .storage-btn {
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

        .storage-btn:hover {
          border-color: #c8d8c8;
        }

        .storage-btn.active {
          border-color: #8bb58b;
          background: #f8fdf8;
        }

        .method-icon {
          font-size: 1.25rem;
        }

        .method-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
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
          border: none;
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
          background: #8bb58b;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #6b9d6b;
        }

        .btn-primary:disabled, .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .modal-container {
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

          .storage-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .storage-btn {
            flex-direction: row;
            padding: 0.75rem;
            justify-content: flex-start;
          }

          .product-summary {
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .form-actions {
            flex-direction: column;
          }

          .result-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}
