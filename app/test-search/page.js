// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
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
    expiration_date: ''
  });

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const supabase = createClientComponentClient();

  // Reset quand on ouvre le modal
  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setLotData({
        qty_remaining: '',
        unit: 'unités',
        storage_method: 'pantry',
        storage_place: 'Garde-manger',
        expiration_date: ''
      });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Fonction de recherche améliorée pour gérer l'ordre des mots
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const q = query.trim().toLowerCase();
    
    try {
      // Découper la requête en mots
      const words = q.split(/\s+/).filter(w => w.length > 0);
      
      // Créer plusieurs patterns de recherche
      const searchPatterns = new Set();
      
      // Pattern 1: Recherche normale
      searchPatterns.add(`%${q}%`);
      
      // Pattern 2: Mots dans l'ordre inverse
      if (words.length > 1) {
        const reversed = words.slice().reverse().join(' ');
        searchPatterns.add(`%${reversed}%`);
        
        // Pattern 3: Chaque mot individuellement avec %
        const wordPattern = words.map(w => `%${w}%`).join('');
        searchPatterns.add(wordPattern);
      }
      
      // Pattern 4: Recherche avec wildcards entre les mots
      if (words.length > 1) {
        const wildcardPattern = words.join('%');
        searchPatterns.add(`%${wildcardPattern}%`);
      }
      
      const allResults = [];
      const seenIds = new Set();
      
      // Recherche avec tous les patterns
      for (const pattern of searchPatterns) {
        const { data, error } = await supabase
          .from('canonical_foods')
          .select('id, canonical_name, category_id, primary_unit')
          .ilike('canonical_name', pattern)
          .limit(20);
          
        if (data && !error) {
          data.forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              
              // Calculer un score de correspondance
              const name = item.canonical_name.toLowerCase();
              let score = 0;
              
              if (name === q) score = 100;
              else if (name.includes(q)) score = 90;
              else if (words.every(w => name.includes(w))) score = 70;
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
        }
      }
      
      // Trier par score
      const sortedResults = allResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);
      
      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [supabase]);

  // Debounce de la recherche
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
    setLotData(prev => ({
      ...prev,
      unit: product.primary_unit || 'unités'
    }));
    setStep(2);
  };

  const handleCreateLot = async () => {
    if (!selectedProduct || !lotData.qty_remaining) {
      alert('Veuillez sélectionner un produit et entrer une quantité');
      return;
    }

    setLoading(true);
    
    try {
      const quantity = parseFloat(lotData.qty_remaining) || 0;
      
      // Validation pour les unités
      if ((lotData.unit === 'unités' || lotData.unit === 'pièce') && quantity % 0.5 !== 0) {
        alert('Pour les unités, utilisez des multiples de 0.5 (0.5, 1, 1.5, 2...)');
        setLoading(false);
        return;
      }
      
      // Préparer les données pour inventory_lots
      const lotDataToInsert = {
        qty_remaining: quantity,
        initial_qty: quantity, // Même valeur pour simplifier
        unit: lotData.unit,
        storage_method: lotData.storage_method,
        storage_place: lotData.storage_place,
        expiration_date: lotData.expiration_date || null,
        acquired_on: new Date().toISOString().split('T')[0],
        opened_on: null,
        produced_on: null,
        notes: '',
        source: 'manual',
        owner_id: null // Sera rempli automatiquement par Supabase si RLS est configuré
      };
      
      // Ajouter l'ID du produit selon le type
      if (selectedProduct.type === 'canonical') {
        lotDataToInsert.canonical_food_id = selectedProduct.id;
      }

      console.log('Création du lot:', lotDataToInsert);

      const { data: createdLot, error } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Erreur création:', error);
        alert(`Erreur: ${error.message}`);
      } else {
        console.log('Lot créé avec succès:', createdLot);
        
        // Appeler la callback
        if (onLotCreated) {
          onLotCreated(createdLot);
        }
        
        // Fermer le modal
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
          e.preventDefault();
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
                  placeholder="Ex: tomate, pomme de terre, yaourt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchLoading && <div className="loading">🔄</div>}
              </div>

              {searchResults.length > 0 && (
                <div className="results-list">
                  {searchResults.map((product, index) => (
                    <div
                      key={`${product.id}-${index}`}
                      className="result-item"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="item-icon">🍎</div>
                      <div className="item-info">
                        <div className="item-name">{product.name}</div>
                        <div className="item-category">
                          {product.matchScore > 70 ? '✅ Élevée' : '🔶 Moyenne'} ({product.matchScore}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                  Aucun produit trouvé
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div className="quantity-step">
              <div className="selected-product">
                <div className="product-icon">🍎</div>
                <div className="product-info">
                  <div className="product-name">{selectedProduct.name}</div>
                  <div className="product-source">Légumes</div>
                </div>
                <button 
                  onClick={() => { setStep(1); setSelectedProduct(null); }} 
                  className="change-btn"
                >
                  Changer
                </button>
              </div>

              <div className="lot-form">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Quantité actuelle</label>
                    <input
                      type="number"
                      step={(lotData.unit === 'unités' || lotData.unit === 'pièce') ? "0.5" : "0.1"}
                      min="0"
                      placeholder="0"
                      value={lotData.qty_remaining}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        
                        if (lotData.unit === 'unités' || lotData.unit === 'pièce') {
                          const rounded = Math.round(value * 2) / 2;
                          setLotData(prev => ({ 
                            ...prev, 
                            qty_remaining: rounded
                          }));
                        } else {
                          setLotData(prev => ({ 
                            ...prev, 
                            qty_remaining: value
                          }));
                        }
                      }}
                      className="form-input"
                      autoFocus
                    />
                    {(lotData.unit === 'unités' || lotData.unit === 'pièce') && (
                      <small style={{ color: '#666', fontSize: '0.75rem' }}>
                        Par demi-unité (0.5, 1, 1.5, 2...)
                      </small>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Unité</label>
                    <select
                      value={lotData.unit}
                      onChange={(e) => setLotData(prev => ({ ...prev, unit: e.target.value }))}
                      className="form-select"
                    >
                      <option value="unités">Unités</option>
                      <option value="g">Grammes</option>
                      <option value="kg">Kilogrammes</option>
                      <option value="ml">Millilitres</option>
                      <option value="L">Litres</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>📍 Méthode de stockage</label>
                  <div className="storage-methods">
                    {[
                      { key: 'pantry', label: 'Garde-manger', icon: '🏠' },
                      { key: 'fridge', label: 'Réfrigérateur', icon: '❄️' },
                      { key: 'freezer', label: 'Congélateur', icon: '🧊' },
                      { key: 'other', label: 'Plan de travail', icon: '🍴' }
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

                <div className="form-group">
                  <label>📅 Date de péremption (optionnel)</label>
                  <input
                    type="date"
                    value={lotData.expiration_date}
                    onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
            <button onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                Retour
              </button>
              <button 
                onClick={handleCreateLot} 
                disabled={!lotData.qty_remaining || loading}
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
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
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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
        }

        .close-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .progress-bar {
          display: flex;
          padding: 0 1.5rem;
          background: rgba(249, 250, 251, 0.8);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #059669;
        }

        .loading {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
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
          background: rgba(5, 150, 105, 0.05);
        }

        .item-icon {
          font-size: 2rem;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
        }

        .item-category {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .selected-product {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(5, 150, 105, 0.1);
          border: 2px solid #059669;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .product-icon {
          font-size: 2.5rem;
        }

        .product-info {
          flex: 1;
        }

        .product-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .product-source {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .change-btn {
          background: white;
          border: 1px solid #d1d5db;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
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

        .form-input, .form-select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
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
          cursor: pointer;
          transition: all 0.2s;
        }

        .storage-method:hover {
          border-color: #9ca3af;
        }

        .storage-method.active {
          border-color: #059669;
          background: rgba(5, 150, 105, 0.1);
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
