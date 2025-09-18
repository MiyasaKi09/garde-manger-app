// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Package, Home, Snowflake, Archive, Calendar } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './SmartAddForm.css';

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [lotData, setLotData] = useState({
    qty_remaining: 1,
    unit: 'unités',
    storage_method: 'pantry',
    storage_place: 'Garde-manger',
    expiration_date: ''
  });

  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const supabase = createClientComponentClient();

  // Charger les catégories au montage
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from('reference_categories')
        .select('id, name, icon, color_hex')
        .order('sort_priority');
      
      if (data) {
        setCategories(data);
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
        qty_remaining: 1,
        unit: 'unités',
        storage_method: 'pantry',
        storage_place: 'Garde-manger',
        expiration_date: ''
      });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Obtenir l'icône de la catégorie
  const getCategoryIcon = (categoryId, productName) => {
    if (categoryId) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.icon) return category.icon;
    }
    
    // Icônes par défaut basées sur le nom
    const nameIcons = {
      'tomate': '🍅', 'tomatillo': '🍅', 'pomme': '🍎', 'poire': '🍐',
      'banane': '🍌', 'fraise': '🍓', 'cerise': '🍒', 'peche': '🍑',
      'orange': '🍊', 'citron': '🍋', 'ananas': '🍍', 'raisin': '🍇',
      'pasteque': '🍉', 'melon': '🍈', 'kiwi': '🥝', 'mangue': '🥭',
      'carotte': '🥕', 'pomme de terre': '🥔', 'patate': '🥔', 'mais': '🌽',
      'brocoli': '🥦', 'chou': '🥬', 'salade': '🥬', 'concombre': '🥒',
      'poivron': '🫑', 'aubergine': '🍆', 'champignon': '🍄', 'ail': '🧄',
      'oignon': '🧅', 'pain': '🍞', 'baguette': '🥖', 'croissant': '🥐',
      'fromage': '🧀', 'lait': '🥛', 'beurre': '🧈', 'yaourt': '🥛',
      'oeuf': '🥚', 'viande': '🥩', 'poulet': '🍗', 'poisson': '🐟',
      'crevette': '🦐', 'riz': '🍚', 'pates': '🍝', 'pizza': '🍕'
    };
    
    if (productName) {
      const nameLower = productName.toLowerCase();
      for (const [key, icon] of Object.entries(nameIcons)) {
        if (nameLower.includes(key)) return icon;
      }
    }
    
    return '📦';
  };

  // Fonction pour calculer la date d'expiration par défaut
  const getDefaultExpirationDate = useCallback((product, storageMethod) => {
    let days = 7;
    
    if (product) {
      if (storageMethod === 'fridge' || storageMethod === 'Réfrigérateur') {
        days = product.shelf_life_days_fridge || 7;
      } else if (storageMethod === 'freezer' || storageMethod === 'Congélateur') {
        days = product.shelf_life_days_freezer || 90;
      } else {
        days = product.shelf_life_days_pantry || 30;
      }
    }
    
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, []);

  // Fonction d'incrémentation intelligente selon l'unité
  const getIncrementValue = (unit) => {
    switch(unit) {
      case 'kg': return 0.1;
      case 'g': return 100;
      case 'ml':
      case 'cl': return 100;
      case 'L': return 0.5;
      case 'unités':
      case 'pièce':
      default: return 0.5;
    }
  };

  // Fonction pour ajuster la quantité
  const adjustQuantity = (direction) => {
    const increment = getIncrementValue(lotData.unit);
    const currentQty = parseFloat(lotData.qty_remaining) || 0;
    let newQty;
    
    if (direction === 'up') {
      newQty = currentQty + increment;
    } else {
      newQty = Math.max(increment, currentQty - increment);
    }
    
    if (lotData.unit === 'kg') {
      newQty = Math.round(newQty * 10) / 10;
    } else if (lotData.unit === 'unités' || lotData.unit === 'pièce') {
      newQty = Math.round(newQty * 2) / 2;
    }
    
    setLotData(prev => ({ ...prev, qty_remaining: newQty }));
  };

  // Fonction de recherche avec gestion des fautes de frappe
  const searchWithTypo = (searchTerm, targetText) => {
    const search = searchTerm.toLowerCase();
    const target = targetText.toLowerCase();
    
    // Correspondance exacte
    if (target.includes(search)) return true;
    
    // Tolérance pour les fautes de frappe (distance de Levenshtein simplifiée)
    if (search.length >= 3) {
      let differences = 0;
      const minLength = Math.min(search.length, target.length);
      
      for (let i = 0; i < minLength; i++) {
        if (search[i] !== target[i]) differences++;
      }
      
      // Tolérer 1-2 fautes selon la longueur
      const tolerance = search.length <= 4 ? 1 : 2;
      if (differences <= tolerance) return true;
    }
    
    return false;
  };

  // Recherche de produits
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const q = query.trim();
    
    try {
      // Recherche simple avec ilike sur le nom canonique
      const { data: canonicalFoods, error } = await supabase
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
        .ilike('canonical_name', `%${q}%`)
        .limit(50);

      if (error) {
        console.error('Erreur requête Supabase:', error);
        setSearchResults([]);
        return;
      }

      // Ajouter une recherche secondaire sur la sous-catégorie
      const { data: subcategoryResults } = await supabase
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
        .ilike('subcategory', `%${q}%`)
        .limit(20);

      // Combiner les résultats uniques
      const allResults = [...(canonicalFoods || [])];
      const seenIds = new Set(allResults.map(f => f.id));
      
      if (subcategoryResults) {
        subcategoryResults.forEach(food => {
          if (!seenIds.has(food.id)) {
            allResults.push(food);
            seenIds.add(food.id);
          }
        });
      }

      // Filtrer et scorer les résultats
      const results = allResults.map(food => {
        const nameLower = food.canonical_name.toLowerCase();
        const qLower = q.toLowerCase();
        
        // Calculer le score de pertinence
        let matchScore = 0;
        
        if (nameLower === qLower) {
          matchScore = 100;
        } else if (nameLower.startsWith(qLower)) {
          matchScore = 80;
        } else if (nameLower.includes(qLower)) {
          matchScore = 60;
        }
        
        // Bonus pour les mots-clés
        if (food.keywords && Array.isArray(food.keywords)) {
          const hasKeyword = food.keywords.some(keyword => 
            keyword.toLowerCase().includes(qLower)
          );
          if (hasKeyword) matchScore += 20;
        }
        
        // Bonus pour la sous-catégorie
        if (food.subcategory && food.subcategory.toLowerCase().includes(qLower)) {
          matchScore += 15;
        }
        
        return {
          id: food.id,
          name: food.canonical_name,
          type: 'canonical',
          category_id: food.category_id,
          subcategory: food.subcategory,
          matchScore,
          primary_unit: food.primary_unit || 'unités',
          shelf_life_days_pantry: food.shelf_life_days_pantry,
          shelf_life_days_fridge: food.shelf_life_days_fridge,
          shelf_life_days_freezer: food.shelf_life_days_freezer,
          icon: getCategoryIcon(food.category_id, food.canonical_name)
        };
      });
      
      // Trier par score et limiter à 10 résultats
      results.sort((a, b) => b.matchScore - a.matchScore);
      setSearchResults(results.slice(0, 10));
      
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [supabase, categories]);

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
    const preferredUnit = product.primary_unit || 'unités';
    const defaultExpiration = getDefaultExpirationDate(product, lotData.storage_method);
    
    setLotData(prev => ({
      ...prev,
      unit: preferredUnit,
      qty_remaining: 1,
      expiration_date: defaultExpiration
    }));
    
    setStep(2);
  };

  const handleStorageMethodChange = (method) => {
    let place = 'Garde-manger';
    if (method === 'fridge') place = 'Réfrigérateur';
    if (method === 'freezer') place = 'Congélateur';
    
    const newExpiration = getDefaultExpirationDate(selectedProduct, method);
    
    setLotData(prev => ({
      ...prev,
      storage_method: method,
      storage_place: place,
      expiration_date: newExpiration
    }));
  };

  const handleCreateLot = async () => {
    if (!selectedProduct || !lotData.qty_remaining) {
      alert('Veuillez sélectionner un produit et entrer une quantité');
      return;
    }

    setLoading(true);
    
    try {
      // Obtenir l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté pour ajouter des produits');
      }

      const quantity = parseFloat(lotData.qty_remaining) || 0;
      
      // Préparer les données pour inventory_lots
      const lotDataToInsert = {
        qty_remaining: quantity,
        initial_qty: quantity,
        unit: lotData.unit,
        storage_method: lotData.storage_method,
        storage_place: lotData.storage_place,
        expiration_date: lotData.expiration_date || null,
        acquired_on: new Date().toISOString().split('T')[0],
        notes: ''
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
        console.error('Erreur lors de la création:', error);
        if (error.message?.includes('violates row-level security policy')) {
          throw new Error('Erreur de permissions. Assurez-vous d\'être connecté.');
        }
        throw error;
      }

      console.log('Lot créé avec succès:', createdLot);
      
      if (onLotCreated) {
        onLotCreated(createdLot);
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur complète:', error);
      alert(error.message || 'Une erreur est survenue lors de la création du lot');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div 
        ref={modalRef}
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} />
            Ajouter un produit
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Produit</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Quantité</div>
        </div>

        <div className="modal-content">
          {step === 1 && (
            <>
              <div className="search-wrapper">
                <Search size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="tomate, pomme, carotte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {searchLoading && (
                <div className="search-loading">Recherche...</div>
              )}

              <div className="search-results">
                {searchResults.map((product) => (
                  <div
                    key={`${product.type}-${product.id}`}
                    className="product-item"
                    onClick={() => handleProductSelect(product)}
                  >
                    <span className="product-icon">{product.icon}</span>
                    <div className="product-info">
                      <span className="product-name">{product.name}</span>
                      {product.subcategory && (
                        <span className="product-subcategory">{product.subcategory}</span>
                      )}
                    </div>
                  </div>
                ))}
                {searchQuery && !searchLoading && searchResults.length === 0 && (
                  <div className="no-results">
                    Aucun produit trouvé pour "{searchQuery}"
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && selectedProduct && (
            <>
              <div className="selected-product-card">
                <span className="product-icon-large">
                  {getCategoryIcon(selectedProduct.category_id, selectedProduct.name)}
                </span>
                <div className="product-details">
                  <div className="product-name">{selectedProduct.name}</div>
                  <div className="product-category">
                    {selectedProduct.category?.name || selectedProduct.subcategory || 'Général'}
                  </div>
                </div>
                <button onClick={() => setStep(1)} className="change-btn">
                  Changer
                </button>
              </div>

              <div className="form-section">
                <label className="form-label">Quantité actuelle</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => adjustQuantity('down')}
                    className="qty-btn"
                    type="button"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={lotData.qty_remaining}
                    onChange={(e) => setLotData(prev => ({
                      ...prev,
                      qty_remaining: parseFloat(e.target.value) || 0
                    }))}
                    className="qty-input"
                    step={getIncrementValue(lotData.unit)}
                    min={getIncrementValue(lotData.unit)}
                  />
                  <button 
                    onClick={() => adjustQuantity('up')}
                    className="qty-btn"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Unité</label>
                <select
                  value={lotData.unit}
                  onChange={(e) => setLotData(prev => ({
                    ...prev,
                    unit: e.target.value,
                    qty_remaining: 1
                  }))}
                  className="unit-select"
                >
                  <option value="unités">Unités</option>
                  <option value="kg">Kilogrammes</option>
                  <option value="g">Grammes</option>
                  <option value="L">Litres</option>
                  <option value="ml">Millilitres</option>
                </select>
              </div>

              <div className="form-section">
                <label className="form-label">📍 Méthode de stockage</label>
                <div className="storage-buttons">
                  <button
                    type="button"
                    className={`storage-btn ${lotData.storage_method === 'pantry' ? 'active' : ''}`}
                    onClick={() => handleStorageMethodChange('pantry')}
                  >
                    <Home size={20} />
                    <span>Garde-manger</span>
                  </button>
                  <button
                    type="button"
                    className={`storage-btn ${lotData.storage_method === 'fridge' ? 'active' : ''}`}
                    onClick={() => handleStorageMethodChange('fridge')}
                  >
                    <Archive size={20} />
                    <span>Réfrigérateur</span>
                  </button>
                  <button
                    type="button"
                    className={`storage-btn ${lotData.storage_method === 'freezer' ? 'active' : ''}`}
                    onClick={() => handleStorageMethodChange('freezer')}
                  >
                    <Snowflake size={20} />
                    <span>Congélateur</span>
                  </button>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">
                  <Calendar size={14} />
                  Date de péremption
                </label>
                <input
                  type="date"
                  value={lotData.expiration_date}
                  onChange={(e) => setLotData(prev => ({
                    ...prev,
                    expiration_date: e.target.value
                  }))}
                  className="date-input"
                />
              </div>

              <div className="modal-actions">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  Retour
                </button>
                <button 
                  onClick={handleCreateLot} 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Création...' : 'Créer le lot'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
