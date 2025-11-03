require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeArchetypes() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   ANALYSE DES ARCHETYPES POUR CRÉER LES PARENTS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Charger tous les archetypes et canonical foods
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id, process')
    .order('canonical_food_id, name');

  const { data: canonicals } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name');

  // Index des canonicals
  const canonicalIndex = {};
  canonicals.forEach(c => {
    canonicalIndex[c.id] = c.canonical_name;
  });

  // Grouper par canonical
  const byCanonical = {};
  archetypes.forEach(a => {
    const canonical = canonicalIndex[a.canonical_food_id] || 'INCONNU';
    if (!byCanonical[canonical]) {
      byCanonical[canonical] = [];
    }
    byCanonical[canonical].push(a);
  });

  // Analyser chaque groupe
  const parentsToCreate = [];

  console.log('📊 ANALYSE PAR CANONICAL:\n');

  // Lait
  if (byCanonical['lait']) {
    console.log('🥛 LAIT (' + byCanonical['lait'].length + ' archetypes):');
    byCanonical['lait'].forEach(a => console.log(`   - ${a.name}`));

    // Identifier les patterns
    const laits = byCanonical['lait'].filter(a => a.name.toLowerCase().includes('lait'));
    const cremes = byCanonical['lait'].filter(a => a.name.toLowerCase().includes('crème'));
    const fromages = byCanonical['lait'].filter(a => a.name.toLowerCase().includes('fromage') || ['emmental', 'gruyère', 'comté', 'parmesan', 'mozzarella', 'cheddar', 'roquefort'].some(f => a.name.toLowerCase().includes(f)));
    const yaourts = byCanonical['lait'].filter(a => a.name.toLowerCase().includes('yaourt') || a.name.toLowerCase().includes('yogourt'));
    const beurres = byCanonical['lait'].filter(a => a.name.toLowerCase().includes('beurre'));

    console.log('\n   Patterns détectés:');
    if (laits.length > 1) {
      console.log(`   📌 ${laits.length} types de lait → créer parent "lait"`);
      parentsToCreate.push({
        name: 'lait',
        canonical_id: byCanonical['lait'][0].canonical_food_id,
        children: laits,
        process: 'lait',
        unit: 'ml'
      });
    }
    if (cremes.length > 1) {
      console.log(`   📌 ${cremes.length} types de crème → créer parent "crème"`);
      parentsToCreate.push({
        name: 'crème',
        canonical_id: byCanonical['lait'][0].canonical_food_id,
        children: cremes,
        process: 'crème',
        unit: 'ml'
      });
    }
    if (fromages.length > 1) {
      console.log(`   📌 ${fromages.length} types de fromage → créer parent "fromage"`);
      parentsToCreate.push({
        name: 'fromage',
        canonical_id: byCanonical['lait'][0].canonical_food_id,
        children: fromages,
        process: 'fromage',
        unit: 'g'
      });
    }
    if (yaourts.length > 1) {
      console.log(`   📌 ${yaourts.length} types de yaourt → créer parent "yaourt"`);
      parentsToCreate.push({
        name: 'yaourt',
        canonical_id: byCanonical['lait'][0].canonical_food_id,
        children: yaourts,
        process: 'yaourt',
        unit: 'g'
      });
    }
    if (beurres.length > 1) {
      console.log(`   📌 ${beurres.length} types de beurre → créer parent "beurre"`);
      parentsToCreate.push({
        name: 'beurre',
        canonical_id: byCanonical['lait'][0].canonical_food_id,
        children: beurres,
        process: 'beurre',
        unit: 'g'
      });
    }
    console.log();
  }

  // Bœuf
  if (byCanonical['bœuf']) {
    console.log('🥩 BŒUF (' + byCanonical['bœuf'].length + ' archetypes):');
    byCanonical['bœuf'].forEach(a => console.log(`   - ${a.name}`));
    console.log();
  }

  // Porc
  if (byCanonical['porc']) {
    console.log('🐷 PORC (' + byCanonical['porc'].length + ' archetypes):');
    byCanonical['porc'].forEach(a => console.log(`   - ${a.name}`));

    const jambons = byCanonical['porc'].filter(a => a.name.toLowerCase().includes('jambon'));
    const lardons = byCanonical['porc'].filter(a => a.name.toLowerCase().includes('lardon'));
    const saucisses = byCanonical['porc'].filter(a => a.name.toLowerCase().includes('saucisse'));

    console.log('\n   Patterns détectés:');
    if (jambons.length > 0) {
      console.log(`   📌 ${jambons.length} jambon(s) détecté(s) → besoin parent "jambon"`);
      parentsToCreate.push({
        name: 'jambon',
        canonical_id: byCanonical['porc'][0].canonical_food_id,
        children: jambons,
        process: 'transformation',
        unit: 'g'
      });
    }
    if (lardons.length > 0) {
      console.log(`   📌 ${lardons.length} lardon(s) détecté(s) → besoin parent "lardons"`);
      parentsToCreate.push({
        name: 'lardons',
        canonical_id: byCanonical['porc'][0].canonical_food_id,
        children: lardons,
        process: 'transformation',
        unit: 'g'
      });
    }
    if (saucisses.length > 0) {
      console.log(`   📌 ${saucisses.length} saucisse(s) détectée(s) → besoin parent "saucisse"`);
      parentsToCreate.push({
        name: 'saucisse',
        canonical_id: byCanonical['porc'][0].canonical_food_id,
        children: saucisses,
        process: 'transformation',
        unit: 'g'
      });
    }
    console.log();
  }

  // Blé (farines et pâtes)
  if (byCanonical['blé']) {
    console.log('🌾 BLÉ (' + byCanonical['blé'].length + ' archetypes):');
    byCanonical['blé'].forEach(a => console.log(`   - ${a.name}`));
    console.log();
  }

  // Afficher tous les autres avec plus de 2 archetypes
  Object.entries(byCanonical)
    .filter(([canonical, list]) => !['lait', 'bœuf', 'porc', 'blé'].includes(canonical) && list.length >= 2)
    .forEach(([canonical, list]) => {
      console.log(`📦 ${canonical.toUpperCase()} (${list.length} archetypes):`);
      list.forEach(a => console.log(`   - ${a.name}`));
      console.log();
    });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`   RÉSUMÉ: ${parentsToCreate.length} parents à créer`);
  console.log('═══════════════════════════════════════════════════════\n');

  parentsToCreate.forEach((parent, i) => {
    console.log(`${i + 1}. "${parent.name}" (${parent.children.length} enfants)`);
  });

  // Sauvegarder l'analyse
  fs.writeFileSync('PARENTS_TO_CREATE.json', JSON.stringify(parentsToCreate, null, 2));
  console.log('\n✅ Analyse sauvegardée: PARENTS_TO_CREATE.json');

  return parentsToCreate;
}

analyzeArchetypes().catch(console.error);
