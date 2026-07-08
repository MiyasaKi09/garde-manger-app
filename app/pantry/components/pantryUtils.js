// Source unique pour getEffectiveExpiration (lib/utils.js est la référence, pantryUtils délègue).
import { getEffectiveExpiration } from '@/lib/utils';
export { getEffectiveExpiration };

/**
 * Ajoute la propriété effective_expiration à chaque lot d'un tableau
 */
export function mapLotsWithEffectiveExpiration(lots) {
  if (!Array.isArray(lots)) return [];
  return lots.map(lot => ({
    ...lot,
    effective_expiration: getEffectiveExpiration(lot)
  }));
}
// app/pantry/components/pantryUtils.js - Version améliorée

/* ============ NORMALISATION ET MATCHING ============ */

/**
 * Normalise une chaîne pour la comparaison
 * - Enlève les accents
 * - Convertit en minuscules
 * - Enlève la ponctuation
 */
export const normalize = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
    .replace(/[^a-z0-9\s]/g, '') // Enlève la ponctuation sauf espaces
    .replace(/\s+/g, ' ') // Normalise les espaces multiples
    .trim();
};

/**
 * Calcule la similarité de Jaccard entre deux chaînes
 */
export const similarity = (a, b) => {
  if (!a || !b) return 0;
  const setA = new Set(normalize(a).split(' '));
  const setB = new Set(normalize(b).split(' '));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
export const calculateLevenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
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

/**
 * Calcule la similarité basée sur la distance de Levenshtein
 */
export const calculateLevenshteinSimilarity = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  
  const distance = calculateLevenshteinDistance(a, b);
  return Math.max(0, (maxLength - distance) / maxLength);
};

/**
 * Fonction de matching flou avancée
 * Combine plusieurs algorithmes pour un meilleur résultat
 */
export const fuzzyMatch = (query, text, options = {}) => {
  const {
    threshold = 0.3,
    boostExact = true,
    boostStartsWith = true,
    boostContains = true,
    boostWordMatch = true,
    useLevenshtein = true
  } = options;

  if (!query || !text) return 0;
  
  const q = normalize(query);
  const t = normalize(text);
  
  // Score de base
  let score = 0;
  let matches = [];
  
  // 1. Correspondance exacte
  if (boostExact && t === q) {
    return 1.0;
  }
  
  // 2. Commence par la requête
  if (boostStartsWith && t.startsWith(q)) {
    matches.push({ type: 'startsWith', score: 0.95 });
  }
  
  // 3. Contient la requête
  if (boostContains && t.includes(q)) {
    const position = t.indexOf(q);
    const positionScore = 1 - (position / t.length) * 0.2;
    matches.push({ type: 'contains', score: 0.8 * positionScore });
  }
  
  // 4. Tous les mots de la requête sont dans le texte
  if (boostWordMatch) {
    const qWords = q.split(/\s+/).filter(w => w.length > 0);
    const tWords = t.split(/\s+/).filter(w => w.length > 0);
    
    if (qWords.length > 0) {
      let matchedWords = 0;
      let wordScores = [];
      
      for (const qWord of qWords) {
        let bestWordScore = 0;
        
        for (const tWord of tWords) {
          // Correspondance exacte de mot
          if (tWord === qWord) {
            bestWordScore = 1.0;
            break;
          }
          // Le mot commence par
          else if (tWord.startsWith(qWord) || qWord.startsWith(tWord)) {
            bestWordScore = Math.max(bestWordScore, 0.8);
          }
          // Contient
          else if (tWord.includes(qWord) || qWord.includes(tWord)) {
            bestWordScore = Math.max(bestWordScore, 0.6);
          }
          // Distance de Levenshtein pour les mots similaires
          else if (useLevenshtein) {
            const wordSim = calculateLevenshteinSimilarity(qWord, tWord);
            if (wordSim > 0.7) {
              bestWordScore = Math.max(bestWordScore, wordSim * 0.8);
            }
          }
        }
        
        if (bestWordScore > 0) {
          matchedWords++;
          wordScores.push(bestWordScore);
        }
      }
      
      if (matchedWords > 0) {
        const avgWordScore = wordScores.reduce((a, b) => a + b, 0) / qWords.length;
        matches.push({ type: 'words', score: avgWordScore * 0.9 });
      }
    }
  }
  
  // 5. Similarité de Jaccard
  const jaccardSim = similarity(query, text);
  if (jaccardSim > threshold) {
    matches.push({ type: 'jaccard', score: jaccardSim * 0.7 });
  }
  
  // 6. Distance de Levenshtein globale
  if (useLevenshtein) {
    const levSim = calculateLevenshteinSimilarity(q, t);
    
    // Boost pour les fautes de frappe mineures
    if (calculateLevenshteinDistance(q, t) <= 2) {
      matches.push({ type: 'levenshtein', score: 0.85 });
    } else if (calculateLevenshteinDistance(q, t) <= 3) {
      matches.push({ type: 'levenshtein', score: 0.75 });
    } else if (levSim > 0.6) {
      matches.push({ type: 'levenshtein', score: levSim * 0.8 });
    }
  }
  
  // Calculer le score final (prendre le meilleur)
  if (matches.length === 0) return 0;
  
  score = Math.max(...matches.map(m => m.score));
  
  // Debug (optionnel)
  if (process.env.NODE_ENV === 'development' && score > 0.5) {
    console.debug(`Match: "${query}" vs "${text}"`, { score, matches });
  }
  
  return score;
};

