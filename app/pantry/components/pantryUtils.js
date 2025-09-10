// app/pantry/components/pantryUtils.js
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

/* ============= HELPERS DE DATE ============= */
export const DateHelpers = {
  daysUntil(date) {
    if (!date) return null;
    const today = new Date(); 
    today.setHours(0,0,0,0);
    const d = new Date(date); 
    d.setHours(0,0,0,0);
    return Math.round((d - today) / 86400000);
  },

  fmtDate(d) {
    if (!d) return '—';
    try {
      const x = new Date(d);
      return x.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
    } catch { 
      return d; 
    }
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
      huche: /huche|pain/i
    };
    
    const pattern = locationPatterns[locationType];
    if (!pattern) return null;
    
    return locations.find(loc => pattern.test(loc.name)) || null;
  }
};

/* ============= RECHERCHE FLOUE ============= */
export const ProductSearch = {
  fuzzyScore(needle, haystack) {
    if (!needle || !haystack) return 0;
    
    const n = needle.toLowerCase();
    const h = haystack.toLowerCase();
    
    if (h === n) return 1000;
    if (h.includes(n)) return 800;
    
    const needleWords = n.split(/\s+/);
    const haystackWords = h.split(/\s+/);
    
    let score = 0;
    let matchedWords = 0;
    
    for (const nWord of needleWords) {
      let bestWordScore = 0;
      for (const hWord of haystackWords) {
        if (hWord === nWord) bestWordScore = Math.max(bestWordScore, 100);
        else if (hWord.includes(nWord)) bestWordScore = Math.max(bestWordScore, 80);
        else if (nWord.includes(hWord)) bestWordScore = Math.max(bestWordScore, 60);
        else {
          const dist = this.levenshteinDistance(nWord, hWord);
          const maxLen = Math.max(nWord.length, hWord.length);
          if (dist <= maxLen * 0.3) bestWordScore = Math.max(bestWordScore, 40);
        }
      }
      score += bestWordScore;
      if (bestWordScore > 50) matchedWords++;
    }
    
    if (matchedWords === needleWords.length && needleWords.length > 1) {
      score *= 1.5;
    }
    
    return score;
  },

  levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
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
    
    return matrix[b.length][a.length];
  }
};
