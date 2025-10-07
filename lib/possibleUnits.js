// Retourne la liste des unités possibles pour un produit selon ses métadonnées (densité, etc.)
export function getPossibleUnitsForProduct(productMeta = {}) {
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
  const hasDensity = !!productMeta.density_g_per_ml;
  // Si le produit a un poids par unité, il peut passer de masse <-> unité
  const hasGramsPerUnit = !!productMeta.grams_per_unit;

  // Toujours possible : unité principale
  const mainUnit = (productMeta.primary_unit || '').toLowerCase();
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
