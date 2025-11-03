const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPoissons() {
  // Vérifier les canonical foods poisson
  const { data: canonical, error: err1 } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name')
    .or('canonical_name.ilike.%poisson%,canonical_name.ilike.%lotte%,canonical_name.ilike.%sole%,canonical_name.ilike.%cabillaud%,canonical_name.ilike.%morue%')
    .order('canonical_name');

  if (err1) {
    console.error('Erreur canonical:', err1);
    return;
  }

  console.log('=== CANONICAL FOODS POISSON ===');
  canonical.forEach(cf => {
    console.log(`  ${cf.id}: ${cf.canonical_name}`);
  });

  // Vérifier les cultivars
  const { data: cultivars, error: err2 } = await supabase
    .from('cultivars')
    .select('id, cultivar_name, canonical_food_id, canonical_foods(canonical_name)')
    .or('cultivar_name.ilike.%morue%,cultivar_name.ilike.%poisson%');

  if (err2) {
    console.error('Erreur cultivars:', err2);
    return;
  }

  console.log('\n=== CULTIVARS POISSON ===');
  cultivars.forEach(cv => {
    console.log(`  ${cv.id}: ${cv.cultivar_name} (base: ${cv.canonical_foods?.canonical_name})`);
  });

  // Vérifier les archetypes poisson existants
  const { data: archetypes, error: err3 } = await supabase
    .from('archetypes')
    .select('id, name, parent_archetype_id')
    .or('name.ilike.%poisson%,name.ilike.%fumet%')
    .order('name');

  if (err3) {
    console.error('Erreur archetypes:', err3);
    return;
  }

  console.log('\n=== ARCHETYPES POISSON EXISTANTS ===');
  archetypes.forEach(a => {
    console.log(`  ${a.id}: ${a.name} (parent_id: ${a.parent_archetype_id || 'NULL'})`);
  });
}

checkPoissons();