/* ============ ICÔNES ET CATÉGORIES ============ */

// Map complète des icônes par category_id
const CATEGORY_ICONS = {
  1: '🍎',  // Fruits
  2: '🥕',  // Légumes
  3: '🍄',  // Champignons
  4: '🥚',  // Œufs et ovoproduits
  5: '🌾',  // Céréales et grains
  6: '🫘',  // Légumineuses
  7: '🥛',  // Produits laitiers
  8: '🥩',  // Viandes
  9: '🐟',  // Poissons et fruits de mer
  10: '🌶️', // Épices et aromates
  11: '🫒', // Huiles et graisses
  12: '🥫', // Conserves et bocaux
  13: '🌰', // Noix et graines
  14: '🍯'  // Édulcorants
};

// Map des icônes spécifiques par nom de produit
const PRODUCT_ICONS = {
  // Fruits
  'tomate': '🍅', 'pomme': '🍎', 'banane': '🍌', 'orange': '🍊',
  'citron': '🍋', 'fraise': '🍓', 'raisin': '🍇', 'avocat': '🥑',
  'peche': '🍑', 'poire': '🍐', 'cerise': '🍒', 'ananas': '🍍',
  'mangue': '🥭', 'kiwi': '🥝', 'melon': '🍈', 'pasteque': '🍉',
  
  // Légumes
  'carotte': '🥕', 'poivron': '🫑', 'aubergine': '🍆', 'courgette': '🥒',
  'brocoli': '🥦', 'champignon': '🍄', 'oignon': '🧅', 'ail': '🧄',
  'patate': '🥔', 'pomme de terre': '🥔', 'mais': '🌽', 'piment': '🌶️',
  'salade': '🥬', 'epinard': '🥬', 'chou': '🥬',
  
  // Protéines
  'oeuf': '🥚', 'poulet': '🐔', 'boeuf': '🥩', 'porc': '🥓',
  'poisson': '🐟', 'crevette': '🦐', 'crabe': '🦀', 'homard': '🦞',
  'saumon': '🐟', 'thon': '🐟', 'bacon': '🥓',
  
  // Produits laitiers
  'lait': '🥛', 'fromage': '🧀', 'yaourt': '🥛', 'beurre': '🧈',
  'creme': '🥛',
  
  // Féculents
  'pain': '🍞', 'baguette': '🥖', 'croissant': '🥐', 'riz': '🍚',
  'pate': '🍝', 'spaghetti': '🍝', 'pizza': '🍕', 'gateau': '🍰',
  'cookie': '🍪', 'biscuit': '🍪',
  
  // Boissons
  'eau': '💧', 'cafe': '☕', 'the': '🍵', 'jus': '🥤',
  'soda': '🥤', 'biere': '🍺', 'vin': '🍷', 'champagne': '🍾',
  
  // Condiments et autres
  'sel': '🧂', 'sucre': '🍬', 'miel': '🍯', 'chocolat': '🍫',
  'huile': '🫒', 'vinaigre': '🍶', 'sauce': '🍶', 'ketchup': '🍅',
  'mayonnaise': '🥫', 'moutarde': '🟡',
  
  // Snacks
  'chips': '🥔', 'popcorn': '🍿', 'cacahuete': '🥜', 'amande': '🌰',
  'noix': '🌰', 'noisette': '🌰'
};

