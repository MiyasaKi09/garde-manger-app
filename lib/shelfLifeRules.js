/**
 * Règles de conservation après ouverture des produits
 * @module shelfLifeRules
 */

/**
 * Durée de conservation après ouverture (en jours)
 * Par catégorie de produit et méthode de stockage
 */
export const SHELF_LIFE_AFTER_OPENING = {
  // Produits laitiers
  'Lait': {
    fridge: 3,      // 3 jours au frigo après ouverture
    freezer: 90,    // 3 mois congelé
    pantry: 1       // 1 jour max hors frigo (non recommandé)
  },
  'Laitier': {
    fridge: 3,
    freezer: 30,
    pantry: 1
  },
  'Yaourt': {
    fridge: 5,
    freezer: 60,
    pantry: 1
  },
  'Fromage': {
    fridge: 7,
    freezer: 90,
    pantry: 2
  },
  'Crème': {
    fridge: 3,
    freezer: 60,
    pantry: 1
  },
  'Beurre': {
    fridge: 14,
    freezer: 180,
    pantry: 7
  },

  // Charcuterie et viandes
  'Charcuterie': {
    fridge: 4,
    freezer: 60,
    pantry: 1
  },
  'Jambon': {
    fridge: 3,
    freezer: 60,
    pantry: 1
  },
  'Saucisson': {
    fridge: 7,
    freezer: 90,
    pantry: 3
  },
  'Pâté': {
    fridge: 3,
    freezer: 60,
    pantry: 1
  },
  'Viande cuite': {
    fridge: 3,
    freezer: 90,
    pantry: 1
  },

  // Condiments et sauces
  'Confiture': {
    fridge: 30,
    freezer: 180,
    pantry: 14
  },
  'Miel': {
    fridge: 365,    // Quasi-infini
    freezer: 365,
    pantry: 365
  },
  'Sauce': {
    fridge: 7,
    freezer: 90,
    pantry: 3
  },
  'Mayonnaise': {
    fridge: 7,
    freezer: null,  // Ne se congèle pas bien
    pantry: 1
  },
  'Ketchup': {
    fridge: 30,
    freezer: 90,
    pantry: 14
  },
  'Moutarde': {
    fridge: 60,
    freezer: 90,
    pantry: 30
  },

  // Boissons
  'Jus de fruits': {
    fridge: 5,
    freezer: 90,
    pantry: 2
  },
  'Soda': {
    fridge: 3,
    freezer: null,  // Ne pas congeler (gazeux)
    pantry: 1
  },
  'Vin': {
    fridge: 5,
    freezer: null,
    pantry: 3
  },

  // Huiles et vinaigres
  'Huile': {
    fridge: 90,
    freezer: 365,
    pantry: 60
  },
  'Vinaigre': {
    fridge: 180,
    freezer: 365,
    pantry: 90
  },

  // Pain et pâtisserie
  'Pain': {
    fridge: 3,
    freezer: 30,
    pantry: 2
  },
  'Pâtisserie': {
    fridge: 2,
    freezer: 30,
    pantry: 1
  },
  'Viennoiserie': {
    fridge: 2,
    freezer: 30,
    pantry: 1
  },

  // Conserves et bocaux
  'Conserve': {
    fridge: 3,
    freezer: 90,
    pantry: 2
  },
  'Compote': {
    fridge: 5,
    freezer: 90,
    pantry: 2
  },

  // Fruits et légumes
  'Salade': {
    fridge: 2,
    freezer: null,  // Ne se congèle pas bien
    pantry: 1
  },
  'Légumes cuits': {
    fridge: 3,
    freezer: 90,
    pantry: 1
  },

  // Valeur par défaut pour produits non catégorisés
  '_default': {
    fridge: 7,
    freezer: 90,
    pantry: 3
  }
};

/**
 * Calcule la nouvelle date de péremption après ouverture
 * @param {string} category - Catégorie du produit
 * @param {string} storageMethod - Méthode de stockage ('fridge', 'freezer', 'pantry')
 * @param {Date} openedAt - Date d'ouverture (par défaut: maintenant)
 * @param {Date} originalDLC - DLC originale du produit
 * @returns {Date|null} Nouvelle DLC ou null si non applicable
 */
export function calculateAdjustedExpiration(category, storageMethod, openedAt = new Date(), originalDLC = null) {
  // Récupérer les règles pour cette catégorie
  const rules = SHELF_LIFE_AFTER_OPENING[category] || SHELF_LIFE_AFTER_OPENING['_default'];
  const daysToAdd = rules[storageMethod] || rules.fridge;

  // Si null (produit ne se conserve pas avec cette méthode)
  if (daysToAdd === null) {
    return null;
  }

  // Calculer nouvelle date
  const adjustedDate = new Date(openedAt);
  adjustedDate.setDate(adjustedDate.getDate() + daysToAdd);

  // Ne jamais dépasser la DLC originale
  if (originalDLC) {
    const originalDate = new Date(originalDLC);
    if (adjustedDate > originalDate) {
      return originalDate;
    }
  }

  return adjustedDate;
}

