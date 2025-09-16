// app/pantry/components/pantryUtils.js

/* ================================
   📦 UTILS GESTION GARDE-MANGER
   ================================ */

/* ============ DATES ET TEMPS ============ */

export const formatDate = (date, options = {}) => {
  if (!date) return '';
  const defaultOptions = { day: 'numeric', month: 'short', year: 'numeric', ...options };
  try {
    return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return '';
  }
};

export const daysUntil = (date) => {
  if (!date) return null;
  try {
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const target = new Date(date); 
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Erreur calcul jours:', error);
    return null;
  }
};

export const addDays = (date, days) => {
  try {
    const d = new Date(date);
    d.setDate(d.getDate() + Number(days || 0));
    return d;
  } catch (error) {
    console.error('Erreur ajout jours:', error);
    return new Date();
  }
};

export const formatDateISO = (date) => {
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (error) {
    console.error('Erreur format ISO:', error);
    return '';
  }
};

export const isExpired = (date) => {
  const days = daysUntil(date);
  return days !== null && days < 0;
};

export const isExpiringSoon = (date, threshold = 3) => {
  const d = daysUntil(date);
  return d !== null && d >= 0 && d <= threshold;
};

/* ============ CONVERSION D'UNITÉS ============ */

export const UNIT_CONVERSIONS = {
  weight: { g: 1, kg: 1000, mg: 0.001, oz: 28.35, lb: 453.6 },
  volume: { ml: 1, l: 1000, cl: 10, dl: 100, cup: 240, tsp: 5, tbsp: 15, 'fl oz': 29.57 },
  count: { 'pièce': 1, 'unité': 1, dozen: 12 }
};

export const getUnitType = (unit) => {
  const u = typeof unit === 'string' ? unit.toLowerCase().trim() : '';
  for (const [type, units] of Object.entries(UNIT_CONVERSIONS)) {
    if (u && units[u] !== undefined) return type;
  }
  return 'other';
};

export const convertQuantity = (quantity, fromUnit, toUnit, density = null) => {
  const fromType = getUnitType(fromUnit);
  const toType = getUnitType(toUnit);

  // Même famille d'unités
  if (fromType === toType && fromType !== 'other') {
    const f = UNIT_CONVERSIONS[fromType][(fromUnit || '').toLowerCase()] || 1;
    const t = UNIT_CONVERSIONS[toType][(toUnit || '').toLowerCase()] || 1;
    return (Number(quantity) * f) / t;
  }

  // Poids -> volume (besoin densité en g/ml)
  if (fromType === 'weight' && toType === 'volume' && density) {
    const grams = Number(quantity) * (UNIT_CONVERSIONS.weight[(fromUnit || '').toLowerCase()] || 1);
    const ml = grams / Number(density);
    const t = UNIT_CONVERSIONS.volume[(toUnit || '').toLowerCase()] || 1;
    return ml / t;
  }

  // Volume -> poids (densité)
  if (fromType === 'volume' && toType === 'weight' && density) {
    const ml = Number(quantity) * (UNIT_CONVERSIONS.volume[(fromUnit || '').toLowerCase()] || 1);
    const grams = ml * Number(density);
    const t = UNIT_CONVERSIONS.weight[(toUnit || '').toLowerCase()] || 1;
    return grams / t;
  }

  return null;
};

export const formatQuantity = (quantity, unit, precision = 1) => {
  if (quantity === null || quantity === undefined || isNaN(quantity)) return '—';
  const num = Number(quantity);
  if (num === 0) return `0 ${unit || 'unité'}`;
  
  // Pour les nombres entiers, pas de décimales
  if (num === Math.floor(num)) {
    return `${num} ${unit || 'unité'}`;
  }
  
  return `${num.toFixed(precision)} ${unit || 'unité'}`;
};

// ✅ AJOUT: Alias pour compatibilité
export const formatQty = formatQuantity;

/* ============ STATUTS ET PRIORITÉS ============ */

