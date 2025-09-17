// app/pantry/components/SmartAddForm.js - Version corrigée pour l'erreur de relations

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { normalize, similarity } from './pantryUtils';

// [Garde toutes les fonctions d'icônes et de fuzzy matching de la version précédente]
const getCategoryIcon = (categoryId, categoryName, subcategory) => {
  const categoryIcons = {
    1: '🍎', 2: '🥕', 3: '🍄', 4: '🥚', 5: '🌾', 6: '🫘', 7: '🥛', 
    8: '🥩', 9: '🐟', 10: '🌶️', 11: '🫒', 12: '🥫', 13: '🌰', 14: '🍯'
  };
  
  if (categoryId && categoryIcons[categoryId]) {
    return categoryIcons[categoryId];
  }
  
  const specificIcons = {
    'tomate': '🍅', 'tomates': '🍅', 'pomme': '🍎', 'pommes': '🍎',
    'banane': '🍌', 'bananes': '🍌', 'orange': '🍊', 'oranges': '🍊',
    'citron': '🍋', 'citrons': '🍋', 'fraise': '🍓', 'fraises': '🍓',
    'raisin': '🍇', 'raisins': '🍇', 'pêche': '🍑', 'pêches': '🍑',
    'cerise': '🍒', 'cerises': '🍒', 'ananas': '🍍', 'avocat': '🥑', 'avocats': '🥑',
    'carotte': '🥕', 'carottes': '🥕', 'poivron': '🫑', 'poivrons': '🫑',
    'aubergine': '🍆', 'aubergines': '🍆', 'courgette': '🥒', 'courgettes': '🥒',
    'brocoli': '🥦', 'brocolis': '🥦', 'champignon': '🍄', 'champignons': '🍄',
    'oignon': '🧅', 'oignons': '🧅', 'ail': '🧄',
    'pomme de terre': '🥔', 'pommes de terre': '🥔', 'patate': '🥔',
    'pain': '🍞', 'pains': '🍞', 'fromage': '🧀', 'fromages': '🧀',
    'lait': '🥛', 'œuf': '🥚', 'oeufs': '🥚', 'œufs': '🥚',
    'poulet': '🐔', 'bœuf': '🐄', 'boeuf': '🐄', 'porc': '🐷',
    'poisson': '🐟', 'poissons': '🐟', 'saumon': '🐟', 'thon': '🐟',
    'riz': '🍚', 'pâtes': '🍝', 'pates': '🍝', 'huile': '🫒', 'huiles': '🫒',
    'sel': '🧂', 'sucre': '🍯', 'miel': '🍯', 'café': '☕', 'cafe': '☕',
    'thé': '🍵', 'the': '🍵'
  };
  
  const searchTerms = [categoryName, subcategory].filter(Boolean);
  for (const term of searchTerms) {
    if (!term) continue;
    const normalized = normalize(term);
    
    if (specificIcons[normalized]) {
      return specificIcons[normalized];
    }
    
    for (const [key, icon] of Object.entries(specificIcons)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return icon;
      }
    }
  }
  
  if (categoryName) {
    const name = normalize(categoryName);
    const fallbackIcons = {
      'fruits': '🍎', 'fruit': '🍎', 'légumes': '🥕', 'legumes': '🥕', 'légume': '🥕', 'legume': '🥕',
      'champignons': '🍄', 'champignon': '🍄', 'œufs': '🥚', 'oeufs': '🥚', 'oeuf': '🥚', 'œuf': '🥚',
      'céréales': '🌾', 'cereales': '🌾', 'céréale': '🌾', 'cereale': '🌾',
      'légumineuses': '🫘', 'legumineuses': '🫘', 'produits laitiers': '🥛', 'laitiers': '🥛', 'laitier': '🥛', 'lait': '🥛',
      'viandes': '🥩', 'viande': '🥩', 'poissons': '🐟', 'poisson': '🐟',
      'épices': '🌶️', 'epices': '🌶️', 'épice': '🌶️', 'epice': '🌶️',
      'huiles': '🫒', 'huile': '🫒', 'conserves': '🥫', 'conserve': '🥫',
      'noix et graines': '🌰', 'noix': '🌰', 'graines': '🌰', 'graine': '🌰',
      'édulcorants': '🍯', 'edulcorants': '🍯', 'sucre': '🍯'
    };
    
    for (const [key, icon] of Object.entries(fallbackIcons)) {
      if (name.includes(key)) return icon;
    }
  }
  
  return '📦';
};

