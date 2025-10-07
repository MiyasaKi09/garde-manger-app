// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Package, Home, Snowflake, Archive, Calendar } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './SmartAddForm.css';

// Fonction pour calculer la distance de Levenshtein (détection des fautes de frappe)
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

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
      try {
        const { data } = await supabase
          .from('reference_categories')
          .select('id, name, icon, color_hex')
          .order('sort_priority');
        
        if (data) {
          setCategories(data);
        }
      } catch (error) {
        console.log('Erreur chargement catégories:', error);
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
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Obtenir l'icône de la catégorie
  const getCategoryIcon = useCallback((categoryId, productName) => {
    if (categoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.icon) return category.icon;
    }
    
    // Icônes par défaut basées sur le nom
    const nameIcons = {
      'tomate': '🍅', 'pomme': '🍎', 'carotte': '🥕', 'pomme de terre': '🥔',
      'banane': '🍌', 'fraise': '🍓', 'orange': '🍊', 'citron': '🍋',
      'brocoli': '🥦', 'champignon': '🍄', 'oignon': '🧅', 'ail': '🧄',
      'pain': '🍞', 'fromage': '🧀', 'lait': '🥛', 'oeuf': '🥚',
      'viande': '🥩', 'poulet': '🍗', 'poisson': '🐟', 'riz': '🍚'
    };
    
    if (productName) {
      const nameLower = productName.toLowerCase();
      for (const [key, icon] of Object.entries(nameIcons)) {
        if (nameLower.includes(key)) return icon;
      }
    }
    
    return '📦';
  }, [categories]);

  // Calculer la date d'expiration par défaut
  const getDefaultExpirationDate = useCallback((product, storageMethod) => {
    let days = 7;
    
    if (product) {
      if (storageMethod === 'fridge') {
        days = product.shelf_life_days_fridge || 7;
      } else if (storageMethod === 'freezer') {
        days = product.shelf_life_days_freezer || 90;
      } else {
        days = product.shelf_life_days_pantry || 30;
      }
    }
    
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, []);

  // Recherche de produits améliorée
  const performSearch = useCallback(async (query) => {
    setSearchLoading(true);
    const q = (query || '').trim().toLowerCase();
    
    try {
      // Si pas de query, prendre les 5 produits les plus populaires
      if (!q || q.length === 0) {
        const { data: topProducts } = await supabase
          .from('canonical_foods')
          .select(`
            id, canonical_name, category_id, keywords, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .order('id')
          .limit(5);

        if (topProducts) {
          const results = topProducts.map(food => ({
            id: food.id,
            name: food.canonical_name,
            type: 'canonical',
            category_id: food.category_id,
            matchScore: 50,
            primary_unit: food.primary_unit || 'unités',
            shelf_life_days_pantry: food.shelf_life_days_pantry,
            shelf_life_days_fridge: food.shelf_life_days_fridge,
            shelf_life_days_freezer: food.shelf_life_days_freezer,
            icon: getCategoryIcon(food.category_id, food.canonical_name)
          }));
          setSearchResults(results);
        }
        setSearchLoading(false);
        return;
      }

      const allResults = [];
      const seenNames = new Set();

      // 1. Recherche dans canonical_foods
      const { data: canonicalFoods } = await supabase
        .from('canonical_foods')
        .select(`
          id, canonical_name, category_id, keywords, primary_unit,
          shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
        `)
        .or(`canonical_name.ilike.%${q}%,keywords.cs.{${q}}`)
        .limit(30);

      if (canonicalFoods) {
        canonicalFoods.forEach(food => {
          if (!seenNames.has(food.canonical_name.toLowerCase())) {
            allResults.push({
              ...food,
              type: 'canonical',
              source_name: food.canonical_name
            });
            seenNames.add(food.canonical_name.toLowerCase());
          }
        });
      }

      // 2. Recherche dans archetypes
      try {
        const { data: archetypes } = await supabase
          .from('archetypes')
          .select(`
            id, name, canonical_food_id, shelf_life_days,
            canonical_foods!inner(canonical_name, category_id, primary_unit, keywords)
          `)
          .ilike('name', `%${q}%`)
          .limit(20);

        if (archetypes) {
          archetypes.forEach(archetype => {
            const name = archetype.name.toLowerCase();
            if (!seenNames.has(name)) {
              allResults.push({
                id: `arch_${archetype.id}`,
                canonical_name: archetype.name,
                category_id: archetype.canonical_foods?.category_id,
                primary_unit: archetype.canonical_foods?.primary_unit || 'unités',
                shelf_life_days_pantry: archetype.shelf_life_days,
                shelf_life_days_fridge: archetype.shelf_life_days,
                shelf_life_days_freezer: archetype.shelf_life_days * 10,
                keywords: archetype.canonical_foods?.keywords,
                type: 'archetype',
                source_name: archetype.name
              });
              seenNames.add(name);
            }
          });
        }
      } catch (error) {
        console.log('Pas de table archetypes:', error);
      }

      // 3. Recherche dans cultivars
      try {
        const { data: cultivars } = await supabase
          .from('cultivars')
          .select(`
            id, name, canonical_food_id,
            canonical_foods!inner(canonical_name, category_id, primary_unit, keywords,
              shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer)
          `)
          .ilike('name', `%${q}%`)
          .limit(20);

        if (cultivars) {
          cultivars.forEach(cultivar => {
            const name = cultivar.name.toLowerCase();
            if (!seenNames.has(name)) {
              allResults.push({
                id: `cult_${cultivar.id}`,
                canonical_name: cultivar.name,
                category_id: cultivar.canonical_foods?.category_id,
                primary_unit: cultivar.canonical_foods?.primary_unit || 'unités',
                shelf_life_days_pantry: cultivar.canonical_foods?.shelf_life_days_pantry,
                shelf_life_days_fridge: cultivar.canonical_foods?.shelf_life_days_fridge,
                shelf_life_days_freezer: cultivar.canonical_foods?.shelf_life_days_freezer,
                keywords: cultivar.canonical_foods?.keywords,
                type: 'cultivar',
                source_name: cultivar.name
              });
              seenNames.add(name);
            }
          });
        }
      } catch (error) {
        console.log('Pas de table cultivars:', error);
      }

      // 4. Scorer les résultats avec recherche floue
      const scoredResults = allResults.map(item => {
        const nameLower = item.source_name.toLowerCase();
        let matchScore = 0;

        // Score exact
        if (nameLower === q) {
          matchScore = 100;
        } 
        // Score de début
        else if (nameLower.startsWith(q)) {
          matchScore = 90;
        }
        // Score d'inclusion
        else if (nameLower.includes(q)) {
          matchScore = 70;
        }
        // Score de recherche floue (tolérance aux fautes)
        else {
          const distance = levenshteinDistance(q, nameLower);
          const maxLength = Math.max(q.length, nameLower.length);
          const similarity = (maxLength - distance) / maxLength;
          
          if (similarity > 0.6) { // Seuil de 60% de similarité
            matchScore = Math.floor(similarity * 60);
          }
        }

        // Bonus pour mots-clés
        if (item.keywords && Array.isArray(item.keywords)) {
          const hasKeyword = item.keywords.some(keyword => 
            keyword.toLowerCase().includes(q) || 
            levenshteinDistance(q, keyword.toLowerCase()) <= 2
          );
          if (hasKeyword) matchScore += 15;
        }

        // Bonus par type
        if (item.type === 'canonical') matchScore += 5;
        else if (item.type === 'cultivar') matchScore += 3;

        return {
          id: item.id,
          name: item.source_name,
          type: item.type,
          category_id: item.category_id,
          matchScore,
          primary_unit: item.primary_unit || 'unités',
          shelf_life_days_pantry: item.shelf_life_days_pantry || 30,
          shelf_life_days_fridge: item.shelf_life_days_fridge || 7,
          shelf_life_days_freezer: item.shelf_life_days_freezer || 90,
          icon: getCategoryIcon(item.category_id, item.source_name)
        };
      });

      // Filtrer les résultats avec score > 0 et trier
      let finalResults = scoredResults
        .filter(r => r.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      // Si moins de 5 résultats, compléter avec les plus populaires
      if (finalResults.length < 5) {
        const { data: topProducts } = await supabase
          .from('canonical_foods')
          .select(`
            id, canonical_name, category_id, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .order('id')
          .limit(5 - finalResults.length);

        if (topProducts) {
          const existingNames = new Set(finalResults.map(r => r.name.toLowerCase()));
          topProducts.forEach(food => {
            if (!existingNames.has(food.canonical_name.toLowerCase())) {
              finalResults.push({
                id: food.id,
                name: food.canonical_name,
                type: 'canonical',
                category_id: food.category_id,
                matchScore: 25,
                primary_unit: food.primary_unit || 'unités',
                shelf_life_days_pantry: food.shelf_life_days_pantry || 30,
                shelf_life_days_fridge: food.shelf_life_days_fridge || 7,
                shelf_life_days_freezer: food.shelf_life_days_freezer || 90,
                icon: getCategoryIcon(food.category_id, food.canonical_name)
              });
            }
          });
        }
      }

      setSearchResults(finalResults.slice(0, 5));
      
    } catch (error) {
      console.error('Erreur recherche:', error);
      // En cas d'erreur, essayons une recherche basique
      try {
        const { data: fallbackProducts } = await supabase
          .from('canonical_foods')
          .select('id, canonical_name, category_id, primary_unit')
          .limit(5);
        
        if (fallbackProducts) {
          const results = fallbackProducts.map(food => ({
            id: food.id,
            name: food.canonical_name,
            type: 'canonical',
            category_id: food.category_id,
            matchScore: 20,
            primary_unit: food.primary_unit || 'unités',
            shelf_life_days_pantry: 30,
            shelf_life_days_fridge: 7,
            shelf_life_days_freezer: 90,
            icon: getCategoryIcon(food.category_id, food.canonical_name)
          }));
          setSearchResults(results);
        }
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        setSearchResults([]);
      }
    } finally {
      setSearchLoading(false);
    }
  }, [supabase, getCategoryIcon]);

  // Charger les suggestions initiales quand le modal s'ouvre
  useEffect(() => {
    if (open && step === 1) {
      setTimeout(() => {
        performSearch('');
      }, 200);
    }
  }, [open, step, performSearch]);

  // Debounce de la recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, searchQuery.length === 0 ? 0 : 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Incrémentation intelligente
  const getIncrementValue = (unit) => {
    switch(unit) {
      case 'kg': return 0.1;
      case 'g': return 100;
      case 'ml':
      case 'cl': return 100;
      case 'L': return 0.5;
      case 'unités':
      default: return 0.5;
    }
  };

  // Ajuster la quantité
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
    } else if (lotData.unit === 'unités') {
      newQty = Math.round(newQty * 2) / 2;
    }
    
    setLotData(prev => ({ ...prev, qty_remaining: newQty }));
  };

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
      const quantity = parseFloat(lotData.qty_remaining) || 1;
      
      // Préparer les données pour inventory_lots
      const lotDataToInsert = {
        canonical_food_id: selectedProduct.id,
        qty_remaining: quantity,
        initial_qty: quantity,
        unit: lotData.unit,
        storage_method: lotData.storage_method,
        storage_place: lotData.storage_place,
        expiration_date: lotData.expiration_date || null,
        acquired_on: new Date().toISOString().split('T')[0]
      };

      console.log('Données à insérer:', lotDataToInsert);

      const { data: createdLot, error } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase:', error);
        alert(`Erreur: ${error.message}`);
        return;
      }

      console.log('Lot créé:', createdLot);
      onLotCreated?.(createdLot);
      onClose();
      
    } catch (error) {
      console.error('Erreur création lot:', error);
      alert('Erreur lors de la création du lot');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
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

        <div className="modal-body">
          {step === 1 && (
            <>
              <div className="search-section">
                <div className="search-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tapez le nom d'un produit (tomate, pomme, carotte...) ou laissez vide pour voir les suggestions"
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
                        <div className="product-meta">
                          <span className={`product-type-badge type-${product.type}`}>
                            {product.type === 'canonical' ? 'Base' : 
                             product.type === 'cultivar' ? 'Variété' : 'Produit'}
                          </span>
                          {product.subcategory && (
                            <span className="product-subcategory">{product.subcategory}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!searchLoading && searchResults.length === 0 && (
                    <div className="no-results">
                      {searchQuery ? `Aucun produit trouvé pour "${searchQuery}"` : 'Chargement des suggestions...'}
                    </div>
                  )}
                </div>
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
                    {selectedProduct.subcategory || 'Général'}
                  </div>
                </div>
                <button onClick={() => setStep(1)} className="change-btn">
                  Changer
                </button>
              </div>

              <div className="form-section">
                <div className="quantity-section">
                  <label>Quantité</label>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => adjustQuantity('down')}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={lotData.qty_remaining}
                      onChange={(e) => setLotData(prev => ({ ...prev, qty_remaining: parseFloat(e.target.value) || 0 }))}
                      className="qty-input"
                      step={getIncrementValue(lotData.unit)}
                      min="0"
                    />
                    <button 
                      onClick={() => adjustQuantity('up')}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="unit-section">
                  <label>Unité</label>
                  <select
                    value={lotData.unit}
                    onChange={(e) => setLotData(prev => ({ ...prev, unit: e.target.value }))}
                    className="unit-select"
                  >
                    <option value="unités">Unités</option>
                    <option value="kg">Kilogrammes</option>
                    <option value="g">Grammes</option>
                    <option value="L">Litres</option>
                    <option value="ml">Millilitres</option>
                    <option value="cl">Centilitres</option>
                  </select>
                </div>

                <div className="storage-section">
                  <label>Stockage</label>
                  <div className="storage-methods">
                    <button
                      onClick={() => handleStorageMethodChange('pantry')}
                      className={`storage-btn ${lotData.storage_method === 'pantry' ? 'active' : ''}`}
                    >
                      <Archive size={16} />
                      Garde-manger
                    </button>
                    <button
                      onClick={() => handleStorageMethodChange('fridge')}
                      className={`storage-btn ${lotData.storage_method === 'fridge' ? 'active' : ''}`}
                    >
                      <Home size={16} />
                      Frigo
                    </button>
                    <button
                      onClick={() => handleStorageMethodChange('freezer')}
                      className={`storage-btn ${lotData.storage_method === 'freezer' ? 'active' : ''}`}
                    >
                      <Snowflake size={16} />
                      Congélateur
                    </button>
                  </div>
                </div>

                <div className="expiration-section">
                  <label>Date d'expiration</label>
                  <div className="expiration-input">
                    <Calendar size={16} className="calendar-icon" />
                    <input
                      type="date"
                      value={lotData.expiration_date}
                      onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                      className="date-input"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 && (
            <button onClick={onClose} className="cancel-btn">
              Annuler
            </button>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="back-btn">
                Retour
              </button>
              <button 
                onClick={handleCreateLot} 
                disabled={loading}
                className="create-btn"
              >
                {loading ? 'Création...' : 'Créer le lot'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}