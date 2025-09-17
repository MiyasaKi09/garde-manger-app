// app/pantry/components/SmartAddForm.js - Version complète multi-tables

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';

// Utilitaires pour normalisation et scoring
const normalize = (str) => {
  if (!str) return '';
  return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
};

const similarity = (a, b) => {
  if (!a || !b) return 0;
  const setA = new Set(normalize(a).split(' '));
  const setB = new Set(normalize(b).split(' '));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
};

// Fonction pour obtenir l'icône selon category_id ET le nom
const getCategoryIcon = (categoryId, categoryName, productName) => {
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
    'raisin': '🍇', 'raisins': '🍇', 'avocat': '🥑', 'avocats': '🥑',
    'carotte': '🥕', 'carottes': '🥕', 'poivron': '🫑', 'poivrons': '🫑',
    'aubergine': '🍆', 'aubergines': '🍆', 'courgette': '🥒', 'courgettes': '🥒',
    'brocoli': '🥦', 'brocolis': '🥦', 'champignon': '🍄', 'champignons': '🍄',
    'oignon': '🧅', 'oignons': '🧅', 'ail': '🧄', 'pomme de terre': '🥔',
    'pain': '🍞', 'fromage': '🧀', 'lait': '🥛', 'œuf': '🥚', 'oeufs': '🥚',
    'poulet': '🐔', 'bœuf': '🐄', 'porc': '🐷', 'poisson': '🐟', 'riz': '🍚',
    'pâtes': '🍝', 'huile': '🫒', 'sel': '🧂', 'sucre': '🍯', 'miel': '🍯'
  };
  
  const searchTerms = [categoryName, productName].filter(Boolean);
  for (const term of searchTerms) {
    if (!term) continue;
    const normalized = normalize(term);
    
    if (specificIcons[normalized]) return specificIcons[normalized];
    
    for (const [key, icon] of Object.entries(specificIcons)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return icon;
      }
    }
  }
  
  if (categoryName) {
    const name = normalize(categoryName);
    const fallbackIcons = {
      'fruits': '🍎', 'légumes': '🥕', 'champignons': '🍄', 'œufs': '🥚',
      'céréales': '🌾', 'légumineuses': '🫘', 'laitiers': '🥛', 'viandes': '🥩',
      'poissons': '🐟', 'épices': '🌶️', 'huiles': '🫒', 'conserves': '🥫',
      'noix': '🌰', 'édulcorants': '🍯'
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
  
  return calculateLevenshteinSimilarity(normalizedQuery, normalizedText);
};

const calculateLevenshteinSimilarity = (a, b) => {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;
  
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
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
  const lowercaseWords = ['de', 'du', 'des', 'le', 'la', 'les', 'et', 'ou', 'à', 'au', 'aux'];
  
  return name.split(' ').map((word, index) => {
    const lowerWord = word.toLowerCase();
    if (index === 0 || !lowercaseWords.includes(lowerWord)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return lowerWord;
  }).join(' ');
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

  const searchProducts = useCallback(async (query) => {
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
        throw new Error('Connexion à la base de données indisponible');
      }

      console.log('Début recherche Supabase pour:', q);
      const searchTerm = `%${q.replace(/[%_]/g, '\\    try {
      if (!supabase) {
        throw new Error('Connexion à la base de données indisponible');
      }

      const searchTerm = `%${q.replace(/[%_]/g, '\\$&')}%`;')}%`;
      console.log('Terme de recherche:', searchTerm);

      // RECHERCHE PARALLÈLE DANS TOUTES LES TABLES
      const searchPromises = [
        // 1. CANONICAL FOODS
        supabase
          .from('canonical_foods')
          .select(`
            id, canonical_name, category_id, subcategory, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .ilike('canonical_name', searchTerm)
          .limit(15),

        // 2. CULTIVARS
        supabase
          .from('cultivars')
          .select(`
            id, cultivar_name, canonical_food_id,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .ilike('cultivar_name', searchTerm)
          .limit(10),

        // 3. GENERIC PRODUCTS
        supabase
          .from('generic_products')
          .select(`
            id, name, category_id, subcategory, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .ilike('name', searchTerm)
          .limit(10),

        // 4. DERIVED PRODUCTS
        supabase
          .from('derived_products')
          .select(`
            id, derived_name, cultivar_id, expected_shelf_life_days
          `)
          .ilike('derived_name', searchTerm)
          .limit(8)
      ];

      const searchResults = await Promise.allSettled(searchPromises);
      console.log('Résultats bruts des recherches:', searchResults);

      // Collecter les IDs pour les relations
      const categoryIds = new Set();
      const canonicalIds = new Set();
      const cultivarIds = new Set();

      // Traiter canonical_foods
      if (searchResults[0].status === 'fulfilled' && searchResults[0].value.data) {
        searchResults[0].value.data.forEach(item => {
          if (item.category_id) categoryIds.add(item.category_id);
        });
      }

      // Traiter cultivars
      if (searchResults[1].status === 'fulfilled' && searchResults[1].value.data) {
        searchResults[1].value.data.forEach(item => {
          if (item.canonical_food_id) canonicalIds.add(item.canonical_food_id);
          cultivarIds.add(item.id);
        });
      }

      // Traiter generic_products
      if (searchResults[2].status === 'fulfilled' && searchResults[2].value.data) {
        searchResults[2].value.data.forEach(item => {
          if (item.category_id) categoryIds.add(item.category_id);
        });
      }

      // Traiter derived_products
      if (searchResults[3].status === 'fulfilled' && searchResults[3].value.data) {
        searchResults[3].value.data.forEach(item => {
          if (item.cultivar_id) cultivarIds.add(item.cultivar_id);
        });
      }

      // Récupérer les données de référence
      const referencePromises = [];

      if (categoryIds.size > 0) {
        referencePromises.push(
          supabase
            .from('reference_categories')
            .select('id, name, icon, color_hex')
            .in('id', Array.from(categoryIds))
        );
      } else {
        referencePromises.push(Promise.resolve({ data: [] }));
      }

      if (canonicalIds.size > 0) {
        referencePromises.push(
          supabase
            .from('canonical_foods')
            .select('id, canonical_name, category_id')
            .in('id', Array.from(canonicalIds))
        );
      } else {
        referencePromises.push(Promise.resolve({ data: [] }));
      }

      if (cultivarIds.size > 0) {
        referencePromises.push(
          supabase
            .from('cultivars')
            .select('id, cultivar_name, canonical_food_id')
            .in('id', Array.from(cultivarIds))
        );
      } else {
        referencePromises.push(Promise.resolve({ data: [] }));
      }

      const referenceResults = await Promise.allSettled(referencePromises);

      // Créer les maps de référence
      const categoriesMap = new Map();
      const canonicalMap = new Map();
      const cultivarsMap = new Map();

      if (referenceResults[0].status === 'fulfilled' && referenceResults[0].value.data) {
        referenceResults[0].value.data.forEach(cat => {
          categoriesMap.set(cat.id, cat);
        });
      }

      if (referenceResults[1].status === 'fulfilled' && referenceResults[1].value.data) {
        referenceResults[1].value.data.forEach(can => {
          canonicalMap.set(can.id, can);
        });
      }

      if (referenceResults[2].status === 'fulfilled' && referenceResults[2].value.data) {
        referenceResults[2].value.data.forEach(cult => {
          cultivarsMap.set(cult.id, cult);
        });
      }

      // NORMALISATION ET SCORING DES RÉSULTATS
      const allResults = [];

      // 1. Traiter canonical_foods
      if (searchResults[0].status === 'fulfilled' && searchResults[0].value.data) {
        searchResults[0].value.data.forEach(row => {
          const name = row.canonical_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.3) {
            const category = categoriesMap.get(row.category_id);
            const icon = getCategoryIcon(row.category_id, category?.name, name);

            allResults.push({
              id: row.id,
              type: 'canonical',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || row.subcategory || 'Aliment',
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
              matchScore: score,
              sourceTable: 'canonical_foods'
            });
          }
        });
      }

      // 2. Traiter cultivars
      if (searchResults[1].status === 'fulfilled' && searchResults[1].value.data) {
        searchResults[1].value.data.forEach(row => {
          const name = row.cultivar_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.3) {
            const canonical = canonicalMap.get(row.canonical_food_id);
            const category = canonical ? categoriesMap.get(canonical.category_id) : null;
            const icon = getCategoryIcon(canonical?.category_id, category?.name, name);

            allResults.push({
              id: row.id,
              type: 'cultivar',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || 'Variété',
                id: canonical?.category_id,
                icon: category?.icon
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
      if (searchResults[2].status === 'fulfilled' && searchResults[2].value.data) {
        searchResults[2].value.data.forEach(row => {
          const name = row.name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.3) {
            const category = categoriesMap.get(row.category_id);
            const icon = getCategoryIcon(row.category_id, category?.name, name);

            allResults.push({
              id: row.id,
              type: 'generic',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || row.subcategory || 'Produit',
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
              matchScore: score,
              sourceTable: 'generic_products'
            });
          }
        });
      }

      // 4. Traiter derived_products
      if (searchResults[3].status === 'fulfilled' && searchResults[3].value.data) {
        searchResults[3].value.data.forEach(row => {
          const name = row.derived_name || '';
          const score = fuzzyMatch(q, name);

          if (score > 0.3) {
            const cultivar = cultivarsMap.get(row.cultivar_id);
            const canonical = cultivar ? canonicalMap.get(cultivar.canonical_food_id) : null;
            const category = canonical ? categoriesMap.get(canonical.category_id) : null;
            const icon = getCategoryIcon(canonical?.category_id, category?.name, name);

            allResults.push({
              id: row.id,
              type: 'derived',
              name: capitalizeProduct(name),
              display_name: capitalizeProduct(name),
              category: {
                name: category?.name || 'Transformé',
                id: canonical?.category_id,
                icon: category?.icon
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

      // TRI ET FINALISATION
      const sortedResults = allResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 12);

      // Ajouter l'option "nouveau produit" si nécessaire
      const hasPerfectMatch = sortedResults.some(r => r.matchScore >= 0.9);
      const shouldShowNewOption = !hasPerfectMatch && q.length >= 2;

      const finalResults = shouldShowNewOption ? [
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
      const { data: createdLot, error: lotError } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (lotError) {
        throw new Error(`Erreur lors de la création du lot: ${lotError.message}`);
      }

      // Callback de succès
      if (onLotCreated) {
        onLotCreated(createdLot);
      }
      
      // Fermer le modal
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setSearchError(error.message || 'Erreur inconnue lors de la création');
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
                          {product.sourceTable && (
                            <span className={`source-badge source-${product.type}`}>
                              {product.type === 'canonical' && '📚'}
                              {product.type === 'cultivar' && '🌱'}
                              {product.type === 'generic' && '🏪'}
                              {product.type === 'derived' && '⚗️'}
                            </span>
                          )}
                        </div>
                        <div className="result-meta">
                          <span className="category">{product.category?.name || 'Aliment'}</span>
                          {product.subcategory && (
                            <span className="subcategory">• {product.subcategory}</span>
                          )}
                          <span className="unit">• {product.primary_unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !searchLoading && (
                <div className="no-results">
                  <p>Aucun produit trouvé pour "{searchQuery}"</p>
                  <small>Essayez un terme plus général ou créez un nouveau produit</small>
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div className="quantity-step">
              <div className="product-summary">
                <div className="product-icon">{selectedProduct.icon}</div>
                <div className="product-info">
                  <div className="product-name">{selectedProduct.display_name}</div>
                  <div className="product-source">
                    {selectedProduct.category?.name} • {selectedProduct.primary_unit}
                  </div>
                </div>
                <div className={`confidence-badge confidence-${confidence.tone}`}>
                  <ShieldCheck size={14} />
                  {confidence.label} ({confidence.percent}%)
                </div>
                <button onClick={() => setStep(1)} className="change-btn">
                  Changer
                </button>
              </div>

              <div className="lot-form">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="qty">
                      Quantité actuelle
                    </label>
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
                      placeholder="Ex: Étagère du haut, Bac à légumes..."
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
          background: white;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .result-content {
          flex: 1;
          min-width: 0;
        }

        .result-name {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .new-badge, .match-badge {
          background: #3b82f6;
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 999px;
        }

        .match-badge {
          background: #059669;
        }

        .source-badge {
          font-size: 0.75rem;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .source-canonical { background: #ddd6fe; }
        .source-cultivar { background: #dcfce7; }
        .source-generic { background: #fef3c7; }
        .source-derived { background: #fed7d7; }

        .result-meta {
          font-size: 0.875rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .category {
          font-weight: 500;
        }

        .subcategory, .unit {
          color: #9ca3af;
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

        .confidence-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
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

        .change-btn {
          background: none;
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
