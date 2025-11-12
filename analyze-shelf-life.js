import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n═══════════════════════════════════════════════════════');
console.log('   ANALYSE SHELF_LIFE MANQUANTS');
console.log('═══════════════════════════════════════════════════════\n');

async function analyzeShelfLife() {
  const { data: noShelfLife } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id, cultivar_id, canonical_foods(canonical_name), cultivars(cultivar_name)')
    .is('shelf_life_days_pantry', null)
    .is('shelf_life_days_fridge', null)
    .is('shelf_life_days_freezer', null);

  const categories = {
    viandes: [],
    poissons: [],
    alcools: [],
    fromages: [],
    produits_laitiers: [],
    pains: [],
    pates: [],
    epices: [],
    autres: []
  };

  noShelfLife.forEach(a => {
    const name = a.name.toLowerCase();
    const canonicalName = a.canonical_foods?.canonical_name?.toLowerCase() || '';
    
    if (name.includes('bœuf') || name.includes('boeuf') || name.includes('veau') || name.includes('porc') || 
        name.includes('agneau') || name.includes('poulet') || name.includes('bavette') || name.includes('araignée') ||
        canonicalName.includes('bœuf') || canonicalName.includes('veau') || canonicalName.includes('porc')) {
      categories.viandes.push(a);
    } else if (canonicalName.includes('cabillaud') || canonicalName.includes('sole') || canonicalName.includes('saumon')) {
      categories.poissons.push(a);
    } else if (canonicalName === 'alcool' || name.includes('vin') || name.includes('cognac')) {
      categories.alcools.push(a);
    } else if (name.includes('fromage') || name.includes('bûche') || name.includes('crottin') || name.includes('roquefort')) {
      categories.fromages.push(a);
    } else if (name.includes('beurre') || name.includes('crème') || name.includes('yaourt') || name.includes('lait') ||
               canonicalName === 'lait') {
      categories.produits_laitiers.push(a);
    } else if (name.includes('pain') || name.includes('baguette') || name.includes('brioche')) {
      categories.pains.push(a);
    } else if (name.includes('pâte') || name.includes('pate') || name.includes('spaghetti') || name.includes('nouille')) {
      categories.pates.push(a);
    } else if (name.includes('épice') || name.includes('epice') || name.includes('paprika') || name.includes('berbéré')) {
      categories.epices.push(a);
    } else {
      categories.autres.push(a);
    }
  });

  console.log('📊 CATÉGORIES:\n');
  Object.entries(categories).forEach(([cat, items]) => {
    if (items.length > 0) {
      console.log(`${cat.toUpperCase()}: ${items.length} archetype(s)`);
    }
  });

  console.log('\n');
  
  // Afficher quelques exemples de chaque catégorie
  if (categories.viandes.length > 0) {
    console.log('🥩 VIANDES (exemples):');
    categories.viandes.slice(0, 5).forEach(a => console.log(`  - ${a.name}`));
    console.log();
  }

  if (categories.alcools.length > 0) {
    console.log('🍷 ALCOOLS:');
    categories.alcools.forEach(a => console.log(`  - ${a.name}`));
    console.log();
  }

  if (categories.fromages.length > 0) {
    console.log('🧀 FROMAGES:');
    categories.fromages.slice(0, 8).forEach(a => console.log(`  - ${a.name}`));
    if (categories.fromages.length > 8) console.log(`  ... et ${categories.fromages.length - 8} autres`);
    console.log();
  }

  if (categories.pains.length > 0) {
    console.log('🍞 PAINS:');
    categories.pains.forEach(a => console.log(`  - ${a.name}`));
    console.log();
  }

  fs.writeFileSync('SHELF_LIFE_ANALYSIS.json', JSON.stringify({
    total: noShelfLife.length,
    categories: Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [k, v.map(a => ({
        id: a.id,
        name: a.name,
        canonical: a.canonical_foods?.canonical_name || a.cultivars?.cultivar_name || null
      }))])
    )
  }, null, 2));

  console.log('✅ Analyse sauvegardée dans SHELF_LIFE_ANALYSIS.json\n');
}

analyzeShelfLife().catch(console.error);
