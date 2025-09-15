// app/pantry/components/pantryUtils.js

// ============ DATES ET TEMPS ============

export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
};

export const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDateISO = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const isExpired = (date) => {
  return daysUntil(date) < 0;
};

export const isExpiringSoon = (date, threshold = 3) => {
  const days = daysUntil(date);
  return days !== null && days >= 0 && days <= threshold;
};

// ============ CONVERSION D'UNITÉS ============

export const UNIT_CONVERSIONS = {
  // Poids
  weight: {
    'g': 1,
    'kg': 1000,
    'mg': 0.001,
    'oz': 28.35,
    'lb': 453.6
  },
  
  // Volume
  volume: {
    'ml': 1,
    'l': 1000,
    'cl': 10,
    'dl': 100,
    'cup': 240,
    'tsp': 5,
    'tbsp': 15,
    'fl oz': 29.57
  },
  
  // Unités spécifiques
  count: {
    'pièce': 1,
    'unité': 1,
    'dozen': 12
  }
};

export const getUnitType = (unit) => {
  const normalizedUnit = unit.toLowerCase().trim();
  
  for (const [type, units] of Object.entries(UNIT_CONVERSIONS)) {
    if (units[normalizedUnit] !== undefined) {
      return type;
    }
  }
  
  return 'other';
};

export const convertQuantity = (quantity, fromUnit, toUnit, density = null) => {
  const fromType = getUnitType(fromUnit);
  const toType = getUnitType(toUnit);
  
  // Conversion directe dans le même type
  if (fromType === toType && fromType !== 'other') {
    const fromFactor = UNIT_CONVERSIONS[fromType][fromUnit.toLowerCase()] || 1;
    const toFactor = UNIT_CONVERSIONS[toType][toUnit.toLowerCase()] || 1;
    return (quantity * fromFactor) / toFactor;
  }
  
  // Conversion poids -> volume avec densité
  if (fromType === 'weight' && toType === 'volume' && density) {
    const gramsQuantity = quantity * (UNIT_CONVERSIONS.weight[fromUnit.toLowerCase()] || 1);
    const mlQuantity = gramsQuantity / density;
    const toFactor = UNIT_CONVERSIONS.volume[toUnit.toLowerCase()] || 1;
    return mlQuantity / toFactor;
  }
  
  // Conversion volume -> poids avec densité
  if (fromType === 'volume' && toType === 'weight' && density) {
    const mlQuantity = quantity * (UNIT_CONVERSIONS.volume[fromUnit.toLowerCase()] || 1);
    const gramsQuantity = mlQuantity * density;
    const toFactor = UNIT_CONVERSIONS.weight[toUnit.toLowerCase()] || 1;
    return gramsQuantity / toFactor;
  }
  
  // Pas de conversion possible
  return null;
};

export const formatQuantity = (quantity, unit, precision = 1) => {
  if (quantity === null || quantity === undefined) return '—';
  
  const formatted = Number(quantity).toFixed(precision);
  return `${formatted} ${unit}`;
};

// ============ STATUTS ET PRIORITÉS ============

export const getExpirationStatus = (daysUntilExpiry) => {
  if (daysUntilExpiry === null) {
    return {
      status: 'unknown',
      level: 0,
      color: '#6b7280',
      bgColor: '#f9fafb',
      label: 'Sans date',
      priority: 3
    };
  }
  
  if (daysUntilExpiry < 0) {
    return {
      status: 'expired',
      level: 4,
      color: '#dc2626',
      bgColor: '#fef2f2',
      label: 'Expiré',
      priority: 1
    };
  }
  
  if (daysUntilExpiry === 0) {
    return {
      status: 'today',
      level: 3,
      color: '#ea580c',
      bgColor: '#fff7ed',
      label: 'Aujourd\'hui',
      priority: 2
    };
  }
  
  if (daysUntilExpiry <= 3) {
    return {
      status: 'critical',
      level: 3,
      color: '#d97706',
      bgColor: '#fffbeb',
      label: `${daysUntilExpiry}j`,
      priority: 2
    };
  }
  
  if (daysUntilExpiry <= 7) {
    return {
      status: 'warning',
      level: 2,
      color: '#ca8a04',
      bgColor: '#fefce8',
      label: `${daysUntilExpiry}j`,
      priority: 3
    };
  }
  
  if (daysUntilExpiry <= 14) {
    return {
      status: 'attention',
      level: 1,
      color: '#0891b2',
      bgColor: '#f0f9ff',
      label: `${daysUntilExpiry}j`,
      priority: 4
    };
  }
  
  return {
    status: 'good',
    level: 0,
    color: '#059669',
    bgColor: '#ecfdf5',
    label: `${daysUntilExpiry}j`,
    priority: 5
  };
};

