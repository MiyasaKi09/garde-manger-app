import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n═══════════════════════════════════════════════════════');
console.log('   ANALYSE DES 31 ARCHETYPES RESTANTS SANS SHELF_LIFE');
console.log('═══════════════════════════════════════════════════════\n');

async function analyzeRemaining() {
  const { data: remaining } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id, cultivar_id, canonical_foods(canonical_name), cultivars(cultivar_name, canonical_foods(canonical_name))')
    .is('shelf_life_days_pantry', null)
    .is('shelf_life_days_fridge', null)
    .is('shelf_life_days_freezer', null);

  console.log(`📊 Total restant: ${remaining.length} archetypes\n`);

  // Grouper par canonical_food
  const byCanonical = {};
  const byCultivar = {};
  const orphans = [];

  remaining.forEach(a => {
    if (a.canonical_foods) {
      const canonical = a.canonical_foods.canonical_name;
      if (!byCanonical[canonical]) byCanonical[canonical] = [];
      byCanonical[canonical].push(a);
    } else if (a.cultivars) {
      const cultivar = a.cultivars.cultivar_name;
      if (!byCultivar[cultivar]) byCultivar[cultivar] = [];
      byCultivar[cultivar].push(a);
    } else {
      orphans.push(a);
    }
  });

  console.log('📦 PAR CANONICAL_FOOD:\n');
  Object.entries(byCanonical).sort((a, b) => b[1].length - a[1].length).forEach(([canonical, items]) => {
    console.log(`\n${canonical.toUpperCase()} (${items.length}):`);
    items.forEach(a => console.log(`  [${a.id}] ${a.name}`));
  });

  if (Object.keys(byCultivar).length > 0) {
    console.log('\n\n📦 PAR CULTIVAR:\n');
    Object.entries(byCultivar).forEach(([cultivar, items]) => {
      console.log(`\n${cultivar.toUpperCase()} (${items.length}):`);
      items.forEach(a => console.log(`  [${a.id}] ${a.name}`));
    });
  }

  if (orphans.length > 0) {
    console.log('\n\n⚠️ ORPHELINS (ni canonical ni cultivar):\n');
    orphans.forEach(a => console.log(`  [${a.id}] ${a.name}`));
  }

  fs.writeFileSync('REMAINING_SHELF_LIFE.json', JSON.stringify({
    total: remaining.length,
    byCanonical,
    byCultivar,
    orphans,
    details: remaining.map(a => ({
      id: a.id,
      name: a.name,
      canonical: a.canonical_foods?.canonical_name || null,
      cultivar: a.cultivars?.cultivar_name || null,
      cultivar_canonical: a.cultivars?.canonical_foods?.canonical_name || null
    }))
  }, null, 2));

  console.log('\n\n✅ Analyse sauvegardée dans REMAINING_SHELF_LIFE.json\n');
}

analyzeRemaining().catch(console.error);
