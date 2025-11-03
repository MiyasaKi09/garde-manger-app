const data = require('./AUDIT_INGREDIENTS_COMPLET.json');

const laitArchetypes = data.archetypes.par_canonical['7001'] || [];
console.log(`=== ${laitArchetypes.length} ARCHETYPES DE LAIT ===\n`);

// Grouper par type
const categories = {
  'fromages': [],
  'cremes': [],
  'yaourts': [],
  'beurres': [],
  'laits': [],
  'autres': []
};

laitArchetypes.forEach(a => {
  const name = a.name.toLowerCase();
  if (name.includes('fromage') || name.includes('emmental') || name.includes('camembert') || name.includes('brie') || name.includes('cheddar') || name.includes('mozzarella') || name.includes('parmesan') || name.includes('gruyère') || name.includes('comté')) {
    categories.fromages.push(a);
  } else if (name.includes('crème') || name.includes('creme')) {
    categories.cremes.push(a);
  } else if (name.includes('yaourt') || name.includes('yogurt')) {
    categories.yaourts.push(a);
  } else if (name.includes('beurre')) {
    categories.beurres.push(a);
  } else if (name.includes('lait')) {
    categories.laits.push(a);
  } else {
    categories.autres.push(a);
  }
});

for (const [categorie, items] of Object.entries(categories)) {
  if (items.length > 0) {
    console.log(`\n📁 ${categorie.toUpperCase()} (${items.length}):`);
    items.slice(0, 20).forEach(a => console.log(`   - ${a.name}`));
    if (items.length > 20) {
      console.log(`   ... et ${items.length - 20} autres`);
    }
  }
}
