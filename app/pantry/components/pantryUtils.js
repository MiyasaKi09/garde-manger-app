// app/pantry/components/pantryUtils.js - VERSION NETTOYÉE FINALE
// Utilitaires centralisés pour le garde-manger

/* ============= STYLES GLOBAUX ============= */
export const PantryStyles = {
  glassBase: {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(10px) saturate(120%)',
    WebkitBackdropFilter: 'blur(10px) saturate(120%)',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
    color: 'var(--ink, #1f281f)',
  }
};

/* ============= INTELLIGENCE ARTIFICIELLE ============= */
export const ProductAI = {
  analyzeProductName(productName) {
    const nameLower = productName.toLowerCase();
    
    const productRules = [
      // LÉGUMES
      { pattern: /tomate(?!.*sauce)|salade|épinard|roquette|mâche/, category: 'légumes', unit: 'g', shelfLife: 4, location: 'bac_legumes' },
      { pattern: /carotte|oignon|pomme.*de.*terre|patate|navet/, category: 'légumes', unit: 'g', shelfLife: 14, location: 'bac_legumes' },
      { pattern: /courgette|aubergine|poivron|concombre|brocoli/, category: 'légumes', unit: 'g', shelfLife: 7, location: 'bac_legumes' },
      
      // FRUITS
      { pattern: /pomme(?!.*terre)|poire|kiwi/, category: 'fruits', unit: 'u', shelfLife: 14, location: 'corbeille' },
      { pattern: /banane|avocat/, category: 'fruits', unit: 'u', shelfLife: 7, location: 'corbeille' },
      { pattern: /orange|citron|pamplemousse/, category: 'fruits', unit: 'u', shelfLife: 21, location: 'corbeille' },
      { pattern: /fraise|framboise|myrtille/, category: 'fruits', unit: 'g', shelfLife: 3, location: 'frigo' },
      
      // PRODUITS LAITIERS
      { pattern: /lait(?!.*poudre)|crème.*liquide/, category: 'produits laitiers', unit: 'ml', shelfLife: 7, location: 'frigo' },
      { pattern: /yaourt|fromage.*blanc/, category: 'produits laitiers', unit: 'g', shelfLife: 7, location: 'frigo' },
      { pattern: /beurre|mascarpone|ricotta/, category: 'produits laitiers', unit: 'g', shelfLife: 14, location: 'frigo' },
      { pattern: /fromage|emmental|gruyère/, category: 'produits laitiers', unit: 'g', shelfLife: 21, location: 'frigo' },
      
      // PROTÉINES
      { pattern: /œuf|oeuf/, category: 'protéines animales', unit: 'u', shelfLife: 28, location: 'frigo' },
      { pattern: /viande|bœuf|porc|agneau/, category: 'protéines animales', unit: 'g', shelfLife: 3, location: 'frigo' },
      { pattern: /poisson|saumon|thon|cabillaud/, category: 'protéines animales', unit: 'g', shelfLife: 2, location: 'frigo' },
      { pattern: /jambon|bacon|saucisse/, category: 'charcuterie', unit: 'g', shelfLife: 5, location: 'frigo' },
      
      // ÉPICERIE SÈCHE
      { pattern: /pâtes|spaghetti|riz|quinoa/, category: 'féculents', unit: 'g', shelfLife: 365, location: 'placard' },
      { pattern: /farine|levure/, category: 'épicerie sèche', unit: 'g', shelfLife: 365, location: 'placard' },
      { pattern: /sucre|miel/, category: 'édulcorants', unit: 'g', shelfLife: 365, location: 'placard' },
      { pattern: /huile|olive/, category: 'huiles', unit: 'ml', shelfLife: 365, location: 'placard' },
      { pattern: /sel|poivre/, category: 'condiments', unit: 'g', shelfLife: 1095, location: 'placard' },
      
      // PAIN
      { pattern: /pain|baguette/, category: 'pain', unit: 'u', shelfLife: 2, location: 'huche' },
      { pattern: /croissant|brioche/, category: 'viennoiseries', unit: 'u', shelfLife: 2, location: 'huche' },
      
      // SURGELÉS
      { pattern: /surgelé|congelé/, category: 'surgelés', unit: 'g', shelfLife: 90, location: 'congelateur' }
    ];
    
    for (const rule of productRules) {
      if (rule.pattern.test(nameLower)) {
        return rule;
      }
    }
    
    return { category: '', unit: 'g', shelfLife: 7, location: '' };
  },

  findLocationByType(locations, locationType) {
    const locationPatterns = {
      frigo: /frigo|réfrigérateur|froid/i,
      congelateur: /congé|freezer|surgel/i,
      bac_legumes: /bac.*légume|légume/i,
      corbeille: /corbeille|fruit|plan.*travail/i,
      placard: /placard|épicerie|garde.*manger/i,
      huche: /huche|pain|boulanger/i
    };
    
    const pattern = locationPatterns[locationType];
    if (!pattern) return null;
    
    return locations.find(loc => pattern.test(loc.name));
  },

  suggestExpirationDate(productName, shelfLifeDays = 7) {
    const today = new Date();
    const expiration = new Date(today);
    expiration.setDate(today.getDate() + shelfLifeDays);
    
    return expiration.toISOString().slice(0, 10); // Format YYYY-MM-DD
  },

  calculateShelfLife(productName, category = '', locationName = '') {
    const analysis = this.analyzeProductName(productName);
    let days = analysis.shelfLife || 7;
    
    // Ajustements basés sur le lieu de stockage
    const loc = (locationName || '').toLowerCase();
    if (/congel|surgel/.test(loc)) {
      days = Math.max(days, 90); // Au moins 3 mois pour les surgelés
    } else if (/frigo|frigidaire/.test(loc) && /légume|fruit|laitier/.test(category.toLowerCase())) {
      days = Math.min(days, 14); // Maximum 2 semaines au frigo pour les produits frais
    } else if (/placard|épicerie/.test(loc)) {
      days = Math.min(days, 365); // Maximum 1 an au placard
    }
    
    // Planchers de sécurité
    const isProduce = /(légume|fruit|frais)/i.test(category);
    days = Math.max(days, isProduce ? 2 : 1);
    
    return days;
  }
};

