// app/pantry/components/SmartAddForm.js - Version mise à jour avec icônes de catégories

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Package } from 'lucide-react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { categoryIconService } from '@/lib/categoryIconService'; // NOUVEAU

export default function SmartAddForm({ isOpen, onClose, onSuccess, locationId }) {
  const supabase = useSupabase();
  
  // États
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [lotData, setLotData] = useState({
    qty_remaining: '',
    initial_qty: '',
    unit: 'g',
    expiration_date: '',
    storage_method: 'pantry',
    notes: ''
  });
  const [isCreatingLot, setIsCreatingLot] = useState(false);

  const searchInputRef = useRef(null);

  // Focus initial
  useEffect(() => {
    if (isOpen && step === 1) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  // Reset au fermeture
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setLotData({
        qty_remaining: '',
        initial_qty: '',
        unit: 'g',
        expiration_date: '',
        storage_method: 'pantry',
        notes: ''
      });
    }
  }, [isOpen]);

  // Fonctions utilitaires
  const calcConfidence = useCallback((query, name) => {
    if (!query || !name) return { percent: 0, label: 'Faible', tone: 'warning' };
    
    const q = query.toLowerCase().trim();
    const n = name.toLowerCase().trim();
    
    let score = 0;
    if (n === q) score = 100;
    else if (n.startsWith(q)) score = 90;
    else if (n.includes(q)) score = 70;
    else {
      const words = q.split(' ');
      const matches = words.filter(w => n.includes(w)).length;
      score = (matches / words.length) * 60;
    }
    
    const percent = Math.round(score);
    const label = percent >= 80 ? 'Élevée' : percent >= 50 ? 'Moyenne' : 'Faible';
    const tone = percent >= 80 ? 'good' : percent >= 50 ? 'neutral' : 'warning';
    return { percent, label, tone };
  }, []);

  const estimateExpiry = useCallback((product, method) => {
    if (!product) return '';
    const map = {
      fridge: product.shelf_life_days_fridge,
      pantry: product.shelf_life_days_pantry,
      freezer: product.shelf_life_days_freezer,
      counter: product.shelf_life_days_pantry ?? product.shelf_life_days_fridge
    };
    const days = map[method] ?? map.pantry ?? 7;
    if (!days || Number.isNaN(days)) return '';
    const d = new Date();
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().slice(0, 10);
  }, []);

  const defaultQtyForUnit = useCallback((unit) => {
    if (!unit) return '';
    const u = unit.toLowerCase();
    if (u === 'u' || u === 'pièce') return 1;
    if (u === 'kg' || u === 'l') return 1;
    if (u === 'g' || u === 'ml') return 250;
    return '';
  }, []);

  // NOUVELLE FONCTION : Enrichir les résultats avec les icônes de catégories
  const enrichResultsWithCategoryIcons = useCallback(async (results) => {
    const enrichedResults = await Promise.all(
      results.map(async (product) => {
        let icon = product.icon || '📦';
        
        // Essayer d'obtenir l'icône depuis le service de catégories
        if (product.category_id) {
          try {
            const categoryIcon = await categoryIconService.getIconById(product.category_id);
            if (categoryIcon && categoryIcon !== '📦') {
              icon = categoryIcon;
            }
          } catch (error) {
            console.warn('Erreur lors de la récupération de l\'icône de catégorie:', error);
          }
        }
        
        // Fallback sur le nom de catégorie
        if (icon === '📦' && product.category?.name) {
          try {
            const categoryIcon = await categoryIconService.getIconByName(product.category.name);
            if (categoryIcon && categoryIcon !== '📦') {
              icon = categoryIcon;
            }
          } catch (error) {
            console.warn('Erreur lors de la récupération de l\'icône par nom:', error);
          }
        }

        return {
          ...product,
          icon
        };
      })
    );
    
    return enrichedResults;
  }, []);

  // Recherche de produits
  const searchProducts = useCallback(
    async (query) => {
      const q = query.trim();
      if (!q) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }
      setSearchLoading(true);
      setSearchError(null);

      try {
        if (!supabase) {
          throw new Error('Service de recherche indisponible');
        }

        const escaped = q.replace(/[%_]/g, '\\$&');

        const normalizeViewRow = (row) => {
          if (!row) return null;
          const canonicalId =
            row.canonical_food_id ?? row.canonical_id ?? row.id ?? row.food_id ?? null;
          if (!canonicalId) return null;

          const nameCandidates = [
            row.display_name,
            row.product_label,
            row.product_name,
            row.canonical_name,
            row.alias_name,
            row.name
          ];
          const baseName = nameCandidates.find(
            (value) => typeof value === 'string' && value.trim().length > 0
          );
          const brandCandidate = [row.product_brand, row.brand].find(
            (value) => typeof value === 'string' && value.trim().length > 0
          );
          const trimmedName = baseName?.trim() ?? '';
          const resolvedName =
            trimmedName &&
            brandCandidate &&
            !trimmedName.toLowerCase().includes(brandCandidate.toLowerCase())
              ? `${trimmedName} (${brandCandidate.trim()})`
              : trimmedName || q;
          const subcategory =
            row.subcategory ?? row.canonical_subcategory ?? row.product_subcategory ?? null;
          const categoryName =
            row.category_name ?? row.category ?? row.product_category ?? subcategory ?? 'Aliment';
          
          // NOUVELLE PARTIE : récupérer category_id depuis les données
          const categoryId = row.category_id ?? null;

          return {
            id: canonicalId,
            type: 'canonical',
            name: resolvedName,
            display_name: resolvedName,
            category: { 
              name: categoryName,
              id: categoryId // AJOUT de l'ID de catégorie
            },
            category_id: categoryId, // AJOUT direct aussi
            subcategory,
            primary_unit: row.primary_unit ?? 'g',
            shelf_life_days_pantry: row.shelf_life_days_pantry,
            shelf_life_days_fridge: row.shelf_life_days_fridge,
            shelf_life_days_freezer: row.shelf_life_days_freezer,
            icon: row.icon ?? row.category_icon ?? '📦'
          };
        };

        // Recherche dans canonical_foods avec jointure sur reference_categories
        const { data: canonicalData, error: canonicalError } = await supabase
          .from('canonical_foods')
          .select(`
            id,
            canonical_name,
            category_id,
            subcategory,
            primary_unit,
            shelf_life_days_pantry,
            shelf_life_days_fridge,
            shelf_life_days_freezer,
            category:reference_categories(id, name, icon, color_hex)
          `)
          .or(`canonical_name.ilike.%${escaped}%,keywords.ilike.%${escaped}%`)
          .limit(10);

        if (canonicalError) throw canonicalError;

        // Normaliser les résultats
        const canonicalResults = (canonicalData || [])
          .map((row) => ({
            id: row.id,
            type: 'canonical',
            name: row.canonical_name,
            display_name: row.canonical_name,
            category: {
              name: row.category?.name || 'Aliment',
              id: row.category_id
            },
            category_id: row.category_id,
            subcategory: row.subcategory,
            primary_unit: row.primary_unit || 'g',
            shelf_life_days_pantry: row.shelf_life_days_pantry,
            shelf_life_days_fridge: row.shelf_life_days_fridge,
            shelf_life_days_freezer: row.shelf_life_days_freezer,
            icon: row.category?.icon || '📦'
          }))
          .filter(Boolean);

        // Tri par pertinence
        const results = canonicalResults.sort((a, b) => {
          const qa = q.toLowerCase();
          const sa = a.name.toLowerCase();
          const sb = b.name.toLowerCase();
          const ra = sa === qa ? 0 : sa.startsWith(qa) ? 1 : sa.includes(qa) ? 2 : 3;
          const rb = sb === qa ? 0 : sb.startsWith(qa) ? 1 : sb.includes(qa) ? 2 : 3;
          return ra - rb;
        });

        // ENRICHISSEMENT avec les icônes de catégories
        const enrichedResults = await enrichResultsWithCategoryIcons(results);

        const withNewOption = [
          ...enrichedResults.slice(0, 11),
          {
            id: 'new-product',
            type: 'new',
            name: q,
            display_name: q,
            category: { name: 'À définir', icon: '📦' },
            primary_unit: 'g',
            icon: '➕'
          }
        ].slice(0, 12);

        setSearchResults(withNewOption);
      } catch (e) {
        console.error('search error', e);
        setSearchError(e?.message || 'Erreur lors de la recherche');
        setSearchResults([
          {
            id: 'new-product',
            type: 'new',
            name: q,
            display_name: `${q}`,
            category: { name: 'À définir', icon: '📦' },
            primary_unit: 'g',
            icon: '➕'
          }
        ]);
      } finally {
        setSearchLoading(false);
      }
    },
    [supabase, enrichResultsWithCategoryIcons]
  );

  // Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    const t = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchProducts]);

  // Sélection
  const handleSelectProduct = useCallback(
    async (product) => {
      // Enrichir le produit sélectionné avec l'icône de catégorie si pas déjà fait
      let enrichedProduct = product;
      if (product.category_id && product.icon === '📦') {
        try {
          const categoryIcon = await categoryIconService.getIconById(product.category_id);
          if (categoryIcon && categoryIcon !== '📦') {
            enrichedProduct = { ...product, icon: categoryIcon };
          }
        } catch (error) {
          console.warn('Erreur lors de l\'enrichissement du produit sélectionné:', error);
        }
      }

      setSelectedProduct(enrichedProduct);
      const conf = calcConfidence(searchQuery, enrichedProduct.name || enrichedProduct.display_name);
      setConfidence(conf);

      const unit = enrichedProduct.primary_unit || 'g';
      const expiry = enrichedProduct.type === 'canonical' ? estimateExpiry(enrichedProduct, 'pantry') : '';
      const qty = defaultQtyForUnit(unit);

      setLotData((prev) => {
        const resolvedQty = prev.qty_remaining || qty || '';
        const resolvedQtyString = resolvedQty === '' ? '' : String(resolvedQty);
        return {
          ...prev,
          unit,
          qty_remaining: resolvedQtyString,
          initial_qty: resolvedQtyString,
          expiration_date: expiry
        };
      });
      setStep(2);
    },
    [searchQuery, calcConfidence, estimateExpiry, defaultQtyForUnit]
  );

  const handleStorageMethodChange = useCallback(
    (method) => {
      setLotData((prev) => ({
        ...prev,
        storage_method: method,
        expiration_date:
          selectedProduct?.type === 'canonical' ?
            estimateExpiry(selectedProduct, method) :
            prev.expiration_date
      }));
    },
    [selectedProduct, estimateExpiry]
  );

  // Création du lot
  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct) return;
    
    setIsCreatingLot(true);
    try {
      const { data, error } = await supabase.rpc('add_smart_lot', {
        p_location_id: locationId,
        p_product_data: selectedProduct,
        p_lot_data: lotData
      });

      if (error) throw error;
      
      onSuccess?.(data);
      onClose();
    } catch (error) {
      console.error('Erreur création lot:', error);
      alert('Erreur lors de la création du lot');
    } finally {
      setIsCreatingLot(false);
    }
  }, [selectedProduct, lotData, locationId, supabase, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="header-title">
            <Package size={24} />
            Ajouter un produit
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Produit</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Quantité</div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Étape 1: Recherche */}
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
                  <small>
                    🔍 Recherche: "{searchQuery}" • {searchResults.length} résultats
                  </small>
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
                          {product.category?.name && <span className="category">{product.category.name}</span>}
                          {product.subcategory && <span className="subcategory">{product.subcategory}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="no-results">
                  <p>Aucun résultat.</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Détails du lot */}
          {step === 2 && selectedProduct && (
            <div className="form-step">
              <div className="product-summary">
                <div className="product-icon">{selectedProduct.icon}</div>
                <div className="product-info">
                  <div className="product-name">{selectedProduct.display_name}</div>
                  <div className="product-source">
                    {selectedProduct.type === 'new' ? 
                      'Nouveau produit' : 
                      `${selectedProduct.category?.name || 'Aliment'}`
                    }
                    {confidence && (
                      <span className={`confidence-badge ${confidence.tone}`}>
                        {confidence.percent}% • {confidence.label}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setStep(1)} 
                  className="change-btn"
                >
                  Changer
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateLot(); }} className="lot-form">
                <div className="form-row">
                  <div className="form-group flex-2">
                    <label>
                      <Package size={16} />
                      Quantité *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={lotData.qty_remaining}
                      onChange={(e) => setLotData(prev => ({ 
                        ...prev, 
                        qty_remaining: e.target.value,
                        initial_qty: e.target.value
                      }))}
                      className="form-input"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Unité</label>
                    <select
                      value={lotData.unit}
                      onChange={(e) => setLotData(prev => ({ ...prev, unit: e.target.value }))}
                      className="form-select"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="pièce">pièce</option>
                      <option value="u">u</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Conservation</label>
                    <select
                      value={lotData.storage_method}
                      onChange={(e) => handleStorageMethodChange(e.target.value)}
                      className="form-select"
                    >
                      <option value="pantry">🏠 Placard</option>
                      <option value="fridge">❄️ Frigo</option>
                      <option value="freezer">🧊 Congélateur</option>
                      <option value="counter">🏪 Plan de travail</option>
                    </select>
                  </div>
                  <div className="form-group flex-1">
                    <label>Date limite</label>
                    <input
                      type="date"
                      value={lotData.expiration_date}
                      onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes (optionnel)</label>
                  <textarea
                    value={lotData.notes}
                    onChange={(e) => setLotData(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-textarea"
                    rows="2"
                    placeholder="ex: Bio, Local, Offre spéciale..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingLot || !lotData.qty_remaining}
                    className="btn-primary"
                  >
                    {isCreatingLot ? 'Création...' : 'Créer le lot'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .modal-overlay { 
          position: fixed; 
          inset: 0; 
          background: rgba(0,0,0,.5); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 1000; 
          padding: 1rem; 
        }
        .modal-container { 
          background: white; 
          border-radius: 16px; 
          box-shadow: 0 20px 40px rgba(0,0,0,.2); 
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
          gap: .5rem; 
          font-size: 1.25rem; 
          font-weight: 600; 
          color: #1a3a1a; 
        }
        .close-btn { 
          background: none; 
          border: none; 
          cursor: pointer; 
          padding: .5rem; 
          border-radius: 8px; 
          color: #6b7280; 
        }
        .close-btn:hover { 
          background: #f3f4f6; 
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
          padding: .5rem; 
          font-size: .875rem; 
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
        }
        .search-input:focus { 
          outline: none; 
          border-color: #a8c5a8; 
          box-shadow: 0 0 0 3px rgba(168,197,168,.1); 
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
          padding: .5rem; 
          border-radius: 6px; 
          font-size: .875rem; 
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
          gap: .5rem; 
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
        }
        .result-item:hover { 
          border-color: #a8c5a8; 
          background: #f8fdf8; 
        }
        .result-item.new-item { 
          border-color: #d1d5db; 
          background: #f9fafb; 
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
          font-weight: 500; 
          color: #1f2937; 
          margin-bottom: .25rem; 
          display: flex; 
          align-items: center; 
          gap: .5rem; 
        }
        .new-badge { 
          background: #dbeafe; 
          color: #1d4ed8; 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-size: .75rem; 
          font-weight: 600; 
        }
        .result-meta { 
          display: flex; 
          gap: .5rem; 
          font-size: .875rem; 
          color: #6b7280; 
        }
        .category { 
          color: #059669; 
        }
        .subcategory { 
          color: #6b7280; 
        }
        .subcategory:before { 
          content: '•'; 
          margin-right: .5rem; 
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
          margin-bottom: .25rem; 
        }
        .product-source { 
          font-size: .875rem; 
          color: #6b7280; 
          display: flex; 
          align-items: center; 
          gap: .5rem; 
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
          gap: .5rem; 
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
          gap: .5rem; 
          font-size: 14px; 
        }
        .form-input, .form-select, .form-textarea { 
          padding: .75rem; 
          border: 1px solid #d1d5db; 
          border-radius: 6px; 
          font-size: 1rem; 
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { 
          outline: none; 
          border-color: #6b9d6b; 
          box-shadow: 0 0 0 3px rgba(107,157,107,.1); 
        }
        .form-textarea { 
          resize: vertical; 
          min-height: 60px; 
        }
        .form-actions { 
          display: flex; 
          gap: 1rem; 
          justify-content: flex-end; 
          margin-top: 1rem; 
          padding-top: 1rem; 
          border-top: 1px solid #e5e7eb; 
        }
        .btn-secondary { 
          padding: .75rem 1.5rem; 
          border: 1px solid #d1d5db; 
          background: white; 
          color: #374151; 
          border-radius: 8px; 
          cursor: pointer; 
          font-weight: 500; 
        }
        .btn-secondary:hover { 
          background: #f9fafb; 
        }
        .btn-primary { 
          padding: .75rem 1.5rem; 
          background: linear-gradient(135deg, #6ba644 0%, #8bc34a 100%); 
          color: white; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-weight: 500; 
        }
        .btn-primary:hover:not(:disabled) { 
          background: linear-gradient(135deg, #5a9439 0%, #7ab239 100%); 
        }
        .btn-primary:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
        }
      `}</style>
    </div>
  );
}
