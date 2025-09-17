// lib/categoryService.js - Service simplifié pour les icônes
import { supabase } from './supabaseClient';

// Cache pour éviter les requêtes répétées
let categoriesCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Charge les catégories depuis la base de données
 */
export async function loadCategories() {
  try {
    const { data, error } = await supabase
      .from('reference_categories')
      .select('id, name, icon, color_hex')
      .order('sort_priority');

    if (error) throw error;
    
    categoriesCache = data || [];
    cacheTime = Date.now();
    
    return categoriesCache;
  } catch (error) {
    console.error('Erreur lors du chargement des catégories:', error);
    return [];
  }
}

/**
 * Obtient les catégories (avec cache)
 */
export async function getCategories() {
  const now = Date.now();
  
  if (!categoriesCache || (now - cacheTime) > CACHE_DURATION) {
    await loadCategories();
  }
  
  return categoriesCache || [];
}

/**
 * Obtient l'icône d'une catégorie par son ID
 */
export async function getCategoryIcon(categoryId) {
  if (!categoryId) return '📦';
  
  const categories = await getCategories();
  const category = categories.find(cat => cat.id === categoryId);
  
  return category?.icon || '📦';
}

/**
 * Obtient les informations complètes d'une catégorie
 */
export async function getCategoryInfo(categoryId) {
  if (!categoryId) return null;
  
  const categories = await getCategories();
  return categories.find(cat => cat.id === categoryId) || null;
}

/**
 * Mapping des icônes par défaut basé sur les noms
 */
export function getCategoryIconByName(categoryName) {
  if (!categoryName) return '📦';
  
  const name = categoryName.toLowerCase();
  const fallbackIcons = {
    'fruits': '🍎',
    'légumes': '🥕', 
    'legumes': '🥕',
    'champignons': '🍄',
    'œufs': '🥚',
    'oeufs': '🥚',
    'céréales': '🌾',
    'cereales': '🌾',
    'légumineuses': '🫘',
    'legumineuses': '🫘',
    'produits laitiers': '🥛',
    'laitiers': '🥛',
    'lait': '🥛',
    'viandes': '🥩',
    'viande': '🥩',
    'poissons': '🐟',
    'poisson': '🐟',
    'épices': '🌶️',
    'epices': '🌶️',
    'huiles': '🫒',
    'huile': '🫒',
    'conserves': '🥫',
    'conserve': '🥫',
    'noix et graines': '🌰',
    'noix': '🌰',
    'graines': '🌰',
    'édulcorants': '🍯',
    'edulcorants': '🍯',
    'sucre': '🍯',
    'miel': '🍯'
  };
  
  // Recherche exacte
  if (fallbackIcons[name]) {
    return fallbackIcons[name];
  }
  
  // Recherche partielle
  for (const [key, icon] of Object.entries(fallbackIcons)) {
    if (name.includes(key)) {
      return icon;
    }
  }
  
  return '📦';
}

/**
 * Obtient l'icône en essayant d'abord l'ID puis le nom
 */
export async function getIcon(categoryId, categoryName) {
  // Essayer d'abord par ID
  if (categoryId) {
    const icon = await getCategoryIcon(categoryId);
    if (icon !== '📦') return icon;
  }
  
  // Fallback sur le nom
  if (categoryName) {
    return getCategoryIconByName(categoryName);
  }
  
  return '📦';
}

/**
 * Enrichit un produit avec l'icône de sa catégorie
 */
export async function enrichProductWithIcon(product) {
  if (!product) return product;
  
  const icon = await getIcon(product.category_id, product.category?.name);
  
  return {
    ...product,
    icon
  };
}

/**
 * Enrichit une liste de produits avec leurs icônes
 */
export async function enrichProductsWithIcons(products) {
  if (!Array.isArray(products)) return products;
  
  return await Promise.all(
    products.map(product => enrichProductWithIcon(product))
  );
}

/**
 * Vide le cache
 */
export function clearCache() {
  categoriesCache = null;
  cacheTime = 0;
}
