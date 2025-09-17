// app/pantry/components/SmartAddForm.js - Version complète avec design glassmorphisme

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { supabase as supabaseClient, supabaseConfigError } from '@/lib/supabaseClient';

// ========== UTILITAIRES ==========
const normalize = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
};

const calculateLevenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  
  return dp[m][n];
};

const fuzzyMatch = (query, text) => {
  if (!query || !text) return 0;
  
  const q = normalize(query);
  const t = normalize(text);
  
  if (t === q) return 1.0;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.85;
  
  const maxLen = Math.max(q.length, t.length);
  const distance = calculateLevenshteinDistance(q, t);
  const similarity = 1 - (distance / maxLen);
  
  if (distance <= 2) return 0.7;
  if (distance <= 3) return 0.6;
  
  return similarity > 0.5 ? similarity * 0.8 : 0;
};

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
    'citron': '🍋', 'fraise': '🍓', 'raisin': '🍇', 'avocat': '🥑',
    'carotte': '🥕', 'poivron': '🫑', 'aubergine': '🍆', 'courgette': '🥒',
    'brocoli': '🥦', 'champignon': '🍄', 'oignon': '🧅', 'ail': '🧄',
    'patate': '🥔', 'pain': '🍞', 'fromage': '🧀', 'lait': '🥛',
    'oeuf': '🥚', 'poulet': '🐔', 'boeuf': '🥩', 'porc': '🐷',
    'poisson': '🐟', 'riz': '🍚', 'pate': '🍝', 'huile': '🫒',
    'sel': '🧂', 'sucre': '🍬', 'miel': '🍯', 'chocolat': '🍫'
  };
  
  const normalized = normalize(productName || categoryName || '');
  for (const [key, icon] of Object.entries(specificIcons)) {
    if (normalized.includes(key)) return icon;
  }
  
  return '📦';
};