/**
 * Infère la catégorie d'un produit depuis son nom ou sa catégorie canonique
 * @param {string} productName - Nom du produit
 * @param {string} canonicalCategory - Catégorie depuis canonical_foods (optionnel)
 * @returns {string} Catégorie détectée
 */
export function inferCategory(productName, canonicalCategory = null) {
  // Si catégorie canonique fournie et existe dans nos règles
  if (canonicalCategory && SHELF_LIFE_AFTER_OPENING[canonicalCategory]) {
    return canonicalCategory;
  }

  // Inférence basée sur le nom du produit
  const lower = productName.toLowerCase();

  // Produits laitiers
  if (lower.includes('lait') && !lower.includes('coco')) return 'Lait';
  if (lower.includes('yaourt') || lower.includes('yogurt') || lower.includes('yoghourt')) return 'Yaourt';
  if (lower.includes('fromage')) return 'Fromage';
  if (lower.includes('crème') || lower.includes('creme')) return 'Crème';
  if (lower.includes('beurre')) return 'Beurre';

  // Charcuterie
  if (lower.includes('jambon')) return 'Jambon';
  if (lower.includes('saucisson') || lower.includes('salami')) return 'Saucisson';
  if (lower.includes('pâté') || lower.includes('pate') || lower.includes('terrine')) return 'Pâté';

  // Condiments
  if (lower.includes('confiture') || lower.includes('gelée')) return 'Confiture';
  if (lower.includes('miel')) return 'Miel';
  if (lower.includes('mayonnaise') || lower.includes('mayo')) return 'Mayonnaise';
  if (lower.includes('ketchup')) return 'Ketchup';
  if (lower.includes('moutarde')) return 'Moutarde';

  // Boissons
  if (lower.includes('jus')) return 'Jus de fruits';
  if (lower.includes('soda') || lower.includes('cola') || lower.includes('limonade')) return 'Soda';
  if (lower.includes('vin')) return 'Vin';

  // Huiles
  if (lower.includes('huile')) return 'Huile';
  if (lower.includes('vinaigre')) return 'Vinaigre';

  // Pain
  if (lower.includes('pain') || lower.includes('baguette')) return 'Pain';
  if (lower.includes('croissant') || lower.includes('pain au') || lower.includes('brioche')) return 'Viennoiserie';

  // Conserves
  if (lower.includes('conserve') || lower.includes('bocal')) return 'Conserve';
  if (lower.includes('compote')) return 'Compote';

  // Sauce
  if (lower.includes('sauce')) return 'Sauce';

  // Salade
  if (lower.includes('salade') || lower.includes('laitue')) return 'Salade';

  // Par défaut
  return '_default';
}

/**
 * Obtient un message descriptif pour l'utilisateur
 * @param {string} category - Catégorie du produit
 * @param {string} storageMethod - Méthode de stockage
 * @param {number} daysLeft - Jours restants
 * @returns {string} Message formaté
 */
export function getShelfLifeMessage(category, storageMethod, daysLeft) {
  if (daysLeft <= 0) {
    return '⚠️ Produit périmé, à jeter';
  }
  
  if (daysLeft === 1) {
    return '🔥 À consommer aujourd\'hui';
  }

  if (daysLeft <= 3) {
    return `⏰ ${daysLeft} jours restants, à consommer rapidement`;
  }

  if (daysLeft <= 7) {
    return `✓ ${daysLeft} jours restants`;
  }

  return `✓ Bon état (${daysLeft} jours)`;
}

/**
 * Règles de conservation pour plats cuisinés maison
 */
export const COOKED_DISH_SHELF_LIFE = {
  'fridge': 3,      // Plat au frigo : 3 jours
  'freezer': 90,    // Plat congelé : 3 mois
  'counter': 1      // Température ambiante : 1 jour (non recommandé)
};

/**
 * Calcule la DLC d'un plat cuisiné
 * @param {Date} cookedAt - Date de cuisson
 * @param {string} storageMethod - Méthode de stockage
 * @returns {Date} Date de péremption
 */
export function calculateCookedDishExpiration(cookedAt = new Date(), storageMethod = 'fridge') {
  const days = COOKED_DISH_SHELF_LIFE[storageMethod] || COOKED_DISH_SHELF_LIFE.fridge;
  const expirationDate = new Date(cookedAt);
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
}

export default {
  SHELF_LIFE_AFTER_OPENING,
  COOKED_DISH_SHELF_LIFE,
  calculateAdjustedExpiration,
  calculateCookedDishExpiration,
  inferCategory,
  getShelfLifeMessage
};