export const getStorageMethodInfo = (method) => {
  const methods = {
    'fridge': {
      label: 'Frigo',
      icon: '❄️',
      color: '#0ea5e9',
      description: 'Conservation au réfrigérateur (2-4°C)'
    },
    'freezer': {
      label: 'Congélateur',
      icon: '🧊',
      color: '#06b6d4',
      description: 'Conservation au congélateur (-18°C)'
    },
    'pantry': {
      label: 'Placard',
      icon: '🏠',
      color: '#8b5cf6',
      description: 'Conservation à température ambiante'
    },
    'counter': {
      label: 'Plan de travail',
      icon: '🏪',
      color: '#f59e0b',
      description: 'À consommer rapidement'
    },
    'cellar': {
      label: 'Cave',
      icon: '🍷',
      color: '#7c3aed',
      description: 'Conservation en cave (10-15°C)'
    }
  };
  
  return methods[method] || {
    label: method,
    icon: '📦',
    color: '#6b7280',
    description: 'Méthode de conservation'
  };
};

// ============ CATÉGORISATION ET CLASSIFICATION ============

export const getCategoryIcon = (categoryName) => {
  if (!categoryName) return '📦';
  
  const name = categoryName.toLowerCase();
  
  const icons = {
    // Légumes
    'légume': '🥬', 'légumes': '🥬', 'vegetable': '🥬',
    'salade': '🥗', 'verdure': '🥬',
    
    // Fruits
    'fruit': '🍎', 'fruits': '🍎',
    'agrume': '🍊', 'agrumes': '🍊',
    'baie': '🫐', 'baies': '🫐',
    
    // Protéines
    'viande': '🥩', 'viandes': '🥩', 'meat': '🥩',
    'volaille': '🐔', 'porc': '🐷', 'bœuf': '🐄', 'agneau': '🐑',
    'poisson': '🐟', 'poissons': '🐟', 'fish': '🐟',
    'fruits de mer': '🦐', 'crustacé': '🦀', 'mollusque': '🐚',
    'œuf': '🥚', 'œufs': '🥚', 'egg': '🥚',
    
    // Produits laitiers
    'lait': '🥛', 'laitier': '🥛', 'dairy': '🥛',
    'fromage': '🧀', 'yaourt': '🥛', 'crème': '🥛',
    'beurre': '🧈',
    
    // Céréales et féculents
    'céréale': '🌾', 'céréales': '🌾', 'grain': '🌾',
    'riz': '🍚', 'pâte': '🍝', 'pâtes': '🍝',
    'pain': '🍞', 'farine': '🌾',
    'pomme de terre': '🥔', 'féculent': '🥔',
    
    // Légumineuses
    'légumineuse': '🫘', 'légumineuses': '🫘',
    'haricot': '🫘', 'lentille': '🫘', 'pois': '🫘',
    
    // Épices et aromates
    'épice': '🌶️', 'épices': '🌶️', 'spice': '🌶️',
    'aromate': '🌿', 'aromates': '🌿', 'herbe': '🌿',
    'condiment': '🧂', 'condiments': '🧂',
    
    // Huiles et matières grasses
    'huile': '🫒', 'huiles': '🫒', 'oil': '🫒',
    'matière grasse': '🧈',
    
    // Boissons
    'boisson': '🥤', 'boissons': '🥤', 'drink': '🥤',
    'eau': '💧', 'jus': '🧃', 'soda': '🥤',
    'alcool': '🍷', 'vin': '🍷', 'bière': '🍺',
    'café': '☕', 'thé': '🍵',
    
    // Sucré
    'sucre': '🍯', 'miel': '🍯', 'confiture': '🍯',
    'chocolat': '🍫', 'bonbon': '🍬',
    'pâtisserie': '🧁', 'gâteau': '🎂',
    
    // Conserves
    'conserve': '🥫', 'conserves': '🥫',
    'bocal': '🫙', 'boîte': '🥫',
    
    // Surgelés
    'surgelé': '🧊', 'surgelés': '🧊', 'frozen': '🧊'
  };
  
  // Recherche exacte puis partielle
  return icons[name] || 
         Object.keys(icons).find(key => name.includes(key) || key.includes(name)) && 
         icons[Object.keys(icons).find(key => name.includes(key) || key.includes(name))] || 
         '📦';
};

