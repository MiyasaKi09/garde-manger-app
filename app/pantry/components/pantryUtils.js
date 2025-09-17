// app/pantry/components/pantryUtils.js - Fonctions utilitaires pures

/* ============ NORMALISATION ET MATCHING ============ */

export const normalize = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const similarity = (a, b) => {
  if (!a || !b) return 0;
  const setA = new Set(normalize(a).split(' '));
  const setB = new Set(normalize(b).split(' '));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
};

export const calculateLevenshteinSimilarity = (a, b) => {
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

export const fuzzyMatch = (query, text, threshold = 0.4) => {
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

/* ============ ICÔNES ET CATÉGORIES ============ */

export const getCategoryIcon = (categoryId, categoryName, productName) => {
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

/* ============ FORMATAGE ============ */

export const capitalizeProduct = (name) => {
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

/* ============ GESTION DES DATES ============ */

export const daysUntil = (dateString) => {
  if (!dateString) return null;
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
};

export const getExpirationStatus = (dateString) => {
  const days = daysUntil(dateString);
  if (days === null) return { status: 'unknown', color: '#6b7280', label: 'Date inconnue' };
  if (days < 0) return { status: 'expired', color: '#dc2626', label: 'Expiré' };
  if (days === 0) return { status: 'today', color: '#f59e0b', label: 'Expire aujourd\'hui' };
  if (days <= 3) return { status: 'warning', color: '#f59e0b', label: `Expire dans ${days} jour${days > 1 ? 's' : ''}` };
  if (days <= 7) return { status: 'caution', color: '#eab308', label: `Expire dans ${days} jours` };
  return { status: 'good', color: '#059669', label: `Expire dans ${days} jours` };
};

/* ============ FORMATAGE DES QUANTITÉS ============ */

export const formatQuantity = (qty, unit) => {
  if (!qty && qty !== 0) return '';
  const num = Number(qty);
  if (Number.isNaN(num)) return '';
  
  // Arrondir intelligemment selon l'unité
  let formatted;
  if (unit === 'g' || unit === 'ml') {
    formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
  } else if (unit === 'kg' || unit === 'l') {
    formatted = num.toFixed(2).replace(/\.?0+$/, '');
  } else {
    formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
  }
  
  return `${formatted} ${unit}`;
};

/* ============ GROUPEMENT DES LOTS ============ */

export const groupLotsByProduct = (lots) => {
  if (!Array.isArray(lots)) {
    console.warn('groupLotsByProduct: lots doit être un tableau');
    return [];
  }

  const groups = new Map();

  for (const lot of lots) {
    if (!lot) continue;

    const productType = lot.product_type || lot.meta?.product_type || 'unknown';

    const canonicalId = lot.canonical_food_id
      ?? lot.canonical_food?.id
      ?? lot.cultivar?.canonical_food?.id
      ?? lot.derived_product?.cultivar?.canonical_food?.id
      ?? null;

    const cultivarId = lot.cultivar_id
      ?? lot.cultivar?.id
      ?? lot.derived_product?.cultivar?.id
      ?? null;

    const derivedId = lot.derived_product_id
      ?? lot.derived_product?.id
      ?? null;

    const genericId = lot.generic_product_id
      ?? lot.generic_product?.id
      ?? null;

    const fallbackId = lot.product_id
      || canonicalId
      || cultivarId
      || derivedId
      || genericId
      || `unknown-${lot.id}`;

    let productId;
    switch (productType) {
      case 'canonical':
        productId = canonicalId || fallbackId;
        break;
      case 'cultivar':
        productId = cultivarId || fallbackId;
        break;
      case 'derived':
        productId = derivedId || fallbackId;
        break;
      case 'generic':
        productId = genericId || fallbackId;
        break;
      default:
        productId = fallbackId;
        break;
    }

    const productKey = `${productType}-${productId}`;

    const productName = lot.display_name
      || (productType === 'canonical' && lot.canonical_food?.canonical_name)
      || (productType === 'cultivar' && lot.cultivar?.cultivar_name)
      || (productType === 'derived' && lot.derived_product?.derived_name)
      || (productType === 'generic' && lot.generic_product?.name)
      || lot.canonical_food?.canonical_name
      || lot.cultivar?.cultivar_name
      || lot.generic_product?.name
      || lot.derived_product?.derived_name
      || lot.product?.name
      || 'Produit inconnu';

    const baseCategory = {
      name: lot.category_name || null,
      icon: lot.category_icon || null,
      color: lot.category_color || null
    };

    const relatedCategory =
      (productType === 'canonical' && lot.canonical_food?.category)
      || (productType === 'cultivar' && lot.cultivar?.canonical_food?.category)
      || (productType === 'derived' && lot.derived_product?.cultivar?.canonical_food?.category)
      || (productType === 'generic' && lot.generic_product?.category)
      || lot.canonical_food?.category
      || lot.cultivar?.canonical_food?.category
      || lot.generic_product?.category
      || lot.derived_product?.cultivar?.canonical_food?.category
      || lot.product?.category
      || null;

    const categoryInfo = {
      name: baseCategory.name || relatedCategory?.name || (typeof relatedCategory === 'string' ? relatedCategory : null),
      icon: baseCategory.icon || relatedCategory?.icon || null,
      color: baseCategory.color || relatedCategory?.color_hex || relatedCategory?.color || null
    };

    if (!groups.has(productKey)) {
      groups.set(productKey, {
        productId,
        productKey,

        productName,
        productType,
        canonicalId: canonicalId ?? null,
        cultivarId: cultivarId ?? null,
        derivedId: derivedId ?? null,
        genericId: genericId ?? null,
        lots: [],
        totalQuantity: 0,
        primaryUnit: lot.unit || lot.meta?.primary_unit || 'unité',
        category: categoryInfo.name || 'Autre',
        categoryIcon: categoryInfo.icon || '📦',
        categoryColor: categoryInfo.color || '#808080',
        nextExpiry: null
      });
    }

    const group = groups.get(productKey);
    group.lots.push(lot);
    group.totalQuantity += Number(lot.qty_remaining ?? lot.qty ?? 0);


    if ((!group.category || group.category === 'Autre') && categoryInfo.name) {
      group.category = categoryInfo.name;
    }
    if ((!group.categoryIcon || group.categoryIcon === '📦') && categoryInfo.icon) {
      group.categoryIcon = categoryInfo.icon;
    }
    if ((!group.categoryColor || group.categoryColor === '#808080') && categoryInfo.color) {
      group.categoryColor = categoryInfo.color;
    }

    const lotExpiration = lot.effective_expiration || lot.expiration_date || lot.best_before || null;
    if (lotExpiration) {
      if (!group.nextExpiry || lotExpiration < group.nextExpiry) {
        group.nextExpiry = lotExpiration;
      }
    }
  }


  return Array.from(groups.values()).sort((a, b) =>
    a.productName.localeCompare(b.productName, 'fr', { sensitivity: 'base' })
  );
};
