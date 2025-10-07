// Retourne la liste des unités possibles pour un produit selon ses métadonnées (densité, etc.)
export function getPossibleUnitsForProduct(productMeta = {}) {
  
  // Données de test pour certains produits courants
  const testData = {
    'banane': { grams_per_unit: 120, primary_unit: 'u' },
    'pomme': { grams_per_unit: 150, primary_unit: 'u' },
    'orange': { grams_per_unit: 200, primary_unit: 'u' },
    'carotte': { grams_per_unit: 80, primary_unit: 'u' },
    'lait': { density_g_per_ml: 1.03, primary_unit: 'ml' },
    'eau': { density_g_per_ml: 1.0, primary_unit: 'ml' },
    'huile': { density_g_per_ml: 0.9, primary_unit: 'ml' }
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
  
  // Par défaut, toutes les unités de base
  const allUnits = [
    { value: 'g', label: 'Grammes' },
    { value: 'kg', label: 'Kilogrammes' },
    { value: 'ml', label: 'Millilitres' },
    { value: 'cl', label: 'Centilitres' },
    { value: 'l', label: 'Litres' },
    { value: 'u', label: 'Pièce(s)' }
  ];

  // Si le produit a une densité, il peut passer de vol <-> masse
  const hasDensity = !!enrichedMeta.density_g_per_ml;
  // Si le produit a un poids par unité, il peut passer de masse <-> unité
  const hasGramsPerUnit = !!enrichedMeta.grams_per_unit;

  // Toujours possible : unité principale
  const mainUnit = (enrichedMeta.primary_unit || '').toLowerCase();
  let possible = [];

  if (mainUnit === 'g' || mainUnit === 'kg') {
    possible.push('g', 'kg');
    if (hasDensity) possible.push('ml', 'cl', 'l');
    if (hasGramsPerUnit) possible.push('u');
  } else if (mainUnit === 'ml' || mainUnit === 'cl' || mainUnit === 'l') {
    possible.push('ml', 'cl', 'l');
    if (hasDensity) possible.push('g', 'kg');
    if (hasGramsPerUnit) possible.push('u');
  } else if (mainUnit === 'u' || mainUnit === 'unités' || mainUnit === 'pièce') {
    possible.push('u');
    if (hasGramsPerUnit) possible.push('g', 'kg');
    if (hasDensity) possible.push('ml', 'cl', 'l');
  } else {
    // Fallback : tout
    possible = allUnits.map(u => u.value);
  }

  // Unicité et formatage
  possible = [...new Set(possible)];
  return allUnits.filter(u => possible.includes(u.value));
}