export const getExpirationStatus = (daysLeft) => {
  if (daysLeft === null || daysLeft === undefined) {
    return { 
      status: 'unknown', 
      level: 0, 
      color: '#6b7280', 
      bgColor: '#f9fafb', 
      label: 'Sans date', 
      priority: 5 
    };
  }
  
  const d = Number(daysLeft);
  
  if (d < 0) return { 
    status: 'expired', 
    level: 4, 
    color: '#dc2626', 
    bgColor: '#fef2f2', 
    label: 'Expiré', 
    priority: 1 
  };
  
  if (d === 0) return { 
    status: 'today', 
    level: 3, 
    color: '#ea580c', 
    bgColor: '#fff7ed', 
    label: "Aujourd'hui", 
    priority: 2 
  };
  
  if (d <= 3) return { 
    status: 'critical', 
    level: 3, 
    color: '#d97706', 
    bgColor: '#fffbeb', 
    label: `${d}j`, 
    priority: 2 
  };
  
  if (d <= 7) return { 
    status: 'warning', 
    level: 2, 
    color: '#ca8a04', 
    bgColor: '#fefce8', 
    label: `${d}j`, 
    priority: 3 
  };
  
  if (d <= 14) return { 
    status: 'attention', 
    level: 1, 
    color: '#0891b2', 
    bgColor: '#f0f9ff', 
    label: `${d}j`, 
    priority: 4 
  };
  
  return { 
    status: 'good', 
    level: 0, 
    color: '#059669', 
    bgColor: '#ecfdf5', 
    label: `${d}j`, 
    priority: 5 
  };
};

export const getStorageMethodInfo = (method) => {
  const map = {
    fridge: { 
      label: 'Frigo', 
      icon: '❄️', 
      color: '#0ea5e9', 
      description: 'Conservation au réfrigérateur (2-4°C)' 
    },
    freezer: { 
      label: 'Congélateur', 
      icon: '🧊', 
      color: '#06b6d4', 
      description: 'Conservation au congélateur (-18°C)' 
    },
    pantry: { 
      label: 'Placard', 
      icon: '🏠', 
      color: '#8b5cf6', 
      description: 'Conservation à température ambiante' 
    },
    counter: { 
      label: 'Plan de travail', 
      icon: '🏪', 
      color: '#f59e0b', 
      description: 'À consommer rapidement' 
    },
    cellar: { 
      label: 'Cave', 
      icon: '🍷', 
      color: '#7c3aed', 
      description: 'Conservation en cave (10-15°C)' 
    }
  };
  return map[method] || { 
    label: method, 
    icon: '📦', 
    color: '#6b7280', 
    description: 'Méthode de conservation' 
  };
};

/* ============ CATÉGORISATION ============ */

export const getCategoryIcon = (categoryName) => {
  if (!categoryName) return '📦';
  const name = String(categoryName).toLowerCase();
  const icons = {
    // Légumes & fruits
    'légume': '🥬', 'légumes': '🥬', 'vegetable': '🥬', 'salade': '🥗',
    'fruit': '🍎', 'fruits': '🍎', 'agrume': '🍊', 'agrumes': '🍊', 'baie': '🫐', 'baies': '🫐',
    // Protéines
    'viande': '🥩', 'bœuf': '🥩', 'porc': '🥩', 'agneau': '🥩',
    'volaille': '🐔', 'poulet': '🐔', 'canard': '🦆', 'dinde': '🦃',
    'poisson': '🐟', 'saumon': '🐟', 'thon': '🐟', 'fruits de mer': '🦐',
    'œuf': '🥚', 'oeufs': '🥚', 'eggs': '🥚',
    // Produits laitiers
    'lait': '🥛', 'yaourt': '🥛', 'fromage': '🧀', 'crème': '🥛', 'beurre': '🧈',
    // Céréales & féculents
    'céréale': '🌾', 'céréales': '🌾', 'riz': '🍚', 'pâtes': '🍝', 'pain': '🍞',
    'pomme de terre': '🥔', 'patate': '🍠',
    // Épices & condiments
    'épice': '🌶️', 'épices': '🌶️', 'herbe': '🌿', 'herbes': '🌿',
    'sauce': '🥫', 'condiment': '🥫', 'huile': '🫒', 'vinaigre': '🍶',
    // Boissons
    'boisson': '🥤', 'jus': '🧃', 'eau': '💧', 'thé': '🍵', 'café': '☕', 'vin': '🍷',
    // Conserves & surgelés
    'conserve': '🥫', 'surgelé': '🧊', 'surgelés': '🧊'
  };
  
  // Recherche exacte
  if (icons[name]) return icons[name];
  
  // Recherche partielle
  for (const [key, icon] of Object.entries(icons)) {
    if (name.includes(key)) return icon;
  }
  
  return '📦';
};

/* ============ RECHERCHE ET FILTRAGE ============ */

export const normalizeString = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
};

export const scoreSearchMatch = (searchTerm, text) => {
  if (!searchTerm || !text) return 100;
  
  const search = normalizeString(searchTerm);
  const target = normalizeString(text);
  
  if (target.includes(search)) {
    // Bonus si c'est un match exact au début
    if (target.startsWith(search)) return 0;
    // Bonus si c'est un match de mot complet
    if (target.split(/\s+/).some(word => word === search)) return 1;
    // Match partiel
    return 2;
  }
  
  return 100; // Pas de match
};

