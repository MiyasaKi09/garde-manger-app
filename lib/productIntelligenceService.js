// ================================================================
// lib/productIntelligenceService.js - SERVICE D'INTELLIGENCE
// ================================================================

import { supabase } from './supabaseClient';

export class ProductIntelligenceService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Recherche intelligente de produits dans la base de référence
   */
  async searchProducts(query, limit = 20) {
    if (!query || query.length < 2) return [];
    
    try {
      const { data, error } = await supabase.rpc('search_products', {
        search_query: query,
        limit_results: limit
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur recherche produits:', error);
      return [];
    }
  }

  /**
   * Obtient toutes les informations d'intelligence pour un produit
   */
  async getProductIntelligence(productName) {
    // Vérifier le cache
    const cacheKey = `intel_${productName.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase.rpc('get_product_intelligence', {
        product_name: productName
      });
      
      if (error) throw error;
      
      const result = data?.[0] || null;
      
      // Mise en cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error('Erreur intelligence produit:', error);
      return null;
    }
  }

  /**
   * Crée automatiquement un produit avec intelligence
   */
  async createIntelligentProduct(productName) {
    const intelligence = await this.getProductIntelligence(productName);
    
    if (intelligence) {
      // Produit trouvé dans la base de référence
      return {
        name: productName,
        category: intelligence.category,
        default_unit: intelligence.primary_unit,
        density_g_per_ml: intelligence.density_g_per_ml,
        grams_per_unit: intelligence.unit_weight_grams,
        ml_per_unit: intelligence.unit_volume_ml,
        typical_shelf_life_days: intelligence.shelf_life_fridge || 7,
        optimal_storage: intelligence.optimal_storage,
        calories_per_100g: intelligence.calories_per_100g,
        is_vegan: intelligence.is_vegan,
        is_vegetarian: intelligence.is_vegetarian,
        intelligence_source: 'reference_db',
        intelligence_confidence: 0.95
      };
    } else {
      // Fallback sur l'IA par règles (version simplifiée)
      const basicIntel = this.analyzeProductBasic(productName);
      return {
        name: productName,
        category: basicIntel.category,
        default_unit: basicIntel.unit,
        typical_shelf_life_days: basicIntel.shelfLife,
        intelligence_source: 'basic_rules',
        intelligence_confidence: 0.3
      };
    }
  }

  /**
   * Analyse basique par règles (fallback)
   */
  analyzeProductBasic(productName) {
    const name = productName.toLowerCase();
    
    if (/lait|yaourt|crème|fromage/.test(name)) {
      return { category: 'Produits laitiers', unit: 'ml', shelfLife: 7 };
    }
    if (/pomme|poire|banane|orange/.test(name)) {
      return { category: 'Fruits', unit: 'u', shelfLife: 7 };
    }
    if (/tomate|carotte|oignon|salade/.test(name)) {
      return { category: 'Légumes', unit: 'u', shelfLife: 5 };
    }
    if (/pain|baguette/.test(name)) {
      return { category: 'Pain', unit: 'u', shelfLife: 2 };
    }
    if (/viande|steak|escalope/.test(name)) {
      return { category: 'Viandes', unit: 'g', shelfLife: 3 };
    }
    
    return { category: 'Autre', unit: 'g', shelfLife: 7 };
  }
}

// ================================================================
// lib/unitConverter.js - CONVERTISSEUR D'UNITÉS INTELLIGENT
// ================================================================

export class IntelligentUnitConverter {
  constructor() {
    this.productService = new ProductIntelligenceService();
  }

  /**
   * Convertit intelligemment entre toutes les unités possibles
   */
  async convertQuantity(quantity, fromUnit, productName) {
    const intelligence = await this.productService.getProductIntelligence(productName);
    const qty = Number(quantity) || 0;
    
    if (qty === 0) return null;

    const conversions = {
      original: { value: qty, unit: fromUnit, label: `${qty} ${fromUnit}` },
      alternatives: []
    };

    // Si on a des données d'intelligence
    if (intelligence) {
      await this.addIntelligentConversions(conversions, qty, fromUnit, intelligence);
    } else {
      // Conversions basiques sans intelligence
      this.addBasicConversions(conversions, qty, fromUnit);
    }

    // Nettoyer et trier les alternatives
    conversions.alternatives = conversions.alternatives
      .filter((conv, index, self) => 
        index === self.findIndex(c => c.unit === conv.unit)
      )
      .sort((a, b) => this.getUnitPriority(a.unit) - this.getUnitPriority(b.unit));

    return conversions;
  }

  /**
   * Conversions intelligentes basées sur la base de données
   */
  async addIntelligentConversions(conversions, qty, fromUnit, intelligence) {
    const { unit_weight_grams, unit_volume_ml, density_g_per_ml, primary_unit } = intelligence;

    // Conversion depuis les unités
    if (fromUnit === 'u') {
      if (unit_weight_grams > 0) {
        const totalWeight = qty * unit_weight_grams;
        conversions.alternatives.push(
          { value: totalWeight, unit: 'g', label: `${totalWeight}g` }
        );
        if (totalWeight >= 1000) {
          conversions.alternatives.push(
            { value: totalWeight / 1000, unit: 'kg', label: `${(totalWeight/1000).toFixed(2)}kg` }
          );
        }
      }
      
      if (unit_volume_ml > 0) {
        const totalVolume = qty * unit_volume_ml;
        conversions.alternatives.push(
          { value: totalVolume, unit: 'ml', label: `${totalVolume}ml` }
        );
        if (totalVolume >= 100) {
          conversions.alternatives.push(
            { value: totalVolume / 10, unit: 'cl', label: `${(totalVolume/10).toFixed(1)}cl` }
          );
        }
        if (totalVolume >= 1000) {
          conversions.alternatives.push(
            { value: totalVolume / 1000, unit: 'l', label: `${(totalVolume/1000).toFixed(2)}L` }
          );
        }
      }
    }

    // Conversion vers les unités depuis le volume
    else if (['ml', 'cl', 'l'].includes(fromUnit)) {
      const volumeInMl = fromUnit === 'cl' ? qty * 10 : fromUnit === 'l' ? qty * 1000 : qty;
      
      // Conversions de volume standard
      if (fromUnit !== 'ml') {
        conversions.alternatives.push({ value: volumeInMl, unit: 'ml', label: `${volumeInMl}ml` });
      }
      if (fromUnit !== 'cl' && volumeInMl >= 10) {
        conversions.alternatives.push({ 
          value: volumeInMl / 10, 
          unit: 'cl', 
          label: `${(volumeInMl/10).toFixed(1)}cl` 
        });
      }
      if (fromUnit !== 'l' && volumeInMl >= 1000) {
        conversions.alternatives.push({ 
          value: volumeInMl / 1000, 
          unit: 'l', 
          label: `${(volumeInMl/1000).toFixed(2)}L` 
        });
      }

      // Conversion vers unités si possible
      if (unit_volume_ml > 0) {
        const units = volumeInMl / unit_volume_ml;
        if (units >= 0.1) {
          conversions.alternatives.push({
            value: units,
            unit: 'u',
            label: `${Math.round(units * 10) / 10} unité${units > 1 ? 's' : ''}`
          });
        }
      }

      // Conversion vers poids si densité connue
      if (density_g_per_ml > 0) {
        const weightGrams = volumeInMl * density_g_per_ml;
        conversions.alternatives.push({ value: weightGrams, unit: 'g', label: `${Math.round(weightGrams)}g` });
        if (weightGrams >= 1000) {
          conversions.alternatives.push({ 
            value: weightGrams / 1000, 
            unit: 'kg', 
            label: `${(weightGrams/1000).toFixed(2)}kg` 
          });
        }
      }
    }
  }

  /**
   * Conversions basiques sans intelligence (fallback)
   */
  addBasicConversions(conversions, qty, fromUnit) {
    // Conversions de poids basiques
    if (fromUnit === 'g' && qty >= 1000) {
      conversions.alternatives.push({ 
        value: qty / 1000, 
        unit: 'kg', 
        label: `${(qty/1000).toFixed(2)}kg` 
      });
    }
    if (fromUnit === 'kg') {
      conversions.alternatives.push({ 
        value: qty * 1000, 
        unit: 'g', 
        label: `${qty * 1000}g` 
      });
    }

    // Conversions de volume basiques
    if (fromUnit === 'ml') {
      if (qty >= 10) {
        conversions.alternatives.push({ 
          value: qty / 10, 
          unit: 'cl', 
          label: `${(qty/10).toFixed(1)}cl` 
        });
      }
      if (qty >= 1000) {
        conversions.alternatives.push({ 
          value: qty / 1000, 
          unit: 'l', 
          label: `${(qty/1000).toFixed(2)}L` 
        });
      }
    }
    if (fromUnit === 'cl') {
      conversions.alternatives.push({ value: qty * 10, unit: 'ml', label: `${qty * 10}ml` });
      if (qty >= 100) {
        conversions.alternatives.push({ 
          value: qty / 100, 
          unit: 'l', 
          label: `${(qty/100).toFixed(2)}L` 
        });
      }
    }
    if (fromUnit === 'l') {
      conversions.alternatives.push({ value: qty * 1000, unit: 'ml', label: `${qty * 1000}ml` });
      conversions.alternatives.push({ value: qty * 100, unit: 'cl', label: `${qty * 100}cl` });
    }
  }

  /**
   * Priorité d'affichage des unités
   */
  getUnitPriority(unit) {
    const priorities = { 'u': 1, 'g': 2, 'kg': 3, 'ml': 4, 'cl': 5, 'l': 6 };
    return priorities[unit] || 99;
  }

  /**
   * Obtient la meilleure unité pour un produit
   */
  async getBestUnit(productName) {
    const intelligence = await this.productService.getProductIntelligence(productName);
    return intelligence?.primary_unit || 'g';
  }
}

// ================================================================
// lib/smartSorting.js - TRI INTELLIGENT
// ================================================================

import { daysUntil } from './dates';

export class SmartProductSorter {
  constructor() {
    this.productService = new ProductIntelligenceService();
  }

  /**
   * Trie les produits intelligemment selon plusieurs critères
   */
  async sortProducts(products) {
    const enrichedProducts = [];
    
    for (const product of products) {
      const intelligence = await this.productService.getProductIntelligence(product.name);
      const enriched = {
        ...product,
        intelligence,
        priorityScore: await this.calculatePriorityScore(product, intelligence)
      };
      enrichedProducts.push(enriched);
    }

    return enrichedProducts.sort((a, b) => {
      // Tri principal par score de priorité (décroissant)
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      
      // Tri secondaire par urgence de péremption
      const aUrgency = this.getUrgencyScore(a.lots);
      const bUrgency = this.getUrgencyScore(b.lots);
      if (bUrgency !== aUrgency) {
        return bUrgency - aUrgency;
      }
      
      // Tri tertiaire par nom alphabétique
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Calcule un score de priorité pour un produit
   */
  async calculatePriorityScore(product, intelligence) {
    let score = 0;
    const lots = product.lots || [];
    
    // 1. URGENCE DE PÉREMPTION (40% du score)
    const urgencyScore = this.getUrgencyScore(lots);
    score += urgencyScore * 0.4;

    // 2. TYPE DE PRODUIT (30% du score)
    if (intelligence) {
      const categoryScore = this.getCategoryPriorityScore(intelligence.category);
      score += categoryScore * 0.3;
    }

    // 3. LIEU DE STOCKAGE (20% du score)
    const locationScore = this.getLocationPriorityScore(lots);
    score += locationScore * 0.2;

    // 4. QUANTITÉ DISPONIBLE (10% du score)
    const totalQuantity = lots.reduce((sum, lot) => sum + Number(lot.qty || 0), 0);
    const quantityScore = Math.min(totalQuantity / 5, 50); // Cap à 50
    score += quantityScore * 0.1;

    return Math.round(score);
  }

  /**
   * Score d'urgence basé sur les dates de péremption
   */
  getUrgencyScore(lots) {
    if (!lots || lots.length === 0) return 25;

    const urgencyScores = lots.map(lot => {
      const days = daysUntil(lot.best_before || lot.dlc);
      if (days === null) return 25; // Pas de date = moyennement urgent
      if (days < 0) return 100;     // Périmé = très urgent
      if (days === 0) return 95;    // Aujourd'hui = très urgent
      if (days === 1) return 85;    // Demain = urgent
      if (days <= 3) return 75;     // 3 jours = prioritaire
      if (days <= 7) return 50;     // 1 semaine = modéré
      if (days <= 14) return 30;    // 2 semaines = faible
      if (days <= 30) return 15;    // 1 mois = très faible
      return 5;                     // Plus d'1 mois = minimal
    });

    return Math.max(...urgencyScores);
  }

  /**
   * Score de priorité par catégorie
   */
  getCategoryPriorityScore(category) {
    const priorities = {
      'Viandes': 90,
      'Poissons': 90,
      'Produits laitiers': 85,
      'Charcuterie': 80,
      'Fruits': 70,
      'Légumes': 70,
      'Pain': 65,
      'Œufs': 60,
      'Fromages': 55,
      'Yaourts': 55,
      'Céréales': 30,
      'Conserves': 20,
      'Épices': 15,
      'Surgelés': 10
    };
    
    return priorities[category] || 40;
  }

  /**
   * Score de priorité par lieu de stockage
   */
  getLocationPriorityScore(lots) {
    if (!lots || lots.length === 0) return 25;

    const locationScores = lots.map(lot => {
      const location = (lot.location?.name || '').toLowerCase();
      
      // Plus le lieu est critique (température, visibilité), plus le score est élevé
      if (location.includes('frigo')) return 80;
      if (location.includes('réfrigéra')) return 80;
      if (location.includes('congéla')) return 30; // Moins urgent car conservé
      if (location.includes('plan')) return 70;    // Plan de travail = visible
      if (location.includes('corbeille')) return 60;
      if (location.includes('placard')) return 40;
      if (location.includes('cave')) return 20;
      
      return 35; // Défaut
    });

    return Math.max(...locationScores);
  }
}

// ================================================================
// hooks/useProductIntelligence.js - HOOK REACT PERSONNALISÉ
// ================================================================

import { useState, useEffect, useCallback } from 'react';

export function useProductIntelligence(products) {
  const [sortedProducts, setSortedProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const sorter = new SmartProductSorter();
  const converter = new IntelligentUnitConverter();
  const productService = new ProductIntelligenceService();

  // Tri intelligent des produits
  const sortProducts = useCallback(async (productsToSort) => {
    if (!productsToSort || productsToSort.length === 0) {
      setSortedProducts([]);
      return;
    }
    
    setLoading(true);
    try {
      const sorted = await sorter.sortProducts(productsToSort);
      setSortedProducts(sorted);
    } catch (error) {
      console.error('Erreur tri intelligent:', error);
      setSortedProducts(productsToSort); // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  // Génération de recommandations
  const generateRecommendations = useCallback((productsToAnalyze) => {
    const recs = [];
    
    for (const product of productsToAnalyze) {
      const lots = product.lots || [];
      
      // Produits qui expirent bientôt
      const soonExpiring = lots.filter(lot => {
        const days = daysUntil(lot.best_before || lot.dlc);
        return days !== null && days >= 0 && days <= 3;
      });
      
      if (soonExpiring.length > 0) {
        const totalQty = soonExpiring.reduce((sum, lot) => sum + Number(lot.qty || 0), 0);
        recs.push({
          type: 'urgent',
          icon: '⚠️',
          title: `${product.name} expire bientôt`,
          message: `${totalQty} ${product.unit || 'unité(s)'} à consommer sous 3 jours`,
          productId: product.productId,
          priority: 'high',
          action: 'consume'
        });
      }
      
      // Produits expirés
      const expired = lots.filter(lot => {
        const days = daysUntil(lot.best_before || lot.dlc);
        return days !== null && days < 0;
      });
      
      if (expired.length > 0) {
        const totalQty = expired.reduce((sum, lot) => sum + Number(lot.qty || 0), 0);
        recs.push({
          type: 'expired',
          icon: '🚨',
          title: `${product.name} est périmé`,
          message: `${totalQty} ${product.unit || 'unité(s)'} à vérifier et potentiellement jeter`,
          productId: product.productId,
          priority: 'critical',
          action: 'check'
        });
      }
      
      // Stocks importants avec intelligence
      const totalQuantity = lots.reduce((sum, lot) => sum + Number(lot.qty || 0), 0);
      if (totalQuantity > 15 && product.intelligence) {
        const shelfLife = product.intelligence.shelf_life_fridge || 7;
        if (shelfLife <= 7) { // Produits périssables avec beaucoup de stock
          recs.push({
            type: 'overstocked_perishable',
            icon: '📦⏰',
            title: `Stock important de ${product.name}`,
            message: `${totalQuantity} ${product.unit || 'unité(s)'} - produit périssable à consommer rapidement`,
            productId: product.productId,
            priority: 'medium',
            action: 'plan_meals'
          });
        }
      }
    }
    
    // Tri des recommandations par priorité
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const sortedRecs = recs.sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
    
    setRecommendations(sortedRecs.slice(0, 10)); // Limiter à 10 recommandations
  }, []);

  // Conversion d'unités
  const convertQuantity = useCallback(async (quantity, fromUnit, productName) => {
    try {
      return await converter.convertQuantity(quantity, fromUnit, productName);
    } catch (error) {
      console.error('Erreur conversion:', error);
      return null;
    }
  }, []);

  // Recherche de produits intelligente
  const searchProducts = useCallback(async (query) => {
    try {
      return await productService.searchProducts(query);
    } catch (error) {
      console.error('Erreur recherche:', error);
      return [];
    }
  }, []);

  // Effet pour traiter les produits quand ils changent
  useEffect(() => {
    if (products && products.length > 0) {
      sortProducts(products);
      generateRecommendations(products);
    } else {
      setSortedProducts([]);
      setRecommendations([]);
    }
  }, [products, sortProducts, generateRecommendations]);

  return {
    // Données
    sortedProducts,
    recommendations,
    loading,
    
    // Méthodes
    convertQuantity,
    searchProducts,
    sortProducts,
    
    // Services (pour usage avancé)
    productService,
    converter,
    sorter
  };
}

// ================================================================
// Export par défaut
// ================================================================

export {
  ProductIntelligenceService,
  IntelligentUnitConverter,
  SmartProductSorter
}; le poids
    else if (['g', 'kg'].includes(fromUnit)) {
      const weightInGrams = fromUnit === 'kg' ? qty * 1000 : qty;
      
      // Conversions de poids standard
      if (fromUnit !== 'g') {
        conversions.alternatives.push({ value: weightInGrams, unit: 'g', label: `${weightInGrams}g` });
      }
      if (fromUnit !== 'kg' && weightInGrams >= 1000) {
        conversions.alternatives.push({ 
          value: weightInGrams / 1000, 
          unit: 'kg', 
          label: `${(weightInGrams/1000).toFixed(2)}kg` 
        });
      }

      // Conversion vers unités si possible
      if (unit_weight_grams > 0) {
        const units = weightInGrams / unit_weight_grams;
        if (units >= 0.1) {
          conversions.alternatives.push({
            value: units,
            unit: 'u',
            label: `${Math.round(units * 10) / 10} unité${units > 1 ? 's' : ''}`
          });
        }
      }

      // Conversion vers volume si densité connue
      if (density_g_per_ml > 0) {
        const volumeMl = weightInGrams / density_g_per_ml;
        conversions.alternatives.push({ value: volumeMl, unit: 'ml', label: `${Math.round(volumeMl)}ml` });
        if (volumeMl >= 100) {
          conversions.alternatives.push({ 
            value: volumeMl / 10, 
            unit: 'cl', 
            label: `${(volumeMl/10).toFixed(1)}cl` 
          });
        }
        if (volumeMl >= 1000) {
          conversions.alternatives.push({ 
            value: volumeMl / 1000, 
            unit: 'l', 
            label: `${(volumeMl/1000).toFixed(2)}L` 
          });
        }
      }
    }

    // Conversion vers les unités depuis
