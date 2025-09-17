// app/pantry/components/SmartAddForm.js - Version améliorée

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { supabase as supabaseClient, supabaseConfigError } from '@/lib/supabaseClient';

// ========== UTILITAIRES AMÉLIORÉS ==========

const normalize = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
    .replace(/[^a-z0-9\s]/g, '') // Enlève la ponctuation
    .trim();
};

// Calcul de similarité amélioré
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
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  
  return dp[m][n];
};

// Fuzzy match amélioré avec différentes stratégies
const fuzzyMatch = (query, text) => {
  if (!query || !text) return 0;
  
  const q = normalize(query);
  const t = normalize(text);
  
  // Correspondance exacte
  if (t === q) return 1.0;
  
  // Le texte commence par la requête
  if (t.startsWith(q)) return 0.95;
  
  // La requête est contenue dans le texte
  if (t.includes(q)) {
    const positionBonus = 1 - (t.indexOf(q) / t.length) * 0.1;
    return 0.85 * positionBonus;
  }
  
  // Tous les mots de la requête sont dans le texte
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);
  const allWordsFound = qWords.every(qw => 
    tWords.some(tw => tw.includes(qw) || qw.includes(tw))
  );
  if (allWordsFound) return 0.75;
  
  // Distance de Levenshtein pour gérer les fautes de frappe
  const maxLen = Math.max(q.length, t.length);
  const distance = calculateLevenshteinDistance(q, t);
  const similarity = 1 - (distance / maxLen);
  
  // Si la distance est très petite (1-2 caractères), bon score
  if (distance <= 2) return 0.7;
  if (distance <= 3) return 0.6;
  
  // Vérifier si c'est une faute de frappe probable
  if (similarity > 0.7) return similarity * 0.8;
  
  // Vérifier les mots individuels
  let wordScore = 0;
  for (const qWord of qWords) {
    for (const tWord of tWords) {
      const wordDist = calculateLevenshteinDistance(qWord, tWord);
      if (wordDist <= 1) wordScore += 0.3;
      else if (wordDist <= 2) wordScore += 0.2;
    }
  }
  
  return Math.min(wordScore, 0.65);
};

// Fonction améliorée pour obtenir l'icône
const getCategoryIcon = (categoryId, categoryName, productName, categoriesMap) => {
  // Map des icônes par category_id
  const categoryIcons = {
    1: '🍎', 2: '🥕', 3: '🍄', 4: '🥚', 5: '🌾', 6: '🫘', 7: '🥛',
    8: '🥩', 9: '🐟', 10: '🌶️', 11: '🫒', 12: '🥫', 13: '🌰', 14: '🍯'
  };
  
  // Si on a un category_id valide, l'utiliser en priorité
  if (categoryId && categoryIcons[categoryId]) {
    return categoryIcons[categoryId];
  }
  
  // Si on a une catégorie dans le map, utiliser son icône
  if (categoryId && categoriesMap?.has(categoryId)) {
    const category = categoriesMap.get(categoryId);
    if (category?.icon) return category.icon;
  }
  
  // Icônes spécifiques par nom de produit
  const specificIcons = {
    'tomate': '🍅', 'pomme': '🍎', 'banane': '🍌', 'orange': '🍊',
    'citron': '🍋', 'fraise': '🍓', 'raisin': '🍇', 'avocat': '🥑',
    'carotte': '🥕', 'poivron': '🫑', 'aubergine': '🍆', 'courgette': '🥒',
    'brocoli': '🥦', 'champignon': '🍄', 'oignon': '🧅', 'ail': '🧄',
    'patate': '🥔', 'pain': '🍞', 'fromage': '🧀', 'lait': '🥛',
    'oeuf': '🥚', 'poulet': '🐔', 'boeuf': '🥩', 'porc': '🐷',
    'poisson': '🐟', 'riz': '🍚', 'pate': '🍝', 'huile': '🫒',
    'sel': '🧂', 'sucre': '🍬', 'miel': '🍯', 'chocolat': '🍫',
    'cafe': '☕', 'the': '🍵', 'eau': '💧', 'biere': '🍺', 'vin': '🍷'
  };
  
  // Recherche dans le nom du produit
  const searchTerms = [productName, categoryName].filter(Boolean);
  for (const term of searchTerms) {
    if (!term) continue;
    const normalized = normalize(term);
    
    for (const [key, icon] of Object.entries(specificIcons)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return icon;
      }
    }
  }
  
  // Fallback sur le nom de catégorie
  if (categoryName) {
    const name = normalize(categoryName);
    const fallbackIcons = {
      'fruit': '🍎', 'legume': '🥕', 'champignon': '🍄', 'oeuf': '🥚',
      'cereale': '🌾', 'legumineuse': '🫘', 'laitier': '🥛', 'viande': '🥩',
      'poisson': '🐟', 'epice': '🌶️', 'huile': '🫒', 'conserve': '🥫',
      'noix': '🌰', 'edulcorant': '🍯', 'boisson': '🥤', 'condiment': '🧂'
    };
    
    for (const [key, icon] of Object.entries(fallbackIcons)) {
      if (name.includes(key)) return icon;
    }
  }
  
  return '📦';
};