const fuzzyMatch = (query, text, threshold = 0.4) => {
  if (!query || !text) return 0;
  
  const normalizedQuery = normalize(query);
  const normalizedText = normalize(text);
  
  if (normalizedText === normalizedQuery) return 1.0;
  if (normalizedText.startsWith(normalizedQuery)) return 0.9;
  if (normalizedText.includes(normalizedQuery)) return 0.8;
  
  const jaccardSim = similarity(query, text);
  if (jaccardSim >= threshold) return jaccardSim;
  
  const levenshteinSim = calculateLevenshteinSimilarity(normalizedQuery, normalizedText);
  if (levenshteinSim >= threshold) return levenshteinSim;
  
  return 0;
};

const calculateLevenshteinSimilarity = (a, b) => {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;
  
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  
  const maxLength = Math.max(a.length, b.length);
  return (maxLength - matrix[b.length][a.length]) / maxLength;
};

const capitalizeProduct = (name) => {
  if (!name) return '';
  
  const lowercaseWords = ['de', 'du', 'des', 'le', 'la', 'les', 'et', 'ou', 'à', 'au', 'aux', 'avec', 'sans'];
  
  return name
    .split(' ')
    .map((word, index) => {
      const lowerWord = word.toLowerCase();
      if (index === 0 || !lowercaseWords.includes(lowerWord)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return lowerWord;
    })
    .join(' ');
};

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

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setConfidence({ percent: 0, label: 'Faible', tone: 'warning' });
      setLotData({
        qty_remaining: '',
        initial_qty: '',
        unit: 'g',
        storage_method: 'pantry',
        storage_place: '',
        expiration_date: '',
        notes: ''
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

  // RECHERCHE CORRIGÉE - Solution pour éviter l'erreur de relations multiples
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

        const searchTerms = [
          q,
          normalize(q),
          q.toLowerCase(),
          q.endsWith('s') ? q.slice(0, -1) : q + 's',
          q.replace('é', 'e').replace('è', 'e').replace('ê', 'e'),
        ].filter((term, index, arr) => arr.indexOf(term) === index);

        // ÉTAPE 1 : Récupérer les produits sans jointure pour éviter l'erreur
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
            keywords
          `)
          .or(
            searchTerms.map(term => 
              `canonical_name.ilike.%${term.replace(/[%_]/g, '\\$&')}%,keywords.cs.{${term}}`
            ).join(',')
          )
          .limit(30);

        if (canonicalError) throw canonicalError;

        // ÉTAPE 2 : Récupérer les catégories séparément
        const categoryIds = [...new Set(canonicalData?.map(row => row.category_id).filter(Boolean))];
        let categoriesMap = new Map();

        if (categoryIds.length > 0) {
          const { data: categoriesData } = await supabase
            .from('reference_categories')
            .select('id, name, icon, color_hex')
            .in('id', categoryIds);
            
          categoriesMap = new Map(categoriesData?.map(cat => [cat.id, cat]) || []);
        }

        // ÉTAPE 3 : Combiner et scorer les résultats
        const scoredResults = (canonicalData || [])
          .map((row) => {
            const name = row.canonical_name || '';
            const subcategory = row.subcategory || '';
            const keywords = (row.keywords || []).join(' ');
            
            let score = 0;
            score = Math.max(score, fuzzyMatch(q, name));
            score = Math.max(score, fuzzyMatch(q, subcategory));
            score = Math.max(score, fuzzyMatch(q, keywords) * 0.8);
            
            if (score === 0) return null;
            
            // Récupérer la catégorie
            const category = categoriesMap.get(row.category_id);
            const icon = getCategoryIcon(row.category_id, category?.name, name);
            
            return {
              id: row.id,
              type: 'canonical',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || 'Aliment',
                id: row.category_id,
                icon: category?.icon
              },
              category_id: row.category_id,
              subcategory: row.subcategory,
              primary_unit: row.primary_unit || 'g',
              shelf_life_days_pantry: row.shelf_life_days_pantry,
              shelf_life_days_fridge: row.shelf_life_days_fridge,
              shelf_life_days_freezer: row.shelf_life_days_freezer,
              icon,
              matchScore: score
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10);

        const hasPerfectMatch = scoredResults.some(r => r.matchScore >= 0.9);
        const shouldShowNewOption = !hasPerfectMatch && q.length >= 2;

        const finalResults = shouldShowNewOption ? [
          ...scoredResults,
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
        ] : scoredResults;

        setSearchResults(finalResults);
      } catch (e) {
        console.error('search error', e);
        setSearchError(e?.message || 'Erreur lors de la recherche');
        setSearchResults([
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
        ]);
      } finally {
        setSearchLoading(false);
      }
    },
    [supabase]
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
    (product) => {
      setSelectedProduct(product);
      const conf = calcConfidence(searchQuery, product.name || product.display_name);
      setConfidence(conf);

      const unit = product.primary_unit || 'g';
      const expiry = product.type === 'canonical' ? estimateExpiry(product, 'pantry') : '';
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

  // Création du lot - AUSSI CORRIGÉE pour éviter l'erreur de relations
  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct) return;
    
    setLoading(true);
    try {
      let productToUse = selectedProduct;

      if (selectedProduct.type === 'new') {
        const { data: newProduct, error: createError } = await supabase
          .from('canonical_foods')
          .insert([{
            canonical_name: selectedProduct.name,
            primary_unit: lotData.unit,
            shelf_life_days_pantry: 7,
            shelf_life_days_fridge: 14,
            shelf_life_days_freezer: 180
          }])
          .select()
          .single();

        if (createError) throw createError;
        productToUse = { ...selectedProduct, id: newProduct.id, type: 'canonical' };
      }

      const lotDataToInsert = {
        canonical_food_id: productToUse.type === 'canonical' ? productToUse.id : null,
        qty_remaining: parseFloat(lotData.qty_remaining) || 0,
        initial_qty: parseFloat(lotData.initial_qty || lotData.qty_remaining) || 0,
        unit: lotData.unit || 'g',
        storage_method: lotData.storage_method || 'pantry',
        storage_place: lotData.storage_place || null,
        expiration_date: lotData.expiration_date || null,
        notes: lotData.notes || null,
        acquired_on: new Date().toISOString().split('T')[0]
      };

      // REQUÊTE SIMPLIFIÉE sans jointure complexe
      const { data, error } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (error) throw error;
      
      onLotCreated?.(data);
      onClose();
    } catch (error) {
      console.error('Erreur création lot:', error);
      alert('Erreur lors de la création du lot: ' + (error.message || 'Erreur inconnue'));
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
                          {product.matchScore && product.matchScore >= 0.8 && (
                            <span className="match-badge">Correspondance parfaite</span>
                          )}
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
                  <p>Aucun résultat trouvé.</p>
                </div>
              )}
            </div>
          )}

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
                        <ShieldCheck size={12} />
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

              <div className="lot-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="qty_remaining">
                      <Search size={16} />
                      Quantité *
                    </label>
                    <input
                      ref={qtyInputRef}
                      id="qty_remaining"
                      type="number"
                      step="0.01"
                      min="0"
                      value={lotData.qty_remaining}
                      onChange={(e) => setLotData((prev) => ({ 
                        ...prev, 
                        qty_remaining: e.target.value,
                        initial_qty: e.target.value
                      }))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="unit">Unité</label>
                    <select
                      id="unit"
                      value={lotData.unit}
                      onChange={(e) => setLotData((prev) => ({ ...prev, unit: e.target.value }))}
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

                <div className="form-group">
                  <label>Méthode de conservation</label>
                  <div className="storage-grid">
                    {[
                      { value: 'pantry', label: 'Placard', icon: '🏠' },
                      { value: 'fridge', label: 'Frigo', icon: '❄️' },
                      { value: 'freezer', label: 'Congélateur', icon: '🧊' },
                      { value: 'counter', label: 'Plan de travail', icon: '🏪' }
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => handleStorageMethodChange(m.value)}
                        className={`storage-btn ${lotData.storage_method === m.value ? 'active' : ''}`}
                      >
                        <span className="method-icon">{m.icon}</span>
                        <span className="method-label">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="expiration_date">
                    <Calendar size={16} />
                    Date d'expiration
                  </label>
                  <input
                    id="expiration_date"
                    type="date"
                    value={lotData.expiration_date}
                    onChange={(e) => setLotData((prev) => ({ ...prev, expiration_date: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="storage_place">
                    <MapPin size={16} />
                    Lieu (optionnel)
                  </label>
                  <input
                    id="storage_place"
                    type="text"
                    value={lotData.storage_place}
                    onChange={(e) => setLotData((prev) => ({ ...prev, storage_place: e.target.value }))}
                    placeholder="ex: étagère du haut, tiroir légumes..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes (optionnel)</label>
                  <textarea
                    id="notes"
                    value={lotData.notes}
                    onChange={(e) => setLotData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Marque, origine, particularités..."
                    className="form-textarea"
                    rows="2"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button onClick={() => setStep(1)} className="btn-secondary" disabled={loading}>
                  Retour
                </button>
                <button
                  onClick={handleCreateLot}
                  className="btn-primary"
                  disabled={loading || !lotData.qty_remaining}
                >
                  {loading ? 'Création...' : 'Créer le lot'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styles identiques à la version précédente */}
      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal-container { background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,.2); max-width: 500px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; background: #f8fdf8; }
        .header-title { display: flex; align-items: center; gap: .5rem; font-size: 1.25rem; font-weight: 600; color: #1a3a1a; }
        .close-btn { background: none; border: none; cursor: pointer; padding: .5rem; border-radius: 8px; color: #6b7280; }
        .close-btn:hover { background: #f3f4f6; }
        .progress-bar { display: flex; padding: 1rem 1.5rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .progress-step { flex: 1; text-align: center; padding: .5rem; font-size: .875rem; font-weight: 500; color: #9ca3af; }
        .progress-step.active { color: #6b9d6b; }
        .modal-content { flex: 1; overflow-y: auto; padding: 1.5rem; }
        .search-wrapper { position: relative; margin-bottom: 1rem; }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .search-input { width: 100%; padding: 1rem 1rem 1rem 3rem; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 1rem; }
        .search-input:focus { outline: none; border-color: #a8c5a8; box-shadow: 0 0 0 3px rgba(168,197,168,.1); }
        .loading { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }
        .debug-info { margin-bottom: 1rem; padding: .5rem; background: #f0f9ff; border-radius: 6px; color: #1d4ed8; }
        .error-info { margin-bottom: 1rem; padding: .5rem; background: #fef2f2; border-radius: 6px; color: #b91c1c; }
        .results-list { display: flex; flex-direction: column; gap: .5rem; max-height: 300px; overflow-y: auto; }
        .result-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; background: white; transition: all 0.2s; }
        .result-item:hover { border-color: #c8d8c8; background: #f8fdf8; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .result-item.new-item { border-style: dashed; border-color: #a8c5a8; background: rgba(139,181,139,.05); }
        .result-icon { font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 8px; flex-shrink: 0; }
        .result-content { flex: 1; min-width: 0; }
        .result-name { font-weight: 600; color: #111827; display: flex; align-items: center; gap: .5rem; margin-bottom: .25rem; flex-wrap: wrap; }
        .new-badge { background: #f0f9f0; color: #6b9d6b; padding: 2px 6px; border-radius: 4px; font-size: .75rem; font-weight: 500; }
        .match-badge { background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-size: .75rem; font-weight: 500; }
        .result-meta { font-size: .875rem; color: #6b7280; display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
        .category { background: #eff6ff; color: #1d4ed8; padding: 1px 6px; border-radius: 4px; font-size: .75rem; }
        .subcategory { background: #f0fdf4; color: #047857; padding: 1px 6px; border-radius: 4px; font-size: .75rem; }
        .no-results { text-align: center; padding: 2rem 1rem; color: #6b7280; }
        .product-summary { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fdf8; border: 1px solid #dcf4dc; border-radius: 12px; margin-bottom: 1.5rem; }
        .product-icon { font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 8px; }
        .product-info { flex: 1; }
        .product-name { font-weight: 600; color: #1a3a1a; margin-bottom: .25rem; }
        .product-source { font-size: .875rem; color: #6b7280; display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
        .confidence-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 999px; }
        .confidence-badge.good { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .confidence-badge.neutral { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .confidence-badge.warning { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .change-btn { background: none; border: 1px solid #d1d5db; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; color: #6b7280; transition: all 0.2s; }
        .change-btn:hover { background: #f9fafb; }
        .lot-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: .5rem; }
        .form-group label { font-weight: 500; color: #374151; display: flex; align-items: center; gap: .5rem; font-size: 14px; }
        .form-input, .form-select, .form-textarea { padding: .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; transition: all 0.2s; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #a8c5a8; box-shadow: 0 0 0 3px rgba(168,197,168,.1); }
        .form-textarea { resize: vertical; min-height: 60px; }
        .storage-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; }
        .storage-btn { display: flex; flex-direction: column; align-items: center; gap: .5rem; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; }
        .storage-btn:hover { border-color: #c8d8c8; }
        .storage-btn.active { border-color: #8bb58b; background: #f8fdf8; }
        .method-icon { font-size: 1.25rem; }
        .method-label { font-size: .875rem; font-weight: 500; color: #374151; }
        .form-actions { display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; }
        .btn-secondary, .btn-primary { flex: 1; padding: .75rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-secondary { background: #f9fafb; border: 1px solid #d1d5db; color: #374151; }
        .btn-secondary:hover:not(:disabled) { background: #f3f4f6; }
        .btn-primary { background: linear-gradient(135deg, #6ba644 0%, #8bc34a 100%); color: white; }
        .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #5a9439 0%, #7ab239 100%); transform: translateY(-1px); }
        .btn-primary:disabled, .btn-secondary:disabled { opacity: .5; cursor: not-allowed; }
        
        @media (max-width: 768px) {
          .modal-container { margin: 0; max-height: 100vh; border-radius: 0; }
          .modal-content { padding: 1rem; }
          .form-row { flex-direction: column; gap: .75rem; }
          .storage-grid { grid-template-columns: 1fr; gap: .5rem; }
          .storage-btn { flex-direction: row; padding: .75rem; justify-content: flex-start; }
          .product-summary { flex-wrap: wrap; gap: .75rem; }
          .form-actions { flex-direction: column; }
          .result-meta { flex-direction: column; align-items: flex-start; gap: .25rem; }
          .result-name { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