// ============ RECHERCHE ET FILTRAGE ============

export const normalizeString = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .trim();
};

export const scoreSearchMatch = (searchTerm, targetString, options = {}) => {
  const {
    exactMatchBonus = 0,
    startsWithBonus = 1,
    wordStartBonus = 2,
    containsBonus = 3,
    noMatchPenalty = 10
  } = options;
  
  const normalizedSearch = normalizeString(searchTerm);
  const normalizedTarget = normalizeString(targetString);
  
  // Correspondance exacte
  if (normalizedTarget === normalizedSearch) {
    return exactMatchBonus;
  }
  
  // Commence par le terme
  if (normalizedTarget.startsWith(normalizedSearch)) {
    return startsWithBonus;
  }
  
  // Début de mot
  if (normalizedTarget.includes(' ' + normalizedSearch)) {
    return wordStartBonus;
  }
  
  // Contient le terme
  if (normalizedTarget.includes(normalizedSearch)) {
    return containsBonus;
  }
  
  // Recherche de mots partiels
  const searchWords = normalizedSearch.split(' ');
  const targetWords = normalizedTarget.split(' ');
  
  let partialMatches = 0;
  for (const searchWord of searchWords) {
    for (const targetWord of targetWords) {
      if (targetWord.includes(searchWord) || searchWord.includes(targetWord)) {
        partialMatches++;
        break;
      }
    }
  }
  
  if (partialMatches > 0) {
    return containsBonus + (searchWords.length - partialMatches);
  }
  
  return noMatchPenalty;
};

export const filterAndSortItems = (items, searchTerm, getSearchFields) => {
  if (!searchTerm.trim()) return items;
  
  const results = items.map(item => {
    const fields = getSearchFields(item);
    const bestScore = Math.min(
      ...fields.map(field => scoreSearchMatch(searchTerm, field))
    );
    
    return {
      item,
      score: bestScore
    };
  });
  
  return results
    .filter(result => result.score < 10) // Exclut les non-matches
    .sort((a, b) => a.score - b.score)
    .map(result => result.item);
};

// ============ GESTION DES LOTS ============

export const groupLotsByProduct = (lots) => {
  const groups = new Map();
  
  for (const lot of lots) {
    const productId = lot.canonical_food_id || lot.cultivar_id || 
                     lot.generic_product_id || lot.derived_product_id || 
                     lot.product_id;
                     
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
        primaryUnit: lot.unit,
        category: lot.category_name || lot.canonical_food?.category || 
                 lot.cultivar?.canonical_food?.category ||
                 lot.generic_product?.category ||
                 lot.product?.category,
        nextExpiry: null
      });
    }
    
    const group = groups.get(productId);
    group.lots.push(lot);
    
    // Calcul de la quantité totale (approximatif, conversion perfectible)
    group.totalQuantity += lot.qty_remaining || lot.qty || 0;
    
    // Recherche de la prochaine expiration
    const lotExpiry = lot.effective_expiration || lot.expiration_date || lot.dlc;
    if (lotExpiry && (!group.nextExpiry || new Date(lotExpiry) < new Date(group.nextExpiry))) {
      group.nextExpiry = lotExpiry;
    }
  }
  
  return Array.from(groups.values());
};