const capitalizeProduct = (name) => {
  if (!name) return '';
  return name
    .split(/[\s-]+/)
    .map((word, index) => {
      if (index === 0 || !['de', 'du', 'des', 'le', 'la', 'les'].includes(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
};

// ========== COMPOSANT PRINCIPAL ==========
export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState(new Map());
  
  const [lotData, setLotData] = useState({
    qty_remaining: '',
    initial_qty: '',
    unit: 'g',
    storage_method: 'pantry',
    expiration_date: ''
  });

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const supabase = useMemo(() => supabaseClient, []);

  // Charger les catégories au montage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await supabase
          .from('reference_categories')
          .select('*');
        
        if (data) {
          const map = new Map();
          data.forEach(cat => {
            map.set(cat.id, {
              id: cat.id,
              name: cat.name,
              icon: cat.icon
            });
          });
          setCategoriesMap(map);
        }
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
      }
    };
    
    loadCategories();
  }, [supabase]);

  // Reset quand on ouvre le modal
  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setLotData({
        qty_remaining: '',
        initial_qty: '',
        unit: 'g',
        storage_method: 'pantry',
        expiration_date: ''
      });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Fonction de recherche
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const q = query.trim();
    const searchPattern = `%${q.split('').join('%')}%`;
    const searchTerm = `%${q}%`;

    try {
      // Recherches parallèles dans toutes les tables
      const searchPromises = [
        // 1. CANONICAL FOODS
        supabase
          .from('canonical_foods')
          .select('id, canonical_name, category_id, subcategory, primary_unit, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer')
          .or(`canonical_name.ilike.${searchTerm},canonical_name.ilike.${searchPattern}`)
          .limit(15),

        // 2. CULTIVARS
        supabase
          .from('cultivars')
          .select('id, cultivar_name, canonical_food_id, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer')
          .or(`cultivar_name.ilike.${searchTerm},cultivar_name.ilike.${searchPattern}`)
          .limit(15),

        // 3. GENERIC PRODUCTS
        supabase
          .from('generic_products')
          .select('id, name, category_id, subcategory, primary_unit, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer')
          .or(`name.ilike.${searchTerm},name.ilike.${searchPattern}`)
          .limit(15),

        // 4. DERIVED PRODUCTS
        supabase
          .from('derived_products')
          .select('id, derived_name, cultivar_id, expected_shelf_life_days')
          .or(`derived_name.ilike.${searchTerm},derived_name.ilike.${searchPattern}`)
          .limit(10)
      ];

      const searchResultsRaw = await Promise.allSettled(searchPromises);

      // Collecter les IDs pour les relations
      const canonicalIds = new Set();
      const cultivarIds = new Set();

      // Extraire les IDs
      if (searchResultsRaw[1].status === 'fulfilled' && searchResultsRaw[1].value?.data) {
        searchResultsRaw[1].value.data.forEach(item => {
          if (item.canonical_food_id) canonicalIds.add(item.canonical_food_id);
        });
      }

      if (searchResultsRaw[3].status === 'fulfilled' && searchResultsRaw[3].value?.data) {
        searchResultsRaw[3].value.data.forEach(item => {
          if (item.cultivar_id) cultivarIds.add(item.cultivar_id);
        });
      }

      // Charger les relations
      const relationPromises = [];
      
      if (canonicalIds.size > 0) {
        relationPromises.push(
          supabase
            .from('canonical_foods')
            .select('id, canonical_name, category_id, subcategory')
            .in('id', Array.from(canonicalIds))
        );
      }

      if (cultivarIds.size > 0) {
        relationPromises.push(
          supabase
            .from('cultivars')
            .select('id, cultivar_name, canonical_food_id')
            .in('id', Array.from(cultivarIds))
        );
      }

      const relationResults = await Promise.allSettled(relationPromises);

      // Créer les maps
      const canonicalMap = new Map();
      const cultivarsMap = new Map();

      if (relationPromises.length > 0 && relationResults[0]?.status === 'fulfilled') {
        relationResults[0].value?.data?.forEach(item => {
          canonicalMap.set(item.id, item);
        });
      }

      if (relationPromises.length > 1 && relationResults[1]?.status === 'fulfilled') {
        relationResults[1].value?.data?.forEach(item => {
          cultivarsMap.set(item.id, item);
        });
      }

      // Traiter les résultats
      const allResults = [];

      // 1. Traiter canonical_foods
      if (searchResultsRaw[0].status === 'fulfilled' && searchResultsRaw[0].value?.data) {
        searchResultsRaw[0].value.data.forEach(row => {
          const name = row.canonical_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.15) {
            const category = categoriesMap.get(row.category_id);
            const icon = getCategoryIcon(row.category_id, category?.name, name);

            allResults.push({
              id: row.id,
              type: 'canonical',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: category?.name || row.subcategory || 'Aliment',
              category_icon: icon,
              shelf_life_days_pantry: row.shelf_life_days_pantry,
              shelf_life_days_fridge: row.shelf_life_days_fridge,
              shelf_life_days_freezer: row.shelf_life_days_freezer,
              icon,
              matchScore: score,
              sourceTable: 'canonical_foods'
            });
          }
        });
      }

      // 2. Traiter cultivars
      if (searchResultsRaw[1].status === 'fulfilled' && searchResultsRaw[1].value?.data) {
        searchResultsRaw[1].value.data.forEach(row => {
          const name = row.cultivar_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.15) {
            const canonical = canonicalMap.get(row.canonical_food_id);
            const category = canonical ? categoriesMap.get(canonical.category_id) : null;
            const icon = getCategoryIcon(canonical?.category_id, category?.name, name);

            allResults.push({
              id: row.id,
              type: 'cultivar',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: category?.name || canonical?.canonical_name || 'Variété',
              category_icon: icon,
              shelf_life_days_pantry: row.shelf_life_days_pantry,
              shelf_life_days_fridge: row.shelf_life_days_fridge,
              shelf_life_days_freezer: row.shelf_life_days_freezer,
              icon,
              matchScore: score,
              sourceTable: 'cultivars'
            });
          }
        });
      }

      // 3. Traiter generic_products
      if (searchResultsRaw[2].status === 'fulfilled' && searchResultsRaw[2].value?.data) {
        searchResultsRaw[2].value.data.forEach(row => {
          const name = row.name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.15) {
            const category = categoriesMap.get(row.category_id);
            const icon = getCategoryIcon(row.category_id, category?.name, name);

            allResults.push({
              id: row.id,
              type: 'generic',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: category?.name || row.subcategory || 'Produit',
              category_icon: icon,
              shelf_life_days_pantry: row.shelf_life_days_pantry,
              shelf_life_days_fridge: row.shelf_life_days_fridge,
              shelf_life_days_freezer: row.shelf_life_days_freezer,
              icon,
              matchScore: score,
              sourceTable: 'generic_products'
            });
          }
        });
      }

      // 4. Traiter derived_products
      if (searchResultsRaw[3].status === 'fulfilled' && searchResultsRaw[3].value?.data) {
        searchResultsRaw[3].value.data.forEach(row => {
          const name = row.derived_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.15) {
            const cultivar = cultivarsMap.get(row.cultivar_id);
            const canonical = cultivar ? canonicalMap.get(cultivar.canonical_food_id) : null;
            const category = canonical ? categoriesMap.get(canonical.category_id) : null;
            const icon = getCategoryIcon(canonical?.category_id, category?.name, name);

            allResults.push({
              id: row.id,
              type: 'derived',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: category?.name || 'Transformé',
              category_icon: icon,
              shelf_life_days_pantry: row.expected_shelf_life_days,
              shelf_life_days_fridge: row.expected_shelf_life_days,
              shelf_life_days_freezer: row.expected_shelf_life_days * 10,
              icon,
              matchScore: score,
              sourceTable: 'derived_products'
            });
          }
        });
      }

      // Trier et limiter
      const sortedResults = allResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 12);

      // Option nouveau produit
      if (sortedResults.length === 0 && q.length >= 2) {
        sortedResults.push({
          id: 'new',
          type: 'new',
          name: capitalizeProduct(q),
          display_name: `➕ Créer "${capitalizeProduct(q)}"`,
          category: 'Nouveau produit',
          icon: '✨',
          isNew: true
        });
      }

      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [supabase, categoriesMap]);

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
      unit: product.primary_unit || 'g'
    }));
    setStep(2);
  };

  const handleCreateLot = async () => {
    if (!selectedProduct || !lotData.qty_remaining) return;

    setLoading(true);
    try {
      let productToUse = selectedProduct;

      // Créer un nouveau produit si nécessaire
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

        if (createError) throw createError;
        productToUse = { ...selectedProduct, id: newProduct.id, type: 'canonical' };
      }

      // Créer le lot
      const lotDataToInsert = {
        qty_remaining: parseFloat(lotData.qty_remaining) || 0,
        initial_qty: parseFloat(lotData.initial_qty || lotData.qty_remaining) || 0,
        unit: lotData.unit || 'g',
        storage_method: lotData.storage_method || 'pantry',
        expiration_date: lotData.expiration_date || null,
        acquired_on: new Date().toISOString().split('T')[0]
      };

      // Ajouter l'ID selon le type
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
      }

      const { data: createdLot, error: lotError } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (lotError) throw lotError;

      if (onLotCreated) {
        onLotCreated(createdLot);
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur création:', error);
      alert(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

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

              {searchResults.length > 0 && (
                <div className="results-list">
                  {searchResults.map((product) => (
                    <div
                      key={`${product.type}-${product.id}`}
                      className={`result-item ${product.type === 'new' ? 'new-item' : ''}`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="item-icon">{product.icon}</div>
                      <div className="item-info">
                        <div className="item-name">{product.display_name}</div>
                        <div className="item-category">{product.category}</div>
                      </div>
                      {product.matchScore && (
                        <div className="item-score">{Math.round(product.matchScore * 100)}%</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div className="quantity-step">
              <div className="selected-product">
                <div className="product-icon">{selectedProduct.icon}</div>
                <div className="product-info">
                  <div className="product-name">{selectedProduct.name}</div>
                  <div className="product-source">{selectedProduct.sourceTable?.replace('_', ' ')}</div>
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
                    <label>Quantité</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={lotData.qty_remaining}
                      onChange={(e) => setLotData(prev => ({ 
                        ...prev, 
                        qty_remaining: e.target.value,
                        initial_qty: e.target.value
                      }))}
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
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                      <option value="pièce">pièce</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>📅 Date d'expiration (optionnel)</label>
                  <input
                    type="date"
                    value={lotData.expiration_date}
                    onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>📍 Emplacement</label>
                  <div className="storage-methods">
                    {[
                      { key: 'pantry', label: 'Garde-manger', icon: '🏠' },
                      { key: 'fridge', label: 'Réfrigérateur', icon: '❄️' },
                      { key: 'freezer', label: 'Congélateur', icon: '🧊' },
                      { key: 'other', label: 'Autre', icon: '📦' }
                    ].map(method => (
                      <div
                        key={method.key}
                        className={`storage-method ${lotData.storage_method === method.key ? 'active' : ''}`}
                        onClick={() => setLotData(prev => ({ ...prev, storage_method: method.key }))}
                      >
                        <div className="method-icon">{method.icon}</div>
                        <div className="method-label">{method.label}</div>
                      </div>
                    ))}
                  </div>
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
          background: rgba(0, 0, 0, 0.05);
          color: #374151;
        }

        .progress-bar {
          display: flex;
          padding: 0 1.5rem;
          background: rgba(249, 250, 251, 0.8);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.8);
        }

        .search-input:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
          background: white;
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
          border-radius: 8px;
          background: rgba(240, 249, 255, 0.8);
          color: #0369a1;
          font-size: 0.75rem;
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
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.8);
        }

        .result-item:hover {
          border-color: #059669;
          background: rgba(240, 253, 244, 0.9);
          transform: translateX(4px);
        }

        .result-item.new-item {
          background: linear-gradient(135deg, rgba(251, 207, 232, 0.2), rgba(219, 234, 254, 0.2));
          border-style: dashed;
        }

        .item-icon {
          font-size: 2rem;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          color: #111827;
        }

        .item-category {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .item-score {
          font-size: 0.75rem;
          color: #059669;
          font-weight: 600;
          background: rgba(240, 253, 244, 0.8);
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
        }

        .selected-product {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(240, 253, 244, 0.5);
          border: 2px solid #059669;
          border-radius: 12px;
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
          color: #1a3a1a;
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
          font-size: 14px;
        }

        .form-input, .form-select {
          padding: 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.8);
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
          background: white;
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
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s;
        }

        .storage-method:hover {
          border-color: #9ca3af;
          background: white;
        }

        .storage-method.active {
          border-color: #059669;
          background: rgba(240, 253, 244, 0.8);
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
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 1rem;
        }

        .btn-secondary {
          background: rgba(249, 250, 251, 0.8);
          color: #374151;
          border: 1px solid rgba(0, 0, 0, 0.1);
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
