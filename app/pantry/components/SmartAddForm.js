// app/pantry/components/SmartAddForm.js - Version complète avec recherche dans toutes les tables

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { normalize, similarity } from './pantryUtils';

// Fonction pour obtenir l'icône selon category_id ET le nom
const getCategoryIcon = (categoryId, categoryName, productName) => {
  // Mapping des IDs de catégories vers icônes
  const categoryIcons = {
    1: '🍎',    // Fruits
    2: '🥕',    // Légumes  
    3: '🍄',    // Champignons
    4: '🥚',    // Œufs
    5: '🌾',    // Céréales
    6: '🫘',    // Légumineuses
    7: '🥛',    // Produits laitiers
    8: '🥩',    // Viandes
    9: '🐟',    // Poissons
    10: '🌶️',  // Épices
    11: '🫒',   // Huiles
    12: '🥫',   // Conserves
    13: '🌰',   // Noix et graines
    14: '🍯',   // Édulcorants
  };
  
  // Essayer d'abord par ID
  if (categoryId && categoryIcons[categoryId]) {
    return categoryIcons[categoryId];
  }
  
  // Icônes spécifiques pour certains produits
  const specificIcons = {
    'tomate': '🍅', 'tomates': '🍅',
    'pomme': '🍎', 'pommes': '🍎',
    'banane': '🍌', 'bananes': '🍌',
    'orange': '🍊', 'oranges': '🍊',
    'citron': '🍋', 'citrons': '🍋',
    'fraise': '🍓', 'fraises': '🍓',
    'raisin': '🍇', 'raisins': '🍇',
    'pêche': '🍑', 'pêches': '🍑',
    'cerise': '🍒', 'cerises': '🍒',
    'ananas': '🍍',
    'avocat': '🥑', 'avocats': '🥑',
    'carotte': '🥕', 'carottes': '🥕',
    'poivron': '🫑', 'poivrons': '🫑',
    'aubergine': '🍆', 'aubergines': '🍆',
    'courgette': '🥒', 'courgettes': '🥒',
    'brocoli': '🥦', 'brocolis': '🥦',
    'champignon': '🍄', 'champignons': '🍄',
    'oignon': '🧅', 'oignons': '🧅',
    'ail': '🧄',
    'pomme de terre': '🥔', 'pommes de terre': '🥔', 'patate': '🥔',
    'pain': '🍞', 'pains': '🍞',
    'fromage': '🧀', 'fromages': '🧀',
    'lait': '🥛',
    'œuf': '🥚', 'oeufs': '🥚', 'œufs': '🥚',
    'poulet': '🐔',
    'bœuf': '🐄', 'boeuf': '🐄',
    'porc': '🐷',
    'poisson': '🐟', 'poissons': '🐟',
    'saumon': '🐟',
    'thon': '🐟',
    'riz': '🍚',
    'pâtes': '🍝', 'pates': '🍝',
    'huile': '🫒', 'huiles': '🫒',
    'sel': '🧂',
    'sucre': '🍯',
    'miel': '🍯',
    'café': '☕', 'cafe': '☕',
    'thé': '🍵', 'the': '🍵'
  };
  
  // Chercher dans tous les noms possibles
  const searchTerms = [categoryName, productName].filter(Boolean);
  for (const term of searchTerms) {
    if (!term) continue;
    const normalized = normalize(term);
    
    // Recherche exacte
    if (specificIcons[normalized]) {
      return specificIcons[normalized];
    }
    
    // Recherche partielle
    for (const [key, icon] of Object.entries(specificIcons)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return icon;
      }
    }
  }
  
  // Fallback sur le nom de catégorie général
  if (categoryName) {
    const name = normalize(categoryName);
    const fallbackIcons = {
      'fruits': '🍎', 'fruit': '🍎',
      'légumes': '🥕', 'legumes': '🥕', 'légume': '🥕', 'legume': '🥕',
      'champignons': '🍄', 'champignon': '🍄',
      'œufs': '🥚', 'oeufs': '🥚', 'oeuf': '🥚', 'œuf': '🥚',
      'céréales': '🌾', 'cereales': '🌾', 'céréale': '🌾', 'cereale': '🌾',
      'légumineuses': '🫘', 'legumineuses': '🫘',
      'produits laitiers': '🥛', 'laitiers': '🥛', 'laitier': '🥛', 'lait': '🥛',
      'viandes': '🥩', 'viande': '🥩',
      'poissons': '🐟', 'poisson': '🐟',
      'épices': '🌶️', 'epices': '🌶️', 'épice': '🌶️', 'epice': '🌶️',
      'huiles': '🫒', 'huile': '🫒',
      'conserves': '🥫', 'conserve': '🥫',
      'noix et graines': '🌰', 'noix': '🌰', 'graines': '🌰', 'graine': '🌰',
      'édulcorants': '🍯', 'edulcorants': '🍯', 'sucre': '🍯'
    };
    
    for (const [key, icon] of Object.entries(fallbackIcons)) {
      if (name.includes(key)) return icon;
    }
  }
  
  return '📦';
};