export const sortLotsByFEFO = (lots) => {
  return [...lots].sort((a, b) => {
    const dateA = a.effective_expiration || a.expiration_date || a.dlc;
    const dateB = b.effective_expiration || b.expiration_date || b.dlc;
    
    // Les lots sans date vont à la fin
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // Tri par date d'expiration (FEFO)
    const diff = new Date(dateA) - new Date(dateB);
    if (diff !== 0) return diff;
    
    // En cas d'égalité, tri par date de création (plus ancien en premier)
    const createdA = a.created_at || '';
    const createdB = b.created_at || '';
    return new Date(createdA) - new Date(createdB);
  });
};

// ============ CALCULS NUTRITIONNELS ============

export const calculateNutritionalValue = (quantity, unit, nutritionPer100g, density = null) => {
  if (!nutritionPer100g || !quantity) return null;
  
  // Conversion vers 100g de base
  let baseQuantityIn100g = 0;
  
  if (getUnitType(unit) === 'weight') {
    const gramsQuantity = convertQuantity(quantity, unit, 'g');
    baseQuantityIn100g = gramsQuantity / 100;
  } else if (getUnitType(unit) === 'volume' && density) {
    const gramsQuantity = convertQuantity(quantity, unit, 'g', density);
    if (gramsQuantity !== null) {
      baseQuantityIn100g = gramsQuantity / 100;
    }
  } else {
    // Pour les unités comme "pièce", on ne peut pas calculer sans info supplémentaire
    return null;
  }
  
  if (baseQuantityIn100g <= 0) return null;
  
  return {
    calories: Math.round((nutritionPer100g.calories || 0) * baseQuantityIn100g),
    protein: Math.round((nutritionPer100g.protein || 0) * baseQuantityIn100g * 10) / 10,
    carbs: Math.round((nutritionPer100g.carbs || 0) * baseQuantityIn100g * 10) / 10,
    fat: Math.round((nutritionPer100g.fat || 0) * baseQuantityIn100g * 10) / 10,
    fiber: Math.round((nutritionPer100g.fiber || 0) * baseQuantityIn100g * 10) / 10,
    sugar: Math.round((nutritionPer100g.sugar || 0) * baseQuantityIn100g * 10) / 10,
    sodium: Math.round((nutritionPer100g.sodium || 0) * baseQuantityIn100g)
  };
};

// ============ STYLES ET THÈMES ============

export const PantryStyles = {
  colors: {
    primary: '#059669',
    primaryLight: '#10b981',
    primaryDark: '#047857',
    
    secondary: '#0ea5e9',
    secondaryLight: '#38bdf8',
    secondaryDark: '#0284c7',
    
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0891b2',
    
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  
  borderRadius: {
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    base: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  }
};

// ============ VALIDATIONS ============

export const validateLotData = (lotData) => {
  const errors = {};
  
  if (!lotData.qty || lotData.qty <= 0) {
    errors.qty = 'La quantité doit être positive';
  }
  
  if (!lotData.unit) {
    errors.unit = 'L\'unité est requise';
  }
  
  if (lotData.expiration_date) {
    const expiryDate = new Date(lotData.expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expiryDate < today) {
      errors.expiration_date = 'La date d\'expiration ne peut pas être dans le passé';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
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
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// ============ EXPORT DEFAULT ============

export default {
  // Dates
  formatDate,
  daysUntil,
  addDays,
  formatDateISO,
  isExpired,
  isExpiringSoon,
  
  // Conversions
  convertQuantity,
  formatQuantity,
  getUnitType,
  
  // Statuts
  getExpirationStatus,
  getStorageMethodInfo,
  getCategoryIcon,
  
  // Recherche
  normalizeString,
  scoreSearchMatch,
  filterAndSortItems,
  
  // Lots
  groupLotsByProduct,
  sortLotsByFEFO,
  
  // Nutrition
  calculateNutritionalValue,
  
  // Validation
  validateLotData,
  validateProductData,
  
  // Styles
  PantryStyles
};