export const filterAndSortItems = (items, searchTerm, getSearchFields) => {
  if (!String(searchTerm || '').trim()) return items;
  
  return items
    .map(item => ({
      item,
      score: Math.min(...getSearchFields(item).map(f => scoreSearchMatch(searchTerm, f)))
    }))
    .filter(r => r.score < 10)
    .sort((a, b) => a.score - b.score)
    .map(r => r.item);
};

/* ============ GESTION DES LOTS ============ */

export const groupLotsByProduct = (lots) => {
  if (!Array.isArray(lots)) {
    console.warn('groupLotsByProduct: lots doit être un tableau');
    return [];
  }

  const groups = new Map();
  
  for (const lot of lots) {
    if (!lot) continue;
    
    const productId = lot.canonical_food_id || 
                     lot.cultivar_id || 
                     lot.generic_product_id ||
                     lot.derived_product_id || 
                     lot.product_id || 
                     `unknown-${lot.id}`;

    const productName = lot.display_name ||
                       lot.canonical_food?.canonical_name ||
                       lot.cultivar?.cultivar_name ||
                       lot.generic_product?.name ||
                       lot.derived_product?.derived_name ||
                       lot.product?.name ||
                       'Produit inconnu';

    if (!groups.has(productId)) {
      groups.set(productId, {
        productId,
        productName,
        lots: [],
        totalQuantity: 0,
        primaryUnit: lot.unit || 'unité',
        category: lot.category_name ||
                 lot.canonical_food?.category ||
                 lot.cultivar?.canonical_food?.category ||
                 lot.generic_product?.category ||
                 lot.product?.category ||
                 'Autre',
        nextExpiry: null
      });
    }
    
    const group = groups.get(productId);
    group.lots.push(lot);
    group.totalQuantity += Number(lot.qty_remaining ?? lot.qty ?? 0);

    const lotExp = lot.effective_expiration || lot.expiration_date || lot.dlc;
    if (lotExp && (!group.nextExpiry || new Date(lotExp) < new Date(group.nextExpiry))) {
      group.nextExpiry = lotExp;
    }
  }
  
  return Array.from(groups.values());
};

export const sortLotsByFEFO = (lots) => {
  if (!Array.isArray(lots)) return [];
  
  return [...lots].sort((a, b) => {
    const da = a.effective_expiration || a.expiration_date || a.dlc;
    const db = b.effective_expiration || b.expiration_date || b.dlc;
    
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    
    const diff = new Date(da) - new Date(db);
    if (diff !== 0) return diff;
    
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });
};

/* ============ CALCULS NUTRITIONNELS ============ */

export const calculateNutritionalValue = (quantity, unit, nutritionPer100g, density = null) => {
  if (!nutritionPer100g || !quantity) return null;

  let grams = null;
  if (getUnitType(unit) === 'weight') {
    grams = convertQuantity(quantity, unit, 'g');
  } else if (getUnitType(unit) === 'volume' && density) {
    grams = convertQuantity(quantity, unit, 'g', density);
  } else {
    return null;
  }

  if (!grams || grams <= 0) return null;

  const base = grams / 100;
  return {
    calories: Math.round((nutritionPer100g.calories || 0) * base),
    protein: Math.round((nutritionPer100g.protein || 0) * base * 10) / 10,
    carbs: Math.round((nutritionPer100g.carbs || 0) * base * 10) / 10,
    fat: Math.round((nutritionPer100g.fat || 0) * base * 10) / 10,
    fiber: Math.round((nutritionPer100g.fiber || 0) * base * 10) / 10,
    sugar: Math.round((nutritionPer100g.sugar || 0) * base * 10) / 10,
    sodium: Math.round((nutritionPer100g.sodium || 0) * base)
  };
};

/* ============ STYLES & THÈME ============ */

export const PantryStyles = {
  colors: {
    primary: '#059669', primaryLight: '#10b981', primaryDark: '#047857',
    secondary: '#0ea5e9', secondaryLight: '#38bdf8', secondaryDark: '#0284c7',
    success: '#059669', warning: '#d97706', error: '#dc2626', info: '#0891b2',
    gray50: '#f9fafb', gray100: '#f3f4f6', gray200: '#e5e7eb', gray300: '#d1d5db',
    gray400: '#9ca3af', gray500: '#6b7280', gray600: '#4b5563', gray700: '#374151',
    gray800: '#1f2937', gray900: '#111827'
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,.05)',
    base: '0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06)',
    md: '0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)',
    xl: '0 20px 25px -5px rgba(0,0,0,.1), 0 10px 10px -5px rgba(0,0,0,.04)'
  },
  borderRadius: { 
    sm: '0.125rem', base: '0.25rem', md: '0.375rem', 
    lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' 
  },
  spacing: { 
    xs: '0.25rem', sm: '0.5rem', base: '1rem', 
    lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' 
  }
};

