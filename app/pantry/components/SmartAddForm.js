// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Plus, Package, Calendar, MapPin, AlertCircle, CheckCircle2, X } from 'lucide-react';

// Composant de recherche unifié pour tous les types de produits
export function SmartAddForm({ onSave, onCancel, locations = [] }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Recherche et sélection de produit
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Données du lot
  const [lotData, setLotData] = useState({
    qty: '',
    unit: 'g',
    storage_method: 'fridge',
    storage_place: '',
    expiration_date: '',
    notes: ''
  });

  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  // Auto-focus sur le champ de recherche au montage
  useEffect(() => {
    if (step === 1 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [step]);

  // Auto-focus sur la quantité quand on passe à l'étape 2
  useEffect(() => {
    if (step === 2 && qtyInputRef.current) {
      setTimeout(() => qtyInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Recherche unifiée dans tous les types de produits avec scoring intelligent
  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setError('');
    
    try {
      const searchTerm = query.trim().toLowerCase();
      
      // Recherche dans les aliments canoniques
      const { data: canonicalResults } = await supabase
        .from('canonical_foods')
        .select(`
          id, canonical_name, 
          category:reference_categories(name, icon, color_hex),
          primary_unit, unit_weight_grams, density_g_per_ml,
          keywords, subcategory, calories_per_100g,
          shelf_life_days_fridge, shelf_life_days_pantry, shelf_life_days_freezer
        `)
        .or(`canonical_name.ilike.%${query}%,keywords.cs.{${query}}`)
        .limit(15);

      // Recherche dans les variétés/cultivars
      const { data: cultivarResults } = await supabase
        .from('cultivars')
        .select(`
          id, cultivar_name, synonyms,
          canonical_food:canonical_foods(
            id, canonical_name, primary_unit, unit_weight_grams, density_g_per_ml,
            category:reference_categories(name, icon, color_hex),
            shelf_life_days_fridge, shelf_life_days_pantry, shelf_life_days_freezer
          )
        `)
        .or(`cultivar_name.ilike.%${query}%,synonyms.cs.{${query}}`)
        .limit(10);

      // Recherche dans les produits génériques
      const { data: genericResults } = await supabase
        .from('generic_products')
        .select(`
          id, name, keywords,
          category:reference_categories(name, icon, color_hex),
          primary_unit, unit_weight_grams, density_g_per_ml
        `)
        .or(`name.ilike.%${query}%,keywords.cs.{${query}}`)
        .limit(10);

      // Formatage et scoring des résultats
      const results = [];

      // Fonction de scoring basée sur la pertinence
      const scoreResult = (name, searchTerm) => {
        const nameLower = name.toLowerCase();
        
        // Correspondance exacte = score parfait
        if (nameLower === searchTerm) return 0;
        
        // Commence par le terme recherché = très bon score
        if (nameLower.startsWith(searchTerm)) return 1;
        
        // Contient le terme au début d'un mot = bon score
        if (nameLower.includes(' ' + searchTerm)) return 2;
        
        // Contient le terme = score moyen
        if (nameLower.includes(searchTerm)) return 3;
        
        // Sinon score par défaut
        return 10;
      };

      // Aliments canoniques
      (canonicalResults || []).forEach(item => {
        const score = scoreResult(item.canonical_name, searchTerm);
        results.push({
          id: item.id,
          type: 'canonical',
          name: item.canonical_name,
          display_name: item.canonical_name,
          subcategory: item.subcategory,
          category: item.category,
          primary_unit: item.primary_unit || 'g',
          unit_weight_grams: item.unit_weight_grams,
          density_g_per_ml: item.density_g_per_ml,
          calories_per_100g: item.calories_per_100g,
          shelf_life_days: {
            fridge: item.shelf_life_days_fridge,
            pantry: item.shelf_life_days_pantry,
            freezer: item.shelf_life_days_freezer
          },
          source: 'Aliment de base',
          icon: '🥬',
          score
        });
      });

      // Variétés/cultivars
      (cultivarResults || []).forEach(item => {
        if (!item.canonical_food) return;
        
        const score = scoreResult(item.cultivar_name, searchTerm);
        results.push({
          id: item.id,
          type: 'cultivar',
          canonical_food_id: item.canonical_food.id,
          name: item.cultivar_name,
          display_name: `${item.cultivar_name} (${item.canonical_food.canonical_name})`,
          category: item.canonical_food.category,
          primary_unit: item.canonical_food.primary_unit || 'g',
          unit_weight_grams: item.canonical_food.unit_weight_grams,
          density_g_per_ml: item.canonical_food.density_g_per_ml,
          shelf_life_days: {
            fridge: item.canonical_food.shelf_life_days_fridge,
            pantry: item.canonical_food.shelf_life_days_pantry,
            freezer: item.canonical_food.shelf_life_days_freezer
          },
          source: 'Variété',
          icon: '🌱',
          score
        });
      });

      // Produits génériques
      (genericResults || []).forEach(item => {
        const score = scoreResult(item.name, searchTerm);
        results.push({
          id: item.id,
          type: 'generic',
          name: item.name,
          display_name: item.name,
          category: item.category,
          primary_unit: item.primary_unit || 'g',
          unit_weight_grams: item.unit_weight_grams,
          density_g_per_ml: item.density_g_per_ml,
          source: 'Produit commerce',
          icon: '📦',
          score
        });
      });

      // Tri par score puis par type (canonique > cultivar > générique)
      results.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        
        const typeOrder = { canonical: 0, cultivar: 1, generic: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      setSearchResults(results.slice(0, 12));
    } catch (err) {
      console.error('Erreur de recherche:', err);
      setError('Erreur lors de la recherche des produits');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Sélection d'un produit
  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setLotData(prev => ({
      ...prev,
      unit: product.primary_unit || 'g',
      // Calcul automatique de la date d'expiration basé sur le stockage
      expiration_date: calculateExpirationDate(product, prev.storage_method)
    }));
    setStep(2);
  }, []);

  // Calcul automatique de la date d'expiration
  const calculateExpirationDate = (product, storageMethod) => {
    if (!product?.shelf_life_days) return '';
    
    const days = product.shelf_life_days[storageMethod] || product.shelf_life_days.fridge || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  };

  // Mise à jour de la date d'expiration quand on change la méthode de stockage
  const handleStorageMethodChange = (method) => {
    setLotData(prev => ({
      ...prev,
      storage_method: method,
      expiration_date: selectedProduct ? calculateExpirationDate(selectedProduct, method) : prev.expiration_date
    }));
  };

  // Création du lot en base
  const handleCreateLot = async () => {
    if (!selectedProduct || !lotData.qty) {
      setError('Produit et quantité requis');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Préparation des données selon le type de produit
      const lotInsertData = {
        qty_remaining: parseFloat(lotData.qty),
        unit: lotData.unit,
        storage_method: lotData.storage_method,
        storage_place: lotData.storage_place || null,
        expiration_date: lotData.expiration_date || null,
        notes: lotData.notes || null,
        source: 'manual',
        created_at: new Date().toISOString()
      };

      // Attribution du bon ID selon le type
      switch (selectedProduct.type) {
        case 'canonical':
          lotInsertData.canonical_food_id = selectedProduct.id;
          break;
        case 'cultivar':
          lotInsertData.cultivar_id = selectedProduct.id;
          break;
        case 'generic':
          lotInsertData.generic_product_id = selectedProduct.id;
          break;
        default:
          throw new Error('Type de produit non reconnu');
      }

      const { data: newLot, error } = await supabase
        .from('inventory_lots')
        .insert([lotInsertData])
        .select(`
          *,
          canonical_food:canonical_foods(canonical_name, category:reference_categories(name, icon, color_hex)),
          cultivar:cultivars(cultivar_name, canonical_food:canonical_foods(canonical_name, category:reference_categories(name, icon, color_hex))),
          generic_product:generic_products(name, category:reference_categories(name, icon, color_hex))
        `)
        .single();

      if (error) throw error;

      setSuccess(`Lot de ${lotData.qty} ${lotData.unit} ajouté avec succès !`);
      
      // Callback vers le parent
      if (onSave) {
        onSave(newLot);
      }

      // Reset après 2 secondes
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (err) {
      console.error('Erreur création lot:', err);
      setError(err.message || 'Erreur lors de la création du lot');
    } finally {
      setLoading(false);
    }
  };

  // Reset du formulaire
  const resetForm = () => {
    setStep(1);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProduct(null);
    setLotData({
      qty: '',
      unit: 'g',
      storage_method: 'fridge',
      storage_place: '',
      expiration_date: '',
      notes: ''
    });
    setError('');
    setSuccess('');
  };

  // Création rapide d'un nouveau produit générique
  const handleCreateQuickProduct = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data: newProduct, error } = await supabase
        .from('generic_products')
        .insert([{
          name: searchQuery.trim(),
          primary_unit: 'g',
          keywords: [searchQuery.trim().toLowerCase()]
        }])
        .select(`
          id, name, primary_unit,
          category:reference_categories(name, icon, color_hex)
        `)
        .single();

      if (error) throw error;

      const product = {
        id: newProduct.id,
        type: 'generic',
        name: newProduct.name,
        display_name: newProduct.name,
        category: newProduct.category,
        primary_unit: newProduct.primary_unit,
        source: 'Nouveau produit',
        icon: '✨'
      };

      handleSelectProduct(product);
    } catch (err) {
      setError('Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="smart-add-success">
        <CheckCircle2 className="success-icon" />
        <p>{success}</p>
        <button onClick={resetForm} className="btn-primary">
          Ajouter un autre produit
        </button>
      </div>
    );
  }

  return (
    <div className="smart-add-form">
      {/* En-tête avec progression */}
      <div className="form-header">
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <Search size={16} />
            <span>Rechercher</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <Package size={16} />
            <span>Détails</span>
          </div>
        </div>
        
        {onCancel && (
          <button onClick={onCancel} className="btn-close">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Étape 1: Recherche de produit */}
      {step === 1 && (
        <div className="search-step">
          <div className="search-input-group">
            <Search className="search-icon" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chercher un produit (ex: tomate, pomme, yaourt...)"
              className="search-input"
              disabled={loading}
            />
            {searchLoading && <div className="loading-spinner" />}
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((product) => (
                <div
                  key={`${product.type}-${product.id}`}
                  onClick={() => handleSelectProduct(product)}
                  className="search-result-item"
                >
                  <div className="product-icon">{product.icon}</div>
                  <div className="product-info">
                    <div className="product-name">{product.display_name}</div>
                    <div className="product-meta">
                      <span className="product-source">{product.source}</span>
                      {product.category && (
                        <span className="product-category">
                          {product.category.name}
                        </span>
                      )}
                      {product.subcategory && (
                        <span className="product-subcategory">
                          {product.subcategory}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="product-unit">{product.primary_unit}</div>
                </div>
              ))}
            </div>
          )}

          {/* Option de création rapide */}
          {searchQuery && !searchLoading && searchResults.length === 0 && (
            <div className="no-results">
              <p>Aucun produit trouvé pour "{searchQuery}"</p>
              <button
                onClick={handleCreateQuickProduct}
                className="btn-create-quick"
                disabled={loading}
              >
                <Plus size={16} />
                Créer "{searchQuery}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Étape 2: Détails du lot */}
      {step === 2 && selectedProduct && (
        <div className="lot-details-step">
          {/* Récapitulatif produit sélectionné */}
          <div className="selected-product-summary">
            <div className="product-icon">{selectedProduct.icon}</div>
            <div>
              <div className="product-name">{selectedProduct.display_name}</div>
              <div className="product-source">{selectedProduct.source}</div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="btn-change"
            >
              Changer
            </button>
          </div>

          {/* Formulaire des détails */}
          <div className="lot-form">
            {/* Quantité et unité */}
            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="qty">Quantité *</label>
                <input
                  ref={qtyInputRef}
                  id="qty"
                  type="number"
                  step="0.1"
                  min="0"
                  value={lotData.qty}
                  onChange={(e) => setLotData(prev => ({ ...prev, qty: e.target.value }))}
                  placeholder="0"
                  className="form-input"
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="unit">Unité</label>
                <select
                  id="unit"
                  value={lotData.unit}
                  onChange={(e) => setLotData(prev => ({ ...prev, unit: e.target.value }))}
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
                    className={`storage-method ${lotData.storage_method === method.value ? 'active' : ''}`}
                  >
                    <span className="method-icon">{method.icon}</span>
                    <span className="method-label">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lieu de stockage spécifique */}
            <div className="form-group">
              <label htmlFor="storage_place">
                <MapPin size={16} />
                Lieu spécifique (optionnel)
              </label>
              <input
                id="storage_place"
                type="text"
                value={lotData.storage_place}
                onChange={(e) => setLotData(prev => ({ ...prev, storage_place: e.target.value }))}
                placeholder="ex: étagère du haut, tiroir à légumes..."
                className="form-input"
              />
            </div>

            {/* Date d'expiration */}
            <div className="form-group">
              <label htmlFor="expiration_date">
                <Calendar size={16} />
                Date d'expiration
              </label>
              <input
                id="expiration_date"
                type="date"
                value={lotData.expiration_date}
                onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                className="form-input"
              />
              {selectedProduct.shelf_life_days && (
                <div className="expiration-hint">
                  Suggestion basée sur la conservation en {lotData.storage_method === 'fridge' ? 'frigo' : 
                    lotData.storage_method === 'pantry' ? 'placard' : 
                    lotData.storage_method === 'freezer' ? 'congélateur' : 'plan de travail'}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes">Notes (optionnel)</label>
              <textarea
                id="notes"
                value={lotData.notes}
                onChange={(e) => setLotData(prev => ({ ...prev, notes: e.target.value }))}
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
              {loading ? 'Ajout...' : 'Ajouter au garde-manger'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .smart-add-form {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
          max-width: 500px;
          width: 100%;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .progress-steps {
          display: flex;
          gap: 20px;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 14px;
          transition: color 0.2s;
        }

        .step.active {
          color: #059669;
        }

        .btn-close {
          background: none;
          border: none;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          color: #6b7280;
        }

        .btn-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 20px;
          border-left: 4px solid #dc2626;
        }

        .search-step, .lot-details-step {
          padding: 20px;
        }

        .search-input-group {
          position: relative;
          margin-bottom: 16px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .loading-spinner {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #059669;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }

        .search-results {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .search-result-item:hover {
          background: #f9fafb;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .product-icon {
          font-size: 20px;
          width: 32px;
          text-align: center;
        }

        .product-info {
          flex: 1;
        }

        .product-name {
          font-weight: 500;
          color: #111827;
          margin-bottom: 2px;
        }

        .product-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .product-source {
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .product-category, .product-subcategory {
          background: #ddd6fe;
          color: #7c3aed;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .product-unit {
          font-size: 12px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .no-results {
          text-align: center;
          padding: 20px;
          color: #6b7280;
        }

        .btn-create-quick {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #059669;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 12px;
          transition: background-color 0.2s;
        }

        .btn-create-quick:hover {
          background: #047857;
        }

        .selected-product-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f0fdf4;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .btn-change {
          background: none;
          border: 1px solid #d1d5db;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: #6b7280;
        }

        .btn-change:hover {
          background: #f9fafb;
        }

        .lot-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.flex-1 { flex: 1; }
        .form-group.flex-2 { flex: 2; }

        .form-group label {
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .form-input, .form-select, .form-textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .storage-methods {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .storage-method {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .storage-method:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .storage-method.active {
          border-color: #059669;
          background: #ecfdf5;
          color: #059669;
        }

        .method-icon {
          font-size: 20px;
        }

        .method-label {
          font-size: 12px;
          font-weight: 500;
        }

        .expiration-hint {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-secondary {
          flex: 1;
          padding: 12px 20px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-primary {
          flex: 2;
          padding: 12px 20px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #047857;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .smart-add-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 20px;
          text-align: center;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .success-icon {
          color: #059669;
          width: 48px;
          height: 48px;
        }

        .smart-add-success p {
          font-size: 16px;
          color: #374151;
          margin: 0;
        }

        .smart-add-success .btn-primary {
          flex: none;
        }
      `}</style>
    </div>
  );
}
