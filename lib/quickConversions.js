// Fonction pour obtenir les conversions rapides possibles pour un lot
export function getQuickConversions(qty, currentUnit, productMeta = {}) {
  
  // Utiliser les métadonnées directement depuis la base de données
  const enrichedMeta = { ...productMeta };
  
  console.log('Conversion pour:', {
    productName: productMeta.productName,
    qty,
    currentUnit,
    density: productMeta.density_g_per_ml,
    gramsPerUnit: productMeta.grams_per_unit
  });
  
  const conversions = [];
  const density = Number(enrichedMeta.density_g_per_ml) || 0;
  const gramsPerUnit = Number(enrichedMeta.grams_per_unit) || 0;
  
  // Déterminer le type de produit selon les métadonnées disponibles
  const isCountable = gramsPerUnit > 0; // Fruits, légumes, objets unitaires
  const isLiquidOrBulk = density > 0;   // Liquides, granulés, poudres
  
  // Si aucune métadonnée, pas de conversion possible
  if (!isCountable && !isLiquidOrBulk) {
    console.log('Pas de métadonnées disponibles pour les conversions');
    return [];
  }
  
  // Normaliser l'unité actuelle
  const unit = currentUnit?.toLowerCase();
  
  // Helper pour choisir la meilleure unité de poids
  function getBestWeightUnit(grams) {
    if (grams >= 1000) {
      return { unit: 'kg', qty: Math.round(grams / 1000 * 100) / 100, label: `${Math.round(grams / 1000 * 100) / 100} kg` };
    } else {
      return { unit: 'g', qty: Math.round(grams), label: `${Math.round(grams)} g` };
    }
  }
  
  // Helper pour choisir la meilleure unité de volume
  function getBestVolumeUnit(ml) {
    if (ml >= 1000) {
      return { unit: 'L', qty: Math.round(ml / 1000 * 100) / 100, label: `${Math.round(ml / 1000 * 100) / 100} L` };
    } else if (ml >= 100) {
      return { unit: 'cL', qty: Math.round(ml / 10), label: `${Math.round(ml / 10)} cL` };
    } else {
      return { unit: 'mL', qty: Math.round(ml), label: `${Math.round(ml)} mL` };
    }
  }
  
  // PRODUITS COMPTABLES (fruits, légumes, objets unitaires)
  if (isCountable) {
    
    // Depuis unités vers poids
    if (unit === 'u' || unit === 'pièce' || unit === 'pièces' || unit === 'unités') {
      const totalGrams = qty * gramsPerUnit;
      const bestWeight = getBestWeightUnit(totalGrams);
      conversions.push(bestWeight);
    }
    
    // Depuis grammes vers unités + kg si nécessaire
    if (unit === 'g') {
      const pieces = Math.round(qty / gramsPerUnit * 10) / 10;
      if (pieces >= 0.1) {
        conversions.push({
          unit: 'u',
          qty: pieces,
          label: pieces === 1 ? '1 pièce' : `${pieces} pièces`
        });
      }
      
      // Proposer kg si > 1000g
      if (qty >= 1000) {
        conversions.push({
          unit: 'kg',
          qty: Math.round(qty / 1000 * 100) / 100,
          label: `${Math.round(qty / 1000 * 100) / 100} kg`
        });
      }
    }
    
    // Depuis kg vers unités + grammes si nécessaire
    if (unit === 'kg') {
      const grams = qty * 1000;
      
      // Proposer grammes si < 1 kg
      if (qty < 1) {
        conversions.push({
          unit: 'g',
          qty: Math.round(grams),
          label: `${Math.round(grams)} g`
        });
      }
      
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
  
  // PRODUITS LIQUIDES/GRANULÉS (riz, liquides, poudres)
  if (isLiquidOrBulk && !isCountable) {
    
    // Depuis volume vers poids + autres volumes
    if (unit === 'ml' || unit === 'cl' || unit === 'l') {
      let mlQty = qty;
      if (unit === 'cl') mlQty = qty * 10;
      if (unit === 'l') mlQty = qty * 1000;
      
      const grams = Math.round(mlQty * density);
      const bestWeight = getBestWeightUnit(grams);
      conversions.push(bestWeight);
      
      // Proposer d'autres unités de volume seulement si très différentes
      if (unit === 'ml' && mlQty >= 1000) {
        conversions.push({
          unit: 'L',
          qty: Math.round(mlQty / 1000 * 100) / 100,
          label: `${Math.round(mlQty / 1000 * 100) / 100} L`
        });
      } else if (unit === 'l' && mlQty < 1) {
        conversions.push({
          unit: 'mL',
          qty: Math.round(mlQty * 1000),
          label: `${Math.round(mlQty * 1000)} mL`
        });
      }
    }
    
    // Depuis poids vers volume + autre poids
    if (unit === 'g' || unit === 'kg') {
      let grams = qty;
      if (unit === 'kg') grams = qty * 1000;
      
      const ml = Math.round(grams / density);
      const bestVolume = getBestVolumeUnit(ml);
      conversions.push(bestVolume);
      
      // Proposer l'autre unité de poids si approprié
      if (unit === 'g' && grams >= 1000) {
        conversions.push({
          unit: 'kg',
          qty: Math.round(grams / 1000 * 100) / 100,
          label: `${Math.round(grams / 1000 * 100) / 100} kg`
        });
      } else if (unit === 'kg' && grams < 1000) {
        conversions.push({
          unit: 'g',
          qty: Math.round(grams),
          label: `${Math.round(grams)} g`
        });
      }
    }
  }
  
  return conversions;
}