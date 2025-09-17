// app/pantry/components/SmartAddForm.js - Version avec architecture propre

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { 
  normalize, 
  similarity, 
  getCategoryIcon, 
  capitalizeProduct,
  fuzzyMatch,
  calculateLevenshteinSimilarity 
} from './pantryUtils';

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confidence, setConfidence] = useState({ percent: 0, label: 'Faible', tone: 'warning' });
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
      setConfidence({ percent: 0, label: 'Faible', tone: 'warning' });
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

  const calcConfidence = useCallback((query, name) => {
    if (!query || !name) return { percent: 0, label: 'Faible', tone: 'warning' };
    const score = fuzzyMatch(query, name);
    const percent = Math.round(score * 100);
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
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, []);

  const defaultQtyForUnit = useCallback((unit) => {
    const defaults = { g: 100, kg: 1, ml: 250, l: 1, u: 1, pièce: 1 };
    return defaults[unit] || 1;
  }, []);

  const searchProducts = useCallback(async (q) => {
    if (!q?.trim() || q.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      if (!supabase) throw new Error('Connexion indisponible');

      const normalizedQuery = normalize(q);
      const searchTerms = normalizedQuery.split(' ').filter(term => term.length >= 2);

      const queries = [];

      // Recherche dans les aliments canoniques
      queries.push(
        supabase
          .from('canonical_foods')
          .select(`
            id, canonical_name, primary_unit, category_id,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
            reference_categories!inner(name, icon, color_hex)
          `)
          .or(searchTerms.map(term => `canonical_name.ilike.%${term}%`).join(','))
          .limit(20)
      );

      // Recherche dans les cultivars
      queries.push(
        supabase
          .from('cultivars')
          .select(`
            id, cultivar_name, canonical_food_id,
            canonical_foods!inner(
              primary_unit, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
              reference_categories!inner(name, icon, color_hex)
            )
          `)
          .or(searchTerms.map(term => `cultivar_name.ilike.%${term}%`).join(','))
          .limit(10)
      );

      // Recherche dans les produits génériques
      queries.push(
        supabase
          .from('generic_products')
          .select(`
            id, product_name, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
            reference_categories!inner(name, icon, color_hex)
          `)
          .or(searchTerms.map(term => `product_name.ilike.%${term}%`).join(','))
          .limit(10)
      );

      const results = await Promise.allSettled(queries);

      const allProducts = [];

      // Traitement des résultats canoniques
      if (results[0]?.status === 'fulfilled' && results[0].value?.data) {
        allProducts.push(
          ...results[0].value.data.map(item => ({
            id: item.id,
            type: 'canonical',
            name: item.canonical_name,
            display_name: item.canonical_name,
            primary_unit: item.primary_unit,
            shelf_life_days_pantry: item.shelf_life_days_pantry,
            shelf_life_days_fridge: item.shelf_life_days_fridge,
            shelf_life_days_freezer: item.shelf_life_days_freezer,
            category: {
              name: item.reference_categories?.name || 'Autre',
              icon: item.reference_categories?.icon || '📦',
              color: item.reference_categories?.color_hex || '#6b7280'
            },
            icon: getCategoryIcon(item.reference_categories?.name),
            matchScore: similarity(normalizedQuery, normalize(item.canonical_name))
          }))
        );
      }

      // Traitement des cultivars
      if (results[1]?.status === 'fulfilled' && results[1].value?.data) {
        allProducts.push(
          ...results[1].value.data.map(item => ({
            id: item.id,
            type: 'cultivar',
            name: item.cultivar_name,
            display_name: item.cultivar_name,
            primary_unit: item.canonical_foods?.primary_unit,
            shelf_life_days_pantry: item.canonical_foods?.shelf_life_days_pantry,
            shelf_life_days_fridge: item.canonical_foods?.shelf_life_days_fridge,
            shelf_life_days_freezer: item.canonical_foods?.shelf_life_days_freezer,
            category: {
              name: item.canonical_foods?.reference_categories?.name || 'Autre',
              icon: item.canonical_foods?.reference_categories?.icon || '🌿',
              color: item.canonical_foods?.reference_categories?.color_hex || '#6b7280'
            },
            icon: '🌿',
            matchScore: similarity(normalizedQuery, normalize(item.cultivar_name))
          }))
        );
      }

      // Traitement des produits génériques
      if (results[2]?.status === 'fulfilled' && results[2].value?.data) {
        allProducts.push(
          ...results[2].value.data.map(item => ({
            id: item.id,
            type: 'generic',
            name: item.product_name,
            display_name: item.product_name,
            primary_unit: item.primary_unit,
            shelf_life_days_pantry: item.shelf_life_days_pantry,
            shelf_life_days_fridge: item.shelf_life_days_fridge,
            shelf_life_days_freezer: item.shelf_life_days_freezer,
            category: {
              name: item.reference_categories?.name || 'Autre',
              icon: item.reference_categories?.icon || '🛍️',
              color: item.reference_categories?.color_hex || '#6b7280'
            },
            icon: '🛍️',
            matchScore: similarity(normalizedQuery, normalize(item.product_name))
          }))
        );
      }

      // Tri par score de correspondance
      const sortedResults = allProducts
        .filter(p => p.matchScore > 0.1)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15);

      // Ajout de l'option "créer nouveau produit" si pas de résultats parfaits
      const finalResults = sortedResults.length === 0 || !sortedResults.some(r => r.matchScore > 0.9) ? [
        ...sortedResults,
        {
          id: 'new-product',
          type: 'new',
          name: capitalizeProduct(q),
          display_name: capitalizeProduct(q),
          category: { name: 'À définir', icon: '📦' },
          primary_unit: 'g',
          icon: '➕',
          matchScore: 0
        }
      ] : sortedResults;

      setSearchResults(finalResults);

    } catch (e) {
      console.error('Erreur de recherche:', e);
      setSearchError(e?.message || 'Erreur lors de la recherche');
      
      // En cas d'erreur, proposer au moins l'option nouveau produit
      setSearchResults([{
        id: 'new-product',
        type: 'new',
        name: capitalizeProduct(q),
        display_name: capitalizeProduct(q),
        category: { name: 'À définir', icon: '📦' },
        primary_unit: 'g',
        icon: '➕',
        matchScore: 0
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
    setSelectedProduct(product);
    const conf = calcConfidence(searchQuery, product.name || product.display_name);
    setConfidence(conf);

    const unit = product.primary_unit || 'g';
    const expiry = product.type !== 'new' ? estimateExpiry(product, 'pantry') : '';
    const qty = defaultQtyForUnit(unit);

    setLotData((prev) => {
      const resolvedQty = prev.qty_remaining || qty || '';
      const resolvedQtyString = resolvedQty === '' ? '' : String(resolvedQty);
      return {
        ...prev, unit, qty_remaining: resolvedQtyString,
        initial_qty: resolvedQtyString, expiration_date: expiry
      };
    });
    setStep(2);
  }, [searchQuery, calcConfidence, estimateExpiry, defaultQtyForUnit]);

  const handleStorageMethodChange = useCallback((method) => {
    setLotData((prev) => ({
      ...prev, storage_method: method,
      expiration_date: selectedProduct?.type !== 'new' ?
        estimateExpiry(selectedProduct, method) : prev.expiration_date
    }));
  }, [selectedProduct, estimateExpiry]);

  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct) return;
    
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Connexion à la base de données indisponible');
      }

      let productToUse = selectedProduct;

      // Si c'est un nouveau produit, le créer d'abord
      if (selectedProduct.type === 'new') {
        const { data: newProduct, error: createError } = await supabase
          .from('canonical_foods')
          .insert([{
            canonical_name: selectedProduct.name,
            primary_unit: lotData.unit || 'g',
            shelf_life_days_pantry: 7,
            shelf_life_days_fridge: 14,
            shelf_life_days_freezer: 180
          }])
          .select()
          .single();

        if (createError) {
          throw new Error(`Erreur lors de la création du produit: ${createError.message}`);
        }

        productToUse = { ...selectedProduct, id: newProduct.id, type: 'canonical' };
      }

      // Préparation des données du lot
      const qtyRemaining = parseFloat(lotData.qty_remaining) || 0;
      const initialQty = parseFloat(lotData.initial_qty || lotData.qty_remaining) || qtyRemaining;

      if (qtyRemaining <= 0) {
        throw new Error('La quantité doit être supérieure à 0');
      }

      const lotDataToInsert = {
        qty_remaining: qtyRemaining,
        initial_qty: initialQty,
        unit: lotData.unit || 'g',
        storage_method: lotData.storage_method || 'pantry',
        storage_place: lotData.storage_place || null,
        expiration_date: lotData.expiration_date || null,
        notes: lotData.notes || null,
        acquired_on: new Date().toISOString().split('T')[0]
      };

      // Ajouter l'ID du produit selon son type
      switch (productToUse.type) {
        case 'canonical':
          lotDataToInsert.canonical_food_id = productToUse.id;
          break;
        case 'cultivar':
          lotDataToInsert.cultivar_id = productToUse.id;
          break;
        case 'generic':
          lotDataToInsert.generic_product_id = productToUse.id;
          break;
        case 'derived':
          lotDataToInsert.derived_product_id = productToUse.id;
          break;
        default:
          throw new Error(`Type de produit non reconnu: ${productToUse.type}`);
      }

      // Insertion du lot
      const { data: newLot, error: lotError } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (lotError) {
        throw new Error(`Erreur lors de la création du lot: ${lotError.message}`);
      }

      // Succès
      await onLotCreated?.(newLot);
      onClose();

    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert(error.message || 'Erreur lors de la création du lot');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, lotData, supabase, onLotCreated, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} />
            Ajouter un produit
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="progress-bar">
          <div className={`progress-step ${step === 1 ? 'active' : ''}`}>
            1. Recherche
          </div>
          <div className={`progress-step ${step === 2 ? 'active' : ''}`}>
            2. Détails du lot
          </div>
        </div>

        <div className="modal-content">
          {step === 1 && (
            <div>
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Chercher un produit (ex: tomate, yaourt nature...)"
                  className="search-input"
                />
                {searchLoading && (
                  <div className="loading">⏳</div>
                )}
              </div>

              {searchError && (
                <div className="error-info">
                  ⚠️ {searchError}
                </div>
              )}

              <div className="results-list">
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`result-item ${result.type === 'new' ? 'new-item' : ''}`}
                    onClick={() => handleSelectProduct(result)}
                  >
                    <div className="result-icon">
                      {result.icon}
                    </div>
                    <div className="result-info">
                      <div className="result-name">
                        {result.display_name}
                        {result.type === 'new' && (
                          <span className="new-badge">Nouveau</span>
                        )}
                      </div>
                      <div className="result-meta">
                        {result.category?.name} • Unité: {result.primary_unit || 'g'}
                      </div>
                      {result.matchScore > 0 && (
                        <div className={`confidence-badge confidence-${
                          result.matchScore > 0.8 ? 'good' : 
                          result.matchScore > 0.5 ? 'neutral' : 'warning'
                        }`}>
                          Correspondance: {Math.round(result.matchScore * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div>
              <div className="selected-product">
                <div className="product-header">
                  <span className="product-icon">{selectedProduct.icon}</span>
                  <div>
                    <h3>{selectedProduct.display_name}</h3>
                    <p className="product-category">
                      {selectedProduct.category?.name}
                    </p>
                  </div>
                  <div className={`confidence-indicator confidence-${confidence.tone}`}>
                    <ShieldCheck size={16} />
                    Confiance: {confidence.label} ({confidence.percent}%)
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="change-btn"
                  >
                    Changer
                  </button>
                </div>
              </div>

              <div className="lot-form">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="qty">Quantité restante *</label>
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

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="initial_qty">
                      Quantité initiale
                    </label>
                    <input
                      id="initial_qty"
                      type="number"
                      step="0.1"
                      min="0"
                      value={lotData.initial_qty}
                      onChange={(e) => setLotData(prev => ({ ...prev, initial_qty: e.target.value }))}
                      className="form-input"
                      placeholder={lotData.qty_remaining}
                    />
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
                        onClick={() => handleStorageMethodChange(method.key)}
                      >
                        <span className="method-icon">{method.icon}</span>
                        <span className="method-label">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="storage_place">
                      Emplacement précis (optionnel)
                    </label>
                    <input
                      id="storage_place"
                      type="text"
                      value={lotData.storage_place}
                      onChange={(e) => setLotData(prev => ({ ...prev, storage_place: e.target.value }))}
                      className="form-input"
                      placeholder="Étagère du haut, tiroir à légumes..."
                    />
                  </div>
                  <div className="form-group flex-1">
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
            border-radius: 8px;
            background: #f3f4f6;
          }

          .result-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .result-name {
            font-weight: 600;
            color: #111827;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .new-badge {
            background: #dbeafe;
            color: #1d4ed8;
            padding: 0.125rem 0.5rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .result-meta {
            font-size: 0.875rem;
            color: #6b7280;
          }

          .confidence-badge {
            font-size: 0.75rem;
            padding: 0.125rem 0.5rem;
            border-radius: 999px;
          }

          .confidence-good {
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
          }

          .confidence-neutral {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
          }

          .confidence-warning {
            background: #fff7ed;
            color: #c2410c;
            border: 1px solid #fed7aa;
          }

          .selected-product {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }

          .product-header {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .product-icon {
            font-size: 2rem;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: white;
            border: 2px solid #e5e7eb;
          }

          .product-header h3 {
            margin: 0;
            font-size: 1.25rem;
            color: #111827;
          }

          .product-category {
            margin: 0;
            font-size: 0.875rem;
            color: #6b7280;
          }

          .confidence-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.375rem 0.75rem;
            border-radius: 999px;
            font-size: 0.875rem;
            font-weight: 500;
            margin-left: auto;
          }

          .change-btn {
            background: none;
            border: 1px solid #d1d5db;
            padding: 0.375rem 0.75rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            color: #6b7280;
            transition: all 0.2s;
          }

          .change-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
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
}
