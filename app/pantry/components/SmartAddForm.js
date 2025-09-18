// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [lotData, setLotData] = useState({
    qty_remaining: '',
    unit: 'unités',
    storage_method: 'pantry',
    storage_place: 'Garde-manger',
    expiration_date: '',
    notes: ''
  });

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const supabase = createClientComponentClient();

  // Reset quand on ouvre le modal
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setLotData({
        qty_remaining: '',
        unit: 'unités',
        storage_method: 'pantry',
        storage_place: 'Garde-manger',
        expiration_date: '',
        notes: ''
      });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Fonction de recherche améliorée
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const q = query.trim().toLowerCase();
    
    try {
      // Découper en mots
      const words = q.split(/\s+/).filter(w => w.length > 0);
      
      // Recherche directe
      const { data: directResults } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name, category_id, primary_unit')
        .ilike('canonical_name', `%${q}%`)
        .limit(10);

      // Recherche avec mots inversés
      let reverseResults = [];
      if (words.length > 1) {
        const reversed = words.reverse().join(' ');
        const { data: revData } = await supabase
          .from('canonical_foods')
          .select('id, canonical_name, category_id, primary_unit')
          .ilike('canonical_name', `%${reversed}%`)
          .limit(10);
        reverseResults = revData || [];
      }

      // Recherche par mots individuels (pour "terre" et "pomme" séparément)
      let wordResults = [];
      if (words.length > 1) {
        // Créer une requête qui cherche tous les mots
        let queryBuilder = supabase
          .from('canonical_foods')
          .select('id, canonical_name, category_id, primary_unit');
        
        // Ajouter une condition pour chaque mot
        words.forEach((word, index) => {
          if (index === 0) {
            queryBuilder = queryBuilder.ilike('canonical_name', `%${word}%`);
          } else {
            queryBuilder = queryBuilder.ilike('canonical_name', `%${word}%`);
          }
        });
        
        const { data: wData } = await queryBuilder.limit(10);
        wordResults = wData || [];
      }

      // Combiner tous les résultats uniques
      const allResults = [];
      const seenIds = new Set();
      
      [...(directResults || []), ...reverseResults, ...wordResults].forEach(item => {
        if (item && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          
          // Calculer le score
          const name = item.canonical_name.toLowerCase();
          let score = 0;
          
          if (name === q) score = 100;
          else if (name.includes(q)) score = 90;
          else if (words.every(w => name.includes(w))) score = 80;
          else if (words.some(w => name.includes(w))) score = 60;
          else score = 40;
          
          allResults.push({
            id: item.id,
            name: item.canonical_name,
            type: 'canonical',
            matchScore: score,
            primary_unit: item.primary_unit || 'unités'
          });
        }
      });
      
      // Trier par score et limiter
      const sortedResults = allResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);
      
      // Ajouter option nouveau produit si pas de résultat parfait
      if (sortedResults.length === 0 || sortedResults[0].matchScore < 90) {
        sortedResults.push({
          id: 'new',
          name: capitalizeFirst(q),
          type: 'new',
          matchScore: 0,
          primary_unit: 'unités'
        });
      }
      
      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [supabase]);

  // Capitaliser premier mot
  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Debounce recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Utiliser l'unité du produit depuis la base
    setLotData(prev => ({
      ...prev,
      unit: product.primary_unit === 'pièce' ? 'unités' : (product.primary_unit || 'unités')
    }));
  };

  const handleCreateLot = async () => {
    if (!selectedProduct || !lotData.qty_remaining) {
      alert('Veuillez sélectionner un produit et entrer une quantité');
      return;
    }

    setLoading(true);
    
    try {
      const quantity = parseFloat(lotData.qty_remaining) || 0;
      
      // Validation pour les unités (multiple de 0.5)
      if (lotData.unit === 'unités' && quantity % 0.5 !== 0) {
        alert('Pour les unités, utilisez des multiples de 0.5 (0.5, 1, 1.5, 2...)');
        setLoading(false);
        return;
      }
      
      // Si c'est un nouveau produit, le créer d'abord
      let productId = selectedProduct.id;
      if (selectedProduct.type === 'new') {
        const { data: newProduct, error: createError } = await supabase
          .from('canonical_foods')
          .insert([{
            canonical_name: selectedProduct.name,
            primary_unit: lotData.unit,
            category_id: 2 // Légumes par défaut, à améliorer
          }])
          .select()
          .single();
          
        if (createError) {
          alert(`Erreur création produit: ${createError.message}`);
          setLoading(false);
          return;
        }
        
        productId = newProduct.id;
      }
      
      // Créer le lot
      const lotDataToInsert = {
        canonical_food_id: productId,
        qty_remaining: quantity,
        initial_qty: quantity,
        unit: lotData.unit,
        storage_method: lotData.storage_method,
        storage_place: lotData.storage_place,
        expiration_date: lotData.expiration_date || null,
        acquired_on: new Date().toISOString().split('T')[0],
        notes: lotData.notes || '',
        source: 'manual'
      };

      const { data: createdLot, error } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Erreur:', error);
        alert(`Erreur: ${error.message}`);
      } else {
        if (onLotCreated) {
          onLotCreated(createdLot);
        }
        onClose();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-container"
        onMouseDown={(e) => e.stopPropagation()}
      >
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
          <div className={`progress-step ${!selectedProduct ? 'active' : 'done'}`}>
            1. Produit
          </div>
          <div className={`progress-step ${selectedProduct ? 'active' : ''}`}>
            2. Quantité
          </div>
        </div>

        <div className="modal-content">
          {/* Recherche produit - Toujours visible */}
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Ex: tomate, pomme de terre, yaourt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              disabled={selectedProduct !== null}
            />
            {searchLoading && <div className="loading">🔄</div>}
          </div>

          {/* Résultats de recherche */}
          {!selectedProduct && searchResults.length > 0 && (
            <div className="results-list">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className={`result-item ${product.type === 'new' ? 'new-item' : ''}`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="item-icon">
                    {product.type === 'new' ? '➕' : '🥕'}
                  </div>
                  <div className="item-info">
                    <div className="item-name">
                      {product.name}
                      {product.type === 'new' && ' (Nouveau)'}
                    </div>
                    <div className="item-category">
                      {product.type === 'new' ? 'À définir' : 'Légumes'}
                      {product.primary_unit && product.type !== 'new' && ` • ${product.primary_unit}`}
                    </div>
                  </div>
                  {product.matchScore > 0 && (
                    <span className="match-badge">
                      {product.matchScore >= 80 ? '✅' : '🔶'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulaire quantité - Visible quand produit sélectionné */}
          {selectedProduct && (
            <div className="quantity-form">
              <div className="selected-product">
                <div className="product-icon">🥕</div>
                <div className="product-info">
                  <div className="product-name">{selectedProduct.name}</div>
                  <div className="product-badge">
                    {selectedProduct.type === 'new' ? 'Nouveau' : 'Correspondance parfaite'}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedProduct(null);
                    setSearchQuery('');
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }} 
                  className="change-btn"
                >
                  Changer
                </button>
              </div>

              {/* Quantité et unité */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Quantité actuelle</label>
                  <input
                    type="number"
                    step={lotData.unit === 'unités' ? "0.5" : "0.1"}
                    min="0"
                    placeholder="1"
                    value={lotData.qty_remaining}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || '';
                      if (lotData.unit === 'unités' && value) {
                        const rounded = Math.round(value * 2) / 2;
                        setLotData(prev => ({ ...prev, qty_remaining: rounded }));
                      } else {
                        setLotData(prev => ({ ...prev, qty_remaining: value }));
                      }
                    }}
                    className="form-input"
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label>Unité</label>
                  <select
                    value={lotData.unit}
                    onChange={(e) => setLotData(prev => ({ ...prev, unit: e.target.value }))}
                    className="form-select"
                  >
                    <option value="unités">Unités</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>

              {/* Stockage */}
              <div className="form-group">
                <label>📍 Méthode de stockage</label>
                <div className="storage-methods">
                  {[
                    { key: 'pantry', label: 'Garde-manger', icon: '🏠' },
                    { key: 'fridge', label: 'Réfrigérateur', icon: '❄️' },
                    { key: 'freezer', label: 'Congélateur', icon: '🧊' },
                    { key: 'counter', label: 'Plan de travail', icon: '🍴' }
                  ].map(method => (
                    <div
                      key={method.key}
                      className={`storage-method ${lotData.storage_method === method.key ? 'active' : ''}`}
                      onClick={() => setLotData(prev => ({ 
                        ...prev, 
                        storage_method: method.key,
                        storage_place: method.label
                      }))}
                    >
                      <div className="method-icon">{method.icon}</div>
                      <div className="method-label">{method.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date péremption */}
              <div className="form-group">
                <label>📅 Date de péremption</label>
                <input
                  type="date"
                  value={lotData.expiration_date}
                  onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>

              {/* Notes optionnelles */}
              <div className="form-group">
                <label>Notes (optionnel)</label>
                <input
                  type="text"
                  placeholder="Marque, provenance, observations..."
                  value={lotData.notes}
                  onChange={(e) => setLotData(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            {selectedProduct ? 'Retour' : 'Annuler'}
          </button>
          {selectedProduct && (
            <button 
              onClick={handleCreateLot} 
              disabled={!lotData.qty_remaining || loading}
              className="btn btn-primary"
            >
              {loading ? 'Création...' : 'Créer le lot'}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-container {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 6px;
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        .progress-bar {
          display: flex;
          padding: 0 1.5rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .progress-step {
          flex: 1;
          padding: 0.75rem 0;
          text-align: center;
          font-size: 0.875rem;
          color: #6b7280;
          position: relative;
        }

        .progress-step.active {
          color: #059669;
          font-weight: 600;
        }

        .progress-step.done {
          color: #059669;
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
          padding: 1.25rem;
        }

        .search-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .search-input {
          width: 100%;
          padding: 0.625rem 0.875rem 0.625rem 2.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.95rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .search-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .result-item:hover {
          border-color: #059669;
          background: #f0fdf4;
        }

        .result-item.new-item {
          background: #fef3c7;
          border-color: #fbbf24;
        }

        .item-icon {
          font-size: 1.5rem;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 500;
          color: #111827;
        }

        .item-category {
          font-size: 0.813rem;
          color: #6b7280;
        }

        .match-badge {
          font-size: 1rem;
        }

        .selected-product {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem;
          background: #f0fdf4;
          border: 1.5px solid #059669;
          border-radius: 8px;
          margin-bottom: 1.25rem;
        }

        .product-badge {
          font-size: 0.75rem;
          color: #059669;
          font-weight: 500;
        }

        .change-btn {
          background: white;
          border: 1px solid #d1d5db;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.813rem;
        }

        .form-row {
          display: flex;
          gap: 0.875rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          margin-bottom: 1rem;
        }

        .form-group.flex-1 {
          flex: 1;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input, .form-select {
          padding: 0.625rem 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
        }

        .form-input:focus, .form-select:focus {
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
          gap: 0.375rem;
          padding: 0.875rem 0.5rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .storage-method:hover {
          border-color: #9ca3af;
        }

        .storage-method.active {
          border-color: #059669;
          background: #f0fdf4;
        }

        .method-icon {
          font-size: 1.25rem;
        }

        .method-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 0.875rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          font-size: 0.875rem;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-primary {
          background: #059669;
          color: white;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
