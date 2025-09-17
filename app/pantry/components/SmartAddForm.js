// app/pantry/components/SmartAddForm.js - Version corrigée et simplifiée

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { normalize, similarity } from './pantryUtils';

const getCategoryIcon = (categoryId, categoryName, productName) => {
  const categoryIcons = {
    1: '🍎', 2: '🥕', 3: '🍄', 4: '🥚', 5: '🌾', 6: '🫘', 7: '🥛', 
    8: '🥩', 9: '🐟', 10: '🌶️', 11: '🫒', 12: '🥫', 13: '🌰', 14: '🍯'
  };
  
  if (categoryId && categoryIcons[categoryId]) {
    return categoryIcons[categoryId];
  }
  
  const specificIcons = {
    'tomate': '🍅', 'pomme': '🍎', 'banane': '🍌', 'orange': '🍊',
    'citron': '🍋', 'carotte': '🥕', 'pain': '🍞', 'fromage': '🧀'
  };
  
  const searchTerms = [categoryName, productName].filter(Boolean);
  for (const term of searchTerms) {
    if (!term) continue;
    const normalized = normalize(term);
    if (specificIcons[normalized]) return specificIcons[normalized];
  }
  
  return '📦';
};

const capitalizeProduct = (name) => {
  if (!name) return '';
  return name.split(' ').map((word, index) => {
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  }).join(' ');
};

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const [lotData, setLotData] = useState({
    qty_remaining: '',
    initial_qty: '',
    unit: 'g',
    storage_method: 'pantry',
    storage_place: '',
    expiration_date: '',
    notes: ''
  });

  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const supabase = useMemo(() => supabaseClient, []);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setLotData({
        qty_remaining: '', initial_qty: '', unit: 'g', storage_method: 'pantry',
        storage_place: '', expiration_date: '', notes: ''
      });
      setSearchError(null);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (step === 2) setTimeout(() => qtyInputRef.current?.focus(), 100);
  }, [step]);

  const searchProducts = useCallback(async (query) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);

    try {
      console.log('🔍 Début recherche Supabase pour:', q);
      console.log('📊 Client Supabase disponible:', !!supabase);

      if (!supabase) {
        throw new Error('Connexion à la base de données indisponible');
      }

      // Test simple : recherche dans canonical_foods seulement
      const { data, error } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name, primary_unit, category_id')
        .ilike('canonical_name', `%${q}%`)
        .limit(10);

      console.log('📋 Résultats bruts:', { data, error });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw new Error(`Erreur de recherche: ${error.message}`);
      }

      // Transformer les résultats
      const results = [];
      if (data && data.length > 0) {
        data.forEach(row => {
          const icon = getCategoryIcon(row.category_id, null, row.canonical_name);
          results.push({
            id: row.id,
            type: 'canonical',
            name: capitalizeProduct(row.canonical_name),
            display_name: capitalizeProduct(row.canonical_name),
            category: { name: 'Aliment' },
            primary_unit: row.primary_unit || 'g',
            icon
          });
        });
      }

      // Ajouter l'option "nouveau produit"
      if (results.length === 0 || q.length >= 2) {
        results.push({
          id: 'new-product',
          type: 'new',
          name: capitalizeProduct(q),
          display_name: capitalizeProduct(q),
          category: { name: 'À définir' },
          primary_unit: 'g',
          icon: '➕'
        });
      }

      console.log('✅ Résultats finaux:', results);
      setSearchResults(results);

    } catch (e) {
      console.error('💥 Erreur de recherche:', e);
      setSearchError(e?.message || 'Erreur lors de la recherche');
      
      // En cas d'erreur, proposer au moins l'option nouveau produit
      setSearchResults([{
        id: 'new-product',
        type: 'new',
        name: capitalizeProduct(q),
        display_name: capitalizeProduct(q),
        category: { name: 'À définir' },
        primary_unit: 'g',
        icon: '➕'
      }]);
    } finally {
      setSearchLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    const t = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchProducts]);

  const handleSelectProduct = useCallback((product) => {
    console.log('🎯 Produit sélectionné:', product);
    setSelectedProduct(product);
    setLotData(prev => ({
      ...prev,
      unit: product.primary_unit || 'g',
      qty_remaining: '250',
      initial_qty: '250'
    }));
    setStep(2);
  }, []);

  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct) return;
    
    setLoading(true);
    try {
      console.log('💾 Création du lot pour:', selectedProduct);

      let productToUse = selectedProduct;

      // Si c'est un nouveau produit, le créer d'abord
      if (selectedProduct.type === 'new') {
        const { data: newProduct, error: createError } = await supabase
          .from('canonical_foods')
          .insert([{
            canonical_name: selectedProduct.name,
            primary_unit: lotData.unit || 'g'
          }])
          .select()
          .single();

        if (createError) {
          throw new Error(`Erreur création produit: ${createError.message}`);
        }

        productToUse = { ...selectedProduct, id: newProduct.id, type: 'canonical' };
      }

      // Création du lot
      const lotDataToInsert = {
        canonical_food_id: productToUse.id,
        qty_remaining: parseFloat(lotData.qty_remaining) || 0,
        initial_qty: parseFloat(lotData.initial_qty || lotData.qty_remaining) || 0,
        unit: lotData.unit || 'g',
        storage_method: lotData.storage_method || 'pantry',
        storage_place: lotData.storage_place || null,
        expiration_date: lotData.expiration_date || null,
        notes: lotData.notes || null,
        acquired_on: new Date().toISOString().split('T')[0]
      };

      const { data: createdLot, error: lotError } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (lotError) {
        throw new Error(`Erreur création lot: ${lotError.message}`);
      }

      console.log('✅ Lot créé:', createdLot);
      onLotCreated?.(createdLot);
      onClose();
      
    } catch (error) {
      console.error('💥 Erreur création:', error);
      setSearchError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, lotData, supabase, onLotCreated, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="header-title">
            <Plus size={24} />
            Ajouter un produit
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Produit</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Quantité</div>
        </div>

        <div className="modal-content">
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

              {searchQuery && (
                <div className="debug-info">
                  <small>🔍 Recherche: "{searchQuery}" • {searchResults.length} résultats</small>
                </div>
              )}

              {searchError && (
                <div className="error-info">
                  <small>⚠️ {searchError}</small>
                </div>
              )}

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
                          <span className="category">{product.category?.name}</span>
                          <span className="unit">• {product.primary_unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !searchLoading && (
                <div className="no-results">
                  <p>Aucun produit trouvé pour "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div className="quantity-step">
              <div className="product-summary">
                <div className="product-icon">{selectedProduct.icon}</div>
                <div className="product-info">
                  <div className="product-name">{selectedProduct.display_name}</div>
                  <div className="product-source">{selectedProduct.category?.name}</div>
                </div>
                <button onClick={() => setStep(1)} className="change-btn">
                  Changer
                </button>
              </div>

              <div className="lot-form">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="qty">Quantité actuelle</label>
                    <input
                      ref={qtyInputRef}
                      id="qty"
                      type="number"
                      step="0.1"
                      min="0"
                      value={lotData.qty_remaining}
                      onChange={(e) => setLotData(prev => ({
                        ...prev,
                        qty_remaining: e.target.value,
                        initial_qty: prev.initial_qty || e.target.value
                      }))}
                      className="form-input"
                      placeholder="250"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="unit">Unité</label>
                    <select
                      id="unit"
                      value={lotData.unit}
                      onChange={(e) => setLotData(prev => ({ ...prev, unit: e.target.value }))}
                      className="form-select"
                    >
                      <option value="g">grammes (g)</option>
                      <option value="kg">kilogrammes (kg)</option>
                      <option value="ml">millilitres (ml)</option>
                      <option value="l">litres (l)</option>
                      <option value="u">unités</option>
                      <option value="pièce">pièces</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <MapPin size={16} />
                    Méthode de stockage
                  </label>
                  <div className="storage-methods">
                    {[
                      { key: 'pantry', label: 'Garde-manger', icon: '🏠' },
                      { key: 'fridge', label: 'Réfrigérateur', icon: '❄️' },
                      { key: 'freezer', label: 'Congélateur', icon: '🧊' },
                      { key: 'counter', label: 'Plan de travail', icon: '🍳' }
                    ].map(method => (
                      <button
                        key={method.key}
                        type="button"
                        className={`storage-method ${lotData.storage_method === method.key ? 'active' : ''}`}
                        onClick={() => setLotData(prev => ({ ...prev, storage_method: method.key }))}
                      >
                        <span className="method-icon">{method.icon}</span>
                        <span className="method-label">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="expiry">
                    <Calendar size={16} />
                    Date de péremption
                  </label>
                  <input
                    id="expiry"
                    type="date"
                    value={lotData.expiration_date}
                    onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes (optionnel)</label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={lotData.notes}
                    onChange={(e) => setLotData(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-textarea"
                    placeholder="Marque, provenance, observations..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 && (
            <button onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                Retour
              </button>
              <button
                onClick={handleCreateLot}
                disabled={loading || !lotData.qty_remaining}
                className="btn btn-primary"
              >
                {loading ? 'Création...' : 'Créer le lot'}
              </button>
            </>
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
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .close-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 6px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .progress-bar {
          display: flex;
          padding: 0 1.5rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .progress-step {
          flex: 1;
          padding: 1rem 0;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          position: relative;
        }

        .progress-step.active {
          color: #059669;
          font-weight: 600;
        }

        .progress-step.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #059669;
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
          color: #6b7280;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
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

        .debug-info, .error-info {
          margin-bottom: 1rem;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .debug-info {
          background: #f0f9ff;
          color: #0369a1;
        }

        .error-info {
          background: #fef2f2;
          color: #dc2626;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .result-item:hover {
          border-color: #059669;
          background: #f0fdf4;
        }

        .result-item.new-item {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .result-item.new-item:hover {
          border-color: #2563eb;
          background: #dbeafe;
        }

        .result-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
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
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .new-badge {
          background: #3b82f6;
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 999px;
        }

        .result-meta {
          font-size: 0.875rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .category {
          font-weight: 500;
        }

        .unit {
          color: #9ca3af;
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

        .change-btn {
          background: none;
          border: 1px solid #d1d5db;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: #6b7280;
          transition: all 0.2s;
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
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .storage-methods {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
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
          border-color: #9ca3af;
        }

        .storage-method.active {
          border-color: #059669;
          background: #f0fdf4;
        }

        .method-icon {
          font-size: 1.5rem;
        }

        .method-label {
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 1rem;
        }

        .btn-secondary {
          background: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #f3f4f6;
        }

        .btn-primary {
          background: #059669;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #047857;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .modal-container {
            margin: 0;
            border-radius: 0;
            height: 100vh;
            max-height: none;
          }

          .form-row {
            flex-direction: column;
          }

          .storage-methods {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
