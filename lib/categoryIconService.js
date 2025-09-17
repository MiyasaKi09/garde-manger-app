// lib/categoryIconService.js
import { supabase } from './supabaseClient';

/**
 * Service pour gérer les icônes de catégories basées sur les données de référence
 */
class CategoryIconService {
  constructor() {
    this.categoriesCache = null;
    this.categoriesMap = new Map();
    this.lastCacheTime = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Charge les catégories depuis la base de données
   */
  async loadCategories() {
    try {
      const { data, error } = await supabase
        .from('reference_categories')
        .select('id, name, icon, color_hex, parent_category')
        .order('sort_priority');

      if (error) throw error;

      this.categoriesCache = data || [];
      this.categoriesMap.clear();
      
      // Créer des maps pour accès rapide
      this.categoriesCache.forEach(cat => {
        this.categoriesMap.set(cat.id, cat);
        // Map aussi par nom pour compatibilité
        this.categoriesMap.set(cat.name.toLowerCase(), cat);
      });

      this.lastCacheTime = Date.now();
      return this.categoriesCache;
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      return [];
    }
  }

  /**
   * Assure que les catégories sont chargées et à jour
   */
  async ensureCategoriesLoaded() {
    const now = Date.now();
    if (!this.categoriesCache || (now - this.lastCacheTime) > this.cacheExpiry) {
      await this.loadCategories();
    }
  }

  /**
   * Obtient l'icône d'une catégorie par son ID
   */
  async getIconById(categoryId) {
    if (!categoryId) return '📦';
    
    await this.ensureCategoriesLoaded();
    
    const category = this.categoriesMap.get(categoryId);
    return category?.icon || '📦';
  }

  /**
   * Obtient l'icône d'une catégorie par son nom (fallback)
   */
  async getIconByName(categoryName) {
    if (!categoryName) return '📦';
    
    await this.ensureCategoriesLoaded();
    
    const category = this.categoriesMap.get(categoryName.toLowerCase());
    return category?.icon || this.getCategoryIconFallback(categoryName);
  }

  /**
   * Obtient les informations complètes d'une catégorie par ID
   */
  async getCategoryById(categoryId) {
    if (!categoryId) return null;
    
    await this.ensureCategoriesLoaded();
    
    return this.categoriesMap.get(categoryId) || null;
  }

  /**
   * Obtient les informations complètes d'une catégorie par nom
   */
  async getCategoryByName(categoryName) {
    if (!categoryName) return null;
    
    await this.ensureCategoriesLoaded();
    
    return this.categoriesMap.get(categoryName.toLowerCase()) || null;
  }

  /**
   * Obtient toutes les catégories
   */
  async getAllCategories() {
    await this.ensureCategoriesLoaded();
    return this.categoriesCache || [];
  }

  /**
   * Fonction de fallback pour les icônes (ancien système)
   */
  getCategoryIconFallback(categoryName) {
    if (!categoryName) return '📦';
    const name = String(categoryName).toLowerCase();
    const icons = {
      // Légumes & fruits
      'légume': '🥬', 'légumes': '🥬', 'vegetable': '🥬', 'salade': '🥗',
      'fruit': '🍎', 'fruits': '🍎', 'agrume': '🍊', 'agrumes': '🍊', 'baie': '🫐', 'baies': '🫐',
      // Protéines
      'viande': '🥩', 'bœuf': '🥩', 'porc': '🥩', 'agneau': '🥩', 'viandes': '🥩',
      'volaille': '🐔', 'poulet': '🐔', 'canard': '🦆', 'dinde': '🦃',
      'poisson': '🐟', 'saumon': '🐟', 'thon': '🐟', 'fruits de mer': '🦐', 'poissons': '🐟',
      'œuf': '🥚', 'oeufs': '🥚', 'eggs': '🥚',
      // Produits laitiers
      'lait': '🥛', 'yaourt': '🥛', 'fromage': '🧀', 'crème': '🥛', 'beurre': '🧈', 'produits laitiers': '🥛',
      // Céréales & féculents
      'céréale': '🌾', 'céréales': '🌾', 'riz': '🍚', 'pâtes': '🍝', 'pain': '🍞',
      'pomme de terre': '🥔', 'patate': '🍠',
      // Légumineuses
      'légumineuse': '🫘', 'légumineuses': '🫘', 'haricot': '🫘', 'lentille': '🫘',
      // Épices & condiments
      'épice': '🌶️', 'épices': '🌶️', 'herbe': '🌿', 'herbes': '🌿',
      'sauce': '🥫', 'condiment': '🥫', 'huile': '🫒', 'huiles': '🫒', 'vinaigre': '🍶',
      // Noix et graines
      'noix': '🥜', 'graine': '🌰', 'graines': '🌰', 'noix_graines': '🥜',
      // Boissons
      'boisson': '🥤', 'jus': '🧃', 'eau': '💧', 'thé': '🍵', 'café': '☕', 'vin': '🍷',
      // Conserves & surgelés
      'conserve': '🥫', 'conserves': '🥫', 'surgelé': '🧊', 'surgelés': '🧊'
    };
    
    // Recherche exacte
    if (icons[name]) return icons[name];
    
    // Recherche partielle
    for (const [key, icon] of Object.entries(icons)) {
      if (name.includes(key)) return icon;
    }
    
    return '📦';
  }

  /**
   * Obtient l'icône en essayant d'abord l'ID puis le nom
   */
  async getIcon(categoryId, categoryName) {
    // Essayer d'abord par ID
    if (categoryId) {
      const icon = await this.getIconById(categoryId);
      if (icon !== '📦') return icon;
    }
    
    // Fallback sur le nom
    if (categoryName) {
      return await this.getIconByName(categoryName);
    }
    
    return '📦';
  }

  /**
   * Vide le cache (utile pour forcer un rechargement)
   */
  clearCache() {
    this.categoriesCache = null;
    this.categoriesMap.clear();
    this.lastCacheTime = 0;
  }
}

// Instance singleton
export const categoryIconService = new CategoryIconService();

// Fonctions de convenance pour compatibilité
export const getCategoryIcon = async (categoryIdOrName) => {
  if (typeof categoryIdOrName === 'number') {
    return await categoryIconService.getIconById(categoryIdOrName);
  } else {
    return await categoryIconService.getIconByName(categoryIdOrName);
  }
};

export const getCategoryInfo = async (categoryId) => {
  return await categoryIconService.getCategoryById(categoryId);
};

export default categoryIconService;
