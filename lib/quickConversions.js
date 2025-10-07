// Fonction pour obtenir les conversions rapides possibles pour un lot
export function getQuickConversions(qty, currentUnit, productMeta = {}) {
  
  // Données de test pour certains produits courants
  const testData = {
    'banane': { grams_per_unit: 120 },
    'pomme': { grams_per_unit: 150 },
    'orange': { grams_per_unit: 200 },
    'carotte': { grams_per_unit: 80 },
    'lait': { density_g_per_ml: 1.03 },
    'eau': { density_g_per_ml: 1.0 },
    'huile': { density_g_per_ml: 0.9 }
  };
  
  // Enrichir les métadonnées avec les données de test si le produit correspond
  const enrichedMeta = { ...productMeta };
  if (productMeta.productName) {
    const productName = productMeta.productName.toLowerCase();
    for (const [name, data] of Object.entries(testData)) {
      if (productName.includes(name)) {
        Object.assign(enrichedMeta, data);
        break;
      }
    }
  }
  
  const conversions = [];
  const density = Number(enrichedMeta.density_g_per_ml ?? 1.0);
  const gramsPerUnit = Number(enrichedMeta.grams_per_unit ?? 0);
  
  // Debug logging
  console.log('getQuickConversions:', {
    qty,
    currentUnit,
    productMeta,
    enrichedMeta,
    density,
    gramsPerUnit
  });
  
  // Normaliser l'unité actuelle
  const unit = currentUnit?.toLowerCase();
  
  // Si c'est en pièces et qu'on a le poids par unité
  if ((unit === 'u' || unit === 'pièce' || unit === 'pièces' || unit === 'unités') && gramsPerUnit > 0) {
    const totalGrams = qty * gramsPerUnit;
    
    if (totalGrams >= 1000) {
      conversions.push({
        unit: 'kg',
        qty: Math.round(totalGrams / 1000 * 100) / 100,
        label: `${Math.round(totalGrams / 1000 * 100) / 100} kg`
      });
    }
    
    conversions.push({
      unit: 'g',
      qty: Math.round(totalGrams),
      label: `${Math.round(totalGrams)} g`
    });
  }
  
  // Si c'est en grammes et qu'on a le poids par unité
  if (unit === 'g' && gramsPerUnit > 0) {
    const pieces = Math.round(qty / gramsPerUnit * 10) / 10;
    if (pieces >= 0.1) {
      conversions.push({
        unit: 'u',
        qty: pieces,
        label: pieces === 1 ? '1 pièce' : `${pieces} pièces`
      });
    }
    
    if (qty >= 1000) {
      conversions.push({
        unit: 'kg',
        qty: Math.round(qty / 1000 * 100) / 100,
        label: `${Math.round(qty / 1000 * 100) / 100} kg`
      });
    }
  }
  
  // Si c'est en kg
  if (unit === 'kg') {
    const grams = qty * 1000;
    conversions.push({
      unit: 'g',
      qty: Math.round(grams),
      label: `${Math.round(grams)} g`
    });
    
    if (gramsPerUnit > 0) {
      const pieces = Math.round(grams / gramsPerUnit * 10) / 10;
      if (pieces >= 0.1) {
        conversions.push({
          unit: 'u',
          qty: pieces,
          label: pieces === 1 ? '1 pièce' : `${pieces} pièces`
        });
      }
    }
  }
  
  // Si c'est en volume et qu'on a la densité
  if ((unit === 'ml' || unit === 'cl' || unit === 'l') && density > 0) {
    let mlQty = qty;
    if (unit === 'cl') mlQty = qty * 10;
    if (unit === 'l') mlQty = qty * 1000;
    
    const grams = Math.round(mlQty * density);
    
    if (grams >= 1000) {
      conversions.push({
        unit: 'kg',
        qty: Math.round(grams / 1000 * 100) / 100,
        label: `${Math.round(grams / 1000 * 100) / 100} kg`
      });
    }
    
    conversions.push({
      unit: 'g',
      qty: grams,
      label: `${grams} g`
    });
  }
  
  // Si c'est en masse et qu'on a la densité, proposer du volume
  if ((unit === 'g' || unit === 'kg') && density > 0) {
    let grams = qty;
    if (unit === 'kg') grams = qty * 1000;
    
    const ml = Math.round(grams / density);
    
    if (ml >= 1000) {
      conversions.push({
        unit: 'l',
        qty: Math.round(ml / 1000 * 100) / 100,
        label: `${Math.round(ml / 1000 * 100) / 100} L`
      });
    } else if (ml >= 10) {
      conversions.push({
        unit: 'cl',
        qty: Math.round(ml / 10),
        label: `${Math.round(ml / 10)} cl`
      });
    } else {
      conversions.push({
        unit: 'ml',
        qty: ml,
        label: `${ml} ml`
      });
    }
  }
  
  return conversions;
}