/* ============= UTILITAIRES DE FORMATAGE ============= */
export const formatUtils = {
  /**
   * Capitalise la première lettre d'une chaîne
   */
  capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
  },

  /**
   * Formate une quantité avec son unité
   */
  formatQuantity(qty, unit) {
    const num = Number(qty) || 0;
    const formattedNum = num % 1 === 0 ? num.toString() : num.toFixed(1);
    return `${formattedNum} ${unit || 'u'}`;
  },

  /**
   * Génère un nom d'affichage pour un produit
   */
  displayName(product) {
    if (!product) return 'Produit inconnu';
    
    let name = product.name || 'Sans nom';
    
    if (product.brand) {
      name = `${product.brand} ${name}`;
    }
    
    return name;
  }
};

/* ============= UTILITAIRES DE TRI ============= */
export const sortUtils = {
  /**
   * Trie les lots par urgence (péremption)
   * Note: utilise daysUntil de lib/dates.js au lieu d'une version locale
   */
  byUrgency(lots, dateField = 'best_before') {
    // Import dynamique pour éviter les dépendances circulaires
    return lots.sort((a, b) => {
      const dateA = a[dateField] || a.dlc;
      const dateB = b[dateField] || b.dlc;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;  // Sans date à la fin
      if (!dateB) return -1; // Sans date à la fin
      
      return new Date(dateA) - new Date(dateB);
    });
  },

  /**
   * Trie les produits par nom alphabétique
   */
  byName(products, nameField = 'name') {
    return products.sort((a, b) => {
      const nameA = (a[nameField] || '').toLowerCase();
      const nameB = (b[nameField] || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  },

  /**
   * Trie les lots par quantité
   */
  byQuantity(lots, ascending = false) {
    return lots.sort((a, b) => {
      const qtyA = Number(a.qty) || 0;
      const qtyB = Number(b.qty) || 0;
      return ascending ? qtyA - qtyB : qtyB - qtyA;
    });
  }
};

/* ============= VALIDATION ============= */
export const validation = {
  /**
   * Valide qu'un lot a les champs requis
   */
  validateLot(lot) {
    const errors = [];
    
    if (!lot.product_id) {
      errors.push('Un produit doit être sélectionné');
    }
    
    if (!lot.qty || Number(lot.qty) <= 0) {
      errors.push('La quantité doit être positive');
    }
    
    if (!lot.location_id) {
      errors.push('Un lieu doit être sélectionné');
    }
    
    if (lot.dlc && new Date(lot.dlc) < new Date()) {
      errors.push('La date de péremption ne peut pas être dans le passé');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valide qu'un nom de produit est correct
   */
  validateProductName(name) {
    if (!name || name.trim().length < 2) {
      return {
        isValid: false,
        error: 'Le nom doit contenir au moins 2 caractères'
      };
    }
    
    if (name.length > 100) {
      return {
        isValid: false,
        error: 'Le nom ne peut pas dépasser 100 caractères'
      };
    }
    
    return { isValid: true };
  }
};
