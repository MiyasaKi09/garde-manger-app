// Service pour enrichir les produits avec des métadonnées de conversion
export function enrichProductWithMetadata(productName, unit) {
  if (!productName) return {};
  
  const name = productName.toLowerCase();
  
  // Base de données simplifiée des produits courants
  const productDatabase = {
    // Fruits
    'banane': { grams_per_unit: 120, primary_unit: 'u' },
    'bananes': { grams_per_unit: 120, primary_unit: 'u' },
    'pomme': { grams_per_unit: 150, primary_unit: 'u' },
    'pommes': { grams_per_unit: 150, primary_unit: 'u' },
    'orange': { grams_per_unit: 200, primary_unit: 'u' },
    'oranges': { grams_per_unit: 200, primary_unit: 'u' },
    
    // Légumes
    'tomate': { grams_per_unit: 120, primary_unit: 'u' },
    'tomates': { grams_per_unit: 120, primary_unit: 'u' },
    'oignon': { grams_per_unit: 80, primary_unit: 'u' },
    'oignons': { grams_per_unit: 80, primary_unit: 'u' },
    'carotte': { grams_per_unit: 60, primary_unit: 'u' },
    'carottes': { grams_per_unit: 60, primary_unit: 'u' },
    
    // Liquides
    'lait': { density_g_per_ml: 1.03, primary_unit: 'ml' },
    'eau': { density_g_per_ml: 1.0, primary_unit: 'ml' },
    'huile': { density_g_per_ml: 0.9, primary_unit: 'ml' },
    'jus': { density_g_per_ml: 1.05, primary_unit: 'ml' },
    
    // Œufs
    'oeuf': { grams_per_unit: 60, primary_unit: 'u' },
    'oeufs': { grams_per_unit: 60, primary_unit: 'u' },
    'œuf': { grams_per_unit: 60, primary_unit: 'u' },
    'œufs': { grams_per_unit: 60, primary_unit: 'u' },
  };
  
  // Recherche exacte d'abord
  let metadata = productDatabase[name];
  
  // Si pas trouvé, recherche partielle
  if (!metadata) {
    for (const [key, value] of Object.entries(productDatabase)) {
      if (name.includes(key) || key.includes(name)) {
        metadata = value;
        break;
      }
    }
  }
  
  // Si toujours pas trouvé, essayer de deviner selon l'unité
  if (!metadata) {
    if (unit === 'ml' || unit === 'l') {
      // C'est probablement un liquide
      metadata = { density_g_per_ml: 1.0, primary_unit: 'ml' };
    } else if (unit === 'u' || unit === 'pièce' || unit === 'pcs') {
      // C'est probablement des pièces
      metadata = { grams_per_unit: 100, primary_unit: 'u' }; // Poids moyen
    }
  }
  
  return metadata || {};
}

// Fonction pour enrichir automatiquement un produit
export function enrichProduct(item) {
  const productName = item.product_name || item.canonical_foods?.canonical_name || item.notes;
  const unit = item.unit;
  
  // Récupérer les métadonnées existantes
  const existingMeta = {
    grams_per_unit: item.grams_per_unit || item.canonical_foods?.grams_per_unit,
    density_g_per_ml: item.density_g_per_ml || item.canonical_foods?.density_g_per_ml,
    primary_unit: item.primary_unit || item.canonical_foods?.primary_unit
  };
  
  // Si on a déjà des métadonnées, les garder
  if (existingMeta.grams_per_unit || existingMeta.density_g_per_ml) {
    return {
      ...item,
      ...existingMeta
    };
  }
  
  // Sinon, essayer de les deviner
  const guessedMeta = enrichProductWithMetadata(productName, unit);
  
  return {
    ...item,
    ...guessedMeta
  };
}