// Map des icônes par catégorie générique
const CATEGORY_NAME_ICONS = {
  'fruit': '🍎',
  'legume': '🥕',
  'champignon': '🍄',
  'oeuf': '🥚',
  'cereale': '🌾',
  'legumineuse': '🫘',
  'laitier': '🥛',
  'laitage': '🥛',
  'viande': '🥩',
  'poisson': '🐟',
  'fruit de mer': '🦐',
  'epice': '🌶️',
  'aromate': '🌿',
  'herbe': '🌿',
  'huile': '🫒',
  'graisse': '🧈',
  'conserve': '🥫',
  'bocal': '🫙',
  'noix': '🌰',
  'graine': '🌰',
  'edulcorant': '🍯',
  'sucre': '🍬',
  'boisson': '🥤',
  'alcool': '🍷',
  'condiment': '🧂',
  'sauce': '🍶',
  'patisserie': '🍰',
  'boulangerie': '🍞',
  'snack': '🍿',
  'confiserie': '🍬'
};

/**
 * Obtient l'icône appropriée pour un produit
 * Essaie dans l'ordre : ID catégorie, nom produit, nom catégorie
 */
export const getCategoryIcon = (categoryId, categoryName, productName, categoriesMap = null) => {
  // 1. Essayer avec l'ID de catégorie
  if (categoryId && CATEGORY_ICONS[categoryId]) {
    return CATEGORY_ICONS[categoryId];
  }
  
  // 2. Si on a une map de catégories, l'utiliser
  if (categoryId && categoriesMap?.has(categoryId)) {
    const category = categoriesMap.get(categoryId);
    if (category?.icon) return category.icon;
  }
  
  // 3. Chercher par nom de produit
  if (productName) {
    const normalizedProduct = normalize(productName);
    
    // Recherche exacte
    if (PRODUCT_ICONS[normalizedProduct]) {
      return PRODUCT_ICONS[normalizedProduct];
    }
    
    // Recherche partielle
    for (const [key, icon] of Object.entries(PRODUCT_ICONS)) {
      if (normalizedProduct.includes(key) || key.includes(normalizedProduct)) {
        return icon;
      }
    }
    
    // Recherche par mots
    const words = normalizedProduct.split(/\s+/);
    for (const word of words) {
      if (PRODUCT_ICONS[word]) {
        return PRODUCT_ICONS[word];
      }
    }
  }
  
  // 4. Chercher par nom de catégorie
  if (categoryName) {
    const normalizedCategory = normalize(categoryName);
    
    // Recherche exacte
    if (CATEGORY_NAME_ICONS[normalizedCategory]) {
      return CATEGORY_NAME_ICONS[normalizedCategory];
    }
    
    // Recherche partielle
    for (const [key, icon] of Object.entries(CATEGORY_NAME_ICONS)) {
      if (normalizedCategory.includes(key)) {
        return icon;
      }
    }
  }
  
  // 5. Icône par défaut
  return '📦';
};

/* ============ FORMATAGE ============ */

/**
 * Capitalise correctement un nom de produit
 */