/* ============ VALIDATIONS ============ */

export const validateLotData = (lotData) => {
  const errors = {};
  
  if (!lotData.qty || Number(lotData.qty) <= 0) {
    errors.qty = 'La quantité doit être positive';
  }
  
  if (!lotData.unit) {
    errors.unit = "L'unité est requise";
  }

  if (lotData.expiration_date) {
    const exp = new Date(lotData.expiration_date);
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    if (exp < today) {
      errors.expiration_date = "La date d'expiration ne peut pas être dans le passé";
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateProductData = (productData) => {
  const errors = {};
  
  if (!productData.name || productData.name.trim().length < 2) {
    errors.name = 'Le nom doit contenir au moins 2 caractères';
  }
  
  if (productData.unit_weight_grams && productData.unit_weight_grams <= 0) {
    errors.unit_weight_grams = 'Le poids unitaire doit être positif';
  }
  
  if (productData.density_g_per_ml && productData.density_g_per_ml <= 0) {
    errors.density_g_per_ml = 'La densité doit être positive';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

/* ============ "INTELLIGENCE" AIDES ============ */

// Normalisation simple (tolérante)
export const normalize = (s = '') =>
  String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Similarité Jaccard très légère pour nommage
export const similarity = (a, b) => {
  const A = new Set(normalize(a).split(/\s+/).filter(Boolean));
  const B = new Set(normalize(b).split(/\s+/).filter(Boolean));
  const inter = [...A].filter((x) => B.has(x)).length;
  const uni = new Set([...A, ...B]).size || 1;
  return inter / uni;
};

// Unité par défaut selon le nom
export const defaultUnitForName = (name) => {
  const n = normalize(name);
  if (/(lait|jus|eau|sirop|huile|bouillon|creme|crème)/.test(n)) return 'ml';
  if (/(riz|farine|sucre|cafe|café|the|thé|sel|semoule|poudre|noix|graines)/.test(n)) return 'g';
  if (/(oeuf|œuf|yaourt|tomate|pomme|banane|avocat|oignon|ail|citron|orange)/.test(n)) return 'pièce';
  return 'g';
};

// Suggestion de lieu selon catégorie
export const suggestLocationByCategory = (cat = '') => {
  const c = normalize(cat);
  if (/(viande|poisson|lait|fromage|charcut)/.test(c)) return { name: 'Frigo' };
  if (/(surgel)/.test(c)) return { name: 'Congélateur' };
  if (/(legume|légume|fruit|oignon|ail|pomme de terre)/.test(c)) return { name: 'Panier' };
  return { name: 'Placard' };
};

// Estimation simple de DLC depuis une durée (en jours)
export const estimateExpiryFromShelfLife = (days) => {
  if (!days && days !== 0) return null;
  try {
    const d = new Date();
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().slice(0, 10);
  } catch (error) {
    console.error('Erreur estimation DLC:', error);
    return null;
  }
};

// Score de confiance (0–100) + libellé/tone
export const confidenceFromSimilarity = (s) => {
  const percent = Math.round((s || 0) * 100);
  let label = 'Faible', tone = 'warning';
  if (percent >= 80) { label = 'Élevée'; tone = 'good'; }
  else if (percent >= 50) { label = 'Moyenne'; tone = 'neutral'; }
  return { percent, label, tone };
};

/* ============ EXPORT GLOBAL PAR DÉFAUT ============ */

export default {
  // Dates
  formatDate, daysUntil, addDays, formatDateISO, isExpired, isExpiringSoon,
  // Conversions
  UNIT_CONVERSIONS, getUnitType, convertQuantity, formatQuantity, formatQty,
  // Statuts / stockage / catégories
  getExpirationStatus, getStorageMethodInfo, getCategoryIcon,
  // Recherche
  normalizeString, scoreSearchMatch, filterAndSortItems,
  // Lots
  groupLotsByProduct, sortLotsByFEFO,
  // Nutrition
  calculateNutritionalValue,
  // Styles
  PantryStyles,
  // Validations
  validateLotData, validateProductData,
  // Intelligence
  normalize, similarity, defaultUnitForName, suggestLocationByCategory,
  estimateExpiryFromShelfLife, confidenceFromSimilarity
};