// Capitalisation des noms
const capitalizeProduct = (name) => {
  if (!name) return '';
  return name
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// ========== HOOK DE RECHERCHE AMÉLIORÉ ==========

const useProductSearch = (supabase) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState(new Map());
  const searchTimeoutRef = useRef(null);

  // Charger les catégories au montage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('reference_categories')
          .select('*');
        
        if (data && !error) {
          const map = new Map();
          data.forEach(cat => {
            map.set(cat.id, {
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color_hex: cat.color_hex
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

  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const q = query.trim();
    
    // Pattern de recherche flexible (avec wildcards)
    const searchPattern = `%${q.split('').join('%')}%`;
    const searchTerm = `%${q}%`;

    try {
      // Recherches parallèles dans toutes les tables
      const searchPromises = [
        // 1. CANONICAL FOODS
        supabase
          .from('canonical_foods')
          .select(`
            id, canonical_name, category_id, subcategory, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .or(`canonical_name.ilike.${searchTerm},canonical_name.ilike.${searchPattern}`)
          .limit(15),

        // 2. CULTIVARS
        supabase
          .from('cultivars')
          .select(`
            id, cultivar_name, canonical_food_id,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .or(`cultivar_name.ilike.${searchTerm},cultivar_name.ilike.${searchPattern}`)
          .limit(15),

        // 3. GENERIC PRODUCTS
        supabase
          .from('generic_products')
          .select(`
            id, name, category_id, subcategory, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .or(`name.ilike.${searchTerm},name.ilike.${searchPattern}`)
          .limit(15),

        // 4. DERIVED PRODUCTS
        supabase
          .from('derived_products')
          .select(`
            id, derived_name, cultivar_id, expected_shelf_life_days
          `)
          .or(`derived_name.ilike.${searchTerm},derived_name.ilike.${searchPattern}`)
          .limit(10)
      ];

      const searchResults = await Promise.allSettled(searchPromises);

      // Collecter les IDs pour charger les relations
      const canonicalIds = new Set();
      const cultivarIds = new Set();

      // Extraire les IDs depuis les résultats
      if (searchResults[1].status === 'fulfilled' && searchResults[1].value?.data) {
        searchResults[1].value.data.forEach(item => {
          if (item.canonical_food_id) canonicalIds.add(item.canonical_food_id);
        });
      }

      if (searchResults[3].status === 'fulfilled' && searchResults[3].value?.data) {
        searchResults[3].value.data.forEach(item => {
          if (item.cultivar_id) cultivarIds.add(item.cultivar_id);
        });
      }

      // Charger les relations nécessaires
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

      // Créer les maps de relations
      const canonicalMap = new Map();
      const cultivarsMap = new Map();

      if (relationPromises.length > 0 && relationResults[0]?.status === 'fulfilled' && relationResults[0]?.value?.data) {
        relationResults[0].value.data.forEach(item => {
          canonicalMap.set(item.id, item);
        });
      }

      if (relationPromises.length > 1 && relationResults[1]?.status === 'fulfilled' && relationResults[1]?.value?.data) {
        relationResults[1].value.data.forEach(item => {
          cultivarsMap.set(item.id, item);
        });
      }

      // Traiter et scorer tous les résultats
      const allResults = [];

      // 1. Traiter canonical_foods
      if (searchResults[0].status === 'fulfilled' && searchResults[0].value?.data) {
        searchResults[0].value.data.forEach(row => {
          const name = row.canonical_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.15) { // Seuil plus bas pour plus de flexibilité
            const category = categoriesMap.get(row.category_id);
            const icon = getCategoryIcon(row.category_id, category?.name, name, categoriesMap);

            allResults.push({
              id: row.id,
              type: 'canonical',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || row.subcategory || 'Aliment',
                id: row.category_id,
                icon: icon
              },
              category_id: row.category_id,
              subcategory: row.subcategory,
              primary_unit: row.primary_unit || 'g',
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
      if (searchResults[1].status === 'fulfilled' && searchResults[1].value?.data) {
        searchResults[1].value.data.forEach(row => {
          const name = row.cultivar_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.15) {
            const canonical = canonicalMap.get(row.canonical_food_id);
            const category = canonical ? categoriesMap.get(canonical.category_id) : null;
            const icon = getCategoryIcon(
              canonical?.category_id, 
              category?.name || canonical?.canonical_name, 
              name,
              categoriesMap
            );

            allResults.push({
              id: row.id,
              type: 'cultivar',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || canonical?.canonical_name || 'Variété',
                id: canonical?.category_id,
                icon: icon
              },
              category_id: canonical?.category_id,
              subcategory: canonical?.canonical_name,
              primary_unit: 'pièce',
              shelf_life_days_pantry: row.shelf_life_days_pantry,
              shelf_life_days_fridge: row.shelf_life_days_fridge,
              shelf_life_days_freezer: row.shelf_life_days_freezer,
              icon,
              matchScore: score,
              sourceTable: 'cultivars',
              canonical_food_id: row.canonical_food_id
            });
          }
        });
      }

      // 3. Traiter generic_products
      if (searchResults[2].status === 'fulfilled' && searchResults[2].value?.data) {
        searchResults[2].value.data.forEach(row => {
          const name = row.name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.15) {
            const category = categoriesMap.get(row.category_id);
            const icon = getCategoryIcon(row.category_id, category?.name, name, categoriesMap);

            allResults.push({
              id: row.id,
              type: 'generic',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || row.subcategory || 'Produit',
                id: row.category_id,
                icon: icon
              },
              category_id: row.category_id,
              subcategory: row.subcategory,
              primary_unit: row.primary_unit || 'g',
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
      if (searchResults[3].status === 'fulfilled' && searchResults[3].value?.data) {
        searchResults[3].value.data.forEach(row => {
          const name = row.derived_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.15) {
            const cultivar = cultivarsMap.get(row.cultivar_id);
            const canonical = cultivar ? canonicalMap.get(cultivar.canonical_food_id) : null;
            const category = canonical ? categoriesMap.get(canonical.category_id) : null;
            const icon = getCategoryIcon(
              canonical?.category_id,
              category?.name || canonical?.canonical_name,
              name,
              categoriesMap
            );

            allResults.push({
              id: row.id,
              type: 'derived',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || canonical?.canonical_name || 'Transformé',
                id: canonical?.category_id,
                icon: icon
              },
              category_id: canonical?.category_id,
              subcategory: cultivar?.cultivar_name,
              primary_unit: 'g',
              shelf_life_days_pantry: row.expected_shelf_life_days,
              shelf_life_days_fridge: row.expected_shelf_life_days,
              shelf_life_days_freezer: row.expected_shelf_life_days * 10,
              icon,
              matchScore: score,
              sourceTable: 'derived_products',
              cultivar_id: row.cultivar_id
            });
          }
        });
      }

      // Trier par score et prendre les meilleurs résultats
      const sortedResults = allResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15);

      // Ajouter l'option "nouveau produit" si pertinent
      const hasPerfectMatch = sortedResults.some(r => r.matchScore >= 0.95);
      const shouldShowNewOption = !hasPerfectMatch && q.length >= 2;

      const finalResults = shouldShowNewOption ? [
        {
          id: 'new',
          type: 'new',
          name: capitalizeProduct(q),
          display_name: `➕ Ajouter "${capitalizeProduct(q)}"`,
          category: { name: 'Nouveau produit', icon: '✨' },
          icon: '📦',
          matchScore: 0,
          isNew: true
        },
        ...sortedResults
      ] : sortedResults;

      setSuggestions(finalResults);
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [supabase, categoriesMap]);

  // Debounce de la recherche
  const debouncedSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(query);
    }, 300);
  }, [searchProducts]);

  return {
    suggestions,
    isSearching,
    searchProducts: debouncedSearch,
    clearSuggestions: () => setSuggestions([])
  };
};

// ========== COMPOSANT PRINCIPAL ==========

export default function SmartAddForm({ 
  onSubmit, 
  onCancel, 
  locations = [], 
  initialProduct = null 
}) {
  // Vérifier la config Supabase
  if (supabaseConfigError) {
    return (
      <div className="error-card">
        <p>⚠️ Configuration Supabase manquante</p>
        <p className="text-sm">Veuillez configurer les variables d'environnement</p>
      </div>
    );
  }

  // États du formulaire
  const [formData, setFormData] = useState({
    product: initialProduct || null,
    quantity: 1,
    unit: 'pièce',
    location_id: locations[0]?.id || '',
    expiry_date: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  
  const [productQuery, setProductQuery] = useState(initialProduct?.name || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Hook de recherche
  const { 
    suggestions, 
    isSearching, 
    searchProducts, 
    clearSuggestions 
  } = useProductSearch(supabaseClient);

  // Effet pour la recherche
  useEffect(() => {
    searchProducts(productQuery);
  }, [productQuery, searchProducts]);

  // Gestion de la sélection de produit
  const handleProductSelect = (product) => {
    setFormData(prev => ({
      ...prev,
      product,
      unit: product.primary_unit || prev.unit
    }));
    setProductQuery(product.name);
    setShowSuggestions(false);
    clearSuggestions();
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product) {
      alert('Veuillez sélectionner un produit');
      return;
    }

    try {
      await onSubmit(formData);
      // Réinitialiser le formulaire
      setFormData({
        product: null,
        quantity: 1,
        unit: 'pièce',
        location_id: locations[0]?.id || '',
        expiry_date: '',
        purchase_date: new Date().toISOString().split('T')[0]
      });
      setProductQuery('');
    } catch (error) {
      console.error('Erreur soumission:', error);
      alert('Erreur lors de l\'ajout du produit');
    }
  };

  return (
    <div className="smart-add-form">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recherche de produit */}
        <div className="form-group">
          <label className="form-label">
            Produit
            {formData.product && (
              <span className="ml-2 text-sm text-green-600">
                ✓ {formData.product.category?.name}
              </span>
            )}
          </label>
          
          <div className="relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setFormData(prev => ({ ...prev, product: null }));
                  setShowSuggestions(true);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Ex: Tomates, Pommes, Lait..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((product, idx) => (
                  <button
                    key={`${product.type}-${product.id}-${idx}`}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center gap-3 border-b last:border-b-0"
                  >
                    <span className="text-2xl">{product.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{product.display_name}</div>
                      <div className="text-xs text-gray-500">
                        {product.category?.name}
                        {product.subcategory && ` • ${product.subcategory}`}
                        {product.sourceTable && (
                          <span className="ml-2 text-xs px-1 py-0.5 bg-gray-100 rounded">
                            {product.sourceTable.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    {product.matchScore > 0 && (
                      <div className="text-xs text-gray-400">
                        {Math.round(product.matchScore * 100)}%
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quantité et unité */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Quantité</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                quantity: parseFloat(e.target.value) || 1 
              }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unité</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                unit: e.target.value 
              }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="pièce">Pièce</option>
              <option value="kg">Kg</option>
              <option value="g">
