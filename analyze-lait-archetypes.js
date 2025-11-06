import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n═══════════════════════════════════════════════════════');
console.log('   ANALYSE DÉTAILLÉE DES PRODUITS LAITIERS');
console.log('═══════════════════════════════════════════════════════\n');

async function analyzeProductsLaitiers() {
  const { data: laitCanonical } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name')
    .eq('canonical_name', 'lait')
    .single();

  if (!laitCanonical) {
    console.log('❌ Canonical "lait" non trouvé!');
    return;
  }

  console.log(`📦 Canonical "lait" trouvé (id: ${laitCanonical.id})\n`);

  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('*')
    .eq('canonical_food_id', laitCanonical.id)
    .order('name');

  console.log(`Total archetypes basés sur "lait": ${archetypes.length}\n`);

  const origines = {
    vache: [],
    chevre: [],
    brebis: [],
    mixte_ou_inconnu: []
  };

  archetypes.forEach(a => {
    const name = a.name.toLowerCase();
    let origine = 'mixte_ou_inconnu';
    
    if (name.includes('chèvre') || name.includes('chevre') || name.includes('crottin') ||
        name.includes('bûche') || name.includes('sainte-maure') || name.includes('valençay') ||
        name.includes('rocamadour') || name.includes('pouligny') || name.includes('picodon') ||
        name.includes('pélardon')) {
      origine = 'chevre';
    } else if (name.includes('brebis') || name.includes('roquefort') || name.includes('ossau-iraty') ||
               name.includes('pecorino')) {
      origine = 'brebis';
    } else if (name.includes('comté') || name.includes('emmental') || name.includes('gruyère') ||
               name.includes('cheddar') || name.includes('camembert') || name.includes('brie') ||
               name.includes('reblochon') || name.includes('munster') || name.includes('vacherin') ||
               name.includes('morbier') || name.includes('cantal') || name.includes('beaufort')) {
      origine = 'vache';
    }

    origines[origine].push(a);
  });

  console.log('📊 CLASSIFICATION PAR ORIGINE DU LAIT\n');
  console.log('─'.repeat(80));

  console.log(`\n🐄 VACHE (${origines.vache.length} archetypes)`);
  origines.vache.slice(0, 10).forEach(item => {
    console.log(`  [${item.id}] ${item.name}`);
  });
  if (origines.vache.length > 10) {
    console.log(`  ... et ${origines.vache.length - 10} autres`);
  }

  console.log(`\n🐐 CHÈVRE (${origines.chevre.length} archetypes)`);
  origines.chevre.forEach(item => {
    console.log(`  [${item.id}] ${item.name}`);
  });

  console.log(`\n🐑 BREBIS (${origines.brebis.length} archetypes)`);
  origines.brebis.forEach(item => {
    console.log(`  [${item.id}] ${item.name}`);
  });

  console.log(`\n❓ MIXTE OU INCONNU (${origines.mixte_ou_inconnu.length} archetypes)`);
  origines.mixte_ou_inconnu.slice(0, 15).forEach(item => {
    console.log(`  [${item.id}] ${item.name}`);
  });
  if (origines.mixte_ou_inconnu.length > 15) {
    console.log(`  ... et ${origines.mixte_ou_inconnu.length - 15} autres`);
  }

  const report = {
    date: new Date().toISOString(),
    total: archetypes.length,
    origines: {
      vache: origines.vache.map(a => ({ id: a.id, name: a.name })),
      chevre: origines.chevre.map(a => ({ id: a.id, name: a.name })),
      brebis: origines.brebis.map(a => ({ id: a.id, name: a.name })),
      mixte_ou_inconnu: origines.mixte_ou_inconnu.map(a => ({ id: a.id, name: a.name }))
    }
  };

  fs.writeFileSync('AUDIT_LAIT_ARCHETYPES.json', JSON.stringify(report, null, 2));

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('RECOMMANDATIONS\n');
  console.log(`  - Fromages CHÈVRE (${origines.chevre.length}) → Lier au cultivar "lait de chèvre"`);
  console.log(`  - Fromages BREBIS (${origines.brebis.length}) → Lier au cultivar "lait de brebis"`);
  console.log(`  - Fromages VACHE (${origines.vache.length}) → Créer cultivar "lait de vache" OU garder?`);
  console.log(`  - Produits MIXTES (${origines.mixte_ou_inconnu.length}) → Garder sur "lait" générique?`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('✅ Rapport sauvegardé dans AUDIT_LAIT_ARCHETYPES.json\n');
}

analyzeProductsLaitiers().catch(console.error);
