const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPains() {
  // Vérifier les canonical foods pain
  const { data: canonical, error: err1 } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name')
    .or('canonical_name.ilike.%pain%,canonical_name.ilike.%farine%')
    .order('canonical_name');

  if (err1) {
    console.error('Erreur canonical:', err1);
    return;
  }

  console.log('=== CANONICAL FOODS PAIN/FARINE ===');
  canonical.forEach(cf => {
    console.log(`  ${cf.id}: ${cf.canonical_name}`);
  });

  // Vérifier les archetypes pain existants
  const { data: archetypes, error: err2 } = await supabase
    .from('archetypes')
    .select('id, name, parent_archetype_id')
    .or('name.ilike.%pain%,name.ilike.%brioche%,name.ilike.%baguette%')
    .order('name');

  if (err2) {
    console.error('Erreur archetypes:', err2);
    return;
  }

  console.log('\n=== ARCHETYPES PAIN EXISTANTS ===');
  if (archetypes.length === 0) {
    console.log('  Aucun');
  } else {
    archetypes.forEach(a => {
      console.log(`  ${a.id}: ${a.name} (parent_id: ${a.parent_archetype_id || 'NULL'})`);
    });
  }
}

checkPains();