// Fuzzy matching et autres utilitaires (identiques à la version précédente)
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

  // RECHERCHE COMPLÈTE DANS TOUTES LES TABLES
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

        // RECHERCHE PARALLÈLE DANS TOUTES LES TABLES
        const searches = await Promise.allSettled([
          // 1. CANONICAL FOODS
          supabase
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
            .limit(20),

          // 2. CULTIVARS
          supabase
            .from('cultivars')
            .select(`
              id,
              cultivar_name,
              canonical_food_id,
              synonyms,
              shelf_life_days_pantry,
              shelf_life_days_fridge,
              shelf_life_days_freezer
            `)
            .or(
              searchTerms.map(term => 
                `cultivar_name.ilike.%${term.replace(/[%_]/g, '\\$&')}%,synonyms.cs.{${term}}`
              ).join(',')
            )
            .limit(15),

          // 3. GENERIC PRODUCTS
          supabase
            .from('generic_products')
            .select(`
              id,
              name,
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
                `name.ilike.%${term.replace(/[%_]/g, '\\$&')}%,keywords.cs.{${term}}`
              ).join(',')
            )
            .limit(15),

          // 4. DERIVED PRODUCTS
          supabase
            .from('derived_products')
            .select(`
              id,
              derived_name,
              cultivar_id,
              expected_shelf_life_days,
              notes
            `)
            .ilike('derived_name', `%${q.replace(/[%_]/g, '\\$&')}%`)
            .limit(10)
        ]);

        // RÉCUPÉRATION DES CATÉGORIES ET RELATIONS
        const allCategoryIds = new Set();
        const allCanonicalIds = new Set();
        const allCultivarIds = new Set();

        // Collecter les IDs nécessaires
        searches.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.data) {
            result.value.data.forEach(item => {
              if (index === 0) { // canonical_foods
                if (item.category_id) allCategoryIds.add(item.category_id);
              } else if (index === 1) { // cultivars
                if (item.canonical_food_id) allCanonicalIds.add(item.canonical_food_id);
                allCultivarIds.add(item.id);
              } else if (index === 2) { // generic_products
                if (item.category_id) allCategoryIds.add(item.category_id);
              } else if (index === 3) { // derived_products
                if (item.cultivar_id) allCultivarIds.add(item.cultivar_id);
              }
            });
          }
        });

        // Récupérer les données de référence
        const [categoriesResult, canonicalResult, cultivarsResult] = await Promise.allSettled([
          // Catégories
          allCategoryIds.size > 0 ? supabase
            .from('reference_categories')
            .select('id, name, icon, color_hex')
            .in('id', Array.from(allCategoryIds)) : Promise.resolve({ data: [] }),
          
          // Canonical foods pour les cultivars
          allCanonicalIds.size > 0 ? supabase
            .from('canonical_foods')
            .select('id, canonical_name, category_id')
            .in('id', Array.from(allCanonicalIds)) : Promise.resolve({ data: [] }),
          
          // Cultivars pour les derived products
          allCultivarIds.size > 0 ? supabase
            .from('cultivars')
            .select('id, cultivar_name, canonical_food_id')
            .in('id', Array.from(allCultivarIds)) : Promise.resolve({ data: [] })
        ]);

        // Créer les maps de référence
        const categoriesMap = new Map();
        const canonicalMap = new Map();
        const cultivarsMap = new Map();

        if (categoriesResult.status === 'fulfilled' && categoriesResult.value.data) {
          categoriesResult.value.data.forEach(cat => {
            categoriesMap.set(cat.id, cat);
          });
        }

        if (canonicalResult.status === 'fulfilled' && canonicalResult.value.data) {
          canonicalResult.value.data.forEach(can => {
            canonicalMap.set(can.id, can);
          });
        }

        if (cultivarsResult.status === 'fulfilled' && cultivarsResult.value.data) {
          cultivarsResult.value.data.forEach(cult => {
            cultivarsMap.set(cult.id, cult);
          });
        }

        // NORMALISATION ET SCORING DES RÉSULTATS
        const allResults = [];

        // 1. Traiter canonical_foods
        if (searches[0].status === 'fulfilled' && searches[0].value.data) {
          searches[0].value.data.forEach(row => {
            const name = row.canonical_name || '';
            const score = Math.max(
              fuzzyMatch(q, name),
              fuzzyMatch(q, row.subcategory || '') * 0.8,
              fuzzyMatch(q, (row.keywords || []).join(' ')) * 0.6
            );

            if (score > 0) {
              const category = categoriesMap.get(row.category_id);
              const icon = getCategoryIcon(row.category_id, category?.name, name);

              allResults.push({
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
                matchScore: score,
                sourceTable: 'canonical_foods'
              });
            }
          });
        }

        // 2. Traiter cultivars
        if (searches[1].status === 'fulfilled' && searches[1].value.data) {
          searches[1].value.data.forEach(row => {
            const name = row.cultivar_name || '';
            const score = Math.max(
              fuzzyMatch(q, name),
              fuzzyMatch(q, (row.synonyms || []).join(' ')) * 0.8
            );

            if (score > 0) {
              const canonical = canonicalMap.get(row.canonical_food_id);
              const category = canonical ? categoriesMap.get(canonical.category_id) : null;
              const icon = getCategoryIcon(canonical?.category_id, category?.name, name);

              allResults.push({
                id: row.id,
                type: 'cultivar',
                name: capitalizeProduct(name),
                display_name: capitalizeProduct(name),
                category: {
                  name: category?.name || 'Aliment',
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
        if (searches[2].status === 'fulfilled' && searches[2].value.data) {
          searches[2].value.data.forEach(row => {
            const name = row.name || '';
            const score = Math.max(
              fuzzyMatch(q, name),
              fuzzyMatch(q, row.subcategory || '') * 0.8,
              fuzzyMatch(q, (row.keywords || []).join(' ')) * 0.6
            );

            if (score > 0) {
              const category = categoriesMap.get(row.category_id);
              const icon = getCategoryIcon(row.category_id, category?.name, name);

              allResults.push({
                id: row.id,
                type: 'generic',
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
                matchScore: score,
                sourceTable: 'generic_products'
              });
            }
          });
        }

        // 4. Traiter derived_products
        if (searches[3].status === 'fulfilled' && searches[3].value.data) {
          searches[3].value.data.forEach(row => {
            const name = row.derived_name || '';
            const score = fuzzyMatch(q, name);

            if (score > 0) {
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
                  name: category?.name || 'Aliment',
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
          .slice(0, 10);

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
      const expiry = product.type !== 'new' ? estimateExpiry(product, 'pantry') : '';
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
          selectedProduct?.type !== 'new' ?
            estimateExpiry(selectedProduct, method) :
            prev.expiration_date
      }
