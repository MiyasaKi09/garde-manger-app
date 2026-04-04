// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '../../../components/Toast';
import { getPossibleUnitsForProduct } from '../../../lib/possibleUnits';
import LotDetailsForm from './LotDetailsForm';
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

// Fonction pour formater proprement les noms de produits
const formatProductName = (name) => {
  if (!name) return '';
  
  // Mots qui doivent rester en minuscules (articles, prépositions, etc.)
  const lowercaseWords = ['de', 'du', 'des', 'le', 'la', 'les', 'au', 'aux', 'en', 'et', 'ou', 'à', 'avec', 'sans', 'pour', 'sur', 'sous', 'dans', 'par'];
  
  // Mots qui doivent avoir une capitalisation spéciale
  const specialCases = {
    'aoc': 'AOC',
    'aop': 'AOP',
    'igp': 'IGP',
    'bio': 'Bio',
    'saint': 'Saint',
    'sainte': 'Sainte',
    'st': 'St',
    'ste': 'Ste'
  };

  // Nettoyer le nom d'abord (enlever les espaces multiples, etc.)
  const cleanName = name.trim().replace(/\s+/g, ' ');
  
  return cleanName
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Gérer les mots avec apostrophes (d', l', etc.)
      if (word.includes("'")) {
        const parts = word.split("'");
        return parts.map((part, partIndex) => {
          if (partIndex === 0 && ['d', 'l', 'c', 'n', 's', 't'].includes(part)) {
            return part; // garder d', l', etc. en minuscules
          }
          if (index === 0 || partIndex > 0) {
            return specialCases[part] || part.charAt(0).toUpperCase() + part.slice(1);
          }
          return lowercaseWords.includes(part) ? part : (specialCases[part] || part.charAt(0).toUpperCase() + part.slice(1));
        }).join("'");
      }
      
      // Premier mot toujours capitalisé
      if (index === 0) {
        return specialCases[word] || word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Mots spéciaux (AOC, AOP, Saint, etc.)
      if (specialCases[word]) {
        return specialCases[word];
      }
      
      // Mots qui restent en minuscules
      if (lowercaseWords.includes(word)) {
        return word;
      }
      
      // Autres mots : première lettre en majuscule
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
};

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [lotData, setLotData] = useState({
    qty_remaining: 1,
    unit: 'unités',
    storage_method: 'pantry',
    storage_place: 'Garde-manger',
    expiration_date: '',
    is_containerized: false, // Produit en contenants unitaires
    container_size: '', // Taille d'un contenant (ex: 25 pour 25cL)
    container_unit: '' // Unité du contenant (cL, mL, g, etc.)
  });

  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Charger les catégories et sous-catégories au montage
  const [subcategories, setSubcategories] = useState([]);
  
  useEffect(() => {
    const loadCategoriesData = async () => {
      try {
        // Charger les catégories principales
        const { data: categoriesData } = await supabase
          .from('reference_categories')
          .select('id, name, icon, color_hex')
          .order('sort_priority');
        
        // Charger les sous-catégories
        const { data: subcategoriesData } = await supabase
          .from('reference_subcategories')
          .select('id, category_id, code, label, icon');
        
        if (categoriesData) {
          setCategories(categoriesData);
        }
        if (subcategoriesData) {
          setSubcategories(subcategoriesData);
        }
      } catch (error) {
        console.log('Erreur chargement catégories:', error);
      }
    };
    loadCategoriesData();
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
    // PRIORITÉ AU NOM DU PRODUIT (avant la catégorie)
    if (productName) {
      const nameLower = productName.toLowerCase();
      
      // Fromages PREMIER (pour éviter confusion avec champignons)
      if (nameLower.includes('camembert') || nameLower.includes('brie') || 
          nameLower.includes('roquefort') || nameLower.includes('rocamadour') || 
          nameLower.includes('gruyère') || nameLower.includes('emmental') || 
          nameLower.includes('fromage')) {
        return '🧀';
      }
    }
    
    if (categoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.icon) return category.icon;
    }
    
    // Icônes par défaut basées sur le nom
    const nameIcons = {
      // Fromages (priorité)
      'camembert': '🧀', 'brie': '🧀', 'roquefort': '🧀', 'gruyère': '🧀', 
      'emmental': '🧀', 'cheddar': '🧀', 'mozzarella': '🧀', 'parmesan': '🧀',
      'chèvre': '🧀', 'feta': '🧀', 'bleu': '🧀', 'comté': '🧀', 'fromage': '🧀',
      
      // Fruits et légumes
      'tomate': '🍅', 'pomme': '🍎', 'carotte': '🥕', 'pomme de terre': '🥔',
      'banane': '🍌', 'fraise': '🍓', 'orange': '🍊', 'citron': '🍋',
      'brocoli': '🥦', 'oignon': '🧅', 'ail': '�', 'salade': '�',
      'courgette': '🥒', 'aubergine': '�', 'poivron': '🫑', 'radis': '🥕',
      
      // Champignons (séparés des fromages)
      'champignon': '🍄', 'shiitake': '🍄', 'cèpe': '🍄', 'mousseron': '🍄',
      
      // Produits laitiers
      'lait': '🥛', 'yaourt': '🥛', 'crème': '🥛', 'beurre': '�',
      
      // Protéines
      'oeuf': '🥚', 'viande': '🥩', 'boeuf': '🥩', 'porc': '🥩',
      'poulet': '🍗', 'poisson': '🐟', 'saumon': '🐟', 'thon': '🐟',
      
      // Féculents et céréales
      'pain': '🍞', 'riz': '🍚', 'pâtes': '🍝', 'blé': '🌾', 
      'quinoa': '🌾', 'avoine': '🌾', 'orge': '🌾'
    };
    
    if (productName) {
      const nameLower = productName.toLowerCase();
      for (const [key, icon] of Object.entries(nameIcons)) {
        if (nameLower.includes(key)) return icon;
      }
    }
    
    return '📦';
  }, [categories]);

  // Obtenir le nom et la classe CSS de la catégorie
  const getCategoryInfo = useCallback((categoryId, subcategoryId = null, productName = null) => {
    // PRIORITÉ AU NOM DU PRODUIT pour corriger les erreurs de catégorisation
    if (productName) {
      const nameLower = productName.toLowerCase();
      
      // Fromages
      if (nameLower.includes('camembert') || nameLower.includes('brie') || 
          nameLower.includes('roquefort') || nameLower.includes('rocamadour') || 
          nameLower.includes('gruyère') || nameLower.includes('emmental') || 
          nameLower.includes('fromage')) {
        return { name: 'Fromages', class: 'category-fromages' };
      }
      
      // Champignons
      if (nameLower.includes('champignon') || nameLower.includes('shiitake') || 
          nameLower.includes('cèpe') || nameLower.includes('mousseron')) {
        return { name: 'Champignons', class: 'category-champignons' };
      }
      
      // Viandes
      if (nameLower.includes('viande') ||
          nameLower.includes('poulet') || nameLower.includes('boeuf')) {
        return { name: 'Viandes', class: 'category-viandes' };
      }
      
      // Féculents
      if (nameLower.includes('pâtes') || nameLower.includes('riz') || 
          nameLower.includes('pain') || nameLower.includes('pomme de terre') ||
          nameLower.includes('quinoa') || nameLower.includes('blé')) {
        return { name: 'Féculents', class: 'category-feculents' };
      }
    }
    
    // Fallback sur les vraies données de catégorisation
    if (subcategoryId && subcategories.length > 0) {
      const subcategory = subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory?.label) {
        return { name: subcategory.label, class: 'category-default' };
      }
    }
    
    if (categoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.name) {
        // Mapping des catégories principales vers les classes CSS
        const categoryMapping = {
          'Fruits': 'category-fruits',
          'Légumes': 'category-legumes',
          'Champignons': 'category-champignons'
        };
        
        return { 
          name: category.name, 
          class: categoryMapping[category.name] || 'category-default' 
        };
      }
    }
    
    return { name: 'Alimentation', class: 'category-default' };
  }, [categories, subcategories]);

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

  // Recherche de produits améliorée avec transitions smooth
  const performSearch = useCallback(async (query) => {
    // Démarrer la transition smooth
    setIsTransitioning(true);
    setSearchLoading(true);
    
    // Petit délai pour permettre l'animation de sortie si des résultats existent
    if (searchResults.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    const q = (query || '').trim().toLowerCase();
    
    try {
      // Si pas de query, prendre les 5 produits les plus populaires
      if (!q || q.length === 0) {
        const { data: topProducts } = await supabase
          .from('canonical_foods')
          .select(`
            id, canonical_name, category_id, subcategory_id, keywords, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .order('id')
          .limit(3);

        if (topProducts) {
          const results = topProducts.map(food => ({
            id: food.id,
            name: food.canonical_name,
            type: 'canonical',
            category_id: food.category_id,
            subcategory_id: food.subcategory_id,
            matchScore: 50,
            primary_unit: food.primary_unit || 'unités',
            shelf_life_days_pantry: food.shelf_life_days_pantry,
            shelf_life_days_fridge: food.shelf_life_days_fridge,
            shelf_life_days_freezer: food.shelf_life_days_freezer,
            icon: getCategoryIcon(food.category_id, food.canonical_name)
          })).slice(0, 3); // Limiter à 3 suggestions
          setSearchResults(results);
        }
        setSearchLoading(false);
        return;
      }

      const allResults = [];
      const seenNames = new Set();

      // 1. Recherche dans canonical_foods avec plusieurs techniques
      
      // Recherche directe avec informations de sous-catégorie
      const { data: canonicalFoods } = await supabase
        .from('canonical_foods')
        .select(`
          id, canonical_name, category_id, subcategory_id, keywords, primary_unit,
          shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
        `)
        .or(`canonical_name.ilike.%${q}%,keywords.cs.{${q}}`)
        .limit(20);

      const allCanonical = canonicalFoods || [];

      if (allCanonical) {
        allCanonical.forEach(food => {
          if (!seenNames.has(food.canonical_name.toLowerCase())) {
            allResults.push({
              ...food,
              type: 'canonical',
              source_name: food.canonical_name,
              subcategory_id: food.subcategory_id
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
            id, cultivar_name, canonical_food_id,
            canonical_foods!inner(canonical_name, category_id, primary_unit, keywords,
              shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer)
          `)
          .ilike('cultivar_name', `%${q}%`)
          .limit(20);

        if (cultivars) {
          cultivars.forEach(cultivar => {
            const name = cultivar.cultivar_name.toLowerCase();
            if (!seenNames.has(name)) {
              allResults.push({
                id: `cult_${cultivar.id}`,
                canonical_name: cultivar.cultivar_name,
                category_id: cultivar.canonical_foods?.category_id,
                primary_unit: cultivar.canonical_foods?.primary_unit || 'unités',
                shelf_life_days_pantry: cultivar.canonical_foods?.shelf_life_days_pantry,
                shelf_life_days_fridge: cultivar.canonical_foods?.shelf_life_days_fridge,
                shelf_life_days_freezer: cultivar.canonical_foods?.shelf_life_days_freezer,
                keywords: cultivar.canonical_foods?.keywords,
                type: 'cultivar',
                source_name: cultivar.cultivar_name
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
          const minLength = Math.min(q.length, nameLower.length);
          const similarity = (maxLength - distance) / maxLength;
          
          // Plus strict : seuil à 70% et vérification de longueur similaire
          if (similarity > 0.7 && Math.abs(q.length - nameLower.length) <= 2) {
            matchScore = Math.floor(similarity * 60);
            
            // Bonus spécial pour "camambert" → "camembert" (substitution m/me)
            if (q === 'camambert' && nameLower === 'camembert') {
              matchScore = 90;
            }
            

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
          subcategory_id: item.subcategory_id,
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
        .slice(0, 3); // Réduire à 3 suggestions

      // Si moins de 3 résultats, compléter avec les plus populaires
      if (finalResults.length < 3) {
        const { data: topProducts } = await supabase
          .from('canonical_foods')
          .select(`
            id, canonical_name, category_id, primary_unit,
            shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer
          `)
          .order('id')
          .limit(3 - finalResults.length);

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

      // Transition smooth pour l'apparition des nouveaux résultats
      setTimeout(() => {
        setSearchResults(finalResults.slice(0, 3));
        setIsTransitioning(false);
      }, 100);
      
    } catch (error) {
      console.error('Erreur recherche:', error);
      // En cas d'erreur, essayons une recherche basique
      try {
        const { data: fallbackProducts } = await supabase
          .from('canonical_foods')
          .select('id, canonical_name, category_id, primary_unit')
          .limit(3);
        
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
          setTimeout(() => {
            setSearchResults(results);
            setIsTransitioning(false);
          }, 100);
        }
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        setTimeout(() => {
          setSearchResults([]);
          setIsTransitioning(false);
        }, 100);
      }
    } finally {
      setSearchLoading(false);
    }
  }, [supabase, getCategoryIcon, searchResults.length]);

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

  const handleCreateLot = async () => {
    if (!selectedProduct || !lotData.qty_remaining) {
      toast.warning('Veuillez sélectionner un produit et entrer une quantité');
      return;
    }

    setLoading(true);
    
    try {
      const quantity = parseFloat(lotData.qty_remaining) || 1;
      
      // Déterminer le type de produit et convertir l'ID en entier
      let productType = 'canonical';
      let productId = null;
      
      if (selectedProduct.type === 'cultivar') {
        productType = 'cultivar';
        // Extraire l'ID numérique du format "cult_123"
        const idStr = selectedProduct.id.toString().replace('cult_', '');
        productId = parseInt(idStr, 10);
      } else if (selectedProduct.type === 'archetype') {
        productType = 'archetype';
        // Extraire l'ID numérique du format "arch_123"
        const idStr = selectedProduct.id.toString().replace('arch_', '');
        productId = parseInt(idStr, 10);
      } else if (selectedProduct.type === 'custom') {
        // Produit custom - on met l'info dans les notes
        productId = null;
      } else {
        // Type 'canonical' - convertir l'ID en entier et le mettre dans canonical_food_id
        productId = parseInt(selectedProduct.id, 10);
      }
      
      // Construire les notes pour les produits custom
      let notes = selectedProduct.type === 'custom' ? selectedProduct.name : null;

      // Préparer les données pour la nouvelle structure inventory_lots
      const lotDataToInsert = {
        canonical_food_id: selectedProduct.type === 'canonical' ? productId : null,
        cultivar_id: selectedProduct.type === 'cultivar' ? productId : null,
        archetype_id: selectedProduct.type === 'archetype' ? productId : null,
        qty_remaining: quantity,
        initial_qty: quantity,
        unit: lotData.unit,
        storage_method: lotData.storage_method,
        storage_place: lotData.storage_place,
        expiration_date: lotData.expiration_date || null,
        acquired_on: new Date().toISOString().split('T')[0],
        notes: notes,
        // Champs pour la gestion des contenants
        is_containerized: lotData.is_containerized,
        container_size: lotData.is_containerized && lotData.container_size ? parseFloat(lotData.container_size) : null,
        container_unit: lotData.is_containerized && lotData.container_unit ? lotData.container_unit : null
      };

      console.log('Données à insérer:', lotDataToInsert);

      const { data: createdLot, error } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase:', error);
        toast.error(`Erreur lors de la création: ${error.message}`);
        return;
      }

      console.log('Lot créé:', createdLot);
      toast.success(`${formatProductName(selectedProduct.name)} ajouté au garde-manger !`);
      onLotCreated?.(createdLot);
      onClose();
      
    } catch (error) {
      console.error('Erreur création lot:', error);
      toast.error('Erreur lors de la création du lot');
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
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                {searchLoading && (
                  <div className="search-loading">Recherche...</div>
                )}

                <div className={`search-results ${isTransitioning ? 'transitioning' : ''}`}>
                  {searchResults.map((product) => (
                    <div
                      key={`${product.type}-${product.id}`}
                      className="product-item"
                      onClick={() => handleProductSelect(product)}
                    >
                      <span className="product-icon">{product.icon}</span>
                      <div className="product-info">
                        <span className="product-name">{formatProductName(product.name)}</span>
                        <span className={`product-category-badge ${getCategoryInfo(product.category_id, product.subcategory_id, product.name).class}`}>
                          {getCategoryInfo(product.category_id, product.subcategory_id, product.name).name}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!searchLoading && searchResults.length === 0 && searchQuery && (
                    <div className="no-results">
                      <div>Aucun produit trouvé pour "{searchQuery}"</div>
                      <div className="no-results-tip">
                        Voulez-vous créer ce produit ?
                      </div>
                      <button 
                        onClick={() => handleProductSelect({
                          id: 'custom',
                          name: searchQuery,
                          type: 'custom',
                          category_id: null,
                          primary_unit: 'unités',
                          shelf_life_days_pantry: 7,
                          shelf_life_days_fridge: 7,
                          shelf_life_days_freezer: 90,
                          icon: '📦'
                        })}
                        className="create-custom-btn"
                      >
                        ✨ Créer "{searchQuery}"
                      </button>
                    </div>
                  )}
                  {!searchLoading && searchResults.length === 0 && !searchQuery && (
                    <div className="no-results">
                      Chargement des suggestions...
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 2 && selectedProduct && (
            <LotDetailsForm
              selectedProduct={selectedProduct}
              lotData={lotData}
              setLotData={setLotData}
              onBack={() => setStep(1)}
              getCategoryIcon={getCategoryIcon}
              formatProductName={formatProductName}
            />
          )}
        </div>

        <div className="modal-footer">
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