export const capitalizeProduct = (name) => {
  if (!name) return '';
  
  // Mots qui restent en minuscules
  const lowerWords = ['de', 'du', 'des', 'le', 'la', 'les', 'au', 'aux', 'et', 'ou', 'en'];
  
  return name
    .toLowerCase()
    .split(/[\s-]+/)
    .map((word, index) => {
      // Toujours capitaliser le premier mot
      if (index === 0 || !lowerWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
};

/**
 * Formate une quantité avec son unité
 */
export const formatQuantity = (quantity, unit) => {
  if (!quantity) return '';
  
  // Arrondir intelligemment
  const rounded = quantity < 1 ? 
    Math.round(quantity * 100) / 100 : 
    Math.round(quantity * 10) / 10;
  
  // Formatter selon l'unité
  const unitMap = {
    'piece': rounded === 1 ? 'pièce' : 'pièces',
    'g': `${rounded}g`,
    'kg': `${rounded}kg`,
    'ml': `${rounded}mL`,
    'l': `${rounded}L`,
    'boite': rounded === 1 ? 'boîte' : 'boîtes',
    'sachet': rounded === 1 ? 'sachet' : 'sachets',
    'bouteille': rounded === 1 ? 'bouteille' : 'bouteilles'
  };
  
  return unitMap[unit?.toLowerCase()] || `${rounded} ${unit}`;
};

// Délègue vers lib/dates.js pour un calcul UTC cohérent (évite les décalages DST ±1j).
// Import (et pas seulement `export ... from`) : daysUntil est utilisé localement
// (formatExpiryDate, sortByExpiry, export default) et formatDate est consommé
// par LifespanBadge via ce module.
import { daysUntil, formatDate } from '@/lib/dates';
export { daysUntil, formatDate };

/**
 * Formate une date d'expiration avec indicateur visuel
 */
export const formatExpiryDate = (dateStr) => {
  const days = daysUntil(dateStr);

  if (days === null) return { text: 'Pas de date', color: 'gray', emoji: '📅' };
  if (days < 0) return { text: `Expiré depuis ${-days}j`, color: 'red', emoji: '❌' };
  if (days === 0) return { text: 'Expire aujourd\'hui', color: 'red', emoji: '⚠️' };
  if (days === 1) return { text: 'Expire demain', color: 'orange', emoji: '⚠️' };
  if (days <= 3) return { text: `Expire dans ${days}j`, color: 'orange', emoji: '⚠️' };
  if (days <= 7) return { text: `Expire dans ${days}j`, color: 'yellow', emoji: '📅' };
  if (days <= 30) return { text: `Expire dans ${days}j`, color: 'green', emoji: '✅' };
  
  const months = Math.floor(days / 30);
  if (months === 1) return { text: 'Expire dans 1 mois', color: 'green', emoji: '✅' };
  return { text: `Expire dans ${months} mois`, color: 'green', emoji: '✅' };
};

// Teintes claires dérivées des couleurs de statut (fond des badges).
const STATUS_BG = {
  red: 'rgba(220,38,38,0.12)',
  orange: 'rgba(249,115,22,0.12)',
  yellow: 'rgba(250,204,21,0.15)',
  green: 'rgba(34,197,94,0.10)',
  gray: 'rgba(107,114,128,0.10)',
};

/**
 * Retourne un statut d'expiration basé sur le nombre de jours restants.
 * Règle métier : alerte à J-3 pour les DLC (et durées estimées), J-7 pour les DDM —
 * le paramètre expiryKind ('DLC' | 'DDM' | 'ESTIMATE') décale les seuils orange/jaune.
 * Retourne { label, color, bgColor } — bgColor est une teinte claire de color.
 */
export const getExpirationStatus = (days, expiryKind) => {
  if (days === null) {
    return { label: 'Sans date', color: '#6b7280', bgColor: STATUS_BG.gray };
  }

  if (days < 0) {
    return { label: `Expiré depuis ${Math.abs(days)}j`, color: '#dc2626', bgColor: STATUS_BG.red };
  }

  if (days === 0) {
    return { label: "Expire aujourd'hui", color: '#dc2626', bgColor: STATUS_BG.red };
  }

  if (days === 1) {
    return { label: 'Expire demain', color: '#f97316', bgColor: STATUS_BG.orange };
  }

  const orange = expiryKind === 'DDM' ? 7 : 3;
  const jaune = expiryKind === 'DDM' ? 14 : 7;

  if (days <= orange) {
    return { label: `Expire dans ${days}j`, color: '#f97316', bgColor: STATUS_BG.orange };
  }

  if (days <= jaune) {
    return { label: `Expire dans ${days}j`, color: '#facc15', bgColor: STATUS_BG.yellow };
  }

  if (days <= 30) {
    return { label: `Expire dans ${days}j`, color: '#22c55e', bgColor: STATUS_BG.green };
  }

  const months = Math.floor(days / 30);
  if (months === 1) {
    return { label: 'Expire dans 1 mois', color: '#16a34a', bgColor: STATUS_BG.green };
  }

  return { label: `Expire dans ${months} mois`, color: '#16a34a', bgColor: STATUS_BG.green };
};

/* ============ GROUPEMENT ET TRI ============ */

/**
 * Groupe les lots par produit
 */
export const groupLotsByProduct = (lots) => {
  const groups = {};
  
  lots.forEach(lot => {
    const key = lot.product_id || 'unknown';
    if (!groups[key]) {
      groups[key] = {
        productId: lot.product_id,
        productName: lot.product?.name || 'Produit inconnu',
        productIcon: lot.product?.icon || '📦',
        category: lot.product?.category || {},
        lots: [],
        totalQuantity: 0,
        nextExpiry: null
      };
    }
    
    groups[key].lots.push(lot);
    groups[key].totalQuantity += lot.quantity || 0;
    
    // Trouver la prochaine expiration
    if (lot.expiry_date) {
      if (!groups[key].nextExpiry || lot.expiry_date < groups[key].nextExpiry) {
        groups[key].nextExpiry = lot.expiry_date;
      }
    }
  });
  
  return Object.values(groups);
};

/**
 * Trie les produits par urgence d'expiration
 */
export const sortByExpiry = (products) => {
  return [...products].sort((a, b) => {
    const daysA = daysUntil(a.nextExpiry);
    const daysB = daysUntil(b.nextExpiry);
    
    // Les expirés en premier
    if (daysA !== null && daysA < 0 && (daysB === null || daysB >= 0)) return -1;
    if (daysB !== null && daysB < 0 && (daysA === null || daysA >= 0)) return 1;
    
    // Puis ceux qui expirent bientôt
    if (daysA === null && daysB === null) return 0;
    if (daysA === null) return 1;
    if (daysB === null) return -1;
    
    return daysA - daysB;
  });
};

/* ============ VALIDATION ============ */

/**
 * Valide une date d'expiration.
 * Utilise daysUntil() (UTC, conforme à lib/dates.js) pour éviter les décalages DST ±1j.
 */
export const validateExpiryDate = (date) => {
  if (!date) return { valid: true, message: '' };

  // Vérifier que la date est parseable avant de passer à daysUntil
  const parsed = new Date(String(date).split('T')[0]);
  if (isNaN(parsed.getTime())) {
    return { valid: false, message: 'Date invalide' };
  }

  // daysUntil compare les portions YYYY-MM-DD en UTC (voir lib/dates.js)
  const days = daysUntil(date);

  if (days === null) {
    return { valid: false, message: 'Date invalide' };
  }

  // Avertissement si la date est dans le passé
  if (days < 0) {
    return { valid: true, warning: true, message: 'Cette date est déjà passée' };
  }

  // Avertissement si la date est très lointaine (plus de 5 ans)
  if (days > 365 * 5) {
    return { valid: true, warning: true, message: 'Cette date semble très lointaine' };
  }

  return { valid: true, message: '' };
};

/**
 * Valide une quantité
 */
export const validateQuantity = (quantity, unit) => {
  const qty = parseFloat(quantity);
  
  if (isNaN(qty) || qty <= 0) {
    return { valid: false, message: 'La quantité doit être supérieure à 0' };
  }
  
  // Avertissement pour les quantités très élevées
  const maxQuantities = {
    'g': 10000,      // 10 kg
    'kg': 100,       // 100 kg
    'ml': 10000,     // 10 L
    'l': 100,        // 100 L
    'piece': 100,    // 100 pièces
    'boite': 50,     // 50 boîtes
    'sachet': 50,    // 50 sachets
    'bouteille': 50  // 50 bouteilles
  };
  
  const maxQty = maxQuantities[unit?.toLowerCase()];
  if (maxQty && qty > maxQty) {
    return { 
      valid: true, 
      warning: true, 
      message: `Quantité élevée pour l'unité ${unit}` 
    };
  }
  
  return { valid: true, message: '' };
};

/* ============ SUGGESTIONS ET AIDE ============ */

/**
 * Génère des suggestions de conservation basées sur le produit et l'emplacement
 */
export const getStorageSuggestions = (product, location) => {
  const suggestions = [];
  
  if (!product) return suggestions;
  
  // Suggestions basées sur le type de produit et l'emplacement
  const locationSuggestions = {
    'pantry': {
      'fruits': 'Conserver dans un endroit frais et sec, à l\'abri de la lumière',
      'légumes': 'Garder dans un endroit frais et aéré',
      'conserves': 'Vérifier régulièrement l\'état des boîtes',
      'céréales': 'Conserver dans un contenant hermétique'
    },
    'fridge': {
      'fruits': 'Placer dans le bac à légumes',
      'légumes': 'Utiliser le bac à légumes pour une meilleure conservation',
      'viandes': 'Conserver dans la partie la plus froide',
      'produits laitiers': 'Ne pas stocker dans la porte du frigo'
    },
    'freezer': {
      'viandes': 'Emballer hermétiquement pour éviter les brûlures de congélation',
      'légumes': 'Blanchir avant congélation pour une meilleure conservation',
      'fruits': 'Congeler sur une plaque avant de mettre en sac',
      'pain': 'Trancher avant congélation pour faciliter l\'utilisation'
    }
  };
  
  const categoryName = normalize(product.category?.name || '');
  const locationName = normalize(location?.name || 'pantry');
  
  // Chercher des suggestions spécifiques
  if (locationSuggestions[locationName]) {
    for (const [cat, suggestion] of Object.entries(locationSuggestions[locationName])) {
      if (categoryName.includes(cat)) {
        suggestions.push(suggestion);
        break;
      }
    }
  }
  
  // Suggestions générales basées sur la durée de conservation
  if (product.shelf_life_days_pantry && locationName === 'pantry') {
    if (product.shelf_life_days_pantry <= 7) {
      suggestions.push('Ce produit a une durée de conservation courte, surveillez-le régulièrement');
    }
  }
  
  if (product.shelf_life_days_fridge && locationName === 'fridge') {
    if (product.shelf_life_days_fridge <= 3) {
      suggestions.push('À consommer rapidement une fois ouvert');
    }
  }
  
  return suggestions;
};

/**
 * Génère des suggestions de recettes basées sur les produits en stock
 */
export const getRecipeSuggestions = (products) => {
  const suggestions = [];
  const ingredients = products.map(p => normalize(p.productName));
  
  // Recettes simples basées sur les combinaisons d'ingrédients
  const recipes = [
    {
      name: 'Salade composée',
      ingredients: ['tomate', 'salade', 'concombre', 'oignon'],
      match: 3
    },
    {
      name: 'Pâtes à la tomate',
      ingredients: ['pate', 'tomate', 'ail', 'huile'],
      match: 2
    },
    {
      name: 'Omelette aux légumes',
      ingredients: ['oeuf', 'fromage', 'tomate', 'oignon'],
      match: 2
    },
    {
      name: 'Ratatouille',
      ingredients: ['tomate', 'aubergine', 'courgette', 'poivron'],
      match: 3
    },
    {
      name: 'Soupe de légumes',
      ingredients: ['carotte', 'pomme de terre', 'oignon', 'poireau'],
      match: 2
    }
  ];
  
  // Vérifier quelles recettes sont possibles
  recipes.forEach(recipe => {
    let matchCount = 0;
    recipe.ingredients.forEach(ing => {
      if (ingredients.some(i => i.includes(ing))) {
        matchCount++;
      }
    });
    
    if (matchCount >= recipe.match) {
      suggestions.push({
        name: recipe.name,
        matchPercentage: Math.round((matchCount / recipe.ingredients.length) * 100),
        missingIngredients: recipe.ingredients.filter(ing => 
          !ingredients.some(i => i.includes(ing))
        )
      });
    }
  });
  
  return suggestions.sort((a, b) => b.matchPercentage - a.matchPercentage);
};

/* ============ STATISTIQUES ============ */

/**
 * Calcule les statistiques du garde-manger
 */
export const calculatePantryStats = (products) => {
  const stats = {
    totalProducts: products.length,
    totalItems: 0,
    expiringCount: 0,
    expiredCount: 0,
    freshCount: 0,
    categoryCounts: {},
    locationCounts: {},
    estimatedValue: 0
  };
  
  products.forEach(product => {
    // Compter les items
    stats.totalItems += product.totalQuantity || 0;
    
    // Statut d'expiration
    const days = daysUntil(product.nextExpiry);
    if (days !== null && days < 0) {
      stats.expiredCount++;
    } else if (days !== null && days <= 7) {
      stats.expiringCount++;
    } else {
      stats.freshCount++;
    }
    
    // Par catégorie
    const categoryName = product.category?.name || 'Autre';
    stats.categoryCounts[categoryName] = (stats.categoryCounts[categoryName] || 0) + 1;
    
    // Par emplacement (si disponible dans les lots)
    if (product.lots) {
      product.lots.forEach(lot => {
        const locationName = lot.location?.name || 'Non spécifié';
        stats.locationCounts[locationName] = (stats.locationCounts[locationName] || 0) + 1;
      });
    }
  });
  
  // Calculer le pourcentage de produits à risque
  stats.atRiskPercentage = stats.totalProducts > 0 
    ? Math.round(((stats.expiredCount + stats.expiringCount) / stats.totalProducts) * 100)
    : 0;
  
  return stats;
};

/* ============ EXPORT DES FONCTIONS ============ */

export default {
  // Normalisation et matching
  normalize,
  similarity,
  calculateLevenshteinDistance,
  calculateLevenshteinSimilarity,
  fuzzyMatch,
  
  // Icônes et catégories
  getCategoryIcon,
  
  // Formatage
  capitalizeProduct,
  formatQuantity,
  daysUntil,
  formatExpiryDate,
  
  // Groupement et tri
  groupLotsByProduct,
  sortByExpiry,
  
  // Validation
  validateExpiryDate,
  validateQuantity,
  
  // Suggestions et aide
  getStorageSuggestions,
  getRecipeSuggestions,
  
  // Statistiques
  calculatePantryStats
};
