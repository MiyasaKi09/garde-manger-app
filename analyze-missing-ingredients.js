require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

// Analyser les 385 ingrédients et les prioriser

const ingredientsNonTrouves = fs.readFileSync('INGREDIENTS_NON_TROUVES.txt', 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`📊 Total ingrédients non trouvés: ${ingredientsNonTrouves.length}\n`);

// Classifier par catégorie
const categories = {
  alcools: [],
  bieres: [],
  viandes: [],
  poissons: [],
  produits_laitiers: [],
  pains: [],
  pates: [],
  epices: [],
  legumes: [],
  fromages: [],
  autres: []
};

ingredientsNonTrouves.forEach(ing => {
  const lower = ing.toLowerCase();

  if (lower.includes('rhum') || lower.includes('calvados') || lower.includes('porto') ||
      lower.includes('kirsch') || lower.includes('amaretto') || lower.includes('marsala') ||
      lower.includes('grand marnier')) {
    categories.alcools.push(ing);
  } else if (lower.includes('bière') || lower.includes('biere') || lower.includes('cidre')) {
    categories.bieres.push(ing);
  } else if (lower.includes('boeuf') || lower.includes('bœuf') || lower.includes('veau') ||
             lower.includes('agneau') || lower.includes('porc') || lower.includes('jambon') ||
             lower.includes('lardon') || lower.includes('saucisse') || lower.includes('bacon')) {
    categories.viandes.push(ing);
  } else if (lower.includes('poisson') || lower.includes('morue') || lower.includes('sole') ||
             lower.includes('lotte') || lower.includes('cabillaud')) {
    categories.poissons.push(ing);
  } else if (lower.includes('crème') || lower.includes('creme') || lower.includes('lait') ||
             lower.includes('yaourt') || lower.includes('fromage') || lower.includes('beurre')) {
    categories.produits_laitiers.push(ing);
  } else if (lower.includes('pain') || lower.includes('baguette') || lower.includes('brioche')) {
    categories.pains.push(ing);
  } else if (lower.includes('pâte') || lower.includes('pate') || lower.includes('nouille') ||
             lower.includes('spaghetti') || lower.includes('linguine') || lower.includes('ravioli')) {
    categories.pates.push(ing);
  } else if (lower.includes('épice') || lower.includes('epice') || lower.includes('paprika') ||
             lower.includes('curry') || lower.includes('garam')) {
    categories.epices.push(ing);
  } else if (lower.includes('légume') || lower.includes('legume') || lower.includes('courgette') ||
             lower.includes('poireau') || lower.includes('blette')) {
    categories.legumes.push(ing);
  } else {
    categories.autres.push(ing);
  }
});

// Afficher par catégorie
Object.entries(categories).forEach(([cat, items]) => {
  if (items.length > 0) {
    console.log(`\n📦 ${cat.toUpperCase().replace('_', ' ')} (${items.length}):`);
    items.forEach(item => console.log(`   - ${item}`));
  }
});

// Sauvegarder
fs.writeFileSync('UNCLASSIFIED_INGREDIENTS.json', JSON.stringify({
  total: ingredientsNonTrouves.length,
  by_category: categories
}, null, 2));

console.log('\n✅ Analyse sauvegardée: UNCLASSIFIED_INGREDIENTS.json');

// Proposer les priorités
console.log('\n═══════════════════════════════════════════════════════');
console.log('   RECOMMANDATION: ORDRE DE PRIORITÉ');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Phase 1 - ESSENTIELS (créer en premier):');
console.log('  1. Alcools (liqueurs, spiritueux) - ', categories.alcools.length);
console.log('  2. Bières et cidres - ', categories.bieres.length);
console.log('  3. Viandes (découpes spécifiques) - ', categories.viandes.length);
console.log('  4. Produits laitiers manquants - ', categories.produits_laitiers.length);
console.log('\nPhase 2 - SECONDAIRES:');
console.log('  5. Poissons - ', categories.poissons.length);
console.log('  6. Pains et pâtes - ', categories.pains.length + categories.pates.length);
console.log('  7. Épices - ', categories.epices.length);
console.log('  8. Légumes - ', categories.legumes.length);
console.log('\nPhase 3 - AUTRES:');
console.log('  9. Divers - ', categories.autres.length);
